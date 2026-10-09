/**
 * Fire-shapes, live (design §22.10, "Fire-shape", LOCKED 2026-10-02).
 *
 * `abilityFireShapes.test.ts` pins the TABLE; this pins the RUNTIME: each
 * ability's packet and cross payoffs fire where and when its row says, through a
 * seam that already existed. One wiring smoke per fire-shape — attach the node,
 * drive the seam, count the firings (`card-fx`) and where they landed — never a
 * balance number.
 *
 * Exercised against a real `World` with fixtures, never a DB: CI provisions no
 * Postgres.
 *
 * Run: node --conditions=development --import tsx test/abilityFireShapesRuntime.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_PACKET_OFFERS,
  ABILITY_SIDESTEP_EFFECT_ID,
  ABILITY_SLOW_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityNodeFx,
  abilityNodeId,
  abilityOfferFireShape,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getAbilityNodeRuntime,
  getCooldown,
  getStatusEffect,
  guardEffectIdForAbility,
  lineageUnit,
  packetMoment,
  payoffLandsOnTarget,
  recoveryEffectIdForAbility,
  resolveAbilityEffect,
  setCooldown,
  type AbilityNodeProgress,
  type AmplifiedAxis,
  type CombatArchetype,
  type CombatEvent,
  type PacketId,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, makeCombatContext, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import {
  abilityNodeOwner, onAbilityNodeBodiesHit, refreshAbilityNodeRuntime, updateAbilityNodePulses,
} from '../src/systems/combat/abilityNodes';
import { abilityCooldownKey, techniqueCooldownMs } from '../src/systems/player/abilities/abilityCooldowns';
import { applyWardPercent, ownedWardOf } from '../src/systems/defense/barrier/wards';
import { capCd } from '../src/systems/combat/lineageKeys';
import { BRAMBLE_EFFECT_ID } from '../src/systems/player/abilities/abilityBramble';
import { armTechnique } from '../src/systems/player/abilities/abilityArming';
import { beginAbilityCast, updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { addLineageAffliction } from '../src/systems/combat/damage/lineageAffliction';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import { applyImbueWindow, imbueChargesRemaining } from '../src/systems/player/abilities/abilityImbue';
import { onTechniqueResolved } from '../src/systems/combat/techniqueResolved';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { applyStun } from '../src/systems/combat/status/stun';
import { requestManualAbilityUse } from '../src/systems/player/abilities/abilityFiring';
import { detachComponent } from '../src/ecs/markerHelpers';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Shared setup ────────────────────────────────────────────────────────────

const NODE = 'node-5-5';

initCombatSystems();

interface PlayerOptions {
  /** The ability under test: learned and attuned. */
  abilityId: string;
  nodes?: AbilityNodeProgress;
  tier?: number;
  archetype?: CombatArchetype | null;
  selectedClass?: string | null;
  unlockedSkills?: string[];
  x?: number;
}

function slices(id: string, opts: PlayerOptions): PersistedPlayerSlices {
  const ability = ABILITY_DATABASE.get(opts.abilityId);
  if (!ability) throw new Error(`fixture: unknown ability '${opts.abilityId}'`);
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: opts.x ?? 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {},
      playerTier: opts.tier ?? 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [opts.abilityId],
      attunedAbilities: ability.slot === 'technique'
        ? { techniques: [opts.abilityId], guards: [] }
        : { techniques: [], guards: [opts.abilityId] },
      ...(opts.nodes ? { abilityNodes: { [opts.abilityId]: opts.nodes } } : {}),
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: opts.unlockedSkills ?? [],
      passives: {},
      selectedClass: opts.selectedClass ?? null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: opts.archetype ?? null,
    },
  };
}

function spawnPlayer(world: World, id: string, opts: PlayerOptions): PlayerEntity {
  const player = world.attachPlayerEntity(slices(id, opts), id);
  if (opts.archetype) syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  refreshAbilityNodeRuntime(player);
  world.takeNodeEvents(NODE);
  return player;
}

/** Node progress for one ability: a packet route, optionally an amplifier axis and a cross. */
function rows(abilityId: string, picks: { packet: PacketId; amplifier?: AmplifiedAxis; cross?: PacketId }): AbilityNodeProgress {
  const packet = abilityNodeId(abilityId, 'packet', picks.packet);
  const progress: AbilityNodeProgress = { owned: [packet], active: { packet } };
  if (picks.amplifier) {
    const id = abilityNodeId(abilityId, 'amplifier', picks.packet, picks.amplifier);
    progress.owned.push(id);
    progress.active.amplifier = id;
  }
  if (picks.cross) {
    const id = abilityNodeId(abilityId, 'cross', picks.cross);
    progress.owned.push(id);
    progress.active.cross = id;
  }
  return progress;
}

/** A durable, unarmoured monster, so every observable is the rule's own. */
function spawnMonster(world: World, x: number, y = 400): MonsterEntity {
  const monster = world.createMonster(NODE, 'plains-slime', { x, y });
  if (!monster) throw new Error('fixture: failed to spawn a monster');
  monster.hasHealth.maxHp = 100_000;
  monster.hasHealth.hp = 100_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  return monster;
}

/** One landed player hit, through the `onHit` phase the riders listen on. */
function hit(world: World, player: PlayerEntity, defender: MonsterEntity, damage = 200): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

