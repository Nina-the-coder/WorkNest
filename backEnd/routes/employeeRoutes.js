const express = require('express');
const { getTasksByEmployees, updateTaskStatus, deleteTask } = require('../controllers/employeeController');
const router = express.Router();

router.get("/tasks/:empId", getTasksByEmployees );
router.put("/tasks/:taskId", updateTaskStatus);
router.delete("/tasks/:taskId", deleteTask);

module.exports = router;