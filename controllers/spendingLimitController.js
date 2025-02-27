const SpendingLimit = require('../models/SpendingLimit');

// Set a spending limit
exports.setSpendingLimit = async (req, res) => {
  try {
    const { category, limitAmount, period } = req.body;
    const userId = req.user.id; // User setting the limit

    // Check if limit already exists for the user in this category
    const existingLimit = await SpendingLimit.findOne({ user: userId, category });
    if (existingLimit) {
      return res.status(400).json({ message: "Spending limit already exists for this category." });
    }

    const spendingLimit = await SpendingLimit.create({ user: userId, category, limitAmount, period });
    res.status(201).json({ message: "Spending limit set successfully", spendingLimit });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get spending limits for the logged-in user
exports.getSpendingLimits = async (req, res) => {
  try {
    const userId = req.user.id;
    const spendingLimits = await SpendingLimit.find({ user: userId }).populate('category', 'name');
    res.json({ spendingLimits });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Admin can delete any spending limit
exports.deleteSpendingLimit = async (req, res) => {
  try {
    await SpendingLimit.findByIdAndDelete(req.params.id);
    res.json({ message: "Spending limit deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
