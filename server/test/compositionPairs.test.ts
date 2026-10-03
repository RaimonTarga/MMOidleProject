/**
 * The three lean × verb pairs the composition review flagged, wired (design §24.2,
 * course-correction W3-A item 3). Each is a named block below:
 *
 *   A. CONTROL LEAN × CONTROL VERB — the hold loop stays under the cap.
 *   B. MECHANIC-PROXY NEVER EMITS MECHANIC-FIRED — on every class root.
 *   C. AFFLICTION VERB ON AN APPRENTICE — fires at the cap, not per hit.
 *
 * A and C buy their cards through the real economy (`unlockLineageCard`) and swing
 * the real attack (`runPlayerAttack`). B needs every root's own loop running, so it
 * fights a real T1 node with the lane bench's reference character
 * (`bench/lineage/laneBot.ts`) under a proxy on every hit. Wiring and invariants,
 * not balance numbers.
 *
 * What B found (fixed in `applyMechanicProxy`, its own commit): the DoT root and
 * the Conduit announce their mechanic without spending a charge, before the
 * lineage listeners run, so a proxy then landed on the same exchange — the hit
 * counted as the mechanic twice.
 *
 * What A found, pinned here so it cannot drift silently: NO T1 composition can
 * hold its own Control moment. The Control verb's moment is "a hit on a slowed or
 * rooted target", and the only payload that roots is the Control LEAN's — which, on
 * the Control verb, is the same-lane PURE pair, whose payload is the knockdown (a
 * stun, which `monsterIsHeld` does not count). So the pure Control pair never
 * self-feeds, and with no outside slow it never fires at all ("needs a slow",
 * §24.2). Design §24.2's "which the Control payload itself supplies once it has
 * fired once" is therefore not true of the shipped composition — a designer call.
 *
 * Run: node --conditions=development --import tsx test/compositionPairs.test.ts
 */
import {
  GAME_CONFIG,
  baseRecoveryForTier,
  emptyEquipment,
  getLineageRuntime,
  setLineageRuntime,
  tickCooldowns,
  tickStatusEffectDurations,
  type CombatEvent,
  type ResolvedLineageCard,
  type TierEntryProfile,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { registerCombatListener, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { registerMechanicFiredListener } from '../src/systems/combat/engine/mechanicFired';
import { setAttackTarget } from '../src/systems/combat/ai/targeting';
import { applyMonsterSlow, monsterIsHeld } from '../src/systems/combat/status/monsterControl';
import { equipItem } from '../src/systems/player/economy/inventory';
import { unlockLineageCard } from '../src/systems/player/economy/lineages';
import { unlockSkill } from '../src/systems/player/progression/skills';
import {
  LINEAGE_FRAME_PROFILES,
  LINEAGE_FRAME_REFERENCES,
  type LineageLaneReference,
} from '../../bot/src/tierEntry/profiles';
import { laneNodes, seededRandom } from '../bench/lineage/laneMeasure';
import { prepareLaneBot } from '../bench/lineage/laneBot';
import { setupArena, teardownArena } from '../bench/balance/arena';
import { reviveInFarmNode } from '../bench/balance/runFarm';
import { createFarmWorld } from '../bench/balance/worldFactory';
import { compositionPairs, t1FormOf, weaponLineages } from '../bench/lineage/compositionPairs';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';
initCombatSystems();
const world = new World();
let clock = 1_000_000;
const realNow = Date.now;
Date.now = () => clock;

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0, skillPoints: 1,
      essences: { red: 99_999, blue: 99_999, green: 99_999, yellow: 99_999, purple: 99_999 },
      shards: {
        tempo: 999, affliction: 999, engagement: 999, empowered: 999, control: 999, 'kill-chain': 999, technique: 999,
      },
      capstones: {},
      biomeXP: {}, biomeLevel: { plains: 6, forest: 6, mountain: 6, swamp: 6, cave: 6 },
      unlockedRecipes: [], questProgress: {}, playerTier: 2, currentSkillTier: 0,
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

/** A player wearing `weapon` (optionally of a class), with `cardIds` bought through the economy. */
function wielder(id: string, weapon: string, lineageId: string, cardIds: string[], classRoot?: string): PlayerEntity {
  const slices = makeSlices(id);
  slices.holdsInventory.inventory = [weapon];
  const player = world.attachPlayerEntity(slices, id);
  if (classRoot) assert(unlockSkill(world, player, classRoot), `${id}: ${classRoot} unlocks`);
  assert(equipItem(world, player, weapon), `${id}: wears ${weapon}`);
  for (const cardId of cardIds) {
    const bought = unlockLineageCard(world, player, lineageId, cardId);
    assert(bought.success, `${id}: ${cardId}: ${bought.reason}`);
  }
  world.takeNodeEvents(NODE);
  return player;
}

let nextX = 600;
function dummy(): MonsterEntity {
  nextX += 500;
  const m = world.createMonster(NODE, 'plains-slime', { x: nextX, y: 400 });
  assert(m, 'the dummy spawned');
  m!.hasHealth.maxHp = 10_000_000;
  m!.hasHealth.hp = 10_000_000;
  return m!;
}

/** One real swing at `target`; returns the `card-fx` events it drew for `cardId`. */
function swing(player: PlayerEntity, target: MonsterEntity, cardId: string): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  player.hasPosition.current = { x: target.hasPosition.current.x - 30, y: 400 };
  setAttackTarget(world, player, target.isMonster.id);
  runPlayerAttack(world, player, target, clock, {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: 'player' },
  });
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx' && e.cardId === cardId);
}

