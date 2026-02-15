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

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
  

// tasks routes
router.get("/tasks/:empId", asyncHandler(getTasksByEmployees));
router.put("/tasks/:taskId", asyncHandler(updateTaskStatus));
router.delete("/tasks/:taskId", asyncHandler(deleteTask));

// customers routes
router.get("/customers/:empId", asyncHandler(getCustomerByEmployee));

// quotation routes
router.post("/quotation", asyncHandler(submitQuotation));
router.get("/quotation/:empId", asyncHandler(getQuotations));
router.put("/quotation/:quotationId", asyncHandler(editQuotation));

// orders
router.post("/order", asyncHandler(addOrder));
router.get("/order/:empId", asyncHandler(getOrders));

module.exports = router;