type CardFx = Extract<CombatEvent, { kind: 'card-fx' }>;

/** Drain the node's events and keep the `card-fx` ones. */
function cardFx(world: World): CardFx[] {
  return world.takeNodeEvents(NODE).filter((e): e is CardFx => e.kind === 'card-fx');
}

/** The bodies a list of firings named, sorted, for set comparisons. */
function targetsOf(fired: readonly CardFx[]): string {
  return fired.map((e) => e.targetId ?? '-').sort().join();
}

function idsOf(...monsters: MonsterEntity[]): string {
  return monsters.map((m) => m.isMonster.id).sort().join();
}

// ═══ on every body hit ══════════════════════════════════════════════════════

// ─── Sweep: on every body the cleave hits ────────────────────────────────────

{
  const world = new World();
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const effect = resolveAbilityEffect(sweep, { playerTier: 4 });
  if (effect.kind !== 'cleave') throw new Error('Sweep is a cleave');
  const player = spawnPlayer(world, 'fs-sweep', { abilityId: 'sweep', nodes: rows('sweep', { packet: 'tempo' }) });
  // Three bodies inside the cleave's circle around the struck one, one outside.
  const primary = spawnMonster(world, 1_000);
  const left = spawnMonster(world, 1_000 - effect.radius * 0.5);
  const right = spawnMonster(world, 1_000 + effect.radius * 0.5);
  const outside = spawnMonster(world, 1_000 + effect.radius * 3);
  world.takeNodeEvents(NODE);

  armTechnique(world, player, 'sweep');
  hit(world, player, primary);
  const fired = cardFx(world).filter((e) => e.fx === 'tempo.ghost-strike');
  assert(fired.length === 3, `a cleave over 3 bodies gives 3 firings, got ${fired.length}`);
  assert(targetsOf(fired) === idsOf(primary, left, right), 'one firing on each body the cleave hit, the outsider none');
  assert(outside.hasHealth.hp === outside.hasHealth.maxHp, 'the body outside the circle is untouched');

  // Once per resolution: the charge is spent, the next swing fires nothing.
  hit(world, player, primary);
  assert(cardFx(world).length === 0, 'an unarmed swing fires no node');
}

// ─── Slam: on every body the Slam hits ───────────────────────────────────────

{
  const world = new World();
  const slam = ABILITY_DATABASE.get('slam')!;
  const effect = resolveAbilityEffect(slam, { playerTier: 4 });
  if (effect.kind !== 'cast-strike' || !effect.radius) throw new Error('Slam is an area cast strike');
  const player = spawnPlayer(world, 'fs-slam', {
    abilityId: 'slam', nodes: rows('slam', { packet: 'control', cross: 'empowered' }),
  });
  const target = spawnMonster(world, 440);
  const second = spawnMonster(world, 440 + effect.radius * 0.4);
  const third = spawnMonster(world, 440 + effect.radius * 0.8);
  const outside = spawnMonster(world, 440 + effect.radius * 3);
  setAttackTarget(world, player, target.isMonster.id);
  world.takeNodeEvents(NODE);

  assert(beginAbilityCast(world, player, slam, 1_000), 'the Slam cast begins');
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  const fired = cardFx(world);
  const slows = fired.filter((e) => e.fx === 'control.frost-drag');
  const cracks = fired.filter((e) => e.fx === 'empowered.plating-crack');
  assert(slows.length === 3 && cracks.length === 3,
    `an area over 3 bodies gives 3 firings of the packet and 3 of the cross, got ${slows.length} and ${cracks.length}`);
  assert(targetsOf(slows) === idsOf(target, second, third), 'the packet fired on each body the Slam hit');
  assert(targetsOf(cracks) === idsOf(target, second, third), 'and so did the cross');
  assert(!fired.some((e) => e.targetId === outside.isMonster.id), 'never on a body outside the circle');
}

// ─── Slam: a self payoff fires once per resolution, a body payoff per body ───

{
  // Design §22.12: "a payoff that lands on the player or on the ability itself
  // fires once per resolution, whatever the number of bodies hit". The Technique
  // refund lands on Slam's own cooldown; the Control slow lands on each body.
  const world = new World();
  const slam = ABILITY_DATABASE.get('slam')!;
  const effect = resolveAbilityEffect(slam, { playerTier: 4 });
  if (effect.kind !== 'cast-strike' || !effect.radius) throw new Error('Slam is an area cast strike');
  const player = spawnPlayer(world, 'fs-slam-self', {
    abilityId: 'slam', nodes: rows('slam', { packet: 'technique', cross: 'control' }),
  });
  const share = getAbilityNodeRuntime(player.tracksCombat)?.['slam']?.payoff.magnitude ?? 0;
  assert(share > 0 && share < 1, `fixture: the refund is a share of the cooldown, got ${share}`);
  const target = spawnMonster(world, 440);
  const bodies = [
    target,
    spawnMonster(world, 440 + effect.radius * 0.3),
    spawnMonster(world, 440 + effect.radius * 0.6),
    spawnMonster(world, 440, 400 + effect.radius * 0.5),
  ];
  setAttackTarget(world, player, target.isMonster.id);
  world.takeNodeEvents(NODE);

  assert(beginAbilityCast(world, player, slam, 1_000), 'the Slam cast begins');
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  const fired = cardFx(world);
  const refunds = fired.filter((e) => e.fx === 'technique.cast-flare');
  const slows = fired.filter((e) => e.fx === 'control.frost-drag');
  assert(refunds.length === 1, `a Slam over 4 bodies refunds once, got ${refunds.length}`);
  assert(slows.length === 4 && targetsOf(slows) === idsOf(...bodies), `and its body payoff fires on all 4, got ${slows.length}`);
  // The cooldown took ONE share off, not four compounded.
  const full = techniqueCooldownMs(player, slam);
  const left = getCooldown(player.tracksCombat, abilityCooldownKey('slam'));
  assert(Math.abs(left - full * (1 - share)) <= 1, `one refund of ${share} off ${full} ms leaves ${full * (1 - share)}, got ${left}`);
}

