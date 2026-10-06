/**
 * The T1 payload FX, server half (course-correction W2-C): what the events carry
 * so the client can draw each payload from server truth.
 *
 * WHAT THIS PINS — wiring, not balance:
 *
 *   - a payload's OWN hit is tagged `lineage-hit:<fx>`: the echo's proc hit, and
 *     the hit in flight a lunge, crash, proxy or loaded hit multiplied;
 *   - lasting payloads put their APPLIED duration on the card-fx (a root's clock,
 *     a stun after control resistance, a bleed's ticks × its tick interval);
 *   - a Technique refund names the Techniques it moved AND samples their new
 *     cooldown to the HUD (it was invisible: the bar kept sweeping the old one);
 *   - a loaded Kill-chain carry announces itself once when a kill arms it and once
 *     when the next landed hit spends it; a carry with another payload does not.
 *
 * Run: node --conditions=development --import tsx test/lineagePayloadEvents.test.ts
 */
import {
  ABILITY_DATABASE,
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  LINEAGE_ROOT_STATUS_ID,
  GAME_CONFIG,
  applyStatusEffect,
  baseRecoveryForTier,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
  initUsesCadence,
  lineagePayloadHitFx,
  setCooldown,
  setLineageRuntime,
  type CombatEvent,
  type LineageFxKey,
  type LineagePayoff,
  type LineageTrigger,
  type PacketId,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { attachComponent } from '../src/ecs/markerHelpers';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { onTechniqueResolved } from '../src/systems/combat/techniqueResolved';
import { abilityCooldownKey } from '../src/systems/player/abilities/abilityCooldowns';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { STUN_EFFECT } from '../src/systems/combat/status/stun';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 1, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();
const world = new World();
let nextId = 0;

/** A composed T1 verb as the runtime sees it (see lineageComposition.test.ts). */
function verb(opts: { trigger: LineageTrigger; payoff: LineagePayoff; fx: LineageFxKey; lane?: PacketId }): ResolvedLineageCard {
  const lane = opts.lane ?? 'tempo';
  return {
    card: {
      id: `fx-verb-${++nextId}`, lineageId: 'rapier', tier: 1, row: 'payoff', lane,
      name: 'Seeded verb', description: '', fx: 'tempo.ghost-strike',
    },
    requiredBiomeGroup: 'forest', requiredBiomeLevel: 4, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: opts.trigger, payoff: opts.payoff, payoffFx: opts.fx,
    composition: { verbLane: lane, pure: false },
  };
}

function spawn(id: string, cards: ResolvedLineageCard[]): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id), id);
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = 0;
  setLineageRuntime(player.tracksCombat, { cards, capstones: [] });
  world.takeNodeEvents(NODE);
  return player;
}

