const CustomerRepository = require("./customer.repository");
const AppError = require("../../utils/AppError");
const { createHash } = require("crypto");
const getNextSequence = require("../../utils/getNextSequence");
const { hasPermission } = require("../../utils/rolePermissions");
const PERMISSIONS = require("../../utils/permissions");
const { validateCreateCustomer, validateCreateRequestKey } = require("./customer.validation");

exports.getCustomerById = async (customerId) => {
  const customer = await CustomerRepository.findCustomerDetails(customerId);
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
};

exports.createCustomer = async (input, actor, requestKey) => {
  if (!actor?._id) throw new AppError("Authentication required", 401);
  if (!hasPermission(actor.role, PERMISSIONS.CUSTOMER_CREATE)) throw new AppError("Insufficient permissions for this action", 403);
  const data = await validateCreateCustomer(input);
  const key = validateCreateRequestKey(requestKey);
  const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");

  return CustomerRepository.runInTransaction(async (session) => {
    // All create attempts take the same counter write before the duplicate
    // lookup, so concurrent exact-email checks cannot both commit a customer.
    const number = await getNextSequence("customerId", session);
    if (key) {
      const previous = await CustomerRepository.findByCreateRequest(actor._id, key, session);
      if (previous) {
        if (previous.createRequestHash !== hash) throw new AppError("Idempotency-Key was already used for different customer data", 409);
        if (previous.deleted) throw new AppError("The customer created by this request was archived; start a new request", 409);
        return previous;
      }
    }
    if (data.email && await CustomerRepository.findByEmail(data.email, session)) {
      throw new AppError("Email already in use", 400);
    }
    return CustomerRepository.createCustomer({
      ...data, customerId: `CUST${String(number).padStart(3, "0")}`, addedBy: actor._id,
      ...(key ? { createRequestKey: key, createRequestHash: hash } : {}),
    }, session);
  });
};

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