// ─── Every every-body-hit route: self once, body per body (the classification) ─

{
  // The resolver's own split (`payoffLandsOnTarget`), for every route an area
  // Technique offers that fires on every body hit — four bodies, one resolution.
  for (const abilityId of ['sweep', 'slam', 'contagion']) {
    const ability = ABILITY_DATABASE.get(abilityId)!;
    for (const [lane, payoff] of ABILITY_PACKET_OFFERS.get(abilityId)!) {
      if (abilityOfferFireShape(abilityId, lane) !== 'on every body hit') continue;
      const world = new World();
      const player = spawnPlayer(world, `fs-split-${abilityId}-${lane}`, { abilityId, nodes: rows(abilityId, { packet: lane }) });
      const bodies = [0, 1, 2, 3].map((i) => spawnMonster(world, 1_000 + i * 20));
      // Something on each body for a DoT payoff to carry, and a running cooldown to refund.
      for (const body of bodies) addLineageAffliction(world, player, body, 600, 4_000);
      setCooldown(player.tracksCombat, abilityCooldownKey(abilityId), 10_000);
      world.takeNodeEvents(NODE);
      onAbilityNodeBodiesHit(world, player, ability, bodies);
      const fx = abilityNodeFx(lane, payoff);
      const fired = cardFx(world).filter((e) => e.fx === fx).length;
      const want = payoffLandsOnTarget(payoff) ? bodies.length : 1;
      assert(fired === want, `${abilityId} ${lane}/${payoff} over 4 bodies: ${want} firing(s), got ${fired}`);
    }
  }
}

// ─── Contagion: on every body the spread reaches ─────────────────────────────

{
  const world = new World();
  const contagion = ABILITY_DATABASE.get('contagion')!;
  const effect = resolveAbilityEffect(contagion, { playerTier: 4 });
  if (effect.kind !== 'spread-dots') throw new Error('Contagion spreads');
  assert(effect.maxTargets >= 2, 'the fixture needs room for two recipients');
  const player = spawnPlayer(world, 'fs-contagion', {
    abilityId: 'contagion', nodes: rows('contagion', { packet: 'control' }),
  });
  const source = spawnMonster(world, 1_000);
  const near = spawnMonster(world, 1_000 + effect.radius * 0.4);
  const far = spawnMonster(world, 1_000 - effect.radius * 0.6);
  const outside = spawnMonster(world, 1_000 + effect.radius * 4);
  assert(addLineageAffliction(world, player, source, 600, 4_000) !== null, 'the source carries something to spread');
  world.takeNodeEvents(NODE);

  armTechnique(world, player, 'contagion');
  hit(world, player, source);
  const fired = cardFx(world).filter((e) => e.fx === 'control.frost-drag');
  assert(fired.length === 2, `a spread to 2 recipients gives 2 firings, got ${fired.length}`);
  assert(targetsOf(fired) === idsOf(near, far), 'on each body the spread reached — not the source it spread from');
  assert(!fired.some((e) => e.targetId === outside.isMonster.id), 'never on a body the spread did not reach');
}

// ─── Contagion with nothing to spread reaches nobody, so fires nothing ───────

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-contagion-dry', {
    abilityId: 'contagion', nodes: rows('contagion', { packet: 'control' }),
  });
  const source = spawnMonster(world, 1_000);
  spawnMonster(world, 1_040);
  world.takeNodeEvents(NODE);
  // Armed directly: the firing gate that declines a dry Contagion is not this test's.
  armTechnique(world, player, 'contagion');
  hit(world, player, source);
  assert(cardFx(world).length === 0, 'a spread that reached no body fires no node payoff');
}

// ─── Conduit Slam: per body THAT ONE cast hit, never per formation body ──────

