import { registerCombatListener } from '../engine/combatPipeline';
import {
  applyStatusEffect, getStatusEffect,
  computeScaledDotDamage,
  getCounter, addCounter,
  getFlag, setFlag,
  isCooldownActive, setCooldown, getCooldown,
  getString, setString,
} from '@mmo-idle/shared';
import { grantMonsterRewards } from '../../player/progression/rewards';
import type { World } from '../../../world/World';
import { defineBuff, type BuffDescriptor } from '../buffs/descriptor';
import { attachMarker, detachMarkerIfNoEffect } from '../../../ecs/markerHelpers';

// ── Chaotic Axe ───────────────────────────────────────────────────────────────

const CHAOTIC_HIT_KEY = 'chaoticHits';
/** Every Nth hit is a miss (deals 0 damage). On-hit effects still fire. */
export const CHAOTIC_MISS_EVERY = 3;

// ── Sacred Cross ──────────────────────────────────────────────────────────────

export const SACRED_CD_MS       = 6_000; // ms between buff windows
export const SACRED_BUFF_MS     = 2_000;  // ms the buff lasts
export const SACRED_DMG_MULT    = 3;      // damage multiplier during buff
export const SACRED_APS_MULT    = 2;      // APS multiplier during buff (halves cooldown)

const SACRED_STARTED    = 'sacredStarted';
const SACRED_BUFF_FLAG  = 'sacredBuffActive';
const SACRED_READY      = 'sacredReady';
const SACRED_CD_KEY     = 'sacredCd';
const SACRED_BUFF_TIMER = 'sacredBufTimer';
const SACRED_ORIG_CD    = 'sacredOrigCd';

// ── Ashbrand Blade ────────────────────────────────────────────────────────────

export const ASHBRAND_CONV_PCT    = 0.30;  // fraction of hit converted to burn
export const ASHBRAND_MAX_STACKS  = 5;     // max burn stacks on a target
export const ASHBRAND_TICK_MS     = 1_000; // ms between burn ticks
export const ASHBRAND_DURATION_MS = 4_500; // stacks expire after this many ms without a hit

// ── Init — registers combat pipeline listeners ────────────────────────────────

export function initWeaponEffects(): void {
  // ── Chaotic Axe: every 3rd hit misses (0 damage, on-hit effects still fire) ─
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    if (player.holdsInventory.equipment.weapon !== 'chaotic-axe') return;

    const state = player.tracksCombat;

    addCounter(state, CHAOTIC_HIT_KEY, 1);
    if (getCounter(state, CHAOTIC_HIT_KEY) % CHAOTIC_MISS_EVERY === 0) {
      ctx.damage = 0;
      ctx.metadata['chaoticMiss'] = true;
    }
  });

  // ── Sacred Cross: 3× damage multiplier during the buff window ────────────────
  // Buff only procs (activates) when the player makes an attack, even if the
  // cooldown has already expired — prevents it from firing outside of combat.
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    if (player.holdsInventory.equipment.weapon !== 'sacred-cross') return;

    const state = player.tracksCombat;

    // If armed and ready, proc on this hit (triggering attack also gets the bonus).
    if (getFlag(state, SACRED_READY) && !getFlag(state, SACRED_BUFF_FLAG)) {
      setString(state, SACRED_ORIG_CD, String(player.performsAttack.attackCooldown));
      player.performsAttack.attackCooldown = Math.max(
        200,
        Math.round(player.performsAttack.attackCooldown / SACRED_APS_MULT),
      );
      setFlag(state, SACRED_BUFF_FLAG, true);
      setFlag(state, SACRED_READY, false);
      setCooldown(state, SACRED_BUFF_TIMER, SACRED_BUFF_MS);
      console.log(`[Sacred] ${player.isPlayer.id}: BURST activated (cd=${player.performsAttack.attackCooldown}ms)`);
    }

    if (!getFlag(state, SACRED_BUFF_FLAG)) return;

    ctx.damage = Math.round(ctx.damage * SACRED_DMG_MULT);
    ctx.metadata['sacredBurst'] = true;
  });

  // ── Ashbrand Blade: 30% of hit → stacking burn (max 5), 70% dealt directly ──
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    if (player.holdsInventory.equipment.weapon !== 'ashbrand-blade') return;

    const monsterState = ctx.defender.tracksCombat;

    const damagePerStack = Math.max(1, Math.round(player.dealsDamage.attack * ASHBRAND_CONV_PCT / ASHBRAND_MAX_STACKS));
    const effect = applyStatusEffect(monsterState, {
      id:          'ashbrand-burn',
      maxStacks:   ASHBRAND_MAX_STACKS,
      instanced:   false,
      sourceId:    player.isPlayer.id,
      remainingMs: ASHBRAND_DURATION_MS,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn:    ASHBRAND_TICK_MS,
        tickIntervalMs: ASHBRAND_TICK_MS,
      },
    });
    // Keep per-stack damage in sync with current attack so buffs apply immediately.
    effect.data.damagePerStack = damagePerStack;
    if (effect.stacks >= ASHBRAND_MAX_STACKS) {
      effect.data.nextTickIn = ASHBRAND_TICK_MS;
    }
    attachMarker(world, ctx.defender, 'hasAshbrandBurn');

    // Reduce direct hit by the converted fraction.
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - ASHBRAND_CONV_PCT)));
  });
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

