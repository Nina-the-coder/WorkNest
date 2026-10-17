const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");
const { calculateStoredQuotationTotals } = require("../quotation/quotation.pricing");

const TRANSITIONS = Object.freeze({
  pending: ["confirm", "cancelled"],
  confirm: ["dispatched", "cancelled"],
  dispatched: ["delivered"],
  delivered: ["closed"],
  closed: [],
  cancelled: [],
});

exports.allowedTransitions = status => [...(TRANSITIONS[status] || [])];

exports.validateConversionBody = body => {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) {
    throw new AppError("Conversion does not accept customer, pricing or audit overrides", 400);
  }
};

exports.validateStatusUpdate = (order, payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).some(key => !["status", "reason", "expectedStatus"].includes(key))) {
    throw new AppError("Only order status, expectedStatus and cancellation reason may be updated", 400);
  }
  if (typeof payload.status !== "string" || !Object.hasOwn(TRANSITIONS, payload.status)) {
    throw new AppError("Invalid order status", 400);
  }
  if (payload.expectedStatus !== undefined && typeof payload.expectedStatus !== "string") {
    throw new AppError("expectedStatus must be text", 400);
  }
  if (payload.expectedStatus !== undefined && payload.expectedStatus !== order.status) {
    throw new AppError("Order changed; refresh and try again", 409);
  }
  if (!exports.allowedTransitions(order.status).includes(payload.status)) {
    throw new AppError(`Cannot transition from ${order.status} to ${payload.status}`, 400);
  }
  if (payload.status === "cancelled") {
    if (typeof payload.reason !== "string" || !payload.reason.trim()) {
      throw new AppError("Cancellation reason is required", 400);
    }
  } else if (payload.reason !== undefined) {
    throw new AppError("A reason may only be supplied when cancelling an order", 400);
  }
};

// Validate stored components, without applying today's pricing rules or looking
// up a live product. Conversion never rewrites approved commercial values.
exports.validateApprovedSnapshot = (quotation, items) => {
  const fail = message => { throw new AppError(`Approved quotation requires review: ${message}`, 409); };
  const numeric = (value, label, maximum = Number.MAX_SAFE_INTEGER / 100) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum) fail(`${label} is invalid`);
  };
  if (!Array.isArray(items) || !items.length) fail("items are missing");
  if (typeof quotation.quotationId !== "string" || !quotation.quotationId.trim()) fail("quotation number is missing");
  for (const field of ["discountPercentage", "gstRate"]) {
    if (quotation[field] !== undefined) numeric(quotation[field], field, 100);
  }
  const products = new Set();
  for (const item of items) {
    const id = item.productId?._id || item.productId;
    if (!mongoose.isObjectIdOrHexString(id)) fail("a product reference is missing");
    if (products.has(String(id))) fail("duplicate product references");
    products.add(String(id));
    if (typeof item.productName !== "string" || !item.productName.trim()) fail("a product name is missing");
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) fail("quantity is invalid");
    for (const field of ["unitPrice", "discountAmount", "taxableAmount", "gstAmount", "lineTotal"]) numeric(item[field], field);
    for (const field of ["discountPercentage", "gstRate"]) numeric(item[field], field, 100);
    try {
      // Aggregation rounds inputs to cents. Reject a subcent stored component
      // before comparing totals, rather than allowing that rounding to hide it.
      // Historical unit prices and percentage rates remain copied unchanged.
      const stored = calculateStoredQuotationTotals([item]);
      for (const [field, totalField] of Object.entries({
        discountAmount: "discountAmount", taxableAmount: "taxableAmount",
        gstAmount: "gstAmount", lineTotal: "grandTotal",
      })) {
        if (item[field] !== stored[totalField]) fail(`${field} must preserve whole cents`);
      }
      // Sum each saved component as cents, avoiding binary floating-point
      // addition. This checks integrity without recalculating a rate or price.
      const components = calculateStoredQuotationTotals([
        { discountAmount: 0, taxableAmount: item.taxableAmount, gstAmount: 0, lineTotal: item.lineTotal },
        { discountAmount: 0, taxableAmount: item.gstAmount, gstAmount: 0, lineTotal: 0 },
      ]);
      if (components.taxableAmount !== components.grandTotal) fail("line total does not match stored tax components");
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 400) fail(error.message);
      throw error;
    }
  }
  let totals;
  try { totals = calculateStoredQuotationTotals(items); }
  catch (error) {
    if (error instanceof AppError) fail(error.message);
    throw error;
  }
  for (const [field, value] of Object.entries(totals)) {
    numeric(quotation[field], field);
    if (quotation[field] !== value) fail(`${field} does not match stored items`);
  }
};
