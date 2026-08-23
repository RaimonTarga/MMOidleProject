// Wiring coverage for the 2026-08-23 BOSS ENCOUNTER REWORK.
//
// This is a structure/plumbing suite, not a balance suite: it asserts that each
// lineage's identity is actually authored and that the new runtime seams do what
// their action says. Magnitudes are deliberately not pinned — the balance pass owns
// those and should not have to edit this file.

import {
  MONSTER_DATABASE,
  GAME_CONFIG,
  PLATING_SHRED_EFFECT_ID,
  STARTER_RUNE_IDS,
  ambientRampStatus,
  emptyEquipment,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
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

// ── Per-lineage identity is actually authored ─────────────────────────────────
// Desert: setup -> punishment. Every tier paints and cashes its own Sun Mark.
for (const id of ['dune-stalker-emperor', 'dune-carapace-monarch', 'dune-throne-sovereign']) {
  assert(!!def(id).appliesMark && !!def(id).markedStrike, `${id} should run the Sun Mark cycle`);
  assert(!!def(id).chargedAttack, `${id} should telegraph its cash-out`);
}
// Jungle: hard to pin down, then it commits.
assert((def('apex-bramble-slasher').evasion ?? 0) > 0, 'T3 Jungle should be evasive');
assert((def('verdant-crown-predator').evasion ?? 0) > 0, 'T4 Jungle should hunt before it frenzies');
assert(
  !def('verdant-crown-predator').cadenceFinisher,
  'T4 Jungle should not carry the generic cadence finisher',
);
// Volcanic: Heat is the encounter, not a private ramp beside it.
assert(!def('caldera-sovereign').rampOnCombat, 'T4 Volcanic must not run a parallel private ramp');
assert(!!def('caldera-sovereign').scalesWithAmbientRamp, 'T4 Volcanic should feed on node Heat');
assert(!!def('cinder-shell-magma-salamander').shellUp?.repeatIntervalMs, 'T3 Volcanic should cycle its shell');
// Tundra: Ice Armor with a real shatter payoff at both tiers, and the Chill only
// fuses into the signature slam at T4 — the lineage has to keep something in hand.
for (const id of ['frost-plated-rime-mammoth', 'glacial-patriarch']) {
  assert(!!def(id).enemyShield?.shatter, `${id} should have breakable Ice Armor`);
}
assert(
  !def('frost-plated-rime-mammoth').scalesWithAmbientRamp,
  'T3 Tundra should not yet feed on Chill — that is the T4 escalation',
);
assert(
  def('glacial-patriarch').scalesWithAmbientRamp?.chargedOnly === true,
  "T4 Tundra's Collapse should feed on Chill, and only the Collapse",
);
// Wasteland: the dead do not stay dead.
assert(!!def('charnel-crown-sovereign').raisesDead, 'Wasteland boss should raise corpses');
// Trench: one enormous single-target bite that feeds it.
{
  const devour = def('elder-trench-serpent').chargedAttack;
  assert(!!devour && !devour.aoe, 'Trench Devour should be single-target');
  assert((devour.healsSelfPct ?? 0) > 0, 'Trench Devour should restore the serpent');
  assert(!def('elder-trench-serpent').cadenceFinisher, 'Trench should drop its generic cadence spike');
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

  const base = def('crag-gorged-horn-behemoth').chargedAttack!;
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.49;
  updateBossScripts(world, 100);
  const after50 = boss.scriptsBoss!.chargedOverride;
  assert(!!after50 && after50.multiplierMult > 1, '50% should empower the slam');

  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.24;
  updateBossScripts(world, 100);
  const after25 = boss.scriptsBoss!.chargedOverride!;
  assert(
    after25.multiplierMult === after50.multiplierMult && after25.cooldownMult < 1,
    'phase empowerments should COMPOSE, not overwrite each other',
  );
  assert(base.multiplier > 0, 'base definition should be untouched by the override');
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

  // Engaging fires the hpPct 1.0 entourage phase.
  updateBossScripts(world, 100);
  const entourage = [...world.monsterEntitiesInNode(NODE)].filter(m => m !== boss);
  assert(entourage.length > 0, 'the Sovereign should arrive with an entourage');

  // With an empty corpse registry the Mass Resurrection must raise nothing at all.
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.49;
  updateBossScripts(world, 100);
  assert(
    ![...world.monsterEntitiesInNode(NODE)].some(m => m.isRaised),
    'raise-dead must never conjure from nothing',
  );

  // Feed it three corpses; the next burst claims them.
  for (const dead of entourage.slice(0, 3)) recordCorpse(world, dead);
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.24;
  updateBossScripts(world, 100);
  const risen = [...world.monsterEntitiesInNode(NODE)].filter(m => m.isRaised);
  assert(risen.length > 0, 'the final wave should claw the corpses back up');
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

  // The 25% phase stokes it: the floor rises and so does the ceiling.
  boss.hasHealth.hp = boss.hasHealth.maxHp * 0.20;
  updateBossScripts(world, 100);
  const stoke = world.ambientRampOverrides.get(HEAT_NODE);
  assert(!!stoke && (stoke.minStacks ?? 0) > 0, 'the Sovereign should stoke its own room');

  engage();
  updateNodeFeatures(world, 100);
  const stoked = ambientRampStatus(player.tracksCombat)!;
  assert(stoked.maxStacks > baseCeiling, 'a stoked ramp should raise the Heat ceiling');
  assert(
    stoked.stacks >= (stoke.minStacks ?? 0),
    'a stoked ramp should hold its minimum Heat floor',
  );

  // Out of combat the floor still holds — disengaging stops being a full reset.
  player.tracksEngagement = undefined;
  for (let i = 0; i < 20; i++) updateNodeFeatures(world, 5_000);
  assert(
    (ambientRampStatus(player.tracksCombat)?.stacks ?? 0) >= (stoke.minStacks ?? 0),
    'the Heat floor should survive walking away mid-fight',
  );

  // The room cools once the stoke is gone (the boss died, or the node froze).
  world.ambientRampOverrides.delete(HEAT_NODE);
  for (let i = 0; i < 40; i++) updateNodeFeatures(world, 5_000);
  assert(!ambientRampStatus(player.tracksCombat), 'clearing the stoke should let the Heat fully cool');
}

console.log('bossEncounterRework: ok');
