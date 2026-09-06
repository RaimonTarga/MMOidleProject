// Wiring coverage for the 2026-08-23 BOSS ENCOUNTER REWORK.
//
// This is a structure/plumbing suite, not a balance suite: it asserts that each
// lineage's identity is actually authored and that the new runtime seams do what
// their action says. Magnitudes are deliberately not pinned — the balance pass owns
// those and should not have to edit this file.

import {
  MONSTER_DATABASE,
  SUN_MARK_EFFECT_ID,
  TUNDRA_CHILL_EFFECT_ID,
  FROZEN_STATUS_ID,
  GAME_CONFIG,
  PLATING_SHRED_EFFECT_ID,
  STARTER_RUNE_IDS,
  ambientRampStatus,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { BossAction } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { updateRaisers } from '../src/systems/combat/ai/raiseDead';
import { bossPatternFor } from '../src/systems/combat/ai/bossPatterns';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { selectMonsterAggroCandidate } from '../src/systems/combat/ai/monsterTargeting';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { recordCorpse } from '../src/systems/world/corpses';
import { updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { buildGroundZoneViews } from '../src/systems/world/groundZones';
import { World } from '../src/world/World';
import type { PlayerEntity } from '../src/ecs/entity';
import { makeTracksCombat } from '@mmo-idle/shared';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function playerSlices(id: string, nodeId = NODE): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 405, y: 400 },
      nodeId,
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
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

/**
 * A minimal entity satisfying the canonical `minionEntities` query. The real
 * `spawnMinionForOwner` needs a full summoner build; this suite only needs a body
 * standing in the boss's face.
 */
function addFakeMinion(world: World, owner: PlayerEntity, pos: { x: number; y: number }): void {
  const id = `fake-minion-${pos.x}-${pos.y}`;
  world.ecs.add({
    entityId: id,
    isMinion: { id, ownerPlayerId: owner.isPlayer.id, slot: 0, slotId: 'a', role: 'melee', sizeMult: 1, monsterTypeId: 'plains-slime' },
    controlsMinion: { ownerPlayerId: owner.isPlayer.id, followOffset: { x: 0, y: 0 } },
    hasPosition: { current: { ...pos }, nodeId: owner.hasPosition.nodeId, speed: 100 },
    hasHitbox: { radius: 16 },
    hasHealth: { hp: 100, maxHp: 100, recovery: 0 },
    dealsDamage: { attack: 1, onHitDamage: 0, attackStyle: 'impact' },
    performsAttack: { attackRange: 20, attackCooldown: 1000, lastAttackAt: 0 },
    mitigatesDamage: { plating: 0, damageReduction: 0 },
    tracksCombat: makeTracksCombat(),
    hasStatus: {},
  } as never);
}

function def(id: string) {
  const found = MONSTER_DATABASE.get(id);
  assert(!!found, `missing monster definition: ${id}`);
  return found;
}

function scriptedActions(id: string): BossAction[] {
  const script = def(id).bossScript;
  const actions = [
    ...(script?.phases ?? []).flatMap(phase => phase.actions),
    ...(script?.repeating ?? []).flatMap(repeating => repeating.actions),
  ];
  const flatten = (action: BossAction): BossAction[] =>
    action.type === 'cast' ? [action, ...action.actions.flatMap(flatten)] : [action];
  return actions.flatMap(flatten);
}

/** Every boss that a player can actually fight in a dungeon, by lineage. */
const ACTIVE_BOSS_IDS = [
  'tusked-razorback', 'gorging-razortusk',
  'gnarled-greatbear', 'apex-timberclaw',
  'grave-toadeater', 'mire-gorged-behemoth', 'rot-spore-croc-behemoth',
  'crag-behemoth', 'stoneplate-juggernaut', 'crag-gorged-horn-behemoth', 'iron-crest-titan',
  'obsidian-broodmother', 'chitinous-dreadbore', 'deep-core-burrow-gorger',
  'dune-stalker-emperor', 'dune-carapace-monarch', 'dune-throne-sovereign',
  'jungle-dread-gorger', 'apex-bramble-slasher', 'verdant-crown-predator',
  'frost-plated-rime-mammoth', 'glacial-patriarch',
  'cinder-shell-magma-salamander', 'caldera-sovereign',
  'charnel-crown-sovereign',
  'elder-trench-serpent',
];

// ── The anti-summon cleanup ───────────────────────────────────────────────────
// Every active boss now walks past a summon wall at the TARGETING layer instead of
// carrying a cleave whose only job was to delete minions.
for (const id of ACTIVE_BOSS_IDS) {
  assert(
    def(id).targeting?.prefersPlayers === true,
    `${id} should prefer players over minions (anti-body-block)`,
  );
}
// The Trench serpent is the ONE deliberate exception that keeps a body-slam cleave:
// it is the size of the arena. Nothing else may carry `aoeAttack`.
for (const id of ACTIVE_BOSS_IDS) {
  if (id === 'elder-trench-serpent') continue;
  assert(!def(id).aoeAttack, `${id} should not carry the retired anti-summon cleave`);
}

// ── The generic-mechanic cull ─────────────────────────────────────────────────
for (const monster of MONSTER_DATABASE.values()) {
  const actions = [
    ...(monster.bossScript?.phases ?? []).flatMap(p => p.actions),
    ...(monster.bossScript?.repeating ?? []).flatMap(r => r.actions),
  ].map(a => String(a.type));
  assert(
    !actions.includes('apply-soft-cap') && !actions.includes('shed-defense'),
    `${monster.id} still uses the retired generic soft-cap / shed-defense template`,
  );
  assert(
    !actions.includes('modify-ramp-debuff'),
    `${monster.id} still lifts its ramp-debuff caps — max suppression must stay playable`,
  );
}

// Reinforcements are a Plains identity: creatures keep ARRIVING there, and the
// escalation is concurrency. Everywhere else a boss conjuring bodies is a weaker
// Plains fight in a different palette.
//
// Refined 2026-09-04: the invariant is "no REPEATING add wave", not "no adds at
// all". Wasteland's identity is that the dead you already made refuse to stay dead,
// and that needs seed corpses — so it opens with ONE entourage, at full health, that
// never comes back. A one-shot opener at `hpPct: 1.0` is a starting condition; a
// wave on a repeating timer or a low-health threshold is the thing this rule forbids.
const ONE_SHOT_ENTOURAGE_BOSSES = new Set(['charnel-crown-sovereign']);
for (const id of ACTIVE_BOSS_IDS) {
  if (id === 'tusked-razorback' || id === 'gorging-razortusk') continue;
  if (ONE_SHOT_ENTOURAGE_BOSSES.has(id)) {
    const script = def(id).bossScript;
    // Never on a repeating timer.
    assert(
      !(script?.repeating ?? []).some(entry =>
        entry.actions.some(action => action.type === 'spawn-adds'),
      ),
      `${id} entourage must not be on a repeating timer`,
    );
    // And only at full health — an opener, never a mid-fight reinforcement.
    for (const phase of script?.phases ?? []) {
      if (!phase.actions.some(action => action.type === 'spawn-adds')) continue;
      assert(
        phase.hpPct === 1.0,
        `${id} may only spawn its entourage on engage, not at ${phase.hpPct}`,
      );
    }
    continue;
  }
  assert(
    !scriptedActions(id).some(action => action.type === 'spawn-adds'),
    `${id} should not conjure fresh scripted adds`,
  );
}
assert(
  scriptedActions('charnel-crown-sovereign').some(action => action.type === 'raise-dead'),
  'Wasteland should keep corpse resurrection as its add exception',
);

// ── Per-lineage identity is actually authored ─────────────────────────────────
// Desert: setup -> punishment. Every tier paints and cashes its own Sun Mark — as of
// 2026-09-04 through a VISIBLE ordered sequence rather than an invisible per-hit
// mark/finisher pair. `desertPairs.test.ts` owns the detailed shape; this file only
// asserts the lineage identity is authored at every tier.
for (const id of ['dune-stalker-emperor', 'dune-carapace-monarch', 'dune-throne-sovereign']) {
  const steps = def(id).bossPattern?.steps ?? [];
  assert(
    steps.some(step => step.kind === 'apply-status' && step.effectId === SUN_MARK_EFFECT_ID) &&
      steps.some(step => step.kind === 'payoff' && step.consumes.effectId === SUN_MARK_EFFECT_ID),
    `${id} should run the Sun Mark cycle`,
  );
  // The cash-out is a named, cast-time step, so it is readable as it arrives.
  assert(
    steps.some(step => step.kind === 'payoff' && step.castMs > 0),
    `${id} should telegraph its cash-out`,
  );
}
// Jungle: PURSUIT AND FAILED ESCAPE (2026-09-04 redesign).
//
// This replaces the old "hard to pin down" identity, which was expressed as passive
// `evasion` — a flat miss chance that made every build's damage read as unreliable
// rather than making the boss hard to catch. Being hard to catch is now something the
// boss DOES, in a sequence the player can answer by breaking its Escape Guard.
const JUNGLE_IDS = ['jungle-dread-gorger', 'apex-bramble-slasher', 'verdant-crown-predator'] as const;
for (const id of JUNGLE_IDS) {
  const jungle = def(id);
  const steps = jungle.bossPattern?.steps ?? [];
  const guard = steps.find(step => step.kind === 'escape-guard');
  assert(!!guard, `${id} should run the escape cycle`);
  assert(
    guard.kind === 'escape-guard' && guard.maxInstinctStacks > 0,
    `${id} escape should bank capped Instinct when broken`,
  );
  // "Gets away" is the claim; `relocate: 'leash-edge'` was only ever one way to
  // spell it, and spelling it that way with no `travelSpeed` IS the teleport this
  // line says it forbids — which is how the T2 gorger shipped standing still behind
  // its plate and then blinking to the far edge. The claim, checked honestly: the
  // escape has to move the boss, either by fleeing under the guard or by relocating
  // when it hides.
  assert(
    (guard.kind === 'escape-guard' && guard.flee !== undefined) ||
      steps.some(step => step.kind === 'conceal' && step.relocate !== 'none'),
    `${id} should actually get away, not just stand behind a shield`,
  );
  assert(
    (jungle.evasion ?? 0) === 0,
    `${id} should not keep passive evasion alongside the escape cycle`,
  );
}
// EVERY TIER runs the corrected loop (2026-09-06): it bolts in the open behind a
// breakable plate, hides only once away, then stalks back and bites on contact.
//
// Checked across the whole lineage on purpose. The rework landed on T2 first and T3
// and T4 sat broken for a while afterwards — stationary "escapes", a `leash-edge`
// teleport, and an Ambush (a payoff with no radius, and so no range check at all)
// resolving from across the arena. A per-tier loop is what stops that recurring.
for (const id of JUNGLE_IDS) {
  const steps = def(id).bossPattern!.steps;
  const guard = steps.find(step => step.kind === 'escape-guard');
  const hide = steps.find(step => step.kind === 'conceal');
  assert(guard?.kind === 'escape-guard' && guard.flee !== undefined,
    `${id} should bolt in the open while its guard can still be broken`);
  assert(hide?.kind === 'conceal' && hide.relocate === 'near-target',
    `${id} should hide only to come BACK for you, not to leave`);
  assert(hide.kind === 'conceal' && hide.travelSpeed !== undefined,
    `${id}: closing the distance must be travel the player can watch, never a teleport`);
  const hideIdx = steps.findIndex(step => step.kind === 'conceal');
  const biteIdx = steps.findIndex(step => step.kind === 'payoff');
  assert(hideIdx >= 0 && biteIdx > hideIdx, `${id}: the bite is what happens when it arrives`);
  // A LANDED ambush grants no punish window — that belongs to breaking the plate.
  assert(
    !steps.some(step => step.kind === 'recovery'),
    `${id}: a predator that just landed its ambush must not stun itself`,
  );
}

// The capstone STOPS escaping when wounded — the low-health state is the ABSENCE of
// the lineage's mechanic, not a fourth one.
assert(
  def('verdant-crown-predator').bossPattern?.armAboveHpPct === 0.5,
  'T4 Jungle should stop escaping once its frenzy begins',
);
assert(
  !def('verdant-crown-predator').cadenceFinisher,
  'T4 Jungle should not carry the generic cadence finisher',
);
// Volcanic: HEAT, VENT, AND THE CHOICE TO STAND IN IT (2026-09-04 redesign).
assert(!def('caldera-sovereign').rampOnCombat, 'T4 Volcanic must not run a parallel private ramp');
for (const id of ['cinder-shell-magma-salamander', 'caldera-sovereign']) {
  const volcanic = def(id);
  assert(!!volcanic.shellUp?.repeatIntervalMs, `${id} should cycle its shell`);
  const vent = volcanic.shellUp.pool;
  assert(vent?.flavor === 'magma-vent', `${id} shell should lay a magma vent`);
  assert(
    (vent.rampAccelMult ?? 1) > 1,
    `${id} vent should ACCELERATE the room's Heat, not mint its own`,
  );
  // Heat owns all the escalation. A boss-side multiplier on top counts the same
  // escalation twice — once visibly on the player, once invisibly on the boss.
  assert(
    !volcanic.scalesWithAmbientRamp,
    `${id} must not ALSO scale its own damage with Heat`,
  );
}
// The capstone's catastrophe: long, uninterruptible, once per life.
{
  const cataclysm = def('caldera-sovereign').bossPattern;
  assert(!!cataclysm, 'T4 Volcanic should build to a Cataclysm');
  assert(cataclysm.oncePerLife === true, 'the Cataclysm should fire once, not repeat');
  assert(
    cataclysm.armBelowHpPct !== undefined && cataclysm.armBelowHpPct <= 0.25,
    'and only near the final quarter',
  );
  const cast = cataclysm.steps[0];
  assert(cast.kind === 'cast', 'it should open on a cast');
  assert(cast.interruptible === false, 'the Cataclysm is explicitly uninterruptible');
  assert(cast.castMs >= 5_000, 'and long enough that killing it first is a real race');
}
// Tundra: the CHILL CHECK at both tiers (2026-09-04 redesign).
//
// This replaces the old "Ice Armor with a shatter payoff" identity. Ice Armor was a
// generic anti-burst clip in the one lineage explicitly about rewarding burst, and
// it said nothing about cold; the room's Chill is what the biome is actually about,
// so the encounter now reads it directly.
for (const id of ['frost-plated-rime-mammoth', 'glacial-patriarch']) {
  const steps = def(id).bossPattern?.steps ?? [];
  const freeze = steps.find(
    (step) => step.kind === 'apply-status' && step.effectId === FROZEN_STATUS_ID,
  );
  assert(!!freeze, `${id} should convert Chill into a Freeze`);
  assert(
    freeze.kind === 'apply-status' &&
      freeze.requires?.effectId === TUNDRA_CHILL_EFFECT_ID &&
      freeze.requires.minStacks > 0,
    `${id} freeze should be GATED on how chilled the room made you`,
  );
  const shatterIndex = steps.findIndex(step => step.kind === 'impact');
  assert(
    shatterIndex > steps.indexOf(freeze),
    `${id} should follow the freeze with a dodgeable Shatter`,
  );
  assert(
    def(id).enemyShield === undefined,
    `${id} should no longer carry the generic Ice Armor clip`,
  );
}
// Damage NEVER secretly scales with Chill: the stacks decide IF you get frozen,
// never how hard anything hits. Both tiers, not just T3.
for (const id of ['frost-plated-rime-mammoth', 'glacial-patriarch']) {
  assert(
    !def(id).scalesWithAmbientRamp,
    `${id} must not secretly scale its damage with Chill`,
  );
}
// The T4 Collapse used to feed on Chill through `scalesWithAmbientRamp`. That was
// REVERSED on 2026-09-04: a hidden multiplier on an already-unavoidable hit is the
// least readable escalation available, and §5.6 forbids damage scaling with Chill
// outright. The Collapse is now fed by the FREEZE it follows — you are hit hard
// because you let yourself get frozen, which you can see, not because a number
// climbed somewhere you cannot.
// Wasteland: the dead do not stay dead.
assert(!!def('charnel-crown-sovereign').raisesDead, 'Wasteland boss should raise corpses');
// Trench: ONE ENORMOUS DUEL, as an ordered sequence (2026-09-04 redesign).
// Wound bite -> Undertow -> Constrict -> Devour, each with its own answer.
{
  const serpent = def('elder-trench-serpent');
  const steps = serpent.bossPattern?.steps ?? [];
  const devour = steps.find(step => step.kind === 'payoff');
  assert(devour?.kind === 'payoff', 'the Trench boss should build to a Devour payoff');
  assert(devour.radius === undefined, 'Trench Devour should be single-target — a bite is a bite');
  assert((devour.healsSelfPct ?? 0) > 0, 'Trench Devour should restore the serpent when it LANDS');

  const pull = steps.find(step => step.kind === 'pull');
  assert(pull?.kind === 'pull', 'Undertow should drag a disengaged target back');
  assert(pull.distance > 0, 'and actually move them');
  assert(
    steps.indexOf(pull) < steps.indexOf(devour),
    'it should catch them BEFORE the bite, not after',
  );

  // The anti-heal lives on ONE beat now. Applying it from ordinary hits as well is
  // how the Trench previously reached 75-90% suppression.
  assert(
    serpent.appliesAntiheal === undefined,
    'ordinary Trench hits must not also apply anti-heal',
  );
  assert(!serpent.aoeAttack, 'the boss AoE riding every swing should be gone');
  assert(!serpent.enemyShield, 'and the periodic shield with it');
  assert(!serpent.cadenceFinisher, 'Trench should drop its generic cadence spike');
  assert(serpent.chargeOnAggro === undefined, 'and the aggro speed burst');
}

initCombatSystems();

// ── `targeting.prefersPlayers` walks past the summon wall ─────────────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('block-owner'), 'block-owner');
  // The player stands well behind; the minion is right in the boss's face.
  player.hasPosition.current = { x: 900, y: 400 };
  const boss = world.createMonster(NODE, 'crag-behemoth', { x: 400, y: 400 });
  const plain = world.createMonster(NODE, 'cliff-hopper', { x: 400, y: 900 });
  assert(!!boss && !!plain, 'targeting fixtures should spawn');
  boss.hasAwareness.pullRange = 2_000;
  plain.hasAwareness.pullRange = 2_000;

  addFakeMinion(world, player, { x: 410, y: 400 });
  addFakeMinion(world, player, { x: 410, y: 900 });

  assert(
    selectMonsterAggroCandidate(world, boss)?.kind === 'player',
    'a prefersPlayers boss must walk past the much closer minion',
  );
  // Control: an ordinary monster still takes the body-block, so the change is the
  // boss flag and not a global retargeting rewrite.
  assert(
    selectMonsterAggroCandidate(world, plain)?.kind === 'minion',
    'ordinary monsters should still be body-blockable',
  );
}

