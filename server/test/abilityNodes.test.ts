/**
 * Ability nodes, wired (design §19).
 *
 * WHAT THIS PINS. Not balance — every magnitude comes from the table and moves
 * with every tuning pass. What it pins is:
 *
 *   - the TABLE is legal: 22 trees, three options a row, a Technique restricted
 *     to offensive packets paying offensive payoffs, a Guard to the three
 *     defensive faces paying defensive ones, every option with a declared fx,
 *     and no numeric literal anywhere in the authored file;
 *   - the UNLOCK and SET paths behave: the ability must be learned, mastery
 *     gates when, materials gate whether, an amplifier needs its packet, buying
 *     into an empty row slots it, and you cannot slot what you do not own;
 *   - the RUNTIME fires exactly once per landing and once per cast, through the
 *     lineage dispatcher, and not at all for a player who bought nothing;
 *   - the AMPLIFIER moves its axis — a window holds longer, an on-target payoff
 *     reaches a second body;
 *   - HYDRATION invents nothing and keeps nothing stale.
 *
 * Exercised against a real `World` with fixtures, never a DB: CI provisions no
 * Postgres.
 *
 * Run: node --conditions=development --import tsx test/abilityNodes.test.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ABILITY_DATABASE,
  ABILITY_NODE_DATABASE,
  ABILITY_NODE_SHARE,
  DEFENSIVE_NODE_PAYOFFS,
  GAME_CONFIG,
  OFFENSIVE_NODE_PAYOFFS,
  PAYOFF_UNIT,
  WEAPON_PACKET_IDS,
  abilityNodeFx,
  abilityNodeId,
  baseRecoveryForTier,
  checkSetAbilityNode,
  checkUnlockAbilityNode,
  emptyEquipment,
  normalizeAbilityNodeProgressMap,
  packetDefaultFace,
  resolveAbilityNodeFiring,
  resolveAbilityNodeOption,
  type AbilityNodeProgress,
  type AbilityNodeWallet,
  type CombatEvent,
  type DefensiveFace,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { emitCombatEvent, type CombatContext } from '../src/systems/combat/engine/combatPipeline';
import { armTechnique } from '../src/systems/player/abilities/abilityArming';
import { onGuardFired } from '../src/systems/defense/charmHooks';
import { refreshAbilityNodeRuntime } from '../src/systems/combat/abilityNodes';
import { setAbilityNode, unlockAbilityNode } from '../src/systems/player/economy/abilityNodes';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = 'node-5-5';

// ─── The authored table is legal ─────────────────────────────────────────────

{
  assert(
    ABILITY_NODE_DATABASE.size === ABILITY_DATABASE.size,
    `every ability needs a node tree — ${ABILITY_NODE_DATABASE.size} of ${ABILITY_DATABASE.size}`,
  );
  assert(ABILITY_NODE_DATABASE.size === 22, `the roster is 22 abilities, got ${ABILITY_NODE_DATABASE.size}`);

  const problems: string[] = [];
  for (const [abilityId, tree] of ABILITY_NODE_DATABASE) {
    const ability = ABILITY_DATABASE.get(abilityId)!;
    const packets = tree.options.filter((o) => o.row === 'packet');
    const amps = tree.options.filter((o) => o.row === 'amplifier');
    if (packets.length !== 3) problems.push(`${abilityId}: ${packets.length} packet options, want 3`);
    if (amps.length !== 3) problems.push(`${abilityId}: ${amps.length} amplifier options, want 3`);

    const lanes = new Set(packets.map((o) => o.lane));
    if (lanes.size !== packets.length) problems.push(`${abilityId}: two options on one lane`);

    if (tree.family === 'technique') {
      // Three of the SIX offensive packets, paying an offensive payoff. A
      // Technique that paid defence would be offence buying eHP.
      for (const option of packets) {
        if (!WEAPON_PACKET_IDS.includes(option.lane)) {
          problems.push(`${abilityId}: Technique offers the defensive-only lane '${option.lane}'`);
        }
        if (!OFFENSIVE_NODE_PAYOFFS.has(option.payoff)) {
          problems.push(`${abilityId}: Technique pays the defensive payoff '${option.payoff}'`);
        }
      }
    } else {
      // One option per defensive face, paying a defensive payoff. A Guard that
      // paid offence would be defence scaling offence.
      const faces = packets.map((o) => packetDefaultFace(o.lane));
      for (const face of ['avoid', 'sustain', 'endure'] as DefensiveFace[]) {
        if (!faces.includes(face)) problems.push(`${abilityId}: Guard offers no '${face}' face`);
      }
      for (const option of packets) {
        if (!DEFENSIVE_NODE_PAYOFFS.has(option.payoff)) {
          problems.push(`${abilityId}: Guard pays the offensive payoff '${option.payoff}'`);
        }
      }
    }

    for (const option of tree.options) {
      if (!abilityNodeFx(option.lane, option.payoff)) {
        problems.push(`${abilityId}: no fx declared for ${option.lane}/${option.payoff}`);
      }
      if (PAYOFF_UNIT.get(option.payoff)?.binary) {
        problems.push(`${abilityId}: '${option.payoff}' is binary — a share of it is nothing`);
      }
      if (option.id !== abilityNodeId(abilityId, option.row, option.lane)) {
        problems.push(`${abilityId}: option id '${option.id}' is not the derived one`);
      }
    }

    // Every amplifier names a packet option of its own lane, and carries an axis.
    for (const amp of amps) {
      const target = packets.find((o) => o.id === amp.modifies);
      if (!target) problems.push(`${abilityId}: amplifier '${amp.id}' modifies nothing`);
      if (!amp.amplifies) problems.push(`${abilityId}: amplifier '${amp.id}' has no axis`);
    }

    // The packet row sits on the ability's home tier band; the amplifier above.
    if (tree.rowTier.packet !== Math.min(4, ability.tier)) {
      problems.push(`${abilityId}: packet row in band ${tree.rowTier.packet}, home tier ${ability.tier}`);
    }
    if (tree.rowTier.amplifier !== Math.min(4, ability.tier + 1)) {
      problems.push(`${abilityId}: amplifier row in band ${tree.rowTier.amplifier}`);
    }

    // Every packet option resolves to a finite, positive payoff and a real price.
    for (const option of packets) {
      const resolved = resolveAbilityNodeOption(option);
      if (!resolved.payoff || !(resolved.payoff.magnitude > 0)) {
        problems.push(`${abilityId}: ${option.lane} resolves to no payoff`);
      }
      const essence = Object.values(resolved.cost.essence)[0] ?? 0;
      const shard = Object.values(resolved.cost.shards)[0] ?? 0;
      if (!(essence > 0) || !(shard > 0)) {
        problems.push(`${abilityId}: ${option.lane} costs ${essence} essence and ${shard} shards`);
      }
      if (resolved.cost.shards[option.lane] === undefined) {
        problems.push(`${abilityId}: ${option.lane} is not paid in its own lane's shard`);
      }
    }
  }
  assert(problems.length === 0, `authored table problems:\n  ${problems.join('\n  ')}`);
}

// ─── No hand-authored numbers in the offers table ────────────────────────────

{
  // Belt to the braces the types already are: the failure mode guarded against is
  // someone authoring a magnitude next to the option that uses it, which is how
  // the old +N ladder ended up with a hand-tuned number per item per level.
  const file = join(__dirname, '../../shared/src/data/abilityNodes/offers.ts');
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const problems: string[] = [];
  let inBlockComment = false;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      return;
    }
    if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
    const code = line
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const literal = /(?<![\w.])\d+(?:\.\d+)?/.exec(code);
    if (literal) {
      problems.push(`offers.ts:${index + 1}: numeric literal '${literal[0]}'`);
    }
  });
  assert(problems.length === 0, `the offers table must carry no numbers:\n  ${problems.join('\n  ')}`);
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

initCombatSystems();
const world = new World();

function makeSlices(
  id: string,
  opts: {
    knownAbilities?: string[];
    abilityNodes?: Record<string, AbilityNodeProgress>;
    essences?: Partial<Record<'red' | 'blue' | 'green' | 'yellow' | 'purple', number>>;
    shards?: Record<string, number>;
    biomeLevel?: Record<string, number>;
  } = {},
): PersistedPlayerSlices {
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
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0, ...opts.essences },
      shards: (opts.shards ?? {}) as never,
      capstones: {},
      biomeXP: {}, biomeLevel: opts.biomeLevel ?? {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: opts.knownAbilities ?? [],
      attunedAbilities: { techniques: [], guards: [] },
      ...(opts.abilityNodes ? { abilityNodes: opts.abilityNodes } : {}),
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

function spawn(id: string, opts: Parameters<typeof makeSlices>[1] = {}): PlayerEntity {
  const player = world.attachPlayerEntity(makeSlices(id, opts), id);
  player.dealsDamage.attack = 100;
  refreshAbilityNodeRuntime(player);
  world.takeNodeEvents(NODE);
  return player;
}

function monster(x: number): MonsterEntity {
  const m = world.createMonster(NODE, 'plains-slime', { x, y: 400 });
  if (!m) throw new Error('failed to spawn a target');
  m.hasHealth.maxHp = 100_000;
  m.hasHealth.hp = 100_000;
  return m;
}

function hit(player: PlayerEntity, defender: MonsterEntity, damage = 200): CombatContext {
  const ctx = {
    attacker: player, attackerType: 'player',
    defender, defenderType: 'monster',
    damage, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent('onHit', ctx, world);
  return ctx;
}

function cardFx(): Array<Extract<CombatEvent, { kind: 'card-fx' }>> {
  return world.takeNodeEvents(NODE)
    .filter((e): e is Extract<CombatEvent, { kind: 'card-fx' }> => e.kind === 'card-fx');
}

/** The wallet a check sees, with the pools a test wants to control. */
function wallet(overrides: Partial<AbilityNodeWallet> = {}): AbilityNodeWallet {
  return {
    essences: {}, shards: {}, capstones: {}, biomeLevels: {},
    globalMastery: 0, playerTier: 4, knownAbilities: [],
    ...overrides,
  };
}

