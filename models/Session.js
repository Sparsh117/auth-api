const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  userAgent: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActivity when session is used
sessionSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Add index for automatic expiration after 1 hour of inactivity
sessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 3600 });

// Add index for faster queries
sessionSchema.index({ userId: 1, isValid: 1 });

module.exports = mongoose.model('Session', sessionSchema); 