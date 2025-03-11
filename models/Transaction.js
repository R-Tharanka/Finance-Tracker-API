const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: "USD", // Default currency
  },
  convertedAmount: {
    type: Number, // Amount in base currency
    required: true,
  },
  exchangeRate: {
    type: Number, // Exchange rate used for conversion
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true, 
    index: true
  },
  category: {
    type: String,
    required: true, 
    index: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true,
    default: Date.now, 
    index: true
  },
  tags: [String],
  // Fields for recurring transactions:
  recurring: { type: Boolean, default: false, index: true },
  recurrencePattern: { type: String },
  recurrenceEndDate: { type: Date }  // Optional: to specify when the recurring transaction ends
}, { timestamps: true });

// Compound index: Optimize queries that sort/filter by user and date
transactionSchema.index({ user: 1, date: -1 });

// Optimized searching by type and category
transactionSchema.index({ type: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
