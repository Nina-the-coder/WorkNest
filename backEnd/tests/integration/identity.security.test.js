const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const app = require("../../src/app");
const { format } = require("util");
const User = require("../../src/models/user.model");
const Task = require("../../src/modules/task/task.model");
const Customer = require("../../src/modules/customer/customer.model");
const Product = require("../../src/modules/product/product.model");
const Quotation = require("../../src/modules/quotation/quotation.model");
const QuotationItem = require("../../src/modules/quotation/quotationItem.model");
const Order = require("../../src/modules/order/order.model");
const { getPermissionsForRole } = require("../../src/utils/rolePermissions");

jest.setTimeout(60000);

const password = "Identity-test-password-123!";
const testSecret = "worknest-identity-security-tests-only";
const originalSecret = process.env.JWT_SECRET;
let mongo;
let server;
let admin;
let employee;

const authorization = (user, claims = {}, options = { expiresIn: "1h" }) =>
  `Bearer ${jwt.sign({ id: user._id.toString(), role: user.role, ...claims }, testSecret, options)}`;

const login = (user, candidatePassword = password) =>
  request(server).post("/api/auth/login").send({
    email: user.email,
    password: candidatePassword,
  });

const expectNoSecrets = (value, forbiddenValues = [password]) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toMatch(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/);
  for (const secret of forbiddenValues) expect(serialized).not.toContain(secret);

  const inspect = (entry) => {
    if (!entry || typeof entry !== "object") return;
    expect(entry).not.toHaveProperty("password");
    expect(entry).not.toHaveProperty("passwordHash");
    for (const nested of Object.values(entry)) inspect(nested);
  };
  inspect(value);
};

const createCustomer = () => Customer.create({
  customerId: "CUST-IDENTITY",
  name: "Identity test customer",
  status: "active",
  addedBy: admin._id,
});

const createTask = () => Task.create({
  taskId: "TSK-IDENTITY",
  title: "Inspect safe task references",
  description: "Verify both populated users preserve public fields",
  assignedTo: employee._id,
  assignedBy: admin._id,
  dueDate: new Date("2030-01-01"),
});

