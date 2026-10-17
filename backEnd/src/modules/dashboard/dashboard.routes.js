const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");
const DashboardController = require("./dashboard.controller");

// Get dashboard metrics: Requires DASHBOARD_READ permission
router.get(
  "/dashboard-metrics",
  verifyToken,
  requirePermission(PERMISSIONS.DASHBOARD_READ),
  authorizeRoles("admin"),
  DashboardController.fetchMetrics,
);

module.exports = router;
