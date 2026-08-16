const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");
const OrderController = require("./order.controller");

// Get all orders: Requires ORDER_READ permission
router.get(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.ORDER_READ),
  OrderController.fetchOrders,
);

// Update order status: Requires ORDER_UPDATE permission
router.put(
  "/:orderId",
  verifyToken,
  requirePermission(PERMISSIONS.ORDER_UPDATE),
  OrderController.updateOrderStatus,
);

// Download order as PDF: Requires ORDER_READ permission
router.get(
  "/:orderId/download-pdf",
  verifyToken,
  requirePermission(PERMISSIONS.ORDER_READ),
  OrderController.downloadPdf,
);

// Download order as CSV: Requires ORDER_READ permission
router.get(
  "/:orderId/download-csv",
  verifyToken,
  requirePermission(PERMISSIONS.ORDER_READ),
  OrderController.downloadcsv,
);

// Delete order: Requires ORDER_ARCHIVE permission
router.delete(
  "/:orderId",
  verifyToken,
  requirePermission(PERMISSIONS.ORDER_ARCHIVE),
  OrderController.deleteOrder,
);

module.exports = router;
