const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      enum: ['super_admin', 'admin', 'manager', 'editor', 'viewer', 'family', 'moderator', 'family_member'],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Role', roleSchema);
