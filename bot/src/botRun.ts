import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { PlayerDeathPayload } from "@mmo-idle/shared";
import {
  GAME_CONFIG,
  NODE_BIOMES,
  defaultT1EconomyConfig,
  t1EconomyConfigForArm,
  t1Plus5EssenceCosts,
  tierEntryProfileFromT1Snapshot,
  type PlayerView,
  type TierEntryInitialState,
} from "@mmo-idle/shared";
import type { RouteLeaseSession } from "./concurrency/routeLeaseSession";
import type { BotConfig } from "./config";
import { BotConnection } from "./net/connection";
import { Intents } from "./net/intents";
import { requirePolicy } from "./policy/profiles";
import { evaluate } from "./route/conditions";
import { AbortError, RouteExecutor, sleep, StallError } from "./route/executor";
import type { Route } from "./route/types";
import { requireRoute } from "./routes";
import { Observation } from "./state/observation";
import type {
  CompletionState,
  EconomyCandidate,
  RunHeader,
  RunTaint,
  TemplateValidationSummary,
} from "./telemetry/events";
import { BOT_JSONL_SCHEMA_VERSION } from "./telemetry/events";
import { Recorder } from "./telemetry/recorder";
import { TelemetrySink } from "./telemetry/sink";
import { buildSummary, writeSummary, type RunSummary } from "./telemetry/summary";
import {
  buildT1CharacterSnapshot,
  readT1CharacterSnapshot,
  T1SnapshotStore,
} from "./telemetry/t1Snapshots";
import { botRegistry, type BotStatus, type WorldEntity, type WorldView } from "./ui/status";
import { requireTierEntryProfile, t2EntryProfileId } from "./tierEntry/profiles";
import { indexSnapshotDir } from "./tierEntry/snapshotDir";
import { formatValidation, validateProfile, validateSpawn } from "./tierEntry/validate";

const RECORDER_TICK_MS = 1_000;
/** How long to lie dead before acknowledging — a human is not instant either. */
const DEATH_ACK_DELAY_MS = 2_000;
/** Controlled evidence must never gain same-node party credit. */
export const BOT_AUTO_PARTY_ENABLED = false;

export interface RunOutcome {
  summary: RunSummary;
  dir: string;
}

/** Sticky taints implied by explicit harness configuration before gameplay starts. */
export function initialRunTaints(
  config: Pick<BotConfig, "fastBossRetry"> & Partial<Pick<BotConfig, "executionMode" | "completionMode">>,
  timeScale = process.env.BOT_TIME_SCALE,
): RunTaint[] {
  const taints: RunTaint[] = [];
  if (timeScale && timeScale !== "1") taints.push("NON_CANONICAL_TIME_SCALE");
  if (config.fastBossRetry) taints.push("NON_CANONICAL_FAST_BOSS_RETRY");
  if (config.executionMode === "uncontrolled-parallel") taints.push("NON_CANONICAL_SHARED_WORLD");
  if (config.completionMode === "next-tier") taints.push("NON_CANONICAL_EARLY_STOP");
  return taints;
}

