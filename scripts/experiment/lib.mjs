import { validateStudy } from "./study.mjs";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const EXPERIMENT_SCHEMA_VERSION = 1;
export const TERMINAL_STATES = new Set([
  "completed",
  "failed",
  "timed_out",
  "cancelled",
]);

export function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    out[arg.slice(2, eq === -1 ? undefined : eq)] = eq === -1 ? "true" : arg.slice(eq + 1);
  }
  return out;
}

export function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

export function defaultExperimentRoot() {
  const local = process.env.LOCALAPPDATA;
  return local
    ? join(local, "mmo-idle", "experiments")
    : join(homedir(), ".local", "share", "mmo-idle", "experiments");
}

export function sanitizeId(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function makeExperimentId(name, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "z").toLowerCase();
  const label = sanitizeId(name || "experiment") || "experiment";
  return `${stamp}-${label}`;
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJsonAtomic(path, value, {
  rename = renameSync,
  wait = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms),
} = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    // Windows readers/antivirus may briefly deny replacement. Keep the previous
    // complete file visible and retry only the rename, never unlink the target.
    for (let attempt = 0; ; attempt++) {
      try { rename(temp, path); break; }
      catch (error) {
        if (!["EPERM", "EACCES", "EBUSY"].includes(error?.code) || attempt >= 20) throw error;
        wait(100);
      }
    }
  } finally {
    // A permanent failure must preserve the target and must still reach callers.
    try { rmSync(temp, { force: true }); } catch { /* preserve the original error */ }
  }
}

export function appendJsonl(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "a" });
}

export function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(path) {
  return sha256Buffer(readFileSync(path));
}

export function walkFiles(root, out = []) {
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root).sort()) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

