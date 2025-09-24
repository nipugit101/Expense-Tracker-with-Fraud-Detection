// routes->analytics.js 
const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      currentMonthTransactions,
      lastMonthTransactions,
      recentTransactions,
      categorySpending,
      monthlyTrends
    ] = await Promise.all([
      Transaction.find({
        user: req.user._id,
        date: { $gte: startOfMonth }
      }),
      Transaction.find({
        user: req.user._id,
        date: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      Transaction.find({
        user: req.user._id
      }).sort({ date: -1 }).limit(5),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type'
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income' || t.type === 'transfer_in')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense' || t.type === 'transfer_out')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income' || t.type === 'transfer_in')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense' || t.type === 'transfer_out')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeChange = lastMonthIncome ? ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseChange = lastMonthExpenses ? ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

    const user = await User.findById(req.user._id);

    res.json({
      summary: {
        currentMonthIncome: currentIncome,
        currentMonthExpenses: currentExpenses,
        balance: currentIncome - currentExpenses,
        walletBalance: user.wallet.balance,
        incomeChange,
        expenseChange
      },
      categorySpending,
      monthlyTrends,
      recentTransactions
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

router.get('/spending-trends', auth, async (req, res) => {
  try {
    const { period = '6months', category } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const matchConditions = {
      user: req.user._id,
      type: 'expense',
      date: { $gte: startDate }
    };

    if (category && category !== 'all') {
      matchConditions.category = category;
    }

    const trends = await Transaction.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ trends });
  } catch (error) {
    console.error('Spending trends error:', error);
    res.status(500).json({ message: 'Server error fetching spending trends' });
  }
});

router.get('/budget-analysis', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const user = await User.findById(req.user._id);
    const categoryLimits = user.preferences.categoryLimits;
    const monthlyLimit = user.preferences.monthlySpendingLimit;

    const currentSpending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      }
    ]);

    const totalSpent = currentSpending.reduce((sum, cat) => sum + cat.spent, 0);

    const budgetStatus = currentSpending.map(spending => {
      const limit = categoryLimits[spending._id] || 0;
      const percentage = limit > 0 ? (spending.spent / limit) * 100 : 0;

      return {
        category: spending._id,
        spent: spending.spent,
        limit,
        remaining: Math.max(0, limit - spending.spent),
        percentage,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good',
        transactions: spending.transactions
      };
    });

    const overallBudgetStatus = {
      totalSpent,
      monthlyLimit,
      remaining: Math.max(0, monthlyLimit - totalSpent),
      percentage: monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0
    };

    const savingsGoals = await calculateSavingsGoals(req.user._id, totalSpent, user);

    res.json({
      budgetStatus,
      overallBudgetStatus,
      savingsGoals,
      recommendations: generateBudgetRecommendations(budgetStatus, overallBudgetStatus)
    });
  } catch (error) {
    console.error('Budget analysis error:', error);
    res.status(500).json({ message: 'Server error fetching budget analysis' });
  }
});

router.get('/insights', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      monthlyComparison,
      topExpenses,
      spendingPatterns,
      unusualTransactions
    ] = await Promise.all([
      getMonthlyComparison(req.user._id, startOfMonth, startOfLastMonth, endOfLastMonth),
      getTopExpenses(req.user._id, startOfMonth),
      getSpendingPatterns(req.user._id),
      getUnusualTransactions(req.user._id, startOfMonth)
    ]);

    const insights = generateInsights(monthlyComparison, topExpenses, spendingPatterns);

    res.json({
      monthlyComparison,
      topExpenses,
      spendingPatterns,
      unusualTransactions,
      insights
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ message: 'Server error fetching insights' });
  }
});

async function calculateSavingsGoals(userId, currentSpending, user) {
  const monthlyIncome = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: { $in: ['income', 'transfer_in'] },
        date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const income = monthlyIncome[0]?.total || 0;
  const savingsRate = income > 0 ? ((income - currentSpending) / income) * 100 : 0;

  return {
    currentSavingsRate: savingsRate,
    recommendedSavingsRate: 20,
    potentialSavings: income * 0.2,
    actualSavings: income - currentSpending
  };
}

