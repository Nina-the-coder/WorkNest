const User = require("../models/User");
const Task = require("../models/Task");
const getNextSequence = require("../utils/getNextSequence");
const bcrypt = require('bcrypt');

exports.addEmployee = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists..." });
    }
    const nextEmpNumber = await getNextSequence("empId");
    const newEmpId = `EMP${String(nextEmpNumber).padStart(3, "0")}`;

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
    const { name, email, password, role, status } = req.body;

    const user = await User.findOne({ empId });
    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update only fields that exist in req.body
    if (name) user.name = name;
    if (email) user.email = email;
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

exports.addTask = async (req, res) => {
  try {
    const {
      assignedTo,
      title,
      description,
      dueDate,
      status,
      priority,
    } = req.body;

    const nextTaskNumber = await getNextSequence("taskId");
    const TaskId = `TSK${String(nextTaskNumber).padStart(3, "0")}`;

    const newTask = new Task({
      taskId: TaskId,
      title,
      description,
      assignedTo,
      dueDate,
      status,
      priority,
    });

    await newTask.save();
    res.status(201).json({ message: "Task added successfully", task: title });
  } catch (err) {
    console.error("Error in adding the task: ...", err);
    res.status(500).json({ message: "SErver ERrrornfn>>>>?...." });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const task = await Task.find().select("-assignedBy");
    res.status(200).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch employees", error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const deleted = await Task.deleteOne({ taskId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in deleting the task", error: err.message });
  }
};

exports.updateTasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      assignedTo,
      title,
      description,
      dueDate,
      status,
      priority,
    } = req.body;

    const updatedData = {
      assignedTo,
      title,
      description,
      dueDate,
      status,
      priority,
    };

    const updatedTask = await Task.findOneAndUpdate({ taskId }, updatedData, {
      new: true,
    });
    res.status(200).json({ message: "Task Updated", task: updatedTask });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in updating the task", error: err.message });
  }
};