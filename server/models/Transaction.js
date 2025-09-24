//Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer_in', 'transfer_out'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,

    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'wallet', 'other'],
    default: 'other'
  },
  merchant: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  receipt: {
    url: String,
    filename: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1
    },
    endDate: Date
  },
  transfer: {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferId: String
  },
  fraudFlags: [{
    type: {
      type: String,
      enum: ['high_amount', 'category_limit', 'unusual_time', 'unusual_location', 'frequent_transactions']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    message: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isReviewed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  aiCategorized: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
