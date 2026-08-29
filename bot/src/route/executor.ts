import {
  ABILITY_RECIPE_DATABASE,
  BIOME_START_TIER_BY_GROUP,
  RUNE_RECIPE_DATABASE,
  abilitySlotCount,
  ITEM_DATABASE,
  NODE_BIOMES,
  NODE_MODIFIERS,
  biomeLevelCap,
  RECIPE_DATABASE,
  canUnlockSkillFromView,
  globalMasteryRequiredForUpgrade,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  upgradeCatalystCostFor,
  upgradeCeilingFromGlobalMastery,
  upgradeCostFor,
  type EquippedRule,
  type EssenceType,
} from "@mmo-idle/shared";
import type { Intents } from "../net/intents";
import type { RouteLeaseSession } from "../concurrency/routeLeaseSession";
import type { Policy } from "../policy/profiles";
import type { Observation } from "../state/observation";
import { dungeonNodeFor, normalNodesFor } from "../state/observation";
import type { Activity, Recorder } from "../telemetry/recorder";
import {
  describe,
  evaluate,
  recipeShortfall,
  resolveNode,
  resolveNearCandidates,
  resolveNodeCandidates,
  shortfall,
} from "./conditions";
import type { Condition, NodeRef, Route, RouteStep } from "./types";

const POLL_MS = 500;
/** A farm with no kill and no wallet movement for this long is stuck, not slow. */
const DEFAULT_NO_PROGRESS_MS = 12 * 60 * 1000;
/** Ceiling on any single step, so one impossible goal cannot eat a whole run. */
const DEFAULT_STEP_TIMEOUT_MS = 6 * 60 * 60 * 1000;
/**
 * How much further than the closest candidate a node may be and still count as
 * "near". Two hops keeps a bot inside its target biome's local cluster; beyond
 * that a fall-through starts crossing other biomes.
 */
const NEAR_CANDIDATE_SLACK_HOPS = 2;
/**
 * How long to hold out for a near node before accepting any free one. A bot that
 * owns the node it is standing in keeps farming while it waits, so waiting is
 * usually cheaper than a multi-biome walk -- but this bounds it so a busy
 * cluster can never wedge a run.
 */
const NEAR_CANDIDATE_WIDEN_MS = 90_000;

const TRAVEL_TIMEOUT_MS = 10 * 60 * 1000;
/**
 * Grace before declaring a capped biome a dead end. Long enough that a goal
 * which is merely essence-hungry (essence keeps flowing at cap) still resolves.
 */
const BIOME_CAPPED_GRACE_MS = 8 * 60 * 1000;
const BOSS_FIGHT_TIMEOUT_MS = 12 * 60 * 1000;
/**
 * Budget for pre-clearing a dungeon's guard. Generous: a guard is a real fight
 * and the bot may die to it and walk back several times.
 */
const GUARD_CLEAR_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * The server answers every acknowledged mutating intent with this exact reason
 * while the player is dead (or before its entity has resolved after a
 * reconnect). It is a transient state, not a refusal: the same request works a
 * few seconds later, once the respawn lands. Treat it as "wait and retry"
 * rather than as a fatal stall.
 */
const NOT_LIVE_REJECTION = "Not available while dead or disconnected.";
/** Ceiling so a genuinely stuck-dead bot still stalls instead of looping forever. */
const NOT_LIVE_RETRY_LIMIT = 20;

