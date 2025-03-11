const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
    index: true
  },
  category: {
    type: String,
    required: false, // optional for general budgets
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now  // Defaults to today if not provided
  },
  endDate: {
    type: Date,
    required: true, 
    index: true
  }
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, endDate: 1 }); // Faster lookup of active budgets


module.exports = mongoose.model('Budget', budgetSchema);
