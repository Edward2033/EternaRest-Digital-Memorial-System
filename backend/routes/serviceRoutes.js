const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// GET all active services (public)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all ? {} : { status: 'active' };
    const services = await Service.find(filter).sort({ sortOrder: 1 });
    res.json({ success: true, count: services.length, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single service
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { title: req.params.id }],
    });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create service
router.post('/', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json({ success: true, service });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
