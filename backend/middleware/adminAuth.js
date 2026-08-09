const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = adminAuth;
