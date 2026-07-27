const Quotation = require("./quotation.model");

exports.findAllActive = () => {
  return Quotation.find({ deleted: false })
    .populate({ path: "addedBy", select: "empId name" })
    .populate({ path: "customerId", select: "customerId name" });
};

exports.findActiveByQuotationId = (quotationId) => {
  return Quotation.findOne({ quotationId, deleted: false });
};

exports.saveQuotation = (quotation) => {
  return quotation.save();
};

exports.countDocuments = (filter) => {
  return Quotation.countDocuments(filter);
};