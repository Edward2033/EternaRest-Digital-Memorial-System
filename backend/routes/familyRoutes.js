const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FamilyAccount = require('../models/FamilyAccount');
const adminAuth = require('../middleware/adminAuth');
const { logActivity } = require('../utils/activityLogger');

// POST register family account
router.post('/register', async (req, res) => {
  try {
    const { primaryContactName, email, phone, password, bookingIds } = req.body;

    const existing = await FamilyAccount.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const account = new FamilyAccount({
      primaryContactName,
      email,
      phone,
      password: passwordHash,
      bookingIds: bookingIds || [],
    });
    await account.save();
    await logActivity(email, 'family', 'registered_family_account', 'user', account._id.toString(), { email });
    res.status(201).json({ success: true, message: 'Family account created', accountId: account._id });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST family login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await FamilyAccount.findOne({ email, isActive: true });
    if (!account) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    account.lastLoginAt = new Date();
    await account.save();

    const token = jwt.sign({ id: account._id, role: 'family_member' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await logActivity(email, 'family', 'family_login', 'user', account._id.toString(), {});
    res.json({ success: true, token, account: { id: account._id, primaryContactName: account.primaryContactName, email: account.email, bookingIds: account.bookingIds } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all family accounts (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const accounts = await FamilyAccount.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, count: accounts.length, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single family account
router.get('/:id', async (req, res) => {
  try {
    const account = await FamilyAccount.findById(req.params.id, '-password');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT add bookingId to family account
router.put('/:id/bookings', async (req, res) => {
  try {
    const { bookingId } = req.body;
    const account = await FamilyAccount.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { bookingIds: bookingId } },
      { new: true, select: '-password' }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, account });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE (deactivate) family account
router.delete('/:id', async (req, res) => {
  try {
    const account = await FamilyAccount.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true, select: '-password' });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
