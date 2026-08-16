const Quotation = require("./quotation.model");
const QuotationItem = require("./quotationItem.model");

/**
 * Find all active quotations (not deleted)
 */
exports.findAllActive = (query = {}) => {
  return Quotation.find({ deleted: false, ...query })
    .populate("customerId", "customerId name email contact")
    .populate("employeeId", "name email empId")
    .populate("approvedBy", "name email")
    .populate("rejectedBy", "name email")
    .sort({ createdAt: -1 });
};

/**
 * Find quotation by MongoDB ID
 */
exports.findById = (quotationId) => {
  return Quotation.findOne({ _id: quotationId, deleted: false })
    .populate("customerId", "customerId name email contact address gst")
    .populate("employeeId", "name email empId")
    .populate("approvedBy", "name email")
    .populate("rejectedBy", "name email");
};

/**
 * Find quotation by quotation ID
 */
exports.find = (quotationId) => {
  return Quotation.findOne({ quotationId, deleted: false });
};

/**
 * Create new quotation
 */
exports.createQuotation = (quotationData) => {
  const quotation = new Quotation(quotationData);
  console.log("Quotation instance created:", quotation);
  return quotation.save();
};

/**
 * Save/update quotation
 */
exports.saveQuotation = (quotation) => {
  return quotation.save();
};

/**
 * Create quotation item
 */
exports.createQuotationItem = (itemData) => {
  const item = new QuotationItem(itemData);
  return item.save();
};

/**
 * Find quotation items by quotation ID
 */
exports.findQuotationItems = (quotationId) => {
  return QuotationItem.find({ quotationId }).populate(
    "productId",
    "productId name description price",
  );
};

/**
 * Find single quotation item
 */
exports.findQuotationItem = (itemId) => {
  return QuotationItem.findById(itemId);
};

/**
 * Delete quotation item
 */
exports.deleteQuotationItem = (itemId) => {
  return QuotationItem.findByIdAndDelete(itemId);
};

/**
 * Delete all items for a quotation (used for bulk delete)
 */
exports.deleteQuotationItemsByQuotationId = (quotationId) => {
  return QuotationItem.deleteMany({ quotationId });
};

/**
 * Count active quotations
 */
exports.countActive = (query = {}) => {
  return Quotation.countDocuments({ deleted: false, ...query });
};

/**
 * Aggregate quotations with pagination and search
 */
exports.aggregateQuotations = (pipeline) => {
  return Quotation.aggregate(pipeline);
};
