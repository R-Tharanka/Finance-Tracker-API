const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all users (Admin Only) with pagination
exports.getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const users = await User.find().select('-password').skip(skip).limit(limit);
      const totalUsers = await User.countDocuments();
  
      res.json({
        totalUsers,
        page,
        totalPages: Math.ceil(totalUsers / limit),
        users
      });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  

// Delete a user (Admin Only)
exports.deleteUser = async (req, res) => {
    try {
      if (req.user.id === req.params.id) {
        return res.status(400).json({ message: "You cannot delete your own account." });
      }
  
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };  
  

// Change user role (Admin Only)
exports.updateUserRole = async (req, res) => {
    try {
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
  
      const adminCount = await User.countDocuments({ role: "admin" });
      const userToUpdate = await User.findById(req.params.id);
      
      // last admin cannot be downgraded to "user" to prevent losing admin access.
      if (adminCount === 1 && userToUpdate.role === "admin" && role === "user") {
        return res.status(400).json({ message: "Cannot downgrade the last admin." });
      }
  
      const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
      res.json({ message: "User role updated", user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  


// Get financial summary for all users (Admin Only)
exports.getAdminReports = async (req, res) => {
  try {
    const totalIncome = await Transaction.aggregate([
      { $match: { type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalExpenses = await Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);c

    const categoryBreakdown = await Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalIncome: totalIncome[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      categoryBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
