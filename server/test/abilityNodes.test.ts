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
// ── W1-B (ability pass): the keystone and cross rows, the free amplifier axis,
// the cast axis, row tiers and names (design §22.1, §22.9–§22.11). A second import
// block so the W1-B blocks at the end of the file stay self-contained.
import {
  ABILITY_KEYSTONE_DEFINITIONS,
  ABILITY_KEYSTONE_TRIOS,
  ABILITY_NODE_ROWS,
  KEYSTONE_NOT_YET_REASON,
  LINEAGE_FX_KEYS,
  MAX_LINEAGE_TIER,
  NODE_ROW_AS_LINEAGE_ROW,
  TECHNIQUE_CAST_SPEED_CAP,
  abilityDisplayName,
  abilityKeystoneNodeId,
  abilityNodeBandTier,
  abilityNodeCastSpeedPct,
  abilityNodeNameParts,
  abilityNodeRowTier,
  abilityNodeVisibleOptions,
  abilityCastMs,
  castWindupMs,
  ladderMasteryLevelForRow,
  nodePayoffAxes,
  nodePayoffAxis,
  payoffValue,
  rowEssenceCost,
  rowShardCost,
  type AbilityNodeRow,
} from '@mmo-idle/shared';
import { onAbilityNodeTechniqueLanded } from '../src/systems/combat/abilityNodes';
import { beginAbilityCast, castWindupFor } from '../src/systems/player/abilities/abilityCasting';

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
    if (amps.length < 3) problems.push(`${abilityId}: ${amps.length} amplifier options, want one route's worth each`);

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

    for (const option of tree.options.filter((o) => o.row !== 'keystone')) {
      if (!abilityNodeFx(option.lane, option.payoff)) {
        problems.push(`${abilityId}: no fx declared for ${option.lane}/${option.payoff}`);
      }
      if (PAYOFF_UNIT.get(option.payoff)?.binary) {
        problems.push(`${abilityId}: '${option.payoff}' is binary — a share of it is nothing`);
      }
      if (option.id !== abilityNodeId(abilityId, option.row, option.lane, option.amplifies)) {
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

// ═══ W1-B ═══════════════════════════════════════════════════════════════════
// The keystone and cross rows, the free amplifier axis, the cast axis, the row
// tiers and the names (design §22.1, §22.9, §22.10, §22.11). Each block below is
// self-contained; the keystone VERBS' own wiring smokes live in
// `abilityKeystones.test.ts`.

/** A wallet that can afford anything a Technique row asks for. */
function richWallet(abilityId: string): AbilityNodeWallet {
  return wallet({
    essences: { red: 1e9, blue: 1e9, green: 1e9, yellow: 1e9, purple: 1e9 } as never,
    shards: Object.fromEntries(WEAPON_PACKET_IDS.map((lane) => [lane, 1e9])) as never,
    globalMastery: 10_000,
    knownAbilities: [abilityId],
  });
}

// ─── W1-B · Row tiers: home + N, no clamp, folded into the cap band (§22.1, §22.10) ─

{
  // By home tier: the tier each row BELONGS to, and the band it is bought in today.
  const TABLE: Record<number, { own: number[]; band: number[] }> = {
    1: { own: [1, 2, 3, 4], band: [1, 2, 3, 4] },
    2: { own: [2, 3, 4, 5], band: [2, 3, 4, 4] },
    3: { own: [3, 4, 5, 6], band: [3, 4, 4, 4] },
    4: { own: [4, 5, 6, 7], band: [4, 4, 4, 4] },
  };
  assert(MAX_LINEAGE_TIER === 4, 'the band column assumes the T4 cap; a shipped tier unfolds it');
  assert(
    ABILITY_NODE_ROWS.join() === 'packet,amplifier,keystone,cross',
    `the four rows in order, got ${ABILITY_NODE_ROWS.join()}`,
  );
  for (const [home, want] of Object.entries(TABLE)) {
    ABILITY_NODE_ROWS.forEach((row, index) => {
      const own = abilityNodeRowTier({ tier: Number(home) }, row);
      const band = abilityNodeBandTier({ tier: Number(home) }, row);
      assert(own === want.own[index], `T${home} ${row}: own tier ${own}, want ${want.own[index]}`);
      assert(band === want.band[index], `T${home} ${row}: band ${band}, want ${want.band[index]}`);
    });
  }

  const problems: string[] = [];
  for (const [abilityId, tree] of ABILITY_NODE_DATABASE) {
    const ability = ABILITY_DATABASE.get(abilityId)!;
    const want = TABLE[ability.tier]!;
    ABILITY_NODE_ROWS.forEach((row, index) => {
      if (tree.rowOwnTier[row] !== want.own[index]) {
        problems.push(`${abilityId}: ${row} belongs to T${tree.rowOwnTier[row]}, want T${want.own[index]}`);
      }
      if (tree.rowTier[row] !== want.band[index]) {
        problems.push(`${abilityId}: ${row} is bought in T${tree.rowTier[row]}, want T${want.band[index]}`);
      }
    });
    // Every option is gated and priced in its row's BAND, at that band's level for
    // the row's own kind — which is how a folded row still reaches the player.
    const packet = tree.options.find((o) => o.row === 'packet')!;
    const progress = { owned: [packet.id], active: { packet: packet.id } };
    for (const option of tree.options) {
      const band = tree.rowTier[option.row];
      const lineageRow = NODE_ROW_AS_LINEAGE_ROW[option.row];
      const resolved = resolveAbilityNodeOption(option, progress);
      if (resolved.tier !== band) problems.push(`${option.id}: priced in T${resolved.tier}, band T${band}`);
      if (resolved.requiredGlobalMastery !== ladderMasteryLevelForRow(band, lineageRow)) {
        problems.push(`${option.id}: gated at Global Mastery ${resolved.requiredGlobalMastery}`);
      }
      const essence = Object.values(resolved.cost.essence)[0] ?? 0;
      if (essence !== rowEssenceCost(band, lineageRow)) problems.push(`${option.id}: costs ${essence} essence`);
      // The save never records a tier: the band is derived from the home tier at
      // read time, so shipping T5 unfolds a row without touching a save.
      if (/\.t\d/.test(option.id)) problems.push(`${option.id}: an option id must not carry a tier`);
    }
  }
  assert(problems.length === 0, `row-tier problems:\n  ${problems.join('\n  ')}`);
}

// ─── W1-B · The keystone row: three verbs, a silhouette until it lands (§22.4, §22.11) ─

{
  assert(ABILITY_KEYSTONE_TRIOS.size === 19, `the final roster has 19 trios, got ${ABILITY_KEYSTONE_TRIOS.size}`);
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const [abilityId, trio] of ABILITY_KEYSTONE_TRIOS) {
    trio.forEach((verb, index) => {
      if (verb.abilityId !== abilityId) problems.push(`${verb.id}: filed under ${abilityId}`);
      if (verb.verb !== index + 1) problems.push(`${verb.id}: verb ${verb.verb} in slot ${index + 1}`);
      if (seen.has(verb.id)) problems.push(`${verb.id}: two verbs share an id`);
      seen.add(verb.id);
      if (!LINEAGE_FX_KEYS.includes(verb.fx)) problems.push(`${verb.id}: fx '${verb.fx}' has no client handler`);
      if (!['owner', 'delivering-body', 'formation'].includes(verb.delivery)) {
        problems.push(`${verb.id}: delivery '${verb.delivery}'`);
      }
      // One sentence per card (design §26.4).
      if (!/^[A-Z].*\.$/.test(verb.rule) || verb.rule.slice(0, -1).includes('. ')) {
        problems.push(`${verb.id}: the rule must be one sentence`);
      }
      if (verb.paysShare && PAYOFF_UNIT.get(verb.payoff)?.binary) {
        problems.push(`${verb.id}: a share of the binary '${verb.payoff}' is nothing`);
      }
      // Defence never scales with offence: a Guard verb never pays a share of a hit.
      if (verb.paysShare && ABILITY_DATABASE.get(abilityId)?.slot === 'guard') {
        problems.push(`${verb.id}: a Guard keystone deals damage`);
      }
    });
    // Gated, not an error: a trio whose ability is not in the database yet (Sidestep
    // and Cull before the roster run lands) simply waits for it.
    if (!ABILITY_DATABASE.has(abilityId)) {
      if (ABILITY_NODE_DATABASE.has(abilityId)) problems.push(`${abilityId}: a tree for an unknown ability`);
      continue;
    }
    const options = ABILITY_NODE_DATABASE.get(abilityId)!.options.filter((o) => o.row === 'keystone');
    if (options.map((o) => o.keystone).join() !== trio.map((verb) => verb.id).join()) {
      problems.push(`${abilityId}: keystone row ${options.map((o) => o.keystone).join()} is not its trio`);
    }
    for (const option of options) {
      if (option.id !== abilityKeystoneNodeId(abilityId, option.keystone!)) {
        problems.push(`${option.id}: not the derived keystone id`);
      }
    }
  }
  // An ability with no trio (a §22.2 cut, until the roster run removes it) has an
  // empty keystone row rather than an error.
  for (const [abilityId, tree] of ABILITY_NODE_DATABASE) {
    if (!ABILITY_KEYSTONE_TRIOS.has(abilityId) && tree.options.some((o) => o.row === 'keystone')) {
      problems.push(`${abilityId}: keystone options with no trio`);
    }
  }
  assert(problems.length === 0, `keystone row problems:\n  ${problems.join('\n  ')}`);

  // The second and third verbs are silhouettes this run: shown, never sold.
  const tree = ABILITY_NODE_DATABASE.get('sweep')!;
  const withTempo: AbilityNodeProgress = { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } };
  const reap = tree.options.find((o) => o.keystone === 'reap')!;
  const refused = checkUnlockAbilityNode({ option: reap, progress: withTempo, wallet: richWallet('sweep') });
  assert(!refused.ok && refused.reason === KEYSTONE_NOT_YET_REASON, `a silhouette is not for sale, got ${refused.reason}`);
  assert(
    !checkUnlockAbilityNode({
      option: reap, progress: withTempo, wallet: wallet({ isTestRoom: true, knownAbilities: ['sweep'] }),
    }).ok,
    'not even in the test room: a verb with no rule behind it would be a no-op',
  );

  // The price: the keystone row's essence in its band, plus the ACTIVE packet's shard.
  const band = tree.rowTier.keystone;
  for (const option of tree.options.filter((o) => o.row === 'keystone')) {
    const quote = resolveAbilityNodeOption(option, withTempo);
    assert(
      Object.keys(quote.cost.shards).join() === 'tempo' && quote.cost.shards.tempo === rowShardCost(band, 'keystone'),
      `${option.id}: paid in the active packet's shard, got ${JSON.stringify(quote.cost.shards)}`,
    );
    assert(
      Object.values(quote.cost.essence)[0] === rowEssenceCost(band, 'keystone'),
      `${option.id}: the keystone row's essence`,
    );
    const swapped = resolveAbilityNodeOption(option, {
      owned: [SWEEP_TEMPO, SWEEP_OTHER_LANE], active: { packet: SWEEP_OTHER_LANE },
    });
    assert(swapped.cost.shards.technique !== undefined, `${option.id}: the shard follows the ACTIVE packet`);
    assert(
      Object.keys(resolveAbilityNodeOption(option, { owned: [], active: {} }).cost.shards).length === 0,
      `${option.id}: with no packet slotted there is no shard to quote`,
    );
  }

  // Whichever verb is live (they land one at a time), it needs an active packet.
  const live = [...ABILITY_KEYSTONE_DEFINITIONS.values()]
    .find((verb) => verb.live && ABILITY_NODE_DATABASE.has(verb.abilityId));
  if (live) {
    const liveTree = ABILITY_NODE_DATABASE.get(live.abilityId)!;
    const option = liveTree.options.find((o) => o.keystone === live.id)!;
    const packet = liveTree.options.find((o) => o.row === 'packet')!;
    assert(
      !checkUnlockAbilityNode({ option, progress: { owned: [], active: {} }, wallet: richWallet(live.abilityId) }).ok,
      `${live.id}: a keystone needs a packet node first`,
    );
    const ok = checkUnlockAbilityNode({
      option, progress: { owned: [packet.id], active: { packet: packet.id } }, wallet: richWallet(live.abilityId),
    });
    assert(ok.ok, `${live.id}: a live verb over an active packet is for sale, got ${ok.reason}`);
  }
}

