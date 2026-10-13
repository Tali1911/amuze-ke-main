
const AuditLog = require('../models/AuditLog');

/**
 * Log admin actions for auditing purposes
 * @param {string} adminUsername - The admin username
 * @param {string} action - The action performed
 * @param {string} entityType - Type of entity (program, announcement, admin)
 * @param {string} entityId - ID of the entity acted upon
 * @param {string} details - Additional details about the action
 */
const logAdminAction = async (adminUsername, action, entityType, entityId, details) => {
  try {
    await AuditLog.create({
      adminUsername,
      action,
      entityType,
      entityId,
      details
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

module.exports = { logAdminAction };
