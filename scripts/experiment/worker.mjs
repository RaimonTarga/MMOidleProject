import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
  createWriteStream,
} from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const RUN_ROOT = "/experiment";
const config = JSON.parse(readFileSync(join(RUN_ROOT, "run-config.json"), "utf8"));
const artifactsDir = join(RUN_ROOT, "artifacts");
mkdirSync(artifactsDir, { recursive: true });

let phase = "starting";
let server = null;
let bot = null;
let lastHealth = null;
let consecutiveHealthFailures = 0;
let cancellationReason = null;
let resolveCancellation;
const cancellation = new Promise((resolve) => { resolveCancellation = resolve; });

function writeJsonAtomic(path, value) {
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, path);
}

function readNumber(path) {
  try {
    return Number(readFileSync(path, "utf8").trim());
  } catch {
    return null;
  }
}

function cgroupStats() {
  const memoryBytes = readNumber("/sys/fs/cgroup/memory.current");
  let cpuUsageUsec = null;
  try {
    const cpu = readFileSync("/sys/fs/cgroup/cpu.stat", "utf8");
    const match = cpu.match(/^usage_usec\s+(\d+)$/m);
    if (match) cpuUsageUsec = Number(match[1]);
  } catch {
    // Older/non-cgroup hosts retain null resource fields.
  }
  return { memoryBytes, cpuUsageUsec };
}

function heartbeat() {
  writeJsonAtomic(join(RUN_ROOT, "worker-heartbeat.json"), {
    schemaVersion: 1,
    experimentId: config.experimentId,
    runKey: config.runKey,
    at: new Date().toISOString(),
    phase,
    workerPid: process.pid,
    serverPid: server?.pid ?? null,
    botPid: bot?.pid ?? null,
    consecutiveHealthFailures,
    lastHealth,
    resources: cgroupStats(),
  });
}

function appendResourceSample() {
  appendFileSync(join(RUN_ROOT, "resource-samples.jsonl"), `${JSON.stringify({
    at: new Date().toISOString(),
    phase,
    ...cgroupStats(),
    server: lastHealth?.process ?? null,
  })}\n`, "utf8");
}

function pipeChild(child, logName) {
  const stream = createWriteStream(join(RUN_ROOT, logName), { flags: "a" });
  child.stdout?.pipe(stream);
  child.stderr?.pipe(stream);
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
  child.once("close", () => stream.end());
}

function childExit(child, role) {
  return new Promise((resolve) => {
    child.once("exit", (code, signal) => resolve({ kind: `${role}-exit`, code, signal }));
  });
}

async function stopChild(child, graceMs = 10_000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  const exited = await Promise.race([
    childExit(child, "stopped").then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), graceMs)),
  ]);
  if (!exited && child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

async function fetchHealth() {
  const response = await fetch("http://127.0.0.1:4000/healthz", { signal: AbortSignal.timeout(2_000) });
  if (!response.ok) throw new Error(`health returned ${response.status}`);
  return response.json();
}

async function awaitReady(serverExitPromise) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const exited = await Promise.race([
      serverExitPromise,
      new Promise((resolve) => setTimeout(() => resolve(null), 500)),
    ]);
    if (exited) throw new Error(`server exited before readiness (${exited.code ?? exited.signal ?? "unknown"})`);
    try {
      const health = await fetchHealth();
      const actualRevision = health?.build?.gitRevision;
      const actualBuildId = health?.build?.buildId;
      if (actualRevision !== config.gitRevision || actualBuildId !== config.buildId) {
        throw new Error(
          `frozen build mismatch: expected ${config.gitRevision}/${config.buildId}, ` +
          `observed ${actualRevision ?? "missing"}/${actualBuildId ?? "missing"}`,
        );
      }
      lastHealth = health;
      return;
    } catch (error) {
      if (String(error).includes("frozen build mismatch")) throw error;
    }
  }
  throw new Error("server did not become ready within 120000ms");
}

function findFiles(root, name, out = []) {
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) findFiles(full, name, out);
    else if (entry === name) out.push(full);
  }
  return out;
}

function latestSummary() {
  const summaries = findFiles(artifactsDir, "summary.json")
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (summaries.length === 0) return null;
  try {
    return { path: summaries[0], value: JSON.parse(readFileSync(summaries[0], "utf8")) };
  } catch {
    return null;
  }
}

function botArguments() {
  const args = [
    "bot/dist/run.js",
    `--route=${config.routeId}`,
    `--policy=${config.policyId}`,
    `--index=${String(config.replica).padStart(2, "0")}`,
    "--server=http://127.0.0.1:4000",
    "--out=/experiment/artifacts",
    `--maxRunMs=${config.maxRunMs}`,
    `--account=${config.accountId}`,
    `--name=${config.characterName}`,
    "--executionMode=single",
    "--maxConcurrency=1",
    "--fresh=true",
    "--restoreRewardMultiplier=false",
    `--completion=${config.completionMode}`,
  ];
  if (config.rewardMultiplier !== 1) args.push(`--rewardMultiplier=${config.rewardMultiplier}`);
  if (config.fastBossRetry) args.push("--fastBossRetry=true");
  if (config.tierEntrySnapshotPath) {
    args.push(`--tierEntrySnapshot=${config.tierEntrySnapshotPath}`);
    if (config.mode === "canonical-isolated") args.push("--requireTierEntrySnapshot=true");
  }
  if (config.tierEntrySnapshotDir) {
    args.push(`--tierEntrySnapshotDir=${config.tierEntrySnapshotDir}`);
    if (config.mode === "canonical-isolated") args.push("--requireTierEntrySnapshot=true");
  }
  return args;
}

