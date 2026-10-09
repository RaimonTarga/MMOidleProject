/**
 * Ability keystones — wiring smokes (design §22.4, §22.10, §22.11).
 *
 * One block per keystone verb, each on its own `World` built by the shared setup
 * below: attach the verb, resolve its ability, tick, and assert the rule's
 * OBSERVABLE (the extra hits land, the root spreads, the stagger holds) — never a
 * balance number. Later waves append a block per verb in the same shape.
 *
 * Also here, because they are the rules every verb is built against:
 *  - the registry: every live verb has a module and every module's verb is live;
 *  - the delivery bodies (§22.11): a node payoff on a Conduit cast resolves ONCE
 *    per cast, through the one physical summon; a formation rider's node payoffs
 *    share the rider's one budget — once per Technique, never once per body;
 *  - a keystone area hit is not an attack: it is no attack-equivalent for Sweep's
 *    Tempo and never advances the weapon verb's hit counter;
 *  - Reload: keystone echoes are first-hit-only;
 *  - every on-hit application early-returns on `evadeBlocksDebuffs(ctx)`.
 *
 * Exercised against a real `World` with fixtures, never a DB: CI provisions no
 * Postgres.
 *
 * Run: node --conditions=development --import tsx test/abilityKeystones.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_ROOT_EFFECT_ID,
  ABILITY_KEYSTONE_DEFINITIONS,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityKeystoneNodeId,
  abilityNodeId,
  baseRecoveryForTier,
  emptyEquipment,
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
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { refreshAbilityNodeRuntime } from '../src/systems/combat/abilityNodes';
import { ABILITY_KEYSTONE_MODULES } from '../src/systems/combat/keystones';
import { armTechnique } from '../src/systems/player/abilities/abilityArming';
import { beginAbilityCast, updateAbilityCasts, updateAbilityCharges } from '../src/systems/player/abilities/abilityCasting';
import { updateMovement } from '../src/systems/world/movement';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';
import { addLineageAffliction } from '../src/systems/combat/damage/lineageAffliction';
import { LINEAGE_BLEED_ID } from '../src/systems/combat/damage/bleedIds';
import { resolveContagion } from '../src/systems/player/abilities/abilityAffliction';
import { outbreakTagged } from '../src/systems/combat/keystones';
import { monsterIsHeld } from '../src/systems/combat/status/monsterControl';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';
import {
  abilityDisplayName,
  abilityNodeNameParts,
  getStatusEffect,
  resolveAbilityEffect,
} from '@mmo-idle/shared';
import { registerCombatListener } from '../src/systems/combat/engine/combatPipeline';
import { pendingKeystoneHits, updateScheduledKeystoneHits } from '../src/systems/combat/keystones';
import { applyStun } from '../src/systems/combat/status/stun';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { updateReloadArchetype } from '../src/systems/classes/archetypes/reload/reloadPrototype';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

// ─── Shared setup ────────────────────────────────────────────────────────────

const NODE = 'node-5-5';

initCombatSystems();

interface PlayerOptions {
  /** The ability under test: learned and attuned. */
  abilityId: string;
  /** Its node progress, built with {@link rows}. */
  nodes?: AbilityNodeProgress;
  tier?: number;
  archetype?: CombatArchetype | null;
  subVariant?: 'light' | 'balanced' | 'heavy' | null;
  unlockedSkills?: string[];
  selectedClass?: string | null;
  passives?: Record<string, number>;
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
      passives: { ...(opts.passives ?? {}) },
      selectedClass: opts.selectedClass ?? null,
      selectedSubVariant: opts.subVariant ?? null,
      selectedRange: null,
      combatArchetype: opts.archetype ?? null,
    },
  };
}

/** A player with one ability and its node rows, its runtime refreshed. */
function spawnPlayer(world: World, id: string, opts: PlayerOptions): PlayerEntity {
  const player = world.attachPlayerEntity(slices(id, opts), id);
  // Attach recalculates the passives from skills and gear, so a fixture's own
  // passives are written back after it, before the archetype slices read them.
  Object.assign(player.usesSkills.passives, opts.passives ?? {});
  if (opts.archetype) syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  refreshAbilityNodeRuntime(player);
  world.takeNodeEvents(NODE);
  return player;
}

/**
 * Node progress for one ability: a packet route, optionally its amplifier axis,
 * a keystone verb and a cross route — owned and active, exactly as bought.
 */
