// TRENCH TEACHING MONSTERS + the generic monster-ability primitive.
//
// REWRITTEN 2026-09-04 (boss encounter redesign §5.9). This file used to validate a
// three-ability rotation on each Trench elite. That rotation is gone: these three are
// TEACHING monsters, each existing to teach one piece of the Elder Serpent before you
// meet it, and a monster with four abilities teaches nothing because the player cannot
// tell which beat is the lesson.
//
// The generic `monsterAbilities` machinery it exercised is still very much alive — it
// just happened to use Trench elites as its fixtures. Those tests are re-anchored onto
// surviving consumers rather than deleted, because the primitive is what mattered.

import {
  MONSTER_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateCombat } from '../src/systems/combat/engine/combat';
import {
  chargedCastEndsAt,
  monsterAbilityCastEndsAt,
} from '../src/systems/combat/engine/monsterMechanics';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-t4-trench-01';

function playerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 405, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      equippedAbilities: { technique: null, guard: null }, knownStances: [],
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

/** Stand a monster next to a player with exactly one ability off cooldown. */
function prepareMonster(world: World, monsterTypeId: string, abilityId: string, nodeId = NODE) {
  const player = world.attachPlayerEntity(playerSlices(`${abilityId}-target`), `${abilityId}-target`);
  player.hasPosition.nodeId = nodeId;
  const monster = world.createMonster(nodeId, monsterTypeId, { x: 400, y: 400 })!;
  assert(!!monster, `${monsterTypeId} should spawn`);
  setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';

  const abilities = MONSTER_DATABASE.get(monsterTypeId)!.monsterAbilities!;
  // Arm exactly the ability under test and park the rest, so the assertion does not
  // depend on the authored initial-cooldown ordering.
  for (const ability of abilities) {
    monster.tracksCombat.counters[`monsterAbilitySession:${ability.id}`] = 1_000;
    monster.tracksCombat.counters[`monsterAbilityCdNext:${ability.id}`] =
      ability.id === abilityId ? 0 : Number.MAX_SAFE_INTEGER;
  }
  return { player, monster };
}

initCombatSystems();

// ─────────────────────────────────────────────────────────────────────────────
// The stripped Trench: one lesson each.
// ─────────────────────────────────────────────────────────────────────────────

// The Abyssal Serpent teaches the WOUND, and does nothing else.
{
  const def = MONSTER_DATABASE.get('abyssal-serpent')!;
  assert(
    (def.monsterAbilities?.length ?? 0) === 0,
    'the Serpent should carry no secondary rotation — the bite is the lesson',
  );
  const bite = def.chargedAttack;
  assert(!!bite, 'the Serpent should keep its telegraphed bite');
  assert(
    (bite.appliesAntiheal?.reduction ?? 0) > 0,
    'and the bite is what carries the anti-heal Wound',
  );
  assert(def.chargeOnAggro === undefined, 'the aggro speed burst is gone');
}

// The Hadal Stalker teaches STANDOFF — and must stay catchable, which is exactly
// what the three stacking slows it used to carry were quietly undoing.
{
  const def = MONSTER_DATABASE.get('hadal-stalker')!;
  assert(
    (def.monsterAbilities?.length ?? 0) === 0,
    'the Stalker should carry no secondary rotation',
  );
  assert(def.behavior === 'kiter', 'it should be a real kiter');
  assert(
    def.stats.speed < GAME_CONFIG.PLAYER_SPEED,
    'and slower than the player, so a chasing build ALWAYS catches it',
  );
  const lance = def.chargedAttack;
  assert(!!lance, 'the Stalker should keep its telegraphed Lance');
  assert(
    (lance.appliesSlow?.speedMult ?? 1) < 1,
    'the standoff rider belongs on the one readable beat',
  );
}

// The Elder Leviathan teaches the COMMITTED BITE, keeping only its carapace —
// §5.9 explicitly permits "an uncomplicated visible carapace".
{
  const def = MONSTER_DATABASE.get('elder-leviathan')!;
  const abilities = def.monsterAbilities ?? [];
  assert(abilities.length === 1, 'the Leviathan should keep exactly one ability');
  assert(abilities[0].id === 'carapace-renewal', 'and it should be the carapace');
  assert(
    abilities[0].actions.every(action => action.type === 'shield'),
    'the carapace is a defensive window, not a second attack',
  );
  assert(!!def.chargedAttack?.aoe, 'Devour remains its one enormous committed bite');
}

// ─────────────────────────────────────────────────────────────────────────────
// The generic ability primitive, on surviving consumers.
// ─────────────────────────────────────────────────────────────────────────────

