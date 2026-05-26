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

// ── Chaotic family (Chaotic Axe / Frenzied Greataxe) ─────────────────────────

const CHAOTIC_HIT_KEY = 'chaoticHits';
/** Every Nth hit is a miss (deals 0 damage). On-hit effects still fire. */
export const CHAOTIC_MISS_EVERY   = 3;
export const FRENZIED_MISS_EVERY  = 4;

const CHAOTIC_FAMILY: Record<string, number> = {
  'chaotic-axe':       CHAOTIC_MISS_EVERY,
  'frenzied-greataxe': FRENZIED_MISS_EVERY,
};

// ── Sacred family (Sacred Cross / Consecrated Cross) ─────────────────────────

export const SACRED_CD_MS        = 6_000;
export const SACRED_BUFF_MS      = 2_000;
export const CONSECRATED_CD_MS   = 7_000;
export const CONSECRATED_BUFF_MS = 4_000;
export const SACRED_DMG_MULT     = 3;
export const SACRED_APS_MULT     = 2;

const SACRED_STARTED    = 'sacredStarted';
const SACRED_BUFF_FLAG  = 'sacredBuffActive';
const SACRED_READY      = 'sacredReady';
const SACRED_CD_KEY     = 'sacredCd';
const SACRED_BUFF_TIMER = 'sacredBufTimer';
const SACRED_ORIG_CD    = 'sacredOrigCd';

const SACRED_FAMILY: Record<string, { cdMs: number; buffMs: number }> = {
  'sacred-cross':      { cdMs: SACRED_CD_MS,       buffMs: SACRED_BUFF_MS       },
  'consecrated-cross': { cdMs: CONSECRATED_CD_MS,  buffMs: CONSECRATED_BUFF_MS  },
};

// ── Burn family (Ashbrand / Cinderfang / Frostmourne) ────────────────────────

export const ASHBRAND_CONV_PCT    = 0.30;
export const ASHBRAND_MAX_STACKS  = 5;
export const ASHBRAND_TICK_MS     = 1_000;
export const ASHBRAND_DURATION_MS = 4_500;

export const CINDERFANG_CONV_PCT   = 0.30;
export const CINDERFANG_MAX_STACKS = 7;

export const FROSTMOURNE_CONV_PCT   = 0.50;
export const FROSTMOURNE_MAX_STACKS = 3;

interface BurnEntry { weaponId: string; effectId: string; convPct: number; maxStacks: number }

const BURN_FAMILY: BurnEntry[] = [
  { weaponId: 'ashbrand-blade',   effectId: 'ashbrand-burn',    convPct: ASHBRAND_CONV_PCT,   maxStacks: ASHBRAND_MAX_STACKS   },
  { weaponId: 'cinderfang-saber', effectId: 'cinderfang-burn',  convPct: CINDERFANG_CONV_PCT, maxStacks: CINDERFANG_MAX_STACKS },
  { weaponId: 'frostmourne-mace', effectId: 'frostmourne-burn', convPct: FROSTMOURNE_CONV_PCT, maxStacks: FROSTMOURNE_MAX_STACKS },
];

const BURN_EFFECT_IDS = BURN_FAMILY.map(b => b.effectId);

// ── Init — registers combat pipeline listeners ────────────────────────────────

