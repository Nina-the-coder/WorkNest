const Task = require("./task.model");

exports.createTask = (data) => {
  return Task.create(data);
};

exports.findByTaskId = (taskId) => {
  return Task.findOne({ taskId });
};

exports.findActiveByTaskId = (taskId, scope = {}) => {
  return Task.findOne({ ...scope, taskId, deleted: false })
    .populate("assignedTo")
    .populate("assignedBy");
};

exports.findAllActive = (scope) => {
  return Task.find({ ...scope, deleted: false })
    .populate("assignedTo")
    .populate("assignedBy");
};

exports.saveTask = (task) => {
  return task.save();
};

// Match the read snapshot as well as the current authorization boundary.
// Single-document compare-and-set does not require a MongoDB transaction.
exports.updateIfCurrent = (task, scope, changes) => {
  const filter = {
    _id: task._id,
    deleted: false,
    assignedTo: task.populated?.("assignedTo") || task.assignedTo?._id || task.assignedTo,
    status: task.status,
    ...scope,
  };
  if (task.updatedAt) filter.updatedAt = task.updatedAt;
  return Task.findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true })
    .populate("assignedTo")
    .populate("assignedBy");
};

exports.countDocuments = (filter) => {
  return Task.countDocuments(filter);
};
