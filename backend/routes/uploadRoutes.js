/**
 * uploadRoutes.js
 * CMS image upload — admin-authenticated, signed Cloudinary upload.
 * POST /api/upload/cms  → returns { success, url }
 */

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const crypto    = require('crypto');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function uploadToCloudinary(buffer, originalname) {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey    = (process.env.CLOUDINARY_API_KEY    || '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

  console.log(`☁️  Cloudinary env — cloud:"${cloudName}" key_len:${apiKey.length} secret_len:${apiSecret.length}`);

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(`Cloudinary env vars missing — CLOUDINARY_CLOUD_NAME:${!!cloudName} CLOUDINARY_API_KEY:${!!apiKey} CLOUDINARY_API_SECRET:${!!apiSecret}`);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = 'eternarest/cms';

  // Cloudinary signature: alphabetical params joined with & then append secret (NO separator before secret)
  const sigStr    = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  console.log(`☁️  Signing: "${`folder=${folder}&timestamp=${timestamp}`}" → sig:${signature.slice(0,8)}…`);

  // Detect MIME type
  const ext = path.extname(originalname).toLowerCase();
  const mime = { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[ext] || 'image/jpeg';

  // Build multipart form manually using Blob/Buffer approach compatible with Node 18+ fetch
  const boundary = `----FormBoundary${crypto.randomBytes(8).toString('hex')}`;

  const textPart = (name, value) =>
    `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;

  const parts = [
    textPart('api_key',   apiKey),
    textPart('timestamp', String(timestamp)),
    textPart('signature', signature),
    textPart('folder',    folder),
  ];

  const prefix = Buffer.from(parts.join(''));
  const fileHeader = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${originalname}"\r\nContent-Type: ${mime}\r\n\r\n`
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);

  const body = Buffer.concat([prefix, fileHeader, buffer, suffix]);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method:  'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });

  const json = await res.json();
  console.log(`☁️  Cloudinary response ${res.status}:`, JSON.stringify(json).slice(0, 200));

  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Cloudinary error ${res.status}`);
  }

  return json.secure_url;
}

// POST /api/upload/cms  (admin only)
router.post('/cms', adminAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const url = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    return res.json({ success: true, url });
  } catch (err) {
    console.error('❌ CMS upload error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