export function initWeaponEffects(): void {
  // ── Chaotic family: every Nth hit misses (0 damage, on-hit effects still fire) ─
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    const missEvery = player.holdsInventory.equipment.weapon
      ? CHAOTIC_FAMILY[player.holdsInventory.equipment.weapon]
      : undefined;
    if (!missEvery) return;

    const state = player.tracksCombat;

    addCounter(state, CHAOTIC_HIT_KEY, 1);
    if (getCounter(state, CHAOTIC_HIT_KEY) % missEvery === 0) {
      ctx.damage = 0;
      ctx.metadata['chaoticMiss'] = true;
    }
  });

  // ── Sacred family: 3× damage multiplier during the buff window ───────────────
  // Buff only procs (activates) when the player makes an attack, even if the
  // cooldown has already expired — prevents it from firing outside of combat.
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    const player = ctx.attacker;
    const timing = player.holdsInventory.equipment.weapon
      ? SACRED_FAMILY[player.holdsInventory.equipment.weapon]
      : undefined;
    if (!timing) return;

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
      setCooldown(state, SACRED_BUFF_TIMER, timing.buffMs);
      console.log(`[Sacred] ${player.isPlayer.id}: BURST activated (cd=${player.performsAttack.attackCooldown}ms)`);
    }

    if (!getFlag(state, SACRED_BUFF_FLAG)) return;

    ctx.damage = Math.round(ctx.damage * SACRED_DMG_MULT);
    ctx.metadata['sacredBurst'] = true;
  });

  // ── Burn family: convPct of hit → stacking burn, remainder dealt directly ────
  for (const { weaponId, effectId, convPct, maxStacks } of BURN_FAMILY) {
    registerCombatListener('onHit', (ctx, world) => {
      if (ctx.attackerType !== 'player') return;
      if (ctx.defenderType !== 'monster') return;
      const player = ctx.attacker;
      if (player.holdsInventory.equipment.weapon !== weaponId) return;

      const monsterState = ctx.defender.tracksCombat;

      const damagePerStack = Math.max(1, Math.round(player.dealsDamage.attack * convPct / maxStacks));
      const effect = applyStatusEffect(monsterState, {
        id:          effectId,
        maxStacks,
        instanced:   false,
        sourceId:    player.isPlayer.id,
        remainingMs: ASHBRAND_DURATION_MS,
        refreshable: true,
        data: {
          damagePerStack,
          nextTickIn:     ASHBRAND_TICK_MS,
          tickIntervalMs: ASHBRAND_TICK_MS,
        },
      });
      // Keep per-stack damage in sync with current attack so buffs apply immediately.
      effect.data.damagePerStack = damagePerStack;
      attachMarker(world, ctx.defender, 'hasAshbrandBurn');

      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    });
  }
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

export function updateWeaponEffects(world: World, dt: number): void {
  updateSacredCrossBuff(world);
  updateBurnEffects(world, dt);
}

// ── Sacred family buff timer ───────────────────────────────────────────────────

function updateSacredCrossBuff(world: World): void {
  for (const player of world.playerEntities) {
    const state = player.tracksCombat;

    const timing = player.holdsInventory.equipment.weapon
      ? SACRED_FAMILY[player.holdsInventory.equipment.weapon]
      : undefined;

    if (!timing) {
      // Weapon not in sacred family — clean up if buff was active (restore cooldown)
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
      setCooldown(state, SACRED_CD_KEY, timing.cdMs);
    } else if (buffActive) {
      if (!isCooldownActive(state, SACRED_BUFF_TIMER)) {
        // Buff window just closed — restore cooldown, arm next cycle
        const origCd = Number(getString(state, SACRED_ORIG_CD));
        if (origCd > 0) player.performsAttack.attackCooldown = origCd;
        setFlag(state, SACRED_BUFF_FLAG, false);
        setCooldown(state, SACRED_CD_KEY, timing.cdMs);
        console.log(`[Sacred] ${player.isPlayer.id}: buff ended, next in ${timing.cdMs}ms`);
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
      : Math.round(Math.max(0, 1 - getCooldown(state, SACRED_CD_KEY) / timing.cdMs) * 100);
  }
}

// ── Burn family tick (ashbrand / cinderfang / frostmourne) ────────────────────

function updateBurnEffects(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];
  const killed = new Set<string>();

  for (const e of world.ashbrandMonsters) {
    const monsterId = e.isMonster.id;
    const state     = e.tracksCombat;
    let hasBurn = false;
    for (const effectId of BURN_EFFECT_IDS) {
      const effect = getStatusEffect(state, effectId);
      if (!effect) continue;
      hasBurn = true;
      effect.data.nextTickIn -= dt;
      if (effect.data.nextTickIn <= 0) {
        effect.data.nextTickIn = effect.data.tickIntervalMs;
        const damage = computeScaledDotDamage(effect);
        e.hasHealth.hp -= damage;

        if (e.hasHealth.hp <= 0 && !killed.has(monsterId)) {
          killed.add(monsterId);
          toKill.push({ monsterId, sourceId: effect.sourceId });
        }
      }
    }
    if (!hasBurn) {
      for (const effectId of BURN_EFFECT_IDS) {
        detachMarkerIfNoEffect(world, e, 'hasAshbrandBurn', state, effectId);
      }
      continue;
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
    { label: 'Holy', color: '#ffdd44', category: 'weapon', shape: 'square' },
  ),
] as const satisfies readonly BuffDescriptor[];
