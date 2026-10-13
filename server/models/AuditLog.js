
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  adminUsername: {
    type: String,
    required: [true, 'Please add an admin username'],
    trim: true
  },
  action: {
    type: String,
    required: [true, 'Please add an action']
  },
  entityType: {
    type: String,
    required: [true, 'Please add an entity type'],
    enum: ['program', 'announcement', 'admin']
  },
  entityId: {
    type: String,
    required: [true, 'Please add an entity ID']
  },
  details: {
    type: String,
    required: [true, 'Please add details']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
