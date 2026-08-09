const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: '' },
    features: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    image: { type: String, default: null },
    gallery: { type: [String], default: [] },
    faq: {
      type: [
        {
          question: { type: String, required: true, trim: true },
          answer: { type: String, required: true, trim: true },
          _id: false,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ status: 1, sortOrder: 1 });

module.exports = mongoose.model('Service', serviceSchema);
