// notification controller for transactions
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Function to check budget limits and send notifications
exports.checkBudgetNotifications = async (userId = null, category = null) => {
  try {
    console.log("//...checkBudgetNotifications triggered");

    const now = new Date(); // Get current time
    // If userId & category are provided, check only for affected budgets
    let filter = { endDate: { $gte: now } };
    if (userId) filter.user = userId;
    if (category) filter.category = category;

    const budgets = await Budget.find(filter);

    for (let budget of budgets) {
      const totalSpent = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            type: "expense",
            category: budget.category,
            date: {
              $gte: new Date(budget.startDate),
              $lte: new Date(budget.endDate)
            }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const spent = totalSpent.length > 0 ? totalSpent[0].total : 0;
      const percentageSpent = (spent / budget.amount) * 100;

      // Check if a warning notification already exists
      const existing80Warning = await Notification.findOne({
        user: budget.user,
        budget: budget._id,
        type: 'budget_warning',
        message: { $regex: /80%/ }
      });

      const existing90Warning = await Notification.findOne({
        user: budget.user,
        budget: budget._id,
        type: 'budget_warning',
        message: { $regex: /90%/ }
      });

      // Check if an exceeded notification already exists
      const existingExceeded = await Notification.findOne({
        user: budget.user,
        budget: budget._id,
        type: 'budget_exceeded'
      });

      // 80% Warning
      if (percentageSpent >= 80 && percentageSpent < 90 && !existing80Warning) {
        await Notification.create({
          user: budget.user,
          message: `Warning! You have spent 80% of your budget for "${budget.category}".`,
          type: 'budget_warning',
          budget: budget._id
        });
      }

      // 90% Warning
      if (percentageSpent >= 90 && percentageSpent < 100 && !existing90Warning) {
        await Notification.create({
          user: budget.user,
          message: `Warning! You have spent 90% of your budget for "${budget.category}".`,
          type: 'budget_warning',
          budget: budget._id
        });
      }

      // Budget Exceeded (100%)
      if (percentageSpent >= 100 && !existingExceeded) {
        await Notification.create({
          user: budget.user,
          message: `Alert! You have exceeded your budget for "${budget.category}".`,
          type: 'budget_exceeded',
          budget: budget._id
        });
      }
    }

    // Remove old notifications only if they are older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Notification.deleteMany({
      budget: { $nin: budgets.map(b => b._id) },
      createdAt: { $lt: thirtyDaysAgo } // Only delete if older than 30 days
    });


  } catch (error) {
    console.error("Error checking budget notifications:", error.message);
  }
};

// Check for upcoming or missed transactions and create notifications
exports.checkRecurringTransactions = async () => {
  try {
    console.log("//...checkRecurringTransactions triggered");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Find all active recurring transactions
    const transactions = await Transaction.find({ recurring: true });

    for (let transaction of transactions) {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);

      // If recurrenceEndDate exists and has passed, stop notifications
      if (transaction.recurrenceEndDate) {
        const recurrenceEnd = new Date(transaction.recurrenceEndDate);
        recurrenceEnd.setHours(0, 0, 0, 0);
        if (recurrenceEnd < today) {
          continue; // Skip this transaction
        }
      }

      // Properly calculate `nextTransactionDate`
      let nextTransactionDate = new Date(transactionDate);
      while (nextTransactionDate < today) { // Stop at today, NOT exceeding it
        if (transaction.recurrencePattern === 'daily') {
          nextTransactionDate.setDate(nextTransactionDate.getDate() + 1);
        } else if (transaction.recurrencePattern === 'weekly') {
          nextTransactionDate.setDate(nextTransactionDate.getDate() + 7);
        } else if (transaction.recurrencePattern === 'monthly') {
          nextTransactionDate.setMonth(nextTransactionDate.getMonth() + 1);
        }
      }

      // Notify users **BEFORE a transaction is due**
      const reminderDate = new Date(nextTransactionDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Reminder 1 day before

      const existingUpcoming = await Notification.findOne({
        user: transaction.user,
        transaction: transaction._id,
        type: 'upcoming'
      });

      if (reminderDate.getTime() === today.getTime() && !existingUpcoming) {
        await Notification.create({
          user: transaction.user,
          message: `Reminder: Your recurring transaction (${transaction.category}) is due tomorrow.`,
          transaction: transaction._id,
          type: 'upcoming'
        });
      }

      // Notify users **ON the due date**
      const existingDueToday = await Notification.findOne({
        user: transaction.user,
        transaction: transaction._id,
        type: 'due_today'
      });

      if (nextTransactionDate.getTime() === today.getTime() && !existingDueToday) {
        await Notification.create({
          user: transaction.user,
          message: `Your recurring transaction (${transaction.category}) is due today.`,
          transaction: transaction._id,
          type: 'due_today'
        });
      }

      // Notify users **if they missed a transaction**
      const existingMissed = await Notification.findOne({
        user: transaction.user,
        transaction: transaction._id,
        type: 'missed',
        createdAt: { $lt: today } // Any past missed transactions
      });

      if (transactionDate < today && !existingMissed) {
        await Notification.create({
          user: transaction.user,
          message: `You missed a recurring transaction (${transaction.category}).`,
          transaction: transaction._id,
          type: 'missed'
        });
      }
    }

    // Delete notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });

  } catch (error) {
    console.error("Error checking recurring transactions:", error.message);
  }
};



// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    console.log("//...getNotifications function called!"); // for debugging purpose 

    const filter = { user: req.user.id };

    // If `?all=true` is passed, return all notifications
    if (req.query.all !== 'true') {
      filter.isRead = false; // Default: Show only unread notifications
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

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
