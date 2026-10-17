const service = require("../../src/modules/order/order.service");
const repo = require("../../src/modules/order/order.repository");
const quoteRepo = require("../../src/modules/quotation/quotation.repository");
const Customer = require("../../src/modules/customer/customer.model");
const getNextSequence = require("../../src/utils/getNextSequence");
const generateOrderPdf = require("../../src/utils/pdf/orderPdfGenerator");
const generateOrderCsv = require("../../src/utils/csv/orderCsvGenerator");

jest.mock("../../src/modules/order/order.repository");
jest.mock("../../src/modules/quotation/quotation.repository");
jest.mock("../../src/modules/customer/customer.model", () => ({ findById: jest.fn() }));
jest.mock("../../src/utils/getNextSequence");
jest.mock("../../src/utils/pdf/orderPdfGenerator", () => jest.fn());
jest.mock("../../src/utils/csv/orderCsvGenerator", () => jest.fn());

const admin = { _id: "507f1f77bcf86cd799439011", role: "admin" };
const employee = { _id: "507f1f77bcf86cd799439012", role: "employee" };
const id = "507f1f77bcf86cd799439013";
const customerId = "507f1f77bcf86cd799439014";
const productId = "507f1f77bcf86cd799439015";
const item = {
  productId, productName: "Approved product", sku: "PRD001", description: "Stored description",
  quantity: 1, unitPrice: 100, discountPercentage: 10, discountAmount: 10,
  gstRate: 18, taxableAmount: 90, gstAmount: 16.2, lineTotal: 106.2,
};
const totals = { subtotal: 100, discountAmount: 10, taxableAmount: 90, gstAmount: 16.2, grandTotal: 106.2 };
let quotation;

