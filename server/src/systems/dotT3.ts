import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { getFlag, setFlag, getResource, setResource } from './combatState';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect,
  getTotalStacks, hasStatusEffect,
} from './statusEffects';
import { grantMonsterRewards } from './rewards';
import type { CombatState } from './combatState';
import type { World } from '../world/World';

// ── Shared constants (must match dotPrototype.ts) ─────────────────────────────
const DOT_EFFECT_ID = 'dot';
const DOT_TICK_MS   = 1_000;

// ── Effect IDs ────────────────────────────────────────────────────────────────
export const SMOLDER_EFFECT = 'dot-smolder';
export const CHILL_EFFECT   = 'dot-chill';
export const FROZEN_EFFECT  = 'dot-frozen';
export const CONF_EFFECT_ID = 'dot-conf';

// ── Light: Poison Explosion (dot-light-t3-a) ──────────────────────────────────
const PE_MAX_STACKS  = 20;
const PE_BURST_TICKS = 10; // burst = maxStacks × dmgPerStack × 10

// ── Light: Eternal Doom (dot-light-t3-b) ─────────────────────────────────────
export const ED_BASE_STACKS   = 8;
export const ED_DIMINISH_RATE = 0.5;
const ED_MAX_STACKS           = 50;

// ── Light: Invigorating Toxins (dot-light-t3-c) ───────────────────────────────
const IT_ATK_PER_STACK   = 2;    // flat damage bonus per stack on target
const IT_SPEED_PER_STACK = 0.02; // attackCooldown reduction per stack (2%)
const IT_SPEED_CAP       = 0.40; // maximum 40% reduction
const IT_BASE_CD_KEY     = 'it-base-cd';
const IT_INIT_FLAG       = 'it-initialized';

// ── Balanced: Fan the Flames (dot-balanced-t3-a) ─────────────────────────────
const FTF_STACKS_PER_HIT = 2;
const FTF_DMG_MULT       = 0.5;
const FTF_BONUS_MULT     = 3;   // bonus = maxStacks × basePerStack × FTF_BONUS_MULT

// ── Balanced: Smoldering Ember (dot-balanced-t3-b) ───────────────────────────
export const SE_VULN_PER_STACK = 0.03; // 3% increased damage taken per stack

// ── Balanced: Conflagration (dot-balanced-t3-c) ──────────────────────────────
export const CONF_TICKS  = 5;
const CONF_TICK_MS       = 500;
const CONF_DMG_FACTOR    = 2;

// ── Heavy: Permafrost (dot-heavy-t3-a) ───────────────────────────────────────
const PERM_MAX_STACKS = 1;
const PERM_START_DMG  = 3;
const PERM_RAMP       = 3;
const PERM_MAX_DMG    = 35;

// ── Heavy: Freezing Cold (dot-heavy-t3-b) ────────────────────────────────────
const CHILL_MAX        = 3;
const CHILL_SPEED_MULT = 0.12; // 12% speed reduction per chill stack
const CHILL_ATK_MULT   = 0.12; // 12% attackCooldown increase per chill stack
const CHILL_MS         = 6_000;
export const FREEZE_MS    = 2_000;
export const FREEZE_BONUS = 0.35;
const CHILL_FLAG          = 'dot-chill-applied';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasPassive(player: PlayerState, key: string): boolean {
  return (player.passives[key] ?? 0) > 0;
}

// ── Exported helpers for dotPrototype.ts and buffSync.ts ─────────────────────

/** Tick damage for Eternal Doom: full rate for first 8 stacks, 50% per stack beyond that. */
export function computeEternalDoomDamage(stacks: number, basePerStack: number): number {
  if (stacks <= ED_BASE_STACKS) return stacks * basePerStack;
  return Math.round(
    ED_BASE_STACKS * basePerStack +
    (stacks - ED_BASE_STACKS) * basePerStack * ED_DIMINISH_RATE,
  );
}

/** Damage multiplier from Smoldering Ember debuff (1.0 if not present). */
export function getSmolderMult(monsterState: CombatState): number {
  const s = getStatusEffect(monsterState, SMOLDER_EFFECT);
  return s ? (1 + s.stacks * SE_VULN_PER_STACK) : 1;
}

