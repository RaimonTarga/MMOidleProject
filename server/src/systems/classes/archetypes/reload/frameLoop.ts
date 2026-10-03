/**
 * Slinger frame loops — the payoff lives at a POSITION IN THE CLIP.
 *
 * Progression rework Phase 3; authored input `docs/briefs/frame-loops-2026-10-01.md`
 * §1, design authority `design_docs/progression-rework-design.md` §10.
 *
 *   Scout (light, 5)       START   the first N rounds of a fresh clip are empowered,
 *                                  so reload speed buys more openers.
 *   Marksman (balanced,10) END     the clip's last round is the big one.
 *   Artillerist (heavy,20) ACROSS  attack speed ramps with every shot, with NO cap
 *                                  below the clip length, and the damage multiplier
 *                                  rides the same ramp. The 3s reload is the reset.
 *
 * ONE MULTIPLIER PER HIT. The clip-position payoff folds itself into
 * `ctx.metadata.empoweredMultiplier` exactly as a lineage `damage-window` does, so a
 * Technique rider reading that number still sees one honest figure and nothing writes
 * a second multiplier key.
 *
 * WARMONGER. `reload-heavy-t3-b` authors a capped ramp of its own
 * (`reload.hair-trigger*`, max 15 stacks on a 40-round clip). The frame now owns the
 * ramp, so the FRAME WINS: the path's data stays authored, and its runtime handler in
 * `t3/pipeline/lightPaths.ts` defers while `reload.frame-ramp-pct-per-shot` is
 * present, which keeps exactly one writer of `clipSpeedStacks` per shot. The agreed
 * re-home — half the ramp carries through a reload — is a T3-review item and is NOT
 * designed here (see the Phase 3 progress note in `docs/progression-rework-plan.md`).
 */
import type { PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { defineBuff, type BuffDescriptor } from '../../../combat/buffs/descriptor';
import { registerReloadLifecycleHook } from './reloadLifecycle';

/** Shortest cooldown the ramp may produce, mirroring the Hair Trigger floor. */
const RAMP_COOLDOWN_FLOOR_MS = 200;

/** True when this Slinger's frame owns the clip-long ramp (Artillerist). */
export function hasReloadFrameRamp(player: PlayerEntity): boolean {
  return (player.usesSkills.passives['reload.frame-ramp-pct-per-shot'] ?? 0) > 0;
}

/**
 * The ramp's cap, in stacks.
 *
 * The brief's rule is "no early cap": the cap IS the clip length, so the whole
 * magazine is the climb and the reload is the only thing that ends it. Derived from
 * the live clip so a `reload.max-ammo` node (Warmonger adds +20) lengthens the ramp
 * with the clip instead of leaving a dead tail.
 */
export function reloadFrameRampCap(player: PlayerEntity): number {
  return Math.max(1, Math.round(player.usesReload?.ammoMax ?? 1));
}

/**
 * Damage multiplier for the shot about to resolve, from where it sits in the clip.
 *
 * `clipIndex` is 1-based and comes from the ammo pipeline (`reloadClipIndex`), not
 * from re-deriving `ammoMax - ammo`: a Blunderbuss volley empties the clip in one
 * beat, where "which round is this" has no answer, and the pipeline simply does not
 * tag those shots.
 */
export function reloadFramePositionMult(
  player: PlayerEntity,
  clipIndex: number,
  clipSize: number,
): number {
  const passives = player.usesSkills.passives;

  const openerRounds = Math.round(passives['reload.frame-opener-rounds'] ?? 0);
  if (openerRounds > 0 && clipIndex <= openerRounds) {
    return Math.max(1, passives['reload.frame-opener-mult'] ?? 1);
  }

  const lastRoundMult = passives['reload.frame-last-round-mult'] ?? 0;
  if (lastRoundMult > 1 && clipIndex >= clipSize) return lastRoundMult;

  // Artillerist: damage rides the ramp — ×1 on a fresh clip, ×top at the top of it.
  const topMult = passives['reload.frame-ramp-top-mult'] ?? 0;
  if (topMult > 1 && hasReloadFrameRamp(player)) {
    const cap = reloadFrameRampCap(player);
    const fill = Math.min(1, Math.max(0, (player.usesReload?.clipSpeedStacks ?? 0) / cap));
    return 1 + (topMult - 1) * fill;
  }

  return 1;
}

/** Reset the ramp and hand the base cadence back. Shared by the reload hooks. */
function clearRamp(world: World, player: PlayerEntity): void {
  const reload = player.usesReload;
  if (!reload) return;
  // A reload with nothing on the ramp (a manual reload on a fresh clip, a tactical
  // reload out of combat) is not a change, and `frame-charge` is a per-change beat
  // broadcast to the whole node — it does not get to fire for a no-op.
  const hadRamp = reload.clipSpeedStacks > 0;
  reload.clipSpeedStacks = 0;
  if (reload.clipBaseAttackCooldownMs > 0) {
    player.performsAttack.attackCooldown = reload.clipBaseAttackCooldownMs;
    markSliceDirty(world, player, 'performsAttack');
  }
  markSliceDirty(world, player, 'usesReload');
  if (!hadRamp) return;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'frame-charge',
    playerId: player.isPlayer.id,
    stacks: 0,
    max: reloadFrameRampCap(player),
  });
}

