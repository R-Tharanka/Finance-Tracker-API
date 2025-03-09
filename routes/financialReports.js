const express = require("express");
const { getFinancialReport } = require("../controllers/financialReportsController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

// This route is accessible to any authenticated user
router.get("/", authenticate, getFinancialReport);

module.exports = router;
