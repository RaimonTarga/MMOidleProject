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
// W2-A (the remaining Technique verbs).
import { ABILITY_IMBUE_EFFECT_ID } from '@mmo-idle/shared';
import { requestManualAbilityUse } from '../src/systems/player/abilities/abilityFiring';
import { hasStatusEffect } from '@mmo-idle/shared';
import { isStunImmune } from '../src/systems/combat/status/stun';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { markEngaged, updateCombatTransitions } from '../src/systems/combat/ai/engagement';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { relayCarriers, relayedThisFight, updateAbilityKeystones } from '../src/systems/combat/keystones';
import { setFlag } from '@mmo-idle/shared';
import { VANISH_FLAG, playerVanished } from '../src/systems/combat/keystones';
import { selectMonsterAggroCandidate } from '../src/systems/combat/ai/monsterTargeting';
import { createPackCoordination, updatePacks } from '../src/systems/combat/ai/packs';
import { attachComponent } from '../src/ecs/markerHelpers';

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
    if (!module.onResolved && !module.register && !module.onInfected && !module.onChargeSpent && !module.tick) {
      problems.push(`${id}: a module that hooks nothing`);
    }
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

// ─── Detonate · CHAIN REACTION: a Detonate kill detonates every afflicted body in reach ─

{
  const detonate = ABILITY_DATABASE.get('detonate')!;
  const CHAIN_REACTION_FX = ABILITY_KEYSTONE_DEFINITIONS.get('chain-reaction')!.fx;
  const bleeds = (monster: MonsterEntity, player: PlayerEntity): boolean =>
    monster.tracksCombat.statusEffects.some(
      (effect) => effect.id === LINEAGE_BLEED_ID && effect.sourceId === player.isPlayer.id && effect.remainingMs !== 0,
    );
  /** Cast Detonate on `target` through the whole cast lifecycle; the events it drew. */
  const castDetonate = (world: World, player: PlayerEntity, target: MonsterEntity): CombatEvent[] => {
    setAttackTarget(world, player, target.isMonster.id);
    assert(beginAbilityCast(world, player, detonate, 1_000), 'Detonate winds up');
    world.takeNodeEvents(NODE);
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    return world.takeNodeEvents(NODE);
  };

  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-chain-reaction', {
      abilityId: 'detonate', nodes: rows('detonate', { packet: 'technique', keystone: 'chain-reaction' }),
    });
    // Detonate's reach is the player's own; widened so the fixture has room.
    player.performsAttack.attackRange = 100;
    const target = spawnMonster(world, 470);
    const inReach = spawnMonster(world, 400, 480);
    const fragile = spawnMonster(world, 400, 320);
    const clean = spawnMonster(world, 330);
    const outOfReach = spawnMonster(world, 900);
    // Next to the fragile body, outside the cast's reach: only a chain ON the
    // chain could reach it.
    const behindFragile = spawnMonster(world, 400, 230);
    for (const monster of [target, inReach, fragile, outOfReach, behindFragile]) {
      assert(addLineageAffliction(world, player, monster, 600, 4_000), 'fixture: the body bleeds');
    }
    target.hasHealth.hp = 1;
    fragile.hasHealth.hp = 1;
    const ledger = attackLedger(player);

    const events = castDetonate(world, player, target);
    assert(!world.getMonsterEntity(target.isMonster.id), 'the Detonate killed its target');
    assert(
      !bleeds(inReach, player) && inReach.hasHealth.hp < inReach.hasHealth.maxHp,
      'an afflicted body in reach is detonated: its records spent, their payout dealt',
    );
    assert(!world.getMonsterEntity(fragile.isMonster.id), 'a chained burst can kill');
    assert(
      bleeds(behindFragile, player) && behindFragile.hasHealth.hp === behindFragile.hasHealth.maxHp,
      'a body the chain detonated sets nothing off: no chain on the chain',
    );
    assert(
      bleeds(outOfReach, player) && outOfReach.hasHealth.hp === outOfReach.hasHealth.maxHp,
      "only bodies in the cast's reach",
    );
    assert(
      clean.hasHealth.hp === clean.hasHealth.maxHp,
      'a clean body is not set off: the chain spends afflictions, not health',
    );
    const bursts = events.filter((e) => e.kind === 'dot-detonate').length;
    assert(bursts === 3, `the kill's own burst plus one per afflicted body in reach, each once — got ${bursts}`);
    const drawn = events.filter((e): e is CardFx => e.kind === 'card-fx' && e.fx === CHAIN_REACTION_FX);
    assert(
      drawn.length === 2 && new Set(drawn.map((e) => e.targetId)).size === 2,
      `one card-fx per body set off, got ${drawn.length}`,
    );
    assert(attackLedger(player) === ledger, 'a chained burst is never an attack: no attack event, no hit counter');
  }

  // No kill, no chain.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-chain-reaction-nokill', {
      abilityId: 'detonate', nodes: rows('detonate', { packet: 'technique', keystone: 'chain-reaction' }),
    });
    player.performsAttack.attackRange = 100;
    const target = spawnMonster(world, 470);
    const neighbour = spawnMonster(world, 400, 480);
    addLineageAffliction(world, player, target, 600, 4_000);
    addLineageAffliction(world, player, neighbour, 600, 4_000);
    const events = castDetonate(world, player, target);
    assert(world.getMonsterEntity(target.isMonster.id), 'the target survived its Detonate');
    assert(bleeds(neighbour, player), 'a Detonate that does not kill sets nothing off');
    assert(!events.some((e) => e.kind === 'card-fx' && e.fx === CHAIN_REACTION_FX), 'and draws nothing');
  }
}

// ─── Snipe · PIERCE: the shot passes through its target and hits everything behind it ─

