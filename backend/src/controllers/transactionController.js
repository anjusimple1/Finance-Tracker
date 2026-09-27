const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const fallbackStore = require('../store/fallbackStore');

const buildQuery = (req) => ({ _id: req.params.id, userId: req.user._id });
const isDbReady = () => mongoose.connection.readyState === 1;

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * GET /api/transactions
 */
const getTransactions = async (req, res) => {
  try {
    const transactions = isDbReady()
      ? await Transaction.find({ userId: req.user._id }).sort({ date: -1 }).lean()
      : await fallbackStore.listTransactionsForUser(req.user._id);

    res.json({
      success: true,
      data: transactions.map((t) => ({
        id: t._id,
        userId: t.userId,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
};

/**
 * POST /api/transactions
 */
const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date } = req.body;

    if (amount === undefined || amount === null || Number(amount) < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense' });
    }
    if (!category?.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    let transactionDate = new Date();
    if (date !== undefined && date !== null && date !== '') {
      const parsed = parseDate(date);
      if (!parsed) {
        return res.status(400).json({ success: false, message: 'Invalid date' });
      }
      transactionDate = parsed;
    }

    const transaction = isDbReady()
      ? await Transaction.create({
          userId: req.user._id,
          amount: Number(amount),
          type,
          category: category.trim(),
          date: transactionDate,
        })
      : await fallbackStore.createTransaction({
          userId: req.user._id,
          amount: Number(amount),
          type,
          category: category.trim(),
          date: transactionDate,
        });

    res.status(201).json({
      success: true,
      data: {
        id: transaction._id,
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('createTransaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
};

/**
 * PUT /api/transactions/:id
 */
const updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, date } = req.body;
    const updates = {};

    if (amount !== undefined) {
      if (Number(amount) < 0) {
        return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
      }
      updates.amount = Number(amount);
    }
    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Type must be income or expense' });
      }
      updates.type = type;
    }
    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({ success: false, message: 'Category cannot be empty' });
      }
      updates.category = String(category).trim();
    }
    if (date !== undefined) {
      const parsed = parseDate(date);
      if (!parsed) {
        return res.status(400).json({ success: false, message: 'Invalid date' });
      }
      updates.date = parsed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const transaction = isDbReady()
      ? await Transaction.findOneAndUpdate(buildQuery(req), updates, {
          new: true,
          runValidators: true,
        })
      : await fallbackStore.updateTransactionById(req.params.id, req.user._id, updates);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: {
        id: transaction._id,
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid transaction id' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('updateTransaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
};

/**
 * DELETE /api/transactions/:id
 */
const deleteTransaction = async (req, res) => {
  try {
    const transaction = isDbReady()
      ? await Transaction.findOneAndDelete(buildQuery(req))
      : await fallbackStore.deleteTransactionById(req.params.id, req.user._id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction removed' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid transaction id' });
    }
    console.error('deleteTransaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
