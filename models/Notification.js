// notification model for transactions

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  transaction: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction', 
    required: false 
  },
  type: { 
    type: String, 
    enum: ['upcoming', 'missed','due_today', 'budget_warning', 'budget_exceeded'],
    required: true 
  },
  budget: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Budget' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
