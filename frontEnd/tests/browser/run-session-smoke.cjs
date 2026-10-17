const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const crypto = require("node:crypto");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { createRequire } = require("node:module");
const { setTimeout: delay } = require("node:timers/promises");
const repo = path.resolve(__dirname, "../../..");
const backend = path.join(repo, "backEnd");
const frontend = path.join(repo, "frontEnd");
const backendRequire = createRequire(path.join(backend, "package.json"));
const mongoose = backendRequire("mongoose");
const { MongoMemoryReplSet } = backendRequire("mongodb-memory-server");
const User = backendRequire(path.join(backend, "src/models/user.model.js"));
const model = (moduleName, filename = moduleName) => backendRequire(path.join(backend, `src/modules/${moduleName}/${filename}.model.js`));
const Customer = model("customer"), Product = model("product"), Task = model("task"), Quotation = model("quotation"), QuotationItem = model("quotation", "quotationItem");
model("order");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worknest-session-smoke-"));
fs.chmodSync(tempDir, 0o700);
const children = [];
const scenario = process.argv.includes("--orders") ? "orders" : process.argv.includes("--catalogs") ? "catalogs" : process.argv.includes("--quotations") ? "quotations" : process.argv.includes("--tasks") ? "tasks" : "session";
const configuredMongo = process.argv.includes("--configured-mongodb");
let disposableConfiguredDatabase;
let mongo;
let stopping = false;
const freePort = () => new Promise((resolve, reject) => {
  const listener = net.createServer();
  listener.once("error", reject);
  listener.listen(0, "127.0.0.1", () => { const port = listener.address().port; listener.close(() => resolve(port)); });
});
function start(name, command, args, cwd, env = {}, capture = true) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
  children.push(child);
  if (capture) {
    const log = fs.createWriteStream(path.join(tempDir, `${name}.log`), { mode: 0o600 });
    child.stdout.pipe(log); child.stderr.pipe(log);
  }
  return child;
}
async function ready(url, expected, child) {
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error("A development server stopped before becoming ready; inspect the temporary logs.");
    try { if ((await fetch(url)).status === expected) return; } catch { /* Retry during process startup. */ }
    await delay(100);
  }
  throw new Error(`Local server did not become ready: ${new URL(url).pathname}`);
}
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children.reverse()) { if (child.exitCode === null) { try { process.kill(-child.pid, "SIGTERM"); } catch { /* Already stopped. */ } } }
  await Promise.all(children.map(child => child.exitCode !== null ? undefined : Promise.race([
    new Promise(resolve => child.once("exit", resolve)), delay(5000),
  ])));
  if (disposableConfiguredDatabase && mongoose.connection.readyState === 1) {
    if (mongoose.connection.name !== disposableConfiguredDatabase || !/^worknest_m4_smoke_[0-9]+_[a-f0-9]+$/.test(disposableConfiguredDatabase)) {
      throw new Error("Refusing cleanup outside the disposable browser database");
    }
    await mongoose.connection.dropDatabase();
    console.log(JSON.stringify({ disposableConfiguredDatabaseRemoved: true }));
  }
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { void stop().finally(() => process.exit(1)); });

