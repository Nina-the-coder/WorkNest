// Controls only the isolated WorkNest database created during the D8 checkpoint.
// Existing MongoDB services and their data/configuration are never controlled here.
const fs = require("node:fs");
const path = require("node:path");
const { spawn, execFileSync } = require("node:child_process");
const { MongoClient } = require("mongodb");

const directory = path.resolve(__dirname, "../../.worknest-local/mongodb");
const statePath = path.join(directory, "state.json");
const configPath = path.join(directory, "mongod.conf");
const pidPaths = ["launcher.pid", "mongod.pid"].map((name) => path.join(directory, name));
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const loadState = () => {
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  if (
    state.configPath !== configPath ||
    !Number.isInteger(state.port) || state.port < 1024 || state.port > 65535 ||
    state.replicaSet !== "worknest-dev"
  ) throw new Error("Isolated MongoDB metadata does not match the reviewed setup");
  const config = fs.readFileSync(configPath, "utf8");
  if (!/^\s*bindIp:\s*127\.0\.0\.1\s*$/m.test(config) || /^\s*fork:\s*true\s*$/m.test(config)) {
    throw new Error("Isolated MongoDB must use loopback without the unsupported macOS fork option");
  }
  return state;
};

const trackedPid = (state) => {
  const pids = [...new Set(pidPaths.filter((file) => fs.existsSync(file))
    .map((file) => Number(fs.readFileSync(file, "utf8").trim())))];
  const running = [];
  for (const pid of pids) {
    if (!Number.isSafeInteger(pid) || pid <= 1) throw new Error("Invalid isolated process metadata");
    let command;
    try { command = execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
    catch (error) { if (error.status === 1) continue; throw error; }
    if (!command.includes(state.mongod) || !command.includes(`--config ${configPath}`)) {
      throw new Error("Tracked PID belongs to another process; refusing to control it");
    }
    running.push(pid);
  }
  if (running.length > 1) throw new Error("Multiple isolated process IDs require review");
  return running[0];
};

const probe = async (state) => {
  const client = new MongoClient(`mongodb://127.0.0.1:${state.port}`, {
    directConnection: true, serverSelectionTimeoutMS: 750, connectTimeoutMS: 750,
  });
  try {
    await client.connect();
    const hello = await client.db("admin").command({ hello: 1 });
    if (hello.setName !== state.replicaSet) throw new Error("Listener is not the isolated WorkNest replica set");
    return { writablePrimary: hello.isWritablePrimary === true, sessions: hello.logicalSessionTimeoutMinutes != null };
  } finally { await client.close(); }
};

const describe = async (state) => {
  const pid = trackedPid(state);
  if (!pid) return { running: false, port: state.port, replicaSet: state.replicaSet };
  return { running: true, pid, port: state.port, replicaSet: state.replicaSet, ...await probe(state) };
};

const start = async (state) => {
  const current = await describe(state);
  if (current.running) return current;
  const output = fs.openSync(path.join(directory, "launcher.log"), "a", 0o600);
  const child = spawn(state.mongod, ["--config", configPath], {
    detached: true, stdio: ["ignore", output, output],
  });
  try {
    await new Promise((resolve, reject) => { child.once("spawn", resolve); child.once("error", reject); });
    child.unref();
    fs.writeFileSync(pidPaths[0], String(child.pid), { mode: 0o600 });
  } finally { fs.closeSync(output); }
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error("Isolated MongoDB exited; inspect its private log");
    try {
      const status = await probe(state);
      if (status.writablePrimary && status.sessions) return { running: true, pid: child.pid, port: state.port, replicaSet: state.replicaSet, ...status };
    } catch { /* A newly launched listener can take a moment to become ready. */ }
    await pause(250);
  }
  throw new Error("Isolated MongoDB did not become a writable primary; inspect its private log");
};

const stop = async (state) => {
  const pid = trackedPid(state);
  if (pid) {
    await probe(state);
    process.kill(pid, "SIGTERM");
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (!trackedPid(state)) break;
      await pause(250);
    }
    if (trackedPid(state)) throw new Error("Isolated MongoDB did not shut down; no forced kill attempted");
  }
  for (const file of pidPaths) if (fs.existsSync(file)) fs.unlinkSync(file);
  return { running: false, port: state.port, replicaSet: state.replicaSet, dataPreserved: true };
};

(async () => {
  const action = process.argv[2] || "status";
  if (!["start", "stop", "status"].includes(action)) throw new Error("Usage: node scripts/local-mongodb.cjs start|stop|status");
  const state = loadState();
  const result = await ({ start, stop, status: describe })[action](state);
  console.log(JSON.stringify(result));
})().catch((error) => {
  // Do not print connection details or raw driver errors.
  console.error(error instanceof SyntaxError || error.code === "ENOENT"
    ? "Local MongoDB setup is missing or invalid; see docs/development/quotation-d8-verification.md"
    : `Local MongoDB action failed (${error.name}); inspect private config/log and the D8 instructions`);
  process.exitCode = 1;
});
