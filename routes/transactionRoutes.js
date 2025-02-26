const express = require('express');
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication to all transaction routes
router.use(authenticate);  // This applies `authenticate` to all routes below

// Create a new transaction
router.post('/', createTransaction);

// Get transactions for a user (optionally filtered by category or type)
router.get('/', getTransactions);

// Update a transaction by ID
router.put('/:id', updateTransaction);

// Delete a transaction by ID
router.delete('/:id', deleteTransaction);

module.exports = router;