function rows(abilityId: string, picks: {
  packet: PacketId;
  amplifier?: AmplifiedAxis;
  keystone?: string;
  cross?: PacketId;
}): AbilityNodeProgress {
  const packet = abilityNodeId(abilityId, 'packet', picks.packet);
  const progress: AbilityNodeProgress = { owned: [packet], active: { packet } };
  if (picks.amplifier) {
    const id = abilityNodeId(abilityId, 'amplifier', picks.packet, picks.amplifier);
    progress.owned.push(id);
    progress.active.amplifier = id;
  }
  if (picks.keystone) {
    const id = abilityKeystoneNodeId(abilityId, picks.keystone);
    progress.owned.push(id);
    progress.active.keystone = id;
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
function hit(
  world: World,
  player: PlayerEntity,
  defender: MonsterEntity,
  metadata: Record<string, unknown> = {},
  damage = 200,
): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: { ...metadata },
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

type CardFx = Extract<CombatEvent, { kind: 'card-fx' }>;

/** Drain the node's events and keep the `card-fx` ones. */
function cardFx(world: World): CardFx[] {
  return world.takeNodeEvents(NODE).filter((e): e is CardFx => e.kind === 'card-fx');
}

/** A Conduit (summoner, no T3 path) with its formation up, and one ability. */
function conduit(world: World, id: string, abilityId: string, nodes?: AbilityNodeProgress): {
  player: PlayerEntity;
  minions: MinionEntity[];
} {
  const player = spawnPlayer(world, id, {
    abilityId, nodes, archetype: 'summoner', selectedClass: 'summoner-root', unlockedSkills: ['summoner-root'],
  });
  updateSummonerArchetype(world, 0, 1_000);
  const minions = (player.summonsMinions?.minionIds ?? [])
    .map((entityId) => world.getMinionEntity(entityId))
    .filter((m): m is MinionEntity => m !== undefined);
  assert(minions.length > 1, `fixture: a Conduit needs a formation, got ${minions.length}`);
  refreshAbilityNodeRuntime(player);
  world.takeNodeEvents(NODE);
  return { player, minions };
}

/**
 * Every ATTACK event a player's exchanges emit, counted: a keystone area hit must
 * add none (it is no attack-equivalent for Sweep's Tempo, which listens on
 * `afterHit`, and never advances the weapon verb's `hit-nth` counter, which
 * listens on `onHit`).
 */
const attackEvents = new Map<string, number>();
for (const phase of ['onHit', 'afterHit'] as const) {
  registerCombatListener(phase, (ctx) => {
    if (ctx.attackerType !== 'player') return;
    const id = ctx.attacker.isPlayer.id;
    attackEvents.set(id, (attackEvents.get(id) ?? 0) + 1);
  });
}
const attackEventsOf = (player: PlayerEntity): number => attackEvents.get(player.isPlayer.id) ?? 0;

/** Everything about a player a keystone area hit must leave untouched. */
function attackLedger(player: PlayerEntity): string {
  const cs = player.tracksCombat;
  return JSON.stringify({ attacks: attackEventsOf(player), counters: cs.counters, resources: cs.resources });
}

// ─── The registry: live verbs and modules move together ──────────────────────

{
  const problems: string[] = [];
  for (const verb of ABILITY_KEYSTONE_DEFINITIONS.values()) {
    if (verb.live && !ABILITY_KEYSTONE_MODULES.has(verb.id)) {
      problems.push(`${verb.id}: marked live with no module — the panel would sell a no-op`);
    }
  }
  for (const [id, module] of ABILITY_KEYSTONE_MODULES) {
    const verb = ABILITY_KEYSTONE_DEFINITIONS.get(id);
    if (!verb?.live) problems.push(`${id}: a module for a verb that is not live`);
    if (!module.seam) problems.push(`${id}: name the seam the rule changes`);
    if (!module.onResolved && !module.register) problems.push(`${id}: a module that hooks nothing`);
  }
  assert(problems.length === 0, `ability keystone registry:\n  ${problems.join('\n  ')}`);
}

// ─── Delivery (i): a node payoff on a Conduit cast resolves ONCE, via the summon ─

{
  const world = new World();
  // Slam is the cast fixture: a cast-shaped Technique a Conduit delivers through
  // one physical summon. Packet AND cross, so "once" is asserted of both rows.
  const nodes = rows('slam', { packet: 'empowered', cross: 'control' });
  const { player, minions } = conduit(world, 'ks-conduit-cast', 'slam', nodes);
  const caster = minions[0]!;
  const target = spawnMonster(world, caster.hasPosition.current.x + 24, caster.hasPosition.current.y);
  setAttackTarget(world, caster, target.isMonster.id);

  const slam = ABILITY_DATABASE.get('slam')!;
  assert(beginAbilityCast(world, player, slam, 1_000), 'the Conduit begins its Slam');
  assert(
    player.isCastingAbility?.casterMinionId === caster.entityId,
    'the cast is delivered by one physical summon',
  );
  world.takeNodeEvents(NODE);
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  const fired = cardFx(world).map((e) => e.fx).sort();
  assert(
    fired.join() === 'control.frost-drag,empowered.plating-crack',
    `one cast, one packet payoff and one cross payoff — never one per summon, got ${fired.join()} over ${minions.length} summons`,
  );
}

// ─── Delivery (ii): a formation rider's node payoffs share the rider's one budget ─

{
  const world = new World();
  // Sweep is the armed rider: one charge becomes one delivery per living summon,
  // each a weighted share of ONE rider. Its node payoffs are paid once for the
  // whole formation, on the first delivery — not once per body at full value.
  const nodes = rows('sweep', { packet: 'tempo', cross: 'affliction' });
  const { player, minions } = conduit(world, 'ks-conduit-rider', 'sweep', nodes);
  const target = spawnMonster(world, minions[0]!.hasPosition.current.x + 24, minions[0]!.hasPosition.current.y);
  armTechnique(world, player, 'sweep');
  const fx: CardFx[] = [];
  minions.forEach((minion, index) => {
    runFormationAttack(world, player, minion, target, 5_000 + index);
    fx.push(...cardFx(world));
  });
  assert(!player.hasFormationTechnique && !player.hasArmedAbility, 'every summon delivered its share');
  const echoes = fx.filter((e) => e.fx === 'tempo.ghost-strike').length;
  const bleeds = fx.filter((e) => e.fx === 'affliction.bleed-pips').length;
  assert(
    echoes === 1 && bleeds === 1,
    `the formation pays each node payoff once across ${minions.length} deliveries, got ${echoes} echoes and ${bleeds} bleeds`,
  );
}

// ─── Sweep · WHIRLWIND: a one-second spin that cleaves every tick ────────────

{
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const sweepEffect = resolveAbilityEffect(sweep, { playerTier: 4 });
  if (sweepEffect.kind !== 'cleave') throw new Error('Sweep is a cleave');
  const radius = sweepEffect.radius;

  // The spin lands, tick by tick, around the owner — and is never an attack.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-whirlwind', {
      abilityId: 'sweep', nodes: rows('sweep', { packet: 'tempo', keystone: 'whirlwind' }),
    });
    const primary = spawnMonster(world, 430);
    // Inside the spin around the player, well outside the cleave around the primary.
    const around = spawnMonster(world, 400 - radius * 0.6, 400);
    const outside = spawnMonster(world, 400 + radius * 4, 400);
    armTechnique(world, player, 'sweep');
    hit(world, player, primary);

    const spin = pendingKeystoneHits(player, 'whirlwind');
    assert(spin.length >= 2, `the spin schedules its ticks, got ${spin.length}`);
    const started = cardFx(world).filter((e) => e.fx === ABILITY_KEYSTONE_DEFINITIONS.get('whirlwind')!.fx);
    assert(started.length === 1 && (started[0]!.durationMs ?? 0) > 0, 'one card-fx for the spin, with its length');

    const ledger = attackLedger(player);
    const before = around.hasHealth.hp;
    updateScheduledKeystoneHits(world, spin[0]!.dueInMs - 1);
    assert(around.hasHealth.hp === before, 'nothing before the first tick');
    updateScheduledKeystoneHits(world, 1);
    const afterFirst = around.hasHealth.hp;
    assert(afterFirst < before, 'the first tick cleaves a body around the spinning player');
    const footprints = world.takeNodeEvents(NODE).filter((e) => e.kind === 'player-aoe-footprint');
    assert(footprints.length === 1, 'each tick draws the ground it covered');
    for (let i = 0; i < 20 && player.schedulesKeystoneHits; i++) updateScheduledKeystoneHits(world, 100);
    assert(around.hasHealth.hp < afterFirst, 'and cleaves again on the next tick');
    assert(player.schedulesKeystoneHits === undefined, 'the spin ends: nothing left pending');
    assert(outside.hasHealth.hp === outside.hasHealth.maxHp, 'only what is inside the spin is hit');
    assert(
      attackLedger(player) === ledger,
      'a spin tick is never an attack: no attack event, no hit counter, no Tempo progress',
    );
  }

  // Hard control breaks the spin like a cast; a dodged swing starts none.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-whirlwind-cc', {
      abilityId: 'sweep', nodes: rows('sweep', { packet: 'tempo', keystone: 'whirlwind' }),
    });
    const primary = spawnMonster(world, 430);
    const around = spawnMonster(world, 400 - radius * 0.6, 400);
    armTechnique(world, player, 'sweep');
    hit(world, player, primary);
    assert(pendingKeystoneHits(player, 'whirlwind').length > 0, 'the spin started');
    applyStun(player.tracksCombat, 2_000, 'test-stun');
    const before = around.hasHealth.hp;
    updateScheduledKeystoneHits(world, 2_000);
    assert(around.hasHealth.hp === before && !player.schedulesKeystoneHits, 'a stun ends the spin');

    player.tracksCombat.statusEffects = [];
    armTechnique(world, player, 'sweep');
    hit(world, player, primary, { evadeBlocksDebuffs: true });
    assert(pendingKeystoneHits(player, 'whirlwind').length === 0, 'a dodged swing starts no spin');
  }

  // Reload: the clip's first shot spends the armed Sweep, so the spin starts once
  // per Sweep — never once per bullet.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-whirlwind-reload', {
      abilityId: 'sweep',
      nodes: rows('sweep', { packet: 'tempo', keystone: 'whirlwind' }),
      archetype: 'reload', subVariant: 'balanced', tier: 1,
      passives: { 'reload.max-ammo': 4 },
    });
    updateReloadArchetype(world, 0);
    assert(player.usesReload?.ammo === 4, 'a four-round clip');
    player.dealsDamage.attack = 100;
    const primary = spawnMonster(world, 430);
    armTechnique(world, player, 'sweep');
    let spins = 0;
    for (let shot = 0; shot < 4; shot++) {
      const outcome = runPlayerAttack(world, player, primary, 1_100 + shot, {
        attackOrigin: player.hasPosition.current,
        aggroSource: { id: player.isPlayer.id, kind: 'player' },
      });
      assert(outcome === 'hit', `shot ${shot + 1} lands`);
      spins += cardFx(world).filter((e) => e.fx === ABILITY_KEYSTONE_DEFINITIONS.get('whirlwind')!.fx).length;
    }
    assert(spins === 1, `one spin for the whole clip, got ${spins}`);
  }

  // The keystone renames the ability (design §22.10).
  const name = abilityDisplayName(sweep, sweep.tier, abilityNodeNameParts('sweep', rows('sweep', {
    packet: 'affliction', amplifier: 'targets', keystone: 'whirlwind', cross: 'tempo',
  })));
  assert(name === 'Bleeding Whirlwind of Many I, with Echoes', `the full name, got ${name}`);
}

