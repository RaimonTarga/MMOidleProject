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
 * `ctx.metadata.empoweredMultiplier`, so a Technique rider reading that number still
 * sees one honest figure and nothing writes a second multiplier key.
 *
 * WARMONGER (`reload-heavy-t3-b`, design §22.5). The frame owns the ramp; the path
 * no longer authors one of its own. It authors `reload.ramp-carry-pct` (half): a
 * reload keeps that share of the ramp instead of resetting it, and the barrel glow
 * holds through the reload at the carried value. The reload's toll on the ramp is
 * paid exactly ONCE per reload, whichever way the clip comes back
 * (`settleRampForReload`).
 *
 * TWO CEILINGS (design §22.12). The top damage and the glow measure against ONE
 * clip ({@link reloadFrameRampFill}), so a Warmonger's first clip is exactly the
 * Artillerist's; only the attack-speed climb carries past it, up to
 * {@link reloadFrameRampCap}. Without a carry the two are the same number.
 */
import type { PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { defineBuff, type BuffDescriptor } from '../../../combat/buffs/descriptor';
import { registerReloadLifecycleHook } from './reloadLifecycle';

/** Shortest cooldown the ramp may produce, mirroring the old Hair Trigger floor. */
const RAMP_COOLDOWN_FLOOR_MS = 200;

/**
 * Highest share of the ramp a reload may keep. The attack-speed ceiling is
 * `clip / (1 − carry)`, so a carry of 1 would make it endless; Warmonger authors 0.5.
 */
const MAX_RAMP_CARRY = 0.9;

/** True when this Slinger's frame owns the clip-long ramp (Artillerist). */
export function hasReloadFrameRamp(player: PlayerEntity): boolean {
  return (player.usesSkills.passives['reload.frame-ramp-pct-per-shot'] ?? 0) > 0;
}

/**
 * The share of the ramp a reload keeps: 0 resets it, as the Artillerist frame
 * alone does; Warmonger's `reload.ramp-carry-pct` keeps half (design §22.5).
 */
export function reloadRampCarry(player: PlayerEntity): number {
  const carry = player.usesSkills.passives['reload.ramp-carry-pct'] ?? 0;
  return Math.min(MAX_RAMP_CARRY, Math.max(0, carry));
}

/**
 * The ramp's TOP, in stacks: one clip. What the damage ramp, the buff tile's fill
 * and the barrel glow measure against (design §22.12).
 *
 * The brief's rule is "no early cap": the whole magazine is the climb and the
 * reload is the only thing that ends it. Derived from the live clip so a
 * `reload.max-ammo` node (Warmonger adds +20) lengthens the ramp with the clip
 * instead of leaving a dead tail.
 */
function reloadFrameRampTop(player: PlayerEntity): number {
  return Math.max(1, Math.round(player.usesReload?.ammoMax ?? 1));
}

/**
 * The ramp's fill, 0..1: `stacks` over one clip, held at full past it. The ONE
 * reading the top damage, the `reload-frame-ramp` tile and the barrel glow share,
 * so a carry never takes the damage or the glow past the Artillerist's own top.
 */
export function reloadFrameRampFill(
  player: PlayerEntity,
  stacks: number = player.usesReload?.clipSpeedStacks ?? 0,
): number {
  return Math.min(1, Math.max(0, stacks / reloadFrameRampTop(player)));
}

/**
 * Where the attack-speed climb stops, in stacks — the only part of the ramp a
 * carry takes past one clip (design §22.12).
 *
 * With no carry it IS the clip, the top. With Warmonger's carry a sustained
 * fight's attack speed climbs past one clip's worth, and the climb settles where a
 * reload's loss equals one clip's gain: `clip / (1 − carry)`, twice the clip at a
 * half carry. That ceiling is the cap — derived from the clip and the carry, no
 * new number — so nothing stops the climb before the carry does.
 */
export function reloadFrameRampCap(player: PlayerEntity): number {
  return Math.max(1, Math.round(reloadFrameRampTop(player) / (1 - reloadRampCarry(player))));
}

/**
 * Beat the barrel glow, when it moved. The glow is the ramp's fill — stacks over
 * one clip, held at full past it — so `stacks` never passes `max` on the wire, and
 * a shot that climbs attack speed past the top, or a reload that carries a full
 * clip's worth, draws no beat: `frame-charge` is a per-change event broadcast to
 * the whole node, never per hit. `stacks: 0` is the glow's spend; a carried value
 * eases it down instead.
 */
function beatRampGlow(world: World, player: PlayerEntity, before: number, after: number): void {
  const top = reloadFrameRampTop(player);
  const shown = Math.min(after, top);
  if (shown === Math.min(before, top)) return;
  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'frame-charge',
    playerId: player.isPlayer.id,
    stacks: shown,
    max: top,
  });
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

  // Artillerist: damage rides the ramp — ×1 on a fresh clip, ×top at the top of
  // it, one clip up. A carry past one clip holds it at ×top (design §22.12).
  const topMult = passives['reload.frame-ramp-top-mult'] ?? 0;
  if (topMult > 1 && hasReloadFrameRamp(player)) {
    return 1 + (topMult - 1) * reloadFrameRampFill(player);
  }

  return 1;
}

