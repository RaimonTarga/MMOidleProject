import assert from 'node:assert/strict';
import {
  DUNGEON_DEFS, MONSTER_DATABASE, NODE_BIOMES,
  runicPointLoadoutCost,
} from '@mmo-idle/shared';
import { REFERENCE_GUARDS, referencePackageCells } from './boss1Spec';
import { BOSS3_GUARD_IN, BOSS3_GUARD_OUT } from './boss3Spec';
import type { Night5Cell } from './night5Spec';

/**
 * Boss4 -- ONE local enemy-pressure candidate per boss, on the two T2 bosses that
 * beat every portable reference.
 *
 * Boss3 asked whether a defensive SUBSTITUTION rescued them. Swamp responded (0/6 ->
 * 2/6 with Cleanse in place of Brace, and all four remaining deaths later and
 * deeper); Cave did not (0/6 -> 0/6, mixed small shifts either way). Boss4 asks the
 * next bounded question, and it is a question about the BOSSES rather than the
 * players:
 *
 *   Can a deliberate reduction in each boss's relevant damage pressure make the
 *   existing sensible reference more viable, while preserving the fight's duration,
 *   phases and counterplay?
 *
 * WHAT THIS IS NOT. It is not a scalar search (there is exactly one candidate value
 * per boss, chosen before the run and never re-picked), not a build search (the
 * player package is frozen and IDENTICAL in both arms of a block), not a win-rate
 * estimate (one seed, six known cases), and not an adoption. Nothing here writes a
 * balance value into source: the candidate is installed process-locally for the
 * duration of one observation and restored afterwards, including on exception.
 *
 * THE PLAYER PACKAGE IS CARRIED, NOT RE-CHOSEN. Each block reuses the Boss3 arm that
 * is the sensible reference for that matchup:
 *
 *   swamp-pressure carries Boss3's `cleanse-substitution` package -- Cleanse at guard
 *   slot 1 -- because Boss3 measured it as the practical Swamp reference, with two
 *   clears.
 *
 *   cave-pressure carries Boss3's `portable-reference` package -- Brace at guard slot
 *   1 -- because the substitution did NOT solve Cave and the original reference is
 *   what the historical record is against.
 *
 * So a Boss4 control arm is a REPLAY of a specific Boss3 arm on the same seed, and
 * that is the only comparison a control may be read against. Comparing Swamp's
 * candidate to Boss3's *Brace* result would silently fold the guard substitution into
 * the boss-stat effect.
 *
 * ONE FIELD PER BOSS. Each candidate moves exactly one authored number, named below,
 * and every other authored field on both bosses is pinned by
 * `assertBoss4Definitions()` so a silent edit fails qualification rather than
 * producing a two-change experiment that reads as one.
 */

export const BOSS4_CAP_MS = 300000;
export const BOSS4_TIER = 2;
/** The Boss2 seed, carried through Boss3 and reused again so controls replay. */
export const BOSS4_SEED = 98011;

/**
 * Which authored number a block's candidate moves, and how to reach it.
 *
 * The two candidates live on structurally different fields -- a DoT payload nested
 * under `dotEffect`, and a top-level `stats` entry -- so the accessor is declared per
 * kind rather than assumed to be a flat stat write. Read and write go through the
 * same pair of functions, which is what makes "restore" provably the inverse of
 * "install" rather than a second literal that can drift.
 */
export type Boss4CandidateKind = 'dot-damage-per-stack' | 'attack';

export interface Boss4Candidate {
  kind: Boss4CandidateKind;
  /** The authored path, spelled for the receipt and the packet. */
  field: string;
  before: number;
  after: number;
  /** Why this field and not another. Recorded so the choice is auditable. */
  rationale: string;
}

function readCandidate(bossId: string, kind: Boss4CandidateKind): number {
  const def = MONSTER_DATABASE.get(bossId);
  assert(def, `Boss4: ${bossId} is missing from MONSTER_DATABASE`);
  if (kind === 'dot-damage-per-stack') {
    assert(def.dotEffect, `Boss4: ${bossId} authors no dotEffect to treat`);
    return def.dotEffect.damagePerStack;
  }
  return def.stats.attack;
}

