const CustomerController = require("./customer.controller");
const express = require("express");
const { verifyToken } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");

const router = express.Router();

// Get all customers: Requires CUSTOMER_READ permission
router.get(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.CUSTOMER_READ),
  CustomerController.getAllCustomers,
);

// Delete customer: Requires CUSTOMER_ARCHIVE permission
router.delete(
  "/:customerId",
  verifyToken,
  requirePermission(PERMISSIONS.CUSTOMER_ARCHIVE),
  CustomerController.deleteCustomer,
);

// Update customer: Requires CUSTOMER_UPDATE permission
router.put(
  "/:customerId",
  verifyToken,
  requirePermission(PERMISSIONS.CUSTOMER_UPDATE),
  CustomerController.updateCustomer,
);

module.exports = router;
