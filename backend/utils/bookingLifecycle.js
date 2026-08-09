/**
 * bookingLifecycle.js
 *
 * Single source of truth for everything that happens when a booking is approved:
 *
 *   1. Generate QR code PNG (encodes public memorial URL using memorialId)
 *   2. Upload QR PNG to Cloudinary (falls back to local /uploads/qrcodes)
 *   3. Create / update QRCode record in MongoDB
 *   4. Create (or republish) Memorial record
 *   5. Update Booking  → approved, paymentStatus: verified
 *   6. Update Payment  → verified
 *   7. Upsert Invoice  → paid
 *   8. Upsert FamilyAccount
 *   9. Create Notification
 *  10. Activity log
 *  11. Send approval + payment email with QR attached (non-blocking)
 *
 * Called from:
 *   - paymentController.verifyPayment   (MoMo / Airtel automatic confirmation)
 *   - paymentController.momoWebhook     (provider push callback)
 *   - bookingController.approveBooking  (manual admin override)
 */

const path       = require('path');
const fs         = require('fs');
const https      = require('https');
const qrcode     = require('qrcode');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');

const Booking       = require('../models/Booking');
const Payment       = require('../models/Payment');
const Invoice       = require('../models/Invoice');
const Memorial      = require('../models/Memorial');
const QRCode        = require('../models/QRCode');
const FamilyAccount = require('../models/FamilyAccount');
const Notification  = require('../models/Notification');
const { logActivity } = require('./activityLogger');

// ─── Cloudinary upload helper ─────────────────────────────────────────────────

/**
 * Upload a local file to Cloudinary using the REST API (no SDK needed).
 * Returns the secure_url of the uploaded asset.
 */
async function uploadToCloudinary(filePath, publicId) {
  const cloudName   = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey      = process.env.CLOUDINARY_API_KEY;
  const apiSecret   = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️  Cloudinary not configured — QR stored locally only');
    return null;
  }

  try {
    const crypto    = require('crypto');
    const FormData  = require('form-data');

    const timestamp = Math.floor(Date.now() / 1000);
    const folder    = 'eternarest/qrcodes';
    const sigStr    = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

    const form = new FormData();
    form.append('file',       fs.createReadStream(filePath));
    form.append('api_key',    apiKey);
    form.append('timestamp',  String(timestamp));
    form.append('signature',  signature);
    form.append('public_id',  publicId);
    form.append('folder',     folder);

    const result = await new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', headers: form.getHeaders() },
        (res) => {
          let data = '';
          res.on('data', c => (data += c));
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { reject(new Error('Cloudinary response parse error')); }
          });
        }
      );
      req.on('error', reject);
      form.pipe(req);
    });

    if (result.secure_url) {
      console.log('☁️  QR uploaded to Cloudinary:', result.secure_url);
      return result.secure_url;
    }
    console.error('❌ Cloudinary upload failed:', result.error?.message);
    return null;
  } catch (err) {
    console.error('❌ Cloudinary upload error:', err.message);
    return null;
  }
}

// ─── Email transport ──────────────────────────────────────────────────────────

function makeMailer() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp-relay.brevo.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ─── Frontend URL helper ──────────────────────────────────────────────────────

function frontendUrl(req) {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;
  if (req) return `${req.protocol}://${req.get('host')}`;
  return 'http://localhost:5173';
}

// ─── Step 1: Generate QR code PNG + upload to Cloudinary ─────────────────────

