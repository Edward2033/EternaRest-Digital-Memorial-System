const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    message: { type: String, required: true, trim: true },
    approved: { type: Boolean, default: false },
    approvedBy: { type: String, trim: true, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ approved: 1, sortOrder: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
