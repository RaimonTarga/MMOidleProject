/**
 * The Empowered moment is rate-capped (design §24.9), wired on a Conduit.
 *
 * The Conduit's mechanic is its formation cycle — every living summon having hit
 * the same target — and the course-correction matrix measured it firing 25–40
 * times a minute against 1–9 for every other root. The Empowered moment now
 * carries `capMs` like Affliction and Control (`PACKET_HALF_NUMBERS`), so the
 * Conduit's cycle fires an Empowered verb AT the cap: at most once per cap window,
 * and again on the first cycle the cap allows.
 *
 * Driven through the real `runFormationAttack` with real summons, so what is
 * pinned is the cycle feeding the cap, not a hand-built `mechanic-fired`.
 *
 * Run: node --conditions=development --import tsx test/empoweredCap.test.ts
 */
import {
  GAME_CONFIG,
  PACKET_HALF_NUMBERS,
  baseRecoveryForTier,
  emptyEquipment,
  getLineageRuntime,
  tickCooldowns,
  type CombatEvent,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { registerMechanicFiredListener } from '../src/systems/combat/engine/mechanicFired';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { unlockSkill } from '../src/systems/player/progression/skills';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
initCombatSystems();
const world = new World();

let cycles = 0;
registerMechanicFiredListener((_world, player) => {
  if (player.isPlayer.id === 'cap-conduit') cycles += 1;
});

const slices: PersistedPlayerSlices = {
  isPlayer: { id: 'cap-conduit', name: 'cap-conduit' },
  hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
  hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
  tracksProgression: {
    level: 0, skillPoints: 1,
    essences: { red: 99_999, blue: 99_999, green: 99_999, yellow: 99_999, purple: 99_999 },
    shards: { empowered: 999, control: 999, engagement: 999 },
    capstones: {},
    biomeXP: {}, biomeLevel: { plains: 6, forest: 6, mountain: 6, swamp: 6, cave: 6 },
    unlockedRecipes: [], questProgress: {}, playerTier: 2, currentSkillTier: 0,
    bossesCleared: [], clearedNodes: [],
    runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
    knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
    knownStances: [], equippedStances: { default: null }, activeStance: null,
    knownRites: [], equippedRites: [],
  },
  holdsInventory: { inventory: ['heavy-hammer'], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
  usesSkills: {
    unlockedSkills: [], passives: {}, selectedClass: null,
    selectedSubVariant: null, selectedRange: null, combatArchetype: null,
  },
};

const VERB = 'hammer-t1-empowered-payoff'; // Crash Down
const CAP_MS = PACKET_HALF_NUMBERS.empowered?.moment.capMs ?? 0;
assert(CAP_MS === 4_000, `the Empowered moment is capped at 4 s (PROVISIONAL), got ${CAP_MS}`);

const player = world.attachPlayerEntity(slices, 'cap-conduit');
assert(unlockSkill(world, player, 'summoner-root'), 'a real Conduit');
assert(equipItem(world, player, 'heavy-hammer'), 'wears the Hammer');
const bought = unlockLineageCard(world, player, 'hammer', VERB);
assert(bought.success, `${VERB}: ${bought.reason}`);
const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
assert(verb?.trigger?.kind === 'mechanic-fired' && verb.trigger.capMs === CAP_MS, 'Crash Down: the mechanic moment, capped');

recalculatePlayerEntityStats(world, player);
updateSummonerArchetype(world, 0, 1_000);
const bodies = player.summonsMinions!.minionIds
  .map((id) => (id ? world.getMinionEntity(id) : undefined))
  .filter((m): m is NonNullable<typeof m> => m !== undefined);
assert(bodies.length >= 2, `the formation needs several bodies to cycle, got ${bodies.length}`);

const victim = world.createMonster(NODE, 'plains-slime', { x: 700, y: 400 })!;
victim.hasHealth.maxHp = 100_000_000;
victim.hasHealth.hp = 100_000_000;
victim.mitigatesDamage.plating = 0;
victim.mitigatesDamage.damageReduction = 0;
world.takeNodeEvents(NODE);

// A full formation cycle every STEP — far faster than any real Conduit, the
// most pressure the cap can be put under.
const STEP = 250;
const DURATION = 40_000;
const firedAt: number[] = [];
let now = 2_000;
for (let t = 0; t <= DURATION; t += STEP) {
  if (t > 0) tickCooldowns(player.tracksCombat, STEP);
  now += STEP;
  for (const body of bodies) runFormationAttack(world, player, body, victim, now);
  const fx = world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx' && e.cardId === VERB);
  if (fx.length > 0) firedAt.push(t);
  assert(fx.length <= 1, `one cycle pays at most once, got ${fx.length}`);
}

assert(cycles >= DURATION / STEP, `the cycle completed every step (${cycles} mechanic-fired)`);
assert(firedAt[0] === 0, `the first cycle fires, got ${firedAt[0]}`);
for (let i = 1; i < firedAt.length; i++) {
  const gap = firedAt[i] - firedAt[i - 1];
  assert(gap >= CAP_MS, `two firings ${gap} ms apart — at most one per ${CAP_MS} ms window`);
  assert(gap < CAP_MS + STEP, `and it fires again on the first cycle the cap allows (gap ${gap})`);
}
assert(firedAt.length === Math.floor(DURATION / CAP_MS) + 1,
  `${cycles} cycles in ${DURATION / 1000} s pay ${Math.floor(DURATION / CAP_MS) + 1} times at the cap, got ${firedAt.length}`);
console.log(`  conduit  cycles ${cycles}  Crash Down fired ${firedAt.length} (cap ${CAP_MS} ms)`);
console.log('empoweredCap: ok');
