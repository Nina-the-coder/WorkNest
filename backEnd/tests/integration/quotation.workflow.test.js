const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Customer = require("../../src/modules/customer/customer.model");
const Product = require("../../src/modules/product/product.model");
const Task = require("../../src/modules/task/task.model");
const Quotation = require("../../src/modules/quotation/quotation.model");
const QuotationItem = require("../../src/modules/quotation/quotationItem.model");
const quotationRepo = require("../../src/modules/quotation/quotation.repository");

jest.setTimeout(90000);
const password = "Quotation-workflow-integration-123!";
const originalSecret = process.env.JWT_SECRET;
let mongo, server, users, tokens, customer, products, draft;
const call = (method, path, actor = "employeeA") => request(server)[method](path).set("Authorization", tokens[actor]);
const quotePath = (quote = draft) => `/api/quotations/${quote._id}`;
const plain = value => JSON.parse(JSON.stringify(value));
const snapshot = async (id = draft._id) => ({
  quotation: plain(await Quotation.findById(id).lean()),
  items: plain(await QuotationItem.find({ quotationId: id }).sort({ _id: 1 }).lean()),
});
const itemInput = (overrides = {}, index = 0) => ({ productId: products[index]._id.toString(), quantity: 1, unitPrice: 100, discountAmount: 0, discountPercentage: 0, gstRate: 18, ...overrides });
const createInput = (overrides = {}) => ({
  customerId: customer._id.toString(), items: [itemInput()],
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString(), notes: "Shared quotation workflow", ...overrides,
});
const create = async (body = createInput(), actor = "employeeA") => {
  const response = await call("post", "/api/quotations", actor).send(body).expect(201);
  return response.body.quotation;
};
const submit = async (quote = draft) => call("post", `${quotePath(quote)}/submit`).send({}).expect(200);
const assertUnchanged = async (before, id = draft._id) => expect(await snapshot(id)).toEqual(before);

