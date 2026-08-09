const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['Memorial Sites', 'Niches', 'Events', 'Services'],
    },
    title: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gallerySchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('Gallery', gallerySchema);
