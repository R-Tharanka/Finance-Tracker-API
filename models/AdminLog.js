const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Admin performing the action
  action: { type: String, required: true }, // Description of action
  timestamp: { type: Date, default: Date.now, index: true }, // Time of action
}, { timestamps: true });

adminLogSchema.index({ admin: 1, timestamp: -1 }); // Admin log retrieval by latest actions

module.exports = mongoose.model('AdminLog', adminLogSchema);
