const express    = require('express');
const router     = express.Router();
const Comment    = require('../models/Comment');
const adminAuth  = require('../middleware/adminAuth');
const { logActivity } = require('../utils/activityLogger');

// POST — public (visitors submit comments)
router.post('/', async (req, res) => {
  try {
    const { bookingId, authorName, authorEmail, content } = req.body;
    const comment = new Comment({ bookingId, authorName, authorEmail, content });
    await comment.save();
    res.status(201).json({ success: true, message: 'Comment submitted and awaiting approval', comment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET approved comments for a booking (public)
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const comments = await Comment.find({ bookingId: req.params.bookingId, status: 'approved' }).sort({ createdAt: -1 });
    res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all comments — admin only
router.get('/', adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const comments = await Comment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT approve — admin only
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', isApproved: true },
      { new: true }
    );
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    await logActivity('admin', 'admin', 'approved_comment', 'comment', comment._id.toString(), { bookingId: comment.bookingId });
    res.json({ success: true, message: 'Comment approved', comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT reject — admin only
router.put('/:id/reject', adminAuth, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', isApproved: false },
      { new: true }
    );
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.json({ success: true, message: 'Comment rejected', comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
