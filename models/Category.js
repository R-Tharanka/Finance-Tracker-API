const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true }, // Category name (e.g., Food, Rent)
  description: { type: String }, // Optional description
}, { timestamps: true });

categorySchema.index({ name: 1 }); // Ensures fast searches by category name

module.exports = mongoose.model('Category', categorySchema);