// ─── W1-B · The cross row: derived, one option per non-active offer (§22.1) ──

{
  const problems: string[] = [];
  for (const [abilityId, tree] of ABILITY_NODE_DATABASE) {
    const offers = tree.options.filter((o) => o.row === 'packet');
    const crosses = tree.options.filter((o) => o.row === 'cross');
    if (crosses.length !== offers.length) problems.push(`${abilityId}: ${crosses.length} cross options`);
    for (const offer of offers) {
      const cross = crosses.find((o) => o.lane === offer.lane && o.payoff === offer.payoff);
      if (!cross) {
        problems.push(`${abilityId}: no cross option borrows ${offer.lane}/${offer.payoff}`);
        continue;
      }
      if (cross.id !== abilityNodeId(abilityId, 'cross', offer.lane)) problems.push(`${cross.id}: not derived`);
      // With this offer active, the row shows the OTHER two.
      const shown = abilityNodeVisibleOptions(tree, 'cross', { owned: [offer.id], active: { packet: offer.id } });
      if (shown.length !== offers.length - 1 || shown.some((o) => o.lane === offer.lane)) {
        problems.push(`${abilityId}: with ${offer.lane} active the cross row shows ${shown.map((o) => o.lane).join()}`);
      }
      // A packet-row payoff at the cross scalar, in the cross row's band.
      const band = tree.rowTier.cross;
      const raw = payoffValue({ payoff: cross.payoff, tier: band, row: 'cross', lane: cross.lane }).magnitude
        * ABILITY_NODE_SHARE.packet;
      const want = Math.max(0.001, Math.round(raw * 1000) / 1000);
      const got = resolveAbilityNodeOption(cross).payoff?.magnitude;
      if (got === undefined || Math.abs(got - want) > 1e-9) problems.push(`${cross.id}: pays ${got}, want ${want}`);
    }
  }
  assert(problems.length === 0, `cross row problems:\n  ${problems.join('\n  ')}`);

  // Buying: an active packet on ANOTHER lane is the prerequisite.
  const tree = ABILITY_NODE_DATABASE.get('sweep')!;
  const crossTempo = tree.options.find((o) => o.id === abilityNodeId('sweep', 'cross', 'tempo'))!;
  const crossAffliction = tree.options.find((o) => o.id === abilityNodeId('sweep', 'cross', 'affliction'))!;
  const withTempo: AbilityNodeProgress = { owned: [SWEEP_TEMPO], active: { packet: SWEEP_TEMPO } };
  assert(
    !checkUnlockAbilityNode({ option: crossAffliction, progress: { owned: [], active: {} }, wallet: richWallet('sweep') }).ok,
    'a cross needs a packet node first',
  );
  assert(
    !checkUnlockAbilityNode({ option: crossTempo, progress: withTempo, wallet: richWallet('sweep') }).ok,
    "a cross never borrows the packet's own route",
  );
  const ok = checkUnlockAbilityNode({ option: crossAffliction, progress: withTempo, wallet: richWallet('sweep') });
  assert(ok.ok, `a cross on another lane is for sale, got ${ok.reason}`);

  // Resolution: the cross rides only off another lane.
  const firing = resolveAbilityNodeFiring('sweep', {
    owned: [SWEEP_TEMPO, crossAffliction.id], active: { packet: SWEEP_TEMPO, cross: crossAffliction.id },
  })!;
  assert(firing.cross?.option.id === crossAffliction.id, 'an active cross on another lane is in the firing');
  const inert = resolveAbilityNodeFiring('sweep', {
    owned: [SWEEP_TEMPO, crossTempo.id], active: { packet: SWEEP_TEMPO, cross: crossTempo.id },
  })!;
  assert(inert.cross === undefined, "a cross on the packet's own lane is inert, never the same payoff twice");

  // Live: one landing, two applications — the packet's and the cross's — one card-fx each.
  const player = spawn('an-cross', {
    knownAbilities: ['sweep'],
    abilityNodes: { sweep: { owned: [SWEEP_TEMPO, crossAffliction.id], active: { packet: SWEEP_TEMPO, cross: crossAffliction.id } } },
  });
  const target = monster(2400);
  armTechnique(world, player, 'sweep');
  hit(player, target);
  const fired = cardFx().map((e) => e.fx).sort();
  assert(
    fired.join() === 'affliction.bleed-pips,tempo.ghost-strike',
    `packet and cross each draw once, got ${fired.join()}`,
  );

  // A Guard casts its cross too.
  const braceTree = ABILITY_NODE_DATABASE.get('brace')!;
  const braceCross = braceTree.options.find((o) => o.id === abilityNodeId('brace', 'cross', 'bulwark'))!;
  const guard = spawn('an-cross-guard', {
    knownAbilities: ['brace'],
    abilityNodes: { brace: { owned: [BRACE_WARD, braceCross.id], active: { packet: BRACE_WARD, cross: braceCross.id } } },
  });
  onGuardFired(world, guard, ABILITY_DATABASE.get('brace')!);
  const guarded = cardFx().map((e) => e.fx).sort();
  assert(
    guarded.join() === 'barrier-tempo.ward-shell,bulwark.plating-chip',
    `a Guard's packet and cross each draw once, got ${guarded.join()}`,
  );
}

