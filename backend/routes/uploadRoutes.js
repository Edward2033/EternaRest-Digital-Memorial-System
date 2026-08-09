/**
 * uploadRoutes.js
 * Generic CMS image upload — admin-authenticated.
 * POST /api/upload/cms  → stores to /uploads/cms/, returns { url }
 */

const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const adminAuth = require('../middleware/adminAuth');

// Ensure upload dir exists
const CMS_DIR = path.join(__dirname, '../uploads/cms');
if (!fs.existsSync(CMS_DIR)) fs.mkdirSync(CMS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CMS_DIR),
  filename:    (_req,  file, cb) => {
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, safe);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /jpeg|jpg|png|gif|webp|svg/.test(
    path.extname(file.originalname).toLowerCase(),
  );
  cb(ok ? null : new Error('Only image files are allowed'), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/upload/cms  (admin only)
router.post('/cms', adminAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const url = `/uploads/cms/${req.file.filename}`;
  res.json({ success: true, url, filename: req.file.filename });
});

module.exports = router;
