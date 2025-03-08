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

      // --- Budget Adjustment Recommendations ---
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const existingRecentRecommendation = await Notification.findOne({
        user: budget.user,
        budget: budget._id,
        type: 'budget_adjustment',
        createdAt: { $gte: thirtyDaysAgo } // Only check recent notifications
      });


      const daysRemaining = Math.ceil((new Date(budget.endDate) - now) / (1000 * 60 * 60 * 24));

      // If spending is consistently above 120%, suggest increasing the budget
      if (percentageSpent >= 120 && !existingRecentRecommendation) {
        console.log(`//...Budget Increase Recommendation Triggered: ${budget.category}`);
        await Notification.create({
          user: budget.user,
          message: `Recommendation: Consider increasing your budget for "${budget.category}". Your spending is significantly exceeding the allocated budget.`,
          type: 'budget_adjustment',
          budget: budget._id
        });
      }

      // If spending is below 50% near the end of the budget period, suggest decreasing the budget
      if (percentageSpent < 50 && daysRemaining <= 5 && !existingRecentRecommendation) {
        console.log(`//...Budget Decrease Recommendation Triggered: ${budget.category}`);
        await Notification.create({
          user: budget.user,
          message: `Recommendation: Consider decreasing your budget for "${budget.category}". Your spending is much lower than expected.`,
          type: 'budget_adjustment',
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
        if (recurrenceEnd < today) continue;
      }

      // Properly calculate `nextTransactionDate`
      let nextTransactionDate = new Date(transactionDate);
      let lastTransactionDate = new Date(transactionDate);
      while (nextTransactionDate < today) {
        lastTransactionDate = new Date(nextTransactionDate); // Store last valid transaction date
        if (transaction.recurrencePattern === 'daily') {
          nextTransactionDate.setDate(nextTransactionDate.getDate() + 1);
        } else if (transaction.recurrencePattern === 'weekly') {
          nextTransactionDate.setDate(nextTransactionDate.getDate() + 7);
        } else if (transaction.recurrencePattern === 'monthly') {
          nextTransactionDate.setMonth(nextTransactionDate.getMonth() + 1);
        }
      }

      // Notify users BEFORE a transaction is due
      const reminderDate = new Date(nextTransactionDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(0, 0, 0, 0); // Normalize time

      const existingUpcoming = await Notification.findOne({
        user: transaction.user,
        transaction: transaction._id,
        type: 'upcoming',
        createdAt: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
      });

      if (reminderDate.getTime() === today.getTime() && !existingUpcoming) {
        await Notification.create({
          user: transaction.user,
          message: `Reminder: Your recurring transaction (${transaction.category}) is due tomorrow.`,
          transaction: transaction._id,
          type: 'upcoming'
        });
      }

      // Notify users ON the due date
      const existingDueToday = await Notification.findOne({
        user: transaction.user,
        transaction: transaction._id,
        type: 'due_today',
        createdAt: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
      });

      if (nextTransactionDate.getTime() === today.getTime() && !existingDueToday) {
        await Notification.create({
          user: transaction.user,
          message: `Your recurring transaction (${transaction.category}) is due today.`,
          transaction: transaction._id,
          type: 'due_today'
        });
      }

      // Prevent duplicate "missed" notifications and only trigger when necessary
      const existingMissed = await Notification.findOne({
        user: transaction.user,
        transaction: transaction._id,
        type: 'missed'
      });

      if (lastTransactionDate.getTime() === today.getTime() - 86400000 && !existingMissed) {
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
    await Notification.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });

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