{
  const snipe = ABILITY_DATABASE.get('snipe')!;
  const PIERCE_FX = ABILITY_KEYSTONE_DEFINITIONS.get('pierce')!.fx;
  const lost = (monster: MonsterEntity): number => monster.hasHealth.maxHp - monster.hasHealth.hp;

  // The line from the shooter through the target, on to the shot's reach.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-pierce', {
      abilityId: 'snipe', nodes: rows('snipe', { packet: 'kill-chain', keystone: 'pierce' }),
    });
    const target = spawnMonster(world, 600);
    const between = spawnMonster(world, 500);
    const behind = spawnMonster(world, 680);
    const further = spawnMonster(world, 740);
    // Behind the target, in line, but past Snipe's reach of the shooter.
    const pastReach = spawnMonster(world, 800);
    const offLine = spawnMonster(world, 680, 520);
    setAttackTarget(world, player, target.isMonster.id);
    assert(beginAbilityCast(world, player, snipe, 1_000), 'Snipe winds up');
    world.takeNodeEvents(NODE);
    const ledger = attackLedger(player);
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);

    assert(lost(target) > 0, 'the shot lands on its target');
    assert(lost(behind) > 0 && lost(further) > 0, 'and passes through, hitting everything in line behind it');
    assert(lost(behind) === lost(further), 'each body once, for the same share of the shot');
    assert(lost(between) === 0, 'a body between the shooter and the target is not hit: the line starts at the target');
    assert(lost(pastReach) === 0, "only as far as the shot's reach");
    assert(lost(offLine) === 0, 'only what stands in line');
    const drawn = cardFx(world).filter((e) => e.fx === PIERCE_FX);
    assert(
      drawn.length === 1 && drawn[0]!.pos.x === 400 && drawn[0]!.targetPos?.x === further.hasPosition.current.x,
      'one card-fx per shot, from the shooter to the farthest body it reached',
    );
    assert(attackLedger(player) === ledger, 'a pierced body is never an attack: no attack event, no hit counter');

    // Nothing behind, nothing drawn.
    const lone = new World();
    const alone = spawnPlayer(lone, 'ks-pierce-alone', {
      abilityId: 'snipe', nodes: rows('snipe', { packet: 'kill-chain', keystone: 'pierce' }),
    });
    const only = spawnMonster(lone, 600);
    setAttackTarget(lone, alone, only.isMonster.id);
    assert(beginAbilityCast(lone, alone, snipe, 1_000), 'Snipe winds up');
    updateAbilityCasts(lone, alone.isCastingAbility!.endsAt);
    assert(
      lone.takeNodeEvents(NODE).every((e) => e.kind !== 'card-fx' || e.fx !== PIERCE_FX),
      'a shot with nothing behind its target draws nothing',
    );
  }

  // On a Conduit the line runs from the physical summon that cast it.
  {
    const world = new World();
    const { player, minions } = conduit(world, 'ks-pierce-conduit', 'snipe',
      rows('snipe', { packet: 'kill-chain', keystone: 'pierce' }));
    const caster = minions[0]!;
    const c = { ...caster.hasPosition.current };
    // The owner stands well off the summon's line of fire.
    player.hasPosition.current = { x: c.x + 40, y: c.y - 200 };
    const target = spawnMonster(world, c.x + 120, c.y);
    setAttackTarget(world, caster, target.isMonster.id);
    // Behind the target on the line FROM THE SUMMON.
    const summonsLine = spawnMonster(world, c.x + 220, c.y);
    // Behind the target on the line from the OWNER: what an owner-delivered shot would hit.
    const p = player.hasPosition.current;
    const ownerDx = target.hasPosition.current.x - p.x;
    const ownerDy = target.hasPosition.current.y - p.y;
    const ownerLength = Math.hypot(ownerDx, ownerDy);
    const ownersLine = spawnMonster(
      world,
      target.hasPosition.current.x + (ownerDx / ownerLength) * 100,
      target.hasPosition.current.y + (ownerDy / ownerLength) * 100,
    );
    assert(Math.abs(ownersLine.hasPosition.current.y - c.y) > 60, 'fixture: the two lines part');
    assert(beginAbilityCast(world, player, snipe, 1_000), 'the Conduit begins its Snipe');
    assert(player.isCastingAbility?.casterMinionId === caster.entityId, 'through one physical summon');
    world.takeNodeEvents(NODE);
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    assert(lost(summonsLine) > 0, "the shot pierces along the summon's line");
    assert(lost(ownersLine) === 0, "not along the owner's");
    const drawn = cardFx(world).filter((e) => e.fx === PIERCE_FX);
    assert(
      drawn.length === 1 && drawn[0]!.pos.x === c.x && drawn[0]!.pos.y === c.y,
      `one pierce per cast, drawn from the delivering summon (${minions.length} summons)`,
    );
  }
}

// ─── Cull · HARVEST: a Cull kill strikes the next body below the same share ──

