const Memorial = require('../models/Memorial');
const Media    = require('../models/Media');

exports.createMemorial = async (req, res) => {
  try {
    const memorial = new Memorial(req.body);
    await memorial.save();
    res.status(201).json({ success: true, memorial });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllMemorials = async (req, res) => {
  try {
    const memorials = await Memorial
      .find({ isPublic: true })
      .populate({ path: 'media', model: 'Media' })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: memorials.length, memorials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/memorials/:id  — accepts bookingId OR memorialId
exports.getMemorialByBookingId = async (req, res) => {
  try {
    const id = req.params.bookingId;
    const memorial = await Memorial
      .findOne({ $or: [{ bookingId: id }, { memorialId: id }] })
      .populate({ path: 'media', model: 'Media' });

    if (!memorial) {
      return res.status(404).json({ success: false, message: 'Memorial not found' });
    }

    // Increment view count (non-blocking)
    Memorial.findByIdAndUpdate(memorial._id, { $inc: { views: 1 } }).exec();

    res.status(200).json({ success: true, memorial });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/memorials/search?q=name
exports.searchMemorials = async (req, res) => {
  try {
    const q     = (req.query.q || '').trim();
    const regex = new RegExp(q, 'i');
    const memorials = await Memorial
      .find({
        isPublic: true,
        $or: [
          { deceasedName: regex },
          { bookingId:    regex },
          { memorialId:   regex },
        ],
      })
      .populate({ path: 'media', model: 'Media' })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: memorials.length, memorials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/memorials/:bookingId/tribute
exports.addTribute = async (req, res) => {
  try {
    const id = req.params.bookingId;
    const memorial = await Memorial.findOne({ $or: [{ bookingId: id }, { memorialId: id }] });
    if (!memorial) return res.status(404).json({ success: false, message: 'Memorial not found' });

    memorial.tributes.push({
      name:    req.body.name    || req.body.author_name || 'Anonymous',
      message: req.body.message || req.body.content     || '',
    });
    await memorial.save();
    res.status(200).json({ success: true, memorial });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/memorials/:bookingId/media  — family/public media upload
exports.addMedia = async (req, res) => {
  try {
    const id = req.params.bookingId;
    const memorial = await Memorial.findOne({ $or: [{ bookingId: id }, { memorialId: id }] });
    if (!memorial) return res.status(404).json({ success: false, message: 'Memorial not found' });

    const { type, url, caption, uploadedBy } = req.body;
    if (!type || !url) {
      return res.status(400).json({ success: false, message: 'type and url are required' });
    }

    const media = await Media.create({
      bookingId:  memorial.bookingId,
      memorialId: memorial._id,
      type:       type === 'video' ? 'video' : 'photo',
      url,
      caption:    caption    || '',
      uploadedBy: uploadedBy || 'family',
    });

    // Link media to memorial
    memorial.media.push(media._id);
    await memorial.save();

    res.status(201).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
