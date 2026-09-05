import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import {
  appendJsonl,
  docker,
  ensureInfrastructure,
  isTerminal,
  readJson,
  sha256File,
  sleep,
  writeJsonAtomic,
} from "./lib.mjs";

const parsed = Object.fromEntries(
  process.argv.slice(2).filter((arg) => arg.startsWith("--") && arg.includes("="))
    .map((arg) => [arg.slice(2, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)]),
);
const experimentDirectory = resolve(parsed.experimentDir ?? process.cwd());
const manifestPath = join(experimentDirectory, "experiment.json");
const statePath = join(experimentDirectory, "state.json");
const eventsPath = join(experimentDirectory, "supervisor-events.jsonl");
const stopRequestPath = join(experimentDirectory, "stop.request");
const manifest = readJson(manifestPath);
const secrets = readJson(join(experimentDirectory, "runtime-secrets.json"));

const expectedManifestHash = readFileSync(join(experimentDirectory, "experiment.sha256"), "utf8").trim();
const actualManifestHash = sha256File(manifestPath);
if (actualManifestHash !== expectedManifestHash) {
  throw new Error(
    `frozen experiment manifest changed: expected ${expectedManifestHash}, observed ${actualManifestHash}`,
  );
}

function event(kind, detail = {}) {
  appendJsonl(eventsPath, { at: new Date().toISOString(), kind, ...detail });
}

function readState() {
  return readJson(statePath);
}

function saveState(state) {
  state.updatedAt = new Date().toISOString();
  writeJsonAtomic(statePath, state);
}

function shortHash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function databaseNames(runState) {
  const key = shortHash(`${manifest.experimentId}:${runState.runKey}:${runState.attempt}`);
  return { game: `g_${key}`, log: `l_${key}` };
}

function execPsql(sql) {
  docker([
    "exec", manifest.infrastructure.postgresContainer,
    "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", sql,
  ]);
}