describe("Authentication and identity security with real MongoDB", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = testSecret;
    // A dedicated ephemeral server is the only database used by this suite.
    // No application .env, deployed database URI, or mocked security layer is used.
    mongo = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
      instanceOpts: [{ ip: "127.0.0.1" }],
    });
    await mongoose.connect(mongo.getUri("worknest_identity_security"));
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      listener.once("error", reject);
    });
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
    [admin, employee] = await User.create([
      {
        name: "Active administrator",
        email: "admin@identity.test",
        empId: "EMP-ADMIN",
        password,
        role: "admin",
      },
      {
        name: "Active employee",
        email: "employee@identity.test",
        empId: "EMP-EMPLOYEE",
        password,
        role: "employee",
      },
    ]);
  });

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  test.each(["admin", "employee"])("authenticates an active %s with the existing response and JWT contracts", async (role) => {
    const user = role === "admin" ? admin : employee;
    const response = await login(user).expect(200);

    expect(response.body).toEqual({
      message: expect.any(String),
      token: expect.any(String),
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role,
        permissions: getPermissionsForRole(role),
      },
    });
    const decoded = jwt.verify(response.body.token, testSecret);
    expect(decoded).toMatchObject({ id: user._id.toString(), role });
    expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60);
    expectNoSecrets(response.body);
    await request(server).get("/api/customers")
      .set("Authorization", `Bearer ${response.body.token}`).expect(200);
  });

  test.each(["wrong password", "unknown email"])("rejects %s without exposing credentials", async (scenario) => {
    const response = await request(server).post("/api/auth/login").send({
      email: scenario === "unknown email" ? "missing@identity.test" : employee.email,
      password: scenario === "wrong password" ? "Incorrect-secret-123!" : password,
    }).expect(400);
    expect(response.body).toEqual({ message: "Invalid email or password." });
    expectNoSecrets(response.body, [password, "Incorrect-secret-123!"]);
  });

  test.each([
    { email: "employee@identity.test" },
    { password },
    { email: "employee@identity.test", password: { secret: "object-password-secret" } },
  ])("rejects malformed login credentials %# without echoing secrets", async (body) => {
    const response = await request(server).post("/api/auth/login").send(body).expect(400);
    expect(response.body).not.toHaveProperty("token");
    expectNoSecrets(response.body, [password, "object-password-secret"]);
  });

  test.each([
    ["employee", "inactive", { status: "inactive" }],
    ["employee", "archived", { deleted: true, deletedAt: new Date("2026-01-01") }],
    ["admin", "inactive", { status: "inactive" }],
    ["admin", "archived", { deleted: true, deletedAt: new Date("2026-01-01") }],
  ])("rejects login for an %s with an %s account", async (role, _name, changes) => {
    const subject = role === "admin" ? admin : employee;
    await User.updateOne({ _id: subject._id }, { $set: changes });
    const response = await login(subject).expect(401);
    expect(response.body).not.toHaveProperty("token");
    expectNoSecrets(response.body);
  });

  test.each([
    ["employee", "deactivate"], ["employee", "archive"],
    ["admin", "deactivate"], ["admin", "archive"],
  ])("rejects an existing %s token immediately after an Admin %s operation", async (role, operation) => {
    const subject = role === "admin" ? admin : employee;
    const manager = role === "admin" ? await User.create({
      name: "Security administrator", email: "security-admin@identity.test",
      empId: "EMP-SECURITY", password, role: "admin",
    }) : admin;
    const authenticated = await login(subject).expect(200);
    const token = `Bearer ${authenticated.body.token}`;
    await request(server).get("/api/customers").set("Authorization", token).expect(200);

    if (operation === "deactivate") {
      await request(server).put(`/api/employees/${subject.empId}`)
        .set("Authorization", authorization(manager))
        .send({ status: "inactive" }).expect(200);
    } else {
      await request(server).delete(`/api/employees/${subject.empId}`)
        .set("Authorization", authorization(manager)).expect(200);
    }

    const response = await request(server).get("/api/customers")
      .set("Authorization", token).expect(401);
    expectNoSecrets(response.body);
    await request(server).get("/api/employees")
      .set("Authorization", authorization(manager)).expect(200);
  });

  test("rejects an issued token after the User is removed", async () => {
    const authenticated = await login(employee).expect(200);
    await User.deleteOne({ _id: employee._id });
    await request(server).get("/api/customers")
      .set("Authorization", `Bearer ${authenticated.body.token}`).expect(401);
  });

  test.each(["missing", "invalid", "expired", "malformed bearer"])("rejects %s authorization on protected business APIs", async (scenario) => {
    let call = request(server).get("/api/tasks");
    if (scenario === "invalid") call = call.set("Authorization", "Bearer invalid-token");
    if (scenario === "expired") {
      call = call.set("Authorization", authorization(employee, {}, { expiresIn: -1 }));
    }
    if (scenario === "malformed bearer") call = call.set("Authorization", "Bearer");
    const response = await call.expect(401);
    expectNoSecrets(response.body);
  });

  test("loads current database permissions rather than trusting an Admin claim in an Employee token", async () => {
    const forgedRole = authorization(employee, { role: "admin" });
    await request(server).get("/api/customers").set("Authorization", forgedRole).expect(200);
    await request(server).get("/api/employees").set("Authorization", forgedRole).expect(403);
    await request(server).get("/api/employees")
      .set("Authorization", authorization(admin)).expect(200);
  });

  test.each(["unauthenticated", "employee"])("keeps registration Admin-only for an %s caller", async (role) => {
    let call = request(server).post("/api/auth/register");
    if (role === "employee") call = call.set("Authorization", authorization(employee));
    await call.send({ name: "Blocked", email: "blocked@identity.test", password })
      .expect(role === "employee" ? 403 : 401);
    expect(await User.countDocuments({ email: "blocked@identity.test" })).toBe(0);
  });

  test("registers an Employee through the Admin API and hashes the password exactly once", async () => {
    const body = {
      name: "Registered employee",
      email: "registered@identity.test",
      role: "employee",
      password,
    };
    const registered = await request(server).post("/api/auth/register")
      .set("Authorization", authorization(admin)).send(body).expect(201);
    expectNoSecrets(registered.body);
    const stored = await User.findOne({ email: body.email }).select("+password");
    expect(stored.password).not.toBe(password);
    expect(await bcrypt.compare(password, stored.password)).toBe(true);
    await login(body).expect(200);
  });

  test("rejects the obsolete user role before attempting registration", async () => {
    await request(server).post("/api/auth/register")
      .set("Authorization", authorization(admin))
      .send({ name: "Invalid role", email: "invalid-role@identity.test", role: "user", password })
      .expect(400);
    expect(await User.countDocuments({ email: "invalid-role@identity.test" })).toBe(0);
  });

  test.each(["tiny", { secret: "registration-object-secret" }])("does not echo an invalid registration password %#", async (invalidPassword) => {
    const response = await request(server).post("/api/auth/register")
      .set("Authorization", authorization(admin))
      .send({ name: "Invalid password", email: "invalid-password@identity.test", password: invalidPassword })
      .expect(400);
    expectNoSecrets(response.body, ["tiny", "registration-object-secret"]);
    expect(await User.countDocuments({ email: "invalid-password@identity.test" })).toBe(0);
  });

  test("excludes password hashes from Employee creation, directory and detail responses", async () => {
    const created = await request(server).post("/api/employees")
      .set("Authorization", authorization(admin))
      .send({ name: "Created employee", email: "created@identity.test", role: "employee", status: "active", password })
      .expect(201);
    expect(created.body).toMatchObject({
      _id: expect.any(String), empId: expect.any(String), name: "Created employee", role: "employee",
    });
    expectNoSecrets(created.body);

    const listed = await request(server).get("/api/employees")
      .set("Authorization", authorization(admin)).expect(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body).toHaveLength(3);
    expectNoSecrets(listed.body);

    const detail = await request(server).get(`/api/employees/${created.body.empId}`)
      .set("Authorization", authorization(admin)).expect(200);
    expect(detail.body).toMatchObject({ _id: created.body._id, empId: created.body.empId });
    expectNoSecrets(detail.body);
  });

  test("preserves Task User references without leaking either populated password hash", async () => {
    await createTask();
    const response = await request(server).get("/api/tasks")
      .set("Authorization", authorization(admin)).expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      assignedTo: { _id: employee._id.toString(), name: employee.name, empId: employee.empId },
      assignedBy: { _id: admin._id.toString(), name: admin.name, empId: admin.empId },
    });
    expectNoSecrets(response.body);
  });

  test("preserves Customer addedBy data without exposing its populated password hash", async () => {
    await createCustomer();
    const response = await request(server).get("/api/customers")
      .set("Authorization", authorization(employee)).expect(200);
    expect(response.body[0]).toMatchObject({
      customerId: "CUST-IDENTITY",
      addedBy: { _id: admin._id.toString(), name: admin.name },
    });
    expectNoSecrets(response.body);
  });

  test("keeps Quotation owner and decision-maker projections safe in list and detail responses", async () => {
    const customer = await createCustomer();
    const product = await Product.create({ name: "Safe product", description: "Existing product", price: 100 });
    const quotation = await Quotation.create({
      quotationId: "QT-IDENTITY", customerId: customer._id, employeeId: employee._id,
      status: "APPROVED", approvedBy: admin._id, rejectedBy: employee._id,
      createdBy: admin._id, updatedBy: admin._id, subtotal: 100, grandTotal: 100,
    });
    await QuotationItem.create({
      quotationId: quotation._id, productId: product._id, productName: product.name,
      quantity: 1, unitPrice: 100, gstRate: 0, lineTotal: 100,
    });

    const list = await request(server).get("/api/quotations")
      .set("Authorization", authorization(employee)).expect(200);
    expect(list.body.quotations).toHaveLength(1);
    const detail = await request(server).get(`/api/quotations/${quotation._id}`)
      .set("Authorization", authorization(employee)).expect(200);
    for (const body of [list.body.quotations[0], detail.body.quotation]) {
      expect(body).toMatchObject({
        employeeId: { _id: employee._id.toString(), name: employee.name },
        approvedBy: { _id: admin._id.toString(), name: admin.name },
        rejectedBy: { _id: employee._id.toString(), name: employee.name },
      });
      expectNoSecrets(body);
    }
    expect(detail.body.quotation.items).toHaveLength(1);
  });

  test("excludes passwords from default User queries, lean queries and lean populated references", async () => {
    expect((await User.findById(employee._id)).password).toBeUndefined();
    const users = await User.find({}).lean();
    expect(users).toHaveLength(2);
    expectNoSecrets(users);
    await createTask();
    const task = await Task.findOne({}).populate("assignedTo assignedBy").lean();
    expect(task.assignedTo.name).toBe(employee.name);
    expect(task.assignedBy.name).toBe(admin.name);
    expectNoSecrets(task);
  });

  test("strips an explicitly selected password from User JSON and object serialization", async () => {
    const selected = await User.findById(employee._id).select("+password");
    expect(await bcrypt.compare(password, selected.password)).toBe(true);
    expectNoSecrets(selected.toJSON());
    expectNoSecrets(selected.toObject());
    expectNoSecrets(JSON.parse(JSON.stringify(selected)));
  });

  test("strips explicitly selected passwords when a parent document serializes populated Users", async () => {
    await createTask();
    const task = await Task.findOne({})
      .populate({ path: "assignedTo", select: "+password" })
      .populate({ path: "assignedBy", select: "+password" });
    expect(await bcrypt.compare(password, task.assignedTo.password)).toBe(true);
    expectNoSecrets(task.toObject());
    expectNoSecrets(task.toJSON());
    expectNoSecrets(JSON.parse(JSON.stringify(task)));
  });

  test("applies the same User protection to Order addedBy population", async () => {
    const order = await Order.create({
      orderId: "ORD-IDENTITY", addedBy: admin._id,
      quotationId: new mongoose.Types.ObjectId(),
      customerSnapshot: { name: "Snapshot" }, productsSnapshot: [], totalSnapshot: 0, status: "pending",
    });
    const populated = await Order.findById(order._id).populate("addedBy");
    expect(populated.addedBy.name).toBe(admin.name);
    expect(populated.addedBy.password).toBeUndefined();
    expectNoSecrets(populated.toObject());
  });

  test("preserves the stored password hash on a metadata-only Employee update", async () => {
    const before = await User.findById(employee._id).select("+password");
    const response = await request(server).put(`/api/employees/${employee.empId}`)
      .set("Authorization", authorization(admin)).send({ name: "Renamed employee" }).expect(200);
    expectNoSecrets(response.body);
    const after = await User.findById(employee._id).select("+password");
    expect(after.password).toBe(before.password);
    expect(after.name).toBe("Renamed employee");
    await login(employee).expect(200);
  });

  test("hashes an Employee password update once and accepts only the new password", async () => {
    const before = await User.findById(employee._id).select("+password");
    const replacement = "Changed-identity-password-456!";
    const response = await request(server).put(`/api/employees/${employee.empId}`)
      .set("Authorization", authorization(admin)).send({ password: replacement }).expect(200);
    expectNoSecrets(response.body, [password, replacement]);
    const after = await User.findById(employee._id).select("+password");
    expect(after.password).not.toBe(before.password);
    expect(after.password).not.toBe(replacement);
    expect(await bcrypt.compare(replacement, after.password)).toBe(true);
    await login(employee).expect(400);
    await login(employee, replacement).expect(200);
  });

  test("restores an archived Employee with one newly hashed password and a safe response", async () => {
    await request(server).delete(`/api/employees/${employee.empId}`)
      .set("Authorization", authorization(admin)).expect(200);
    const replacement = "Restored-identity-password-789!";
    const response = await request(server).post("/api/employees")
      .set("Authorization", authorization(admin)).send({
        name: employee.name, email: employee.email, role: "employee", status: "active", password: replacement,
      }).expect(201);
    expect(response.body).toMatchObject({
      _id: employee._id.toString(), empId: employee.empId, deleted: false, status: "active",
    });
    expectNoSecrets(response.body, [password, replacement]);
    const restored = await User.findById(employee._id).select("+password");
    expect(await bcrypt.compare(replacement, restored.password)).toBe(true);
    await login(employee).expect(400);
    await login(employee, replacement).expect(200);
  });

  test("does not log passwords or hashes during registration, login, password updates or validation failures", async () => {
    const registrationPassword = "Logged-registration-secret-123!";
    const replacement = "Logged-password-update-secret-456!";
    const invalidSecret = "logged-object-password-secret";
    const spies = ["log", "warn", "error"].map((method) =>
      jest.spyOn(console, method).mockImplementation(() => {}));

    try {
      await request(server).post("/api/auth/register")
        .set("Authorization", authorization(admin)).send({
          name: "Logging regression", email: "logging@identity.test",
          role: "employee", password: registrationPassword,
        }).expect(201);
      await login({ email: "logging@identity.test" }, registrationPassword).expect(200);
      await request(server).put(`/api/employees/${employee.empId}`)
        .set("Authorization", authorization(admin)).send({ password: replacement }).expect(200);
      await login(employee, replacement).expect(200);
      await request(server).put(`/api/employees/${employee.empId}`)
        .set("Authorization", authorization(admin))
        .send({ password: { secret: invalidSecret } }).expect(500);

      const stored = await User.find({}).select("+password");
      const logs = spies.flatMap((spy) => spy.mock.calls.map((args) => format(...args))).join("\n");
      expectNoSecrets({ logs }, [
        password, registrationPassword, replacement, invalidSecret,
        ...stored.map((user) => user.password),
      ]);
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });

  test.each([
    ["create", "tiny"],
    ["create", { secret: "employee-object-secret" }],
    ["update", "tiny"],
    ["update", { secret: "employee-object-secret" }],
  ])("rejects an invalid Employee password during %s (%#) without echoing secrets", async (operation, invalidPassword) => {
    const before = await User.findById(employee._id).select("+password");
    const call = operation === "create"
      ? request(server).post("/api/employees").send({
        name: "Invalid password", email: "bad-employee@identity.test", password: invalidPassword,
      })
      : request(server).put(`/api/employees/${employee.empId}`).send({ password: invalidPassword });
    // Preserve the existing global Mongoose-validation status/envelope in this issue.
    const response = await call.set("Authorization", authorization(admin)).expect(500);
    expectNoSecrets(response.body, ["tiny", "employee-object-secret"]);
    expect(await User.countDocuments({ email: "bad-employee@identity.test" })).toBe(0);
    const after = await User.findById(employee._id).select("+password");
    expect(after.password).toBe(before.password);
  });
});
