/**
 * Frame loops for the RANGED roots: Slinger (reload), Spirit (energy), Conduit
 * (summoner). Progression rework Phase 3; authored input
 * `docs/briefs/frame-loops-2026-10-01.md` §1.
 *
 * A sibling of `frameLoops.test.ts`, which owns the melee roots.
 *
 * WHAT THIS PINS. Each frame's loop is defined by its CONTAINER, and the container
 * is where these break:
 *
 *   - a clip-position payoff that fires on the wrong round, or on every round
 *   - the Artillerist ramp silently capped below the clip length, which is exactly
 *     what Warmonger's old ramp did and what the frame exists to replace
 *   - a ramp that survives a reload, which deletes the whole cycle
 *   - a chain that hits everything in the radius instead of a COUNT of bodies
 *   - a window that does nothing, or a window the gain path reads twice
 *   - an overcharge bank that is not spent, or is spent as a second multiplier
 *
 * Deliberately NOT asserted: balance. Every number here is read back out of the
 * authored node, so the designer's hand-edits cannot fail the test.
 *
 * Run: node --conditions=development --import tsx test/frameLoopsRanged.test.ts
 */
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  getResource,
  getStatusEffect,
  hasStatusEffect,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import {
  emitCombatEvent, type CombatContext,
} from '../src/systems/combat/engine/combatPipeline';
import { setEmpoweredAttack } from '../src/systems/combat/engine/empoweredAttacks';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import {
  ENERGY_FRAME_OVERCHARGE_RESOURCE,
  ENERGY_FRAME_WINDOW_EFFECT,
} from '../src/systems/classes/archetypes/energy/frameLoop';
import { reloadFrameRampCap } from '../src/systems/classes/archetypes/reload/frameLoop';
import { updateReloadArchetype } from '../src/systems/classes/archetypes/reload/reloadPrototype';
import {
  SUMMONER_FRAME_LINK_EFFECT,
  SUMMONER_FRAME_LINK_RESOURCE,
  SUMMONER_FRAME_WINDOW_EFFECT,
} from '../src/systems/classes/archetypes/summoner/frameLoop';
import { SUMMONER_FRAME_LINE_EFFECT } from '../src/systems/classes/archetypes/summoner/lineHolds';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { summonerProfileFor } from '../src/systems/classes/archetypes/summoner/profile';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function close(actual: number, expected: number, message: string, epsilon = 1e-9): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

const NODE = 'node-clearing';

