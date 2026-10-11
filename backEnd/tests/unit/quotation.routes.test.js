const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/user.model");
const quotationRepo = require("../../src/modules/quotation/quotation.repository");
const quotationRoutes = require("../../src/modules/quotation/quotation.routes");

jest.mock("../../src/models/user.model", () => ({ findById: jest.fn() }));
jest.mock("../../src/modules/quotation/quotation.repository");

const ownerId = "507f1f77bcf86cd799439011";
const otherId = "507f1f77bcf86cd799439012";
const adminId = "507f1f77bcf86cd799439013";
const quotationId = "507f1f77bcf86cd799439014";
const quotationUrl = `/api/quotations/${quotationId}`;
const originalSecret = process.env.JWT_SECRET;
let server;

const app = express();
app.use(express.json());
app.use("/api/quotations", quotationRoutes);
app.use((error, _req, res, _next) => {
  res.status(error.statusCode || 500).json({ message: error.message });
});

const authorization = (id = ownerId) =>
  `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" })}`;

describe("Quotation routes for employees", () => {
  let quotation;

  beforeAll(async () => {
    process.env.JWT_SECRET = "worknest-quotation-route-test-secret";
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      listener.once("error", reject);
    });
  });

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    quotation = {
      _id: quotationId,
      quotationId: "QT0101",
      employeeId: ownerId,
      customerId: "507f1f77bcf86cd799439015",
      status: "DRAFT",
      notes: "Original notes",
      toObject() {
        const { toObject, ...data } = this;
        return data;
      },
    };

    User.findById.mockImplementation((id) => ({
      select: jest.fn().mockResolvedValue({
        _id: id,
        role: id === adminId ? "admin" : "employee",
      }),
    }));
    quotationRepo.findById.mockResolvedValue(quotation);
    quotationRepo.findQuotationItems.mockResolvedValue([
      { productId: "507f1f77bcf86cd799439016", quantity: 1, unitPrice: 100, gstRate: 0 },
    ]);
    quotationRepo.saveQuotation.mockImplementation(async (value) => value);
  });

  test("requires authentication before submitting", async () => {
    await request(server).post(`${quotationUrl}/submit`).expect(401);
    expect(quotationRepo.saveQuotation).not.toHaveBeenCalled();
  });

  test("allows an employee to edit and submit their existing draft", async () => {
    const edited = await request(server)
      .put(quotationUrl)
      .set("Authorization", authorization())
      .send({ notes: "Updated notes", status: "APPROVED" })
      .expect(200);

    expect(edited.body.quotation).toMatchObject({
      _id: quotationId,
      quotationId: "QT0101",
      notes: "Updated notes",
      status: "DRAFT",
    });

    const submitted = await request(server)
      .post(`${quotationUrl}/submit`)
      .set("Authorization", authorization())
      .expect(200);

    expect(submitted.body.quotation).toMatchObject({
      _id: quotationId,
      quotationId: "QT0101",
      status: "SUBMITTED",
      updatedBy: ownerId,
    });
  });

  test.each(["get", "put", "submit", "reopen"])(
    "blocks another employee from accessing the quotation through %s",
    async (action) => {
      const method = ["get", "put"].includes(action) ? action : "post";
      const url = ["get", "put"].includes(action) ? quotationUrl : `${quotationUrl}/${action}`;
      await request(server)[method](url)
        .set("Authorization", authorization(otherId))
        .send({ notes: "Unauthorized change" })
        .expect(403)
        .expect({ message: "You can only access your own quotations" });
      expect(quotationRepo.saveQuotation).not.toHaveBeenCalled();
    },
  );

  test.each(["approve", "reject"])(
    "does not grant employees permission to %s",
    async (action) => {
      quotation.status = "SUBMITTED";
      await request(server)
        .post(`${quotationUrl}/${action}`)
        .set("Authorization", authorization())
        .send({ reason: "Requested revision" })
        .expect(403);
      expect(quotationRepo.saveQuotation).not.toHaveBeenCalled();
    },
  );

  test.each(["SUBMITTED", "APPROVED", "CONVERTED"])(
    "keeps %s quotations locked against employee edits",
    async (status) => {
      quotation.status = status;
      await request(server)
        .put(quotationUrl)
        .set("Authorization", authorization())
        .send({ notes: "Forbidden change" })
        .expect(400);
      expect(quotationRepo.saveQuotation).not.toHaveBeenCalled();
    },
  );

  test("rejects empty quotation submission", async () => {
    quotationRepo.findQuotationItems.mockResolvedValue([]);
    await request(server)
      .post(`${quotationUrl}/submit`)
      .set("Authorization", authorization())
      .expect(400);
    expect(quotationRepo.saveQuotation).not.toHaveBeenCalled();
  });

  test("rejects a repeated submission without another save", async () => {
    await request(server)
      .post(`${quotationUrl}/submit`)
      .set("Authorization", authorization())
      .expect(200);
    await request(server)
      .post(`${quotationUrl}/submit`)
      .set("Authorization", authorization())
      .expect(400);
    expect(quotationRepo.saveQuotation).toHaveBeenCalledTimes(1);
  });

  test("allows a rejected quotation to be reopened, edited, and resubmitted", async () => {
    quotation.status = "REJECTED";
    quotation.rejectionReason = "Clarify the notes";
    const headers = { Authorization: authorization() };
    await request(server).post(`${quotationUrl}/reopen`).set(headers).expect(200);
    await request(server).put(quotationUrl).set(headers).send({ notes: "Clarified notes" }).expect(200);
    const result = await request(server).post(`${quotationUrl}/submit`).set(headers).expect(200);
    expect(result.body.quotation).toMatchObject({
      _id: quotationId,
      quotationId: "QT0101",
      status: "SUBMITTED",
      notes: "Clarified notes",
    });
  });

  test("retains admin approval permission", async () => {
    quotation.status = "SUBMITTED";
    const result = await request(server)
      .post(`${quotationUrl}/approve`)
      .set("Authorization", authorization(adminId))
      .expect(200);
    expect(result.body.quotation).toMatchObject({ status: "APPROVED", approvedBy: adminId });
  });
});