// ── `empower-charged` scales the signature attack, and composes ───────────────
{
  const world = new World();
  const boss = world.createMonster(NODE, 'crag-gorged-horn-behemoth', { x: 400, y: 400 });
  assert(!!boss, 'T3 Mountain boss should spawn');
  setAggroTarget(world, boss, { id: 'charged-target', kind: 'player' }, 1_000);

  // T3 Mountain's signature is now an ordered PATTERN rather than a chargedAttack,
  // and `empower-charged` deliberately still drives it: converting a boss must not
  // silently turn its authored 50% phase into a no-op.
  const base = def('crag-gorged-horn-behemoth').bossPattern!;
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.49;
  updateBossScripts(world, 100);
  const after50 = boss.scriptsBoss!.chargedOverride;
  assert(!!after50 && after50.multiplierMult > 1, '50% should empower the signature attack');
  const scaled50 = bossPatternFor(boss)!;
  assert(
    scaled50.damageMultiplier > base.damageMultiplier,
    'the empowerment should actually reach the pattern',
  );
  const baseImpact = base.steps.find(step => step.kind === 'impact');
  const scaledImpact = scaled50.steps.find(step => step.kind === 'impact');
  assert(
    baseImpact?.kind === 'impact' &&
      scaledImpact?.kind === 'impact' &&
      scaledImpact.radius > baseImpact.radius,
    'radiusMult should widen the pattern impact circle',
  );

  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.24;
  updateBossScripts(world, 100);
  const after25 = boss.scriptsBoss!.chargedOverride!;
  assert(
    after25.multiplierMult === after50.multiplierMult && after25.cooldownMult < 1,
    'phase empowerments should COMPOSE, not overwrite each other',
  );
  assert(
    bossPatternFor(boss)!.cooldownMs < base.cooldownMs,
    'cooldownMult should bring the pattern around sooner',
  );
  // The authored definition is the single source of the base numbers; overrides are
  // stored as multipliers and applied on read, never written back.
  assert(
    def('crag-gorged-horn-behemoth').bossPattern!.damageMultiplier === base.damageMultiplier,
    'base definition should be untouched by the override',
  );
}

