const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: { type: String, trim: true, default: null },
    subject: { type: String, trim: true, default: null },
    message: { type: String, required: true, trim: true },
    replied: { type: Boolean, default: false },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: String, trim: true, default: null },
    ipAddress: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

contactSchema.index({ email: 1 });
contactSchema.index({ replied: 1 });
contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
