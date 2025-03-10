const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User"); // Required for Admin reports

// Function to fetch financial reports
exports.getFinancialReport = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { startDate, endDate, category, tags } = req.query;

        console.log("//...Fetching transactions for user:", userId, "| Role:", role);

        // Default period: Last 30 days
        const start = startDate ? new Date(startDate) : new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        console.log("//...Date Range Applied | Start:", start.toISOString(), "| End:", end.toISOString());

        // Admins see all transactions; users see only their own transactions
        const filter = role === "admin" ? {} : { user: new mongoose.Types.ObjectId(userId) };

        // Apply mandatory date filter
        filter.date = { $gte: start, $lte: end };

        // Apply optional filters
        if (category) filter.category = category;
        if (tags) filter.tags = { $elemMatch: { $in: tags.split(",") } };

        console.log("//... Final Tags Filter:", JSON.stringify(filter.tags, null, 2));

        // Get total income
        const income = await Transaction.aggregate([
            { $match: { ...filter, type: "income" } },
            { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
        ]);
        console.log("//...Total Income:", income);

        // Get total expenses
        const expenses = await Transaction.aggregate([
            { $match: { ...filter, type: "expense" } },
            { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
        ]);
        console.log("//...Total Expenses:", expenses);

        // Get category breakdown
        const categoryBreakdown = await Transaction.aggregate([
            { $match: { ...filter, type: "expense" } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } }
        ]);
        console.log("//...Category Breakdown:", categoryBreakdown);

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

        console.log("//...Summary:", summaryMessage);

        // Compare with previous period (last 30 days before this range)
        const previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - 30);

        console.log("//...Previous Period Start:", previousStart);

        const previousExpenses = await Transaction.aggregate([
            { $match: { ...filter, type: "expense", date: { $gte: previousStart, $lt: start } } },
            { $group: { _id: null, totalPrevExpenses: { $sum: "$amount" } } }
        ]);
        console.log("//...Previous Period Expenses:", previousExpenses);

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

        console.log("//...Trend:", trendMessage);

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

            console.log("//...Admin Insights:", adminInsights);
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
        console.error("❌ Error fetching financial report:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
