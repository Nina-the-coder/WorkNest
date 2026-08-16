/**
 * Quotation utility functions for calculations and formatting
 */

/**
 * Calculate line total for a quotation item
 * lineTotal = (quantity × unitPrice - discountAmount) + gstAmount
 */
export const calculateLineTotal = (
  quantity,
  unitPrice,
  discountAmount = 0,
  gstRate = 18,
) => {
  if (!quantity || !unitPrice) return 0;

  const subtotal = quantity * unitPrice;
  const taxableAmount = Math.max(0, subtotal - (discountAmount || 0));
  const gstAmount = (taxableAmount * (gstRate || 0)) / 100;

  return Math.round((taxableAmount + gstAmount) * 100) / 100;
};

/**
 * Calculate taxable amount for an item
 */
export const calculateTaxableAmount = (
  quantity,
  unitPrice,
  discountAmount = 0,
) => {
  if (!quantity || !unitPrice) return 0;

  const subtotal = quantity * unitPrice;
  const taxableAmount = Math.max(0, subtotal - (discountAmount || 0));

  return Math.round(taxableAmount * 100) / 100;
};

/**
 * Calculate GST amount for an item
 */
export const calculateGstAmount = (taxableAmount, gstRate = 18) => {
  if (!taxableAmount) return 0;

  const gstAmount = (taxableAmount * (gstRate || 0)) / 100;
  return Math.round(gstAmount * 100) / 100;
};

/**
 * Calculate quotation totals from items
 */
export const calculateQuotationTotals = (items = []) => {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalGst = 0;

  items.forEach((item) => {
    const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
    subtotal += itemSubtotal;

    const discountAmount = item.discountAmount || 0;
    totalDiscount += discountAmount;

    const taxableAmount = Math.max(0, itemSubtotal - discountAmount);
    totalTaxable += taxableAmount;

    const gstAmount = (taxableAmount * (item.gstRate || 18)) / 100;
    totalGst += gstAmount;
  });

  const grandTotal = totalTaxable + totalGst;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(totalDiscount * 100) / 100,
    taxableAmount: Math.round(totalTaxable * 100) / 100,
    gstAmount: Math.round(totalGst * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get status badge color
 */
export const getStatusBadgeColor = (status) => {
  const statusColorMap = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CONVERTED: "bg-purple-100 text-purple-800",
  };

  return statusColorMap[status] || "bg-gray-100 text-gray-800";
};

/**
 * Check if quotation can be edited
 */
export const canEditQuotation = (status) => {
  return status === "DRAFT";
};

/**
 * Check if quotation can be submitted
 */
export const canSubmitQuotation = (status) => {
  return status === "DRAFT";
};

/**
 * Check if quotation can be approved
 */
export const canApproveQuotation = (status) => {
  return status === "SUBMITTED";
};

/**
 * Check if quotation can be rejected
 */
export const canRejectQuotation = (status) => {
  return status === "SUBMITTED";
};

/**
 * Get available actions for quotation based on status and permissions
 */
export const getAvailableActions = (quotation, userPermissions = []) => {
  const actions = [];
  const { status } = quotation;

  if (
    canEditQuotation(status) &&
    userPermissions.includes("QUOTATION_UPDATE")
  ) {
    actions.push({ id: "edit", label: "Edit", type: "primary" });
  }

  if (
    canSubmitQuotation(status) &&
    userPermissions.includes("QUOTATION_SUBMIT")
  ) {
    actions.push({ id: "submit", label: "Submit", type: "success" });
  }

  if (
    canApproveQuotation(status) &&
    userPermissions.includes("QUOTATION_APPROVE")
  ) {
    actions.push({ id: "approve", label: "Approve", type: "success" });
  }

  if (
    canRejectQuotation(status) &&
    userPermissions.includes("QUOTATION_REJECT")
  ) {
    actions.push({ id: "reject", label: "Reject", type: "danger" });
  }

  if (userPermissions.includes("QUOTATION_ARCHIVE")) {
    actions.push({ id: "delete", label: "Delete", type: "danger" });
  }

  return actions;
};
