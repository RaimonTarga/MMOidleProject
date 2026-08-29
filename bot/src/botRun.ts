import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { PlayerDeathPayload } from "@mmo-idle/shared";
import {
  GAME_CONFIG,
  NODE_BIOMES,
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
import type { CompletionState, RunHeader, RunTaint } from "./telemetry/events";
import { BOT_JSONL_SCHEMA_VERSION } from "./telemetry/events";
import { Recorder } from "./telemetry/recorder";
import { TelemetrySink } from "./telemetry/sink";
import { buildSummary, writeSummary, type RunSummary } from "./telemetry/summary";
import { botRegistry, type BotStatus, type WorldEntity, type WorldView } from "./ui/status";

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
  config: Pick<BotConfig, "fastBossRetry">,
  timeScale = process.env.BOT_TIME_SCALE,
): RunTaint[] {
  const taints: RunTaint[] = [];
  if (timeScale && timeScale !== "1") taints.push("NON_CANONICAL_TIME_SCALE");
  if (config.fastBossRetry) taints.push("NON_CANONICAL_FAST_BOSS_RETRY");
  return taints;
}

function gitRevision(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
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
  const route = requireRoute(config.routeId);
  const policy = requirePolicy(config.policyId);
  const runId = `${config.routeId}-${config.policyId}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;

  const sink = new TelemetrySink(config.outDir, runId);
  const startedAt = Date.now();
  const conn = new BotConnection(config.serverUrl, config.devAccountId);
  const obs = new Observation(conn.mirror);
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

  const handleDeath = (payload: PlayerDeathPayload): void => {
    deathCount += 1;
    lastDeathAt = Date.now();
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
    onDelta: () => undefined,
    onWorldEvents: (events) => recorder.ingestWorldEvents(events, obs),
    onDied: handleDeath,
    onAscended: () => undefined,
    onRewardMultiplier: (m) => {
      noteRewardMultiplier(m);
      devToolingSeen = true;
    },
    onKicked: (reason) => {
      aborted = true;
      abortReason = `session kicked: ${reason}`;
    },
  });

  const characterId = await prepareFreshCharacter(conn, config);
  await conn.selectCharacter(characterId);

  // The world admits us asynchronously; the first snapshot names our entity.
  await waitFor(() => obs.self !== null, 60_000, "own player to appear in the world");

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
      )
        .then(() => true)
        .catch(() => false);
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

  const header: RunHeader = {
    schemaVersion: BOT_JSONL_SCHEMA_VERSION,
    runId,
    botId: `${config.routeId}-${config.policyId}`,
    devAccountId: config.devAccountId,
    characterName: config.characterName,
    characterId,
    routeId: route.id,
    routeVersion: route.version,
    policyId: policy.id,
    classRoot: route.classRoot,
    gitRevision: gitRevision(),
    serverUrl: config.serverUrl,
    startedAt,
    rewardMultiplier,
    taints,
    executionMode: config.executionMode,
    maxConcurrency: config.maxConcurrency,
  };
  recorder.emit({ kind: "run-start", atMs: 0, header });
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
      aborted = true;
      abortReason = `run exceeded maxRunMs (${config.maxRunMs}ms)`;
    }
  }, 5_000);

  const onSignal = (): void => {
    aborted = true;
    abortReason = "interrupted";
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
    deathCount: () => deathCount,
    fastBossRetry: config.fastBossRetry,
    fastBossRetryIncludeGuardians: config.fastBossRetryIncludeGuardians,
    leaseSession,
    awaitAlive: async () => {
      while (obs.self?.isDead ?? false) {
        if (aborted) throw new AbortError("run aborted");
        await sleep(500);
      }
      // Respawn returns the character to the region hub with auto-combat off;
      // give the world a beat to settle before the next step acts on position.
      if (Date.now() - lastDeathAt < 5_000) await sleep(2_000);
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
    completion = "completed";
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

  leaseSession?.releaseAll(`run-${completion}`);
  const leaseEvidence = leaseSession?.evidence();
  if (leaseEvidence?.contaminated && !taints.includes("CONTAMINATED_CONTROLLED_OVERLAP")) {
    taints.push("CONTAMINATED_CONTROLLED_OVERLAP");
  }

  const endedAt = Date.now();
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
  });

  await sink.close();
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
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(250);
  }
}
