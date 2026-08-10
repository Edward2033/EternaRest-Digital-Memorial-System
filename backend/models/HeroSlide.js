const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    highlightText: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    button1Text: { type: String, trim: true, default: null },
    button1Link: { type: String, trim: true, default: null },
    button2Text: { type: String, trim: true, default: null },
    button2Link: { type: String, trim: true, default: null },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

heroSlideSchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
