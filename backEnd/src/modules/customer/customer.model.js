const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    contact: {
      type: String,
    },
    gst: {
      type: String,
    },
    email: {
      type: String,
    },
    status: {
      type: String,
    },
    companyType: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional retry metadata. Legacy records need no migration, and these
    // implementation details are never part of a business API response.
    createRequestKey: { type: String, select: false },
    createRequestHash: { type: String, select: false },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: (_document, customer) => {
      delete customer.createRequestKey;
      delete customer.createRequestHash;
      return customer;
    } },
    toObject: { transform: (_document, customer) => {
      delete customer.createRequestKey;
      delete customer.createRequestHash;
      return customer;
    } },
  }
);

customerSchema.index({ addedBy: 1, createRequestKey: 1 }, {
  unique: true,
  partialFilterExpression: { createRequestKey: { $type: "string" } },
});

module.exports = mongoose.model("Customer", customerSchema);
