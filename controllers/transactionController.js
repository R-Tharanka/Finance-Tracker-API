const Transaction = require('../models/Transaction');
const AdminLog = require('../models/AdminLog');
const { checkBudgetNotifications } = require('./notificationController');
const { allocateSavings } = require('./savingsController');


// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.id; // Always use req.user.id from authentication middleware

    const { amount, type, category, description, date, tags, recurring, recurrencePattern, recurrenceEndDate } = req.body;

    if (!amount || !type || !category) {
      return res.status(400).json({ message: "Amount, type, and category are required." });
    }

    const transaction = await Transaction.create({
      user: userId,
      amount,
      type,
      category,
      description,
      date,
      tags,
      recurring,
      recurrencePattern,
      recurrenceEndDate
    });

    // Run budget notification check **without delaying response**
    checkBudgetNotifications(userId, category); // Do not use await here

    // If the transaction is income, allocate savings automatically
    if (transaction.type === "income") {
      allocateSavings(transaction); // Do not use await to avoid blocking response time
    }

    res.status(201).json({ message: "Transaction created successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get transactions for the authenticated user (Admins can see all)
exports.getTransactions = async (req, res) => {
  try {
    let query = {};

    // If the user is not an admin, only fetch their own transactions
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    // Allow filtering by category, type, and tags
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.tags) {
      query.tags = { $in: req.query.tags.split(',') }; // Allow multiple tags
    }

    // Sorting Logic (default: by date, optional: by tags)
    let sortOption = { date: -1 }; // Default sorting: Newest first

    if (req.query.sortBy === "tags") {
      sortOption = { tags: 1 }; // Sort alphabetically by tags
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'name email role') // Only show safe fields
      .sort(sortOption); // Apply sorting

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Update a transaction (Only Owner or Admin Can Update)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Find transaction
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Allow admin to update any transaction, but users can only update their own
    if (req.user.role !== 'admin' && transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied: You can only update your own transactions." });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true });

    // Log admin action in the database
    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.id,
        action: `Updated transaction ${id}`,
        timestamp: new Date()
      });
    }

    res.json({ message: "Transaction updated successfully", transaction: updatedTransaction });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



// Delete a transaction (Only Owner or Admin Can Delete)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Find transaction
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Allow admin to delete any transaction, but users can only delete their own
    if (req.user.role !== 'admin' && transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied: You can only delete your own transactions." });
    }

    await Transaction.findByIdAndDelete(id);

    // Log admin action in the database
    if (req.user.role === 'admin') {
      await AdminLog.create({
        admin: req.user.id,
        action: `Deleted transaction ${id}`,
        timestamp: new Date()
      });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