async function stepQRCode(booking, memorial, baseUrl) {
  // QR encodes the PUBLIC memorial URL using the human-readable memorialId
  const memorialId  = memorial.memorialId;
  const publicUrl   = `${baseUrl}/memorial/${memorialId}`;

  // Local fallback path
  const qrDir      = path.join(__dirname, '../uploads/qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const filename   = `qr-${memorialId}.png`;
  const filePath   = path.join(qrDir, filename);
  const localPath  = `/uploads/qrcodes/${filename}`;

  // Generate PNG
  await qrcode.toFile(filePath, publicUrl, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: { dark: '#1a2332', light: '#ffffff' },
  });

  // Try Cloudinary upload
  const cloudinaryUrl = await uploadToCloudinary(filePath, `qr-${memorialId}`);
  const qrImageUrl    = cloudinaryUrl || `${baseUrl}${localPath}`;

  // Upsert QRCode record
  const qrRecord = await QRCode.findOneAndUpdate(
    { bookingId: booking.bookingId },
    {
      bookingId:   booking.bookingId,
      memorialId:  memorialId,
      memorialRef: memorial._id,
      qrCodeImage: qrImageUrl,
      qrCodeUrl:   qrImageUrl,
      publicUrl,
      memorialUrl: publicUrl,
      status:      'active',
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  console.log(`🔲 QR generated for ${memorialId} → ${publicUrl}`);
  return { qrRecord, filePath, qrImageUrl, publicUrl };
}

// ─── Step 2: Create / republish Memorial ─────────────────────────────────────

async function stepMemorial(booking) {
  let memorial = await Memorial.findOne({ bookingId: booking.bookingId });

  if (!memorial) {
    memorial = await Memorial.create({
      bookingId:    booking.bookingId,
      bookingRef:   booking._id,
      deceasedName: booking.deceasedName,
      dateOfBirth:  booking.dateOfBirth,
      dateOfDeath:  booking.dateOfDeath,
      biography:    booking.biography || '',
      status:       'published',
      isPublic:     true,
    });
    console.log('🏛️  Memorial created:', memorial.memorialId);
  } else if (memorial.status !== 'published') {
    memorial.status   = 'published';
    memorial.isPublic = true;
    await memorial.save();
    console.log('🏛️  Memorial republished:', memorial.memorialId);
  }

  return memorial;
}

// ─── Step 3: Update Booking ───────────────────────────────────────────────────

async function stepUpdateBooking(booking, qrRecord, memorial) {
  booking.status        = 'approved';
  booking.approvedAt    = new Date();
  booking.paymentStatus = 'verified';
  booking.qrCode        = qrRecord.qrCodeImage;
  booking.qrCodeId      = qrRecord._id;
  booking.memorialId    = memorial._id;
  await booking.save();
}

// ─── Step 4: Update Payment ───────────────────────────────────────────────────

async function stepUpdatePayment(bookingId, transactionId, provider, verifiedBy) {
  return Payment.findOneAndUpdate(
    { bookingId, status: { $nin: ['verified', 'completed'] } },
    {
      status:     'verified',
      verifiedAt: new Date(),
      paidAt:     new Date(),
      verifiedBy: verifiedBy || 'system',
      ...(transactionId && { transactionId }),
      notes: `Auto-verified via ${(provider || 'system').toUpperCase()}`,
    },
    { new: true },
  );
}

// ─── Step 5: Upsert Invoice ───────────────────────────────────────────────────

async function stepUpsertInvoice(booking, payment) {
  const txNote = payment?.transactionId
    ? `Paid via ${(payment.method || 'momo').toUpperCase()} | TxID: ${payment.transactionId}`
    : `Paid — ${booking.bookingId}`;

  const invoice = await Invoice.findOneAndUpdate(
    { bookingId: booking.bookingId },
    {
      bookingId:     booking.bookingId,
      billingNumber: booking.billingNumber,
      amount:        payment?.amount ?? booking.price,
      currency:      payment?.currency ?? 'RWF',
      status:        'paid',
      dueDate:       null,
      notes:         txNote,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  console.log('🧾 Invoice upserted:', invoice.invoiceNumber);
  return invoice;
}

// ─── Step 6: Family Account ───────────────────────────────────────────────────

async function stepFamilyAccount(booking, memorial) {
  let account = await FamilyAccount.findOne({ email: booking.bookerEmail });

  if (!account) {
    const tempPass = Math.random().toString(36).slice(-10);
    account = await FamilyAccount.create({
      primaryContactName: booking.bookerName,
      email:              booking.bookerEmail,
      phone:              booking.bookerPhone,
      password:           await bcrypt.hash(tempPass, 10),
      bookingIds:         [booking.bookingId],
      memorialId:         memorial._id,
      status:             'approved',
    });
    console.log('👨‍👩‍👧 Family account created:', booking.bookerEmail);
  } else {
    if (!account.bookingIds.includes(booking.bookingId)) {
      account.bookingIds.push(booking.bookingId);
    }
    if (!account.memorialId) account.memorialId = memorial._id;
    account.status = 'approved';
    await account.save();
  }

  return account;
}

// ─── Step 7: Notification ─────────────────────────────────────────────────────

async function stepNotification(booking, memorial) {
  await Notification.create({
    userId:  booking.bookerEmail,
    title:   'Booking Approved & Memorial Live',
    message: `Your booking for ${booking.deceasedName} is approved. The memorial page is now live.`,
    type:    'booking',
    link:    `/memorial/${memorial.memorialId}`,
  });
}

// ─── Step 8: Send Email ───────────────────────────────────────────────────────

async function stepSendEmails(booking, payment, invoice, qrFilePath, publicUrl, qrImageUrl) {
  try {
    const transport = makeMailer();

    // Inline QR image as attachment
    const attachments = [];
    if (fs.existsSync(qrFilePath)) {
      attachments.push({
        filename: `qr-memorial.png`,
        path:     qrFilePath,
        cid:      'qrcode',
      });
    }

    await transport.sendMail({
      from:    process.env.EMAIL_FROM || 'EternaRest <noreply@eternarest.com>',
      to:      booking.bookerEmail,
      subject: `✅ Memorial Approved — ${booking.deceasedName} | ${booking.bookingId}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
          <div style="background:#0d1117;padding:28px 24px;border-radius:10px 10px 0 0;text-align:center">
            <h1 style="color:#d4af37;margin:0;font-size:26px;font-family:Georgia,serif">EternaRest</h1>
            <p style="color:#9ca3af;margin:6px 0 0;font-size:13px">Memorial Services</p>
          </div>

          <div style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none">
            <h2 style="color:#0d1117;margin:0 0 8px;font-size:20px">Your Memorial is Live 🕊️</h2>
            <p style="color:#6b7280;margin:0 0 20px;font-size:14px">
              Dear <strong style="color:#0d1117">${booking.bookerName}</strong>,<br/>
              The memorial for <strong>${booking.deceasedName}</strong> has been approved and is now publicly accessible.
            </p>

            <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin:0 0 20px">
              <tr style="background:#f3f4f6">
                <th colspan="2" style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280">Memorial Details</th>
              </tr>
              <tr>
                <td style="padding:9px 14px;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6;width:40%">Booking ID</td>
                <td style="padding:9px 14px;font-weight:600;font-size:13px;border-top:1px solid #f3f4f6;font-family:monospace">${booking.bookingId}</td>
              </tr>
              <tr>
                <td style="padding:9px 14px;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6">Memorial ID</td>
                <td style="padding:9px 14px;font-weight:600;font-size:13px;border-top:1px solid #f3f4f6;font-family:monospace">${invoice?.bookingId || booking.bookingId}</td>
              </tr>
              <tr>
                <td style="padding:9px 14px;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6">Memorial Page</td>
                <td style="padding:9px 14px;font-size:13px;border-top:1px solid #f3f4f6">
                  <a href="${publicUrl}" style="color:#d4af37;font-weight:600">${publicUrl}</a>
                </td>
              </tr>
              ${payment ? `
              <tr>
                <td style="padding:9px 14px;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6">Amount Paid</td>
                <td style="padding:9px 14px;font-weight:700;color:#16a34a;font-size:14px;border-top:1px solid #f3f4f6">${payment.currency} ${Number(payment.amount).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:9px 14px;color:#6b7280;font-size:13px;border-top:1px solid #f3f4f6">Invoice #</td>
                <td style="padding:9px 14px;font-weight:600;font-size:13px;border-top:1px solid #f3f4f6;font-family:monospace">${invoice?.invoiceNumber || '—'}</td>
              </tr>` : ''}
            </table>

            <div style="text-align:center;margin:24px 0">
              <p style="font-size:13px;color:#6b7280;margin:0 0 12px">Scan this QR code to visit the memorial:</p>
              ${attachments.length > 0
                ? `<img src="cid:qrcode" alt="QR Code" style="width:180px;height:180px;border-radius:8px;border:2px solid #d4af37" />`
                : qrImageUrl
                  ? `<img src="${qrImageUrl}" alt="QR Code" style="width:180px;height:180px;border-radius:8px;border:2px solid #d4af37" />`
                  : ''
              }
            </div>

            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-top:16px">
              <p style="margin:0;font-size:13px;color:#166534">
                <strong>Next steps:</strong> You can add photos, videos, and memories to the memorial page by visiting the link above.
              </p>
            </div>
          </div>

          <div style="background:#f9fafb;padding:12px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">EternaRest Memorial Services · Rwanda</p>
          </div>
        </div>
      `,
      attachments,
    });

    console.log('📧 Approval email sent to:', booking.bookerEmail);
  } catch (err) {
    console.error('❌ Email error (non-fatal):', err.message);
  }
}

// ─── Main exported pipeline ───────────────────────────────────────────────────

/**
 * Run the full post-payment / post-approval pipeline for a booking.
 *
 * @param {object}  booking       — Mongoose Booking document
 * @param {object}  [payment]     — Mongoose Payment document (null for manual admin approval)
 * @param {object}  [options]
 * @param {string}  [options.triggeredBy]   — 'payment' | 'admin' | 'webhook'
 * @param {string}  [options.transactionId] — override txn ID on payment record
 * @param {string}  [options.provider]      — 'mtn' | 'airtel'
 * @param {object}  [options.req]           — Express request (for base URL)
 *
 * @returns {{ booking, memorial, qrRecord, invoice, payment }}
 */
async function runApprovalPipeline(booking, payment = null, options = {}) {
  const { triggeredBy = 'system', transactionId, provider, req } = options;
  const base = frontendUrl(req);

  console.log(`\n🚀 Approval pipeline starting for ${booking.bookingId} [trigger: ${triggeredBy}]`);

  // Idempotency guard
  if (booking.status === 'approved') {
    console.log('ℹ️  Booking already approved — skipping pipeline');
    const memorial = await Memorial.findOne({ bookingId: booking.bookingId });
    const invoice  = await Invoice.findOne({ bookingId: booking.bookingId });
    return { booking, memorial, invoice, payment };
  }

  // 1. Create / republish Memorial first (we need memorialId for QR URL)
  const memorial = await stepMemorial(booking);

  // 2. Generate QR code (uses memorial.memorialId for the public URL)
  const { qrRecord, filePath: qrFilePath, qrImageUrl, publicUrl } = await stepQRCode(booking, memorial, base);

  // 3. Link QR to memorial
  if (String(memorial.qrCodeId) !== String(qrRecord._id)) {
    await Memorial.findByIdAndUpdate(memorial._id, { qrCodeId: qrRecord._id });
  }

  // 4. Update Booking
  await stepUpdateBooking(booking, qrRecord, memorial);

  // 5. Update Payment record (if one exists)
  let updatedPayment = payment;
  const paymentDoc   = payment || await Payment.findOne({ bookingId: booking.bookingId });
  if (paymentDoc) {
    updatedPayment = await stepUpdatePayment(
      booking.bookingId,
      transactionId || paymentDoc.transactionId,
      provider      || paymentDoc.method,
      triggeredBy,
    ) || paymentDoc;
  }

  // 6. Invoice
  const invoice = await stepUpsertInvoice(booking, updatedPayment);

  // 7. Family account
  await stepFamilyAccount(booking, memorial);

  // 8. Notification
  await stepNotification(booking, memorial);

  // 9. Activity log
  await logActivity(
    triggeredBy, 'system',
    'booking_approved', 'booking', booking.bookingId,
    { memorialId: memorial.memorialId, triggeredBy, provider: provider || 'system' },
  );

  // 10. Email (fire-and-forget)
  stepSendEmails(booking, updatedPayment, invoice, qrFilePath, publicUrl, qrImageUrl).catch(() => {});

  console.log(`✅ Pipeline complete for ${booking.bookingId} → memorial: ${memorial.memorialId}`);

  return { booking, memorial, qrRecord, invoice, payment: updatedPayment };
}

module.exports = { runApprovalPipeline };
