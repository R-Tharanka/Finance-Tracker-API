const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Category name (e.g., Food, Rent)
  description: { type: String }, // Optional description
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
