const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question:   { type: String, required: true, trim: true },
    answer:     { type: String, required: true, trim: true },
    category:   { type: String, trim: true, default: 'general' },
    sortOrder:  { type: Number, default: 0 },
    active:     { type: Boolean, default: true },
  },
  { timestamps: true },
);

faqSchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