/** Advance the sim clock: the player's cooldowns (the caps) and the target's statuses. */
function advance(player: PlayerEntity, target: MonsterEntity, ms: number): void {
  clock += ms;
  tickCooldowns(player.tracksCombat, ms);
  tickStatusEffectDurations(target.tracksCombat, ms);
}

/** Fire times (ms from the first swing) of `cardId` over `durationMs` of swings every `stepMs`. */
function fight(
  player: PlayerEntity, target: MonsterEntity, cardId: string, durationMs: number, stepMs: number,
  each?: (t: number) => void,
): { firedAt: number[]; swings: number } {
  const firedAt: number[] = [];
  let swings = 0;
  for (let t = 0; t <= durationMs; t += stepMs) {
    if (t > 0) advance(player, target, stepMs);
    if (swing(player, target, cardId).length > 0) firedAt.push(t);
    swings += 1;
    each?.(t);
  }
  return { firedAt, swings };
}

function assertCapped(label: string, firedAt: number[], capMs: number, stepMs: number): void {
  for (let i = 1; i < firedAt.length; i++) {
    const gap = firedAt[i] - firedAt[i - 1];
    assert(gap >= capMs, `${label}: two firings ${gap} ms apart — the cap is ${capMs}`);
    assert(gap < capMs + stepMs, `${label}: and it fires again on the first hit the cap allows (gap ${gap})`);
  }
}

// ══ A. CONTROL LEAN × CONTROL VERB — the hold loop stays under the cap ═══════════

{
  // Structurally: no T1 composition puts a HOLD on the Control moment. A lean of
  // another lane brings its own payload (none of which holds); the Control lean on
  // the Control verb is the pure pair, the knockdown.
  for (const lineage of weaponLineages()) {
    if (!lineage.lanes.includes('control')) continue;
    for (const pair of compositionPairs(lineage)) {
      if (pair.verb !== 'control') continue;
      const player = wielder(`ctl-struct-${lineage.id}-${pair.label}`, t1FormOf(lineage), lineage.id,
        [pair.leanCardId!, pair.verbCardId!]);
      const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === pair.verbCardId);
      assert(verb?.trigger?.kind === 'hit-held' && verb.trigger.capMs === 5_000, `${lineage.id} ${pair.label}: the Control moment, capped at 5 s`);
      assert(verb?.payoff && !['root', 'slow'].includes(verb.payoff.kind),
        `${lineage.id} ${pair.label}: a ${verb?.payoff?.kind} payload on the Control moment would hold its own target`);
      if (pair.pure) assert(verb?.payoff?.kind === 'stun', `${lineage.id}: the pure Control pair is the knockdown`);
    }
  }

  const LEAN = 'hammer-t1-control-stat';
  const VERB = 'hammer-t1-control-payoff';
  const STEP = 500;

  // A1. No slow source: the pure pair never fires ("needs a slow"), and its
  // knockdown never makes the target held.
  {
    const player = wielder('ctl-free', 'heavy-hammer', 'hammer', [LEAN, VERB]);
    const target = dummy();
    const { firedAt } = fight(player, target, VERB, 30_000, STEP, () => {
      assert(!monsterIsHeld(target), 'nothing on a free target holds it');
    });
    assert(firedAt.length === 0, `with no slow source the Control verb never fires, got ${firedAt.length}`);
  }

  // A2. Held for the whole fight by an OUTSIDE slow (the stand-in for the Mid
  // range's at-bay slow): every hit satisfies the moment, and it fires at the cap,
  // reliably, never faster — the knockdown re-arms nothing.
  {
    const player = wielder('ctl-held', 'heavy-hammer', 'hammer', [LEAN, VERB]);
    const target = dummy();
    applyMonsterSlow(world, target, 0.2, 120_000, 'outside-slow');
    const DURATION = 60_000;
    const { firedAt, swings } = fight(player, target, VERB, DURATION, STEP);
    assertCapped('pure Control, held', firedAt, 5_000, STEP);
    assert(firedAt[0] === 0, `the first held hit fires, got ${firedAt[0]}`);
    assert(firedAt.length === Math.floor(DURATION / 5_000) + 1,
      `${swings} held hits over ${DURATION / 1000} s fire ${Math.floor(DURATION / 5_000) + 1} times at the cap, got ${firedAt.length}`);
  }

  // A3. The Control LEAN on another verb: its root DOES hold the target — and
  // with no Control moment in play, the hold feeds nothing. Engagement's opener
  // latches per body, so one body is rooted once however long the fight.
  {
    const player = wielder('ctl-root-opener', 'heavy-hammer', 'hammer', [LEAN, 'hammer-t1-engagement-payoff']);
    const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === 'hammer-t1-engagement-payoff');
    assert(verb?.trigger?.kind === 'first-hit' && verb.payoff?.kind === 'root', 'Control lean × Engagement verb: the opener roots');
    const target = dummy();
    const first = swing(player, target, 'hammer-t1-engagement-payoff');
    assert(first.length === 1 && first[0].fx === 'control.shackle', 'the first hit on the body roots it (the shackle)');
    assert(monsterIsHeld(target), 'and the root makes the target held');
    const { firedAt } = fight(player, target, 'hammer-t1-engagement-payoff', 30_000, STEP);
    assert(firedAt.length === 0, `one body is one opening: the root never re-fires on it, got ${firedAt.length}`);
    const second = dummy();
    assert(swing(player, second, 'hammer-t1-engagement-payoff').length === 1, 'a new body is a new opening');
  }
}

