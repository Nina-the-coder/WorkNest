const CustomerService = require("./customer.service");

exports.createCustomer = async (req, res) => {
  const customer = await CustomerService.createCustomer(req.body, req.user, req.get("Idempotency-Key"));
  res.status(201).json({ message: "Customer added successfully", customer });
};

exports.getCustomerById = async (req, res) => {
  const customer = await CustomerService.getCustomerById(req.params.customerId);
  res.status(200).json(customer);
};

exports.getAllCustomers = async (req, res) => {
  const customers = await CustomerService.getAllCustomers();
  res.status(200).json(customers);
};

exports.deleteCustomer = async (req, res) => {
  await CustomerService.deleteCustomer(req.params.customerId, req.user._id);
  res.status(200).json({ message: "Customer deleted successfully" });
};

exports.updateCustomer = async (req, res) => {
  const updatedCustomer = await CustomerService.updateCustomer(
    req.params.customerId,
    req.body,
    req.user._id
  );
  res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });
};
