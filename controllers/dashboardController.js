const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const User = require("../models/User");
const { convertCurrency } = require("../utils/currencyConverter");

// Get dashboard for regular users
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // Step 1: Get user's preferred currency
        const user = await User.findById(userId);
        const preferredCurrency = user.preferredCurrency || "USD";

        console.log(`//...User ID: ${userId}`);
        console.log(`//...Preferred Currency: ${preferredCurrency}`);

        // Step 2: Aggregate total income & expenses in USD first (assuming convertedAmount is in USD)
        const incomeAggregation = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    type: "income"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$convertedAmount" }  // aggregated in base currency
                }
            }
        ]);

        const expenseAggregation = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    type: "expense"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$convertedAmount" }  // aggregated in base currency
                }
            }
        ]);

        let totalIncomeUSD = incomeAggregation.length > 0 ? incomeAggregation[0].total : 0;
        let totalExpensesUSD = expenseAggregation.length > 0 ? expenseAggregation[0].total : 0;

        // Step 3: Convert totals to user's preferred currency if needed
        let conversionRate = 1;
        if (preferredCurrency !== "USD") {
            const conversion = await convertCurrency(1, "USD", preferredCurrency);
            conversionRate = conversion.exchangeRate;
        }

        const totalIncome = totalIncomeUSD * conversionRate;
        const totalExpenses = totalExpensesUSD * conversionRate;

        console.log(`Total Income in USD: ${totalIncomeUSD}, Total Expenses in USD: ${totalExpensesUSD}`);
        console.log(`Conversion Rate to ${preferredCurrency}: ${conversionRate}`);

        // Step 4: Fetch other data
        const budgets = await Budget.find({ user: userId });
        const goals = await Goal.find({ user: userId });

        const recentTransactions = await Transaction.find({ user: userId })
            .sort({ date: -1 })
            .limit(10);

        // Step 5: Send response
        res.json({
            totalIncome,
            totalExpenses,
            budgets,
            goals,
            recentTransactions
        });

    } catch (error) {
        console.error("Error fetching user dashboard:", error);
        res.status(500).json({ message: "Error fetching user dashboard", error: error.message });
    }
};

// Get dashboard for admins
exports.getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIncome = await Transaction.aggregate([
            { $match: { type: "income" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalExpenses = await Transaction.aggregate([
            { $match: { type: "expense" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const topCategories = await Transaction.aggregate([
            { $match: { type: "expense" } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        const activeBudgets = await Budget.find();
        const systemTrends = { totalIncome, totalExpenses, topCategories };

        res.json({
            totalUsers,
            systemTrends,
            activeBudgets
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching admin dashboard", error: error.message });
    }
};
