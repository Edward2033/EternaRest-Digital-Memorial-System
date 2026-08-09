/**
 * paymentRoutes.js
 *
 * Mounts all payment endpoints.
 * Webhook is intentionally unauthenticated (provider calls it externally).
 * All other mutation routes require admin auth in production — guarded via
 * adminAuth middleware on the /api/admin prefix mount in server.js.
 */

const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/paymentController');

// ── Public / customer-facing ──────────────────────────────────────────────────

// Initiate a MoMo or Airtel payment (called by BookingPage after booking created)
router.post('/initiate', ctrl.initiatePayment);

// Poll / confirm payment status (called by frontend after customer approves USSD)
router.post('/verify', ctrl.verifyPayment);

// Provider webhook callback — no auth, providers call this directly
router.post('/momo/webhook',   ctrl.momoWebhook);
router.post('/airtel/webhook', ctrl.momoWebhook); // Airtel shares same handler

// ── Read endpoints ────────────────────────────────────────────────────────────

// All payments (admin use)
router.get('/', ctrl.getAllPayments);

// Payment record by booking ID
router.get('/booking/:bookingId', ctrl.getPaymentByBooking);

// Single payment by _id or paymentId
router.get('/:id', ctrl.getPayment);

// Invoice for a payment
router.get('/:id/invoice', ctrl.getInvoice);

module.exports = router;
