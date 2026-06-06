import { registerCombatListener } from "../engine/combatPipeline";
import {
  applyStatusEffect,
  getStatusEffect,
  removeStatusEffect,
  computeScaledDotDamage,
  getCounter,
  addCounter,
  getFlag,
  setFlag,
  isCooldownActive,
  setCooldown,
  getCooldown,
  getString,
  setString,
  CHAOTIC_FAMILY,
  SACRED_FAMILY,
  BURN_FAMILY,
  SACRED_DMG_MULT,
  SACRED_APS_MULT,
  ASHBRAND_DURATION_MS,
  ASHBRAND_TICK_MS,
  EDGE_OF_OBLIVION_ID,
  BRITTLE_EFFECT_ID,
  BRITTLE_DURATION_MS,
  VOID_CORRUPTION_EFFECT_ID,
  CORRUPTION_MAX_STACKS,
  CORRUPTION_CONV_PCT,
  CORRUPTION_TICK_MS,
  CORRUPTION_DURATION_MS,
  CORRUPTION_SLOW_PER_STACK,
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

// ── Internal combat state keys ────────────────────────────────────────────────

const HITS_RECEIVED_KEY = "hitsReceived";
const FIRST_STRIKE_EFFECT = "first-strike";

const CHAOTIC_HIT_KEY = "chaoticHits";
const SACRED_STARTED = "sacredStarted";
const SACRED_BUFF_FLAG = "sacredBuffActive";
const SACRED_READY = "sacredReady";
const SACRED_CD_KEY = "sacredCd";
const SACRED_BUFF_TIMER = "sacredBufTimer";
const SACRED_ORIG_CD = "sacredOrigCd";

const BURN_EFFECT_IDS = BURN_FAMILY.map((b) => b.effectId);

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
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    const player = ctx.attacker;
    const missEvery = player.holdsInventory.equipment.weapon
      ? CHAOTIC_FAMILY[player.holdsInventory.equipment.weapon]
      : undefined;
    if (!missEvery) return;

    const state = player.tracksCombat;

    addCounter(state, CHAOTIC_HIT_KEY, 1);
    if (getCounter(state, CHAOTIC_HIT_KEY) % missEvery === 0) {
      ctx.damage = 0;
      ctx.metadata["chaoticMiss"] = true;
    }
  });

  // ── Sacred family: 3× damage multiplier during the buff window ───────────────
  // Buff only procs (activates) when the player makes an attack, even if the
  // cooldown has already expired — prevents it from firing outside of combat.
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    const player = ctx.attacker;
    const timing = player.holdsInventory.equipment.weapon
      ? SACRED_FAMILY[player.holdsInventory.equipment.weapon]
      : undefined;
    if (!timing) return;

    const state = player.tracksCombat;

    // If armed and ready, proc on this hit (triggering attack also gets the bonus).
    if (getFlag(state, SACRED_READY) && !getFlag(state, SACRED_BUFF_FLAG)) {
      setString(
        state,
        SACRED_ORIG_CD,
        String(player.performsAttack.attackCooldown),
      );
      player.performsAttack.attackCooldown = Math.max(
        200,
        Math.round(player.performsAttack.attackCooldown / SACRED_APS_MULT),
      );
      setFlag(state, SACRED_BUFF_FLAG, true);
      setFlag(state, SACRED_READY, false);
      setCooldown(state, SACRED_BUFF_TIMER, timing.buffMs);
      console.log(
        `[Sacred] ${player.isPlayer.id}: BURST activated (cd=${player.performsAttack.attackCooldown}ms)`,
      );
    }

    if (!getFlag(state, SACRED_BUFF_FLAG)) return;

    ctx.damage = Math.round(ctx.damage * SACRED_DMG_MULT);
    ctx.metadata["sacredBurst"] = true;
  });

  // ── Burn family: convPct of hit → stacking burn, remainder dealt directly ────
  for (const { weaponId, effectId, convPct, maxStacks } of BURN_FAMILY) {
    registerCombatListener("onHit", (ctx, world) => {
      if (ctx.attackerType !== "player") return;
      if (ctx.defenderType !== "monster") return;
      const player = ctx.attacker;
      if (player.holdsInventory.equipment.weapon !== weaponId) return;

      const monsterState = ctx.defender.tracksCombat;

      const damagePerStack = Math.max(
        1,
        Math.round((player.dealsDamage.attack * convPct) / maxStacks),
      );
      const effect = applyStatusEffect(monsterState, {
        id: effectId,
        maxStacks,
        instanced: false,
        sourceId: player.isPlayer.id,
        remainingMs: ASHBRAND_DURATION_MS,
        refreshable: true,
        data: {
          damagePerStack,
          nextTickIn: ASHBRAND_TICK_MS,
          tickIntervalMs: ASHBRAND_TICK_MS,
        },
      });
      // Keep per-stack damage in sync with current attack so buffs apply immediately.
      effect.data.damagePerStack = damagePerStack;
      attachMarker(world, ctx.defender, "hasAshbrandBurn");

      ctx.damage = Math.max(1, Math.round(ctx.damage * (1 - convPct)));
    });
  }

  // ── Edge of Oblivion: corruption stacks (DoT tick + move slow per stack) ─────
  registerCombatListener("onHit", (ctx, world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;
    const player = ctx.attacker;
    if (player.holdsInventory.equipment.weapon !== EDGE_OF_OBLIVION_ID) return;

    const p = player.usesSkills.passives;
    const convPct = p["dot.conversion-pct"] ?? CORRUPTION_CONV_PCT;
    const tickIntervalMs = Math.max(
      100,
      Math.round(p["dot.tick-interval-ms"] ?? CORRUPTION_TICK_MS),
    );
    const durationMs = Math.round(p["dot.duration-ms"] ?? CORRUPTION_DURATION_MS);
    const damagePerStack = Math.max(
      1,
      Math.round((player.dealsDamage.attack * convPct) / CORRUPTION_MAX_STACKS),
    );

    const effect = applyStatusEffect(ctx.defender.tracksCombat, {
      id: VOID_CORRUPTION_EFFECT_ID,
      maxStacks: CORRUPTION_MAX_STACKS,
      instanced: false,
      sourceId: player.isPlayer.id,
      remainingMs: durationMs,
      refreshable: true,
      data: {
        damagePerStack,
        nextTickIn: tickIntervalMs,
        tickIntervalMs,
        slowPerStack: CORRUPTION_SLOW_PER_STACK,
      },
    });
    effect.data.damagePerStack = damagePerStack;
    effect.data.tickIntervalMs = tickIntervalMs;
    effect.data.slowPerStack = CORRUPTION_SLOW_PER_STACK;
    attachMarker(world, ctx.defender, "hasVoidCorruption");
  });
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

