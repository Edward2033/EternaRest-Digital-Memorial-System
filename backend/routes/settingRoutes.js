const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { logActivity } = require('../utils/activityLogger');

// GET all settings (public ones only for non-admin)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.group ? { group: req.query.group } : {};
    const settings = await Setting.find(filter).sort({ group: 1, key: 1 });
    res.json({ success: true, count: settings.length, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single setting by key
router.get('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    res.json({ success: true, setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create setting
router.post('/', async (req, res) => {
  try {
    const setting = new Setting(req.body);
    await setting.save();
    await logActivity('system', 'system', 'created_setting', 'setting', setting.key, { key: setting.key });
    res.status(201).json({ success: true, setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update setting by key
router.put('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { $set: { value: req.body.value, description: req.body.description } },
      { new: true, runValidators: true }
    );
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    await logActivity('system', 'system', 'updated_setting', 'setting', setting.key, { key: setting.key });
    res.json({ success: true, setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE setting by key
router.delete('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    res.json({ success: true, message: 'Setting deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
