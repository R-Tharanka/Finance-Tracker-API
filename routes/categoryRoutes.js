const express = require('express');
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getCategories);
router.post('/', authorize(['admin']), createCategory);
router.put('/:id', authorize(['admin']), updateCategory);
router.delete('/:id', authorize(['admin']), deleteCategory);

module.exports = router;
