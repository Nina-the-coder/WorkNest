const express = require("express");
const authController = require("./auth.controller");
const authValidation = require("./auth.validation");

const router = express.Router();

router.post(
  "/register",
  authValidation.registerValidation,
  authController.registerUser
);

router.post(
  "/login",
  authValidation.loginValidation,
  authController.loginUser
);

module.exports = router;