const express = require("express");
const authController = require("./auth.controller");
const authValidation = require("./auth.validation");
const {
  verifyToken,
  authorizeRoles,
} = require("../../middleware/auth.middleware");

const router = express.Router();

// Registration: Only authenticated admins can register new users
router.post(
  "/register",
  verifyToken,
  authorizeRoles("admin"),
  authValidation.registerValidation,
  authController.registerUser,
);

// Login: Public endpoint (no authentication required)
router.post("/login", authValidation.loginValidation, authController.loginUser);

module.exports = router;
