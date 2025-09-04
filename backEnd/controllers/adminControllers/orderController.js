const Orders = require("../../models/Order");

exports.fetchOrders = async (req, res) => {
  try {
    const orders = await Orders.find()
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
    const order = await Orders.findOne({ orderId });
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
