import { pushDamageEvent } from '../../combat/damage/damageEvent';
import {
  addResource,
  getResource,
  setResource,
  isCooldownActive,
  setCooldown,
  setString,
  getCounter,
  setCounter,
  resetCounter,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { isInvulnerablePlayer } from "../../combat/invulnerability";
import { DEBT_POOL_KEY } from "../core/pools";
import { tryCheatDeath } from "./cheatDeath";
import {
  buildKillerFromMonster,
  readDebtKillerFromStrings,
} from "../../world/deathCause";
import { recordPlayerDamaged } from "../../../world/worldLogCombat";
import { actorFromSourceId } from "../../../world/worldLogActors";

const DEBT_CHEAT_USED = "debtCheatDeathUsed";

/** Re-arm debt cheat-death for the next engagement (called when leaving combat). */
export function resetDebtCheatDeath(player: PlayerEntity): void {
  resetCounter(player.tracksCombat, DEBT_CHEAT_USED);
}

/**
 * Register the hit-to-DoT listener on `onDamageTaken`.
 *
 * Takes `defense.hit-to-dot-pct` of surviving damage from ctx.damage and
 * queues it across the next four one-second payment ticks. DoT-tagged hits
 * (isDot) are skipped to prevent recursion. Resistance is snapshotted when
 * queued; the pool records the net amount still payable.
 */
export function registerHitToDot(): void {
  registerCombatListener("onDamageTaken", (ctx, _world) => {
    if (ctx.defenderType !== "player") return;
    if (ctx.damage <= 0) return;
    if (ctx.metadata["isDot"]) return;

    const player = ctx.defender;
    const conversionPct = Math.min(
      0.5,
      player.usesSkills.passives["defense.hit-to-dot-pct"] ?? 0,
    );
    if (conversionPct <= 0) return;

    const debtAmount = ctx.damage * conversionPct;
    ctx.damage -= debtAmount;
    const cs=player.tracksCombat;
    const payable=debtAmount*(1-Math.min(.9,Math.max(0,player.usesSkills.passives['defense.dot-resistance']??0)));
    if(getResource(cs,DEBT_POOL_KEY)<=0)setCooldown(cs,'debtTick',1000);
    for(let i=0;i<4;i++)addResource(cs,`defenseDebtPayment${i}`,payable/4);
    addResource(cs, DEBT_POOL_KEY, payable);

    if (ctx.attackerType === "monster") {
      const killer = buildKillerFromMonster(ctx.attacker);
      if (killer.monsterEntityId) {
        setString(player.tracksCombat, "debtSourceEntityId", killer.monsterEntityId);
      }
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
 * sub-1 damage spam at 10 Hz. Each fire pays the next bucket, preserving
 * fractional damage. New hits join the existing payment clock. If the drain
 * kills the player, normal death handling clears combat state.
 *
 * Returns true if the player died this tick (caller should `continue` past
 * the rest of the per-tick mechanics for this player).
 */
export function runDebtDrain(world: World, player: PlayerEntity): boolean {
  if (isInvulnerablePlayer(player)) return false;
  const cs = player.tracksCombat;
  const debtPool = getResource(cs, DEBT_POOL_KEY);
  if (debtPool <= 0) return false;

  // Debt cheat-death: once per combat, if the accumulated debt would exceed
  // current HP, forgive the whole pool. Reset on leaving combat.
  if (
    (player.usesSkills.passives["defense.debt-cheat-death"] ?? 0) > 0 &&
    getCounter(cs, DEBT_CHEAT_USED) === 0 &&
    debtPool >= player.hasHealth.hp
  ) {
    setResource(cs, DEBT_POOL_KEY, 0);
    setCounter(cs, DEBT_CHEAT_USED, 1);
    return false;
  }

  if (isCooldownActive(cs, "debtTick")) return false;

  setCooldown(cs, "debtTick", 1000);
  // Four upcoming one-second payment buckets retain fractional HP. Resistance
  // was snapshotted when queued; changing equipment cannot reprice old debt.
  const drainAmount = Math.min(debtPool,getResource(cs,'defenseDebtPayment0'));
  for(let i=0;i<3;i++)setResource(cs,`defenseDebtPayment${i}`,getResource(cs,`defenseDebtPayment${i+1}`));
  setResource(cs,'defenseDebtPayment3',0);
  const remaining=[0,1,2].reduce((sum,i)=>sum+getResource(cs,`defenseDebtPayment${i}`),0);
  setResource(cs, DEBT_POOL_KEY, remaining);
  const debtDamage = drainAmount;
  if(debtDamage<=0)return false;

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
  pushDamageEvent(world, player, debtDamage, { category: 'dot' });
  if (player.hasHealth.hp <= 0) {
    if (tryCheatDeath(world, player)) return false;
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
