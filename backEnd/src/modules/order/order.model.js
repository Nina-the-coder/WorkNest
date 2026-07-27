const mongoose = require("mongoose");

const productSnapshotSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
});

const customerSnapshotSchema = new mongoose.Schema({
  customerId: String,
  name: String,
  address: String,
  contact: String,
  gst: String,
  email: String,
  status: String,
  companyType: String,
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation", // still keep the link for traceability
      required: true,
    },
    
    // 🔥 snapshot of customer & quotation details
    customerSnapshot: {
      type: customerSnapshotSchema,
      required: true,
    },
    productsSnapshot: {
      type: [productSnapshotSchema],
      required: true,
    },
    totalSnapshot: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },
    dispatchDate: Date,
    dispatchedDate: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
