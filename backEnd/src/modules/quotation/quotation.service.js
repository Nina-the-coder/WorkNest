const quotationRepo = require("./quotation.repository");
const AppError = require("../../utils/AppError");
const getNextSequence = require("../../utils/getNextSequence");
const {
  validateCreateQuotation,
  validateStatusTransition,
  validateApproval,
  validateRejection,
  validateUpdateDraft,
} = require("./quotation.validation");

const QUOTATION_STATUS = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CONVERTED",
];

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/**
 * Calculate line total for an item
 * lineTotal = (quantity × unitPrice - discountAmount) + gstAmount
 */
const calculateLineTotal = (item) => {
  const subtotalBeforeDiscount = Number(item.quantity) * Number(item.unitPrice);

  let discountAmount = Number(item.discountAmount) || 0;

  // If discount percentage is provided, calculate discount amount
  if (item.discountPercentage && item.discountPercentage > 0) {
    discountAmount = (subtotalBeforeDiscount * item.discountPercentage) / 100;
  }

  const taxableAmount = subtotalBeforeDiscount - discountAmount;
  const gstRate = item.gstRate ?? 0;
  const gstAmount = (taxableAmount * gstRate) / 100;

  return {
    taxableAmount: roundMoney(taxableAmount),
    gstAmount: roundMoney(gstAmount),
    discountAmount: roundMoney(discountAmount),
    lineTotal: roundMoney(taxableAmount + gstAmount),
  };
};

/**
 * Calculate quotation totals from items
 */
const calculateQuotationTotals = (items) => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalGst = 0;

  items.forEach((item) => {
    const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
    subtotal += itemSubtotal;

    const calc = calculateLineTotal(item);
    totalDiscount += calc.discountAmount;
    totalTaxable += calc.taxableAmount;
    totalGst += calc.gstAmount;
  });

  // Round to 2 decimal places
  const grandTotal = roundMoney(totalTaxable + totalGst);

  return {
    subtotal: roundMoney(subtotal),
    discountAmount: roundMoney(totalDiscount),
    taxableAmount: roundMoney(totalTaxable),
    gstAmount: roundMoney(totalGst),
    grandTotal: grandTotal,
  };
};

/**
 * Get all quotations with pagination and filters
 */
