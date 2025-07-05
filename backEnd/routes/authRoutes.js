const express = require("express");
const router = express.Router();
const { loginUser } = require("../controllers/authController");
const User = require("../models/User");
const bcrypt = require("bcrypt");

// login
router.post("/login", loginUser);

router.post("/register-admin", async (req, res) => {
  try {
    const { name, email, password, empId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password,
      role: "admin",
      empId,
    });

    await user.save();

    res.status(201).json({ message: "Admin registered", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