// ── `empower-shred` deepens a corrosion that is ALREADY on the player ─────────
{
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('shred-deepen'), 'shred-deepen');
  const boss = world.createMonster(NODE, 'obsidian-broodmother', { x: 400, y: 400 });
  assert(!!boss, 'Cave boss should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);

  const authored = def('obsidian-broodmother').appliesPlatingShred!;
  for (let i = 0; i < authored.maxStacks + 2; i++) {
    runMonsterAttack(world, boss, player, 10_000 + i * 1_000);
  }
  const capped = getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID)!;
  assert(capped.stacks === authored.maxStacks, 'corrosion should cap at the authored ceiling');

  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.49;
  updateBossScripts(world, 100);
  assert(!!boss.scriptsBoss?.shredOverride, '50% should deepen the shred');
  runMonsterAttack(world, boss, player, 40_000);
  const deepened = getStatusEffect(player.tracksCombat, PLATING_SHRED_EFFECT_ID)!;
  assert(
    deepened.stacks === authored.maxStacks + 1,
    'a raised ceiling must apply to the corrosion already standing on the player',
  );
}

// ── `spawn-pool` puts a real ground zone under the boss ───────────────────────
{
  const world = new World();
  const boss = world.createMonster(NODE, 'rot-spore-croc-behemoth', { x: 400, y: 400 });
  assert(!!boss, 'T3 Swamp boss should spawn');
  setAggroTarget(world, boss, { id: 'bloom-target', kind: 'player' }, 1_000);
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.20;
  updateBossScripts(world, 100);
  const zones = buildGroundZoneViews(world, NODE, Date.now()) ?? [];
  assert(
    zones.some(zone => zone.kind === 'toxic-pool'),
    'the 25% Rot Bloom should publish a hazard pool',
  );
}