/** Damage multiplier from Frozen status (1.35 if frozen, 1.0 otherwise). */
export function getFrozenMult(monsterState: CombatState): number {
  return hasStatusEffect(monsterState, FROZEN_EFFECT) ? (1 + FREEZE_BONUS) : 1;
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register all DoT T3 combat pipeline listeners.
 * Called from initDotArchetype() BEFORE the base onHit listener so that
 * T3 mechanics can set ctx.metadata['dotHandled'] to suppress the base handler.
 */
export function initDotT3(): void {

  // ── 1. onHit — T3 stack application ───────────────────────────────────────
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'dot') return;
    if (ctx.defenderType !== 'monster') return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

    const monsterState = world.monsterCombatState.get(ctx.defender.id);
    if (!monsterState) {
      ctx.metadata['dotHandled'] = true;
      return;
    }

    const maxStacks   = Math.round(player.passives['dot.max-stacks']   ?? 6);
    const dmgPerStack = player.passives['dot.damage-per-stack']         ?? 3;

    // ── Invigorating Toxins: flat damage bonus (base prototype still applies the stack) ─
    if (hasPassive(player, 'dot.invigorating-toxins')) {
      const stacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      if (stacks > 0) ctx.damage += stacks * IT_ATK_PER_STACK;
      // No dotHandled — fall through to base prototype for stack application
    }

    // ── Poison Explosion ──────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.poison-explosion')) {
      applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks: PE_MAX_STACKS, instanced: false,
        sourceId: player.id,
        data: { damagePerStack: dmgPerStack, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS },
      });
      if (getTotalStacks(monsterState, DOT_EFFECT_ID) >= PE_MAX_STACKS) {
        const burst = PE_MAX_STACKS * dmgPerStack * PE_BURST_TICKS;
        ctx.damage += burst;
        removeStatusEffect(monsterState, DOT_EFFECT_ID);
        console.log(`[PoisonExplosion] ${player.id}: detonated → +${burst} burst`);
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Eternal Doom ──────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.eternal-doom')) {
      applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks: ED_MAX_STACKS, instanced: false,
        sourceId: player.id,
        data: {
          damagePerStack: dmgPerStack, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS,
          isEternalDoom: 1, edBaseStacks: ED_BASE_STACKS,
        },
      });
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Fan the Flames ────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.fan-the-flames')) {
      const ftfDmg       = dmgPerStack * FTF_DMG_MULT;
      const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      if (currentStacks >= maxStacks) {
        ctx.damage += Math.floor(maxStacks * dmgPerStack * FTF_BONUS_MULT);
        console.log(`[FanTheFlames] ${player.id}: at max — +${Math.floor(maxStacks * dmgPerStack * FTF_BONUS_MULT)} bonus`);
      } else {
        const toApply = Math.min(FTF_STACKS_PER_HIT, maxStacks - currentStacks);
        for (let i = 0; i < toApply; i++) {
          applyStatusEffect(monsterState, {
            id: DOT_EFFECT_ID, maxStacks, instanced: false,
            sourceId: player.id,
            data: { damagePerStack: ftfDmg, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS },
          });
        }
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Smoldering Ember ──────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.smoldering-ember')) {
      applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.id,
        data: { damagePerStack: dmgPerStack, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS },
      });
      const burnStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      let smolder = getStatusEffect(monsterState, SMOLDER_EFFECT);
      if (!smolder) {
        smolder = applyStatusEffect(monsterState, {
          id: SMOLDER_EFFECT, maxStacks: 0, instanced: false,
          remainingMs: -1, sourceId: player.id, data: {},
        });
      }
      smolder.stacks = burnStacks;
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Conflagration ─────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.conflagration')) {
      if (hasStatusEffect(monsterState, CONF_EFFECT_ID)) {
        ctx.metadata['dotHandled'] = true;
        return;
      }
      const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      if (currentStacks >= maxStacks) {
        removeStatusEffect(monsterState, DOT_EFFECT_ID);
        const confDmg = Math.round(maxStacks * dmgPerStack * CONF_DMG_FACTOR);
        applyStatusEffect(monsterState, {
          id: CONF_EFFECT_ID, instanced: false, maxStacks: 1,
          remainingMs: CONF_TICKS * CONF_TICK_MS + 1,
          sourceId: player.id,
          data: {
            damagePerTick:  confDmg,
            nextTickIn:     CONF_TICK_MS,
            tickIntervalMs: CONF_TICK_MS,
            ticksLeft:      CONF_TICKS,
          },
        });
        console.log(`[Conflagration] ${player.id}: triggered — ${confDmg}/tick × ${CONF_TICKS}`);
      } else {
        applyStatusEffect(monsterState, {
          id: DOT_EFFECT_ID, maxStacks, instanced: false,
          sourceId: player.id,
          data: { damagePerStack: dmgPerStack, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS },
        });
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Permafrost ────────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.permafrost')) {
      const existing = getStatusEffect(monsterState, DOT_EFFECT_ID);
      if (existing && existing.data.t3Perm) {
        existing.sourceId = player.id; // update kill credit
      } else if (!existing) {
        applyStatusEffect(monsterState, {
          id: DOT_EFFECT_ID, maxStacks: PERM_MAX_STACKS, instanced: false,
          remainingMs: -1, sourceId: player.id,
          data: {
            damagePerStack: PERM_START_DMG,
            nextTickIn:     DOT_TICK_MS,
            tickIntervalMs: DOT_TICK_MS,
            t3Perm:         1,
            currentDmg:     PERM_START_DMG,
          },
        });
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Freezing Cold ─────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.freezing-cold')) {
      applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.id,
        data: { damagePerStack: dmgPerStack, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS },
      });
      if (!hasStatusEffect(monsterState, FROZEN_EFFECT)) {
        applyStatusEffect(monsterState, {
          id: CHILL_EFFECT, maxStacks: CHILL_MAX, instanced: false,
          remainingMs: CHILL_MS, refreshable: true, sourceId: player.id, data: {},
        });
        if (getTotalStacks(monsterState, CHILL_EFFECT) >= CHILL_MAX) {
          const chillEffect = getStatusEffect(monsterState, CHILL_EFFECT);
          const sid = chillEffect?.sourceId ?? player.id;
          removeStatusEffect(monsterState, CHILL_EFFECT);
          applyStatusEffect(monsterState, {
            id: FROZEN_EFFECT, instanced: false, maxStacks: 1,
            remainingMs: FREEZE_MS, sourceId: sid, data: {},
          });
          console.log(`[FreezingCold] ${player.id}: ${ctx.defender.id} frozen!`);
        }
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Glacial Fracture ──────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.glacial-fracture')) {
      const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      if (currentStacks >= maxStacks) {
        const burst = maxStacks * maxStacks * dmgPerStack;
        ctx.damage += burst;
        removeStatusEffect(monsterState, DOT_EFFECT_ID);
        console.log(`[GlacialFract] ${player.id}: shatter ${currentStacks} stacks → +${burst}`);
      }
      applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.id,
        data: { damagePerStack: dmgPerStack, nextTickIn: DOT_TICK_MS, tickIntervalMs: DOT_TICK_MS },
      });
      ctx.metadata['dotHandled'] = true;
      return;
    }
  });

  // ── 2. onDamageTaken — Smoldering Ember vulnerability + Frozen bonus ─────────
  // Boosts direct-attack damage only; DoT tick bonuses are applied in updateDotArchetype.
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'monster') return;
    const monsterState = world.monsterCombatState.get(ctx.defender.id);
    if (!monsterState) return;

    const smolder = getStatusEffect(monsterState, SMOLDER_EFFECT);
    if (smolder) {
      ctx.damage = Math.round(ctx.damage * (1 + smolder.stacks * SE_VULN_PER_STACK));
    }
    if (hasStatusEffect(monsterState, FROZEN_EFFECT)) {
      ctx.damage = Math.round(ctx.damage * (1 + FREEZE_BONUS));
    }
  });
}

