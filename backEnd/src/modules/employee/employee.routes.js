const express = require("express");
const EmployeeController = require("./employee.controller");
const router = express.Router();
const { verifyToken } = require("../../middleware/auth.middleware");

// employee routes
router.get("/", EmployeeController.getAllEmployees);
router.post("/", verifyToken, EmployeeController.addEmployee);
router.get("/:empId", EmployeeController.getEmployeeById);
router.delete("/:empId", verifyToken, EmployeeController.deleteEmployee);
router.put("/:empId", verifyToken, EmployeeController.updateEmployee);

module.exports = router;