// ─── Slam · AFTERSHOCK: the ground erupts again at the same spot ─────────────

{
  const slam = ABILITY_DATABASE.get('slam')!;
  const slamEffect = resolveAbilityEffect(slam, { playerTier: 4 });
  if (slamEffect.kind !== 'cast-strike') throw new Error('Slam is a cast strike');
  const radius = slamEffect.radius ?? 1;

  // The second eruption lands at the RESOLVED cast position, a beat later, on
  // whatever stands there then — and it is never an attack.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-aftershock', {
      abilityId: 'slam', nodes: rows('slam', { packet: 'empowered', keystone: 'aftershock' }),
    });
    const target = spawnMonster(world, 430);
    const spot = { ...target.hasPosition.current };
    assert(beginAbilityCast(world, player, slam, 1_000), 'the Slam cast begins');
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    assert(target.hasHealth.hp < target.hasHealth.maxHp, 'Slam itself landed');
    const pending = pendingKeystoneHits(player, 'aftershock');
    assert(pending.length === 1, `one aftershock per Slam, got ${pending.length}`);
    assert(pending[0]!.at?.x === spot.x && pending[0]!.at?.y === spot.y, 'scheduled at the resolved cast position');
    assert(pending[0]!.radius === radius, "at the rank's own radius");

    // The target walks off; a body arrives on the cracked ground.
    target.hasPosition.current = { x: spot.x + radius * 5, y: spot.y };
    const arrival = spawnMonster(world, spot.x, spot.y + radius * 0.4);
    world.takeNodeEvents(NODE);
    const ledger = attackLedger(player);
    const targetBefore = target.hasHealth.hp;
    updateScheduledKeystoneHits(world, pending[0]!.dueInMs - 1);
    assert(arrival.hasHealth.hp === arrival.hasHealth.maxHp, 'nothing before the beat');
    updateScheduledKeystoneHits(world, 1);
    assert(arrival.hasHealth.hp < arrival.hasHealth.maxHp, 'the ground erupts under whatever stands there now');
    assert(target.hasHealth.hp === targetBefore, 'the body that walked away is not followed');
    const events = world.takeNodeEvents(NODE);
    const erupted = events.filter((e): e is CardFx => e.kind === 'card-fx' && e.fx === ABILITY_KEYSTONE_DEFINITIONS.get('aftershock')!.fx);
    assert(
      erupted.length === 1 && erupted[0]!.targetPos?.x === spot.x,
      'one card-fx for the eruption, drawn at the spot',
    );
    assert(
      events.some((e) => e.kind === 'player-aoe-footprint' && e.radius === radius && e.pos.x === spot.x),
      'the footprint is the ground it covered',
    );
    assert(!player.schedulesKeystoneHits, 'nothing left pending');
    assert(attackLedger(player) === ledger, 'an eruption is never an attack: no attack event, no hit counter');
  }

  // On a Conduit the cast is one physical summon's — and so is its one aftershock.
  {
    const world = new World();
    const { player, minions } = conduit(world, 'ks-aftershock-conduit', 'slam',
      rows('slam', { packet: 'empowered', keystone: 'aftershock' }));
    const caster = minions[0]!;
    const target = spawnMonster(world, caster.hasPosition.current.x + 24, caster.hasPosition.current.y);
    setAttackTarget(world, caster, target.isMonster.id);
    assert(beginAbilityCast(world, player, slam, 1_000), 'the Conduit begins its Slam');
    assert(player.isCastingAbility?.casterMinionId === caster.entityId, 'through one physical summon');
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    assert(
      pendingKeystoneHits(player, 'aftershock').length === 1,
      `one aftershock per cast, never one per formation body (${minions.length} summons)`,
    );
  }
}

