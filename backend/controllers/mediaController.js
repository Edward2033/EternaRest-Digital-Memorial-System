const Media = require('../models/Media');
const Memorial = require('../models/Memorial');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/memorials'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos allowed'));
  }
};

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

exports.uploadMedia = async (req, res) => {
  try {
    console.log('📤 Uploading media for booking:', req.params.bookingId);
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
      const type = file.mimetype.startsWith('video') ? 'video' : 'photo';
      const media = new Media({
        bookingId,
        memorialId: memorial._id,
        type,
        url: `/uploads/memorials/${file.filename}`,
        filename: file.filename,
        caption: req.body.caption || ''
      });
      await media.save();
      memorial.media.push(media._id);
      mediaRecords.push(media);
    }

    await memorial.save();
    console.log('✅ Media uploaded:', mediaRecords.length, 'files');

    res.status(200).json({ success: true, message: 'Media uploaded successfully', media: mediaRecords });
  } catch (error) {
    console.error('❌ Error uploading media:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMediaByBookingId = async (req, res) => {
  try {
    const media = await Media.find({ bookingId: req.params.bookingId });
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
