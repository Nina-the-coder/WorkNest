const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema(
  {
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Historical pricing - store the price at time of quotation creation
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Item-level discount
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Item-level tax
    gstRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },

    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Final line total: (quantity × unitPrice - discountAmount) + gstAmount
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Taxable amount for this line: (quantity × unitPrice - discountAmount)
    taxableAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("QuotationItem", quotationItemSchema);