export class StallError extends Error {
  constructor(
    message: string,
    readonly detail: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export class AbortError extends Error {}

export interface ExecutorDeps {
  obs: Observation;
  intents: Intents;
  recorder: Recorder;
  policy: Policy;
  route: Route;
  startedAt: number;
  /** True once the run should wind down (timeout, signal, fatal socket error). */
  aborted: () => boolean;
  /** Resolves when the player is alive and back in the world after a death. */
  awaitAlive: () => Promise<void>;
  /** Deaths so far — used to detect a death during a boss attempt. */
  deathCount: () => number;
  /** Explicit noncanonical retry acceleration; never inferred from route data. */
  fastBossRetry: boolean;
  fastBossRetryIncludeGuardians: boolean;
  leaseSession?: RouteLeaseSession;
}

export class RouteExecutor {
  private rotation = 0;
  /** Near cluster for the farm step being set up, consumed by `farmUntil`. */
  private nearCandidates: readonly string[] | undefined;
  private readonly firedMilestones = new Set<string>();
  private stepIndex = 0;
  private stepLabel = "";

  constructor(private readonly deps: ExecutorDeps) {}

  get currentStepIndex(): number {
    return this.stepIndex;
  }

  get currentStepLabel(): string {
    return this.stepLabel;
  }

  private elapsed(): number {
    return Date.now() - this.deps.startedAt;
  }

  private test(condition: Condition): boolean {
    return evaluate(condition, { obs: this.deps.obs, elapsedMs: this.elapsed() });
  }

  /** Run the whole route. Resolves on completion; throws StallError otherwise. */
  async run(): Promise<void> {
    await this.runSteps(this.deps.route.steps);
  }

  private async runSteps(steps: RouteStep[]): Promise<void> {
    for (const step of steps) {
      if (this.deps.aborted()) throw new AbortError("run aborted");

      if (step.optional && !this.deps.policy.performsOptional(step)) continue;

      // The route may already be satisfied by an earlier detour (revisit routes
      // are explicitly supported), so completion short-circuits the remainder.
      if (this.test(this.deps.route.completion)) return;

      const label = step.label ?? defaultLabel(step);
      const index = this.stepIndex++;
      this.stepLabel = label;
      const startedAt = Date.now();

      this.deps.recorder.emit({
        kind: "route-step-start",
        atMs: this.deps.recorder.now(),
        index,
        label,
        stepType: step.type,
      });

      try {
        await this.runStep(step);
      } catch (err) {
        if (err instanceof StallError) {
          this.deps.recorder.emit({
            kind: "route-step-end",
            atMs: this.deps.recorder.now(),
            index,
            label,
            stepType: step.type,
            durationMs: Date.now() - startedAt,
            outcome: "stalled",
            reason: err.message,
          });
        }
        throw err;
      }

      this.deps.recorder.emit({
        kind: "route-step-end",
        atMs: this.deps.recorder.now(),
        index,
        label,
        stepType: step.type,
        durationMs: Date.now() - startedAt,
        outcome: "done",
      });

      this.checkMilestones();
    }
  }

  private async runStep(step: RouteStep): Promise<void> {
    switch (step.type) {
      case "milestone":
        this.fireMilestone(step.id);
        return;
      case "chooseClass":
      case "unlockSkill":
        return this.doUnlockSkill(step.skillId);
      case "travel":
        return this.doTravel(step.to);
      case "farm":
        return this.doFarm(step, step.stallAfterMs);
      case "craft":
        return this.doCraft(step);
      case "equip":
        return this.doEquip(step.definitionIds);
      case "upgrade":
        return this.doUpgrade(step);
      case "configureRunes":
        return this.doConfigureRunes(step.rules);
      case "learnAbility":
        return this.doLearnAbility(step);
      case "setAbilities":
        return this.doSetAbilities(step);
      case "craftRune":
        return this.doCraftRune(step);
      case "attemptBoss":
        return this.doAttemptBoss(step);
      case "repeatUntil":
        return this.doRepeatUntil(step);
    }
  }

  // ── Step handlers ───────────────────────────────────────────────────────

  private async doUnlockSkill(skillId: string): Promise<void> {
    const { obs, intents } = this.deps;
    if (obs.self?.unlockedSkills.includes(skillId)) return;

    // A root costs a skill point, which only a tier-up grants — so wait for the
    // point rather than spamming an intent the server will reject.
    await this.waitUntil(
      () => {
        const self = obs.self;
        return !!self && canUnlockSkillFromView(self, skillId).ok;
      },
      {
        timeoutMs: DEFAULT_STEP_TIMEOUT_MS,
        what: `skill ${skillId} unlockable`,
        onStall: () => ({
          reason: obs.self ? canUnlockSkillFromView(obs.self, skillId).reason : "no player",
          skillPoints: obs.self?.skillPoints ?? 0,
        }),
      },
    );

    await this.emitUntil(
      () => intents.unlockSkill(skillId),
      () => obs.self?.unlockedSkills.includes(skillId) ?? false,
      { timeoutMs: 2 * 60 * 1000, what: `skill ${skillId} applied` },
    );
    this.deps.recorder.emit({
      kind: "build-change",
      atMs: this.deps.recorder.now(),
      system: "skills",
      detail: { skillId, selectedClass: this.deps.obs.self?.selectedClass ?? null },
    });
  }

  private async doTravel(ref: NodeRef): Promise<void> {
    const candidates = resolveNodeCandidates(ref, this.deps.obs, this.rotation);
    if (candidates.length === 0) throw new StallError("cannot reach target area", { ref });
    // A travel step ENDS with the bot standing still in the destination, so it
    // must own it on arrival. Travelling unleased into a node another controlled
    // bot is farming would park us in its fight -- the same overlap as walking
    // out late, just at the other end of the journey.
    const granted = await this.deps.leaseSession?.acquireActivity(
      candidates,
      this.deps.obs,
      this.deps.intents,
      `travel:${candidates[0]}`,
      {
        preferredNodeIds: resolveNearCandidates(
          ref,
          this.deps.obs,
          this.rotation,
          NEAR_CANDIDATE_SLACK_HOPS,
        ),
        widenAfterMs: NEAR_CANDIDATE_WIDEN_MS,
      },
    );
    await this.ensureAt(granted ?? candidates[0]);
  }

  /**
   * Walk to `nodeId` and confirm arrival. Auto-combat is switched off first:
   * `startManualNavigation` clears it server-side anyway, and leaving it on
   * means the bot fights its way across the map instead of travelling.
   */
  private async ensureAt(nodeId: string): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    if (obs.nodeId === nodeId) return;

    // The lease on the node we are LEAVING is held until the server confirms we
    // are no longer standing in it. Releasing at the decision to travel opened a
    // multi-second window where the node was free but our avatar was still in
    // it, so the next controlled bot could be granted it and start farming
    // around us -- exactly the overlap the leases exist to prevent. The
    // destination lease is never touched here; `acquireActivity` already owns it.
    const departingFrom = obs.nodeId;

    recorder.setActivity("travel");
    intents.setAuto(false);
    intents.navigateTo(nodeId);

    let lastNode = obs.nodeId;
    let lastProgressAt = Date.now();
    let fightingBack = false;
    let deathsAtStart = this.deps.deathCount();

    await this.waitUntil(() => obs.nodeId === nodeId, {
      timeoutMs: TRAVEL_TIMEOUT_MS,
      what: `arrive at ${nodeId}`,
      onPoll: () => {
        const self = obs.self;
        if (!self) return;

        // Authoritative departure: our own position slice says we are somewhere
        // else, so the node we left is genuinely free for the next bot.
        if (departingFrom && obs.nodeId && obs.nodeId !== departingFrom) {
          this.deps.leaseSession?.releaseNode(departingFrom, "departed-node");
        }

        // A death clears the traverse path and dumps us at the region hub, so
        // the walk has to be re-issued rather than waited out. Without this the
        // bot ping-pongs: die in a transit node, respawn, wander back, die.
        const deaths = this.deps.deathCount();
        if (deaths > deathsAtStart) {
          deathsAtStart = deaths;
          fightingBack = false;
          if (!self.isDead) {
            intents.setAuto(false);
            intents.navigateTo(nodeId);
            lastProgressAt = Date.now();
          }
          return;
        }
        if (self.isDead) return;

        // FIGHT BACK WHILE TRAVELLING. `navigateTo` turns auto-combat off
        // server-side ("the player just travels"), which means walking through a
        // hostile node taking hits without swinging back — measured: three
        // deaths in a row crossing one Forest node. The game's own auto-traverse
        // keeps combat on, so this uses the same shipped behavior: swing back
        // while engaged, resume the walk once clear. No bespoke tactics.
        // ...but NEVER inside a node another controlled bot holds. Fighting back
        // parks the bot mid-transit until nothing is attacking it, and in a
        // leased node that meant real kills, catalyst gains and stolen aggro in
        // someone else's evidence (measured at 8-bot scale: 21s and 15s+ bouts,
        // a kill and a catalyst inside nodes the bot did not own). Walking on
        // through is the correct behaviour: the crossing is short, and taking
        // the hits only risks THIS run, which is ours to lose.
        const inForeignNode = this.deps.leaseSession?.isForeignNode(obs.nodeId) ?? false;
        const attackers = obs.attackersOnSelf().length;
        if (attackers > 0 && !inForeignNode) {
          if (!fightingBack) {
            fightingBack = true;
            intents.setAutocombatConfig(this.deps.policy.autocombat);
            intents.setAuto(true);
          }
          // Being jumped mid-transit is not a stall.
          lastProgressAt = Date.now();
          return;
        }
        if (attackers > 0 && inForeignNode) {
          // Keep the walk alive rather than trading blows in a leased node.
          if (fightingBack) {
            fightingBack = false;
            intents.setAuto(false);
            intents.navigateTo(nodeId);
          }
          lastProgressAt = Date.now();
          return;
        }
        if (fightingBack) {
          fightingBack = false;
          intents.setAuto(false);
          intents.navigateTo(nodeId);
          lastProgressAt = Date.now();
          return;
        }

        // Crossing any gate counts as progress; a re-issued navigate recovers
        // from a path dropped by a node freeze.
        if (obs.nodeId !== lastNode) {
          lastNode = obs.nodeId;
          lastProgressAt = Date.now();
        } else if (Date.now() - lastProgressAt > 60_000) {
          lastProgressAt = Date.now();
          intents.navigateTo(nodeId);
        }
      },
      onStall: () => ({ from: obs.nodeId, to: nodeId, deaths: this.deps.deathCount() }),
    });
    // Arrival satisfies the predicate, which can end the wait before `onPoll`
    // observes the last hop -- so the departure release is repeated here.
    if (departingFrom && departingFrom !== nodeId) {
      this.deps.leaseSession?.releaseNode(departingFrom, "departed-node");
    }
    intents.setAuto(false);
    recorder.setActivity("idle");
  }

  /** Auto-combat in place until the goal holds. */
  private async doFarm(
    step: Extract<RouteStep, { type: "farm" }>,
    stallAfterMs?: number,
  ): Promise<void> {
    const condition = this.deps.policy.farmCondition(step.until);
    const nodes = resolveNodeCandidates(step.at, this.deps.obs, this.rotation);
    if (nodes.length === 0) throw new StallError("cannot reach target area", { at: step.at });
    this.nearCandidates = resolveNearCandidates(
      step.at,
      this.deps.obs,
      this.rotation,
      NEAR_CANDIDATE_SLACK_HOPS,
    );
    await this.farmUntil(nodes, () => this.test(condition), {
      what: describe(condition),
      noProgressMs: stallAfterMs ?? DEFAULT_NO_PROGRESS_MS,
      onStall: () => shortfall(condition, this.deps.obs),
    });
  }

  /**
   * The one place auto-combat is enabled. Farming is deliberately the game's own
   * behavior: no bot-only tactics, no hazard avoidance, no manual dodging. The
   * only tactical reactions come from equipped Runes.
   */
  /**
   * `candidates` is an ordered preference list. Index 0 is the node a solo run
   * uses, so sequential behaviour is unchanged; the coordinator may hand back a
   * later entry under isolated-parallel when the preferred node is leased by
   * another controlled bot. Callers that must hit ONE specific node (a catalyst
   * supplier, a dungeon) pass a single-entry list and therefore queue instead.
   */
  private async farmUntil(
    candidates: string | readonly string[],
    done: () => boolean,
    opts: {
      what: string;
      noProgressMs: number;
      onStall: () => Record<string, number>;
      /** Set when the goal genuinely is essence-only, so a capped biome is fine. */
      ignoreBiomeCap?: boolean;
      /**
       * Activity to attribute this farming to. `farmBlocked` passes "blocked" so
       * economy waiting is not silently re-labelled as ordinary farming — the
       * whole point of the span is to measure how long the economy stalls a run.
       */
      activity?: Activity;
    },
  ): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    if (done()) return;

    const preference = typeof candidates === "string" ? [candidates] : [...candidates];
    if (preference.length === 0) throw new StallError("cannot reach target area", {});
    const granted = await this.deps.leaseSession?.acquireActivity(
      preference,
      obs,
      intents,
      opts.activity === "blocked" ? `resource-farm:${opts.what}` : `farm:${opts.what}`,
      {
        preferredNodeIds: this.nearCandidates,
        widenAfterMs: NEAR_CANDIDATE_WIDEN_MS,
      },
    );
    this.nearCandidates = undefined;
    const nodeId = granted ?? preference[0];
    await this.ensureAt(nodeId);
    recorder.setActivity(opts.activity ?? "farm");
    intents.setAutocombatConfig(this.deps.policy.autocombat);
    intents.setAutoTraverse(false);
    intents.setAuto(true);

    let lastProgressAt = Date.now();
    let lastSignal = progressSignal(obs);
    let lastNudgeAt = Date.now();
    const farmedBiome = NODE_BIOMES[nodeId]?.biomeGroup ?? null;

    try {
      await this.waitUntil(done, {
        timeoutMs: DEFAULT_STEP_TIMEOUT_MS,
        what: opts.what,
        onPoll: () => {
          const signal = progressSignal(obs);
          if (signal !== lastSignal) {
            lastSignal = signal;
            lastProgressAt = Date.now();
          }

          // Farming node X can only ever raise biome(X)'s level. Once that biome
          // sits at `biomeLevelCap(playerTier, biome)` and the goal is still
          // unmet, more kills here cannot satisfy it — the goal needs breadth
          // (other biomes) or a tier-up. Essence keeps trickling in, so the
          // no-progress timer never fires and the step would grind for hours.
          // This is the shape of the Global-Mastery upgrade ceiling: T1 `+3`
          // needs GM 18, but a single T1 biome caps at 6.
          if (farmedBiome && !opts.ignoreBiomeCap) {
            const self = obs.self;
            const cap = self ? biomeLevelCap(self.playerTier, farmedBiome) : Infinity;
            const level = obs.biomeLevel(farmedBiome);
            if (
              level >= cap &&
              Date.now() - lastProgressAt > BIOME_CAPPED_GRACE_MS
            ) {
              throw new StallError(
                `${farmedBiome} is at its level cap (${cap}) and ${opts.what} is still unmet — this goal needs progress in other biomes, not more farming here`,
                {
                  nodeId,
                  biomeGroup: farmedBiome,
                  biomeLevel: level,
                  biomeLevelCap: cap,
                  playerTier: self?.playerTier ?? 0,
                  globalMastery: self?.globalMastery ?? 0,
                  goal: opts.what,
                  missing: opts.onStall(),
                },
              );
            }
          }
          // A death respawns us at the region hub with auto-combat off; walk
          // back and switch it on again rather than idling out the step.
          if (obs.nodeId !== nodeId && !(obs.self?.isDead ?? false)) {
            if (Date.now() - lastNudgeAt > 15_000) {
              lastNudgeAt = Date.now();
              intents.setAuto(false);
              intents.navigateTo(nodeId);
            }
          } else if (obs.nodeId === nodeId && !(obs.self?.auto ?? false)) {
            intents.setAuto(true);
          }
          if (Date.now() - lastProgressAt > opts.noProgressMs) {
            throw new StallError(
              `no progress for ${Math.round(opts.noProgressMs / 60000)}m while farming ${nodeId} for ${opts.what}`,
              { nodeId, goal: opts.what, missing: opts.onStall() },
            );
          }
        },
        onStall: () => ({ nodeId, goal: opts.what, missing: opts.onStall() }),
      });
    } finally {
      recorder.setActivity("idle");
    }
  }

