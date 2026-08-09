const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

router.post('/upload/:bookingId', mediaController.upload.array('media', 10), mediaController.uploadMedia);
router.get('/:bookingId', mediaController.getMediaByBookingId);

module.exports = router;
