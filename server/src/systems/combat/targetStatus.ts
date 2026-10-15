import {
  DAMAGE_TAKEN_PCT_KEY,
  isTargetHiddenStatusId,
  weaponDotProfileForEffect,
  type StatusEffect,
  type StatusValue,
  type TargetStatusView,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../ecs/entity';
import type { World } from '../../world/World';
import { dotOwedOnMonster } from './damage/dotInventory';

// Mirrors the full debuff list of each player's current displayed target onto the
// monster's networked hasStatus.targetStatus, so the HUD target frame can show
// what's afflicting the thing you're fighting. Scoped to targeted monsters only
// (bounded by player count) — not every monster every tick. Stale lists are
// cleared when a monster stops being anyone's target.
const lastTargeted = new Set<string>();

export function mirrorTargetStatus(world: World): void {
  const nowTargeted = new Set<string>();

  for (const player of world.livePlayers) {
    const targetId = player.hasAttackTarget?.targetId
      ?? player.summonsMinions?.formationTargetId;
    if (!targetId || nowTargeted.has(targetId)) continue;
    const monster = world.getMonsterEntity(targetId);
    if (!monster?.hasStatus || !monster.tracksCombat) continue;
    nowTargeted.add(targetId);
    monster.hasStatus.targetStatus = buildTargetStatus(world, monster);
  }

  // Clear lists left on monsters that are no longer anyone's target.
  for (const id of lastTargeted) {
    if (nowTargeted.has(id)) continue;
    const monster = world.getMonsterEntity(id);
    if (monster?.hasStatus?.targetStatus && monster.hasStatus.targetStatus.length > 0) {
      monster.hasStatus.targetStatus = [];
    }
  }

  lastTargeted.clear();
  for (const id of nowTargeted) lastTargeted.add(id);
}

function buildTargetStatus(world: World, monster: MonsterEntity): TargetStatusView[] {
  const out: TargetStatusView[] = [];
  for (const fx of monster.tracksCombat.statusEffects) {
    if (fx.remainingMs === 0) continue; // expired this tick
    // Bookkeeping, not an effect (the Effigy link record): no badge.
    if (isTargetHiddenStatusId(fx.id)) continue;
    const weaponDotProfile = weaponDotProfileForEffect(fx.id);
    // What a damage-over-time record still owes: the target frame's "owes"
    // number (design §26.2), from the same DoT inventory Detonate bills from.
    const owed = dotOwedOnMonster(world, monster, fx);
    out.push({
      id: fx.id,
      stacks: weaponDotProfile ? Math.max(0, Math.round(fx.data.pool ?? 0)) : fx.stacks,
      remainingMs: fx.remainingMs,
      totalMs: fx.data.totalMs ?? 0,
      values: statusValues(fx, weaponDotProfile !== undefined, owed),
      ...(owed !== undefined ? { owed } : {}),
    });
  }
  return out;
}

/**
 * The magnitudes a player can act on, read off effect data that is already
 * resolved on the server. Deliberately narrow: a target tile should say what the
 * debuff is worth, not dump every internal field, and this runs each tick for
 * every targeted monster. Effects not listed here still get a name, a stack count
 * and a clock from the fields above, plus authored explanatory copy on the client.
 */
function statusValues(fx: StatusEffect, weaponReservoir: boolean, owed?: number): StatusValue[] | undefined {
  const values: StatusValue[] = [];
  const perStack = fx.data.damagePerStack;
  if (weaponReservoir) {
    const pool = Math.max(0, Math.round(fx.data.pool ?? 0));
    values.push({ label: 'Stored damage', value: String(pool), good: true });
  } else if (owed !== undefined) {
    values.push({ label: 'Damage still owed', value: String(owed), good: true });
  }
  if (!weaponReservoir && perStack !== undefined && perStack > 0) {
    values.push({ label: 'Damage per stack', value: `${Math.round(perStack)} per tick`, good: true });
    values.push({ label: 'Damage per tick', value: String(Math.round(perStack * fx.stacks)), good: true });
  }

  const takenPct = fx.data[DAMAGE_TAKEN_PCT_KEY];
  if (takenPct !== undefined && takenPct !== 0) {
    const total = takenPct * Math.max(1, fx.stacks);
    values.push({ label: 'Damage taken', value: `+${Math.round(total * 100)}%`, good: true });
  }

  const damagePct = fx.data.damagePct;
  if (damagePct !== undefined && damagePct > 0) {
    values.push({
      label: 'Damage dealt',
      value: `+${Math.round(damagePct * Math.max(1, fx.stacks) * 100)}%`,
      good: false,
    });
  }

  const speedMult = fx.data.speedMult;
  if (speedMult !== undefined && speedMult < 1) {
    values.push({ label: 'Movement speed', value: `${Math.round(speedMult * 100)}%`, good: true });
  }

  const attackSpeedPct = fx.data.attackSpeedPct;
  if (attackSpeedPct !== undefined && attackSpeedPct > 0) {
    values.push({
      label: 'Attack speed',
      value: `+${Math.round(attackSpeedPct * 100)}%`,
      good: false,
    });
  }

  const attacksRemaining = fx.data.attacksRemaining;
  if (attacksRemaining !== undefined && attacksRemaining > 0) {
    values.push({
      label: 'Attacks remaining',
      value: String(Math.round(attacksRemaining)),
      good: false,
    });
  }

  const wardAmount = fx.data.wardAmount;
  if (wardAmount !== undefined) {
    values.push({
      label: 'Ward',
      value: String(Math.max(0, Math.round(wardAmount))),
      good: false,
    });
  }

  const directDamageMult = fx.data.directDamageMult;
  if (directDamageMult !== undefined && directDamageMult >= 0 && directDamageMult < 1) {
    values.push({
      label: 'Direct damage taken',
      value: `${Math.round(directDamageMult * 100)}%`,
      good: false,
    });
  }

  // Shred is authored per stack (`platingReduction`), the same field
  // `effectivePlatingAfterShred` multiplies by the stack count.
  const perStackShred = fx.data.platingReduction;
  if (perStackShred !== undefined && perStackShred > 0) {
    values.push({
      label: 'Plating stripped',
      value: `-${Math.round(perStackShred * Math.max(1, fx.stacks))}`,
      good: true,
    });
  }

  // Vulnerability is authored as an outright multiplier, not a percentage delta.
  const damageMultiplier = fx.data.damageMultiplier;
  if (damageMultiplier !== undefined && damageMultiplier > 1) {
    values.push({
      label: 'Damage taken',
      value: `+${Math.round((damageMultiplier - 1) * 100)}%`,
      good: true,
    });
  }

  return values.length > 0 ? values : undefined;
}
