const orderService = require("../../src/modules/order/order.service");
const orderRepo = require("../../src/modules/order/order.repository");
const AppError = require("../../src/utils/AppError");

const generateOrderPdf = require("../../src/utils/pdf/orderPdfGenerator");
const generateOrderCsv = require("../../src/utils/csv/orderCsvGenerator");

jest.mock("../../src/modules/order/order.repository");
jest.mock("../../src/utils/pdf/orderPdfGenerator");
jest.mock("../../src/utils/csv/orderCsvGenerator");

describe("Order Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchOrders", () => {

    test("should return all active orders", async () => {

      const orders = [{ orderId: "ORD001" }];

      orderRepo.findAllActive.mockResolvedValue(orders);

      const result = await orderService.fetchOrders();

      expect(orderRepo.findAllActive).toHaveBeenCalled();
      expect(result).toEqual(orders);

    });

  });

  describe("updateOrderStatus", () => {

    test("should update order status", async () => {

      const mockOrder = { orderId: "ORD001", status: "pending" };

      orderRepo.findByOrderId.mockResolvedValue(mockOrder);
      orderRepo.saveOrder.mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus("ORD001", "completed");

      expect(mockOrder.status).toBe("completed");
      expect(orderRepo.saveOrder).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);

    });

    test("should throw error if order not found", async () => {

      orderRepo.findByOrderId.mockResolvedValue(null);

      await expect(
        orderService.updateOrderStatus("ORD001", "completed")
      ).rejects.toThrow(AppError);

    });

  });

  describe("deleteOrder", () => {

    test("should soft delete order", async () => {

      const mockOrder = { orderId: "ORD001" };

      orderRepo.findByOrderId.mockResolvedValue(mockOrder);
      orderRepo.saveOrder.mockResolvedValue(mockOrder);

      const result = await orderService.deleteOrder("ORD001");

      expect(mockOrder.deleted).toBe(true);
      expect(orderRepo.saveOrder).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);

    });

    test("should throw error if order not found", async () => {

      orderRepo.findByOrderId.mockResolvedValue(null);

      await expect(
        orderService.deleteOrder("ORD001")
      ).rejects.toThrow(AppError);

    });

  });

  describe("generatePdf", () => {

    test("should generate pdf", async () => {

      const order = { orderId: "ORD001" };

      orderRepo.findDetailedByOrderId.mockResolvedValue(order);
      generateOrderPdf.mockResolvedValue("pdfBuffer");

      const result = await orderService.generatePdf("ORD001");

      expect(generateOrderPdf).toHaveBeenCalledWith(order);
      expect(result).toBe("pdfBuffer");

    });

    test("should throw error if order not found", async () => {

      orderRepo.findDetailedByOrderId.mockResolvedValue(null);

      await expect(
        orderService.generatePdf("ORD001")
      ).rejects.toThrow(AppError);

    });

  });

  describe("generateCsv", () => {

    test("should generate csv", async () => {

      const order = { orderId: "ORD001" };

      orderRepo.findDetailedByOrderId.mockResolvedValue(order);
      generateOrderCsv.mockResolvedValue("csvData");

      const result = await orderService.generateCsv("ORD001");

      expect(generateOrderCsv).toHaveBeenCalledWith(order);
      expect(result).toBe("csvData");

    });

    test("should throw error if order not found", async () => {

      orderRepo.findDetailedByOrderId.mockResolvedValue(null);

      await expect(
        orderService.generateCsv("ORD001")
      ).rejects.toThrow(AppError);

    });

  });

});