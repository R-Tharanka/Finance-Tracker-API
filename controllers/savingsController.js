const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");

exports.allocateSavings = async (transaction) => {
  try {
    const userId = transaction.user;
    const totalIncome = transaction.amount;

    // Fetch all goals for the user that have auto-allocation enabled
    const goals = await Goal.find({ user: userId, autoAllocation: true });

    // If no auto-allocation goals exist, exit early.
    if (!goals.length) return;

    let remainingAmount = totalIncome;

    for (let goal of goals) {
      let amountToAllocate = 0;

      // Calculate allocation based on percentage if set
      if (goal.allocationPercentage > 0) {
        amountToAllocate = (goal.allocationPercentage / 100) * totalIncome;
      } 
      // Or based on a fixed amount if set
      else if (goal.allocationAmount > 0 && remainingAmount >= goal.allocationAmount) {
        amountToAllocate = goal.allocationAmount;
      }

      // Ensure we do not allocate more than what remains from the income
      if (amountToAllocate > remainingAmount) {
        amountToAllocate = remainingAmount;
      }

      // Update the goal's currentAmount (this is the field defined in your model)
      goal.currentAmount += amountToAllocate;
      await goal.save();

      // Create a new transaction record for the auto-savings allocation
      await Transaction.create({
        user: userId,
        amount: amountToAllocate,
        type: "savings",
        category: "Auto-Savings",
        description: `Automatically saved for goal: ${goal.name}`,
        date: new Date()
      });

      // Deduct the allocated amount from the remaining income
      remainingAmount -= amountToAllocate;

      // If no more funds remain to allocate, break out of the loop
      if (remainingAmount <= 0) break;
    }
  } catch (error) {
    console.error("Error allocating savings:", error);
  }
};
