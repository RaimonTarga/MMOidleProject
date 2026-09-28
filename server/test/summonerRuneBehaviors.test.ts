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
  runeActionArchetypeNote,
  getFlag,
  setFlag,
  ACTION_DATABASE,
  STARTER_RUNE_IDS,
  deriveAutoConfigFromRunes,
  type RuneContext,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { driveMinion } from '../src/systems/classes/archetypes/summoner/ai';
import { publishGroundZone } from '../src/systems/world/groundZones';
import { setEntityMotion, updateMovement } from '../src/systems/world/movement';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { RUNE_RECALL_SUMMONS_FLAG, RUNE_TAUNT_CURRENT_TARGET_FLAG, updateRuneDerivedConfig } from '../src/systems/combat/ai/runeConfig';
import { emitCombatEvent, makeCombatContext } from '../src/systems/combat/engine/combatPipeline';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  RECALL_HOLD_MS,
  RECALL_SPEED_MULT,
  applySummonerRecall,
  recallSpot,
} from '../src/systems/classes/archetypes/summoner/command';

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

initCombatSystems();

// ── Step Back holds summons outside the slam through the tick it lands ───────
// Summon AI runs before combat, so on the resolving tick a clock-based check let
// every summon on the rim take one chase step back under a Cave Troll's Ground
// Slam. Positions after a tick are the positions the slam resolved against.
{
  const { world, owner, minions, monster } = setup('step-back-slam');
  world.removeMonsterEntity(monster.isMonster.id);
  owner.usesAutocombat.auto = true;
  owner.tracksProgression.runesEquipped = [{ conditionId: 'inside-telegraph', actionId: 'step-back' }];
  const troll = world.createMonster(NODE, 'cave-troll', { x: 550, y: 400 })!;
  troll.hasHealth.hp = troll.hasHealth.maxHp = 1e9;

  let now = 2_000;
  let pending: { id: string; contains: (pos: { x: number; y: number }) => boolean } | null = null;
  let slamsResolved = 0;
  for (let i = 0; i < 400 && slamsResolved < 2; i++) {
    now += 100;
    world.tick(100, now);
    const zone = (world.groundZones.get(NODE) ?? []).find((z) => z.kind === 'slam-telegraph');
    if (pending && zone?.id !== pending.id) {
      const caught = minions().filter((m) => m && pending!.contains(m.hasPosition.current));
      assert(caught.length === 0, `Step Back summons stood under the slam as it landed: ${caught.length}`);
      slamsResolved++;
    }
    pending = zone ? { id: zone.id, contains: (pos) => geometryContains(zone.geometry, pos) } : null;
  }
  assert(slamsResolved === 2, `fixture: the troll should slam the formation twice, saw ${slamsResolved}`);
}

