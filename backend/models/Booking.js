const mongoose = require('mongoose');

const generateBillingNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BILL-${ts}-${rnd}`;
};

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    // Billing number for payment reference
    billingNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    deceasedName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    dateOfDeath: {
      type: Date,
      required: true,
    },
    biography: {
      type: String,
      trim: true,
    },
    bookerName: {
      type: String,
      required: true,
      trim: true,
    },
    bookerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    bookerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
      default: 'Family',
    },
    // Package reference — packageType kept for backward compatibility
    packageType: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'essential', 'legacy'],
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'verified', 'rejected'],
      default: 'unpaid',
    },
    // Booking workflow status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    // QR code file path (backward compat)
    qrCode: {
      type: String,
      default: null,
    },
    // Reference to QRCode document
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRCode',
      default: null,
    },
    // Reference to Memorial document
    memorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memorial',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Generate billingNumber before save if not set
bookingSchema.pre('save', function (next) {
  if (!this.billingNumber) {
    this.billingNumber = generateBillingNumber();
  }
  next();
});

bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ billingNumber: 1 });
bookingSchema.index({ bookerEmail: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ packageType: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