// ── Per-tick update ───────────────────────────────────────────────────────────

export function updateDotT3(world: World, dt: number): void {
  updatePermafrost(world, dt);
  updateConflagration(world, dt);
  updateChillAndFreeze(world);
  mirrorDotT3PlayerState(world);
}

// ── Permafrost: ramp damage tick ──────────────────────────────────────────────

function updatePermafrost(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, monsterState] of world.monsterCombatState) {
    const effect = getStatusEffect(monsterState, DOT_EFFECT_ID);
    if (!effect || !effect.data.t3Perm) continue;

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    effect.data.nextTickIn = DOT_TICK_MS;
    effect.data.currentDmg = Math.min(PERM_MAX_DMG, effect.data.currentDmg + PERM_RAMP);

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    const base   = Math.round(effect.data.currentDmg);
    const damage = Math.round(base * getSmolderMult(monsterState) * getFrozenMult(monsterState));
    monster.hp -= damage;
    console.log(`[Permafrost] ${monsterId}: ${damage} tick (ramp=${Math.round(effect.data.currentDmg)})`);

    if (monster.hp <= 0) toKill.push({ monsterId, sourceId: effect.sourceId });
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }
}

// ── Conflagration: fast-tick DoT ─────────────────────────────────────────────

function updateConflagration(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, monsterState] of world.monsterCombatState) {
    const effect = getStatusEffect(monsterState, CONF_EFFECT_ID);
    if (!effect) continue;

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    effect.data.nextTickIn = effect.data.tickIntervalMs;
    effect.data.ticksLeft--;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    monster.hp -= Math.round(effect.data.damagePerTick);
    console.log(`[Conflagration] ${monsterId}: ${effect.data.damagePerTick} tick (${effect.data.ticksLeft} left)`);

    if (monster.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId });
      continue;
    }
    if (effect.data.ticksLeft <= 0) removeStatusEffect(monsterState, CONF_EFFECT_ID);
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.monsters.get(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.monsters.delete(monsterId);
    world.monsterAI.delete(monsterId);
    world.monsterCombatState.delete(monsterId);
  }
}

