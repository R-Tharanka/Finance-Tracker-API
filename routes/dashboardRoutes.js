const express = require("express");
const { getUserDashboard, getAdminDashboard } = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/user", authenticate, getUserDashboard); // User Dashboard
router.get("/admin", authenticate, authorize("admin"), getAdminDashboard); // Admin Dashboard

module.exports = router;
