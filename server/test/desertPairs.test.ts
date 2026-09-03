import {
  DAMAGE_DEALT_PCT_KEY,
  DAMAGE_TAKEN_PCT_KEY,
  GAME_CONFIG,
  MAX_DAMAGE_TAKEN_PCT,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  SUNDERED_EFFECT_ID,
  SUN_MARK_EFFECT_ID,
  applyStatusEffect,
  describeMonsterMechanics,
  emptyEquipment,
  getStatusEffect,
  playerIncomingDamageMult,
  playerOutgoingDamageMult,
  removeStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { PlayerEntity } from '../src/ecs/entity';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';
import { runMonsterAttack, runPlayerAttack, updateCombat } from '../src/systems/combat/engine/combat';
import { spawnPack } from '../src/systems/world/spawning';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

/** Strip every other mitigation layer so a damage delta can only be the amplifier. */
function isolate(player: PlayerEntity): void {
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0;
}

initCombatSystems();

{
  const scorpion = MONSTER_DATABASE.get('sand-scorpion');
  const sting = scorpion?.chargedAttack;
  assert(
    sting?.name === 'Numbing Sting' && sting.castMs === 500 && sting.cooldownMs === 4_000 && sting.initialCooldownMs === 500 &&
      sting.appliesSlow?.speedMult === 0.5 && sting.appliesSlow.durationMs === 4_000 &&
      scorpion?.slowEffect === undefined,
    'Sand Scorpion should trade its on-hit slow for a frequent, telegraphed Numbing Sting',
  );
}

{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('sting-target'), 'sting-target');
  const scorpion = world.createMonster(NODE, 'sand-scorpion', { x: 405, y: 400 });
  assert(scorpion, 'Sand Scorpion should spawn for Numbing Sting coverage');
  setAggroTarget(world, scorpion, { id: player.isPlayer.id, kind: 'player' }, 1_000);
  scorpion.hasAwareness.state = 'attacking';
  scorpion.performsAttack.lastAttackAt = 0;
  player.performsAttack.lastAttackAt = 3_000;

  // The first tick initializes the per-combat initial cooldown. It is armed half
  // a second into combat, then begins its cast at the first eligible basic-attack
  // opportunity instead of bypassing the ordinary attack cadence.
  updateCombat(world, 0, 1_000);
  updateCombat(world, 0, 2_400);
  assert(
    world.takeNodeEvents(NODE).some((event) => event.kind === 'monster-cast-start' && event.label === 'Numbing Sting' && event.castMs === 500),
    'Numbing Sting should telegraph its short cast before applying control',
  );
  updateCombat(world, 0, 2_900);
  const slow = getStatusEffect(player.tracksCombat, 'slow');
  assert(
    slow?.data.speedMult === 0.5 && slow.data.totalMs === 4_000,
    'Numbing Sting should apply its authored longer 50% slow when the cast lands',
  );
}

// ── P3: the pure helpers sum across stacks and clamp at their caps ───────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('amp-helpers'), 'amp-helpers');
  const cs = player.tracksCombat;

  assert(playerIncomingDamageMult(cs) === 1, 'an unafflicted player takes unmodified damage');
  assert(playerOutgoingDamageMult(cs) === 1, 'an unbuffed player deals unmodified damage');

  applyStatusEffect(cs, {
    id: SUNDERED_EFFECT_ID,
    maxStacks: 4,
    remainingMs: 4_000,
    refreshable: true,
    sourceId: 'test',
    data: { [DAMAGE_TAKEN_PCT_KEY]: 0.1, totalMs: 4_000 },
  });
  assert(
    Math.abs(playerIncomingDamageMult(cs) - 1.1) < 1e-9,
    'one stack should read as its authored per-stack fraction',
  );

  for (let i = 0; i < 3; i++) {
    applyStatusEffect(cs, {
      id: SUNDERED_EFFECT_ID,
      maxStacks: 4,
      remainingMs: 4_000,
      refreshable: true,
      sourceId: 'test',
      data: { [DAMAGE_TAKEN_PCT_KEY]: 0.1, totalMs: 4_000 },
    });
  }
  assert(
    Math.abs(playerIncomingDamageMult(cs) - 1.4) < 1e-9,
    'stacks should sum, and stop at the authored maxStacks',
  );

  // Any status carrying the key contributes — that genericity is what lets one
  // Volcano heat effect drive both dimensions at once in Session 5.
  applyStatusEffect(cs, {
    id: 'test-second-source',
    maxStacks: 1,
    remainingMs: 4_000,
    refreshable: true,
    sourceId: 'test',
    data: { [DAMAGE_TAKEN_PCT_KEY]: 5.0, totalMs: 4_000 },
  });
  assert(
    playerIncomingDamageMult(cs) === 1 + MAX_DAMAGE_TAKEN_PCT,
    'the summed incoming amplifier must clamp at MAX_DAMAGE_TAKEN_PCT',
  );

  removeStatusEffect(cs, SUNDERED_EFFECT_ID);
  removeStatusEffect(cs, 'test-second-source');
  assert(playerIncomingDamageMult(cs) === 1, 'cleansing the debuffs restores the baseline');
}

