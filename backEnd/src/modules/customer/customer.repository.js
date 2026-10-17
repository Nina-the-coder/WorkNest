const Customer = require("./customer.model");
const mongoose = require("mongoose");

const withSession = (query, session) => session ? query.session(session) : query;
const creatorProjection = "name email empId";

exports.findAllCustomers = async () => {
  return await Customer.find({ deleted: false }).populate("addedBy", creatorProjection);
};

exports.findCustomerDetails = (customerId) => Customer.findOne({ customerId, deleted: false })
  .populate("addedBy", creatorProjection);

exports.findActiveByCustomerId = async (customerId) => {
  return await Customer.findOne({ customerId, deleted: false });
};

exports.findByEmail = async (email, session) => {
  return await withSession(Customer.findOne({ email }), session);
};

exports.findByCreateRequest = (addedBy, createRequestKey, session) => withSession(
  Customer.findOne({ addedBy, createRequestKey }).select("+createRequestKey +createRequestHash"), session,
);

exports.createCustomer = (data, session) => new Customer(data).save({ session });

exports.runInTransaction = async (operation) => {
  // A first-ever pair of creates can race to upsert the unique counter row.
  // MongoDB retries write conflicts itself; retry that initial duplicate-key
  // race as well without weakening atomicity or ignoring any business error.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(() => operation(session), {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });
    } catch (error) {
      if (!(error.code === 11000 && error.keyPattern?.name && attempt < 2)) throw error;
    } finally {
      await session.endSession();
    }
  }
};

exports.save = async (customer) => {
  return await customer.save();
};
