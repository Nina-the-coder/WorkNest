const OrderController = require("../../src/modules/order/order.controller");
const OrderService = require("../../src/modules/order/order.service");

jest.mock("../../src/modules/order/order.service");

describe("Order Controller", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("fetchOrders should return orders", async () => {

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const orders = [{ orderId: "ORD001" }];

    OrderService.fetchOrders.mockResolvedValue(orders);

    await OrderController.fetchOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orders);

  });

  test("updateOrderStatus should update status", async () => {

    const req = {
      params: { orderId: "ORD001" },
      body: { status: "completed" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    OrderService.updateOrderStatus.mockResolvedValue();

    await OrderController.updateOrderStatus(req, res);

    expect(OrderService.updateOrderStatus).toHaveBeenCalledWith(
      "ORD001",
      "completed"
    );

    expect(res.status).toHaveBeenCalledWith(200);

  });

  test("deleteOrder should delete order", async () => {

    const req = {
      params: { orderId: "ORD001" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    OrderService.deleteOrder.mockResolvedValue();

    await OrderController.deleteOrder(req, res);

    expect(OrderService.deleteOrder).toHaveBeenCalledWith("ORD001");
    expect(res.status).toHaveBeenCalledWith(200);

  });

  test("downloadcsv should return csv", async () => {

    const req = {
      params: { orderId: "ORD001" }
    };

    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    OrderService.generateCsv.mockResolvedValue("csvData");

    await OrderController.downloadcsv(req, res);

    expect(OrderService.generateCsv).toHaveBeenCalledWith("ORD001");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("csvData");

  });

});