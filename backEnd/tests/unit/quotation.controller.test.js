const controller = require("../../src/modules/quotation/quotation.controller");
const quotationService = require("../../src/modules/quotation/quotation.service");

jest.mock("../../src/modules/quotation/quotation.service");

describe("Quotation Controller", () => {
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
  const next = jest.fn();
  afterEach(() => jest.clearAllMocks());

  test("lists quotations using pagination filters", async () => {
    quotationService.getAllQuotations.mockResolvedValue({ quotations: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    const res = response();
    await controller.listQuotations({ query: {}, user: { _id: "admin", role: "admin" } }, res, next);
    expect(quotationService.getAllQuotations).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("does not expose another employee's quotation", async () => {
    quotationService.getQuotationById.mockResolvedValue({ employeeId: "owner" });
    const res = response();
    await controller.getQuotation({ params: { quotationId: "q1" }, user: { _id: "other", role: "employee" } }, res, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test("submits through the service action instead of accepting a status field", async () => {
    quotationService.getQuotationById.mockResolvedValue({ employeeId: "employee" });
    quotationService.submitQuotation.mockResolvedValue({ _id: "q1", status: "SUBMITTED" });
    const res = response();
    await controller.submitQuotation({ params: { quotationId: "q1" }, body: {}, user: { _id: "employee", role: "employee" } }, res, next);
    expect(quotationService.submitQuotation).toHaveBeenCalledWith("q1", "employee");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