/** Advance the ramp one shot and re-derive the cadence from the captured base. */
function advanceRamp(world: World, player: PlayerEntity): void {
  const reload = player.usesReload;
  if (!reload) return;
  const cap = reloadFrameRampCap(player);
  if (reload.clipSpeedStacks >= cap) return;

  if (reload.clipBaseAttackCooldownMs === 0) {
    reload.clipBaseAttackCooldownMs = player.performsAttack.attackCooldown;
  }
  reload.clipSpeedStacks++;

  const pct = player.usesSkills.passives['reload.frame-ramp-pct-per-shot'] ?? 0;
  player.performsAttack.attackCooldown = Math.max(
    RAMP_COOLDOWN_FLOOR_MS,
    Math.round(reload.clipBaseAttackCooldownMs / (1 + reload.clipSpeedStacks * pct)),
  );
  markSliceDirty(world, player, 'usesReload');
  markSliceDirty(world, player, 'performsAttack');
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'frame-charge',
    playerId: player.isPlayer.id,
    stacks: reload.clipSpeedStacks,
    max: cap,
  });
}

/**
 * Register the clip-position loop.
 *
 * Called from `initReloadArchetype` AFTER `registerEmpoweredMultiplier`, so by the
 * time this reads `empoweredMultiplier` the base empowered layer has already
 * resolved and the fold composes instead of being overwritten.
 */
export function registerReloadFrameLoop(): void {
  registerCombatListener('onHit', (ctx, world) => {
    // A `mechanic-proxy` hit (design §24.2) COUNTS AS the mechanic for what reads
    // it downstream, but it never walks the root's own loop (rule 3).
    if (isMechanicProxy(ctx)) return;
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    const reload = player.usesReload;
    if (!reload) return;

    const index = ctx.metadata['reloadClipIndex'];
    if (typeof index !== 'number' || index <= 0) return;
    const size = Math.max(
      1,
      Math.round(
        typeof ctx.metadata['reloadClipSize'] === 'number'
          ? (ctx.metadata['reloadClipSize'] as number)
          : reload.ammoMax,
      ),
    );

    const mult = reloadFramePositionMult(player, index, size);
    if (mult > 1) {
      ctx.damage = Math.floor(ctx.damage * mult);
      ctx.metadata['empoweredMultiplier'] =
        Number(ctx.metadata['empoweredMultiplier'] ?? 1) * mult;
    }

    // The ramp advances AFTER the shot it did not yet speed up, so the figure the
    // multiplier above read is the ramp the player had when they pulled.
    if (hasReloadFrameRamp(player)) advanceRamp(world, player);
  });

  registerReloadLifecycleHook({
    onStart(world, player) {
      if (hasReloadFrameRamp(player)) clearRamp(world, player);
    },
    onComplete(world, player) {
      if (!player.usesReload) return;
      if (!hasReloadFrameRamp(player)) return;
      // Drop the captured base so the next clip re-reads the live cadence (a recalc
      // or a stance change between clips must not be ramped off a stale number).
      player.usesReload.clipBaseAttackCooldownMs = 0;
      markSliceDirty(world, player, 'usesReload');
    },
  });
}

export const RELOAD_FRAME_BUFFS = [
  defineBuff('reload-frame-ramp', ({ player }) => {
    if (!hasReloadFrameRamp(player)) return null;
    const stacks = player.usesReload?.clipSpeedStacks ?? 0;
    if (stacks <= 0) return null;
    const passives = player.usesSkills.passives;
    const pct = passives['reload.frame-ramp-pct-per-shot'] ?? 0;
    const topMult = passives['reload.frame-ramp-top-mult'] ?? 1;
    const cap = reloadFrameRampCap(player);
    const fill = Math.min(1, stacks / cap);
    const damagePct = Math.round((topMult - 1) * fill * 100);
    return {
      id: 'reload-frame-ramp',
      label: 'Ramp',
      stacks,
      durationPct: -1,
      color: '#ffbb55',
      logDetail: `+${Math.round(stacks * pct * 100)}% attack speed, +${damagePct}% damage`,
      values: [
        { label: 'Attack speed', value: `+${Math.round(stacks * pct * 100)}%`, good: true },
        { label: 'Damage', value: `+${damagePct}%`, good: true },
        { label: 'Rounds left in the ramp', value: String(Math.max(0, cap - stacks)) },
      ],
    };
  }, { category: 'neutral', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