function writeCandidate(bossId: string, kind: Boss4CandidateKind, value: number): void {
  const def = MONSTER_DATABASE.get(bossId);
  assert(def, `Boss4: ${bossId} is missing from MONSTER_DATABASE`);
  if (kind === 'dot-damage-per-stack') {
    assert(def.dotEffect, `Boss4: ${bossId} authors no dotEffect to treat`);
    def.dotEffect.damagePerStack = value;
    return;
  }
  def.stats.attack = value;
}

export interface Boss4Arm {
  name: string;
  treatment: string;
  /** Whether this arm installs the block's candidate. Exactly one arm does. */
  treated: boolean;
}

export interface Boss4Block {
  name: string;
  bossId: string;
  nodeId: string;
  role: string;
  seed: number;
  /**
   * The ordered Guard list BOTH arms carry. `undefined` means the Boss1/Boss2/Boss3
   * reference shape (`REFERENCE_GUARDS`), passed through untouched so the cave
   * control cannot drift from the arm it replays.
   */
  guards: readonly string[] | undefined;
  /** The Boss3 arm this block's player package is carried from, named for the report. */
  originArm: 'portable-reference' | 'cleanse-substitution';
  arms: readonly Boss4Arm[];
  candidate: Boss4Candidate;
  /** Pinned authored values that this screen must NOT move. */
  bossStats: { hp: number; attack: number; plating: number; damageReduction: number };
  summonsNothing: boolean;
  patternId: string | null;
}

export const BOSS4_BLOCKS_DEF: Boss4Block[] = [
  {
    name: 'swamp-pressure',
    bossId: 'mire-gorged-behemoth', nodeId: 'node-t2-swamp-dungeon', role: 'swamp',
    seed: BOSS4_SEED,
    // Boss3's substitution arm, byte for byte: Cleanse at index 1, Second Wind at 0.
    guards: ['second-wind', BOSS3_GUARD_IN],
    originArm: 'cleanse-substitution',
    arms: [
      { name: 'current', treatment: 'swamp-current', treated: false },
      { name: 'reduced-venom', treatment: 'swamp-reduced-venom', treated: true },
    ],
    candidate: {
      kind: 'dot-damage-per-stack',
      field: "MONSTER_DATABASE['mire-gorged-behemoth'].dotEffect.damagePerStack",
      before: 9, after: 6,
      rationale:
        'Boss3 measured every baseline death and three of four substitution deaths with Gorged Venom '
        + 'as the terminal channel, and removing venom stacks produced a consistent practical '
        + 'improvement while four references still died. The ordinary Attack field (38) does not reach '
        + 'this separately authored poison coefficient, so lowering it would not target the channel '
        + 'the recordings name. A one-third cut of the coefficient is a deliberate trial value, not a '
        + 'measured optimum and not a claim that poison is the only contributor.',
    },
    bossStats: { hp: 3375, attack: 38, plating: 6, damageReduction: 0.08 },
    summonsNothing: true, patternId: null,
  },
  {
    name: 'cave-pressure',
    bossId: 'chitinous-dreadbore', nodeId: 'node-t2-cave-dungeon', role: 'cave',
    seed: BOSS4_SEED,
    // Boss3's baseline arm. The guard list is OMITTED rather than re-spelled, so it
    // is the reference shape by construction and cannot drift from it.
    guards: undefined,
    originArm: 'portable-reference',
    arms: [
      { name: 'current', treatment: 'cave-current', treated: false },
      { name: 'reduced-attack', treatment: 'cave-reduced-attack', treated: true },
    ],
    candidate: {
      kind: 'attack',
      field: "MONSTER_DATABASE['chitinous-dreadbore'].stats.attack",
      before: 139, after: 104,
      rationale:
        'Both Guards were genuinely exercised on Cave and status removal rescued nothing; the reported '
        + 'failures include single hits worth 40-65% of the player pool. A local direct-damage '
        + 'reduction is the next deliberate numerical lever. 104 = round(139 x 0.75), about 25.2% less '
        + 'authored attack. It does NOT establish that Eruption alone causes the failures, and it is '
        + 'not a claim that landed damage falls by the same percentage -- plating subtracts before the '
        + 'scaling, so the measured fall is larger (see boss4Pressure.test.ts).',
    },
    bossStats: { hp: 4375, attack: 139, plating: 12, damageReduction: 0.12 },
    summonsNothing: true, patternId: 'dreadbore-emergence',
  },
];