const SWEEP_TEMPO = abilityNodeId('sweep', 'packet', 'tempo');
const SWEEP_TEMPO_AMP = abilityNodeId('sweep', 'amplifier', 'tempo');
// Sweep's third offer is Technique since design §22 (it was Kill chain): a wide
// swing you can take twice as often is the swarm answer, which is why the Plains
// Swarm drops the Technique shard. Used here as "a lane the player is NOT running".
const SWEEP_OTHER_LANE = abilityNodeId('sweep', 'packet', 'technique');
const BRACE_WARD = abilityNodeId('brace', 'packet', 'barrier-tempo');
const sweepTree = ABILITY_NODE_DATABASE.get('sweep')!;
const braceTree = ABILITY_NODE_DATABASE.get('brace')!;
const sweepTempo = sweepTree.options.find((o) => o.id === SWEEP_TEMPO)!;
const sweepTempoAmp = sweepTree.options.find((o) => o.id === SWEEP_TEMPO_AMP)!;
const braceWard = braceTree.options.find((o) => o.id === BRACE_WARD)!;

// ─── The unlock check ────────────────────────────────────────────────────────

{
  const empty: AbilityNodeProgress = { owned: [], active: {} };
  const price = resolveAbilityNodeOption(sweepTempo);
  const rich = {
    essences: { yellow: 10_000 } as never,
    shards: { tempo: 500 } as never,
    globalMastery: price.requiredGlobalMastery,
    knownAbilities: ['sweep'],
  };

  const affordable = checkUnlockAbilityNode({ option: sweepTempo, progress: empty, wallet: wallet(rich) });
  assert(
    affordable.ok,
    `a learned ability with the mastery and the materials can buy its packet node, got: ${affordable.reason}`,
  );

  const unlearned = checkUnlockAbilityNode({
    option: sweepTempo, progress: empty, wallet: wallet({ ...rich, knownAbilities: [] }),
  });
  assert(!unlearned.ok, 'a node on an unlearned ability is not for sale');

  const unmastered = checkUnlockAbilityNode({
    option: sweepTempo, progress: empty, wallet: wallet({ ...rich, globalMastery: 0 }),
  });
  assert(!unmastered.ok, 'mastery gates WHEN you may buy');

  const broke = checkUnlockAbilityNode({
    option: sweepTempo, progress: empty, wallet: wallet({ ...rich, essences: {} }),
  });
  assert(!broke.ok, 'materials gate WHETHER you may buy');

  const noShards = checkUnlockAbilityNode({
    option: sweepTempo, progress: empty, wallet: wallet({ ...rich, shards: {} }),
  });
  assert(!noShards.ok, "the packet's own shard is part of the price");

  const ampFirst = checkUnlockAbilityNode({
    option: sweepTempoAmp, progress: empty, wallet: wallet({ ...rich, globalMastery: 10_000 }),
  });
  assert(!ampFirst.ok, 'an amplifier needs the packet node it modifies');

  const ampAfter = checkUnlockAbilityNode({
    option: sweepTempoAmp,
    progress: { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } },
    wallet: wallet({ ...rich, globalMastery: 10_000 }),
  });
  assert(ampAfter.ok, `with the packet owned the amplifier is buyable, got: ${ampAfter.reason}`);

  const again = checkUnlockAbilityNode({
    option: sweepTempo,
    progress: { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } },
    wallet: wallet(rich),
  });
  assert(!again.ok, 'a node is bought once');

  // The test room skips the MASTERY and COST gates, like `checkEvolve` — but not
  // the structural ones: a node still hangs off an ability you have learned.
  assert(
    checkUnlockAbilityNode({
      option: sweepTempo, progress: empty,
      wallet: wallet({ isTestRoom: true, knownAbilities: ['sweep'] }),
    }).ok,
    'the test room skips the mastery and cost gates',
  );
  assert(
    !checkUnlockAbilityNode({
      option: sweepTempo, progress: empty, wallet: wallet({ isTestRoom: true }),
    }).ok,
    'the test room does not hand out nodes for abilities you have not learned',
  );
}

