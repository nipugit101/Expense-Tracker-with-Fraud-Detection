// routes-> transcation.js
const express = require('express');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { transactionValidation } = require('../middleware/validation');
const { checkFraudRules } = require('../utils/fraudDetection');
const { categorizeTransactionAI } = require('../utils/aiService');

const router = express.Router();

router.post('/', auth, transactionValidation, async (req, res) => {
  try {
    const { type, amount, description, category, subcategory, date, location, paymentMethod, merchant, tags, notes } = req.body;

    let finalCategory = category;
    let aiCategorized = false;
    let confidence = 0;

    if (category === 'other') {
      try {
        const aiResult = await categorizeTransactionAI(description, merchant, amount);
        if (aiResult && aiResult.confidence > 0.7) {
          finalCategory = aiResult.category;
          aiCategorized = true;
          confidence = aiResult.confidence;
        }
      } catch (aiError) {
        console.log('AI categorization failed, using manual category');
      }
    }

    const transaction = new Transaction({
      user: req.user._id,
      type,
      amount,
      description,
      category: finalCategory,
      subcategory,
      date: date ? new Date(date) : new Date(),
      location,
      paymentMethod,
      merchant,
      tags,
      notes,
      aiCategorized,
      confidence
    });

    await transaction.save();

    await checkFraudRules(transaction, req.user);

    await transaction.populate('user', 'firstName lastName email');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = { user: req.user._id };

    if (req.query.type) {
      filters.type = req.query.type;
    }

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.startDate && req.query.endDate) {
      filters.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.minAmount || req.query.maxAmount) {
      filters.amount = {};
      if (req.query.minAmount) filters.amount.$gte = parseFloat(req.query.minAmount);
      if (req.query.maxAmount) filters.amount.$lte = parseFloat(req.query.maxAmount);
    }

    if (req.query.search) {
      filters.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { merchant: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const transactions = await Transaction.find(filters)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email');

    const total = await Transaction.countDocuments(filters);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'firstName lastName email');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error fetching transaction' });
  }
});

router.put('/:id', auth, transactionValidation, async (req, res) => {
  try {
    const { type, amount, description, category, subcategory, date, location, paymentMethod, merchant, tags, notes } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.type = type;
    transaction.amount = amount;
    transaction.description = description;
    transaction.category = category;
    transaction.subcategory = subcategory;
    transaction.date = date ? new Date(date) : transaction.date;
    transaction.location = location;
    transaction.paymentMethod = paymentMethod;
    transaction.merchant = merchant;
    transaction.tags = tags;
    transaction.notes = notes;

    await transaction.save();

    await checkFraudRules(transaction, req.user);

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error updating transaction' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
});

router.get('/categories/spending', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const spending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json({ spending });
  } catch (error) {
    console.error('Get category spending error:', error);
    res.status(500).json({ message: 'Server error fetching category spending' });
  }
});

module.exports = router;
