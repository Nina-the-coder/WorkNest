const mongoose = require("mongoose");
const User = require("../../models/user.model");
const AppError = require("../../utils/AppError");

const statuses = ["pending", "in-progress", "done"];
const priorities = ["low", "medium", "high"];

const validateTaskFields = (data, { creating = false } = {}) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AppError("Task data must be an object", 400);
  }
  for (const field of ["title", "description"]) {
    if ((creating || data[field] !== undefined) &&
        (typeof data[field] !== "string" || !data[field].trim())) {
      throw new AppError(`Task ${field} is required`, 400);
    }
  }
  if (creating || data.dueDate !== undefined) {
    if ((!data.dueDate || (typeof data.dueDate !== "string" && !(data.dueDate instanceof Date))) ||
        Number.isNaN(new Date(data.dueDate).getTime())) {
      throw new AppError("A valid due date is required", 400);
    }
  }
  if (data.status !== undefined && !statuses.includes(data.status)) {
    throw new AppError("Invalid task status", 400);
  }
  if (data.priority !== undefined && !priorities.includes(data.priority)) {
    throw new AppError("Invalid task priority", 400);
  }
};

const validateAssignee = async (reference) => {
  const id = reference?._id || reference;
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("A valid employee ID is required", 400);
  }
  const employee = await User.findOne({ _id: id, deleted: false }).select("_id role status");
  if (!employee) throw new AppError("Employee not found", 404);
  if (employee.status !== "active" || employee.role !== "employee") {
    throw new AppError("Task assignee must be an active employee", 400);
  }
  return id;
};

const validateStatusPayload = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new AppError("Task status data must be an object", 400);
  }
  if (Object.keys(data).some((field) => field !== "status")) {
    throw new AppError("Only task status can be changed with this action", 403);
  }
  if (!statuses.includes(data.status)) throw new AppError("Invalid task status", 400);
};

const validateEmployeeTransition = (current, next) => {
  if (current === next) return;
  const transitions = { pending: "in-progress", "in-progress": "done" };
  if (transitions[current] !== next) {
    throw new AppError("Invalid task status transition", 400);
  }
};

module.exports = { validateTaskFields, validateAssignee, validateStatusPayload, validateEmployeeTransition };
