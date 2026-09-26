/**
 * Owner runes that move the formation: Step Back walks summons out of pending
 * telegraphs, Taunt Target draws an enemy onto the striking summon, and summons
 * share their Conduit's mobility haste so they keep pace.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  geometryContains,
  setFlag,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { driveMinion } from '../src/systems/classes/archetypes/summoner/ai';
import { publishGroundZone } from '../src/systems/world/groundZones';
import { setEntityMotion, updateMovement } from '../src/systems/world/movement';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { RUNE_TAUNT_CURRENT_TARGET_FLAG } from '../src/systems/combat/ai/runeConfig';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { initCombatSystems } from '../src/systems/combatBootstrap';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-clearing';

function persisted(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 1,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root'],
      passives: {},
      selectedClass: 'summoner-root',
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: 'summoner',
    },
  };
}

function setup(id: string) {
  const world = new World();
  const owner = world.attachPlayerEntity(persisted(id), id);
  syncArchetypeSlices(world, owner);
  updateSummonerArchetype(world, 0, 1_000);
  const minions = () => owner.summonsMinions!.minionIds.map((mid) => world.getMinionEntity(mid)!);
  assert(minions().length === 4 && minions().every(Boolean), 'root formation should spawn four summons');
  // Out of leash range, so the summons idle at their follow offsets.
  const monster = world.createMonster(NODE, 'boar', { x: 2_000, y: 2_000 })!;
  assert(monster !== undefined, 'fixture monster');
  return { world, owner, minions, monster };
}

// ── Step Back moves summons out of a pending telegraph ───────────────────────
function summonsInsideAfterTelegraph(stepBack: boolean): number {
  const { world, owner, minions, monster } = setup(stepBack ? 'step-back' : 'no-step-back');
  owner.usesAutocombat.auto = true;
  if (stepBack) {
    owner.tracksProgression.runesEquipped = [{ conditionId: 'inside-telegraph', actionId: 'step-back' }];
  }
  let now = 2_000;
  // Settle at follow offsets first.
  for (let i = 0; i < 20; i++) {
    for (const m of minions()) driveMinion(world, m, owner, now);
    updateMovement(world, 100, now);
    now += 100;
  }
  const zone = publishGroundZone(world, NODE, {
    pos: { ...owner.hasPosition.current },
    radius: 120,
    startedAtMs: now,
    resolvesAtMs: now + 5_000,
    ownerId: monster.isMonster.id,
  });
  assert(minions().every((m) => geometryContains(zone.geometry, m.hasPosition.current)),
    'fixture: every summon starts inside the telegraph');
  for (let i = 0; i < 20; i++) {
    for (const m of minions()) driveMinion(world, m, owner, now);
    updateMovement(world, 100, now);
    now += 100;
  }
  return minions().filter((m) => geometryContains(zone.geometry, m.hasPosition.current)).length;
}

assert(summonsInsideAfterTelegraph(false) === 4, 'without Step Back the summons hold their positions');
assert(summonsInsideAfterTelegraph(true) === 0, 'with Step Back every summon leaves the telegraph');

// ── Taunt Target draws the enemy onto the striking summon ────────────────────
initCombatSystems();
{
  const { world, owner, minions, monster } = setup('taunt');
  setFlag(owner.tracksCombat, RUNE_TAUNT_CURRENT_TARGET_FLAG, true);
  setAggroTarget(world, monster, { id: owner.isPlayer.id, kind: 'player' }, 2_000);

  const hitFrom = (minionId: string) => {
    const ctx = makeCombatContext(owner, 'player', monster, 'monster');
    ctx.metadata['aggroSource'] = { id: minionId, kind: 'minion' };
    emitCombatEvent('afterHit', ctx, world);
  };
  const [first, second] = minions();
  hitFrom(first!.isMinion.id);
  assert(monster.hasAggroTarget?.targetKind === 'minion'
    && monster.hasAggroTarget.targetId === first!.isMinion.id, 'the striking summon takes the aggro');

  hitFrom(second!.isMinion.id);
  assert(monster.hasAggroTarget?.targetId === first!.isMinion.id,
    'an enemy already on this formation is not shuffled between summons');
}

// ── Summons share the owner's mobility haste ─────────────────────────────────
function summonStep(oocSpeedPct: number): number {
  const { world, owner, minions } = setup(`haste-${oocSpeedPct}`);
  owner.usesSkills.passives['mobility.ooc-speed-pct'] = oocSpeedPct;
  const minion = minions()[0]!;
  const start = { ...minion.hasPosition.current };
  setEntityMotion(world, minion, { x: start.x + 1_000, y: start.y });
  updateMovement(world, 100, 5_000);
  return minion.hasPosition.current.x - start.x;
}

const base = summonStep(0);
const hasted = summonStep(0.5);
assert(base > 0, 'fixture: the summon moves');
assert(Math.abs(hasted / base - 1.5) < 0.05, `an out-of-combat sprint speeds summons too (${base} -> ${hasted})`);

console.log('summonerRuneBehaviors: ok');
