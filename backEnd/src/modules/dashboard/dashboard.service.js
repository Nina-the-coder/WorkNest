const TaskRepository = require("../task/task.repository");
const QuotationRepository = require("../quotation/quotation.repository");
const OrderRepository = require("../order/order.repository");
const ProductRepository = require("../product/product.repository");

exports.fetchMetrics = async () => {
  const pendingTasks = await TaskRepository.countDocuments({ status: "pending", deleted: false });
  const quotationsGiven = await QuotationRepository.countDocuments({});
  const confirmedOrders = await OrderRepository.countDocuments({});
  const products = await ProductRepository.countDocuments({}); // Assuming product IDs start from 1

  return { pendingTasks, quotationsGiven, confirmedOrders, products };
};