// ── P3 incoming: a sundered player takes more from a real monster hit, and the
//    damage-cap still clips the amplified spike (listener order is load-bearing).
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('amp-incoming'), 'amp-incoming');
  isolate(player);
  const monster = world.createMonster(NODE, 'plains-slime', { x: 410, y: 400 });
  assert(!!monster, 'test needs a monster');

  const hpBefore = player.hasHealth.hp;
  runMonsterAttack(world, monster!, player, 1_000);
  const baseline = hpBefore - player.hasHealth.hp;
  assert(baseline > 0, 'the baseline monster hit should deal damage');

  applyStatusEffect(player.tracksCombat, {
    id: SUNDERED_EFFECT_ID,
    maxStacks: 4,
    remainingMs: 10_000,
    refreshable: true,
    sourceId: monster!.isMonster.id,
    data: { [DAMAGE_TAKEN_PCT_KEY]: 0.5, totalMs: 10_000 },
  });
  const hpMid = player.hasHealth.hp;
  runMonsterAttack(world, monster!, player, 2_000);
  const amplified = hpMid - player.hasHealth.hp;
  assert(
    amplified > baseline,
    `sundering should raise incoming damage (${amplified} <= ${baseline})`,
  );

  // The amplifier must land BEFORE the damage cap: a capped build still clips the
  // spike. Registering it after the cap would walk a stacking vulnerability
  // straight through the one layer that answers spikes.
  //
  // `defense.max-hit-mult` is what actually reduces the excess (it defaults to 1,
  // i.e. no reduction); 0 makes the cap a hard clip at the threshold, which is what
  // turns this into an ORDER assertion — clipped-then-amplified would read as
  // `amplified`, amplified-then-clipped reads as the threshold.
  player.usesSkills.passives['defense.max-hit-pct'] = baseline / player.hasHealth.maxHp;
  player.usesSkills.passives['defense.max-hit-mult'] = 0;
  const hpCapped = player.hasHealth.hp;
  runMonsterAttack(world, monster!, player, 3_000);
  const capped = hpCapped - player.hasHealth.hp;
  assert(
    capped <= baseline,
    `the damage cap must clip the AMPLIFIED hit (${capped} > ${baseline})`,
  );
  assert(
    capped < amplified,
    `the cap must run AFTER the amplifier (${capped} == ${amplified} means it ran before)`,
  );
}

// ── P3 outgoing: the Volcano seam. No authored consumer until Session 5, so the
//    test drives it with a synthetic status carrying the key.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('amp-outgoing'), 'amp-outgoing');
  player.dealsDamage.attack = 200;
  const first = world.createMonster(NODE, 'stone-basilisk', { x: 420, y: 400 });
  const second = world.createMonster(NODE, 'stone-basilisk', { x: 440, y: 400 });
  assert(!!first && !!second, 'test needs two identical monsters');

  const beforeBaseline = first!.hasHealth.hp;
  runPlayerAttack(world, player, first!, 1_000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  const baseline = beforeBaseline - first!.hasHealth.hp;
  assert(baseline > 0, 'the baseline player attack should deal damage');

  applyStatusEffect(player.tracksCombat, {
    id: 'test-heat',
    maxStacks: 1,
    remainingMs: 10_000,
    refreshable: true,
    sourceId: 'test',
    data: { [DAMAGE_DEALT_PCT_KEY]: 0.25, totalMs: 10_000 },
  });
  assert(
    Math.abs(playerOutgoingDamageMult(player.tracksCombat) - 1.25) < 1e-9,
    'the outgoing helper should read the status',
  );

  const beforeAmplified = second!.hasHealth.hp;
  runPlayerAttack(world, player, second!, 2_000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  const amplified = beforeAmplified - second!.hasHealth.hp;
  assert(
    amplified > baseline,
    `the outgoing amplifier should raise player damage (${amplified} <= ${baseline})`,
  );
}

// ── appliesVulnerability: a desert controller stacks the debuff on hit, and the
//    buff bar projects it.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('sunder-target'), 'sunder-target');
  isolate(player);
  const controller = world.createMonster(NODE, 'desert-basilisk', { x: 410, y: 400 });
  assert(!!controller, 'desert-basilisk should spawn');
  const spec = MONSTER_DATABASE.get('desert-basilisk')?.appliesVulnerability;
  assert(!!spec, 'the T3 desert controller should author appliesVulnerability');

  assert(
    getStatusEffect(player.tracksCombat, SUNDERED_EFFECT_ID) === undefined,
    'the player should start unsundered',
  );

  runMonsterAttack(world, controller!, player, 1_000);
  const applied = getStatusEffect(player.tracksCombat, SUNDERED_EFFECT_ID);
  assert(!!applied, 'a controller hit should sunder the player');
  assert(
    applied!.data[DAMAGE_TAKEN_PCT_KEY] === spec!.damageTakenPct,
    'the status should carry the authored per-stack fraction',
  );
  assert(
    (applied!.data['totalMs'] ?? 0) > 0,
    'the status must store totalMs so the buff-UI clock has a denominator',
  );

  for (let i = 0; i < spec!.maxStacks + 3; i++) {
    runMonsterAttack(world, controller!, player, 2_000 + i * 1_000);
  }
  assert(
    getStatusEffect(player.tracksCombat, SUNDERED_EFFECT_ID)!.stacks === spec!.maxStacks,
    'sundering must stop at its authored maxStacks',
  );

  syncPlayerBuffs(world, 10_000);
  const tile = player.hasStatus.activeBuffs.find((buff) => buff.id === 'debuff-sundered');
  assert(!!tile, 'the buff bar should project a SUNDERED tile');
  assert(tile!.durationPct >= 0, 'the tile should carry a running duration clock');

  assert(
    describeMonsterMechanics(MONSTER_DATABASE.get('desert-basilisk')!).some(
      (line) => line.id === 'sunder',
    ),
    'the bestiary should describe the sunder',
  );
}