// ─── Charge · BREAKTHROUGH: arriving staggers the target ─────────────────────

{
  const charge = ABILITY_DATABASE.get('charge')!;
  const BREAKTHROUGH_FX = ABILITY_KEYSTONE_DEFINITIONS.get('breakthrough')!.fx;
  const stunnedBy = (monster: MonsterEntity, playerId: string): boolean => {
    const stun = getStatusEffect(monster.tracksCombat, STUN_EFFECT);
    return !!stun && stun.remainingMs > 0 && stun.sourceId === playerId;
  };

  // The whole lifecycle: wind up, rush, arrive — and the arrival blow staggers.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-breakthrough', {
      abilityId: 'charge', nodes: rows('charge', { packet: 'engagement', keystone: 'breakthrough' }), x: 200,
    });
    const target = spawnMonster(world, 360);
    setAttackTarget(world, player, target.isMonster.id);
    const t0 = 1_000_000;
    assert(beginAbilityCast(world, player, charge, t0), 'Charge winds up');
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    assert(player.isChargingAbility !== undefined, 'the wind-up becomes a rush');
    let now = t0 + 1_000;
    for (let step = 0; step < 40 && !player.hasArmedAbility; step++) {
      updateAbilityCharges(world, now);
      updateMovement(world, 100, now);
      now += 100;
    }
    assert(player.hasArmedAbility?.abilityId === 'charge', 'contact arms the arrival blow');
    assert(!stunnedBy(target, player.isPlayer.id), 'nothing staggers before the blow lands');
    world.takeNodeEvents(NODE);
    const outcome = runPlayerAttack(world, player, target, now, {
      attackOrigin: player.hasPosition.current,
      aggroSource: { id: player.isPlayer.id, kind: 'player' },
    });
    assert(outcome === 'hit', 'the arrival blow lands');
    assert(stunnedBy(target, player.isPlayer.id), 'arriving staggers the target');
    const drawn = cardFx(world).filter((e) => e.fx === BREAKTHROUGH_FX);
    assert(
      drawn.length === 1 && drawn[0]!.targetId === target.isMonster.id && (drawn[0]!.durationMs ?? 0) > 0,
      'one card-fx on the staggered body, with the hold as applied',
    );
  }

  // The ladder's own rules: post-stun immunity; a dodged arrival staggers nothing.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-breakthrough-rules', {
      abilityId: 'charge', nodes: rows('charge', { packet: 'engagement', keystone: 'breakthrough' }),
    });
    const target = spawnMonster(world, 430);
    armTechnique(world, player, 'charge');
    hit(world, player, target);
    assert(stunnedBy(target, player.isPlayer.id), 'the arrival staggers');
    world.takeNodeEvents(NODE);
    armTechnique(world, player, 'charge');
    hit(world, player, target);
    assert(
      cardFx(world).every((e) => e.fx !== BREAKTHROUGH_FX),
      'post-stun immunity: a second arrival inside it staggers nothing and draws nothing',
    );

    const dodger = spawnMonster(world, 470);
    armTechnique(world, player, 'charge');
    hit(world, player, dodger, { evadeBlocksDebuffs: true });
    assert(!stunnedBy(dodger, player.isPlayer.id), 'a dodged arrival lands no stagger');
  }

  // On a Conduit the summons rush, and the one that arrives delivers it.
  {
    const world = new World();
    const { player, minions } = conduit(world, 'ks-breakthrough-conduit', 'charge',
      rows('charge', { packet: 'engagement', keystone: 'breakthrough' }));
    const arriving = minions[1]!;
    const target = spawnMonster(world, arriving.hasPosition.current.x + 24, arriving.hasPosition.current.y);
    armTechnique(world, player, 'charge');
    runFormationAttack(world, player, arriving, target, 5_000);
    assert(stunnedBy(target, player.isPlayer.id), 'the arriving summon staggers the target');
    const drawn = cardFx(world).filter((e) => e.fx === BREAKTHROUGH_FX);
    assert(
      drawn.length === 1
        && drawn[0]!.pos.x === arriving.hasPosition.current.x
        && drawn[0]!.pos.y === arriving.hasPosition.current.y,
      'drawn from the delivering body, not the owner',
    );
    for (const minion of minions) {
      if (minion !== arriving) runFormationAttack(world, player, minion, target, 5_100);
    }
    assert(
      cardFx(world).every((e) => e.fx !== BREAKTHROUGH_FX),
      'once per Charge: the other deliveries stagger nothing more',
    );
  }
}

