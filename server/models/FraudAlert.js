// FraudAlter.js
const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  alertType: {
    type: String,
    enum: ['high_amount', 'category_limit', 'unusual_pattern', 'suspicious_activity'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    threshold: Number,
    actualAmount: Number,
    category: String,
    timeframe: String
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'confirmed'],
    default: 'pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

fraudAlertSchema.index({ user: 1, createdAt: -1 });
fraudAlertSchema.index({ status: 1 });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
