const express = require('express');
const { register, login } = require('../controllers/authController');
const { check, validationResult } = require('express-validator');
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 mins
  message: "Too many login attempts. Try again later.",
});

router.post(
    '/register',
    [
      check("name").notEmpty().withMessage("Name is required"),
      check("email").isEmail().withMessage("Invalid email format"),
      check("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[!@#$%^&*]/)
        .withMessage("Password must contain at least one special character"),
      check("role").isIn(["user", "admin"]).withMessage("Invalid role"),
    ],
    handleValidationErrors,
    register
  );
  

router.post(
  '/login',
  loginLimiter,
  [
    check("email").isEmail().withMessage("Invalid email format"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidationErrors,
  login
);

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = router;