{
  const world = new World();
  const slam = ABILITY_DATABASE.get('slam')!;
  const effect = resolveAbilityEffect(slam, { playerTier: 4 });
  if (effect.kind !== 'cast-strike' || !effect.radius) throw new Error('Slam is an area cast strike');
  const player = spawnPlayer(world, 'fs-conduit-slam', {
    abilityId: 'slam', nodes: rows('slam', { packet: 'empowered', cross: 'control' }),
    archetype: 'summoner', selectedClass: 'summoner-root', unlockedSkills: ['summoner-root'],
  });
  updateSummonerArchetype(world, 0, 1_000);
  const minions = (player.summonsMinions?.minionIds ?? [])
    .map((entityId) => world.getMinionEntity(entityId))
    .filter((m): m is MinionEntity => m !== undefined);
  assert(minions.length > 1, `fixture: a Conduit needs a formation, got ${minions.length}`);
  refreshAbilityNodeRuntime(player);
  const caster = minions[0]!;
  const at = caster.hasPosition.current;
  const target = spawnMonster(world, at.x + 24, at.y);
  const second = spawnMonster(world, at.x + 24 + effect.radius * 0.4, at.y);
  const third = spawnMonster(world, at.x + 24, at.y + effect.radius * 0.5);
  setAttackTarget(world, caster, target.isMonster.id);
  world.takeNodeEvents(NODE);

  assert(beginAbilityCast(world, player, slam, 1_000), 'the Conduit begins its Slam');
  assert(player.isCastingAbility?.casterMinionId === caster.entityId, 'one physical summon delivers the cast');
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  const fired = cardFx(world);
  const cracks = fired.filter((e) => e.fx === 'empowered.plating-crack');
  const slows = fired.filter((e) => e.fx === 'control.frost-drag');
  assert(
    cracks.length === 3 && slows.length === 3,
    `3 bodies in that one cast's circle: 3 packet and 3 cross firings over ${minions.length} summons, got ${cracks.length} and ${slows.length}`,
  );
  assert(targetsOf(cracks) === idsOf(target, second, third), 'each body the cast hit, once');
}

// ─── A formation Sweep: each body THAT first delivery's cleave hit, once ─────

{
  const world = new World();
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const effect = resolveAbilityEffect(sweep, { playerTier: 4 });
  if (effect.kind !== 'cleave') throw new Error('Sweep is a cleave');
  const player = spawnPlayer(world, 'fs-conduit-sweep', {
    abilityId: 'sweep', nodes: rows('sweep', { packet: 'tempo' }),
    archetype: 'summoner', selectedClass: 'summoner-root', unlockedSkills: ['summoner-root'],
  });
  updateSummonerArchetype(world, 0, 1_000);
  const minions = (player.summonsMinions?.minionIds ?? [])
    .map((entityId) => world.getMinionEntity(entityId))
    .filter((m): m is MinionEntity => m !== undefined);
  assert(minions.length > 1, `fixture: a Conduit needs a formation, got ${minions.length}`);
  refreshAbilityNodeRuntime(player);
  const at = minions[0]!.hasPosition.current;
  const target = spawnMonster(world, at.x + 24, at.y);
  const beside = spawnMonster(world, at.x + 24 + effect.radius * 0.5, at.y);
  world.takeNodeEvents(NODE);

  armTechnique(world, player, 'sweep');
  const fx: CardFx[] = [];
  minions.forEach((minion, index) => {
    runFormationAttack(world, player, minion, target, 5_000 + index);
    fx.push(...cardFx(world));
  });
  const echoes = fx.filter((e) => e.fx === 'tempo.ghost-strike');
  assert(
    echoes.length === 2 && targetsOf(echoes) === idsOf(target, beside),
    `the first delivery's cleave over 2 bodies fires twice across ${minions.length} deliveries, got ${echoes.length}`,
  );
}

// ═══ on each hit of a window ════════════════════════════════════════════════

// ─── Imbue Lightning: on each imbued hit, each spent charge one firing ───────

{
  const world = new World();
  const imbue = ABILITY_DATABASE.get('imbue-lightning')!;
  const effect = resolveAbilityEffect(imbue, { playerTier: 4 });
  if (effect.kind !== 'imbue') throw new Error('Imbue Lightning imbues');
  assert(effect.charges >= 4, 'the fixture spends three charges and keeps one');
  const player = spawnPlayer(world, 'fs-imbue', {
    abilityId: 'imbue-lightning', nodes: rows('imbue-lightning', { packet: 'tempo' }),
  });
  const bodies = [spawnMonster(world, 600), spawnMonster(world, 1_200), spawnMonster(world, 1_800)];
  world.takeNodeEvents(NODE);

  // The instant path: the window opens and the Technique resolves — with no body
  // to fire on, so its node waits for the hits.
  applyImbueWindow(world, player, imbue);
  onTechniqueResolved(world, player, imbue);
  assert(cardFx(world).length === 0, 'opening the window fires nothing');

  for (const body of bodies) hit(world, player, body);
  const fired = cardFx(world).filter((e) => e.fx === 'tempo.ghost-strike');
  assert(fired.length === 3, `3 charges spent give 3 firings, got ${fired.length}`);
  assert(targetsOf(fired) === idsOf(...bodies), 'each on the target of the hit that spent the charge');
  assert(imbueChargesRemaining(player) === effect.charges - 3, 'one charge per hit');
}

// ─── A capped lane pays at most once per its cap, however fast the charges go ─

{
  const world = new World();
  const imbue = ABILITY_DATABASE.get('imbue-lightning')!;
  const player = spawnPlayer(world, 'fs-imbue-cap', {
    abilityId: 'imbue-lightning', nodes: rows('imbue-lightning', { packet: 'empowered' }),
  });
  const capMs = packetMoment('empowered')?.capMs ?? 0;
  assert(capMs > 0, 'the Empowered moment carries a rate cap');
  const target = spawnMonster(world, 600);
  world.takeNodeEvents(NODE);
  applyImbueWindow(world, player, imbue);
  for (let i = 0; i < 3; i++) hit(world, player, target);
  const brands = cardFx(world).filter((e) => e.fx === 'empowered.weak-point');
  assert(brands.length === 1, `three charges inside one cap pay once, got ${brands.length}`);
  // The cap's clock runs out; the next charge pays again.
  updateCombatState(world, capMs);
  hit(world, player, target);
  assert(cardFx(world).filter((e) => e.fx === 'empowered.weak-point').length === 1, 'and again once the cap has run');
  // With the window spent, a hit pays nothing.
  while (imbueChargesRemaining(player) > 0) hit(world, player, target);
  world.takeNodeEvents(NODE);
  updateCombatState(world, capMs);
  hit(world, player, target);
  assert(cardFx(world).length === 0, 'a hit with no charge left fires no node');
}

