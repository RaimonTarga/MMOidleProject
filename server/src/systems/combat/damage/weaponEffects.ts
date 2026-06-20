import { registerCombatListener } from "../engine/combatPipeline";
import {
  applyStatusEffect,
  getStatusEffect,
  removeStatusEffect,
  computeReservoirDotTick,
  getCounter,
  addCounter,
  getString,
  setString,
  BURN_FAMILY,
  weaponDotProfileForWeapon,
  BRITTLE_EFFECT_ID,
  BRITTLE_DURATION_MS,
  DR_SHATTER_EFFECT_ID,
  VOID_CORRUPTION_EFFECT_ID,
  type DamageElement,
} from "@mmo-idle/shared";
import { grantMonsterRewards } from "../../player/progression/rewards";
import type { World } from "../../../world/World";
import { defineBuff, type BuffDescriptor } from "../buffs/descriptor";
import {
  attachMarker,
  detachMarkerIfNoEffect,
} from "../../../ecs/markerHelpers";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from "../../../world/worldLogCombat";
import { actorFromSourceId } from "../../../world/worldLogActors";
import { isInvulnerableMonster } from "../invulnerability";
import { evadeBlocksDebuffs } from "../../defense/mitigation/evasion";
import { pushDotTickEvent } from "./dotTickEvent";
import { emitPlayerMonsterOnKill } from "./killHooks";

// ── Internal combat state keys ────────────────────────────────────────────────

const HITS_RECEIVED_KEY = "hitsReceived";
const FIRST_STRIKE_EFFECT = "first-strike";

const BURN_EFFECT_IDS = BURN_FAMILY
  .filter((b) => b.effectId !== VOID_CORRUPTION_EFFECT_ID)
  .map((b) => b.effectId);
const BURN_ELEMENT_BY_EFFECT_ID: Record<string, DamageElement> =
  Object.fromEntries(BURN_FAMILY.map((b) => [b.effectId, b.element]));

// ── Flurry: stacking attack-speed buff (weapon.flurry-* passives) ─────────────
const FLURRY_EFFECT_ID = "flurry";
const FLURRY_DURATION_MS = 4500;
const FLURRY_BASE_CD = "flurryBaseCd"; // tracksCombat string: cached pre-flurry cooldown

// ── Init — registers combat pipeline listeners ────────────────────────────────

