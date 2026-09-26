// Charm Guard hooks (2026-09-26): each charm line's Recovery delivery answers to its
// own biome's Guard. Real charms at +5, real Guards fired through rune wiring.
// Expectations read the equipped values, so the balance pass can move numbers freely.
import assert from "node:assert/strict";
import {
  ABILITY_DATABASE, GAME_CONFIG, STARTER_RUNE_IDS, applyStatusEffect, emptyEquipment,
  getResource, abilityCooldownMs, modifiedAbilityCooldownMs,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { equipItem } from "../src/systems/player/economy/inventory";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { fireWithReferenceWiring } from "./fixtures/abilityWiring";
import { applyStun } from "../src/systems/combat/status/stun";
import { makeCombatContext, emitCombatEvent } from "../src/systems/combat/engine/combatPipeline";
import { runBarrierRecharge, stampBarrierDamage } from "../src/systems/defense/barrier/barrier";
import { ABSORB_POOL_KEY } from "../src/systems/defense/core/pools";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";

function slices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null },
  };
}

initCombatSystems();
const world = new World();
let serial = 0;
/** A player with `charm` at +5 and `guard` attuned, fired off an Always rule. */
function withCharm(charm: string, guard: string, slot: "guards" | "techniques" = "guards") {
  const s = slices(`charm-${serial++}`);
  const p = world.attachPlayerEntity(s, s.isPlayer.id);
  p.holdsInventory.inventory.push(charm);
  p.holdsInventory.itemUpgrades[charm] = 5;
  assert(equipItem(world, p, charm), `equip ${charm}`);
  p.tracksProgression.knownAbilities = [guard];
  p.tracksProgression.attunedAbilities = slot === "guards" ? { techniques: [], guards: [guard] } : { techniques: [guard], guards: [] };
  p.tracksProgression.runesEquipped = [{ conditionId: "always", actionId: "use-ability", targetAbilityId: guard }];
  p.usesAutocombat.auto = true;
  return p;
}
const fire = () => fireWithReferenceWiring(world, Date.now());
function drainBarrier(p: ReturnType<typeof withCharm>) {
  assert(p.hasBarrier, "charm attaches a barrier");
  p.hasBarrier.current = 0;
}

// Mountain: a Mitigation Guard (Brace) restores part of the barrier.
{
  const p = withCharm("mountain-charm-t4", "brace");
  drainBarrier(p);
  fire();
  const pct = p.usesSkills.passives["guard.barrier-refill-pct"];
  assert(pct > 0);
  assert.equal(p.hasBarrier!.current, Math.min(p.hasBarrier!.max, p.hasBarrier!.max * pct), "Brace restores the authored share of the barrier");
}

// Tundra: Break Free (Control) restores the barrier; Brace (Mitigation) does not.
{
  const p = withCharm("tundra-charm-t4", "break-free");
  drainBarrier(p);
  applyStun(p.tracksCombat, 4000, "tester");
  fire();
  assert(p.hasBarrier!.current > 0, "Break Free restores the Tundra barrier");
  const q = withCharm("tundra-charm-t4", "brace");
  drainBarrier(q);
  fire();
  assert.equal(q.hasBarrier!.current, 0, "a Mitigation Guard does not trigger the Tundra hook");
}

// Tundra: holding position in active combat recharges the barrier even while hit.
{
  const p = withCharm("tundra-charm-t4", "brace");
  drainBarrier(p);
  const monster = world.createMonster("node-5-5", "magma-brute", { x: 420, y: 400 })!;
  setAggroTarget(world, monster, { kind: "player", id: p.isPlayer.id });
  stampBarrierDamage(world, p);
  runBarrierRecharge(world, p, 1000);
  const rate = p.usesSkills.passives["defense.barrier-stationary-recharge-pct"];
  assert(Math.abs(p.hasBarrier!.current - p.hasBarrier!.max * rate) < 1e-6, "holding recharges at the charm rate right after a hit");
  p.hasBarrier!.current = 0;
  stampBarrierDamage(world, p);
  p.isMoving = {} as never;
  runBarrierRecharge(world, p, 1000);
  assert.equal(p.hasBarrier!.current, 0, "moving falls back to the ordinary undamaged delay");
  delete p.isMoving;
  world.removeMonsterEntity(monster.isMonster.id);
}