/**
 * A reload's toll on the ramp. Called ONCE per reload by the hooks below.
 *
 * Without a carry it resets the ramp (the Artillerist's reload is the cool-down);
 * with Warmonger's it keeps `floor(stacks × carry)`, so the barrel glow holds at the
 * carried value through the reload. Either way the base cadence is handed back while
 * the reload runs, and the next clip re-derives its speed from the live base on its
 * first shot, at the carried stacks plus that shot — never off a ramped number.
 */
function settleRampForReload(world: World, player: PlayerEntity): void {
  const reload = player.usesReload;
  if (!reload) return;
  const before = reload.clipSpeedStacks;
  const carried = Math.floor(before * reloadRampCarry(player));
  reload.clipSpeedStacks = carried;
  if (reload.clipBaseAttackCooldownMs > 0) {
    player.performsAttack.attackCooldown = reload.clipBaseAttackCooldownMs;
    markSliceDirty(world, player, 'performsAttack');
  }
  markSliceDirty(world, player, 'usesReload');
  // A reload that leaves the glow where it was (nothing on the ramp: a manual reload
  // on a fresh clip, a tactical reload out of combat; or a carry still a full clip's
  // worth) is not a change, and draws no beat.
  beatRampGlow(world, player, before, carried);
}

/**
 * Advance the ramp one shot and re-derive the cadence from the captured base. The
 * attack-speed climb runs to the carried ceiling ({@link reloadFrameRampCap}); the
 * glow follows it only up to one clip.
 */
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
  beatRampGlow(world, player, reload.clipSpeedStacks - 1, reload.clipSpeedStacks);
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
      // At the start, so the glow holds at the carried value WHILE the reload runs.
      if (hasReloadFrameRamp(player)) settleRampForReload(world, player);
    },
    onComplete(world, player, completion) {
      if (!player.usesReload) return;
      if (!hasReloadFrameRamp(player)) return;
      // A clip that came back without a reload ever starting (the Kill chain keystone
      // Refund, mid-clip) still pays the reload's toll — here, once. A reload whose
      // start hooks ran (the timer, R, the tactical rune, or Refund cutting a started
      // reload short) already paid it, and paying again would halve the carry twice.
      if (!completion.startHooksRan) settleRampForReload(world, player);
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
    const top = reloadFrameRampTop(player);
    const cap = reloadFrameRampCap(player);
    const fill = reloadFrameRampFill(player, stacks);
    const damagePct = Math.round((topMult - 1) * fill * 100);
    return {
      id: 'reload-frame-ramp',
      label: 'Ramp',
      stacks,
      // The ramp reports its FILL here, like a bank: the rhythm readout's frame
      // ring draws it (design §24.6). One clip is full, as for the glow (design
      // §22.12); a carry climbs only the attack speed past it.
      durationPct: fill * 100,
      color: '#ffbb55',
      logDetail: `+${Math.round(stacks * pct * 100)}% attack speed, +${damagePct}% damage`,
      values: [
        { label: 'Attack speed', value: `+${Math.round(stacks * pct * 100)}%`, good: true },
        { label: 'Damage', value: `+${damagePct}%`, good: true },
        { label: 'Rounds left in the ramp', value: String(Math.max(0, top - stacks)) },
        ...(cap > top
          ? [{ label: 'Rounds left in the attack-speed climb', value: String(Math.max(0, cap - stacks)) }]
          : []),
      ],
    };
  }, { category: 'neutral', shape: 'square' }),
] as const satisfies readonly BuffDescriptor[];
