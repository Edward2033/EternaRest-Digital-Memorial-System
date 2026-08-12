const Booking      = require('../models/Booking');
const Payment      = require('../models/Payment');
const Invoice      = require('../models/Invoice');
const ActivityLog  = require('../models/ActivityLog');
const { logActivity }        = require('../utils/activityLogger');
const { runApprovalPipeline }= require('../utils/bookingLifecycle');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n, len = 6) => String(n).padStart(len, '0');

const generateBookingId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let r = '';
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `BK-${r}`;
};

const generateBillingNumber = async () => {
  const count = await Booking.countDocuments();
  return `ETR-BKG-${pad(count + 1)}`;
};

// ─── POST /api/bookings ───────────────────────────────────────────────────────

exports.createBooking = async (req, res) => {
  try {
    console.log('\n📝 Creating new booking...');

    const {
      deceasedName, dateOfBirth, dateOfDeath, biography,
      bookerName, bookerEmail, bookerPhone, relationship,
      packageType, price,
    } = req.body;

    const bookingId     = generateBookingId();
    const billingNumber = await generateBillingNumber();

    const booking = await Booking.create({
      bookingId,
      billingNumber,
      deceasedName,
      dateOfBirth:   dateOfBirth   || new Date('1950-01-01'),
      dateOfDeath:   dateOfDeath   || new Date(),
      biography:     biography     || '',
      bookerName,
      bookerEmail,
      bookerPhone,
      relationship:  relationship  || 'Family',
      packageType:   packageType   || 'standard',
      price:         price         || 0,
      status:        'pending',
      paymentStatus: 'unpaid',
    });

    console.log('✅ Booking saved:', bookingId, '|', billingNumber);

    // Create placeholder Payment record (status: pending, no method yet)
    const validPackageNames = ['basic', 'essential', 'standard', 'premium', 'legacy'];
    const packageName = validPackageNames.includes(packageType) ? packageType : 'standard';
    const payment = await Payment.create({
      bookingId,
      billingNumber,
      packageName,
      amount:      price       || 0,
      currency:    'RWF',
      status:      'pending',
    });

    // Create placeholder Invoice record (status: draft)
    const invoice = await Invoice.create({
      bookingId,
      billingNumber,
      amount:  price || 0,
      status:  'draft',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await logActivity(bookerName, 'customer', 'booking_created', 'booking', bookingId, { billingNumber });

    res.status(201).json({
      success: true,
      message: 'Booking created. Please proceed to payment.',
      bookingId,
      billingNumber,
      booking,
      payment,
      invoice,
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/bookings ────────────────────────────────────────────────────────

exports.getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/bookings/approve/:id — manual admin approval ───────────────────
// Delegates entirely to the shared pipeline so behaviour is identical
// to the automatic payment-triggered path.

exports.approveBooking = async (req, res) => {
  try {
    console.log('\n✅ Admin approving booking:', req.params.id);

    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Booking already approved' });
    }

    const result = await runApprovalPipeline(booking, null, {
      triggeredBy: req.admin?.username || 'admin',
      req,
    });

    res.status(200).json({
      success:  true,
      message:  'Booking approved. Memorial, QR code, invoice and notifications created.',
      booking:  result.booking,
      memorial: { id: result.memorial._id, memorialId: result.memorial.memorialId },
      qrCode:   result.booking.qrCode,
      invoice:  result.invoice,
    });
  } catch (error) {
    console.error('❌ Error approving booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/bookings/reject/:id ─────────────────────────────────────────────

exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = 'rejected';
    await booking.save();

    // Also mark any open payment as failed
    await Payment.findOneAndUpdate(
      { bookingId: booking.bookingId, status: 'pending' },
      { status: 'failed', notes: 'Booking rejected by admin' },
    );

    await logActivity(
      req.admin?.username || 'admin', 'admin',
      'booking_rejected', 'booking', booking.bookingId,
    );

    res.status(200).json({ success: true, message: 'Booking rejected', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
