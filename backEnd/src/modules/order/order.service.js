const orderRepo = require("./order.repository");
const AppError = require("../../utils/AppError");
const generateOrderPdf = require("../../utils/pdf/orderPdfGenerator");
const generateOrderCsv = require("../../utils/csv/orderCsvGenerator");

exports.fetchOrders = async () => {
  return orderRepo.findAllActive();
};

exports.updateOrderStatus = async (orderId, status) => {
  const order = await orderRepo.findByOrderId(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.status = status;
  return orderRepo.saveOrder(order);
};

exports.deleteOrder = async (orderId) => {
  const order = await orderRepo.findByOrderId(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  order.deleted = true;
  order.deletedAt = new Date();

  return orderRepo.saveOrder(order);
};

exports.generatePdf = async (orderId) => {
  const order = await orderRepo.findDetailedByOrderId(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return generateOrderPdf(order);
};

exports.generateCsv = async (orderId) => {
  const order = await orderRepo.findDetailedByOrderId(orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return generateOrderCsv(order);
};

// exports.generatePdf = async (orderId, res) => {
//   const order = await Order.findOne({ orderId })
//     .populate("addedBy")
//     .populate("quotationId")
//     .populate("quotationId.products")
//     .populate("quotationId.customerId");

//   if (!order) {
//     throw new AppError("Order not found", 404);
//   }

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader(
//     "Content-Disposition",
//     `attachment; filename=order-${orderId}.pdf`
//   );

//   const doc = new PDFDocument({ margin: 50 });
//   doc.pipe(res);

//   doc.fontSize(18).text(`Order ID: ${order.orderId}`, { underline: true });
//   doc.moveDown();

//   doc.fontSize(12);
//   doc.text(`Quotation ID: ${order.quotationId?.quotationId}`);
//   doc.text(`Status: ${order.status}`);
//   doc.text(
//     `Added By: ${order.addedBy?.name || "N/A"} (${order.addedBy?.empId || ""
//     })`
//   );

//   doc.moveDown();
//   doc.text("Products:", { underline: true });

//   order.quotationId.products.forEach((p) => {
//     doc.text(
//       `${p.name} | Qty: ${p.quantity} | Price: ₹${p.price} | Total: ₹${p.price * p.quantity
//       }`
//     );
//   });

//   doc.moveDown();
//   doc.fontSize(14).text(`Grand Total: ₹${order.quotationId.total}`);

//   doc.moveDown();
//   doc.fontSize(12).text("Customer Details:", { underline: true });

//   const customer = order.quotationId.customerId;

//   doc.text(`Name: ${customer?.name || "Not set"}`);
//   doc.text(`Address: ${customer?.address || "Not set"}`);
//   doc.text(`Contact: ${customer?.contact || "Not set"}`);
//   doc.text(`Email: ${customer?.email || "Not set"}`);

//   doc.end();
// };

// exports.generateCsv = async (orderId) => {
//   const order = await Order.findOne({ orderId })
//     .populate("addedBy")
//     .populate("quotationId")
//     .populate("quotationId.products")
//     .populate("quotationId.customerId");

//   if (!order) {
//     throw new AppError("Order not found", 404);
//   }

//   const rows = [
//     ["Order ID", order.orderId],
//     ["Quotation ID", order.quotationId?.quotationId],
//     ["Status", order.status],
//     [
//       "Added By",
//       `${order.addedBy?.name || "N/A"} (${order.addedBy?.empId || ""})`,
//     ],
//     [],
//     ["Products"],
//     ["Name", "Quantity", "Price", "Total"],
//     ...order.quotationId.products.map((p) => [
//       p.name,
//       p.quantity,
//       p.price,
//       p.price * p.quantity,
//     ]),
//     [],
//     ["Grand Total", order.quotationId.total],
//     [],
//     ["Customer Details"],
//     ["Name", order.quotationId.customerId?.name || "Not set"],
//     ["Address", order.quotationId.customerId?.address || "Not set"],
//     ["Contact", order.quotationId.customerId?.contact || "Not set"],
//     ["Email", order.quotationId.customerId?.email || "Not set"],
//   ];

//   return rows.map((row) => row.join(",")).join("\n");
// };