// ─── Contagion · OUTBREAK: an infected body passes its afflictions on when it dies ─

{
  const contagion = ABILITY_DATABASE.get('contagion')!;
  const OUTBREAK_FX = ABILITY_KEYSTONE_DEFINITIONS.get('outbreak')!.fx;
  /** The ids of `player`'s damage-over-time records on `monster`. */
  const dotsOf = (monster: MonsterEntity, player: PlayerEntity): string[] =>
    monster.tracksCombat.statusEffects
      .filter((effect) => effect.sourceId === player.isPlayer.id && effect.remainingMs !== 0)
      .map((effect) => effect.id);
  const killed = (world: World, killer: PlayerEntity, monster: MonsterEntity): void => {
    monster.hasHealth.hp = 0;
    emitCombatEvent('onKill', {
      attacker: killer, attackerType: 'player', defender: monster, defenderType: 'monster',
      damage: 1, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
    } as unknown as CombatContext, world);
  };

  const world = new World();
  const player = spawnPlayer(world, 'ks-outbreak', {
    abilityId: 'contagion', nodes: rows('contagion', { packet: 'affliction', keystone: 'outbreak' }),
  });
  // Geometry: the victim inside Contagion's reach from the source; the neighbour
  // outside it, but next to the victim.
  const source = spawnMonster(world, 600);
  const victim = spawnMonster(world, 750);
  const neighbour = spawnMonster(world, 850);
  const beyond = spawnMonster(world, 2_000);
  // The weapon's ONE damage-over-time record (design §26.2): no reservoir here, so
  // the one lineage bleed.
  assert(addLineageAffliction(world, player, source, 600, 4_000)?.record === 'bleed', 'the source bleeds');
  const record = dotsOf(source, player);
  assert(record.length === 1 && record[0] === LINEAGE_BLEED_ID, `one record on the source, got ${record.join()}`);

  // Drive the spread through the seam that writes it.
  resolveContagion(world, player, contagion, source);
  assert(dotsOf(victim, player).includes(LINEAGE_BLEED_ID), 'Contagion infected the victim');
  assert(outbreakTagged(victim, player), 'and tagged it');
  assert(dotsOf(neighbour, player).length === 0, 'the neighbour is outside Contagion\'s own reach');
  assert(!outbreakTagged(source, player), 'the source carried its afflictions; Contagion did not infect it');
  world.takeNodeEvents(NODE);

  // The victim dies: its afflictions pass to its nearest neighbour, once.
  killed(world, player, victim);
  assert(
    dotsOf(neighbour, player).join() === LINEAGE_BLEED_ID,
    `the neighbour now carries the one record and nothing else, got ${dotsOf(neighbour, player).join()}`,
  );
  assert(dotsOf(beyond, player).length === 0, 'only the nearest neighbour, only within reach');
  const events = world.takeNodeEvents(NODE);
  assert(
    events.filter((e) => e.kind === 'card-fx' && e.fx === OUTBREAK_FX).length === 1,
    'one card-fx for the outbreak',
  );
  assert(events.some((e) => e.kind === 'dot-spread'), "Contagion's own tendril draws the spread");
  assert(!outbreakTagged(victim, player), 'the tag is spent: a body spreads once');
  assert(!outbreakTagged(neighbour, player), 'a body an Outbreak infected is not tagged');

  // No chain: the neighbour dies, and nothing moves on from it.
  const next = spawnMonster(world, 900);
  killed(world, player, neighbour);
  assert(dotsOf(next, player).length === 0, 'an Outbreak-infected body passes nothing on');

  // Ownership: whoever lands the killing blow, the infecting player's afflictions pass.
  const other = spawnPlayer(world, 'ks-outbreak-other', { abilityId: 'sweep' });
  const host = spawnMonster(world, 1_300);
  // Outside Contagion's reach from the seed, and the host's NEAREST neighbour.
  const near = spawnMonster(world, 1_400);
  addLineageAffliction(world, player, host, 600, 4_000);
  const seed = spawnMonster(world, 1_150);
  addLineageAffliction(world, player, seed, 600, 4_000);
  resolveContagion(world, player, contagion, seed);
  assert(outbreakTagged(host, player), 'the host was infected and tagged');
  assert(dotsOf(near, player).length === 0, "the host's neighbour is clean before the host dies");
  killed(world, other, host);
  assert(dotsOf(near, player).includes(LINEAGE_BLEED_ID), "another player's kill still passes the infector's afflictions");

  // Without the verb, Contagion tags nothing.
  const plain = spawnPlayer(world, 'ks-outbreak-plain', {
    abilityId: 'contagion', nodes: rows('contagion', { packet: 'affliction' }),
  });
  const plainSource = spawnMonster(world, 3_000);
  const plainVictim = spawnMonster(world, 3_100);
  addLineageAffliction(world, plain, plainSource, 600, 4_000);
  resolveContagion(world, plain, contagion, plainSource);
  assert(dotsOf(plainVictim, plain).length > 0 && !outbreakTagged(plainVictim, plain), 'no verb, no tag');
}

