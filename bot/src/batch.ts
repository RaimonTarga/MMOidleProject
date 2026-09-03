import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
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
import {
  T1_ECONOMY_ARMS,
  T1_ECONOMY_EXPERIMENT_ID,
  T1_ECONOMY_EXPERIMENT_REVISION,
  isT1EconomyArm,
  t1EconomyConfigForArm,
  t1Plus5EssenceCosts,
} from "@mmo-idle/shared";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setServerRewardMultiplier(
  serverUrl: string,
  accountId: string,
  multiplier: number,
): Promise<void> {
  let observed: number | null = null;
  const controller = new BotConnection(serverUrl, accountId);
  try {
    await controller.connect({
      onDelta: () => undefined,
      onWorldEvents: () => undefined,
      onDied: () => undefined,
      onAscended: () => undefined,
      onRewardMultiplier: (value) => { observed = value; },
      onKicked: () => undefined,
    });
    const intents = new Intents(controller);
    const deadline = Date.now() + 5_000;
    while (observed !== multiplier && Date.now() < deadline) {
      intents.setRewardMultiplier(multiplier);
      await sleep(100);
    }
    if (observed !== multiplier) {
      throw new Error(`server did not settle reward multiplier at ${multiplier}x (observed ${observed ?? "none"})`);
    }
  } finally {
    controller.disconnect();
  }
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
  rewardMultiplier: number,
): BatchManifest {
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BatchManifest;
    if (
      manifest.controlled !== true ||
      manifest.executionMode !== executionMode ||
      manifest.maxConcurrency !== maxConcurrency ||
      manifest.rewardMultiplier !== rewardMultiplier ||
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
    rewardMultiplier,
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
  const economyArms = (args.economyArms ?? "")
    .split(",")
    .map((arm) => arm.trim())
    .filter(Boolean);
  const factorial = economyArms.length > 0;
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

  if (factorial) {
    const primaryRoutes = ["striker-t1", "squire-t1", "apprentice-t1", "conduit-t1"];
    if (controlled) {
      throw new Error("T1 factorial batches must use --controlled=false so arms interleave in one shared world");
    }
    if (
      JSON.stringify(economyArms) !== JSON.stringify(T1_ECONOMY_ARMS) ||
      JSON.stringify(routes) !== JSON.stringify(primaryRoutes) ||
      policies.length !== 1 ||
      policies[0] !== "intended"
    ) {
      throw new Error(
        "T1 factorial requires --economyArms=C,D,E,F, --routes=striker-t1,squire-t1,apprentice-t1,conduit-t1, --policies=intended",
      );
    }
  }

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
  const manifestRewardMultiplier = Number(effectiveArgs.rewardMultiplier ?? "1");
  if (!Number.isFinite(manifestRewardMultiplier)) {
    throw new Error("controlled batch rewardMultiplier must be finite");
  }
  const manifestPath = resolve(args.manifest ?? join(outDir, "batch-manifest.json"));
  const manifest = controlled
    ? loadOrCreateManifest(
        manifestPath,
        resolve(outDir),
        routes,
        maxRunMs,
        controlledExecutionMode,
        maxConcurrency,
        manifestRewardMultiplier,
      )
    : null;
  const batchId = manifest?.batchId ?? `batch-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const batchDir = join(outDir, batchId);
  mkdirSync(batchDir, { recursive: true });
  const resumableRoutes = manifest
    ? manifest.routes.filter((entry) => entry.status === "pending").map((entry) => entry.routeId)
    : routes;

  const routeSchedule: Array<{ routeId: string; replica: number; economyArm?: string }> = factorial
    ? Array.from({ length: count * routes.length }, (_, waveIndex) =>
        economyArms.map((economyArm, armIndex) => ({
          // Four successive rotations complete one replicate: each arm sees
          // Striker, Squire, Apprentice and Conduit once before the next
          // replicate begins. The first two waves match the requested example.
          routeId: routes[(waveIndex + armIndex) % routes.length],
          replica: Math.floor(waveIndex / routes.length) + 1,
          economyArm,
        })),
      ).flat()
    : !controlled && args.roundRobin === "true"
      ? Array.from({ length: count }, (_, i) =>
          resumableRoutes.map((routeId) => ({ routeId, replica: i + 1 })),
        ).flat()
      : resumableRoutes.flatMap((routeId) =>
          Array.from({ length: count }, (_, i) => ({ routeId, replica: i + 1 })),
        );
  const configs: BotConfig[] = [];
  for (const { routeId, replica, economyArm } of routeSchedule) {
    for (const policyId of policies) {
        const index = String(replica).padStart(2, "0");
        configs.push(
          buildConfig({
            ...effectiveArgs,
            restoreRewardMultiplier: "false",
            route: routeId,
            policy: policyId,
            ...(economyArm ? { economyArm } : {}),
            index,
            out: join(outDir, batchId),
            name: sanitizeCharacterName(
              `Bot ${economyArm ? `${economyArm} ` : ""}${routeId} ${policyId} ${index}`,
            ),
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

  if (factorial) {
    let revision = "unknown";
    try {
      revision = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    } catch {
      // The per-run header still carries the immutable economy revision.
    }
    writeFileSync(
      join(batchDir, "batch-config.json"),
      `${JSON.stringify({
        type: "t1-economy-factorial",
        experimentId: T1_ECONOMY_EXPERIMENT_ID,
        economyRevision: T1_ECONOMY_EXPERIMENT_REVISION,
        gitRevision: revision,
        createdAt: new Date().toISOString(),
        arms: economyArms.map((arm) => {
          if (!isT1EconomyArm(arm)) throw new Error(`invalid factorial arm ${arm}`);
          const config = t1EconomyConfigForArm(arm);
          return {
            ...config,
            t1Plus5EssenceCosts: t1Plus5EssenceCosts(config.t1Plus5EssenceCostMultiplier),
          };
        }),
        routes,
        policies,
        replicatesPerClassPerArm: count,
        totalRuns: configs.length,
        rewardMultiplier: configs[0]?.rewardMultiplier ?? 1,
        staggerMs,
        executionMode: "uncontrolled-parallel",
        launchOrder: configs.map((config, index) => ({
          order: index + 1,
          arm: config.economyArm,
          routeId: config.routeId,
          replica: config.devAccountId.match(/-(\d+)$/)?.[1] ?? null,
          launchDelayMs: index * staggerMs,
        })),
      }, null, 2)}\n`,
      "utf8",
    );
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

  // The reward multiplier is server-global. Establish the requested rate
  // before the first real bot connects, so a stale rate from an interrupted
  // batch cannot taint or overpay the first run.
  const requestedMultiplier = configs.find((config) => config.rewardMultiplier !== undefined)?.rewardMultiplier;
  if (requestedMultiplier !== undefined) {
    await setServerRewardMultiplier(
      configs[0]?.serverUrl ?? "http://localhost:4000",
      `bot-controller-${batchId}-preflight`,
      requestedMultiplier,
    );
    console.log(`[batch] reward multiplier preflight: ${requestedMultiplier}x`);
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
      const botId = `${config.economyArm ? `${config.economyArm}-` : ""}${config.routeId}-${config.policyId}-${config.devAccountId.slice(-2)}`;
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
