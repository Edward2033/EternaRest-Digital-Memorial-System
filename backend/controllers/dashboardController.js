const Booking       = require('../models/Booking');
const Memorial      = require('../models/Memorial');
const Payment       = require('../models/Payment');
const Package       = require('../models/Package');
const Contact       = require('../models/Contact');
const Niche         = require('../models/Niche');

exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    const [
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      totalMemorials,
      totalPackages,
      totalContacts,
      payments,
      nicheStats,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'approved' }),
      Booking.countDocuments({ status: 'rejected' }),
      Memorial.countDocuments(),
      Package.countDocuments({ status: 'active' }),
      Contact.countDocuments(),
      Payment.aggregate([
        { $match: { status: { $in: ['verified', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Niche.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue    = payments.length ? payments[0].total : 0;
    const totalPayments   = payments.length ? payments[0].count : 0;

    const nicheMap = { available: 0, reserved: 0, occupied: 0, maintenance: 0 };
    nicheStats.forEach(n => { if (nicheMap[n._id] !== undefined) nicheMap[n._id] = n.count; });

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        totalMemorials,
        totalRevenue,
        totalPackages,
        totalPayments,
        totalContacts,
        availableNiches:    nicheMap.available,
        reservedNiches:     nicheMap.reserved,
        occupiedNiches:     nicheMap.occupied,
        maintenanceNiches:  nicheMap.maintenance,
      },
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