/**
 * 2 blocks x 6 roots x 2 arms x 1 seed = 24 fights.
 *
 * Both arms of a block live in the SAME block, as in Boss3: the pair runs back to
 * back on one revision and one seed, so nothing other than the installed candidate
 * can differ between them. The two blocks stay independent of each other, and they
 * run in separate child processes, so a candidate installed for one boss cannot
 * reach the other even if a restore were somehow missed.
 */
export const BOSS4_BLOCKS: Record<string, { cells: Night5Cell[]; durationMs: number; pilotIds: string[] }> =
  Object.fromEntries(BOSS4_BLOCKS_DEF.map((b) => [b.name, {
    cells: b.arms.flatMap((arm) => referencePackageCells({
      nodeId: b.nodeId, role: b.role, bossId: b.bossId,
      idPrefix: `boss4-${b.name}-${arm.name}`,
      treatmentFor: () => arm.treatment,
      guards: b.guards,
    })),
    durationMs: BOSS4_CAP_MS,
    // No pilot. Boss2 and Boss3 have each fought both of these bosses on this runner,
    // at this encounter setup, on these packages. What Boss4 adds is a treatment, and
    // a treatment is proven by fixture and by receipt -- never by an undeclared 25th
    // observation whose result would have nowhere to be reported.
    pilotIds: [],
  }]));

/** The 12 cells of a block, split by arm. Order within an arm is root order. */
export function boss4ArmCells(blockName: string, armName: string): Night5Cell[] {
  const block = BOSS4_BLOCKS[blockName];
  assert(block, `unknown Boss4 block ${blockName}`);
  const def = BOSS4_BLOCKS_DEF.find((b) => b.name === blockName)!;
  const arm = def.arms.find((a) => a.name === armName);
  assert(arm, `unknown Boss4 arm ${armName} on ${blockName}`);
  return block.cells.filter((c) => c.treatment === arm.treatment);
}

export interface Boss4Change {
  bossId: string;
  kind: Boss4CandidateKind;
  field: string;
  before: number;
  after: number;
}

/**
 * Install this cell's candidate, process-locally, and hand back its inverse.
 *
 * THE CONTROL ARM INSTALLS NOTHING AND IS STILL CHECKED. Both arms re-read the live
 * authored value and assert it equals the declared `before` -- so a control that ran
 * after a missed restore, or against an edited source, fails loudly instead of being
 * recorded as a clean baseline. That check is the reason this returns an explicitly
 * EMPTY change list for a control rather than returning early.
 *
 * `restore()` writes the authored value back through the same accessor the install
 * used. The caller must run it in a `finally`, including on exception: a treated
 * observation that threw must not leave a candidate standing for the next cell.
 */
export function installBoss4Treatment(cell: Night5Cell): { changes: Boss4Change[]; restore: () => void } {
  const block = BOSS4_BLOCKS_DEF.find((b) => b.arms.some((a) => a.treatment === cell.treatment));
  assert(block, `Boss4: cell ${cell.id} carries unknown treatment ${cell.treatment}`);
  const arm = block.arms.find((a) => a.treatment === cell.treatment)!;
  const c = block.candidate;

  const live = readCandidate(block.bossId, c.kind);
  assert.equal(live, c.before,
    `Boss4/${block.name}: ${c.field} reads ${live} but the packet froze ${c.before} — either the source `
    + 'moved or a previous observation did not restore; this run is not what the packet describes');

  if (!arm.treated) return { changes: [], restore() { /* a control installs nothing */ } };

  writeCandidate(block.bossId, c.kind, c.after);
  const changes: Boss4Change[] = [{
    bossId: block.bossId, kind: c.kind, field: c.field, before: c.before, after: c.after,
  }];
  return {
    changes,
    restore() { writeCandidate(block.bossId, c.kind, c.before); },
  };
}

/**
 * Everything about a cell, INCLUDING the guard list, as a comparable string.
 *
 * Boss3 blanked the guards here because the guards were its treatment. Boss4's
 * treatment is on the BOSS, so the player package must match completely: the arms of
 * a block are the same twelve-field package twice, and only the cell id and the
 * treatment label may differ. Comparing the guard list rather than excusing it is
 * what makes that a check instead of a claim.
 */