// ══ B. MECHANIC-PROXY NEVER EMITS MECHANIC-FIRED — on every class root ═══════════
//
// Every root has a proxy path: its own empowered multiplier (cadence, cooldown,
// energy, the Duelist's reload) or the table's fallback (dot, summoner, every
// other reload spec). Each of the six roots fights a real T1 node for 60 s as the
// lane bench's reference character wearing the Chaotic Axe, with every root's own
// loop running — and with a `mechanic-proxy` on EVERY hit, the most pressure the
// rule can be put under (a composed verb proxies one hit in six at most). Every
// `mechanic-fired` emission is recorded with its exchange; every proxied exchange
// is recorded at `afterHit`. The rule: no emission ever rides a proxied exchange —
// while proxies did land, and the real mechanic did announce itself (so the
// listener is live and counting).
//
// Seeded on the runtime cache rather than bought, on purpose: the real Axe pair
// (Hewing Arc × Chopping Rhythm) proxies every 6th landed hit, and on the Squire
// that hit is phase-locked onto the cooldown execution (a hit that already spent
// the real mechanic is never proxied), so in 60 s it can land no proxy at all and
// the rule would go unexercised on that root. The composition matrix measures the
// real pair; this block measures the rule.

{
  const proxied = new WeakSet<object>();
  let proxiedHits = 0;
  registerCombatListener('afterHit', (ctx: CombatContext) => {
    if (ctx.attackerType !== 'player' || ctx.metadata['mechanicProxy'] !== true) return;
    proxied.add(ctx);
    proxiedHits += 1;
  });
  const emissions: Array<{ ctx?: CombatContext }> = [];
  registerMechanicFiredListener((_world, _player, ctx) => { emissions.push({ ctx }); });

  const PROXY_EVERY_HIT: ResolvedLineageCard = {
    card: {
      id: 'proxy-every-hit', lineageId: 'axe', tier: 1, row: 'payoff', lane: 'tempo',
      name: 'Seeded proxy', description: '', fx: 'tempo.ghost-strike',
    },
    requiredBiomeGroup: 'cave', requiredBiomeLevel: 4, requiredGlobalMastery: 0,
    cost: { essence: {}, shards: {} },
    trigger: { kind: 'hit-nth', n: 1 },
    payoff: { kind: 'mechanic-proxy', magnitude: 1.5 },
    payoffFx: 'empowered.mechanic-flash',
    composition: { verbLane: 'tempo', pure: false },
  };
  const node = laneNodes().find((n) => n.nodeId === 'node-t1-cave-01');
  assert(node, 'the Cave own-node is in the lane set');

  for (const frame of LINEAGE_FRAME_REFERENCES.filter((r) => r.canonical && r.bandTier === 1)) {
    const root = frame.classRoot;
    const base = LINEAGE_FRAME_PROFILES.get(frame.profileId)!;
    const previous = base.equipment.weapon;
    const profile: TierEntryProfile = {
      ...base,
      id: `proxy-${root}`,
      equipment: { ...base.equipment, weapon: 'chaotic-axe' },
      inventory: [...new Set([
        ...base.inventory.filter((id) => id !== 'chaotic-axe'),
        ...(previous && previous !== 'chaotic-axe' ? [previous] : []),
      ])],
      itemUpgrades: {},
    };
    const reference: LineageLaneReference = {
      profileId: profile.id, lineageId: 'axe', lane: null, classRoot: root, frameId: frame.frameId,
      bandTier: 1, baseForm: 'chaotic-axe', wornForm: 'chaotic-axe', homeBiome: 'cave',
      cardIds: [], activeCardIds: [], shardsUnobtainableAtT1: false,
    };

    const savedRandom = Math.random;
    const savedNow = Date.now;
    Math.random = seededRandom(101009);
    let now = 0;
    Date.now = () => now;
    const bench = createFarmWorld();
    const emittedBefore = emissions.length;
    proxiedHits = 0;
    try {
      setupArena(bench, { nodeId: node!.nodeId, biomeGroup: node!.biome, contentTier: 1, isDungeon: false });
      const { bot, refusals } = prepareLaneBot(bench, profile, reference, node!.nodeId);
      assert(refusals.length === 0, `${root}: ${refusals.join('; ')}`);
      const seed = () => setLineageRuntime(bot.tracksCombat, { cards: [PROXY_EVERY_HIT], capstones: [] });
      seed();
      for (; now < 60_000; now += 100) {
        // A respawn rebuilds the cache from the (empty) tree: put the seed back.
        if (!getLineageRuntime(bot.tracksCombat)?.cards.some((c) => c.card.id === PROXY_EVERY_HIT.card.id)) seed();
        bench.tick(100, now);
        bench.pendingDeaths = [];
        bench.clearNodeEvents(node!.nodeId);
        if (bot.isDead !== undefined || bot.hasHealth.hp <= 0) reviveInFarmNode(bench, bot, node!.nodeId);
      }
    } finally {
      teardownArena(bench);
      Math.random = savedRandom;
      Date.now = savedNow;
    }
    const mine = emissions.slice(emittedBefore);
    const onProxy = mine.filter((e) => e.ctx !== undefined && proxied.has(e.ctx));
    assert(proxiedHits >= 5, `${root}: the proxy path ran (${proxiedHits} proxied hits in 60 s)`);
    assert(onProxy.length === 0, `${root}: ${onProxy.length} mechanic-fired emissions rode a proxied exchange`);
    assert(mine.length > 0, `${root}: the real mechanic announced itself in 60 s (the listener is live)`);
    console.log(`  B ${root.padEnd(14)} proxied hits ${String(proxiedHits).padStart(4)}  real mechanic-fired ${String(mine.length).padStart(3)}  on a proxy 0`);
  }
}

