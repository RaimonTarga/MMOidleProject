// Boss2 readiness: a CONCEALED boss must not read as a DISAPPEARED one.
//
// Two of the six bosses Boss2 screens hide themselves mid-fight -- the Cave
// Dreadbore burrows, the Jungle Dread-Gorger stalks unseen. That is temporary
// untargetability, and the boss screen's terminal classifier exists precisely to
// catch a boss that is GONE:
//
//     if (bossSeen && !bossPresent) -> 'boss-vanished-no-kill' | 'encounter-reset'
//
// `bossScreen.ts` sets `bossPresent` by looking for the boss in
// `world.monsterEntitiesInNode(...)`. If concealment removed the body from that
// query, every Dreadbore and Gorger fight would terminate falsely the first time
// the boss went under -- 12 of the 36 rows, reported as a mechanic the runner
// cannot explain rather than as a fight.
//
// It does not: concealment attaches an `isConcealed` COMPONENT to a body that stays
// in the node. This test holds that, because it is the assumption the screen rests
// on and it is invisible from the outcome table.
//
// `bossConcealmentPhase4.test.ts` already covers the mechanic itself -- that hiding
// leaves every target list, and that it always clears. This is only the screen-level
// linkage, not a second AI audit.

import { GAME_CONFIG, MONSTER_DATABASE, STARTER_RUNE_IDS, emptyEquipment } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { classifyBossTick } from '../bench/balance/bossTerminal';
import { BOSS2_BOSSES } from '../bench/balance/boss2Spec';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

// Mid-node, so the Jungle escape has the 400px of room its retreat is gated on.
const PLAYER_AT = { x: 2_400, y: 2_400 };
const BOSS_AT = { x: 2_440, y: 2_400 };

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { ...PLAYER_AT }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null }, knownStances: [],
      equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

/** Exactly how `bossScreen.ts` decides the boss is still there. */
const bossPresent = (world: World, bossId: string): boolean => {
  for (const m of world.monsterEntitiesInNode(NODE)) {
    if (m.isMonster.monsterTypeId === bossId) return true;
  }
  return false;
};

// -- The two concealing bosses stay PRESENT while hidden.
{
  const concealers = BOSS2_BOSSES.filter((b) => b.conceals).map((b) => b.bossId);
  assert(concealers.length === 2, `expected two concealing T2 bosses, got ${concealers.length}`);

  for (const bossId of concealers) {
    const world = new World();
    world.attachPlayerEntity(playerSlices('conceal-witness'), 'conceal-witness');
    const monster = world.createMonster(NODE, bossId, { ...BOSS_AT })!;
    assert(!!monster, `${bossId} should spawn`);
    const pattern = MONSTER_DATABASE.get(bossId)!.bossPattern!;
    setAggroTarget(world, monster, { id: 'conceal-witness', kind: 'player' }, 1_000);
    monster.hasAwareness.state = 'attacking';
    const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
    monster.performsAttack.lastAttackAt = armedAt - monster.performsAttack.attackCooldown;

    assert(bossPresent(world, bossId), `${bossId}: setup — the boss should be present before it hides`);

    // Driven with full world ticks, not `updateBossPatterns` alone: the Jungle
    // escape conceals only once its distance-gated retreat has actually travelled,
    // and travel needs movement to run.
    let now = armedAt;
    updateBossPatterns(world, 100, now);
    for (let i = 0; i < 600 && monster.isConcealed === undefined; i++) {
      world.tick(100, now);
      now += 100;
      // THE claim, checked on every tick of the approach as well as the hidden
      // window: the body never leaves the node query.
      assert(bossPresent(world, bossId), `${bossId}: the boss left the node query at ${now} ms`);
    }
    assert(monster.isConcealed !== undefined, `${bossId}: setup — the pattern should conceal it`);

    // While concealed: still present, still alive, still at full HP.
    assert(bossPresent(world, bossId), `${bossId}: a CONCEALED boss must still be present`);
    assert(monster.hasHealth.hp > 0, `${bossId}: concealment is not death`);

    // Which is what keeps the screen's classifier from inventing a terminal.
    const verdict = classifyBossTick({
      bossKillEvent: false, playerDead: false,
      bossPresent: bossPresent(world, bossId),
      dungeonReset: false, bossSeen: true,
    });
    assert(verdict === null,
      `${bossId}: a concealed boss must not terminate the fight, got ${verdict}`);

    // And it surfaces, so the window is bounded rather than a permanent hole.
    for (let i = 0; i < 600 && monster.isConcealed !== undefined; i++) {
      world.tick(100, now);
      now += 100;
      assert(bossPresent(world, bossId), `${bossId}: the boss left the node query while surfacing`);
    }
    assert(monster.isConcealed === undefined, `${bossId}: the boss must surface again`);
  }
}

// -- The classifier still catches a boss that is GENUINELY gone. Without this, the
//    test above would pass just as well on a classifier that never terminates.
{
  assert(
    classifyBossTick({ bossKillEvent: false, playerDead: false, bossPresent: false, dungeonReset: false, bossSeen: true })
      === 'boss-vanished-no-kill',
    'a real disappearance must still be caught',
  );
  assert(
    classifyBossTick({ bossKillEvent: false, playerDead: false, bossPresent: false, dungeonReset: true, bossSeen: true })
      === 'encounter-reset',
    'a reset must still be caught',
  );
  assert(
    classifyBossTick({ bossKillEvent: false, playerDead: true, bossPresent: false, dungeonReset: true, bossSeen: true })
      === 'bot-died',
    'a wipe must still outrank the boss going missing',
  );
}

// -- The non-concealing four declare no concealment, so no row of theirs can be
//    explained away as a burrow after the fact.
{
  for (const b of BOSS2_BOSSES.filter((x) => !x.conceals)) {
    const steps = (MONSTER_DATABASE.get(b.bossId) as { bossPattern?: { steps: { kind: string }[] } }).bossPattern?.steps ?? [];
    assert(!steps.some((s) => s.kind === 'conceal'), `${b.name}: declares no concealment but its pattern conceals`);
  }
}

console.log('boss2Concealment: ok');