export function boss4CellFingerprint(cell: Night5Cell): string {
  return JSON.stringify({
    nodeId: cell.nodeId, tier: cell.tier, role: cell.role, className: cell.className,
    alternate: cell.alternate, isDungeon: cell.isDungeon, targetTypes: cell.targetTypes,
    stance: cell.stance, upgradeLevel: cell.upgradeLevel,
    runeRules: cell.runeRules, abilities: cell.abilities,
    build: { ...cell.build, id: '<per-arm>' },
  });
}

/**
 * Fail loudly at load time if anything this screen depends on has drifted.
 *
 * Two different jobs, deliberately in one place:
 *
 *   1. the candidate's own field reads its declared `before` value, so the delta the
 *      packet names is the delta that will actually be installed;
 *   2. EVERY OTHER authored field the packet promises to hold fixed is pinned here --
 *      pools, phases, cadence, geometry, stack shapes, the pattern multiplier. A
 *      screen that moved two numbers while claiming one is not a paired comparison,
 *      and this is where that is caught.
 */
export function assertBoss4Definitions(): void {
  assert.equal(BOSS4_BLOCKS_DEF.length, 2, 'Boss4 screens exactly the two Boss3 bosses');

  const t2 = [...DUNGEON_DEFS.values()].filter((d) => d.biomeTier === BOSS4_TIER);
  for (const b of BOSS4_BLOCKS_DEF) {
    assert.equal(b.arms.length, 2, `${b.name}: exactly two arms; no third arm and no scalar grid`);
    assert.equal(b.arms.filter((a) => a.treated).length, 1, `${b.name}: exactly ONE arm installs the candidate`);
    assert.equal(b.seed, BOSS4_SEED, `${b.name}: seed drift — the control must replay its Boss3 arm`);

    const def = t2.find((d) => d.nodeId === b.nodeId);
    assert(def, `no T2 dungeon def for ${b.nodeId}`);
    assert.equal(def.boss.bossId, b.bossId, `${b.name}: dungeon boss drift`);
    assert.equal(NODE_BIOMES[b.nodeId]?.isDungeon, true, `${b.name}: node is not a dungeon`);
    assert.equal(NODE_BIOMES[b.nodeId]?.biomeTier, BOSS4_TIER, `${b.name}: node tier drift`);
    assert.equal(NODE_BIOMES[b.nodeId]?.biomeGroup, b.role, `${b.name}: biome group drift`);

    const m = MONSTER_DATABASE.get(b.bossId);
    assert(m?.isBoss, `${b.bossId} missing or is not a boss`);
    assert.equal(m.stats.hp, b.bossStats.hp, `${b.name}: boss hp must not move`);
    assert.equal(m.stats.plating, b.bossStats.plating, `${b.name}: boss plating must not move`);
    assert.equal(m.stats.damageReduction, b.bossStats.damageReduction, `${b.name}: boss DR must not move`);
    const pattern = (m as { bossPattern?: { id: string } }).bossPattern;
    assert.equal(pattern?.id ?? null, b.patternId, `${b.name}: boss pattern drift`);

    // The candidate's own field, read live through the same accessor the install uses.
    assert.equal(readCandidate(b.bossId, b.candidate.kind), b.candidate.before,
      `${b.name}: ${b.candidate.field} is not the frozen ${b.candidate.before}`);
    assert(b.candidate.after < b.candidate.before,
      `${b.name}: the candidate must REDUCE pressure, got ${b.candidate.before} -> ${b.candidate.after}`);
    assert(b.candidate.after >= 1,
      `${b.name}: the candidate must leave a live mechanic, not delete it`);

    // ── Arm construction: 12 cells, six roots per arm, and the player package
    //    IDENTICAL across arms. The treatment is on the boss; nothing else may move.
    const block = BOSS4_BLOCKS[b.name]!;
    assert.equal(block.cells.length, 12, `${b.name}: 6 roots x 2 arms = 12 cells`);
    assert.equal(block.durationMs, BOSS4_CAP_MS, `${b.name}: cap drift`);
    assert.equal(block.pilotIds.length, 0, `${b.name}: no pilot is authorized`);
    assert.equal(new Set(block.cells.map((c) => c.id)).size, 12, `${b.name}: cell ids must be distinct`);

    const [control, treated] = b.arms;
    const ctl = boss4ArmCells(b.name, control!.name);
    const trt = boss4ArmCells(b.name, treated!.name);
    assert.equal(ctl.length, 6, `${b.name}: six control cells`);
    assert.equal(trt.length, 6, `${b.name}: six candidate cells`);
    const expectedGuards = [...(b.guards ?? REFERENCE_GUARDS)];
    for (let i = 0; i < 6; i++) {
      const a = ctl[i]!, c = trt[i]!;
      assert.equal(a.className, c.className, `${b.name}: arms must pair root-for-root at index ${i}`);
      assert.equal(boss4CellFingerprint(a), boss4CellFingerprint(c),
        `${b.name}/${a.className}: the arms differ in the PLAYER package — Boss4 treats the boss, not the build`);
      assert.deepEqual(a.abilities?.guards, expectedGuards,
        `${b.name}/${a.className}: the carried Guard list is not the Boss3 ${b.originArm} list`);
      // RP is identical by construction here, and asserted rather than assumed: a
      // block whose arms cost different RP would be a second change.
      const rp = (cell: Night5Cell) => runicPointLoadoutCost({
        rules: cell.runeRules as never,
        abilities: cell.abilities!,
        stances: cell.stance ? [cell.stance] : [],
        rites: [],
      });
      assert.equal(rp(a), rp(c), `${b.name}/${a.className}: the arms cost different RP`);
    }
  }

  // ── The carried Guard lists, named against their Boss3 origins. ────────────────
  const swamp = BOSS4_BLOCKS_DEF.find((b) => b.name === 'swamp-pressure')!;
  const cave = BOSS4_BLOCKS_DEF.find((b) => b.name === 'cave-pressure')!;
  assert.deepEqual([...(swamp.guards ?? [])], ['second-wind', BOSS3_GUARD_IN],
    'swamp-pressure must carry the Boss3 cleanse-substitution Guard list, in order');
  assert.equal(cave.guards, undefined,
    'cave-pressure must inherit the reference Guard list rather than re-spell it');
  assert.deepEqual([...REFERENCE_GUARDS], ['second-wind', BOSS3_GUARD_OUT],
    'the reference Guard list has moved; the cave control no longer replays Boss3');

  // ── Everything the Swamp candidate promises to LEAVE ALONE. ────────────────────
  const behemoth = MONSTER_DATABASE.get(swamp.bossId)!;
  const dot = behemoth.dotEffect!;
  assert.equal(dot.debuffId, 'mire-gorged-venom', 'swamp: venom identity drift');
  assert.equal(dot.maxStacks, 4, 'swamp: venom max stacks must not move');
  assert.equal(dot.tickIntervalMs, 1000, 'swamp: venom tick interval must not move');
  assert.equal(dot.durationMs, 8000, 'swamp: venom duration must not move');
  assert.equal(dot.openerStacks, undefined, 'swamp: venom gained an opener; the candidate assumed none');
  assert.equal(behemoth.stats.attack, swamp.bossStats.attack, 'swamp: ordinary attack must not move');
  assert.equal(behemoth.stats.attackCooldown, 2800, 'swamp: attack cadence must not move');
  const pool = behemoth.chargedAttack!;
  assert.equal(pool.multiplier, 1.1, 'swamp: Corrosive Pool multiplier must not move');
  assert.equal(pool.castMs, 1100, 'swamp: Corrosive Pool cast time must not move');
  assert.equal(pool.cooldownMs, 8500, 'swamp: Corrosive Pool cooldown must not move');
  assert.equal(pool.aoe?.radius, 115, 'swamp: Corrosive Pool radius must not move');
  assert.equal(pool.pool?.damagePerTick, 5, 'swamp: pool payload must not move');
  assert.equal(pool.pool?.tickIntervalMs, 1000, 'swamp: pool cadence must not move');
  assert.equal(pool.pool?.slowSpeedMult, 0.60, 'swamp: pool slow must not move');
  assert.equal(pool.pool?.vulnerability?.damageTakenPct, 0.12, 'swamp: pool vulnerability must not move');
  assert.equal(pool.pool?.vulnerability?.durationMs, 1500, 'swamp: pool vulnerability window must not move');
  const swampPhase = behemoth.bossScript!.phases![0]!;
  assert.equal(swampPhase.hpPct, 0.5, 'swamp: the 50% phase must stay where it is');
  assert.equal(JSON.stringify(swampPhase.actions), JSON.stringify([
    { type: 'enrage', atkMult: 1.0, cdMult: 0.70 },
    { type: 'empower-charged', cooldownMult: 0.70, radiusMult: 1.15 },
  ]), 'swamp: the 50% phase actions must not move');

  // ── Everything the Cave candidate promises to LEAVE ALONE. ─────────────────────
  const dreadbore = MONSTER_DATABASE.get(cave.bossId)!;
  assert.equal(dreadbore.stats.attackCooldown, 3600, 'cave: attack cadence must not move');
  assert.equal(dreadbore.appliesPlatingShred?.platingPerStack, 2, 'cave: base plating shred must not move');
  assert.equal(dreadbore.appliesPlatingShred?.maxStacks, 6, 'cave: shred cap must not move');
  assert.equal(dreadbore.dotEffect, undefined, 'cave: the Dreadbore authors no DoT; the candidate assumed none');
  const bp = dreadbore.bossPattern!;
  assert.equal(bp.damageMultiplier, 1.6, 'cave: the pattern multiplier must not move — only attack does');
  assert.equal(bp.cooldownMs, 9000, 'cave: pattern cadence must not move');
  assert.equal(bp.initialCooldownMs, 4000, 'cave: pattern opening delay must not move');
  const conceal = bp.steps.find((s): s is Extract<typeof s, { kind: 'conceal' }> => s.kind === 'conceal')!;
  assert.equal(conceal.durationMs, 3000, 'cave: burrow ceiling must not move');
  assert.equal(conceal.travelSpeed, 380, 'cave: burrow travel speed must not move');
  assert.equal(conceal.contactSlow?.speedMult, 0.5, 'cave: contact slow must not move');
  assert.equal(conceal.contactSlow?.durationMs, 2000, 'cave: contact slow window must not move');
  const impact = bp.steps.find((s): s is Extract<typeof s, { kind: 'impact' }> => s.kind === 'impact')!;
  assert.equal(impact.damageMult, 1.0, 'cave: the Eruption step multiplier must not move');
  assert.equal(impact.radius, 165, 'cave: Eruption radius must not move');
  assert.equal(impact.telegraphMs, 750, 'cave: Eruption tell must not move');
  assert.equal(impact.rawDamage, undefined,
    'cave: Eruption gained a rawDamage override, which would bypass the treated attack entirely');
  const recovery = bp.steps.find((s): s is Extract<typeof s, { kind: 'recovery' }> => s.kind === 'recovery')!;
  assert.equal(recovery.durationMs, 2200, 'cave: recovery window must not move');
  const cavePhase = dreadbore.bossScript!.phases![0]!;
  assert.equal(cavePhase.hpPct, 0.5, 'cave: the 50% phase must stay where it is');
  assert.equal(JSON.stringify(cavePhase.actions), JSON.stringify([
    { type: 'empower-shred', platingPerStackAdd: 1 },
  ]), 'cave: the 50% phase actions must not move');

  // ── The attack field must reach the fight only through the spawn-time stat. ────
  //
  // `dealsDamage.attack` is baked from `stats.attack` when the body is created, and
  // every pattern hit reads it back off the entity. An `engageSequence` or an enrage
  // action would introduce a SECOND path that multiplies a number the candidate has
  // already moved, so their absence is asserted rather than assumed.
  for (const b of BOSS4_BLOCKS_DEF) {
    const m = MONSTER_DATABASE.get(b.bossId)!;
    assert.equal((m as { engageSequence?: unknown }).engageSequence, undefined,
      `${b.name}: an engageSequence would give attack a second, unmeasured path`);
    assert.equal((m as { scalesWithAmbientRamp?: unknown }).scalesWithAmbientRamp, undefined,
      `${b.name}: an ambient ramp would scale the treated attack by node state`);
  }
  assert(!JSON.stringify(dreadbore.bossScript).includes('enrage'),
    'cave: an enrage action would multiply the treated attack mid-fight');

  // ── The declared arithmetic, checked rather than transcribed. ──────────────────
  assert.equal(cave.candidate.after, Math.round(cave.candidate.before * 0.75),
    'cave: the candidate is round(attack x 0.75); the packet states that arithmetic');

  const total = BOSS4_BLOCKS_DEF.reduce((n, b) => n + BOSS4_BLOCKS[b.name]!.cells.length, 0);
  assert.equal(total, 24, `Boss4 is 24 fights, got ${total}`);
}