export function updateWeaponEffects(world: World, dt: number): void {
  updateSacredCrossBuff(world);
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

// ── Sacred family buff timer ───────────────────────────────────────────────────

function updateSacredCrossBuff(world: World): void {
  for (const player of world.livePlayers) {
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
      player.showsSacred.sacredBuffPct = 0;
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
        console.log(
          `[Sacred] ${player.isPlayer.id}: buff ended, next in ${timing.cdMs}ms`,
        );
      }
    } else if (
      !isCooldownActive(state, SACRED_CD_KEY) &&
      !getFlag(state, SACRED_READY)
    ) {
      // Cooldown expired — arm the buff; it procs on the next attack hit.
      setFlag(state, SACRED_READY, true);
    }

    // Mirror to the entity slice for HUD projection.
    const isBuff = getFlag(state, SACRED_BUFF_FLAG);
    player.showsSacred.sacredBuffActive = isBuff;
    player.showsSacred.sacredBuffPct = isBuff
      ? 100
      : Math.round(
          Math.max(0, 1 - getCooldown(state, SACRED_CD_KEY) / timing.cdMs) *
            100,
        );
  }
}

// ── Edge of Oblivion corruption tick ─────────────────────────────────────────

function updateCorruptionEffects(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];
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
      const damage = Math.max(1, computeScaledDotDamage(effect));
      recordMonsterDamagedByPlayer(
        world,
        effect.sourceId,
        actorFromSourceId(world, effect.sourceId),
        e,
        damage,
        "dot",
        buildSimpleBreakdown(damage, damage),
      );
      e.hasHealth.hp -= damage;

      if (e.hasHealth.hp <= 0 && !killed.has(monsterId)) {
        killed.add(monsterId);
        toKill.push({ monsterId, sourceId: effect.sourceId });
      }
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, 0, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}

// ── Burn family tick (ashbrand / cinderfang / frostmourne) ────────────────────

function updateBurnEffects(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];
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
        const damage = Math.max(1, computeScaledDotDamage(effect));
        recordMonsterDamagedByPlayer(
          world,
          effect.sourceId,
          actorFromSourceId(world, effect.sourceId),
          e,
          damage,
          'proc',
          buildSimpleBreakdown(damage, damage),
        );
        e.hasHealth.hp -= damage;

        if (e.hasHealth.hp <= 0 && !killed.has(monsterId)) {
          killed.add(monsterId);
          toKill.push({ monsterId, sourceId: effect.sourceId });
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

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, 0, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}

// ── Buff descriptors ──────────────────────────────────────────────────────────

export const WEAPON_BUFFS = [
  defineBuff(
    "sacred-burst",
    ({ player }) =>
      player.showsSacred.sacredBuffActive
        ? {
            id: "sacred-burst",
            label: "Holy",
            stacks: 1,
            durationPct: player.showsSacred.sacredBuffPct,
            color: "#ffdd44",
            logDetail: `+${Math.round((SACRED_DMG_MULT - 1) * 100)}% damage, +${Math.round((SACRED_APS_MULT - 1) * 100)}% attack speed`,
          }
        : null,
    { label: "Holy", color: "#ffdd44", category: "weapon", shape: "square" },
  ),
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