// ─── W1-B · The amplifier is a free choice of axis on the active route (§22.10) ─

{
  const problems: string[] = [];
  for (const [abilityId, tree] of ABILITY_NODE_DATABASE) {
    const ability = ABILITY_DATABASE.get(abilityId)!;
    const windsUp = ability.shape === 'cast' || ability.shape === 'charge';
    for (const packet of tree.options.filter((o) => o.row === 'packet')) {
      const amps = tree.options.filter((o) => o.row === 'amplifier' && o.modifies === packet.id);
      const axes = nodePayoffAxes(packet.payoff, ability.shape);
      if (amps.map((o) => o.amplifies).join() !== axes.join()) {
        problems.push(`${packet.id}: amplifier axes ${amps.map((o) => o.amplifies).join()}, want ${axes.join()}`);
      }
      // The payoff's natural axis is the default — first, and on the bare id an old
      // save's amplifier already names.
      if (amps[0]?.amplifies !== nodePayoffAxis(packet.payoff)) problems.push(`${packet.id}: default axis not first`);
      if (amps[0]?.id !== abilityNodeId(abilityId, 'amplifier', packet.lane)) {
        problems.push(`${packet.id}: the default axis lost its original id`);
      }
      if (axes.includes('cast') !== windsUp) problems.push(`${packet.id}: cast axis offered=${axes.includes('cast')} on a ${ability.shape}`);
      const shown = abilityNodeVisibleOptions(tree, 'amplifier', { owned: [packet.id], active: { packet: packet.id } });
      if (shown.length !== amps.length || shown.some((o) => o.modifies !== packet.id)) {
        problems.push(`${packet.id}: the row does not show exactly the active route's axes`);
      }
      // Every offered axis DOES something to the route — no amplifier charges a
      // price and changes nothing.
      const bare = resolveAbilityNodeFiring(abilityId, { owned: [packet.id], active: { packet: packet.id } })!;
      for (const amp of amps) {
        const amped = resolveAbilityNodeFiring(abilityId, {
          owned: [packet.id, amp.id], active: { packet: packet.id, amplifier: amp.id },
        })!;
        const moved = amped.castSpeedPct !== undefined
          || amped.payoff.magnitude !== bare.payoff.magnitude
          || amped.payoff.durationMs !== bare.payoff.durationMs
          || (amped.payoff.extraTargets ?? 0) !== (bare.payoff.extraTargets ?? 0);
        if (!moved || amped.amplifier?.id !== amp.id) problems.push(`${amp.id}: the ${amp.amplifies} axis moves nothing`);
      }
    }
  }
  assert(problems.length === 0, `amplifier axis problems:\n  ${problems.join('\n  ')}`);

  // An old save's amplifier: the bare id survives hydration untouched and is still
  // the default axis — so it does exactly what it did before the axis was free.
  const old = normalizeAbilityNodeProgressMap({
    sweep: { owned: [SWEEP_TEMPO, SWEEP_TEMPO_AMP], active: { packet: SWEEP_TEMPO, amplifier: SWEEP_TEMPO_AMP } },
  });
  assert(old.sweep!.active.amplifier === 'sweep.amplifier.tempo', 'an old amplifier id hydrates unchanged');
  assert(
    resolveAbilityNodeFiring('sweep', old.sweep!)!.amplifier?.amplifies === 'targets',
    "an old save's amplifier keeps its route's natural axis",
  );

  // A bleed's longer window keeps its tick rate, so "longer" never means "less".
  const SWEEP_AFFLICTION = abilityNodeId('sweep', 'packet', 'affliction');
  const longer = abilityNodeId('sweep', 'amplifier', 'affliction', 'duration');
  const bleed = resolveAbilityNodeFiring('sweep', { owned: [SWEEP_AFFLICTION], active: { packet: SWEEP_AFFLICTION } })!;
  const held = resolveAbilityNodeFiring('sweep', {
    owned: [SWEEP_AFFLICTION, longer], active: { packet: SWEEP_AFFLICTION, amplifier: longer },
  })!;
  assert(
    held.payoff.durationMs! > bleed.payoff.durationMs! && held.payoff.magnitude > bleed.payoff.magnitude,
    'a longer bleed owes more over its longer window',
  );
}

