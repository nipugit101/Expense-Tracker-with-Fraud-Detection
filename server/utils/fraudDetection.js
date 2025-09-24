// utils.js -> fraudDetection.js 
const FraudAlert = require('../models/FraudAlert');
const Transaction = require('../models/Transaction');
const { sendFraudAlertEmail } = require('./email');

const checkFraudRules = async (transaction, user) => {
  try {
    const alerts = [];

    const highAmountAlert = await checkHighAmountRule(transaction, user);
    if (highAmountAlert) alerts.push(highAmountAlert);

    const categoryLimitAlert = await checkCategoryLimitRule(transaction, user);
    if (categoryLimitAlert) alerts.push(categoryLimitAlert);

    const frequentTransactionsAlert = await checkFrequentTransactionsRule(transaction, user);
    if (frequentTransactionsAlert) alerts.push(frequentTransactionsAlert);

    const unusualTimeAlert = await checkUnusualTimeRule(transaction, user);
    if (unusualTimeAlert) alerts.push(unusualTimeAlert);

    for (const alertData of alerts) {
      const alert = new FraudAlert({
        user: user._id,
        transaction: transaction._id,
        alertType: alertData.type,
        severity: alertData.severity,
        message: alertData.message,
        details: alertData.details
      });

      await alert.save();

      if (user.preferences.fraudAlerts && user.preferences.emailNotifications) {
        try {
          await sendFraudAlertEmail(user.email, alert, transaction);
          alert.emailSent = true;
          alert.emailSentAt = new Date();
          await alert.save();
        } catch (emailError) {
          console.error('Failed to send fraud alert email:', emailError);
        }
      }

      transaction.fraudFlags.push({
        type: alertData.type,
        severity: alertData.severity,
        message: alertData.message,
        flaggedAt: new Date()
      });
    }

    if (alerts.length > 0) {
      await transaction.save();
    }

    return alerts;
  } catch (error) {
    console.error('Fraud detection error:', error);
    return [];
  }
};

const checkHighAmountRule = async (transaction, user) => {
  if (transaction.type !== 'expense') return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const avgMonthlySpending = await Transaction.aggregate([
    {
      $match: {
        user: user._id,
        type: 'expense',
        date: { $lt: startOfMonth }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        avgSpending: { $avg: '$total' }
      }
    }
  ]);

  const avgSpending = avgMonthlySpending[0]?.avgSpending || 0;
  const threshold = avgSpending * 0.1;

  if (avgSpending > 0 && transaction.amount > threshold) {
    return {
      type: 'high_amount',
      severity: transaction.amount > threshold * 2 ? 'high' : 'medium',
      message: `High amount transaction: $${transaction.amount.toFixed(2)} exceeds typical spending pattern`,
      details: {
        threshold,
        actualAmount: transaction.amount
      }
    };
  }

  return null;
};

const checkCategoryLimitRule = async (transaction, user) => {
  if (transaction.type !== 'expense') return null;

  const categoryLimit = user.preferences.categoryLimits[transaction.category];
  if (!categoryLimit || categoryLimit === 0) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlySpending = await Transaction.aggregate([
    {
      $match: {
        user: user._id,
        type: 'expense',
        category: transaction.category,
        date: { $gte: startOfMonth, $lte: transaction.date }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const totalSpent = monthlySpending[0]?.total || 0;
  const percentage = (totalSpent / categoryLimit) * 100;

  if (percentage > 100) {
    return {
      type: 'category_limit',
      severity: percentage > 150 ? 'high' : 'medium',
      message: `Category limit exceeded: $${totalSpent.toFixed(2)} spent in ${transaction.category} (limit: $${categoryLimit})`,
      details: {
        threshold: categoryLimit,
        actualAmount: totalSpent,
        category: transaction.category,
        percentage: Math.round(percentage)
      }
    };
  } else if (percentage > 80) {
    return {
      type: 'category_limit',
      severity: 'low',
      message: `Approaching category limit: ${Math.round(percentage)}% of ${transaction.category} budget used`,
      details: {
        threshold: categoryLimit,
        actualAmount: totalSpent,
        category: transaction.category,
        percentage: Math.round(percentage)
      }
    };
  }

  return null;
};

const checkFrequentTransactionsRule = async (transaction, user) => {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentTransactions = await Transaction.countDocuments({
    user: user._id,
    date: { $gte: hourAgo },
    _id: { $ne: transaction._id }
  });

  if (recentTransactions >= 5) {
    return {
      type: 'frequent_transactions',
      severity: recentTransactions >= 10 ? 'high' : 'medium',
      message: `${recentTransactions + 1} transactions in the last hour - unusually high frequency`,
      details: {
        threshold: 5,
        actualAmount: recentTransactions + 1,
        timeframe: '1 hour'
      }
    };
  }

  return null;
};

const checkUnusualTimeRule = async (transaction, user) => {
  const transactionHour = transaction.date.getHours();

  if (transactionHour < 6 || transactionHour > 23) {
    const recentNightTransactions = await Transaction.countDocuments({
      user: user._id,
      $expr: {
        $and: [
          { $gte: [{ $hour: '$date' }, 0] },
          { $lt: [{ $hour: '$date' }, 6] }
        ]
      },
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    if (recentNightTransactions <= 2) {
      return {
        type: 'unusual_time',
        severity: 'low',
        message: `Transaction at unusual time: ${transactionHour}:00`,
        details: {
          hour: transactionHour,
          timeframe: 'night hours (0-6)'
        }
      };
    }
  }

  return null;
};

const calculateRiskScore = async (transaction, user) => {
  let riskScore = 0;

  const alerts = await checkFraudRules(transaction, user);

  alerts.forEach(alert => {
    switch (alert.severity) {
      case 'high':
        riskScore += 30;
        break;
      case 'medium':
        riskScore += 20;
        break;
      case 'low':
        riskScore += 10;
        break;
    }
  });

  if (transaction.amount > 1000) {
    riskScore += 15;
  }

  if (!transaction.merchant || transaction.merchant.trim() === '') {
    riskScore += 5;
  }

  return Math.min(riskScore, 100);
};

const generateFraudReport = async (userId, startDate, endDate) => {
  const alerts = await FraudAlert.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('transaction');

  const summary = {
    totalAlerts: alerts.length,
    highSeverity: alerts.filter(a => a.severity === 'high').length,
    mediumSeverity: alerts.filter(a => a.severity === 'medium').length,
    lowSeverity: alerts.filter(a => a.severity === 'low').length,
    confirmedFraud: alerts.filter(a => a.status === 'confirmed').length,
    dismissed: alerts.filter(a => a.status === 'dismissed').length
  };

  const byType = alerts.reduce((acc, alert) => {
    acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
    return acc;
  }, {});

  const totalFlaggedAmount = alerts
    .filter(a => a.transaction)
    .reduce((sum, alert) => sum + alert.transaction.amount, 0);

  return {
    summary,
    byType,
    totalFlaggedAmount,
    alerts: alerts.map(alert => ({
      id: alert._id,
      type: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      status: alert.status,
      amount: alert.transaction?.amount || 0,
      date: alert.createdAt
    }))
  };
};

module.exports = {
  checkFraudRules,
  calculateRiskScore,
  generateFraudReport,
  checkHighAmountRule,
  checkCategoryLimitRule,
  checkFrequentTransactionsRule,
  checkUnusualTimeRule
};
