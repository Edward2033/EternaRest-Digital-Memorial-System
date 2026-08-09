const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    text: { type: String, trim: true, default: null },
    buttonText: { type: String, trim: true, default: null },
    buttonLink: { type: String, trim: true, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    location: {
      type: String,
      enum: ['home', 'about', 'services', 'memorial', 'booking'],
      default: 'home',
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bannerSchema.index({ location: 1, active: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
