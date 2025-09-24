//routes-> wallet.js 
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { transferValidation } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/balance', auth, async (req, res) => {
  try {
    console.log('Getting balance for user:', req.user._id);
    const user = await User.findById(req.user._id);

    if (!user) {
      console.log('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User wallet:', user.wallet);

    // Ensure wallet exists and has default values
    if (!user.wallet) {
      user.wallet = { balance: 0, currency: 'USD' };
      await user.save();
    }

    res.json({
      balance: user.wallet.balance || 0,
      currency: user.wallet.currency || 'USD'
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Server error fetching balance' });
  }
});

router.post('/add-funds', auth, async (req, res) => {
  try {
    const { amount, description = 'Add funds to wallet' } = req.body;

    console.log('Add funds request:', {
      userId: req.user._id,
      amount,
      amountType: typeof amount,
      description
    });

    // Validate amount
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      console.log('Invalid amount:', amount, 'parsed:', numAmount);
      return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
    }

    if (numAmount > 10000) {
      return res.status(400).json({ message: 'Amount cannot exceed $10,000' });
    }

    const session = await mongoose.startSession();

    try {
      let savedTransaction;
      let updatedUser;

      await session.withTransaction(async () => {
        // Ensure user exists and has wallet initialized
        const currentUser = await User.findById(req.user._id).session(session);
        if (!currentUser) {
          throw new Error('User not found');
        }

        // Initialize wallet if it doesn't exist
        if (!currentUser.wallet) {
          currentUser.wallet = { balance: 0, currency: 'USD' };
          await currentUser.save({ session });
        }

        // Update user wallet balance
        updatedUser = await User.findByIdAndUpdate(
          req.user._id,
          { $inc: { 'wallet.balance': numAmount } },
          { session, new: true }
        );

        console.log('User wallet updated:', updatedUser.wallet);

        // Create transaction record
        const transaction = new Transaction({
          user: req.user._id,
          type: 'income',
          amount: numAmount,
          description,
          category: 'other',
          paymentMethod: 'wallet'
        });

        savedTransaction = await transaction.save({ session });
        console.log('Transaction saved:', savedTransaction._id);
      });

      console.log('Final user balance:', updatedUser.wallet.balance);

      res.json({
        message: 'Funds added successfully',
        balance: updatedUser.wallet.balance,
        transactionId: savedTransaction._id,
        amount: numAmount
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({
      message: 'Server error adding funds',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/transfer', auth, transferValidation, async (req, res) => {
  try {
    const { toEmail, amount, description } = req.body;

    if (toEmail === req.user.email) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ email: toEmail });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (sender.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const transferId = uuidv4();
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await User.findByIdAndUpdate(
          sender._id,
          { $inc: { 'wallet.balance': -amount } },
          { session }
        );

        await User.findByIdAndUpdate(
          recipient._id,
          { $inc: { 'wallet.balance': amount } },
          { session }
        );

        const senderTransaction = new Transaction({
          user: sender._id,
          type: 'transfer_out',
          amount,
          description: `Transfer to ${recipient.firstName} ${recipient.lastName}: ${description}`,
          category: 'transfer',
          paymentMethod: 'wallet',
          transfer: {
            fromUser: sender._id,
            toUser: recipient._id,
            transferId
          }
        });

        const recipientTransaction = new Transaction({
          user: recipient._id,
          type: 'transfer_in',
          amount,
          description: `Transfer from ${sender.firstName} ${sender.lastName}: ${description}`,
          category: 'transfer',
          paymentMethod: 'wallet',
          transfer: {
            fromUser: sender._id,
            toUser: recipient._id,
            transferId
          }
        });

        await senderTransaction.save({ session });
        await recipientTransaction.save({ session });
      });

      const updatedSender = await User.findById(sender._id);

      res.json({
        message: 'Transfer completed successfully',
        transferId,
        balance: updatedSender.wallet.balance,
        recipient: {
          name: `${recipient.firstName} ${recipient.lastName}`,
          email: recipient.email
        }
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Server error processing transfer' });
  }
});

router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log('Getting wallet transactions for user:', req.user._id);

    const transactions = await Transaction.find({
      user: req.user._id,
      type: { $in: ['transfer_in', 'transfer_out'] }
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('transfer.fromUser', 'firstName lastName email')
      .populate('transfer.toUser', 'firstName lastName email');

    const total = await Transaction.countDocuments({
      user: req.user._id,
      type: { $in: ['transfer_in', 'transfer_out'] }
    });

    console.log('Found', transactions.length, 'wallet transactions');

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
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ message: 'Server error fetching wallet transactions' });
  }
});

router.get('/contacts', auth, async (req, res) => {
  try {
    console.log('Getting wallet contacts for user:', req.user._id);

    const transactions = await Transaction.find({
      $or: [
        { user: req.user._id, type: 'transfer_out' },
        { user: req.user._id, type: 'transfer_in' }
      ]
    })
      .populate('transfer.fromUser', 'firstName lastName email')
      .populate('transfer.toUser', 'firstName lastName email')
      .sort({ date: -1 });

    console.log('Found', transactions.length, 'transfer transactions');

    const contactsMap = new Map();

    transactions.forEach(transaction => {
      if (transaction.type === 'transfer_out' && transaction.transfer?.toUser) {
        const contact = transaction.transfer.toUser;
        if (!contactsMap.has(contact.email)) {
          contactsMap.set(contact.email, {
            name: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            lastTransfer: transaction.date
          });
        }
      } else if (transaction.type === 'transfer_in' && transaction.transfer?.fromUser) {
        const contact = transaction.transfer.fromUser;
        if (!contactsMap.has(contact.email)) {
          contactsMap.set(contact.email, {
            name: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            lastTransfer: transaction.date
          });
        }
      }
    });

    const contacts = Array.from(contactsMap.values())
      .sort((a, b) => new Date(b.lastTransfer) - new Date(a.lastTransfer))
      .slice(0, 10);

    console.log('Returning', contacts.length, 'contacts');

    res.json({ contacts });
  } catch (error) {
    console.error('Get wallet contacts error:', error);
    res.status(500).json({ message: 'Server error fetching contacts' });
  }
});

module.exports = router;
