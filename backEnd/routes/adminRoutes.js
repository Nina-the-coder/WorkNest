const express = require("express");
const router = express.Router();
const { upload, convertToWebP } = require("../middleware/multerConfig");

const { verifyToken } = require("../middleware/verifyToken");
const {
  addEmployee,
  getAllEmployees,
  deleteEmployee,
  updateEmployee,
  getEmployeeById,
} = require("../controllers/adminControllers/employeeController");
const {
  addTask,
  getAllTasks,
  deleteTask,
  updateTasks,
} = require("../controllers/adminControllers/taskController");
const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminControllers/productController");
const {
  addCustomer,
  getAllCustomers,
  deleteCustomer,
  updateCustomer,
} = require("../controllers/adminControllers/customerController");
const {
  getAllQuotations,
  updateQuotationStatus,
  deleteQuotation,
  listQuotation,
} = require("../controllers/adminControllers/quotationController");
const {
  fetchOrders,
  updateOrderStatus,
  downloadcsv,
  downloadPdf,
  deleteOrder,
} = require("../controllers/adminControllers/orderController");
const { submitQuotation } = require("../controllers/employeeController");
const { fetchMetrics } = require("../controllers/adminController");

// dashboard metrics
router.get("/dashboard-metrics", fetchMetrics);

// employee routes
router.post("/employees", verifyToken, addEmployee);
router.get("/employees", getAllEmployees);
router.get("/employees/:empId", getEmployeeById);
router.delete("/employees/:empId", verifyToken, deleteEmployee);
router.put("/employees/:empId", verifyToken, updateEmployee);

// task routes
router.post("/tasks", addTask);
router.get("/tasks", getAllTasks);
router.delete("/tasks/:taskId", deleteTask);
router.put("/tasks/:taskId", updateTasks);

// product routes
router.post("/products", upload.single("image"), convertToWebP, addProduct);
router.get("/products", getProducts);
router.put(
  "/products/:productId",
  upload.single("image"),
  convertToWebP,
  updateProduct
);
router.delete("/products/:productId", deleteProduct);

// customer routes
router.post("/customers", addCustomer);
router.get("/customers", getAllCustomers);
router.delete("/customers/:customerId", deleteCustomer);
router.put("/customers/:customerId", updateCustomer);

// quotation routes
router.get("/quotations", listQuotation);
// router.get("/quotations", getAllQuotations);
router.post("/quotations", submitQuotation);
router.put("/quotations/:quotationId", updateQuotationStatus);
router.delete("/quotations/:quotationId", deleteQuotation);

// order routes
router.get("/orders", fetchOrders);
router.put("/orders/:orderId", updateOrderStatus);
router.get("/orders/:id/download", downloadPdf);
router.post("/orders/:id/download-csv", downloadcsv);
router.delete("/orders/:orderId", deleteOrder);

// router.post("/orders", addOrder);

module.exports = router;
