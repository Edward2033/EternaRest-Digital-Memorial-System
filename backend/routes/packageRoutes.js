const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const { logActivity } = require('../utils/activityLogger');

// GET all packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, count: packages.length, packages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single package by name or id
router.get('/:id', async (req, res) => {
  try {
    const pkg = await Package.findOne({
      $or: [{ _id: req.params.id }, { name: req.params.id }],
    });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, package: pkg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create package (admin)
router.post('/', async (req, res) => {
  try {
    const pkg = new Package(req.body);
    await pkg.save();
    await logActivity('system', 'system', 'created_package', 'setting', pkg._id.toString(), { name: pkg.name });
    res.status(201).json({ success: true, package: pkg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update package
router.put('/:id', async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    await logActivity('system', 'system', 'updated_package', 'setting', pkg._id.toString(), { name: pkg.name });
    res.json({ success: true, package: pkg });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE (soft delete) package
router.delete('/:id', async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, message: 'Package deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
