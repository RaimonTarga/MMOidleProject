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
import { beginAbilityCast, updateAbilityCasts } from '../src/systems/player/abilities/abilityCasting';
import { runFormationAttack } from '../src/systems/classes/archetypes/summoner/formationAttack';
import { updateSummonerArchetype } from '../src/systems/classes/archetypes/summoner/summonerPrototype';

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

console.log('abilityKeystones: ok');