{
  const cull = ABILITY_DATABASE.get('cull')!;
  const detonate = ABILITY_DATABASE.get('detonate')!;
  const HARVEST_FX = ABILITY_KEYSTONE_DEFINITIONS.get('harvest')!.fx;
  const CHAIN_REACTION_FX = ABILITY_KEYSTONE_DEFINITIONS.get('chain-reaction')!.fx;
  /** A body at `hp` of `maxHp`. */
  const body = (world: World, x: number, y: number, hp: number, maxHp: number): MonsterEntity => {
    const monster = spawnMonster(world, x, y);
    monster.hasHealth.maxHp = maxHp;
    monster.hasHealth.hp = hp;
    return monster;
  };
  const bleeds = (monster: MonsterEntity, player: PlayerEntity): boolean =>
    monster.tracksCombat.statusEffects.some(
      (effect) => effect.id === LINEAGE_BLEED_ID && effect.sourceId === player.isPlayer.id && effect.remainingMs !== 0,
    );
  const hitsOn = (events: CombatEvent[], monster: MonsterEntity): number =>
    events.filter((e) => e.kind === 'damage' && e.targetId === monster.isMonster.id).length;
  const cast = (world: World, player: PlayerEntity, ability: typeof cull, target: MonsterEntity): CombatEvent[] => {
    setAttackTarget(world, player, target.isMonster.id);
    assert(beginAbilityCast(world, player, ability, 1_000), `${ability.name} winds up`);
    world.takeNodeEvents(NODE);
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    return world.takeNodeEvents(NODE);
  };

  // The harvest, and the one body Chain Reaction and Harvest could both take.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-harvest', {
      abilityId: 'cull', nodes: rows('cull', { packet: 'technique', keystone: 'harvest' }),
    });
    // The same player also runs Detonate with Chain Reaction (two Technique slots at T3).
    player.tracksProgression.knownAbilities.push('detonate');
    player.tracksProgression.attunedAbilities.techniques.push('detonate');
    player.tracksProgression.abilityNodes!['detonate'] = rows('detonate', { packet: 'technique', keystone: 'chain-reaction' });
    refreshAbilityNodeRuntime(player);
    player.performsAttack.attackRange = 150;

    const first = body(world, 470, 400, 200, 1_000); // at a fifth: Cull kills it
    const nearest = body(world, 400, 470, 50, 1_000); // below the share, killed in turn
    const healthy = body(world, 340, 340, 90_000, 100_000); // nearer still, above the share
    // Below the share, afflicted, and too stout to die: the one both verbs could take.
    const both = body(world, 300, 400, 10_000, 100_000);
    assert(addLineageAffliction(world, player, both, 600, 4_000), 'fixture: the shared body bleeds');
    const afterStop = body(world, 400, 290, 50, 1_000); // low, but the harvest stopped first
    const outOfReach = body(world, 900, 400, 50, 1_000);
    const ledger = attackLedger(player);

    const events = cast(world, player, cull, first);
    assert(!world.getMonsterEntity(first.isMonster.id), 'Cull killed its target');
    assert(!world.getMonsterEntity(nearest.isMonster.id), 'the harvest struck the nearest body below the share, and killed it');
    assert(hitsOn(events, both) === 1, 'and kept going to the next, once');
    assert(both.hasHealth.hp > 0, 'which survived: the harvest ends there');
    assert(bleeds(both, player), 'Harvest spends health, never afflictions');
    assert(afterStop.hasHealth.hp === 50, 'nothing after a strike that does not kill');
    assert(healthy.hasHealth.hp === 90_000, 'a body above the share is never struck, however near');
    assert(outOfReach.hasHealth.hp === 50, "only bodies in Cull's reach");
    assert(
      events.filter((e) => e.kind === 'card-fx' && e.fx === HARVEST_FX).length === 2,
      'one card-fx per harvest strike',
    );
    assert(
      !events.some((e) => e.kind === 'card-fx' && e.fx === CHAIN_REACTION_FX),
      'a Cull kill sets off no Chain Reaction',
    );
    assert(attackLedger(player) === ledger, 'a harvest strike is never an attack: no attack event, no hit counter');

    // A Detonate kill now: Chain Reaction takes the shared body ONCE (its
    // afflictions), and Harvest does not (it is not a Cull kill).
    const fuse = body(world, 470, 400, 1, 1_000);
    addLineageAffliction(world, player, fuse, 600, 4_000);
    const hpBefore = both.hasHealth.hp;
    const burst = cast(world, player, detonate, fuse);
    assert(!world.getMonsterEntity(fuse.isMonster.id), 'the Detonate killed its target');
    assert(hitsOn(burst, both) === 1 && both.hasHealth.hp < hpBefore, 'the shared body is taken once, by the chain');
    assert(!bleeds(both, player), 'its afflictions spent by the detonation');
    assert(afterStop.hasHealth.hp === 50, 'Chain Reaction spends afflictions, never health: a clean low body is untouched');
    assert(!burst.some((e) => e.kind === 'card-fx' && e.fx === HARVEST_FX), 'a Detonate kill harvests nothing');
  }

  // No kill, no harvest.
  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-harvest-nokill', {
      abilityId: 'cull', nodes: rows('cull', { packet: 'technique', keystone: 'harvest' }),
    });
    player.performsAttack.attackRange = 150;
    const stout = body(world, 470, 400, 50_000, 100_000);
    const low = body(world, 400, 470, 50, 1_000);
    const events = cast(world, player, cull, stout);
    assert(stout.hasHealth.hp > 0 && low.hasHealth.hp === 50, 'a Cull that does not kill harvests nothing');
    assert(!events.some((e) => e.kind === 'card-fx' && e.fx === HARVEST_FX), 'and draws nothing');
  }

  // On a Conduit the summon that cast the kill harvests, from where it stands.
  {
    const world = new World();
    const { player, minions } = conduit(world, 'ks-harvest-conduit', 'cull',
      rows('cull', { packet: 'technique', keystone: 'harvest' }));
    const caster = minions[0]!;
    caster.performsAttack.attackRange = 100;
    player.performsAttack.attackRange = 150;
    const c = { ...caster.hasPosition.current };
    const gap = Math.hypot(c.x - player.hasPosition.current.x, c.y - player.hasPosition.current.y);
    const u = gap > 1
      ? { x: (c.x - player.hasPosition.current.x) / gap, y: (c.y - player.hasPosition.current.y) / gap }
      : { x: 1, y: 0 };
    // The owner steps back from its summon, inside the formation's leash.
    player.hasPosition.current = { x: c.x - u.x * 200, y: c.y - u.y * 200 };
    const p = { ...player.hasPosition.current };
    const first = body(world, c.x + u.x * 70, c.y + u.y * 70, 200, 1_000);
    // By the summon, on the far side from the owner.
    const bySummon = body(world, c.x + u.x * 130 - u.y * 70, c.y + u.y * 130 + u.x * 70, 50, 1_000);
    // By the owner, behind them: what an owner-delivered harvest would take.
    const byOwner = body(world, p.x - u.x * 80, p.y - u.y * 80, 50, 1_000);
    assert(world.collision.canReach(caster, bySummon, caster.performsAttack.attackRange), 'fixture: in the summon\'s reach');
    assert(!world.collision.canReach(caster, byOwner, caster.performsAttack.attackRange), 'fixture: out of the summon\'s reach');
    assert(world.collision.canReach(player, byOwner, player.performsAttack.attackRange), 'fixture: in the owner\'s reach');
    setAttackTarget(world, caster, first.isMonster.id);
    assert(beginAbilityCast(world, player, cull, 1_000), 'the Conduit begins its Cull');
    assert(player.isCastingAbility?.casterMinionId === caster.entityId, 'through one physical summon');
    world.takeNodeEvents(NODE);
    updateAbilityCasts(world, player.isCastingAbility!.endsAt);
    assert(!world.getMonsterEntity(first.isMonster.id), "the summon's Cull killed its target");
    assert(!world.getMonsterEntity(bySummon.isMonster.id), 'the summon harvests the body by it');
    assert(byOwner.hasHealth.hp === 50, "not the body by the owner: the harvest chains from the body that made the kill");
    const drawn = cardFx(world).filter((e) => e.fx === HARVEST_FX);
    assert(
      drawn.length === 1 && drawn[0]!.pos.x === c.x && drawn[0]!.pos.y === c.y,
      'drawn from the delivering summon',
    );
  }
}

// ─── Imbue Lightning · FORK: every imbued hit arcs to the nearest other body ──

{
  const FORK_FX = ABILITY_KEYSTONE_DEFINITIONS.get('fork')!.fx;
  const charges = (player: PlayerEntity): number =>
    getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID)?.data['charges'] ?? 0;

  {
    const world = new World();
    const player = spawnPlayer(world, 'ks-fork', {
      abilityId: 'imbue-lightning', nodes: rows('imbue-lightning', { packet: 'empowered', keystone: 'fork' }),
    });
    const struck = spawnMonster(world, 600);
    const nearest = spawnMonster(world, 680);
    const second = spawnMonster(world, 600, 500); // also beside it, but farther
    const far = spawnMonster(world, 900);
    assert(requestManualAbilityUse(world, player, 'imbue-lightning', 1_000).success, 'the window opens');
    const window = charges(player);
    assert(window > 1, `a charge window, got ${window}`);
    world.takeNodeEvents(NODE);

    const attacks = attackEventsOf(player);
    hit(world, player, struck);
    assert(nearest.hasHealth.hp < nearest.hasHealth.maxHp, 'the imbued hit arcs to the nearest other body');
    assert(second.hasHealth.hp === second.hasHealth.maxHp, 'only the nearest');
    assert(far.hasHealth.hp === far.hasHealth.maxHp, 'and only a body beside the struck one');
    assert(charges(player) === window - 1, 'the arc spends no extra charge');
    assert(attackEventsOf(player) === attacks + 1, 'an arc is never an attack: no attack event, no hit counter');
    const drawn = cardFx(world).filter((e) => e.fx === FORK_FX);
    assert(
      drawn.length === 1 && drawn[0]!.targetId === nearest.isMonster.id && drawn[0]!.pos.x === 600,
      'one card-fx per arc, from the struck body to the one it reached',
    );

    // A dodged imbued hit arcs nowhere.
    const before = nearest.hasHealth.hp;
    hit(world, player, struck, { evadeBlocksDebuffs: true });
    assert(nearest.hasHealth.hp === before, 'a dodged imbued hit does not arc');

    // Every imbued hit arcs, and only imbued hits: spend the window out.
    let arcs = 0;
    while (charges(player) > 0) {
      hit(world, player, struck);
      arcs += cardFx(world).filter((e) => e.fx === FORK_FX).length;
    }
    assert(arcs === window - 2, `one arc per remaining charge, got ${arcs} of ${window - 2}`);
    hit(world, player, struck);
    assert(cardFx(world).every((e) => e.fx !== FORK_FX), 'a hit after the window arcs nowhere');
  }

  // On a Conduit a summon's imbued blow arcs from the body it struck, once.
  {
    const world = new World();
    const { player, minions } = conduit(world, 'ks-fork-conduit', 'imbue-lightning',
      rows('imbue-lightning', { packet: 'empowered', keystone: 'fork' }));
    const striker = minions[0]!;
    const struck = spawnMonster(world, striker.hasPosition.current.x + 24, striker.hasPosition.current.y);
    const beside = spawnMonster(world, struck.hasPosition.current.x + 80, struck.hasPosition.current.y);
    assert(requestManualAbilityUse(world, player, 'imbue-lightning', 1_000).success, 'the window opens');
    const window = charges(player);
    world.takeNodeEvents(NODE);
    runFormationAttack(world, player, striker, struck, 5_000);
    assert(beside.hasHealth.hp < beside.hasHealth.maxHp, "the summon's imbued blow arcs");
    assert(charges(player) === window - 1, 'one charge, one arc');
    const drawn = cardFx(world).filter((e) => e.fx === FORK_FX);
    assert(
      drawn.length === 1 && drawn[0]!.pos.x === struck.hasPosition.current.x,
      'drawn from the body the summon struck',
    );
  }
}

