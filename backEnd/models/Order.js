const mongoose = require("mongoose");

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
      ref: "Quotation", // this must match the name you used in mongoose.model() for quotation
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    dispatchDate: {
      type: Date,
    },
    dispatchedDate: {
      type: Date,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