// ─── W1-B · The cast axis: never below 40% of the authored wind-up (§22.9) ───

{
  assert(TECHNIQUE_CAST_SPEED_CAP === 0.6, 'the cap every source shares');
  const amplifierPct = abilityNodeCastSpeedPct();
  assert(
    amplifierPct > 0 && amplifierPct < TECHNIQUE_CAST_SPEED_CAP,
    `the axis alone shortens a wind-up without reaching the cap, got ${amplifierPct}`,
  );

  const slam = ABILITY_DATABASE.get('slam')!;
  assert(slam.shape === 'cast', 'the fixture is a cast');
  const tree = ABILITY_NODE_DATABASE.get('slam')!;
  const packet = tree.options.find((o) => o.row === 'packet')!;
  const castAmp = tree.options.find((o) => o.modifies === packet.id && o.amplifies === 'cast')!;
  assert(castAmp !== undefined, 'a cast offers the cast axis on every route');
  const authored = abilityCastMs(slam, 4);
  const floor = Math.round(authored * (1 - TECHNIQUE_CAST_SPEED_CAP));

  // Every combination of the lane's stat (Technique power — it never touches a
  // wind-up), the weapon's cast speed and the amplifier, including absurd ones.
  let index = 0;
  for (const amplified of [false, true]) {
    for (const lanePower of [0, 0.5, 3]) {
      for (const weapon of [0, 0.2, 0.4, 0.6, 2]) {
        const player = spawn(`an-cast-${index++}`, {
          knownAbilities: ['slam'],
          ...(amplified
            ? { abilityNodes: { slam: { owned: [packet.id, castAmp.id], active: { packet: packet.id, amplifier: castAmp.id } } } }
            : {}),
        });
        player.usesSkills.passives['technique.power-pct'] = lanePower;
        player.usesSkills.passives['technique.cast-speed-pct'] = weapon;
        const ms = castWindupFor(player, slam, authored);
        assert(ms >= floor, `power ${lanePower}, weapon ${weapon}, amplifier ${amplified}: ${ms} ms < 40% of ${authored}`);
        assert(
          ms === castWindupMs(authored, weapon, amplified ? amplifierPct : 0),
          'one capped sum of every source',
        );
        if (amplified && weapon + amplifierPct < TECHNIQUE_CAST_SPEED_CAP) {
          assert(ms < castWindupMs(authored, weapon), 'below the cap the axis really shortens the wind-up');
        }
      }
    }
  }

  // And the lifecycle winds up for exactly that long.
  const caster = spawn('an-cast-live', {
    knownAbilities: ['slam'],
    abilityNodes: { slam: { owned: [packet.id, castAmp.id], active: { packet: packet.id, amplifier: castAmp.id } } },
  });
  caster.usesSkills.passives['technique.cast-speed-pct'] = 0.2;
  monster(430);
  assert(beginAbilityCast(world, caster, slam, 1_000), 'the Slam cast begins');
  assert(
    caster.isCastingAbility?.castMs === castWindupMs(authored, 0.2, amplifierPct),
    `the live wind-up reads the same sum, got ${caster.isCastingAbility?.castMs}`,
  );
}