// ─── Stunning Strike · RELAY: when the stun ends it jumps to the next body ───

{
  const stunningStrike = ABILITY_DATABASE.get('stunning-strike')!;
  const RELAY_FX = ABILITY_KEYSTONE_DEFINITIONS.get('relay')!.fx;
  const stunnedBy = (monster: MonsterEntity, player: PlayerEntity): boolean => {
    const stun = getStatusEffect(monster.tracksCombat, STUN_EFFECT);
    return !!stun && stun.remainingMs > 0 && stun.sourceId === player.isPlayer.id;
  };
  /** One logic tick of the two seams the relay lives between: the decay, then the keystones. */
  const tick = (world: World, dt: number): void => {
    updateCombatState(world, dt);
    updateAbilityKeystones(world, dt);
  };
  /** Tick until `monster`'s stun has run out (and the tick that hands it on). */
  const outlast = (world: World, monster: MonsterEntity): void => {
    for (let i = 0; i < 100 && hasStatusEffect(monster.tracksCombat, STUN_EFFECT); i++) tick(world, 100);
  };

  const world = new World();
  const player = spawnPlayer(world, 'ks-relay', {
    abilityId: 'stunning-strike', nodes: rows('stunning-strike', { packet: 'technique', keystone: 'relay' }),
  });
  const first = spawnMonster(world, 460);
  // Beside the first body; the second only beside the next one.
  const next = spawnMonster(world, 540);
  const last = spawnMonster(world, 600, 470);
  const far = spawnMonster(world, 900);
  setAttackTarget(world, player, first.isMonster.id);
  assert(beginAbilityCast(world, player, stunningStrike, 1_000), 'Stunning Strike winds up');
  updateAbilityCasts(world, player.isCastingAbility!.endsAt);
  assert(stunnedBy(first, player), 'Stunning Strike stuns its target');
  assert(relayedThisFight(player).has(first.isMonster.id), 'the first body joins the fight\'s set');
  world.takeNodeEvents(NODE);
  const ledger = attackLedger(player);

  tick(world, 100);
  assert(!stunnedBy(next, player), 'nothing jumps while the stun holds');

  outlast(world, first);
  assert(!stunnedBy(first, player), "the first body's stun has ended");
  assert(isStunImmune(first.tracksCombat), 'and its post-stun immunity still stands');
  assert(stunnedBy(next, player), 'the stun jumped to the nearest body');
  assert(!stunnedBy(last, player) && !stunnedBy(far, player), 'only to the nearest');
  const jumped = cardFx(world).filter((e) => e.fx === RELAY_FX);
  assert(
    jumped.length === 1 && jumped[0]!.targetId === next.isMonster.id
      && jumped[0]!.pos.x === first.hasPosition.current.x && (jumped[0]!.durationMs ?? 0) > 0,
    'one card-fx per jump, from the body it left, with the hold as applied',
  );

  outlast(world, next);
  assert(stunnedBy(last, player), 'it keeps jumping: never back to a body stunned this fight');
  outlast(world, last);
  assert(relayCarriers(player).size === 0, 'with no body left to take it, the relay ends');
  assert(!stunnedBy(far, player), 'and never reaches a body out of reach');
  assert(attackLedger(player) === ledger, 'a relayed stun is never an attack: no attack event, no hit counter');

  // The fight ends at the out-of-combat reset, and the set with it.
  assert(relayedThisFight(player).size === 3, 'three bodies stunned this fight, each once');
  setAttackTarget(world, player, null);
  for (const monster of world.monsterEntitiesInNode(NODE)) {
    if (monster.hasAggroTarget?.targetId === player.isPlayer.id) setAggroTarget(world, monster, null, 0);
  }
  markEngaged(world, player, 0);
  updateCombatTransitions(world, 1_000_000);
  assert(relayedThisFight(player).size === 0, "the fight's set clears when the fight ends");
}

// ─── Disengage · VANISH: breaking contact drops you from nearby aggro ────────

{
  const VANISH_FX = ABILITY_KEYSTONE_DEFINITIONS.get('vanish')!.fx;
  const aggroOn = (monster: MonsterEntity, player: PlayerEntity): boolean =>
    monster.hasAggroTarget?.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id;
  const hunt = (world: World, monster: MonsterEntity, player: PlayerEntity): void => {
    setAggroTarget(world, monster, { id: player.isPlayer.id, kind: 'player' }, 0);
    setAttackTarget(world, monster, player.isPlayer.id);
  };
  const acquires = (world: World, monster: MonsterEntity, player: PlayerEntity): boolean => {
    const candidate = selectMonsterAggroCandidate(world, monster);
    return candidate?.kind === 'player' && candidate.entity === player;
  };

  const world = new World();
  const player = spawnPlayer(world, 'ks-vanish', {
    abilityId: 'disengage', nodes: rows('disengage', { packet: 'engagement', keystone: 'vanish' }),
  });
  const from = { ...player.hasPosition.current };
  const contact = spawnMonster(world, 470); // the body the player breaks from
  const far = spawnMonster(world, 900); // aggroed from outside Disengage's reach
  const boss = spawnMonster(world, 400, 470);
  boss.isMonster.isBoss = true;
  // A pack: one member at the departure point, one out of reach of it.
  const packNear = spawnMonster(world, 400, 330);
  const packFar = spawnMonster(world, 1_200);
  const coordination = createPackCoordination(packNear);
  coordination.target = { id: player.isPlayer.id, kind: 'player' };
  attachComponent(world, packNear, 'inPack', { packId: 'ks-vanish-pack', role: 'alpha', coordination });
  attachComponent(world, packFar, 'inPack', { packId: 'ks-vanish-pack', role: 'follower', coordination });
  for (const monster of [contact, far, boss, packNear, packFar]) hunt(world, monster, player);
  setAttackTarget(world, player, contact.isMonster.id);
  world.takeNodeEvents(NODE);

  assert(requestManualAbilityUse(world, player, 'disengage', 1_000).success, 'Disengage breaks contact');
  assert(player.hasPosition.current.x < from.x, 'the player moved away');
  assert(!aggroOn(contact, player) && !contact.hasAttackTarget, 'the body broken from drops the player');
  assert(aggroOn(far, player), 'a monster out of reach of the departure point keeps its aggro');
  assert(aggroOn(boss, player), 'a boss keeps its target: its script owns it');
  assert(
    !aggroOn(packNear, player) && !aggroOn(packFar, player) && coordination.target === undefined,
    'a pack hunts as one: a member near the break drops the player for the whole pack',
  );
  assert(playerVanished(player), 'the player is marked');
  const drawn = cardFx(world).filter((e) => e.fx === VANISH_FX);
  assert(drawn.length === 1 && drawn[0]!.pos.x === from.x, 'one card-fx, left at the departure point');

  // While it stands, nothing re-acquires the player — but a boss still can.
  const lurker = spawnMonster(world, player.hasPosition.current.x, player.hasPosition.current.y - 70);
  assert(!acquires(world, lurker, player), 'a monster in pull range does not acquire a vanished player');
  updatePacks(world, 2_000);
  assert(!aggroOn(packNear, player) && !aggroOn(packFar, player), 'nor does the pack, on its own clock');
  const sentinel = spawnMonster(world, player.hasPosition.current.x, player.hasPosition.current.y + 70);
  sentinel.isMonster.isBoss = true;
  assert(acquires(world, sentinel, player), 'a boss sees through Vanish');

  // The next landed hit ends it.
  hit(world, player, lurker);
  assert(!playerVanished(player), 'the first hit clears the mark');
  assert(acquires(world, lurker, player), 'and the player can be acquired again');

  // The out-of-combat reset ends one never spent.
  setFlag(player.tracksCombat, VANISH_FLAG, true);
  setAttackTarget(world, player, null);
  for (const monster of world.monsterEntitiesInNode(NODE)) {
    if (aggroOn(monster, player)) setAggroTarget(world, monster, null, 0);
  }
  markEngaged(world, player, 0);
  updateCombatTransitions(world, 1_000_000);
  assert(!playerVanished(player), 'a mark never spent ends with the fight');
}

