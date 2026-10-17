const quotationRepo = require("./quotation.repository");
const Product = require("../product/product.model");
const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");
const getNextSequence = require("../../utils/getNextSequence");
const { getResourceScope } = require("../../utils/resourceAccess");
const {
  validateCreateQuotation, validateStatusTransition, validateApproval,
  validateRejection, validateUpdateDraft, validateCustomerReference,
  validateEmployeeReference,
} = require("./quotation.validation");
const {
  normalizeItemPricing, calculateLineTotal, calculateQuotationTotals,
  calculateStoredQuotationTotals,
} = require("./quotation.pricing");

const referenceId = reference => String(reference?._id || reference).toLowerCase();
const sessionArgs = session => session ? [session] : [];
const plain = document => document.toObject ? document.toObject() : { ...document };

const findAccessibleQuotation = async (id, user, session) => {
  const scope = getResourceScope(user, "employeeId");
  const quotation = await quotationRepo.findById(id, scope, ...sessionArgs(session));
  if (!quotation || (scope.employeeId && referenceId(quotation.employeeId) !== referenceId(scope.employeeId))) {
    throw new AppError("Quotation not found", 404);
  }
  return quotation;
};

// Catalog data is resolved only for newly added products. Existing commercial
// snapshots survive catalog renames, price changes and removed product records.
const prepareItems = async (items, existingItems, session) => {
  const prepared = [];
  for (const item of items) {
    const byId = item._id && existingItems.find(existing => referenceId(existing._id) === referenceId(item._id));
    const byProduct = existingItems.find(existing => referenceId(existing.productId) === referenceId(item.productId));
    if (item._id && (!byId || referenceId(byId.productId) !== referenceId(item.productId))) {
      throw new AppError("Quotation item does not match its product", 400);
    }
    const existing = byId || byProduct;
    let snapshot = existing;
    if (!snapshot) {
      if (!mongoose.isObjectIdOrHexString(item.productId)) throw new AppError("Invalid product ID", 400);
      const query = Product.findById(item.productId);
      const product = await (session ? query.session(session) : query);
      if (!product || product.deleted || (product.status && product.status !== "active")) {
        throw new AppError("Product not found", 404);
      }
      snapshot = { productName: product.name, sku: product.productId, description: product.description };
    }
    const sameCommercialInputs = existing && ["quantity", "unitPrice", "discountAmount", "discountPercentage", "gstRate"].every(field => {
      // A positive percentage owns the effective discount; its stored amount is
      // derived, so omitting or changing that amount does not reprice the line.
      if (field === "discountAmount" && Number(item.discountPercentage) > 0) return true;
      const input = item[field] === undefined ? (field === "gstRate" ? existing.gstRate : 0) : item[field];
      return Number(input) === existing[field];
    });
    // A normal form save must not repair legacy rounding silently. Reprice only
    // a deliberately changed commercial line, keeping untouched stored amounts.
    const pricing = sameCommercialInputs
      ? Object.fromEntries(["quantity", "unitPrice", "discountAmount", "discountPercentage", "gstRate", "taxableAmount", "gstAmount", "lineTotal"].map(field => [field, existing[field]]))
      : normalizeItemPricing(item, { defaultGstRate: existing?.gstRate ?? 18 });
    prepared.push({
      productId: item.productId,
      productName: snapshot.productName,
      sku: snapshot.sku || "", description: snapshot.description || "", ...pricing,
    });
  }
  return prepared;
};

const saveItems = async (quotationId, items, session) => {
  const saved = [];
  // MongoDB does not support parallel operations inside a transaction.
  for (const item of items) {
    saved.push(await quotationRepo.createQuotationItem({ ...item, quotationId }, ...sessionArgs(session)));
  }
  return saved;
};

const changeHeader = (quotation, user, changes, session) => quotationRepo.updateIfCurrent(
  quotation, getResourceScope(user, "employeeId"), { ...changes, updatedBy: user._id }, ...sessionArgs(session),
);

exports.getAllQuotations = (filters = {}, user) => quotationRepo.runInTransaction(async session => {
  const { page = 1, limit = 10, search = "", status } = filters;
  const query = getResourceScope(user, "employeeId");
  if (status) query.status = status;
  if (search && search.trim()) query.quotationId = { $regex: search.trim(), $options: "i" };
  const total = await quotationRepo.countActive(query, ...sessionArgs(session));
  const quotations = await quotationRepo.findAllActive(query, ...sessionArgs(session)).skip((page - 1) * limit).limit(limit);
  return { quotations, total, page, limit, totalPages: Math.ceil(total / limit) };
});

exports.getQuotationById = (id, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  const items = await quotationRepo.findQuotationItems(id, ...sessionArgs(session));
  return { ...plain(quotation), items };
});