// ── Chill and Freeze: stat modifications ─────────────────────────────────────

function updateChillAndFreeze(world: World): void {
  for (const [monsterId, monsterState] of world.monsterCombatState) {
    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    const chillEffect = getStatusEffect(monsterState, CHILL_EFFECT);
    const wasChilled  = getFlag(monsterState, CHILL_FLAG);

    if (chillEffect) {
      const def = MONSTER_DATABASE.get(monster.monsterTypeId);
      if (def) {
        monster.speed          = Math.max(10, Math.round(def.stats.speed * (1 - chillEffect.stacks * CHILL_SPEED_MULT)));
        monster.attackCooldown = Math.round(def.stats.attackCooldown * (1 + chillEffect.stacks * CHILL_ATK_MULT));
      }
      if (!wasChilled) setFlag(monsterState, CHILL_FLAG, true);
    } else if (wasChilled) {
      const def = MONSTER_DATABASE.get(monster.monsterTypeId);
      if (def) {
        monster.speed          = def.stats.speed;
        monster.attackCooldown = def.stats.attackCooldown;
      }
      setFlag(monsterState, CHILL_FLAG, false);
    }
  }
}

// ── Player-state mirroring for DoT T3 ────────────────────────────────────────

function mirrorDotT3PlayerState(world: World): void {
  for (const player of world.players.values()) {
    if (player.combatArchetype !== 'dot') continue;

    const targetState = player.attackTargetId
      ? world.monsterCombatState.get(player.attackTargetId)
      : undefined;

    // Freezing Cold: mirror chill stacks for HUD
    if (hasPassive(player, 'dot.freezing-cold')) {
      player.targetChillStacks = targetState ? getTotalStacks(targetState, CHILL_EFFECT) : 0;
    }

    // Invigorating Toxins: attack speed modifier
    if (hasPassive(player, 'dot.invigorating-toxins')) {
      const ps = world.playerCombatState.get(player.id);
      if (ps) {
        if (!getFlag(ps, IT_INIT_FLAG)) {
          setResource(ps, IT_BASE_CD_KEY, player.attackCooldown);
          setFlag(ps, IT_INIT_FLAG, true);
        }
        const baseCD = getResource(ps, IT_BASE_CD_KEY);
        const stacks = targetState ? getTotalStacks(targetState, DOT_EFFECT_ID) : 0;
        if (stacks > 0) {
          const reduction = Math.min(stacks * IT_SPEED_PER_STACK, IT_SPEED_CAP);
          player.attackCooldown = Math.max(200, Math.round(baseCD * (1 - reduction)));
        } else {
          player.attackCooldown = Math.round(baseCD);
        }
      }
    }
  }
}

// ── buffSync helpers ──────────────────────────────────────────────────────────

export function getTargetChillStacks(monsterState: CombatState): number {
  return getTotalStacks(monsterState, CHILL_EFFECT);
}

export function isTargetFrozen(monsterState: CombatState): boolean {
  return hasStatusEffect(monsterState, FROZEN_EFFECT);
}

export function getTargetFrozenPct(monsterState: CombatState): number {
  const e = getStatusEffect(monsterState, FROZEN_EFFECT);
  if (!e || e.remainingMs <= 0) return 0;
  return Math.round((1 - e.remainingMs / FREEZE_MS) * 100);
}

export function getConflagrationPct(monsterState: CombatState): number {
  const e = getStatusEffect(monsterState, CONF_EFFECT_ID);
  if (!e) return 0;
  return Math.round(((CONF_TICKS - e.data.ticksLeft) / CONF_TICKS) * 100);
}

export function isConflagrationActive(monsterState: CombatState): boolean {
  return hasStatusEffect(monsterState, CONF_EFFECT_ID);
}
