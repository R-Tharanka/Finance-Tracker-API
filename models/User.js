const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, // Index for quick lookups
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true }, // Role-based filtering
  preferredCurrency: { type: String, default: "USD" }, // Default currency for reports
}, { timestamps: true });

userSchema.index({ email: 1 }); // Ensures efficient queries by email
userSchema.index({ role: 1 }); // Optimizes admin/user queries

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare hashed password for login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);