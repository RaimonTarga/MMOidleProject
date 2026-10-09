/**
 * Ability flavor fx (design §22.7, ability pass W2-D): the events the animations
 * read, through the real modules, and the client tables that key them.
 *
 *  - a keystone verb's `card-fx` names the verb (`keystone`), so the client keys
 *    its ONE bespoke animation on it; a verb with a wind-up says so (`windupMs`,
 *    Aftershock's cracking ground) and its payoff arrives as its own card-fx;
 *  - an ability node's packet payoff carries its active amplifier's `axis`, so the
 *    client scales or extends the lane's fx by it; no amplifier, no axis;
 *  - every first verb is either animated or a keyed stub, the animation table in
 *    `abilityKeystoneFx.ts` and the model's set agree, and every offered axis does
 *    something to the draw.
 *
 * Wiring and presentation contracts only — never a balance number.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ABILITY_DATABASE,
  ABILITY_KEYSTONE_DEFINITIONS,
  ABILITY_NODE_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  abilityKeystoneNodeId,
  abilityKeystoneUnit,
  abilityNodeId,
  abilityNodeOptionsForRow,
  baseRecoveryForTier,
  emptyEquipment,
  type AbilityNodeProgress,
  type AmplifiedAxis,
  type CombatEvent,
  type PacketId,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import {
  onAbilityNodeBodiesHit, onAbilityNodeTechniqueLanded, refreshAbilityNodeRuntime,
} from '../src/systems/combat/abilityNodes';
import { ABILITY_KEYSTONE_MODULES, updateScheduledKeystoneHits } from '../src/systems/combat/keystones';
import {
  KEYSTONE_ANIMATED,
  KEYSTONE_STUBS,
  axisFx,
  keystoneHasAnimation,
} from '../../client/src/fx/abilityKeystoneModel';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
type CardFx = Extract<CombatEvent, { kind: 'card-fx' }>;

initCombatSystems();

function slices(id: string, abilityId: string, nodes: AbilityNodeProgress): PersistedPlayerSlices {
  const ability = ABILITY_DATABASE.get(abilityId)!;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {},
      playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [abilityId],
      attunedAbilities: ability.slot === 'technique'
        ? { techniques: [abilityId], guards: [] }
        : { techniques: [], guards: [abilityId] },
      abilityNodes: { [abilityId]: nodes },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: null,
    },
  };
}

function spawnPlayer(world: World, id: string, abilityId: string, nodes: AbilityNodeProgress): PlayerEntity {
  const player = world.attachPlayerEntity(slices(id, abilityId, nodes), id);
  player.dealsDamage.attack = 100;
  refreshAbilityNodeRuntime(player);
  world.takeNodeEvents(NODE);
  return player;
}

function rows(abilityId: string, picks: {
  packet: PacketId; amplifier?: AmplifiedAxis; keystone?: string;
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
  return progress;
}

function spawnMonster(world: World, x: number, y = 400): MonsterEntity {
  const monster = world.createMonster(NODE, 'plains-slime', { x, y });
  if (!monster) throw new Error('fixture: failed to spawn a monster');
  monster.hasHealth.maxHp = 100_000;
  monster.hasHealth.hp = 100_000;
  monster.mitigatesDamage.plating = 0;
  monster.mitigatesDamage.damageReduction = 0;
  return monster;
}

function hitCtx(world: World, player: PlayerEntity, defender: MonsterEntity): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player', defender, defenderType: 'monster',
    damage: 200, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

const cardFx = (world: World): CardFx[] =>
  world.takeNodeEvents(NODE).filter((e): e is CardFx => e.kind === 'card-fx');

// ─── A keystone's card-fx names its verb ─────────────────────────────────────

{
  const world = new World();
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const player = spawnPlayer(world, 'fx-whirlwind', 'sweep', rows('sweep', { packet: 'affliction', keystone: 'whirlwind' }));
  const target = spawnMonster(world, 430);
  const ctx = hitCtx(world, player, target);
  world.takeNodeEvents(NODE);
  ABILITY_KEYSTONE_MODULES.get('whirlwind')!.onResolved!(world, player, sweep, { ctx, target });
  const spin = cardFx(world).filter((e) => e.keystone === 'whirlwind');
  assert(spin.length === 1, `one card-fx names the spin, got ${spin.length}`);
  assert(spin[0]!.windupMs === undefined && (spin[0]!.durationMs ?? 0) > 0, 'the spin is a payoff, with its length');
  assert(spin[0]!.cardId === undefined, 'a keystone carries no card id: it never floats a word (design §26.4)');
}

// ─── Aftershock: a wind-up beat, then the eruption ───────────────────────────

{
  const world = new World();
  const slam = ABILITY_DATABASE.get('slam')!;
  const player = spawnPlayer(world, 'fx-aftershock', 'slam', rows('slam', { packet: 'empowered', keystone: 'aftershock' }));
  const target = spawnMonster(world, 430);
  const spot = { ...target.hasPosition.current };
  ABILITY_KEYSTONE_MODULES.get('aftershock')!.onResolved!(world, player, slam, { target });
  const windup = cardFx(world).filter((e) => e.keystone === 'aftershock');
  const delay = abilityKeystoneUnit('aftershockDelayMs');
  assert(windup.length === 1 && windup[0]!.windupMs === delay, 'one wind-up beat, its clock the delay');
  assert(windup[0]!.targetPos?.x === spot.x && windup[0]!.targetPos?.y === spot.y, 'the wind-up cracks the resolved spot');
  updateScheduledKeystoneHits(world, delay);
  const erupted = cardFx(world).filter((e) => e.keystone === 'aftershock');
  assert(erupted.length === 1 && erupted[0]!.windupMs === undefined, 'the eruption is its own card-fx, no wind-up');
  assert(erupted[0]!.targetPos?.x === spot.x, 'and it erupts at the spot');
}

// ─── An ability node's payoff carries its amplifier's axis ───────────────────
//
// On every fire-shape (design §22.10): Sweep's bleed on every body its cleave hit
// (one card-fx per body), and Binding Strike's on the body it landed on.

{
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const binding = ABILITY_DATABASE.get('binding-strike')!;
  for (const amplifier of [undefined, 'magnitude', 'targets'] as const) {
    const label = amplifier ?? 'no amplifier';
    const check = (drawn: CardFx[], what: string): void => {
      assert(drawn.length > 0, `${what} draws (${label})`);
      for (const e of drawn) {
        assert(e.axis === amplifier, `${what}: the card-fx carries the amplifier's axis: wanted ${amplifier}, got ${e.axis}`);
        assert(e.keystone === undefined, `${what}: a node payoff is not a keystone`);
      }
    };

    // Per body hit.
    {
      const world = new World();
      const player = spawnPlayer(world, `fx-axis-sweep-${label}`, 'sweep',
        rows('sweep', { packet: 'affliction', ...(amplifier ? { amplifier } : {}) }));
      const target = spawnMonster(world, 430);
      const second = spawnMonster(world, 445);
      const ctx = hitCtx(world, player, target);
      world.takeNodeEvents(NODE);
      onAbilityNodeBodiesHit(world, player, sweep, [target, second], ctx);
      const drawn = cardFx(world);
      check(drawn, 'the bleed on every body the cleave hit');
      assert(new Set(drawn.map((e) => e.targetId)).size >= 2, 'one per body');
    }

    // On land.
    {
      const world = new World();
      const player = spawnPlayer(world, `fx-axis-binding-${label}`, 'binding-strike',
        rows('binding-strike', { packet: 'affliction', ...(amplifier ? { amplifier } : {}) }));
      const target = spawnMonster(world, 430);
      spawnMonster(world, 445); // a second body for the targets axis
      const ctx = hitCtx(world, player, target);
      world.takeNodeEvents(NODE);
      onAbilityNodeTechniqueLanded(world, player, binding, { ctx, target });
      check(cardFx(world), 'the bleed on the rooted body');
    }
  }
}

// ─── The client tables ───────────────────────────────────────────────────────

{
  const firstVerbs = [...ABILITY_KEYSTONE_DEFINITIONS.values()].filter((v) => v.verb === 1).map((v) => v.id);
  for (const id of firstVerbs) {
    assert(KEYSTONE_ANIMATED.has(id) !== KEYSTONE_STUBS.includes(id), `${id} is either animated or a stub, exactly once`);
  }
  for (const id of KEYSTONE_ANIMATED) {
    assert(ABILITY_KEYSTONE_DEFINITIONS.has(id), `an animation for an unknown verb '${id}'`);
    assert(keystoneHasAnimation(id), `${id} reads as animated`);
  }
  assert(!keystoneHasAnimation(undefined), 'no verb, no animation');
  // Every verb with a server module draws its own animation; only a silhouette
  // (a verb not yet live) may still be a stub.
  for (const verb of ABILITY_KEYSTONE_DEFINITIONS.values()) {
    if (verb.live) assert(KEYSTONE_ANIMATED.has(verb.id), `${verb.name} is live but still a stub`);
  }

  // The animation table and the model's set agree (the module needs Phaser, so
  // its keys are read off the source, as attackProgression reads the bespoke paths).
  const source = readFileSync(join(__dirname, '../../client/src/fx/abilityKeystoneFx.ts'), 'utf8');
  const table = source.split('const KEYSTONE_ANIMATIONS')[1]?.split('\n};')[0] ?? '';
  const keyed = new Set([...table.matchAll(/^\s+'?([a-z-]+)'?:\s*[a-zA-Z]/gm)].map((m) => m[1]));
  assert(keyed.size === KEYSTONE_ANIMATED.size && [...keyed].every((id) => KEYSTONE_ANIMATED.has(id)),
    `abilityKeystoneFx.ts animates [${[...keyed].join(', ')}], the model says [${[...KEYSTONE_ANIMATED].join(', ')}]`);

  // Every axis an ability amplifier offers changes the draw; no amplifier changes nothing.
  const plain = axisFx(undefined);
  assert(plain.scale === 1 && plain.echoes === 0, 'no amplifier: the lane fx as it was');
  for (const tree of ABILITY_NODE_DATABASE.values()) {
    for (const option of abilityNodeOptionsForRow(tree, 'amplifier')) {
      const fx = axisFx(option.amplifies);
      assert(fx.scale !== 1 || fx.echoes > 0, `${option.id}: the ${option.amplifies} axis must scale or extend the fx`);
    }
  }
}

console.log('abilityFlavorFx: ok');
