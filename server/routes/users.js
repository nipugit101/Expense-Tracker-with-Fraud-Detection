//route->users.js
const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

router.put('/preferences', auth, async (req, res) => {
  try {
    const { emailNotifications, fraudAlerts, monthlySpendingLimit, categoryLimits } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'preferences.emailNotifications': emailNotifications,
        'preferences.fraudAlerts': fraudAlerts,
        'preferences.monthlySpendingLimit': monthlySpendingLimit,
        'preferences.categoryLimits': categoryLimits
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Server error deactivating account' });
  }
});

router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = {};

    if (req.query.search) {
      filters.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(filters)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filters);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

router.put('/admin/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

module.exports = router;
