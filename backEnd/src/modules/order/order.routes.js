const express = require("express");
const router = express.Router();
const OrderController = require("./order.controller");

// order routes
router.get("/", OrderController.fetchOrders);
router.put("/:orderId", OrderController.updateOrderStatus);
router.get("/:orderId/download-pdf", OrderController.downloadPdf);
router.get("/:orderId/download-csv", OrderController.downloadcsv);
router.delete("/:orderId", OrderController.deleteOrder);

module.exports = router;