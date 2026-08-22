import type { World } from "../../../world/World";
import {
  ABILITY_GUARD_EFFECT_IDS,
  applyStatusEffect,
  GAME_CONFIG,
  MONSTER_DATABASE,
  TEST_ROOM_NODE_ID,
  distanceSq,
  resolveSummonerProfile,
} from "@mmo-idle/shared";
import type { AggroTargetKind, MonsterDefinition, Vec2 } from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../player/progression/rewards";
import { makeCombatContext, emitCombatEvent, type FormationAttackContribution } from "./combatPipeline";
import {
  monsterEmpoweredMultiplier,
  applyEnemySoftCap,
  applyEnemyShield,
  chargedCastEndsAt,
  chargeReady,
  beginCharge,
  completeCharge,
  cancelCharge,
  plantChargeAoe,
  isChargeAoePlanted,
  chargeAoeImpactPoint,
  monsterAttackCooldown,
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
  DAMAGE_TAKEN_PCT_KEY,
  platingAfterShred,
  playerOutgoingDamageMult,
  frostRampMaxStacks,
  frostRampAtkSlowPct,
  ambientRampScalingMult,
  CHAOTIC_HIT_COUNTER_KEY,
} from "@mmo-idle/shared";
import { applyMonsterAoe } from "../damage/aoeDamage";
import {
  publishGroundZone,
  publishToxicPool,
  publishFaultLineBurst,
  takeDueGroundZoneImpacts,
  clearGroundZonesByOwner,
} from "../../world/groundZones";
import { monsterDeathEmpowerMult } from "../damage/monsterDeathEffects";
import { applyPlayerKnockback } from "../damage/knockback";
import { canApplyPlayerDebuff } from "../status/debuffGuard";
import { evadeBlocksDebuffs } from "../../defense/mitigation/evasion";
import { isMonsterStunned, applyStun } from "../status/stun";
import { applyMonsterDotToPlayer } from '../status/monsterDot';
import { setAggroTarget, setAttackTarget } from "../ai/targeting";
import { markEngaged } from "../ai/engagement";
import {
  abortEngageSequence,
  completeEngageSequence,
  engageSequenceHoldsAttack,
  engageSequenceSlamReady,
} from '../ai/engageSequence';
import { mobilityTenacityDurationMult } from "../../world/mobility/mobilityBoots";
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

export type PlayerAttackOutcome = "cancelled" | "dodged" | "hit" | "killed";
export type MonsterAttackOutcome = "cancelled" | "hit" | "killed";

const PLAYER_KNOCKBACK_RESIST_CAP = 0.9;

/**
 * Tundra ICE-ARMOR shatter (fires when a player hit breaks the mob's frost barrier).
 * Cracks the shell for bonus self-damage (rewarding the burst that broke it) and sends
 * a freezing shockwave that briefly STUNS nearby non-boss enemies (crowd-control upside
 * that helps melee fighting in the pile — never touches the player). Telegraphed by a
 * frost-shatter pulse. No-op unless the mob defines `enemyShield.shatter`.
 */
