import type { World } from "../../../world/World";
import {
  ABILITY_FRENZY_EFFECT_ID,
  ABILITY_GUARD_EFFECT_IDS,
  applyStatusEffect,
  GAME_CONFIG,
  MONSTER_DATABASE,
  TEST_ROOM_NODE_ID,
  distanceSq,
  geometryContains,
  resolveSummonerProfile,
} from "@mmo-idle/shared";
import type {
  AggroTargetKind,
  MonsterAbility,
  MonsterAbilityAction,
  MonsterDefinition,
  Vec2,
} from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../player/progression/rewards";
import { makeCombatContext, emitCombatEvent, type FormationAttackContribution } from "./combatPipeline";
import {
  monsterEmpoweredMultiplier,
  applyEnemySoftCap,
  applyEnemyShield,
  cadenceFiredThisTick,
  monsterVolleyHits,
  noteMonsterHitTaken,
  chargedCastEndsAt,
  chargeReady,
  beginCharge,
  completeCharge,
  cancelCharge,
  plantChargeAoe,
  isChargeAoePlanted,
  chargeAoeImpactPoint,
  monsterAttackCooldown,
  castedBuffCastEndsAt,
  castedBuffReady,
  beginCastedBuff,
  completeCastedBuff,
  cancelCastedBuff,
  activeMonsterAbilityId,
  beginMonsterAbility,
  cancelMonsterAbility,
  completeMonsterAbility,
  monsterAbilityCastEndsAt,
  monsterAbilityImpactPoint,
  monsterAbilityReady,
  monsterAbilityTargetId,
  lowHealthWardCastEndsAt,
  lowHealthWardReady,
  beginLowHealthWard,
  completeLowHealthWard,
  cancelLowHealthWard,
  consumeMonsterAttackSpeedCharge,
} from "./monsterMechanics";
import { isMonsterFrozen } from "../../classes/archetypes/dot/t3/core/selectors";
import {
  getCounter,
  setCounter,
  addCounter,
  getStatusEffect,
  removeStatusEffect,
  FROST_RAMP_EFFECT_ID,
  SUN_MARK_EFFECT_ID,
  SUNDERED_EFFECT_ID,
  PLATING_SHRED_EFFECT_ID,
  SHATTER_VULNERABLE_EFFECT_ID,
  DAMAGE_TAKEN_PCT_KEY,
  platingAfterShred,
  playerOutgoingDamageMult,
  frostRampMaxStacks,
  frostRampAtkSlowPct,
  ambientRampAttackSlowPct,
  ambientRampScalingMult,
  ambientRampStatus,
  CHAOTIC_HIT_COUNTER_KEY,
} from "@mmo-idle/shared";
import { applyMonsterAoe } from "../damage/aoeDamage";
import {
  publishGroundZone,
  publishToxicPool,
  publishFaultLineBurst,
  takeDueGroundZoneImpacts,
  clearGroundZonesByOwner,
  type RuntimeSlamTelegraph,
} from "../../world/groundZones";
import { monsterDeathEmpowerMult } from "../damage/monsterDeathEffects";
import { pushPlayer } from "../damage/forcedMovement";
import { canApplyPlayerDebuff } from "../status/debuffGuard";
import { evadeBlocksDebuffs } from "../../defense/mitigation/evasion";
import { isMonsterStunned, applyStun } from "../status/stun";
import { applyMonsterDotToPlayer } from '../status/monsterDot';
import { applyPlatingShredStacks } from '../status/platingShred';
import { shellDamageMult } from '../ai/shellUp';
import { setAggroTarget, setAttackTarget } from "../ai/targeting";
import { markEngaged } from "../ai/engagement";
import {
  abortEngageSequence,
  completeEngageSequence,
  consumeEngageSequenceLandingAttack,
  engageSequenceHoldsAttack,
  engageSequenceSlamReady,
} from '../ai/engageSequence';
import { harmfulStatusDurationMult } from "../status/harmfulStatus";
import { stanceAttackSpeedBonus } from "../../player/stances/stanceBehaviors";
import { attackCadenceMult } from "./attackCadence";
import type {
  MinionEntity,
  MonsterEntity,
  PlayerEntity,
} from "../../../ecs/entity";
import { buildKillerFromMonster } from "../../world/deathCause";
import { recordWorldLogEvent } from "../../../world/worldLog";
import {
  actorFromMonster,
  actorFromPlayer,
  actorFromMinion,
} from "../../../world/worldLogActors";
import { buildPlatingDrBreakdown } from "../../../world/worldLogCombat";
import { markUltimateContributor } from "../ai/ultimateContributors";
import { tryEngageUltimateEncounter } from "../ai/ultimateEncounter";
import {
  effectivePlatingAfterShred,
  effectiveDamageReductionAfterBrittle,
} from "../damage/effectivePlating";
import {
  beginTelegraphResolutionTelemetry,
  finishTelegraphResolutionTelemetry,
  recordTelegraphResolutionVictim,
} from "../ai/telegraphEvasion";

export type PlayerAttackOutcome = "cancelled" | "dodged" | "hit" | "killed";
export type MonsterAttackOutcome = "cancelled" | "hit" | "killed";


/**
 * Tundra ICE-ARMOR shatter — fires when a player hit BREAKS the mob's frost barrier.
 *
 * The payoff for timing a burst into the shell instead of chipping at it:
 *   1. bonus self-damage (the shell cracking into the thing wearing it), and
 *   2. a VULNERABILITY WINDOW — the monster takes more damage from every source for
 *      a few seconds, which is the actual reward the locked design asks for.
 *
 * The legacy "freezing shockwave stuns nearby enemies" rider is still supported for
 * any def that authors `freezeRadius`, but it is de-emphasised: a crowd-control
 * upside was a strange thing to hang off a defensive window, and it paid out most in
 * exactly the crowded fights Tundra is not supposed to have.
 *
 * Telegraphed by a frost-shatter pulse. No-op unless the mob defines
 * `enemyShield.shatter`.
 */
function applyIceShatter(
  world: World,
  target: MonsterEntity,
  def: MonsterDefinition | undefined,
  now: number,
  shatterOverride?: NonNullable<MonsterDefinition['enemyShield']>['shatter'],
): void {
  // A runtime barrier granted mid-fight ('apply-shield') may carry its own shatter
  // rider — Tundra's T4 Ice Armour is thickened by a phase, not by a second def.
  const shatter = shatterOverride ?? target.scriptsBoss?.shieldOverride?.shatter ?? def?.enemyShield?.shatter;
  if (!shatter) return;

  const bonus = Math.max(
    1,
    Math.round(target.hasHealth.maxHp * shatter.selfDamagePct),
  );
  target.hasHealth.hp -= bonus;

  const nodeId = target.hasPosition.nodeId;

  // The damage window. Read by `monsterShatterVulnerabilityMult` on the way in.
  const vulnerable = shatter.vulnerability;
  if (vulnerable) {
    applyStatusEffect(target.tracksCombat, {
      id: SHATTER_VULNERABLE_EFFECT_ID,
      maxStacks: 1,
      remainingMs: vulnerable.durationMs,
      refreshable: true,
      sourceId: target.isMonster.id,
      data: {
        [DAMAGE_TAKEN_PCT_KEY]: vulnerable.damageTakenPct,
        totalMs: vulnerable.durationMs,
      },
    });
  }

  // Legacy freezing shockwave (optional; prefer the vulnerability window above).
  if (shatter.freezeRadius && shatter.freezeDurationMs) {
    const r2 = shatter.freezeRadius * shatter.freezeRadius;
    for (const other of world.monsterEntitiesInNode(nodeId)) {
      if (other === target || other.isMonster.isBoss) continue;
      if (
        distanceSq(other.hasPosition.current, target.hasPosition.current) > r2
      ) {
        continue;
      }
      applyStun(other.tracksCombat, shatter.freezeDurationMs, target.isMonster.id);
    }
  }
  void now;

  world.pushEvent(nodeId, {
    kind: "ecology-pulse",
    monsterId: target.isMonster.id,
    pos: { ...target.hasPosition.current },
    pulse: "frost-shatter",
  });
}

/**
 * Incoming-damage multiplier on a monster standing in its own shatter window.
 * 1 when the window is closed. Applied to player damage the same way the player's
 * `sundered` is — one generic amplifier keyed off status `data`, not an id list.
 */
export function monsterShatterVulnerabilityMult(monster: MonsterEntity): number {
  const effect = getStatusEffect(
    monster.tracksCombat,
    SHATTER_VULNERABLE_EFFECT_ID,
  );
  if (!effect) return 1;
  return 1 + Math.max(0, effect.data[DAMAGE_TAKEN_PCT_KEY] ?? 0);
}

/**
 * Run a single attack from `player` onto `target`. Drives the full combat
 * pipeline (beforeAttack → onAttack → onHit → onDamageTaken → afterHit → onKill)
 * and queues client combat events.
 *
 * The caller is responsible for:
 *   - Cooldown gating (this function performs the attack unconditionally).
 *   - Setting `lastAttackAt` on whichever cooldown owner drove the attack
 *     (the player for direct attacks, the minion for summoner attacks).
 *
 * `opts.attackOrigin` controls where the `player-hit` event reports the
 * attack starting from — used so summoner minion attacks render an FX
 * trail from the slime, not the player.
 *
 * `opts.aggroSource` controls who the monster retaliates against if it
 * had no aggro target. For direct player attacks this is the player; for
 * summoner attacks this is the minion that struck.
 */
