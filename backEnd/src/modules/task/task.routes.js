const express = require("express");
const TaskController = require("./task.controller");
const { verifyToken } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");

const router = express.Router();

// Add task: Requires TASK_CREATE permission
router.post(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.TASK_CREATE),
  TaskController.addTask,
);

// Get all tasks: Requires TASK_READ permission
router.get(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.TASK_READ),
  TaskController.getAllTasks,
);

// Delete task: Requires TASK_DELETE permission
router.delete(
  "/:taskId",
  verifyToken,
  requirePermission(PERMISSIONS.TASK_DELETE),
  TaskController.deleteTask,
);

// Update task: Requires TASK_UPDATE permission
router.put(
  "/:taskId",
  verifyToken,
  requirePermission(PERMISSIONS.TASK_UPDATE),
  TaskController.updateTasks,
);

module.exports = router;
