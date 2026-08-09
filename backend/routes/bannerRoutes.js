const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// GET banners (optionally filtered by location)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const filter = req.query.all ? {} : { active: true };
    if (req.query.location) filter.location = req.query.location;
    // Exclude expired banners unless ?all=true
    if (!req.query.all) {
      filter.$or = [{ endDate: null }, { endDate: { $gte: now } }];
    }
    const banners = await Banner.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: banners.length, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create banner
router.post('/', async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json({ success: true, banner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update banner
router.put('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE banner
router.delete('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