export function runPlayerAttack(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  now: number,
  opts: {
    attackOrigin: Vec2;
    aggroSource: { id: string; kind: AggroTargetKind };
    metadata?: Record<string, unknown>;
    /** Optional caller-owned result flags for mechanics that consume only landed attacks. */
    resultMetadata?: Record<string, unknown>;
    formation?: FormationAttackContribution;
  },
): PlayerAttackOutcome {
  const ctx = makeCombatContext(player, "player", target, "monster");
  const directSummonerProfile = !opts.formation && player.usesSkills.combatArchetype === 'summoner'
    ? resolveSummonerProfile({
      selectedSubVariant: player.usesSkills.selectedSubVariant,
      selectedRange: player.usesSkills.selectedRange,
      unlockedSkills: player.usesSkills.unlockedSkills,
      passives: player.usesSkills.passives,
    })
    : null;
  const battleBondProfile = directSummonerProfile?.specialization === 'battle-bond'
    ? directSummonerProfile
    : null;
  ctx.formation = opts.formation ?? (battleBondProfile ? {
    ownerId: player.isPlayer.id,
    physicalEntityId: player.isPlayer.id,
    slotId: 'conduit:0',
    directDamageWeight: battleBondProfile.battleBondConduitOffenseWeight,
    onHitMagnitudeWeight: battleBondProfile.battleBondConduitOffenseWeight,
    procWeight: battleBondProfile.battleBondConduitOffenseWeight,
    targetId: target.isMonster.id,
    cycleSerial: 0,
    cycleCompleted: false,
    side: 'conduit',
  } : undefined);
  ctx.metadata.aggroSource = opts.aggroSource;
  if (opts.metadata) {
    Object.assign(ctx.metadata, opts.metadata);
  }

  if (target.scriptsUltimate && !target.scriptsUltimate.engaged) {
    tryEngageUltimateEncounter(world, target);
    if (!target.hasAggroTarget) {
      setAggroTarget(world, target, opts.aggroSource, now);
    }
  }

  // Chaotic weapon family: every Nth attack whiffs. Determined here (not in an
  // onHit listener) so the flag is visible to beforeAttack — letting reload skip
  // ammo and the empowered multiplier preserve its charge. Peek the counter
  // before beforeAttack; commit it only once the attack is confirmed to fire so
  // a cancelled attack (empty clip / mid-reload) never advances the cycle.
  // Dead-swing cadence is data-driven from the equipped weapon's
  // `weapon.dead-swing-interval` mechanic (authored on the recipe).
  const deadSwingInterval = player.usesSkills.passives["weapon.dead-swing-interval"] ?? 0;
  const chaoticMissEvery = deadSwingInterval > 0 ? Math.round(deadSwingInterval) : 0;
  const chaoticProgressKey = 'weapon.chaotic-logical-hit';
  const previousChaoticProgress = ctx.formation && player.controlsSummons
    ? (player.controlsSummons.procProgress[chaoticProgressKey] ?? 0)
    : 0;
  const nextChaoticProgress = previousChaoticProgress + (ctx.formation?.procWeight ?? 1);
  const chaoticLogicalHits = Math.floor(nextChaoticProgress + 1e-9);
  if (
    chaoticMissEvery &&
    chaoticLogicalHits > 0 &&
    (getCounter(player.tracksCombat, CHAOTIC_HIT_COUNTER_KEY) + chaoticLogicalHits) %
      chaoticMissEvery ===
      0
  ) {
    ctx.metadata.chaoticMiss = true;
  }
  if (opts.resultMetadata) {
    opts.resultMetadata.chaoticMiss = ctx.metadata.chaoticMiss === true;
  }

  emitCombatEvent("beforeAttack", ctx, world);
  if (ctx.cancelled) return "cancelled";

  if (chaoticMissEvery) {
    if (ctx.formation && player.controlsSummons) {
      player.controlsSummons.procProgress[chaoticProgressKey] = nextChaoticProgress - chaoticLogicalHits;
    }
    if (chaoticLogicalHits > 0) {
      addCounter(player.tracksCombat, CHAOTIC_HIT_COUNTER_KEY, chaoticLogicalHits);
    }
  }

  emitCombatEvent("onAttack", ctx, world);

  // Deterministic monster evasion (NO RNG): a fractional accumulator on the
  // monster sums the per-hit dodge chance `evasion` (a 0–1 fraction, same
  // notation as the player evasion stat); when it crosses 1.0 the hit is dodged.
  // The dodge reduces damage by `evadeMitigation` (default 0.5) rather than fully
  // negating it, and suppresses the player's debuffs/DoT unless the player's
  // attack pierces evade. A full-avoid (mitigation ≥ 1) short-circuits to the
  // legacy zero-damage path.
  const monsterDef = MONSTER_DATABASE.get(target.isMonster.monsterTypeId);
  // A boss 'stat-buff' evasion action can override the dodge fraction at runtime
  // (e.g. drop to 0 in a desperation phase). 0 is a valid override, so use ??.
  const evadeChance = target.scriptsBoss?.evasionOverride ?? monsterDef?.evasion;
  let evaded = false;
  let evadeMult = 0;
  if (evadeChance !== undefined && evadeChance > 0) {
    const acc = getCounter(target.tracksCombat, "evadeAcc") + evadeChance;
    if (acc >= 1) {
      setCounter(target.tracksCombat, "evadeAcc", acc - 1);
      evaded = true;
      evadeMult = monsterDef?.evadeMitigation ?? GAME_CONFIG.EVADE_MITIGATION_BASE;
      if ((player.usesSkills.passives["shared.applies-through-evade"] ?? 0) <= 0) {
        ctx.metadata["evadeBlocksDebuffs"] = true;
      }
      ctx.metadata["evaded"] = true;
      recordWorldLogEvent(
        world,
        {
          kind: "dodge",
          nodeId: player.hasPosition.nodeId,
          attacker: actorFromPlayer(player),
          target: actorFromMonster(target),
        },
        {
          visibility: "combat",
          relatedPlayerIds: [player.isPlayer.id],
          nodeId: player.hasPosition.nodeId,
        },
      );
      // Full avoidance preserves the legacy "dodged" outcome (no damage, no
      // debuffs) and renders the "DODGE" floater. A partial evade falls through
      // and instead restyles the reduced damage number (player-hit.evadedPartial).
      if (evadeMult >= 1) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind: "monster-dodge",
          monsterId: target.isMonster.id,
          targetPos: { ...target.hasPosition.current },
        });
        return "dodged";
      }
    } else {
      setCounter(target.tracksCombat, "evadeAcc", acc);
    }
  }

  const monsterCombatState = target.tracksCombat;
  const platingShred =
    typeof ctx.metadata.platingShred === "number"
      ? ctx.metadata.platingShred
      : 0;
  const effectivePlating = effectivePlatingAfterShred(
    target.mitigatesDamage.plating,
    monsterCombatState,
    platingShred,
  );
  const effectiveDr =
    effectiveDamageReductionAfterBrittle(
      target.mitigatesDamage.damageReduction,
      monsterCombatState,
    ) * (1 - Math.max(0, Math.min(1, ctx.drPierce)));

  const minionDamageMult = ctx.formation?.directDamageWeight ?? (
    opts.aggroSource.kind === "minion"
      ? (player.usesSkills.passives["summoner.minion-damage-mult"] ?? 1.0)
      : 1.0
  );
  ctx.damage = Math.max(
    1,
    Math.round(
      Math.max(
        0,
        player.dealsDamage.attack * minionDamageMult -
          effectivePlating * ctx.platingMult,
      ) *
        (1 - effectiveDr),
    ),
  );

  const damageMult = player.usesSkills.passives['shared.damage-mult'] ?? 0;
  if (damageMult > 0) ctx.damage = Math.round(ctx.damage * (1 + damageMult));

  // P3 outgoing amplifier — status-driven +damage-dealt (Volcano's heat is the
  // consumer). Read ONCE here, next to shared.damage-mult, so it composes as a
  // plain outgoing layer and never touches empowered/charge metadata.
  const outgoingMult = playerOutgoingDamageMult(player.tracksCombat);
  if (outgoingMult > 1) ctx.damage = Math.round(ctx.damage * outgoingMult);

  emitCombatEvent("onHit", ctx, world);

  if (player.dealsDamage.onHitDamage > 0) {
    // Per-shot on-hit scaling (e.g. reload Alternating Cadence zeroes/doubles the
    // on-hit DAMAGE while leaving on-hit TRIGGERS — set by an onHit listener).
    const onHitMult = typeof ctx.metadata['onHitDamageMult'] === 'number'
      ? (ctx.metadata['onHitDamageMult'] as number)
      : 1;
    // Catalyst core. Multiplied in rather than added to onHitMult so the two
    // COMPOSE: a shot that Alternating Cadence zeroed stays zero, and one it
    // doubled gets the core bonus on top instead of overwriting it.
    const coreOnHit = 1 + (player.usesSkills.passives['core.onhit-mult'] ?? 0);
    // NOTE this term lands AFTER plating and DR above — that unmitigated placement
    // is what makes core.onhit-mult a distinct axis from core.attack-mult and not a
    // re-skin of it. Keep it on this side of the formula.
    const formationOnHitWeight = ctx.formation?.onHitMagnitudeWeight ?? 1;
    ctx.damage += Math.round(
      player.dealsDamage.onHitDamage * onHitMult * coreOnHit * formationOnHitWeight,
    );
  }

  const isEmpowered = !!ctx.metadata["empoweredAttack"];
  const isExecution = isEmpowered && player.usesCooldown !== undefined;

  // NOTE: empowered attacks no longer carry an inherent AoE splash. AoE is now an
  // opt-in effect (e.g. the Sweep ability's cleave rider) rather than a built-in
  // property of every empowered hit. `isEmpowered` here only drives crit styling /
  // FX tagging below.

  emitCombatEvent("onDamageTaken", ctx, world);

  // Partial monster dodge: scale the finalized damage by the avoided fraction
  // (full avoid already returned "dodged" above). Floored at 1 so a glancing hit
  // still registers.
  if (evaded) {
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - evadeMult)));
  }

  // Chaotic miss: zero the direct damage last so it overrides any onHit floor
  // (e.g. burn's max(1, …)). On-hit DoT stacks already applied during onHit.
  if (ctx.metadata.chaoticMiss) ctx.damage = 0;

  // T4 monster defensive mechanics (mirror the player damage-cap + periodic
  // shield). Clip an oversized hit FIRST so the barrier only absorbs the capped
  // amount, then drain the periodic absorb barrier before HP. Both are no-ops
  // unless the monster defines enemySoftCap / enemyShield. Like the player's own
  // cap/shield they act on the direct combat-pipeline hit only (DoT/AoE bypass).
  // SHELL UP: a retracted Snapper takes a fraction of direct damage. Applied to
  // the DIRECT hit path only — DoT ticks resolve elsewhere and deliberately keep
  // working at full strength, which is the authored way through the shell.
  ctx.damage = Math.max(
    ctx.damage > 0 ? 1 : 0,
    Math.round(ctx.damage * shellDamageMult(target, now)),
  );

  // SHATTER WINDOW: a monster whose ice armor was just broken takes more from
  // every source. Applied BEFORE the cap/barrier so the window amplifies the real
  // hit rather than the post-mitigation remainder — the point is to reward the
  // burst that cracked the shell.
  ctx.damage = Math.round(ctx.damage * monsterShatterVulnerabilityMult(target));

  const preCapDamage = ctx.damage;
  ctx.damage = applyEnemySoftCap(target, monsterDef, ctx.damage);
  const enemyCapped = ctx.damage < preCapDamage;
  const enemyShieldResult = applyEnemyShield(target, monsterDef, ctx.damage, now);
  ctx.damage = enemyShieldResult.damage;
  const enemyShieldAbsorbed = enemyShieldResult.absorbed;

  const gross = Math.round(player.dealsDamage.attack * minionDamageMult);
  const mitigation = buildPlatingDrBreakdown({
    grossDamage: gross,
    effectivePlating,
    platingMult: ctx.platingMult,
    damageReduction: effectiveDr,
    onHitBonus: player.dealsDamage.onHitDamage,
  });
  mitigation.hpDamage = ctx.damage;
  mitigation.glancing =
    mitigation.hpDamage === 1 &&
    gross + player.dealsDamage.onHitDamage - mitigation.mitigatedTotal < 1;

  const sourceActor =
    opts.aggroSource.kind === "minion"
      ? (() => {
          const minion = world.getMinionEntity(opts.aggroSource.id);
          return minion
            ? actorFromMinion(minion, player.isPlayer.id)
            : actorFromPlayer(player);
        })()
      : actorFromPlayer(player);

  markUltimateContributor(world, target, player.isPlayer.id);
  recordWorldLogEvent(
    world,
    {
      kind: "damage",
      nodeId: player.hasPosition.nodeId,
      source: sourceActor,
      target: actorFromMonster(target),
      hpDamage: ctx.damage,
      absorbed: enemyShieldAbsorbed,
      damageType: "direct",
      mitigation,
      tags: [
        ...(isEmpowered ? ["empowered"] : []),
        ...(isExecution ? ["execution"] : []),
      ],
    },
    {
      visibility: "combat",
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );

  if (enemyShieldAbsorbed > 0) {
    recordWorldLogEvent(
      world,
      {
        kind: "absorb",
        nodeId: player.hasPosition.nodeId,
        target: actorFromMonster(target),
        source: sourceActor,
        amount: enemyShieldAbsorbed,
      },
      {
        visibility: "combat",
        relatedPlayerIds: [player.isPlayer.id],
        nodeId: player.hasPosition.nodeId,
      },
    );
  }

  // Clean-recharge barriers (`enemyShield.rechargeAfterCleanMs`) read this: any
  // landed hit restarts the "has not been hit for a while" window, so keeping the
  // pressure on a Sunshield Scarab is what stops its shield coming back.
  noteMonsterHitTaken(target, now);

  target.hasHealth.hp -= ctx.damage;
  // Tundra ice-armor shatter: breaking the frost barrier cracks it for bonus damage
  // and freezes nearby enemies (applied before the death check below so the bonus can
  // finish the mob). No-op unless the mob defines enemyShield.shatter.
  if (enemyShieldResult.broke) {
    applyIceShatter(world, target, monsterDef, now, enemyShieldResult.shatter);
  }
  target.controlsMonster.spawn = { ...target.hasPosition.current };

  if (
    target.isMonster.isBoss &&
    target.hasPosition.nodeId === TEST_ROOM_NODE_ID
  ) {
    world.testRoomEngagedBossId = target.isMonster.id;
  }

  const clientEffectsRaw = ctx.metadata["clientEffects"];
  const clientEffects = Array.isArray(clientEffectsRaw)
    ? clientEffectsRaw.filter(
        (effect): effect is string => typeof effect === "string",
      )
    : undefined;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: "player-hit",
    playerId: player.isPlayer.id,
    targetId: target.isMonster.id,
    targetName: target.isMonster.name,
    damage: ctx.damage,
    empowered: isEmpowered,
    execution: isExecution,
    effects:
      clientEffects && clientEffects.length > 0 ? clientEffects : undefined,
    playerPos: { ...opts.attackOrigin },
    targetPos: (() => {
      const aim = ctx.metadata["aimPos"];
      if (
        typeof aim === "object" &&
        aim !== null &&
        "x" in aim &&
        "y" in aim &&
        typeof aim.x === "number" &&
        typeof aim.y === "number"
      ) {
        return { x: aim.x, y: aim.y };
      }
      return { ...target.hasPosition.current };
    })(),
    pelletIndex:
      typeof ctx.metadata["blunderbussPelletIndex"] === "number"
        ? (ctx.metadata["blunderbussPelletIndex"] as number)
        : undefined,
    pelletTotal:
      typeof ctx.metadata["blunderbussPelletTotal"] === "number"
        ? (ctx.metadata["blunderbussPelletTotal"] as number)
        : undefined,
    absorbed: enemyShieldAbsorbed > 0 ? enemyShieldAbsorbed : undefined,
    // `evaded` is only still set here on a PARTIAL evade — a full avoid returned
    // "dodged" earlier and never reaches this event.
    evadedPartial: evaded ? true : undefined,
    capped: enemyCapped ? true : undefined,
  });

  if (ctx.metadata.chaoticMiss) {
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-miss",
      playerId: player.isPlayer.id,
      targetId: target.isMonster.id,
      targetPos: { ...target.hasPosition.current },
    });
  }

  emitCombatEvent("afterHit", ctx, world);

  if (target.hasHealth.hp <= 0) {
    emitCombatEvent("onKill", ctx, world);
    const rewardInfo = grantMonsterRewards(world, player.isPlayer.id, target);
    recordWorldLogEvent(
      world,
      {
        kind: "kill",
        nodeId: player.hasPosition.nodeId,
        killer: actorFromPlayer(player),
        victim: actorFromMonster(target),
        damage: ctx.damage,
        essenceGained: rewardInfo?.essenceGained ?? 0,
        essenceType: rewardInfo?.essenceType ?? "green",
        biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
      },
      {
        visibility: "combat",
        relatedPlayerIds: [player.isPlayer.id],
        nodeId: player.hasPosition.nodeId,
      },
    );
    world.pushEvent(player.hasPosition.nodeId, {
      kind: "player-kill",
      playerId: player.isPlayer.id,
      targetId: target.isMonster.id,
      targetName: target.isMonster.name,
      damage: ctx.damage,
      biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
      essenceGained: rewardInfo?.essenceGained ?? 0,
      essenceType: rewardInfo?.essenceType ?? "green",
      empowered: isEmpowered,
      execution: isExecution,
    });
    world.removeMonsterEntity(target.isMonster.id);
    return "killed";
  }

  // Retaliation aggro: if the monster had no target it now fixates on whoever
  // struck it (player or minion). Guarded by leash range from the monster's
  // spawn — outside that, the monster ignores the attacker to prevent
  // safe static-range whittling.
  const ai = target.controlsMonster;
  if (!target.hasAggroTarget) {
    if (
      distanceSq(opts.attackOrigin, ai.spawn) <=
      ai.leashRange * ai.leashRange
    ) {
      setAggroTarget(world, target, opts.aggroSource, now);
      if (opts.aggroSource.kind === "player") {
        const attacker = world.getPlayerEntity(opts.aggroSource.id);
        if (attacker) markEngaged(world, attacker, now);
      }
    }
  }

  if (opts.aggroSource.kind === "minion") {
    markEngaged(world, player, now);
  }

  return "hit";
}

