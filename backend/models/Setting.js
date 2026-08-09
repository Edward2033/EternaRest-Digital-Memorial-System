const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    group: {
      type: String,
      trim: true,
      default: 'general',
      enum: ['general', 'email', 'payment', 'memorial', 'notifications', 'seo', 'social', 'appearance', 'pages'],
    },
    description: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

settingSchema.index({ key: 1 });
settingSchema.index({ group: 1 });

module.exports = mongoose.model('Setting', settingSchema);
