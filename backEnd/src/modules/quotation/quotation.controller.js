const QuotationService = require("./quotation.service");
const OrderService = require("../order/order.service");

exports.convertQuotation = async (req, res, next) => {
  try {
    const result = await OrderService.convertQuotation(req.params.quotationId, req.body || {}, req.user);
    res.status(result.replayed ? 200 : 201).json({ message: result.replayed ? "Quotation already converted" : "Quotation converted to order", ...result });
  } catch (error) { next(error); }
};
exports.listQuotations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;
    const result = await QuotationService.getAllQuotations(
      {
        page: Math.max(1, Number.parseInt(page, 10) || 1),
        limit: Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10)),
        search,
        status,
      },
      req.user,
    );
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
      req.user,
    );
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
    const employeeId = req.body.employeeId || req.user._id;
    const quotation = await QuotationService.createQuotation(
      {
        customerId,
        employeeId,
        items,
        validUntil,
        notes,
      },
      req.user,
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
    const { items, validUntil, notes, customerId, employeeId } = req.body;
    const quotation = await QuotationService.updateQuotation(
      req.params.quotationId,
      {
        items,
        validUntil,
        notes,
        customerId,
        employeeId,
      },
      req.user,
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
    const quotation = await method(
      req.params.quotationId,
      req.body?.reason,
      req.user,
    );
    res.status(200).json({ message, quotation });
  } catch (error) {
    next(error);
  }
};

exports.submitQuotation = action(
  (id, _reason, user) => QuotationService.submitQuotation(id, user),
  "Quotation submitted successfully",
);
exports.approveQuotation = action(
  (id, _reason, user) => QuotationService.approveQuotation(id, user),
  "Quotation approved successfully",
);
exports.rejectQuotation = action(
  (id, reason, user) => QuotationService.rejectQuotation(id, reason, user),
  "Quotation rejected successfully",
);
exports.reopenQuotation = action(
  (id, _reason, user) => QuotationService.reopenQuotation(id, user),
  "Quotation returned to draft",
);

exports.deleteQuotation = async (req, res, next) => {
  try {
    await QuotationService.deleteQuotation(
      req.params.quotationId,
      req.user,
    );
    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    next(error);
  }
};
