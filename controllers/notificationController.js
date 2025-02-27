// notification controller for transactions

const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Check for upcoming or missed transactions and create notifications
exports.checkRecurringTransactions = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Find all active recurring transactions
    const transactions = await Transaction.find({ recurring: true });

    for (let transaction of transactions) {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);

      const nextTransactionDate = new Date(transactionDate);

      // Determine the next due date based on recurrencePattern
      if (transaction.recurrencePattern === 'daily') {
        nextTransactionDate.setDate(transactionDate.getDate() + 1);
      } else if (transaction.recurrencePattern === 'weekly') {
        nextTransactionDate.setDate(transactionDate.getDate() + 7);
      } else if (transaction.recurrencePattern === 'monthly') {
        nextTransactionDate.setMonth(transactionDate.getMonth() + 1);
      }

      // Check if transaction is due today (upcoming)
      if (nextTransactionDate.getTime() === today.getTime()) {
        await Notification.create({
          user: transaction.user,
          message: `Your recurring transaction (${transaction.category}) is due today.`,
          transaction: transaction._id,
          type: 'upcoming'
        });
      }

      // Check if transaction was missed
      if (transactionDate.getTime() < today.getTime()) {
        await Notification.create({
          user: transaction.user,
          message: `You missed a recurring transaction (${transaction.category}).`,
          transaction: transaction._id,
          type: 'missed'
        });
      }
    }
  } catch (error) {
    console.error("Error checking recurring transactions:", error.message);
  }
};

// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    console.log("//...getNotifications function called!"); // for debugging purpose 

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Mark a notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
