const quotationService = require("../../src/modules/quotation/quotation.service");
const quotationRepo = require("../../src/modules/quotation/quotation.repository");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/quotation/quotation.repository");

describe("Quotation Service", () => {
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
    await expect(quotationService.createQuotation({ customerId: "customer", employeeId: "employee", items: [] }, "user"))
      .rejects.toThrow(AppError);
  });

  test("allows only the draft to submitted transition", async () => {
    const quotation = { status: "DRAFT", _id: "q1" };
    quotationRepo.findById.mockResolvedValue(quotation);
    quotationRepo.findQuotationItems.mockResolvedValue([{ _id: "item" }]);
    await quotationService.submitQuotation("q1", "user");
    expect(quotation.status).toBe("SUBMITTED");
    expect(quotationRepo.saveQuotation).toHaveBeenCalledWith(quotation);
  });

  test("rejects invalid status transitions", async () => {
    quotationRepo.findById.mockResolvedValue({ status: "APPROVED" });
    await expect(quotationService.submitQuotation("q1", "user")).rejects.toThrow("Cannot transition");
  });

  test("requires a reason when rejecting", async () => {
    quotationRepo.findById.mockResolvedValue({ status: "SUBMITTED" });
    await expect(quotationService.rejectQuotation("q1", "", "admin")).rejects.toThrow("Rejection reason is required");
  });

  test("returns rejected quotations to draft", async () => {
    const quotation = { status: "REJECTED", rejectionReason: "Missing detail" };
    quotationRepo.findById.mockResolvedValue(quotation);
    await quotationService.reopenQuotation("q1", "user");
    expect(quotation.status).toBe("DRAFT");
    expect(quotation.rejectionReason).toBeNull();
  });
});
