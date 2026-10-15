// Runtime regressions for the ACTIVE mechanics that were missing Relic
// Buff/Debuff Effect coverage: Grand Ritual, Harrier Brood, Withering Chorus,
// the Winter Warden Frozen payoff (Berserker
// Rampage's block went with the cadence T3 paths, CS7). Each block compares an otherwise identical build at secondary
// relic rating 0 vs +25%, using the real runtime call sites (not a
// reimplementation of the formula).
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
  resolveRelicPreview,
  SCALABLE_MECHANIC_DEBUFFS,
  scaleMechanicEffectConfig,
  SUMMONER_SPECIALIZATION_TUNING,
  ZERO_RELIC_RATINGS,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { attachComponent } from '../src/ecs/markerHelpers';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import {
  commitSpecializationAttack,
  prepareSpecializationAttack,
  tickSummonerSpecializations,
} from '../src/systems/classes/archetypes/summoner/specs';
import { FROZEN_EFFECT } from '../src/systems/classes/archetypes/dot/t3/core/constants';

initCombatSystems();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function close(actual: number, expected: number, message: string, epsilon = 1e-6): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: got ${actual}, expected ${expected}`);
  }
}

let serial = 0;

// ── Summoner fixtures (mirrors summonerSpecializations.test.ts) ─────────────

type Frame = 'light' | 'balanced' | 'heavy';
const SPEC_FRAME: Record<string, Frame> = {
  'summoner-light-t3-a': 'light',       // harrier-brood
  'summoner-balanced-t3-a': 'balanced', // coordinated-hunt (control: must stay untouched)
  'summoner-balanced-t3-b': 'balanced', // withering-chorus
  'summoner-balanced-t3-c': 'balanced', // grand-ritual
};

function summonerSlices(id: string, specId: string): PersistedPlayerSlices {
  const frame = SPEC_FRAME[specId]!;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 10_000, maxHp: 10_000, recovery: 5 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 4,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: ['summoner-root', `summoner-${frame}`, 'summoner-range-mid', specId],
      passives: {}, selectedClass: 'summoner-root', selectedSubVariant: frame,
      selectedRange: 'summoner-range-mid', combatArchetype: 'summoner',
    },
  } as unknown as PersistedPlayerSlices;
}

function attachSummoner(specId: string, debuffEffect = 0, buffEffect = 0) {
  const id = `summ-${serial++}`;
  const world = new World();
  const player = world.attachPlayerEntity(summonerSlices(id, specId), id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  updateSummonerArchetype(world, 0, 1_000);
  if (debuffEffect !== 0) player.usesSkills.passives['relic.mechanic-debuff-effect'] = debuffEffect;
  if (buffEffect !== 0) player.usesSkills.passives['relic.mechanic-buff-effect'] = buffEffect;
  return { world, player };
}

function durableTarget(world: World, x = 520, y = 400) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x, y });
  assert(target !== null, 'test target must exist in the monster database');
  target.hasHealth.hp = target.hasHealth.maxHp = 10_000_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  return target;
}

function minions(world: World, player: ReturnType<typeof attachSummoner>['player']) {
  return player.summonsMinions!.minionIds.map((id) => world.getMinionEntity(id)!).filter(Boolean);
}

// ── Non-summoner (dot) fixture (mirrors coreRelicIntegration.test.ts) ─

function fixture(archetype: 'dot') {
  const id = `mech-${serial++}`;
  const world = new World();
  const slices: PersistedPlayerSlices = {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1000, maxHp: 1000, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [`${archetype}-root`, `${archetype}-balanced`],
      passives: {}, selectedClass: `${archetype}-root`,
      selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: archetype,
    },
  } as unknown as PersistedPlayerSlices;
  const player = world.attachPlayerEntity(slices, id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  return { world, player };
}

function nonSummonerTarget(world: World) {
  const target = world.createMonster('node-clearing', 'plains-slime', { x: 410, y: 400 });
  assert(target !== null, 'test target must exist in the monster database');
  target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  return target;
}

const hit = (world: World, player: ReturnType<typeof fixture>['player'], target: ReturnType<typeof nonSummonerTarget>, now: number) =>
  runPlayerAttack(world, player, target, now, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });

// ── 1/2. Grand Ritual — buff effect scales the empowered-attack multiplier only ──
{
  const base = attachSummoner('summoner-balanced-t3-c');
  const boosted = attachSummoner('summoner-balanced-t3-c', 0, 0.25);
  for (const { world, player } of [base, boosted]) updateSummonerArchetype(world, 0, 11_000);

  const baseTarget = durableTarget(base.world);
  const boostedTarget = durableTarget(boosted.world);
  const preparedBase = prepareSpecializationAttack(
    base.world, base.player as any, minions(base.world, base.player)[0]!, baseTarget, 11_100,
    { completed: false, serial: 0 },
  );
  const preparedBoosted = prepareSpecializationAttack(
    boosted.world, boosted.player as any, minions(boosted.world, boosted.player)[0]!, boostedTarget, 11_100,
    { completed: false, serial: 0 },
  );
  close(preparedBase.damageMult, 1.6, 'Grand Ritual baseline empowered multiplier');
  close(preparedBoosted.damageMult, 1.75, '+25% Buff Effect: 1.6x -> 1.75x is bonus-only scaling, not 1.6*1.25');

  // Interval and per-slot charge grant are untouched by the relic.
  close(base.player.controlsSummons!.ritualNextAt, boosted.player.controlsSummons!.ritualNextAt,
    'Grand Ritual interval must not scale with Buff Effect');
  const baseCharges = base.player.summonsMinions!.ritualCharges!;
  const boostedCharges = boosted.player.summonsMinions!.ritualCharges!;
  assert(baseCharges.every((c, i) => c === boostedCharges[i]), 'Grand Ritual charge grants must not scale with Buff Effect');

  // Preview parity.
  const preview = resolveRelicPreview('summoner', boosted.player.usesSkills.passives,
    { ...ZERO_RELIC_RATINGS, buffEffect: 0.25 }, { subVariant: 'balanced', unlockedSkills: ['summoner-balanced-t3-c'] });
  const line = preview?.secondaryEffects?.find((e) => e.label === 'Grand Ritual empowered damage');
  assert(line !== undefined, 'preview must surface a Grand Ritual buff line');
  close(line!.before, 1.6, 'preview before must match authored tuning');
  close(line!.after, preparedBoosted.damageMult, 'preview after must match the runtime-scaled magnitude');
}

// ── 3/4. Harrier Brood — debuff effect scales the per-mark magnitude only ───────
{
  const base = attachSummoner('summoner-light-t3-a');
  const boosted = attachSummoner('summoner-light-t3-a', 0.25);

  const baseTarget = durableTarget(base.world);
  const boostedTarget = durableTarget(boosted.world);
  base.player.controlsSummons!.harrierMarksByTarget[baseTarget.isMonster.id] = { slotIds: ['a', 'b', 'c'], expiresAt: 100_000 };
  boosted.player.controlsSummons!.harrierMarksByTarget[boostedTarget.isMonster.id] = { slotIds: ['a', 'b', 'c'], expiresAt: 100_000 };
  const preparedBase = prepareSpecializationAttack(
    base.world, base.player as any, minions(base.world, base.player)[0]!, baseTarget, 1_000, { completed: false, serial: 0 },
  );
  const preparedBoosted = prepareSpecializationAttack(
    boosted.world, boosted.player as any, minions(boosted.world, boosted.player)[0]!, boostedTarget, 1_000, { completed: false, serial: 0 },
  );
  close(preparedBase.damageMult, 1 + 3 * 0.035, 'Harrier baseline: three marks at 3.5% each');
  close(preparedBoosted.damageMult, 1 + 3 * 0.04375, '+25% Debuff Effect: 3.5% -> 4.375% per mark');

  // Mark duration and mark count are unaffected by the relic (real commit path).
  const durationTargetBase = durableTarget(base.world, 700, 400);
  const durationTargetBoosted = durableTarget(boosted.world, 700, 400);
  for (const [{ world, player }, target] of [[base, durationTargetBase], [boosted, durationTargetBoosted]] as const) {
    const minion = minions(world, player)[0]!;
    const prepared = prepareSpecializationAttack(world, player as any, minion, target, 5_000, { completed: false, serial: 0 });
    commitSpecializationAttack(world, player as any, minion, target, 5_000, prepared);
    const state = player.controlsSummons!.harrierMarksByTarget[target.isMonster.id]!;
    close(state.expiresAt - 5_000, SUMMONER_SPECIALIZATION_TUNING.harrierBrood.durationMs, 'Harrier mark duration must not scale with the relic');
    assert(state.slotIds.length === 1, 'Harrier mark count must not scale with the relic');
  }

  // Preview parity.
  const preview = resolveRelicPreview('summoner', {}, { ...ZERO_RELIC_RATINGS, debuffEffect: 0.25 },
    { subVariant: 'light', unlockedSkills: ['summoner-light-t3-a'] });
  const line = preview?.secondaryEffects?.find((e) => e.label === 'Harrier damage taken per mark');
  assert(line !== undefined, 'preview must surface a Harrier debuff line');
  close(line!.before, 0.035, 'preview before must match authored tuning');
  close(line!.after, 0.04375, 'preview after must match the runtime-scaled per-mark magnitude');
}

// ── 5/6. Withering Chorus — debuff effect scales damage-per-voice only ──────────
{
  const base = attachSummoner('summoner-balanced-t3-b');
  const boosted = attachSummoner('summoner-balanced-t3-b', 0.25);
  // A multiple of 800 keeps 4.5%/voice and 5.625%/voice both exact integers,
  // so Math.round in applyPlayerProcDamage cannot distort the measured ratio.
  base.player.dealsDamage!.attack = 8_000;
  boosted.player.dealsDamage!.attack = 8_000;

  function oneVoiceTick(side: ReturnType<typeof attachSummoner>) {
    const target = durableTarget(side.world);
    const minion = minions(side.world, side.player)[0]!;
    runFormationAttack(side.world, side.player, minion, target, 2_000); // establishes one voice, nextTickAt = 3000
    const before = target.hasHealth.hp;
    tickSummonerSpecializations(side.world, side.player as any, 3_000); // forces exactly one voice tick
    const after = target.hasHealth.hp;
    const state = side.player.controlsSummons!.chorusByTarget[target.isMonster.id]!;
    return { voiceDamage: before - after, nextTickAt: state.nextTickAt, expiresAt: state.expiresAt };
  }
  const baseTick = oneVoiceTick(base);
  const boostedTick = oneVoiceTick(boosted);
  assert(baseTick.voiceDamage > 0, 'Withering Chorus must deal proc damage');
  close(boostedTick.voiceDamage / baseTick.voiceDamage, 1.25,
    '+25% Debuff Effect scales Withering Chorus damage per voice by exactly the rated bonus', 1e-3);
  close(baseTick.nextTickAt - 2_000, boostedTick.nextTickAt - 2_000, 'Chorus tick interval must not scale with the relic');
  close(baseTick.expiresAt - 2_000, boostedTick.expiresAt - 2_000, 'Chorus duration must not scale with the relic');

  // Preview parity.
  const preview = resolveRelicPreview('summoner', {}, { ...ZERO_RELIC_RATINGS, debuffEffect: 0.25 },
    { subVariant: 'balanced', unlockedSkills: ['summoner-balanced-t3-b'] });
  const line = preview?.secondaryEffects?.find((e) => e.label === 'Withering Chorus damage per voice');
  assert(line !== undefined, 'preview must surface a Withering Chorus debuff line');
  close(line!.before, 0.045, 'preview before must match authored tuning');
  close(line!.after, 0.05625, 'preview after must match the runtime-scaled per-voice magnitude');
}

// ── Control: an adjacent, deliberately-excluded summoner mechanic must not move ──
{
  const boosted = attachSummoner('summoner-balanced-t3-a', 0.9, 0.9);
  const target = durableTarget(boosted.world);
  const formation = minions(boosted.world, boosted.player);
  const prepared = prepareSpecializationAttack(
    boosted.world, boosted.player as any, formation[0]!, target, 2_000, { completed: false, serial: 0 },
  );
  close(prepared.damageMult, SUMMONER_SPECIALIZATION_TUNING.coordinatedHunt.openingDamageMult,
    'Coordinated Hunt is not on the approved list and must ignore both relic ratings');
  const preview = resolveRelicPreview('summoner', {}, { ...ZERO_RELIC_RATINGS, buffEffect: 0.9, debuffEffect: 0.9 },
    { subVariant: 'balanced', unlockedSkills: ['summoner-balanced-t3-a'] });
  assert((preview?.secondaryEffects ?? []).length === 0, 'Coordinated Hunt must register no secondary preview lines');
  assert(preview?.secondaryNotes?.some((n) => n.kind === 'buff' && /no eligible/i.test(n.message)),
    'a rated build with no eligible mechanic must say so truthfully (buff)');
  assert(preview?.secondaryNotes?.some((n) => n.kind === 'debuff' && /no eligible/i.test(n.message)),
    'a rated build with no eligible mechanic must say so truthfully (debuff)');
}

// ── 9/10. Winter Warden Frozen payoff — debuff effect scales damageTakenPct only ──
{
  function freezeRun(debuffEffect: number) {
    const { world, player } = fixture('dot');
    player.usesSkills.passives['dot.freezing-cold'] = 1;
    if (debuffEffect !== 0) player.usesSkills.passives['relic.mechanic-debuff-effect'] = debuffEffect;
    const target = nonSummonerTarget(world);
    for (let i = 0; i < 9; i++) hit(world, player, target, 1_000 + i * 100); // CHILL_MAX = 9
    const frozen = getStatusEffect(target.tracksCombat, FROZEN_EFFECT);
    assert(frozen !== undefined, 'nine stacking hits with Freezing Cold must trigger Frozen');
    return frozen!;
  }
  const base = freezeRun(0);
  const boosted = freezeRun(0.25);
  close(base.data.damageTakenPct, 0.35, 'sanity: baseline Frozen damage taken matches authored tuning');
  close(boosted.data.damageTakenPct, 0.4375, '+25% Debuff Effect: 35% -> 43.75%');
  close(base.remainingMs, boosted.remainingMs, 'Frozen duration must not scale with the relic');
  close(base.data.moveSlowPct, boosted.data.moveSlowPct, 'Frozen movement slow must not scale with the relic');
  close(base.data.attackSlowPct, boosted.data.attackSlowPct, 'Frozen attack slow must not scale with the relic');

  // The Chill threshold itself (9 hits) must not move: 8 hits must never freeze.
  {
    const { world, player } = fixture('dot');
    player.usesSkills.passives['dot.freezing-cold'] = 1;
    player.usesSkills.passives['relic.mechanic-debuff-effect'] = 0.25;
    const target = nonSummonerTarget(world);
    for (let i = 0; i < 8; i++) hit(world, player, target, 1_000 + i * 100);
    assert(getStatusEffect(target.tracksCombat, FROZEN_EFFECT) === undefined,
      'the Chill threshold must not shrink under a Debuff Effect rating');
  }

  // Preview parity.
  const preview = resolveRelicPreview('dot', { 'dot.freezing-cold': 1 }, { ...ZERO_RELIC_RATINGS, debuffEffect: 0.25 });
  const line = preview?.secondaryEffects?.find((e) => e.label === 'Frozen damage taken');
  assert(line !== undefined, 'preview must surface a Frozen debuff line');
  close(line!.before, 0.35, 'preview before must match authored tuning');
  close(line!.after, 0.4375, 'preview after must match the runtime-scaled magnitude');
}

// ── 11. A non-mechanic debuff must stay outside the registry's reach ────────────
{
  // dr-shatter was never opted into the Relic mechanic registry: scaling it
  // through SCALABLE_MECHANIC_DEBUFFS must be a no-op even at an extreme rating.
  const untouched = scaleMechanicEffectConfig(
    { id: 'dr-shatter', sourceId: 'p', data: { anything: 5 } },
    2.0,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  close(untouched.data!.anything, 5, 'an id absent from the mechanic-debuff registry must never be scaled');

  // A monster-applied debuff on the player must not read the player's own Relic
  // at all — it isn't routed through applyPlayerDebuff, so this is definitional,
  // but assert the registry would refuse it anyway if someone tried.
  const monsterSlow = scaleMechanicEffectConfig(
    { id: 'debuff-slow', sourceId: 'monster', data: { moveSlowPct: 0.5 } },
    2.0,
    SCALABLE_MECHANIC_DEBUFFS,
  );
  close(monsterSlow.data!.moveSlowPct, 0.5, 'a monster-applied slow must never be scaled by a player Relic rating');
}

console.log('relicMechanicEffectCoverage.test.ts: ok');
