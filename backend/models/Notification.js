const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['booking', 'payment', 'memorial', 'comment', 'system', 'alert'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    link: { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
