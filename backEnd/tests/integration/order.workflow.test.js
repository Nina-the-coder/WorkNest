const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Customer = require("../../src/modules/customer/customer.model");
const Product = require("../../src/modules/product/product.model");
const Quotation = require("../../src/modules/quotation/quotation.model");
const QuotationItem = require("../../src/modules/quotation/quotationItem.model");
const Order = require("../../src/modules/order/order.model");
const orderRepo = require("../../src/modules/order/order.repository");
const quotationRepo = require("../../src/modules/quotation/quotation.repository");

jest.setTimeout(90000);
const originalSecret = process.env.JWT_SECRET;
const password = "Order-workflow-integration-123!";
const headerFields = ["subtotal", "discountAmount", "taxableAmount", "gstAmount", "grandTotal"];
const lineFields = ["quantity", "unitPrice", "sku", "description", "discountPercentage", "discountAmount", "gstRate", "taxableAmount", "gstAmount", "lineTotal"];
let mongo, server, users, tokens, customer, products, draft;
const plain = value => JSON.parse(JSON.stringify(value));
const pick = (value, fields) => Object.fromEntries(fields.map(field => [field, value[field]]));
const call = (method, path, actor = "admin") => request(server)[method](path).set("Authorization", tokens[actor]);
const quotePath = (quote = draft) => `/api/quotations/${quote._id}`;
const convertPath = (quote = draft) => `${quotePath(quote)}/convert`;
const orderPath = order => `/api/orders/${order.orderId}`;
const itemInput = (index = 0, overrides = {}) => ({
  productId: products[index]._id.toString(), quantity: 2, unitPrice: 25.005,
  discountPercentage: 10, discountAmount: 99, gstRate: 18, ...overrides,
});
const createQuotation = async (overrides = {}, actor = "employeeA") => {
  const response = await call("post", "/api/quotations", actor).send({
    customerId: customer._id.toString(),
    items: [itemInput(), itemInput(1, { quantity: 1, unitPrice: 0.05, discountPercentage: 0, discountAmount: 0.01, gstRate: 0 })],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(), notes: "Approved order source", ...overrides,
  }).expect(201);
  return response.body.quotation;
};
const approve = async (quote = draft) => {
  await call("post", `${quotePath(quote)}/submit`, "employeeA").send({}).expect(200);
  await call("post", `${quotePath(quote)}/approve`).send({}).expect(200);
  return plain(await Quotation.findById(quote._id).lean());
};
const convert = async (quote = draft) => {
  const response = await call("post", convertPath(quote)).send({}).expect(201);
  return response.body.order;
};
const quoteSnapshot = async (quote = draft) => ({
  quotation: plain(await Quotation.findById(quote._id).lean()),
  items: plain(await QuotationItem.find({ quotationId: quote._id }).sort({ _id: 1 }).lean()),
});
const orderSnapshot = async order => plain(await Order.findById(order._id).lean());
const legacyInput = (overrides = {}) => ({
  orderId: "ORD-LEGACY", quotationId: new mongoose.Types.ObjectId(), addedBy: users.admin._id,
  customerSnapshot: { customerId: customer.customerId, name: "Stored legacy customer", email: "legacy@order.test" },
  productsSnapshot: [{ productId: products[0].productId, name: "Stored legacy product", price: 12.34, quantity: 2 }],
  totalSnapshot: 24.68, status: "confirm", ...overrides,
});

