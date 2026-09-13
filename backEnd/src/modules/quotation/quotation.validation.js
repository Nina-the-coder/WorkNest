const AppError = require("../../utils/AppError");

/**
 * Validate quotation data structure
 */
exports.validateCreateQuotation = (data) => {
  const { customerId, employeeId, items, validUntil, notes } = data;

  if (!customerId) {
    throw new AppError("Customer ID is required", 400);
  }

  if (!employeeId) {
    throw new AppError("Employee ID is required", 400);
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("Quotation must contain at least one item", 400);
  }

  // Validate each item
  items.forEach((item, index) => {
    if (!item.productId) {
      throw new AppError(`Item ${index + 1}: Product ID is required`, 400);
    }

    if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
      throw new AppError(
        `Item ${index + 1}: Quantity must be greater than 0`,
        400,
      );
    }

    if (Number(item.quantity) !== Math.floor(Number(item.quantity))) {
      throw new AppError(
        `Item ${index + 1}: Quantity must be a whole number`,
        400,
      );
    }

    if (item.unitPrice === undefined || !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
      throw new AppError(
        `Item ${index + 1}: Unit price must be a non-negative number`,
        400,
      );
    }

    if (item.discountAmount !== undefined && (!Number.isFinite(Number(item.discountAmount)) || Number(item.discountAmount) < 0)) {
      throw new AppError(
        `Item ${index + 1}: Discount amount cannot be negative`,
        400,
      );
    }

    const lineSubtotal = Number(item.quantity) * Number(item.unitPrice);
    if (Number(item.discountAmount || 0) > lineSubtotal) {
      throw new AppError(`Item ${index + 1}: Discount cannot exceed item subtotal`, 400);
    }

    if (item.discountPercentage !== undefined) {
      if (!Number.isFinite(Number(item.discountPercentage)) || item.discountPercentage < 0 || item.discountPercentage > 100) {
        throw new AppError(
          `Item ${index + 1}: Discount percentage must be between 0 and 100`,
          400,
        );
      }
    }

    if (item.gstRate !== undefined) {
      if (!Number.isFinite(Number(item.gstRate)) || item.gstRate < 0 || item.gstRate > 100) {
        throw new AppError(
          `Item ${index + 1}: GST rate must be between 0 and 100`,
          400,
        );
      }
    }
  });

  if (validUntil && (Number.isNaN(new Date(validUntil).getTime()) || new Date(validUntil) <= new Date())) {
    throw new AppError("Validity date must be in the future", 400);
  }

  if (notes && typeof notes !== "string") {
    throw new AppError("Notes must be text", 400);
  }
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
  console.log(quotation, updateData);
  if (quotation.status !== "DRAFT" && quotation.status !== "REJECTED") {
    throw new AppError("Only DRAFT or REJECTED quotations can be updated", 400);
  }

  if (updateData.validUntil && (Number.isNaN(new Date(updateData.validUntil).getTime()) || new Date(updateData.validUntil) <= new Date())) {
    throw new AppError("Validity date must be in the future", 400);
  }

  // Use the same item validation rules for edits as creation.
  if (updateData.items && Array.isArray(updateData.items)) {
    exports.validateCreateQuotation({
      customerId: quotation.customerId,
      employeeId: quotation.employeeId,
      items: updateData.items,
      validUntil: updateData.validUntil || quotation.validUntil,
      notes: updateData.notes,
    });
  }
};