describe("Order service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    quotation = { _id: id, quotationId: "QT001", customerId, status: "APPROVED", ...totals };
    quoteRepo.runInTransaction.mockImplementation(operation => operation(null));
    quoteRepo.findById.mockResolvedValue(quotation);
    quoteRepo.findQuotationItems.mockResolvedValue([item]);
    quoteRepo.updateIfCurrent.mockImplementation(async (current, scope, changes) => ({ ...current, ...changes }));
    repo.findByQuotationId.mockResolvedValue([]);
    repo.createOrder.mockImplementation(async data => ({ _id: "new-order", ...data }));
    repo.updateIfCurrent.mockImplementation(async (order, changes) => ({ ...order, ...changes }));
    Customer.findById.mockResolvedValue({ _id: customerId, customerId: "CUST001", name: "Customer", deleted: true, status: "inactive" });
    getNextSequence.mockResolvedValue(1);
  });

  test("preserves the existing Admin list result", async () => {
    const orders = [{ orderId: "ORD001" }];
    repo.findAllActive.mockResolvedValue(orders);
    expect(await service.fetchOrders(admin)).toEqual(orders);
  });

  test.each([
    ["fetchOrders", []], ["getOrder", ["ORD001"]], ["updateOrderStatus", ["ORD001", { status: "confirm" }]],
    ["deleteOrder", ["ORD001"]], ["generatePdf", ["ORD001"]], ["generateCsv", ["ORD001"]],
    ["convertQuotation", [id, {}]],
  ])("independently denies Employee %s", async (method, args) => {
    await expect(service[method](...args, employee)).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.createOrder).not.toHaveBeenCalled();
    expect(repo.updateIfCurrent).not.toHaveBeenCalled();
  });

  test("requires an authenticated actor", async () => {
    await expect(service.fetchOrders()).rejects.toMatchObject({ statusCode: 401 });
  });

  test("converts exact approved snapshots with authenticated creator", async () => {
    const result = await service.convertQuotation(id, {}, admin);
    expect(result.replayed).toBe(false);
    expect(result.quotation.status).toBe("CONVERTED");
    expect(getNextSequence).toHaveBeenCalledWith("order");
    expect(repo.createOrder).toHaveBeenCalledWith(expect.objectContaining({
      orderId: "ORD001", quotationId: id, quotationNumber: "QT001", sourceType: "quotation_conversion",
      status: "confirm", addedBy: admin._id, totalSnapshot: 106.2, ...totals,
      customerSnapshot: expect.objectContaining({ customerId: "CUST001", status: "inactive" }),
      productsSnapshot: [expect.objectContaining({ name: "Approved product", price: 100, unitPrice: 100, gstAmount: 16.2, lineTotal: 106.2 })],
    }));
  });

  test("rejects conversion input overrides before any transaction", async () => {
    await expect(service.convertQuotation(id, { addedBy: employee._id }, admin)).rejects.toMatchObject({ statusCode: 400 });
    expect(quoteRepo.runInTransaction).not.toHaveBeenCalled();
  });

  test("replays only the existing matching conversion", async () => {
    quotation.status = "CONVERTED";
    const existing = { _id: "existing", sourceType: "quotation_conversion", orderId: "ORD001", deleted: false };
    repo.findByQuotationId.mockResolvedValue([existing]);
    expect(await service.convertQuotation(id, {}, admin)).toEqual({ order: existing, quotation, replayed: true });
    expect(repo.createOrder).not.toHaveBeenCalled();
  });

  test.each([{ deleted: true, sourceType: "quotation_conversion" }, { deleted: false }])("blocks old/archived quotation links", async existing => {
    repo.findByQuotationId.mockResolvedValue([existing]);
    await expect(service.convertQuotation(id, {}, admin)).rejects.toMatchObject({ statusCode: 409 });
    expect(quoteRepo.updateIfCurrent).not.toHaveBeenCalled();
  });

  test("requires the referenced Customer without reactivating it", async () => {
    Customer.findById.mockResolvedValue(null);
    await expect(service.convertQuotation(id, {}, admin)).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.createOrder).not.toHaveBeenCalled();
  });

  test("rejects incomplete approved amounts instead of repairing them", async () => {
    quotation.grandTotal = 1;
    await expect(service.convertQuotation(id, {}, admin)).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.createOrder).not.toHaveBeenCalled();
    expect(quotation.grandTotal).toBe(1);
  });

  test.each(["discountAmount", "taxableAmount", "gstAmount", "lineTotal"])("rejects subcent stored %s without rounding it away", async field => {
    const corrupted = { ...item, [field]: item[field] + 0.001 };
    quoteRepo.findQuotationItems.mockResolvedValue([corrupted]);
    await expect(service.convertQuotation(id, {}, admin)).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.createOrder).not.toHaveBeenCalled();
    expect(quoteRepo.updateIfCurrent).not.toHaveBeenCalled();
    expect(corrupted[field]).toBe(item[field] + 0.001);
  });

  test("preserves a historical subcent unit price with consistent stored components", async () => {
    quoteRepo.findQuotationItems.mockResolvedValue([{ ...item, unitPrice: 100.005 }]);
    const result = await service.convertQuotation(id, {}, admin);
    expect(result.order.productsSnapshot[0]).toMatchObject({ unitPrice: 100.005, price: 100.005, lineTotal: 106.2 });
    expect(result.order.totalSnapshot).toBe(106.2);
  });

  test("performs a valid status-only conditional update", async () => {
    const order = { _id: id, orderId: "ORD001", status: "confirm" };
    repo.findByOrderId.mockResolvedValue(order);
    repo.findDetailedByOrderId.mockResolvedValue({ ...order, status: "dispatched" });
    expect((await service.updateOrderStatus("ORD001", { status: "dispatched", expectedStatus: "confirm" }, admin)).status).toBe("dispatched");
    expect(repo.updateIfCurrent).toHaveBeenCalledWith(order, expect.objectContaining({ status: "dispatched", updatedBy: admin._id, dispatchedDate: expect.any(Date) }));
  });

  test("persists a trimmed cancellation reason and actual actor", async () => {
    repo.findByOrderId.mockResolvedValue({ status: "confirm" });
    repo.findDetailedByOrderId.mockResolvedValue({ status: "cancelled" });
    await service.updateOrderStatus("ORD001", { status: "cancelled", reason: " Customer cancelled " }, admin);
    expect(repo.updateIfCurrent).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      cancellationReason: "Customer cancelled", cancelledBy: admin._id, cancelledAt: expect.any(Date),
    }));
  });

  test("returns404 if archival wins the post-update detail refetch", async () => {
    repo.findByOrderId.mockResolvedValue({ status: "confirm" });
    repo.findDetailedByOrderId.mockResolvedValue(null);
    await expect(service.updateOrderStatus("ORD001", { status: "dispatched" }, admin)).rejects.toMatchObject({ statusCode: 404 });
  });

  test.each([
    [{ status: "delivered" }, 400], [{ status: "dispatched", expectedStatus: "pending" }, 409],
    [{ status: "cancelled", reason: " " }, 400], [{ status: "dispatched", price: 1 }, 400],
  ])("rejects invalid/stale/restricted status input", async (payload, code) => {
    repo.findByOrderId.mockResolvedValue({ status: "confirm" });
    await expect(service.updateOrderStatus("ORD001", payload, admin)).rejects.toMatchObject({ statusCode: code });
    expect(repo.updateIfCurrent).not.toHaveBeenCalled();
  });

  test("preserves Admin archive as a conditional soft deletion", async () => {
    const order = { orderId: "ORD001", status: "closed" };
    repo.findByOrderId.mockResolvedValue(order);
    await service.deleteOrder("ORD001", admin);
    expect(repo.updateIfCurrent).toHaveBeenCalledWith(order, expect.objectContaining({ deleted: true, deletedAt: expect.any(Date), updatedBy: admin._id }));
  });

  test.each(["getOrder", "deleteOrder", "generatePdf", "generateCsv"])("returns404 for absent/archived %s", async method => {
    repo.findDetailedByOrderId.mockResolvedValue(null);
    repo.findByOrderId.mockResolvedValue(null);
    await expect(service[method]("ORD-MISSING", admin)).rejects.toMatchObject({ statusCode: 404 });
  });

  test.each([["generatePdf", generateOrderPdf, Buffer.from("pdf")], ["generateCsv", generateOrderCsv, "csv"]])("uses the current snapshot document for %s", async (method, generator, output) => {
    const order = { orderId: "ORD001", productsSnapshot: [item], totalSnapshot: 106.2 };
    repo.findDetailedByOrderId.mockResolvedValue(order);
    generator.mockResolvedValue(output);
    expect(await service[method]("ORD001", admin)).toEqual(output);
    expect(generator).toHaveBeenCalledWith(order);
  });
});