function applyIceShatter(
  world: World,
  target: MonsterEntity,
  def: MonsterDefinition | undefined,
  _now: number,
): void {
  const shatter = def?.enemyShield?.shatter;
  if (!shatter) return;

  const bonus = Math.max(
    1,
    Math.round(target.hasHealth.maxHp * shatter.selfDamagePct),
  );
  target.hasHealth.hp -= bonus;

  const nodeId = target.hasPosition.nodeId;
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

  world.pushEvent(nodeId, {
    kind: "ecology-pulse",
    monsterId: target.isMonster.id,
    pos: { ...target.hasPosition.current },
    pulse: "frost-shatter",
  });
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

  target.hasHealth.hp -= ctx.damage;
  // Tundra ice-armor shatter: breaking the frost barrier cracks it for bonus damage
  // and freezes nearby enemies (applied before the death check below so the bonus can
  // finish the mob). No-op unless the mob defines enemyShield.shatter.
  if (enemyShieldResult.broke) {
    applyIceShatter(world, target, monsterDef, now);
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
): MonsterAttackOutcome {
  const ctx = makeCombatContext(monster, "monster", target, "player");

  if (isMonsterStunned(world, monster.isMonster.id)) {
    ctx.cancelled = true;
  }

  emitCombatEvent("beforeAttack", ctx, world);
  if (ctx.cancelled) return "cancelled";

  emitCombatEvent("onAttack", ctx, world);

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
  const ambientFedMult = ambientRampScalingMult(
    def?.scalesWithAmbientRamp,
    target.tracksCombat,
  );
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
      mark.durationMs * mobilityTenacityDurationMult(target),
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

  const slow = def?.slowEffect;
  if (slow && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    // Mobility-boot tenacity (Swamp + Graveyard stacks) shortens the CC duration.
    const slowMs = Math.round(
      slow.durationMs * mobilityTenacityDurationMult(target),
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
      antiheal.durationMs * mobilityTenacityDurationMult(target),
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
      vulnerability.durationMs * mobilityTenacityDurationMult(target),
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
  const platingShred = def?.appliesPlatingShred;
  if (platingShred && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    const corrosion = applyStatusEffect(target.tracksCombat, {
      id: PLATING_SHRED_EFFECT_ID,
      maxStacks: platingShred.maxStacks,
      remainingMs: -1,
      refreshable: false,
      sourceId: monster.isMonster.id,
      data: { platingPerStack: platingShred.platingPerStack },
    });
    const poison = platingShred.thresholdPoison;
    if (
      target.hasHealth.hp > 0 &&
      poison?.atStacks.includes(corrosion.stacks)
    ) {
      applyMonsterDotToPlayer(world, monster, target, poison);
    }
  }

  const rampDebuff = def?.rampDebuff;
  if (rampDebuff && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    const durMs = Math.round(
      rampDebuff.stackDurationMs * mobilityTenacityDurationMult(target),
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
 * target lost, out of range, can't-attack) so a cast never lingers silently.
 */
function abortMonsterCast(world: World, monster: MonsterEntity): void {
  if (chargedCastEndsAt(monster) <= 0) return; // no pending cast
  cancelCharge(monster);
  // A telegraph must never outlive the cast that drew it — an abandoned circle
  // would promise an impact that is no longer coming.
  clearGroundZonesByOwner(world, monster.hasPosition.nodeId, monster.isMonster.id);
  world.pushEvent(monster.hasPosition.nodeId, {
    kind: "monster-cast-end",
    monsterId: monster.isMonster.id,
    fired: false,
  });
}

function playerKnockbackResistPct(player: PlayerEntity): number {
  // Any active Guard slot can carry knockback resist; take the best rather than
  // stacking, so a second Guard never makes the player immovable outright.
  let best = 0;
  for (const effectId of ABILITY_GUARD_EFFECT_IDS) {
    const guard = getStatusEffect(player.tracksCombat, effectId);
    if (!guard || guard.remainingMs <= 0) continue;
    best = Math.max(best, guard.data["knockbackResistPct"] ?? 0);
  }
  return Math.max(0, Math.min(PLAYER_KNOCKBACK_RESIST_CAP, best));
}

/**
 * Marked-prey tell: when a `marksTarget` charge BEGINS, paint the shared sun-mark
 * "MARKED" debuff on the target for the readable wind-up (the Forest Scent-of-Blood
 * beat). Reuses the mark status/pulse so it shows in the player buff bar and is
 * cleansable. Edge-triggered pulse only on a fresh mark.
 */
function applyChargedAttackMark(
  world: World,
  monster: MonsterEntity,
  target: PlayerEntity,
  charged: NonNullable<MonsterDefinition["chargedAttack"]>,
): void {
  const mark = charged.marksTarget;
  if (!mark || !canApplyPlayerDebuff(target)) return;
  const markMs = Math.round(mark.durationMs * mobilityTenacityDurationMult(target));
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
  const baseDistance = charged.knockback?.distance ?? 0;
  if (baseDistance <= 0) return;
  const resist = playerKnockbackResistPct(target);
  const distance = Math.max(0, Math.round(baseDistance * (1 - resist)));
  if (distance <= 0) return;
  const end = applyPlayerKnockback(
    world,
    target,
    monster.hasPosition.current,
    distance,
  );
  if (!end) return;
  world.pushEvent(target.hasPosition.nodeId, {
    kind: "player-knockback",
    playerId: target.isPlayer.id,
    pos: end,
  });
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
): void {
  const damage = Math.max(
    1,
    Math.round(
      Math.max(0, monster.dealsDamage.attack - minion.mitigatesDamage.plating) *
        (1 - minion.mitigatesDamage.damageReduction),
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
    if (outcome === "hit") {
      if (charged.stunMs && canApplyPlayerDebuff(victim)) {
        applyStun(victim.tracksCombat, charged.stunMs, monster.isMonster.id);
      }
      applyChargedAttackKnockback(world, monster, victim, charged);
      const refreshed = world.getPlayerEntity(victim.isPlayer.id);
      if (refreshed) markEngaged(world, refreshed, now);
    }
    if (!world.hasMonster(monster.isMonster.id)) return; // reflected to death
  }

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

  world.pushEvent(nodeId, {
    kind: "monster-cast-end",
    monsterId: monster.isMonster.id,
    fired: true,
    fx: charged.fx,
  });
}

/** Resolve expiry detonations and linked fault lines through real monster hits. */
function resolveDelayedGroundZoneImpacts(world: World, now: number): void {
  for (const impact of takeDueGroundZoneImpacts(world, now)) {
    const ownerId = impact.ownerId;
    if (!ownerId) continue;
    const monster = world.getMonsterEntity(ownerId);
    if (!monster || monster.hasHealth.hp <= 0) continue;

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
      if (!world.hasMonster(ownerId)) break;
    }
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
    if (player.isCastingAbility) {
      player.performsAttack.lastAttackAt = now;
      continue;
    }

    const attackRange = player.performsAttack.attackRange;

    const target = world.collision.bestTargetInReach(
      player,
      world.monsterEntitiesInNode(player.hasPosition.nodeId),
      attackRange,
    );

    setAttackTarget(world, player, target?.isMonster.id ?? null);

    if (target) {
      // Tundra rampDebuff slows the player's attack speed (capped). Applied as a
      // multiplier on the cooldown gate so the base attackCooldown (stat-recalc
      // owned) is never mutated. The cap is the death-spiral guard.
      const frostRamp = getStatusEffect(
        player.tracksCombat,
        FROST_RAMP_EFFECT_ID,
      );
      const atkSlowMult = frostRamp ? 1 + frostRampAtkSlowPct(frostRamp) : 1;
      if (
        now - player.performsAttack.lastAttackAt >=
        player.performsAttack.attackCooldown * atkSlowMult
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
      // A planted ground slam is COMMITTED: the circle was drawn on the ground,
      // so the swing lands whether or not the target is still standing in it.
      // Every other charge still breaks when the target slips out of reach.
      const slamCommitted = chargedCastEndsAt(e) > 0 && isChargeAoePlanted(e);
      if (
        !slamCommitted &&
        !world.collision.canReach(e, target, e.performsAttack.attackRange)
      ) {
        // Target slipped out of range — drop any wind-up (the telegraph is broken).
        abortMonsterCast(world, e);
        setAttackTarget(world, e, null);
        continue;
      }
      setAttackTarget(world, e, target.isPlayer.id);

      // Charged (cast-time) attack state machine — telegraphed big hit (e.g. the
      // Ridge Archer's Power Shot). Takes priority over the normal attack while
      // active; pauses normal attacks/movement during the wind-up.
      const charged = MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.chargedAttack;
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
          if (outcome === "hit") {
            applyChargedAttackKnockback(world, e, target, charged);
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
          (forcedByEngageSequence || (attackDue && normallyReady)) &&
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
            applyStun(target.tracksCombat, charged.precastStunMs, e.isMonster.id);
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
        const hitCount = Math.max(
          1,
          Math.round(MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.consecutiveHits ?? 1),
        );
        let outcome: MonsterAttackOutcome = "cancelled";
        for (let hit = 0; hit < hitCount; hit++) {
          if (!world.getPlayerEntity(target.isPlayer.id)) break;
          outcome = runMonsterAttack(world, e, target, now);
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
      }
      continue;
    }

    // targetKind === 'minion'
    abortMonsterCast(world, e);
    const minion = world.getMinionEntity(e.hasAggroTarget.targetId) ?? null;
    if (
      !minion ||
      minion.hasPosition.nodeId !== e.hasPosition.nodeId ||
      minion.hasHealth.hp <= 0
    ) {
      setAggroTarget(world, e, null, now);
      setAttackTarget(world, e, null);
      continue;
    }
    if (!world.collision.canReach(e, minion, e.performsAttack.attackRange)) {
      setAttackTarget(world, e, null);
      continue;
    }
    setAttackTarget(world, e, minion.isMinion.id);
    if (
      now - e.performsAttack.lastAttackAt >= monsterAttackCooldown(e)
    ) {
      const hitCount = Math.max(
        1,
        Math.round(MONSTER_DATABASE.get(e.isMonster.monsterTypeId)?.consecutiveHits ?? 1),
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