/**
 * Run a single attack from `monster` onto `target`. Mirrors `runPlayerAttack`
 * but for the monster → player direction. The caller handles cooldown gating;
 * this function performs the attack unconditionally and writes
 * `monster.performsAttack.lastAttackAt = now` on success.
 */
export function runMonsterAttack(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  now: number,
  chargeMult = 1,
  resultMetadata?: Record<string, unknown>,
): MonsterAttackOutcome {
  const ctx = makeCombatContext(monster, "monster", target, "player");

  if (isMonsterStunned(world, monster.isMonster.id)) {
    ctx.cancelled = true;
  }

  emitCombatEvent("beforeAttack", ctx, world);
  if (ctx.cancelled) return "cancelled";

  emitCombatEvent("onAttack", ctx, world);
  if (resultMetadata) {
    resultMetadata.evadeBlocksDebuffs = evadeBlocksDebuffs(ctx);
  }

  // Core second DR layer (system rework Step 9): a separate MULTIPLICATIVE damage-
  // reduction layer stacked with base DR — final = base × (1 − DR) × (1 − drLayer2).
  // So 50% base + 50% layer ⇒ 25% taken, not immunity. Read from the player's core
  // passive (mirrors how shared.damage-mult is read in the pipeline); clamped to 0.9.
  const drLayer2 = Math.min(0.9, Math.max(0, target.usesSkills.passives['core.dr-layer-pct'] ?? 0));
  ctx.damage = Math.max(
    1,
    Math.round(
      Math.max(
        0,
        monster.dealsDamage.attack -
          platingAfterShred(target.mitigatesDamage.plating, target.tracksCombat),
      ) *
        (1 - target.mitigatesDamage.damageReduction) *
        (1 - drLayer2),
    ),
  );

  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);

  // Wasteland death-empower is a normal outgoing-damage layer, not an empowered
  // strike: it scales every direct hit without changing cadence/charge metadata.
  const deathEmpowerMult = monsterDeathEmpowerMult(monster);
  if (deathEmpowerMult > 1) {
    ctx.damage = Math.max(1, Math.round(ctx.damage * deathEmpowerMult));
  }

  // Tundra capstone: the apex feeds on the node's ambient chill the target is
  // carrying. Like the death-empower above this is a plain outgoing-damage layer,
  // NOT an empowered spike — it scales every hit without claiming the cadence/charge
  // metadata that the player's spike-answering defenses key off.
  const ambientScaling = def?.scalesWithAmbientRamp;
  // `chargedOnly` restricts the ramp feed to the telegraphed slam, so the apex's
  // ordinary swings stay flat and the Chill interaction reads as ONE tell rather
  // than a blanket damage bonus.
  const ambientFedMult =
    ambientScaling?.chargedOnly === true && chargeMult <= 1
      ? 1
      : ambientRampScalingMult(ambientScaling, target.tracksCombat);
  if (ambientFedMult > 1) {
    ctx.damage = Math.max(1, Math.round(ctx.damage * ambientFedMult));
    ctx.metadata["ambientRampFed"] = true;
  }

  // T4 monster empowered attacks (cadence finisher / cooldown spike / opening
  // strike). Multiply the already-mitigated damage BEFORE onHit/onDamageTaken so
  // the player's damage-cap, shields, plating and DR all apply to the boosted hit —
  // the same path a player empowered attack takes. Deterministic (counter + timer).
  let empoweredMult = monsterEmpoweredMultiplier(monster, def, now);

  // Charged (cast-time) attack multiplier — folds into the same empowered spike
  // path so the player's damage-cap / DR / Brace all apply to the telegraphed hit.
  if (chargeMult > 1) empoweredMult *= chargeMult;

  // Sun Mark finisher (Desert): a hit landed on a marked player is amplified and
  // consumes the mark. The marker mob (`appliesMark`) sets it up; the finisher
  // (`markedStrike`) cashes it in. Folds into the same empowered spike path.
  const markedStrike = def?.markedStrike;
  if (
    markedStrike &&
    markedStrike.multiplier > 1 &&
    getStatusEffect(target.tracksCombat, SUN_MARK_EFFECT_ID)
  ) {
    empoweredMult *= markedStrike.multiplier;
    removeStatusEffect(target.tracksCombat, SUN_MARK_EFFECT_ID);
    ctx.metadata["sunMarkConsumed"] = true;
  }

  if (empoweredMult > 1) {
    ctx.damage = Math.max(1, Math.round(ctx.damage * empoweredMult));
    ctx.metadata["empoweredAttack"] = true;
  }

  // Pre-mitigation incoming damage (gross monster attack, scaled by any empowered
  // mult, BEFORE the player's plating/DR). Exposed for listeners that want to scale
  // off the raw hit rather than the mitigated HP loss (e.g. Avenger/Vengeance), so
  // building defenses doesn't shrink the payoff.
  ctx.metadata["incomingGross"] = Math.round(
    monster.dealsDamage.attack *
      deathEmpowerMult *
      ambientFedMult *
      (empoweredMult > 1 ? empoweredMult : 1),
  );

  emitCombatEvent("onHit", ctx, world);
  emitCombatEvent("onDamageTaken", ctx, world);

  const absorbed = Number(ctx.metadata["absorbed"] ?? 0);
  const mitigation = buildPlatingDrBreakdown({
    grossDamage: monster.dealsDamage.attack,
    effectivePlating: platingAfterShred(
      target.mitigatesDamage.plating,
      target.tracksCombat,
    ),
    platingMult: 1,
    damageReduction: target.mitigatesDamage.damageReduction,
  });
  mitigation.hpDamage = ctx.damage;
  mitigation.glancing =
    mitigation.hpDamage === 1 &&
    monster.dealsDamage.attack - mitigation.mitigatedTotal < 1;

  recordWorldLogEvent(
    world,
    {
      kind: "damage",
      nodeId: target.hasPosition.nodeId,
      source: actorFromMonster(monster),
      target: actorFromPlayer(target),
      hpDamage: ctx.damage,
      absorbed,
      damageType: "direct",
      mitigation,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [target.isPlayer.id],
      nodeId: target.hasPosition.nodeId,
    },
  );

  if (absorbed > 0) {
    recordWorldLogEvent(
      world,
      {
        kind: "absorb",
        nodeId: target.hasPosition.nodeId,
        target: actorFromPlayer(target),
        source: actorFromMonster(monster),
        amount: absorbed,
      },
      {
        visibility: "combat",
        relatedPlayerIds: [target.isPlayer.id],
        nodeId: target.hasPosition.nodeId,
      },
    );
  }

  // Incoming damage-number styling for the player. A fully evaded hit dealt no
  // damage → "DODGE" floater; otherwise a monster-hit carries the mitigation
  // hints so a partial evade / damage-cap trip / shield absorb render distinctly
  // (the shielded amount shows even when no HP was lost).
  const playerEvaded = ctx.metadata["evaded"] === true;
  if (playerEvaded && ctx.metadata["evadeFull"] === true) {
    world.pushEvent(target.hasPosition.nodeId, {
      kind: "player-evade",
      playerId: target.isPlayer.id,
      targetPos: { ...target.hasPosition.current },
    });
  } else {
    world.pushEvent(target.hasPosition.nodeId, {
      kind: "monster-hit",
      targetId: target.isPlayer.id,
      empowered: empoweredMult > 1 ? true : undefined,
      damage: ctx.damage,
      absorbed: absorbed > 0 ? absorbed : undefined,
      evadedPartial: playerEvaded ? true : undefined,
      capped: ctx.metadata["damageCapped"] === true ? true : undefined,
    });
  }

  target.hasHealth.hp -= ctx.damage;
  monster.performsAttack.lastAttackAt = now;

  // Sun Mark setup (Desert): the marker paints a cleansable mark the finisher cashes
  // in. Edge-triggered telegraph — a one-shot pulse only when the mark is freshly
  // applied (not on every refresh). Skipped on an evaded hit, like every debuff.
  //
  // A SELF-MARKING monster (both `appliesMark` and `markedStrike` — the T2 Desert
  // Emperor) must not repaint on the very hit that just cashed the mark: the
  // finisher check runs before damage and this applier runs after it, so without
  // this guard every hit from the second onward would land amplified forever.
  // Skipping the repaint makes it ALTERNATE — paint, cash, paint, cash.
  const mark = def?.appliesMark;
  if (
    mark &&
    ctx.metadata["sunMarkConsumed"] !== true &&
    canApplyPlayerDebuff(target) &&
    !evadeBlocksDebuffs(ctx)
  ) {
    const fresh = !getStatusEffect(target.tracksCombat, SUN_MARK_EFFECT_ID);
    const markMs = Math.round(
      mark.durationMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: SUN_MARK_EFFECT_ID,
      maxStacks: 1,
      remainingMs: markMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: { totalMs: markMs },
    });
    if (fresh) {
      world.pushEvent(target.hasPosition.nodeId, {
        kind: "ecology-pulse",
        monsterId: monster.isMonster.id,
        pos: { ...monster.hasPosition.current },
        pulse: "sun-mark",
      });
    }
  }

  // CONSTRICT — when the cadence finisher fires, the boosted hit also roots.
  // Gated on `cadenceFiredThisTick` so it lands on the heavy beat only, and on the
  // usual debuff rules so an evaded hit pins nobody.
  const cadenceRootMs = def?.cadenceFinisher?.rootMs;
  if (
    cadenceRootMs &&
    cadenceFiredThisTick(monster, now) &&
    canApplyPlayerDebuff(target) &&
    !evadeBlocksDebuffs(ctx)
  ) {
    const rootMs = Math.round(
      cadenceRootMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: "slow",
      maxStacks: 1,
      remainingMs: rootMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: { speedMult: 0, totalMs: rootMs },
    });
  }

  const slow = def?.slowEffect;
  if (slow && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    // Mobility-boot tenacity (Swamp + Graveyard stacks) shortens the CC duration.
    const slowMs = Math.round(
      slow.durationMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: "slow",
      maxStacks: 1,
      remainingMs: slowMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: {
        speedMult: slow.speedMult,
        totalMs: slowMs,
      },
    });
  }

  // Trench "abyssal pressure" — stack the player's `antiheal` status (suppresses ALL
  // healing via getAntiHealMult), so you can't out-heal an abyssal terror and must
  // burst/execute it. Decays after the last hit. Skipped on an evaded hit.
  const antiheal = def?.appliesAntiheal;
  if (antiheal && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    const durMs = Math.round(
      antiheal.durationMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: "antiheal",
      maxStacks: antiheal.maxStacks,
      remainingMs: durMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: { reductionPerStack: antiheal.reductionPerStack, totalMs: durMs },
    });
  }

  // Desert sundering — stack the player's `sundered` status (+damage TAKEN from
  // every source via playerIncomingDamageMult). The controller half of the Desert
  // pair: the pinning mob barely scratches you, it just makes its kiting dealer's
  // shots land harder. Decays after the last hit. Skipped on an evaded hit.
  const vulnerability = def?.appliesVulnerability;
  if (vulnerability && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    const durMs = Math.round(
      vulnerability.durationMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: SUNDERED_EFFECT_ID,
      maxStacks: vulnerability.maxStacks,
      remainingMs: durMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: {
        [DAMAGE_TAKEN_PCT_KEY]: vulnerability.damageTakenPct,
        totalMs: durMs,
      },
    });
  }

  // Tundra rampDebuff — stacking move-slow + attack-slow on the player, each
  // capped, decaying stackDurationMs after the last hit (refreshed every hit).
  // A Cave boss phase ('empower-shred') deepens the same corrosion instead of
  // bolting on a second mechanic. An ordinary hit erodes by ONE stack; the
  // telegraphed Breach ability applies a larger dose through the same helper.
  if (def?.appliesPlatingShred && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    applyPlatingShredStacks(world, monster, target, def, 1);
  }

  const rampDebuff = def?.rampDebuff;
  if (rampDebuff && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    const durMs = Math.round(
      rampDebuff.stackDurationMs * harmfulStatusDurationMult(target),
    );
    // A boss 'modify-ramp-debuff' action raises the slow caps mid-fight.
    const capOverride = monster.scriptsBoss?.rampDebuffCapOverride;
    const effectiveRamp = capOverride
      ? { ...rampDebuff, moveSlowMaxPct: capOverride.moveSlowMaxPct, atkSlowMaxPct: capOverride.atkSlowMaxPct }
      : rampDebuff;
    applyStatusEffect(target.tracksCombat, {
      id: FROST_RAMP_EFFECT_ID,
      maxStacks: frostRampMaxStacks(effectiveRamp),
      remainingMs: durMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: {
        moveSlowPerHit: effectiveRamp.moveSlowPerHit,
        moveSlowMaxPct: effectiveRamp.moveSlowMaxPct,
        atkSlowPerHit: effectiveRamp.atkSlowPerHit,
        atkSlowMaxPct: effectiveRamp.atkSlowMaxPct,
        totalMs: durMs,
      },
    });
  }

  emitCombatEvent("afterHit", ctx, world);

  if (target.hasHealth.hp <= 0) {
    emitCombatEvent("onKill", ctx, world);
    world.killPlayer(target.isPlayer.id, {
      // Live instance flag (reflects a boss that morphed to ranged), so an
      // archer's kill reads "Ranged attack" and a brawler's reads "Melee attack".
      kind: monster.isMonster.isRanged ? "ranged" : "melee",
      killer: buildKillerFromMonster(monster),
      damage: ctx.damage,
    });
    return "killed";
  }
  return "hit";
}