// ═══ Guards: per hit absorbed, per hit dodged ═══════════════════════════════

/**
 * The cap a Guard route fires under (design §22.12), read straight off the packet
 * table: the lane's own moment cap, else Control's — the existing lane cap the
 * uncapped Guard lanes borrow.
 */
function guardRouteCap(lane: PacketId): number {
  const own = packetMoment(lane)?.capMs ?? 0;
  return own > 0 ? own : packetMoment('control')?.capMs ?? 0;
}

/** One incoming monster hit on `player`, through the `onDamageTaken` phase. */
function incoming(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  metadata: Record<string, unknown> = {},
  damage = 50,
): CombatContext {
  const ctx = makeCombatContext(monster, 'monster', player, 'player');
  ctx.damage = damage;
  Object.assign(ctx.metadata, metadata);
  emitCombatEvent('onDamageTaken', ctx, world);
  return ctx;
}

/** Cast a Guard the way a hotbar press does — its own effect, then `onGuardFired`. */
function castGuard(world: World, player: PlayerEntity, abilityId: string): void {
  const result = requestManualAbilityUse(world, player, abilityId, 1_000);
  assert(result.state === 'activated', `fixture: ${abilityId} must activate, got ${result.state} (${result.reason ?? ''})`);
}

// ─── Brace: per hit absorbed while Braced, each firing under its lane's cap ──

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-brace', {
    abilityId: 'brace', nodes: rows('brace', { packet: 'barrier-tempo', cross: 'control' }),
  });
  const attacker = spawnMonster(world, 440);
  world.takeNodeEvents(NODE);
  const controlCap = packetMoment('control')?.capMs ?? 0;
  assert(controlCap > 0, 'the Control moment carries a rate cap');

  castGuard(world, player, 'brace');
  assert(cardFx(world).length === 0, 'Brace fires nothing on its cast: it pays per hit absorbed');

  incoming(world, attacker, player);
  incoming(world, attacker, player);
  const fired = cardFx(world);
  const wards = fired.filter((e) => e.fx === 'barrier-tempo.ward-shell');
  const braced = fired.filter((e) => e.fx === 'control.chill-blur');
  // Design §22.12: every per-hit Guard route is capped — Barrier tempo has no cap
  // of its own, so it borrows Control's.
  assert(wards.length === 1, `2 hits absorbed inside one cap give 1 firing of the ward route, got ${wards.length}`);
  assert(braced.length === 1, `and the Control cross pays once per its ${controlCap} ms cap, got ${braced.length}`);

  // A dodge outright is no hit absorbed.
  incoming(world, attacker, player, { evaded: true, evadeMitigation: 1 });
  assert(cardFx(world).length === 0, 'a hit dodged outright is not absorbed');
  // A DoT tick is no hit.
  incoming(world, attacker, player, { isDot: true });
  assert(cardFx(world).length === 0, 'a damage-over-time tick is not a hit');

  // The window drops: nothing more.
  const brace = resolveAbilityEffect(ABILITY_DATABASE.get('brace')!, { playerTier: 4 });
  if (brace.kind !== 'damage-reduction') throw new Error('Brace is a damage reduction');
  updateCombatState(world, brace.durationMs + controlCap);
  incoming(world, attacker, player);
  assert(cardFx(world).length === 0, 'a hit after the window fires nothing');
}

// ─── Brace's ward: a node's ward refreshes the one ward it owns ──────────────

{
  // Design §22.12: "a ward a node fires refreshes the one ward that node owns
  // instead of stacking a new one". Three firings, one ward — topped up to the
  // payoff's size, its window renewed. Wards from other sources still stack.
  const world = new World();
  const player = spawnPlayer(world, 'fs-brace-ward', {
    abilityId: 'brace', nodes: rows('brace', { packet: 'barrier-tempo' }),
  });
  const attacker = spawnMonster(world, 440);
  world.takeNodeEvents(NODE);
  const payoff = getAbilityNodeRuntime(player.tracksCombat)?.['brace']?.payoff;
  if (!payoff || payoff.kind !== 'ward' || !payoff.durationMs) throw new Error("fixture: Brace's ward route");
  const size = Math.round(player.hasHealth.maxHp * payoff.magnitude);
  const capKey = capCd(abilityNodeId('brace', 'packet', 'barrier-tempo'));

  castGuard(world, player, 'brace');
  let fired = 0;
  for (let i = 0; i < 3; i++) {
    // This block pins the ward, not the rate cap: open the route's cap each hit.
    setCooldown(player.tracksCombat, capKey, 0);
    updateCombatState(world, 100);
    incoming(world, attacker, player, {}, Math.round(size / 3));
    fired += cardFx(world).filter((e) => e.fx === 'barrier-tempo.ward-shell').length;
  }
  assert(fired === 3, `fixture: Brace's ward route fired on 3 absorbed hits, got ${fired}`);
  const wards = player.holdsWards?.wards ?? [];
  const owned = ownedWardOf(player, abilityNodeOwner('brace'));
  assert(wards.length === 1 && owned === wards[0], `3 firings leave ONE node ward, got ${wards.length}`);
  assert(owned!.amount === size, `topped up to the payoff's size ${size} after the hit drained it, got ${owned!.amount}`);
  assert(owned!.remainingMs === payoff.durationMs, `its window renewed to ${payoff.durationMs} ms, got ${owned!.remainingMs}`);

  // Other ward sources are untouched: they stack beside it, and a node refresh
  // leaves them alone.
  applyWardPercent(world, player, payoff.magnitude, payoff.durationMs);
  applyWardPercent(world, player, payoff.magnitude, payoff.durationMs);
  assert(player.holdsWards!.wards.length === 3, 'two unowned wards stack beside the node ward');
  setCooldown(player.tracksCombat, capKey, 0);
  world.takeNodeEvents(NODE);
  incoming(world, attacker, player, { evaded: true, evadeMitigation: 0.5 }, 1);
  assert(cardFx(world).filter((e) => e.fx === 'barrier-tempo.ward-shell').length === 1, 'fixture: a graze is absorbed, the node fires');
  assert(player.holdsWards!.wards.length === 3, 'a node refresh adds no ward and removes none');
}

