const mongoose = require("mongoose");
const Quotation = require("./quotation.model");
const QuotationItem = require("./quotationItem.model");
const AppError = require("../../utils/AppError");

const withSession = (query, session) => session ? query.session(session) : query;

// D8 requires a verified replica set. Never silently fall back to partial writes.
exports.runInTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => operation(session), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    });
  } finally {
    await session.endSession();
  }
};

// Populate serially within the transaction; MongoDB sessions do not support
// parallel operations. All projections deliberately exclude identity secrets.
const populateQuotation = query => query.populate([
  { path: "customerId", select: "customerId name email contact address gst", ordered: true },
  { path: "employeeId", select: "name email empId", ordered: true },
  { path: "createdBy", select: "name email empId", ordered: true },
  { path: "submittedBy", select: "name email", ordered: true },
  { path: "approvedBy", select: "name email", ordered: true },
  { path: "rejectedBy", select: "name email", ordered: true },
]);

exports.findAllActive = (query = {}, session) => populateQuotation(
  withSession(Quotation.find({ ...query, deleted: false }), session),
).sort({ createdAt: -1 });

exports.findById = (quotationId, scope = {}, session) => populateQuotation(
  withSession(Quotation.findOne({ ...scope, _id: quotationId, deleted: false }), session),
);

exports.find = quotationId => Quotation.findOne({ quotationId, deleted: false });
exports.createQuotation = (data, session) => new Quotation(data).save(session ? { session } : {});
exports.saveQuotation = (quotation, session) => quotation.save(session ? { session } : {});
exports.createQuotationItem = (data, session) => new QuotationItem(data).save(session ? { session } : {});

// All mutations write the same header, so concurrent edits, decisions and
// reassignment conflict. Retried transactions reload and recheck the new state.
exports.updateIfCurrent = async (quotation, scope, changes, session) => {
  const filter = {
    ...scope, _id: quotation._id, deleted: false, status: quotation.status,
    employeeId: quotation.employeeId?._id || quotation.employeeId,
    updatedAt: quotation.updatedAt,
  };
  const result = await Quotation.findOneAndUpdate(filter, {
    $set: changes, $inc: { __v: 1 },
  }, { new: true, runValidators: true, ...(session ? { session } : {}) });
  if (!result) throw new AppError("Quotation changed; refresh and try again", 409);
  return result;
};

exports.findQuotationItems = (quotationId, session) => withSession(
  QuotationItem.find({ quotationId }), session,
).populate({
  path: "productId", select: "productId name description price",
  // Preserve the historical reference even if its catalog record was removed.
  transform: (document, id) => document || id,
});
exports.findQuotationItem = itemId => QuotationItem.findById(itemId);
exports.deleteQuotationItem = itemId => QuotationItem.findByIdAndDelete(itemId);
exports.deleteQuotationItemsByQuotationId = (quotationId, session) => withSession(
  QuotationItem.deleteMany({ quotationId }), session,
);
exports.countActive = (query = {}, session) => withSession(
  Quotation.countDocuments({ ...query, deleted: false }), session,
);
exports.aggregateQuotations = pipeline => Quotation.aggregate(pipeline);
