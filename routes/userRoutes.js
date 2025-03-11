const express = require("express");
const { updatePreferredCurrency } = require("../controllers/userController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

router.put("/currency", authenticate, updatePreferredCurrency);

module.exports = router;
