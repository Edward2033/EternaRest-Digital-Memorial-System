/**
 * qrController.js
 *
 * Admin endpoints for QR code management:
 *   GET  /api/qr/:bookingId          — get QR record for a booking
 *   POST /api/qr/:bookingId/regenerate — regenerate QR (new image, same URL)
 *   GET  /api/qr/:bookingId/download  — stream QR PNG to browser
 */

const path    = require('path');
const fs      = require('fs');
const qrcode  = require('qrcode');
const QRCode  = require('../models/QRCode');
const Memorial= require('../models/Memorial');
const Booking = require('../models/Booking');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Cloudinary upload (same helper as bookingLifecycle) ──────────────────────
async function uploadToCloudinary(filePath, publicId) {
  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  try {
    const crypto   = require('crypto');
    const FormData = require('form-data');
    const https    = require('https');

    const timestamp = Math.floor(Date.now() / 1000);
    const folder    = 'eternarest/qrcodes';
    const sigStr    = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

    const form = new FormData();
    form.append('file',      fs.createReadStream(filePath));
    form.append('api_key',   apiKey);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);
    form.append('public_id', publicId);
    form.append('folder',    folder);

    const result = await new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', headers: form.getHeaders() },
        (res) => {
          let data = '';
          res.on('data', c => (data += c));
          res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('parse error')); } });
        }
      );
      req.on('error', reject);
      form.pipe(req);
    });

    return result.secure_url || null;
  } catch { return null; }
}

// ─── GET /api/qr/:bookingId ───────────────────────────────────────────────────

exports.getQR = async (req, res) => {
  try {
    const qr = await QRCode.findOne({ bookingId: req.params.bookingId });
    if (!qr) return res.status(404).json({ success: false, message: 'QR not found' });
    res.json({ success: true, qr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/qr/:bookingId/regenerate ──────────────────────────────────────

exports.regenerateQR = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const memorial = await Memorial.findOne({ bookingId: booking.bookingId });
    if (!memorial) return res.status(404).json({ success: false, message: 'Memorial not found — approve booking first' });

    const memorialId = memorial.memorialId;
    const publicUrl  = `${FRONTEND_URL}/memorial/${memorialId}`;

    // Generate new PNG
    const qrDir    = path.join(__dirname, '../uploads/qrcodes');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    const filename = `qr-${memorialId}.png`;
    const filePath = path.join(qrDir, filename);

    await qrcode.toFile(filePath, publicUrl, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: { dark: '#1a2332', light: '#ffffff' },
    });

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(filePath, `qr-${memorialId}-regen-${Date.now()}`);
    const qrImageUrl    = cloudinaryUrl || `${FRONTEND_URL.replace('5173', '5000')}/uploads/qrcodes/${filename}`;

    const qr = await QRCode.findOneAndUpdate(
      { bookingId: booking.bookingId },
      {
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

    // Update booking qrCode field
    await Booking.findOneAndUpdate({ bookingId: booking.bookingId }, { qrCode: qrImageUrl });

    res.json({ success: true, message: 'QR regenerated', qr });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/qr/:bookingId/download ─────────────────────────────────────────

exports.downloadQR = async (req, res) => {
  try {
    const qr = await QRCode.findOne({ bookingId: req.params.bookingId });
    if (!qr) return res.status(404).json({ success: false, message: 'QR not found' });

    const memorialId = qr.memorialId || req.params.bookingId;
    const filename   = `qr-${memorialId}.png`;
    const filePath   = path.join(__dirname, '../uploads/qrcodes', filename);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'image/png');
      return fs.createReadStream(filePath).pipe(res);
    }

    // If local file missing, redirect to Cloudinary URL
    if (qr.qrCodeImage?.startsWith('http')) {
      return res.redirect(qr.qrCodeImage);
    }

    res.status(404).json({ success: false, message: 'QR image file not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
