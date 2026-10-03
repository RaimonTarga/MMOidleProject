/**
 * Apprentice frame loops — Venom vessel, Ember mage, Rime-Bound (progression
 * rework Phase 3; `docs/briefs/frame-loops-2026-10-01.md` §1, "Apprentice (dot) —
 * locked, by element").
 *
 * THE APPRENTICE IS THE EXCEPTION. The other five roots take a container — a
 * window or a bank — because they have a moment to hang one on. A DoT root has no
 * finisher: its mechanic is the stack bar itself, and a window opened by "the bar
 * filled" would pay the player for the thing they were already doing. So each
 * Apprentice frame gets a VERB instead, one per element, and each verb scales a
 * different stat:
 *
 *   Venom vessel (light)     OPENS HARD — the first hit on a target carrying no
 *                            poison lands the opener's worth of stacks at once.
 *                            Scales attack speed and target switching.
 *   Ember mage (balanced)    INTENSIFIES — hits into a target ALREADY at max burn
 *                            strike harder. Scales kills and max-stack uptime.
 *   Rime-Bound (heavy)       CHILLS — every frost stack slows the target's
 *                            movement and attacks a little. Scales duration on
 *                            one target.
 *
 * The chill deliberately reuses the existing `dot-chill` record and the
 * `dot.chill-*` keys at frame magnitudes, so Winter Warden (dot-heavy-t3-b)
 * DEEPENS the same chill instead of running a second one — its node now authors
 * the delta up to its 9 stacks / 5% per stack. While that path is taken the frame
 * stands down entirely and Winter Warden keeps owning the freeze: the brief is
 * explicit that the freeze is not duplicated.
 */