function provisionDatabases(names) {
  for (const name of [names.game, names.log]) {
    execPsql(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    execPsql(`CREATE DATABASE ${name}`);
  }
}

function workerName(runState) {
  const prefix = manifest.infrastructure.prefix;
  return `${prefix}-w${String(runState.workerSlot).padStart(2, "0")}-${shortHash(runState.runKey).slice(0, 8)}`;
}

function workerContainerState(name) {
  const inspected = docker([
    "inspect", "--format", "{{json .State}}", name,
  ], { allowFailure: true });
  if (inspected.status !== 0) return null;
  try { return JSON.parse(inspected.stdout); } catch { return null; }
}

function makeCharacterName(runState) {
  return `Bot ${runState.routeId} ${runState.replica}`.replace(/[^\p{L}\p{N} '-]/gu, "-").slice(0, 24);
}

function writeRunConfig(runState, runDirectory) {
  const encodedPassword = encodeURIComponent(secrets.postgresPassword);
  const snapshot = manifest.inputs?.tierEntrySnapshot ?? null;
  const runConfig = {
    schemaVersion: 1,
    experimentId: manifest.experimentId,
    runKey: runState.runKey,
    routeId: runState.routeId,
    policyId: runState.policyId,
    replica: runState.replica,
    maxRunMs: manifest.config.maxRunMs,
    mode: manifest.config.mode,
    rewardMultiplier: manifest.config.rewardMultiplier,
    completionMode: manifest.config.completionMode,
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

function dockerMount(source, target, readonly = false) {
  return `type=bind,source=${resolve(source)},target=${target}${readonly ? ",readonly" : ""}`;
}

function startWorker(state, runState, slot) {
  runState.workerSlot = slot;
  runState.status = "starting";
  runState.startedAt = new Date().toISOString();
  const names = databaseNames(runState);
  runState.gameDatabase = names.game;
  runState.logDatabase = names.log;
  const runDirectory = join(experimentDirectory, "runs", runState.runKey);
  mkdirSync(runDirectory, { recursive: true });
  runState.artifactDirectory = join(runDirectory, "artifacts");
  saveState(state);
  event("run-starting", { runKey: runState.runKey, workerSlot: slot });

  provisionDatabases(names);
  writeRunConfig(runState, runDirectory);
  const name = workerName(runState);
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
  saveState(state);
  event("run-running", { runKey: runState.runKey, workerSlot: slot, containerId: launched.stdout });
}

function translateSummaryPath(runState, containerPath) {
  if (!containerPath || !containerPath.startsWith("/experiment/")) return null;
  return join(experimentDirectory, "runs", runState.runKey, containerPath.slice("/experiment/".length));
}

function finalizeRun(state, runState, fallbackReason = null) {
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
  runState.summaryPath = translateSummaryPath(runState, result?.summaryPath);
  runState.workerSlot = null;
  saveState(state);
  event("run-terminal", {
    runKey: runState.runKey,
    status: runState.status,
    reason: runState.terminalReason,
  });
  if (runState.containerName) docker(["rm", runState.containerName], { allowFailure: true });
}

function activeRuns(state) {
  return state.runs.filter((runState) => runState.status === "starting" || runState.status === "running");
}

function availableSlot(state) {
  const used = new Set(activeRuns(state).map((runState) => runState.workerSlot));
  for (let slot = 1; slot <= manifest.config.workerConcurrency; slot += 1) {
    if (!used.has(slot)) return slot;
  }
  return null;
}

function heartbeatStale(runState) {
  if (!runState.startedAt || Date.now() - Date.parse(runState.startedAt) < 120_000) return false;
  const heartbeatPath = join(experimentDirectory, "runs", runState.runKey, "worker-heartbeat.json");
  if (!existsSync(heartbeatPath)) return true;
  return Date.now() - statSync(heartbeatPath).mtimeMs > 45_000;
}

function cancelAll(state) {
  for (const runState of state.runs) {
    if (runState.status === "queued") {
      runState.status = "cancelled";
      runState.endedAt = new Date().toISOString();
      runState.terminalReason = "user_cancelled_before_start";
    } else if (runState.status === "starting" || runState.status === "running") {
      if (runState.containerName) docker(["stop", "--time", "15", runState.containerName], { allowFailure: true });
    }
  }
  saveState(state);
}

async function reconcile(state) {
  for (const runState of activeRuns(state)) {
    const container = runState.containerName ? workerContainerState(runState.containerName) : null;
    if (!container || container.Status === "exited" || container.Status === "dead") {
      finalizeRun(state, runState, "worker_container_exited");
      continue;
    }
    if (heartbeatStale(runState)) {
      event("worker-unresponsive", { runKey: runState.runKey, containerName: runState.containerName });
      docker(["stop", "--time", "15", runState.containerName], { allowFailure: true });
      finalizeRun(state, runState, "worker_unresponsive");
    }
  }
}

async function main() {
  writeFileSync(join(experimentDirectory, "supervisor.pid"), `${process.pid}\n`, "utf8");
  event("supervisor-started", { pid: process.pid });
  await ensureInfrastructure(manifest, secrets);
  let state = readState();
  state.supervisor = { pid: process.pid, startedAt: new Date().toISOString(), status: "running" };
  saveState(state);

  while (true) {
    state = readState();
    await reconcile(state);

    if (existsSync(stopRequestPath)) {
      event("stop-requested");
      cancelAll(state);
    } else {
      let slot = availableSlot(state);
      while (slot !== null) {
        const next = state.runs.find((runState) => runState.status === "queued");
        if (!next) break;
        try {
          startWorker(state, next, slot);
        } catch (error) {
          next.status = "failed";
          next.terminalReason = `worker_start_failed: ${error instanceof Error ? error.message : String(error)}`;
          next.endedAt = new Date().toISOString();
          next.workerSlot = null;
          saveState(state);
          event("run-terminal", { runKey: next.runKey, status: "failed", reason: next.terminalReason });
        }
        slot = availableSlot(state);
      }
    }

    if (state.runs.every((runState) => isTerminal(runState.status))) {
      state.supervisor = { ...state.supervisor, status: "completed", endedAt: new Date().toISOString() };
      saveState(state);
      event("supervisor-completed");
      return;
    }
    await sleep(2_000);
  }
}

main().catch((error) => {
  event("supervisor-fatal", { error: error instanceof Error ? error.stack ?? error.message : String(error) });
  const state = readState();
  state.supervisor = {
    ...(state.supervisor ?? {}),
    status: "failed",
    endedAt: new Date().toISOString(),
    reason: error instanceof Error ? error.message : String(error),
  };
  saveState(state);
  console.error(error);
  process.exitCode = 1;
});