export function initWeaponEffects(): void {
  // ── First strike: 2× (or custom) damage on the very first hit on a fresh monster ─
  // hitsReceived is incremented unconditionally for every player → monster onHit,
  // so the bonus fires only when this player is genuinely the first to connect.
  // Fully-evaded hits (evadeMult >= 1) never reach onHit and don't consume the charge.
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;

    const monsterState = ctx.defender.tracksCombat;
    addCounter(monsterState, HITS_RECEIVED_KEY, 1);
    const hitsReceived = getCounter(monsterState, HITS_RECEIVED_KEY);

    const mult = ctx.attacker.usesSkills.passives["weapon.first-strike-mult"] ?? 0;
    if (mult <= 0 || hitsReceived !== 1) return;

    ctx.damage = Math.round(ctx.damage * mult);
    const existing = ctx.metadata["clientEffects"];
    ctx.metadata["clientEffects"] = Array.isArray(existing)
      ? [...existing, FIRST_STRIKE_EFFECT]
      : [FIRST_STRIKE_EFFECT];
  });

  // ── Brittle: stacking −plating / −DR debuff on the target (Tundra weapon) ────
  // Passive-driven (any item granting weapon.brittle-* gains it). One stack per
  // hit up to brittle-stacks, refreshing the timer; read at damage time in
  // effectivePlating.ts. No tick loop — it's a pure mitigation reduction.
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;

    const p = ctx.attacker.usesSkills.passives;
    const platingPerStack = p["weapon.brittle-plating"] ?? 0;
    const drPerStack = p["weapon.brittle-dr"] ?? 0;
    if (platingPerStack <= 0 && drPerStack <= 0) return;
    if (evadeBlocksDebuffs(ctx)) return; // dodged hit applies no brittle
    const maxStacks = Math.max(1, Math.round(p["weapon.brittle-stacks"] ?? 1));

    const effect = applyStatusEffect(ctx.defender.tracksCombat, {
      id: BRITTLE_EFFECT_ID,
      maxStacks,
      instanced: false,
      sourceId: ctx.attacker.isPlayer.id,
      remainingMs: BRITTLE_DURATION_MS,
      refreshable: true,
      data: { platingPerStack, drPerStack },
    });
    // Keep per-stack values current with the equipped weapon (buffs apply immediately).
    effect.data.platingPerStack = platingPerStack;
    effect.data.drPerStack = drPerStack;

    // Brittle shatter: at the shatter threshold, strip the target's DR for a window.
    const shatterThreshold = p["weapon.brittle-shatter-threshold"] ?? 0;
    const stripMs = p["weapon.brittle-shatter-dr-strip-ms"] ?? 0;
    if (shatterThreshold > 0 && stripMs > 0 && effect.stacks >= shatterThreshold) {
      applyStatusEffect(ctx.defender.tracksCombat, {
        id: DR_SHATTER_EFFECT_ID,
        instanced: false,
        refreshable: true,
        remainingMs: stripMs,
        sourceId: ctx.attacker.isPlayer.id,
        data: { totalMs: stripMs },
      });
    }
  });

  // ── Execute: hits vs low-HP targets deal a damage multiplier (Abyssal Axe). ──
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;
    const threshold = ctx.attacker.usesSkills.passives["weapon.execute-threshold-pct"] ?? 0;
    if (threshold <= 0) return;
    const mult = ctx.attacker.usesSkills.passives["weapon.execute-dmg-mult"] ?? 1;
    if (mult <= 1) return;

    const def = ctx.defender;
    const hpFrac = def.hasHealth.hp / Math.max(1, def.hasHealth.maxHp);
    if (hpFrac > threshold) return;

    ctx.damage = Math.round(ctx.damage * mult);
  });

  // ── Flurry: each hit adds 1 attack-speed stack (up to weapon.flurry-stacks), ──
  // refreshing the buff window. Stacks scale attackCooldown in updateFlurryBuff;
  // the buff drops all at once when the window lapses (standard stacking-status decay).
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;

    const p = ctx.attacker.usesSkills.passives;
    if ((p["weapon.flurry-pct"] ?? 0) <= 0) return;
    const maxStacks = Math.max(1, Math.round(p["weapon.flurry-stacks"] ?? 1));

    applyStatusEffect(ctx.attacker.tracksCombat, {
      id: FLURRY_EFFECT_ID,
      maxStacks,
      instanced: false,
      sourceId: ctx.attacker.isPlayer.id,
      remainingMs: FLURRY_DURATION_MS,
      refreshable: true,
      data: { totalMs: FLURRY_DURATION_MS },
    });
  });

  // ── Chaotic family: every Nth hit misses (0 damage, on-hit effects still fire) ─
  // Determined centrally in runPlayerAttack (combat.ts) before beforeAttack so the
  // miss can preserve empowered charges / reload ammo.

  // ── Plague Axe: the dead swing applies a damage-taken debuff instead of damage. ─
  // Gated by weapon.dead-swing-vuln-pct; fires only on the chaotic-miss swing and
  // applies the shared `vulnerability` effect (consumed in initDebuffMechanics).
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;
    if (!ctx.metadata["chaoticMiss"]) return; // only the dead swing carries it
    const vulnPct = ctx.attacker.usesSkills.passives["weapon.dead-swing-vuln-pct"] ?? 0;
    if (vulnPct <= 0) return;
    if (evadeBlocksDebuffs(ctx)) return; // a monster-evaded swing applies no debuff

    const vulnMs = ctx.attacker.usesSkills.passives["weapon.dead-swing-vuln-ms"] ?? 4000;
    applyStatusEffect(ctx.defender.tracksCombat, {
      id: "vulnerability",
      instanced: false,
      refreshable: true,
      remainingMs: vulnMs,
      sourceId: ctx.attacker.isPlayer.id,
      data: { damageMultiplier: 1 + vulnPct },
    });
  });

  // ── Generic weapon reservoir DoTs: convert remaining direct damage into a pool.
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;
    const player = ctx.attacker;
    const weaponId = player.holdsInventory.equipment.weapon;
    if (!weaponId) return;
    const profile = weaponDotProfileForWeapon(weaponId);
    if (!profile) return;
    if (evadeBlocksDebuffs(ctx)) return;

    const empoweredBonus =
      typeof ctx.metadata["empoweredBonus"] === "number"
        ? ctx.metadata["empoweredBonus"]
        : 0;
    const reservoirBasis = Math.max(0, ctx.damage - empoweredBonus);
    const poolGain = reservoirBasis * profile.convPct * profile.dotMultiplier;

    const effect = applyStatusEffect(ctx.defender.tracksCombat, {
      id: profile.effectId,
      maxStacks: 1,
      instanced: false,
      sourceId: player.isPlayer.id,
      remainingMs: profile.drainDurationMs,
      refreshable: true,
      data: {
        pool: 0,
        nextTickIn: profile.tickIntervalMs,
        tickIntervalMs: profile.tickIntervalMs,
        tickOnExpire: 1,
        drainDurationMs: profile.drainDurationMs,
        dotMultiplier: profile.dotMultiplier,
        slowPerStack: profile.slowPerStack ?? 0,
      },
    });

    effect.data.pool = (effect.data.pool ?? 0) + poolGain;
    effect.data.tickIntervalMs = profile.tickIntervalMs;
    effect.data.tickOnExpire = 1;
    effect.data.drainDurationMs = profile.drainDurationMs;
    effect.data.dotMultiplier = profile.dotMultiplier;
    effect.data.slowPerStack = profile.slowPerStack ?? 0;

    if (profile.effectId === VOID_CORRUPTION_EFFECT_ID) {
      attachMarker(world, ctx.defender, "hasVoidCorruption");
    } else {
      attachMarker(world, ctx.defender, "hasAshbrandBurn");
    }

    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - profile.convPct)));
  });
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

