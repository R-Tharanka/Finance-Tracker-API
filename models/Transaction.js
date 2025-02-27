const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['income', 'expense'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  tags: [String],
  // Fields for recurring transactions:
  recurring: { type: Boolean, default: false },
  recurrencePattern: { type: String },
  recurrenceEndDate: { type: Date }  // Optional: to specify when the recurring transaction ends
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
