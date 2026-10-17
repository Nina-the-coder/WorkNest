const taskRepo = require("./task.repository");
const AppError = require("../../utils/AppError");
const getNextSequence = require("../../utils/getNextSequence");
const { getResourceScope } = require("../../utils/resourceAccess");
const { hasPermission } = require("../../utils/rolePermissions");
const PERMISSIONS = require("../../utils/permissions");
const { validateTaskFields, validateAssignee, validateStatusPayload, validateEmployeeTransition } = require("./task.validation");

const requireTaskPermission = (user, permission) => {
  if (!user?._id) throw new AppError("Authentication required", 401);
  if (!hasPermission(user.role, permission)) {
    throw new AppError("Insufficient permissions for this action", 403);
  }
};

exports.addTask = async (data, user) => {
  requireTaskPermission(user, PERMISSIONS.TASK_CREATE);
  validateTaskFields(data, { creating: true });

  const {
    assignedTo,
    title,
    description,
    dueDate,
    status,
    priority,
  } = data;

  const assigneeId = await validateAssignee(assignedTo);

  const nextTaskNumber = await getNextSequence("task");
  const newTaskId = `TSK${String(nextTaskNumber).padStart(3, "0")}`;

  return taskRepo.createTask({
    taskId: newTaskId,
    assignedTo: assigneeId,
    assignedBy: user._id,
    title,
    description,
    dueDate,
    status,
    priority,
  });
};

exports.getAllTasks = async (user) => {
  return taskRepo.findAllActive(getResourceScope(user, "assignedTo"));
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

exports.getTaskById = async (taskId, user) => {
  const task = await taskRepo.findActiveByTaskId(
    taskId,
    getResourceScope(user, "assignedTo"),
  );

  if (!task) {
    throw new AppError("No task found", 404);
  }

  return task;
};

exports.updateTask = async (taskId, data, user) => {
  requireTaskPermission(user, PERMISSIONS.TASK_UPDATE);
  validateTaskFields(data);
  const task = await taskRepo.findActiveByTaskId(taskId);

  if (!task) {
    throw new AppError("No task found", 404);
  }

  const changes = {};
  for (const field of ["title", "description", "dueDate", "status", "priority"]) {
    if (data[field] !== undefined) changes[field] = data[field];
  }
  if (data.assignedTo !== undefined) {
    const id = data.assignedTo?._id || data.assignedTo;
    const currentId = task.populated?.("assignedTo") || task.assignedTo?._id || task.assignedTo;
    // Keep historical associations usable when a former employee is disabled.
    changes.assignedTo = String(id) === String(currentId) ? id : await validateAssignee(id);
  }
  if (Object.keys(changes).length === 0) return task;
  const updated = await taskRepo.updateIfCurrent(task, {}, changes);
  if (!updated) {
    await exports.getTaskById(taskId, user);
    throw new AppError("Task changed. Refresh and try again.", 409);
  }
  return updated;
};

exports.updateTaskStatus = async (taskId, data, user) => {
  requireTaskPermission(user, PERMISSIONS.TASK_STATUS_UPDATE);
  validateStatusPayload(data);
  const scope = getResourceScope(user, "assignedTo");
  const task = await exports.getTaskById(taskId, user);
  if (user.role !== "admin") validateEmployeeTransition(task.status, data.status);
  if (task.status === data.status) return task;

  const updated = await taskRepo.updateIfCurrent(task, scope, { status: data.status });
  if (updated) return updated;

  // A duplicate may have completed first; assignment must still be authorized.
  const current = await exports.getTaskById(taskId, user);
  if (current.status === data.status) return current;
  throw new AppError("Task changed. Refresh and try again.", 409);
};
