const express = require("express");
const router = express.Router();
const upload = require("../middleware/multerConfig");

const { verifyToken } = require("../middleware/verifyToken");
const {
  addEmployee,
  getAllEmployees,
  deleteEmployee,
  updateEmployee,
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
} = require("../controllers/adminControllers/quotationController");

// employee routes
router.post("/employees", verifyToken, addEmployee);
router.get("/employees", getAllEmployees);
router.delete("/employees/:empId", deleteEmployee);
router.put("/employees/:empId", updateEmployee);

// task routes
router.post("/tasks", addTask);
router.get("/tasks", getAllTasks);
router.delete("/tasks/:taskId", deleteTask);
router.put("/tasks/:taskId", updateTasks);

// product routes
router.post("/products", upload.single("image"), addProduct);
router.get("/products", getProducts);
router.put("/products/:productId", upload.single("image"), updateProduct);
router.delete("/products/:productId", deleteProduct);

// customer routes
router.post("/customers", addCustomer);
router.get("/customers", getAllCustomers);
router.delete("/customers/:customerId", deleteCustomer);
router.put("/customers/:customerId", updateCustomer);

router.get("/quotation", getAllQuotations);

module.exports = router;
