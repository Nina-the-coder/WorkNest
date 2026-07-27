const QuotationController = require("../../src/modules/quotation/quotation.controller");
const QuotationService = require("../../src/modules/quotation/quotation.service");

jest.mock("../../src/modules/quotation/quotation.service");

describe("Quotation Controller", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllQuotations should return quotations", async () => {

    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const quotations = [{ quotationId: "Q001" }];

    QuotationService.getAllQuotations.mockResolvedValue(quotations);

    await QuotationController.getAllQuotations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(quotations);

  });

  test("updateQuotationStatus should update quotation", async () => {

    const req = {
      params: { quotationId: "Q001" },
      body: { status: "approved" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const updatedQuotation = { quotationId: "Q001", status: "approved" };

    QuotationService.updateQuotationStatus.mockResolvedValue(updatedQuotation);

    await QuotationController.updateQuotationStatus(req, res);

    expect(QuotationService.updateQuotationStatus).toHaveBeenCalledWith(
      "Q001",
      "approved"
    );

    expect(res.status).toHaveBeenCalledWith(200);

  });

  test("deleteQuotation should delete quotation", async () => {

    const req = {
      params: { quotationId: "Q001" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    QuotationService.deleteQuotation.mockResolvedValue();

    await QuotationController.deleteQuotation(req, res);

    expect(QuotationService.deleteQuotation).toHaveBeenCalledWith("Q001");
    expect(res.status).toHaveBeenCalledWith(200);

  });

});