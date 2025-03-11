const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
        index: true
    },
    name: {
        type: String,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        required: true, 
        index: true
    },
    notes: {
        type: String
    },
    autoAllocation: { type: Boolean, default: false }, // Enable or disable automatic allocation
    allocationPercentage: { type: Number, default: 0 }, // Percentage of income to allocate
    allocationAmount: { type: Number, default: 0 }, // Fixed amount to allocate

}, { timestamps: true });

goalSchema.index({ user: 1, deadline: 1 }); // Optimized for user-goal lookups

module.exports = mongoose.model("Goal", goalSchema);