// A player-targeted `hit` ability: visible cast, real damage through the pipeline,
// and a recurring cooldown. Anchored on the Rime-Tusk Mastodon, whose Frost-Tusk
// Impact is now the roster's reference for this shape.
{
  const world = new World();
  const { player, monster } = prepareMonster(
    world, 'rime-tusk-mastodon', 'frost-tusk-impact', 'node-t4-tundra-01',
  );
  const ability = MONSTER_DATABASE.get('rime-tusk-mastodon')!.monsterAbilities!
    .find(candidate => candidate.id === 'frost-tusk-impact')!;

  updateCombat(world, 0, 2_000);
  assert(
    world.takeNodeEvents('node-t4-tundra-01').some(
      event => event.kind === 'monster-cast-start' && event.label === ability.name,
    ),
    `${ability.name} should start a visible cast`,
  );

  const hpBefore = player.hasHealth.hp;
  updateCombat(world, 0, 2_000 + ability.castMs);
  assert(
    world.takeNodeEvents('node-t4-tundra-01').some(
      event => event.kind === 'monster-cast-end' && event.fired && event.fx === ability.fx,
    ),
    `${ability.name} should publish its resolve cue`,
  );
  assert(player.hasHealth.hp < hpBefore, `${ability.name} should deal damage`);
  assert(
    monster.tracksCombat.counters['monsterAbilityCdNext:frost-tusk-impact'] >
      2_000 + ability.castMs,
    `${ability.name} should enter its recurring cooldown`,
  );
}

// A self-targeted `shield` ability resolves without needing a player in range.
{
  const world = new World();
  const { monster } = prepareMonster(world, 'elder-leviathan', 'carapace-renewal');
  const ability = MONSTER_DATABASE.get('elder-leviathan')!.monsterAbilities!
    .find(candidate => candidate.id === 'carapace-renewal')!;
  updateCombat(world, 0, 2_000);
  updateCombat(world, 0, 2_000 + ability.castMs);
  assert(
    getStatusEffect(monster.tracksCombat, 'elder-carapace-renewal') !== undefined,
    `${ability.name} should apply its self effect`,
  );
}

// A cast COSTS the swing it replaced: a self-only beat touches no attack, so without
// an explicit stamp it would resolve and immediately swing for free.
{
  const world = new World();
  const { monster } = prepareMonster(world, 'elder-leviathan', 'carapace-renewal');
  const ability = MONSTER_DATABASE.get('elder-leviathan')!.monsterAbilities!
    .find(candidate => candidate.id === 'carapace-renewal')!;
  updateCombat(world, 0, 2_000);
  updateCombat(world, 0, 2_000 + ability.castMs);
  assert(
    monster.performsAttack.lastAttackAt === 2_000 + ability.castMs,
    'a self-only ability should advance the attack timer instead of casting for free',
  );
}

// ONE CAST PER MONSTER. `publishGroundZone` clears telegraphs by ownerId and the
// client's cast bar is keyed by monster id, so a generic ability starting on top of a
// live charged wind-up would erase the charged attack's committed circle and steal its
// cast bar — leaving the big hit to land unannounced. The Leviathan still pairs
// `monsterAbilities` with a `chargedAttack`, so it remains the fixture for this.
{
  const world = new World();
  const { monster } = prepareMonster(world, 'elder-leviathan', 'carapace-renewal');
  monster.tracksCombat.counters['monsterAbilityCdNext:carapace-renewal'] = Number.MAX_SAFE_INTEGER;
  monster.tracksCombat.counters['chargeSession'] = 1_000;
  monster.tracksCombat.counters['chargeCdNextAt'] = 0;
  monster.performsAttack.lastAttackAt = 0;

  let now = 2_000;
  while (chargedCastEndsAt(monster) === 0 && now < 12_000) {
    now += 100;
    updateCombat(world, 100, now);
  }
  assert(chargedCastEndsAt(monster) > 0, 'Devour should begin winding up');
  const chargedEndsAt = chargedCastEndsAt(monster);
  monster.tracksCombat.counters['monsterAbilityCdNext:carapace-renewal'] = 0;

  while (now < chargedEndsAt) {
    now += 100;
    updateCombat(world, 100, now);
    assert(
      monsterAbilityCastEndsAt(monster) === 0,
      'a generic ability must not begin while a charged attack is winding up',
    );
  }

  // Once Devour is done the queued ability is free to take its turn.
  let started = false;
  for (let i = 0; i < 20 && !started; i++) {
    now += 100;
    updateCombat(world, 100, now);
    started = monsterAbilityCastEndsAt(monster) > 0;
  }
  assert(started, 'the ability should cast once the charged attack has resolved');
}

console.log('trenchMonsterAbilities.test.ts: ok');