  /**
   * Send one acknowledged mutating intent, retrying the dead/disconnected
   * rejection. A route can reach a craft/upgrade step the same tick something
   * kills the bot -- that is normal, and the run should continue after the
   * respawn instead of ending on an incidental rejection.
   *
   * `record` runs for EVERY attempt, so the rejected ones stay in telemetry.
   */
  private async mutate<T extends { success: boolean; reason?: string }>(
    send: () => Promise<T>,
    record?: (result: T) => void,
  ): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      if (this.deps.aborted()) throw new AbortError("run aborted");
      await this.deps.awaitAlive();

      const result = await send();
      record?.(result);
      if (result.success || result.reason !== NOT_LIVE_REJECTION) return result;
      if (attempt >= NOT_LIVE_RETRY_LIMIT) return result;

      // `awaitAlive` only watches `isDead`; the entity can also be mid-resolve
      // (reconnect), where `obs.self` is simply absent. Give the world a beat
      // either way before asking again.
      await sleep(POLL_MS * 2);
    }
  }

  private async doCraft(step: Extract<RouteStep, { type: "craft" }>): Promise<void> {
    const { obs, intents, recorder } = this.deps;

    for (const recipeId of step.recipeIds) {
      if (obs.hasItem(recipeId)) continue;

      const recipe = RECIPE_DATABASE.get(recipeId);
      if (!recipe) throw new StallError("unknown recipe in route", { recipeId });

      const farmNode =
        (step.farmAt ? resolveNode(step.farmAt, obs, this.rotation) : null) ??
        this.defaultFarmNodeFor(recipe.recipeGroup);

      if (!obs.canCraft(recipeId)) {
        if (!farmNode) {
          throw new StallError("cannot satisfy crafting requirement", {
            recipeId,
            missing: recipeShortfall(recipeId, obs),
            unlocked: obs.recipeUnlocked(recipeId),
          });
        }
        await this.farmBlocked(farmNode, `craft:${recipeId}`, () => obs.canCraft(recipeId), () =>
          obs.recipeUnlocked(recipeId)
            ? recipeShortfall(recipeId, obs)
            : { [`biomeLevel.${recipe.recipeGroup}`]: recipe.requiredBiomeLevel },
        );
      }

      const result = await this.mutate(
        () => intents.craftRecipe(recipeId),
        // The spend is the recipe's authored cost, not a wallet diff: the wallet
        // only moves when the next 5 Hz delta lands, so a diff taken here reads
        // zero. `crafting:result` already tells us the charge went through.
        (attempt) =>
          recorder.emit({
            kind: "craft",
            atMs: recorder.now(),
            recipeId,
            success: attempt.success,
            reason: attempt.reason,
            essenceSpent: attempt.success ? { ...recipe.cost } : {},
            catalystsSpent: attempt.success
              ? definedNumbers(recipe.catalystCost ?? {})
              : {},
            context: recorder.context(obs.nodeId),
          }),
      );

      if (!result.success) {
        throw new StallError(`craft rejected: ${result.reason ?? "unknown"}`, { recipeId });
      }
      recorder.biome(recipe.recipeGroup).craftsCompleted += 1;

      // The item lands in inventory asynchronously via the next delta.
      await this.waitUntil(() => obs.hasItem(recipeId), {
        timeoutMs: 30_000,
        what: `${recipeId} in inventory`,
      });
    }
  }

  private async doEquip(definitionIds: string[]): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    for (const definitionId of definitionIds) {
      if (!obs.hasItem(definitionId)) {
        throw new StallError("cannot equip an item the run never obtained", { definitionId });
      }
      const already = Object.values(obs.self?.equipment ?? {}).includes(definitionId);
      if (already) continue;

      await this.emitUntil(
        () => intents.equipItem(definitionId),
        () => Object.values(obs.self?.equipment ?? {}).includes(definitionId),
        {
          timeoutMs: 3 * 60 * 1000,
          what: `${definitionId} equipped`,
          onStall: () => ({
            inventory: obs.self?.inventory ?? [],
            equipment: obs.self?.equipment ?? {},
            isDead: obs.self?.isDead ?? false,
          }),
        },
      );

      const slot =
        Object.entries(obs.self?.equipment ?? {}).find(([, id]) => id === definitionId)?.[0] ??
        "unknown";
      recorder.emit({
        kind: "equip",
        atMs: recorder.now(),
        slot,
        definitionId,
      });
    }
  }

  private async doUpgrade(step: Extract<RouteStep, { type: "upgrade" }>): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    const recipe = RECIPE_DATABASE.get(step.definitionId);
    let target = Math.min(
      this.deps.policy.upgradeTarget(step.toPlus),
      obs.maxUpgradeFor(step.definitionId),
    );

    // Clamp to what Global Mastery currently permits. Without this the step
    // farms one biome forever toward a ceiling only breadth across biomes can
    // lift — the capped-biome guard would eventually stall the run, which is
    // correct but is not what an intended player would do.
    if (step.opportunistic && recipe) {
      const ceiling = upgradeCeilingFromGlobalMastery(
        obs.self?.globalMastery ?? 0,
        recipe.tier,
      );
      if (ceiling < target) {
        this.deps.recorder.emit({
          kind: "build-change",
          atMs: this.deps.recorder.now(),
          system: "upgrade-ceiling",
          detail: {
            itemId: step.definitionId,
            requested: target,
            allowedByGlobalMastery: ceiling,
            globalMastery: obs.self?.globalMastery ?? 0,
          },
        });
      }
      target = Math.min(target, ceiling);
    }
    if (target <= 0) return;

    while (obs.itemPlus(step.definitionId) < target) {
      if (this.deps.aborted()) throw new AbortError("run aborted");

      const check = obs.canUpgrade(step.definitionId);
      if (!check.ok) {
        const nextPlus = obs.itemPlus(step.definitionId) + 1;
        const farmNode = this.upgradeFarmNode(step, recipe, nextPlus);
        if (!farmNode) {
          throw new StallError(`cannot upgrade ${step.definitionId}: ${check.reason}`, {
            definitionId: step.definitionId,
            plus: obs.itemPlus(step.definitionId),
            target,
          });
        }
        // Is the blocker Global Mastery, or just essence? If GM already permits
        // the next level then only essence is missing, and essence keeps flowing
        // from a biome sitting at its level cap — so the capped-biome guard must
        // NOT fire. This is exactly the case in the pre-boss push to +5, where
        // every biome is maxed by construction.
        const gmAllowsNext =
          !!recipe &&
          upgradeCeilingFromGlobalMastery(obs.self?.globalMastery ?? 0, recipe.tier) >=
            nextPlus;

        await this.farmBlocked(
          farmNode,
          `upgrade:${step.definitionId}+${nextPlus}`,
          () => obs.canUpgrade(step.definitionId).ok,
          () => ({
            blocked: 1,
            ...(gmAllowsNext
              ? {}
              : {
                  globalMasteryNeeded:
                    globalMasteryRequiredForUpgrade(recipe?.tier ?? 1, nextPlus) -
                    (obs.self?.globalMastery ?? 0),
                }),
          }),
          gmAllowsNext,
        );
        continue;
      }

      // Same reasoning as craft: read the authored step cost for the level the
      // server says we reached, rather than racing the wallet delta.
      const item = ITEM_DATABASE.get(step.definitionId);
      const result = await this.mutate(
        () => intents.upgradeItem(step.definitionId),
        (attempt) => {
          const stepCost =
            attempt.success && item ? (upgradeCostFor(item, attempt.newLevel) ?? {}) : {};
          const stepCatalysts =
            attempt.success && item
              ? (upgradeCatalystCostFor(item, attempt.newLevel) ?? {})
              : {};
          recorder.emit({
            kind: "upgrade",
            atMs: recorder.now(),
            itemId: step.definitionId,
            newLevel: attempt.newLevel,
            success: attempt.success,
            reason: attempt.reason,
            essenceSpent: { ...stepCost },
            catalystsSpent: definedNumbers(stepCatalysts),
            context: recorder.context(obs.nodeId),
          });
        },
      );

      if (!result.success) {
        throw new StallError(`upgrade rejected: ${result.reason ?? "unknown"}`, {
          definitionId: step.definitionId,
        });
      }
      if (recipe) recorder.biome(recipe.recipeGroup).upgradesCompleted += 1;

      await this.waitUntil(() => obs.itemPlus(step.definitionId) >= result.newLevel, {
        timeoutMs: 30_000,
        what: `${step.definitionId} at +${result.newLevel}`,
      });
    }
  }

  private async doConfigureRunes(rules: EquippedRule[]): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    const wanted = this.deps.policy.runeLoadout(rules);

    // A rule the player has not actually unlocked is not theirs to use; the
    // server sanitises it away, and the run would silently differ from the
    // route. Drop those here so telemetry records what was really equipped.
    const owned = new Set(obs.self?.runesOwned ?? []);
    const affordable = wanted.filter(
      (rule) => owned.has(rule.conditionId) && owned.has(rule.actionId),
    );

    // Runic Points are a real budget the player has to earn. Trim from the tail
    // (lowest authored priority) rather than letting the server silently drop
    // rules we then report as equipped.
    const budget = runeBudgetForGlobalMastery(obs.self?.globalMastery ?? 0);
    const usable = [...affordable];
    while (
      usable.length > 0 &&
      runicPointLoadoutCost({ rules: usable, rites: obs.self?.equippedRites ?? [] }) > budget
    ) {
      usable.pop();
    }

    await this.emitUntil(
      () => intents.setRuneLoadout(usable),
      () => runeLoadoutsEqual(obs.self?.runesEquipped ?? [], usable),
      {
        timeoutMs: 2 * 60 * 1000,
        what: "exact ordered rune loadout applied",
        onStall: () => ({
          wanted: usable,
          live: obs.self?.runesEquipped ?? [],
        }),
      },
    );

    recorder.emit({
      kind: "build-change",
      atMs: recorder.now(),
      system: "runes",
      detail: {
        requested: wanted.length,
        equipped: obs.self?.runesEquipped ?? [],
        droppedUnowned: wanted.length - affordable.length,
        droppedOverBudget: affordable.length - usable.length,
        budget,
      },
    });
  }

  private async doLearnAbility(
    step: Extract<RouteStep, { type: "learnAbility" }>,
  ): Promise<void> {
    const { obs, intents, recorder } = this.deps;

    if (!obs.self?.knownAbilities.includes(step.abilityId)) {
      const recipe = ABILITY_RECIPE_DATABASE.get(step.recipeId);
      if (!recipe) throw new StallError("unknown ability recipe in route", { step });

      const farmNode =
        (step.farmAt ? resolveNode(step.farmAt, obs, this.rotation) : null) ??
        (recipe.recipeGroup ? this.defaultFarmNodeFor(recipe.recipeGroup) : null);

      const affordable = (): boolean => {
        for (const [type, amount] of Object.entries(recipe.cost)) {
          if (obs.essence(type as EssenceType) < (amount ?? 0)) return false;
        }
        const group = recipe.recipeGroup;
        const level = recipe.requiredBiomeLevel ?? 0;
        return !group || obs.biomeLevel(group) >= level;
      };

      if (!affordable()) {
        if (!farmNode) {
          throw new StallError("cannot satisfy ability requirement", { step });
        }
        await this.farmBlocked(farmNode, `ability:${step.abilityId}`, affordable, () => {
          const missing: Record<string, number> = {};
          for (const [type, amount] of Object.entries(recipe.cost)) {
            const short = (amount ?? 0) - obs.essence(type as EssenceType);
            if (short > 0) missing[`essence.${type}`] = short;
          }
          if (recipe.recipeGroup) {
            const short =
              (recipe.requiredBiomeLevel ?? 0) - obs.biomeLevel(recipe.recipeGroup);
            if (short > 0) missing[`biomeLevel.${recipe.recipeGroup}`] = short;
          }
          return missing;
        });
      }

      const result = await this.mutate(() => intents.craftAbilityRecipe(step.recipeId));
      if (!result.success) {
        throw new StallError(`ability craft rejected: ${result.reason ?? "unknown"}`, { step });
      }
      await this.waitUntil(() => obs.self?.knownAbilities.includes(step.abilityId) ?? false, {
        timeoutMs: 30_000,
        what: `${step.abilityId} learned`,
      });
    }

    const current = obs.self?.equippedAbilities ?? { techniques: [], guards: [] };
    const key = step.slot === "guard" ? "guards" : "techniques";
    if (current[key].includes(step.abilityId)) return;

    // Tier 1 grants ONE slot per kind, so slotting a newly learned ability
    // REPLACES the incumbent. Appending would exceed `abilitySlotCount` and the
    // server would silently truncate — leaving the run using an ability the
    // route thought it had swapped away.
    const slots = abilitySlotCount(obs.self?.playerTier ?? 0);
    const capacity = Math.max(1, slots[step.slot]);
    const next = {
      techniques: [...current.techniques],
      guards: [...current.guards],
    };
    next[key] = [step.abilityId, ...next[key]].slice(0, capacity);
    await this.emitUntil(
      () => intents.setAbilityLoadout(next),
      () => obs.self?.equippedAbilities[key].includes(step.abilityId) ?? false,
      { timeoutMs: 3 * 60 * 1000, what: `${step.abilityId} slotted` },
    );

    recorder.emit({
      kind: "build-change",
      atMs: recorder.now(),
      system: "abilities",
      detail: {
        abilityId: step.abilityId,
        slot: step.slot,
        equipped: obs.self?.equippedAbilities ?? null,
      },
    });
  }

  private async doSetAbilities(
    step: Extract<RouteStep, { type: "setAbilities" }>,
  ): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    const known = new Set(obs.self?.knownAbilities ?? []);

    for (const abilityId of [...step.techniques, ...step.guards]) {
      if (!known.has(abilityId)) {
        throw new StallError(
          `cannot equip ${abilityId}: the run never learned it`,
          { abilityId, known: [...known] },
        );
      }
    }

    const slots = abilitySlotCount(obs.self?.playerTier ?? 0);
    const equipped = {
      techniques: step.techniques.slice(0, Math.max(1, slots.technique)),
      guards: step.guards.slice(0, Math.max(1, slots.guard)),
    };
    await this.emitUntil(
      () => intents.setAbilityLoadout(equipped),
      () => {
        const live = obs.self?.equippedAbilities;
        if (!live) return false;
        return (
          equipped.techniques.every((a) => live.techniques.includes(a)) &&
          equipped.guards.every((a) => live.guards.includes(a))
        );
      },
      { timeoutMs: 3 * 60 * 1000, what: `abilities ${JSON.stringify(equipped)} slotted` },
    );

    recorder.emit({
      kind: "build-change",
      atMs: recorder.now(),
      system: "abilities",
      detail: { requested: equipped, live: obs.self?.equippedAbilities ?? null },
    });
  }

  private async doCraftRune(
    step: Extract<RouteStep, { type: "craftRune" }>,
  ): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    const recipe = RUNE_RECIPE_DATABASE.get(step.recipeId);
    if (!recipe) throw new StallError("unknown rune recipe in route", { step });
    if (obs.self?.runeRecipesCrafted.includes(step.recipeId)) return;

    const farmNode =
      (step.farmAt ? resolveNode(step.farmAt, obs, this.rotation) : null) ??
      (recipe.recipeGroup ? this.defaultFarmNodeFor(recipe.recipeGroup) : null);

    const missing = (): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const [type, amount] of Object.entries(recipe.cost)) {
        const short = (amount ?? 0) - obs.essence(type as EssenceType);
        if (short > 0) out[`essence.${type}`] = short;
      }
      if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
        const short = recipe.requiredBiomeLevel - obs.biomeLevel(recipe.recipeGroup);
        if (short > 0) out[`biomeLevel.${recipe.recipeGroup}`] = short;
      }
      return out;
    };

    if (Object.keys(missing()).length > 0) {
      if (!farmNode) throw new StallError("cannot satisfy rune requirement", { step });
      await this.farmBlocked(
        farmNode,
        `rune:${step.recipeId}`,
        () => Object.keys(missing()).length === 0,
        missing,
        true,
      );
    }

    const result = await this.mutate(() => intents.craftRuneRecipe(step.recipeId));
    if (!result.success) {
      throw new StallError(`rune craft rejected: ${result.reason ?? "unknown"}`, { step });
    }
    await this.waitUntil(
      () => obs.self?.runeRecipesCrafted.includes(step.recipeId) ?? false,
      { timeoutMs: 30_000, what: `${step.recipeId} crafted` },
    );

    recorder.emit({
      kind: "build-change",
      atMs: recorder.now(),
      system: "rune-forge",
      detail: { recipeId: step.recipeId, runeId: recipe.runeId ?? null },
    });
  }

  /**
   * Kill every guardian while the dungeon is still idle, so the boss is fought
   * alone.
   *
   * Guarded-altar dungeons spawn NO ordinary monsters, so plain auto-combat in
   * the node engages guardians and nothing else. Dying mid-clear is survivable -
   * guardians already killed stay dead while the dungeon is idle - but the guard
   * reforms 90s after the last kill, which this loop simply re-clears.
   */
  private async clearDungeonGuard(
    nodeId: string,
    step: Extract<RouteStep, { type: "attemptBoss" }>,
    attempt: number,
  ): Promise<void> {
    const { obs, intents, recorder } = this.deps;

    // The view rides this node's delta, so we must already be standing here.
    await this.waitUntil(() => obs.dungeon !== undefined, {
      timeoutMs: 60_000,
      what: `dungeon view for ${nodeId}`,
      onStall: () => ({ nodeId, at: obs.nodeId }),
    });

    // `undefined` means we cannot SEE the dungeon (dead, or between nodes) - it
    // is emphatically not "zero guardians left". Reading an absent view as 0 let
    // an attempt declare the guard cleared in the same second it started, which
    // is exactly the false positive that puts the bot back in front of a boss
    // with twelve guardians on it.
    const alive = (): number | null => obs.dungeon?.guardianAlive ?? null;
    let total = obs.dungeon?.guardianTotal ?? 0;
    const startedAt = Date.now();

    recorder.emit({
      kind: "dungeon-guard",
      atMs: recorder.now(),
      phase: "start",
      nodeId,
      biomeGroup: step.biomeGroup,
      attempt,
      guardianTotal: total,
      guardianAlive: alive() ?? -1,
    });

    let outcome: "cleared" | "reformed" | "gave-up" = "cleared";
    try {
      if ((alive() ?? 0) > 0 && !obs.bossCleared(step.biomeGroup, step.tier)) {
        intents.setAutocombatConfig(this.deps.policy.autocombat);
        intents.setAutoTraverse(false);
        intents.setAuto(true);

        let lastAlive = alive() ?? 0;
        let lastProgressAt = Date.now();

        // Also exit the moment the boss itself is already down (e.g. a mutual
        // kill against the guard pack in a PRIOR attempt landed the boss's
        // killing blow too). The guard's own "reformed" timer means its alive
        // count can keep changing forever on an already-irrelevant fight,
        // which resets `lastProgressAt` below and defeats the stall timeout --
        // without this, a bot can be stuck re-clearing a beaten boss's guard
        // pack indefinitely. `doAttemptBoss`'s own post-guard check (see its
        // comment) is what actually turns this into "victory" once we return.
        await this.waitUntil(
          () => alive() === 0 || obs.bossCleared(step.biomeGroup, step.tier),
          {
            timeoutMs: GUARD_CLEAR_TIMEOUT_MS,
            what: `${step.biomeGroup} guard cleared`,
            onPoll: () => {
              const now = alive();
            if (now === null) {
              // View gone: we died or left. Get back and look again.
              if (obs.nodeId !== nodeId && !(obs.self?.isDead ?? false)) {
                intents.setAuto(false);
                intents.navigateTo(nodeId);
              }
              return;
            }
            total = obs.dungeon?.guardianTotal ?? total;
            if (now !== lastAlive) {
              // A RISING count means the guard reformed (the 90s pre-clear timer
              // elapsed). That is information, not a stall - keep going.
              if (now > lastAlive) outcome = "reformed";
              lastAlive = now;
              lastProgressAt = Date.now();
            }
            // A death drops us at the region hub with auto-combat off.
            if (obs.nodeId !== nodeId) {
              if (!(obs.self?.isDead ?? false)) {
                intents.setAuto(false);
                intents.navigateTo(nodeId);
              }
            } else if (!(obs.self?.auto ?? false) && !(obs.self?.isDead ?? false)) {
              intents.setAuto(true);
            }
            if (Date.now() - lastProgressAt > DEFAULT_NO_PROGRESS_MS) {
              throw new StallError(
                `cannot clear the ${step.biomeGroup} dungeon guard (${now}/${total} still standing)`,
                { nodeId, guardianAlive: now, guardianTotal: total },
              );
            }
          },
          onStall: () => ({ guardianAlive: alive() ?? -1, guardianTotal: total }),
        });
      }
    } catch (err) {
      outcome = "gave-up";
      recorder.emit({
        kind: "dungeon-guard",
        atMs: recorder.now(),
        phase: "end",
        nodeId,
        biomeGroup: step.biomeGroup,
        attempt,
        guardianTotal: total,
        guardianAlive: alive() ?? -1,
        durationMs: Date.now() - startedAt,
        outcome,
      });
      throw err;
    }

    recorder.emit({
      kind: "dungeon-guard",
      atMs: recorder.now(),
      phase: "end",
      nodeId,
      biomeGroup: step.biomeGroup,
      attempt,
      guardianTotal: total,
      guardianAlive: alive() ?? -1,
      durationMs: Date.now() - startedAt,
      outcome,
    });
  }

  private async doAttemptBoss(step: Extract<RouteStep, { type: "attemptBoss" }>): Promise<void> {
    const { obs, intents, recorder } = this.deps;
    if (obs.bossCleared(step.biomeGroup, step.tier)) return;

    const nodeId = dungeonNodeFor(step.biomeGroup, step.tier);
    if (!nodeId) throw new StallError("no dungeon node for target", { step });

    const maxAttempts = step.maxAttempts ?? 6;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.deps.aborted()) throw new AbortError("run aborted");
      if (obs.bossCleared(step.biomeGroup, step.tier)) return;

      await this.deps.awaitAlive();
      // A dungeon has exactly one node, so this is a genuine exclusive queue:
      // no alternate candidate exists, and the boss/guardian runtime state it
      // protects is the reason fast retry is gated on owning it below.
      await this.deps.leaseSession?.acquireActivity(
        [nodeId],
        obs,
        intents,
        `dungeon-boss:${step.biomeGroup}:attempt-${attempt}`,
      );
      // Re-check immediately after respawning, before paying for another full
      // guard-clear + travel + altar cycle. `bossCleared` can flip true while
      // we were dead: the killing blow that finally drops the boss can land in
      // the same exchange that kills us (a mutual trade against the guard pack
      // still swinging). Without
      // this check an already-won boss still forces a fresh guard-clear (and a
      // real chance of dying to IT instead), which is what an outside observer
      // sees as "stuck re-fighting a boss it already beat".
      if (obs.bossCleared(step.biomeGroup, step.tier)) return;

      if (attempt > 1 && this.deps.fastBossRetry) {
        if (this.deps.leaseSession && !this.deps.leaseSession.ownsNode(nodeId)) {
          throw new StallError("fast boss retry attempted without the dungeon area lease", {
            nodeId,
            heldAreas: this.deps.leaseSession.heldAreas(),
          });
        }
        const result = await intents.prepareFastBossRetry(
          nodeId,
          this.deps.fastBossRetryIncludeGuardians,
        );
        if (!result.success) {
          throw new StallError(`fast boss retry rejected: ${result.reason ?? "unknown"}`, {
            nodeId,
            attempt,
          });
        }
        recorder.emit({
          kind: "fast-boss-retry",
          atMs: recorder.now(),
          nodeId,
          attempt,
          taint: "NON_CANONICAL_FAST_BOSS_RETRY",
          includeGuardians: this.deps.fastBossRetryIncludeGuardians,
          playerReset: "respawn-baseline",
          skipped: [
            "overworld-travel",
            "dungeon-traversal",
            "guardian-reform-wait",
            ...(this.deps.fastBossRetryIncludeGuardians ? [] : ["guardian-reclear"]),
          ],
        });
        await this.waitUntil(
          () =>
            obs.nodeId === nodeId &&
            obs.dungeon?.status === "idle" &&
            obs.dungeon.guardianAlive ===
              (this.deps.fastBossRetryIncludeGuardians ? obs.dungeon.guardianTotal : 0),
          {
            timeoutMs: 30_000,
            what: "authoritative fast boss retry snapshot",
            onPoll: () => intents.requestSync(),
          },
        );
      }

      recorder.bossAttempts += 1;
      recorder.emit({
        kind: "boss-attempt",
        atMs: recorder.now(),
        phase: "start",
        nodeId,
        biomeGroup: step.biomeGroup,
        attempt,
      });
      const attemptStartedAt = Date.now();
      let bossCombatStartedAt: number | null = null;
      let bossCombatEndedAt: number | null = null;
      let bossHpFraction: number | undefined;
      const sampleBoss = (): void => {
        if (obs.dungeon?.status === "boss") bossCombatStartedAt ??= Date.now();
        const bossId = obs.dungeon?.bossMonsterId;
        const boss = bossId
          ? obs.monsters().find((monster) => monster.id === bossId)
          : obs.monsters().find((monster) => monster.isBoss);
        if (!boss) return;
        bossCombatStartedAt ??= Date.now();
        bossHpFraction = boss.maxHp > 0
          ? Math.max(0, Math.min(1, boss.hp / boss.maxHp))
          : 0;
      };

      let outcome: "victory" | "death" | "timeout" | "unreachable" = "timeout";
      try {
        await this.ensureAt(nodeId);
        recorder.setActivity("boss");

        // PRE-CLEAR THE GUARD. Activating the altar turns every guardian still
        // standing onto the player at once and starts the boss waking - the
        // server puts it plainly: "the survivors simply fight alongside the
        // boss". Skipping this is how a fully geared character ends up facing a
        // boss plus 11 guardians and loses a damage race it would otherwise win.
        await this.clearDungeonGuard(nodeId, step, attempt);

        // The guard-clear itself can take a while and can die to or alongside
        // a party member (see the comment at the top of this loop) -- bail
        // before walking to the altar if the boss is already down.
        const clearedDuringGuard = obs.bossCleared(step.biomeGroup, step.tier);

        // Dying during the guard-clear is normal and already survived by
        // `clearDungeonGuard` itself (see its own doc comment) -- it must not
        // count against THIS attempt's own outcome. Rebase the death baseline
        // to right here, after the guard is settled, so only a death from this
        // point on (altar walk-up onward) can flip the classification below.
        //
        // Another same-node player can also win the shared dungeon session's
        // own race against us: they can clear guardians, activate the altar,
        // or even get the boss to land a killing blow on THIS character while
        // we are still walking up, waiting for the altar to go idle, or
        // waiting for our own `activateDungeonAltar` emit to land (dungeon
        // state is one-per-node, not per-player). None of the waits below used
        // to check for a death, so a genuine kill by the (very real,
        // already-awake) boss sat silently until its own multi-minute wait
        // timed out on a StallError and the whole attempt was mis-recorded
        // "unreachable" -- indistinguishable from never having found the
        // dungeon at all, even though the character died fighting the genuine
        // article. Checking `diedThisAttempt()` after every phase below turns
        // that into the "death" it actually was, and skips the remaining
        // minutes of a wait nothing will ever satisfy once the character is
        // already a corpse elsewhere.
        const deathsAfterGuardClear = this.deps.deathCount();
        const diedThisAttempt = (): boolean => this.deps.deathCount() > deathsAfterGuardClear;

        // Walk onto the altar, then disturb it. The server checks proximity
        // itself (`isNearAltar`), so this is the ordinary player sequence.
        // Prompt, because the guard reforms 90s after the last guardian kill.
        const altar = clearedDuringGuard ? null : obs.dungeon?.altar;
        if (altar && !diedThisAttempt()) {
          intents.setAuto(false);
          intents.moveTo({ x: altar.x, y: altar.y });
          await this.waitUntil(
            () => {
              sampleBoss();
              if (diedThisAttempt()) return true;
              const self = obs.self;
              const a = obs.dungeon?.altar;
              if (!self || !a) return false;
              const dx = self.pos.x - a.x;
              const dy = self.pos.y - a.y;
              return dx * dx + dy * dy <= a.activationRadius * a.activationRadius;
            },
            {
              timeoutMs: 60_000,
              what: "reach altar",
              onPoll: () => {
                if (!(obs.self?.isDead ?? false)) intents.moveTo({ x: altar.x, y: altar.y });
              },
            },
          );
        }

        if (!clearedDuringGuard && !diedThisAttempt()) {
          await this.waitUntil(
            () => {
              sampleBoss();
              return diedThisAttempt() || obs.dungeon?.canActivate === true;
            },
            {
              timeoutMs: 15 * 60 * 1000,
              what: "altar ready (dungeon idle)",
              onStall: () => ({
                status: obs.dungeon?.status ?? "unknown",
                cooldownRemainingMs: obs.dungeon?.cooldownRemainingMs ?? 0,
              }),
            },
          );

          if (!diedThisAttempt()) {
            // One fire-and-forget emit is a coin flip here for the same reason
            // equip is: the server drops every unacknowledged intent from a
            // corpse. Losing this one is expensive -- the bot then stands in an
            // idle dungeon until the 12-minute boss wait burns the whole attempt
            // -- so re-emit until the dungeon actually wakes.
            await this.emitUntil(
              () => intents.activateDungeonAltar(),
              () => {
                sampleBoss();
                return (
                  diedThisAttempt() ||
                  (obs.dungeon?.status ?? "idle") !== "idle" ||
                  obs.bossCleared(step.biomeGroup, step.tier)
                );
              },
              {
                timeoutMs: 3 * 60 * 1000,
                what: "dungeon activated",
                onStall: () => ({
                  status: obs.dungeon?.status ?? "unknown",
                  canActivate: obs.dungeon?.canActivate ?? false,
                }),
              },
            );
          }
          if (!diedThisAttempt()) {
            intents.setAutocombatConfig(this.deps.policy.autocombat);
            intents.setAutoTraverse(false);
            intents.setAuto(true);
          }
        }

        if (!diedThisAttempt()) {
          await this.waitUntil(
            () => {
              sampleBoss();
              return obs.bossCleared(step.biomeGroup, step.tier) || diedThisAttempt();
            },
            {
              timeoutMs: BOSS_FIGHT_TIMEOUT_MS,
              what: `${step.biomeGroup} T${step.tier} boss resolved`,
              throwOnTimeout: false,
            },
          );
        }

        if (obs.bossCleared(step.biomeGroup, step.tier)) outcome = "victory";
        else if (diedThisAttempt()) outcome = "death";
        if (bossCombatStartedAt !== null) bossCombatEndedAt = Date.now();
        if (outcome === "victory") bossHpFraction = 0;
      } catch (err) {
        if (err instanceof AbortError) throw err;
        outcome = err instanceof StallError ? "unreachable" : "timeout";
        sampleBoss();
        if (bossCombatStartedAt !== null) bossCombatEndedAt = Date.now();
      } finally {
        recorder.setActivity("idle");
      }

      if (outcome === "victory") recorder.bossVictories += 1;

      recorder.emit({
        kind: "boss-attempt",
        atMs: recorder.now(),
        phase: "end",
        nodeId,
        biomeGroup: step.biomeGroup,
        attempt,
        outcome,
        durationMs: Date.now() - attemptStartedAt,
        bossHpFraction,
        bossCombatStartedAtMs:
          bossCombatStartedAt === null ? undefined : bossCombatStartedAt - this.deps.startedAt,
        bossCombatEndedAtMs:
          bossCombatEndedAt === null ? undefined : bossCombatEndedAt - this.deps.startedAt,
        bossCombatDurationMs:
          bossCombatStartedAt === null || bossCombatEndedAt === null
            ? undefined
            : bossCombatEndedAt - bossCombatStartedAt,
      });

      if (outcome === "victory") return;
    }

    throw new StallError(
      `boss attempt loop exhausted (${maxAttempts}) with no clear`,
      { biomeGroup: step.biomeGroup, tier: step.tier },
    );
  }

  private async doRepeatUntil(step: Extract<RouteStep, { type: "repeatUntil" }>): Promise<void> {
    const max = step.maxIterations ?? 20;
    for (let i = 0; i < max; i++) {
      if (this.test(step.until)) return;
      this.rotation = i;
      await this.runSteps(step.steps);
    }
    if (!this.test(step.until)) {
      throw new StallError(`repeatUntil exhausted ${max} iterations`, {
        until: describe(step.until),
      });
    }
  }

  // ── Shared machinery ────────────────────────────────────────────────────

  /**
   * Farm because something is unaffordable. Bracketed with a
   * `blocked-on-resource` span: measuring how long the economy makes a player
   * wait is one of the primary reasons this harness exists, so it is recorded
   * rather than shortcut.
   */
  private async farmBlocked(
    nodeId: string,
    forWhat: string,
    done: () => boolean,
    missing: () => Record<string, number>,
    ignoreBiomeCap = false,
  ): Promise<void> {
    const { recorder } = this.deps;
    const startedAt = Date.now();
    recorder.emit({
      kind: "blocked-on-resource",
      atMs: recorder.now(),
      phase: "start",
      forWhat,
      missing: missing(),
      farmingAt: nodeId,
    });
    recorder.setActivity("blocked");
    try {
      await this.farmUntil(nodeId, done, {
        what: forWhat,
        noProgressMs: DEFAULT_NO_PROGRESS_MS,
        onStall: missing,
        ignoreBiomeCap,
        activity: "blocked",
      });
    } finally {
      recorder.emit({
        kind: "blocked-on-resource",
        atMs: recorder.now(),
        phase: "end",
        forWhat,
        missing: missing(),
        farmingAt: nodeId,
        durationMs: Date.now() - startedAt,
      });
      recorder.setActivity("idle");
    }
  }

  /** A biome's own T-start normal node — where its recipes are meant to be farmed. */
  private defaultFarmNodeFor(biomeGroup: string): string | null {
    const tier = BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
    return resolveNode(
      { kind: "biome", biomeGroup, tier, pick: "uncleared" },
      this.deps.obs,
      this.rotation,
    );
  }

  /**
   * Resolve the next live upgrade's actual bottleneck. Essence stays in the
   * authored biome; a missing catalyst selects that biome's node carrying the
   * required live modifier instead of assuming the generic `uncleared` pick
   * happens to mint the right family.
   */
  private upgradeFarmNode(
    step: Extract<RouteStep, { type: "upgrade" }>,
    recipe: ReturnType<typeof RECIPE_DATABASE.get>,
    nextPlus: number,
  ): string | null {
    const preferred =
      (step.farmAt ? resolveNode(step.farmAt, this.deps.obs, this.rotation) : null) ??
      (recipe ? this.defaultFarmNodeFor(recipe.recipeGroup) : null);
    if (!recipe) return preferred;

    const item = ITEM_DATABASE.get(step.definitionId);
    const catalystCost = item ? (upgradeCatalystCostFor(item, nextPlus) ?? {}) : {};
    const missingFamily = Object.entries(catalystCost).find(
      ([family, amount]) => this.deps.obs.catalyst(family) < (amount ?? 0),
    )?.[0];
    if (!missingFamily) return preferred;

    const preferredInfo = preferred ? NODE_BIOMES[preferred] : undefined;
    const biomeGroup = preferredInfo?.biomeGroup ?? recipe.recipeGroup;
    const tier = preferredInfo?.biomeTier ?? BIOME_START_TIER_BY_GROUP[biomeGroup] ?? 1;
    return normalNodesFor(biomeGroup, tier).find(
      (nodeId) => NODE_MODIFIERS[nodeId]?.modifier === missingFamily,
    ) ?? preferred;
  }

  /**
   * Fire an unacknowledged intent and hold until the world reflects it,
   * re-emitting as needed.
   *
   * Several player intents have no result event, and the server drops all of
   * them while the player is dead (`liveSelf()` returns null for a corpse). A
   * run dies routinely, so a single fire-and-forget emit is a coin flip: this
   * harness lost a 29-minute run to an equip that landed on the exact tick the
   * character died. Never emit one of these without this wrapper.
   */
  private async emitUntil(
    emit: () => void,
    done: () => boolean,
    opts: { timeoutMs: number; what: string; onStall?: () => Record<string, unknown> },
  ): Promise<void> {
    if (done()) return;
    let lastEmitAt = 0;
    await this.waitUntil(done, {
      timeoutMs: opts.timeoutMs,
      what: opts.what,
      onStall: opts.onStall,
      onPoll: () => {
        if (this.deps.obs.self?.isDead ?? false) return;
        if (Date.now() - lastEmitAt < 3_000) return;
        lastEmitAt = Date.now();
        emit();
      },
    });
  }

  private async waitUntil(
    predicate: () => boolean,
    opts: {
      timeoutMs: number;
      what: string;
      onPoll?: () => void;
      onStall?: () => Record<string, unknown>;
      throwOnTimeout?: boolean;
    },
  ): Promise<void> {
    const deadline = Date.now() + opts.timeoutMs;
    while (!predicate()) {
      if (this.deps.aborted()) throw new AbortError("run aborted");
      if (Date.now() > deadline) {
        if (opts.throwOnTimeout === false) return;
        throw new StallError(`timed out waiting for ${opts.what}`, opts.onStall?.() ?? {});
      }
      await sleep(POLL_MS);
      opts.onPoll?.();
      this.checkMilestones();
    }
  }

  private checkMilestones(): void {
    for (const milestone of this.deps.route.milestones) {
      if (this.firedMilestones.has(milestone.id)) continue;
      if (this.test(milestone.when)) this.fireMilestone(milestone.id);
    }
  }

  private fireMilestone(id: string): void {
    if (this.firedMilestones.has(id)) return;
    this.firedMilestones.add(id);
    const self = this.deps.obs.self;
    this.deps.recorder.emit({
      kind: "milestone",
      atMs: this.deps.recorder.now(),
      id,
      detail: {
        playerTier: self?.playerTier ?? 0,
        globalMastery: self?.globalMastery ?? 0,
        bossesCleared: self?.bossesCleared ?? [],
        nodeId: this.deps.obs.nodeId,
      },
    });
  }

  get milestonesFired(): string[] {
    return [...this.firedMilestones];
  }
}