// ── Desert pairs: controllers are alphas that pull their dealers, and no trash
//    mob carries Sun Mark any more.
{
  const world = new World();
  const pairs: [string, string][] = [
    ['stone-basilisk', 'dust-djinn'],
    ['desert-basilisk', 'sandweaver'],
    ['dune-basilisk', 'sandspitter-cobra'],
    ['dune-tyrant', 'sandspitter-cobra'],
  ];

  for (const [controllerId, dealerId] of pairs) {
    const controller = MONSTER_DATABASE.get(controllerId);
    const dealer = MONSTER_DATABASE.get(dealerId);
    assert(!!controller && !!dealer, `${controllerId}/${dealerId} should exist`);
    assert(controller!.pack?.role === 'alpha', `${controllerId} should be a pack alpha`);
    assert(
      (controller!.pack!.followers ?? []).some((group) => group.typeId === dealerId),
      `${controllerId} should spawn ${dealerId} as its dealer`,
    );
    assert(dealer!.pack?.role === 'follower', `${dealerId} should be a pack follower`);
    assert(dealer!.behavior === 'kiter', `${dealerId} should kite — that is the pair's threat`);
    assert(
      controller!.stats.hp > dealer!.stats.hp && controller!.stats.attack < dealer!.stats.attack,
      `${controllerId} should out-HP and under-damage its dealer`,
    );
  }

  // EXACT 1:1 DUO (T1-T4 monster rework, locked): a controller pulls ONE dealer,
  // never two. "It is exactly two things - which do I kill first?" is the biome's
  // whole read, and a third body turns a priority test into a pile.
  const members = spawnPack(world, NODE, 'desert-basilisk', { x: 400, y: 400 });
  assert(!!members && members.length === 2, 'a controller should pull exactly one dealer');
  const packId = members![0]!.inPack?.packId;
  assert(!!packId, 'the alpha should carry the shared pack link');
  assert(
    members!.every((member) => member.inPack?.packId === packId),
    'every pack member should share one packId',
  );
  assert(
    members!.filter((member) => member.inPack?.role === 'follower').length === 1,
    'the single dealer should be tagged as the follower',
  );

  // Every controller in the roster pulls exactly one dealer, at every tier.
  for (const [controllerId] of pairs) {
    const followers = MONSTER_DATABASE.get(controllerId)!.pack!.followers ?? [];
    const total = followers.reduce((sum, group) => sum + group.count, 0);
    assert(total === 1, `${controllerId} should pull exactly 1 dealer, not ${total}`);
  }

  for (const [, def] of MONSTER_DATABASE) {
    if (def.biome !== 'desert' || def.isBoss) continue;
    assert(!def.appliesMark, `${def.id}: Sun Mark was stripped from desert trash`);
    assert(!def.markedStrike, `${def.id}: the mark finisher was stripped from desert trash`);
  }
}

// ── The T2 Emperor now paints its own mark. It must ALTERNATE (paint, cash,
//    paint, cash) rather than perma-amplify off a mark it refreshes every hit.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices('emperor-duel'), 'emperor-duel');
  isolate(player);
  const emperor = world.createMonster(NODE, 'dune-stalker-emperor', { x: 410, y: 400 });
  assert(!!emperor, 'the T2 desert boss should spawn');
  const def = MONSTER_DATABASE.get('dune-stalker-emperor')!;
  assert(!!def.appliesMark && !!def.markedStrike, 'the Emperor should both paint and cash');

  const marked: boolean[] = [];
  for (let i = 0; i < 4; i++) {
    runMonsterAttack(world, emperor!, player, 10_000 + i * 5_000);
    marked.push(getStatusEffect(player.tracksCombat, SUN_MARK_EFFECT_ID) !== undefined);
  }
  assert(
    marked[0] === true && marked[1] === false && marked[2] === true && marked[3] === false,
    `the self-mark should alternate, got ${JSON.stringify(marked)}`,
  );
}

console.log('desertPairs: ok');
