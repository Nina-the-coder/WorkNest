const User = require("../../models/User");
const Task = require("../../models/Task");
const getNextSequence = require("../../utils/getNextSequence");
const bcrypt = require("bcrypt");

exports.addTask = async (req, res) => {
  try {
    const { assignedTo, assignedBy, title, description, dueDate, status, priority } =
      req.body;

    const nextTaskNumber = await getNextSequence("taskId");
    const TaskId = `TSK${String(nextTaskNumber).padStart(3, "0")}`;

    const newTask = new Task({
      taskId: TaskId,
      title,
      description,
      assignedTo,
      assignedBy,
      dueDate,
      status,
      priority,
    });

    await newTask.save();
    res.status(201).json({ message: "Task added successfully", task: title });
  } catch (err) {
    console.error("Error in adding the task: ...", err);
    res
      .status(500)
      .json({ message: "SErver ERrrornfn>>>>?....", error: err.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({deleted: false})
      .populate("assignedTo")
      .populate("assignedBy");
    res.status(200).json(tasks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch employees", error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    // const deleted = await Task.deleteOne({ taskId });

    // if (deleted.deletedCount === 0) {
    //   return res.status(404).json({ message: "Task not found" });
    // }
    const task = await Task.findOne({taskId});

    if(!task){
      return res.status(404).json({message: "No task found"});
    }
    task.deleted = true;
    task.deletedAt = new Date();
    await task.save();
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
    const { assignedTo, title, description, dueDate, status, priority } =
      req.body;

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
