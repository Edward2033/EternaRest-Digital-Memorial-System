const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    // Human-readable QR identifier  e.g. QR-MEM-000001
    qrId: {
      type:   String,
      unique: true,
      sparse: true,
      trim:   true,
    },
    // bookingId string (backward compat)
    bookingId: {
      type:     String,
      required: true,
      unique:   true,
      ref:      'Booking',
      trim:     true,
    },
    // memorialId string  e.g. MEM-000001
    memorialId: {
      type:  String,
      unique: true,
      sparse: true,
      trim:  true,
    },
    // ObjectId ref to Memorial document
    memorialRef: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Memorial',
      default: null,
    },
    // Cloudinary (or local) URL of the QR PNG image
    qrCodeImage: {
      type:     String,
      required: true,
    },
    // Alias kept for backward compat
    qrCodeUrl: {
      type:    String,
      default: null,
    },
    // The URL encoded inside the QR (public memorial page)
    publicUrl: {
      type:     String,
      required: true,
    },
    // Kept for backward compat
    memorialUrl: {
      type:    String,
      default: null,
    },
    status: {
      type:    String,
      enum:    ['active', 'inactive', 'regenerated'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Auto-generate qrId from memorialId before save
qrCodeSchema.pre('save', function (next) {
  if (!this.qrId && this.memorialId) {
    this.qrId = `QR-${this.memorialId}`;
  }
  // Keep aliases in sync
  if (!this.qrCodeUrl)   this.qrCodeUrl   = this.qrCodeImage;
  if (!this.memorialUrl) this.memorialUrl = this.publicUrl;
  next();
});

qrCodeSchema.index({ qrId:       1 });
qrCodeSchema.index({ bookingId:  1 });
qrCodeSchema.index({ memorialId: 1 });
qrCodeSchema.index({ memorialRef:1 });

module.exports = mongoose.model('QRCode', qrCodeSchema);
