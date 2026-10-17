const OrderService = require("./order.service");

exports.fetchOrders = async (req, res) => {
  res.status(200).json(await OrderService.fetchOrders(req.user));
};

exports.getOrder = async (req, res) => {
  const order = await OrderService.getOrder(req.params.orderId, req.user);
  res.status(200).json({ order });
};

exports.updateOrderStatus = async (req, res) => {
  const order = await OrderService.updateOrderStatus(req.params.orderId, req.body, req.user);
  res.status(200).json({ message: "Order status updated successfully", order });
};

exports.deleteOrder = async (req, res) => {
  await OrderService.deleteOrder(req.params.orderId, req.user);
  res.status(200).json({ message: "Order deleted successfully" });
};

exports.downloadPdf = async (req, res) => {
  const buffer = await OrderService.generatePdf(req.params.orderId, req.user);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=order-${req.params.orderId}.pdf`);
  res.status(200).send(buffer);
};

exports.downloadcsv = async (req, res) => {
  const csvContent = await OrderService.generateCsv(req.params.orderId, req.user);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=order-${req.params.orderId}.csv`);
  res.status(200).send(csvContent);
};