let nextX = 500;
function monster(typeId = 'plains-slime'): MonsterEntity {
  nextX += 400;
  const m = world.createMonster(NODE, typeId, { x: nextX, y: 400 });
  if (!m) throw new Error(`failed to spawn ${typeId}`);
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function hit(player: PlayerEntity, defender: MonsterEntity, damage = 200): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player', defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

const events = (): CombatEvent[] => world.takeNodeEvents(NODE);
const cardFxOf = (list: CombatEvent[]) =>
  list.filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
const tagsOf = (ctx: CombatContext): string[] => (ctx.metadata['clientEffects'] as string[] | undefined) ?? [];
const EVERY_HIT: LineageTrigger = { kind: 'hit-nth', n: 1 };

// ── The payload's own hit is tagged ──────────────────────────────────────────

{
  // Lands twice: the echo's proc hit names the payload, the hit it echoes does not.
  const player = spawn('fx-echo', [verb({ trigger: EVERY_HIT, payoff: { kind: 'echo-hit', magnitude: 1 }, fx: 'tempo.ghost-strike' })]);
  const ctx = hit(player, monster());
  const list = events();
  const procHits = list.filter((e): e is Extract<CombatEvent, { kind: 'player-hit' }> => e.kind === 'player-hit');
  assert(procHits.length === 1, `the echo pushes its own hit, got ${procHits.length}`);
  assert(procHits[0].effects?.includes(lineagePayloadHitFx('tempo.ghost-strike')), 'tagged as the payload\'s hit');
  assert(!tagsOf(ctx).includes(lineagePayloadHitFx('tempo.ghost-strike')), 'the echoed hit itself is not the echo');
  assert(cardFxOf(list).length === 1, 'and one card-fx for the payload');
}

{
  // Hit-shaped payloads tag the hit in flight with their own fx.
  const shapes: Array<{ payoff: LineagePayoff; fx: LineageFxKey; lane: PacketId }> = [
    { payoff: { kind: 'big-hit', magnitude: 2 }, fx: 'engagement.lunge', lane: 'engagement' },
    { payoff: { kind: 'big-hit', magnitude: 1.5 }, fx: 'empowered.crash', lane: 'empowered' },
    { payoff: { kind: 'heal-and-load', magnitude: 0.1, loadMultiplier: 1.5 }, fx: 'kill-chain.heal-load', lane: 'kill-chain' },
  ];
  for (const shape of shapes) {
    const player = spawn(`fx-tag-${shape.fx}`, [verb({ trigger: EVERY_HIT, ...shape })]);
    const target = monster();
    const ctx = hit(player, target);
    assert(tagsOf(ctx).includes(lineagePayloadHitFx(shape.fx)), `${shape.fx}: the hit in flight is tagged`);
    const fx = cardFxOf(events());
    assert(fx.length === 1 && fx[0].targetId === target.isMonster.id, `${shape.fx}: its card-fx names the struck body`);
  }

  // The proxy, on a root that has a mechanic to proxy.
  const proxy = spawn('fx-tag-proxy', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'mechanic-proxy', magnitude: 1.5 }, fx: 'empowered.mechanic-flash',
  })]);
  attachComponent(world, proxy, 'usesCadence', initUsesCadence({ threshold: 5 }));
  const proxied = hit(proxy, monster());
  assert(tagsOf(proxied).includes(lineagePayloadHitFx('empowered.mechanic-flash')), 'the proxied hit is tagged');
  events();
}

{
  // End to end: the tag reaches the hit's own `player-hit` event.
  const player = spawn('fx-e2e', [verb({ trigger: EVERY_HIT, payoff: { kind: 'big-hit', magnitude: 2 }, fx: 'engagement.lunge', lane: 'engagement' })]);
  const target = monster();
  setAttackTarget(world, player, target.isMonster.id);
  events();
  runPlayerAttack(world, player, target, Date.now(), {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  const list = events();
  const lunge = list.find((e) => e.kind === 'player-hit');
  assert(lunge?.kind === 'player-hit' && lunge.effects?.includes(lineagePayloadHitFx('engagement.lunge')),
    'the lunge\'s player-hit carries the payload tag');
  const order = list.map((e) => e.kind);
  assert(order.indexOf('card-fx') < order.indexOf('player-hit'), 'the card-fx (the dash) precedes its hit');
}

// ── Lasting payloads carry their applied duration ────────────────────────────

{
  const player = spawn('fx-root', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'root', magnitude: 1, durationMs: 2_000 }, fx: 'control.shackle', lane: 'control',
  })]);
  const target = monster();
  hit(player, target);
  const fx = cardFxOf(events());
  const root = getStatusEffect(target.tracksCombat, LINEAGE_ROOT_STATUS_ID);
  assert(fx.length === 1 && fx[0].durationMs === 2_000 && root?.remainingMs === 2_000, 'the shackle holds the root\'s 2 s');
}

{
  const player = spawn('fx-stun', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'stun', magnitude: 1, durationMs: 1_500 }, fx: 'control.knockdown', lane: 'control',
  })]);
  const plain = monster();
  hit(player, plain);
  assert(cardFxOf(events())[0]?.durationMs === 1_500, 'a knockdown holds 1.5 s');

  // A resisting body is knocked down for less, and the event says how long.
  const resisting = monster();
  applyStatusEffect(resisting.tracksCombat, {
    id: ABILITY_CONTROL_RESIST_EFFECT_ID, maxStacks: 1, remainingMs: 10_000, sourceId: 'test',
    data: { controlResistPct: 0.4 },
  });
  hit(player, resisting);
  const resisted = cardFxOf(events())[0]?.durationMs;
  const applied = getStatusEffect(resisting.tracksCombat, STUN_EFFECT)?.remainingMs;
  assert(resisted === 900 && applied === 900, `control resistance shortens the drawn knockdown with the stun, got ${resisted}/${applied}`);
}

