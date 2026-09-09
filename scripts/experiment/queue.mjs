// Cross-cohort queue controller.
//
// Individual experiment manifests (created by `experiment:create`) each own a
// self-contained docker network/postgres/redis and, when launched via
// `experiment:launch`, a per-experiment supervisor that fills its own
// 1..workerConcurrency worker slots from its own run queue. That per-experiment
// model has no notion of a budget shared *across* manifests: launching several
// cohorts back to back can happily spin up far more than 4 concurrent worker
// containers, and nothing ever comes back to start a manifest nobody got around
// to launching. That gap is what stranded 172 queued runs across 17 manifests.
//
// This controller adds the missing layer: a durable registry of managed
// experiment ids (queue.json) plus one long-lived process that reconciles every
// managed experiment's own state.json (still the source of truth for run
// status) and starts the next queued run *anywhere in the registry* whenever
// the combined number of active (starting/running) runs across all managed
// experiments is below --maxWorkers. Restarting the controller is safe: it
// only ever starts runs whose status is still "queued", and adopts containers
// that are already live for a run instead of starting a duplicate.
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  activeRuns,
  addQueueEntries,
  adoptRunningWorker,
  appendJsonl,
  availableGlobalSlot,
  cancelQueuedRuns,
  defaultExperimentRoot,
  docker,
  ensureInfrastructure,
  experimentDir,
  loadExperiment,
  loadQueueRegistry,
  markQueueEntryStatus,
  parseArgs,
  reconcileExperiment,
  saveQueueRegistry,
  selectNextQueuedRunAcross,
  sleep,
  startWorkerRun,
  workerContainerName,
  workerContainerState,
  writeJsonAtomic,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root ?? defaultExperimentRoot());
const maxWorkers = Number(args.maxWorkers ?? "4");
if (!Number.isInteger(maxWorkers) || maxWorkers < 1 || maxWorkers > 4) {
  throw new Error("--maxWorkers must be an integer from 1 to 4");
}

const eventsPath = join(root, "queue-events.jsonl");
const stopRequestPath = join(root, "queue-stop.request");

function event(kind, detail = {}) {
  appendJsonl(eventsPath, { at: new Date().toISOString(), kind, ...detail });
}

function loadEntryContext(experimentId) {
  const { dir, manifest, secrets } = loadExperiment(root, experimentId);
  return { experimentDirectory: dir, manifest, secrets };
}

function loadEntryState(experimentId) {
  return JSON.parse(readFileSync(join(experimentDir(root, experimentId), "state.json"), "utf8"));
}

function saveEntryState(experimentId, state) {
  state.updatedAt = new Date().toISOString();
  writeJsonAtomic(join(experimentDir(root, experimentId), "state.json"), state);
}

/** Mirrors supervisor.mjs's orphan-adoption: if a run still shows queued/starting
 * but its container is already alive (controller crashed after docker run but
 * before the state.json write landed), adopt it rather than starting a second one. */
function adoptOrphanedContainers(context, state) {
  for (const runState of state.runs) {
    if (runState.status !== "queued" && runState.status !== "starting") continue;
    if (runState.workerSlot == null) continue;
    const name = workerContainerName(context.manifest, runState);
    const container = workerContainerState(name);
    if (container && container.Status !== "exited" && container.Status !== "dead") {
      adoptRunningWorker(context, runState, runState.workerSlot);
      event("run-adopted", { experimentId: context.manifest.experimentId, runKey: runState.runKey, workerSlot: runState.workerSlot });
    }
  }
}

function cancelEntry(context, state) {
  cancelQueuedRuns(state);
  for (const runState of activeRuns(state)) {
    if (runState.containerName) docker(["stop", "--time", "15", runState.containerName], { allowFailure: true });
  }
}

async function main() {
  writeFileSync(join(root, "queue.pid"), `${process.pid}\n`, "utf8");
  event("queue-started", { pid: process.pid, maxWorkers });

  while (true) {
    const registry = loadQueueRegistry(root);
    const managed = registry.entries.filter((entry) => entry.status !== "done");
    const loaded = [];
    for (const entry of managed) {
      const context = loadEntryContext(entry.experimentId);
      let state = loadEntryState(entry.experimentId);
      if (!entry.infraReady) {
        await ensureInfrastructure(context.manifest, context.secrets);
        entry.infraReady = true;
      }
      adoptOrphanedContainers(context, state);
      await reconcileExperiment(context, state, event);
      saveEntryState(entry.experimentId, state);
      loaded.push({ experimentId: entry.experimentId, entry, context, state });
    }

    if (existsSync(stopRequestPath)) {
      event("stop-requested");
      for (const { experimentId, context, state } of loaded) {
        cancelEntry(context, state);
        saveEntryState(experimentId, state);
      }
    } else {
      let slot = availableGlobalSlot(loaded, maxWorkers);
      while (slot !== null) {
        const picked = selectNextQueuedRunAcross(loaded);
        if (!picked) break;
        const target = loaded.find((item) => item.experimentId === picked.experimentId);
        try {
          startWorkerRun(target.context, picked.runState, slot, event);
          target.entry.status = "active";
          saveEntryState(target.experimentId, target.state);
        } catch (error) {
          picked.runState.status = "failed";
          picked.runState.terminalReason = `worker_start_failed: ${error instanceof Error ? error.message : String(error)}`;
          picked.runState.endedAt = new Date().toISOString();
          picked.runState.workerSlot = null;
          saveEntryState(target.experimentId, target.state);
          event("run-terminal", { experimentId: target.experimentId, runKey: picked.runState.runKey, status: "failed", reason: picked.runState.terminalReason });
        }
        slot = availableGlobalSlot(loaded, maxWorkers);
      }
    }

    for (const { experimentId, entry, state } of loaded) {
      const allTerminal = state.runs.every((runState) =>
        ["completed", "failed", "timed_out", "cancelled"].includes(runState.status));
      if (allTerminal) {
        entry.status = "done";
        event("experiment-done", { experimentId });
      } else if (entry.status === "queued" && activeRuns(state).length > 0) {
        entry.status = "active";
      }
    }
    saveQueueRegistry(root, registry);

    const stillManaged = registry.entries.some((entry) => entry.status !== "done");
    if (!stillManaged) {
      event("queue-completed");
      return;
    }
    await sleep(2_000);
  }
}

function addCommand() {
  const ids = [
    ...(args.id ? [args.id] : []),
    ...(args.ids ? String(args.ids).split(",").map((value) => value.trim()).filter(Boolean) : []),
  ];
  if (ids.length === 0) throw new Error("--id=<experimentId> or --ids=<a,b,c> is required");
  for (const id of ids) {
    if (!existsSync(experimentDir(root, id))) throw new Error(`no such experiment: ${id}`);
  }
  const registry = loadQueueRegistry(root);
  if (args.maxWorkers) registry.maxWorkers = maxWorkers;
  const added = addQueueEntries(registry, ids);
  saveQueueRegistry(root, registry);
  console.log(`[queue] registered ${added.length} experiment(s): ${added.join(", ") || "(none new)"}`);
  console.log(`[queue] total managed: ${registry.entries.length}`);
}

if (process.argv[2] === "add") {
  addCommand();
} else {
  main().catch((error) => {
    event("queue-fatal", { error: error instanceof Error ? error.stack ?? error.message : String(error) });
    console.error(error);
    process.exitCode = 1;
  });
}