// ─── Bramble Guard: per thorn hit — each hit taken while brambled ────────────

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-bramble', {
    abilityId: 'bramble-guard', nodes: rows('bramble-guard', { packet: 'bulwark' }),
  });
  const attacker = spawnMonster(world, 440);
  world.takeNodeEvents(NODE);

  incoming(world, attacker, player);
  assert(cardFx(world).length === 0, 'unbrambled, a hit fires nothing');

  castGuard(world, player, 'bramble-guard');
  assert(cardFx(world).length === 0, 'Bramble Guard fires nothing on its cast');
  incoming(world, attacker, player);
  const fired = cardFx(world).filter((e) => e.fx === 'bulwark.plating-chip');
  assert(fired.length === 1, `a thorn hit gives one firing, got ${fired.length}`);
}

// ─── Bramble Guard's three routes: at most once per cap window each ─────────

{
  // Design §22.12: "every per-hit and per-tick Guard route carries a rate cap,
  // the packet's own where it has one and an existing lane cap otherwise". The
  // thorns held up for 30 s, a hit every 1.5 s; each route on its own.
  const SPAN = 30_000;
  const EVERY = 1_500;
  const TICK = 100;
  for (const [lane, payoff] of ABILITY_PACKET_OFFERS.get('bramble-guard')!) {
    const world = new World();
    const player = spawnPlayer(world, `fs-bramble-cap-${lane}`, {
      abilityId: 'bramble-guard', nodes: rows('bramble-guard', { packet: lane }),
    });
    const attacker = spawnMonster(world, 440);
    world.takeNodeEvents(NODE);
    const fx = abilityNodeFx(lane, payoff);
    const cap = guardRouteCap(lane);
    assert(cap > EVERY, `fixture: ${lane}'s cap outlasts the hit interval`);

    castGuard(world, player, 'bramble-guard');
    const at: number[] = [];
    for (let t = 0; t < SPAN; t += TICK) {
      const thorns = getStatusEffect(player.tracksCombat, BRAMBLE_EFFECT_ID);
      if (!thorns) throw new Error('fixture: the thorns are up');
      thorns.remainingMs = SPAN; // held up the whole span
      if (t % EVERY === 0) incoming(world, attacker, player);
      for (const e of cardFx(world)) if (e.fx === fx) at.push(t);
      updateCombatState(world, TICK);
    }
    const hits = SPAN / EVERY;
    assert(at.length >= 2 && at.length <= Math.ceil(SPAN / cap),
      `bramble ${lane}/${payoff}: ${hits} hits fire at most once per ${cap} ms (≤ ${Math.ceil(SPAN / cap)}), got ${at.length}`);
    for (let i = 1; i < at.length; i++) {
      assert(at[i]! - at[i - 1]! >= cap, `bramble ${lane}/${payoff}: firings ${at[i - 1]} and ${at[i]} inside one ${cap} ms cap`);
    }
  }
}

// ─── Sidestep: per hit dodged during the window ──────────────────────────────

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-sidestep', {
    abilityId: 'sidestep', nodes: rows('sidestep', { packet: 'engagement' }),
  });
  // Something in reach to step away from (Sidestep's own firing gate).
  const attacker = spawnMonster(world, 430);
  world.takeNodeEvents(NODE);

  // A dodge before the window: nothing.
  incoming(world, attacker, player, { evaded: true, evadeMitigation: 0.5 });
  assert(cardFx(world).length === 0, 'a dodge outside the window fires nothing');

  castGuard(world, player, 'sidestep');
  assert(cardFx(world).length === 0, 'Sidestep fires nothing on its cast');
  incoming(world, attacker, player, { evaded: true, evadeMitigation: 0.5 });
  const fired = cardFx(world).filter((e) => e.fx === 'engagement.brace-sparks');
  assert(fired.length === 1, `a dodge in the window gives one firing, got ${fired.length}`);
  incoming(world, attacker, player);
  assert(cardFx(world).length === 0, 'a hit that was not dodged fires nothing');

  // The window runs out: a dodge after it fires nothing.
  const window = getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID);
  if (!window || window.remainingMs <= 0) throw new Error('the window is up');
  updateCombatState(world, window.remainingMs);
  incoming(world, attacker, player, { evaded: true, evadeMitigation: 0.5 });
  assert(cardFx(world).length === 0, 'a dodge after the window fires nothing');
}