/**
 * Abort an in-progress charged-attack wind-up and tell the node to clear the cast
 * bar. No-op when the monster isn't casting. Used on every bail path (interrupt,
 * target lost, out of range, can't-attack) so a cast never lingers silently, and
 * by `bossScripts` to retire a wind-up a higher-priority scripted cast preempts.
 */
export function abortMonsterCast(world: World, monster: MonsterEntity): void {
  if (
    chargedCastEndsAt(monster) <= 0 &&
    castedBuffCastEndsAt(monster) <= 0 &&
    lowHealthWardCastEndsAt(monster) <= 0 &&
    monsterAbilityCastEndsAt(monster) <= 0
  ) return;
  cancelCharge(monster);
  cancelCastedBuff(monster);
  cancelLowHealthWard(monster);
  cancelMonsterAbility(monster);
  // A telegraph must never outlive the cast that drew it — an abandoned circle
  // would promise an impact that is no longer coming.
  clearGroundZonesByOwner(world, monster.hasPosition.nodeId, monster.isMonster.id);
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: "monster-cast-end",
    monsterId: monster.isMonster.id,
    fired: false,
  });
}

const CASTED_BUFF_RALLY_SESSION_KEY = 'castedBuffRallySession';
const CASTED_BUFF_RALLY_RECEIVED_SESSION_KEY = 'castedBuffRallyReceivedSession';

/**
 * Pull a capped number of unengaged nearby monsters onto the caster's current
 * target. This is intentionally a cast completion effect rather than pack
 * membership: it has a visible tell, does not call bosses, and a rallied monster
 * cannot relay the same call into a second wave.
 */
function rallyNearbyMonsters(
  world: World,
  monster: MonsterEntity,
  buff: NonNullable<MonsterDefinition['castedAttackSpeedBuff']>,
  now: number,
): void {
  const rally = buff.rallyNearby;
  const aggro = monster.hasAggroTarget;
  if (!rally || !aggro) return;

  const sessionToken = aggro.sinceMs + 1;
  if (
    getCounter(monster.tracksCombat, CASTED_BUFF_RALLY_RECEIVED_SESSION_KEY) === sessionToken ||
    (rally.oncePerCombat !== false &&
      getCounter(monster.tracksCombat, CASTED_BUFF_RALLY_SESSION_KEY) === sessionToken)
  ) return;

  const target = aggro.targetKind === 'player'
    ? world.getPlayerEntity(aggro.targetId)
    : world.getMinionEntity(aggro.targetId);
  if (
    !target ||
    target.hasPosition.nodeId !== monster.hasPosition.nodeId ||
    target.hasHealth.hp <= 0 ||
    ('isDead' in target && target.isDead)
  ) return;

  const radius = buff.radius ?? 0;
  const maxTargets = Math.max(0, Math.round(rally.maxTargets));
  if (radius <= 0 || maxTargets <= 0) {
    if (rally.oncePerCombat !== false) {
      setCounter(monster.tracksCombat, CASTED_BUFF_RALLY_SESSION_KEY, sessionToken);
    }
    return;
  }

  const radiusSq = radius ** 2;
  const candidates = [...world.monsterEntitiesInNode(monster.hasPosition.nodeId)]
    .filter((ally) =>
      ally !== monster &&
      ally.hasHealth.hp > 0 &&
      !ally.isMonster.isBoss &&
      !ally.hasAggroTarget &&
      distanceSq(ally.hasPosition.current, monster.hasPosition.current) <= radiusSq &&
      distanceSq(ally.hasPosition.current, ally.controlsMonster.spawn) <= ally.controlsMonster.leashRange ** 2,
    )
    .map((ally) => ({
      ally,
      distSq: distanceSq(ally.hasPosition.current, monster.hasPosition.current),
    }))
    .sort((a, b) => a.distSq - b.distSq || a.ally.isMonster.id.localeCompare(b.ally.isMonster.id))
    .slice(0, maxTargets);

  for (const { ally } of candidates) {
    setAggroTarget(world, ally, { id: aggro.targetId, kind: aggro.targetKind }, now);
    // Keep the rally to one hop. If an allied monster later has its own rally
    // cast, it should not turn this local call into an accidental pack chain.
    // Stamp the token from the aggro session the ally ACTUALLY got, rather than
    // assuming `setAggroTarget` seeded `sinceMs` from `now` — the two would have
    // to stay in lockstep for a derived token to keep matching.
    const alliedSession = ally.hasAggroTarget?.sinceMs ?? now;
    setCounter(ally.tracksCombat, CASTED_BUFF_RALLY_RECEIVED_SESSION_KEY, alliedSession + 1);
  }
  if (rally.oncePerCombat !== false) {
    setCounter(monster.tracksCombat, CASTED_BUFF_RALLY_SESSION_KEY, sessionToken);
  }
}

type MonsterAbilityHitAction = Extract<MonsterAbilityAction, { type: 'hit' }>;
type MonsterAbilityAreaAction = Extract<MonsterAbilityAction, { type: 'area-hit' }>;

/**
 * Apply one generic player rider so its authored magnitude actually lands.
 *
 * `applyStatusEffect` keeps the EXISTING `data` when the effect is already on the
 * target — it bumps stacks and refreshes the clock, nothing more. So a rider that
 * loses the race to another source of the same status (a stacking
 * `appliesAntiheal`, a `sundered` pool, a monster `slowEffect`) would otherwise
 * apply nothing but a refreshed timer. Write the magnitude back afterwards,
 * keeping whichever value is HARSHER on the player, and re-stamp `totalMs` so the
 * buff-UI clock still matches the bar it is drawn against.
 */
function applyStrongestPlayerRider(
  target: PlayerEntity,
  sourceId: string,
  id: string,
  durationMs: number,
  key: string,
  value: number,
  harsher: (existing: number, incoming: number) => number,
): void {
  const effect = applyStatusEffect(target.tracksCombat, {
    id,
    maxStacks: 1,
    remainingMs: durationMs,
    refreshable: true,
    sourceId,
    data: { [key]: value, totalMs: durationMs },
  });
  const existing = effect.data[key];
  effect.data[key] = existing === undefined ? value : harsher(existing, value);
  effect.data.totalMs = Math.max(effect.data.totalMs ?? 0, durationMs);
}

/** Apply the small, shared set of player riders supported by generic abilities. */
function applyMonsterAbilityPlayerEffect(
  monster: MonsterEntity,
  target: PlayerEntity,
  effect: NonNullable<MonsterAbilityHitAction['effect']>,
): void {
  if (!canApplyPlayerDebuff(target) || effect.durationMs <= 0) return;
  const durationMs = Math.round(
    effect.durationMs * harmfulStatusDurationMult(target),
  );
  if (durationMs <= 0) return;
  const sourceId = monster.isMonster.id;

  // A slow is harsher the LOWER its multiplier; the other two are harsher higher.
  if (effect.kind === 'slow') {
    applyStrongestPlayerRider(
      target, sourceId, 'slow', durationMs,
      'speedMult', Math.max(0, Math.min(1, effect.speedMult)), Math.min,
    );
    return;
  }

  if (effect.kind === 'antiheal') {
    applyStrongestPlayerRider(
      target, sourceId, 'antiheal', durationMs,
      'reductionPerStack', Math.max(0, effect.reduction), Math.max,
    );
    return;
  }

  applyStrongestPlayerRider(
    target, sourceId, SUNDERED_EFFECT_ID, durationMs,
    DAMAGE_TAKEN_PCT_KEY, Math.max(0, effect.damageTakenPct), Math.max,
  );
}