// ─── The set check ───────────────────────────────────────────────────────────

{
  const owned: AbilityNodeProgress = { owned: [SWEEP_TEMPO], active: {} };
  assert(
    checkSetAbilityNode({ abilityId: 'sweep', progress: owned, row: 'packet', optionId: SWEEP_TEMPO }).ok,
    'an owned node can be slotted in its row',
  );
  assert(
    !checkSetAbilityNode({ abilityId: 'sweep', progress: owned, row: 'packet', optionId: SWEEP_OTHER_LANE }).ok,
    'an unowned node cannot be slotted',
  );
  assert(
    !checkSetAbilityNode({ abilityId: 'sweep', progress: owned, row: 'amplifier', optionId: SWEEP_TEMPO }).ok,
    'a packet node is not an amplifier',
  );
  assert(
    checkSetAbilityNode({ abilityId: 'sweep', progress: owned, row: 'packet', optionId: null }).ok,
    'clearing a row is always legal',
  );
}

// ─── Buying and slotting, over the real handlers ─────────────────────────────

{
  const price = resolveAbilityNodeOption(sweepTempo);
  const essence = price.cost.essence.yellow!;
  const shards = price.cost.shards.tempo!;
  const player = spawn('an-buy', {
    knownAbilities: ['sweep'],
    essences: { yellow: essence + 5 },
    shards: { tempo: shards + 2 },
    biomeLevel: { plains: 6, forest: 6, mountain: 6, swamp: 6, cave: 6 },
  });
  // Mastery is derived from biome levels, so give the gate what it asks for.
  player.tracksProgression.biomeLevel = Object.fromEntries(
    ['plains', 'forest', 'mountain', 'swamp', 'cave', 'jungle', 'desert', 'tundra', 'volcanic', 'trench', 'graveyard']
      .map((b) => [b, 24]),
  );

  const bought = unlockAbilityNode(world, player, 'sweep', SWEEP_TEMPO);
  assert(bought.success, `buying should succeed, got: ${bought.reason}`);
  const progress = player.tracksProgression.abilityNodes!.sweep!;
  assert(progress.owned.includes(SWEEP_TEMPO), 'the node is owned');
  assert(progress.active.packet === SWEEP_TEMPO, 'buying into an empty row slots it');
  assert(player.tracksProgression.essences.yellow === 5, 'essence was spent');
  assert(player.tracksProgression.shards.tempo === 2, 'the lane shard was spent');

  const twice = unlockAbilityNode(world, player, 'sweep', SWEEP_TEMPO);
  assert(!twice.success, 'a node cannot be bought twice');

  const slotUnowned = setAbilityNode(world, player, 'sweep', 'packet', SWEEP_OTHER_LANE);
  assert(!slotUnowned.success, 'you cannot slot what you do not own');

  const cleared = setAbilityNode(world, player, 'sweep', 'packet', null);
  assert(cleared.success, 'clearing a row is free');
  assert(
    player.tracksProgression.abilityNodes!.sweep!.active.packet === undefined,
    'the row is empty after clearing',
  );
  assert(
    player.tracksCombat.abilityNodeRuntime === undefined,
    'an empty row leaves no runtime behind',
  );

  const reslotted = setAbilityNode(world, player, 'sweep', 'packet', SWEEP_TEMPO);
  assert(reslotted.success, 'reslotting an owned node is free');
  assert(
    player.tracksCombat.abilityNodeRuntime?.sweep !== undefined,
    'the recalc the handler runs refreshes the runtime',
  );

  const unknown = unlockAbilityNode(world, player, 'not-an-ability', SWEEP_TEMPO);
  assert(!unknown.success, 'an unknown ability has no nodes');
}

