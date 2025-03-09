const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User"); // Required for Admin reports

// Function to fetch financial reports
exports.getFinancialReport = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { startDate, endDate, category, tags } = req.query;

        console.log("//...Fetching transactions for user:", userId);

        // Default period: Last 30 days
        const start = startDate ? new Date(startDate) : new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // Admins see all transactions; users see only their own transactions
        const filter = role === "admin" ? {} : { user: new mongoose.Types.ObjectId(userId) };

        // Apply optional filters
        if (category) filter.category = category;
        if (tags) filter.tags = { $in: tags.split(",") };

        // Get total income
        const income = await Transaction.aggregate([
            { $match: { ...filter, type: "income", date: { $gte: start, $lte: end } } },
            { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
        ]);

        // Get total expenses
        const expenses = await Transaction.aggregate([
            { $match: { ...filter, type: "expense", date: { $gte: start, $lte: end } } },
            { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
        ]);

        // Get category breakdown
        const categoryBreakdown = await Transaction.aggregate([
            { $match: { ...filter, type: "expense", date: { $gte: start, $lte: end } } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } }
        ]);

        // Calculate savings (Income - Expenses)
        const totalIncome = income.length > 0 ? income[0].totalIncome : 0;
        const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;
        const savings = totalIncome - totalExpenses;

        // Prevent extreme percentage warnings
        let summaryMessage;
        if (totalIncome === 0) {
            summaryMessage = totalExpenses > 0
                ? "You have no income recorded, but you spent money. Consider reviewing your budget."
                : "No transactions recorded in this period.";
        } else if (totalIncome > totalExpenses) {
            const percentage = ((totalIncome - totalExpenses) / totalIncome) * 100;
            summaryMessage = `Great job! Your income exceeded expenses by ${percentage.toFixed(2)}%.`;
        } else {
            const percentage = totalIncome > 0
                ? ((totalExpenses - totalIncome) / totalIncome) * 100
                : 100; // If no income, assume expenses exceeded 100%
            summaryMessage = `Warning! You spent more than you earned by ${percentage.toFixed(2)}%.`;
        }

        // Compare with previous period (last 30 days before this range)
        const previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - 30);

        const previousExpenses = await Transaction.aggregate([
            { $match: { ...filter, type: "expense", date: { $gte: previousStart, $lt: start } } },
            { $group: { _id: null, totalPrevExpenses: { $sum: "$amount" } } }
        ]);

        const prevTotalExpenses = previousExpenses.length > 0 ? previousExpenses[0].totalPrevExpenses : 0;

        // Fix trend calculations when previous expenses are 0
        let trendMessage;
        if (prevTotalExpenses === 0) {
            trendMessage = totalExpenses > 0
                ? "This is your first time spending in this category."
                : "No spending recorded in this period.";
        } else if (totalExpenses > prevTotalExpenses) {
            const percentage = ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100;
            trendMessage = `Your spending increased by ${percentage.toFixed(2)}% compared to the last period.`;
        } else {
            const percentage = ((prevTotalExpenses - totalExpenses) / prevTotalExpenses) * 100;
            trendMessage = `Your spending decreased by ${percentage.toFixed(2)}% compared to the last period.`;
        }

        // Additional Admin Insights
        let adminInsights = null;
        if (role === "admin") {
            const totalUsers = await User.countDocuments();
            const topCategories = await Transaction.aggregate([
                { $match: { type: "expense", date: { $gte: start, $lte: end } } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } },
                { $limit: 5 }
            ]);

            adminInsights = {
                totalUsers,
                topCategories
            };
        }

        // Return the final response
        res.json({
            totalIncome,
            totalExpenses,
            savings,
            categoryBreakdown,
            summary: summaryMessage,
            trend: trendMessage,
            adminInsights // Only included for admins
        });

    } catch (error) {
        console.error("Error fetching financial report:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
