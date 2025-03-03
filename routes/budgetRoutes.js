const express = require('express');
const { createBudget, getBudgets, updateBudget, deleteBudget, trackBudgetUsage } = require('../controllers/budgetController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createBudget);
router.get('/', getBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

// Route to track budget usage
router.get('/track', trackBudgetUsage);

module.exports = router;