// ─── A player with no nodes pays nothing and draws nothing ───────────────────

{
  const player = spawn('an-bare', { knownAbilities: ['sweep'] });
  const target = monster(460);
  armTechnique(world, player, 'sweep');
  hit(player, target);
  assert(cardFx().length === 0, 'a player with no nodes draws no card effects');
}

// ─── A Technique node fires once per LANDING ─────────────────────────────────

{
  const player = spawn('an-tech', {
    knownAbilities: ['sweep'],
    abilityNodes: { sweep: { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } } },
  });
  const target = monster(470);

  // Arming is not landing: the charge is up, nothing has been struck.
  assert(cardFx().length === 0, 'spawning draws nothing');
  armTechnique(world, player, 'sweep');
  assert(cardFx().length === 0, 'arming a Technique must not pay out');

  const before = target.hasHealth.hp;
  hit(player, target);
  const fired = cardFx();
  assert(fired.length === 1, `the landing fires exactly once, got ${fired.length}`);
  assert(fired[0].fx === 'tempo.ghost-strike', `the lane's own fx, got ${fired[0].fx}`);
  assert(fired[0].targetId === target.isMonster.id, 'an on-target effect names its target');
  assert(target.hasHealth.hp < before, 'echo-hit dealt damage through the proc seam');

  // The armed charge is spent, so the next ordinary swing pays nothing.
  hit(player, target);
  assert(cardFx().length === 0, 'an unarmed swing does not fire the node');
}

