const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
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
    type: String,
    default: "admin"
  },
});

module.exports = mongoose.model("Customer", customerSchema);
