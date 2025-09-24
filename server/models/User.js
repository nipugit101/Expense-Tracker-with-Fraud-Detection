// User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    fraudAlerts: {
      type: Boolean,
      default: true
    },
    monthlySpendingLimit: {
      type: Number,
      default: 0
    },
    categoryLimits: {
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      shopping: { type: Number, default: 0 },
      entertainment: { type: Number, default: 0 },
      healthcare: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
