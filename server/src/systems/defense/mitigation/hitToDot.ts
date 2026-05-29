import {
  addResource,
  getResource,
  setResource,
  isCooldownActive,
  setCooldown,
  setString,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { DEBT_POOL_KEY, POOL_DRAIN_MS } from "../core/pools";
import {
  buildKillerFromMonster,
  readDebtKillerFromStrings,
} from "../../world/deathCause";
import { recordPlayerDamaged } from "../../../world/worldLogCombat";
import { actorFromSourceId } from "../../../world/worldLogActors";

/**
 * Register the hit-to-DoT listener on `onDamageTaken`.
 *
 * Takes `defense.hit-to-dot-pct` of surviving damage from ctx.damage and
 * queues it as a debt pool that drains over POOL_DRAIN_MS. DoT-tagged hits
 * (isDot) are skipped to prevent recursion. Deferred damage benefits from
 * `defense.dot-resistance` when it drains in `runDebtDrain`.
 */
export function registerHitToDot(): void {
  registerCombatListener("onDamageTaken", (ctx, _world) => {
    if (ctx.defenderType !== "player") return;
    if (ctx.damage <= 0) return;
    if (ctx.metadata["isDot"]) return;

    const player = ctx.defender;
    const conversionPct =
      player.usesSkills.passives["defense.hit-to-dot-pct"] ?? 0;
    if (conversionPct <= 0) return;

    const debtAmount = ctx.damage * conversionPct;
    ctx.damage -= debtAmount;
    addResource(player.tracksCombat, DEBT_POOL_KEY, debtAmount);

    if (ctx.attackerType === "monster") {
      const killer = buildKillerFromMonster(ctx.attacker);
      setString(player.tracksCombat, "debtSourceTypeId", killer.monsterTypeId);
      setString(player.tracksCombat, "debtSourceName", killer.monsterName);
      setString(player.tracksCombat, "debtSourceNodeId", killer.nodeId);
      setString(
        player.tracksCombat,
        "debtSourceIsBoss",
        killer.isBoss ? "1" : "0",
      );
    }
  });
}

/**
 * Per-tick debt drain. Fires once per second (debtTick cooldown) to avoid
 * sub-1 damage spam at 10 Hz. Each fire drains POOL_DRAIN_MS-relative
 * 1-second worth of the pool, applies `defense.dot-resistance`, and damages
 * the player. If the drain kills the player, the pool is cleared and the
 * player is respawned.
 *
 * Returns true if the player died this tick (caller should `continue` past
 * the rest of the per-tick mechanics for this player).
 */
export function runDebtDrain(world: World, player: PlayerEntity): boolean {
  const cs = player.tracksCombat;
  const debtPool = getResource(cs, DEBT_POOL_KEY);
  if (debtPool <= 0) return false;
  if (isCooldownActive(cs, "debtTick")) return false;

  setCooldown(cs, "debtTick", 1000);
  const drainAmount = debtPool * (1000 / POOL_DRAIN_MS);
  const remaining = debtPool - drainAmount;
  setResource(cs, DEBT_POOL_KEY, remaining < 0.5 ? 0 : remaining);

  const dotResist = Math.min(
    0.9,
    player.usesSkills.passives["defense.dot-resistance"] ?? 0,
  );
  const debtDamage = Math.round(drainAmount * (1 - dotResist));
  if (debtDamage < 1) return false;

  const nodeId = player.hasPosition.nodeId;
  const debtKiller = readDebtKillerFromStrings(cs.strings, nodeId);
  const source = debtKiller
    ? {
        id: debtKiller.monsterTypeId,
        name: debtKiller.monsterName,
        actorType: 'monster' as const,
      }
    : actorFromSourceId(world, 'debt', 'Debt');

  recordPlayerDamaged(
    world,
    player,
    source,
    debtDamage,
    0,
    'debt',
    { grossDamage: Math.round(drainAmount), platingBlocked: 0, drBlocked: Math.round(drainAmount - debtDamage), mitigatedTotal: Math.round(drainAmount - debtDamage), hpDamage: debtDamage, glancing: false },
  );

  player.hasHealth.hp = Math.max(0, player.hasHealth.hp - debtDamage);
  if (player.hasHealth.hp <= 0) {
    setResource(cs, DEBT_POOL_KEY, 0);
    world.killPlayer(player.isPlayer.id, {
      kind: "debt",
      damage: debtDamage,
      nodeId,
      killer: debtKiller,
    });
    return true;
  }
  return false;
}
