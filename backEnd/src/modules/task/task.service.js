const taskRepo = require("./task.repository");
const AppError = require("../../utils/AppError");
const getNextSequence = require("../../utils/getNextSequence");

exports.addTask = async (data) => {
  const {
    assignedTo,
    assignedBy,
    title,
    description,
    dueDate,
    status,
    priority,
  } = data;

  const nextTaskNumber = await getNextSequence("task");
  const newTaskId = `TSK${String(nextTaskNumber).padStart(3, "0")}`;

  return taskRepo.createTask({
    taskId: newTaskId,
    assignedTo,
    assignedBy,
    title,
    description,
    dueDate,
    status,
    priority,
  });
};

exports.getAllTasks = async () => {
  return taskRepo.findAllActive();
};

exports.deleteTask = async (taskId) => {
  const task = await taskRepo.findByTaskId(taskId);

  if (!task) {
    throw new AppError("No task found", 404);
  }

  task.deleted = true;
  task.deletedAt = new Date();

  await taskRepo.saveTask(task);
};

exports.getTaskById = async (taskId) => {
  const task = await taskRepo.findActiveByTaskId(taskId);

  if (!task) {
    throw new AppError("No task found", 404);
  }

  return task;
};

exports.updateTask = async (taskId, data) => {
  const {
    assignedTo,
    title,
    description,
    dueDate,
    status,
    priority,
  } = data;

  const task = await taskRepo.findActiveByTaskId(taskId);

  if (!task) {
    throw new AppError("No task found", 404);
  }

  if (assignedTo) task.assignedTo = assignedTo;
  if (title) task.title = title;
  if (description) task.description = description;
  if (dueDate) task.dueDate = dueDate;
  if (status) task.status = status;
  if (priority) task.priority = priority;

  return taskRepo.saveTask(task);
};