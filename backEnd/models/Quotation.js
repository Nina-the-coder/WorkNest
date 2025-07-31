const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
});

const QuotationModal = mongoose.Schema(
  {
    quotationId: {
      type: String,
      required: true,
      unique: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    products: {
      type: [productSchema],
      required: true,
    },
    isApprovedByDoctor: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", QuotationModal);
