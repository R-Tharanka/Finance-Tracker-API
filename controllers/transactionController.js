const Transaction = require('../models/Transaction');

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

    res.status(201).json({ message: "Transaction created successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all transactions for the authenticated user
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // Ensure only user's transactions are fetched

    const query = { user: userId };

    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update a transaction (Only Owner Can Update)
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find transaction and ensure user owns it
    const transaction = await Transaction.findOne({ _id: id, user: userId });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found or unauthorized" });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true });

    res.json({ message: "Transaction updated successfully", transaction: updatedTransaction });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a transaction (Only Owner Can Delete)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Ensure user owns the transaction before deleting
    const transaction = await Transaction.findOne({ _id: id, user: userId });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found or unauthorized" });
    }

    await Transaction.findByIdAndDelete(id);
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