/** Grant a generic casted self-buff or absorb ward. */
function applyMonsterAbilitySelfAction(
  monster: MonsterEntity,
  action: Extract<MonsterAbilityAction, { type: 'attack-speed-buff' | 'shield' }>,
): void {
  if (action.type === 'attack-speed-buff') {
    const attacks = action.attacks === undefined
      ? undefined
      : Math.max(1, Math.round(action.attacks));
    const effect = applyStatusEffect(monster.tracksCombat, {
      id: action.effectId,
      maxStacks: attacks ?? 1,
      remainingMs: action.durationMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: {
        monsterAttackSpeedBuff: 1,
        attackSpeedPct: Math.max(0, action.attackSpeedPct),
        totalMs: action.durationMs,
        ...(attacks === undefined ? {} : { attacksRemaining: attacks }),
      },
    });
    if (attacks !== undefined) effect.stacks = attacks;
    return;
  }

  // A ward with the same id is a fresh shell, not another stack of the old one.
  removeStatusEffect(monster.tracksCombat, action.effectId);
  const wardAmount = Math.max(
    1,
    Math.round(monster.hasHealth.maxHp * Math.max(0, action.shieldPct)),
  );
  const shatter = action.shatter;
  applyStatusEffect(monster.tracksCombat, {
    id: action.effectId,
    maxStacks: 1,
    remainingMs: action.durationMs,
    refreshable: false,
    sourceId: monster.isMonster.id,
    data: {
      monsterWard: 1,
      wardAmount,
      wardMaxAmount: wardAmount,
      totalMs: action.durationMs,
      ...(shatter
        ? {
            monsterWardShatter: 1,
            shatterSelfDamagePct: shatter.selfDamagePct,
            ...(shatter.vulnerability
              ? {
                  shatterVulnerabilityPct: shatter.vulnerability.damageTakenPct,
                  shatterVulnerabilityDurationMs: shatter.vulnerability.durationMs,
                }
              : {}),
            ...(shatter.freezeRadius === undefined
              ? {}
              : { shatterFreezeRadius: shatter.freezeRadius }),
            ...(shatter.freezeDurationMs === undefined
              ? {}
              : { shatterFreezeDurationMs: shatter.freezeDurationMs }),
          }
        : {}),
    },
  });
}

function resolveMonsterAbilityHit(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  action: MonsterAbilityHitAction,
  now: number,
): void {
  const result: Record<string, unknown> = {};
  const outcome = runMonsterAttack(world, monster, target, now, action.multiplier, result);
  if (outcome !== 'hit' || result.evadeBlocksDebuffs === true) return;
  if (action.effect) applyMonsterAbilityPlayerEffect(monster, target, action.effect);
  if (action.knockback) {
    pushPlayer(world, target, monster.hasPosition.current, action.knockback.distance);
  }
  const refreshed = world.getPlayerEntity(target.isPlayer.id);
  if (refreshed) markEngaged(world, refreshed, now);
}

function resolveMonsterAbilityArea(
  world: World,
  monster: MonsterEntity,
  action: MonsterAbilityAreaAction,
  impact: Vec2,
  now: number,
): void {
  const nodeId = monster.hasPosition.nodeId;
  const victims = world.collision.bodiesInCircle(
    world.livePlayersInNode(nodeId),
    impact,
    action.radius,
  );
  for (const victim of victims) {
    const target = world.getPlayerEntity(victim.isPlayer.id);
    if (!target) continue;
    const result: Record<string, unknown> = {};
    const outcome = runMonsterAttack(world, monster, target, now, action.multiplier, result);
    if (outcome === 'hit' && result.evadeBlocksDebuffs !== true) {
      if (action.effect) applyMonsterAbilityPlayerEffect(monster, target, action.effect);
      if (action.stunMs && canApplyPlayerDebuff(target)) {
        applyStun(
          target.tracksCombat,
          action.stunMs,
          monster.isMonster.id,
          harmfulStatusDurationMult(target),
        );
      }
      if (action.knockback) {
        pushPlayer(world, target, impact, action.knockback.distance);
      }
      const refreshed = world.getPlayerEntity(target.isPlayer.id);
      if (refreshed) markEngaged(world, refreshed, now);
    }
    if (!world.hasMonster(monster.isMonster.id)) return;
  }

  for (const minion of world.collision.bodiesInCircle(
    world.minionEntitiesInNode(nodeId),
    impact,
    action.radius,
  )) {
    if (minion.hasHealth.hp > 0) {
      runMonsterAttackOnMinion(world, monster, minion, now, action.multiplier);
    }
  }
}

/** Resolve all actions in one generic ability at its captured impact point. */
function resolveMonsterAbility(
  world: World,
  monster: MonsterEntity,
  ability: MonsterAbility,
  target: PlayerEntity | null,
  impact: Vec2 | null,
  now: number,
): void {
  for (const action of ability.actions) {
    if (action.type === 'hit') {
      if (target) resolveMonsterAbilityHit(world, monster, target, action, now);
    } else if (action.type === 'area-hit') {
      resolveMonsterAbilityArea(
        world,
        monster,
        action,
        impact ?? monster.hasPosition.current,
        now,
      );
    } else if (action.type === 'plating-shred') {
      // BREACH — a larger dose of the caster's own corrosion, through the same
      // helper an ordinary hit uses. Guarded like any other applied debuff so an
      // invulnerable or dead player is not eroded by a cast they cannot answer.
      if (target && canApplyPlayerDebuff(target)) {
        applyPlatingShredStacks(
          world,
          monster,
          target,
          MONSTER_DATABASE.get(monster.isMonster.monsterTypeId),
          action.stacks,
        );
      }
    } else {
      applyMonsterAbilitySelfAction(monster, action);
    }
    if (!world.hasMonster(monster.isMonster.id)) return;
  }
}

/**
 * Run the generic ability scheduler. It is intentionally independent of the
 * ordinary attack timer: abilities have their own cooldowns and a cast replaces
 * the next few moments of basic pressure with a visible, authored beat.
 */
function updateMonsterAbilities(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity | null,
  now: number,
): boolean {
  const abilities = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.monsterAbilities;
  if (!abilities || abilities.length === 0) return false;

  const activeId = activeMonsterAbilityId(monster);
  if (activeId) {
    const ability = abilities.find(candidate => candidate.id === activeId);
    if (!ability) {
      abortMonsterCast(world, monster);
      return true;
    }

    const area = ability.actions.find(
      (action): action is MonsterAbilityAreaAction => action.type === 'area-hit',
    );
    if (ability.target === 'player') {
      const capturedId = monsterAbilityTargetId(monster);
      if (
        !target ||
        !capturedId ||
        capturedId !== target.isPlayer.id ||
        target.hasPosition.nodeId !== monster.hasPosition.nodeId ||
        target.hasHealth.hp <= 0
      ) {
        abortMonsterCast(world, monster);
        return true;
      }
      const requiresRange = ability.requiresRange ?? true;
      if (
        !area &&
        requiresRange &&
        !ability.castWhileOutOfRange &&
        !world.collision.canReach(monster, target, monster.performsAttack.attackRange)
      ) {
        abortMonsterCast(world, monster);
        return true;
      }
    }

    if (
      isMonsterStunned(world, monster.isMonster.id) ||
      isMonsterFrozen(world, monster.isMonster.id)
    ) {
      abortMonsterCast(world, monster);
      return true;
    }
    if (now < monsterAbilityCastEndsAt(monster)) return true;

    const impact = monsterAbilityImpactPoint(monster);
    clearGroundZonesByOwner(world, monster.hasPosition.nodeId, monster.isMonster.id);
    completeMonsterAbility(monster, ability, now);
    resolveMonsterAbility(world, monster, ability, target, impact, now);
    if (!world.hasMonster(monster.isMonster.id)) return true;
    // A cast COSTS the swing it replaced. `runMonsterAttack` already stamps this
    // for the damage actions, but a self-only beat (a barrier, a frenzy) touches
    // nothing — without this it would resolve and then immediately swing for free.
    // The casted-buff path pays the same cost by waiting on the attack timer.
    monster.performsAttack.lastAttackAt = now;
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'monster-cast-end',
      monsterId: monster.isMonster.id,
      fired: true,
      targetId: ability.target === 'player' ? target?.isPlayer.id : undefined,
      pos: impact ? { ...impact } : { ...monster.hasPosition.current },
      radius: area?.radius,
      fx: ability.fx,
    });
    return true;
  }

  if (
    isMonsterStunned(world, monster.isMonster.id) ||
    isMonsterFrozen(world, monster.isMonster.id)
  ) return false;

  // ONE CAST PER MONSTER. Every other cast system in this loop is ordered so it
  // cannot start on top of a live wind-up, and two invariants depend on that:
  // `publishGroundZone` clears telegraphs by ownerId (so a second cast ERASES the
  // first one's committed circle) and the client's cast bar is keyed by monster id
  // (so a second cast-start steals the bar and the first cast-end closes it early).
  // Without this guard an ability could begin mid-Devour, wipe its telegraph, and
  // leave the slam to land unannounced. The generic scheduler yields; the charged /
  // buff / ward beat it here and keeps its wind-up.
  if (
    chargedCastEndsAt(monster) > 0 ||
    castedBuffCastEndsAt(monster) > 0 ||
    lowHealthWardCastEndsAt(monster) > 0
  ) return false;

  for (const ability of abilities) {
    if (ability.actions.length === 0 || !monsterAbilityReady(monster, ability, now)) continue;
    if (ability.target === 'player' && !target) continue;
    const requiresRange = ability.requiresRange ?? ability.target === 'player';
    if (
      requiresRange &&
      !ability.castWhileOutOfRange &&
      (!target || !world.collision.canReach(monster, target, monster.performsAttack.attackRange))
    ) continue;

    const area = ability.actions.find(
      (action): action is MonsterAbilityAreaAction => action.type === 'area-hit',
    );
    const impact = area
      ? ability.target === 'player'
        ? { ...target!.hasPosition.current }
        : { ...monster.hasPosition.current }
      : undefined;
    beginMonsterAbility(
      monster,
      ability,
      now,
      ability.target === 'player' ? target!.isPlayer.id : undefined,
      impact,
    );
    if (impact && area) {
      publishGroundZone(world, monster.hasPosition.nodeId, {
        kind: 'slam-telegraph',
        pos: impact,
        radius: area.radius,
        startedAtMs: now,
        resolvesAtMs: now + ability.castMs,
        ownerId: monster.isMonster.id,
        fx: ability.fx,
      });
    }
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'monster-cast-start',
      monsterId: monster.isMonster.id,
      castMs: ability.castMs,
      label: ability.name,
      fx: ability.fx,
    });
    return true;
  }
  return false;
}

/**
 * Resolve a non-damaging monster haste cast at a valid attack position. It owns
 * the tick while winding up or resolving, exactly like a charged attack.
 */
function updateCastedAttackSpeedBuff(
  world: World,
  monster: MonsterEntity,
  now: number,
): boolean {
  const buff = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.castedAttackSpeedBuff;
  if (!buff) return false;

  if (castedBuffCastEndsAt(monster) > 0) {
    if (isMonsterStunned(world, monster.isMonster.id) || isMonsterFrozen(world, monster.isMonster.id)) {
      abortMonsterCast(world, monster);
      return true;
    }
    if (now < castedBuffCastEndsAt(monster)) return true;

    completeCastedBuff(monster, now, buff.cooldownMs);
    const radiusSq = (buff.radius ?? Infinity) ** 2;
    const recipients = buff.target === 'self'
      ? [monster]
      : [...world.monsterEntitiesInNode(monster.hasPosition.nodeId)].filter(ally =>
          ally.hasHealth.hp > 0 &&
          (buff.includeSelf !== false || ally !== monster) &&
          distanceSq(ally.hasPosition.current, monster.hasPosition.current) <= radiusSq,
        );
    for (const recipient of recipients) {
      const charges = buff.attacks === undefined ? undefined : Math.max(1, Math.round(buff.attacks));
      const effect = applyStatusEffect(recipient.tracksCombat, {
        id: buff.effectId,
        maxStacks: charges ?? 1,
        remainingMs: buff.durationMs ?? -1,
        refreshable: true,
        sourceId: monster.isMonster.id,
        data: {
          monsterAttackSpeedBuff: 1,
          attackSpeedPct: buff.attackSpeedPct,
          ...(buff.durationMs === undefined ? {} : { totalMs: buff.durationMs }),
          ...(charges === undefined ? {} : { attacksRemaining: charges }),
        },
      });
      if (charges !== undefined) effect.stacks = charges;
    }
    rallyNearbyMonsters(world, monster, buff, now);
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'monster-cast-end', monsterId: monster.isMonster.id, fired: true, fx: buff.fx,
    });
    return true;
  }

  const attackDue = now - monster.performsAttack.lastAttackAt >= monsterAttackCooldown(monster);
  const initialCooldownMs = buff.initialCooldownMs ?? buff.cooldownMs;
  const ready = castedBuffReady(monster, now, initialCooldownMs);
  if (
    attackDue && ready &&
    !isMonsterStunned(world, monster.isMonster.id) && !isMonsterFrozen(world, monster.isMonster.id)
  ) {
    beginCastedBuff(monster, now, buff.castMs);
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'monster-cast-start', monsterId: monster.isMonster.id,
      castMs: buff.castMs, label: buff.name, fx: buff.fx,
    });
    return true;
  }
  return false;
}

