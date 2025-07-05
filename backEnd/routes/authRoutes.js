const express = require("express");
const router = express.Router();
const { loginUser } = require("../controllers/authController");
const User = require("../models/User");
const bcrypt = require("bcrypt");

// login
router.post("/login", loginUser);

router.post("/seed-admin", async (req, res) => {
  try {
    const existing = await User.findOne({ email: "nina@example.com" });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    const user = new User({
      name: "Nina",
      email: "nina@example.com",
      password: hashedPassword,
      role: "admin", // or "employee"
      empId: "EMP001",
    });

    await user.save();

    res.status(201).json({ message: "Admin user created", user });
  } catch (err) {
    console.error("Seeding error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
