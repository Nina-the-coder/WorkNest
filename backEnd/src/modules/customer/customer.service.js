const CustomerRepository = require("./customer.repository");
const AppError = require("../../utils/AppError");

exports.getAllCustomers = async () => {
  return await CustomerRepository.findAllCustomers();
};

exports.deleteCustomer = async (customerId, userId) => {
  const customer = await CustomerRepository.findActiveByCustomerId(customerId);

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  customer.deleted = true;
  customer.deletedAt = new Date();
  customer.updatedBy = userId;

  await CustomerRepository.save(customer);
};

exports.updateCustomer = async (customerId, data, userId) => {
  const { name, address, contact, gst, email, status, companyType } = data;

  const customer = await CustomerRepository.findActiveByCustomerId(customerId);

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (name) customer.name = name;
  if (address) customer.address = address;
  if (contact) customer.contact = contact;
  if (gst) customer.gst = gst;

  if (email && email !== customer.email) {
    const existingCustomer = await CustomerRepository.findByEmail(email);

    if (existingCustomer) {
      throw new AppError("Email already in use", 400);
    }

    customer.email = email;
  }

  if (status) customer.status = status;
  if (companyType) customer.companyType = companyType;

  customer.updatedBy = userId;

  await CustomerRepository.save(customer);

  return customer;
};