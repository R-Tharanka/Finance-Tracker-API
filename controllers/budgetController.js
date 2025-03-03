const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


// Function to calculate `endDate` based on `period`
const calculateEndDate = (startDate, period) => {
  const date = new Date(startDate);

  if (period === 'daily') date.setDate(date.getDate() + 1);
  else if (period === 'weekly') date.setDate(date.getDate() + 7);
  else if (period === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (period === 'yearly') date.setFullYear(date.getFullYear() + 1);

  return date;
};

// Create a new budget
exports.createBudget = async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!amount || !period) {
      return res.status(400).json({ message: "Amount and period are required." });
    }

    let validStartDate = startDate ? new Date(startDate) : new Date();  // Default to today
    let finalEndDate;

    // Case 1: Both `startDate` and `endDate` provided → Use them directly
    if (startDate && endDate) {
      finalEndDate = new Date(endDate);
    }
    // Case 2: `startDate` provided, but no `endDate` → Auto-calculate `endDate`
    else if (startDate && !endDate) {
      finalEndDate = calculateEndDate(validStartDate, period);
    }
    // Case 3: `endDate` provided, but no `startDate` → Reject request
    else if (!startDate && endDate) {
      return res.status(400).json({ message: "Start date is required if you provide an end date." });
    }
    // Case 4: Neither `startDate` nor `endDate` provided → Default to today & auto-calculate `endDate`
    else {
      finalEndDate = calculateEndDate(validStartDate, period);
    }

    // Validate that `startDate` is not after `endDate`
    if (validStartDate > finalEndDate) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    // **Check for existing budgets in the same period**
    const overlappingBudget = await Budget.findOne({
      user: userId,
      category: category || null,
      period: period,
      $or: [
        { startDate: { $lte: finalEndDate }, endDate: { $gte: validStartDate } } // Overlapping period
      ]
    });

    if (overlappingBudget) {
      return res.status(400).json({
        message: "A budget with the same category and overlapping period already exists. Please update the existing budget instead."
      });
    }

    // Save to database (General Budget: category = null)
    const budget = await Budget.create({
      user: userId,
      category: category || null,  // Allow general budgets
      amount,
      period,
      startDate: validStartDate,
      endDate: finalEndDate
    });

    res.status(201).json({ message: "Budget created successfully", budget });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// Get all budgets for a user
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.find({ user: userId }).sort({ startDate: 1 });

    // Ensure "General" label is shown for general budgets
    const formattedBudgets = budgets.map(budget => ({
      ...budget.toObject(),
      category: budget.category || "General"
    }));

    res.json({ budgets: formattedBudgets });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// Update a budget
exports.updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);

    if (!budget || budget.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // If category is being updated, allow it to be set to null (General Budget)
    if (req.body.category === "") {
      req.body.category = null;
    }

    const updatedBudget = await Budget.findByIdAndUpdate(id, req.body, { new: true });

    res.json({ message: "Budget updated successfully", budget: updatedBudget });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// Delete a budget
exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);

    if (!budget || budget.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied" });
    }

    await Budget.findByIdAndDelete(id);
    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};




exports.trackBudgetUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.find({ user: userId });

    const budgetUsage = await Promise.all(
      budgets.map(async (budget) => {
        let query = {
          user: new ObjectId(userId),
          type: "expense",  // Ensure only track expenses (not income)
          date: {
            $gte: new Date(budget.startDate),
            $lte: new Date(budget.endDate)
          }
        };

        // Ensure category is valid before applying regex
        if (typeof budget.category === 'string' && budget.category.trim().length > 0) {
          query.category = { $regex: new RegExp(`^${budget.category}$`, 'i') };
        } else {
          console.log(`//...Skipping category filter for budget ID ${budget._id} - Invalid category.`);
          delete query.category;  // Ensure invalid filters are removed
        }

        // Debug: Print final query
        console.log("//...Final Query Being Used:", JSON.stringify(query, null, 2));

        // Debug: Fetch matching transactions BEFORE aggregation
        const matchingTransactions = await Transaction.find(query);

        // Debugging log to check if transactions match the query
        console.log(`Budget ID ${budget._id} - Matching Transactions Count:`, matchingTransactions.length);
        if (matchingTransactions.length === 0) {
          console.log("//...Possible Issues:");
          console.log("//...Check if category is case-sensitive mismatch.");
          console.log("//...Check if transaction dates are formatted correctly.");
        }

        // Perform aggregation to calculate total spending
        const totalSpent = await Transaction.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        console.log("//...Aggregation result:", totalSpent); // <-- Debugging line

        const spent = totalSpent.length > 0 ? totalSpent[0].total : 0;
        const remaining = budget.amount - spent;

        return {
          budgetId: budget._id,
          category: budget.category || "General",
          allocated: budget.amount,
          spent,
          remaining
        };
      })
    );

    res.json({ budgetUsage });
  } catch (error) {
    console.error("Error tracking budget usage:", error); // Debugging line
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
