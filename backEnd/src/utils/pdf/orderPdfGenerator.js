const PDFDocument = require("pdfkit");

exports.generateOrderPdf = async (order, res) => {
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=order-${order.orderId}.pdf`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).text(`Order ID: ${order.orderId}`, { underline: true });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Quotation ID: ${order.quotationId?.quotationId}`);
  doc.text(`Status: ${order.status}`);
  doc.text(
    `Added By: ${order.addedBy?.name || "N/A"} (${order.addedBy?.empId || ""
    })`
  );

  doc.moveDown();
  doc.text("Products:", { underline: true });

  order.quotationId.products.forEach((p) => {
    doc.text(
      `${p.name} | Qty: ${p.quantity} | Price: ₹${p.price} | Total: ₹${p.price * p.quantity
      }`
    );
  });

  doc.moveDown();
  doc.fontSize(14).text(`Grand Total: ₹${order.quotationId.total}`);

  doc.moveDown();
  doc.fontSize(12).text("Customer Details:", { underline: true });

  const customer = order.quotationId.customerId;

  doc.text(`Name: ${customer?.name || "Not set"}`);
  doc.text(`Address: ${customer?.address || "Not set"}`);
  doc.text(`Contact: ${customer?.contact || "Not set"}`);
  doc.text(`Email: ${customer?.email || "Not set"}`);

  doc.end();
};

// module.exports = (order) => {
//   // console.log("generating PDF for order", order);
//   const doc = new PDFDocument({ margin: 50 });

//   const buffers = [];
//   doc.on("data", buffers.push.bind(buffers));

//   return new Promise((resolve) => {
//     doc.on("end", () => {
//       resolve(Buffer.concat(buffers));
//     });

//     doc.fontSize(18).text(`Order ID: ${order.orderId}`, { underline: true });
//     doc.moveDown();

//     doc.text(`Quotation ID: ${order.quotationId?.quotationId}`);
//     doc.text(`Status: ${order.status}`);
//     doc.text(
//       `Added By: ${order.addedBy?.name || "N/A"} (${order.addedBy?.empId || ""})`
//     );

//     doc.moveDown();
//     doc.text("Products:", { underline: true });

//     order.quotationId.products.forEach((p) => {
//       doc.text(
//         `${p.name} | Qty: ${p.quantity} | Price: ₹${p.price} | Total: ₹${
//           p.price * p.quantity
//         }`
//       );
//     });

//     doc.moveDown();
//     doc.text(`Grand Total: ₹${order.quotationId.total}`);

//     doc.end();
//   });
// };