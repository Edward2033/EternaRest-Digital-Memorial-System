const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalVisitors: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
    memorialViews: { type: Number, default: 0 },
    searches: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    newComments: { type: Number, default: 0 },
    newFamilyAccounts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analyticsSchema.index({ date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
