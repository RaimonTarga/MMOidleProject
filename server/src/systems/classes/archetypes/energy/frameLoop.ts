/**
 * Spirit frame loops — the loop is WHAT THE DISCHARGE DOES.
 *
 * Progression rework Phase 3; authored input `docs/briefs/frame-loops-2026-10-01.md`
 * §1, design authority `design_docs/progression-rework-design.md` §10.
 *
 *   Spark (light)      CHAIN       the discharge arcs to the nearest bodies.
 *   Wraith (balanced)  LOOP        the discharge opens a window where hits generate
 *                                  energy faster, so the loop feeds itself.
 *   Phantasm (heavy)   OVERCHARGE  the pool takes energy above the cap before the
 *                                  discharge arms; each hit's worth is a banked
 *                                  stack on the discharge multiplier. The discharge
 *                                  staggers.
 *
 * ONE MULTIPLIER PER HIT. Phantasm's bank and Wisp's folded chain share both fold
 * into `ctx.metadata.empoweredMultiplier`, never a second multiplier key.
 *
 * THE WISP SEAM. `energy-range-far` (Wisp) authors `energy.range-far-single-target`
 * on a branch this file cannot see (W1-C). The key is read DEFENSIVELY — by string,
 * through a widened view of the passive map — so this behaves correctly whether or
 * not the node is authored yet: when it reads 1, nothing chains and the share that
 * would have arced lands on the primary hit instead.
 */
import {
  getResource,
  setResource,
  type PassiveMap,
} from '@mmo-idle/shared';
import { applyStatusEffect, getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { defineBuff, type BuffDescriptor } from '../../../combat/buffs/descriptor';
import { playerAoeTargets } from '../../../combat/damage/aoeDamage';
import { applyPlayerProcDamage } from '../../../combat/damage/procDamage';
import { applyStun } from '../../../combat/status/stun';
import { monsterIgnoresControl } from '../../../combat/status/controlImmunity';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';

/** Wraith's gain window. `frame.<root>.window`, per the Phase 3 HUD contract. */
export const ENERGY_FRAME_WINDOW_EFFECT = 'frame.energy.window';
/** Phantasm's bank, a resource on `TracksCombat` so the buff sync can read it. */
export const ENERGY_FRAME_OVERCHARGE_RESOURCE = 'frame.energy.overcharge';

/**
 * Wisp's "all of it on one target" flag, read by string.
 *
 * W1-C authors this on the `energy-range-far` node. Until that branch lands the key
 * is absent from the `PassiveKey` union, so a typed lookup would not compile and a
 * hard dependency would make the two tasks one. The agreement is on the KEY.
 */
const RANGE_FAR_SINGLE_TARGET_KEY = 'energy.range-far-single-target';

function discardsChain(passives: PassiveMap): boolean {
  const loose = passives as Record<string, number | undefined>;
  return (loose[RANGE_FAR_SINGLE_TARGET_KEY] ?? 0) === 1;
}

// ── Wraith: the gain window ──────────────────────────────────────────────────

/**
 * Multiplier on energy gained per hit right now.
 *
 * Read by `energyPrototype`'s afterHit gain, which is the only place energy accrues,
 * so the window cannot be double-counted.
 */
export function energyFrameGainMult(player: PlayerEntity): number {
  const window = getStatusEffect(player.tracksCombat, ENERGY_FRAME_WINDOW_EFFECT);
  if (!window || window.remainingMs <= 0) return 1;
  return Math.max(1, player.usesSkills.passives['energy.frame-gain-mult'] ?? 1);
}

function openGainWindow(player: PlayerEntity): void {
  const totalMs = Math.round(player.usesSkills.passives['energy.frame-gain-window-ms'] ?? 0);
  if (totalMs <= 0) return;
  applyStatusEffect(player.tracksCombat, {
    id:          ENERGY_FRAME_WINDOW_EFFECT,
    maxStacks:   1,
    remainingMs: totalMs,
    refreshable: true,
    sourceId:    player.isPlayer.id,
    data:        { totalMs },
  });
}

// ── Phantasm: the overcharge bank ────────────────────────────────────────────

/** Bank cap in stacks, 0 for every frame but Phantasm. */
export function energyOverchargeMax(player: PlayerEntity): number {
  return Math.max(0, Math.round(player.usesSkills.passives['energy.frame-overcharge-max'] ?? 0));
}

/**
 * Extra energy the pool takes ABOVE its cap before the discharge arms.
 *
 * One hit's worth per banked stack, so the bank is a count of hits the player can
 * see land rather than a raw energy figure.
 */
export function energyOverchargeCapacity(player: PlayerEntity, perHit: number): number {
  return energyOverchargeMax(player) * Math.max(1, perHit);
}

/** Stacks currently banked, derived from how far the pool is above its cap. */
export function energyOverchargeStacks(
  player: PlayerEntity,
  energy: number,
  energyMax: number,
  perHit: number,
): number {
  const max = energyOverchargeMax(player);
  if (max <= 0) return 0;
  const above = energy - energyMax;
  if (above <= 0) return 0;
  return Math.min(max, Math.floor(above / Math.max(1, perHit)));
}

/**
 * Mirror the bank onto `TracksCombat` and announce the glow.
 *
 * Called from the gain path on every change so the weapon glow grows with the bank
 * instead of appearing whole at the discharge.
 */
export function syncEnergyOvercharge(
  world: World,
  player: PlayerEntity,
  stacks: number,
): void {
  const previous = getResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE);
  if (previous === stacks) return;
  setResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE, stacks);
  world.pushEvent(player.hasPosition.nodeId, {
    kind:     'frame-charge',
    playerId: player.isPlayer.id,
    stacks,
    max:      energyOverchargeMax(player),
  });
}

