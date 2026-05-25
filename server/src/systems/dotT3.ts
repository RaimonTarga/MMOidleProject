import type { PlayerState } from '@mmo-idle/shared';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { getFlag, setFlag, getResource, setResource } from './combatState';
import {
  applyStatusEffect, removeStatusEffect, getStatusEffect,
  getTotalStacks, hasStatusEffect,
} from './statusEffects';
import { grantMonsterRewards } from './rewards';
import { applyKnockback } from './knockback';
import type { CombatState } from './combatState';
import type { World } from '../world/World';

// ── Shared constants (fallback — must match dotPrototype.ts) ──────────────────
const DOT_EFFECT_ID      = 'dot';
const DOT_TICK_MS        = 1_000;
// Fallback conversion fraction when no T1 path is unlocked (mirrors dotPrototype.ts).
const DOT_CONVERSION_PCT = 0.40;
// Default DoT duration — refreshed on every hit (mirrors dotPrototype.ts).
const DOT_DURATION_MS    = 4_500;

// ── Effect IDs ────────────────────────────────────────────────────────────────
export const SMOLDER_EFFECT = 'dot-smolder';
export const CHILL_EFFECT   = 'dot-chill';
export const FROZEN_EFFECT  = 'dot-frozen';
export const CONF_EFFECT_ID = 'dot-conf';

const STATUS_EFFECT_TO_CLIENT_ID: Array<[string, string]> = [
  [FROZEN_EFFECT, 'freeze'],
];
const GLACIAL_FRACTURE_EFFECT_ID = 'glacial-fracture';
const GLACIAL_FRACTURE_BUILDUP_FRAMES = 10;
const GLACIAL_FRACTURE_KNOCKBACK_PX = 120;
const GLACIAL_FRACTURE_KNOCKBACK_MS = 350;
const PERMAFROST_EFFECT_ID = 'permafrost';
const PERMAFROST_TIERS = 5;
const PERMAFROST_FRAMES_PER_TIER = 5;

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
const PERM_MAX_STACKS    = 1;
const PERM_MAX_HITS      = 35;   // hits to reach max damage (35% of ATK)
const PERM_PCT_PER_HIT   = 0.01; // +1% of ATK per hit

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

