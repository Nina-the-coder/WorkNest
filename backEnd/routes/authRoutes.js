const express = require("express");
const router = express.Router();
const {loginUser} = require("../controllers/authController");

// login
router.post("/login", loginUser);

const User = require('../models/userModel.js');
const bcrypt = require('bcryptjs');

router.post('/seed-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'admin@example.com' });
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin', // or "employee"
      empId: 'EMP001',
    });

    await user.save();

    res.status(201).json({ message: 'Admin user created', user });
  } catch (err) {
    console.error('Seeding error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;