// ─── W1-B · Kill chain fires on the kill its hit makes, not on landing (§22.10) ─

{
  const CHARGE_KILL_CHAIN = abilityNodeId('charge', 'packet', 'kill-chain');
  const charge = ABILITY_DATABASE.get('charge')!;
  assert(
    ABILITY_NODE_DATABASE.get('charge')!.options.some((o) => o.id === CHARGE_KILL_CHAIN),
    'Charge offers a Kill chain route today',
  );
  const player = spawn('an-kill-chain', {
    knownAbilities: ['charge'],
    abilityNodes: { charge: { owned: [CHARGE_KILL_CHAIN], active: { packet: CHARGE_KILL_CHAIN } } },
  });

  // A landing that does not kill pays nothing.
  const survivor = monster(2600);
  armTechnique(world, player, 'charge');
  hit(player, survivor);
  assert(cardFx().length === 0, 'a Kill chain route pays nothing on a landing');

  // The landing whose exchange kills pays on that exchange's own kill.
  const victim = monster(2700);
  armTechnique(world, player, 'charge');
  const ctx = hit(player, victim);
  assert(cardFx().length === 0, 'not on the landing, even of the hit that will kill');
  victim.hasHealth.hp = 0;
  emitCombatEvent('onKill', ctx, world);
  const paid = cardFx();
  assert(paid.length === 1 && paid[0].fx === 'kill-chain.kill-pulse', `the kill pays once, got ${paid.map((e) => e.fx).join()}`);

  // Some other exchange's kill does not pay it.
  const bystander = monster(2750);
  armTechnique(world, player, 'charge');
  hit(player, bystander);
  const other = monster(2780);
  other.hasHealth.hp = 0;
  emitCombatEvent('onKill', {
    attacker: player, attackerType: 'player', defender: other, defenderType: 'monster',
    damage: 1, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext, world);
  assert(cardFx().length === 0, "another exchange's kill is not this Technique's");

  // No exchange (a cast's payload): a resolution that left its target dead is the kill.
  const dead = monster(2800);
  dead.hasHealth.hp = 0;
  onAbilityNodeTechniqueLanded(world, player, charge, { target: dead });
  assert(cardFx().length === 1, 'a cast that killed pays on the kill');
  onAbilityNodeTechniqueLanded(world, player, charge, { target: monster(2900) });
  assert(cardFx().length === 0, 'a cast that did not kill pays nothing');
}

// ─── W1-B · Names grow with the rows (§22.7, grammar §22.10) ─────────────────

{
  const sweep = ABILITY_DATABASE.get('sweep')!;
  const tier = sweep.tier;
  const SWEEP_AFFLICTION = abilityNodeId('sweep', 'packet', 'affliction');
  const OF_MANY = abilityNodeId('sweep', 'amplifier', 'affliction'); // the bleed's default: a second body
  const WITH_ECHOES = abilityNodeId('sweep', 'cross', 'tempo');
  const name = (progress: AbilityNodeProgress): string =>
    abilityDisplayName(sweep, tier, abilityNodeNameParts('sweep', progress));

  assert(abilityDisplayName(sweep, tier) === 'Sweep I', 'no rows, no change');
  const packetOnly: AbilityNodeProgress = { owned: [SWEEP_AFFLICTION], active: { packet: SWEEP_AFFLICTION } };
  assert(name(packetOnly) === 'Bleeding Sweep I', `the packet's adjective, got ${name(packetOnly)}`);
  const amplified: AbilityNodeProgress = {
    owned: [SWEEP_AFFLICTION, OF_MANY], active: { packet: SWEEP_AFFLICTION, amplifier: OF_MANY },
  };
  assert(name(amplified) === 'Bleeding Sweep of Many I', `the axis's "of X", got ${name(amplified)}`);
  const crossed: AbilityNodeProgress = {
    owned: [SWEEP_AFFLICTION, OF_MANY, WITH_ECHOES],
    active: { packet: SWEEP_AFFLICTION, amplifier: OF_MANY, cross: WITH_ECHOES },
  };
  assert(name(crossed) === 'Bleeding Sweep of Many I, with Echoes', `the cross's "with Y", got ${name(crossed)}`);

  // A word only for a row that does something: a silhouette verb renames nothing,
  // an amplifier on another route and a cross on the packet's own lane lend no word.
  const reap = abilityKeystoneNodeId('sweep', 'reap');
  assert(
    name({ owned: [...crossed.owned, reap], active: { ...crossed.active, keystone: reap } }) === name(crossed),
    'a verb that does nothing yet is not a noun',
  );
  const offRoute = abilityNodeId('sweep', 'amplifier', 'tempo');
  assert(
    name({ owned: [SWEEP_AFFLICTION, offRoute], active: { packet: SWEEP_AFFLICTION, amplifier: offRoute } }) === 'Bleeding Sweep I',
    'an amplifier on another route lends no "of X"',
  );
  const ownLane = abilityNodeId('sweep', 'cross', 'affliction');
  assert(
    name({ owned: [SWEEP_AFFLICTION, ownLane], active: { packet: SWEEP_AFFLICTION, cross: ownLane } }) === 'Bleeding Sweep I',
    "a cross on the packet's own lane lends no \"with Y\"",
  );
  const rows: AbilityNodeRow[] = ['packet', 'amplifier', 'keystone', 'cross'];
  assert(rows.every((row) => ABILITY_NODE_ROWS.includes(row)), 'the four rows');
}

console.log('abilityNodes: ok');