// ── `raise-dead` gives back only what the player already killed ───────────────
{
  const world = new World();
  const boss = world.createMonster(NODE, 'charnel-crown-sovereign', { x: 400, y: 400 });
  assert(!!boss, 'Wasteland boss should spawn');
  setAggroTarget(world, boss, { id: 'tide-target', kind: 'player' }, 1_000);

  // THE OPENING ENTOURAGE IS BACK (2026-09-04, redesign §5.8) — a reversal of the
  // 2026-08-23 removal. The reasoning that removed it ("adds are Plains' identity")
  // is still right about WAVES, but Wasteland's whole mechanic is raising the dead,
  // and corpses come from kills. With no seed bodies a solo boss pull had nothing to
  // raise until the player happened to clear ambient monsters first, so the encounter
  // did not express its own identity in the fight it is the boss of.
  //
  // It fires ONCE, on engage, and never respawns — the distinction that keeps it a
  // starting condition rather than a reinforcement wave.
  updateBossScripts(world, 100);
  const entourage = [...world.monsterEntitiesInNode(NODE)].filter(m => m !== boss);
  assert(entourage.length > 0, 'the Sovereign should arrive with an entourage');
  const entourageIds = new Set(entourage.map(m => m.isMonster.id));

  // Run the script well past the opener: it must never top itself back up.
  for (let i = 0; i < 20; i++) updateBossScripts(world, 5_000);
  const after = [...world.monsterEntitiesInNode(NODE)].filter(m => m !== boss);
  assert(
    after.length === entourage.length && after.every(m => entourageIds.has(m.isMonster.id)),
    'the opening entourage must never respawn',
  );

  // Clear the entourage WITHOUT leaving corpses, so the resurrection below still
  // tests "raise-dead cannot conjure from nothing".
  for (const add of after) world.removeMonsterEntity(add.isMonster.id);

  // With an empty corpse registry the Mass Resurrection must raise nothing at all.
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.49;
  updateBossScripts(world, 100);
  assert(
    ![...world.monsterEntitiesInNode(NODE)].some(m => m.isRaised),
    'Mass Resurrection should not resolve during its warning cast',
  );
  assert(
    world.takeNodeEvents(NODE).some(event =>
      event.kind === 'monster-cast-start' && event.label === 'Mass Resurrection',
    ),
    'the 50% resurrection burst should announce its source',
  );
  updateBossScripts(world, 1_800);
  assert(
    ![...world.monsterEntitiesInNode(NODE)].some(m => m.isRaised),
    'raise-dead must never conjure from nothing when the cast completes',
  );

  // Feed it three corpses; the next burst claims them.
  const corpses = ['bone-crawler', 'plague-hound', 'bone-crawler'].map((monsterTypeId, index) => {
    const dead = world.createMonster(NODE, monsterTypeId, { x: 405 + index * 12, y: 400 });
    assert(!!dead, `corpse fixture ${monsterTypeId} should spawn`);
    dead.hasHealth.hp = 0;
    recordCorpse(world, dead);
    return dead;
  });
  assert(corpses.length === 3, 'the corpse fixture should provide three bodies');
  // ONE major resurrection, and no second one (§12.5). The 25% "Deathless Tide"
  // wave is REMOVED: a low-health repeat of the encounter's headline beat makes the
  // first one mean nothing, and its necrotic roar was generic cadence pressure
  // competing with the necromancy for the same role.
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.24;
  for (let i = 0; i < 10; i++) updateBossScripts(world, 2_000);
  assert(
    !scriptedActions('charnel-crown-sovereign').some(
      action => action.type === 'roar',
    ),
    'the Sovereign should not drive a necrotic roar on top of its necromancy',
  );
  const massResurrections = (def('charnel-crown-sovereign').bossScript?.phases ?? [])
    .filter(phase => phase.actions.some(action => action.type === 'cast'
      && action.actions.some(nested => nested.type === 'raise-dead')));
  assert(
    massResurrections.length === 1,
    `there should be exactly ONE Mass Resurrection, found ${massResurrections.length}`,
  );

  // The steady cadence still works: with corpses on the floor it claims them, one
  // at a time, through the ordinary raiser tick rather than a phase burst. That
  // cadence — not a threshold wave — is what the encounter runs on now.
  let raiseNow = 2_000;
  for (let i = 0; i < 60; i++) {
    raiseNow += 500;
    updateRaisers(world, raiseNow);
    if ([...world.monsterEntitiesInNode(NODE)].some(m => m.isRaised)) break;
  }
  const risen = [...world.monsterEntitiesInNode(NODE)].filter(m => m.isRaised);
  assert(risen.length > 0, 'the necromancy should still claw corpses back up');
  assert(
    risen.every(m => m.isRaised!.raiserId === boss.isMonster.id),
    'risen units should be owned by the Sovereign so they crumble with it',
  );
}