// ═══ per tick while active ══════════════════════════════════════════════════

/**
 * Step the clock in world ticks for `ms`, running the pulse driver after the
 * decay as `World.tick` does, and return how many of the given fx fired.
 */
function pulseFor(world: World, ms: number, fx: string): number {
  const TICK = 100;
  let fired = 0;
  for (let t = 0; t < ms; t += TICK) {
    updateCombatState(world, TICK);
    updateAbilityNodePulses(world);
    fired += cardFx(world).filter((e) => e.fx === fx).length;
  }
  return fired;
}

// ─── Endure: per tick while held, and not once it drops ──────────────────────

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-endure', {
    abilityId: 'endure', nodes: rows('endure', { packet: 'bulwark' }),
  });
  world.takeNodeEvents(NODE);
  const PULSE = lineageUnit('pulseMs');

  // Nothing pulses before the hold.
  assert(pulseFor(world, PULSE * 2, 'bulwark.plating-chip') === 0, 'no hold, no pulse');

  castGuard(world, player, 'endure');
  assert(cardFx(world).length === 0, 'Endure fires nothing on its cast itself');
  const hold = getStatusEffect(player.tracksCombat, guardEffectIdForAbility('endure')!);
  if (!hold || hold.remainingMs <= 0) throw new Error('the hold is up');
  const heldMs = hold.remainingMs;
  // The first pulse on the tick the hold comes up, then one per pulse while it
  // holds — under the route's cap (design §22.12): Bulwark has none of its own,
  // so Control's, and a cap longer than the pulse sets the cadence.
  const cadence = Math.max(PULSE, guardRouteCap('bulwark'));
  assert(cadence > PULSE, 'fixture: the borrowed cap is longer than the pulse');
  updateAbilityNodePulses(world);
  let fired = cardFx(world).filter((e) => e.fx === 'bulwark.plating-chip').length;
  fired += pulseFor(world, heldMs, 'bulwark.plating-chip');
  const expected = Math.ceil(heldMs / cadence);
  assert(expected >= 2, 'the fixture holds long enough for more than one pulse');
  assert(fired === expected, `a ${heldMs} ms hold pulses ${expected} times at ${cadence} ms, got ${fired}`);
  assert(pulseFor(world, PULSE * 3, 'bulwark.plating-chip') === 0, 'the pulses stop when the hold drops');
}

// ─── Recuperate: per tick of the mend ────────────────────────────────────────

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-recuperate', {
    abilityId: 'recuperate', nodes: rows('recuperate', { packet: 'tempo' }),
  });
  player.hasHealth.hp = Math.round(player.hasHealth.maxHp / 2); // something to mend
  world.takeNodeEvents(NODE);
  castGuard(world, player, 'recuperate');
  const mend = getStatusEffect(player.tracksCombat, recoveryEffectIdForAbility('recuperate')!);
  if (!mend || mend.remainingMs <= 0) throw new Error('the mend is up');
  const mendMs = mend.remainingMs;
  updateAbilityNodePulses(world);
  let fired = cardFx(world).filter((e) => e.fx === 'tempo.evasive-blur').length;
  fired += pulseFor(world, mendMs + lineageUnit('pulseMs'), 'tempo.evasive-blur');
  const cadence = Math.max(lineageUnit('pulseMs'), guardRouteCap('tempo'));
  assert(fired === Math.ceil(mendMs / cadence), `the mend pulses every ${cadence} ms while it runs, got ${fired}`);
}

// ═══ on strip ═══════════════════════════════════════════════════════════════

// ─── Cleanse: on strip — a self payoff once per strip, whatever it removed ───

{
  // Every Cleanse offer lands on the player (a ward, a window, a plating stack),
  // so design §22.12's "once per resolution" holds: one strip, one firing. A strip
  // that removed nothing fires nothing.
  const cleanse = resolveAbilityEffect(ABILITY_DATABASE.get('cleanse')!, { playerTier: 4 });
  if (cleanse.kind !== 'cleanse') throw new Error('Cleanse cleanses');
  assert(cleanse.debuffs >= 2, 'the fixture strips two kinds');
  const afflict = (player: PlayerEntity, ids: readonly string[]): void => {
    for (const id of ids) {
      applyStatusEffect(player.tracksCombat, {
        id, maxStacks: 1, remainingMs: 6_000, refreshable: true, sourceId: 'tester', data: {},
      });
    }
  };

  for (const [label, ids] of [['two kinds', ['antiheal', 'slow']], ['one kind', ['antiheal']]] as const) {
    const world = new World();
    const player = spawnPlayer(world, `fs-cleanse-${ids.length}`, {
      abilityId: 'cleanse', nodes: rows('cleanse', { packet: 'barrier-tempo' }),
    });
    afflict(player, ids);
    world.takeNodeEvents(NODE);
    castGuard(world, player, 'cleanse');
    const fired = cardFx(world).filter((e) => e.fx === 'barrier-tempo.ward-shell');
    assert(fired.length === 1, `a Cleanse that strips ${label} fires its self payoff once, got ${fired.length}`);
    assert((player.holdsWards?.wards.length ?? 0) === 1, 'one ward per strip, not one per kind');
    for (const id of ids) {
      assert(getStatusEffect(player.tracksCombat, id) === undefined, `${id} was stripped`);
    }
  }
}