// ══ C. AFFLICTION VERB ON AN APPRENTICE — fires at the cap, not per hit ══════════
//
// The DoT root afflicts with every hit, so "a hit on a target you have already
// afflicted" is true from the second hit on. Synergy buys reliability, never rate
// (§24.2 rule 2): it fires at the 5 s cap, reliably, and never per hit — with the
// verb's own pure payload (the redose) and with a lean's (Quick Wrist's echo).

{
  const VERB = 'rapier-t1-affliction-payoff'; // Venom Point
  const STEP = 600;
  const DURATION = 60_000;
  const PER_CAP = Math.ceil(5_000 / STEP) * STEP; // the first swing the cap allows
  for (const [label, lean, payload] of [
    ['pure (redose)', null, 'redose'],
    ['Quick Wrist (echo)', 'rapier-t1-tempo-stat', 'echo-hit'],
  ] as const) {
    const player = wielder(`afl-${payload}`, 'flash-rapier', 'rapier', [...(lean ? [lean] : []), VERB], 'dot-root');
    assert(player.appliesDots !== undefined, 'a real Apprentice: the DoT root is attached');
    const verb = getLineageRuntime(player.tracksCombat)?.cards.find((c) => c.card.id === VERB);
    assert(verb?.trigger?.kind === 'hit-afflicted' && verb.trigger.capMs === 5_000, 'Venom Point: the Affliction moment, capped at 5 s');
    assert(verb?.payoff?.kind === payload, `${label}: the payload is ${payload}, got ${verb?.payoff?.kind}`);
    const target = dummy();
    const { firedAt, swings } = fight(player, target, VERB, DURATION, STEP);
    assert(firedAt[0] === STEP, `${label}: the hit that first afflicts is not on an afflicted target; the next one fires (got ${firedAt[0]})`);
    assertCapped(label, firedAt, 5_000, STEP);
    const expected = 1 + Math.floor((DURATION - STEP) / PER_CAP);
    assert(firedAt.length === expected, `${label}: ${swings} hits, every one after the first on an afflicted target, fire ${expected} times at the cap — got ${firedAt.length}`);
    assert(firedAt.length < swings / 5, `${label}: never per hit (${firedAt.length} firings from ${swings} hits)`);
  }
}

Date.now = realNow;
console.log('compositionPairs: ok');

