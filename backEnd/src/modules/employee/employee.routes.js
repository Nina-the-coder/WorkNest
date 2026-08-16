const express = require("express");
const EmployeeController = require("./employee.controller");
const { verifyToken } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");

const router = express.Router();

// Get all employees: Requires EMPLOYEE_READ permission
router.get(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.EMPLOYEE_READ),
  EmployeeController.getAllEmployees,
);

// Add employee: Requires EMPLOYEE_CREATE permission
router.post(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.EMPLOYEE_CREATE),
  EmployeeController.addEmployee,
);

// Get employee by ID: Requires EMPLOYEE_READ permission
router.get(
  "/:empId",
  verifyToken,
  requirePermission(PERMISSIONS.EMPLOYEE_READ),
  EmployeeController.getEmployeeById,
);

// Delete employee: Requires EMPLOYEE_ARCHIVE permission
router.delete(
  "/:empId",
  verifyToken,
  requirePermission(PERMISSIONS.EMPLOYEE_ARCHIVE),
  EmployeeController.deleteEmployee,
);

// Update employee: Requires EMPLOYEE_UPDATE permission
router.put(
  "/:empId",
  verifyToken,
  requirePermission(PERMISSIONS.EMPLOYEE_UPDATE),
  EmployeeController.updateEmployee,
);

module.exports = router;
