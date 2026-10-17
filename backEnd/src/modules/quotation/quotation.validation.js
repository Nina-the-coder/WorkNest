const AppError = require("../../utils/AppError");
const mongoose = require("mongoose");
const Customer = require("../customer/customer.model");
const User = require("../../models/user.model");
const { normalizeItemPricing } = require("./quotation.pricing");

const referenceId = (value) => value?._id || value;
const validateValidity = (value) => {
  if (value === undefined) return;
  if ((typeof value !== "string" && !(value instanceof Date)) ||
      (typeof value === "string" && !value.trim()) ||
      !Number.isFinite(new Date(value).getTime()) || new Date(value).getTime() <= Date.now()) {
    throw new AppError("Validity date must be in the future", 400);
  }
};
const validateNotes = (value) => {
  if (value !== undefined && typeof value !== "string") throw new AppError("Notes must be text", 400);
};

exports.validateCustomerReference = async (customerId, session) => {
  const id = referenceId(customerId);
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("Invalid customer ID", 400);
  }
  const query = Customer.findOne({ _id: id, deleted: false });
  const customer = await (session ? query.session(session) : query);
  if (!customer) throw new AppError("Customer not found", 404);
  if (customer.status && customer.status.toLowerCase() !== "active") {
    throw new AppError("Customer is not active", 400);
  }
};

exports.validateEmployeeReference = async (employeeId, session) => {
  const id = referenceId(employeeId);
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError("Invalid employee ID", 400);
  }
  const query = User.findOne({ _id: id, deleted: false }).select("_id status");
  const user = await (session ? query.session(session) : query);
  if (!user) throw new AppError("Employee not found", 404);
  if (user.status !== "active") {
    throw new AppError("Employee is not active", 400);
  }
};

/**
 * Validate quotation data structure
 */
exports.validateCreateQuotation = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new AppError("Quotation data is required", 400);
  const { customerId, employeeId, items, validUntil, notes } = data;
  for (const [field, label] of [[customerId, "Customer"], [employeeId, "Employee"]]) {
    const id = referenceId(field);
    if (!id) throw new AppError(`${label} ID is required`, 400);
    if (!mongoose.isObjectIdOrHexString(id)) throw new AppError(`Invalid ${label.toLowerCase()} ID`, 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Quotation must contain at least one item", 400);
  }
  const products = new Set();
  items.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new AppError(`Item ${index + 1}: Item must be an object`, 400);
    const productId = referenceId(item.productId);
    if (!productId) throw new AppError(`Item ${index + 1}: Product ID is required`, 400);
    if (!mongoose.isObjectIdOrHexString(productId)) throw new AppError(`Item ${index + 1}: Invalid product ID`, 400);
    const key = String(productId).toLowerCase();
    if (products.has(key)) throw new AppError("Duplicate products are not allowed", 400);
    products.add(key);
    try { normalizeItemPricing(item); }
    catch (error) {
      if (error instanceof AppError) throw new AppError(`Item ${index + 1}: ${error.message}`, error.statusCode);
      throw error;
    }
  });
  validateValidity(validUntil);
  validateNotes(notes);
};

/**
 * Validate status transition
 */
exports.validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    DRAFT: ["SUBMITTED"],
    SUBMITTED: ["APPROVED", "REJECTED"],
    APPROVED: ["CONVERTED"],
    REJECTED: ["DRAFT"],
    CONVERTED: [],
  };

  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      400,
    );
  }
};

/**
 * Validate approval data
 */
exports.validateApproval = (quotation) => {
  if (quotation.status !== "SUBMITTED") {
    throw new AppError("Only SUBMITTED quotations can be approved", 400);
  }
};

/**
 * Validate rejection data
 */
exports.validateRejection = (quotation, reason) => {
  if (quotation.status !== "SUBMITTED") {
    throw new AppError("Only SUBMITTED quotations can be rejected", 400);
  }

  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    throw new AppError("Rejection reason is required", 400);
  }
};

/**
 * Validate update draft quotation
 */
exports.validateUpdateDraft = (quotation, updateData) => {
  if (quotation.status !== "DRAFT" && quotation.status !== "REJECTED") {
    throw new AppError("Only DRAFT or REJECTED quotations can be updated", 400);
  }
  if (!updateData || typeof updateData !== "object" || Array.isArray(updateData)) throw new AppError("Quotation update is required", 400);
  validateValidity(updateData.validUntil);
  validateNotes(updateData.notes);
  if (updateData.items !== undefined) {
    exports.validateCreateQuotation({
      customerId: updateData.customerId === undefined ? quotation.customerId : updateData.customerId,
      employeeId: updateData.employeeId === undefined ? quotation.employeeId : updateData.employeeId,
      items: updateData.items,
      // An omitted old date is not newly supplied. Submission validates it later.
      validUntil: updateData.validUntil,
      notes: updateData.notes,
    });
  }
};
