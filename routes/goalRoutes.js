const express = require("express");
const { createGoal, getGoals, updateGoal, deleteGoal } = require("../controllers/goalController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticate);

// POST: Create a new goal
router.post("/", createGoal);

// GET: Get all goals for the logged-in user
router.get("/", getGoals);

// PUT: Update a goal by ID
router.put("/:id", updateGoal);

// DELETE: Delete a goal by ID
router.delete("/:id", deleteGoal);

module.exports = router;
