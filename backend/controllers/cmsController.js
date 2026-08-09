const Package     = require('../models/Package');
const Service     = require('../models/Service');
const Banner      = require('../models/Banner');
const HeroSlide   = require('../models/HeroSlide');
const Testimonial = require('../models/Testimonial');
const Gallery     = require('../models/Gallery');
const Niche       = require('../models/Niche');
const Setting     = require('../models/Setting');
const Contact     = require('../models/Contact');
const FAQ         = require('../models/FAQ');

// ─── Generic CRUD factory ─────────────────────────────────────────────────────
const crudFor = (Model, sortField = 'createdAt', sortDir = -1) => ({
  getAll: async (req, res) => {
    try {
      const docs = await Model.find().sort({ [sortField]: sortDir });
      res.json({ success: true, count: docs.length, data: docs });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  },
  getOne: async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: doc });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  },
  create: async (req, res) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
  },
  update: async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: doc });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
  },
  remove: async (req, res) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  },
});

exports.packages     = crudFor(Package,     'sortOrder', 1);
exports.services     = crudFor(Service,     'sortOrder', 1);
exports.banners      = crudFor(Banner,      'createdAt', -1);
exports.heroslides   = crudFor(HeroSlide,   'sortOrder', 1);
exports.testimonials = crudFor(Testimonial, 'sortOrder', 1);
exports.gallery      = crudFor(Gallery,     'sortOrder', 1);
exports.niches       = crudFor(Niche,       'block',     1);
exports.contacts     = crudFor(Contact,     'createdAt', -1);
exports.faqs         = crudFor(FAQ,         'sortOrder', 1);

// ─── Settings (key-value store) ───────────────────────────────────────────────

exports.getSettings = async (req, res) => {
  try {
    const group = req.query.group;
    const query = group ? { group } : {};
    const settings = await Setting.find(query).sort({ group: 1, key: 1 });
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ success: true, settings: map, raw: settings });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

exports.createSetting = async (req, res) => {
  try {
    const { key, value, group, description, isPublic } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'key is required' });
    const existing = await Setting.findOne({ key });
    if (existing) return res.status(409).json({ success: false, message: 'Setting with this key already exists' });
    const setting = await Setting.create({ key, value, group: group || 'general', description, isPublic: !!isPublic });
    res.status(201).json({ success: true, data: setting });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value, group, description, isPublic } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'key is required' });
    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, ...(group && { group }), ...(description && { description }), ...(isPublic !== undefined && { isPublic }) },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ success: true, data: setting });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
};

exports.updateSettingByKey = async (req, res) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { $set: { value: req.body.value, ...(req.body.description !== undefined && { description: req.body.description }) } },
      { new: true, runValidators: true },
    );
    if (!setting) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: setting });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
};

exports.deleteSettingByKey = async (req, res) => {
  try {
    const setting = await Setting.findOneAndDelete({ key: req.params.key });
    if (!setting) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
};

exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'settings must be an array' });
    }
    const ops = settings.map(({ key, value }) => ({
      updateOne: { filter: { key }, update: { $set: { key, value } }, upsert: true },
    }));
    await Setting.bulkWrite(ops);
    res.json({ success: true, message: `${settings.length} settings updated` });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
};
