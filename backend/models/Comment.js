const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    // bookingId kept for backward compat
    bookingId: {
      type: String,
      required: true,
      ref: 'Booking',
      index: true,
    },
    // memorialId ObjectId for new queries
    memorialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memorial',
      default: null,
    },
    // authorName kept for backward compat
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    // name alias (same field, for CMS compatibility)
    name: {
      type: String,
      trim: true,
    },
    authorEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    // status kept for backward compat
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    // isApproved boolean kept for backward compat
    isApproved: {
      type: Boolean,
      default: false,
    },
    // approved boolean for CMS compatibility
    approved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: String,
      trim: true,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Keep boolean flags in sync with status
commentSchema.pre('save', function (next) {
  const isApproved = this.status === 'approved';
  this.isApproved = isApproved;
  this.approved = isApproved;
  if (!this.name && this.authorName) this.name = this.authorName;
  next();
});

commentSchema.index({ bookingId: 1, status: 1 });
commentSchema.index({ memorialId: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