export function isMonsterFrozen(world: World, monsterId: string): boolean {
  const monsterState = world.monsterCombatState.get(monsterId);
  return monsterState ? hasStatusEffect(monsterState, FROZEN_EFFECT) : false;
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Register all DoT T3 combat pipeline listeners.
 * Called from initDotArchetype() BEFORE the base onHit listener so that
 * T3 mechanics can set ctx.metadata['dotHandled'] to suppress the base handler.
 *
 * The T3 handler always applies the conversion damage reduction (setting
 * ctx.metadata['dotConvApplied']) so the base handler can skip it when the
 * T3 handler already ran.
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

    const maxStacks      = Math.round(player.passives['dot.max-stacks']                     ?? 6);
    const convPct        = player.passives['dot.conversion-pct']                            ?? DOT_CONVERSION_PCT;
    const tickIntervalMs = Math.max(100, Math.round(player.passives['dot.tick-interval-ms'] ?? DOT_TICK_MS));
    const durationMs     = Math.round(player.passives['dot.duration-ms']                    ?? DOT_DURATION_MS);
    const dmgPerStack    = Math.max(1, Math.round(player.attack * convPct / maxStacks));

    // Redirect convPct of direct hit damage into DoT ticks.
    // Flag prevents the base handler from double-applying this reduction for
    // paths (like Invigorating Toxins) that fall through without setting dotHandled.
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    ctx.metadata['dotConvApplied'] = true;

    // ── Invigorating Toxins: flat damage bonus per poison stack ──────────────
    if (hasPassive(player, 'dot.invigorating-toxins')) {
      const stacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      if (stacks > 0) ctx.damage += stacks * IT_ATK_PER_STACK;
      // No dotHandled — fall through to base prototype for stack application
    }

    // ── Poison Explosion ──────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.poison-explosion')) {
      const pe = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks: PE_MAX_STACKS, instanced: false,
        sourceId: player.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
      });
      pe.data.damagePerStack = dmgPerStack;
      pe.data.tickIntervalMs = tickIntervalMs;
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
      const ed = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks: ED_MAX_STACKS, instanced: false,
        sourceId: player.id, remainingMs: durationMs, refreshable: true,
        data: {
          damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs,
          isEternalDoom: 1, edBaseStacks: ED_BASE_STACKS,
        },
      });
      ed.data.damagePerStack = dmgPerStack;
      ed.data.tickIntervalMs = tickIntervalMs;
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Fan the Flames ────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.fan-the-flames')) {
      const ftfDmg        = dmgPerStack * FTF_DMG_MULT;
      const currentStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      if (currentStacks >= maxStacks) {
        ctx.damage += Math.floor(maxStacks * dmgPerStack * FTF_BONUS_MULT);
        console.log(`[FanTheFlames] ${player.id}: at max — +${Math.floor(maxStacks * dmgPerStack * FTF_BONUS_MULT)} bonus`);
      } else {
        const toApply = Math.min(FTF_STACKS_PER_HIT, maxStacks - currentStacks);
        let ftfEff = applyStatusEffect(monsterState, {
          id: DOT_EFFECT_ID, maxStacks, instanced: false,
          sourceId: player.id, remainingMs: durationMs, refreshable: true,
          data: { damagePerStack: ftfDmg, nextTickIn: tickIntervalMs, tickIntervalMs },
        });
        for (let i = 1; i < toApply; i++) {
          ftfEff = applyStatusEffect(monsterState, {
            id: DOT_EFFECT_ID, maxStacks, instanced: false,
            sourceId: player.id, remainingMs: durationMs, refreshable: true,
            data: { damagePerStack: ftfDmg, nextTickIn: tickIntervalMs, tickIntervalMs },
          });
        }
        ftfEff.data.damagePerStack = ftfDmg;
        ftfEff.data.tickIntervalMs = tickIntervalMs;
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Smoldering Ember ──────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.smoldering-ember')) {
      const se = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
      });
      se.data.damagePerStack = dmgPerStack;
      se.data.tickIntervalMs = tickIntervalMs;

      const burnStacks = getTotalStacks(monsterState, DOT_EFFECT_ID);
      let smolder = getStatusEffect(monsterState, SMOLDER_EFFECT);
      if (!smolder) {
        smolder = applyStatusEffect(monsterState, {
          id: SMOLDER_EFFECT, maxStacks: 0, instanced: false,
          remainingMs: durationMs, sourceId: player.id, data: {},
        });
      }
      smolder.stacks = burnStacks;
      smolder.remainingMs = durationMs; // refresh alongside the dot
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
        const cf = applyStatusEffect(monsterState, {
          id: DOT_EFFECT_ID, maxStacks, instanced: false,
          sourceId: player.id, remainingMs: durationMs, refreshable: true,
          data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
        });
        cf.data.damagePerStack = dmgPerStack;
        cf.data.tickIntervalMs = tickIntervalMs;
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Permafrost ────────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.permafrost')) {
      const existing = getStatusEffect(monsterState, DOT_EFFECT_ID);
      if (existing && existing.data.t3Perm) {
        existing.sourceId = player.id; // update kill credit
        existing.data.hits = Math.min(PERM_MAX_HITS, (existing.data.hits ?? 0) + 1);
      } else if (!existing) {
        applyStatusEffect(monsterState, {
          id: DOT_EFFECT_ID, maxStacks: PERM_MAX_STACKS, instanced: false,
          remainingMs: -1, sourceId: player.id,
          data: {
            nextTickIn:     tickIntervalMs,
            tickIntervalMs,
            t3Perm:         1,
            hits:           1,
          },
        });
      }
      ctx.metadata['dotHandled'] = true;
      return;
    }

    // ── Freezing Cold ─────────────────────────────────────────────────────────
    if (hasPassive(player, 'dot.freezing-cold')) {
      const fc = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
      });
      fc.data.damagePerStack = dmgPerStack;
      fc.data.tickIntervalMs = tickIntervalMs;

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
        const effects = ctx.metadata['clientEffects'];
        ctx.metadata['clientEffects'] = Array.isArray(effects)
          ? [...effects, 'glacial-fracture']
          : ['glacial-fracture'];
        if (ctx.defenderType === 'monster') {
          applyKnockback(world, ctx.defender.id, player.x, player.y,
            GLACIAL_FRACTURE_KNOCKBACK_PX, GLACIAL_FRACTURE_KNOCKBACK_MS);
        }
        console.log(`[GlacialFract] ${player.id}: shatter ${currentStacks} stacks → +${burst} (knockback ${GLACIAL_FRACTURE_KNOCKBACK_PX}px over ${GLACIAL_FRACTURE_KNOCKBACK_MS}ms)`);
      }
      const gf = applyStatusEffect(monsterState, {
        id: DOT_EFFECT_ID, maxStacks, instanced: false,
        sourceId: player.id, remainingMs: durationMs, refreshable: true,
        data: { damagePerStack: dmgPerStack, nextTickIn: tickIntervalMs, tickIntervalMs },
      });
      gf.data.damagePerStack = dmgPerStack;
      gf.data.tickIntervalMs = tickIntervalMs;
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
  mirrorStatusEffectsToClient(world);
}

