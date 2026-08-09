const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Memorial = require('../models/Memorial');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    console.log('🔐 Admin login attempt:', req.body);
    const { email, password, username } = req.body;
    
    // Support both email and username login
    const admin = await Admin.findOne({ 
      $or: [{ email: email || username }, { username: email || username }] 
    });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Admin logged in:', admin.username);
    res.status(200).json({ success: true, token, admin: { id: admin._id, username: admin.username, email: admin.email } });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const totalMemorials = await Memorial.countDocuments();
    
    res.status(200).json({
      success: true,
      stats: { totalBookings, pendingBookings, approvedBookings, totalMemorials }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
