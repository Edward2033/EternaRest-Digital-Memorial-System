const mongoose = require('mongoose');

const nicheSchema = new mongoose.Schema(
  {
    nicheId: {
      type: String,
      unique: true,
      trim: true,
    },
    block: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    section: {
      type: String,
      trim: true,
      default: null,
    },
    row: {
      type: Number,
      required: true,
      min: 1,
    },
    floor: {
      type: Number,
      default: 1,
      min: 1,
    },
    nicheNumber: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'maintenance'],
      default: 'available',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    bookingId: {
      type: String,
      ref: 'Booking',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

nicheSchema.pre('save', function (next) {
  if (!this.nicheId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.nicheId = `NCH-${ts}-${rnd}`;
  }
  next();
});

nicheSchema.index({ nicheId: 1 });
nicheSchema.index({ block: 1, row: 1 });
nicheSchema.index({ status: 1 });
nicheSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Niche', nicheSchema);