// ── Permafrost: ramp damage tick ──────────────────────────────────────────────

function updatePermafrost(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const [monsterId, monsterState] of world.monsterCombatState) {
    const effect = getStatusEffect(monsterState, DOT_EFFECT_ID);
    if (!effect || !effect.data.t3Perm) continue;

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    effect.data.nextTickIn = effect.data.tickIntervalMs ?? DOT_TICK_MS;

    const monster = world.monsters.get(monsterId);
    if (!monster) continue;

    const source = world.players.get(effect.sourceId);
    if (!source) continue;

    const hits   = Math.min(PERM_MAX_HITS, effect.data.hits ?? 0);
    const pct    = hits * PERM_PCT_PER_HIT;
    const base   = Math.max(1, Math.round(source.attack * pct));
    const damage = Math.round(base * getSmolderMult(monsterState) * getFrozenMult(monsterState));
    monster.hp -= damage;
    console.log(`[Permafrost] ${monsterId}: ${damage} tick (${hits}/${PERM_MAX_HITS} hits = ${Math.round(pct * 100)}% ATK)`);

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

function collectClientEffects(combatState: CombatState | undefined): Record<string, number> {
  const activeEffects: Record<string, number> = {};
  if (!combatState) return activeEffects;

  for (const [serverId, clientId] of STATUS_EFFECT_TO_CLIENT_ID) {
    const effect = getStatusEffect(combatState, serverId);
    if (effect && effect.remainingMs > 0) activeEffects[clientId] = effect.remainingMs;
  }

  return activeEffects;
}

function collectClientEffectFrames(world: World, combatState: CombatState | undefined): Record<string, number> {
  const activeEffectFrames: Record<string, number> = {};
  if (!combatState) return activeEffectFrames;

  const dot = getStatusEffect(combatState, DOT_EFFECT_ID);
  if (!dot || dot.stacks <= 0 || !dot.sourceId) return activeEffectFrames;

  const source = world.players.get(dot.sourceId);
  if (!source) return activeEffectFrames;

  // Glacial Fracture: stack-buildup overlay (static frame per stack count).
  if (hasPassive(source, 'dot.glacial-fracture')) {
    const maxStacks = Math.max(1, dot.maxStacks);
    const frame = Math.min(
      GLACIAL_FRACTURE_BUILDUP_FRAMES - 1,
      Math.max(0, Math.floor((dot.stacks / maxStacks) * GLACIAL_FRACTURE_BUILDUP_FRAMES) - 1),
    );
    activeEffectFrames[GLACIAL_FRACTURE_EFFECT_ID] = frame;
  }

  // Permafrost: hit-ramp tier picks which 5-frame band the client loops.
  // Tier = floor(hits / maxHits * 5), clamped to [0, 4]. Base frame = tier * 5.
  if (hasPassive(source, 'dot.permafrost') && dot.data.t3Perm) {
    const hits = Math.max(0, Math.min(PERM_MAX_HITS, dot.data.hits ?? 0));
    const tier = Math.max(
      0,
      Math.min(PERMAFROST_TIERS - 1, Math.floor((hits / PERM_MAX_HITS) * PERMAFROST_TIERS)),
    );
    activeEffectFrames[PERMAFROST_EFFECT_ID] = tier * PERMAFROST_FRAMES_PER_TIER;
  }

  return activeEffectFrames;
}

function mirrorStatusEffectsToClient(world: World): void {
  for (const monster of world.monsters.values()) {
    const monsterState = world.monsterCombatState.get(monster.id);
    monster.activeEffects = collectClientEffects(monsterState);
    monster.activeEffectFrames = collectClientEffectFrames(world, monsterState);
  }

  for (const player of world.players.values()) {
    const playerState = world.playerCombatState.get(player.id);
    player.activeEffects = collectClientEffects(playerState);
    player.activeEffectFrames = collectClientEffectFrames(world, playerState);
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
