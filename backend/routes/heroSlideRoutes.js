const express = require('express');
const router = express.Router();
const HeroSlide = require('../models/HeroSlide');

// GET active slides (public)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all ? {} : { active: true };
    const slides = await HeroSlide.find(filter).sort({ sortOrder: 1 });
    res.json({ success: true, count: slides.length, slides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single slide
router.get('/:id', async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    res.json({ success: true, slide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create slide
router.post('/', async (req, res) => {
  try {
    const slide = new HeroSlide(req.body);
    await slide.save();
    res.status(201).json({ success: true, slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update slide
router.put('/:id', async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    res.json({ success: true, slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE slide
router.delete('/:id', async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    res.json({ success: true, message: 'Slide deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
