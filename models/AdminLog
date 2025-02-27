const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin performing the action
  action: { type: String, required: true }, // Description of action
  timestamp: { type: Date, default: Date.now }, // Time of action
}, { timestamps: true });

module.exports = mongoose.model('AdminLog', adminLogSchema);