exports.getAllQuotations = async (filters = {}) => {
  const { page = 1, limit = 10, search = "", status } = filters;

  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  if (status) {
    query.status = status;
  }

  if (filters.employeeId) query.employeeId = filters.employeeId;

  // Search by quotation number. Customer-name search requires an aggregate and is
  // deliberately omitted until customer search is shared across modules.
  if (search && search.trim()) {
    query.quotationId = { $regex: search.trim(), $options: "i" };
  }

  const total = await quotationRepo.countActive(query);

  // Fetch quotations
  const quotations = await quotationRepo
    .findAllActive(query)
    .skip(skip)
    .limit(limit);

  return {
    quotations,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get quotation by ID with items
 */
exports.getQuotationById = async (quotationId) => {
  const quotation = await quotationRepo.findById(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Fetch items for this quotation
  const items = await quotationRepo.findQuotationItems(quotationId);

  return {
    ...quotation.toObject(),
    items,
  };
};

/**
 * Create new quotation with items
 */
exports.createQuotation = async (data, userId) => {
  // Validate input

  validateCreateQuotation(data);
  console.log("Validated quotation data:", data);
  const { customerId, employeeId, items, validUntil, notes } = data;

  // Check if customer exists (basic check - should be done by controller after populating)
  // Check if all products exist and are valid (should be done by controller)

  // Generate quotation number
  const nextNumber = await getNextSequence("quotation");
  const quotationId = `QT${String(nextNumber).padStart(4, "0")}`;
  console.log("Generated quotation ID:", quotationId);
  // Calculate totals
  const totals = calculateQuotationTotals(items);

  // Create quotation
  const quotationData = {
    quotationId,
    customerId,
    employeeId,
    status: "DRAFT",
    ...totals,
    validUntil,
    notes: notes || "",
    createdBy: userId,
    updatedBy: userId,
  };

  console.log("Creating quotation with data:", quotationData);
  const quotation = await quotationRepo.createQuotation(quotationData);

  console.log("Quotation created with ID:", quotation._id);

  // Create quotation items
  const savedItems = [];
  for (const item of items) {
    const calc = calculateLineTotal(item);

    const itemData = {
      quotationId: quotation._id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku || "",
      description: item.description || "",
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountAmount: calc.discountAmount,
      discountPercentage: item.discountPercentage || 0,
      gstRate: item.gstRate ?? 18,
      gstAmount: calc.gstAmount,
      taxableAmount: calc.taxableAmount,
      lineTotal: calc.lineTotal,
    };

    const savedItem = await quotationRepo.createQuotationItem(itemData);
    savedItems.push(savedItem);
  }

  return {
    ...quotation.toObject(),
    items: savedItems,
  };
};

/**
 * Update draft quotation with new items
 */
exports.updateQuotation = async (quotationId, updateData, userId) => {
  const quotation = await quotationRepo.findById(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Validate update is allowed
  validateUpdateDraft(quotation, updateData);

  const { items, validUntil, notes } = updateData;

  // If items are provided, rebuild the quotation items
  if (items && Array.isArray(items)) {
    // Delete old items
    await quotationRepo.deleteQuotationItemsByQuotationId(quotationId);

    // Calculate new totals
    const totals = calculateQuotationTotals(items);

    // Update quotation with new totals
    quotation.subtotal = totals.subtotal;
    quotation.discountAmount = totals.discountAmount;
    quotation.taxableAmount = totals.taxableAmount;
    quotation.gstAmount = totals.gstAmount;
    quotation.grandTotal = totals.grandTotal;

    if (validUntil !== undefined) {
      quotation.validUntil = validUntil;
    }

    if (notes !== undefined) {
      quotation.notes = notes;
    }

    quotation.updatedBy = userId;
    await quotationRepo.saveQuotation(quotation);

    // Create new items
    const savedItems = [];
    for (const item of items) {
      const calc = calculateLineTotal(item);

      const itemData = {
        quotationId: quotation._id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || "",
        description: item.description || "",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountAmount: calc.discountAmount,
        discountPercentage: item.discountPercentage || 0,
        gstRate: item.gstRate ?? 18,
        gstAmount: calc.gstAmount,
        taxableAmount: calc.taxableAmount,
        lineTotal: calc.lineTotal,
      };

      const savedItem = await quotationRepo.createQuotationItem(itemData);
      savedItems.push(savedItem);
    }

    return {
      ...quotation.toObject(),
      items: savedItems,
    };
  } else {
    // Just update metadata if no items provided
    if (validUntil !== undefined) {
      quotation.validUntil = validUntil;
    }

    if (notes !== undefined) {
      quotation.notes = notes;
    }

    quotation.updatedBy = userId;
    await quotationRepo.saveQuotation(quotation);

    const items = await quotationRepo.findQuotationItems(quotationId);

    return {
      ...quotation.toObject(),
      items,
    };
  }
};

/**
 * Submit quotation for approval
 */
exports.submitQuotation = async (quotationId, userId) => {
  const quotation = await quotationRepo.findById(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Validate transition
  validateStatusTransition(quotation.status, "SUBMITTED");

  // Verify quotation has items
  const items = await quotationRepo.findQuotationItems(quotationId);
  if (!items || items.length === 0) {
    throw new AppError("Cannot submit empty quotation", 400);
  }

  quotation.status = "SUBMITTED";
  quotation.updatedBy = userId;
  await quotationRepo.saveQuotation(quotation);

  return quotation;
};

/**
 * Approve quotation
 */
exports.approveQuotation = async (quotationId, userId) => {
  const quotation = await quotationRepo.findById(quotationId);

  console.log("Approving quotation:", quotationId, "Current status:", quotation ? quotation.status : "Not found");

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  console.log("Current quotation:-----------------------", quotation);
  // Validate approval
  validateApproval(quotation);

  console.log("Validation passed. Approving quotation:", quotationId);

  quotation.status = "APPROVED";
  quotation.approvedBy = userId;
  quotation.approvedAt = new Date();
  quotation.updatedBy = userId;

  await quotationRepo.saveQuotation(quotation);

  return quotation;
};

/**
 * Reject quotation
 */
exports.rejectQuotation = async (quotationId, reason, userId) => {
  const quotation = await quotationRepo.findById(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  // Validate rejection
  validateRejection(quotation, reason);

  quotation.status = "REJECTED";
  quotation.rejectionReason = reason;
  quotation.rejectedBy = userId;
  quotation.rejectedAt = new Date();
  quotation.updatedBy = userId;

  await quotationRepo.saveQuotation(quotation);

  return quotation;
};

/** Return a rejected quotation to its editable draft state. */
exports.reopenQuotation = async (quotationId, userId) => {
  const quotation = await quotationRepo.findById(quotationId);
  if (!quotation) throw new AppError("Quotation not found", 404);

  validateStatusTransition(quotation.status, "DRAFT");
  quotation.status = "DRAFT";
  quotation.rejectionReason = null;
  quotation.rejectedBy = null;
  quotation.rejectedAt = null;
  quotation.updatedBy = userId;
  await quotationRepo.saveQuotation(quotation);
  return quotation;
};

/**
 * Delete quotation (soft delete)
 */
exports.deleteQuotation = async (quotationId, userId) => {
  const quotation = await quotationRepo.findById(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  quotation.deleted = true;
  quotation.deletedAt = new Date();
  quotation.updatedBy = userId;

  await quotationRepo.saveQuotation(quotation);

  return quotation;
};

exports.calculateQuotationTotals = calculateQuotationTotals;
exports.calculateLineTotal = calculateLineTotal;
