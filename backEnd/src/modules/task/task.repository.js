const Task = require("./task.model");

exports.createTask = (data) => {
  return Task.create(data);
};

exports.findByTaskId = (taskId) => {
  return Task.findOne({ taskId });
};

exports.findActiveByTaskId = (taskId) => {
  return Task.findOne({ taskId, deleted: false })
    .populate("assignedTo")
    .populate("assignedBy");
};

exports.findAllActive = () => {
  return Task.find({ deleted: false })
    .populate("assignedTo")
    .populate("assignedBy");
};

exports.saveTask = (task) => {
  return task.save();
};

exports.countDocuments = (filter) => {
  return Task.countDocuments(filter);
};