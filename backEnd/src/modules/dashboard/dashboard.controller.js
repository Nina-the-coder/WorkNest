const DashboardService = require("./dashboard.service");

exports.fetchMetrics = async (req, res) => {
  const metrics = await DashboardService.fetchMetrics();
  res.status(200).json(metrics);
};
