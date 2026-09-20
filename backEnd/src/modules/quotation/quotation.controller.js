const QuotationService = require("./quotation.service");
const AppError = require("../../utils/AppError");
const Customer = require("../customer/customer.model");
const Product = require("../product/product.model");

const isAdmin = (user) => user.role === "admin";

const ensureCanAccess = (quotation, user) => {
  if (
    !isAdmin(user) &&
    String(quotation.employeeId?._id || quotation.employeeId) !==
      String(user._id)
  ) {
    throw new AppError("You can only access your own quotations", 403);
  }
};

const enrichItems = async (items) => {
  if (!Array.isArray(items)) {
    throw new AppError("Items must be an array", 400);
  }
  const seenProductIds = new Set();
  return Promise.all(
    items.map(async (item) => {
      if (seenProductIds.has(String(item.productId))) {
        throw new AppError(
          "A product can only be added once to a quotation",
          400,
        );
      }
      seenProductIds.add(String(item.productId));
      const product = await Product.findById(item.productId);
      if (!product)
        throw new AppError(`Product with ID ${item.productId} not found`, 404);
      return {
        ...item,
        productName: product.name,
        sku: product.productId || "",
        description: product.description || "",
      };
    }),
  );
};

const ensureCustomerIsValid = async (customerId) => {
  const customer = await Customer.findOne({ _id: customerId, deleted: false });
  if (!customer) throw new AppError("Customer not found", 404);
  if (customer.status && customer.status.toLowerCase() !== "active") {
    throw new AppError("Customer is not active", 400);
  }
};

exports.listQuotations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;
    const result = await QuotationService.getAllQuotations({
      page: Math.max(1, Number.parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10)),
      search,
      status,
      employeeId: isAdmin(req.user) ? undefined : req.user._id,
    });
    res
      .status(200)
      .json({ message: "Quotations fetched successfully", ...result });
  } catch (error) {
    next(error);
  }
};

exports.getQuotation = async (req, res, next) => {
  try {
    const quotation = await QuotationService.getQuotationById(
      req.params.quotationId,
    );
    ensureCanAccess(quotation, req.user);
    res
      .status(200)
      .json({ message: "Quotation fetched successfully", quotation });
  } catch (error) {
    next(error);
  }
};

exports.createQuotation = async (req, res, next) => {
  try {
    const { customerId, items, validUntil, notes } = req.body;
    await ensureCustomerIsValid(customerId);
    const employeeId =
      isAdmin(req.user) && req.body.employeeId
        ? req.body.employeeId
        : req.user._id;
    const quotation = await QuotationService.createQuotation(
      {
        customerId,
        employeeId,
        items: await enrichItems(items || []),
        validUntil,
        notes,
      },
      req.user._id,
    );
    res
      .status(201)
      .json({ message: "Quotation created successfully", quotation });
  } catch (error) {
    next(error);
  }
};

exports.updateQuotation = async (req, res, next) => {
  try {
    const existing = await QuotationService.getQuotationById(
      req.params.quotationId,
    );
    ensureCanAccess(existing, req.user);
    const { items, validUntil, notes, customerId, employeeId } = req.body;
    const quotation = await QuotationService.updateQuotation(
      req.params.quotationId,
      {
        items: items === undefined ? undefined : await enrichItems(items),
        validUntil,
        notes,
        customerId,
        employeeId,
      },
      req.user._id,
    );
    res
      .status(200)
      .json({ message: "Quotation updated successfully", quotation });
  } catch (error) {
    next(error);
  }
};

const action = (method, message) => async (req, res, next) => {
  try {
    const existing = await QuotationService.getQuotationById(
      req.params.quotationId,
    );
    ensureCanAccess(existing, req.user);
    const quotation = await method(
      req.params.quotationId,
      req.body?.reason,
      req.user._id,
    );
    res.status(200).json({ message, quotation });
  } catch (error) {
    next(error);
  }
};

exports.submitQuotation = action(
  (id, _reason, userId) => QuotationService.submitQuotation(id, userId),
  "Quotation submitted successfully",
);
exports.approveQuotation = action(
  (id, _reason, userId) => QuotationService.approveQuotation(id, userId),
  "Quotation approved successfully",
);
exports.rejectQuotation = action(
  (id, reason, userId) => QuotationService.rejectQuotation(id, reason, userId),
  "Quotation rejected successfully",
);
exports.reopenQuotation = action(
  (id, _reason, userId) => QuotationService.reopenQuotation(id, userId),
  "Quotation returned to draft",
);

exports.deleteQuotation = async (req, res, next) => {
  try {
    const existing = await QuotationService.getQuotationById(
      req.params.quotationId,
    );
    ensureCanAccess(existing, req.user);
    await QuotationService.deleteQuotation(
      req.params.quotationId,
      req.user._id,
    );
    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    next(error);
  }
};
