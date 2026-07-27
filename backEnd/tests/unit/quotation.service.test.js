const quotationService = require("../../src/modules/quotation/quotation.service");
const quotationRepo = require("../../src/modules/quotation/quotation.repository");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/quotation/quotation.repository");

describe("Quotation Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllQuotations", () => {

    test("should return all quotations", async () => {

      const quotations = [{ quotationId: "Q001" }];

      quotationRepo.findAllActive.mockResolvedValue(quotations);

      const result = await quotationService.getAllQuotations();

      expect(quotationRepo.findAllActive).toHaveBeenCalled();
      expect(result).toEqual(quotations);

    });

  });

  describe("updateQuotationStatus", () => {

    test("should update quotation status", async () => {

      const quotation = { quotationId: "Q001", status: "pending" };

      quotationRepo.findActiveByQuotationId.mockResolvedValue(quotation);
      quotationRepo.saveQuotation.mockResolvedValue(quotation);

      const result = await quotationService.updateQuotationStatus("Q001", "approved");

      expect(quotation.status).toBe("approved");
      expect(quotationRepo.saveQuotation).toHaveBeenCalledWith(quotation);
      expect(result).toEqual(quotation);

    });

    test("should throw error if quotation not found", async () => {

      quotationRepo.findActiveByQuotationId.mockResolvedValue(null);

      await expect(
        quotationService.updateQuotationStatus("Q001", "approved")
      ).rejects.toThrow(AppError);

    });

  });

  describe("deleteQuotation", () => {

    test("should soft delete quotation", async () => {

      const quotation = { quotationId: "Q001" };

      quotationRepo.findActiveByQuotationId.mockResolvedValue(quotation);
      quotationRepo.saveQuotation.mockResolvedValue(quotation);

      const result = await quotationService.deleteQuotation("Q001");

      expect(quotation.deleted).toBe(true);
      expect(quotationRepo.saveQuotation).toHaveBeenCalledWith(quotation);
      expect(result).toEqual(quotation);

    });

    test("should throw error if quotation not found", async () => {

      quotationRepo.findActiveByQuotationId.mockResolvedValue(null);

      await expect(
        quotationService.deleteQuotation("Q001")
      ).rejects.toThrow(AppError);

    });

  });

});