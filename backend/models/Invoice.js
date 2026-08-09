const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    bookingId: {
      type: String,
      required: true,
      ref: 'Booking',
      index: true,
    },
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    billingNumber: {
      type: String,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: { type: String, default: 'USD', uppercase: true },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    pdfUrl: { type: String, default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

invoiceSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.invoiceNumber = `INV-${ts}-${rnd}`;
  }
  next();
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
