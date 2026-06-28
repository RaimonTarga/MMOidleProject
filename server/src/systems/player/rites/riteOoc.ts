/**
 * Rite out-of-combat readers (system rework Step 11).
 *
 * Rites are always-on OOC passives. Their `rite.*` mechanic keys fold into
 * `usesSkills.passives` during recalc (shared `stats.ts`); this module is where the
 * out-of-combat systems READ those keys at runtime. Three of the four worked rites
 * live here; Hunter's Instinct is an onKill combat listener (registered separately):
 *
 *   - Quickened Breath  → `oocRegenDelay(player)` shortens the post-combat regen
 *     delay. Read by the base OOC HP-regen gate in `combat/engine/combat.ts`.
 *   - Cleansing Breath  → `runRiteOoc` strips debuff/DoT stacks on a pulse while OOC.
 *   - Lingering Momentum → `runRiteOoc` slows the OOC decay of beneficial buffs.
 *   - Hunter's Instinct  → `initRiteListeners` adds an onKill movement-haste buff.
 */
import {
  GAME_CONFIG,
  isCooldownActive,
  setCooldown,
  getStatusEffect,
  removeStatusEffectStacks,
  applyStatusEffect,
  isHarmfulPlayerStatusEffect,
} from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { isPlayerInCombat } from "../../combat/ai/engagement";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { FOREST_HASTE } from "../../world/mobility/mobilityBoots";

const RITE_CLEANSE_CD_KEY = "rite-cleanse";

/**
 * Effective post-combat regen delay for this player, shortened by Quickened Breath
 * (`rite.ooc-regen-delay-reduction-pct`). Returns the global `COMBAT_REGEN_DELAY`
 * when no rite reduction is present. Clamped so regen can never resume mid-fight.
 */
export function oocRegenDelay(player: PlayerEntity): number {
  const reduction = player.usesSkills.passives["rite.ooc-regen-delay-reduction-pct"] ?? 0;
  const clamped = Math.min(0.95, Math.max(0, reduction));
  return GAME_CONFIG.COMBAT_REGEN_DELAY * (1 - clamped);
}

/**
 * Per-tick OOC rite behaviors. Runs from `updateDefensiveSystems` ONLY while the
 * player is out of combat. No-op when no rite key is present.
 */
export function runRiteOoc(world: World, player: PlayerEntity, dt: number, now: number): void {
  if (isPlayerInCombat(player, now)) return;
  const cs = player.tracksCombat;
  const p = player.usesSkills.passives;

  // Cleansing Breath: pulse-strip debuff/DoT stacks while out of combat.
  const cleanseStacks = Math.round(p["rite.ooc-cleanse-stacks"] ?? 0);
  const cleanseInterval = p["rite.ooc-cleanse-interval-ms"] ?? 0;
  if (cleanseStacks > 0 && cleanseInterval > 0 && !isCooldownActive(cs, RITE_CLEANSE_CD_KEY)) {
    const harmfulIds = [
      ...new Set(
        cs.statusEffects
          .filter((e) => !e.instanced && isHarmfulPlayerStatusEffect(e.id, e.data))
          .map((e) => e.id),
      ),
    ];
    for (const id of harmfulIds) {
      if (getStatusEffect(cs, id)) removeStatusEffectStacks(cs, id, cleanseStacks);
    }
    setCooldown(cs, RITE_CLEANSE_CD_KEY, cleanseInterval);
  }

  // Lingering Momentum: slow the OOC decay of beneficial (non-harmful) timed buffs by
  // adding back a fraction of the elapsed dt (updateTracksCombat decremented it by dt,
  // so net decay = (1 - slowdown) * dt). Never extend past the buff's original total.
  const slowdown = Math.min(0.95, Math.max(0, p["rite.ooc-buff-decay-slowdown-pct"] ?? 0));
  if (slowdown > 0) {
    for (const e of cs.statusEffects) {
      if (e.instanced || e.remainingMs <= 0) continue;
      if (isHarmfulPlayerStatusEffect(e.id, e.data)) continue;
      const totalMs = e.data["totalMs"];
      const extended = e.remainingMs + slowdown * dt;
      e.remainingMs = totalMs && totalMs > 0 ? Math.min(totalMs, extended) : extended;
    }
  }
}

/**
 * Register the Hunter's Instinct onKill listener. Reuses the mobility `mob-haste`
 * buff (FOREST_HASTE status effect) so the existing descriptor renders it and applies
 * the speed bonus — "acquire the next target faster" expressed as post-kill haste.
 * Registered in `initCombatSystems()` for live/bench parity.
 */
export function initRiteListeners(): void {
  registerCombatListener("onKill", (ctx) => {
    if (ctx.attackerType !== "player") return;
    const player = ctx.attacker;
    const p = player.usesSkills.passives;
    const pct = p["rite.on-kill-haste-pct"] ?? 0;
    if (pct <= 0) return;
    const ms = p["rite.on-kill-haste-ms"] ?? 2000;
    applyStatusEffect(player.tracksCombat, {
      id: FOREST_HASTE,
      maxStacks: 1,
      remainingMs: ms,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { speedPct: pct, totalMs: ms },
    });
  });
}