export function hashTree(root) {
  const hash = createHash("sha256");
  for (const file of walkFiles(root)) {
    hash.update(file.slice(root.length).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    const detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}): ${detail}`);
  }
  return {
    status: result.status ?? 1,
    stdout: String(result.stdout ?? "").trim(),
    stderr: String(result.stderr ?? "").trim(),
  };
}

export function git(repoRoot, args, options = {}) {
  return run("git", ["-C", repoRoot, ...args], options).stdout;
}

export function docker(args, options = {}) {
  return run("docker", args, options);
}

export function dockerObjectExists(kind, name) {
  return docker([kind, "inspect", name], { allowFailure: true }).status === 0;
}

export function experimentDir(root, id) {
  return resolve(root, id);
}

export function loadExperiment(root, id) {
  const dir = experimentDir(root, id);
  return {
    dir,
    manifest: readJson(join(dir, "experiment.json")),
    state: readJson(join(dir, "state.json")),
    secrets: readJson(join(dir, "runtime-secrets.json")),
  };
}

export function resolveExperimentId(root, requested) {
  if (requested && requested !== "latest") return requested;
  if (!existsSync(root)) throw new Error(`no experiments exist under ${root}`);
  const candidates = readdirSync(root)
    .filter((entry) => existsSync(join(root, entry, "experiment.json")))
    .sort();
  const latest = candidates.at(-1);
  if (!latest) throw new Error(`no experiments exist under ${root}`);
  return latest;
}

export function normalizeCreateOptions(args) {
  const study = args.study ? validateStudy(readJson(resolve(args.study))) : undefined;
  if (study && (args.routes || args.policies)) throw new Error("--study cannot be combined with --routes or --policies");
  if (study) args = { ...args, routes: [...new Set(study.arms.map(a => a.route))].join(","), policies: [...new Set(study.arms.map(a => a.policy))].join(",") };
  if (!args.revision) throw new Error("--revision=<commit-or-HEAD> is required");
  const routes = String(args.routes ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (routes.length === 0) throw new Error("--routes=<route-a,route-b> is required");
  const policies = String(args.policies ?? "intended").split(",").map((value) => value.trim()).filter(Boolean);
  const count = Number(args.count ?? "1");
  const workerConcurrency = Number(args.workers ?? "2");
  const maxRunMs = Number(args.maxRunMs ?? String(6 * 60 * 60 * 1000));
  const rewardMultiplier = Number(args.rewardMultiplier ?? "1");
  const mode = args.mode ?? "canonical-isolated";
  const completionMode = args.completion ?? "full-gauntlet";
  const entryEconomy = args.entryEconomy ?? "clean";
  const requireTierEntrySnapshot = args.requireTierEntrySnapshot === "true";

  if (!Number.isInteger(count) || count < 1) throw new Error("--count must be a positive integer");
  if (!Number.isInteger(workerConcurrency) || workerConcurrency < 1 || workerConcurrency > 4) {
    throw new Error("--workers must be an integer from 1 to 4; 6/8-worker scaling is deferred");
  }
  if (!Number.isFinite(maxRunMs) || maxRunMs < 10_000) throw new Error("--maxRunMs must be at least 10000");
  if (!Number.isFinite(rewardMultiplier) || rewardMultiplier < 1 || rewardMultiplier > 1000) {
    throw new Error("--rewardMultiplier must be from 1 to 1000");
  }
  if (mode !== "canonical-isolated" && mode !== "smoke-isolated") {
    throw new Error("--mode must be canonical-isolated or smoke-isolated");
  }
  if (completionMode !== "full-gauntlet" && completionMode !== "next-tier") {
    throw new Error("--completion must be full-gauntlet or next-tier");
  }
  if (entryEconomy !== "clean" && entryEconomy !== "natural" && entryEconomy !== "catalyst-primed") {
    throw new Error("--entryEconomy must be clean, natural, or catalyst-primed");
  }
  if (requireTierEntrySnapshot && !args.tierEntrySnapshot && !args.tierEntrySnapshotDir) {
    throw new Error("--requireTierEntrySnapshot requires --tierEntrySnapshot or --tierEntrySnapshotDir");
  }
  if (mode === "canonical-isolated") {
    if (rewardMultiplier !== 1) throw new Error("canonical-isolated requires --rewardMultiplier=1");
    if (completionMode !== "full-gauntlet") throw new Error("canonical-isolated requires full-gauntlet completion");
    if (args.fastBossRetry === "true") throw new Error("canonical-isolated forbids fast boss retry");
    if (args.tierEntry) throw new Error("canonical-isolated forbids synthetic --tierEntry profiles");
    if (routes.some((route) => route.includes("-t2")) && !args.tierEntrySnapshot && !args.tierEntrySnapshotDir) {
      throw new Error("canonical Tier-2 routes require a real --tierEntrySnapshot or --tierEntrySnapshotDir");
    }
  }

  return {
    study,
    requestedRevision: args.revision,
    name: args.name ?? routes.join("-").slice(0, 30),
    routes,
    policies,
    count,
    workerConcurrency,
    maxRunMs,
    rewardMultiplier,
    mode,
    completionMode,
    entryEconomy,
    requireTierEntrySnapshot,
    fastBossRetry: args.fastBossRetry === "true",
    tierEntrySnapshot: args.tierEntrySnapshot,
    tierEntrySnapshotDir: args.tierEntrySnapshotDir,
  };
}

export function buildRunPlan(config, experimentId) {
  if (config.study) {
    const study = validateStudy(config.study);
    const runs = [];
    for (let replica = 1; replica <= config.count; replica++) {
      const offset = (replica - 1) % study.arms.length;
      const arms = [...study.arms.slice(offset), ...study.arms.slice(0, offset)];
      for (const arm of arms) {
        const [runState] = buildRunPlan({ ...config, study: undefined, count: 1, routes: [arm.route], policies: [arm.policy] }, experimentId);
        const order = runs.length + 1;
        runs.push({ ...runState, order, replica, armId: arm.id, pairId: 'r' + replica, choices: arm.choices,
          runKey: String(order).padStart(3, '0') + '-' + arm.id + '-r' + replica });
      }
    }
    return runs;
  }
  const runs = [];
  let order = 0;
  for (let replica = 1; replica <= config.count; replica += 1) {
    for (const routeId of config.routes) {
      for (const policyId of config.policies) {
        order += 1;
        const runKey = `${String(order).padStart(3, "0")}-${sanitizeId(routeId)}-${sanitizeId(policyId)}-r${String(replica).padStart(2, "0")}`;
        runs.push({
          runKey,
          order,
          routeId,
          policyId,
          replica,
          attempt: 1,
          status: "queued",
          workerSlot: null,
          containerName: null,
          containerId: null,
          gameDatabase: null,
          logDatabase: null,
          queuedAt: new Date().toISOString(),
          startedAt: null,
          endedAt: null,
          terminalReason: null,
          artifactDirectory: null,
          experimentId,
        });
      }
    }
  }
  return runs;
}

export function isTerminal(status) {
  return TERMINAL_STATES.has(status);
}

export function randomSecret() {
  return randomBytes(24).toString("hex");
}

export function copySnapshotInput(config, destinationRoot) {
  const source = config.tierEntrySnapshotDir ?? config.tierEntrySnapshot;
  if (!source) return null;
  const absolute = resolve(source);
  if (!existsSync(absolute)) throw new Error(`tier-entry snapshot input does not exist: ${absolute}`);
  const destination = join(destinationRoot, "inputs", "tier-entry");
  mkdirSync(dirname(destination), { recursive: true });
  if (config.tierEntrySnapshotDir) {
    cpSync(absolute, destination, { recursive: true, errorOnExist: true });
    return { kind: "directory", hostPath: destination, containerPath: "/inputs/tier-entry", sha256: hashTree(destination) };
  }
  mkdirSync(destination, { recursive: true });
  const target = join(destination, basename(absolute));
  cpSync(absolute, target, { errorOnExist: true });
  return { kind: "file", hostPath: target, containerPath: `/inputs/tier-entry/${basename(absolute)}`, sha256: sha256File(target) };
}

export function removeBuildDirectory(path) {
  if (!existsSync(path)) return;
  rmSync(path, { recursive: true, force: true });
}

export async function waitForContainerHealth(name, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = docker(["inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", name], { allowFailure: true });
    if (result.status === 0 && (result.stdout === "healthy" || result.stdout === "running")) return;
    await sleep(1_000);
  }
  throw new Error(`container ${name} did not become healthy within ${timeoutMs}ms`);
}

export async function ensureInfrastructure(manifest, secrets) {
  const { network, postgresContainer, postgresVolume, redisContainer } = manifest.infrastructure;
  if (!dockerObjectExists("network", network)) docker(["network", "create", network]);
  if (!dockerObjectExists("volume", postgresVolume)) docker(["volume", "create", postgresVolume]);

  if (!dockerObjectExists("container", postgresContainer)) {
    docker([
      "run", "-d", "--name", postgresContainer,
      "--label", `mmo.experiment.id=${manifest.experimentId}`,
      "--network", network, "--network-alias", "postgres",
      "--mount", `type=volume,source=${postgresVolume},target=/var/lib/postgresql/data`,
      "-e", `POSTGRES_PASSWORD=${secrets.postgresPassword}`,
      "-e", "POSTGRES_DB=postgres",
      "--health-cmd", "pg_isready -U postgres -d postgres",
      "--health-interval", "2s", "--health-timeout", "3s", "--health-retries", "30",
      manifest.infrastructure.postgresImage,
    ]);
  } else {
    docker(["start", postgresContainer], { allowFailure: true });
  }
  await waitForContainerHealth(postgresContainer);

  if (!dockerObjectExists("container", redisContainer)) {
    docker([
      "run", "-d", "--name", redisContainer,
      "--label", `mmo.experiment.id=${manifest.experimentId}`,
      "--network", network, "--network-alias", "redis",
      "--health-cmd", "redis-cli ping",
      "--health-interval", "2s", "--health-timeout", "3s", "--health-retries", "30",
      manifest.infrastructure.redisImage,
    ]);
  } else {
    docker(["start", redisContainer], { allowFailure: true });
  }
  await waitForContainerHealth(redisContainer);
}

export function stateCounts(state) {
  return state.runs.reduce((counts, runState) => {
    counts[runState.status] = (counts[runState.status] ?? 0) + 1;
    return counts;
  }, {});
}

// --- Shared run-scheduling primitives -------------------------------------
// Used by both the single-experiment supervisor (scripts/experiment/supervisor.mjs)
// and the cross-cohort queue controller (scripts/experiment/queue.mjs) so the two
// never diverge on how a run is started, reconciled, or finalized.

export function shortHash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function databaseNames(manifest, runState) {
  const key = shortHash(`${manifest.experimentId}:${runState.runKey}:${runState.attempt}`);
  return { game: `g_${key}`, log: `l_${key}` };
}

export function execPsql(manifest, sql) {
  docker([
    "exec", manifest.infrastructure.postgresContainer,
    "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", sql,
  ]);
}

export function provisionDatabases(manifest, names) {
  for (const name of [names.game, names.log]) {
    execPsql(manifest, `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    execPsql(manifest, `CREATE DATABASE ${name}`);
  }
}

