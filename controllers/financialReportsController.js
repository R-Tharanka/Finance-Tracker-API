const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { convertCurrency } = require("../utils/currencyConverter");

// Function to fetch financial reports with multi‐currency support
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

        // Admins see all transactions; regular users see only their own
        const filter = role === "admin" ? {} : { user: new mongoose.Types.ObjectId(userId) };

        // Apply mandatory date filter
        filter.date = { $gte: start, $lte: end };

        // Apply optional filters
        if (category) filter.category = category;
        if (tags) filter.tags = { $elemMatch: { $in: tags.split(",") } };

        console.log("//...Final Tags Filter:", JSON.stringify(filter.tags, null, 2));

        // IMPORTANT: We assume that transactions were created in the base currency (USD).
        // In the aggregation we use an $ifNull operator so that if "convertedAmount" is missing, we use "amount".
        const income = await Transaction.aggregate([
            { $match: { ...filter, type: "income" } },
            { $group: { 
                _id: null, 
                totalIncome: { $sum: { $ifNull: ["$convertedAmount", "$amount"] } } 
            } }
        ]);
        console.log("//...Total Income:", income);

        const expenses = await Transaction.aggregate([
            { $match: { ...filter, type: "expense" } },
            { $group: { 
                _id: null, 
                totalExpenses: { $sum: { $ifNull: ["$convertedAmount", "$amount"] } } 
            } }
        ]);
        console.log("//...Total Expenses:", expenses);

        const categoryBreakdown = await Transaction.aggregate([
            { $match: { ...filter, type: "expense" } },
            { $group: { 
                _id: "$category", 
                total: { $sum: { $ifNull: ["$convertedAmount", "$amount"] } } 
            } }
        ]);
        console.log("//...Category Breakdown:", categoryBreakdown);

        // Calculate savings in base currency (USD)
        const totalIncomeUSD = income.length > 0 ? income[0].totalIncome : 0;
        const totalExpensesUSD = expenses.length > 0 ? expenses[0].totalExpenses : 0;
        const savingsUSD = totalIncomeUSD - totalExpensesUSD;

        // Now, if the user has a preferred currency different from USD, convert the final totals.
        const user = await User.findById(userId);
        const preferredCurrency = user.preferredCurrency || "USD";

        let conversionRate = 1;
        if (preferredCurrency !== "USD") {
            // Get conversion rate from USD to the preferred currency.
            const conversionResult = await convertCurrency(1, "USD", preferredCurrency);
            conversionRate = conversionResult.exchangeRate;
        }

        // Convert aggregated values using the conversion rate.
        const totalIncomeFinal = totalIncomeUSD * conversionRate;
        const totalExpensesFinal = totalExpensesUSD * conversionRate;
        const savingsFinal = savingsUSD * conversionRate;
        const categoryBreakdownFinal = categoryBreakdown.map(item => ({
            _id: item._id,
            total: item.total * conversionRate
        }));

        // Build summary messages
        let summaryMessage;
        if (totalIncomeFinal === 0) {
            summaryMessage = totalExpensesFinal > 0
                ? "You have no income recorded, but you spent money. Consider reviewing your budget."
                : "No transactions recorded in this period.";
        } else if (totalIncomeFinal > totalExpensesFinal) {
            const percentage = ((totalIncomeFinal - totalExpensesFinal) / totalIncomeFinal) * 100;
            summaryMessage = `Great job! Your income exceeded expenses by ${percentage.toFixed(2)}%.`;
        } else {
            const percentage = totalIncomeFinal > 0
                ? ((totalExpensesFinal - totalIncomeFinal) / totalIncomeFinal) * 100
                : 100;
            summaryMessage = `Warning! You spent more than you earned by ${percentage.toFixed(2)}%.`;
        }
        console.log("//...Summary:", summaryMessage);

        // Compare with previous period (last 30 days before this range)
        const previousStart = new Date(start);
        previousStart.setDate(previousStart.getDate() - 30);
        console.log("//...Previous Period Start:", previousStart);

        const previousExpenses = await Transaction.aggregate([
            { $match: { ...filter, type: "expense", date: { $gte: previousStart, $lt: start } } },
            { $group: { _id: null, totalPrevExpenses: { $sum: { $ifNull: ["$convertedAmount", "$amount"] } } } }
        ]);
        console.log("//...Previous Period Expenses:", previousExpenses);

        const prevTotalExpensesUSD = previousExpenses.length > 0 ? previousExpenses[0].totalPrevExpenses : 0;
        const prevTotalExpensesFinal = prevTotalExpensesUSD * conversionRate;

        let trendMessage;
        if (prevTotalExpensesFinal === 0) {
            trendMessage = totalExpensesFinal > 0
                ? "This is your first time spending in this category."
                : "No spending recorded in this period.";
        } else if (totalExpensesFinal > prevTotalExpensesFinal) {
            const percentage = ((totalExpensesFinal - prevTotalExpensesFinal) / prevTotalExpensesFinal) * 100;
            trendMessage = `Your spending increased by ${percentage.toFixed(2)}% compared to the last period.`;
        } else {
            const percentage = ((prevTotalExpensesFinal - totalExpensesFinal) / prevTotalExpensesFinal) * 100;
            trendMessage = `Your spending decreased by ${percentage.toFixed(2)}% compared to the last period.`;
        }
        console.log("//...Trend:", trendMessage);

        // Additional Admin Insights (only for admins)
        let adminInsights = null;
        if (role === "admin") {
            const totalUsers = await User.countDocuments();
            const topCategories = await Transaction.aggregate([
                { $match: { type: "expense", date: { $gte: start, $lte: end } } },
                { $group: { _id: "$category", total: { $sum: { $ifNull: ["$convertedAmount", "$amount"] } } } },
                { $sort: { total: -1 } },
                { $limit: 5 }
            ]);
            adminInsights = {
                totalUsers,
                topCategories: topCategories.map(item => ({
                    _id: item._id,
                    total: item.total * conversionRate
                }))
            };
            console.log("//...Admin Insights:", adminInsights);
        }

        // Return the final response
        res.json({
            totalIncome: totalIncomeFinal,
            totalExpenses: totalExpensesFinal,
            savings: savingsFinal,
            categoryBreakdown: categoryBreakdownFinal,
            summary: summaryMessage,
            trend: trendMessage,
            adminInsights
        });

    } catch (error) {
        console.error("Error fetching financial report:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