// ── Taunt Target draws the enemy onto the striking summon ────────────────────
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
function summonStep(oocSpeedPct: number, recalling = false): number {
  const { world, owner, minions } = setup(`haste-${oocSpeedPct}-${recalling}`);
  owner.usesSkills.passives['mobility.ooc-speed-pct'] = oocSpeedPct;
  if (recalling) applySummonerRecall(world, owner, 5_000);
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
assert(Math.abs(summonStep(0, true) / base - RECALL_SPEED_MULT) < 0.05, 'recalled summons sprint home');

// ── Recall brings the formation back to the owner and holds it there ─────────
{
  const { world, owner, minions } = setup('recall');
  let now = 2_000;
  const issuedAt = now;
  for (const [i, m] of minions().entries()) m.hasPosition.current = { x: 400 + 200 * Math.cos(i), y: 400 + 200 * Math.sin(i) };
  world.takeNodeEvents(NODE);
  applySummonerRecall(world, owner, now);
  assert(owner.hasSummonerCommand?.kind === 'recall', 'recall attaches the command');
  assert(world.takeNodeEvents(NODE).some((e) => e.kind === 'summons-recalled' && e.playerId === owner.isPlayer.id),
    'recall is called out to the node');
  while (now - issuedAt < RECALL_HOLD_MS - 100) {
    for (const m of minions()) driveMinion(world, m, owner, now);
    assert(minions().every((m) => !m.hasAttackTarget), 'recalled summons drop their targets');
    updateMovement(world, 100, now);
    now += 100;
    updateSummonerArchetype(world, 100, now);
  }
  assert(minions().every((m) => Math.hypot(
    m.hasPosition.current.x - recallSpot(owner, m).x,
    m.hasPosition.current.y - recallSpot(owner, m).y,
  ) <= 12), 'every summon ends at its spot around the owner');
  // Arriving does not release the formation: in melee it is home at once.
  assert(owner.hasSummonerCommand?.kind === 'recall', 'recall holds after the formation is home');
  updateSummonerArchetype(world, 100, issuedAt + RECALL_HOLD_MS);
  assert(!owner.hasSummonerCommand, 'recall releases after the hold');
}

// ── A recalled summon holds its spot but strikes back at melee in reach ──────
{
  const { world, owner, minions, monster } = setup('recall-defend');
  let now = 2_000;
  applySummonerRecall(world, owner, now);
  for (let i = 0; i < 10; i++) {
    for (const m of minions()) driveMinion(world, m, owner, now);
    updateMovement(world, 100, now);
    now += 100;
  }
  const home = minions()[0]!;
  const spot = { ...home.hasPosition.current };
  monster.hasPosition.current = { x: spot.x + 12, y: spot.y };
  monster.hasHealth.hp = monster.hasHealth.maxHp = 1_000_000;
  for (const m of minions()) m.performsAttack.lastAttackAt = 0;
  driveMinion(world, home, owner, now);
  assert(home.hasAttackTarget?.targetId === monster.isMonster.id, 'a home summon takes the enemy in its reach');
  assert(monster.hasHealth.hp < monster.hasHealth.maxHp, 'and strikes it');
  updateMovement(world, 100, now);
  assert(Math.hypot(home.hasPosition.current.x - spot.x, home.hasPosition.current.y - spot.y) <= 1,
    'without leaving its spot');

  monster.hasPosition.current = { x: spot.x + 150, y: spot.y };
  driveMinion(world, home, owner, now + 100);
  updateMovement(world, 100, now + 100);
  assert(!home.hasAttackTarget, 'an enemy out of reach is not chased during a recall');
  assert(Math.hypot(home.hasPosition.current.x - spot.x, home.hasPosition.current.y - spot.y) <= 1,
    'the summon stays home');
}

// ── Recall Summons rune calls itself out once, as it starts ──────────────────
{
  const { world, owner } = setup('rune-recall-callout');
  owner.usesAutocombat.auto = true;
  owner.tracksProgression.runesEquipped = [{ conditionId: 'hp-below-25', actionId: 'recall-summons' }];
  owner.hasHealth.hp = 100;
  world.takeNodeEvents(NODE);
  const callouts = () => world.takeNodeEvents(NODE).filter((e) => e.kind === 'summons-recalled').length;
  updateRuneDerivedConfig(world, 2_000);
  assert(getFlag(owner.tracksCombat, RUNE_RECALL_SUMMONS_FLAG), 'fixture: the rune recall is armed');
  assert(callouts() === 1, 'the rune recall is called out as it starts');
  updateRuneDerivedConfig(world, 2_100);
  assert(callouts() === 0, 'a held rune recall is not called out every tick');
}

// ── Recall Summons rune: situation-driven recall, Conduit only ───────────────
{
  assert(STARTER_RUNE_IDS.includes('recall-summons'), 'Recall Summons is a starter rune');
  assert(ACTION_DATABASE.get('recall-summons')?.cost === 1, 'Recall Summons costs 1 RP');
  const rule = { conditionId: 'target-casting', actionId: 'recall-summons' };
  const ctx: RuneContext = { hpPct: 1, inCombat: true, activelyEngaged: true, inParty: false, aggroCount: 1, combatArchetype: 'summoner' };
  assert(deriveAutoConfigFromRunes([rule], { ...ctx, enemyCharging: true }).recallSummons, 'a cast wind-up arms the recall');
  assert(!deriveAutoConfigFromRunes([rule], ctx).recallSummons, 'no wind-up, no recall');
  assert(!deriveAutoConfigFromRunes([rule], { ...ctx, enemyCharging: true, combatArchetype: 'cadence' }).recallSummons,
    'other classes cannot wire Recall Summons');

  // The flag drives the same behaviour as the R recall, for as long as it holds.
  const { world, owner, minions, monster } = setup('rune-recall');
  owner.usesAutocombat.auto = true;
  setFlag(owner.tracksCombat, RUNE_RECALL_SUMMONS_FLAG, true);
  let now = 2_000;
  const m0 = minions()[0]!;
  m0.hasPosition.current = { x: 700, y: 400 };
  setAggroTarget(world, monster, { id: owner.isPlayer.id, kind: 'player' }, now);
  for (let i = 0; i < 40; i++) {
    for (const m of minions()) driveMinion(world, m, owner, now);
    updateMovement(world, 100, now);
    now += 100;
  }
  assert(minions().every((m) => !m.hasAttackTarget), 'rune-recalled summons hold no target');
  const spot = recallSpot(owner, m0);
  assert(Math.hypot(m0.hasPosition.current.x - spot.x, m0.hasPosition.current.y - spot.y) <= 12,
    'rune-recalled summons stand at their spots');
  owner.usesAutocombat.auto = false;
  assert(!owner.hasSummonerCommand, 'the rune recall is not a lingering command');
}

// ── Class notes on shared runes show only for that class ─────────────────────
assert(runeActionArchetypeNote('taunt-current-target', 'summoner') !== null, 'Conduit sees the summon taunt note');
assert(runeActionArchetypeNote('step-back', 'summoner') !== null, 'Conduit sees the summon Step Back note');
assert(runeActionArchetypeNote('taunt-current-target', 'cadence') === null, 'other classes do not');

console.log('summonerRuneBehaviors: ok');
