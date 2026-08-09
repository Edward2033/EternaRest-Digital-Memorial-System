const mongoose = require('mongoose');

const familyAccountSchema = new mongoose.Schema(
  {
    primaryContactName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      ref: 'Role',
      default: 'family_member',
    },
    bookingIds: {
      type: [String],
      default: [],
      ref: 'Booking',
    },
    // memorialId reference
    memorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memorial',
      default: null,
    },
    // status with full enum
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
    },
    // isActive and isVerified kept for backward compat
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: String,
      trim: true,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

familyAccountSchema.pre('save', function (next) {
  if (!this.fullName && this.primaryContactName) this.fullName = this.primaryContactName;
  // Keep isActive in sync with status
  this.isActive = this.status !== 'suspended';
  next();
});

familyAccountSchema.index({ email: 1 });
familyAccountSchema.index({ bookingIds: 1 });
familyAccountSchema.index({ status: 1 });
familyAccountSchema.index({ memorialId: 1 });

module.exports = mongoose.model('FamilyAccount', familyAccountSchema);
