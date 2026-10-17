const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Counter = require("../../src/models/Counter");
const Customer = require("../../src/modules/customer/customer.model");
const Product = require("../../src/modules/product/product.model");
const Quotation = require("../../src/modules/quotation/quotation.model");
const QuotationItem = require("../../src/modules/quotation/quotationItem.model");
const customerRepository = require("../../src/modules/customer/customer.repository");

jest.setTimeout(90000);
const password = "Customer-catalog-integration-123!";
const originalSecret = process.env.JWT_SECRET;
let mongo, server, users, tokens;
const call = (method, path, actor = "employeeA") => request(server)[method](path).set("Authorization", tokens[actor]);
const createCustomer = async (body = { name: "Acquired customer" }, actor = "employeeA", key) => {
  const operation = call("post", "/api/customers", actor);
  if (key !== undefined) operation.set("Idempotency-Key", key);
  return (await operation.send(body).expect(201)).body.customer;
};
const quoteInput = (customer, product) => ({
  customerId: customer._id.toString(), validUntil: "2030-01-01", notes: "Customer acquisition integration",
  items: [{ productId: product._id.toString(), quantity: 2, unitPrice: product.price, gstRate: 0, discountAmount: 0 }],
});
const plain = value => JSON.parse(JSON.stringify(value));

