const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// Function to fetch financial reports
exports.getFinancialReport = async (req, res) => {
    try {
        const { role, id: userId } = req.user; // Get user role and ID
        const { startDate, endDate } = req.query;

        console.log("//...Fetching transactions for user:", userId);

        // Default period: Last 30 days
        const start = startDate ? new Date(startDate) : new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0); // Normalize time

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        // 🔹 Admins should see all transactions; users should see only their own
        const filter = role === "admin" ? {} : { user: new mongoose.Types.ObjectId(userId) };

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

        // Calculate savings
        const totalIncome = income.length > 0 ? income[0].totalIncome : 0;
        const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;
        const savings = totalIncome - totalExpenses;

        res.json({
            totalIncome,
            totalExpenses,
            savings,
            categoryBreakdown,
        });

    } catch (error) {
        console.error("Error fetching financial report:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