/** Resolve a one-time low-HP ward cast. It is self-targeted, so it can begin
 * and finish outside normal attack range exactly like the Dire Wolf's Howl. */
function updateLowHealthWard(
  world: World,
  monster: MonsterEntity,
  now: number,
): boolean {
  const ward = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.lowHealthWard;
  if (!ward) return false;

  if (lowHealthWardCastEndsAt(monster) > 0) {
    if (isMonsterStunned(world, monster.isMonster.id) || isMonsterFrozen(world, monster.isMonster.id)) {
      abortMonsterCast(world, monster);
      return true;
    }
    if (now < lowHealthWardCastEndsAt(monster)) return true;

    completeLowHealthWard(monster);
    const wardAmount = Math.round(monster.hasHealth.maxHp * ward.wardPct);
    applyStatusEffect(monster.tracksCombat, {
      id: ward.effectId,
      maxStacks: 1,
      remainingMs: ward.durationMs,
      refreshable: false,
      sourceId: monster.isMonster.id,
      data: {
        monsterWard: 1,
        wardAmount,
        wardMaxAmount: wardAmount,
        totalMs: ward.durationMs,
      },
    });
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'monster-cast-end', monsterId: monster.isMonster.id, fired: true, fx: ward.fx,
    });
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'boss-fx', monsterId: monster.isMonster.id,
      pos: { ...monster.hasPosition.current }, fx: 'shield',
    });
    return true;
  }

  if (!lowHealthWardReady(monster, ward)) return false;
  beginLowHealthWard(monster, now, ward.castMs);
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: 'monster-cast-start', monsterId: monster.isMonster.id,
    castMs: ward.castMs, label: ward.name, fx: ward.fx,
  });
  return true;
}

/**
 * Marked-prey tell: when a `marksTarget` charge BEGINS, paint the shared sun-mark
 * "MARKED" debuff on the target for the readable wind-up (the Forest Scent-of-Blood
 * beat). Reuses the mark status/pulse so it shows in the player buff bar and is
 * cleansable. Edge-triggered pulse only on a fresh mark.
 */
/**
 * Riders applied when a charged attack LANDS. These are the locked designs'
 * "periodic non-damage abilities": rather than each getting its own subsystem,
 * they hang off the one telegraphed-cast primitive the game already has, so every
 * one of them arrives with a cast bar the player can see and a `target-casting`
 * rune condition that can react to it.
 *
 *   rootMs              Petrifying Gaze / Frostbind / Constrict
 *   appliesAntiheal     Wither / Abyssal Wound
 *   refreshesPlayerDots the evolved Swamp hexer's plague hex
 *
 * All are skipped when the target cannot take debuffs, matching every other
 * on-hit rider. (A charged hit is never "evaded" as a whole, so there is no
 * `evadeBlocksDebuffs` check here — the cast either lands or was interrupted.)
 */
function applyChargedAttackRiders(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  charged: NonNullable<MonsterDefinition["chargedAttack"]>,
): void {
  if (!canApplyPlayerDebuff(target)) return;

  // ROOT — the shared `slow` status at speedMult 0. Movement stops; attacks do
  // NOT, which is what keeps these solvable by configuration. Mobility tenacity
  // shortens it and Cleanse strips it, like any other monster debuff.
  if (charged.rootMs && charged.rootMs > 0) {
    const rootMs = Math.round(
      charged.rootMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: "slow",
      maxStacks: 1,
      remainingMs: rootMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: { speedMult: 0, totalMs: rootMs },
    });
    world.pushEvent(target.hasPosition.nodeId, {
      kind: "ecology-pulse",
      monsterId: monster.isMonster.id,
      pos: { ...monster.hasPosition.current },
      pulse: "sun-mark",
    });
  }

  // NUMBING STING — the soft-control counterpart to a charged root. It uses the
  // same player status and tenacity pipeline, but retains movement at an authored
  // fraction rather than dropping speed to zero.
  const slow = charged.appliesSlow;
  if (slow && slow.durationMs > 0 && slow.speedMult >= 0 && slow.speedMult < 1) {
    const slowMs = Math.round(
      slow.durationMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: "slow",
      maxStacks: 1,
      remainingMs: slowMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: { speedMult: slow.speedMult, totalMs: slowMs },
    });
  }

  // WITHER — one NON-STACKING Recovery suppression. Same `antiheal` status the
  // Trench uses, so `getAntiHealMult` and the buff tile need no changes; the
  // difference is that this one comes from a telegraphed ability instead of
  // every ordinary hit.
  const wither = charged.appliesAntiheal;
  if (wither) {
    const durMs = Math.round(
      wither.durationMs * harmfulStatusDurationMult(target),
    );
    applyStatusEffect(target.tracksCombat, {
      id: "antiheal",
      maxStacks: 1,
      remainingMs: durMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: { reductionPerStack: wither.reduction, totalMs: durMs },
    });
  }

  // PLAGUE HEX — extend the monster DoTs already on the player. Creates NOTHING:
  // no new stacks, no new effect, and with no poison already ticking it does
  // nothing at all. That restriction is the design — the evolved hexer SUPPORTS
  // the biome's poison rather than adding a fourth source of it.
  const hex = charged.refreshesPlayerDots;
  if (hex) {
    let extended = false;
    for (const effect of target.tracksCombat.statusEffects) {
      if ((effect.data["isDot"] ?? 0) === 0) continue;
      if (effect.remainingMs <= 0) continue;
      const total = effect.data["totalMs"] ?? effect.remainingMs;
      const capped = Math.min(hex.maxTotalMs, effect.remainingMs + hex.extendMs);
      if (capped <= effect.remainingMs) continue;
      effect.remainingMs = capped;
      // Keep the buff clock honest: the tile reads remaining/total.
      effect.data["totalMs"] = Math.max(total, capped);
      extended = true;
    }
    if (extended) {
      world.pushEvent(target.hasPosition.nodeId, {
        kind: "ecology-pulse",
        monsterId: monster.isMonster.id,
        pos: { ...monster.hasPosition.current },
        pulse: "sun-mark",
      });
    }
  }
}

/**
 * ACCELERATING TELL — shrink the wind-up by however many stacks of the named
 * boss-script effect the caster is carrying (see `chargedAttack.hastenedBy`).
 *
 * Applied BEFORE 'empower-charged' scaling so a phase's `castMsMult` still reads
 * as a multiplier on the tell the player is currently seeing. Returns the authored
 * definition untouched when the boss declares no haste or holds no stacks, so the
 * common path allocates nothing.
 */
function hastenedChargedAttack(
  monster: MonsterEntity,
  charged: MonsterDefinition["chargedAttack"],
): MonsterDefinition["chargedAttack"] {
  const haste = charged?.hastenedBy;
  if (!charged || !haste) return charged;
  const stacks = (monster.scriptsBoss?.activeEffects ?? []).filter(
    effect => effect.type === haste.bossEffect,
  ).length;
  if (stacks <= 0) return charged;
  const castMs = Math.max(
    haste.minCastMs,
    Math.round(charged.castMs * Math.pow(haste.castMsMultPerStack, stacks)),
  );
  if (castMs === charged.castMs) return charged;
  return { ...charged, castMs };
}

/**
 * The boss's signature attack AFTER any 'empower-charged' phases have scaled it.
 * Returns the authored definition untouched when no override is present, so the
 * common path allocates nothing.
 *
 * Escalating the attack the encounter is already about is the rework's preferred
 * shape of a phase: Mountain's slam lands harder and sooner, Tundra's Collapse
 * widens, the Trench's Devour comes around faster — rather than each tier bolting
 * on an unrelated defensive keyword.
 */
function effectiveChargedAttack(
  monster: MonsterEntity,
): MonsterDefinition["chargedAttack"] {
  const authored = MONSTER_DATABASE.get(
    monster.isMonster.monsterTypeId,
  )?.chargedAttack;
  const charged = hastenedChargedAttack(monster, authored);
  const scale = monster.scriptsBoss?.chargedOverride;
  if (!charged || !scale) return charged;
  return {
    ...charged,
    multiplier: charged.multiplier * scale.multiplierMult,
    cooldownMs: Math.max(1000, Math.round(charged.cooldownMs * scale.cooldownMult)),
    castMs: Math.max(200, Math.round(charged.castMs * scale.castMsMult)),
    ...(charged.aoe
      ? {
          aoe: {
            ...charged.aoe,
            radius: Math.round(charged.aoe.radius * scale.radiusMult),
          },
        }
      : {}),
    ...(charged.aftershock
      ? {
          aftershock: {
            ...charged.aftershock,
            rayCount:
              charged.aftershock.rayCount + scale.aftershockRayCountAdd,
            damageMultiplier:
              charged.aftershock.damageMultiplier * scale.aftershockDamageMult,
          },
        }
      : {}),
  };
}

/**
 * CHILL GATE — is this charged attack allowed to start casting yet?
 *
 * True unless the def sets `requiresAmbientStacks` and the target is not yet
 * carrying that many stacks of the node's ambient ramp. Tundra's Frostbind: the
 * caster's root only comes online once the ROOM has already chilled you, which is
 * what fuses the environment and the roster into one mechanic. While the gate is
 * shut the monster just keeps making ordinary attacks and the charge stays armed.
 */
function chargedAttackGateOpen(
  target: PlayerEntity,
  charged: NonNullable<MonsterDefinition["chargedAttack"]>,
): boolean {
  const required = charged.requiresAmbientStacks;
  if (!required || required <= 0) return true;
  const ramp = ambientRampStatus(target.tracksCombat);
  return (ramp?.stacks ?? 0) >= required;
}

function applyChargedAttackMark(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  charged: NonNullable<MonsterDefinition["chargedAttack"]>,
): void {
  const mark = charged.marksTarget;
  if (!mark || !canApplyPlayerDebuff(target)) return;
  const markMs = Math.round(mark.durationMs * harmfulStatusDurationMult(target));
  const fresh = !getStatusEffect(target.tracksCombat, SUN_MARK_EFFECT_ID);
  applyStatusEffect(target.tracksCombat, {
    id: SUN_MARK_EFFECT_ID,
    maxStacks: 1,
    remainingMs: markMs,
    refreshable: true,
    sourceId: monster.isMonster.id,
    data: { totalMs: markMs },
  });
  if (fresh) {
    world.pushEvent(target.hasPosition.nodeId, {
      kind: "ecology-pulse",
      monsterId: monster.isMonster.id,
      pos: { ...monster.hasPosition.current },
      pulse: "sun-mark",
    });
  }
}

function applyChargedAttackKnockback(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  charged: NonNullable<MonsterDefinition["chargedAttack"]>,
): void {
  // Through the shared forced-movement helper: resistance, clamping, obstacle
  // resolution and the reason-tagged event are the same whichever direction a
  // boss moves the player. No boss writes coordinates itself.
  pushPlayer(world, target, monster.hasPosition.current, charged.knockback?.distance ?? 0);
}

/**
 * Run a single monster attack against a minion. Bypasses the combat pipeline
 * intentionally — minions are damage sponges, not full combatants. They have
 * no buffs, no shields, no DoT resistance; HP reduction is raw modulo plating.
 * Mirrors AoE's pipeline-bypass design.
 */
export function runMonsterAttackOnMinion(
  world: World,
  monster: MonsterEntity,
  minion: MinionEntity,
  now: number,
  damageMultiplier = 1,
): void {
  const damage = Math.max(
    1,
    Math.round(
      Math.max(0, monster.dealsDamage.attack - minion.mitigatesDamage.plating) *
        (1 - minion.mitigatesDamage.damageReduction) *
        Math.max(0, damageMultiplier),
    ),
  );
  minion.hasHealth.hp = Math.max(0, minion.hasHealth.hp - damage);
  monster.performsAttack.lastAttackAt = now;
  // Death is observed by the summoner tick on its next pass — it will detach
  // the minion entity and start a respawn timer. We deliberately do not push
  // a client event here in v1; the slime's HP bar drop is enough feedback.
}

/**
 * If the monster defines `aoeAttack`, splash all OTHER players and enemy summons
 * within radius of the primary target. The primary already took its direct hit;
 * `primaryId` excludes it from the splash. Pure damage — no slow/DoT.
 */
function applyMonsterAttackSplash(
  world: World,
  monster: MonsterEntity,
  center: Vec2,
  primaryId: string,
): void {
  const aoe = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.aoeAttack;
  if (!aoe) return;
  applyMonsterAoe(
    world,
    monster,
    center,
    aoe.radius,
    monster.dealsDamage.attack * (aoe.damageMult ?? 1),
    primaryId,
  );
}

