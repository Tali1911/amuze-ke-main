
const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['galleryEnabled', 'testimonialsEnabled', 'blogEnabled', 'showRecruitment']
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feature', FeatureSchema);