// ── Spark: the chain ─────────────────────────────────────────────────────────

function chainVictims(
  world: World,
  player: PlayerEntity,
  primary: MonsterEntity,
  radius: number,
  count: number,
): MonsterEntity[] {
  const origin = primary.hasPosition.current;
  return playerAoeTargets(world, player, origin, radius, primary.isMonster.id)
    .filter((monster) => monster.hasHealth.hp > 0)
    .sort((a, b) => {
      const da = (a.hasPosition.current.x - origin.x) ** 2 + (a.hasPosition.current.y - origin.y) ** 2;
      const db = (b.hasPosition.current.x - origin.x) ** 2 + (b.hasPosition.current.y - origin.y) ** 2;
      return da - db;
    })
    .slice(0, count);
}

// ── Registration ─────────────────────────────────────────────────────────────

/**
 * Register the discharge loops.
 *
 * Called from `initEnergyArchetype` AFTER `registerEmpoweredMultiplier`, because
 * every one of these reads the discharge's resolved damage or folds onto its
 * multiplier, and both only exist once that listener has run.
 */
export function registerEnergyFrameLoop(): void {
  registerCombatListener('onHit', (ctx, world) => {
    // A `mechanic-proxy` hit (design §24.2) COUNTS AS the mechanic for what reads
    // it downstream, but it never walks the root's own loop (rule 3).
    if (isMechanicProxy(ctx)) return;
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['mechanicConsumed']) return;  // discharges only (not Overdrive crit styling)
    const player = ctx.attacker;
    if (!player.usesEnergy) return;
    const passives = player.usesSkills.passives;

    // ── Phantasm: spend the bank, then stagger ──────────────────────────────
    const banked = getResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE);
    const perStack = passives['energy.frame-overcharge-mult-per-stack'] ?? 0;
    if (banked > 0 && perStack > 0) {
      const mult = 1 + banked * perStack;
      ctx.damage = Math.floor(ctx.damage * mult);
      ctx.metadata['empoweredMultiplier'] =
        Number(ctx.metadata['empoweredMultiplier'] ?? 1) * mult;
    }
    if (banked !== 0) syncEnergyOvercharge(world, player, 0);

    const staggerMs = Math.round(passives['energy.frame-stagger-ms'] ?? 0);
    if (
      staggerMs > 0 &&
      ctx.defenderType === 'monster' &&
      // Every on-hit status applier early-returns here: a monster that evaded the
      // discharge does not eat its rider.
      !evadeBlocksDebuffs(ctx) &&
      !monsterIgnoresControl(ctx.defender)
    ) {
      applyStun(ctx.defender.tracksCombat, staggerMs, player.isPlayer.id);
    }

    // ── Wraith: open the gain window ────────────────────────────────────────
    openGainWindow(player);

    // ── Spark: arc to the nearest bodies ────────────────────────────────────
    const count = Math.max(0, Math.round(passives['energy.frame-chain-targets'] ?? 0));
    const share = passives['energy.frame-chain-share'] ?? 0;
    if (count <= 0 || share <= 0) return;

    if (discardsChain(passives)) {
      // Wisp: nothing arcs, so the whole arc budget lands on the primary instead —
      // folded into the ONE multiplier this hit is allowed.
      const mult = 1 + count * share;
      ctx.damage = Math.floor(ctx.damage * mult);
      ctx.metadata['empoweredMultiplier'] =
        Number(ctx.metadata['empoweredMultiplier'] ?? 1) * mult;
      return;
    }

    if (ctx.defenderType !== 'monster') return;
    const radius = passives['energy.frame-chain-radius'] ?? 0;
    if (radius <= 0) return;
    const arc = Math.max(1, Math.floor(ctx.damage * share));
    for (const victim of chainVictims(world, player, ctx.defender, radius, count)) {
      applyPlayerProcDamage(world, player, victim, arc, {
        tags:      ['energy-frame-chain'],
        empowered: true,
      });
    }
  });
}

