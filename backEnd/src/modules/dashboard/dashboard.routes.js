const express = require("express");
const router = express.Router();
const DashboardController = require("./dashboard.controller");

router.get("/dashboard-metrics", DashboardController.fetchMetrics);

module.exports = router;