// ─── Binding Strike · DRAGNET: the root takes every body adjacent to the target ─

{
  const bindingStrike = ABILITY_DATABASE.get('binding-strike')!;
  const effect = resolveAbilityEffect(bindingStrike, { playerTier: 4 });
  if (effect.kind !== 'root-strike') throw new Error('Binding Strike is a root strike');
  const DRAGNET_FX = ABILITY_KEYSTONE_DEFINITIONS.get('dragnet')!.fx;
  const rootedBy = (monster: MonsterEntity, playerId: string): number => {
    const root = getStatusEffect(monster.tracksCombat, ABILITY_ROOT_EFFECT_ID);
    return root && root.remainingMs > 0 && root.sourceId === playerId ? root.remainingMs : 0;
  };

  const world = new World();
  const player = spawnPlayer(world, 'ks-dragnet', {
    abilityId: 'binding-strike', nodes: rows('binding-strike', { packet: 'control', keystone: 'dragnet' }),
  });
  const target = spawnMonster(world, 600);
  const left = spawnMonster(world, 520);
  const below = spawnMonster(world, 600, 480);
  const far = spawnMonster(world, 1_200);
  armTechnique(world, player, 'binding-strike');
  hit(world, player, target);

  assert(rootedBy(target, player.isPlayer.id) > 0, 'Binding Strike roots its target');
  for (const [label, body] of [['left', left], ['below', below]] as const) {
    assert(rootedBy(body, player.isPlayer.id) === effect.rootMs, `the net takes the ${label} body, for the same duration`);
    assert(monsterIsHeld(body), `a netted body is held for the Control verb (${label})`);
  }
  assert(rootedBy(far, player.isPlayer.id) === 0, 'only adjacent bodies');
  const drawn = cardFx(world).filter((e) => e.fx === DRAGNET_FX);
  assert(
    drawn.length === 2 && new Set(drawn.map((e) => e.targetId)).size === 2,
    `each adjacent body once, one card-fx each, got ${drawn.length}`,
  );

  // A dodged strike casts no net.
  const dodged = spawnMonster(world, 2_000);
  const beside = spawnMonster(world, 2_080);
  armTechnique(world, player, 'binding-strike');
  hit(world, player, dodged, { evadeBlocksDebuffs: true });
  assert(rootedBy(beside, player.isPlayer.id) === 0, 'a dodged strike nets nothing');
}

