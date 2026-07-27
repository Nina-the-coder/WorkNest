const Order = require("./order.model");

exports.findAllActive = () => {
  return Order.find({ deleted: false })
    .populate({ path: "addedBy", select: "empId name" })
    .populate({
      path: "quotationId",
      select: "customerId quotationId total products",
      populate: [
        {
          path: "customerId",
          select: "name address contact email gst company",
        },
        {
          path: "products",
        },
      ],
    });
};

exports.findByOrderId = (orderId) => {
  return Order.findOne({ orderId });
};

exports.findDetailedByOrderId = (orderId) => {
  return Order.findOne({ orderId })
    .populate("addedBy")
    .populate("quotationId")
    .populate("quotationId.products")
    .populate("quotationId.customerId");
};

exports.saveOrder = (order) => {
  return order.save();
};

exports.countDocuments = (filter) => {
  return Order.countDocuments(filter);
};