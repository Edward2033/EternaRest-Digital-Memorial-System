const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      ref: 'Booking',
      index: true,
    },
    memorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memorial',
      index: true,
    },
    // type kept for backward compat with existing controller
    type: {
      type: String,
      enum: ['photo', 'video', 'document'],
      required: true,
    },
    // fileType alias for CMS
    fileType: {
      type: String,
      enum: ['image', 'video', 'document'],
      default: null,
    },
    // url kept for backward compat
    url: {
      type: String,
      required: true,
    },
    // fileUrl alias
    fileUrl: {
      type: String,
      default: null,
    },
    filename: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    cloudinaryId: {
      type: String,
      trim: true,
      default: null,
    },
    uploadedBy: {
      type: String,
      trim: true,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Keep fileType and fileUrl in sync with type and url
mediaSchema.pre('save', function (next) {
  if (!this.fileType) {
    this.fileType = this.type === 'photo' ? 'image' : this.type;
  }
  if (!this.fileUrl) {
    this.fileUrl = this.url;
  }
  next();
});

mediaSchema.index({ bookingId: 1 });
mediaSchema.index({ memorialId: 1 });
mediaSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
