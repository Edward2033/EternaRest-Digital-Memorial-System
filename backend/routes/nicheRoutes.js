const express = require('express');
const router = express.Router();
const Niche = require('../models/Niche');
const { logActivity } = require('../utils/activityLogger');

// GET all niches
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.block) filter.block = req.query.block.toUpperCase();
    const niches = await Niche.find(filter).sort({ block: 1, row: 1, nicheNumber: 1 });
    res.json({ success: true, count: niches.length, niches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single niche
router.get('/:id', async (req, res) => {
  try {
    const niche = await Niche.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { nicheId: req.params.id }],
    });
    if (!niche) return res.status(404).json({ success: false, message: 'Niche not found' });
    res.json({ success: true, niche });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create niche
router.post('/', async (req, res) => {
  try {
    const niche = new Niche(req.body);
    await niche.save();
    await logActivity('system', 'system', 'created_niche', 'system', niche.nicheId, { block: niche.block, row: niche.row });
    res.status(201).json({ success: true, niche });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update niche status
router.put('/:id', async (req, res) => {
  try {
    const niche = await Niche.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!niche) return res.status(404).json({ success: false, message: 'Niche not found' });
    res.json({ success: true, niche });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE niche
router.delete('/:id', async (req, res) => {
  try {
    const niche = await Niche.findByIdAndDelete(req.params.id);
    if (!niche) return res.status(404).json({ success: false, message: 'Niche not found' });
    res.json({ success: true, message: 'Niche deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
