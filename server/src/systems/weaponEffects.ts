import { registerCombatListener } from './combatPipeline';
import {
  getCounter, addCounter,
  getFlag, setFlag,
  isCooldownActive, setCooldown, getCooldown,
  getString, setString,
} from './combatState';
import { applyStatusEffect, getStatusEffects, pruneStatusEffects } from './statusEffects';
import { grantMonsterRewards } from './rewards';
import type { World } from '../world/World';
import type { PlayerState } from '@mmo-idle/shared';

// ── Chaotic Axe ───────────────────────────────────────────────────────────────

const CHAOTIC_HIT_KEY = 'chaoticHits';
/** Every Nth hit is a miss (deals 0 damage). On-hit effects still fire. */
export const CHAOTIC_MISS_EVERY = 3;

// ── Sacred Cross ──────────────────────────────────────────────────────────────

export const SACRED_CD_MS       = 12_000; // ms between buff windows
export const SACRED_BUFF_MS     = 3_000;  // ms the buff lasts
export const SACRED_DMG_MULT    = 3;      // damage multiplier during buff
export const SACRED_APS_MULT    = 2;      // APS multiplier during buff (halves cooldown)

const SACRED_STARTED    = 'sacredStarted';
const SACRED_BUFF_FLAG  = 'sacredBuffActive';
const SACRED_CD_KEY     = 'sacredCd';
const SACRED_BUFF_TIMER = 'sacredBufTimer';
const SACRED_ORIG_CD    = 'sacredOrigCd';

// ── Ashbrand Blade ────────────────────────────────────────────────────────────

export const ASHBRAND_TICKS      = 4;     // number of burn ticks per stack
export const ASHBRAND_TICK_MS    = 1_000; // ms between burn ticks
export const ASHBRAND_TOTAL_MULT = 1.5;   // total burn damage = base × this

// ── Init — registers combat pipeline listeners ────────────────────────────────

export function initWeaponEffects(): void {
  // ── Chaotic Axe: every 3rd hit misses (0 damage, on-hit effects still fire) ─
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player || player.equipment.weapon !== 'chaotic-axe') return;

    const state = world.playerCombatState.get(player.id);
    if (!state) return;

    addCounter(state, CHAOTIC_HIT_KEY, 1);
    if (getCounter(state, CHAOTIC_HIT_KEY) % CHAOTIC_MISS_EVERY === 0) {
      ctx.damage = 0;
      ctx.metadata['chaoticMiss'] = true;
    }
  });

  // ── Sacred Cross: 3× damage multiplier during the buff window ────────────────
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player || player.equipment.weapon !== 'sacred-cross') return;

    const state = world.playerCombatState.get(player.id);
    if (!state || !getFlag(state, SACRED_BUFF_FLAG)) return;

    ctx.damage = Math.round(ctx.damage * SACRED_DMG_MULT);
    ctx.metadata['sacredBurst'] = true;
  });

  // ── Ashbrand Blade: convert direct hit into an independent fire burn on target ──
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player || player.equipment.weapon !== 'ashbrand-blade') return;

    const monsterState = world.monsterCombatState.get(ctx.defender.id);
    if (!monsterState) return;

    const damagePerTick = Math.max(1, Math.round(ctx.damage * ASHBRAND_TOTAL_MULT / ASHBRAND_TICKS));
    applyStatusEffect(monsterState, {
      id:        'ashbrand-burn',
      instanced: true,  // each hit is an independent burn running in parallel
      sourceId:  player.id,
      data: {
        damagePerTick,
        ticksLeft:     ASHBRAND_TICKS,
        nextTickIn:    ASHBRAND_TICK_MS,
        tickIntervalMs: ASHBRAND_TICK_MS,
      },
    });
    ctx.damage = 0; // direct damage suppressed; burn delivers the total

    console.log(`[Ashbrand] ${ctx.defender.id}: +burn ${damagePerTick}×${ASHBRAND_TICKS}`);
  });
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

export function updateWeaponEffects(world: World, dt: number): void {
  updateSacredCrossBuff(world);
  updateAshbrandBurns(world, dt);
}

// ── Sacred Cross buff timer ────────────────────────────────────────────────────

function updateSacredCrossBuff(world: World): void {
  for (const player of world.players.values()) {
    const state = world.playerCombatState.get(player.id);
    if (!state) continue;

    if (player.equipment.weapon !== 'sacred-cross') {
      // Weapon unequipped — clean up if buff was active (restore cooldown)
      if (getFlag(state, SACRED_BUFF_FLAG)) {
        const origCd = Number(getString(state, SACRED_ORIG_CD));
        if (origCd > 0) player.attackCooldown = origCd;
        setFlag(state, SACRED_BUFF_FLAG, false);
        setCooldown(state, SACRED_CD_KEY, 0);
        setCooldown(state, SACRED_BUFF_TIMER, 0);
      }
      if (getFlag(state, SACRED_STARTED)) setFlag(state, SACRED_STARTED, false);
      player.sacredBuffActive = false;
      player.sacredBuffPct    = 0;
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
        if (origCd > 0) player.attackCooldown = origCd;
        setFlag(state, SACRED_BUFF_FLAG, false);
        setCooldown(state, SACRED_CD_KEY, SACRED_CD_MS);
        console.log(`[Sacred] ${player.id}: buff ended, next in ${SACRED_CD_MS}ms`);
      }
    } else if (!isCooldownActive(state, SACRED_CD_KEY)) {
      // Cooldown expired — activate buff
      setString(state, SACRED_ORIG_CD, String(player.attackCooldown));
      player.attackCooldown = Math.max(200, Math.round(player.attackCooldown / SACRED_APS_MULT));
      setFlag(state, SACRED_BUFF_FLAG, true);
      setCooldown(state, SACRED_BUFF_TIMER, SACRED_BUFF_MS);
      console.log(`[Sacred] ${player.id}: BURST activated (cd=${player.attackCooldown}ms)`);
    }

    // Mirror to PlayerState for HUD display
    const isBuff = getFlag(state, SACRED_BUFF_FLAG);
    player.sacredBuffActive = isBuff;
    player.sacredBuffPct    = isBuff
      ? 100
      : Math.round(Math.max(0, 1 - getCooldown(state, SACRED_CD_KEY) / SACRED_CD_MS) * 100);
  }
}

// ── Ashbrand burn ticks ────────────────────────────────────────────────────────

function updateAshbrandBurns(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, state] of world.monsterCombatState) {
    const burns = getStatusEffects(state, 'ashbrand-burn');
    if (burns.length === 0) continue;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    let lastSourceId = '';

    for (const burn of burns) {
      burn.data.nextTickIn -= dt;
      if (burn.data.nextTickIn <= 0) {
        burn.data.nextTickIn = burn.data.tickIntervalMs;
        burn.data.ticksLeft--;
        monster.hp -= burn.data.damagePerTick;
        lastSourceId = burn.sourceId;
        console.log(
          `[Ashbrand] ${monsterId}: ${burn.data.damagePerTick} fire dmg, ${burn.data.ticksLeft} ticks left, hp=${Math.max(0, monster.hp)}`,
        );
      }
    }

    // Remove exhausted burn instances.
    pruneStatusEffects(state, e => e.id === 'ashbrand-burn' && e.data.ticksLeft <= 0);

    if (monster.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }
}
