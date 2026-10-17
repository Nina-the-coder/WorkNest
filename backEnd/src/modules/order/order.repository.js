const Order = require("./order.model");
const AppError = require("../../utils/AppError");

const withSession = (query, session) => session ? query.session(session) : query;
const populateOrder = query => query.populate([
  { path: "addedBy", select: "empId name email", ordered: true },
  { path: "updatedBy", select: "empId name email", ordered: true },
  { path: "statusUpdatedBy", select: "empId name email", ordered: true },
  { path: "cancelledBy", select: "empId name email", ordered: true },
  { path: "quotationId", select: "quotationId status", ordered: true },
]);

exports.findAllActive = () => populateOrder(Order.find({ deleted: false })).sort({ createdAt: -1 });
exports.findByOrderId = (orderId, session) => withSession(Order.findOne({ orderId, deleted: false }), session);
exports.findDetailedByOrderId = (orderId, session) => populateOrder(exports.findByOrderId(orderId, session));
// Archived/unmarked historical links must also block duplicate conversion.
exports.findByQuotationId = (quotationId, session) => withSession(Order.find({ quotationId }), session);
exports.createOrder = (data, session) => new Order(data).save(session ? { session } : {});
exports.saveOrder = (order, session) => order.save(session ? { session } : {});
exports.updateIfCurrent = async (order, changes) => {
  const result = await Order.findOneAndUpdate({
    _id: order._id, deleted: false, status: order.status, updatedAt: order.updatedAt,
    __v: order.__v,
  }, { $set: changes, $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!result) throw new AppError("Order changed; refresh and try again", 409);
  return result;
};
exports.countDocuments = filter => Order.countDocuments(filter);
