const ActivityLog = require('../models/ActivityLog');

async function logActivity(actor, actorType, action, resourceType, resourceId, details = {}) {
  try {
    await ActivityLog.create({ actor, actorType, action, resourceType, resourceId, details });
  } catch (err) {
    // Never let logging break main operations
    console.error('⚠️ Activity log failed (non-fatal):', err.message);
  }
}

module.exports = { logActivity };
