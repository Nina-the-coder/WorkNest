const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Task = require("../../src/modules/task/task.model");
const taskRepository = require("../../src/modules/task/task.repository");

jest.setTimeout(60000);

const password = "Task-workflow-test-password-123!";
const originalSecret = process.env.JWT_SECRET;
let mongo;
let server;
let users;
let tokens;
let taskA;
let taskB;
let archivedTask;
let unassignedTask;

const call = (method, path, actor = "employeeA") =>
  request(server)[method](path).set("Authorization", tokens[actor]);
const taskPath = (task = taskA) => `/api/tasks/${task.taskId}`;
const statusPath = (task = taskA) => `${taskPath(task)}/status`;
const snapshot = async (task = taskA) =>
  JSON.parse(JSON.stringify(await Task.findById(task._id).lean()));
const createInput = (overrides = {}) => ({
  title: "Assigned through the Admin API",
  description: "Shared Admin and Employee workflow",
  assignedTo: users.employeeA._id.toString(),
  dueDate: "2030-03-20",
  priority: "high",
  ...overrides,
});

describe("Shared Task workflow with real HTTP, JWT, permissions and MongoDB", () => {
  beforeAll(async () => {
    // Never load application .env settings or connect to an existing database.
    process.env.JWT_SECRET = "worknest-task-workflow-tests-only";
    mongo = await MongoMemoryServer.create({
      instance: { ip: "127.0.0.1", dbName: "worknest_task_workflow" },
    });
    await mongoose.connect(mongo.getUri());
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    const fixtures = await User.create([
      { name: "Task Admin", email: "admin@task-workflow.test", empId: "EMP-TASK-ADMIN", role: "admin", password },
      { name: "Task Employee A", email: "a@task-workflow.test", empId: "EMP-TASK-A", role: "employee", password },
      { name: "Task Employee B", email: "b@task-workflow.test", empId: "EMP-TASK-B", role: "employee", password },
      { name: "Inactive assignee", email: "inactive@task-workflow.test", empId: "EMP-TASK-INACTIVE", role: "employee", status: "inactive", password },
      { name: "Archived assignee", email: "archived@task-workflow.test", empId: "EMP-TASK-ARCHIVED", role: "employee", deleted: true, password },
    ]);
    users = Object.fromEntries(["admin", "employeeA", "employeeB", "inactive", "archived"]
      .map((name, index) => [name, fixtures[index]]));
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      listener.once("error", reject);
    });
    tokens = {};
    for (const actor of ["admin", "employeeA", "employeeB"]) {
      const login = await request(server).post("/api/auth/login")
        .send({ email: users[actor].email, password }).expect(200);
      tokens[actor] = `Bearer ${login.body.token}`;
    }
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models)
      .filter((model) => model !== User).map((model) => model.deleteMany({})));
    const common = {
      description: "Task workflow fixture", assignedBy: users.admin._id,
      dueDate: new Date("2030-03-20"), priority: "medium",
    };
    [taskA, taskB, archivedTask] = await Task.create([
      { ...common, taskId: "TSK-WORKFLOW-A", title: "Assigned to A", assignedTo: users.employeeA._id },
      { ...common, taskId: "TSK-WORKFLOW-B", title: "Assigned to B", assignedTo: users.employeeB._id },
      { ...common, taskId: "TSK-WORKFLOW-ARCHIVED", title: "Archived task", assignedTo: users.employeeA._id, deleted: true },
    ]);
    // A historical incomplete record must not leak into an Employee's scope.
    // The public creation contract still requires a validated assignee.
    unassignedTask = {
      ...common, taskId: "TSK-WORKFLOW-UNASSIGNED", title: "Historical unassigned task",
      assignedTo: null, status: "pending", deleted: false,
      createdAt: new Date(), updatedAt: new Date(),
    };
    const result = await Task.collection.insertOne(unassignedTask);
    unassignedTask._id = result.insertedId;
  });

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongo) await mongo.stop();
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  test("Admin creates and assigns; Employee advances; Admin sees status and reassigns with immediate access changes", async () => {
    const createdResponse = await call("post", "/api/tasks", "admin")
      .send(createInput({ assignedBy: users.employeeB._id })).expect(201);
    expect(createdResponse.body).toEqual({ message: "Task added successfully", task: createInput().title });
    const created = await Task.findOne({ title: createInput().title });
    expect(created.taskId).toMatch(/^TSK\d+$/);
    expect(created.assignedBy.toString()).toBe(users.admin._id.toString());
    expect(created.status).toBe("pending");
    const employeeList = await call("get", "/api/tasks").expect(200);
    expect(employeeList.body.map((task) => task.taskId)).toContain(created.taskId);
    const details = await call("get", taskPath(created)).expect(200);
    expect(details.body.task).toMatchObject({
      title: createInput().title, priority: "high", status: "pending",
      assignedTo: { _id: users.employeeA._id.toString(), name: users.employeeA.name },
      assignedBy: { _id: users.admin._id.toString(), name: users.admin.name },
    });
    expect(JSON.stringify(details.body)).not.toMatch(/password|\$2[aby]\$/i);
    await call("get", taskPath(created), "employeeB").expect(404);
    const started = await call("patch", statusPath(created)).send({ status: "in-progress" }).expect(200);
    expect(started.body.task).toMatchObject({ taskId: created.taskId, status: "in-progress" });
    expect((await Task.findById(created._id)).status).toBe("in-progress");
    const adminView = await call("get", taskPath(created), "admin").expect(200);
    expect(adminView.body.task.status).toBe("in-progress");
    const adminList = await call("get", "/api/tasks", "admin").expect(200);
    expect(adminList.body.find((task) => task.taskId === created.taskId).status).toBe("in-progress");
    const edited = await call("put", taskPath(created), "admin").send({
      title: "Admin edited and reassigned", description: "Admin editor remains available",
      priority: "low", dueDate: "2031-01-15", assignedTo: users.employeeB._id.toString(),
    }).expect(200);
    expect(edited.body).toMatchObject({ message: "Task Updated", task: { status: "in-progress", priority: "low" } });
    expect(edited.body.task.assignedBy._id || edited.body.task.assignedBy).toBe(users.admin._id.toString());
    await call("get", taskPath(created)).expect(404);
    await call("patch", statusPath(created)).send({ status: "done" }).expect(404);
    const reassignedList = await call("get", "/api/tasks").expect(200);
    expect(reassignedList.body.map((task) => task.taskId)).not.toContain(created.taskId);
    const newOwner = await call("get", taskPath(created), "employeeB").expect(200);
    expect(newOwner.body.task).toMatchObject({ title: "Admin edited and reassigned", status: "in-progress" });
    await call("patch", statusPath(created), "employeeB").send({ status: "done" }).expect(200);
    expect((await call("get", taskPath(created), "admin").expect(200)).body.task.status).toBe("done");
    await call("put", taskPath(created), "admin").send({ status: "pending" }).expect(200);
    expect((await call("get", taskPath(created), "employeeB").expect(200)).body.task.status).toBe("pending");
  });

  test("Employee list and details never expose another assignee, an unassigned task, or archived task", async () => {
    const listed = await call("get", "/api/tasks")
      .query({ assignedTo: users.employeeB._id.toString(), employeeId: users.employeeB._id.toString(), role: "admin" })
      .expect(200);
    expect(listed.body.map((task) => task.taskId)).toEqual([taskA.taskId]);
    for (const task of [taskB, archivedTask, unassignedTask]) {
      await call("get", taskPath(task)).expect(404);
    }
    const all = await call("get", "/api/tasks", "admin").expect(200);
    expect(all.body.map((task) => task.taskId).sort())
      .toEqual([taskA.taskId, taskB.taskId, unassignedTask.taskId].sort());
  });

  test("status updates require authentication", async () => {
    const before = await snapshot();
    await request(server).patch(statusPath()).send({ status: "in-progress" }).expect(401);
    await request(server).patch(statusPath()).set("Authorization", "Bearer invalid-token")
      .send({ status: "in-progress" }).expect(401);
    expect(await snapshot()).toEqual(before);
  });

  test.each(["another assignee", "unassigned", "archived", "missing"])(
    "status updates conceal %s tasks without mutation", async (scenario) => {
      const task = scenario === "another assignee" ? taskB : scenario === "unassigned" ? unassignedTask
        : scenario === "archived" ? archivedTask : { taskId: "TSK-WORKFLOW-MISSING" };
      const before = scenario === "missing" ? undefined : await snapshot(task);
      await call("patch", statusPath(task)).send({ status: "in-progress" }).expect(404);
      if (before) expect(await snapshot(task)).toEqual(before);
    },
  );

  test.each([
    ["pending", "done"], ["in-progress", "pending"], ["done", "pending"], ["done", "in-progress"],
  ])("Employee cannot transition %s → %s", async (current, next) => {
    await Task.updateOne({ _id: taskA._id }, { $set: { status: current } });
    const before = await snapshot();
    await call("patch", statusPath()).send({ status: next }).expect(400);
    expect(await snapshot()).toEqual(before);
  });

  test.each(["pending", "in-progress", "done"])("retrying the existing %s status is a persisted no-op", async (status) => {
    await Task.updateOne({ _id: taskA._id }, { $set: { status } });
    const before = await snapshot();
    const retry = await call("patch", statusPath()).send({ status }).expect(200);
    expect(retry.body.task.status).toBe(status);
    expect(await snapshot()).toEqual(before);
  });

  test.each([{}, { status: null }, { status: "" }, { status: "DONE" }, { status: 1 },
    { status: true }, { status: ["in-progress"] }, { status: { value: "in-progress" } }])(
    "rejects malformed status input %j before mutation", async (body) => {
      const before = await snapshot();
      await call("patch", statusPath()).send(body).expect(400);
      expect(await snapshot()).toEqual(before);
    },
  );

  test.each([
    ["assignedTo", () => users.employeeB._id.toString()], ["assignedBy", () => users.employeeA._id.toString()],
    ["title", () => "Unauthorized title"], ["description", () => "Unauthorized description"],
    ["priority", () => "high"], ["dueDate", () => "2040-01-01"],
    ["taskId", () => "TSK-SPOOFED"], ["deleted", () => true],
    ["employeeId", () => users.employeeB._id.toString()], ["updatedAt", () => "2040-01-01"],
  ])("status action rejects crafted %s field with the entire record unchanged", async (field, value) => {
    const before = await snapshot();
    await call("patch", statusPath()).send({ status: "in-progress", [field]: value() }).expect(403);
    expect(await snapshot()).toEqual(before);
  });

  test("the dedicated status permission does not grant Employee the Admin editor/create/delete operations", async () => {
    const before = await snapshot();
    await call("put", taskPath()).send({ status: "in-progress" }).expect(403);
    await call("put", taskPath()).send({ title: "Unauthorized", assignedTo: users.employeeB._id }).expect(403);
    await call("post", "/api/tasks").send(createInput()).expect(403);
    await call("delete", taskPath()).expect(403);
    expect(await snapshot()).toEqual(before);
    expect(await Task.countDocuments()).toBe(4);
  });

  test("Admin can use the status action for existing arbitrary enum transitions and reopen", async () => {
    await call("patch", statusPath(), "admin").send({ status: "done" }).expect(200);
    await call("patch", statusPath(), "admin").send({ status: "pending" }).expect(200);
    expect((await Task.findById(taskA._id)).status).toBe("pending");
    const before = await snapshot();
    await call("patch", statusPath(), "admin")
      .send({ status: "in-progress", title: "Use the existing Admin PUT editor" }).expect(403);
    expect(await snapshot()).toEqual(before);
  });

  test("Admin soft deletion hides the task and rejects future status updates", async () => {
    await call("delete", taskPath(), "admin").expect(200);
    const before = await snapshot();
    expect(before.deleted).toBe(true);
    await call("get", taskPath(), "admin").expect(404);
    await call("patch", statusPath()).send({ status: "in-progress" }).expect(404);
    await call("patch", statusPath(), "admin").send({ status: "done" }).expect(404);
    expect(await snapshot()).toEqual(before);
  });

  test.each([
    ["malformed", 400], ["missing", 404], ["archived", 404], ["inactive", 400], ["admin", 400],
  ])("Admin cannot create or reassign to a %s assignee", async (scenario, expectedStatus) => {
    const assignedTo = scenario === "malformed" ? "not-a-user-id"
      : scenario === "missing" ? new mongoose.Types.ObjectId().toString() : users[scenario]._id.toString();
    const before = await snapshot();
    await call("post", "/api/tasks", "admin").send(createInput({ assignedTo })).expect(expectedStatus);
    expect(await Task.countDocuments()).toBe(4);
    await call("put", taskPath(), "admin")
      .send({ assignedTo, title: "Must not be persisted" }).expect(expectedStatus);
    expect(await snapshot()).toEqual(before);
  });

  test("Admin can save an unchanged historical inactive assignee without silently resetting status", async () => {
    await Task.updateOne({ _id: taskA._id }, { $set: { assignedTo: users.inactive._id, status: "done" } });
    const response = await call("put", taskPath(), "admin").send({
      assignedTo: users.inactive._id.toString(), title: "Historical assignment retained",
    }).expect(200);
    expect(response.body.task).toMatchObject({ title: "Historical assignment retained", status: "done" });
    const stored = await Task.findById(taskA._id);
    expect(stored.assignedTo.toString()).toBe(users.inactive._id.toString());
    expect(stored.assignedBy.toString()).toBe(users.admin._id.toString());
  });

  test("Admin assignment accepts a populated User reference from the existing form", async () => {
    await call("put", taskPath(), "admin").send({
      assignedTo: { _id: users.employeeB._id.toString(), name: users.employeeB.name },
      description: "Existing populated-reference payload remains compatible",
    }).expect(200);
    expect((await Task.findById(taskA._id)).assignedTo.toString()).toBe(users.employeeB._id.toString());
    await call("get", taskPath()).expect(404);
    await call("get", taskPath(), "employeeB").expect(200);
  });

  test.each([
    ["title", ""], ["title", "   "], ["title", null], ["description", ""],
    ["description", "   "], ["description", 4], ["dueDate", "not-a-date"], ["dueDate", null],
    ["status", "completed"], ["status", null], ["priority", "urgent"], ["priority", null],
  ])("Admin creation/update reject invalid %s=%j with no partial mutation", async (field, value) => {
    const before = await snapshot();
    await call("post", "/api/tasks", "admin").send(createInput({ [field]: value })).expect(400);
    expect(await Task.countDocuments()).toBe(4);
    await call("put", taskPath(), "admin").send({ [field]: value }).expect(400);
    expect(await snapshot()).toEqual(before);
  });

  test("concurrent duplicate transitions leave one valid state and safely allow retry", async () => {
    const responses = await Promise.all([
      call("patch", statusPath()).send({ status: "in-progress" }),
      call("patch", statusPath()).send({ status: "in-progress" }),
    ]);
    expect(responses.map((response) => response.status)).toContain(200);
    for (const response of responses) expect([200, 409]).toContain(response.status);
    expect((await Task.findById(taskA._id)).status).toBe("in-progress");
    const afterRequests = await snapshot();
    await call("patch", statusPath()).send({ status: "in-progress" }).expect(200);
    expect(await snapshot()).toEqual(afterRequests);
  });

  test("racing reassignment cannot leave the old Employee authorized to update", async () => {
    const [statusResponse, reassignment] = await Promise.all([
      call("patch", statusPath()).send({ status: "in-progress" }),
      call("put", taskPath(), "admin").send({ assignedTo: users.employeeB._id.toString() }),
    ]);
    expect([200, 409]).toContain(reassignment.status);
    expect([200, 404, 409]).toContain(statusResponse.status);
    if (reassignment.status === 409) {
      const wonStatus = (await Task.findById(taskA._id)).status;
      await call("put", taskPath(), "admin")
        .send({ assignedTo: users.employeeB._id.toString() }).expect(200);
      expect((await Task.findById(taskA._id)).status).toBe(wonStatus);
    }
    const stored = await snapshot();
    expect(stored.assignedTo).toBe(users.employeeB._id.toString());
    expect(["pending", "in-progress"]).toContain(stored.status);
    await call("get", taskPath()).expect(404);
    await call("patch", statusPath()).send({ status: "in-progress" }).expect(404);
    expect(await snapshot()).toEqual(stored);
    await call("get", taskPath(), "employeeB").expect(200);
  });

  test("real conditional persistence rejects an assignee snapshot captured before Admin reassignment", async () => {
    const priorRead = await taskRepository.findActiveByTaskId(taskA.taskId, { assignedTo: users.employeeA._id });
    await call("put", taskPath(), "admin")
      .send({ assignedTo: users.employeeB._id.toString() }).expect(200);
    const before = await snapshot();
    const staleWrite = await taskRepository.updateIfCurrent(priorRead,
      { assignedTo: users.employeeA._id }, { status: "in-progress" });
    expect(staleWrite).toBeNull();
    expect(await snapshot()).toEqual(before);
    await call("patch", statusPath()).send({ status: "in-progress" }).expect(404);
  });

  test("real conditional persistence rejects a stale snapshot even after Admin restores the earlier status", async () => {
    await Task.updateOne({ _id: taskA._id }, { $set: { updatedAt: new Date("2020-01-01") } }, { timestamps: false });
    const priorRead = await taskRepository.findActiveByTaskId(taskA.taskId, { assignedTo: users.employeeA._id });
    await call("patch", statusPath(), "admin").send({ status: "done" }).expect(200);
    await call("patch", statusPath(), "admin").send({ status: "pending" }).expect(200);
    const before = await snapshot();
    expect(before.status).toBe(priorRead.status);
    const staleWrite = await taskRepository.updateIfCurrent(priorRead,
      { assignedTo: users.employeeA._id }, { status: "in-progress" });
    expect(staleWrite).toBeNull();
    expect(await snapshot()).toEqual(before);
  });
});
