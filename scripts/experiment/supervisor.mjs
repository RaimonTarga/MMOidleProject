import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { releaseInfrastructure } from "./release.mjs";
import {
  activeRuns,
  adoptRunningWorker,
  appendJsonl,
  availableSlot,
  cancelQueuedRuns,
  docker,
  ensureInfrastructure,
  isTerminal,
  readJson,
  reconcileExperiment,
  sha256File,
  sleep,
  startWorkerRun,
  workerContainerName,
  workerContainerState,
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
const context = { experimentDirectory, manifest, secrets };

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

function cancelAll(state) {
  cancelQueuedRuns(state);
  for (const runState of activeRuns(state)) {
    if (runState.containerName) docker(["stop", "--time", "15", runState.containerName], { allowFailure: true });
  }
  saveState(state);
}

/** On restart after a crash mid-launch, a run may already have a live container
 * even though state.json still shows it "queued"/"starting". Adopt it instead of
 * starting a duplicate for the same runKey. */
function adoptOrphanedContainers(state) {
  for (const runState of state.runs) {
    if (runState.status !== "queued" && runState.status !== "starting") continue;
    const slot = runState.workerSlot ?? null;
    const probeSlot = slot ?? null;
    if (probeSlot == null) continue;
    const name = workerContainerName(manifest, { ...runState, workerSlot: probeSlot });
    const container = workerContainerState(name);
    if (container && container.Status !== "exited" && container.Status !== "dead") {
      adoptRunningWorker(context, runState, probeSlot);
      event("run-adopted", { runKey: runState.runKey, workerSlot: probeSlot, containerName: name });
    }
  }
}

async function main() {
  writeFileSync(join(experimentDirectory, "supervisor.pid"), `${process.pid}\n`, "utf8");
  event("supervisor-started", { pid: process.pid });
  await ensureInfrastructure(manifest, secrets);
  let state = readState();
  adoptOrphanedContainers(state);
  state.supervisor = { pid: process.pid, startedAt: new Date().toISOString(), status: "running" };
  saveState(state);

  while (true) {
    state = readState();
    await reconcileExperiment(context, state, event);
    saveState(state);

    if (existsSync(stopRequestPath)) {
      event("stop-requested");
      cancelAll(state);
    } else {
      let slot = availableSlot(state, manifest.config.workerConcurrency);
      while (slot !== null) {
        const next = state.runs.find((runState) => runState.status === "queued");
        if (!next) break;
        try {
          startWorkerRun(context, next, slot, event);
          saveState(state);
        } catch (error) {
          next.status = "failed";
          next.terminalReason = `worker_start_failed: ${error instanceof Error ? error.message : String(error)}`;
          next.endedAt = new Date().toISOString();
          next.workerSlot = null;
          saveState(state);
          event("run-terminal", { runKey: next.runKey, status: "failed", reason: next.terminalReason });
        }
        slot = availableSlot(state, manifest.config.workerConcurrency);
      }
    }

    if (state.runs.every((runState) => isTerminal(runState.status))) {
      state.supervisor = { ...state.supervisor, status: "completed", endedAt: new Date().toISOString() };
      saveState(state);
      event("supervisor-completed");
      try {
        event("infrastructure-release", releaseInfrastructure(manifest, state, experimentDirectory));
      } catch (error) {
        // Gameplay finalization stays terminal even if Docker cleanup needs help.
        event("infrastructure-release-failed", { error: String(error) });
        console.error(`[experiment] runtime release failed: ${error}`);
      }
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
