const controller = require("../../src/modules/order/order.controller");
const service = require("../../src/modules/order/order.service");

jest.mock("../../src/modules/order/order.service");

const admin = { _id: "admin-id", role: "admin" };
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn(), send: jest.fn() });

describe("Order controller", () => {
  beforeEach(() => jest.resetAllMocks());

  test("retains the list-array envelope and passes authenticated actor", async () => {
    const orders = [{ orderId: "ORD001" }];
    service.fetchOrders.mockResolvedValue(orders);
    const res = response();
    await controller.fetchOrders({ user: admin }, res);
    expect(service.fetchOrders).toHaveBeenCalledWith(admin);
    expect(res.json).toHaveBeenCalledWith(orders);
  });

  test("returns read-only Order details", async () => {
    const order = { orderId: "ORD001" };
    service.getOrder.mockResolvedValue(order);
    const res = response();
    await controller.getOrder({ params: { orderId: "ORD001" }, user: admin }, res);
    expect(service.getOrder).toHaveBeenCalledWith("ORD001", admin);
    expect(res.json).toHaveBeenCalledWith({ order });
  });

  test("passes the complete status payload for strict validation", async () => {
    const body = { status: "dispatched", expectedStatus: "confirm", addedBy: "forged" };
    service.updateOrderStatus.mockResolvedValue({ orderId: "ORD001", status: "dispatched" });
    const res = response();
    await controller.updateOrderStatus({ params: { orderId: "ORD001" }, body, user: admin }, res);
    expect(service.updateOrderStatus).toHaveBeenCalledWith("ORD001", body, admin);
    expect(res.json).toHaveBeenCalledWith({ message: "Order status updated successfully", order: expect.objectContaining({ status: "dispatched" }) });
  });

  test("preserves the archive response", async () => {
    const res = response();
    await controller.deleteOrder({ params: { orderId: "ORD001" }, user: admin }, res);
    expect(service.deleteOrder).toHaveBeenCalledWith("ORD001", admin);
    expect(res.json).toHaveBeenCalledWith({ message: "Order deleted successfully" });
  });

  test.each([["downloadPdf", "generatePdf", "application/pdf", "pdf", Buffer.from("pdf")], ["downloadcsv", "generateCsv", "text/csv", "csv", "csv"]])("sends actual %s data as an attachment", async (method, generator, mime, extension, output) => {
    service[generator].mockResolvedValue(output);
    const res = response();
    await controller[method]({ params: { orderId: "ORD001" }, user: admin }, res);
    expect(service[generator]).toHaveBeenCalledWith("ORD001", admin);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", mime);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Disposition", `attachment; filename=order-ORD001.${extension}`);
    expect(res.send).toHaveBeenCalledWith(output);
  });
});
