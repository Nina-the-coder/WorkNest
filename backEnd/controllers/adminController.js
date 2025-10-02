const Task = require("../models/Task");
const Quotation = require("../models/Quotation");
const Order = require("../models/Order");
const getNextSequence = require("../utils/getNextSequence");

exports.fetchMetrics = async (req, res) => {
  try {
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const quotationsGiven = await Quotation.countDocuments({});
    const confirmedOrders = await Order.countDocuments({  });
    const products = await getNextSequence("product") - 1; // Assuming product IDs start from 1   
    res.status(200).json({
      pendingTasks,
      quotationsGiven,
        confirmedOrders,
        products,
    });
  } catch (err) {
    console.error("Error fetching dashboard metrics:", err);
    res.status(500).json({ message: "Server error" });
  }
};
