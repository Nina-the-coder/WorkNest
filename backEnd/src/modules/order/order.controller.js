const OrderService = require("./order.service");

exports.fetchOrders = async (req, res, next) => {
  const orders = await OrderService.fetchOrders();
  res.status(200).json(orders);
};

exports.updateOrderStatus = async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  await OrderService.updateOrderStatus(orderId, status);

  res.status(200).json({
    message: "Order status updated successfully",
  });
};

exports.deleteOrder = async (req, res, next) => {
  const { orderId } = req.params;

  await OrderService.deleteOrder(orderId);

  res.status(200).json({
    message: "Order deleted successfully",
  });
};

exports.downloadPdf = async (req, res, next) => {
  const { orderId } = req.params;

  await OrderService.generatePdf(orderId, res);
  
};

exports.downloadcsv = async (req, res, next) => {
  const { orderId } = req.params;

  const csvContent = await OrderService.generateCsv(orderId);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=order-${orderId}.csv`,
  );

  res.status(200).send(csvContent);
};

const orderService = require("./order.service");

// exports.generatePdf = async (req, res, next) => {
//   try {
//     const buffer = await orderService.generatePdf(req.params.orderId);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=order-${req.params.orderId}.pdf`
//     );

//     res.send(buffer);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.generateCsv = async (req, res, next) => {
//   try {
//     const csv = await orderService.generateCsv(req.params.orderId);

//     res.setHeader("Content-Type", "text/csv");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=order-${req.params.orderId}.csv`
//     );

//     res.send(csv);
//   } catch (err) {
//     next(err);
//   }
// };