exports.createQuotation = (input, user) => quotationRepo.runInTransaction(async session => {
  const data = { ...input, ...getResourceScope(user, "employeeId") };
  validateCreateQuotation(data);
  await validateCustomerReference(data.customerId, ...sessionArgs(session));
  await validateEmployeeReference(data.employeeId, ...sessionArgs(session));
  const items = await prepareItems(data.items, [], session);
  const totals = calculateQuotationTotals(items);
  // Sequence gaps after a rollback/retry are acceptable; numbers remain unique.
  const number = await getNextSequence("quotation");
  const quotation = await quotationRepo.createQuotation({
    quotationId: `QT${String(number).padStart(4, "0")}`, customerId: data.customerId,
    employeeId: data.employeeId, status: "DRAFT", ...totals,
    validUntil: data.validUntil, notes: data.notes || "", createdBy: user._id, updatedBy: user._id,
  }, ...sessionArgs(session));
  const savedItems = await saveItems(quotation._id, items, session);
  return { ...plain(quotation), items: savedItems };
});

exports.updateQuotation = (id, data, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  const scope = getResourceScope(user, "employeeId");
  if (scope.employeeId && data.employeeId !== undefined && referenceId(data.employeeId) !== referenceId(scope.employeeId)) {
    throw new AppError("Quotation ownership cannot be changed", 403);
  }
  // Check the lock before resolving commercial data. Existing zero GST must be
  // resolved before validation as well as before calculation/persistence.
  validateUpdateDraft(quotation, { ...data, items: undefined });
  const existingItems = await quotationRepo.findQuotationItems(id, ...sessionArgs(session));
  const validationItems = Array.isArray(data.items) ? data.items.map(item => {
    if (!item || typeof item !== "object" || item.gstRate !== undefined) return item;
    const existing = existingItems.find(saved => referenceId(saved.productId) === referenceId(item.productId));
    return existing ? { ...item, gstRate: existing.gstRate } : item;
  }) : data.items;
  validateUpdateDraft(quotation, { ...data, items: validationItems });
  if (data.customerId !== undefined && referenceId(data.customerId) !== referenceId(quotation.customerId)) {
    await validateCustomerReference(data.customerId, ...sessionArgs(session));
  }
  if (data.employeeId !== undefined && referenceId(data.employeeId) !== referenceId(quotation.employeeId)) {
    await validateEmployeeReference(data.employeeId, ...sessionArgs(session));
  }
  const changes = {};
  for (const key of ["customerId", "employeeId", "validUntil", "notes"]) {
    if (data[key] !== undefined) changes[key] = data[key];
  }
  let items;
  if (data.items !== undefined) {
    items = await prepareItems(data.items, existingItems, session);
    Object.assign(changes, calculateStoredQuotationTotals(items));
  }
  const updated = await changeHeader(quotation, user, changes, session);
  if (items) {
    await quotationRepo.deleteQuotationItemsByQuotationId(id, ...sessionArgs(session));
    items = await saveItems(quotation._id, items, session);
  }
  return { ...plain(updated), items: items || existingItems };
});

const validateSubmission = async (quotation, items, session) => {
  validateCreateQuotation({
    customerId: quotation.customerId?._id || quotation.customerId,
    employeeId: quotation.employeeId?._id || quotation.employeeId,
    items, notes: quotation.notes, validUntil: quotation.validUntil,
  });
  await validateCustomerReference(quotation.customerId?._id || quotation.customerId, ...sessionArgs(session));
  await validateEmployeeReference(quotation.employeeId, ...sessionArgs(session));
  for (const item of items) {
    if (!item.productName?.trim()) throw new AppError("Quotation item snapshot is incomplete", 400);
    const pricing = normalizeItemPricing(item);
    for (const field of ["unitPrice", "discountAmount", "taxableAmount", "gstAmount", "lineTotal"]) {
      if (item[field] !== pricing[field]) throw new AppError("Quotation pricing is inconsistent; review and revise the affected item before submitting", 400);
    }
  }
  const totals = calculateQuotationTotals(items);
  for (const [field, amount] of Object.entries(totals)) {
    if (quotation[field] !== amount) throw new AppError("Quotation totals are inconsistent; save the draft again", 400);
  }
};

exports.submitQuotation = (id, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  validateStatusTransition(quotation.status, "SUBMITTED");
  const items = await quotationRepo.findQuotationItems(id, ...sessionArgs(session));
  if (!items?.length) throw new AppError("Cannot submit empty quotation", 400);
  await validateSubmission(quotation, items, session);
  return changeHeader(quotation, user, { status: "SUBMITTED", submittedBy: user._id, submittedAt: new Date() }, session);
});

exports.approveQuotation = (id, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  validateApproval(quotation);
  return changeHeader(quotation, user, { status: "APPROVED", approvedBy: user._id, approvedAt: new Date() }, session);
});

exports.rejectQuotation = (id, reason, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  validateRejection(quotation, reason);
  return changeHeader(quotation, user, {
    status: "REJECTED", rejectionReason: reason.trim(), rejectedBy: user._id, rejectedAt: new Date(),
  }, session);
});

exports.reopenQuotation = (id, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  validateStatusTransition(quotation.status, "DRAFT");
  // Retain the most recent rejection; do not invent a full revision history.
  return changeHeader(quotation, user, { status: "DRAFT" }, session);
});

exports.deleteQuotation = (id, user) => quotationRepo.runInTransaction(async session => {
  const quotation = await findAccessibleQuotation(id, user, session);
  return changeHeader(quotation, user, { deleted: true, deletedAt: new Date() }, session);
});

exports.calculateQuotationTotals = calculateQuotationTotals;
exports.calculateLineTotal = calculateLineTotal;
