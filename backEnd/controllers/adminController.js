const User = require("../models/User");

exports.addEmployee = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists..." });
    }
    const employeeCount = await User.countDocuments();
    const newEmpId = `EMP${String(employeeCount + 1).padStart(3, "0")}`;

    const newUser = new User({
      name,
      email,
      password,
      role,
      status,
      empId: newEmpId,
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: "Employee added successfully", user: newUser });
  } catch (err) {
    console.error("Error in addEmployee: ", err);
    res.status(500).json({ message: "Server errrror...." });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    res.status(200).json(employees);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch employees", error: err.message });
  }
};