// ─── A Guard node fires once per CAST ────────────────────────────────────────

{
  // Both trees are bought, so the cross-family assertions below are about WHICH
  // node fires rather than about a player who owns nothing.
  const player = spawn('an-guard', {
    knownAbilities: ['brace', 'sweep'],
    abilityNodes: {
      brace: { owned: [BRACE_WARD], active: { packet: BRACE_WARD } },
      sweep: { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } },
    },
  });
  const target = monster(480);
  const brace = ABILITY_DATABASE.get('brace')!;
  const secondWind = ABILITY_DATABASE.get('second-wind')!;

  onGuardFired(world, player, brace);
  const fired = cardFx();
  assert(fired.length === 1, `one cast, one application, got ${fired.length}`);
  assert(fired[0].fx === 'barrier-tempo.ward-shell', `the face's own fx, got ${fired[0].fx}`);
  assert((player.holdsWards?.wards.length ?? 0) > 0, 'ward reached the absorb pool');

  // A node is keyed to ITS ability: casting a different Guard fires nothing,
  // even though this player has a Guard node bought and slotted.
  onGuardFired(world, player, secondWind);
  assert(cardFx().length === 0, "another Guard's cast does not fire this Guard's node");

  // And a Technique landing fires the TECHNIQUE's node, not the Guard's.
  armTechnique(world, player, 'sweep');
  hit(player, target);
  const onLanding = cardFx();
  assert(onLanding.length === 1, `the landing fires once, got ${onLanding.length}`);
  assert(
    onLanding[0].fx === 'tempo.ghost-strike',
    `a landing fires the Technique's node, got ${onLanding[0].fx}`,
  );
}

// ─── The amplifier moves its axis ────────────────────────────────────────────