// Every normal request uses the actual app, model hooks, login-issued JWT,
// authorization, service, repository and a disposable transaction-capable DB.
// Only rollback tests inject a persistence failure after a real item write.
describe("Shared quotation workflow with real HTTP and replica-set MongoDB", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "worknest-quotation-workflow-only";
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" }, instanceOpts: [{ ip: "127.0.0.1" }] });
    await mongoose.connect(mongo.getUri("worknest_quotation_workflow"));
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    const records = await User.create([
      { name: "Quotation Admin", email: "admin@quotation-workflow.test", empId: "EMP-QT-ADMIN", role: "admin", password },
      { name: "Quotation Employee A", email: "a@quotation-workflow.test", empId: "EMP-QT-A", role: "employee", password },
      { name: "Quotation Employee B", email: "b@quotation-workflow.test", empId: "EMP-QT-B", role: "employee", password },
    ]);
    users = Object.fromEntries(["admin", "employeeA", "employeeB"].map((name, index) => [name, records[index]]));
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); listener.once("error", reject);
    });
    tokens = {};
    for (const [actor, user] of Object.entries(users)) {
      const login = await request(server).post("/api/auth/login").send({ email: user.email, password }).expect(200);
      tokens[actor] = `Bearer ${login.body.token}`;
    }
  });
  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models).filter(model => model !== User).map(model => model.deleteMany({})));
    customer = await Customer.create({ customerId: "CUST-QT-WORKFLOW", name: "Existing customer", contact: "9876501234", status: "active", addedBy: users.admin._id });
    products = await Product.create([
      { productId: "PRD-QT-ONE", name: "Quoted product one", description: "Original description one", price: 100 },
      { productId: "PRD-QT-TWO", name: "Quoted product two", description: "Original description two", price: 25 },
    ]);
    draft = await create();
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
  });

  test("Employee saves/edits/submits one draft; Admin reviews and approves the same complete record", async () => {
    expect(draft).toMatchObject({ status: "DRAFT", employeeId: users.employeeA._id.toString(), createdBy: users.employeeA._id.toString(), grandTotal: 118 });
    expect(draft.quotationId).toMatch(/^QT\d+$/);
    const originalId = draft._id;
    const edited = await call("put", quotePath()).send({
      customerId: customer._id.toString(), items: [itemInput({ quantity: 2, unitPrice: 25.005, discountAmount: 1.005, gstRate: 0 })], notes: "Employee revised saved draft",
    }).expect(200);
    expect(edited.body.quotation).toMatchObject({ _id: originalId, quotationId: draft.quotationId, status: "DRAFT", subtotal: 50.02, discountAmount: 1.01, taxableAmount: 49.01, gstAmount: 0, grandTotal: 49.01 });
    expect(edited.body.quotation.items[0]).toMatchObject({ unitPrice: 25.01, discountAmount: 1.01, gstRate: 0, lineTotal: 49.01, productName: products[0].name });
    expect(await Quotation.countDocuments()).toBe(1);
    const sent = await submit();
    expect(sent.body.quotation).toMatchObject({ _id: originalId, status: "SUBMITTED", submittedBy: users.employeeA._id.toString() });
    expect(new Date(sent.body.quotation.submittedAt).getTime()).toBeGreaterThan(0);
    const adminList = await call("get", "/api/quotations", "admin").query({ status: "SUBMITTED" }).expect(200);
    expect(adminList.body).toMatchObject({ total: 1, quotations: [{ _id: originalId, status: "SUBMITTED", grandTotal: 49.01 }] });
    const details = await call("get", quotePath(), "admin").expect(200);
    expect(details.body.quotation.createdBy).toMatchObject({ _id: users.employeeA._id.toString(), name: users.employeeA.name });
    expect(details.body.quotation.items[0]).toMatchObject({ productName: products[0].name, quantity: 2, unitPrice: 25.01, gstRate: 0 });
    expect(JSON.stringify(details.body)).not.toMatch(/password|\$2[aby]\$/i);
    await call("post", `${quotePath()}/approve`, "admin").send({}).expect(200);
    const employeeView = await call("get", quotePath()).expect(200);
    expect(employeeView.body.quotation).toMatchObject({ status: "APPROVED", grandTotal: 49.01, approvedBy: { _id: users.admin._id.toString() } });
    const before = await snapshot();
    await call("put", quotePath()).send({ notes: "Locked change" }).expect(400);
    await assertUnchanged(before);
  });

  test("rejection reason/reviewer/date survive edit, reopen, resubmit and approval; a later rejection replaces only the latest event", async () => {
    await submit();
    await call("post", `${quotePath()}/reject`, "admin").send({ reason: "Clarify quantities" }).expect(200);
    const first = await snapshot();
    expect(first.quotation).toMatchObject({ status: "REJECTED", rejectionReason: "Clarify quantities", rejectedBy: users.admin._id.toString() });
    await call("put", quotePath()).send({ notes: "Clarified the requested quantities", items: [itemInput({ quantity: 3 })] }).expect(200);
    await call("post", `${quotePath()}/submit`).send({}).expect(400);
    await call("post", `${quotePath()}/reopen`).send({}).expect(200);
    const reopened = await snapshot();
    for (const field of ["rejectionReason", "rejectedBy", "rejectedAt"]) expect(reopened.quotation[field]).toEqual(first.quotation[field]);
    await submit();
    const resent = await call("get", quotePath()).expect(200);
    expect(resent.body.quotation).toMatchObject({ status: "SUBMITTED", rejectionReason: "Clarify quantities", rejectedBy: { name: users.admin.name } });
    await call("post", `${quotePath()}/reject`, "admin").send({ reason: "Confirm the revised price" }).expect(200);
    const latest = await snapshot();
    expect(latest.quotation.rejectionReason).toBe("Confirm the revised price");
    await call("post", `${quotePath()}/reopen`).send({}).expect(200); await submit();
    await call("post", `${quotePath()}/approve`, "admin").send({}).expect(200);
    const approved = await snapshot();
    for (const field of ["rejectionReason", "rejectedBy", "rejectedAt"]) expect(approved.quotation[field]).toEqual(latest.quotation[field]);
    expect(approved.quotation.status).toBe("APPROVED");
    expect(approved.quotation.employeeId).toBe(users.employeeA._id.toString());
  });

  test("Employee list/detail and mutations stay scoped despite substituted query and identity fields", async () => {
    const other = await create(createInput(), "employeeB");
    const own = await call("get", "/api/quotations").query({ employeeId: users.employeeB._id.toString(), role: "admin", limit: 1 }).expect(200);
    expect(own.body).toMatchObject({ total: 1, quotations: [{ _id: draft._id }] });
    const before = await snapshot();
    for (const [method, suffix] of [["get", ""], ["put", ""], ["post", "/submit"], ["post", "/reopen"]]) {
      await call(method, `${quotePath()}${suffix}`, "employeeB").send({ notes: "Forbidden", employeeId: users.employeeB._id.toString() }).expect(404);
    }
    await call("get", quotePath(other)).expect(404);
    await assertUnchanged(before);
    const forged = await create(createInput({ employeeId: users.employeeB._id.toString(), createdBy: users.admin._id.toString(), status: "APPROVED", grandTotal: 1 }));
    expect(forged).toMatchObject({ employeeId: users.employeeA._id.toString(), createdBy: users.employeeA._id.toString(), status: "DRAFT", grandTotal: 118 });
  });

  test("Employee cannot transfer ownership and creator/number/audit/status/total spoofing is ignored", async () => {
    const before = await snapshot();
    await call("put", quotePath()).send({ employeeId: users.employeeB._id.toString(), notes: "Must not write" }).expect(403);
    await assertUnchanged(before);
    await call("put", quotePath()).send({ notes: "Permitted update", createdBy: users.employeeB._id.toString(), updatedBy: users.admin._id.toString(), quotationId: "QT-SPOOF", status: "APPROVED", grandTotal: 1 }).expect(200);
    const after = await snapshot();
    expect(after.quotation).toMatchObject({ createdBy: users.employeeA._id.toString(), updatedBy: users.employeeA._id.toString(), quotationId: draft.quotationId, status: "DRAFT", grandTotal: 118 });
  });

  test.each(["approve", "reject"])("Employee cannot invoke %s even on their submitted quotation", async action => {
    await submit(); const before = await snapshot();
    await call("post", `${quotePath()}/${action}`).send({ reason: "Unauthorized review" }).expect(403);
    await assertUnchanged(before);
  });
  test.each(["SUBMITTED", "APPROVED", "CONVERTED"])("%s quotation items and metadata are locked", async status => {
    await Quotation.updateOne({ _id: draft._id }, { $set: { status } }); const before = await snapshot();
    await call("put", quotePath()).send({ notes: "Locked", items: [itemInput({ quantity: 2 })] }).expect(400);
    await call("put", quotePath(), "admin").send({ notes: "Admin also follows editable states" }).expect(400);
    await assertUnchanged(before);
  });

  test("exact half-up pricing rounds each stored component before summing headers", async () => {
    const tiny = await create(createInput({ items: [itemInput({ unitPrice: 0.05, discountPercentage: 10 }), itemInput({ unitPrice: 1.005, gstRate: 0 }, 1)] }));
    expect(tiny.items[0]).toMatchObject({ unitPrice: 0.05, discountAmount: 0.01, taxableAmount: 0.04, gstAmount: 0.01, lineTotal: 0.05 });
    expect(tiny.items[1]).toMatchObject({ unitPrice: 1.01, taxableAmount: 1.01, gstAmount: 0, lineTotal: 1.01 });
    expect(tiny).toMatchObject({ subtotal: 1.06, discountAmount: 0.01, taxableAmount: 1.05, gstAmount: 0.01, grandTotal: 1.06 });
  });
  test("omitted new-item GST defaults to 18 while explicit zero remains zero", async () => {
    const input = createInput({ items: [itemInput(), itemInput({ gstRate: 0 }, 1)] }); delete input.items[0].gstRate;
    const quote = await create(input);
    expect(quote.items.map(item => item.gstRate)).toEqual([18, 0]);
    expect(quote.items.map(item => item.lineTotal)).toEqual([118, 100]); expect(quote.grandTotal).toBe(218);
  });
  test("omitted GST on an unchanged historical line is validated with its stored zero rate", async () => {
    const quote = await create(createInput({ items: [itemInput({ unitPrice: 80000000000000, gstRate: 0 })] }));
    const item = { ...quote.items[0], productId: products[0]._id.toString() }; delete item.gstRate;
    const response = await call("put", quotePath(quote)).send({ notes: "Stored zero GST remains authoritative", items: [item] }).expect(200);
    expect(response.body.quotation).toMatchObject({ grandTotal: 80000000000000, gstAmount: 0 });
    expect(response.body.quotation.items[0]).toMatchObject({ unitPrice: 80000000000000, gstRate: 0, lineTotal: 80000000000000 });
  });
  test("positive percentage discount wins over an amount without double subtraction", async () => {
    const quote = await create(createInput({ items: [itemInput({ quantity: 2, discountPercentage: 12.345, discountAmount: 9 })] }));
    expect(quote.items[0]).toMatchObject({ discountPercentage: 12.345, discountAmount: 24.69, taxableAmount: 175.31, gstAmount: 31.56, lineTotal: 206.87 });
    expect(quote).toMatchObject({ subtotal: 200, discountAmount: 24.69, taxableAmount: 175.31, gstAmount: 31.56, grandTotal: 206.87 });
  });
  test("explicit zero price is valid, while missing price is not", async () => {
    const free = await create(createInput({ items: [itemInput({ unitPrice: 0, discountAmount: 0 })] })); expect(free.grandTotal).toBe(0);
    const missing = itemInput(); delete missing.unitPrice;
    await call("post", "/api/quotations").send(createInput({ items: [missing] })).expect(400);
  });

  test.each([
    ["quantity", 0], ["quantity", -1], ["quantity", 1.5], ["quantity", null], ["quantity", true], ["quantity", ""],
    ["unitPrice", -1], ["unitPrice", null], ["unitPrice", false], ["unitPrice", ""],
    ["discountAmount", -1], ["discountAmount", null], ["discountAmount", true], ["discountAmount", ""], ["discountAmount", 101],
    ["discountPercentage", -1], ["discountPercentage", 101], ["discountPercentage", null], ["discountPercentage", false], ["discountPercentage", ""],
    ["gstRate", -1], ["gstRate", 101], ["gstRate", null], ["gstRate", false], ["gstRate", ""],
  ])("rejects invalid commercial input %s=%j without partial create or edit", async (field, value) => {
    const before = await snapshot(); const body = { items: [itemInput({ [field]: value })] };
    await call("post", "/api/quotations").send(createInput(body)).expect(400);
    expect(await Quotation.countDocuments()).toBe(1); expect(await QuotationItem.countDocuments()).toBe(1);
    await call("put", quotePath()).send({ ...body, notes: "Must not partially write" }).expect(400); await assertUnchanged(before);
  });

  test.each(["customerless", "empty items", "duplicate product", "malformed customer", "missing customer", "archived customer", "inactive customer", "malformed product", "missing product"])("rejects %s before creating a partial quotation", async scenario => {
    const input = createInput();
    if (scenario === "customerless") delete input.customerId;
    if (scenario === "empty items") input.items = [];
    if (scenario === "duplicate product") input.items.push(itemInput({ quantity: 2 }));
    if (scenario === "malformed customer") input.customerId = "not-an-id";
    if (scenario === "missing customer") input.customerId = new mongoose.Types.ObjectId().toString();
    if (scenario === "archived customer") await Customer.updateOne({ _id: customer._id }, { $set: { deleted: true } });
    if (scenario === "inactive customer") await Customer.updateOne({ _id: customer._id }, { $set: { status: "inactive" } });
    if (scenario === "malformed product") input.items[0].productId = "not-an-id";
    if (scenario === "missing product") input.items[0].productId = new mongoose.Types.ObjectId().toString();
    const response = await call("post", "/api/quotations").send(input);
    expect([400, 404]).toContain(response.status); expect(await Quotation.countDocuments()).toBe(1); expect(await QuotationItem.countDocuments()).toBe(1);
  });
  test.each(["not-a-date", "2020-01-01"])("rejects supplied invalid/expired validity %s", async validUntil => {
    const before = await snapshot(); await call("post", "/api/quotations").send(createInput({ validUntil })).expect(400);
    await call("put", quotePath()).send({ validUntil }).expect(400); await assertUnchanged(before);
  });
  test("API validity remains optional on a commercially complete draft and submit", async () => {
    const input = createInput(); delete input.validUntil;
    const quote = await create(input); await submit(quote);
    expect((await Quotation.findById(quote._id)).status).toBe("SUBMITTED");
  });

  test("catalog rename/reprice does not rewrite historical snapshots during edits or approval", async () => {
    await Product.updateOne({ _id: products[0]._id }, { $set: { name: "Live renamed product", description: "Live edited description", price: 999 } });
    const first = await snapshot();
    await call("put", quotePath()).send({ notes: "Metadata-only historical preservation" }).expect(200);
    expect((await snapshot()).items).toEqual(first.items);
    // ObjectId case is immaterial; an existing product reference without an item
    // ID must still resolve to its historical snapshot, not the renamed catalog.
    await call("put", quotePath()).send({ items: [itemInput({ quantity: 2, productId: products[0]._id.toString().toUpperCase() })] }).expect(200);
    const after = await snapshot();
    expect(after.items[0]).toMatchObject({ productName: "Quoted product one", sku: "PRD-QT-ONE", description: "Original description one", unitPrice: 100, quantity: 2 });
    await submit(); await call("post", `${quotePath()}/approve`, "admin").send({}).expect(200);
    expect((await snapshot()).items).toEqual(after.items);
  });
  test("existing item remains editable after Product deletion and retains omitted historical tax", async () => {
    await QuotationItem.updateOne({ quotationId: draft._id }, { $set: { gstRate: 0, gstAmount: 0, lineTotal: 100 } });
    await Quotation.updateOne({ _id: draft._id }, { $set: { gstAmount: 0, grandTotal: 100 } });
    const saved = (await snapshot()).items[0]; await Product.deleteOne({ _id: products[0]._id });
    const historical = (await call("get", quotePath()).expect(200)).body.quotation.items[0];
    expect(historical.productId?._id || historical.productId).toBe(products[0]._id.toString());
    const input = { ...historical, _id: saved._id, productId: historical.productId?._id || historical.productId, quantity: 2 }; delete input.gstRate;
    const result = await call("put", quotePath()).send({ items: [input] }).expect(200);
    expect(result.body.quotation.items[0]).toMatchObject({ productName: "Quoted product one", sku: "PRD-QT-ONE", unitPrice: 100, gstRate: 0, lineTotal: 200 });
    await submit(); expect((await Quotation.findById(draft._id)).grandTotal).toBe(200);
  });
  test("new items use current catalog snapshots and old item identity cannot spoof a different product", async () => {
    const existing = (await snapshot()).items[0];
    const edited = await call("put", quotePath()).send({ items: [itemInput(), itemInput({ unitPrice: 25 }, 1)] }).expect(200);
    expect(edited.body.quotation.items.map(item => item.productName)).toEqual(products.map(product => product.name));
    const response = await call("put", quotePath()).send({ items: [itemInput({ _id: existing._id, productId: products[1]._id.toString(), productName: "Spoofed snapshot" })] });
    expect([200, 400]).toContain(response.status);
    if (response.status === 200) expect(response.body.quotation.items[0].productName).toBe(products[1].name);
  });
  test("metadata-only edit does not silently repair inconsistent historical prices", async () => {
    await QuotationItem.updateOne({ quotationId: draft._id }, { $set: { gstAmount: 17.99, lineTotal: 117.99 } });
    await Quotation.updateOne({ _id: draft._id }, { $set: { gstAmount: 17.99, grandTotal: 117.99 } });
    const before = await snapshot(); await call("put", quotePath()).send({ notes: "Preserve old amounts" }).expect(200);
    const after = await snapshot(); expect(after.items).toEqual(before.items); expect(after.quotation.grandTotal).toBe(117.99);
  });
  test("unchanged full-item payload preserves legacy precision while another edited line uses current pricing", async () => {
    await QuotationItem.updateOne({ quotationId: draft._id }, { $set: {
      unitPrice: 0.005, quantity: 1, discountAmount: 0, discountPercentage: 0,
      taxableAmount: 0.01, gstRate: 18, gstAmount: 0, lineTotal: 0.01,
    } });
    await Quotation.updateOne({ _id: draft._id }, { $set: { subtotal: 0.01, discountAmount: 0, taxableAmount: 0.01, gstAmount: 0, grandTotal: 0.01 } });
    const historical = (await call("get", quotePath()).expect(200)).body.quotation.items[0];
    const unchanged = { ...historical, productId: historical.productId._id || historical.productId };
    const response = await call("put", quotePath()).send({ items: [unchanged, itemInput({ unitPrice: 25, gstRate: 0 }, 1)] }).expect(200);
    expect(response.body.quotation.items[0]).toMatchObject({ unitPrice: 0.005, taxableAmount: 0.01, gstAmount: 0, lineTotal: 0.01 });
    expect(response.body.quotation.grandTotal).toBe(25.01);
    const again = response.body.quotation.items.map(item => ({ ...item, productId: item.productId._id || item.productId }));
    again[1].quantity = 2;
    const changed = await call("put", quotePath()).send({ items: again }).expect(200);
    expect(changed.body.quotation.items[0]).toMatchObject({ unitPrice: 0.005, taxableAmount: 0.01, gstAmount: 0, lineTotal: 0.01 });
    expect(changed.body.quotation.grandTotal).toBe(50.01);
    const before = await snapshot();
    await call("post", `${quotePath()}/submit`).send({}).expect(400);
    await assertUnchanged(before);
    const fixed = changed.body.quotation.items.map(item => ({ ...item, productId: item.productId._id || item.productId }));
    fixed[0].unitPrice = 0.01;
    await call("put", quotePath()).send({ items: fixed }).expect(200);
    await submit();
  });
  test("a reproduced legacy small-line rounding snapshot survives full saves until that line is deliberately revised", async () => {
    await QuotationItem.updateOne({ quotationId: draft._id }, { $set: {
      unitPrice: 0.05, quantity: 1, discountPercentage: 10, discountAmount: 0.01,
      taxableAmount: 0.05, gstRate: 18, gstAmount: 0.01, lineTotal: 0.05,
    } });
    await Quotation.updateOne({ _id: draft._id }, { $set: { subtotal: 0.05, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, grandTotal: 0.06 } });
    await Product.updateOne({ _id: products[0]._id }, { $set: { name: "Live renamed product", price: 999 } });
    await Product.deleteOne({ _id: products[0]._id });
    const previous = (await snapshot()).items[0];
    const response = await call("put", quotePath()).send({ items: [previous, itemInput({ unitPrice: 25, gstRate: 0 }, 1)], notes: "Save existing line without changing it" }).expect(200);
    expect(response.body.quotation.items[0]).toMatchObject({
      productName: previous.productName, sku: previous.sku, description: previous.description,
      unitPrice: 0.05, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05,
    });
    expect(response.body.quotation.grandTotal).toBe(25.05);
    const before = await snapshot();
    const rejected = await call("post", `${quotePath()}/submit`).send({}).expect(400);
    expect(rejected.body.message).toMatch(/review|revise|inconsistent/i); await assertUnchanged(before);
    const deliberate = response.body.quotation.items.map(item => ({ ...item, productId: item.productId._id || item.productId }));
    deliberate[0].quantity = 2;
    const edited = await call("put", quotePath()).send({ items: deliberate }).expect(200);
    expect(edited.body.quotation.items[0]).toMatchObject({ quantity: 2, productName: previous.productName, discountAmount: 0.01, taxableAmount: 0.09, gstAmount: 0.02, lineTotal: 0.11 });
    expect(edited.body.quotation.items[1]).toMatchObject({ unitPrice: 25, lineTotal: 25 });
    expect(edited.body.quotation.grandTotal).toBe(25.11); await submit();
  });
  test("unchanged percentage pricing preserves historical components when its derived amount is omitted", async () => {
    await QuotationItem.updateOne({ quotationId: draft._id }, { $set: {
      unitPrice: 0.05, quantity: 1, discountPercentage: 10, discountAmount: 0.01,
      taxableAmount: 0.05, gstRate: 18, gstAmount: 0.01, lineTotal: 0.05,
    } });
    await Quotation.updateOne({ _id: draft._id }, { $set: { subtotal: 0.05, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, grandTotal: 0.06 } });
    await Product.deleteOne({ _id: products[0]._id });
    const input = itemInput({ unitPrice: 0.05, discountPercentage: 10 }); delete input.discountAmount;
    const edited = await call("put", quotePath()).send({ notes: "No commercial input changed", items: [input] }).expect(200);
    const preserved = {
      productName: "Quoted product one", sku: "PRD-QT-ONE", description: "Original description one",
      discountPercentage: 10, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05,
    };
    expect(edited.body.quotation.items[0]).toMatchObject(preserved);
    const ignored = await call("put", quotePath()).send({ items: [{ ...input, discountAmount: 0 }] }).expect(200);
    expect(ignored.body.quotation.items[0]).toMatchObject(preserved);
    const before = await snapshot();
    for (const discountAmount of [-1, null, true, ""]) {
      await call("put", quotePath()).send({ items: [{ ...input, discountAmount }], notes: "Invalid amount must not be ignored" }).expect(400);
      await assertUnchanged(before);
    }
    const canonical = await call("put", quotePath()).send({ items: [{ ...input, quantity: 2 }] }).expect(200);
    expect(canonical.body.quotation.items[0]).toMatchObject({ quantity: 2, discountAmount: 0.01, taxableAmount: 0.09, gstAmount: 0.02, lineTotal: 0.11 });
  });

  test.each(["empty", "invalid price", "expired", "missing customer"])("submission revalidates stored %s draft without changing it", async scenario => {
    if (scenario === "empty") await QuotationItem.deleteMany({ quotationId: draft._id });
    if (scenario === "invalid price") await QuotationItem.collection.updateOne({ quotationId: new mongoose.Types.ObjectId(draft._id) }, { $set: { quantity: -1 } });
    if (scenario === "expired") await Quotation.updateOne({ _id: draft._id }, { $set: { validUntil: new Date("2020-01-01") } });
    if (scenario === "missing customer") await Customer.deleteOne({ _id: customer._id });
    const before = await snapshot(); const response = await call("post", `${quotePath()}/submit`).send({});
    expect([400, 404]).toContain(response.status); await assertUnchanged(before);
  });
  test("repeated submit/approve fail safely without changing persisted data", async () => {
    await submit(); let before = await snapshot(); await call("post", `${quotePath()}/submit`).send({}).expect(400); await assertUnchanged(before);
    await call("post", `${quotePath()}/approve`, "admin").send({}).expect(200); before = await snapshot();
    await call("post", `${quotePath()}/approve`, "admin").send({}).expect(400); await assertUnchanged(before);
  });
  test("concurrent approve/reject produce exactly one valid review outcome", async () => {
    await submit();
    const responses = await Promise.all([
      call("post", `${quotePath()}/approve`, "admin").send({}),
      call("post", `${quotePath()}/reject`, "admin").send({ reason: "Review race" }),
    ]);
    expect(responses.filter(response => response.status === 200)).toHaveLength(1);
    expect(responses.every(response => [200, 400, 409].includes(response.status))).toBe(true);
    const after = await snapshot(); expect(["APPROVED", "REJECTED"]).toContain(after.quotation.status);
    expect(after.items).toHaveLength(1); expect(after.quotation.grandTotal).toBe(118);
  });
  test("concurrent submit/edit preserve a consistent complete item/header snapshot", async () => {
    const responses = await Promise.all([
      call("post", `${quotePath()}/submit`).send({}),
      call("put", quotePath()).send({ items: [itemInput({ quantity: 3 })], notes: "Concurrent edit" }),
    ]);
    expect(responses.every(response => [200, 400, 409].includes(response.status))).toBe(true);
    expect(responses.some(response => response.status === 200)).toBe(true);
    const after = await snapshot(); expect(after.items).toHaveLength(1);
    expect(after.quotation.grandTotal).toBe(after.items[0].lineTotal);
    expect(after.items[0].quantity === 3 ? 354 : 118).toBe(after.quotation.grandTotal);
    if (after.quotation.status === "SUBMITTED") await call("put", quotePath()).send({ notes: "Still locked" }).expect(400);
  });
  test("concurrent Admin owner reassignment and Employee edit cannot restore old ownership", async () => {
    const responses = await Promise.all([
      call("put", quotePath(), "admin").send({ employeeId: users.employeeB._id.toString() }),
      call("put", quotePath()).send({ notes: "Ownership race" }),
    ]);
    expect(responses.every(response => [200, 400, 404, 409].includes(response.status))).toBe(true);
    if (responses[0].status !== 200) await call("put", quotePath(), "admin").send({ employeeId: users.employeeB._id.toString() }).expect(200);
    const before = await snapshot(); expect(before.quotation.employeeId).toBe(users.employeeB._id.toString());
    await call("get", quotePath()).expect(404); await call("put", quotePath()).send({ notes: "Old owner" }).expect(404); await assertUnchanged(before);
    await call("get", quotePath(), "employeeB").expect(200);
  });

  test.each(["create", "edit"])("injected %s item failure rolls back header, old items and partial new writes", async operation => {
    const before = await snapshot(); const count = await Quotation.countDocuments();
    const originalCreate = quotationRepo.createQuotationItem;
    let writes = 0;
    jest.spyOn(quotationRepo, "createQuotationItem").mockImplementation(async (...args) => {
      writes += 1;
      if (writes === 2) throw new Error("Injected quotation item persistence failure");
      return originalCreate(...args);
    });
    const input = createInput({ items: [itemInput({ quantity: 2 }), itemInput({ unitPrice: 25 }, 1)], notes: "Must roll back" });
    const response = operation === "create" ? await call("post", "/api/quotations").send(input) : await call("put", quotePath()).send(input);
    expect(response.status).toBe(500); expect(writes).toBe(2);
    expect(await Quotation.countDocuments()).toBe(count); expect(await QuotationItem.countDocuments()).toBe(1); await assertUnchanged(before);
  });

  test("Admin can create, edit, reassign and archive; existing Task workflow remains functional", async () => {
    const quote = await create(createInput({ employeeId: users.employeeA._id.toString() }), "admin");
    expect(quote.createdBy).toBe(users.admin._id.toString());
    const edited = await call("put", quotePath(quote), "admin").send({ employeeId: users.employeeB._id.toString(), notes: "Admin reassignment", items: [itemInput({ quantity: 2 })] }).expect(200);
    expect(edited.body.quotation).toMatchObject({ employeeId: users.employeeB._id.toString(), createdBy: users.admin._id.toString(), grandTotal: 236 });
    await call("get", quotePath(quote), "employeeB").expect(200); await call("delete", quotePath(quote), "admin").expect(200); await call("get", quotePath(quote), "employeeB").expect(404);
    await call("post", "/api/tasks", "admin").send({ title: "Task regression", description: "Quotation integration does not change Task business rules", dueDate: "2035-01-01", assignedTo: users.employeeA._id.toString() }).expect(201);
    const task = await Task.findOne({ title: "Task regression" });
    await call("patch", `/api/tasks/${task.taskId}/status`).send({ status: "in-progress" }).expect(200);
    const adminTask = await call("get", `/api/tasks/${task.taskId}`, "admin").expect(200); expect(adminTask.body.task.status).toBe("in-progress");
  });
});
