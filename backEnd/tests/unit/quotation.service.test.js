const quotationService = require("../../src/modules/quotation/quotation.service");
const quotationRepo = require("../../src/modules/quotation/quotation.repository");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/quotation/quotation.repository");
jest.mock("../../src/modules/quotation/quotation.validation", () => ({
  ...jest.requireActual("../../src/modules/quotation/quotation.validation"),
  validateCustomerReference: jest.fn().mockResolvedValue(undefined),
  validateEmployeeReference: jest.fn().mockResolvedValue(undefined),
}));

describe("Quotation Service", () => {
  const admin = { _id: "507f1f77bcf86cd799439013", role: "admin" };
  const employee = { _id: "507f1f77bcf86cd799439011", role: "employee" };
  beforeEach(() => {
    quotationRepo.runInTransaction.mockImplementation((operation) => operation(null));
    quotationRepo.updateIfCurrent.mockImplementation(async (quotation, _scope, changes) => Object.assign(quotation, changes));
  });
  afterEach(() => jest.clearAllMocks());

  test("calculates multiple line items on the server", () => {
    expect(quotationService.calculateQuotationTotals([
      { quantity: 2, unitPrice: 100, discountAmount: 10, gstRate: 18 },
      { quantity: 1, unitPrice: 50, gstRate: 0 },
    ])).toEqual({ subtotal: 250, discountAmount: 10, taxableAmount: 240, gstAmount: 34.2, grandTotal: 274.2 });
  });

  test("uses percentage discounts when supplied", () => {
    expect(quotationService.calculateLineTotal({ quantity: 2, unitPrice: 100, discountPercentage: 10, gstRate: 18 }))
      .toEqual({ discountAmount: 20, taxableAmount: 180, gstAmount: 32.4, lineTotal: 212.4 });
  });

  test("rejects invalid creation data", async () => {
    await expect(quotationService.createQuotation({ customerId: "customer", employeeId: "employee", items: [] }, employee))
      .rejects.toThrow(AppError);
  });

  test("allows only the draft to submitted transition", async () => {
    const quotation = {
      status: "DRAFT", _id: "q1", employeeId: employee._id,
      customerId: "507f1f77bcf86cd799439015", subtotal: 100,
      discountAmount: 0, taxableAmount: 100, gstAmount: 0, grandTotal: 100,
    };
    quotationRepo.findById.mockResolvedValue(quotation);
    quotationRepo.findQuotationItems.mockResolvedValue([{
      _id: "item", productId: "507f1f77bcf86cd799439016", productName: "Stored quotation item",
      quantity: 1, unitPrice: 100, discountAmount: 0, discountPercentage: 0,
      gstRate: 0, gstAmount: 0, taxableAmount: 100, lineTotal: 100,
    }]);
    await quotationService.submitQuotation("q1", employee);
    expect(quotationRepo.findById).toHaveBeenCalledWith("q1", { employeeId: employee._id });
    expect(quotation.status).toBe("SUBMITTED");
    expect(quotationRepo.updateIfCurrent).toHaveBeenCalledWith(
      quotation, { employeeId: employee._id }, expect.objectContaining({
        status: "SUBMITTED", submittedBy: employee._id, submittedAt: expect.any(Date),
      }),
    );
  });

  test("rejects invalid status transitions", async () => {
    quotationRepo.findById.mockResolvedValue({ status: "APPROVED" });
    await expect(quotationService.submitQuotation("q1", admin)).rejects.toThrow("Cannot transition");
  });

  test("requires a reason when rejecting", async () => {
    quotationRepo.findById.mockResolvedValue({ status: "SUBMITTED" });
    await expect(quotationService.rejectQuotation("q1", "", admin)).rejects.toThrow("Rejection reason is required");
  });

  test("returns rejected quotations to draft while retaining the latest rejection", async () => {
    const rejectedAt = new Date("2026-01-01T12:00:00Z");
    const quotation = { status: "REJECTED", rejectionReason: "Missing detail", rejectedBy: "reviewer", rejectedAt };
    quotationRepo.findById.mockResolvedValue(quotation);
    await quotationService.reopenQuotation("q1", admin);
    expect(quotation.status).toBe("DRAFT");
    expect(quotation).toMatchObject({ rejectionReason: "Missing detail", rejectedBy: "reviewer", rejectedAt });
  });

  test("fails closed without an authenticated service actor", async () => {
    await expect(quotationService.getAllQuotations()).rejects.toMatchObject({ statusCode: 401 });
    await expect(quotationService.getQuotationById("q1")).rejects.toMatchObject({ statusCode: 401 });
    await expect(quotationService.updateQuotation("q1", { notes: "Blocked" })).rejects.toMatchObject({ statusCode: 401 });
    expect(quotationRepo.findById).not.toHaveBeenCalled();
    expect(quotationRepo.updateIfCurrent).not.toHaveBeenCalled();
  });
});
