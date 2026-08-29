import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  buildConfig,
  assertFastRetryBatchSafety,
  controlledBatchSettings,
  normalizeOutDir,
  parseArgs,
  sanitizeCharacterName,
  type BotConfig,
} from "./config";
import { runBot, type RunOutcome } from "./botRun";
import { AreaLeaseManager, type ControlledExecutionMode } from "./concurrency/areaLeaseManager";
import { RouteLeaseSession } from "./concurrency/routeLeaseSession";
import { BotConnection } from "./net/connection";
import { Intents } from "./net/intents";
import {
  T1_CONTROLLED_ROUTE_IDS,
  isT1ControlledRouteId,
} from "./routes";
import { startDashboardOrWarn } from "./ui/server";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ManifestStatus =
  | "pending"
  | "running"
  | "completed"
  | "stalled"
  | "watchdog_timeout"
  | "failed_harness";

interface BatchManifestEntry {
  routeId: string;
  order: number;
  status: ManifestStatus;
  runId: string | null;
  startTime: string | null;
  endTime: string | null;
  terminalReason: string | null;
  artifactDirectory: string | null;
}

interface BatchManifest {
  batchId: string;
  createdAt: string;
  updatedAt: string;
  controlled: boolean;
  executionMode: ControlledExecutionMode;
  maxConcurrency: number;
  rewardMultiplier: number;
  maxRunMs: number;
  routes: BatchManifestEntry[];
}

function writeManifest(path: string, manifest: BatchManifest): void {
  manifest.updatedAt = new Date().toISOString();
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function manifestStatusFor(summary: RunOutcome["summary"]): ManifestStatus {
  if (summary.run.completion === "completed") return "completed";
  if (summary.run.completion === "stalled") return "stalled";
  if (summary.run.completion === "timed-out") return "watchdog_timeout";
  return "failed_harness";
}

function terminalArtifactExists(entry: BatchManifestEntry): boolean {
  return entry.artifactDirectory !== null && existsSync(join(entry.artifactDirectory, "summary.json"));
}

function loadOrCreateManifest(
  manifestPath: string,
  outDir: string,
  routes: string[],
  maxRunMs: number,
  executionMode: ControlledExecutionMode,
  maxConcurrency: number,
): BatchManifest {
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BatchManifest;
    if (
      manifest.controlled !== true ||
      manifest.executionMode !== executionMode ||
      manifest.maxConcurrency !== maxConcurrency ||
      manifest.rewardMultiplier !== 25 ||
      JSON.stringify(manifest.routes.map((entry) => entry.routeId)) !== JSON.stringify(routes)
    ) {
      throw new Error(`existing manifest does not match the requested clean controlled batch: ${manifestPath}`);
    }

    for (const entry of manifest.routes) {
      if (entry.status === "running") {
        // A process interruption may leave a run marked running. Preserve any
        // complete artifact; otherwise make only that route resumable.
        if (terminalArtifactExists(entry)) {
          const summary = JSON.parse(readFileSync(join(entry.artifactDirectory!, "summary.json"), "utf8")) as RunOutcome["summary"];
          entry.status = manifestStatusFor(summary);
          entry.terminalReason = summary.run.stallReason ?? summary.run.completion;
          entry.endTime = summary.run.endedAt ? new Date(summary.run.endedAt).toISOString() : entry.endTime;
        } else {
          entry.status = "pending";
          entry.terminalReason = "previous session interrupted before a terminal artifact was written";
          entry.runId = null;
          entry.startTime = null;
          entry.endTime = null;
          entry.artifactDirectory = null;
        }
      }
      if (entry.status !== "pending" && !terminalArtifactExists(entry)) {
        throw new Error(
          `terminal manifest entry has no usable summary; refusing an automatic rerun: ${entry.routeId}`,
        );
      }
    }
    writeManifest(manifestPath, manifest);
    return manifest;
  }

  mkdirSync(outDir, { recursive: true });
  const now = new Date().toISOString();
  const batchId = `batch-${now.replace(/[:.]/g, "-")}`;
  const manifest: BatchManifest = {
    batchId,
    createdAt: now,
    updatedAt: now,
    controlled: true,
    executionMode,
    maxConcurrency,
    rewardMultiplier: 25,
    maxRunMs,
    routes: routes.map((routeId, i) => ({
      routeId,
      order: i + 1,
      status: "pending",
      runId: null,
      startTime: null,
      endTime: null,
      terminalReason: null,
      artifactDirectory: null,
    })),
  };
  writeManifest(manifestPath, manifest);
  return manifest;
}