/**
 * Resolve a completed COMMITTED ground slam at its planted point.
 *
 * Deliberately NOT `applyMonsterAoe`: that path applies only plating + flat DR,
 * bypassing the combat pipeline. A slam authored to trip the player damage-cap
 * has to go through `runMonsterAttack` per victim — that is where `chargeMult`
 * folds into the empowered-spike path so the cap, Brace and shields all apply,
 * exactly as they do for a single-target charged hit. Minions take the same raw
 * mitigated damage they take from any monster swing.
 *
 * Everyone inside the circle is hit, the original target included only if they
 * are still standing in it. Nobody inside is excluded — walking out is the
 * counterplay, not being the primary target.
 */
function resolveChargedSlam(
  world: World,
  monster: MonsterEntity,
  charged: NonNullable<MonsterDefinition["chargedAttack"]>,
  aoe: NonNullable<NonNullable<MonsterDefinition["chargedAttack"]>["aoe"]>,
  impact: Vec2,
  now: number,
): void {
  const nodeId = monster.hasPosition.nodeId;
  const telegraph = (world.groundZones.get(nodeId) ?? []).find(
    (zone): zone is RuntimeSlamTelegraph =>
      zone.kind === "slam-telegraph" && zone.ownerId === monster.isMonster.id,
  );
  const telemetryCapture = telegraph
    ? beginTelegraphResolutionTelemetry(world, nodeId, telegraph, now)
    : null;
  // The telegraph resolved — retire it before anything can kill the owner and
  // leave the circle stranded for the sweeper to collect.
  clearGroundZonesByOwner(world, nodeId, monster.isMonster.id);

  const slamMult = charged.multiplier * (aoe.damageMult ?? 1);

  const victims = world.collision.bodiesInCircle(
    world.livePlayersInNode(nodeId),
    impact,
    aoe.radius,
  );
  for (const victim of victims) {
    // Each victim re-checked for liveness: an earlier victim's death can drain
    // the node (party wipe) and invalidate the rest of the list.
    if (!world.getPlayerEntity(victim.isPlayer.id)) continue;
    const outcome = runMonsterAttack(world, monster, victim, now, slamMult);
    if (telemetryCapture) {
      recordTelegraphResolutionVictim(world, telemetryCapture, victim.isPlayer.id);
    }
    if (outcome === "hit") {
      if (charged.stunMs && canApplyPlayerDebuff(victim)) {
        applyStun(
          victim.tracksCombat,
          charged.stunMs,
          monster.isMonster.id,
          harmfulStatusDurationMult(victim),
        );
      }
      applyChargedAttackKnockback(world, monster, victim, charged);
      const refreshed = world.getPlayerEntity(victim.isPlayer.id);
      if (refreshed) markEngaged(world, refreshed, now);
    }
    if (!world.hasMonster(monster.isMonster.id)) {
      if (telemetryCapture) finishTelegraphResolutionTelemetry(world, telemetryCapture);
      return; // reflected to death
    }
  }
  if (telemetryCapture) finishTelegraphResolutionTelemetry(world, telemetryCapture);

  const minions = world.collision.bodiesInCircle(
    world.minionEntitiesInNode(nodeId),
    impact,
    aoe.radius,
  );
  for (const minion of minions) {
    runMonsterAttackOnMinion(world, monster, minion, now);
  }

  if (charged.pool) {
    const pool = charged.pool;
    publishToxicPool(world, nodeId, {
      kind: "toxic-pool",
      pos: { ...impact },
      radius: aoe.radius,
      startedAtMs: now,
      expiresAtMs: now + pool.durationMs,
      damagePerTick: pool.damagePerTick,
      tickIntervalMs: pool.tickIntervalMs,
      slowSpeedMult: pool.slowSpeedMult,
      vulnerability: pool.vulnerability,
      ownerId: monster.isMonster.id,
      detonationMultiplier: pool.detonationMultiplier,
      sourceId: charged.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      sourceLabel: charged.name,
      killer: buildKillerFromMonster(monster),
    });
  }

  if (charged.aftershock?.kind === 'radial-fault-lines') {
    const aftershock = charged.aftershock;
    const points: Vec2[] = [];
    const innerRadius = aftershock.innerRadius ?? Math.max(aoe.radius * 0.45, 48);
    const step = Math.max(1, aftershock.lineRadius * 1.7);
    // Rotate each burst so the safe wedges are readable but not fixed cardinal lanes.
    const rotation = ((now % 4_000) / 4_000) * Math.PI * 2;
    for (let ray = 0; ray < aftershock.rayCount; ray++) {
      const angle = rotation + (ray / aftershock.rayCount) * Math.PI * 2;
      for (let distance = innerRadius; distance <= aftershock.length; distance += step) {
        points.push({
          x: impact.x + Math.cos(angle) * distance,
          y: impact.y + Math.sin(angle) * distance,
        });
      }
    }
    publishFaultLineBurst(world, nodeId, {
      kind: 'fault-line-telegraph',
      pos: { ...impact },
      radius: aftershock.lineRadius,
      startedAtMs: now,
      resolvesAtMs: now + aftershock.delayMs,
      ownerId: monster.isMonster.id,
      points,
      damageMultiplier: aftershock.damageMultiplier,
    });
  }

  // The impact point and radius ride along so a bespoke `aoe.impactFx` can be
  // anchored where the circle actually was, not on the caster (the two have
  // diverged by now) and not on a target that may have walked out or died.
  world.pushEvent(nodeId, {
    kind: "monster-cast-end",
    monsterId: monster.isMonster.id,
    fired: true,
    pos: { ...impact },
    radius: aoe.radius,
    fx: aoe.impactFx ?? charged.fx,
  });

  // The slam ALWAYS erupts where it was planted, hit or miss. A telegraphed
  // circle that resolves silently on empty ground reads as a bug; the shockwave
  // is what pays off the wind-up and teaches that stepping out was the answer.
  // Anchored to `impact`, never the caster — the two have diverged by now.
  //
  // A slam that declares its own `impactFx` pays the wind-up off with THAT instead:
  // the generic shockwave on top would just bury the signature cue.
  if (aoe.impactFx) return;
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  world.pushEvent(nodeId, {
    kind: "boss-fx",
    monsterId: monster.isMonster.id,
    pos: { ...impact },
    fx: "slam",
    radius: aoe.radius,
    element: def?.attackStyle,
  });
}

/** Monsters a player may actually swing at: present, and not burrowed or hidden. */
function* targetableMonstersInNode(world: World, nodeId: string): Generator<MonsterEntity> {
  for (const monster of world.monsterEntitiesInNode(nodeId)) {
    if (monster.isConcealed) continue;
    yield monster;
  }
}

/** Resolve expiry detonations and linked fault lines through real monster hits. */
function resolveDelayedGroundZoneImpacts(world: World, now: number): void {
  for (const impact of takeDueGroundZoneImpacts(world, now)) {
    const ownerId = impact.ownerId;
    if (!ownerId) continue;
    const monster = world.getMonsterEntity(ownerId);
    if (!monster || monster.hasHealth.hp <= 0) continue;
    const telemetryCapture = impact.kind === 'fault-line-telegraph'
      ? beginTelegraphResolutionTelemetry(world, monster.hasPosition.nodeId, impact, now)
      : null;

    const points = impact.kind === 'toxic-pool' ? [impact.pos] : impact.points;
    const multiplier = impact.kind === 'toxic-pool'
      ? impact.detonationMultiplier ?? 1
      : impact.damageMultiplier;
    const players = new Map<string, PlayerEntity>();
    const minions = new Map<string, MinionEntity>();
    for (const point of points) {
      for (const player of world.collision.bodiesInCircle(
        world.livePlayersInNode(monster.hasPosition.nodeId),
        point,
        impact.radius,
      )) players.set(player.isPlayer.id, player);
      for (const minion of world.collision.bodiesInCircle(
        world.minionEntitiesInNode(monster.hasPosition.nodeId),
        point,
        impact.radius,
      )) minions.set(minion.isMinion.id, minion);
    }

    for (const player of players.values()) {
      if (!world.getPlayerEntity(player.isPlayer.id)) continue;
      runMonsterAttack(world, monster, player, now, multiplier);
      if (telemetryCapture) {
        recordTelegraphResolutionVictim(world, telemetryCapture, player.isPlayer.id);
      }
      if (!world.hasMonster(ownerId)) break;
    }
    if (telemetryCapture) finishTelegraphResolutionTelemetry(world, telemetryCapture);
    if (world.hasMonster(ownerId)) {
      for (const minion of minions.values()) {
        if (minion.hasHealth.hp > 0) runMonsterAttackOnMinion(world, monster, minion, now);
      }
    }

    const maxRadius = impact.kind === 'toxic-pool'
      ? impact.radius
      : Math.max(
          impact.radius,
          ...impact.points.map(point => Math.sqrt(distanceSq(point, impact.pos))),
        );
    const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
    world.pushEvent(monster.hasPosition.nodeId, {
      kind: 'boss-fx',
      monsterId: impact.id,
      pos: { ...impact.pos },
      fx: 'slam',
      radius: maxRadius,
      element: def?.attackStyle,
    });
  }
}