/** Clear the window and the bank — used when the archetype is torn down. */
export function clearEnergyFrameState(player: PlayerEntity): void {
  removeStatusEffect(player.tracksCombat, ENERGY_FRAME_WINDOW_EFFECT);
  setResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE, 0);
}

export const ENERGY_FRAME_BUFFS = [
  defineBuff('energy-frame-surge', ({ player }) => {
    if (!player.usesEnergy) return null;
    const window = getStatusEffect(player.tracksCombat, ENERGY_FRAME_WINDOW_EFFECT);
    if (!window || window.remainingMs <= 0) return null;
    const totalMs = window.data['totalMs'] ?? window.remainingMs;
    const mult = player.usesSkills.passives['energy.frame-gain-mult'] ?? 1;
    return {
      id:          'energy-frame-surge',
      label:       'Surge',
      stacks:      1,
      durationPct: totalMs > 0 ? Math.round((window.remainingMs / totalMs) * 100) : 0,
      remainingMs: window.remainingMs,
      color:       '#88ddff',
      logDetail:   `+${Math.round((mult - 1) * 100)}% energy per hit`,
      values:      [{ label: 'Energy per hit', value: `+${Math.round((mult - 1) * 100)}%`, good: true }],
    };
  }, { category: 'energy', shape: 'circle' }),

  defineBuff('energy-frame-overcharge', ({ player }) => {
    if (!player.usesEnergy) return null;
    const max = energyOverchargeMax(player);
    if (max <= 0) return null;
    const stacks = getResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE);
    if (stacks <= 0) return null;
    const perStack = player.usesSkills.passives['energy.frame-overcharge-mult-per-stack'] ?? 0;
    const pct = Math.round(stacks * perStack * 100);
    return {
      id:          'energy-frame-overcharge',
      label:       'Over',
      stacks,
      // A bank reports its FILL here, like the cadence and cooldown banks: the
      // rhythm readout's frame ring draws it (design §24.6).
      durationPct: Math.min(100, (stacks / max) * 100),
      color:       '#aa88ff',
      logDetail:   `+${pct}% discharge damage banked`,
      values:      [
        { label: 'Discharge damage', value: `+${pct}%`, good: true },
        { label: 'Bank', value: `${stacks} / ${max}` },
      ],
    };
  }, { category: 'energy', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