/**
 * Batch runner. Its default mode is the clean T1 controlled cohort: exactly
 * the eight registered routes, one intended-policy run each, awaited one at a
 * time. This prevents shared-world combat/reward contamination by construction.
 *
 * Isolated controlled concurrency is opt-in with
 * `--executionMode=isolated-parallel`; the default remains sequential.
 *
 *   pnpm bot:batch
 *   pnpm bot:batch -- --controlled=false --routes=striker-v2-t1 --parallel=true
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const controlled = args.controlled !== "false";
  const routes = (args.routes ?? T1_CONTROLLED_ROUTE_IDS.join(",")).split(",").filter(Boolean);
  const policies = (args.policies ?? "intended").split(",").filter(Boolean);
  const count = Number(args.count ?? "1");
  const outDir = normalizeOutDir(args.out ?? "runs");
  const parallel = args.parallel === "true";
  const controlledSettings = controlled
    ? controlledBatchSettings(args)
    : {
        executionMode: "sequential" as const,
        maxConcurrency: 1,
        staggerMs: Number(args.staggerMs ?? "0"),
      };
  const controlledExecutionMode = controlledSettings.executionMode;
  const maxConcurrency = controlledSettings.maxConcurrency;
  const staggerMs = controlledSettings.staggerMs;
  assertFastRetryBatchSafety(args, controlled);

  if (controlled) {
    const excluded = routes.filter((routeId) => !isT1ControlledRouteId(routeId));
    if (excluded.length > 0) {
      throw new Error(
        `controlled T1 batch rejects historical/experimental routes: ${excluded.join(", ")}; ` +
          "use --controlled=false for an explicit exploratory batch",
      );
    }
    if (policies.length !== 1 || policies[0] !== "intended") {
      throw new Error("controlled T1 batch requires exactly --policies=intended");
    }
    if (count !== 1) throw new Error("controlled T1 batch requires --count=1");
  }

  if (routes.length === 0) throw new Error("batch has no routes");
  if (!Number.isInteger(count) || count < 1) throw new Error("--count must be a positive integer");

  const effectiveArgs = {
    ...args,
    ...(controlled && args.rewardMultiplier === undefined ? { rewardMultiplier: "25" } : {}),
    // A generous but finite per-run harness watchdog. Gameplay failure still
    // resolves through the route's own step/attempt stall policies first.
    ...(controlled && args.maxRunMs === undefined
      ? { maxRunMs: String(6 * 60 * 60 * 1000) }
      : {}),
  };

  const maxRunMs = Number(effectiveArgs.maxRunMs);
  const manifestPath = resolve(args.manifest ?? join(outDir, "batch-manifest.json"));
  const manifest = controlled
    ? loadOrCreateManifest(
        manifestPath,
        resolve(outDir),
        routes,
        maxRunMs,
        controlledExecutionMode,
        maxConcurrency,
      )
    : null;
  const batchId = manifest?.batchId ?? `batch-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const resumableRoutes = manifest
    ? manifest.routes.filter((entry) => entry.status === "pending").map((entry) => entry.routeId)
    : routes;

  const configs: BotConfig[] = [];
  for (const routeId of resumableRoutes) {
    for (const policyId of policies) {
      for (let i = 1; i <= count; i++) {
        const index = String(i).padStart(2, "0");
        configs.push(
          buildConfig({
            ...effectiveArgs,
            restoreRewardMultiplier: "false",
            route: routeId,
            policy: policyId,
            index,
            out: join(outDir, batchId),
            name: sanitizeCharacterName(`Bot ${routeId} ${policyId} ${index}`),
            executionMode: controlled
              ? controlledExecutionMode
              : parallel
                ? "uncontrolled-parallel"
                : "sequential",
            maxConcurrency: String(
              controlled ? maxConcurrency : parallel ? routes.length * policies.length * count : 1,
            ),
          }),
        );
      }
    }
  }

  // Each bot installs its own SIGINT/SIGTERM handler, and a batch shares one
  // process: past the default ceiling of 10, Node starts printing leak warnings
  // over the run log for what is normal here.
  process.setMaxListeners(configs.length * 2 + 10);

  // Every bot in a batch shares this process, so one dashboard shows the whole
  // cohort side by side.
  let dashboard: Awaited<ReturnType<typeof startDashboardOrWarn>> | null = null;
  if (configs[0]?.uiPort != null) {
    dashboard = await startDashboardOrWarn(configs[0].uiPort);
    if (dashboard) console.log(`[batch] dashboard: ${dashboard.url}`);
  }

  const executionMode = controlled
    ? controlledExecutionMode
    : parallel
      ? "uncontrolled-parallel"
      : "sequential";
  console.log(
    `[batch] ${batchId}: ${configs.length} bots, ${executionMode}` +
      (staggerMs > 0 ? `, starts staggered ${staggerMs}ms` : ""),
  );

  const leaseManager = controlled && controlledExecutionMode === "isolated-parallel"
    ? new AreaLeaseManager(maxConcurrency)
    : null;
  const sessions = new Map(
    configs.map((config) => [
      config.devAccountId,
      leaseManager ? new RouteLeaseSession(config.devAccountId, leaseManager) : undefined,
    ]),
  );
  const shutdownLeases = (): void => leaseManager?.shutdown("coordinator-signal");
  process.once("SIGINT", shutdownLeases);
  process.once("SIGTERM", shutdownLeases);

  const runOne = async (config: BotConfig, index: number): Promise<RunOutcome> => {
    // Launch spread only. Isolation is the leases' job, never this delay.
    if (staggerMs > 0 && index > 0 && (parallel || controlledExecutionMode === "isolated-parallel")) {
      await sleep(index * staggerMs);
    }
    const manifestEntry = manifest?.routes.find((entry) => entry.routeId === config.routeId);
    if (manifest && manifestEntry) {
      manifestEntry.status = "running";
      manifestEntry.startTime = new Date().toISOString();
      manifestEntry.endTime = null;
      manifestEntry.terminalReason = null;
      writeManifest(manifestPath, manifest);
    }
    const session = sessions.get(config.devAccountId);
    try {
      const outcome = await runBot(config, session);
      if (manifest && manifestEntry) {
        manifestEntry.endTime = new Date().toISOString();
        manifestEntry.runId = outcome.summary.run.runId;
        manifestEntry.status = manifestStatusFor(outcome.summary);
        manifestEntry.terminalReason = outcome.summary.run.stallReason ?? outcome.summary.run.completion;
        manifestEntry.artifactDirectory = resolve(outcome.dir);
        writeManifest(manifestPath, manifest);
      }
      return outcome;
    } catch (error) {
      if (manifest && manifestEntry) {
        manifestEntry.endTime = new Date().toISOString();
        manifestEntry.status = "failed_harness";
        manifestEntry.terminalReason = String(error);
        writeManifest(manifestPath, manifest);
      }
      throw error;
    } finally {
      // Covers early connection/lobby failures that occur before runBot reaches
      // its normal terminal cleanup.
      session?.releaseAll("terminal-cleanup");
    }
  };

  let settled: PromiseSettledResult<RunOutcome>[];
  if (parallel || controlledExecutionMode === "isolated-parallel") {
    settled = await Promise.allSettled(configs.map(runOne));
  } else {
    settled = [];
    for (let index = 0; index < configs.length; index += 1) {
      const [result] = await Promise.allSettled([runOne(configs[index], index)]);
      settled.push(result);
    }
  }
  process.off("SIGINT", shutdownLeases);
  process.off("SIGTERM", shutdownLeases);
  const leaseSnapshot = leaseManager?.snapshot();
  leaseManager?.shutdown("batch-terminal");

  // The multiplier is server-global. Individual bots must not restore it while
  // siblings are still running, or a fast completion would silently turn the
  // rest of the cohort back to 1x. Restore once, after every bot is terminal.
  if (configs.some((config) => config.rewardMultiplier !== undefined)) {
    const controller = new BotConnection(
      configs[0]?.serverUrl ?? "http://localhost:4000",
      `bot-controller-${batchId}`,
    );
    await controller.connect({
      onDelta: () => undefined,
      onWorldEvents: () => undefined,
      onDied: () => undefined,
      onAscended: () => undefined,
      onRewardMultiplier: () => undefined,
      onKicked: () => undefined,
    });
    const controllerIntents = new Intents(controller);
    controllerIntents.setRewardMultiplier(1);
    await sleep(250);
    controller.disconnect();
  }

  const outcomes: Array<{ botId: string; ok: boolean; detail: unknown }> = settled.map(
    (result, i) => {
      const config = configs[i];
      const botId = `${config.routeId}-${config.policyId}-${config.devAccountId.slice(-2)}`;
      if (result.status === "rejected") {
        return { botId, ok: false, detail: String(result.reason) };
      }
      const { summary } = result.value as RunOutcome;
      return {
        botId,
        ok: summary.run.completion === "completed",
        detail: {
          completion: summary.run.completion,
          durationMs: summary.run.durationMs,
          canonical: summary.run.canonical,
          finalTier: summary.progression.finalPlayerTier,
          bossesCleared: summary.progression.bossesCleared,
          deaths: summary.deaths.total,
          stallReason: summary.run.stallReason,
          otherPlayersSeen: summary.world.otherPlayersSeen,
          contestedFraction: summary.world.contestedFraction,
          coordination: summary.coordination,
        },
      };
    },
  );

  const batchDir = join(outDir, batchId);
  mkdirSync(batchDir, { recursive: true });
  writeFileSync(
    join(batchDir, "batch-summary.json"),
    `${JSON.stringify({
      batchId,
      controlled,
      executionMode,
      maxConcurrency,
      maximumSimultaneouslyProgressing:
        leaseSnapshot?.maximumSimultaneouslyProgressing ?? (configs.length > 0 ? 1 : 0),
      bots: outcomes,
    }, null, 2)}\n`,
    "utf8",
  );

  await dashboard?.close();

  const completed = outcomes.filter((o) => o.ok).length;
  console.log(`[batch] ${completed}/${outcomes.length} completed · ${batchDir}`);
  process.exit(completed === outcomes.length ? 0 : 1);
}

main().catch((err) => {
  console.error("[batch] fatal:", err);
  process.exit(1);
});
