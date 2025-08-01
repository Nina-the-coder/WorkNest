const User = require("../../models/User");
const getNextSequence = require("../../utils/getNextSequence");

exports.addEmployee = async (req, res) => {
  try {
    const { name, email, phone, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists..." });
    }
    const nextEmpNumber = await getNextSequence("empId");
    const newEmpId = `EMP${String(nextEmpNumber).padStart(3, "0")}`;

    const newUser = new User({
      name,
      email,
      phone,
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

exports.getEmployeeById = async (req, res) => {
  try {
    const { empId } = req.params;
    const employee = await User.findOne({ empId: empId });
    res.status(200).json(employee);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch the employee", error: err.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({}).select("-password");
    res.status(200).json(employees);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch employees", error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    await User.deleteOne({ empId });
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting employee", error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    const { name, email, phone, password, role, status } = req.body;

    const user = await User.findOne({ empId });
    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update only fields that exist in req.body
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email already in use by another employee" });
      }
      user.email = email;
    }
    if (role) user.role = role;
    if (status) user.status = status;
    if (password) user.password = password; // will be hashed by pre('save')

    await user.save(); // triggers pre-save hook

    res.status(200).json({ message: "Employee Updated", user });
  } catch (err) {
    res.status(500).json({
      message: "Error in updating the employee",
      error: err.message,
    });
  }
};
