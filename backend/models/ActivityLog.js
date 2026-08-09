const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: String,
      required: true,
      trim: true,
    },
    actorType: {
      type: String,
      enum: ['admin', 'family', 'system'],
      default: 'system',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      trim: true,
      enum: ['booking', 'memorial', 'media', 'comment', 'payment', 'user', 'setting', 'system'],
    },
    resourceId: {
      type: String,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ actor: 1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
