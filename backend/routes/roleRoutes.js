const express = require('express');
const router = express.Router();
const Role = require('../models/Role');

// GET all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: roles.length, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single role
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findOne({ $or: [{ _id: req.params.id }, { name: req.params.id }] });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create role
router.post('/', async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json({ success: true, role });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update role
router.put('/:id', async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.json({ success: true, role });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
