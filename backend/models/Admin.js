const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['super_admin', 'admin', 'manager', 'editor', 'viewer'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

adminSchema.index({ email: 1 });
adminSchema.index({ username: 1 });
adminSchema.index({ isActive: 1 });

module.exports = mongoose.model('Admin', adminSchema);