{
  const player = spawn('fx-bleed', [verb({
    trigger: EVERY_HIT, payoff: { kind: 'hemorrhage', magnitude: 1, durationMs: 4_000 }, fx: 'affliction.heavy-drip', lane: 'affliction',
  })]);
  hit(player, monster());
  assert(cardFxOf(events())[0]?.durationMs === 4_000, 'the heavy drip runs the bleed\'s 4 ticks of 1 s');
}

// ── The Technique refund reaches the HUD ─────────────────────────────────────

{
  const [technique] = [...ABILITY_DATABASE.values()].filter((a) => a.slot === 'technique');
  const player = spawn('fx-refund', [verb({
    trigger: { kind: 'technique-cast' }, payoff: { kind: 'technique-refund', magnitude: 0.5 },
    fx: 'technique.refund-flash', lane: 'technique',
  })]);
  player.tracksProgression.attunedAbilities.techniques = [technique.id];
  setCooldown(player.tracksCombat, abilityCooldownKey(technique.id), 6_000);
  onTechniqueResolved(world, player, technique);
  const list = events();
  const fx = cardFxOf(list);
  assert(fx.length === 1 && fx[0].abilityIds?.length === 1 && fx[0].abilityIds[0] === technique.id,
    'the refund names the Technique it moved');
  const sample = list.find((e) => e.kind === 'player-ability-cooldown');
  assert(sample?.kind === 'player-ability-cooldown' && sample.ability === technique.id && sample.remainingMs === 3_000,
    'and samples its new cooldown to the HUD');
  assert(getCooldown(player.tracksCombat, abilityCooldownKey(technique.id)) === 3_000, 'the cooldown really moved');

  setCooldown(player.tracksCombat, abilityCooldownKey(technique.id), 0);
  onTechniqueResolved(world, player, technique);
  const idle = events();
  assert(cardFxOf(idle).length === 0 && !idle.some((e) => e.kind === 'player-ability-cooldown'),
    'nothing running, nothing refunded, nothing drawn');
}

// ── The loaded carry: armed and spent, once each ─────────────────────────────

const loads = (list: CombatEvent[]) =>
  list.filter((e): e is Extract<CombatEvent, { kind: 'lineage-load' }> => e.kind === 'lineage-load');
const killOn = (player: PlayerEntity, defender: MonsterEntity) =>
  emitCombatEvent('onKill', {
    attacker: player, attackerType: 'player', defender, defenderType: 'monster',
    damage: 200, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext, world);

{
  const player = spawn('fx-load', [verb({
    trigger: { kind: 'kill', carry: true },
    payoff: { kind: 'heal-and-load', magnitude: 0.1, loadMultiplier: 1.5 },
    fx: 'kill-chain.heal-load', lane: 'kill-chain',
  })]);
  const target = monster();
  killOn(player, monster());
  const armed = loads(events());
  assert(armed.length === 1 && armed[0].loaded === true && armed[0].playerId === 'fx-load', 'the kill arms the load');
  killOn(player, monster());
  assert(loads(events()).length === 0, 'a second kill before the hit arms nothing new');

  hit(player, target);
  const spent = events();
  const kinds = spent.map((e) => e.kind);
  assert(loads(spent).length === 1 && loads(spent)[0].loaded === false, 'the next landed hit spends it');
  assert(kinds.indexOf('card-fx') < kinds.indexOf('lineage-load'), 'after the heal-and-load it paid');
  hit(player, target);
  assert(loads(events()).length === 0, 'an ordinary hit says nothing');
}

{
  // A carried moment with another payload (the Kill-chain verb under a Tempo lean)
  // loads nothing, so it announces nothing.
  const player = spawn('fx-carry-echo', [verb({
    trigger: { kind: 'kill', carry: true }, payoff: { kind: 'echo-hit', magnitude: 1 },
    fx: 'tempo.ghost-strike', lane: 'kill-chain',
  })]);
  killOn(player, monster());
  hit(player, monster());
  assert(loads(events()).length === 0, 'no load beat for a carry that lands twice instead');
}

console.log('lineagePayloadEvents: ok');