export function updateWeaponEffects(world: World, dt: number): void {
  updateFlurryBuff(world);
  updateBurnEffects(world, dt);
  updateCorruptionEffects(world, dt);
}

// ── Flurry buff: recompute attackCooldown from current stacks each tick ────────
// The flurry status effect decays in updateCombatState; here we mirror its stack
// count onto attackCooldown, caching the pre-flurry cooldown so it restores cleanly
// when the window lapses or the weapon is swapped out.
function updateFlurryBuff(world: World): void {
  for (const player of world.livePlayers) {
    const state = player.tracksCombat;
    const pct = player.usesSkills.passives["weapon.flurry-pct"] ?? 0;
    const effect = getStatusEffect(state, FLURRY_EFFECT_ID);
    const storedBase = getString(state, FLURRY_BASE_CD);

    // No active flurry (expired, or weapon no longer grants it) — restore base cooldown.
    if (!effect || pct <= 0) {
      if (storedBase) {
        const base = Number(storedBase);
        if (base > 0 && player.performsAttack.attackCooldown !== base) {
          player.performsAttack.attackCooldown = base;
          markSliceDirty(world, player, "performsAttack");
        }
        setString(state, FLURRY_BASE_CD, "");
      }
      // Effect lingering after a weapon swap removed the passive — drop it.
      if (effect && pct <= 0) removeStatusEffect(state, FLURRY_EFFECT_ID);
      continue;
    }

    // Cache the un-flurried cooldown on the 0→active transition.
    if (!storedBase) {
      setString(state, FLURRY_BASE_CD, String(player.performsAttack.attackCooldown));
    }
    const base = Number(getString(state, FLURRY_BASE_CD));
    const next = Math.max(200, Math.round(base / (1 + effect.stacks * pct)));
    if (next !== player.performsAttack.attackCooldown) {
      player.performsAttack.attackCooldown = next;
      markSliceDirty(world, player, "performsAttack");
    }
  }
}

// ── Edge of Oblivion corruption tick ─────────────────────────────────────────

