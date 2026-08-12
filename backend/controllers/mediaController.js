const Media    = require('../models/Media');
const Memorial = require('../models/Memorial');
const multer   = require('multer');
const path     = require('path');
const crypto   = require('crypto');
const FormData = require('form-data');
const https    = require('https');

// ─── Cloudinary upload helper ─────────────────────────────────────────────────

async function uploadToCloudinary(buffer, originalname, mimetype) {
  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  const isVideo   = mimetype.startsWith('video');
  const resource  = isVideo ? 'video' : 'image';
  const folder    = 'eternarest/memorials';
  const timestamp = Math.floor(Date.now() / 1000);
  const sigStr    = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  const form = new FormData();
  form.append('file',      buffer, { filename: originalname, contentType: mimetype });
  form.append('api_key',   apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder',    folder);

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`,
      { method: 'POST', headers: form.getHeaders() },
      (res) => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ url: json.secure_url || null, publicId: json.public_id || null });
          } catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    form.pipe(req);
  });
}

// ─── Multer — memory storage (no local disk writes) ───────────────────────────

const fileFilter = (_req, file, cb) => {
  const ok = /jpeg|jpg|png|gif|mp4|mov|avi/.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Only images and videos allowed'), ok);
};

exports.upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ─── POST /api/media/:bookingId ───────────────────────────────────────────────

exports.uploadMedia = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const memorial = await Memorial.findOne({ bookingId });
    if (!memorial) {
      return res.status(404).json({ success: false, message: 'Memorial not found' });
    }

    const mediaRecords = [];

    for (const file of files) {
      const type   = file.mimetype.startsWith('video') ? 'video' : 'photo';
      const result = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);

      const url        = result?.url        || null;
      const cloudinaryId = result?.publicId || null;

      if (!url) {
        console.warn('⚠️  Cloudinary upload failed for', file.originalname);
        continue;
      }

      const media = new Media({
        bookingId,
        memorialId:   memorial._id,
        type,
        url,
        fileUrl:      url,
        cloudinaryId,
        filename:     file.originalname,
        caption:      req.body.caption || '',
        uploadedAt:   new Date(),
      });
      await media.save();
      memorial.media.push(media._id);
      mediaRecords.push(media);
    }

    await memorial.save();

    if (mediaRecords.length === 0) {
      return res.status(500).json({ success: false, message: 'All uploads failed — check Cloudinary config' });
    }

    res.status(200).json({ success: true, message: 'Media uploaded successfully', media: mediaRecords });
  } catch (error) {
    console.error('❌ Error uploading media:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── GET /api/media/:bookingId ────────────────────────────────────────────────

exports.getMediaByBookingId = async (req, res) => {
  try {
    const media = await Media.find({ bookingId: req.params.bookingId });
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
