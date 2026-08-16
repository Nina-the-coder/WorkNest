const quotationRepo = require("./quotation.repository");
const AppError = require("../../utils/AppError");

const QUOTATION_STATUS = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
];

exports.getAllQuotations = async () => {
  return quotationRepo.findAllActive();
};

exports.getQuotationById = async (quotationId) => {
  const quotation = await quotationRepo.findActiveByQuotationId(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  return quotation;
};

exports.createQuotation = async (quotationData) => {
  const {
    quotationNumber,
    customerId,
    employeeId,
    subtotal,
    discountAmount,
    gstAmount,
    grandTotal,
    validUntil,
    notes,
  } = quotationData;

  if (!quotationNumber) {
    throw new AppError("Quotation number is required", 400);
  }

  if (!customerId) {
    throw new AppError("Customer is required", 400);
  }

  if (!employeeId) {
    throw new AppError("Employee is required", 400);
  }

  const existingQuotation =
    await quotationRepo.findByQuotationNumber(quotationNumber);

  if (existingQuotation) {
    throw new AppError("Quotation number already exists", 409);
  }

  const quotation = {
    quotationNumber,
    customerId,
    employeeId,
    status: "DRAFT",
    subtotal: subtotal || 0,
    discountAmount: discountAmount || 0,
    gstAmount: gstAmount || 0,
    grandTotal: grandTotal || 0,
    validUntil,
    notes: notes || "",
  };

  return quotationRepo.createQuotation(quotation);
};

exports.updateQuotation = async (quotationId, quotationData) => {
  const quotation = await quotationRepo.findActiveByQuotationId(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  if (quotation.status !== "DRAFT") {
    throw new AppError(
      "Only draft quotations can be updated",
      400
    );
  }

  const allowedFields = [
    "customerId",
    "employeeId",
    "subtotal",
    "discountAmount",
    "gstAmount",
    "grandTotal",
    "validUntil",
    "notes",
  ];

  allowedFields.forEach((field) => {
    if (quotationData[field] !== undefined) {
      quotation[field] = quotationData[field];
    }
  });

  return quotationRepo.saveQuotation(quotation);
};

exports.updateQuotationStatus = async (quotationId, status) => {
  const quotation = await quotationRepo.findActiveByQuotationId(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  if (!QUOTATION_STATUS.includes(status)) {
    throw new AppError("Invalid quotation status", 400);
  }

  quotation.status = status;

  return quotationRepo.saveQuotation(quotation);
};

exports.deleteQuotation = async (quotationId) => {
  const quotation = await quotationRepo.findActiveByQuotationId(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  quotation.deleted = true;
  quotation.deletedAt = new Date();

  return quotationRepo.saveQuotation(quotation);
};