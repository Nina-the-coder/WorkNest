const mongoose = require("mongoose");
const orderRepo = require("./order.repository");
const quotationRepo = require("../quotation/quotation.repository");
const Customer = require("../customer/customer.model");
const AppError = require("../../utils/AppError");
const PERMISSIONS = require("../../utils/permissions");
const { hasPermission } = require("../../utils/rolePermissions");
const getNextSequence = require("../../utils/getNextSequence");
const { validateConversionBody, validateStatusUpdate, validateApprovedSnapshot } = require("./order.validation");
const generateOrderPdf = require("../../utils/pdf/orderPdfGenerator");
const generateOrderCsv = require("../../utils/csv/orderCsvGenerator");

const requireAdmin = (actor, permission) => {
  if (!actor?._id) throw new AppError("Authentication required", 401);
  if (actor.role !== "admin" || !hasPermission(actor.role, permission)) {
    throw new AppError("You do not have permission to access orders", 403);
  }
};
const referenceId = value => value?._id || value;
const sessionArgs = session => session ? [session] : [];

exports.fetchOrders = async actor => {
  requireAdmin(actor, PERMISSIONS.ORDER_READ);
  return orderRepo.findAllActive();
};

exports.getOrder = async (orderId, actor) => {
  requireAdmin(actor, PERMISSIONS.ORDER_READ);
  const order = await orderRepo.findDetailedByOrderId(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

exports.convertQuotation = async (quotationId, body, actor) => {
  requireAdmin(actor, PERMISSIONS.ORDER_CREATE);
  validateConversionBody(body);
  if (!mongoose.isObjectIdOrHexString(quotationId)) throw new AppError("Invalid quotation ID", 400);
  try {
    return await quotationRepo.runInTransaction(async session => {
      const quotation = await quotationRepo.findById(quotationId, {}, ...sessionArgs(session));
      if (!quotation) throw new AppError("Quotation not found", 404);
      const existing = await orderRepo.findByQuotationId(quotation._id, ...sessionArgs(session));
      if (existing.length) {
        const order = existing[0];
        if (existing.length !== 1 || order.deleted || order.sourceType !== "quotation_conversion" ||
            quotation.status !== "CONVERTED") {
          throw new AppError("Quotation already has an order; review the existing link", 409);
        }
        return { order, quotation, replayed: true };
      }
      if (quotation.status !== "APPROVED") throw new AppError("Only APPROVED quotations may be converted", 400);
      const items = await quotationRepo.findQuotationItems(quotation._id, ...sessionArgs(session));
      validateApprovedSnapshot(quotation, items);
      const customerId = referenceId(quotation.customerId);
      if (!customerId) throw new AppError("Quotation customer is missing; review before conversion", 409);
      const customerQuery = Customer.findById(customerId);
      const customer = await (session ? customerQuery.session(session) : customerQuery);
      if (!customer) throw new AppError("Quotation customer is missing; review before conversion", 409);
      const customerSnapshot = { _customerId: customer._id };
      for (const field of ["customerId", "name", "address", "contact", "gst", "email", "status", "companyType"]) {
        if (customer[field] !== undefined) customerSnapshot[field] = customer[field];
      }
      const productsSnapshot = items.map(item => ({
        productId: String(referenceId(item.productId)), name: item.productName,
        sku: item.sku, description: item.description, price: item.unitPrice,
        quantity: item.quantity, unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage, discountAmount: item.discountAmount,
        gstRate: item.gstRate, taxableAmount: item.taxableAmount,
        gstAmount: item.gstAmount, lineTotal: item.lineTotal,
      }));
      // Every conversion writes the quotation header, conflicting with concurrent
      // conversion/archive. Retried transactions reload the actual current state.
      const converted = await quotationRepo.updateIfCurrent(quotation, {}, {
        status: "CONVERTED", updatedBy: actor._id,
      }, ...sessionArgs(session));
      const sequence = await getNextSequence("order", ...sessionArgs(session));
      const now = new Date();
      const data = {
        orderId: `ORD${String(sequence).padStart(3, "0")}`,
        quotationId: quotation._id, quotationNumber: quotation.quotationId,
        sourceType: "quotation_conversion", addedBy: actor._id, updatedBy: actor._id,
        customerSnapshot, productsSnapshot, totalSnapshot: quotation.grandTotal,
        status: "confirm", confirmedAt: now, statusUpdatedAt: now, statusUpdatedBy: actor._id,
      };
      for (const field of ["subtotal", "discountPercentage", "discountAmount", "taxableAmount", "gstRate", "gstAmount", "grandTotal"]) {
        if (quotation[field] !== undefined) data[field] = quotation[field];
      }
      const order = await orderRepo.createOrder(data, ...sessionArgs(session));
      return { order, quotation: converted, replayed: false };
    });
  } catch (error) {
    if (error.code === 11000) throw new AppError("An order already exists or the order number conflicts; refresh and review", 409);
    throw error;
  }
};

exports.updateOrderStatus = async (orderId, payload, actor) => {
  requireAdmin(actor, PERMISSIONS.ORDER_UPDATE);
  const order = await orderRepo.findByOrderId(orderId);
  if (!order) throw new AppError("Order not found", 404);
  validateStatusUpdate(order, payload);
  const now = new Date();
  const changes = {
    status: payload.status, updatedBy: actor._id, statusUpdatedBy: actor._id, statusUpdatedAt: now,
  };
  const dateField = {
    confirm: "confirmedAt", dispatched: "dispatchedDate", delivered: "deliveredAt",
    closed: "closedAt", cancelled: "cancelledAt",
  }[payload.status];
  changes[dateField] = now;
  if (payload.status === "cancelled") {
    changes.cancellationReason = payload.reason.trim();
    changes.cancelledBy = actor._id;
  }
  await orderRepo.updateIfCurrent(order, changes);
  const current = await orderRepo.findDetailedByOrderId(orderId);
  if (!current) throw new AppError("Order not found", 404);
  return current;
};

exports.deleteOrder = async (orderId, actor) => {
  requireAdmin(actor, PERMISSIONS.ORDER_ARCHIVE);
  const order = await orderRepo.findByOrderId(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return orderRepo.updateIfCurrent(order, { deleted: true, deletedAt: new Date(), updatedBy: actor._id });
};

exports.generatePdf = async (orderId, actor) => generateOrderPdf(await exports.getOrder(orderId, actor));
exports.generateCsv = async (orderId, actor) => generateOrderCsv(await exports.getOrder(orderId, actor));