/**
 * A cheap scalar that moves whenever the character is making headway. Used to
 * separate "slow because the economy is slow" from "wedged and going nowhere",
 * which the brief asks be reported distinctly.
 */
function progressSignal(obs: Observation): string {
  const self = obs.self;
  if (!self) return "none";
  const essence = Object.values(self.essences).reduce((a, b) => a + b, 0);
  const xp = Object.values(self.biomeXP).reduce((a, b) => a + b, 0);
  return `${essence}|${xp}|${self.playerTier}|${self.bossesCleared.length}`;
}

/** Drop `undefined` holes so an optional cost record becomes a plain tally. */
function definedNumbers(record: Partial<Record<string, number>>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "number") out[key] = value;
  }
  return out;
}

function defaultLabel(step: RouteStep): string {
  switch (step.type) {
    case "milestone":
      return `milestone:${step.id}`;
    case "chooseClass":
      return `choose ${step.skillId}`;
    case "unlockSkill":
      return `unlock ${step.skillId}`;
    case "travel":
      return `travel ${refLabel(step.to)}`;
    case "farm":
      return `farm ${refLabel(step.at)} until ${describe(step.until)}`;
    case "craft":
      return `craft ${step.recipeIds.join(", ")}`;
    case "equip":
      return `equip ${step.definitionIds.join(", ")}`;
    case "upgrade":
      return `upgrade ${step.definitionId} to +${step.toPlus}${step.opportunistic ? " (as GM allows)" : ""}`;
    case "configureRunes":
      return `configure runes (${step.rules.length})`;
    case "learnAbility":
      return `learn ${step.abilityId} (${step.slot})`;
    case "setAbilities":
      return `abilities T[${step.techniques.join(",")}] G[${step.guards.join(",")}]`;
    case "craftRune":
      return `craft rune ${step.recipeId}`;
    case "attemptBoss":
      return `boss ${step.biomeGroup} T${step.tier}`;
    case "repeatUntil":
      return `repeat until ${describe(step.until)}`;
  }
}

function refLabel(ref: NodeRef): string {
  if (ref.kind === "node") return ref.nodeId;
  if (ref.kind === "dungeon") return `${ref.biomeGroup} T${ref.tier} dungeon`;
  return `${ref.biomeGroup} T${ref.tier}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rune order is behavior: the first active rule claims its channel. Comparing
 * only array length lets a same-sized Chase loadout masquerade as Orbit (or a
 * lower-priority Step Back loadout as the intended one).
 */
export function runeLoadoutsEqual(
  live: readonly EquippedRule[],
  wanted: readonly EquippedRule[],
): boolean {
  return (
    live.length === wanted.length &&
    live.every((rule, index) => {
      const expected = wanted[index];
      return (
        expected !== undefined &&
        rule.conditionId === expected.conditionId &&
        rule.actionId === expected.actionId &&
        (rule.targetStanceId ?? null) === (expected.targetStanceId ?? null)
      );
    })
  );
}
