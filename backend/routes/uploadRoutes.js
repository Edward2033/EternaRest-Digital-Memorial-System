/**
 * uploadRoutes.js
 * CMS image upload — admin-authenticated.
 * Uploads to Cloudinary if configured, otherwise stores locally.
 * POST /api/upload/cms  → returns { success, url }
 */

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const crypto    = require('crypto');
const FormData  = require('form-data');
const adminAuth = require('../middleware/adminAuth');

// Use memory storage so we can pipe to Cloudinary without saving locally first
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp|svg/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function uploadToCloudinary(buffer, filename) {
  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = 'eternarest/cms';
  const sigStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  const form = new FormData();
  form.append('file', buffer, { filename, contentType: 'image/jpeg' });
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body:   form,
    headers: form.getHeaders(),
  });
  const json = await res.json();
  return json.secure_url ?? null;
}

// POST /api/upload/cms  (admin only)
router.post('/cms', adminAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    // Try Cloudinary first
    const cloudUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    if (cloudUrl) return res.json({ success: true, url: cloudUrl });

    // Fallback: save locally
    const CMS_DIR = path.join(__dirname, '../uploads/cms');
    if (!fs.existsSync(CMS_DIR)) fs.mkdirSync(CMS_DIR, { recursive: true });
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(req.file.originalname).toLowerCase()}`;
    fs.writeFileSync(path.join(CMS_DIR, safe), req.file.buffer);
    return res.json({ success: true, url: `/uploads/cms/${safe}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
