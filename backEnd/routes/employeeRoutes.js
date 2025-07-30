const express = require("express");
const {
  getTasksByEmployees,
  updateTaskStatus,
  deleteTask,
  getCustomerByEmployee,
  submitQuotation,
  getQuotations,
  editQuotation,
  addOrder,
  getOrders,
} = require("../controllers/employeeController");
const router = express.Router();

// tasks routes
router.get("/tasks/:empId", getTasksByEmployees);
router.put("/tasks/:taskId", updateTaskStatus);
router.delete("/tasks/:taskId", deleteTask);

// customers routes
router.get("/customers/:empId", getCustomerByEmployee);

// quotation routes
router.post("/quotation", submitQuotation);
router.get("/quotation/:empId", getQuotations);
router.put("/quotation/:quotationId", editQuotation);

// orders
router.post("/order", addOrder);
router.get("/order/:empId", getOrders);

module.exports = router;