function generateBudgetRecommendations(budgetStatus, overallStatus) {
  const recommendations = [];

  if (overallStatus.percentage > 90) {
    recommendations.push({
      type: 'warning',
      message: 'You\'re close to exceeding your monthly budget. Consider reducing spending in top categories.'
    });
  }

  const overBudgetCategories = budgetStatus.filter(cat => cat.status === 'over');
  if (overBudgetCategories.length > 0) {
    recommendations.push({
      type: 'alert',
      message: `You've exceeded budget in: ${overBudgetCategories.map(cat => cat.category).join(', ')}`
    });
  }

  const highSpendingCategories = budgetStatus
    .filter(cat => cat.percentage > 80 && cat.percentage <= 100)
    .sort((a, b) => b.percentage - a.percentage);

  if (highSpendingCategories.length > 0) {
    recommendations.push({
      type: 'tip',
      message: `Watch your spending in: ${highSpendingCategories[0].category}. You've used ${Math.round(highSpendingCategories[0].percentage)}% of your budget.`
    });
  }

  return recommendations;
}

async function getMonthlyComparison(userId, startOfMonth, startOfLastMonth, endOfLastMonth) {
  const [currentMonth, lastMonth] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ])
  ]);

  return { currentMonth, lastMonth };
}

async function getTopExpenses(userId, startOfMonth) {
  return Transaction.find({
    user: userId,
    type: 'expense',
    date: { $gte: startOfMonth }
  })
    .sort({ amount: -1 })
    .limit(5)
    .select('description amount category date merchant');
}

async function getSpendingPatterns(userId) {
  const patterns = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense' } },
    {
      $group: {
        _id: {
          dayOfWeek: { $dayOfWeek: '$date' },
          hour: { $hour: '$date' }
        },
        avgAmount: { $avg: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return patterns;
}

async function getUnusualTransactions(userId, startOfMonth) {
  const avgSpending = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $lt: startOfMonth }
      }
    },
    {
      $group: {
        _id: '$category',
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);

  const avgMap = new Map(avgSpending.map(item => [item._id, item.avgAmount]));

  const unusualTransactions = await Transaction.find({
    user: userId,
    type: 'expense',
    date: { $gte: startOfMonth }
  });

  return unusualTransactions.filter(transaction => {
    const categoryAvg = avgMap.get(transaction.category);
    return categoryAvg && transaction.amount > categoryAvg * 2;
  });
}

function generateInsights(monthlyComparison, topExpenses, spendingPatterns) {
  const insights = [];

  if (topExpenses.length > 0) {
    const topCategory = topExpenses[0].category;
    insights.push({
      type: 'spending',
      message: `Your largest expense this month was in ${topCategory}: $${topExpenses[0].amount.toFixed(2)}`
    });
  }

  if (spendingPatterns.length > 0) {
    const topPattern = spendingPatterns[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push({
      type: 'pattern',
      message: `You spend most frequently on ${dayNames[topPattern._id.dayOfWeek - 1]} around ${topPattern._id.hour}:00`
    });
  }

  return insights;
}

router.get('/export', auth, async (req, res) => {
  try {
    const { timeRange = 'month', format = 'csv' } = req.query;

    console.log('Export request:', { userId: req.user._id, timeRange, format });

    // Calculate date range
    let startDate;
    const now = new Date();

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get transactions for the specified period
    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    if (format === 'csv') {
      // Generate CSV content
      const csvHeader = 'Date,Type,Amount,Category,Description,Payment Method,Merchant\n';
      const csvRows = transactions.map(transaction => {
        const date = transaction.date.toISOString().split('T')[0];
        const type = transaction.type;
        const amount = transaction.amount.toFixed(2);
        const category = transaction.category || '';
        const description = (transaction.description || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues
        const paymentMethod = transaction.paymentMethod || '';
        const merchant = (transaction.merchant || '').replace(/,/g, ';');

        return `${date},${type},${amount},${category},"${description}",${paymentMethod},"${merchant}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-${timeRange}-${now.toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        timeRange,
        exportDate: now.toISOString(),
        transactionCount: transactions.length,
        transactions: transactions.map(t => ({
          date: t.date,
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          paymentMethod: t.paymentMethod,
          merchant: t.merchant
        }))
      });
    }
  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({ message: 'Server error exporting transactions' });
  }
});

module.exports = router;