// Swamp: a Cleanse Guard starts the Recovery pulse at once.
{
  const p = withCharm("swamp-charm-t3", "cleanse");
  applyStatusEffect(p.tracksCombat, { id: "antiheal", maxStacks: 1, remainingMs: 6000, refreshable: true, sourceId: "tester", data: {} });
  assert.equal(getResource(p.tracksCombat, "recovery.pulseMs"), 0);
  fire();
  assert(getResource(p.tracksCombat, "recovery.pulseMs") > 0, "Cleanse starts the pulse");
  assert.equal(getResource(p.tracksCombat, "recovery.pulsePct"), p.usesSkills.passives["defense.recovery-pulse-pct"]);
}

// Jungle: any Guard advances the ramp; a Technique never does.
{
  const p = withCharm("jungle-charm-t4", "brace");
  fire();
  assert.equal(getResource(p.tracksCombat, "recovery.rampMs"), p.usesSkills.passives["guard.recovery-ramp-advance-ms"], "Brace advances the ramp");
  const t = withCharm("jungle-charm-t4", "frenzy", "techniques");
  fire();
  assert.equal(getResource(t.tracksCombat, "recovery.rampMs"), 0, "a Technique never triggers a charm hook");
}

// Cave: more absorb while a Mitigation Guard buff is up.
{
  const p = withCharm("cave-charm-t3", "brace");
  const monster = world.createMonster("node-5-5", "magma-brute", { x: 420, y: 400 })!;
  const hit = () => {
    const ctx = makeCombatContext(monster, "monster", p, "player");
    ctx.damage = 100;
    emitCombatEvent("onDamageTaken", ctx, world);
    return ctx.damage;
  };
  const base = p.usesSkills.passives["defense.absorb-pct"];
  const bonus = p.usesSkills.passives["defense.absorb-guard-bonus-pct"];
  const plain = hit();
  assert(Math.abs(getResource(p.tracksCombat, ABSORB_POOL_KEY) - plain * base) < 1e-6, "plain absorb without a Guard");
  fire();
  const before = getResource(p.tracksCombat, ABSORB_POOL_KEY);
  // Brace also reduces the hit; absorb converts what is left of it.
  const guarded = hit();
  assert(guarded < plain, "Brace is up");
  assert(Math.abs(getResource(p.tracksCombat, ABSORB_POOL_KEY) - before - guarded * (base + bonus)) < 1e-6, "Brace up adds the Guard bonus");
  world.removeMonsterEntity(monster.isMonster.id);
}

// Trench: shorter Recovery-skill cooldowns, and only for Recovery skills.
{
  const s = slices("trench");
  const p = world.attachPlayerEntity(s, s.isPlayer.id);
  p.holdsInventory.inventory.push("trench-charm-t4");
  p.holdsInventory.itemUpgrades["trench-charm-t4"] = 5;
  assert(equipItem(world, p, "trench-charm-t4"));
  const cdr = p.usesSkills.passives["recovery.cooldown-reduction-pct"];
  assert(cdr > 0);
  for (const id of ["second-wind", "recuperate"]) {
    const a = ABILITY_DATABASE.get(id)!;
    assert(Math.abs(modifiedAbilityCooldownMs(a, 4, p.usesSkills.passives) - abilityCooldownMs(a, 4) * (1 - cdr)) < 1e-6, `${id} cooldown shortened`);
  }
  const brace = ABILITY_DATABASE.get("brace")!;
  assert.equal(modifiedAbilityCooldownMs(brace, 4, p.usesSkills.passives), abilityCooldownMs(brace, 4), "Brace is not a Recovery skill");
}

console.log("charmHooks: ok");
