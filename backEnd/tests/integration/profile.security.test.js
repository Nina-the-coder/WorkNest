const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const { getPermissionsForRole } = require("../../src/utils/rolePermissions");

jest.setTimeout(60000);

const password = "Profile-test-password-123!";
const testSecret = "worknest-self-profile-tests-only";
const originalSecret = process.env.JWT_SECRET;
let mongo;
let server;
let admin;
let employee;
let tokens;

const login = (user) => request(server).post("/api/auth/login").send({
  email: user.email,
  password,
});

const profile = (role) => request(server).get("/api/auth/me")
  .set("Authorization", `Bearer ${tokens[role]}`);

const expectSafeProfile = (response, user) => {
  expect(response.body).toEqual({
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
      status: "active",
      createdAt: user.createdAt.toISOString(),
      ...(user.empId ? { empId: user.empId } : {}),
      ...(user.phone ? { phone: user.phone } : {}),
    },
  });
  const serialized = JSON.stringify(response.body);
  expect(serialized).not.toContain(password);
  expect(serialized).not.toMatch(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/);
  for (const field of [
    "password", "passwordHash", "token", "refreshToken", "deleted", "deletedAt",
    "createdBy", "updatedBy", "updatedAt", "__v",
  ]) expect(response.body.user).not.toHaveProperty(field);
};

describe("Read-self profile with real MongoDB and authentication", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = testSecret;
    // Only this disposable database is used; never read an application .env.
    mongo = await MongoMemoryServer.create({
      instance: { ip: "127.0.0.1", dbName: "worknest_profile_security" },
    });
    await mongoose.connect(mongo.getUri());
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      listener.once("error", reject);
    });
  });

  beforeEach(async () => {
    await User.deleteMany({});
    [admin, employee] = await User.create([
      {
        name: "Profile administrator", email: "admin@profile.test", role: "admin",
        empId: "EMP-PROFILE-ADMIN", phone: "9876543210", password,
      },
      {
        name: "Profile employee", email: "employee@profile.test", role: "employee",
        empId: "EMP-PROFILE-EMPLOYEE", phone: "9123456780", password,
      },
    ]);
    await User.updateOne({ _id: employee._id }, {
      $set: { createdBy: admin._id, updatedBy: admin._id },
    });
    const sessions = await Promise.all([login(admin).expect(200), login(employee).expect(200)]);
    tokens = { admin: sessions[0].body.token, employee: sessions[1].body.token };
  });

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  test.each(["admin", "employee"])("returns the approved safe self fields for %s", async (role) => {
    const user = role === "admin" ? admin : employee;
    const response = await profile(role).expect(200);
    expectSafeProfile(response, user);
    if (role === "employee") {
      await request(server).get("/api/employees")
        .set("Authorization", `Bearer ${tokens.employee}`).expect(403);
    }
  });

  test("omits unavailable optional fields without inventing Employee record data", async () => {
    await User.updateOne({ _id: employee._id }, { $unset: { phone: 1, empId: 1 } });
    const response = await profile("employee").expect(200);
    const expected = await User.findById(employee._id);
    expectSafeProfile(response, expected);
    expect(response.body.user).not.toHaveProperty("phone");
    expect(response.body.user).not.toHaveProperty("empId");
    expect(response.body.user).not.toHaveProperty("designation");
    expect(response.body.user).not.toHaveProperty("joiningDate");
  });

  test.each(["query", "body"])("ignores a client-supplied identity in the %s", async (location) => {
    let call = profile("employee");
    const spoof = {
      userId: admin._id.toString(), employeeId: admin._id.toString(),
      empId: admin.empId, _id: admin._id.toString(), role: "admin",
    };
    call = location === "query" ? call.query(spoof) : call.send(spoof);
    const response = await call.expect(200);
    expectSafeProfile(response, employee);
  });

  test("returns current identity fields instead of values cached at login", async () => {
    await User.updateOne({ _id: employee._id }, {
      $set: { name: "Updated self name", phone: "9000000000" },
    });
    const response = await profile("employee").expect(200);
    const current = await User.findById(employee._id);
    expectSafeProfile(response, current);
  });

  test("uses current database role and permissions after an Admin role change", async () => {
    await request(server).put(`/api/employees/${employee.empId}`)
      .set("Authorization", `Bearer ${tokens.admin}`).send({ role: "admin" }).expect(200);
    const response = await profile("employee").expect(200);
    const current = await User.findById(employee._id);
    expectSafeProfile(response, current);
    expect(response.body.user.permissions).toContain("EMPLOYEE_READ");
  });

  test("ignores a token's claimed Admin role and permissions", async () => {
    const token = jwt.sign({
      id: employee._id.toString(), role: "admin", permissions: ["EMPLOYEE_READ"],
    }, testSecret, { expiresIn: "1h" });
    const response = await request(server).get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`).expect(200);
    expectSafeProfile(response, employee);
    expect(response.body.user.permissions).not.toContain("EMPLOYEE_READ");
  });

  test.each(["missing", "invalid", "expired", "missing user"])("rejects %s authentication", async (scenario) => {
    let call = request(server).get("/api/auth/me");
    if (scenario === "invalid") call = call.set("Authorization", "Bearer invalid-token");
    if (scenario === "expired") {
      call = call.set("Authorization", `Bearer ${jwt.sign({ id: employee._id.toString() }, testSecret, { expiresIn: -1 })}`);
    }
    if (scenario === "missing user") {
      await User.deleteOne({ _id: employee._id });
      call = call.set("Authorization", `Bearer ${tokens.employee}`);
    }
    const response = await call.expect(401);
    expect(response.body).not.toHaveProperty("user");
  });

  test.each(["admin", "employee"])("rejects an issued %s token immediately after deactivation", async (role) => {
    const subject = role === "admin" ? admin : employee;
    await User.updateOne({ _id: subject._id }, { $set: { status: "inactive" } });
    const response = await profile(role).expect(401);
    expect(response.body).not.toHaveProperty("user");
  });

  test("rejects the existing token after the account is archived through the Admin API", async () => {
    await request(server).delete(`/api/employees/${employee.empId}`)
      .set("Authorization", `Bearer ${tokens.admin}`).expect(200);
    const response = await profile("employee").expect(401);
    expect(response.body).not.toHaveProperty("user");
  });

  test.each(["put", "patch"])("provides no self-profile %s mutation endpoint", async (method) => {
    const before = await User.findById(employee._id).select("+password").lean();
    await request(server)[method]("/api/auth/me")
      .set("Authorization", `Bearer ${tokens.employee}`)
      .send({ name: "Changed", role: "admin", password: "replacement-password" }).expect(404);
    const after = await User.findById(employee._id).select("+password").lean();
    expect(after).toEqual(before);
  });
});