// ═══ The Guard verbs (W2-B): immunity, control of the attacker, or a shared mend ═══
//
// A Guard keystone never deals damage (design §22.1): every block below also
// checks that the bodies it touched lost no health. Guards fire through the real
// activation path (`requestManualAbilityUse` → `maybeFireGuard`), so each verb is
// exercised from the one seam it hangs off.

// Aliased: W2-A's section imports the same function under its own name.
import { requestManualAbilityUse as requestGuardUse } from '../src/systems/player/abilities/abilityFiring';
import { syncPlayerControlLockout } from '../src/systems/combat/status/playerControlLockout';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import {
  ABILITY_ENTANGLE_EFFECT_ID,
  ABILITY_IMMUNITY_EFFECT_ID,
  ABILITY_UNYIELDING_EFFECT_ID,
  CAVE_LOCKDOWN_EFFECT_ID,
  abilityImmunityKindKey,
} from '@mmo-idle/shared';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { joinParty } from '../src/systems/player/party/partySystem';
import { activeRecoveryFraction, runRecovery } from '../src/systems/defense/regen/recovery';
import { applyHealToPlayer } from '../src/systems/defense/regen/healing';
import { guardKeystoneMagnitude, overflowWardOf } from '../src/systems/combat/keystones';
import { applyResistedPlayerDebuff } from '../src/systems/combat/status/debuffGuard';
import { beginEngageLock, engageSequenceHoldsAttack } from '../src/systems/combat/ai/engageSequence';
import { syncPlayerBuffs } from '../src/systems/combat/buffs/buffSync';

