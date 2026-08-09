const express   = require('express');
const router    = express.Router();
const adminAuth = require('../middleware/adminAuth');
const cms       = require('../controllers/cmsController');

// All routes protected by adminAuth
router.use(adminAuth);

// Packages
router.get   ('/packages',          cms.packages.getAll);
router.get   ('/packages/:id',      cms.packages.getOne);
router.post  ('/packages',          cms.packages.create);
router.put   ('/packages/:id',      cms.packages.update);
router.delete('/packages/:id',      cms.packages.remove);

// Services
router.get   ('/services',          cms.services.getAll);
router.get   ('/services/:id',      cms.services.getOne);
router.post  ('/services',          cms.services.create);
router.put   ('/services/:id',      cms.services.update);
router.delete('/services/:id',      cms.services.remove);

// Banners
router.get   ('/banners',           cms.banners.getAll);
router.get   ('/banners/:id',       cms.banners.getOne);
router.post  ('/banners',           cms.banners.create);
router.put   ('/banners/:id',       cms.banners.update);
router.delete('/banners/:id',       cms.banners.remove);

// Hero Slides
router.get   ('/heroslides',        cms.heroslides.getAll);
router.get   ('/heroslides/:id',    cms.heroslides.getOne);
router.post  ('/heroslides',        cms.heroslides.create);
router.put   ('/heroslides/:id',    cms.heroslides.update);
router.delete('/heroslides/:id',    cms.heroslides.remove);

// Testimonials
router.get   ('/testimonials',      cms.testimonials.getAll);
router.get   ('/testimonials/:id',  cms.testimonials.getOne);
router.post  ('/testimonials',      cms.testimonials.create);
router.put   ('/testimonials/:id',  cms.testimonials.update);
router.delete('/testimonials/:id',  cms.testimonials.remove);

// Gallery
router.get   ('/gallery',           cms.gallery.getAll);
router.get   ('/gallery/:id',       cms.gallery.getOne);
router.post  ('/gallery',           cms.gallery.create);
router.put   ('/gallery/:id',       cms.gallery.update);
router.delete('/gallery/:id',       cms.gallery.remove);

// Niches
router.get   ('/niches',            cms.niches.getAll);
router.get   ('/niches/:id',        cms.niches.getOne);
router.post  ('/niches',            cms.niches.create);
router.put   ('/niches/:id',        cms.niches.update);
router.delete('/niches/:id',        cms.niches.remove);

// Settings — static routes MUST come before parameterised ones
router.get   ('/settings',          cms.getSettings);
router.post  ('/settings',          cms.createSetting);
router.put   ('/settings/bulk',     cms.bulkUpdateSettings);   // BEFORE /:key
router.put   ('/settings',          cms.updateSetting);
router.put   ('/settings/:key',     cms.updateSettingByKey);
router.delete('/settings/:key',     cms.deleteSettingByKey);

// Contacts (read + status update + delete)
router.get   ('/contacts',          cms.contacts.getAll);
router.get   ('/contacts/:id',      cms.contacts.getOne);
router.put   ('/contacts/:id',      cms.contacts.update);
router.delete('/contacts/:id',      cms.contacts.remove);

// FAQs
router.get   ('/faqs',              cms.faqs.getAll);
router.get   ('/faqs/:id',          cms.faqs.getOne);
router.post  ('/faqs',              cms.faqs.create);
router.put   ('/faqs/:id',          cms.faqs.update);
router.delete('/faqs/:id',          cms.faqs.remove);

module.exports = router;