// These requests exercise the real app, login-issued JWT, permissions, services,
// repository, schemas and replica-set transactions. Only rollback tests inject
// a failure, after invoking the original real write with its actual session.
describe("Quotation conversion and fulfillment with real HTTP and replica-set MongoDB", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "worknest-order-workflow-tests-only";
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" }, instanceOpts: [{ ip: "127.0.0.1" }],
    });
    await mongoose.connect(mongo.getUri("worknest_order_workflow"));
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    const records = await User.create([
      { name: "Order Admin", email: "admin@order-workflow.test", empId: "EMP-ORD-ADMIN", role: "admin", password },
      { name: "Order Employee A", email: "a@order-workflow.test", empId: "EMP-ORD-A", role: "employee", password },
      { name: "Order Employee B", email: "b@order-workflow.test", empId: "EMP-ORD-B", role: "employee", password },
    ]);
    users = Object.fromEntries(["admin", "employeeA", "employeeB"].map((name, index) => [name, records[index]]));
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); listener.once("error", reject);
    });
    tokens = {};
    for (const [name, user] of Object.entries(users)) {
      const response = await request(server).post("/api/auth/login").send({ email: user.email, password }).expect(200);
      tokens[name] = `Bearer ${response.body.token}`;
    }
  });
  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models).filter(model => model !== User).map(model => model.deleteMany({})));
    customer = await Customer.create({ customerId: "CUST-ORDER-WORKFLOW", name: "Original customer", email: "customer@order.test", contact: "9876501234", address: "Original address", gst: "27AAAAA0000A1Z5", status: "active", addedBy: users.admin._id });
    products = await Product.create([
      { productId: "PRD-ORDER-ONE", name: "Quoted product one", description: "Quoted description one", price: 25.005 },
      { productId: "PRD-ORDER-TWO", name: "Quoted product two", description: "Quoted description two", price: 0.05 },
    ]);
    draft = await createQuotation();
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
  });

  test("Employee submission → Admin approval/conversion → delivery preserves the exact approved business record", async () => {
    await approve();
    const before = await quoteSnapshot();
    const order = await convert();
    expect(order).toMatchObject({
      orderId: expect.stringMatching(/^ORD\d{3,}$/), sourceType: "quotation_conversion", quotationId: draft._id,
      quotationNumber: draft.quotationId, status: "confirm", addedBy: users.admin._id.toString(),
      statusUpdatedBy: users.admin._id.toString(), updatedBy: users.admin._id.toString(),
      totalSnapshot: before.quotation.grandTotal, ...pick(before.quotation, headerFields),
    });
    expect(order.productsSnapshot.map(line => ({ ...pick(line, lineFields), productId: line.productId, name: line.name, price: line.price })))
      .toEqual(before.items.map(line => ({ ...pick(line, lineFields), productId: line.productId, name: line.productName, price: line.unitPrice })));
    const after = await quoteSnapshot();
    expect(after.quotation).toMatchObject({ _id: draft._id, quotationId: draft.quotationId, status: "CONVERTED", approvedBy: users.admin._id.toString(), employeeId: users.employeeA._id.toString(), createdBy: users.employeeA._id.toString(), updatedBy: users.admin._id.toString(), ...pick(before.quotation, headerFields) });
    expect(after.items).toEqual(before.items);
    const listed = await call("get", "/api/orders").expect(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ _id: order._id, orderId: order.orderId })]));
    const frozen = await orderSnapshot(order);
    for (const [expectedStatus, status] of [["confirm", "dispatched"], ["dispatched", "delivered"], ["delivered", "closed"]]) {
      await call("put", orderPath(order)).send({ status, expectedStatus }).expect(200);
      const details = await call("get", orderPath(order)).expect(200);
      expect(details.body.order.status).toBe(status);
      expect(pick(details.body.order, headerFields)).toEqual(pick(frozen, headerFields));
      expect(details.body.order.productsSnapshot).toEqual(order.productsSnapshot);
    }
    expect((await Order.findById(order._id)).status).toBe("closed");
    await call("get", quotePath(), "employeeA").expect(200).expect(response => expect(response.body.quotation.status).toBe("CONVERTED"));
    await call("put", quotePath(), "employeeA").send({ notes: "Historical quote must stay locked" }).expect(400);
  });

  test.each(["DRAFT", "SUBMITTED", "REJECTED"])("cannot convert a %s quotation", async status => {
    if (status !== "DRAFT") await call("post", `${quotePath()}/submit`, "employeeA").send({}).expect(200);
    if (status === "REJECTED") await call("post", `${quotePath()}/reject`).send({ reason: "Not approved" }).expect(200);
    const before = await quoteSnapshot();
    await call("post", convertPath()).send({}).expect(400);
    expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test("malformed or missing quotations fail safely", async () => {
    await call("post", "/api/quotations/not-an-id/convert").send({}).expect(400);
    await call("post", `/api/quotations/${new mongoose.Types.ObjectId()}/convert`).send({}).expect(404);
    expect(await Order.countDocuments()).toBe(0);
  });
  test("conversion rejects client-supplied customer, pricing, product and creator overrides", async () => {
    await approve(); const before = await quoteSnapshot();
    await call("post", convertPath()).send({
      customerId: new mongoose.Types.ObjectId().toString(), addedBy: users.employeeB._id.toString(), createdBy: users.employeeB._id.toString(),
      quotationId: new mongoose.Types.ObjectId().toString(), totalSnapshot: 1, grandTotal: 1,
      productsSnapshot: [{ name: "Client substituted product", price: 0, quantity: 999 }], status: "delivered",
    }).expect(400);
    expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
    const order = await convert(); expect(order.addedBy).toBe(users.admin._id.toString());
  });
  test("sequential replay returns the same order without changing snapshots or fulfillment status", async () => {
    await approve(); const first = await convert();
    await call("put", orderPath(first)).send({ status: "dispatched", expectedStatus: "confirm" }).expect(200);
    const before = await orderSnapshot(first);
    const replay = await call("post", convertPath()).send({}).expect(200);
    expect(replay.body.order).toMatchObject({ _id: first._id, orderId: first.orderId, status: "dispatched" });
    expect(await Order.countDocuments()).toBe(1); expect(await orderSnapshot(first)).toEqual(before);
  });
  test("concurrent conversion requests commit exactly one order and safely replay the same result", async () => {
    await approve();
    const responses = await Promise.all(Array.from({ length: 5 }, () => call("post", convertPath()).send({})));
    expect(responses.filter(response => response.status === 201)).toHaveLength(1);
    expect(responses.filter(response => response.status === 200)).toHaveLength(4);
    expect(new Set(responses.map(response => response.body.order._id)).size).toBe(1);
    expect(await Order.countDocuments()).toBe(1); expect((await Quotation.findById(draft._id)).status).toBe("CONVERTED");
  });
  test("archiving a converted order never frees its quotation for reconversion", async () => {
    await approve(); const order = await convert();
    await call("delete", orderPath(order)).expect(200);
    const before = await quoteSnapshot();
    await call("post", convertPath()).send({}).expect(409);
    expect(await Order.countDocuments()).toBe(1); expect((await Order.findById(order._id)).deleted).toBe(true);
    expect(await quoteSnapshot()).toEqual(before);
    await call("get", orderPath(order)).expect(404);
    expect((await call("get", "/api/orders").expect(200)).body).toEqual([]);
  });

  test.each([false, true])("an existing unmarked legacy order blocks conversion even when archived=%s", async deleted => {
    await approve();
    await Order.create(legacyInput({ quotationId: draft._id, deleted }));
    const before = await quoteSnapshot();
    await call("post", convertPath()).send({}).expect(409);
    expect(await Order.countDocuments()).toBe(1); expect(await quoteSnapshot()).toEqual(before);
  });
  test("approved partial unique index preserves legacy duplicates while preventing new duplicate conversions", async () => {
    const legacySource = new mongoose.Types.ObjectId();
    await Order.create([legacyInput({ orderId: "ORD-OLD-ONE", quotationId: legacySource }), legacyInput({ orderId: "ORD-OLD-TWO", quotationId: legacySource, deleted: true })]);
    expect(await Order.countDocuments({ quotationId: legacySource })).toBe(2);
    await approve(); const order = await convert();
    const source = await orderSnapshot(order); delete source._id; delete source.__v;
    await expect(Order.create({ ...source, orderId: "ORD-ATTEMPT-DUPLICATE" })).rejects.toMatchObject({ code: 11000 });
    const indexes = await Order.collection.indexes();
    expect(indexes).toEqual(expect.arrayContaining([expect.objectContaining({ key: { quotationId: 1 }, unique: true, partialFilterExpression: { sourceType: "quotation_conversion" } })]));
    expect(await Order.countDocuments({ quotationId: draft._id })).toBe(1);
  });

  test.each(["rename and reprice", "delete"])("conversion uses approved item snapshots after Product %s", async change => {
    await approve(); const approved = await quoteSnapshot();
    if (change === "delete") await Product.deleteMany({});
    else await Product.updateMany({}, { $set: { name: "Changed live name", description: "Changed live description", price: 9999 } });
    const order = await convert();
    expect(order.productsSnapshot.map(line => pick(line, lineFields))).toEqual(approved.items.map(line => pick(line, lineFields)));
    expect(order.productsSnapshot.map(line => line.name)).toEqual(approved.items.map(line => line.productName));
    expect(order.productsSnapshot[1]).toMatchObject({ gstRate: 0, gstAmount: 0, unitPrice: 0.05, discountAmount: 0.01, lineTotal: 0.04 });
    expect(pick(order, headerFields)).toEqual(pick(approved.quotation, headerFields));
    expect((await quoteSnapshot()).items).toEqual(approved.items);
  });
  test("Customer is frozen at conversion time; later Customer/Product changes cannot alter an order", async () => {
    await approve();
    await Customer.updateOne({ _id: customer._id }, { $set: { name: "Name at conversion", address: "Address at conversion", email: "conversion@order.test" } });
    const order = await convert();
    expect(order.customerSnapshot).toMatchObject({ name: "Name at conversion", address: "Address at conversion", email: "conversion@order.test", customerId: customer.customerId });
    const before = await orderSnapshot(order);
    await Customer.updateOne({ _id: customer._id }, { $set: { name: "Later name", address: "Later address" } });
    await Product.deleteMany({});
    const response = await call("get", orderPath(order)).expect(200);
    expect(response.body.order.customerSnapshot).toEqual(order.customerSnapshot);
    expect(response.body.order.productsSnapshot).toEqual(order.productsSnapshot);
    expect(await orderSnapshot(order)).toEqual(before);
  });
  test("an archived Customer can be snapshotted without reactivation", async () => {
    await approve(); await Customer.updateOne({ _id: customer._id }, { $set: { deleted: true, deletedAt: new Date() } });
    const archivedBefore = plain(await Customer.findById(customer._id).lean());
    const order = await convert(); expect(order.customerSnapshot.name).toBe(customer.name);
    expect(plain(await Customer.findById(customer._id).lean())).toEqual(archivedBefore);
  });
  test("a missing Customer rejects conversion without substituting a customer or partial writes", async () => {
    await approve(); await Customer.deleteOne({ _id: customer._id }); const before = await quoteSnapshot();
    await call("post", convertPath()).send({}).expect(409);
    expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test.each(["missing items", "invalid quantity", "missing historical name", "missing stored tax", "header mismatch", "inconsistent line components"])("approved %s requires review without rewriting historical data", async scenario => {
    await approve();
    const line = await QuotationItem.findOne({ quotationId: draft._id }).lean();
    if (scenario === "missing items") await QuotationItem.deleteMany({ quotationId: draft._id });
    if (scenario === "invalid quantity") await QuotationItem.collection.updateOne({ _id: line._id }, { $set: { quantity: 0 } });
    if (scenario === "missing historical name") await QuotationItem.collection.updateOne({ _id: line._id }, { $unset: { productName: "" } });
    if (scenario === "missing stored tax") await QuotationItem.collection.updateOne({ _id: line._id }, { $unset: { gstAmount: "" } });
    if (scenario === "header mismatch") await Quotation.collection.updateOne({ _id: new mongoose.Types.ObjectId(draft._id) }, { $inc: { grandTotal: 1 } });
    if (scenario === "inconsistent line components") {
      await QuotationItem.collection.updateOne({ _id: line._id }, { $inc: { lineTotal: 1 } });
      await Quotation.collection.updateOne({ _id: new mongoose.Types.ObjectId(draft._id) }, { $inc: { grandTotal: 1 } });
    }
    const before = await quoteSnapshot();
    await call("post", convertPath()).send({}).expect(409);
    expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test.each(["discountAmount", "taxableAmount", "gstAmount", "lineTotal"])("subcent stored %s requires review instead of silently rounding approved values", async field => {
    await approve();
    const line = await QuotationItem.findOne({ quotationId: draft._id }).lean();
    await QuotationItem.collection.updateOne({ _id: line._id }, { $set: { [field]: line[field] + 0.001 } });
    const before = await quoteSnapshot();
    await call("post", convertPath()).send({}).expect(409);
    expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test("historical subcent unit price is copied unchanged when approved stored components reconcile", async () => {
    const quote = await createQuotation({ items: [itemInput(0, { quantity: 1, unitPrice: 100.005, discountAmount: 0 })] });
    await approve(quote);
    // Older records may retain an unrounded unit-price representation while
    // their approved component amounts are whole cents. Conversion must copy
    // that representation, rather than apply today's unit-price normalization.
    await QuotationItem.collection.updateOne({ quotationId: new mongoose.Types.ObjectId(quote._id) }, { $set: { unitPrice: 100.005 } });
    const before = await quoteSnapshot(quote); const order = await convert(quote);
    expect(order.productsSnapshot[0]).toMatchObject({ price: 100.005, unitPrice: 100.005, ...pick(before.items[0], lineFields) });
    expect(pick(order, headerFields)).toEqual(pick(before.quotation, headerFields));
    expect((await quoteSnapshot(quote)).items).toEqual(before.items);
  });
  test("a legacy missing source remains readable using snapshots without fabricated tax or totals", async () => {
    const legacy = await Order.create(legacyInput()); const before = await orderSnapshot(legacy);
    const response = await call("get", orderPath(legacy)).expect(200);
    expect(response.body.order).toMatchObject({ orderId: legacy.orderId, totalSnapshot: 24.68, customerSnapshot: { name: "Stored legacy customer" }, productsSnapshot: [{ name: "Stored legacy product", price: 12.34, quantity: 2 }] });
    for (const field of headerFields) expect(response.body.order[field]).toBeUndefined();
    for (const field of ["discountAmount", "gstRate", "taxableAmount", "gstAmount", "lineTotal"]) expect(response.body.order.productsSnapshot[0][field]).toBeUndefined();
    expect(await orderSnapshot(legacy)).toEqual(before);
  });
  test("duplicate legacy dangling references remain untouched and readable as separate orders", async () => {
    const source = new mongoose.Types.ObjectId();
    const records = await Order.create([
      legacyInput({ orderId: "ORD001", quotationId: source, status: "delivered", deleted: true }),
      legacyInput({ orderId: "ORD002", quotationId: source, status: "dispatched" }),
      legacyInput({ orderId: "ORD003", quotationId: source, status: "confirm" }),
    ]);
    const before = plain(await Order.find({}).sort({ orderId: 1 }).lean());
    const listed = await call("get", "/api/orders").expect(200);
    expect(listed.body.map(order => order.orderId).sort()).toEqual(["ORD002", "ORD003"]);
    for (const record of records.slice(1)) await call("get", orderPath(record)).expect(200);
    expect(plain(await Order.find({}).sort({ orderId: 1 }).lean())).toEqual(before);
  });

  test("failure after a real Order insert rolls back the entire conversion", async () => {
    await approve(); const before = await quoteSnapshot();
    const realCreate = orderRepo.createOrder; let inserted = false;
    jest.spyOn(orderRepo, "createOrder").mockImplementationOnce(async (...args) => {
      expect(args[1]).toBeTruthy();
      const order = await realCreate(...args); inserted = !!order._id;
      throw new Error("Injected failure after the real Order insert");
    });
    await call("post", convertPath()).send({}).expect(500);
    expect(inserted).toBe(true); expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test("failure after the real CONVERTED header write rolls back both Order and quotation", async () => {
    await approve(); const before = await quoteSnapshot();
    const realUpdate = quotationRepo.updateIfCurrent; let updated = false;
    jest.spyOn(quotationRepo, "updateIfCurrent").mockImplementationOnce(async (...args) => {
      expect(args[2].status).toBe("CONVERTED"); expect(args[3]).toBeTruthy();
      await realUpdate(...args); updated = true;
      throw new Error("Injected failure after the real quotation conversion write");
    });
    await call("post", convertPath()).send({}).expect(500);
    expect(updated).toBe(true); expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test("quotation archive/conversion race never leaves a partial or duplicate conversion", async () => {
    await approve();
    const [conversion, archive] = await Promise.all([call("post", convertPath()).send({}), call("delete", quotePath())]);
    const quote = await Quotation.findById(draft._id).lean(); const orders = await Order.find({ quotationId: draft._id }).lean();
    expect([201, 404, 409]).toContain(conversion.status); expect([200, 404, 409]).toContain(archive.status);
    expect(orders.length).toBeLessThanOrEqual(1);
    if (orders.length) expect(quote.status).toBe("CONVERTED"); else expect(quote.status).toBe("APPROVED");
    if (archive.status === 200) expect(quote.deleted).toBe(true);
  });

  test("legacy pending → confirm remains compatible with the existing order endpoint", async () => {
    const order = await Order.create(legacyInput({ status: "pending" }));
    await call("put", orderPath(order)).send({ status: "confirm", expectedStatus: "pending" }).expect(200);
    expect((await Order.findById(order._id)).status).toBe("confirm");
  });
  test.each([
    ["confirm", "delivered"], ["confirm", "closed"], ["confirm", "pending"],
    ["dispatched", "confirm"], ["dispatched", "cancelled"], ["delivered", "cancelled"],
    ["closed", "confirm"], ["cancelled", "confirm"], ["legacy-unrecognized", "confirm"],
  ])("rejects invalid transition %s → %s without changing the order", async (status, target) => {
    const order = await Order.create(legacyInput({ status })); const before = await orderSnapshot(order);
    await call("put", orderPath(order)).send({ status: target, expectedStatus: status, reason: "Attempted transition" }).expect(400);
    expect(await orderSnapshot(order)).toEqual(before);
  });
  test.each(["pending", "confirm"])("cancelling %s requires a reason and produces a terminal state", async status => {
    const order = await Order.create(legacyInput({ status })); const before = await orderSnapshot(order);
    await call("put", orderPath(order)).send({ status: "cancelled", expectedStatus: status }).expect(400);
    await call("put", orderPath(order)).send({ status: "cancelled", expectedStatus: status, reason: "   " }).expect(400);
    expect(await orderSnapshot(order)).toEqual(before);
    await call("put", orderPath(order)).send({ status: "cancelled", expectedStatus: status, reason: "  Customer withdrew  " }).expect(200);
    const cancelled = plain(await Order.findById(order._id).lean());
    expect(cancelled).toMatchObject({ status: "cancelled", cancellationReason: "Customer withdrew", cancelledBy: users.admin._id.toString(), statusUpdatedBy: users.admin._id.toString(), updatedBy: users.admin._id.toString() });
    expect(new Date(cancelled.cancelledAt).getTime()).toBeGreaterThan(0);
    await call("put", orderPath(order)).send({ status: "confirm", expectedStatus: "cancelled" }).expect(400);
  });
  test("status request cannot modify commercial snapshots, source or audit identity", async () => {
    await approve(); const order = await convert(); const before = await orderSnapshot(order);
    await call("put", orderPath(order)).send({
      status: "dispatched", expectedStatus: "confirm", quotationId: new mongoose.Types.ObjectId().toString(),
      addedBy: users.employeeB._id.toString(), totalSnapshot: 0, productsSnapshot: [], customerSnapshot: { name: "Override" },
    }).expect(400);
    expect(await orderSnapshot(order)).toEqual(before);
  });
  test("an outdated expectedStatus rejects a stale status request", async () => {
    await approve(); const order = await convert();
    await call("put", orderPath(order)).send({ status: "dispatched", expectedStatus: "confirm" }).expect(200);
    const before = await orderSnapshot(order);
    await call("put", orderPath(order)).send({ status: "delivered", expectedStatus: "confirm" }).expect(409);
    expect(await orderSnapshot(order)).toEqual(before);
  });
  test("concurrent status requests cannot both advance the same expected state", async () => {
    await approve(); const order = await convert();
    const responses = await Promise.all([
      call("put", orderPath(order)).send({ status: "dispatched", expectedStatus: "confirm" }),
      call("put", orderPath(order)).send({ status: "cancelled", expectedStatus: "confirm", reason: "Concurrent cancellation" }),
    ]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    expect(["dispatched", "cancelled"]).toContain((await Order.findById(order._id)).status);
  });
  test("archived orders cannot be updated or exported through direct API calls", async () => {
    await approve(); const order = await convert(); await call("delete", orderPath(order)).expect(200);
    const before = await orderSnapshot(order);
    await call("put", orderPath(order)).send({ status: "dispatched", expectedStatus: "confirm" }).expect(404);
    await call("get", `${orderPath(order)}/download-pdf`).expect(404);
    await call("get", `${orderPath(order)}/download-csv`).expect(404);
    expect(await orderSnapshot(order)).toEqual(before);
  });
  test("Order status/archive race preserves archive and a valid fulfillment state", async () => {
    await approve(); const order = await convert();
    const [status, archive] = await Promise.all([
      call("put", orderPath(order)).send({ status: "dispatched", expectedStatus: "confirm" }), call("delete", orderPath(order)),
    ]);
    expect([200, 404, 409]).toContain(status.status); expect([200, 409]).toContain(archive.status);
    const stored = await Order.findById(order._id).lean();
    if (archive.status === 200) expect(stored.deleted).toBe(true);
    expect(["confirm", "dispatched"]).toContain(stored.status);
  });

  test.each(["employeeA", "employeeB"])("%s cannot convert even their own approved quotation", async actor => {
    await approve(); const before = await quoteSnapshot();
    await call("post", convertPath(), actor).send({}).expect(403);
    expect(await Order.countDocuments()).toBe(0); expect(await quoteSnapshot()).toEqual(before);
  });
  test.each([
    ["get", ""], ["get", "/ORD001"], ["put", "/ORD001"], ["delete", "/ORD001"],
    ["get", "/ORD001/download-pdf"], ["get", "/ORD001/download-csv"],
  ])("Employee cannot invoke %s /api/orders%s", async (method, suffix) => {
    for (const actor of ["employeeA", "employeeB"]) await call(method, `/api/orders${suffix}`, actor).send({ status: "dispatched" }).expect(403);
  });
  test.each([
    ["get", "/api/orders"], ["get", "/api/orders/ORD001"], ["put", "/api/orders/ORD001"], ["delete", "/api/orders/ORD001"],
    ["get", "/api/orders/ORD001/download-pdf"], ["get", "/api/orders/ORD001/download-csv"],
  ])("unauthenticated %s %s requires login", async (method, path) => {
    await request(server)[method](path).send({ status: "dispatched" }).expect(401);
  });
  test("unauthenticated quotation conversion requires login", async () => {
    await request(server).post(convertPath()).send({}).expect(401);
  });
  test("Order list/details/populated identities never expose password hashes or authentication secrets", async () => {
    await approve(); const order = await convert();
    for (const path of ["/api/orders", orderPath(order), quotePath()]) {
      const response = await call("get", path).expect(200);
      expect(JSON.stringify(response.body)).not.toMatch(/password|refreshToken|\$2[aby]\$/i);
    }
  });
  test("real PDF and CSV downloads use frozen snapshots after source records are changed or removed", async () => {
    const historicalName = 'Historical, "quoted" product\nsecond line';
    const frozenCustomerName = 'Frozen, "quoted" customer\nsecond line';
    await Product.updateOne({ _id: products[0]._id }, { $set: { name: historicalName } });
    const quote = await createQuotation(); await approve(quote);
    await Customer.updateOne({ _id: customer._id }, { $set: { name: frozenCustomerName } });
    const order = await convert(quote); const before = await orderSnapshot(order);
    await Product.deleteMany({}); await Customer.deleteOne({ _id: customer._id });
    const pdf = await call("get", `${orderPath(order)}/download-pdf`).buffer(true).parse((response, callback) => {
      const chunks = []; response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => callback(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(pdf.headers["content-type"]).toMatch(/application\/pdf/);
    expect(pdf.headers["content-disposition"]).toContain(order.orderId);
    expect(Buffer.isBuffer(pdf.body)).toBe(true); expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.body.length).toBeGreaterThan(500);
    const csv = await call("get", `${orderPath(order)}/download-csv`).expect(200);
    expect(csv.headers["content-type"]).toMatch(/text\/csv/);
    expect(csv.headers["content-disposition"]).toContain(order.orderId);
    expect(csv.text).toContain('"Historical, ""quoted"" product\nsecond line"');
    expect(csv.text).toContain('"Frozen, ""quoted"" customer\nsecond line"');
    expect(csv.text).toContain(order.orderId); expect(csv.text).toContain(quote.quotationId);
    expect(csv.text).toContain(String(order.grandTotal));
    expect(await orderSnapshot(order)).toEqual(before);
  });
  test("legacy PDF/CSV work with a missing quotation and explicitly unavailable commercial components", async () => {
    const order = await Order.create(legacyInput()); const before = await orderSnapshot(order);
    const csv = await call("get", `${orderPath(order)}/download-csv`).expect(200);
    expect(csv.text).toContain("Stored legacy product"); expect(csv.text).toContain("Stored legacy customer");
    expect(csv.text).toContain("24.68"); expect(csv.text).toContain("Unavailable");
    const pdf = await call("get", `${orderPath(order)}/download-pdf`).buffer(true).parse((response, callback) => {
      const chunks = []; response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => callback(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(await orderSnapshot(order)).toEqual(before);
  });
});