function gitRevision(): string {
  const frozenRevision = process.env.EXPERIMENT_GIT_REVISION?.trim();
  if (frozenRevision) return frozenRevision;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * One complete bot run: connect, take a genuinely fresh character, execute the
 * authored route, and emit telemetry. Nothing here is seeded — no gear, no
 * currency, no unlocks, no checkpoint power.
 */
export async function runBot(
  config: BotConfig,
  leaseSession?: RouteLeaseSession,
): Promise<RunOutcome> {
  if (config.executionMode === "isolated-parallel" && !leaseSession) {
    throw new Error("isolated-parallel runs require a coordinator-owned lease session");
  }
  const authoredRoute = requireRoute(config.routeId);
  // A route that declares a tier-entry start CANNOT run without one. A tier-0
  // character sent to a Tier-2 biome banks no XP at all (`biomeLevelCap(0, ...)`
  // is 0), so the first farm step would spin until the run's watchdog fired --
  // hours of nothing, reported as a stall rather than as the configuration
  // mistake it is.
  // Resolve the class-specific template from the route's own class root, so an
  // eighteen-route batch spanning six classes needs one `--entryEconomy` flag
  // rather than eighteen `--tierEntry` ids. The resolved id is recorded in the
  // run header, so the arm stays explicit and reproducible either way.
  if (config.tierEntryProfileId && config.tierEntrySnapshotPath) {
    throw new Error("--tierEntry and --tierEntrySnapshot are mutually exclusive");
  }
  if (config.tierEntrySnapshotPath && config.tierEntrySnapshotDir) {
    throw new Error("--tierEntrySnapshot and --tierEntrySnapshotDir are mutually exclusive");
  }

  // Resolve a REAL Tier-1 handoff for this route's class, when a source
  // directory was given. A class with no usable snapshot falls through to its
  // synthetic template rather than failing the run: the cohort keeps all six
  // classes (so the cross-class interpretation rules still have six to work
  // with), and the substitution stays visible in the header's profile id, which
  // is `snapshot-*` for a real handoff and `*-t2-entry-*` for a template.
  let resolvedSnapshotPath = config.tierEntrySnapshotPath;
  if (config.tierEntrySnapshotDir && authoredRoute.startsFromTierEntry) {
    const index = indexSnapshotDir(config.tierEntrySnapshotDir);
    const match = index.byClassRoot.get(authoredRoute.classRoot);
    if (match) {
      resolvedSnapshotPath = match.file;
      console.log(
        `[bot] ${config.routeId}: real T1 handoff for ${authoredRoute.classRoot} ` +
          `(essence ${match.walletTotal}) -> ${match.file}`,
      );
    } else {
      if (config.requireTierEntrySnapshot) {
        const rejected = index.rejected.length > 0
          ? ` ${index.rejected.length} snapshot file(s) were rejected.`
          : "";
        throw new Error(
          `no usable real T1 handoff for ${authoredRoute.classRoot} in ` +
            `${config.tierEntrySnapshotDir}; canonical snapshot entry cannot fall back.` +
            rejected,
        );
      }
      console.warn(
        `[bot] ${config.routeId}: NO usable T1 handoff for ${authoredRoute.classRoot} in ` +
          `${config.tierEntrySnapshotDir}; falling back to the synthetic ` +
          `"${config.entryEconomy}" template. This run is NOT comparable to a ` +
          `snapshot-entry run and must not be pooled with one.`,
      );
      if (index.rejected.length > 0) {
        console.warn(`[bot] ${index.rejected.length} snapshot file(s) were rejected:`);
        for (const reject of index.rejected.slice(0, 5)) {
          console.warn(`[bot]   ${reject.file}: ${reject.reason}`);
        }
      }
    }
  }

  const sourceSnapshot = resolvedSnapshotPath
    ? readT1CharacterSnapshot(resolvedSnapshotPath)
    : undefined;
  if (
    sourceSnapshot &&
    config.requireTierEntrySnapshot &&
    (!sourceSnapshot.canonicalAtCapture || sourceSnapshot.economy.rewardMultiplier !== 1)
  ) {
    throw new Error(
      `canonical snapshot entry requires a canonical 1x Snapshot B; ` +
        `${sourceSnapshot.snapshotId} is not eligible`,
    );
  }
  if (sourceSnapshot && !authoredRoute.startsFromTierEntry) {
    throw new Error(
      `route ${authoredRoute.id} does not declare a tier-entry start for --tierEntrySnapshot`,
    );
  }
  const resolvedTierEntryId = sourceSnapshot
    ? undefined
    : config.tierEntryProfileId ??
      (authoredRoute.startsFromTierEntry
        ? t2EntryProfileId(authoredRoute.classRoot, config.entryEconomy)
        : undefined);
  const tierEntryProfile = sourceSnapshot
    ? tierEntryProfileFromT1Snapshot(sourceSnapshot)
    : resolvedTierEntryId
      ? requireTierEntryProfile(resolvedTierEntryId)
      : undefined;
  if (
    tierEntryProfile &&
    authoredRoute.startsFromTierEntry &&
    tierEntryProfile.targetTier !== authoredRoute.startsFromTierEntry
  ) {
    throw new Error(
      `tier-entry profile ${tierEntryProfile.id} targets tier ${tierEntryProfile.targetTier}, ` +
        `but route ${authoredRoute.id} starts at tier ${authoredRoute.startsFromTierEntry}`,
    );
  }
  if (tierEntryProfile && tierEntryProfile.classRoot !== authoredRoute.classRoot) {
    throw new Error(
      `tier-entry profile ${tierEntryProfile.id} is for ${tierEntryProfile.classRoot}, ` +
        `but route ${authoredRoute.id} is for ${authoredRoute.classRoot}`,
    );
  }
  const route = config.completionMode === "next-tier"
    ? {
        ...authoredRoute,
        completion: { type: "playerTierAtLeast" as const, tier: 2 },
        description: `${authoredRoute.description} [economy stop: player tier 2]`,
      }
    : authoredRoute;
  const policy = requirePolicy(config.policyId);
  const runId = `${config.routeId}-${config.policyId}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;

  const sink = new TelemetrySink(config.outDir, runId);
  const snapshotStore = new T1SnapshotStore(sink.dir);
  const startedAt = Date.now();
  const conn = new BotConnection(config.serverUrl, config.devAccountId);
  const economyConfig = config.economyArm
    ? t1EconomyConfigForArm(config.economyArm)
    : defaultT1EconomyConfig();
  const obs = new Observation(conn.mirror, economyConfig);
  const intents = new Intents(conn);

  let rewardMultiplier = 1;
  /** True once the server has pushed its reward rate — proof dev tooling is on. */
  let devToolingSeen = false;
  /**
   * Run taints, mutated in place. The reward multiplier is SERVER-GLOBAL and can
   * change mid-run - another bot, or a human on the debug panel, can raise it
   * under us. Sampling it only at connect would let a run that actually earned
   * 40x rewards be published as canonical, so the taint is sticky: once seen,
   * never cleared.
   */
  const taints: RunTaint[] = initialRunTaints(config);
  const noteRewardMultiplier = (multiplier: number): void => {
    rewardMultiplier = multiplier;
    if (multiplier !== 1 && !taints.includes("NON_CANONICAL_REWARD_MULTIPLIER")) {
      taints.push("NON_CANONICAL_REWARD_MULTIPLIER");
    }
  };
  /** The server-global rate before this run touched it, so we can hand it back. */
  let rewardMultiplierBeforeRun: number | null = null;
  let aborted = false;
  let abortReason: string | undefined;
  const runAbort = new AbortController();
  let deathCount = 0;
  let lastDeathAt = 0;
  const stalls: Array<{ reason: string; detail?: Record<string, unknown> }> = [];

  const recorder = new Recorder(
    sink,
    startedAt,
    () => conn.id,
    process.env.BOT_RAW_DAMAGE === "1",
  );

  let executor: RouteExecutor | null = null;

  /**
   * The run supervisor has one fatal boundary.  A disconnect, deadline, or
   * process signal must stop outbound combat/traversal intents before the
   * route executor has a chance to begin another activity.
   */
  const abortRun = (
    reason: string,
    leaseReason: "abort" | "disconnect",
  ): void => {
    if (aborted) return;
    aborted = true;
    abortReason = reason;
    runAbort.abort(reason);
    leaseSession?.interrupt(leaseReason);
    try {
      intents.setAuto(false);
      intents.setAutoTraverse(false);
    } catch (err) {
      // A kicked socket may reject these best-effort stop intents.  The
      // controller and reservation interrupt still complete synchronously.
      console.warn(`[bot] could not stop automation during abort: ${String(err)}`);
    }
  };

  const handleDeath = (payload: PlayerDeathPayload): void => {
    deathCount += 1;
    lastDeathAt = Date.now();
    // Death is an ownership boundary, not merely an engagement-state change.
    // Release synchronously before the respawn acknowledgement/recovery walk.
    leaseSession?.interrupt("death");
    const self = obs.self;
    const info = NODE_BIOMES[payload.diedAtNodeId];

    recorder.recordDeath({
      atMs: recorder.now(),
      cause: payload.cause,
      nodeId: payload.diedAtNodeId,
      biomeGroup: info?.biomeGroup ?? null,
      nodeModifier: info?.modifier ?? null,
      routeStepIndex: executor?.currentStepIndex ?? -1,
      routeStepLabel: executor?.currentStepLabel ?? "unknown",
      loadout: { ...(self?.equipment ?? {}) },
      itemUpgrades: { ...(self?.itemUpgrades ?? {}) },
      maxHp: self?.maxHp ?? 0,
      plating: self?.plating ?? 0,
      damageReduction: self?.damageReduction ?? 0,
    });

    // Acknowledging is the normal player action that triggers respawn. Bots die
    // and respawn like anyone else; there is no revive shortcut.
    setTimeout(async () => {
      if (aborted) return;
      try {
        intents.ackDeath();
      } catch (err) {
        // The socket can have dropped in the 2s since this timer was set (a
        // disconnect, a server restart under a busy shared-world batch). This
        // fires from a bare setTimeout callback with nothing above it on the
        // stack, so an uncaught throw here is an UNCAUGHT EXCEPTION at the
        // process level -- and because `bot:batch` runs every bot in ONE
        // process, that kills every other bot too, not just this one. The
        // reconnect logic (`reconnection: true`) will bring the socket back;
        // losing this one ack is a stalled respawn to retry, not a crash.
        console.warn(`[bot] ackDeath failed (socket likely reconnecting): ${String(err)}`);
      }
    }, DEATH_ACK_DELAY_MS);
  };

  await conn.connect({
    onDelta: (snapshot) => recorder.ingestCombatEvents(snapshot.events, snapshot.nodeId),
    onWorldEvents: (events) => recorder.ingestWorldEvents(events, obs),
    onDied: handleDeath,
    onAscended: () => undefined,
    onRewardMultiplier: (m) => {
      noteRewardMultiplier(m);
      devToolingSeen = true;
    },
    onKicked: (reason) => {
      abortRun(`session kicked: ${reason}`, "disconnect");
    },
    onDisconnect: (reason) => {
      abortRun(`socket disconnected: ${reason}`, "disconnect");
    },
  });

  let templateValidation: TemplateValidationSummary | undefined;
  const characterId = await prepareFreshCharacter(conn, config);
  await conn.selectCharacter(characterId);

  // The world admits us asynchronously; the first snapshot names our entity.
  await waitFor(() => obs.self !== null, 60_000, "own player to appear in the world", runAbort.signal);

  if (tierEntryProfile) {
    const result = await intents.applyTierEntryProfile(tierEntryProfile);
    if (!result.success) {
      throw new Error(`tier-entry profile ${tierEntryProfile.id} rejected: ${result.reason ?? "unknown"}`);
    }
    await waitFor(
      () => {
        const self = obs.self;
        return !!self &&
          self.nodeId === tierEntryProfile.spawnNodeId &&
          self.playerTier === tierEntryProfile.targetTier &&
          self.selectedClass === tierEntryProfile.classRoot &&
          self.unlockedSkills.includes(tierEntryProfile.frameId) &&
          !self.isDead;
      },
      60_000,
      `tier-entry profile ${tierEntryProfile.id} to appear in the authoritative view`,
      runAbort.signal,
    );
    if (!sourceSnapshot && !taints.includes("SYNTHETIC_TIER_ENTRY")) {
      taints.push("SYNTHETIC_TIER_ENTRY");
    }

    // Prove the template is legal BEFORE a single route step runs. The offline
    // pass asks whether the template is a character today's game data allows;
    // the live pass asks whether the server actually built that character. A
    // failure here is worth more than any amount of downstream telemetry, so
    // the run refuses to start rather than quietly producing hours of evidence
    // about an impossible build.
    const profileReport = validateProfile(tierEntryProfile);
    const spawnReport = validateSpawn(tierEntryProfile, obs.requireSelf());
    templateValidation = {
      profileId: tierEntryProfile.id,
      profilePass: profileReport.pass,
      spawnPass: spawnReport.pass,
      checked: profileReport.checked + spawnReport.checked,
      failures: [
        ...profileReport.findings.map((f) => ({ pass: "profile" as const, check: f.check, message: f.message })),
        ...spawnReport.findings.map((f) => ({ pass: "spawn" as const, check: f.check, message: f.message })),
      ],
    };
    console.log(formatValidation("T2_ENTRY_TEMPLATE_VALIDATION[profile]", profileReport));
    console.log(formatValidation("T2_ENTRY_TEMPLATE_VALIDATION[spawn]", spawnReport));
    if (!profileReport.pass || !spawnReport.pass) {
      throw new Error(
        `tier-entry template ${tierEntryProfile.id} failed validation; ` +
          "refusing to produce evidence from an impossible character",
      );
    }
  }

  // Economy arm selection is per-player and must settle before any route action
  // can earn rewards or attempt a craft/upgrade. The acknowledgement is the
  // authoritative server echo that the header is safe to stamp.
  if (config.economyArm !== undefined) {
    const result = await intents.applyEconomyExperiment(economyConfig.arm);
    if (
      !result.success ||
      result.arm !== economyConfig.arm ||
      result.config?.revision !== economyConfig.revision ||
      result.config?.t1Plus5EssenceCostMultiplier !== economyConfig.t1Plus5EssenceCostMultiplier ||
      result.config?.catalystProgressPerUnitT1 !== economyConfig.catalystProgressPerUnitT1
    ) {
      throw new Error(
        `server rejected or mismatched T1 economy arm ${economyConfig.arm}: ${result.reason ?? "invalid acknowledgement"}`,
      );
    }
  }

  // Applied AFTER the character is in the world, not on `connect`. The server
  // registers `debug:setRewardMultiplier` inside `registerPlayerHandlers`, which
  // runs behind an async auth bootstrap — an emit fired the instant the socket
  // opens lands before that listener exists and is silently dropped.
  // Set before the header is built so the taint reflects the rate actually earned.
  if (config.rewardMultiplier !== undefined && config.rewardMultiplier !== rewardMultiplier) {
    if (!devToolingSeen) {
      throw new Error(
        "server never announced a reward multiplier, so its dev tooling is off — " +
          "a multiplier run needs NODE_ENV!=production (or DEV_TOOLS=true)",
      );
    }
    rewardMultiplierBeforeRun = rewardMultiplier;
    let applied = false;
    for (let attempt = 1; attempt <= 3 && !applied; attempt++) {
      intents.setRewardMultiplier(config.rewardMultiplier);
      applied = await waitFor(
        () => rewardMultiplier === config.rewardMultiplier,
        5_000,
        "reward multiplier",
        runAbort.signal,
      )
        .then(() => true)
        .catch((err) => {
          if (err instanceof AbortError) throw err;
          return false;
        });
    }
    if (!applied) {
      throw new Error(
        `server did not apply reward multiplier ${config.rewardMultiplier} (still ${rewardMultiplier})`,
      );
    }
    console.warn(
      `[bot] reward multiplier set to ${config.rewardMultiplier}x — this run is a PIPELINE TEST, not an evaluation`,
    );
  }

  if (config.fastBossRetry) {
    if (!devToolingSeen) {
      throw new Error(
        "fast boss retry requires development server tooling (NODE_ENV!=production or DEV_TOOLS=true)",
      );
    }
  }

  const initialSelf = obs.self;
  if (!initialSelf) throw new Error("own player disappeared before run-start telemetry");

  const header: RunHeader = {
    schemaVersion: BOT_JSONL_SCHEMA_VERSION,
    runId,
    botId: `${config.economyArm ? `${config.economyArm}-` : ""}${config.routeId}-${config.policyId}`,
    devAccountId: config.devAccountId,
    characterName: config.characterName,
    characterId,
    routeId: route.id,
    routeVersion: route.version,
    policyId: policy.id,
    classRoot: tierEntryProfile?.classRoot ?? route.classRoot,
    gitRevision: gitRevision(),
    serverUrl: config.serverUrl,
    startedAt,
    rewardMultiplier,
    economyCandidate: resolveEconomyCandidate(economyConfig),
    taints,
    executionMode: config.executionMode,
    maxConcurrency: config.maxConcurrency,
    initialEssences: { ...initialSelf.essences },
    initialCatalysts: { ...initialSelf.catalysts },
    tierEntry: tierEntryProfile
      ? buildTierEntryInitialState(tierEntryProfile.id, tierEntryProfile.targetTier, tierEntryProfile.economyPolicy, tierEntryProfile.frameId, initialSelf)
      : undefined,
    templateValidation,
  };
  const snapshotFrameId = tierEntryProfile?.frameId ?? route.frameId ?? null;
  const captureSnapshot = (kind: "mastery-completion" | "tier2-handoff"): void => {
    const self = obs.self;
    if (!self) return;
    const snapshot = buildT1CharacterSnapshot({
      kind,
      header,
      self,
      frameId: snapshotFrameId,
      elapsedMs: recorder.now(),
      rewardMultiplier,
      canonicalAtCapture: taints.length === 0 && rewardMultiplier === 1,
    });
    const ref = snapshotStore.capture(snapshot);
    console.log(
      `[bot] ${runId} Snapshot ${kind === "mastery-completion" ? "A" : "B"}: ` +
        `${ref.file} at ${ref.elapsedMs}ms (GM ${ref.globalMastery})`,
    );
  };
  recorder.emit({ kind: "run-start", atMs: 0, header });
  recorder.walletSnapshot(obs, "run-start", route.id);
  leaseSession?.attachRecorder(recorder);

  if (taints.length > 0) {
    console.warn(`[bot] ${runId} is NON-CANONICAL: ${taints.join(", ")}`);
  }

  const ticker = setInterval(() => {
    try {
      recorder.tick(obs);
      leaseSession?.observe(obs, conn.id);
    } catch (err) {
      console.error("[bot] recorder tick failed", err);
    }
  }, RECORDER_TICK_MS);

  const runDeadline = startedAt + config.maxRunMs;
  const deadlineTimer = setInterval(() => {
    if (Date.now() > runDeadline && !aborted) {
      abortRun(`run exceeded maxRunMs (${config.maxRunMs}ms)`, "abort");
    }
  }, 5_000);

  const onSignal = (): void => {
    abortRun("interrupted", "abort");
  };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  executor = new RouteExecutor({
    obs,
    intents,
    recorder,
    policy,
    route,
    startedAt,
    aborted: () => aborted,
    abortSignal: runAbort.signal,
    deathCount: () => deathCount,
    fastBossRetry: config.fastBossRetry,
    fastBossRetryIncludeGuardians: config.fastBossRetryIncludeGuardians,
    leaseSession,
    onMilestone: (id) => {
      if (id === "all-biomes-maxed") captureSnapshot("mastery-completion");
    },
    awaitAlive: async () => {
      while (obs.self?.isDead ?? false) {
        if (aborted) throw new AbortError("run aborted");
        await sleepOrAbort(500, runAbort.signal);
      }
      // Respawn returns the character to the region hub with auto-combat off;
      // give the world a beat to settle before the next step acts on position.
      if (Date.now() - lastDeathAt < 5_000) await sleepOrAbort(2_000, runAbort.signal);
    },
  });

  // Publish this bot to the dashboard. Read-only, and sourced entirely from the
  // bot's own player view + route state, so nothing here needs a server change.
  let liveCompletion: CompletionState | null = null;
  let liveStallReason: string | undefined;
  const unregister = botRegistry.register(header.botId, (): BotStatus => {
    const self = obs.self;
    const info = self ? NODE_BIOMES[self.nodeId] : undefined;
    return {
      botId: header.botId,
      runId,
      routeId: route.id,
      routeVersion: route.version,
      policyId: policy.id,
      classRoot: route.classRoot,
      characterName: config.characterName,
      connected: conn.id.length > 0,
      finished: liveCompletion !== null,
      entityId: conn.id,
      // The server names a player entity by its SOCKET id, which is exactly what
      // `spectate:setTarget` pins to.
      watchUrl: conn.id ? `${config.clientUrl}/?watch=${encodeURIComponent(conn.id)}` : null,
      completion: liveCompletion ?? undefined,
      stallReason: liveStallReason,
      startedAt,
      elapsedMs: Date.now() - startedAt,
      rewardMultiplier,
      taints,
      player: self
        ? {
            alive: !self.isDead,
            hp: self.hp,
            maxHp: self.maxHp,
            barrier: self.barrier,
            barrierMax: self.barrierMax,
            plating: self.plating,
            damageReduction: self.damageReduction,
            dodgeRate: self.dodgeRate,
            attack: self.attack,
            playerTier: self.playerTier,
            globalMastery: self.globalMastery,
            nodeId: self.nodeId,
            biomeGroup: info?.biomeGroup ?? null,
            nodeModifier: info?.modifier ?? null,
            attackTargetName:
              obs.monsters().find((m) => m.id === self.attackTargetId)?.name ?? null,
            attackersOnSelf: obs.attackersOnSelf().length,
            monstersInNode: obs.monsters().length,
            otherPlayersInNode: obs.otherPlayers().length,
            equipment: { ...self.equipment },
            upgrades: { ...self.itemUpgrades },
            essences: { ...self.essences },
            catalysts: { ...self.catalysts },
            biomeLevels: { ...self.biomeLevel },
            bossesCleared: [...self.bossesCleared],
            techniques: [...self.equippedAbilities.techniques],
            guards: [...self.equippedAbilities.guards],
            runes: self.runesEquipped.map((r) => ({
              conditionId: r.conditionId,
              actionId: r.actionId,
            })),
          }
        : null,
      route: {
        stepIndex: executor?.currentStepIndex ?? 0,
        stepTotal: route.steps.length,
        stepLabel: executor?.currentStepLabel ?? "starting",
        milestones: executor?.milestonesFired ?? [],
      },
      stats: {
        kills: Object.values(recorder.killsByMonster).reduce((a, b) => a + b, 0),
        deaths: recorder.deathCount,
        damageDealt: recorder.totalDamageDealtByPlayer + recorder.totalDamageDealtBySummons,
        damageTaken: recorder.totalDamageTaken,
        bossAttempts: recorder.bossAttempts,
        bossVictories: recorder.bossVictories,
        targetSwitches: recorder.targetSwitches,
      },
      recent: recorder.recentEvents(),
    };
  }, () => worldProvider());

  const worldProvider = (): WorldView => {
    const self = obs.self;
    const info = self ? NODE_BIOMES[self.nodeId] : undefined;
    const entities: WorldEntity[] = [];

    if (self) {
      entities.push({
        id: self.id,
        kind: "self",
        name: self.name,
        x: self.pos.x,
        y: self.pos.y,
        hp: self.hp,
        maxHp: self.maxHp,
        radius: 26,
        isBoss: false,
        targetId: self.attackTargetId,
      });
    }
    for (const m of obs.monsters()) {
      entities.push({
        id: m.id,
        kind: "monster",
        name: m.name,
        x: m.pos.x,
        y: m.pos.y,
        hp: m.hp,
        maxHp: m.maxHp,
        radius: m.isBoss ? 44 : 22,
        isBoss: m.isBoss,
        targetId: m.attackTargetId,
      });
    }
    for (const m of obs.minions()) {
      entities.push({
        id: m.id,
        kind: "minion",
        name: "minion",
        x: m.pos.x,
        y: m.pos.y,
        hp: m.hp,
        maxHp: m.maxHp,
        radius: 16,
        isBoss: false,
        targetId: m.attackTargetId ?? null,
      });
    }
    for (const o of obs.otherPlayers()) {
      entities.push({
        id: o.id,
        kind: "player",
        name: o.name,
        x: o.pos.x,
        y: o.pos.y,
        hp: o.hp,
        maxHp: o.maxHp,
        radius: 22,
        isBoss: false,
        targetId: o.attackTargetId,
      });
    }

    return {
      botId: header.botId,
      nodeId: obs.nodeId,
      biomeGroup: info?.biomeGroup ?? null,
      nodeModifier: info?.modifier ?? null,
      width: GAME_CONFIG.NODE_WIDTH,
      height: GAME_CONFIG.NODE_HEIGHT,
      entities,
    };
  };

  let completion: CompletionState = "error";
  let stallReason: string | undefined;

  try {
    await executor.run();
    completion = executor.isPartial ? "partial" : "completed";
  } catch (err) {
    if (err instanceof StallError) {
      completion = "stalled";
      stallReason = err.message;
      stalls.push({ reason: err.message, detail: err.detail });
      recorder.emit({
        kind: "stall",
        atMs: recorder.now(),
        reason: err.message,
        detail: err.detail,
      });
    } else if (err instanceof AbortError || aborted) {
      completion = abortReason?.includes("maxRunMs") ? "timed-out" : "aborted";
      stallReason = abortReason;
    } else {
      completion = "error";
      stallReason = err instanceof Error ? err.message : String(err);
      recorder.emit({ kind: "stall", atMs: recorder.now(), reason: stallReason });
    }
  } finally {
    clearInterval(ticker);
    clearInterval(deadlineTimer);
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }

  liveCompletion = completion;
  liveStallReason = stallReason;

  // A route that finished its steps has still only "completed" if the route's
  // own completion condition holds — the steps are the plan, not the goal.
  if (completion === "completed" && !routeComplete(route, obs)) {
    completion = "stalled";
    stallReason = stallReason ?? "route steps exhausted without satisfying completion";
    stalls.push({ reason: stallReason });
  }
  if (completion === "completed" && routeComplete(route, obs)) {
    captureSnapshot("tier2-handoff");
  }

  leaseSession?.releaseAll(`run-${completion}`);
  const leaseEvidence = leaseSession?.evidence();
  if (leaseEvidence?.contaminated && !taints.includes("CONTAMINATED_CONTROLLED_OVERLAP")) {
    taints.push("CONTAMINATED_CONTROLLED_OVERLAP");
  }

  const endedAt = Date.now();
  // The T1-completion wallet: what the tier actually left in the player's hands.
  recorder.walletSnapshot(obs, "run-end", completion);
  recorder.emit({
    kind: "run-end",
    atMs: recorder.now(),
    completion,
    reason: stallReason,
    durationMs: endedAt - startedAt,
  });

  const summary = buildSummary({
    header,
    recorder,
    route,
    self: obs.self,
    completion,
    stallReason,
    stalls,
    milestonesReached: executor.milestonesFired,
    routeStepsCompleted: executor.currentStepIndex,
    endedAt,
    leaseEvidence,
    maximumSimultaneouslyProgressing: leaseSession?.maximumSimultaneouslyProgressing(),
    winCondition: config.completionMode,
    snapshotArtifacts: snapshotStore.manifest(),
    concurrencyIntervals: leaseSession?.concurrencyIntervals(),
  });

  await sink.close();
  snapshotStore.writeManifest();
  writeSummary(sink.dir, summary);

  // The multiplier is server-GLOBAL and outlives the run, so a browser player
  // (or the next bot) would otherwise inherit it. Hand it back before leaving.
  if (
    config.restoreRewardMultiplier &&
    rewardMultiplierBeforeRun !== null &&
    rewardMultiplier !== rewardMultiplierBeforeRun
  ) {
    try {
      intents.setRewardMultiplier(rewardMultiplierBeforeRun);
      await waitFor(
        () => rewardMultiplier === rewardMultiplierBeforeRun,
        5_000,
        "reward multiplier restore",
      );
      console.log(`[bot] restored server reward multiplier to ${rewardMultiplierBeforeRun}x`);
    } catch {
      console.warn(
        `[bot] could not restore the reward multiplier — the dev server is still at ${rewardMultiplier}x`,
      );
    }
  }

  conn.disconnect();
  // Hold the card on the dashboard briefly so a finished run is visible rather
  // than vanishing the instant it ends.
  setTimeout(unregister, 60_000).unref?.();

  return { summary, dir: sink.dir };
}

/** Re-checked through the same predicate the executor uses, never a second rule. */
function routeComplete(route: Route, obs: Observation): boolean {
  return evaluate(route.completion, { obs, elapsedMs: 0 });
}

/**
 * Take a genuinely fresh character. Existing characters on the bot account are
 * deleted first so a canonical run can never inherit power from a previous one.
 */
async function prepareFreshCharacter(
  conn: BotConnection,
  config: BotConfig,
): Promise<string> {
  const roster = await conn.awaitCharacters();

  if (config.freshCharacter) {
    for (const character of roster.characters) {
      await conn.deleteCharacter(character.id);
    }
    const characterId = await conn.createCharacter(config.characterName);
    return characterId;
  }

  const existing = roster.characters[0];
  return existing?.id ?? (await conn.createCharacter(config.characterName));
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs: number,
  what: string,
  signal?: AbortSignal,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (signal?.aborted) throw new AbortError("run aborted");
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleepOrAbort(250, signal);
  }
}

function sleepOrAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return sleep(ms);
  if (signal.aborted) return Promise.reject(new AbortError("run aborted"));
  return new Promise<void>((resolve, reject) => {
    let timer!: ReturnType<typeof setTimeout>;
    const onAbort = (): void => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(new AbortError("run aborted"));
    };
    timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function buildTierEntryInitialState(
  profileId: string,
  targetTier: number,
  economyPolicy: TierEntryInitialState["economyPolicy"],
  frameId: string,
  self: PlayerView,
): TierEntryInitialState {
  return {
    profileId,
    targetTier,
    economyPolicy,
    classRoot: self.selectedClass ?? "unknown",
    frameId,
    spawnNodeId: self.nodeId,
    biomeLevels: { ...self.biomeLevel },
    globalMastery: self.globalMastery,
    bossesCleared: [...self.bossesCleared],
    equipment: { ...self.equipment },
    inventory: [...self.inventory],
    itemUpgrades: { ...self.itemUpgrades },
    knownAbilities: [...self.knownAbilities],
    equippedAbilities: {
      techniques: [...self.equippedAbilities.techniques],
      guards: [...self.equippedAbilities.guards],
    },
    runeRecipesCrafted: [...self.runeRecipesCrafted],
    runesEquipped: self.runesEquipped.map((rule) => ({ ...rule })),
    knownStances: [...self.knownStances],
    equippedStances: { ...self.equippedStances },
    activeStance: self.activeStance,
    knownRites: [...self.knownRites],
    equippedRites: [...self.equippedRites],
    initialEssences: { ...self.essences },
    initialCatalysts: { ...self.catalysts },
  };
}

/**
 * Read the economy candidate out of the LIVE shared data the connected build is
 * running, so a run header records what actually applied rather than a
 * hand-copied intent. `CATALYSTS_SCALED_BY_REWARD_MULTIPLIER` is a constant
 * mirror of the reward path's decision in
 * `server/src/systems/player/progression/rewards.ts`; flip both together.
 */
const CATALYSTS_SCALED_BY_REWARD_MULTIPLIER = false;

function resolveEconomyCandidate(
  economyConfig: ReturnType<typeof t1EconomyConfigForArm>,
): EconomyCandidate {
  return {
    id: economyConfig.experimentId,
    revision: economyConfig.revision,
    arm: economyConfig.arm,
    t1Plus5EssenceCostMultiplier: economyConfig.t1Plus5EssenceCostMultiplier,
    catalystProgressPerUnitT1: economyConfig.catalystProgressPerUnitT1,
    catalystsScaledByRewardMultiplier: CATALYSTS_SCALED_BY_REWARD_MULTIPLIER,
    t1BiomeXpRewardMultiplier: economyConfig.t1BiomeXpRewardMultiplier,
    t1BiomeEssenceRewardMultiplier: economyConfig.t1BiomeEssenceRewardMultiplier,
    t1Plus5EssenceCosts: t1Plus5EssenceCosts(
      economyConfig.t1Plus5EssenceCostMultiplier,
    ),
  };
}
