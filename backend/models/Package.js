const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      enum: ['essential', 'standard', 'premium', 'legacy'],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      trim: true,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    maxMediaUploads: {
      type: Number,
      default: 10,
    },
    maxTributes: {
      type: Number,
      default: 50,
    },
    durationDays: {
      type: Number,
      default: 365,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    // isActive kept for backward compat
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

packageSchema.pre('save', function (next) {
  this.isActive = this.status === 'active';
  next();
});

packageSchema.index({ name: 1 });
packageSchema.index({ status: 1 });
packageSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Package', packageSchema);
