const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

// Function to allocate savings from an income transaction
async function allocateSavings(transaction) { // ⬅ Change from `exports.allocateSavings`
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

            // Get previous progress before updating
            const previousPercentage = (goal.currentAmount / goal.targetAmount) * 100;

            // Update the goal's currentAmount
            goal.currentAmount += amountToAllocate;
            await goal.save();

            // Compute new percentage after allocation
            const newPercentage = (goal.currentAmount / goal.targetAmount) * 100;

            // Check milestone notifications (50%, 75%, 100%)
            await checkAndSendGoalMilestoneNotification(goal, previousPercentage, newPercentage);

            // Create a savings transaction for tracking
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

            // Stop allocation if no more funds remain
            if (remainingAmount <= 0) break;
        }
    } catch (error) {
        console.error("Error allocating savings:", error);
    }
}

// Function to check goal milestones and send notifications
async function checkAndSendGoalMilestoneNotification(goal, previousPercentage, newPercentage) {
    const milestones = [50, 75, 100];

    for (let milestone of milestones) {
        if (previousPercentage < milestone && newPercentage >= milestone) {
            // Check if notification already exists
            const existingNotification = await Notification.findOne({
                user: goal.user,
                type: "goal_milestone",
                goal: goal._id,
                message: { $regex: new RegExp(`${milestone}%`, "i") }
            });

            if (!existingNotification) {
                await Notification.create({
                    user: goal.user,
                    message: `Milestone reached! Your goal "${goal.name}" is now ${milestone}% complete.`,
                    type: "goal_milestone",
                    goal: goal._id
                });
            }
        }
    }

    // Special case: Exceeding 100%
    if (previousPercentage < 100 && newPercentage > 100) {
        const existingNotification = await Notification.findOne({
            user: goal.user,
            type: "goal_milestone",
            goal: goal._id,
            message: { $regex: /exceeded 100%/i }
        });

        if (!existingNotification) {
            await Notification.create({
                user: goal.user,
                message: `Congratulations! Your goal "${goal.name}" has exceeded 100%! 🎉`,
                type: "goal_milestone",
                goal: goal._id
            });
        }
    }
}

// Ensure all functions are correctly exported
module.exports = { 
    allocateSavings, 
    checkAndSendGoalMilestoneNotification 
};