import {
  applyStatusEffect,
  getStatusEffect,
  getTotalStacks,
  hasStatusEffect,
} from '@mmo-idle/shared';
import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../combat/engine/empoweredAttacks';
import { evadeBlocksDebuffs } from '../../../defense/mitigation/evasion';
import { attachMarker } from '../../../../ecs/markerHelpers';
import { playerDebuffConfig } from '../../shared/applyPlayerDebuff';
import { applyFrameHitMultiplier } from '../../shared/frameLoop';
import { applyClassDotStack } from './dotPrototype';
import { CHILL_EFFECT, DOT_EFFECT_ID, FROZEN_EFFECT } from './t3/core/constants';
import type { MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';

/**
 * The target's stack state BEFORE this exchange, stashed on the exchange itself.
 *
 * Both the Venom opener ("no poison on it") and the Ember bonus ("already at max
 * burn") are statements about the target before the hit landed, and by the time
 * the frame listener runs the root has already applied this hit's stack. Reading
 * the state in `beforeAttack` is the only honest way to know it — inferring "it
 * must have been zero because it is one now" breaks the moment a path applies two.
 */
const STACKS_BEFORE = 'frameDotStacksBefore';
const MAX_STACKS_BEFORE = 'frameDotMaxBefore';

/**
 * Mirror the frost stacks into the chill record under the §18.1 max-wins rule.
 *
 * The chill MIRRORS the DoT rather than ticking up on its own: "every frost stack
 * slows it a little" is one chill stack per frost stack, which also means a hit
 * into an already-full bar does not deepen the slow. `applyStatusEffect` increments
 * by one, so a fresh record is created and then set — and an existing record (a T3
 * path's, a card's) is only ever raised, never lowered or shortened.
 */
function applyFrameChill(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  frostStacks: number,
): void {
  const passives = player.usesSkills.passives;
  const movePerStack = Math.max(0, passives['dot.chill-move-slow-per-stack'] ?? 0);
  const attackPerStack = Math.max(0, passives['dot.chill-attack-slow-per-stack'] ?? 0);
  if (movePerStack <= 0 && attackPerStack <= 0) return;

  const cap = Math.max(1, Math.round(passives['dot.chill-max-stacks'] ?? 1));
  const durationMs = Math.max(100, Math.round(passives['dot.chill-duration-ms'] ?? 4_000));
  const mirrored = Math.max(1, Math.min(cap, frostStacks));

  // Core/relic scaling first, so the comparison below is between resolved numbers.
  const scaled = playerDebuffConfig(player, {
    id:          CHILL_EFFECT,
    instanced:   false,
    maxStacks:   cap,
    refreshable: true,
    remainingMs: durationMs,
    sourceId:    player.isPlayer.id,
    data:        {
      moveSlowPerStack:   movePerStack,
      attackSlowPerStack: attackPerStack,
      totalMs:            durationMs,
    },
  }, { origin: 'mechanic' });

  const existing = getStatusEffect(monster.tracksCombat, CHILL_EFFECT);
  if (!existing) {
    const effect = applyStatusEffect(monster.tracksCombat, scaled);
    effect.stacks = mirrored;
  } else {
    const mine = scaled.data ?? {};
    existing.data['moveSlowPerStack'] =
      Math.max(existing.data['moveSlowPerStack'] ?? 0, mine['moveSlowPerStack'] ?? 0);
    existing.data['attackSlowPerStack'] =
      Math.max(existing.data['attackSlowPerStack'] ?? 0, mine['attackSlowPerStack'] ?? 0);
    existing.maxStacks = existing.maxStacks === 0
      ? 0
      : Math.max(existing.maxStacks, scaled.maxStacks ?? cap);
    const myMs = scaled.remainingMs ?? durationMs;
    existing.remainingMs = existing.remainingMs < 0 ? -1 : Math.max(existing.remainingMs, myMs);
    existing.data['totalMs'] = Math.max(existing.data['totalMs'] ?? 0, myMs);
    const ceiling = existing.maxStacks === 0 ? mirrored : existing.maxStacks;
    existing.stacks = Math.max(existing.stacks, Math.min(mirrored, ceiling));
    existing.sourceId = player.isPlayer.id; // latest attacker keeps kill credit
  }
  attachMarker(world, monster, 'hasChill');
}

export function initDotFrameLoop(): void {
  // The probe. `beforeAttack` always precedes `onHit`, so this needs no ordering
  // relative to the root's own listeners.
  registerCombatListener('beforeAttack', (ctx) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    if (!ctx.attacker.appliesDots) return;
    const effect = getStatusEffect(ctx.defender.tracksCombat, DOT_EFFECT_ID);
    ctx.metadata[STACKS_BEFORE] = getTotalStacks(ctx.defender.tracksCombat, DOT_EFFECT_ID);
    // The cap comes off the live effect rather than being re-resolved: it is the
    // number that application actually used, relics and path overrides included.
    ctx.metadata[MAX_STACKS_BEFORE] = effect?.maxStacks ?? 0;
  });

  registerCombatListener('onHit', (ctx, world) => {
    // A `mechanic-proxy` hit (design §24.2) COUNTS AS the mechanic for what reads
    // it downstream, but it never walks the root's own loop (rule 3).
    if (isMechanicProxy(ctx)) return;
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (!player.appliesDots) return;
    // Every on-hit applier early-returns on a blocking evade (CLAUDE.md).
    if (evadeBlocksDebuffs(ctx)) return;

    const monster = ctx.defender;
    const passives = player.usesSkills.passives;
    const stacksBefore = Number(ctx.metadata[STACKS_BEFORE] ?? 0);
    const maxBefore = Number(ctx.metadata[MAX_STACKS_BEFORE] ?? 0);

    // ── Venom vessel: open hard ──────────────────────────────────────────────
    const opener = Math.round(passives['dot.frame-opener-stacks'] ?? 0);
    if (opener > 1 && stacksBefore === 0) {
      // Top up to the opener through the ONE authoritative stack seam, so the
      // opener cannot drift into a parallel DoT and `mechanic-fired` still latches
      // once per exchange.
      for (let have = getTotalStacks(monster.tracksCombat, DOT_EFFECT_ID); have < opener; have++) {
        applyClassDotStack(world, player, monster, undefined, ctx);
      }
    }

    // ── Ember mage: intensify ────────────────────────────────────────────────
    const maxStackMult = passives['dot.frame-max-stack-mult'] ?? 0;
    if (
      maxStackMult > 1 &&
      maxBefore > 0 &&
      stacksBefore >= maxBefore &&
      !ctx.metadata['chaoticMiss']
    ) {
      applyFrameHitMultiplier(ctx, maxStackMult);
    }

    // ── Rime-Bound: chill ────────────────────────────────────────────────────
    // Winter Warden applies this chill itself (and freezes off it), so the frame
    // stands down rather than advancing the same record twice per hit.
    if ((passives['dot.freezing-cold'] ?? 0) <= 0) {
      if (!hasStatusEffect(monster.tracksCombat, FROZEN_EFFECT)) {
        const frost = getTotalStacks(monster.tracksCombat, DOT_EFFECT_ID);
        if (frost > 0) applyFrameChill(world, player, monster, frost);
      }
    }
  });
}