export function updateCombat(world: World, dt: number, now: number) {
  resolveDelayedGroundZoneImpacts(world, now);

  // PLAYER → MONSTER
  for (const player of world.livePlayers) {
    // Entities can attack by default; the CannotAttack marker is the only thing
    // that disables it. Summoners carry it permanently (their minions deal all
    // damage via runPlayerAttack(aggroSource: minion)); anyone whose range fell
    // below 1px carries it until their range recovers.
    if (player.cannotAttack) {
      setAttackTarget(world, player, null);
      continue;
    }

    // Channeled Beam locks all auto-attacks; the beam system handles targeting + damage.
    if (player.isChanneling) {
      player.performsAttack.lastAttackAt = now;
      continue;
    }

    // A casted Technique's wind-up suppresses normal attacks (abilities evolution
    // §5.2) — the cost of the burst. MOVEMENT is deliberately NOT suppressed, so
    // casting never fights rune-driven autocombat pathing. Holding lastAttackAt
    // means the attack timer resumes from the end of the cast, not mid-swing.
    if (player.isCastingAbility || player.isChargingAbility) {
      player.performsAttack.lastAttackAt = now;
      continue;
    }

    const attackRange = player.performsAttack.attackRange;

    // Concealed monsters are filtered HERE as well as in the auto-target gates: a
    // player already locked onto a boss that then burrows must lose the lock on the
    // same tick, or they keep swinging at a hole. The generator is wrapped rather
    // than materialised so the common path still allocates nothing.
    const target = world.collision.bestTargetInReach(
      player,
      targetableMonstersInNode(world, player.hasPosition.nodeId),
      attackRange,
    );

    setAttackTarget(world, player, target?.isMonster.id ?? null);

    if (target) {
      // Every temporary haste and slow — Tundra's frost ramp, the ambient node
      // ramp, Frenzy, and the stance-owned windows — is applied as a MULTIPLIER
      // here rather than written into `attackCooldown`, so the stat-recalc-owned
      // base is never mutated (two mutators each treating the other's output as
      // "the clean base" ratchet the cooldown toward zero).
      //
      // The maths lives in `attackCadence.ts` because the HUD mirror has to use
      // the exact same function. When it was inline here, the stat sheet read
      // the untouched `attackCooldown` and showed no change at all — Frenzy,
      // both stance windows and both slows worked but looked inert.
      const cadenceMult = attackCadenceMult(player.tracksCombat);
      if (
        now - player.performsAttack.lastAttackAt >=
        player.performsAttack.attackCooldown * cadenceMult
      ) {
        const outcome = runPlayerAttack(world, player, target, now, {
          attackOrigin: player.hasPosition.current,
          aggroSource: { id: player.isPlayer.id, kind: "player" },
        });
        // All cooldown-consuming outcomes (everything except cancelled) advance
        // the player's own attack timer, mirroring previous behavior.
        if (outcome !== "cancelled") {
          player.performsAttack.lastAttackAt = now;
        }
      }
    } else {
      // Refresh combat timer while any monster still has this player in aggro,
      // so regen doesn't tick while being actively chased.
      for (const e of [...world.aggroedMonsters]) {
        if (!e?.hasAggroTarget) continue;
        if (
          e.hasAggroTarget.targetKind === "player" &&
          e.hasAggroTarget.targetId === player.isPlayer.id
        ) {
          const p = world.getPlayerEntity(player.isPlayer.id);
          if (p) markEngaged(world, p, now);
          break;
        }
      }

    }
  }

  // MONSTER → PLAYER / MINION
  for (const e of [...world.aggroedMonsters]) {
    if (
      !e?.hasAwareness ||
      !e.hasAggroTarget ||
      !e.hasPosition ||
      !e.performsAttack ||
      !e.dealsDamage
    ) {
      continue;
    }
    // Same rule as players: a monster with the CannotAttack marker cannot strike.
    if (e.cannotAttack) {
      abortMonsterCast(world, e);
      setAttackTarget(world, e, null);
      continue;
    }
    if (engageSequenceHoldsAttack(e)) {
      if (
        isMonsterStunned(world, e.isMonster.id) ||
        isMonsterFrozen(world, e.isMonster.id)
      ) {
        abortEngageSequence(world, e);
      }
      // The lockdown beat deliberately suppresses the troll's basic attack.
      continue;
    }
    if (e.hasAwareness.state !== "attacking") {
      abortMonsterCast(world, e);
      continue;
    }

    if (e.hasAggroTarget.targetKind === "player") {
      const target = world.getPlayerEntity(e.hasAggroTarget.targetId) ?? null;
      if (!target || target.hasPosition.nodeId !== e.hasPosition.nodeId) {
        abortMonsterCast(world, e);
        setAggroTarget(world, e, null, now);
        setAttackTarget(world, e, null);
        continue;
      }
      const monsterDef = MONSTER_DATABASE.get(e.isMonster.monsterTypeId);
      // Generic self abilities may begin outside attack range, and generic area
      // abilities are committed to their planted point. Let that scheduler inspect
      // the target before the ordinary range bail-out below.
      if (updateMonsterAbilities(world, e, target, now)) continue;
      // A planted ground slam is COMMITTED: the circle was drawn on the ground,
      // so the swing lands whether or not the target is still standing in it.
      // Every other charge still breaks when the target slips out of reach.
      const slamCommitted = chargedCastEndsAt(e) > 0 && isChargeAoePlanted(e);
      const lowHealthWard = monsterDef?.lowHealthWard;
      const castsOutsideAttackRange =
        monsterDef?.castedAttackSpeedBuff?.castWhileOutOfRange === true ||
        lowHealthWardCastEndsAt(e) > 0 ||
        (lowHealthWard !== undefined && lowHealthWardReady(e, lowHealthWard));
      if (
        !slamCommitted &&
        !world.collision.canReach(e, target, e.performsAttack.attackRange)
      ) {
        if (castsOutsideAttackRange && (updateLowHealthWard(world, e, now) || updateCastedAttackSpeedBuff(world, e, now))) continue;
        // Target slipped out of range — drop any wind-up (the telegraph is broken).
        abortMonsterCast(world, e);
        setAttackTarget(world, e, null);
        continue;
      }
      setAttackTarget(world, e, target.isPlayer.id);
      if (updateLowHealthWard(world, e, now)) continue;
      if (updateCastedAttackSpeedBuff(world, e, now)) continue;

      // Charged (cast-time) attack state machine — telegraphed big hit (e.g. the
      // Ridge Archer's Power Shot). Takes priority over the normal attack while
      // active; pauses normal attacks/movement during the wind-up.
      const charged = effectiveChargedAttack(e);
      if (charged) {
        // A cast is pending while castEndsAt > 0 (set on begin, cleared on
        // fire/abort). Gate on that, NOT on "still winding up" (castEndsAt > now) —
        // otherwise the resolve tick (now >= castEndsAt) would fall through to
        // "begin" and re-arm forever, never firing.
        if (chargedCastEndsAt(e) > 0) {
          // Stun/freeze during the wind-up interrupts it (player counterplay).
          if (
            isMonsterStunned(world, e.isMonster.id) ||
            isMonsterFrozen(world, e.isMonster.id)
          ) {
            abortMonsterCast(world, e);
            continue;
          }
          if (now < chargedCastEndsAt(e)) continue; // still winding up — hold
          // Wind-up complete → resolve the shot and put it on cooldown. Read the
          // planted point BEFORE completeCharge clears it.
          const impact = chargeAoeImpactPoint(e);
          completeCharge(e, now, charged.cooldownMs);
          if (charged.aoe && impact) {
            resolveChargedSlam(world, e, charged, charged.aoe, impact, now);
            continue;
          }
          // The pounce caught the marked prey: consume the Scent-of-Blood mark so the
          // MARKED tell clears once the Maul resolves (it expires on its own if the
          // wind-up was interrupted instead).
          if (charged.marksTarget) {
            removeStatusEffect(target.tracksCombat, SUN_MARK_EFFECT_ID);
          }
          const outcome = runMonsterAttack(world, e, target, now, charged.multiplier);
          if (outcome === "hit" || outcome === "killed") {
            // DEVOUR — landing the bite feeds the caster. Deliberately gated on a
            // landed hit only: dodging it, killing the wind-up, or walking out of
            // reach all deny the heal, which is what makes the tell worth reading.
            const healPct = charged.healsSelfPct ?? 0;
            if (healPct > 0 && world.hasMonster(e.isMonster.id)) {
              e.hasHealth.hp = Math.min(
                e.hasHealth.maxHp,
                e.hasHealth.hp + Math.round(e.hasHealth.maxHp * healPct),
              );
            }
          }
          if (outcome === "hit") {
            applyChargedAttackKnockback(world, e, target, charged);
            applyChargedAttackRiders(world, e, target, charged);
          }
          world.pushEvent(e.hasPosition.nodeId, {
            kind: "monster-cast-end",
            monsterId: e.isMonster.id,
            fired: true,
            targetId: target.isPlayer.id,
            fx: charged.fx,
          });
          if (
            (outcome === "hit" || outcome === "killed") &&
            world.hasMonster(e.isMonster.id)
          ) {
            applyMonsterAttackSplash(
              world,
              e,
              target.hasPosition.current,
              target.isPlayer.id,
            );
          }
          if (outcome === "hit") {
            e.controlsMonster.kiteTimer = Math.floor(
              e.controlsMonster.kiteTimer / 2,
            );
            const t = world.getPlayerEntity(target.isPlayer.id);
            if (t) markEngaged(world, t, now);
          }
          continue;
        }
        // Not casting. ARM-THE-NEXT-ATTACK: the charge cooldown only arms the mob;
        // it begins the cast at the mob's next NORMAL attack opportunity (respecting
        // its attack rhythm), turning that attack into the Power Shot. So gate on
        // both the attack cooldown AND the charge being ready (and not mid-stun).
        const attackDue =
          now - e.performsAttack.lastAttackAt >= monsterAttackCooldown(e);
        const initialCd = charged.initialCooldownMs ?? charged.cooldownMs;
        const forcedByEngageSequence = engageSequenceSlamReady(e);
        // Initialize the ordinary charge session before the forced opener so
        // completeCharge's recurring cooldown is not overwritten next tick.
        const normallyReady = chargeReady(e, now, initialCd);
        if (
          (forcedByEngageSequence ||
            (attackDue && normallyReady && chargedAttackGateOpen(target, charged))) &&
          !isMonsterStunned(world, e.isMonster.id) &&
          !isMonsterFrozen(world, e.isMonster.id)
        ) {
          beginCharge(e, now, charged.castMs);
          if (charged.aoe) {
            // Plant the circle where the target stands RIGHT NOW and broadcast it.
            // Everything after this reads the planted point, never the target.
            const impactPoint = { ...target.hasPosition.current };
            plantChargeAoe(e, impactPoint);
            publishGroundZone(world, e.hasPosition.nodeId, {
              kind: "slam-telegraph",
              pos: impactPoint,
              radius: charged.aoe.radius,
              startedAtMs: now,
              resolvesAtMs: now + charged.castMs,
              ownerId: e.isMonster.id,
            });
          }
          applyChargedAttackMark(world, e, target, charged);
          if (charged.precastStunMs && canApplyPlayerDebuff(target)) {
            applyStun(
              target.tracksCombat,
              charged.precastStunMs,
              e.isMonster.id,
              harmfulStatusDurationMult(target),
            );
          }
          if (forcedByEngageSequence) completeEngageSequence(e);
          world.pushEvent(e.hasPosition.nodeId, {
            kind: "monster-cast-start",
            monsterId: e.isMonster.id,
            castMs: charged.castMs,
            label: charged.name,
            fx: charged.fx,
          });
          continue;
        }
      }

      // Frozen no longer blocks attacks (it's a severe slow, not full CC); the
      // lengthened attack cooldown applied in updateChillAndFreeze paces them.
      if (
        now - e.performsAttack.lastAttackAt >=
        monsterAttackCooldown(e)
      ) {
        // How many pipeline hits this BEAT delivers: an opening volley (first beat
        // of the session), a cadence volley (every Nth beat), or the flat
        // consecutiveHits. Called exactly once per beat - it advances counters.
        const hitCount = monsterVolleyHits(
          e,
          MONSTER_DATABASE.get(e.isMonster.monsterTypeId),
          now,
        );
        let outcome: MonsterAttackOutcome = "cancelled";
        const landingMultiplier = consumeEngageSequenceLandingAttack(e);
        for (let hit = 0; hit < hitCount; hit++) {
          if (!world.getPlayerEntity(target.isPlayer.id)) break;
          outcome = runMonsterAttack(world, e, target, now, hit === 0 ? landingMultiplier : 1);
          if ((outcome === "hit" || outcome === "killed") && world.hasMonster(e.isMonster.id)) {
            applyMonsterAttackSplash(
              world,
              e,
              target.hasPosition.current,
              target.isPlayer.id,
            );
          }
          if (outcome === "killed" || !world.hasMonster(e.isMonster.id)) break;
        }
        if (outcome === "hit") {
          // Landing a hit halves the accumulated kite ramp so the monster must re-earn speed.
          e.controlsMonster.kiteTimer = Math.floor(
            e.controlsMonster.kiteTimer / 2,
          );
          const t = world.getPlayerEntity(target.isPlayer.id);
          if (t) markEngaged(world, t, now);
        }
        if (outcome !== "cancelled") consumeMonsterAttackSpeedCharge(e);
      }
      continue;
    }

    // targetKind === 'minion'
    const minion = world.getMinionEntity(e.hasAggroTarget.targetId) ?? null;
    if (
      !minion ||
      minion.hasPosition.nodeId !== e.hasPosition.nodeId ||
      minion.hasHealth.hp <= 0
    ) {
      abortMonsterCast(world, e);
      setAggroTarget(world, e, null, now);
      setAttackTarget(world, e, null);
      continue;
    }
    if (updateMonsterAbilities(world, e, null, now)) continue;
    if (!world.collision.canReach(e, minion, e.performsAttack.attackRange)) {
      const castsOutsideAttackRange =
        MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.castedAttackSpeedBuff?.castWhileOutOfRange === true;
      if (castsOutsideAttackRange && updateCastedAttackSpeedBuff(world, e, now)) continue;
      abortMonsterCast(world, e);
      setAttackTarget(world, e, null);
      continue;
    }
    setAttackTarget(world, e, minion.isMinion.id);
    if (updateCastedAttackSpeedBuff(world, e, now)) continue;
    if (
      now - e.performsAttack.lastAttackAt >= monsterAttackCooldown(e)
    ) {
      const hitCount = monsterVolleyHits(
        e,
        MONSTER_DATABASE.get(e.isMonster.monsterTypeId),
        now,
      );
      for (let hit = 0; hit < hitCount && minion.hasHealth.hp > 0; hit++) {
        runMonsterAttackOnMinion(world, e, minion, now);
        applyMonsterAttackSplash(
          world,
          e,
          minion.hasPosition.current,
          minion.isMinion.id,
        );
      }
      consumeMonsterAttackSpeedCharge(e);
    }
  }

  // MONSTER OOC REGEN
  for (const e of world.monsterEntities) {
    if (e.hasHealth.hp >= e.hasHealth.maxHp) continue;
    const ai = e.controlsMonster;
    if (e.hasAggroTarget) continue;
    if (now - ai.lastAggroAt < GAME_CONFIG.MONSTER_REGEN_DELAY) continue;
    e.hasHealth.hp = Math.min(
      e.hasHealth.maxHp,
      e.hasHealth.hp +
        e.hasHealth.maxHp *
          (GAME_CONFIG.MONSTER_REGEN_RATE / 100) *
          (dt / 1000),
    );
  }
}