(async () => {
  let mongoUri;
  if (configuredMongo) {
    const config = backendRequire("dotenv").parse(fs.readFileSync(path.join(backend, ".env")));
    const configuredUri = new URL(config.MONGO_URI);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(configuredUri.hostname)) throw new Error("Configured browser verification requires a local development database");
    const client = new (backendRequire("mongodb").MongoClient)(config.MONGO_URI);
    try {
      await client.connect();
      const hello = await client.db().admin().command({ hello: 1 });
      if (!hello.setName || !hello.isWritablePrimary || hello.logicalSessionTimeoutMinutes == null) throw new Error("Configured MongoDB is not a writable transaction-capable replica set");
      console.log(JSON.stringify({ configuredReplicaSet: hello.setName, writablePrimary: true }));
    } finally { await client.close(); }
    disposableConfiguredDatabase = `worknest_m4_smoke_${Date.now()}_${crypto.randomBytes(5).toString("hex")}`;
    configuredUri.pathname = `/${disposableConfiguredDatabase}`;
    mongoUri = configuredUri.href;
  } else {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" }, instanceOpts: [{ ip: "127.0.0.1" }] });
    mongoUri = mongo.getUri("worknest_session_smoke");
  }
  await mongoose.connect(mongoUri);
  await Promise.all(Object.values(mongoose.models).map((entry) => entry.init()));
  const password = crypto.randomBytes(24).toString("hex");
  const [admin, employee, employeeB] = await User.create([
    { name: "Smoke Admin", email: "admin@worknest-smoke.test", empId: "EMP-SMOKE-ADMIN", role: "admin", password },
    { name: "Smoke Employee", email: "employee@worknest-smoke.test", empId: "EMP-SMOKE-EMPLOYEE", role: "employee", phone: "9876543210", password },
    { name: "Smoke Employee B", email: "employee-b@worknest-smoke.test", empId: "EMP-SMOKE-EMPLOYEE-B", role: "employee", password },
  ]);
  const customer = await Customer.create({ customerId: "CUST-SMOKE-001", name: "Smoke Customer", status: "active", email: "customer@worknest-smoke.test", address: "Disposable test fixture", addedBy: admin._id });
  const product = await Product.create({ productId: "PRD-SMOKE-001", name: "Smoke Product", description: "Disposable test fixture", price: 100 });
  const roundingProduct = await Product.create({ productId: "PRD-SMOKE-ROUNDING", name: "Smoke Rounding Product", description: "Disposable rounding fixture", price: 0.05 });
  const validUntil = new Date(Date.now() + 30 * 86400000);
  await Task.create({ taskId: "TSK-SMOKE-001", title: "Smoke assigned task", description: "Disposable test fixture", assignedTo: employee._id, assignedBy: admin._id, dueDate: validUntil });
  const quotation = await Quotation.create({ quotationId: "QT-SMOKE-001", customerId: customer._id, employeeId: employee._id, createdBy: admin._id, status: "DRAFT", subtotal: 100, taxableAmount: 100, grandTotal: 118, gstAmount: 18, validUntil, notes: "Disposable test quotation" });
  await QuotationItem.create({ quotationId: quotation._id, productId: product._id, productName: product.name, quantity: 1, unitPrice: 100, gstRate: 18, gstAmount: 18, taxableAmount: 100, lineTotal: 118 });
  const backendUrl = `http://127.0.0.1:${await freePort()}`;
  const api = start("backend", "npm", ["start"], backend, { MONGO_URI: mongoUri, JWT_SECRET: crypto.randomBytes(32).toString("hex"), PORT: new URL(backendUrl).port });
  await ready(`${backendUrl}/api/tasks`, 401, api);
  const frontendPort = await freePort();
  const frontendUrl = `http://127.0.0.1:${frontendPort}`;
  const web = start("frontend", "npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"], frontend, { VITE_BACKEND_URL: backendUrl });
  await ready(frontendUrl, 200, web);
  const settingsPath = path.join(tempDir, "browser-settings.json");
  fs.writeFileSync(settingsPath, JSON.stringify({ scenario, frontendUrl, backendUrl, adminEmail: admin.email, employeeEmail: employee.email, employeeIdentifier: employee.empId, employeeName: employee.name, employeeBEmail: employeeB.email, employeeBName: employeeB.name, employeeBIdentifier: employeeB.empId, customerName: customer.name, productName: product.name, roundingProductName: roundingProduct.name, password, quotationId: quotation._id.toString(), quotationNumber: quotation.quotationId, tempDir }), { mode: 0o600 });
  console.log(JSON.stringify({ disposableDatabase: true, backendStarted: true, frontendStarted: true, settingsPath }));
  const smoke = start("browser", process.execPath, [path.join(__dirname, "session.smoke.cjs"), settingsPath], frontend, {}, false);
  process.exitCode = await new Promise((resolve, reject) => { smoke.once("error", reject); smoke.once("exit", (code) => resolve(code ?? 1)); });
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(stop);
