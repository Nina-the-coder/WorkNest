const mongoose = require("mongoose");
const { allowedTransitions } = require("./order.validation");

const productSnapshotSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
  sku: String,
  description: String,
  unitPrice: Number,
  discountPercentage: Number,
  discountAmount: Number,
  gstRate: Number,
  taxableAmount: Number,
  gstAmount: Number,
  lineTotal: Number,
});

const customerSnapshotSchema = new mongoose.Schema({
  customerId: String,
  _customerId: mongoose.Schema.Types.ObjectId,
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
    
    // Historical orders remain outside the new conversion-only constraint.
    sourceType: { type: String, enum: ["quotation_conversion"] },
    quotationNumber: String,
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

    subtotal: Number,
    discountPercentage: Number,
    discountAmount: Number,
    taxableAmount: Number,
    gstRate: Number,
    gstAmount: Number,
    grandTotal: Number,

    status: {
      type: String,
      required: true,
    },
    dispatchDate: Date,
    dispatchedDate: Date,
    confirmedAt: Date,
    deliveredAt: Date,
    closedAt: Date,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancellationReason: String,
    statusUpdatedAt: Date,
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

OrderSchema.index({ quotationId: 1 }, {
  unique: true,
  partialFilterExpression: { sourceType: "quotation_conversion" },
});
OrderSchema.virtual("allowedTransitions").get(function () {
  return this.deleted ? [] : allowedTransitions(this.status);
});

module.exports = mongoose.model("Order", OrderSchema);
