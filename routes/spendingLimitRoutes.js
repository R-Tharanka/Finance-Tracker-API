const express = require('express');
const { setSpendingLimit, getSpendingLimits, deleteSpendingLimit } = require('../controllers/spendingLimitController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', setSpendingLimit);
router.get('/', getSpendingLimits);
router.delete('/:id', authorize(['admin']), deleteSpendingLimit);

module.exports = router;