// ═══ The Guard verbs (W2-B): immunity, control of the attacker, or a shared mend ═══
//
// A Guard keystone never deals damage (design §22.1): every block below also
// checks that the bodies it touched lost no health. Guards fire through the real
// activation path (`requestManualAbilityUse` → `maybeFireGuard`), so each verb is
// exercised from the one seam it hangs off.

import { requestManualAbilityUse } from '../src/systems/player/abilities/abilityFiring';
import { syncPlayerControlLockout } from '../src/systems/combat/status/playerControlLockout';

/** Fire a Guard the way a hotkey press does; asserts it activated. */
function fireGuard(world: World, player: PlayerEntity, abilityId: string, now = 1_000_000): void {
  const result = requestManualAbilityUse(world, player, abilityId, now);
  assert(result.state === 'activated', `${abilityId} activates (${result.state}: ${result.reason ?? ''})`);
}

/** Every body's health, so a block can assert a Guard verb dealt no damage. */
const healthOf = (bodies: MonsterEntity[]): string => bodies.map((b) => b.hasHealth.hp).join();

/** Stunned by `sourceId`, right now. */
const stunnedBy = (monster: MonsterEntity, sourceId: string): boolean => {
  const stun = getStatusEffect(monster.tracksCombat, STUN_EFFECT);
  return !!stun && stun.remainingMs > 0 && stun.sourceId === sourceId;
};

