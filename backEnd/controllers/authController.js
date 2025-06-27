const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// function for register user (only for admin)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, designation } = req.body;

    // checking if the user exists or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists..." });
    }

    //create a new user and save
    const user = new User({ name, email, password, role, phone, designation });
    await user.save();

    res.status(201).json({ message: "User got registered successfully..." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed.", error: err.message });
  }
};

// function to login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    //checking if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    

    // create jwt
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful...",
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed...", error: err.message });
  }
};
