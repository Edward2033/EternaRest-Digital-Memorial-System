const mongoose = require('mongoose');

const generatePaymentId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PAY-${ts}-${rnd}`;
};

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    bookingId: {
      type: String,
      required: true,
      ref: 'Booking',
      index: true,
    },
    billingNumber: {
      type: String,
      trim: true,
      index: true,
    },
    packageName: {
      type: String,
      required: true,
      enum: ['basic', 'essential', 'standard', 'premium', 'legacy'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    // method — updated enum to match payment instructions
    method: {
      type: String,
      enum: ['momo', 'airtel', 'bank_transfer', 'card', 'cash', 'other'],
      default: 'other',
    },
    // paymentMethod kept for backward compat
    paymentMethod: {
      type: String,
      enum: ['momo', 'airtel', 'bank_transfer', 'card', 'cash', 'other'],
      default: 'other',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: null,
    },
    // transactionId kept for backward compat
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'verified', 'rejected', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    verifiedBy: {
      type: String,
      trim: true,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
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

paymentSchema.pre('save', function (next) {
  if (!this.paymentId) {
    this.paymentId = generatePaymentId();
  }
  // Keep method and paymentMethod in sync
  if (this.method && !this.paymentMethod) this.paymentMethod = this.method;
  if (this.paymentMethod && !this.method) this.method = this.paymentMethod;
  // transactionId / transactionReference sync
  if (this.transactionReference && !this.transactionId) this.transactionId = this.transactionReference;
  if (this.transactionId && !this.transactionReference) this.transactionReference = this.transactionId;
  next();
});

paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ billingNumber: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
