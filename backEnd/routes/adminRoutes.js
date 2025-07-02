const express = require('express')
const router = express.Router();
const {addEmployee, getAllEmployees, addTask, getAllTasks, deleteEmployee, deleteTask, updateEmployee, updateTasks} = require("../controllers/adminController");

router.post("/employees", addEmployee);
router.get("/employees", getAllEmployees);
router.delete("/employees/:empId", deleteEmployee);
router.put("/employees/:empId", updateEmployee);

router.post("/tasks", addTask);
router.get("/tasks", getAllTasks);
router.delete("/tasks/:taskId", deleteTask);
router.put("/tasks/:taskId", updateTasks);

module.exports = router;