export function updateWeaponEffects(world: World, dt: number): void {
  updateSacredCrossBuff(world);
  updateAshbrandBurns(world, dt);
}

// ── Sacred Cross buff timer ────────────────────────────────────────────────────

function updateSacredCrossBuff(world: World): void {
  for (const player of world.playerEntities) {
    const state = player.tracksCombat;

    if (player.holdsInventory.equipment.weapon !== 'sacred-cross') {
      // Weapon unequipped — clean up if buff was active (restore cooldown)
      if (getFlag(state, SACRED_BUFF_FLAG)) {
        const origCd = Number(getString(state, SACRED_ORIG_CD));
        if (origCd > 0) player.performsAttack.attackCooldown = origCd;
        setFlag(state, SACRED_BUFF_FLAG, false);
        setCooldown(state, SACRED_CD_KEY, 0);
        setCooldown(state, SACRED_BUFF_TIMER, 0);
      }
      setFlag(state, SACRED_READY, false);
      if (getFlag(state, SACRED_STARTED)) setFlag(state, SACRED_STARTED, false);
      player.showsSacred.sacredBuffActive = false;
      player.showsSacred.sacredBuffPct    = 0;
      continue;
    }

    const buffActive = getFlag(state, SACRED_BUFF_FLAG);

    if (!getFlag(state, SACRED_STARTED)) {
      // First tick with this weapon — arm the initial cooldown
      setFlag(state, SACRED_STARTED, true);
      setCooldown(state, SACRED_CD_KEY, SACRED_CD_MS);
    } else if (buffActive) {
      if (!isCooldownActive(state, SACRED_BUFF_TIMER)) {
        // Buff window just closed — restore cooldown, arm next cycle
        const origCd = Number(getString(state, SACRED_ORIG_CD));
        if (origCd > 0) player.performsAttack.attackCooldown = origCd;
        setFlag(state, SACRED_BUFF_FLAG, false);
        setCooldown(state, SACRED_CD_KEY, SACRED_CD_MS);
        console.log(`[Sacred] ${player.isPlayer.id}: buff ended, next in ${SACRED_CD_MS}ms`);
      }
    } else if (!isCooldownActive(state, SACRED_CD_KEY) && !getFlag(state, SACRED_READY)) {
      // Cooldown expired — arm the buff; it procs on the next attack hit.
      setFlag(state, SACRED_READY, true);
    }

    // Mirror to the entity slice for HUD projection.
    const isBuff = getFlag(state, SACRED_BUFF_FLAG);
    player.showsSacred.sacredBuffActive = isBuff;
    player.showsSacred.sacredBuffPct    = isBuff
      ? 100
      : Math.round(Math.max(0, 1 - getCooldown(state, SACRED_CD_KEY) / SACRED_CD_MS) * 100);
  }
}

// ── Ashbrand burn ticks ────────────────────────────────────────────────────────

function updateAshbrandBurns(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const e of world.ashbrandMonsters) {
    const monsterId = e.isMonster.id;
    const state     = e.tracksCombat;
    const effect = getStatusEffect(state, 'ashbrand-burn');
    if (!effect) {
      detachMarkerIfNoEffect(world, e, 'hasAshbrandBurn', state, 'ashbrand-burn');
      continue;
    }

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn <= 0) {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
      const damage = computeScaledDotDamage(effect);
      e.hasHealth.hp -= damage;

      if (e.hasHealth.hp <= 0) {
        toKill.push({ monsterId, sourceId: effect.sourceId });
      }
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

export const WEAPON_BUFFS = [
  defineBuff(
    'sacred-burst',
    ({ player }) => player.showsSacred.sacredBuffActive
      ? { id: 'sacred-burst', label: 'Holy', stacks: 1, durationPct: player.showsSacred.sacredBuffPct, color: '#ffdd44' }
      : null,
    { label: 'Holy', color: '#ffdd44' },
  ),
] as const satisfies readonly BuffDescriptor[];
