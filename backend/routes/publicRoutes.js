/**
 * publicRoutes.js
 *
 * Unauthenticated read endpoints consumed by the public website.
 * ONLY GET requests + contact form POST are here.
 * No writes to CMS data — all mutations stay behind /api/admin/*.
 */

const express     = require('express');
const router      = express.Router();
const Service     = require('../models/Service');
const Banner      = require('../models/Banner');
const HeroSlide   = require('../models/HeroSlide');
const Testimonial = require('../models/Testimonial');
const Gallery     = require('../models/Gallery');
const Package     = require('../models/Package');
const Setting     = require('../models/Setting');
const Contact     = require('../models/Contact');
const { logActivity } = require('../utils/activityLogger');

// ─── Helper — lean list query ─────────────────────────────────────────────────
const list = (Model, filter = {}, sort = {}) =>
  Model.find(filter).sort(sort).lean();

// ─── GET /api/public/services ─────────────────────────────────────────────────
router.get('/services', async (req, res) => {
  try {
    const services = await list(Service, { status: 'active' }, { sortOrder: 1 });
    res.json({ success: true, count: services.length, services });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/faqs ─────────────────────────────────────────────────────
router.get('/faqs', async (req, res) => {
  try {
    const FAQ = require('../models/FAQ');
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    const faqs = await list(FAQ, filter, { sortOrder: 1 });
    res.json({ success: true, count: faqs.length, faqs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/packages ─────────────────────────────────────────────────
router.get('/packages', async (req, res) => {
  try {
    const packages = await list(Package, { isActive: true }, { price: 1 });
    res.json({ success: true, count: packages.length, packages });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/banners ──────────────────────────────────────────────────
router.get('/banners', async (req, res) => {
  try {
    const now    = new Date();
    const filter = {
      active: true,
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    };
    if (req.query.location) filter.location = req.query.location;
    const banners = await list(Banner, filter, { createdAt: -1 });
    res.json({ success: true, count: banners.length, banners });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/heroslides ───────────────────────────────────────────────
router.get('/heroslides', async (req, res) => {
  try {
    const slides = await list(HeroSlide, { active: true }, { sortOrder: 1 });
    res.json({ success: true, count: slides.length, slides });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/testimonials ─────────────────────────────────────────────
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await list(Testimonial, { approved: true }, { sortOrder: 1 });
    res.json({ success: true, count: testimonials.length, testimonials });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/gallery ──────────────────────────────────────────────────
router.get('/gallery', async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    const gallery = await list(Gallery, filter, { sortOrder: 1 });
    res.json({ success: true, count: gallery.length, gallery });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── GET /api/public/settings ─────────────────────────────────────────────────
// Returns only settings marked isPublic: true
router.get('/settings', async (req, res) => {
  try {
    const rows = await Setting.find({ isPublic: true }).lean();
    const map  = {};
    rows.forEach(s => { map[s.key] = s.value; });
    res.json({ success: true, settings: map });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST /api/public/testimonials ────────────────────────────────────────────
// Public testimonial submission (pending approval by admin)
router.post('/testimonials', async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!name?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Name and message are required' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    const testimonial = await Testimonial.create({
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      rating: parseInt(rating),
      message: message.trim(),
      approved: false, // Requires admin approval
      sortOrder: 999,  // Will be reordered by admin
    });
    
    await logActivity(name, 'customer', 'testimonial_submitted', 'testimonial', testimonial._id.toString(), { email });
    res.status(201).json({ 
      success: true, 
      message: 'Thank you for your testimonial! It will be reviewed and published shortly.' 
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── POST /api/public/contact ─────────────────────────────────────────────────
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'name, email and message are required' });
    }
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      message: message.trim(),
      ipAddress: req.ip,
    });
    await logActivity(name, 'customer', 'contact_submitted', 'contact', contact._id.toString(), { email });
    res.status(201).json({ success: true, message: 'Message received. We\'ll be in touch within 24 hours.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
