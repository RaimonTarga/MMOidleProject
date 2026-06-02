import type { World } from "../../../world/World";
import {
  applyStatusEffect,
  GAME_CONFIG,
  MONSTER_DATABASE,
  TEST_ROOM_NODE_ID,
  distanceSq,
  hitboxGap,
  inAttackRange,
  posHitboxFromEntity,
} from "@mmo-idle/shared";
import type { AggroTargetKind, Vec2 } from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../player/progression/rewards";
import { makeCombatContext, emitCombatEvent } from "./combatPipeline";
import { getCounter, setCounter } from "@mmo-idle/shared";
import { getAntiHealMult } from "../../defense";
import { applyPlayerAoe } from "../damage/aoeDamage";
import { isMonsterFrozen } from "../../classes/archetypes/dot/t3";
import { canApplyPlayerDebuff } from "../../classes/archetypes/summoner/t3/core/debuffGuard";
import { evadeBlocksDebuffs } from "../../defense/mitigation/evasion";
import { isMonsterStunned } from "../status/stun";
import { setAggroTarget, setAttackTarget } from "../ai/targeting";
import { markEngaged } from "../ai/engagement";
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
import { effectivePlatingAfterShred } from "../damage/effectivePlating";

export type PlayerAttackOutcome = "cancelled" | "dodged" | "hit" | "killed";
export type MonsterAttackOutcome = "cancelled" | "hit" | "killed";

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
  },
): PlayerAttackOutcome {
  const ctx = makeCombatContext(player, "player", target, "monster");
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

  emitCombatEvent("beforeAttack", ctx, world);
  if (ctx.cancelled) return "cancelled";

  emitCombatEvent("onAttack", ctx, world);

  // Deterministic monster evasion (NO RNG): a fractional accumulator on the
  // monster sums a per-hit dodge rate of 1/evadeEvery; when it crosses 1.0 the
  // hit is dodged. The dodge reduces damage by `evadeMitigation` (default 0.5)
  // rather than fully negating it, and suppresses the player's debuffs/DoT unless
  // the player's attack pierces evade. A full-avoid (mitigation ≥ 1) short-circuits
  // to the legacy zero-damage path.
  const monsterDef = MONSTER_DATABASE.get(target.isMonster.monsterTypeId);
  const evadeEvery = monsterDef?.evadeEvery;
  let evaded = false;
  let evadeMult = 0;
  if (evadeEvery !== undefined && evadeEvery >= 5) {
    const acc = getCounter(target.tracksCombat, "evadeAcc") + 1 / evadeEvery;
    if (acc >= 1) {
      setCounter(target.tracksCombat, "evadeAcc", acc - 1);
      evaded = true;
      evadeMult = monsterDef?.evadeMitigation ?? GAME_CONFIG.EVADE_MITIGATION_BASE;
      if ((player.usesSkills.passives["shared.applies-through-evade"] ?? 0) <= 0) {
        ctx.metadata["evadeBlocksDebuffs"] = true;
      }
      ctx.metadata["evaded"] = true;
      world.pushEvent(player.hasPosition.nodeId, {
        kind: "monster-dodge",
        monsterId: target.isMonster.id,
        targetPos: { ...target.hasPosition.current },
      });
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
      // Full avoidance preserves the legacy "dodged" outcome (no damage, no debuffs).
      if (evadeMult >= 1) return "dodged";
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

  const minionDamageMult =
    opts.aggroSource.kind === "minion"
      ? (player.usesSkills.passives["summoner.minion-damage-mult"] ?? 1.0)
      : 1.0;
  ctx.damage = Math.max(
    1,
    Math.round(
      Math.max(
        0,
        player.dealsDamage.attack * minionDamageMult -
          effectivePlating * ctx.platingMult,
      ) *
        (1 - target.mitigatesDamage.damageReduction),
    ),
  );

  const damageMult = player.usesSkills.passives['shared.damage-mult'] ?? 0;
  if (damageMult > 0) ctx.damage = Math.round(ctx.damage * (1 + damageMult));

  emitCombatEvent("onHit", ctx, world);

  if (player.dealsDamage.onHitDamage > 0) {
    ctx.damage += player.dealsDamage.onHitDamage;
  }

  const isEmpowered = !!ctx.metadata["empoweredAttack"];
  const isExecution = isEmpowered && player.usesCooldown !== undefined;

  if (isEmpowered) {
    applyPlayerAoe(
      world,
      player,
      target.hasPosition.current,
      GAME_CONFIG.EMPOWERED_AOE_RADIUS,
      Math.round(player.dealsDamage.attack * GAME_CONFIG.EMPOWERED_AOE_MULT),
      target.isMonster.id,
    );
  }

  emitCombatEvent("onDamageTaken", ctx, world);

  // Partial monster dodge: scale the finalized damage by the avoided fraction
  // (full avoid already returned "dodged" above). Floored at 1 so a glancing hit
  // still registers.
  if (evaded) {
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - evadeMult)));
  }

  const gross = Math.round(player.dealsDamage.attack * minionDamageMult);
  const mitigation = buildPlatingDrBreakdown({
    grossDamage: gross,
    effectivePlating,
    platingMult: ctx.platingMult,
    damageReduction: target.mitigatesDamage.damageReduction,
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
      shieldAbsorbed: 0,
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

  target.hasHealth.hp -= ctx.damage;
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
  });

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
): MonsterAttackOutcome {
  const ctx = makeCombatContext(monster, "monster", target, "player");

  if (isMonsterStunned(world, monster.isMonster.id)) {
    ctx.cancelled = true;
  }

  emitCombatEvent("beforeAttack", ctx, world);
  if (ctx.cancelled) return "cancelled";

  emitCombatEvent("onAttack", ctx, world);

  ctx.damage = Math.max(
    1,
    Math.round(
      Math.max(0, monster.dealsDamage.attack - target.mitigatesDamage.plating) *
        (1 - target.mitigatesDamage.damageReduction),
    ),
  );

  emitCombatEvent("onHit", ctx, world);
  emitCombatEvent("onDamageTaken", ctx, world);

  const shieldAbsorbed = Number(ctx.metadata["shieldAbsorbed"] ?? 0);
  const mitigation = buildPlatingDrBreakdown({
    grossDamage: monster.dealsDamage.attack,
    effectivePlating: target.mitigatesDamage.plating,
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
      shieldAbsorbed,
      damageType: "direct",
      mitigation,
    },
    {
      visibility: "combat",
      relatedPlayerIds: [target.isPlayer.id],
      nodeId: target.hasPosition.nodeId,
    },
  );

  if (shieldAbsorbed > 0) {
    recordWorldLogEvent(
      world,
      {
        kind: "shield-absorb",
        nodeId: target.hasPosition.nodeId,
        target: actorFromPlayer(target),
        source: actorFromMonster(monster),
        amount: shieldAbsorbed,
      },
      {
        visibility: "combat",
        relatedPlayerIds: [target.isPlayer.id],
        nodeId: target.hasPosition.nodeId,
      },
    );
  }

  target.hasHealth.hp -= ctx.damage;
  monster.performsAttack.lastAttackAt = now;

  const slow = MONSTER_DATABASE.get(
    monster.isMonster.monsterTypeId,
  )?.slowEffect;
  if (slow && canApplyPlayerDebuff(target) && !evadeBlocksDebuffs(ctx)) {
    applyStatusEffect(target.tracksCombat, {
      id: "slow",
      maxStacks: 1,
      remainingMs: slow.durationMs,
      refreshable: true,
      sourceId: monster.isMonster.id,
      data: {
        speedMult: slow.speedMult,
        totalMs: slow.durationMs,
      },
    });
  }

  emitCombatEvent("afterHit", ctx, world);

  if (target.hasHealth.hp <= 0) {
    emitCombatEvent("onKill", ctx, world);
    world.killPlayer(target.isPlayer.id, {
      kind: "melee",
      killer: buildKillerFromMonster(monster),
      damage: ctx.damage,
    });
    return "killed";
  }
  return "hit";
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

export function updateCombat(world: World, dt: number, now: number) {
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

    let target = null;
    let bestGap = Infinity;
    const playerPH = posHitboxFromEntity(player);
    const attackRange = player.performsAttack.attackRange;

    for (const m of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      const monsterPH = posHitboxFromEntity(m);
      if (!inAttackRange(playerPH, monsterPH, attackRange)) continue;
      const gap = hitboxGap(playerPH, monsterPH);
      if (gap < bestGap) {
        bestGap = gap;
        target = m;
      }
    }

    setAttackTarget(world, player, target?.isMonster.id ?? null);

    if (target) {
      if (
        now - player.performsAttack.lastAttackAt >=
        player.performsAttack.attackCooldown
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

      const lastCombat = player.tracksEngagement;
      if (
        lastCombat === undefined ||
        now - lastCombat > GAME_CONFIG.COMBAT_REGEN_DELAY
      ) {
        const cs = player.tracksCombat;
        const rawRegen =
          player.hasHealth.maxHp *
          ((player.hasHealth.hpRegen ?? 0) / 100) *
          (dt / 1000);
        const healAmount = cs ? rawRegen * getAntiHealMult(cs) : rawRegen;
        player.hasHealth.hp = Math.min(
          player.hasHealth.maxHp,
          player.hasHealth.hp + healAmount,
        );
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
      setAttackTarget(world, e, null);
      continue;
    }
    if (e.hasAwareness.state !== "attacking") continue;

    if (e.hasAggroTarget.targetKind === "player") {
      const target = world.getPlayerEntity(e.hasAggroTarget.targetId) ?? null;
      if (!target || target.hasPosition.nodeId !== e.hasPosition.nodeId) {
        setAggroTarget(world, e, null, now);
        setAttackTarget(world, e, null);
        continue;
      }
      const monsterPH = posHitboxFromEntity(e);
      const targetPH = posHitboxFromEntity(target);
      if (!inAttackRange(monsterPH, targetPH, e.performsAttack.attackRange)) {
        setAttackTarget(world, e, null);
        continue;
      }
      setAttackTarget(world, e, target.isPlayer.id);
      if (
        now - e.performsAttack.lastAttackAt >=
          e.performsAttack.attackCooldown &&
        !isMonsterFrozen(world, e.isMonster.id)
      ) {
        const outcome = runMonsterAttack(world, e, target, now);
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
    const monsterPH = posHitboxFromEntity(e);
    const minionPH = posHitboxFromEntity(minion);
    if (!inAttackRange(monsterPH, minionPH, e.performsAttack.attackRange)) {
      setAttackTarget(world, e, null);
      continue;
    }
    setAttackTarget(world, e, minion.isMinion.id);
    if (
      now - e.performsAttack.lastAttackAt >= e.performsAttack.attackCooldown &&
      !isMonsterFrozen(world, e.isMonster.id)
    ) {
      runMonsterAttackOnMinion(world, e, minion, now);
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
