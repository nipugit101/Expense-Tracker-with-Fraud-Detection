//routes->fraud.js
const express = require('express');
const FraudAlert = require('../models/FraudAlert');
const Transaction = require('../models/Transaction');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/alerts', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = { user: req.user._id };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.severity) {
      filters.severity = req.query.severity;
    }

    const alerts = await FraudAlert.find(filters)
      .populate('transaction', 'amount description category date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FraudAlert.countDocuments(filters);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ message: 'Server error fetching fraud alerts' });
  }
});

router.get('/alerts/:id', auth, async (req, res) => {
  try {
    const alert = await FraudAlert.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('transaction')
      .populate('reviewedBy', 'firstName lastName email');

    if (!alert) {
      return res.status(404).json({ message: 'Fraud alert not found' });
    }

    res.json({ alert });
  } catch (error) {
    console.error('Get fraud alert error:', error);
    res.status(500).json({ message: 'Server error fetching fraud alert' });
  }
});

router.put('/alerts/:id/review', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['reviewed', 'dismissed', 'confirmed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const alert = await FraudAlert.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!alert) {
      return res.status(404).json({ message: 'Fraud alert not found' });
    }

    alert.status = status;
    alert.notes = notes;
    alert.reviewedBy = req.user._id;
    alert.reviewedAt = new Date();

    await alert.save();

    if (status === 'confirmed') {
      await Transaction.findByIdAndUpdate(alert.transaction, {
        $push: {
          fraudFlags: {
            type: alert.alertType,
            severity: alert.severity,
            message: 'Confirmed by user review',
            flaggedAt: new Date()
          }
        }
      });
    }

    res.json({
      message: 'Fraud alert reviewed successfully',
      alert
    });
  } catch (error) {
    console.error('Review fraud alert error:', error);
    res.status(500).json({ message: 'Server error reviewing fraud alert' });
  }
});

router.get('/summary', auth, async (req, res) => {
  try {
    const summary = await FraudAlert.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentAlerts = await FraudAlert.find({ user: req.user._id })
      .populate('transaction', 'amount description category date')
      .sort({ createdAt: -1 })
      .limit(5);

    const severitySummary = await FraudAlert.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeSummary = await FraudAlert.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$alertType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      summary,
      severitySummary,
      typeSummary,
      recentAlerts
    });
  } catch (error) {
    console.error('Get fraud summary error:', error);
    res.status(500).json({ message: 'Server error fetching fraud summary' });
  }
});

router.get('/admin/alerts', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.severity) {
      filters.severity = req.query.severity;
    }

    const alerts = await FraudAlert.find(filters)
      .populate('user', 'firstName lastName email')
      .populate('transaction', 'amount description category date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await FraudAlert.countDocuments(filters);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get fraud alerts error:', error);
    res.status(500).json({ message: 'Server error fetching fraud alerts' });
  }
});

router.get('/admin/statistics', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAlerts,
      monthlyAlerts,
      weeklyAlerts,
      alertsByType,
      alertsBySeverity,
      topUsers
    ] = await Promise.all([
      FraudAlert.countDocuments(),
      FraudAlert.countDocuments({ createdAt: { $gte: startOfMonth } }),
      FraudAlert.countDocuments({ createdAt: { $gte: startOfWeek } }),
      FraudAlert.aggregate([
        { $group: { _id: '$alertType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      FraudAlert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      FraudAlert.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            count: 1,
            'user.firstName': 1,
            'user.lastName': 1,
            'user.email': 1
          }
        }
      ])
    ]);

    res.json({
      statistics: {
        totalAlerts,
        monthlyAlerts,
        weeklyAlerts
      },
      alertsByType,
      alertsBySeverity,
      topUsers
    });
  } catch (error) {
    console.error('Admin fraud statistics error:', error);
    res.status(500).json({ message: 'Server error fetching fraud statistics' });
  }
});

module.exports = router;
