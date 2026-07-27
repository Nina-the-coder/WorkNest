const TaskService = require("./task.service");

exports.addTask = async (req, res) => {
  const task = await TaskService.addTask(req.body);
  res.status(201).json({ message: "Task added successfully", task: task.title });
};

exports.getAllTasks = async (req, res) => {
    const tasks = await TaskService.getAllTasks();
    res.status(200).json(tasks);
};

exports.deleteTask = async (req, res) => {
    await TaskService.deleteTask(req.params.taskId);
    res.status(200).json({ message: "Task deleted successfully" });
};

exports.updateTasks = async (req, res) => {
    const updatedTask = await TaskService.updateTask(req.params.taskId, req.body);
    res.status(200).json({ message: "Task Updated", task: updatedTask });
};
