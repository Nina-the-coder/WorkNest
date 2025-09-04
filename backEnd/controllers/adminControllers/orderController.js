const Order = require("../../models/Order");
const PDFDocument = require("pdfkit");

exports.fetchOrders = async (req, res) => {
  try {
    const orders = await Order.find({deleted: false })
      .populate({ path: "addedBy", select: "empId name" })
      .populate({
        path: "quotationId",
        select: "customerId quotationId total products",
        populate: {
          path: "customerId",
          select: "name address contact email gst company",
        },
      });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Server errror", err);
    res.status(500).json({
      message: "SErver eror failed to fetch the orders from the database",
      error: err.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    order.status = status;
    await order.save();
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error("Server error", err);
    res.status(500).json({
      message: "Server error failed to update the order status",
      error: err.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  const { orderId } = req.params;
  // perform soft delete by setting a 'deleted' flag
  try {
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    await Order.findOne({orderId});
    order.deleted = true;
    order.deletedAt = new Date();
    await order.save(); 
    res.status(200).json({ message: "Order deleted successfully" }); 
  } catch (err) {
    console.error("Server error", err);
    res.status(500).json({
      message: "Server error failed to delete the order",
      error: err.message,
    });
  }
};

// GET /api/admin/orders/:id/download
exports.downloadPdf = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id })
      .populate("quotationId")
      .populate("quotationId.products")
      .populate("quotationId.customerId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order.orderId}.pdf`
    );

    // Create PDF
    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(18).text(`Order ID: ${order.orderId}`, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Quotation: ${order.quotationId.quotationId}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Added By: ${order.addedBy?.name} (${order.addedBy?.empId})`);
    doc.moveDown();

    doc.text("Products:", { underline: true });
    order.quotationId.products.forEach((p) => {
      doc.text(`${p.name} (x${p.quantity}) - ₹${p.price * p.quantity}`);
    });

    doc.moveDown();
    doc.text(`Total: ₹ ${order.quotationId.total}`, { bold: true });
    doc.moveDown();

    doc.text("Customer Details:", { underline: true });
    doc.text(`Name: ${order.quotationId.customerId?.name || "Not set"}`);
    doc.text(`Address: ${order.quotationId.customerId?.address || "Not set"}`);
    doc.text(`Contact: ${order.quotationId.customerId?.contact || "Not set"}`);
    doc.text(`Email: ${order.quotationId.customerId?.email || "Not set"}`);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating PDF" });
  }
};

exports.downloadcsv = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).populate(
      "quotationId"
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order.orderId}.csv`
    );

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    order.quotationId.products.forEach((p) => {
      csvStream.write({
        Product: p.name,
        Quantity: p.quantity,
        Price: p.price,
        Total: p.price * p.quantity,
      });
    });

    csvStream.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating CSV" });
  }
};
