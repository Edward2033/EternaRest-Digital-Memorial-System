const mongoose = require('mongoose');

const generateMemorialId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MEM-${ts}-${rnd}`;
};

const timelineEventSchema = new mongoose.Schema(
  {
    year: { type: Number },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const memorialSchema = new mongoose.Schema(
  {
    // Human-readable memorial ID
    memorialId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    // bookingId string kept for backward compat with existing controllers
    bookingId: {
      type: String,
      required: true,
      ref: 'Booking',
      index: true,
    },
    // ObjectId reference added for new queries
    bookingRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    // fullName as alias — deceasedName kept for backward compat
    deceasedName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    dateOfDeath: {
      type: Date,
      required: true,
    },
    biography: {
      type: String,
      trim: true,
    },
    familyInformation: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    // Existing media ref array preserved
    media: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    // Gallery image URLs (simple array for CMS use)
    gallery: {
      type: [String],
      default: [],
    },
    // Video URLs
    videos: {
      type: [String],
      default: [],
    },
    // Timeline of life events
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
    // QR reference
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRCode',
      default: null,
    },
    // Existing tributes array preserved
    tributes: [
      {
        name: String,
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
    // isPublic kept for backward compat; status is the canonical field
    isPublic: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate memorialId if not set
memorialSchema.pre('save', function (next) {
  if (!this.memorialId) {
    this.memorialId = generateMemorialId();
  }
  // Keep isPublic in sync with status for backward compat
  this.isPublic = this.status === 'published';
  next();
});

memorialSchema.index({ bookingId: 1 });
memorialSchema.index({ memorialId: 1 });
memorialSchema.index({ status: 1 });
memorialSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Memorial', memorialSchema);