function makeSlices(id: string, unlockedSkills: string[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 3,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills,
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

initCombatSystems();
const world = new World();

/**
 * A player wearing one frame, with its authored `mechanicEffects` resolved into
 * passives the same way a live unlock resolves them — never hand-written, so the
 * node's authored container is what is under test.
 */
function frame(
  id: string,
  archetype: PlayerEntity['usesSkills']['combatArchetype'],
  root: string,
  subVariant: 'light' | 'balanced' | 'heavy',
  extraSkills: string[] = [],
): PlayerEntity {
  const frameId = `${archetype}-${subVariant}`;
  const player = world.attachPlayerEntity(
    makeSlices(id, [root, frameId, ...extraSkills]),
    id,
  );
  player.usesSkills.combatArchetype = archetype;
  player.usesSkills.selectedClass = root;
  player.usesSkills.selectedSubVariant = subVariant;
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  // The clip size is resolved by the reload tick, not by the slice's initialiser, so
  // one tick is what makes `ammoMax` the frame's authored magazine.
  updateReloadArchetype(world, 0);
  return player;
}

/** A target that cannot die, dodge or mitigate, so a damage read is the mechanic. */
function punchbag(x: number, y = 400): MonsterEntity {
  const monster = world.createMonster(NODE, 'plains-slime', { x, y });
  assert(monster !== null, 'the test target must exist in the monster database');
  monster.hasHealth.maxHp = 10_000_000;
  monster.hasHealth.hp = 10_000_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  // No evasion to clear: a monster's dodge fraction comes from its static
  // definition (`def.evasion`, overridable only by a boss script), not from a
  // field on the entity, and `plains-slime` authors none. Picking a target that
  // cannot dodge is what keeps these damage assertions exact.
  return monster;
}

const BASE_DAMAGE = 1000;

function makeCtx(
  player: PlayerEntity,
  target: MonsterEntity,
  metadata: Record<string, unknown> = {},
): CombatContext {
  return {
    attacker: player, attackerType: 'player',
    defender: target, defenderType: 'monster',
    damage: BASE_DAMAGE, platingMult: 1, drPierce: 0, cancelled: false, metadata,
  } as unknown as CombatContext;
}

/** The ONE multiplier this exchange resolved — the only number a frame may write. */
function empoweredMult(ctx: CombatContext): number {
  return Number(ctx.metadata['empoweredMultiplier'] ?? 1);
}

/**
 * One shot through the real ammo pipeline.
 *
 * `beforeAttack` is where the clip is consumed and the round's position is tagged,
 * so a test that skipped it would be asserting against its own bookkeeping.
 */
function landShot(player: PlayerEntity, target: MonsterEntity): CombatContext {
  const ctx = makeCtx(player, target);
  emitCombatEvent('beforeAttack', ctx, world);
  if (ctx.cancelled) return ctx;
  ctx.damage = BASE_DAMAGE;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

/**
 * The shot's tail. Split from {@link landShot} because the deferred reload-start
 * hooks run HERE — a test that wants to see the ramp at its top has to look between
 * the two, exactly where the live server does.
 */
function finishShot(ctx: CombatContext): CombatContext {
  emitCombatEvent('afterHit', ctx, world);
  return ctx;
}

function fireShot(player: PlayerEntity, target: MonsterEntity): CombatContext {
  return finishShot(landShot(player, target));
}

// ── Scout: the first two rounds of a fresh clip ──────────────────────────────

{
  const player = frame('fl-scout', 'reload', 'reload-root', 'light');
  const target = punchbag(500);
  const reload = player.usesReload!;
  const passives = player.usesSkills.passives;
  const openerRounds = Math.round(passives['reload.frame-opener-rounds'] ?? 0);
  const openerMult = passives['reload.frame-opener-mult'] ?? 0;

  assert(openerRounds === 2, `Scout should empower two openers, node says ${openerRounds}`);
  assert(openerMult > 1, 'Scout should author an opener multiplier');
  assert(reload.ammoMax === 5, `Scout's clip should be 5, got ${reload.ammoMax}`);

  const mults: number[] = [];
  for (let shot = 1; shot <= reload.ammoMax; shot++) {
    mults.push(empoweredMult(fireShot(player, target)));
  }

  for (let i = 0; i < openerRounds; i++) {
    close(mults[i]!, openerMult, `Scout round ${i + 1} should be an opener`);
  }
  for (let i = openerRounds; i < mults.length; i++) {
    close(mults[i]!, 1, `Scout round ${i + 1} is past the openers and must be ordinary`);
  }

  // The payoff is per CLIP, not per engagement: a fresh clip opens again. Driven
  // through the real lifecycle — the clip emptying above already started the reload.
  assert(reload.reloadingMs > 0, 'the emptied clip should have started a reload');
  reload.reloadingMs = 0;
  reload.ammo = reload.ammoMax;
  close(
    empoweredMult(fireShot(player, target)),
    openerMult,
    'the first round of the NEXT clip is an opener again',
  );
}

// ── Marksman: the last round of the clip ─────────────────────────────────────

{
  const player = frame('fl-marksman', 'reload', 'reload-root', 'balanced');
  const target = punchbag(520);
  const reload = player.usesReload!;
  const lastMult = player.usesSkills.passives['reload.frame-last-round-mult'] ?? 0;

  assert(lastMult > 1, 'Marksman should author a last-round multiplier');
  assert(reload.ammoMax === 10, `Marksman's clip should be 10, got ${reload.ammoMax}`);

  const mults: number[] = [];
  for (let shot = 1; shot <= reload.ammoMax; shot++) {
    mults.push(empoweredMult(fireShot(player, target)));
  }

  for (let i = 0; i < mults.length - 1; i++) {
    close(mults[i]!, 1, `Marksman round ${i + 1} must be ordinary — only the last one pays`);
  }
  close(mults[mults.length - 1]!, lastMult, 'Marksman\'s last round is the big one');
}

// ── Artillerist: a ramp with no cap below the clip length, reset on reload ───

{
  const player = frame('fl-artillerist', 'reload', 'reload-root', 'heavy');
  const target = punchbag(540);
  const reload = player.usesReload!;
  const passives = player.usesSkills.passives;
  const perShot = passives['reload.frame-ramp-pct-per-shot'] ?? 0;
  const topMult = passives['reload.frame-ramp-top-mult'] ?? 0;
  const clip = reload.ammoMax;

  assert(perShot > 0, 'Artillerist should author a per-shot ramp');
  assert(topMult > 1, 'Artillerist should author a top-of-ramp damage multiplier');
  assert(clip === 20, `Artillerist's clip should be 20, got ${clip}`);
  close(reloadFrameRampCap(player), clip, 'the ramp cap IS the clip length');

  const baseCooldown = player.performsAttack.attackCooldown;
  const mults: number[] = [];
  let lastCtx: CombatContext | undefined;
  for (let shot = 1; shot <= clip; shot++) {
    lastCtx = landShot(player, target);
    mults.push(empoweredMult(lastCtx));
    assert(
      reload.clipSpeedStacks === shot,
      `shot ${shot} of ${clip} should leave ${shot} ramp stacks, got ${reload.clipSpeedStacks}`,
    );
    // The last shot's tail is held back: the deferred reload-start hooks live there,
    // and the ramp at its top has to be observable before they fire.
    if (shot < clip) finishShot(lastCtx);
  }

  // THE POINT: nothing caps the ramp before the magazine runs dry. Warmonger's
  // path ramp stops at 15 stacks; a frame that inherited that cap would stall here.
  //
  // Asserted through an explicitly-typed local, not on the live field: a strict
  // equality against the field would narrow its type to that literal for the rest
  // of the function, and the `=== 0` check after the reload — the thing this test
  // exists to prove — would become a comparison the compiler rejects as impossible.
  const stacksAtTop: number = reload.clipSpeedStacks;
  assert(
    stacksAtTop === clip,
    `the ramp must reach the clip length (${clip}), got ${stacksAtTop}`,
  );
  close(
    player.performsAttack.attackCooldown,
    Math.max(200, Math.round(baseCooldown / (1 + clip * perShot))),
    'the ramped cadence is derived from the captured base, not compounded',
  );

  // Damage rides the same ramp: nothing on the first round, most of it at the top.
  close(mults[0]!, 1, 'a fresh clip has no ramp and therefore no ramp damage');
  assert(
    mults[clip - 1]! > mults[Math.floor(clip / 2)]!,
    'the top of the ramp must add more damage than the middle of it',
  );
  assert(
    mults[clip - 1]! < topMult + 1e-9,
    `the ramp damage must not exceed its authored top (${topMult}), got ${mults[clip - 1]}`,
  );

  // Reset on reload. The last shot emptied the clip and started the timer; its
  // deferred start hooks fire on the tail, which is what clears the ramp.
  assert(reload.reloadingMs > 0, 'the emptied clip should have started a reload');
  // Read into a local: asserting on the live field would narrow its type to that
  // literal, and the `=== 0` check below — which `finishShot` is what makes true —
  // would then be a comparison the compiler believes can never hold.
  const stacksBeforeReset: number = reload.clipSpeedStacks;
  assert(
    stacksBeforeReset === clip,
    'the ramp is still at its top until the reload-start hooks run',
  );
  finishShot(lastCtx!);
  assert(
    reload.clipSpeedStacks === 0,
    `the reload must reset the ramp, got ${reload.clipSpeedStacks} stacks`,
  );
  close(
    player.performsAttack.attackCooldown,
    baseCooldown,
    'the reload hands the base cadence back',
  );
}

// ── Warmonger: the frame owns the ramp, the path defers ──────────────────────
//
// `reload-heavy-t3-b` still authors `reload.hair-trigger` (15 stacks on a 40-round
// clip). Both ramps write `clipSpeedStacks` and the attack cooldown, so if the path
// still ran the stacks would double per shot and stall at its own cap.

{
  const player = frame('fl-warmonger', 'reload', 'reload-root', 'heavy', ['reload-heavy-t3-b']);
  const target = punchbag(560);
  const reload = player.usesReload!;
  const passives = player.usesSkills.passives;
  const pathCap = Math.round(passives['reload.hair-trigger-max-stacks'] ?? 0);

  assert(
    (passives['reload.hair-trigger'] ?? 0) > 0,
    'Warmonger\'s authored ramp data must stay on the node — only the runtime defers',
  );
  assert(pathCap > 0 && pathCap < reload.ammoMax, 'Warmonger\'s cap should sit below its own clip');

  for (let shot = 1; shot <= pathCap + 3; shot++) {
    fireShot(player, target);
    assert(
      reload.clipSpeedStacks === shot,
      `one writer per shot: shot ${shot} should leave ${shot} stacks, got ${reload.clipSpeedStacks}`,
    );
  }
  assert(
    reload.clipSpeedStacks > pathCap,
    `the frame's ramp must pass the path's cap of ${pathCap}, got ${reload.clipSpeedStacks}`,
  );
}

// ── Spark: the discharge chains to a COUNT of bodies ─────────────────────────

{
  const player = frame('fl-spark', 'energy', 'energy-root', 'light');
  const passives = player.usesSkills.passives;
  const count = Math.round(passives['energy.frame-chain-targets'] ?? 0);
  const radius = passives['energy.frame-chain-radius'] ?? 0;
  const share = passives['energy.frame-chain-share'] ?? 0;

  assert(count === 2, `Spark should chain to two bodies, node says ${count}`);
  assert(radius > 0 && share > 0, 'Spark should author a chain radius and share');

  // Its own corner of the node: the chain reads the WHOLE node's bodies, so another
  // block's punchbag standing nearby would quietly become one of the two nearest.
  const LANE = 2_000;
  const primary = punchbag(600, LANE);
  // Three candidates inside the radius, so "two nearest" is a real selection and
  // not just "everything that happens to be nearby".
  const near1 = punchbag(primary.hasPosition.current.x + 30, LANE);
  const near2 = punchbag(primary.hasPosition.current.x + 60, LANE);
  const near3 = punchbag(primary.hasPosition.current.x + 90, LANE);
  const far = punchbag(primary.hasPosition.current.x + radius + 400, LANE);
  const before = [near1, near2, near3, far].map((m) => m.hasHealth.hp);

  setEmpoweredAttack(world, player);
  const ctx = makeCtx(player, primary);
  emitCombatEvent('onHit', ctx, world);
  assert(ctx.metadata['empoweredAttack'] === true, 'the discharge should have resolved');

  const hurt = [near1, near2, near3, far].filter((m, i) => m.hasHealth.hp < before[i]!);
  assert(
    hurt.length === count,
    `the chain should reach exactly ${count} bodies, reached ${hurt.length}`,
  );
  assert(
    hurt.includes(near1) && hurt.includes(near2),
    'the chain should pick the NEAREST bodies, not an arbitrary pair',
  );
  assert(far.hasHealth.hp === before[3], 'nothing outside the chain radius should be touched');
}

// ── Wisp's seam: the chain folds onto the primary instead ────────────────────
//
// `energy.range-far-single-target` is authored on another branch (W1-C). The
// agreement is on the KEY, so the test writes the key directly: what is pinned here
// is that the lookup is read defensively and that the folded share goes through the
// ONE multiplier, not a second one.

{
  const player = frame('fl-wisp', 'energy', 'energy-root', 'light');
  const passives = player.usesSkills.passives as Record<string, number | undefined>;
  const count = Math.round(passives['energy.frame-chain-targets'] ?? 0);
  const share = passives['energy.frame-chain-share'] ?? 0;
  const dischargeMult = passives['energy.empowered-mult'] ?? 1;
  passives['energy.range-far-single-target'] = 1;

  const LANE = 2_600;
  const primary = punchbag(600, LANE);
  const neighbour = punchbag(630, LANE);
  const neighbourHp = neighbour.hasHealth.hp;

  setEmpoweredAttack(world, player);
  const ctx = makeCtx(player, primary);
  emitCombatEvent('onHit', ctx, world);

  assert(
    neighbour.hasHealth.hp === neighbourHp,
    'with the single-target key set, nothing may chain',
  );
  close(
    empoweredMult(ctx),
    dischargeMult * (1 + count * share),
    'the share that would have chained folds onto the primary, through the one multiplier',
  );
  close(
    ctx.damage,
    Math.floor(Math.floor(BASE_DAMAGE * dischargeMult) * (1 + count * share)),
    'the folded damage matches the folded multiplier',
  );
}

// ── Wraith: the discharge opens a gain window ───────────────────────────────

{
  const player = frame('fl-wraith', 'energy', 'energy-root', 'balanced');
  const target = punchbag(700);
  const passives = player.usesSkills.passives;
  const energy = player.usesEnergy!;
  const windowMs = Math.round(passives['energy.frame-gain-window-ms'] ?? 0);
  const gainMult = passives['energy.frame-gain-mult'] ?? 0;

  assert(windowMs > 0, 'Wraith should author a gain window');
  assert(gainMult > 1, 'Wraith should author a gain multiplier');

  // One ordinary hit gives the baseline gain.
  energy.energy = 0;
  emitCombatEvent('afterHit', makeCtx(player, target), world);
  const baseGain = energy.energy;
  assert(baseGain > 0, 'an ordinary hit should build energy');

  // A window shorter than one charge cycle, or it is a flat stat (design §10).
  const hitsToFill = Math.ceil(energy.energyMax / baseGain);
  assert(
    windowMs < hitsToFill * player.performsAttack.attackCooldown,
    `the window (${windowMs}ms) must be shorter than one charge cycle ` +
      `(${hitsToFill} hits x ${player.performsAttack.attackCooldown}ms)`,
  );

  // Now the discharge, which opens the window.
  setEmpoweredAttack(world, player);
  emitCombatEvent('onHit', makeCtx(player, target), world);
  const window = getStatusEffect(player.tracksCombat, ENERGY_FRAME_WINDOW_EFFECT);
  assert(window !== undefined && window.remainingMs > 0, 'the discharge should open the window');
  close(window.data['totalMs'] ?? 0, windowMs, 'the window carries totalMs for the HUD clock');

  energy.energy = 0;
  emitCombatEvent('afterHit', makeCtx(player, target), world);
  close(
    energy.energy,
    Math.max(1, Math.round(baseGain * gainMult)),
    'a hit inside the window generates the multiplied gain',
  );

  // And it is ONE multiplication, not one per listener: the same hit again after the
  // window lapses is back to the baseline.
  window.remainingMs = 0;
  energy.energy = 0;
  emitCombatEvent('afterHit', makeCtx(player, target), world);
  close(energy.energy, baseGain, 'a lapsed window leaves the gain exactly as it was');
}

// ── Phantasm: energy above the cap banks into the discharge ──────────────────

{
  const player = frame('fl-phantasm', 'energy', 'energy-root', 'heavy');
  const target = punchbag(800);
  const passives = player.usesSkills.passives;
  const energy = player.usesEnergy!;
  const bankMax = Math.round(passives['energy.frame-overcharge-max'] ?? 0);
  const perStack = passives['energy.frame-overcharge-mult-per-stack'] ?? 0;
  const dischargeMult = passives['energy.empowered-mult'] ?? 1;
  const staggerMs = Math.round(passives['energy.frame-stagger-ms'] ?? 0);

  assert(bankMax > 0, 'Phantasm should author an overcharge cap');
  assert(perStack > 0, 'Phantasm should author a per-stack discharge bonus');
  assert(staggerMs > 0, 'Phantasm should author a stagger');

  energy.energy = 0;
  emitCombatEvent('afterHit', makeCtx(player, target), world);
  const perHit = energy.energy;
  assert(perHit > 0, 'an ordinary hit should build energy');

  // Fill to the cap. Nothing is banked yet — the bank is what lands ABOVE it.
  while (energy.energy < energy.energyMax) {
    emitCombatEvent('afterHit', makeCtx(player, target), world);
  }
  close(
    getResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE),
    0,
    'reaching the cap banks nothing',
  );
  assert(
    player.hasEmpoweredAttack === undefined,
    'Phantasm does not arm at the cap — it keeps taking energy above it',
  );

  // Each further hit banks one stack, and the bank is CAPPED.
  for (let i = 1; i <= bankMax; i++) {
    emitCombatEvent('afterHit', makeCtx(player, target), world);
    close(
      getResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE),
      i,
      `hit ${i} above the cap should bank ${i} stack(s)`,
    );
  }
  assert(player.hasEmpoweredAttack !== undefined, 'a full bank arms the discharge');
  close(energy.energy, 0, 'arming spends the pool');

  // The discharge spends the bank through the ONE multiplier, and staggers.
  const ctx = makeCtx(player, target);
  emitCombatEvent('onHit', ctx, world);
  close(
    empoweredMult(ctx),
    dischargeMult * (1 + bankMax * perStack),
    'the banked overcharge folds into the discharge multiplier',
  );
  close(
    getResource(player.tracksCombat, ENERGY_FRAME_OVERCHARGE_RESOURCE),
    0,
    'the discharge spends the whole bank',
  );
  assert(
    hasStatusEffect(target.tracksCombat, STUN_EFFECT),
    'the Phantasm discharge staggers what it hits',
  );

  // The cycle is LONGER by exactly the bank: the whole trade is fewer discharges for
  // bigger ones, so the hit count to arm is what proves the container is a bank and
  // not a flat bonus bolted onto the old threshold.
  let hits = 0;
  while (player.hasEmpoweredAttack === undefined) {
    emitCombatEvent('afterHit', makeCtx(player, target), world);
    hits++;
    assert(hits < 500, 'the pool never armed — the overcharge threshold is unreachable');
  }
  close(
    hits,
    Math.ceil(energy.energyMax / perHit) + bankMax,
    'arming takes the ordinary fill PLUS one hit per banked stack',
  );
}

// ── Splinter: a completed formation cycle opens the frenzy ───────────────────
//
// The cycle's own arithmetic is pinned in `mechanicFired.test.ts`; what this adds is
// that the frame's window opens on it and reaches the bodies.

{
  const player = frame('fl-splinter', 'summoner', 'summoner-root', 'light');
  const passives = player.usesSkills.passives;
  const windowMs = Math.round(passives['summoner.frame-frenzy-window-ms'] ?? 0);
  const apsPct = passives['summoner.frame-frenzy-aps-pct'] ?? 0;
  const onHitMult = passives['summoner.frame-frenzy-onhit-mult'] ?? 0;

  assert(windowMs > 0, 'Splinter should author a frenzy window');
  assert(apsPct > 0 && onHitMult > 1, 'Splinter should author both frenzy effects');

  updateSummonerArchetype(world, 0, 1_000);
  const bodies = player.summonsMinions!.minionIds
    .map((id) => (id ? world.getMinionEntity(id) : undefined))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  assert(bodies.length >= 2, `Splinter needs its swarm, got ${bodies.length} bodies`);

  const victim = punchbag(600, 3_200);
  const restingCooldown = bodies[0]!.performsAttack.attackCooldown;

  for (let i = 0; i < bodies.length - 1; i++) {
    runFormationAttack(world, player, bodies[i]!, victim, 2_000);
  }
  assert(
    getStatusEffect(player.tracksCombat, SUMMONER_FRAME_WINDOW_EFFECT) === undefined,
    'a partial cycle must not open the frenzy',
  );

  runFormationAttack(world, player, bodies[bodies.length - 1]!, victim, 2_000);
  const window = getStatusEffect(player.tracksCombat, SUMMONER_FRAME_WINDOW_EFFECT);
  assert(window !== undefined && window.remainingMs > 0, 'a completed cycle opens the frenzy');
  close(window.data['totalMs'] ?? 0, windowMs, 'the frenzy carries totalMs for the HUD clock');

  // A window that outlives a swing is a flat stat, not a loop (design §10).
  assert(
    windowMs < restingCooldown * bodies.length,
    `the frenzy (${windowMs}ms) must be shorter than one formation swing cycle`,
  );

  // The swarm's cadence comes from the per-tick resync, which is the single writer.
  updateSummonerArchetype(world, 0, 2_000);
  const frenzied = bodies[0]!.performsAttack.attackCooldown;
  assert(
    frenzied < restingCooldown,
    `the frenzy should quicken the swarm: ${frenzied}ms vs ${restingCooldown}ms at rest`,
  );
  window.remainingMs = 0;
  updateSummonerArchetype(world, 0, 2_100);
  close(
    bodies[0]!.performsAttack.attackCooldown,
    restingCooldown,
    'a lapsed frenzy hands the resting cadence back with nothing to un-apply',
  );
}

// ── Effigy: both bodies on one target spend the bank as a linked slam ────────

{
  const player = frame('fl-effigy', 'summoner', 'summoner-root', 'heavy');
  const passives = player.usesSkills.passives;
  const maxCharge = Math.round(passives['summoner.frame-link-max-charge'] ?? 0);
  const slamMult = passives['summoner.frame-link-slam-mult'] ?? 0;
  const staggerMs = Math.round(passives['summoner.frame-link-stagger-ms'] ?? 0);

  assert(maxCharge > 0 && slamMult > 0, 'Effigy should author a bank and a slam');
  assert(staggerMs > 0, 'Effigy should author a stagger');

  updateSummonerArchetype(world, 0, 1_000);
  const bodies = player.summonsMinions!.minionIds
    .map((id) => (id ? world.getMinionEntity(id) : undefined))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  assert(bodies.length === 2, `Effigy should field two bodies, got ${bodies.length}`);

  const victim = punchbag(600, 3_800);

  // One body hitting alone banks but never slams: a pair needs two bodies.
  runFormationAttack(world, player, bodies[0]!, victim, 2_000);
  assert(
    getResource(player.tracksCombat, SUMMONER_FRAME_LINK_RESOURCE) > 0,
    'the first body should bank its charge',
  );
  assert(
    getStatusEffect(victim.tracksCombat, SUMMONER_FRAME_LINK_EFFECT) !== undefined,
    'the pairing record should be held on the target, so it expires with the window',
  );
  assert(
    !hasStatusEffect(victim.tracksCombat, STUN_EFFECT),
    'one body is not a pair and must not slam',
  );
  runFormationAttack(world, player, bodies[0]!, victim, 2_050);
  assert(
    !hasStatusEffect(victim.tracksCombat, STUN_EFFECT),
    'the SAME body hitting twice is still not a pair',
  );

  const hpBefore = victim.hasHealth.hp;
  runFormationAttack(world, player, bodies[1]!, victim, 2_100);
  assert(
    hasStatusEffect(victim.tracksCombat, STUN_EFFECT),
    'the pair closing inside the window slams and staggers',
  );
  close(
    getResource(player.tracksCombat, SUMMONER_FRAME_LINK_RESOURCE),
    0,
    'the slam spends the whole bank',
  );
  assert(
    getStatusEffect(victim.tracksCombat, SUMMONER_FRAME_LINK_EFFECT) === undefined,
    'the pairing record is consumed with the slam, so the next pair starts clean',
  );
  const expectedSlam = Math.floor(player.dealsDamage.attack * 2 * slamMult);
  assert(
    hpBefore - victim.hasHealth.hp > expectedSlam,
    'the slam lands on top of the swing that completed the pair',
  );
}

// ── Consort: the line holds ───────────────────────────────
//
// The only frame container that is a STANDING condition rather than a window or a
// bank, so what breaks here is different in kind: the bonus surviving a death, the
// bonus never coming back after a reconstruction, or the two halves (the bodies'
// mitigation and the owner's HUD record) disagreeing because they were derived from
// two different readings of the formation.

{
  const player = frame('fl-consort', 'summoner', 'summoner-root', 'balanced');
  const passives = player.usesSkills.passives;
  const platingPct = passives['summoner.frame-line-plating-pct'] ?? 0;
  const drAdd = passives['summoner.frame-line-dr'] ?? 0;

  assert(platingPct > 0, 'Consort should author the plating share of the line');
  assert(drAdd > 0, 'Consort should author the damage reduction of the line');

  // Scaffolding, not balance: the plating half is a FRACTION of the owner's own
  // plating, and a naked test character has none for it to be a fraction of.
  player.mitigatesDamage.plating = 40;
  player.mitigatesDamage.damageReduction = 0.1;
  const basePlating = player.mitigatesDamage.plating;
  const baseDr = player.mitigatesDamage.damageReduction;

  const bodiesOf = (): MinionEntity[] => player.summonsMinions!.minionIds
    .map((id) => (id ? world.getMinionEntity(id) : undefined))
    .filter((m): m is MinionEntity => m !== undefined && m.hasHealth.hp > 0);

  const lineRecord = () => getStatusEffect(player.tracksCombat, SUMMONER_FRAME_LINE_EFFECT);
  const lineBeats = () => world.takeNodeEvents(NODE)
    .filter((ev) => ev.kind === 'frame-charge' && ev.playerId === player.isPlayer.id);

  world.takeNodeEvents(NODE);
  updateSummonerArchetype(world, 0, 10_000);
  const slots = player.summonsMinions!.targetCount;
  assert(slots === 5, `Consort should field five slots, got ${slots}`);
  assert(bodiesOf().length === slots, 'the whole formation should be standing after the first tick');

  // 1. Intact grants.
  const wholePlating = basePlating + Math.round(basePlating * platingPct);
  for (const body of bodiesOf()) {
    close(body.mitigatesDamage.plating, wholePlating, 'a held line plates every body');
    close(body.mitigatesDamage.damageReduction, baseDr + drAdd, 'a held line hardens every body');
  }
  close(lineRecord()?.data['intact'] ?? -1, 1, 'the HUD record should say the line is intact');
  const opened = lineBeats();
  assert(
    opened.length === 1 && opened[0]!.kind === 'frame-charge' && opened[0]!.stacks === slots,
    'the line closing should beat frame-charge at full',
  );
  updateSummonerArchetype(world, 0, 10_100);
  assert(lineBeats().length === 0, 'an unbroken line must not re-beat every tick');

  // 2. A death breaks it on the pass that observes the death.
  const fallen = bodiesOf()[0]!;
  fallen.hasHealth.hp = 0;
  updateSummonerArchetype(world, 0, 10_200);
  const survivors = bodiesOf();
  assert(survivors.length === slots - 1, `one loss should leave ${slots - 1} bodies, got ${survivors.length}`);
  for (const body of survivors) {
    close(body.mitigatesDamage.plating, basePlating, 'a broken line gives the plating back at once');
    close(body.mitigatesDamage.damageReduction, baseDr, 'a broken line gives the DR back at once');
  }
  close(lineRecord()?.data['intact'] ?? -1, 0, 'the HUD record should say the line is broken');
  const broke = lineBeats();
  assert(
    broke.length === 1 && broke[0]!.kind === 'frame-charge' && broke[0]!.stacks === 0,
    'the break should beat frame-charge at zero, the client release burst',
  );

  // 3. A completed reconstruction restores it.
  //
  // One tick with enough dt to run the queue head out, which is how the frame's
  // real lever reads: the player scales reconstruction, not a cadence.
  const reconstructionMs = summonerProfileFor(player).reconstructionIntervalMs;
  assert(reconstructionMs > 0, 'Consort should author a reconstruction interval');
  updateSummonerArchetype(world, reconstructionMs, 20_000);
  assert(bodiesOf().length === slots, 'the reconstruction should refill the slot');
  for (const body of bodiesOf()) {
    close(body.mitigatesDamage.plating, wholePlating, 'a restored line plates every body again');
    close(body.mitigatesDamage.damageReduction, baseDr + drAdd, 'a restored line hardens every body again');
  }
  close(lineRecord()?.data['intact'] ?? -1, 1, 'the HUD record should say the line holds again');
  const restored = lineBeats();
  assert(
    restored.length === 1 && restored[0]!.kind === 'frame-charge' && restored[0]!.stacks === slots,
    'the restore should beat frame-charge at full',
  );
}

console.log('frameLoopsRanged: ok');