// ═══ on land: the body you broke from, and Charge's target ══════════════════

// ─── Disengage: on the body you broke from ───────────────────────────────────

{
  const world = new World();
  const player = spawnPlayer(world, 'fs-disengage', {
    abilityId: 'disengage', nodes: rows('disengage', { packet: 'control' }), x: 1_000,
  });
  const threat = spawnMonster(world, 1_030);
  const bystander = spawnMonster(world, 2_400);
  setAttackTarget(world, player, threat.isMonster.id);
  world.takeNodeEvents(NODE);
  const before = { ...player.hasPosition.current };

  const result = requestManualAbilityUse(world, player, 'disengage', 1_000);
  assert(result.state === 'activated', `Disengage activates, got ${result.state} (${result.reason ?? ''})`);
  assert(player.hasPosition.current.x !== before.x || player.hasPosition.current.y !== before.y, 'the player broke away');
  const fired = cardFx(world).filter((e) => e.fx === 'control.frost-drag');
  assert(fired.length === 1, `one firing on the departure, got ${fired.length}`);
  assert(fired[0]!.targetId === threat.isMonster.id, 'on the body the player broke from');
  assert(getStatusEffect(threat.tracksCombat, ABILITY_SLOW_EFFECT_ID) !== undefined, 'its Control slow landed on that body');
  assert(getStatusEffect(bystander.tracksCombat, ABILITY_SLOW_EFFECT_ID) === undefined, 'and on nobody else');

  // The seam itself, with no live attack target to fall back on: the resolution
  // names the body it broke from, and without it the slow lands on nobody (the
  // wave-1 gap).
  const disengage = ABILITY_DATABASE.get('disengage')!;
  const other = spawnMonster(world, 2_000);
  detachComponent(world, player, 'hasAttackTarget');
  world.takeNodeEvents(NODE);
  updateCombatState(world, packetMoment('control')?.capMs ?? 0);
  onTechniqueResolved(world, player, disengage);
  assert(cardFx(world).length === 0, 'a departure that names no body slows nobody');
  onTechniqueResolved(world, player, disengage, { departedFrom: other });
  const named = cardFx(world).filter((e) => e.fx === 'control.frost-drag');
  assert(named.length === 1 && named[0]!.targetId === other.isMonster.id, 'the named body takes the slow');
}

// ─── Charge: on its target on arrival — the rush has no contact seam ─────────

{
  // Design §22.10 also reads "on the first body the rush touches". The rush is a
  // player moving through monster bodies (movement collides with terrain only),
  // so there is no first-touched body to fire on: Charge stays on its target.
  const world = new World();
  const player = spawnPlayer(world, 'fs-charge', {
    abilityId: 'charge', nodes: rows('charge', { packet: 'empowered' }),
  });
  const target = spawnMonster(world, 700);
  const passed = spawnMonster(world, 550);
  world.takeNodeEvents(NODE);
  armTechnique(world, player, 'charge');
  hit(world, player, target);
  const fired = cardFx(world).filter((e) => e.fx === 'empowered.weak-point');
  assert(fired.length === 1 && fired[0]!.targetId === target.isMonster.id, 'Charge fires once, on its target on arrival');
  assert(getStatusEffect(passed.tracksCombat, 'vulnerability') === undefined, 'never on a body the rush passed');
}

// ═══ on cast, on the break: unchanged, through the real cast ════════════════

{
  // Second Wind: on cast, once.
  const world = new World();
  const player = spawnPlayer(world, 'fs-second-wind', {
    abilityId: 'second-wind', nodes: rows('second-wind', { packet: 'bulwark' }),
  });
  player.hasHealth.hp = Math.round(player.hasHealth.maxHp / 2);
  const attacker = spawnMonster(world, 440);
  world.takeNodeEvents(NODE);
  castGuard(world, player, 'second-wind');
  assert(cardFx(world).filter((e) => e.fx === 'bulwark.plating-chip').length === 1, 'Second Wind fires once on its cast');
  incoming(world, attacker, player);
  updateCombatState(world, lineageUnit('pulseMs'));
  updateAbilityNodePulses(world);
  assert(cardFx(world).length === 0, 'and on no hit or pulse after it');
}

{
  // Break Free: on the break — it only casts while held, so its cast IS the break.
  const world = new World();
  const player = spawnPlayer(world, 'fs-break-free', {
    abilityId: 'break-free', nodes: rows('break-free', { packet: 'barrier-tempo' }),
  });
  world.takeNodeEvents(NODE);
  const free = requestManualAbilityUse(world, player, 'break-free', 1_000);
  assert(free.state !== 'activated', 'with nothing holding the player, Break Free does not cast');
  assert(cardFx(world).length === 0, 'so nothing fires');
  detachComponent(world, player, 'queuesAbilities'); // a refused press queues; clear it
  applyStun(player.tracksCombat, 2_000, 'tester');
  castGuard(world, player, 'break-free');
  assert(cardFx(world).filter((e) => e.fx === 'barrier-tempo.ward-shell').length === 1, 'the break fires once');
}

console.log('abilityFireShapesRuntime: ok');
