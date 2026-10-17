const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Task = require("../../src/modules/task/task.model");
const Customer = require("../../src/modules/customer/customer.model");
const Product = require("../../src/modules/product/product.model");
const Quotation = require("../../src/modules/quotation/quotation.model");
const QuotationItem = require("../../src/modules/quotation/quotationItem.model");
const Order = require("../../src/modules/order/order.model");

jest.setTimeout(60000);

const password = "Authorization-test-password-123!";
const testSecret = "worknest-authorization-security-tests-only";
const originalSecret = process.env.JWT_SECRET;
let mongo;
let server;
let admin;
let employeeA;
let employeeB;
let tokens;
let customer;
let archivedCustomer;
let product;
let taskA;
let taskB;
let archivedTask;
let quotationA;
let quotationB;
let approvedQuotation;
let archivedQuotation;

const call = (method, path, role = "employeeA") =>
  request(server)[method](path).set("Authorization", tokens[role]);

const plain = (value) => JSON.parse(JSON.stringify(value));
const taskSnapshot = async (id) => plain(await Task.findById(id).lean());
const quotationSnapshot = async (id) => ({
  quotation: plain(await Quotation.findById(id).lean()),
  items: plain(await QuotationItem.find({ quotationId: id }).sort({ _id: 1 }).lean()),
});

const itemInput = () => ({
  productId: product._id.toString(),
  quantity: 2,
  unitPrice: 100,
  discountAmount: 0,
  gstRate: 0,
});

const createOrder = () => Order.create({
  orderId: "ORD-AUTHORIZATION",
  quotationId: approvedQuotation._id,
  addedBy: employeeA._id,
  customerSnapshot: { customerId: customer.customerId, name: customer.name },
  productsSnapshot: [{ productId: product.productId, name: product.name, price: 100, quantity: 2 }],
  totalSnapshot: 200,
  status: "pending",
});

