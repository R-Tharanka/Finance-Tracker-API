const User = require("../models/User");

// Update user preferred currency
exports.updatePreferredCurrency = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferredCurrency } = req.body;

    if (!preferredCurrency) {
      return res.status(400).json({ message: "Preferred currency is required." });
    }

    const user = await User.findByIdAndUpdate(userId, { preferredCurrency }, { new: true });

    res.json({ message: "Preferred currency updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
