const Goal = require("../models/Goal");

// Create a new goal
exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, notes } = req.body;
    const userId = req.user.id;

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: "Name, target amount, and deadline are required." });
    }

    const goal = await Goal.create({
      user: userId,
      name,
      targetAmount,
      deadline: new Date(deadline),
      notes
    });

    res.status(201).json({ message: "Goal created successfully", goal });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all goals for the logged-in user
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await Goal.find({ user: userId }).sort({ deadline: 1 });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update a goal (e.g., update current amount or other details)
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

    if (!goal || goal.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied" });
    }

    const updatedGoal = await Goal.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: "Goal updated successfully", goal: updatedGoal });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete a goal
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

    if (!goal || goal.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access Denied" });
    }

    await Goal.findByIdAndDelete(id);
    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