describe("Resource authorization with the full application and real MongoDB", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = testSecret;
    // Use only an isolated, disposable database; do not load application .env files.
    // JWT verification, permissions, controllers, services and repositories are real.
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
      instanceOpts: [{ ip: "127.0.0.1" }],
    });
    await mongoose.connect(mongo.getUri("worknest_authorization_security"));
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    [admin, employeeA, employeeB] = await User.create([
      { name: "Authorization Admin", email: "admin@authorization.test", empId: "EMP-AUTH-ADMIN", role: "admin", password },
      { name: "Employee A", email: "a@authorization.test", empId: "EMP-AUTH-A", role: "employee", password },
      { name: "Employee B", email: "b@authorization.test", empId: "EMP-AUTH-B", role: "employee", password },
    ]);
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      listener.once("error", reject);
    });
    tokens = {};
    for (const [name, user] of Object.entries({ admin, employeeA, employeeB })) {
      const response = await request(server).post("/api/auth/login")
        .send({ email: user.email, password }).expect(200);
      tokens[name] = `Bearer ${response.body.token}`;
    }
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models)
      .filter((model) => model !== User).map((model) => model.deleteMany({})));
    [customer, archivedCustomer] = await Customer.create([
      { customerId: "CUST-AUTH-ACTIVE", name: "Shared customer", status: "active", addedBy: employeeB._id },
      { customerId: "CUST-AUTH-ARCHIVED", name: "Archived customer", status: "active", addedBy: admin._id, deleted: true },
    ]);
    product = await Product.create({
      productId: "PRD-AUTHORIZATION", name: "Shared product", description: "Authorization fixture", price: 100,
    });
    const taskData = { description: "Assignment boundary", assignedBy: admin._id, dueDate: new Date("2030-01-01") };
    [taskA, taskB, , archivedTask] = await Task.create([
      { ...taskData, taskId: "TSK-AUTH-A", title: "Employee A task", assignedTo: employeeA._id },
      { ...taskData, taskId: "TSK-AUTH-B", title: "Employee B task", assignedTo: employeeB._id },
      { ...taskData, taskId: "TSK-AUTH-ADMIN", title: "Admin task", assignedTo: admin._id },
      { ...taskData, taskId: "TSK-AUTH-ARCHIVED", title: "Archived task", assignedTo: employeeA._id, deleted: true },
    ]);
    const quotationData = {
      customerId: customer._id, subtotal: 200, taxableAmount: 200, grandTotal: 200,
      createdBy: admin._id, updatedBy: admin._id,
    };
    [quotationA, quotationB, approvedQuotation, archivedQuotation] = await Quotation.create([
      { ...quotationData, quotationId: "QT-AUTH-A", employeeId: employeeA._id },
      { ...quotationData, quotationId: "QT-AUTH-B", employeeId: employeeB._id },
      { ...quotationData, quotationId: "QT-AUTH-APPROVED", employeeId: employeeA._id, status: "APPROVED", approvedBy: admin._id },
      { ...quotationData, quotationId: "QT-AUTH-ARCHIVED", employeeId: employeeA._id, deleted: true },
    ]);
    await QuotationItem.create([quotationA, quotationB, approvedQuotation, archivedQuotation].map((quotation) => ({
      ...itemInput(), quotationId: quotation._id, productName: product.name,
      taxableAmount: 200, gstAmount: 0, lineTotal: 200,
    })));
  });

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  test.each(["/api/tasks", "/api/quotations", "/api/orders", "/api/dashboard/dashboard-metrics"])(
    "requires authentication for %s", async (path) => {
      await request(server).get(path).expect(401);
    },
  );

  test("Admin lists all company tasks while archived records remain hidden", async () => {
    const response = await call("get", "/api/tasks", "admin").expect(200);
    expect(response.body.map((task) => task.taskId).sort())
      .toEqual(["TSK-AUTH-A", "TSK-AUTH-ADMIN", "TSK-AUTH-B"]);
    expect(response.body.find((task) => task.taskId === taskA.taskId).assignedTo)
      .toMatchObject({ _id: employeeA._id.toString(), name: employeeA.name });
  });

  test("Employee task list derives assignment from the session despite client filters", async () => {
    const response = await call("get", "/api/tasks")
      .query({ employeeId: employeeB._id.toString(), assignedTo: employeeB._id.toString(), role: "admin" }).expect(200);
    expect(response.body.map((task) => task.taskId)).toEqual([taskA.taskId]);
    const otherEmployee = await call("get", "/api/tasks", "employeeB").expect(200);
    expect(otherEmployee.body.map((task) => task.taskId)).toEqual([taskB.taskId]);
  });

  test("Employee opens assigned task details using the existing business task identifier", async () => {
    const response = await call("get", `/api/tasks/${taskA.taskId}`).expect(200);
    expect(response.body.task).toMatchObject({ taskId: taskA.taskId, assignedTo: { _id: employeeA._id.toString() } });
    const adminResponse = await call("get", `/api/tasks/${taskB.taskId}`, "admin").expect(200);
    expect(adminResponse.body.task.taskId).toBe(taskB.taskId);
  });

  test.each(["other employee", "archived", "missing"])("conceals %s task details", async (scenario) => {
    const id = scenario === "other employee" ? taskB.taskId : scenario === "archived" ? archivedTask.taskId : "TSK-MISSING";
    await call("get", `/api/tasks/${id}`)
      .query({ employeeId: employeeB._id.toString(), assignedTo: employeeB._id.toString() }).expect(404);
  });

  test.each(["own", "another employee's"])("denies Employee administrative updates to %s task without mutation", async (scope) => {
    const task = scope === "own" ? taskA : taskB;
    const before = await taskSnapshot(task._id);
    await call("put", `/api/tasks/${task.taskId}`).send({
      title: "Unauthorized edit", assignedTo: employeeB._id, assignedBy: employeeA._id,
      description: "Changed", dueDate: "2035-01-01", priority: "high", status: "done",
    }).expect(403);
    expect(await taskSnapshot(task._id)).toEqual(before);
  });

  test("denies Employee task creation and deletion until the later task workflow integration", async () => {
    const before = await taskSnapshot(taskA._id);
    await call("post", "/api/tasks").send({ title: "Unauthorized", assignedTo: employeeA._id }).expect(403);
    await call("delete", `/api/tasks/${taskA.taskId}`).expect(403);
    expect(await Task.countDocuments()).toBe(4);
    expect(await taskSnapshot(taskA._id)).toEqual(before);
  });

  test("retains Admin task create, assignment, update and archive behavior with an authoritative assigner", async () => {
    await call("post", "/api/tasks", "admin").send({
      title: "New Admin task", description: "Admin regression", assignedTo: employeeA._id,
      assignedBy: employeeB._id, dueDate: "2030-02-01", priority: "high",
    }).expect(201);
    const created = await Task.findOne({ title: "New Admin task" });
    expect(created.assignedBy.toString()).toBe(admin._id.toString());
    await call("put", `/api/tasks/${created.taskId}`, "admin").send({
      title: "Reassigned by Admin", assignedTo: employeeB._id, status: "in-progress",
    }).expect(200);
    const updated = await Task.findById(created._id);
    expect(updated).toMatchObject({ title: "Reassigned by Admin", status: "in-progress" });
    expect(updated.assignedTo.toString()).toBe(employeeB._id.toString());
    await call("get", `/api/tasks/${created.taskId}`).expect(404);
    await call("get", `/api/tasks/${created.taskId}`, "employeeB").expect(200);
    await call("delete", `/api/tasks/${created.taskId}`, "admin").expect(200);
    expect((await Task.findById(created._id)).deleted).toBe(true);
    await call("get", `/api/tasks/${created.taskId}`, "admin").expect(404);
  });

  test("quotation lists and pagination totals stay owner-scoped despite spoofed query identities", async () => {
    const response = await call("get", "/api/quotations")
      .query({ employeeId: employeeB._id.toString(), page: 1, limit: 1 }).expect(200);
    expect(response.body).toMatchObject({ total: 2, page: 1, limit: 1, totalPages: 2 });
    expect(response.body.quotations).toHaveLength(1);
    expect(response.body.quotations[0].employeeId._id).toBe(employeeA._id.toString());
    const filtered = await call("get", "/api/quotations")
      .query({ status: "DRAFT", search: "QT-AUTH" }).expect(200);
    expect(filtered.body.total).toBe(1);
    expect(filtered.body.quotations.map((quotation) => quotation._id)).toEqual([quotationA._id.toString()]);
    const adminResponse = await call("get", "/api/quotations", "admin").expect(200);
    expect(adminResponse.body.total).toBe(3);
  });

  test("Employee reads their own approved quotation and snapshot items; Admin reads another owner's quotation", async () => {
    const own = await call("get", `/api/quotations/${approvedQuotation._id}`).expect(200);
    expect(own.body.quotation).toMatchObject({ status: "APPROVED", employeeId: { _id: employeeA._id.toString() } });
    expect(own.body.quotation.items[0]).toMatchObject({ productName: product.name, quantity: 2, unitPrice: 100 });
    await call("get", `/api/quotations/${quotationB._id}`, "admin").expect(200);
  });

  test("denies another employee's quotation details regardless of supplied employee ID", async () => {
    await call("get", `/api/quotations/${quotationB._id}`)
      .query({ employeeId: employeeB._id.toString() }).expect(404);
  });

  test.each(["archived", "missing"])("returns 404 for %s quotation details", async (scenario) => {
    const id = scenario === "archived" ? archivedQuotation._id : new mongoose.Types.ObjectId();
    await call("get", `/api/quotations/${id}`).expect(404);
  });

  test.each(["update", "submit", "reopen"])("denies %s of another owner's quotation without mutation", async (action) => {
    const before = await quotationSnapshot(quotationB._id);
    const suffix = action === "update" ? "" : `/${action}`;
    await call(action === "update" ? "put" : "post", `/api/quotations/${quotationB._id}${suffix}`)
      .send({ employeeId: employeeA._id, notes: "Unauthorized", items: [{ ...itemInput(), unitPrice: 1 }] }).expect(404);
    expect(await quotationSnapshot(quotationB._id)).toEqual(before);
  });

  test.each(["employeeB", "admin"])("denies changing quotation ownership to %s before any fields/items are saved", async (target) => {
    const owner = target === "admin" ? admin : employeeB;
    const before = await quotationSnapshot(quotationA._id);
    await call("put", `/api/quotations/${quotationA._id}`).send({
      employeeId: owner._id, notes: "Must not persist", items: [{ ...itemInput(), unitPrice: 1 }],
    }).expect(403);
    expect(await quotationSnapshot(quotationA._id)).toEqual(before);
  });

  test("ignores forged audit identities while allowing an unchanged owner in the existing edit payload", async () => {
    await call("put", `/api/quotations/${quotationA._id}`).send({
      employeeId: employeeA._id, createdBy: employeeB._id, updatedBy: employeeB._id, notes: "Permitted notes",
    }).expect(200);
    const stored = await Quotation.findById(quotationA._id);
    expect(stored.employeeId.toString()).toBe(employeeA._id.toString());
    expect(stored.createdBy.toString()).toBe(admin._id.toString());
    expect(stored.updatedBy.toString()).toBe(employeeA._id.toString());
    expect(stored.notes).toBe("Permitted notes");
  });

  test.each(["DRAFT", "REJECTED"])("allows an Employee to edit their own %s quotation", async (status) => {
    await Quotation.updateOne({ _id: quotationA._id }, { $set: { status } });
    const response = await call("put", `/api/quotations/${quotationA._id}`)
      .send({ notes: "Authorized revision", items: [{ ...itemInput(), quantity: 3 }] }).expect(200);
    expect(response.body.quotation).toMatchObject({ status, notes: "Authorized revision", grandTotal: 300 });
    expect(response.body.quotation.items[0].quantity).toBe(3);
  });

  test("derives a newly created Employee quotation owner and creator from the session", async () => {
    const response = await call("post", "/api/quotations").send({
      customerId: customer._id, employeeId: employeeB._id, createdBy: employeeB._id,
      updatedBy: employeeB._id, status: "APPROVED", items: [itemInput()],
    }).expect(201);
    const stored = await Quotation.findById(response.body.quotation._id);
    expect(stored.employeeId.toString()).toBe(employeeA._id.toString());
    expect(stored.createdBy.toString()).toBe(employeeA._id.toString());
    expect(stored.updatedBy.toString()).toBe(employeeA._id.toString());
    expect(stored.status).toBe("DRAFT");
    expect(response.body.quotation.items[0].productName).toBe(product.name);
  });

  test("preserves Admin quotation assignment and reassignment with an immutable creator", async () => {
    const created = await call("post", "/api/quotations", "admin").send({
      customerId: customer._id, employeeId: employeeB._id, items: [itemInput()],
    }).expect(201);
    expect(created.body.quotation.employeeId).toBe(employeeB._id.toString());
    await call("put", `/api/quotations/${created.body.quotation._id}`, "admin")
      .send({ employeeId: employeeA._id, notes: "Admin assignment", createdBy: employeeB._id }).expect(200);
    const stored = await Quotation.findById(created.body.quotation._id);
    expect(stored.employeeId.toString()).toBe(employeeA._id.toString());
    expect(stored.createdBy.toString()).toBe(admin._id.toString());
    await call("get", `/api/quotations/${stored._id}`, "employeeB").expect(404);
    await call("get", `/api/quotations/${stored._id}`).expect(200);
  });

  test.each([
    ["archived", 404], ["missing", 404], ["inactive", 400],
  ])("rejects changing quotation customer to an %s reference without mutation", async (scenario, status) => {
    let customerId = archivedCustomer._id;
    if (scenario === "missing") customerId = new mongoose.Types.ObjectId();
    if (scenario === "inactive") {
      const inactive = await Customer.create({
        customerId: "CUST-AUTH-INACTIVE", name: "Inactive customer", status: "inactive", addedBy: admin._id,
      });
      customerId = inactive._id;
    }
    const before = await quotationSnapshot(quotationA._id);
    await call("put", `/api/quotations/${quotationA._id}`).send({
      customerId, notes: "Must not persist", items: [{ ...itemInput(), quantity: 5 }],
    }).expect(status);
    expect(await quotationSnapshot(quotationA._id)).toEqual(before);
  });

  test.each([
    ["missing", 404], ["deleted", 404], ["inactive", 400],
  ])("rejects an Admin-selected %s quotation owner on create/update without mutation", async (scenario, status) => {
    let selectedOwner;
    try {
      if (scenario !== "missing") {
        selectedOwner = await User.create({
          name: "Unavailable owner", email: `unavailable-${scenario}@authorization.test`,
          empId: `EMP-AUTH-${scenario.toUpperCase()}`, password, role: "employee",
          status: scenario === "inactive" ? "inactive" : "active", deleted: scenario === "deleted",
        });
      }
      const employeeId = selectedOwner?._id || new mongoose.Types.ObjectId();
      const before = await quotationSnapshot(quotationA._id);
      await call("put", `/api/quotations/${quotationA._id}`, "admin").send({
        employeeId, notes: "Must not persist", items: [{ ...itemInput(), quantity: 5 }],
      }).expect(status);
      expect(await quotationSnapshot(quotationA._id)).toEqual(before);
      await call("post", "/api/quotations", "admin").send({
        customerId: customer._id, employeeId, items: [itemInput()],
      }).expect(status);
      expect(await Quotation.countDocuments()).toBe(4);
      expect(await QuotationItem.countDocuments()).toBe(4);
    } finally {
      if (selectedOwner) await User.deleteOne({ _id: selectedOwner._id });
    }
  });

  test("preserves Admin self-assignment on quotation creation and editing", async () => {
    const created = await call("post", "/api/quotations", "admin").send({
      customerId: customer._id, employeeId: admin._id, items: [itemInput()],
    }).expect(201);
    expect(created.body.quotation.employeeId).toBe(admin._id.toString());
    await call("put", `/api/quotations/${quotationA._id}`, "admin")
      .send({ employeeId: admin._id, notes: "Admin self-assignment" }).expect(200);
    const updated = await Quotation.findById(quotationA._id);
    expect(updated.employeeId.toString()).toBe(admin._id.toString());
    expect(updated.createdBy.toString()).toBe(admin._id.toString());
  });

  test("permits Admin notes edits with unchanged historical customer/owner references", async () => {
    await User.updateOne({ _id: employeeB._id }, { $set: { status: "inactive" } });
    await Customer.updateOne({ _id: customer._id }, { $set: { deleted: true } });
    const before = await quotationSnapshot(quotationB._id);
    try {
      await call("put", `/api/quotations/${quotationB._id}`, "admin").send({
        customerId: customer._id, employeeId: employeeB._id, notes: "Historical notes edit",
      }).expect(200);
      const after = await quotationSnapshot(quotationB._id);
      expect(after.items).toEqual(before.items);
      for (const field of [
        "createdBy", "employeeId", "customerId", "quotationId", "status", "subtotal",
        "discountAmount", "discountPercentage", "taxableAmount", "gstRate", "gstAmount", "grandTotal",
      ]) expect(after.quotation[field]).toEqual(before.quotation[field]);
      expect(after.quotation.notes).toBe("Historical notes edit");
      expect(after.quotation.updatedBy).toBe(admin._id.toString());
    } finally {
      await User.updateOne({ _id: employeeB._id }, { $set: { status: "active" } });
    }
  });

  test.each(["approve", "reject"])("denies Employee quotation %s without mutating submitted records", async (action) => {
    await Quotation.updateOne({ _id: quotationA._id }, { $set: { status: "SUBMITTED" } });
    const before = await quotationSnapshot(quotationA._id);
    await call("post", `/api/quotations/${quotationA._id}/${action}`)
      .send({ reason: "Unauthorized decision" }).expect(403);
    expect(await quotationSnapshot(quotationA._id)).toEqual(before);
  });

  test.each(["SUBMITTED", "APPROVED", "CONVERTED"])("rejects Employee edits to locked %s quotations", async (status) => {
    await Quotation.updateOne({ _id: quotationA._id }, { $set: { status } });
    const before = await quotationSnapshot(quotationA._id);
    await call("put", `/api/quotations/${quotationA._id}`)
      .send({ notes: "Locked edit", items: [{ ...itemInput(), unitPrice: 1 }] }).expect(400);
    expect(await quotationSnapshot(quotationA._id)).toEqual(before);
  });

  test("ignores a direct status field instead of bypassing the quotation workflow", async () => {
    await call("put", `/api/quotations/${quotationA._id}`)
      .send({ status: "APPROVED", approvedBy: employeeA._id, notes: "Ordinary edit" }).expect(200);
    const stored = await Quotation.findById(quotationA._id);
    expect(stored.status).toBe("DRAFT");
    expect(stored.approvedBy).toBeNull();
  });

  test("retains Employee submission/revision and Admin rejection/approval with repeated actions rejected", async () => {
    const path = `/api/quotations/${quotationA._id}`;
    await call("post", `${path}/submit`).expect(200);
    await call("post", `${path}/submit`).expect(400);
    await call("post", `${path}/reject`, "admin").send({ reason: "Revise scope" }).expect(200);
    let stored = await Quotation.findById(quotationA._id);
    expect(stored.status).toBe("REJECTED");
    expect(stored.rejectedBy.toString()).toBe(admin._id.toString());
    await call("put", path).send({ notes: "Revised scope" }).expect(200);
    await call("post", `${path}/reopen`).expect(200);
    await call("post", `${path}/submit`).expect(200);
    await call("post", `${path}/approve`, "admin").expect(200);
    await call("post", `${path}/approve`, "admin").expect(400);
    stored = await Quotation.findById(quotationA._id);
    expect(stored.status).toBe("APPROVED");
    expect(stored.approvedBy.toString()).toBe(admin._id.toString());
  });

  test("denies Employee quotation archival without altering the record", async () => {
    const before = await quotationSnapshot(quotationA._id);
    await call("delete", `/api/quotations/${quotationA._id}`).expect(403);
    expect(await quotationSnapshot(quotationA._id)).toEqual(before);
  });

  test("allows shared Customer/Product reads while hiding archived customers", async () => {
    const customers = await call("get", "/api/customers").expect(200);
    expect(customers.body.map((entry) => entry.customerId)).toEqual([customer.customerId]);
    const products = await call("get", "/api/products").expect(200);
    expect(products.body.map((entry) => entry.productId)).toEqual([product.productId]);
    await call("post", "/api/quotations").send({ customerId: archivedCustomer._id, items: [itemInput()] }).expect(404);
    expect(await Quotation.countDocuments()).toBe(4);
  });

  test.each([
    ["post", "/api/products"], ["put", "/api/products/PRD-AUTHORIZATION"],
    ["delete", "/api/products/PRD-AUTHORIZATION"],
    ["put", "/api/customers/CUST-AUTH-ACTIVE"], ["delete", "/api/customers/CUST-AUTH-ACTIVE"],
  ])("denies Employee catalog mutation %s %s without changes", async (method, path) => {
    const before = { customer: plain(await Customer.findById(customer._id).lean()), product: plain(await Product.findById(product._id).lean()) };
    await call(method, path).send({ name: "Unauthorized catalog edit", price: 1 }).expect(403);
    expect(plain(await Customer.findById(customer._id).lean())).toEqual(before.customer);
    expect(plain(await Product.findById(product._id).lean())).toEqual(before.product);
    expect(await Product.countDocuments()).toBe(1);
  });

  test("preserves existing Admin Customer update/archive and Product CRUD APIs", async () => {
    await call("put", `/api/customers/${customer.customerId}`, "admin").send({ name: "Admin edited customer" }).expect(200);
    expect((await Customer.findById(customer._id)).name).toBe("Admin edited customer");
    await call("delete", `/api/customers/${customer.customerId}`, "admin").expect(200);
    expect((await Customer.findById(customer._id)).deleted).toBe(true);
    await call("post", "/api/products", "admin").send({ name: "Admin product", description: "No image upload", price: 12 }).expect(201);
    const created = await Product.findOne({ name: "Admin product" });
    await call("put", `/api/products/${created.productId}`, "admin").send({ price: 13 }).expect(200);
    expect((await Product.findById(created._id)).price).toBe(13);
    await call("delete", `/api/products/${created.productId}`, "admin").expect(200);
    expect(await Product.findById(created._id)).toBeNull();
  });

  test.each([
    ["get", "/api/orders"], ["get", "/api/orders/ORD-AUTHORIZATION/download-pdf"],
    ["get", "/api/orders/ORD-AUTHORIZATION/download-csv"],
    ["put", "/api/orders/ORD-AUTHORIZATION"], ["delete", "/api/orders/ORD-AUTHORIZATION"],
  ])("denies deferred Employee Order access: %s %s", async (method, path) => {
    const order = await createOrder();
    const before = plain(await Order.findById(order._id).lean());
    await call(method, path).send({ status: "dispatched", addedBy: employeeA._id }).expect(403);
    expect(plain(await Order.findById(order._id).lean())).toEqual(before);
  });

  test("retains Admin Order permissions and existing empty-list/status/archive responses", async () => {
    const list = await call("get", "/api/orders", "admin").expect(200);
    expect(list.body).toEqual([]);
    const order = await createOrder();
    await call("put", `/api/orders/${order.orderId}`, "admin").send({ status: "confirm" }).expect(200);
    await call("put", `/api/orders/${order.orderId}`, "admin").send({ status: "dispatched" }).expect(200);
    expect((await Order.findById(order._id)).status).toBe("dispatched");
    await call("delete", `/api/orders/${order.orderId}`, "admin").expect(200);
    expect((await Order.findById(order._id)).deleted).toBe(true);
    for (const format of ["pdf", "csv"]) {
      await call("get", `/api/orders/ORD-MISSING/download-${format}`, "admin").expect(404);
    }
  });

  test("denies Employee global metrics while preserving Admin access to the existing handler", async () => {
    await call("get", "/api/dashboard/dashboard-metrics").expect(403);
    // The known Dashboard aggregation defect is outside this authorization issue.
    const adminResponse = await call("get", "/api/dashboard/dashboard-metrics", "admin").expect(500);
    expect(adminResponse.body.message).toMatch(/QuotationRepository\.countDocuments/);
  });

  test("does not trust an Admin role claim in an Employee JWT for deferred resources", async () => {
    const token = jwt.sign({ id: employeeA._id.toString(), role: "admin" }, testSecret, { expiresIn: "1h" });
    for (const path of ["/api/orders", "/api/dashboard/dashboard-metrics"]) {
      await request(server).get(path).set("Authorization", `Bearer ${token}`).expect(403);
    }
  });
});