// ── `stoke-ramp` bends the node's ambient ramp, and the room cools when cleared ─
{
  const HEAT_NODE = 'node-t4-volcanic-dungeon';
  const world = new World();
  const player = world.attachPlayerEntity(playerSlices('heat-racer', HEAT_NODE), 'heat-racer');
  const boss = world.createMonster(HEAT_NODE, 'caldera-sovereign', { x: 400, y: 400 });
  assert(!!boss, 'Caldera Sovereign should spawn');
  setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, Date.now());
  // `updateNodeFeatures` reads the wall clock, so engagement has to be stamped
  // against it rather than a synthetic timeline.
  const engage = () => { player.tracksEngagement = Date.now(); };

  engage();
  updateNodeFeatures(world, 100);
  const fresh = ambientRampStatus(player.tracksCombat);
  assert(!!fresh, 'a volcanic node should apply its Heat ramp in combat');
  const baseCeiling = fresh.maxStacks;
  assert(baseCeiling > 0, 'the Heat ramp should have an authored ceiling');

  // THE SOVEREIGN NO LONGER STOKES ITS ROOM (2026-09-04 redesign, §5.7 "remove
  // repeated floor/cap stokes"). A boss shoving a floor under the room's Heat takes
  // the choice away: the whole encounter is whether the PLAYER accepts Heat for the
  // damage it pays, and a floor means they are carrying it whether they chose to or
  // not. Heat is now raised only by standing in the Vent, which they can leave.
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.20;
  updateBossScripts(world, 100);
  assert(
    !world.ambientRampOverrides.get(HEAT_NODE),
    'the Sovereign must not stoke its own room any more',
  );

  // With no floor holding it, Heat now FULLY COOLS once the player disengages. That
  // is the point of removing the stoke: walking out of the vent, or out of the
  // fight, is a real answer again rather than a partial one.
  player.tracksEngagement = undefined;
  for (let i = 0; i < 60; i++) updateNodeFeatures(world, 5_000);
  assert(
    !ambientRampStatus(player.tracksCombat),
    'without a stoked floor the Heat should shed completely',
  );
}

console.log('bossEncounterRework: ok');