describe("Customer acquisition and product selection with real HTTP, JWT and replica-set MongoDB", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "worknest-customer-catalog-only";
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" }, instanceOpts: [{ ip: "127.0.0.1" }] });
    await mongoose.connect(mongo.getUri("worknest_customer_catalog"));
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    const records = await User.create([
      { name: "Customer Admin", email: "admin@customer-catalog.test", empId: "EMP-CC-ADMIN", role: "admin", password },
      { name: "Customer Employee A", email: "a@customer-catalog.test", empId: "EMP-CC-A", role: "employee", password },
      { name: "Customer Employee B", email: "b@customer-catalog.test", empId: "EMP-CC-B", role: "employee", password },
    ]);
    users = Object.fromEntries(["admin", "employeeA", "employeeB"].map((actor, index) => [actor, records[index]]));
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); listener.once("error", reject);
    });
    tokens = {};
    for (const [actor, user] of Object.entries(users)) {
      const response = await request(server).post("/api/auth/login").send({ email: user.email, password }).expect(200);
      tokens[actor] = `Bearer ${response.body.token}`;
    }
  });
  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models).filter(model => model !== User).map(model => model.deleteMany({})));
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
  });

  test.each(["admin", "employeeA", "employeeB"])("%s creates with actual actor identity; all roles see the shared customer", async actor => {
    const customer = await createCustomer({ name: "  Acquired customer  ", addedBy: users.employeeB._id, createdBy: users.admin._id, updatedBy: users.admin._id, customerId: "CUST-FORGED", deleted: true, deletedAt: "2000-01-01", createRequestHash: "forged" }, actor, "create-actor");
    expect(customer).toMatchObject({ name: "Acquired customer", addedBy: users[actor]._id.toString(), status: "active", companyType: "dealer", deleted: false });
    expect(customer.customerId).toMatch(/^CUST\d+$/); expect(customer.customerId).not.toBe("CUST-FORGED");
    expect(customer.deletedAt).toBeUndefined(); expect(customer.createdBy).toBeUndefined();
    for (const reader of ["admin", "employeeA", "employeeB"]) {
      const list = await call("get", "/api/customers", reader).expect(200);
      expect(list.body.map(row => row._id)).toContain(customer._id);
      const detail = await call("get", `/api/customers/${customer.customerId}`, reader).expect(200);
      expect(detail.body).toMatchObject({ _id: customer._id, addedBy: { _id: users[actor]._id.toString(), name: users[actor].name } });
      expect(JSON.stringify(list.body) + JSON.stringify(detail.body)).not.toMatch(/password|\$2[aby]\$|createRequestKey|createRequestHash/);
    }
    expect(JSON.stringify(customer)).not.toMatch(/createRequestKey|createRequestHash/);
  });

  test("only name is required; optional empty fields and existing customer classifications work", async () => {
    const minimal = await createCustomer(); expect(minimal).toMatchObject({ name: "Acquired customer", status: "active", companyType: "dealer" });
    const full = await createCustomer({ name: "Doctor customer", address: "Clinic address", contact: "+91 (987) 650-1234", gst: "Existing free-form GST", email: "doctor@customer-catalog.test", status: "inactive", companyType: "doctor" });
    expect(full).toMatchObject({ contact: "+91 (987) 650-1234", gst: "Existing free-form GST", status: "inactive", companyType: "doctor" });
    const custom = await createCustomer({ name: "Existing custom type", companyType: "institution", address: "", contact: "", gst: "", email: "" });
    expect(custom.companyType).toBe("institution");
    const blank = await createCustomer({ name: "Optional category", companyType: "", address: "", contact: "", gst: "", email: "" });
    expect(blank.companyType).toBe("");
  });

  test.each([
    {}, { name: " " }, { name: null }, { name: 2 }, { name: [] },
    { name: "Customer", email: "invalid" }, { name: "Customer", email: false },
    { name: "Customer", contact: 123 }, { name: "Customer", gst: {} }, { name: "Customer", address: [] },
    { name: "Customer", status: "unknown" }, { name: "Customer", status: null }, { name: "Customer", companyType: [] },
  ])("rejects invalid creation data %j without persisting records", async body => {
    await call("post", "/api/customers").send(body).expect(400);
    expect(await Customer.countDocuments()).toBe(0); expect(await Counter.countDocuments()).toBe(0);
  });

  test.each(["", "contains spaces", "x".repeat(129)])("rejects invalid retry key %j", async key => {
    await call("post", "/api/customers").set("Idempotency-Key", key).send({ name: "Customer" }).expect(400);
    expect(await Customer.countDocuments()).toBe(0);
  });

  test("unauthenticated customer and catalog APIs return 401", async () => {
    for (const [method, path] of [["post", "/api/customers"], ["get", "/api/customers"], ["get", "/api/customers/CUST101"], ["get", "/api/products"]]) {
      await request(server)[method](path).send({ name: "Unauthenticated" }).expect(401);
    }
    expect(await Customer.countDocuments()).toBe(0);
  });

  test("Admin update/archive stay compatible; Employee mutations are denied without writes", async () => {
    const customer = await createCustomer({ name: "Employee acquired", email: "acquired@customer-catalog.test" });
    const path = `/api/customers/${customer.customerId}`;
    const before = plain(await Customer.findById(customer._id).lean());
    for (const employee of ["employeeA", "employeeB"]) {
      await call("put", path, employee).send({ name: "Unauthorized" }).expect(403);
      await call("delete", path, employee).expect(403);
    }
    expect(plain(await Customer.findById(customer._id).lean())).toEqual(before);
    await call("put", path, "admin").send({ name: "Admin corrected", email: "corrected@customer-catalog.test", status: "inactive", companyType: "legacy-custom-type", addedBy: users.admin._id }).expect(200);
    const updated = await call("get", path).expect(200);
    expect(updated.body).toMatchObject({ name: "Admin corrected", status: "inactive", companyType: "legacy-custom-type", addedBy: { _id: users.employeeA._id.toString() } });
    await call("delete", path, "admin").expect(200);
    await call("get", path).expect(404);
    expect((await call("get", "/api/customers").expect(200)).body).toEqual([]);
    const archived = await Customer.findById(customer._id); expect(archived.deleted).toBe(true); expect(archived.deletedAt).toBeInstanceOf(Date);
    await call("post", "/api/customers").send({ name: "Duplicate archived email", email: "corrected@customer-catalog.test" }).expect(400);
  });

  test("sequential and concurrent identical retries return one record and hide retry metadata", async () => {
    const body = { name: "Retry-safe acquisition", email: "retry@customer-catalog.test" };
    const responses = await Promise.all(Array.from({ length: 4 }, () => call("post", "/api/customers").set("Idempotency-Key", "same-request").send(body)));
    responses.forEach(response => expect(response.status).toBe(201));
    const ids = new Set(responses.map(response => response.body.customer._id)); expect(ids.size).toBe(1); expect(await Customer.countDocuments()).toBe(1);
    expect((await createCustomer(body, "employeeA", "same-request"))._id).toBe(responses[0].body.customer._id);
    expect(JSON.stringify(responses.map(response => response.body))).not.toMatch(/createRequestKey|createRequestHash/);
    await call("post", "/api/customers").set("Idempotency-Key", "same-request").send({ ...body, name: "Changed after request" }).expect(409);
    await call("delete", `/api/customers/${responses[0].body.customer.customerId}`, "admin").expect(200);
    await call("post", "/api/customers").set("Idempotency-Key", "same-request").send(body).expect(409);
    expect(await Customer.countDocuments()).toBe(1);
  });

  test("retry keys are scoped to actor; different no-email customers can legitimately share a key", async () => {
    const first = await createCustomer({ name: "Shared business name" }, "employeeA", "same-key");
    const second = await createCustomer({ name: "Shared business name" }, "employeeB", "same-key");
    expect(first._id).not.toBe(second._id); expect(await Customer.countDocuments()).toBe(2);
    await createCustomer({ name: "No key, distinct customer" }); await createCustomer({ name: "No key, distinct customer" });
    expect(await Customer.countDocuments()).toBe(4);
  });

  test("different-key concurrent exact-email creations obey existing duplicate email policy", async () => {
    const responses = await Promise.all(Array.from({ length: 4 }, (_, index) => call("post", "/api/customers", index % 2 ? "employeeB" : "employeeA").set("Idempotency-Key", `different-${index}`).send({ name: "Concurrent acquisition", email: "unique@customer-catalog.test" })));
    expect(responses.map(response => response.status).sort()).toEqual([201, 400, 400, 400]);
    expect(await Customer.countDocuments()).toBe(1);
  });

  test("failure after an actual customer write rolls back customer, retry metadata and counter", async () => {
    const create = customerRepository.createCustomer;
    jest.spyOn(customerRepository, "createCustomer").mockImplementationOnce(async (...args) => {
      await create(...args); throw new Error("Injected failure after customer write");
    });
    await call("post", "/api/customers").set("Idempotency-Key", "rollback-request").send({ name: "Must roll back" }).expect(500);
    expect(await Customer.countDocuments()).toBe(0); expect(await Counter.countDocuments()).toBe(0);
    const retry = await createCustomer({ name: "Must roll back" }, "employeeA", "rollback-request"); expect(retry).toBeDefined(); expect(await Customer.countDocuments()).toBe(1);
  });

  test("Admin product CRUD works; Employee catalog is shared and product mutations are denied", async () => {
    await call("post", "/api/products", "admin").send({ name: "Admin product", description: "Catalog description", price: 150 }).expect(201);
    const product = await Product.findOne({ name: "Admin product" }); expect(product.productId).toMatch(/^PRD\d+$/);
    for (const actor of ["employeeA", "employeeB"]) {
      const list = await call("get", "/api/products", actor).expect(200); expect(list.body[0]).toMatchObject({ name: "Admin product", description: "Catalog description", price: 150 });
      const before = plain(await Product.findById(product._id).lean());
      await call("post", "/api/products", actor).send({ name: "Forbidden", description: "Forbidden", price: 1 }).expect(403);
      await call("put", `/api/products/${product.productId}`, actor).send({ name: "Forbidden", price: 1 }).expect(403);
      await call("delete", `/api/products/${product.productId}`, actor).expect(403);
      expect(plain(await Product.findById(product._id).lean())).toEqual(before);
    }
    await call("put", `/api/products/${product.productId}`, "admin").send({ name: "Admin revised", description: "Revised description", price: 200 }).expect(200);
    expect((await call("get", "/api/products").expect(200)).body[0]).toMatchObject({ name: "Admin revised", price: 200 });
    await call("delete", `/api/products/${product.productId}`, "admin").expect(200);
    expect((await call("get", "/api/products").expect(200)).body).toEqual([]);
  });

  test("Employee acquires customer, quotes catalog products, submits and Admin approves the shared record", async () => {
    const customer = await createCustomer({ name: "New quotation customer", email: "quote@customer-catalog.test" }, "employeeA", "quote-customer");
    await call("post", "/api/products", "admin").send({ name: "Quoted catalog product", description: "Original product description", price: 125 }).expect(201);
    const product = await Product.findOne();
    const response = await call("post", "/api/quotations").send(quoteInput(customer, product)).expect(201);
    const quotation = response.body.quotation; const quotePath = `/api/quotations/${quotation._id}`;
    expect(quotation).toMatchObject({ status: "DRAFT", customerId: customer._id, employeeId: users.employeeA._id.toString(), grandTotal: 250 });
    expect(quotation.items[0]).toMatchObject({ productId: product._id.toString(), productName: product.name, unitPrice: 125, quantity: 2 });
    await call("post", `${quotePath}/submit`).send({}).expect(200);
    const adminView = await call("get", quotePath, "admin").expect(200);
    expect(adminView.body.quotation.customerId).toMatchObject({ _id: customer._id, name: customer.name });
    await call("post", `${quotePath}/approve`, "admin").send({}).expect(200);
    expect((await call("get", quotePath).expect(200)).body.quotation.status).toBe("APPROVED");
    await call("get", quotePath, "employeeB").expect(404);

    const amounts = plain(await Quotation.findById(quotation._id).lean());
    const items = plain(await QuotationItem.find({ quotationId: quotation._id }).lean());
    await call("put", `/api/products/${product.productId}`, "admin").send({ name: "Live renamed product", description: "Live changed description", price: 999 }).expect(200);
    await call("put", `/api/customers/${customer.customerId}`, "admin").send({ name: "Live customer corrected" }).expect(200);
    await call("delete", `/api/products/${product.productId}`, "admin").expect(200);
    expect(plain(await Quotation.findById(quotation._id).lean())).toEqual(amounts);
    expect(plain(await QuotationItem.find({ quotationId: quotation._id }).lean())).toEqual(items);
    const historical = await call("get", quotePath).expect(200);
    expect(historical.body.quotation.items[0]).toMatchObject({ productName: "Quoted catalog product", description: "Original product description", unitPrice: 125, quantity: 2, lineTotal: 250 });
    expect((await call("get", "/api/products").expect(200)).body).toEqual([]);
    await call("post", "/api/quotations").send(quoteInput(customer, product)).expect(404);
  });

  test.each(["inactive", "archived"])("%s customers remain unavailable to new quotation selection", async state => {
    const customer = await createCustomer({ name: "Restricted customer" });
    const product = await Product.create({ name: "Available product", description: "Existing catalog", price: 100 });
    if (state === "inactive") await call("put", `/api/customers/${customer.customerId}`, "admin").send({ status: "inactive" }).expect(200);
    else await call("delete", `/api/customers/${customer.customerId}`, "admin").expect(200);
    await call("post", "/api/quotations").send(quoteInput(customer, product)).expect(state === "inactive" ? 400 : 404);
    expect(await Quotation.countDocuments()).toBe(0); expect(await QuotationItem.countDocuments()).toBe(0);
  });
});