export function workerContainerName(manifest, runState) {
  const prefix = manifest.infrastructure.prefix;
  return `${prefix}-w${String(runState.workerSlot).padStart(2, "0")}-${shortHash(runState.runKey).slice(0, 8)}`;
}

export function workerContainerState(name) {
  const inspected = docker(["inspect", "--format", "{{json .State}}", name], { allowFailure: true });
  if (inspected.status !== 0) return null;
  try { return JSON.parse(inspected.stdout); } catch { return null; }
}

export function makeCharacterName(runState) {
  return `Bot ${runState.routeId} ${runState.replica}`.replace(/[^\p{L}\p{N} '-]/gu, "-").slice(0, 24);
}

export function dockerMount(source, target, readonly = false) {
  return `type=bind,source=${resolve(source)},target=${target}${readonly ? ",readonly" : ""}`;
}

export function writeRunConfig(manifest, secrets, runState, runDirectory) {
  const encodedPassword = encodeURIComponent(secrets.postgresPassword);
  const snapshot = manifest.inputs?.tierEntrySnapshot ?? null;
  const runConfig = {
    schemaVersion: 1,
    experimentId: manifest.experimentId,
    runKey: runState.runKey,
    routeId: runState.routeId,
    policyId: runState.policyId,
    choices: runState.choices ?? {},
    replica: runState.replica,
    maxRunMs: manifest.config.maxRunMs,
    mode: manifest.config.mode,
    rewardMultiplier: manifest.config.rewardMultiplier,
    completionMode: manifest.config.completionMode,
    entryEconomy: manifest.config.entryEconomy ?? "clean",
    requireTierEntrySnapshot: manifest.config.requireTierEntrySnapshot === true,
    fastBossRetry: manifest.config.fastBossRetry,
    accountId: `bot-exp-${shortHash(`${manifest.experimentId}:${runState.runKey}`)}`,
    characterName: makeCharacterName(runState),
    databaseUrl: `postgresql://postgres:${encodedPassword}@postgres:5432/${runState.gameDatabase}`,
    logDatabaseUrl: `postgresql://postgres:${encodedPassword}@postgres:5432/${runState.logDatabase}`,
    redisUrl: "redis://redis:6379",
    redisChannelPrefix: `${manifest.experimentId}:${runState.runKey}`,
    gitRevision: manifest.source.gitRevision,
    sourceTree: manifest.source.sourceTree,
    buildId: manifest.build.buildId,
    tierEntrySnapshotPath: snapshot?.kind === "file" ? snapshot.containerPath : null,
    tierEntrySnapshotDir: snapshot?.kind === "directory" ? snapshot.containerPath : null,
  };
  writeJsonAtomic(join(runDirectory, "run-config.json"), runConfig);
}

export function translateSummaryPath(experimentDirectory, runState, containerPath) {
  if (!containerPath || !containerPath.startsWith("/experiment/")) return null;
  return join(experimentDirectory, "runs", runState.runKey, containerPath.slice("/experiment/".length));
}

/**
 * context: { experimentDirectory, manifest, secrets }
 * Mutates runState in place (status/timestamps/container identity), same as the
 * pre-refactor inline supervisor implementation.
 */
export function startWorkerRun(context, runState, slot, emit = () => {}) {
  const { experimentDirectory, manifest, secrets } = context;
  runState.workerSlot = slot;
  runState.status = "starting";
  runState.startedAt = new Date().toISOString();
  const names = databaseNames(manifest, runState);
  runState.gameDatabase = names.game;
  runState.logDatabase = names.log;
  const runDirectory = join(experimentDirectory, "runs", runState.runKey);
  mkdirSync(runDirectory, { recursive: true });
  runState.artifactDirectory = join(runDirectory, "artifacts");
  emit("run-starting", { experimentId: manifest.experimentId, runKey: runState.runKey, workerSlot: slot });

  provisionDatabases(manifest, names);
  writeRunConfig(manifest, secrets, runState, runDirectory);
  const name = workerContainerName(manifest, runState);
  runState.containerName = name;
  const args = [
    "run", "-d", "--init", "--name", name,
    "--label", `mmo.experiment.id=${manifest.experimentId}`,
    "--label", `mmo.experiment.run=${runState.runKey}`,
    "--label", `mmo.experiment.worker=${slot}`,
    "--network", manifest.infrastructure.network,
    "--memory", manifest.config.workerMemoryLimit,
    "--mount", dockerMount(runDirectory, "/experiment"),
  ];
  const snapshot = manifest.inputs?.tierEntrySnapshot;
  if (snapshot) {
    const source = snapshot.kind === "directory" ? snapshot.hostPath : dirname(snapshot.hostPath);
    args.push("--mount", dockerMount(source, "/inputs/tier-entry", true));
  }
  args.push(manifest.build.imageId);
  const launched = docker(args);
  runState.containerId = launched.stdout;
  runState.status = "running";
  emit("run-running", { experimentId: manifest.experimentId, runKey: runState.runKey, workerSlot: slot, containerId: launched.stdout });
}

/** Adopts an already-running container for a run whose state.json still says "queued"
 * or "starting" after a controller crash/restart, instead of starting a duplicate. */
export function adoptRunningWorker(context, runState, slot) {
  const { manifest } = context;
  runState.workerSlot = slot;
  runState.containerName = workerContainerName(manifest, runState);
  const names = databaseNames(manifest, runState);
  runState.gameDatabase = names.game;
  runState.logDatabase = names.log;
  runState.artifactDirectory = join(context.experimentDirectory, "runs", runState.runKey, "artifacts");
  runState.status = "running";
}

export function finalizeWorkerRun(context, runState, fallbackReason = null, emit = () => {}) {
  const { experimentDirectory, manifest } = context;
  const runDirectory = join(experimentDirectory, "runs", runState.runKey);
  const resultPath = join(runDirectory, "worker-result.json");
  let result = null;
  if (existsSync(resultPath)) {
    try { result = readJson(resultPath); } catch { result = null; }
  }
  runState.status = result?.status === "completed"
    ? "completed"
    : result?.status === "timed_out"
      ? "timed_out"
      : result?.status === "cancelled"
        ? "cancelled"
        : "failed";
  runState.terminalReason = result?.reason ?? fallbackReason ?? "worker_exited_without_terminal_result";
  runState.endedAt = result?.endedAt ?? new Date().toISOString();
  runState.summaryPath = translateSummaryPath(experimentDirectory, runState, result?.summaryPath);
  runState.workerSlot = null;
  emit("run-terminal", { experimentId: manifest.experimentId, runKey: runState.runKey, status: runState.status, reason: runState.terminalReason });
  if (runState.containerName) docker(["rm", runState.containerName], { allowFailure: true });
}

export function heartbeatStale(experimentDirectory, runState) {
  if (!runState.startedAt || Date.now() - Date.parse(runState.startedAt) < 120_000) return false;
  const heartbeatPath = join(experimentDirectory, "runs", runState.runKey, "worker-heartbeat.json");
  if (!existsSync(heartbeatPath)) return true;
  return Date.now() - statSync(heartbeatPath).mtimeMs > 45_000;
}

export function activeRuns(state) {
  return state.runs.filter((runState) => runState.status === "starting" || runState.status === "running");
}

export function availableSlot(state, maxSlots) {
  const used = new Set(activeRuns(state).map((runState) => runState.workerSlot));
  for (let slot = 1; slot <= maxSlots; slot += 1) {
    if (!used.has(slot)) return slot;
  }
  return null;
}

/** context: { experimentDirectory, manifest } */
export async function reconcileExperiment(context, state, emit = () => {}) {
  for (const runState of activeRuns(state)) {
    const container = runState.containerName ? workerContainerState(runState.containerName) : null;
    if (!container || container.Status === "exited" || container.Status === "dead") {
      finalizeWorkerRun(context, runState, "worker_container_exited", emit);
      continue;
    }
    if (heartbeatStale(context.experimentDirectory, runState)) {
      emit("worker-unresponsive", { experimentId: context.manifest.experimentId, runKey: runState.runKey, containerName: runState.containerName });
      docker(["stop", "--time", "15", runState.containerName], { allowFailure: true });
      finalizeWorkerRun(context, runState, "worker_unresponsive", emit);
    }
  }
}

export function cancelQueuedRuns(state, reason = "user_cancelled_before_start") {
  for (const runState of state.runs) {
    if (runState.status === "queued") {
      runState.status = "cancelled";
      runState.endedAt = new Date().toISOString();
      runState.terminalReason = reason;
    }
  }
}

// --- Cross-cohort queue registry --------------------------------------------
// A durable, restart-safe record of which experiment manifests are managed by
// the global queue controller (scripts/experiment/queue.mjs). Per-run status
// remains the source of truth in each experiment's own state.json; this
// registry only tracks manifest-level lifecycle (not-started vs active vs done)
// so multiple cohorts can be enumerated and scheduled together.

export const QUEUE_ENTRY_STATES = new Set(["queued", "active", "done"]);

export function queueRegistryPath(root) {
  return join(root, "queue.json");
}

export function loadQueueRegistry(root) {
  const path = queueRegistryPath(root);
  if (!existsSync(path)) {
    return {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      maxWorkers: 4,
      entries: [],
    };
  }
  return readJson(path);
}

export function saveQueueRegistry(root, registry) {
  registry.updatedAt = new Date().toISOString();
  writeJsonAtomic(queueRegistryPath(root), registry);
}

/** Adds experiment ids to the registry in the given order, skipping ids already
 * present (idempotent — safe to call again on resume). Returns the ids actually added. */
export function addQueueEntries(registry, experimentIds) {
  const existingIds = new Set(registry.entries.map((entry) => entry.experimentId));
  const added = [];
  for (const experimentId of experimentIds) {
    if (existingIds.has(experimentId)) continue;
    registry.entries.push({
      experimentId,
      registeredAt: new Date().toISOString(),
      status: "queued",
      infraReady: false,
    });
    existingIds.add(experimentId);
    added.push(experimentId);
  }
  return added;
}

export function markQueueEntryStatus(registry, experimentId, status) {
  if (!QUEUE_ENTRY_STATES.has(status)) throw new Error(`unknown queue entry status: ${status}`);
  const entry = registry.entries.find((item) => item.experimentId === experimentId);
  if (entry) entry.status = status;
  return entry;
}

/** states: [{ experimentId, state }] in registration order. Counts runs with
 * status "starting" or "running" across every managed experiment. */
export function globalActiveRunCount(states) {
  let count = 0;
  for (const { state } of states) count += activeRuns(state).length;
  return count;
}

export function availableGlobalSlot(states, maxWorkers) {
  const used = new Set();
  for (const { state } of states) {
    for (const runState of activeRuns(state)) used.add(runState.workerSlot);
  }
  for (let slot = 1; slot <= maxWorkers; slot += 1) {
    if (!used.has(slot)) return slot;
  }
  return null;
}

/** Picks the next queued run in registration order (experiment order, then run
 * order within an experiment). This is the single place that decides scheduling
 * fairness across cohorts, so it is unit-testable without Docker. */
export function selectNextQueuedRunAcross(states) {
  for (const entry of states) {
    const next = entry.state.runs.find((runState) => runState.status === "queued");
    if (next) return { experimentId: entry.experimentId, runState: next };
  }
  return null;
}

export function allExperimentsTerminal(states) {
  return states.every(({ state }) => state.runs.every((runState) => isTerminal(runState.status)));
}
