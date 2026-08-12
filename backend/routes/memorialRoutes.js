const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/memorialController');

// Static routes MUST come before parameterised ones
router.get ('/',              controller.getAllMemorials);
router.post('/',              controller.createMemorial);
router.get ('/search',        controller.searchMemorials);

// Parameterised routes
router.get ('/:bookingId',                controller.getMemorialByBookingId);
router.post('/:bookingId/tribute',        controller.addTribute);
router.put ('/:bookingId/biography',      controller.updateBiography);
router.post('/:bookingId/media',          controller.addMedia);

module.exports = router;