/** Fire a Guard the way a hotkey press does; asserts it activated. */
function fireGuard(world: World, player: PlayerEntity, abilityId: string, now = 1_000_000): void {
  const result = requestGuardUse(world, player, abilityId, now);
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

// ─── Brace · RIPOSTE: a melee hit absorbed while Braced staggers the attacker ─

{
  const RIPOSTE_FX = ABILITY_KEYSTONE_DEFINITIONS.get('riposte')!.fx;
  /** Clear a body's stagger and its post-stun ward, as if both had run out. */
  const recover = (monster: MonsterEntity): void => {
    monster.tracksCombat.statusEffects = monster.tracksCombat.statusEffects
      .filter((effect) => effect.id !== STUN_EFFECT && effect.id !== 'stun-immune');
  };
  /** Ready every Guard again (cooldowns and the one-activation window). */
  const rested = (player: PlayerEntity): void => { player.tracksCombat.cooldowns = {}; };

  const world = new World();
  const player = spawnPlayer(world, 'ks-riposte', {
    abilityId: 'brace', nodes: rows('brace', { packet: 'control', keystone: 'riposte' }),
  });
  const brute = spawnMonster(world, 430);
  const archer = spawnMonster(world, 380, 430);
  archer.isMonster.isRanged = true;
  const bodies = [brute, archer];
  const before = healthOf(bodies);

  // Not Braced: nothing to riposte with.
  runMonsterAttack(world, brute, player, 1_000_000);
  assert(!stunnedBy(brute, player.isPlayer.id), 'no Brace, no riposte');

  fireGuard(world, player, 'brace');
  world.takeNodeEvents(NODE);
  assert(runMonsterAttack(world, brute, player, 1_000_100) === 'hit', 'the melee blow lands into the Brace');
  assert(stunnedBy(brute, player.isPlayer.id), 'a melee hit absorbed while Braced staggers the attacker');
  const drawn = cardFx(world).filter((e) => e.fx === RIPOSTE_FX);
  assert(drawn.length === 1 && drawn[0]!.targetId === brute.isMonster.id && (drawn[0]!.durationMs ?? 0) > 0,
    'one card-fx on the staggered attacker, with the hold as applied');

  runMonsterAttack(world, archer, player, 1_000_200);
  assert(!stunnedBy(archer, player.isPlayer.id), 'a ranged shot is not riposted');

  // Once per attacker per Brace: the same body, its stagger and ward run out, is not
  // staggered again by the same Brace...
  recover(brute);
  runMonsterAttack(world, brute, player, 1_000_300);
  assert(!stunnedBy(brute, player.isPlayer.id), 'once per attacker per Brace');
  // ...and a fresh Brace answers it again.
  rested(player);
  fireGuard(world, player, 'brace', 1_000_400);
  runMonsterAttack(world, brute, player, 1_000_500);
  assert(stunnedBy(brute, player.isPlayer.id), 'a fresh Brace ripostes the same attacker again');

  // A blow dodged outright was not absorbed.
  const dodged = spawnMonster(world, 440, 360);
  emitCombatEvent('afterHit', {
    attacker: dodged, attackerType: 'monster', defender: player, defenderType: 'player',
    damage: 0, platingMult: 1, drPierce: 0, cancelled: false, metadata: { evaded: true, evadeFull: true },
  } as unknown as CombatContext, world);
  assert(!stunnedBy(dodged, player.isPlayer.id), 'a dodged blow is not riposted');
  assert(healthOf(bodies) === before, 'a Guard verb deals no damage');
}

// ─── Bramble Guard · ENTANGLE: a body that hits you while brambled is slowed ─

{
  const ENTANGLE_FX = ABILITY_KEYSTONE_DEFINITIONS.get('entangle')!.fx;
  /** One world: a brambled player (with or without the verb) takes one melee blow. */
  const blow = (id: string, keystone?: string) => {
    const world = new World();
    const player = spawnPlayer(world, id, {
      abilityId: 'bramble-guard', nodes: rows('bramble-guard', { packet: 'tempo', ...(keystone ? { keystone } : {}) }),
    });
    const brute = spawnMonster(world, 430);
    const bystander = spawnMonster(world, 470, 460);
    fireGuard(world, player, 'bramble-guard');
    world.takeNodeEvents(NODE);
    assert(runMonsterAttack(world, brute, player, 1_000_100) === 'hit', 'the blow lands');
    return { world, player, brute, bystander };
  };

  const { world, player, brute, bystander } = blow('ks-entangle', 'entangle');
  const slow = getStatusEffect(brute.tracksCombat, ABILITY_ENTANGLE_EFFECT_ID);
  assert(slow !== undefined && (slow.data['moveSlowPct'] ?? 0) > 0 && slow.remainingMs > 0,
    'a body that hits you while brambled is slowed');
  assert((slow!.data['totalMs'] ?? 0) > 0, 'with totalMs in its data for the buff clock');
  assert(slow!.sourceId === player.isPlayer.id, 'owned by the brambled player');
  assert(monsterIsHeld(brute), 'an entangled body counts as held for the Control verb');
  assert(!getStatusEffect(bystander.tracksCombat, ABILITY_ENTANGLE_EFFECT_ID), 'a body that did not hit is not');
  const drawn = cardFx(world).filter((e) => e.fx === ENTANGLE_FX);
  assert(drawn.length === 1 && drawn[0]!.targetId === brute.isMonster.id && (drawn[0]!.durationMs ?? 0) > 0,
    'one card-fx on the entangled body, with the hold as applied');

  // The slow is all it adds: the thorns bite the same with or without the verb.
  const plain = blow('ks-entangle-off');
  assert(!getStatusEffect(plain.brute.tracksCombat, ABILITY_ENTANGLE_EFFECT_ID), 'no verb, no slow');
  assert(plain.brute.hasHealth.hp === brute.hasHealth.hp, 'a Guard verb deals no damage (only the thorns bite)');

  // Not brambled, nothing entangles: the bramble runs out, the next blow lands free.
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter((e) => e.id !== 'ability-bramble');
  bystander.tracksCombat.statusEffects = [];
  runMonsterAttack(world, bystander, player, 1_000_200);
  assert(!getStatusEffect(bystander.tracksCombat, ABILITY_ENTANGLE_EFFECT_ID), 'no bramble, no entangle');
}

// ─── Endure · UNYIELDING: you cannot be hard-controlled while Endure is up ────

{
  const UNYIELDING_FX = ABILITY_KEYSTONE_DEFINITIONS.get('unyielding')!.fx;
  const root = (player: PlayerEntity, speedMult = 0) => applyResistedPlayerDebuff(player, {
    id: 'slow', maxStacks: 1, remainingMs: 2_000, refreshable: true, sourceId: 'a-mob',
    data: { speedMult, totalMs: 2_000 },
  });

  const world = new World();
  const player = spawnPlayer(world, 'ks-unyielding', {
    abilityId: 'endure', nodes: rows('endure', { packet: 'engagement', keystone: 'unyielding' }),
  });
  const troll = spawnMonster(world, 460);
  // A root already on the player before Endure goes up (a root does not stop a Guard).
  assert(root(player) !== undefined, 'fixture: the root lands before Endure');
  world.takeNodeEvents(NODE);
  fireGuard(world, player, 'endure');
  const endure = getStatusEffect(player.tracksCombat, 'ability-guard-2')!;
  const unyielding = getStatusEffect(player.tracksCombat, ABILITY_UNYIELDING_EFFECT_ID);
  assert(unyielding !== undefined && unyielding.remainingMs === endure.remainingMs,
    'Unyielding stands on the clock of Endure itself');
  assert(cardFx(world).filter((e) => e.fx === UNYIELDING_FX).length === 1, 'one card-fx per activation');
  assert(getStatusEffect(player.tracksCombat, 'slow')?.data['speedMult'] === 0,
    'an existing control is not removed');

  // The appliers refuse: every stun, a zero-speed root, the Cave lockdown.
  assert(!applyStun(player.tracksCombat, 1_500, troll.isMonster.id), 'a stun is refused');
  assert(!getStatusEffect(player.tracksCombat, STUN_EFFECT) && !getStatusEffect(player.tracksCombat, 'stun-immune'),
    'no stun and no post-stun ward for a stun that never landed');
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter((e) => e.id !== 'slow');
  assert(root(player) === undefined && !getStatusEffect(player.tracksCombat, 'slow'), 'a root is refused');
  beginEngageLock(world, troll, player, 1_500, 1_000_100);
  assert(!getStatusEffect(player.tracksCombat, CAVE_LOCKDOWN_EFFECT_ID), 'the Cave lockdown is refused');
  assert(engageSequenceHoldsAttack(troll), 'and the beat of the troll runs on');
  assert(root(player, 0.5) !== undefined, 'a soft slow is not hard control: it still lands');
  syncPlayerBuffs(world, 1_000_100);
  assert(player.hasStatus.activeBuffs?.some((buff) => buff.id === ABILITY_UNYIELDING_EFFECT_ID),
    'the Unyielding tile is on the bar');

  // Endure down, the refusal goes with it.
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects
    .filter((e) => e.id !== 'ability-guard-2' && e.id !== ABILITY_UNYIELDING_EFFECT_ID);
  assert(applyStun(player.tracksCombat, 1_500, troll.isMonster.id), 'once Endure is down, a stun lands');

  // Without the verb, Endure refuses nothing.
  const plainWorld = new World();
  const plain = spawnPlayer(plainWorld, 'ks-unyielding-off', {
    abilityId: 'endure', nodes: rows('endure', { packet: 'engagement' }),
  });
  fireGuard(plainWorld, plain, 'endure');
  assert(applyStun(plain.tracksCombat, 1_500, 'a-mob'), 'no verb, no refusal');
}

// ─── Cleanse · IMMUNITY: the kind you stripped cannot be reapplied for a few seconds ─

{
  const IMMUNITY_FX = ABILITY_KEYSTONE_DEFINITIONS.get('immunity')!.fx;
  const venom = { debuffId: 'ks-venom', damagePerStack: 4, maxStacks: 5, tickIntervalMs: 1_000, durationMs: 4_000 };
  const venomId = 'monster-dot:ks-venom';
  const has = (player: PlayerEntity, id: string): boolean => getStatusEffect(player.tracksCombat, id) !== undefined;

  const world = new World();
  const player = spawnPlayer(world, 'ks-immunity', {
    abilityId: 'cleanse', nodes: rows('cleanse', { packet: 'engagement', keystone: 'immunity' }),
  });
  const viper = spawnMonster(world, 460);
  applyMonsterDotToPlayer(world, viper, player, venom);
  applyMonsterDotToPlayer(world, viper, player, venom);
  assert(has(player, venomId), 'fixture: the venom is on the player');
  world.takeNodeEvents(NODE);
  fireGuard(world, player, 'cleanse');
  assert(!has(player, venomId), 'Cleanse stripped the venom');
  const immunity = getStatusEffect(player.tracksCombat, ABILITY_IMMUNITY_EFFECT_ID);
  assert(immunity !== undefined && immunity.remainingMs > 0 && (immunity.data['totalMs'] ?? 0) > 0,
    'Immunity stands, with a clock');
  assert(immunity!.data[abilityImmunityKindKey(venomId)] === 1, 'keyed by the stripped kind');
  assert(cardFx(world).filter((e) => e.fx === IMMUNITY_FX).length === 1, 'one card-fx per activation');

  // The applier of that kind early-returns...
  applyMonsterDotToPlayer(world, viper, player, venom);
  assert(!has(player, venomId), 'the stripped kind cannot be reapplied');
  // ...and every other kind still lands.
  applyMonsterDotToPlayer(world, viper, player, { ...venom, debuffId: 'ks-other' });
  assert(has(player, 'monster-dot:ks-other'), 'a different affliction still lands');
  assert(applyResistedPlayerDebuff(player, {
    id: 'antiheal', maxStacks: 1, remainingMs: 2_000, refreshable: true, sourceId: 'a-mob',
    data: { reductionPerStack: 0.2, totalMs: 2_000 },
  }) !== undefined, 'so does a debuff the Cleanse never touched');
  syncPlayerBuffs(world, 1_000_100);
  assert(player.hasStatus.activeBuffs?.some((buff) => buff.id === ABILITY_IMMUNITY_EFFECT_ID),
    'the Immunity tile is on the bar');

  // When the window ends, the kind lands again.
  player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter((e) => e.id !== ABILITY_IMMUNITY_EFFECT_ID);
  applyMonsterDotToPlayer(world, viper, player, venom);
  assert(has(player, venomId), 'after the window the kind lands again');

  // Without the verb, a Cleanse refuses nothing afterwards.
  const plainWorld = new World();
  const plain = spawnPlayer(plainWorld, 'ks-immunity-off', {
    abilityId: 'cleanse', nodes: rows('cleanse', { packet: 'engagement' }),
  });
  const plainViper = spawnMonster(plainWorld, 460);
  applyMonsterDotToPlayer(plainWorld, plainViper, plain, venom);
  fireGuard(plainWorld, plain, 'cleanse');
  applyMonsterDotToPlayer(plainWorld, plainViper, plain, venom);
  assert(has(plain, venomId), 'no verb, no immunity');
}

// ─── Second Wind · SHARED BREATH: the mend runs on your summons and same-node party ─

{
  const SHARED_BREATH_FX = ABILITY_KEYSTONE_DEFINITIONS.get('shared-breath')!.fx;
  // The Bulwark route, so the packet's own payoff never wears the verb's fx key.
  const nodes = rows('second-wind', { packet: 'bulwark', keystone: 'shared-breath' });

  /** A Conduit owner (hurt, so Second Wind fires), a party member here and one a node away. */
  const scene = (id: string, withVerb: boolean) => {
    const world = new World();
    const { player: owner, minions } = conduit(world, id, 'second-wind',
      withVerb ? nodes : rows('second-wind', { packet: 'bulwark' }));
    owner.hasHealth.hp = Math.round(owner.hasHealth.maxHp / 2);
    if (!((owner.hasHealth.recovery ?? 0) > 0)) owner.hasHealth.recovery = 10;
    const ally = spawnPlayer(world, `${id}-ally`, { abilityId: 'brace' });
    const away = spawnPlayer(world, `${id}-away`, { abilityId: 'brace' });
    away.hasPosition.nodeId = 'node-5-6';
    joinParty(world, ally, owner.isPlayer.id);
    joinParty(world, away, owner.isPlayer.id);
    assert(ally.inParty?.leaderId === owner.isPlayer.id && away.inParty?.leaderId === owner.isPlayer.id,
      'fixture: one party');
    // One summon hurt and engaged, so it is in combat.
    const summon = minions[0]!;
    const foe = spawnMonster(world, summon.hasPosition.current.x + 24, summon.hasPosition.current.y);
    setAttackTarget(world, summon, foe.isMonster.id);
    summon.hasHealth.hp = Math.round(summon.hasHealth.maxHp / 2);
    world.takeNodeEvents(NODE);
    fireGuard(world, owner, 'second-wind');
    return { world, owner, minions, ally, away, summon };
  };

  {
    const { world, owner, minions, ally, away, summon } = scene('ks-shared-breath', true);
    const ownerFraction = getStatusEffect(owner.tracksCombat, 'ability-second-wind')!.data['recoveryPct']!;
    assert(ownerFraction > 0, 'fixture: the owner mends');
    assert(activeRecoveryFraction(ally, true) === ownerFraction,
      'a same-node party member mends at the owner\u2019s fraction (the engine\u2019s skill source)');
    assert(activeRecoveryFraction(away, true) === 0, 'a party member on another node does not');
    const drawn = cardFx(world).filter((e) => e.fx === SHARED_BREATH_FX);
    assert(drawn.length === 1 + minions.length,
      `one card-fx per body the mend reaches (the ally and ${minions.length} summons), got ${drawn.length}`);

    const before = summon.hasHealth.hp;
    updateSummonerArchetype(world, 1_000, 1_000_100);
    assert(summon.hasHealth.hp > before, 'a summon in combat mends while the owner\u2019s mend runs');
  }

  // Without the verb, Second Wind mends only its caster.
  {
    const { world, ally, summon } = scene('ks-shared-breath-off', false);
    assert(activeRecoveryFraction(ally, true) === 0, 'no verb: the party is not mended');
    const before = summon.hasHealth.hp;
    updateSummonerArchetype(world, 1_000, 1_000_100);
    assert(summon.hasHealth.hp === before, 'no verb: a summon in combat is not mended');
  }
}

// ─── Recuperate · OVERFLOW: healing past full becomes a ward ──────────────────

{
  const OVERFLOW_FX = ABILITY_KEYSTONE_DEFINITIONS.get('overflow')!.fx;
  const wardTotal = (player: PlayerEntity): number =>
    (player.holdsWards?.wards ?? []).reduce((sum, ward) => sum + ward.amount, 0);

  /** A player who has just fired Recuperate, then is topped back to full. */
  const mending = (id: string, keystone?: string) => {
    const world = new World();
    const player = spawnPlayer(world, id, {
      abilityId: 'recuperate', nodes: rows('recuperate', { packet: 'tempo', ...(keystone ? { keystone } : {}) }),
    });
    player.hasHealth.hp = player.hasHealth.maxHp - 20;
    world.takeNodeEvents(NODE);
    fireGuard(world, player, 'recuperate');
    player.hasHealth.hp = player.hasHealth.maxHp;
    return { world, player };
  };

  {
    const { world, player } = mending('ks-overflow', 'overflow');
    const cap = Math.round(player.hasHealth.maxHp * guardKeystoneMagnitude(player, 'overflow'));
    assert(cap > 0, 'fixture: the ward has a cap off the table');
    applyHealToPlayer(player, player.tracksCombat, 3, world);
    const ward = overflowWardOf(player);
    assert(ward !== undefined && ward.amount === 3 && ward.remainingMs > 0, 'healing past full becomes a ward');
    assert(player.hasHealth.hp === player.hasHealth.maxHp, 'and the HP stays at full');
    assert(cardFx(world).filter((e) => e.fx === OVERFLOW_FX).length === 1, 'one card-fx as the ward rises');
    applyHealToPlayer(player, player.tracksCombat, 4, world);
    assert(player.holdsWards!.wards.length === 1 && overflowWardOf(player)!.amount === 7,
      'more spill tops up the one ward');
    assert(cardFx(world).filter((e) => e.fx === OVERFLOW_FX).length === 0, 'a top-up draws nothing new');
    applyHealToPlayer(player, player.tracksCombat, cap * 3, world);
    assert(overflowWardOf(player)!.amount === cap, `the ward stops at its cap (${cap})`);

    // The Recovery engine's own sub-1-HP slices at 10 Hz add up to a ward too.
    const sliced = mending('ks-overflow-sliced', 'overflow');
    sliced.player.hasHealth.recovery = 20;
    for (let tick = 0; tick < 20; tick++) runRecovery(sliced.world, sliced.player, 100, true);
    assert(wardTotal(sliced.player) >= 1, 'the mend\u2019s own ticks past full raise the ward');

    // When the mend has run out, healing past full is just healing.
    player.tracksCombat.statusEffects = player.tracksCombat.statusEffects.filter((e) => e.id !== 'ability-second-wind-2');
    const before = wardTotal(player);
    player.holdsWards!.wards = [];
    applyHealToPlayer(player, player.tracksCombat, 10, world);
    assert(wardTotal(player) === 0 && before === cap, 'no mend, no overflow');
  }

  // Without the verb, healing past full is just healing.
  {
    const { world, player } = mending('ks-overflow-off');
    applyHealToPlayer(player, player.tracksCombat, 10, world);
    assert(wardTotal(player) === 0, 'no verb, no ward');
  }
}

// ─── Sidestep · FLOW: every dodge in the window extends it; the first that lands ends it ─

import { ABILITY_SIDESTEP_EFFECT_ID, sidestepWindow } from '@mmo-idle/shared';
import { makeCombatContext } from '../src/systems/combat/engine/combatPipeline';

{
  const sidestep = ABILITY_DATABASE.get('sidestep')!;
  const windowOf = (player: PlayerEntity) => getStatusEffect(player.tracksCombat, ABILITY_SIDESTEP_EFFECT_ID);
  const up = (player: PlayerEntity): boolean => (windowOf(player)?.remainingMs ?? 0) > 0;
  /** One incoming direct hit, through the phase the evade seam rides; a graze when `dodge`. */
  const incoming = (world: World, monster: MonsterEntity, player: PlayerEntity, dodge: boolean): void => {
    const ctx = makeCombatContext(monster, 'monster', player, 'player');
    ctx.damage = 30;
    if (dodge) Object.assign(ctx.metadata, { evaded: true, evadeMitigation: 0.5 });
    emitCombatEvent('onDamageTaken', ctx, world);
  };
  const flowFx = (fx: CardFx[]): CardFx[] => fx.filter((e) => e.keystone === 'flow');
  /** The Engagement packet's own "per hit dodged" payoff (no keystone on it). */
  const nodeFx = (fx: CardFx[]): CardFx[] => fx.filter((e) => e.keystone === undefined);

  /** A player who has just Sidestepped, a body in reach, the Engagement packet on. */
  const scene = (id: string, withVerb: boolean) => {
    const world = new World();
    const player = spawnPlayer(world, id, {
      abilityId: 'sidestep',
      nodes: rows('sidestep', { packet: 'engagement', ...(withVerb ? { keystone: 'flow' } : {}) }),
    });
    const attacker = spawnMonster(world, 430);
    world.takeNodeEvents(NODE);
    fireGuard(world, player, 'sidestep');
    world.takeNodeEvents(NODE);
    const unitMs = sidestepWindow(sidestep, player.tracksProgression.playerTier).durationMs;
    assert(unitMs > 0 && windowOf(player)?.remainingMs === unitMs, 'fixture: the window is up at the evasion-window unit');
    return { world, player, attacker, unitMs };
  };

  {
    const { world, player, attacker, unitMs } = scene('ks-flow', true);
    // Run the window nearly out, then dodge.
    updateCombatState(world, unitMs - 200);
    assert(up(player) && windowOf(player)!.remainingMs <= 200, 'fixture: the window is nearly spent');
    incoming(world, attacker, player, true);
    assert(windowOf(player)!.remainingMs === unitMs, 'a dodge winds the window back to a full unit');
    assert(windowOf(player)!.data['totalMs'] === unitMs, 'and the buff clock reads full again');
    let fx = cardFx(world);
    assert(flowFx(fx).length === 1 && flowFx(fx)[0]!.durationMs === unitMs,
      'one card-fx per dodge, carrying the window as it now stands');
    assert(nodeFx(fx).length === 1, "the packet's per-hit-dodged route fires on the same dodge");

    // Past the cast's own clock: the window is still up, and the node still pays per dodge.
    updateCombatState(world, 400);
    assert(up(player), 'the extended window outlives the cast’s own clock');
    incoming(world, attacker, player, true);
    fx = cardFx(world);
    assert(nodeFx(fx).length === 1, 'a dodge in the extended window still fires the node');
    assert(flowFx(fx).length === 1 && windowOf(player)!.remainingMs === unitMs, 'and extends it again');

    // A DoT tick is neither: it moves nothing.
    updateCombatState(world, 100);
    const before = windowOf(player)!.remainingMs;
    const tick = makeCombatContext(attacker, 'monster', player, 'player');
    tick.damage = 5;
    tick.metadata['isDot'] = true;
    emitCombatEvent('onDamageTaken', tick, world);
    assert(up(player) && windowOf(player)!.remainingMs === before, 'a damage-over-time tick neither extends nor ends it');
    world.takeNodeEvents(NODE);

    // The first hit that lands ends it — the real exchange, which rolls the evade.
    const hp = player.hasHealth.hp;
    assert(runMonsterAttack(world, attacker, player, 2_000_000) === 'hit', 'the blow resolves');
    assert(player.hasHealth.hp < hp, 'fixture: the blow landed (no dodge)');
    assert(!windowOf(player), 'the first hit that lands ends the window, and the speed burst with it');
    fx = cardFx(world);
    assert(flowFx(fx).length === 1 && flowFx(fx)[0]!.durationMs === 0, 'one card-fx as it snaps (durationMs 0)');
    assert(nodeFx(fx).length === 0, 'a landed hit fires no per-hit-dodged node');

    // After it: nothing to extend, nothing to pay.
    incoming(world, attacker, player, true);
    assert(!windowOf(player), 'a dodge after the window does not bring it back');
    assert(cardFx(world).length === 0, 'and fires neither the verb nor the node');
  }

  // Without the verb, a dodge extends nothing and a landed hit ends nothing.
  {
    const { world, player, attacker, unitMs } = scene('ks-flow-off', false);
    updateCombatState(world, unitMs - 200);
    incoming(world, attacker, player, true);
    assert(windowOf(player)!.remainingMs <= 200, 'no verb: a dodge does not extend the window');
    assert(nodeFx(cardFx(world)).length === 1, 'the node still fires per dodge');
    incoming(world, attacker, player, false);
    assert(up(player), 'no verb: a landed hit does not end the window');
    assert(flowFx(cardFx(world)).length === 0, 'no verb, nothing drawn');
  }
}

console.log('abilityKeystones: ok');
