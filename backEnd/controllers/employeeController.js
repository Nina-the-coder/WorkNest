const Task = require("../models/Task");
const Customer = require("../models/Customer");
const Quotation = require("../models/Quotation");
const getNextSequence = require("../utils/getNextSequence");
const Order = require("../models/Order");

// tasks

exports.getTasksByEmployees = async (req, res) => {
  try {
    const { empId } = req.params;

    const tasks = await Task.find({ assignedTo: empId });

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error fetching tasks for employee", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { taskId },
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(400).json({ message: "task not found" });
    }

    res.status(200).json({ message: "Task status updated", task: updatedTask });
  } catch (err) {
    res.status(500).json({
      message: "Error updating the task status...",
      error: err.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const deleted = await Task.deleteOne({ taskId });

    if (deleted.deletedCount === 0) {
      res.status(404).json({ message: "Task not found to delete..." });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in deleting the task...", error: err.message });
  }
};

// customers

exports.getCustomerByEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    const customers = await Customer.find({ addedBy: empId });

    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ message: "Serever eRRor ..", error: err.message });
  }
};

// quotations

exports.submitQuotation = async (req, res) => {
  try {
    const { addedBy, customerId, total, product, isApprovedByDoctor, status } =
      req.body;

    const nextQuotationNumber = await getNextSequence("quotation");
    const newQuotationId = `QUOT${String(nextQuotationNumber).padStart(
      3,
      "0"
    )}`;

    const newQuotation = new Quotation({
      quotationId: newQuotationId,
      addedBy,
      customerId,
      total,
      product,
      isApprovedByDoctor,
      status,
    });

    await newQuotation.save();
    res.status(201).json({
      message: "quotation added successfully...",
      quotation: newQuotation,
    });
  } catch (err) {
    console.error("error in saving the quotation to the database", err);
    res.status(500).json({ message: "SErver eroror" });
  }
};

exports.getQuotations = async (req, res) => {
  try {
    const { empId } = req.params;
    const quotations = await Quotation.find({ addedBy: empId })
      .populate("addedBy")
      .populate("customerId");
    res.status(200).json(quotations);
  } catch (err) {
    console.error("Erorr in fetching the quotations, ", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.editQuotation = async (req, res) => {
  try {
    const { quotationId } = req.params;

    const updatedData = req.body;

    const updatedQuotation = await Quotation.findOneAndUpdate(
      { quotationId },
      updatedData,
      { new: true }
    );

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    res
      .status(200)
      .json({ message: "Quotation updated", quotation: updatedData });
  } catch (err) {
    console.error("Update quotation error:", err);

    res
      .status(500)
      .json({ message: "Error in updating the quotation", error: err.message });
  }
};

// orders
exports.addOrder = async (req, res) => {
  try {
    const { quotationId, addedBy } = req.body;

    const nextOrderNumber = await getNextSequence("order");
    const orderId = `ORD${String(nextOrderNumber).padStart(3, "0")}`;

    const newOrder = new Order({
      orderId: orderId,
      quotationId, // Must be ObjectId
      addedBy,
      status: "confirm",
    });

    await newOrder.save();

    return res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { empId } = req.params;

    // Inside getOrdersByEmployee controller
    const orders = await Order.find({ addedBy: empId }).populate({
      path: "quotationId",
      populate: {
        path: "customerId", // 👈 this populates the nested customer
        model: "Customer",
      },
    });
    console.log(JSON.stringify(orders, null, 2));
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error in fetching the orders ", err);
    res.status(500).json({ message: "SErver error", error: err.message });
  }
};
