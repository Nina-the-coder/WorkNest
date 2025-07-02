const express = require('express')
const router = express.Router();
const {addEmployee, getAllEmployees, addTask, getAllTasks} = require("../controllers/adminController");

router.post("/employees", addEmployee);
router.get("/employees", getAllEmployees);
router.post("/tasks", addTask);
router.get("/tasks", getAllTasks);

module.exports = router;