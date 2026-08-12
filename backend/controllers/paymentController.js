/**
 * paymentController.js
 *
 *   POST /api/payments/initiate      — push USSD prompt to customer phone
 *   POST /api/payments/verify        — poll provider + trigger full approval pipeline
 *   POST /api/payments/momo/webhook  — provider push callback (MTN / Airtel)
 *   GET  /api/payments               — list payments
 *   GET  /api/payments/booking/:id   — payment by bookingId
 *   GET  /api/payments/:id           — single payment record
 *   GET  /api/payments/:id/invoice   — invoice for a payment
 */

const Booking      = require('../models/Booking');
const Payment      = require('../models/Payment');
const Invoice      = require('../models/Invoice');
const Notification = require('../models/Notification');

const { logActivity }          = require('../utils/activityLogger');
const { initiatePayment, checkPaymentStatus, normaliseStatus } = require('../utils/momoGateway');
const { runApprovalPipeline }  = require('../utils/bookingLifecycle');

const MERCHANT_MTN    = process.env.MTN_MOMO_NUMBER    || '+250794890144';
const MERCHANT_AIRTEL = process.env.AIRTEL_MONEY_NUMBER || '+250794890144';

// ─── POST /api/payments/initiate ─────────────────────────────────────────────

exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId, provider, phoneNumber } = req.body;

    if (!['mtn', 'airtel'].includes(provider)) {
      return res.status(400).json({ success: false, message: 'provider must be "mtn" or "airtel"' });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.paymentStatus === 'verified') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    const msisdn = (phoneNumber || booking.bookerPhone || '').trim();
    if (!msisdn) return res.status(400).json({ success: false, message: 'phoneNumber is required' });

    const usdToRwf  = Number(process.env.USD_TO_RWF_RATE) || 1300;
    const amountRwf = Math.round(booking.price * usdToRwf);
    const currency  = 'RWF';

    console.log(`\n💳 Initiating ${provider.toUpperCase()} | ${bookingId} | ${currency} ${amountRwf} → ${msisdn}`);

    const result = await initiatePayment({
      provider,
      amount:     amountRwf,
      msisdn,
      externalId: booking.billingNumber || booking.bookingId,
      note:       `EternaRest — ${booking.deceasedName}`,
    });
    // Upsert Payment record with provider details
    const payment = await Payment.findOneAndUpdate(
      { bookingId },
      {
        bookingId,
        billingNumber:        booking.billingNumber,
        packageName:          booking.packageType,
        amount:               amountRwf,
        currency,
        method:               provider,
        paymentMethod:        provider,
        phoneNumber:          msisdn,
        transactionId:        result.transactionId,
        transactionReference: result.referenceId,
        status:               'pending',
        notes:                `Initiated via ${provider.toUpperCase()}`,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // Mark booking paymentStatus → pending
    await Booking.findOneAndUpdate({ bookingId }, { paymentStatus: 'pending' });

    await logActivity(
      booking.bookerName, 'customer', 'payment_initiated', 'payment',
      payment.paymentId || payment._id.toString(),
      { provider, amount: amountRwf, msisdn },
    );

    res.status(200).json({
      success:        true,
      message:        `Payment request sent to ${msisdn}. Please approve on your phone.`,
      referenceId:    result.referenceId,
      transactionId:  result.transactionId,
      provider,
      amount:         amountRwf,
      currency,
      merchantNumber: provider === 'airtel' ? MERCHANT_AIRTEL : MERCHANT_MTN,
      payment,
    });
  } catch (err) {
    console.error('❌ Payment initiation error:', err);
    // Map common MTN errors to friendly messages
    const msg = err.message || '';
    let userMessage = 'Payment initiation failed. Please try again.';
    if (msg.includes('400'))  userMessage = 'Payment request rejected. Check your phone number and try again.';
    if (msg.includes('401'))  userMessage = 'Payment service authentication failed. Please contact support.';
    if (msg.includes('insufficient') || msg.includes('low')) userMessage = 'Insufficient balance on your mobile money account.';
    if (msg.includes('credentials')) userMessage = 'Payment service not configured. Please contact support.';
    res.status(500).json({ success: false, message: userMessage, detail: msg });
  }
};

// ─── POST /api/payments/verify ────────────────────────────────────────────────

exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId, referenceId, provider: providerOverride } = req.body;

    if (!bookingId && !referenceId) {
      return res.status(400).json({ success: false, message: 'bookingId or referenceId is required' });
    }

    // Load payment record
    const filter = bookingId
      ? { bookingId }
      : { $or: [{ transactionReference: referenceId }, { transactionId: referenceId }] };
    const payment = await Payment.findOne(filter).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Already verified — idempotent
    if (payment.status === 'verified' || payment.status === 'completed') {
      const invoice = await Invoice.findOne({ bookingId: payment.bookingId });
      return res.status(200).json({
        success: true, message: 'Already verified', status: 'SUCCESSFUL',
        payment, invoice, alreadyVerified: true,
      });
    }

    const provider = providerOverride || payment.method || 'mtn';
    const refId    = payment.transactionReference || payment.transactionId;

    console.log(`\n🔍 Verifying ${provider.toUpperCase()} | ref: ${refId}`);

    // Poll provider
    const statusResult = await checkPaymentStatus(provider, refId);
    const normalised   = statusResult.normalisedStatus;

    // ── PENDING ───────────────────────────────────────────────────────────────
    if (normalised === 'PENDING') {
      return res.status(202).json({
        success: false,
        message: 'Payment still pending — ask the customer to approve the USSD prompt.',
        status:  'PENDING',
        payment,
      });
    }
    // ── FAILED ────────────────────────────────────────────────────────────────
    if (normalised === 'FAILED') {
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'failed',
        notes:  statusResult.reason || 'Declined by provider',
      });
      await Booking.findOneAndUpdate({ bookingId: payment.bookingId }, { paymentStatus: 'rejected' });
      return res.status(200).json({
        success: false,
        message: statusResult.reason || 'Payment was declined or failed.',
        status:  'FAILED',
        reason:  statusResult.reason || 'Payment declined by provider.',
        payment,
      });
    }

    // ── SUCCESSFUL — run the full approval pipeline ───────────────────────────
    const booking = await Booking.findOne({ bookingId: payment.bookingId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const result = await runApprovalPipeline(booking, payment, {
      triggeredBy:   'payment-verify',
      transactionId: statusResult.raw?.financialTransactionId || refId,
      provider,
      req,
    });

    res.status(200).json({
      success:  true,
      message:  'Payment confirmed. Booking approved, memorial created.',
      status:   'SUCCESSFUL',
      payment:  result.payment,
      invoice:  result.invoice,
      memorial: { id: result.memorial._id, memorialId: result.memorial.memorialId },
      booking: {
        bookingId:     result.booking.bookingId,
        status:        result.booking.status,
        paymentStatus: result.booking.paymentStatus,
      },
    });
  } catch (err) {
    console.error('❌ Payment verification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/payments/momo/webhook ─────────────────────────────────────────
// Always returns 200 — providers must not retry on server errors.

exports.momoWebhook = async (req, res) => {
  // Acknowledge immediately so provider doesn't time out
  res.status(200).json({ success: true, message: 'Webhook received' });

  try {
    console.log('\n📩 MoMo Webhook:', JSON.stringify(req.body));

    const body         = req.body;
    const referenceId  = body.referenceId    || body.transaction?.id;
    const rawStatus    = body.status         || body.transaction?.status;
    const provider     = body.referenceId ? 'mtn' : 'airtel';
    const financialTxn = body.financialTransactionId || body.transaction?.id;

    if (!referenceId || !rawStatus) return;

    const normalised = normaliseStatus(provider, rawStatus);

    const payment = await Payment.findOne({
      $or: [{ transactionReference: referenceId }, { transactionId: referenceId }],
    });

    if (!payment) {
      console.warn('⚠️  Webhook: no payment found for ref', referenceId);
      return;
    }

    // Idempotency guard
    if (payment.status === 'verified' || payment.status === 'completed') return;

    if (normalised === 'SUCCESSFUL') {
      const booking = await Booking.findOne({ bookingId: payment.bookingId });
      if (!booking) return;

      await runApprovalPipeline(booking, payment, {
        triggeredBy:   'webhook',
        transactionId: financialTxn || referenceId,
        provider,
      });
    } else if (normalised === 'FAILED') {
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'failed',
        notes:  body.reason || body.transaction?.message || 'Webhook: payment failed',
      });
      await Booking.findOneAndUpdate(
        { bookingId: payment.bookingId },
        { paymentStatus: 'rejected' },
      );
    }
  } catch (err) {
    console.error('❌ Webhook processing error (non-fatal):', err.message);
  }
};

// ─── GET /api/payments ────────────────────────────────────────────────────────

exports.getAllPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.bookingId) filter.bookingId = req.query.bookingId;
    if (req.query.provider)  filter.method    = req.query.provider;
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/payments/booking/:bookingId ─────────────────────────────────────

exports.getPaymentByBooking = async (req, res) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId }).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/payments/:id ────────────────────────────────────────────────────

exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      $or: [{ _id: req.params.id }, { paymentId: req.params.id }],
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/payments/:id/invoice ───────────────────────────────────────────

exports.getInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      $or: [{ _id: req.params.id }, { paymentId: req.params.id }],
    });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    const invoice = await Invoice.findOne({ bookingId: payment.bookingId }).sort({ createdAt: -1 });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    const booking = await Booking.findOne({ bookingId: payment.bookingId });
    res.json({ success: true, invoice, payment, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
