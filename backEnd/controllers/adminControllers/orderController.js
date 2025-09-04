const Orders = require("../../models/Order");

exports.fetchOrders = async (req, res) => {
  try {
    const orders = await Orders.find()
      .populate({ path: "addedBy", select: "empId name" })
      .populate({
        path: "quotationId",
        select: "customerId quotationId total",
        populate: {
          path: "customerId",
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