{
  // `duration`: a timed self window holds longer. Brace's sustain face is a ward.
  const bare = resolveAbilityNodeFiring('brace', { owned: [BRACE_WARD], active: { packet: BRACE_WARD } })!;
  const amped = resolveAbilityNodeFiring('brace', {
    owned: [BRACE_WARD, abilityNodeId('brace', 'amplifier', 'barrier-tempo')],
    active: {
      packet: BRACE_WARD,
      amplifier: abilityNodeId('brace', 'amplifier', 'barrier-tempo'),
    },
  })!;
  assert(braceWard.payoff === 'ward', 'the fixture is the ward face');
  assert(
    amped.payoff.durationMs! === Math.round(bare.payoff.durationMs! * (1 + ABILITY_NODE_SHARE.amplifier)),
    `the duration axis lengthens the window: ${bare.payoff.durationMs} -> ${amped.payoff.durationMs}`,
  );
  assert(amped.amplifier !== undefined, 'the amplifier is reported as folded in');
  assert(
    amped.payoff.magnitude === bare.payoff.magnitude,
    'the duration axis moves the duration and nothing else',
  );

  // `targets`: an on-target payoff reaches a second body.
  const tempoBare = resolveAbilityNodeFiring('sweep', { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } })!;
  const tempoAmped = resolveAbilityNodeFiring('sweep', {
    owned: [SWEEP_TEMPO, SWEEP_TEMPO_AMP],
    active: { packet: SWEEP_TEMPO, amplifier: SWEEP_TEMPO_AMP },
  })!;
  assert(sweepTempoAmp.amplifies === 'targets', 'an echo amplifies along the targets axis');
  assert(tempoBare.payoff.extraTargets === undefined, 'an unamplified payoff reaches one body');
  assert(tempoAmped.payoff.extraTargets === 1, 'the targets axis adds a second body');

  // An amplifier slotted against a packet the player is not running is inert —
  // a legal, useless loadout, exactly like a lineage amplifier.
  const mismatched = resolveAbilityNodeFiring('sweep', {
    owned: [SWEEP_OTHER_LANE, SWEEP_TEMPO_AMP],
    active: { packet: SWEEP_OTHER_LANE, amplifier: SWEEP_TEMPO_AMP },
  })!;
  assert(mismatched.amplifier === undefined, "an amplifier on another lane's packet does nothing");

  // Nothing slotted, nothing fires.
  assert(
    resolveAbilityNodeFiring('sweep', { owned: [SWEEP_TEMPO], active: {} }) === undefined,
    'an owned but unslotted node fires nothing',
  );
  assert(
    resolveAbilityNodeFiring('sweep', { owned: [], active: { packet: SWEEP_TEMPO } }) === undefined,
    'a slotted node the player does not own fires nothing',
  );
}

// ─── The amplified echo really does reach a second body ──────────────────────

{
  const player = spawn('an-amp', {
    knownAbilities: ['sweep'],
    abilityNodes: {
      sweep: {
        owned: [SWEEP_TEMPO, SWEEP_TEMPO_AMP],
        active: { packet: SWEEP_TEMPO, amplifier: SWEEP_TEMPO_AMP },
      },
    },
  });
  const primary = monster(430);
  const neighbour = world.createMonster(NODE, 'plains-slime', { x: 450, y: 400 })!;
  neighbour.hasHealth.maxHp = 100_000;
  neighbour.hasHealth.hp = 100_000;
  world.takeNodeEvents(NODE);

  armTechnique(world, player, 'sweep');
  hit(player, primary);
  // One application, so ONE card-fx (design §8), even though the amplified
  // payoff landed on two bodies.
  assert(cardFx().length === 1, 'an amplified payoff still draws exactly one effect');
  assert(neighbour.hasHealth.hp < 100_000, 'the echo reached the second body');
}

// ─── Hydration ───────────────────────────────────────────────────────────────

{
  assert(
    Object.keys(normalizeAbilityNodeProgressMap(undefined)).length === 0,
    'no stored map hydrates to an empty one',
  );

  const normalized = normalizeAbilityNodeProgressMap({
    sweep: { owned: [SWEEP_TEMPO, 'sweep.packet.bulwark'], active: { packet: SWEEP_TEMPO } },
    'an-ability-that-was-retired': { owned: ['whatever'], active: {} },
    brace: { owned: [], active: { packet: BRACE_WARD } },
    endure: { owned: [abilityNodeId('endure', 'packet', 'bulwark')], active: { amplifier: abilityNodeId('endure', 'packet', 'bulwark') } },
  } as never);

  assert(normalized.sweep!.owned.length === 1, 'an option id that no longer exists is dropped');
  assert(normalized.sweep!.active.packet === SWEEP_TEMPO, 'a live active row survives');
  assert(normalized['an-ability-that-was-retired'] === undefined, 'an unknown ability is dropped');
  assert(
    normalized.brace!.active.packet === undefined,
    'an active row pointing at something unowned is dropped',
  );
  assert(
    normalized.endure!.active.amplifier === undefined,
    'an active row pointing at another row\'s option is dropped',
  );

  // And a save that carries nodes comes back live on the entity: the runtime is
  // rebuilt from the persisted slice at attach, with no purchase replayed.
  const loaded = spawn('an-hydrate', {
    knownAbilities: ['sweep'],
    abilityNodes: { sweep: { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } } },
  });
  assert(
    loaded.tracksProgression.abilityNodes?.sweep?.active.packet === SWEEP_TEMPO,
    'the persisted slice survives attach',
  );
  assert(
    loaded.tracksCombat.abilityNodeRuntime?.sweep?.option.id === SWEEP_TEMPO,
    'the runtime is rebuilt from the persisted slice',
  );
}

console.log('abilityNodes: ok');