// ─── Break Free · BACKLASH: breaking free staggers every adjacent body ───────

{
  const BACKLASH_FX = ABILITY_KEYSTONE_DEFINITIONS.get('backlash')!.fx;
  const held = (world: World, player: PlayerEntity): void => {
    applyStun(player.tracksCombat, 2_000, 'a-boss');
    syncPlayerControlLockout(world, player);
  };

  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-backlash', {
      abilityId: 'break-free', nodes: rows('break-free', { packet: 'control', keystone: 'backlash' }),
    });
    const near = spawnMonster(world, 460);
    const flank = spawnMonster(world, 420, 470);
    const far = spawnMonster(world, 900);
    const bodies = [near, flank, far];
    const before = healthOf(bodies);
    held(world, player);
    world.takeNodeEvents(NODE);
    fireGuard(world, player, 'break-free');
    assert(!getStatusEffect(player.tracksCombat, STUN_EFFECT), 'Break Free broke the stun');
    assert(stunnedBy(near, player.isPlayer.id) && stunnedBy(flank, player.isPlayer.id),
      'breaking free staggers every adjacent body');
    assert(!stunnedBy(far, player.isPlayer.id), 'a body out of reach is not staggered');
    const drawn = cardFx(world).filter((e) => e.fx === BACKLASH_FX);
    assert(
      drawn.length === 2 && new Set(drawn.map((e) => e.targetId)).size === 2
        && drawn.every((e) => (e.durationMs ?? 0) > 0),
      `one card-fx per staggered body, each once, with the hold as applied (got ${drawn.length})`,
    );
    assert(healthOf(bodies) === before, 'a Guard verb deals no damage');
  }

  // Without the verb, Break Free breaks free and staggers nothing.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-backlash-off', {
      abilityId: 'break-free', nodes: rows('break-free', { packet: 'control' }),
    });
    const near = spawnMonster(world, 460);
    held(world, player);
    fireGuard(world, player, 'break-free');
    assert(!stunnedBy(near, player.isPlayer.id), 'no verb, no stagger');
  }
}

console.log('abilityKeystones: ok');
