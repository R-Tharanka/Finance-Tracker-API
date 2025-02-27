const mongoose = require('mongoose');

const spendingLimitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User for whom the limit is set
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Expense category
  limitAmount: { type: Number, required: true }, // Maximum allowed spending amount
  period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' }, // Timeframe for the limit
}, { timestamps: true });

module.exports = mongoose.model('SpendingLimit', spendingLimitSchema);
