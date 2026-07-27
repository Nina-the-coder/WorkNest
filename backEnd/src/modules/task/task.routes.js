const express = require("express");
const TaskController = require("./task.controller");
const router = express.Router();

// task routes
router.post("/", TaskController.addTask);
router.get("/", TaskController.getAllTasks);
router.delete("/:taskId", TaskController.deleteTask);
router.put("/:taskId", TaskController.updateTasks);

module.exports = router;