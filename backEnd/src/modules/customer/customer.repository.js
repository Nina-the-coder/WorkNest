const Customer = require("./customer.model");

exports.findAllCustomers = async () => {
  return await Customer.find({ deleted: false }).populate("addedBy");
};

exports.findActiveByCustomerId = async (customerId) => {
  return await Customer.findOne({ customerId, deleted: false });
};

exports.findByEmail = async (email) => {
  return await Customer.findOne({ email });
};

exports.save = async (customer) => {
  return await customer.save();
};