function terminalResult(status, reason, detail = {}) {
  return {
    schemaVersion: 1,
    experimentId: config.experimentId,
    runKey: config.runKey,
    status,
    reason,
    endedAt: new Date().toISOString(),
    ...detail,
  };
}

async function main() {
  const commonEnv = {
    ...process.env,
    NODE_ENV: "development",
    DEV_TOOLS: "true",
    AUTH_DEV_BYPASS: "1",
    DATABASE_URL: config.databaseUrl,
    LOG_DATABASE_URL: config.logDatabaseUrl,
    REDIS_URL: config.redisUrl,
    REDIS_CHANNEL_PREFIX: config.redisChannelPrefix,
    EXPERIMENT_GIT_REVISION: config.gitRevision,
    EXPERIMENT_SOURCE_TREE: config.sourceTree,
    EXPERIMENT_BUILD_ID: config.buildId,
  };

  server = spawn("node", ["server/dist/index.js"], {
    cwd: "/app",
    env: commonEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  pipeChild(server, "server.log");
  const serverExitPromise = childExit(server, "server");
  await awaitReady(serverExitPromise);

  phase = "running";
  bot = spawn("node", botArguments(), {
    cwd: "/app",
    env: commonEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  pipeChild(bot, "bot.log");
  const botExitPromise = childExit(bot, "bot");

  let resolveUnhealthy;
  const unhealthy = new Promise((resolve) => { resolveUnhealthy = resolve; });
  const healthTimer = setInterval(async () => {
    try {
      lastHealth = await fetchHealth();
      consecutiveHealthFailures = 0;
    } catch (error) {
      consecutiveHealthFailures += 1;
      if (consecutiveHealthFailures >= 3) {
        resolveUnhealthy({ kind: "server-unhealthy", error: String(error) });
      }
    }
    appendResourceSample();
  }, 5_000);
  const heartbeatTimer = setInterval(heartbeat, 10_000);
  heartbeat();
  appendResourceSample();

  const runDeadline = new Promise((resolve) => {
    setTimeout(() => resolve({ kind: "deadline" }), config.maxRunMs + 30_000).unref?.();
  });
  const outcome = await Promise.race([
    botExitPromise,
    serverExitPromise,
    unhealthy,
    runDeadline,
    cancellation,
  ]);
  clearInterval(healthTimer);
  clearInterval(heartbeatTimer);
  phase = "stopping";
  heartbeat();

  let result;
  if (outcome.kind === "bot-exit") {
    const summary = latestSummary();
    if (!summary) {
      result = terminalResult("failed", "bot_process_exit_without_summary", { exit: outcome });
    } else if (summary.value?.run?.completion === "completed") {
      result = terminalResult("completed", "bot_completed", {
        summaryPath: summary.path,
        botCompletion: summary.value.run.completion,
      });
    } else if (summary.value?.run?.completion === "timed-out") {
      result = terminalResult("timed_out", summary.value.run.stallReason ?? "bot_run_deadline", {
        summaryPath: summary.path,
        botCompletion: summary.value.run.completion,
      });
    } else {
      result = terminalResult("failed", summary.value?.run?.stallReason ?? `bot_${summary.value?.run?.completion ?? "failed"}`, {
        summaryPath: summary.path,
        botCompletion: summary.value?.run?.completion ?? null,
      });
    }
  } else if (outcome.kind === "server-exit") {
    result = terminalResult("failed", "server_process_exit", { exit: outcome });
  } else if (outcome.kind === "server-unhealthy") {
    result = terminalResult("failed", "server_unhealthy", { detail: outcome.error });
  } else if (outcome.kind === "deadline") {
    result = terminalResult("timed_out", "worker_run_deadline");
  } else {
    result = terminalResult("cancelled", cancellationReason ?? "user_cancelled");
  }

  await stopChild(bot, 15_000);
  await stopChild(server, 10_000);
  phase = result.status;
  writeJsonAtomic(join(RUN_ROOT, "worker-result.json"), result);
  heartbeat();
  process.exitCode = result.status === "completed" ? 0 : 1;
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    cancellationReason = `worker_received_${signal.toLowerCase()}`;
    resolveCancellation({ kind: "cancelled" });
  });
}

main().catch(async (error) => {
  phase = "failed";
  await stopChild(bot, 5_000);
  await stopChild(server, 5_000);
  writeJsonAtomic(join(RUN_ROOT, "worker-result.json"), terminalResult("failed", "worker_exception", {
    detail: error instanceof Error ? error.stack ?? error.message : String(error),
  }));
  heartbeat();
  console.error(error);
  process.exitCode = 1;
});
