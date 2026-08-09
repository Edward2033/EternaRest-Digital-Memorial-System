const express    = require('express');
const router     = express.Router();
const adminAuth  = require('../middleware/adminAuth');
const qrCtrl     = require('../controllers/qrController');

// All QR management routes require admin auth
router.get ('/:bookingId',            adminAuth, qrCtrl.getQR);
router.post('/:bookingId/regenerate', adminAuth, qrCtrl.regenerateQR);
router.get ('/:bookingId/download',   adminAuth, qrCtrl.downloadQR);

module.exports = router;