function updateCorruptionEffects(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];
  const killed = new Set<string>();

  for (const e of world.voidCorruptionMonsters) {
    if (isInvulnerableMonster(e)) continue;
    const monsterId = e.isMonster.id;
    const state = e.tracksCombat;
    const effect = getStatusEffect(state, VOID_CORRUPTION_EFFECT_ID);
    if (!effect) {
      detachMarkerIfNoEffect(
        world,
        e,
        "hasVoidCorruption",
        state,
        VOID_CORRUPTION_EFFECT_ID,
      );
      continue;
    }

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn <= 0) {
      effect.data.nextTickIn = effect.data.tickIntervalMs;
      const damage = Math.round(computeReservoirDotTick(
        effect.data.pool ?? 0,
        effect.data.tickIntervalMs,
        effect.data.drainDurationMs,
      ));
      if (damage <= 0) {
        if (effect.remainingMs <= 0) {
          removeStatusEffect(state, VOID_CORRUPTION_EFFECT_ID);
          detachMarkerIfNoEffect(world, e, "hasVoidCorruption", state, VOID_CORRUPTION_EFFECT_ID);
        }
        continue;
      }
      effect.data.pool = Math.max(0, (effect.data.pool ?? 0) - damage);
      recordMonsterDamagedByPlayer(
        world,
        effect.sourceId,
        actorFromSourceId(world, effect.sourceId),
        e,
        damage,
        "weapon-dot",
        buildSimpleBreakdown(damage, damage),
      );
      e.hasHealth.hp -= damage;
      pushDotTickEvent(world, e, BURN_ELEMENT_BY_EFFECT_ID[effect.id] ?? "doom", damage, { sourceType: "weapon" });

      if (e.hasHealth.hp <= 0 && !killed.has(monsterId)) {
        killed.add(monsterId);
        toKill.push({ monsterId, sourceId: effect.sourceId, damage });
      } else if (effect.remainingMs <= 0) {
        removeStatusEffect(state, VOID_CORRUPTION_EFFECT_ID);
        detachMarkerIfNoEffect(world, e, "hasVoidCorruption", state, VOID_CORRUPTION_EFFECT_ID);
      }
    }
  }

  for (const { monsterId, sourceId, damage } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      emitPlayerMonsterOnKill(world, sourceId, monster, damage, "weapon-dot");
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, damage, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}

// ── Burn family tick (ashbrand / cinderfang / frostmourne) ────────────────────

function updateBurnEffects(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];
  const killed = new Set<string>();

  for (const e of world.ashbrandMonsters) {
    if (isInvulnerableMonster(e)) continue;
    const monsterId = e.isMonster.id;
    const state = e.tracksCombat;
    let hasBurn = false;
    for (const effectId of BURN_EFFECT_IDS) {
      const effect = getStatusEffect(state, effectId);
      if (!effect) continue;
      hasBurn = true;
      effect.data.nextTickIn -= dt;
      if (effect.data.nextTickIn <= 0) {
        effect.data.nextTickIn = effect.data.tickIntervalMs;
        const damage = Math.round(computeReservoirDotTick(
          effect.data.pool ?? 0,
          effect.data.tickIntervalMs,
          effect.data.drainDurationMs,
        ));
        if (damage <= 0) {
          if (effect.remainingMs <= 0) removeStatusEffect(state, effectId);
          continue;
        }
        effect.data.pool = Math.max(0, (effect.data.pool ?? 0) - damage);
        recordMonsterDamagedByPlayer(
          world,
          effect.sourceId,
          actorFromSourceId(world, effect.sourceId),
          e,
          damage,
          'weapon-dot',
          buildSimpleBreakdown(damage, damage),
        );
        e.hasHealth.hp -= damage;
        pushDotTickEvent(world, e, BURN_ELEMENT_BY_EFFECT_ID[effectId] ?? "fire", damage, { sourceType: "weapon" });

        if (e.hasHealth.hp <= 0 && !killed.has(monsterId)) {
          killed.add(monsterId);
          toKill.push({ monsterId, sourceId: effect.sourceId, damage });
        } else if (effect.remainingMs <= 0) {
          removeStatusEffect(state, effectId);
        }
      }
    }
    if (!hasBurn) {
      for (const effectId of BURN_EFFECT_IDS) {
        detachMarkerIfNoEffect(world, e, "hasAshbrandBurn", state, effectId);
      }
      continue;
    }
  }

  for (const { monsterId, sourceId, damage } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      emitPlayerMonsterOnKill(world, sourceId, monster, damage, "weapon-dot");
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, damage, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

export const WEAPON_BUFFS = [
  defineBuff(
    "flurry",
    ({ player }) => {
      const pct = player.usesSkills.passives["weapon.flurry-pct"] ?? 0;
      if (pct <= 0) return null;
      const effect = getStatusEffect(player.tracksCombat, FLURRY_EFFECT_ID);
      if (!effect || effect.stacks <= 0) return null;
      const totalMs = effect.data["totalMs"] ?? effect.remainingMs;
      return {
        id: "flurry",
        label: "Flurry",
        stacks: effect.stacks,
        durationPct:
          totalMs > 0 && effect.remainingMs > 0
            ? (effect.remainingMs / totalMs) * 100
            : -1,
        color: "#ff8844",
        logDetail: `+${Math.round(effect.stacks * pct * 100)}% attack speed`,
      };
    },
    { label: "Flurry", color: "#ff8844", category: "weapon", shape: "square" },
  ),
] as const satisfies readonly BuffDescriptor[];
