/**
 * Boss4 QUALIFICATION — do the two candidates actually reach the damage the fight
 * resolves, do they leave the control fields alone, and are they restored?
 *
 * This is the functional half of freezing the Boss4 packet, and it exists because the
 * alternative is spending 24 fights to discover that a candidate moved a displayed
 * definition and nothing the simulation read. It spends ZERO fights: no boss wake, no
 * combat loop, no arena watchdog. It installs the real candidate through the real
 * install seam, spawns the real body through the real spawn path, and fires the real
 * damage entry points.
 *
 * What it must establish, per the handoff:
 *
 *   1. SWAMP — RETIRED. The candidate was adopted into source on 2026-09-19, so
 *      there is no live `before` left to compare against and installing the `after`
 *      would apply it twice. What is checked here now is that the install seam
 *      REFUSES the block on both arms; the adopted coefficient's own functional
 *      regression lives in `server/test/behemothVenom.test.ts`.
 *   2. CAVE — the treated `stats.attack` reaches the spawned body, the ordinary hit
 *      AND the attack-derived pattern hit; and the fall in landed damage is MEASURED
 *      rather than assumed to equal the 25.2% authored cut. It does not: plating
 *      subtracts before the scaling, so the measured fall is larger. That is exactly
 *      the assumption the packet is forbidden from making.
 *   3. RESTORATION — after every install, including one that threw, the authored value
 *      is back; a control arm run after a candidate arm sees the authored value.
 *   4. ISOLATION — installing one block's candidate does not touch the other boss.
 *
 * MUTATION-CHECKED. Each claim is paired with a negative control that fails on the
 * cheap wrong implementation: a control arm must resolve the AUTHORED damage (so an
 * install that leaked, or a restore that never ran, fails here rather than in the
 * cohort), and the treated damage must differ from it (so an install that wrote a
 * definition the fight never reads fails here too). The retired Swamp section keeps
 * that discipline in its own form: an installer that quietly stopped refusing an
 * adopted block fails it.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss4Pressure.test.ts
 */
import {
  MONSTER_DATABASE, getStatusEffect, resolveMonsterDotDebuff,
} from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, BOT_SPAWN } from '../bench/balance/arena';
import { createMonster } from '../src/systems/world/spawning/index';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import { applyMonsterDotToPlayer } from '../src/systems/combat/status/monsterDot';
import { effectiveMonsterDot } from '../src/systems/combat/engine/monsterMechanics';
import {
  BOSS4_BLOCKS_DEF, assertBoss4Definitions, boss4ArmCells, boss4ExpectedLive,
  installBoss4Treatment,
} from '../bench/balance/boss4Spec';
import type { Night5Cell } from '../bench/balance/night5Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

initCombatSystems();
assertBoss4Definitions();

const SWAMP = BOSS4_BLOCKS_DEF.find((b) => b.name === 'swamp-pressure')!;
const CAVE = BOSS4_BLOCKS_DEF.find((b) => b.name === 'cave-pressure')!;
const ROOTS = ['striker', 'squire', 'apprentice', 'slinger', 'conduit', 'spirit'] as const;

/** A block's cell for one root on one arm, named by arm rather than by index. */
function cellFor(block: typeof SWAMP, armName: string, root: string): Night5Cell {
  const cell = boss4ArmCells(block.name, armName).find((c) => c.className === root);
  assert(!!cell, `${block.name}/${armName}: no cell for root ${root}`);
  return cell;
}

/**
 * Run `body` with this cell's candidate installed through the real seam, and restore
 * afterwards — the same `finally` contract `bossScreen.ts` uses, so a fixture that
 * throws cannot leave a candidate standing for the assertions after it.
 */
function underArm<T>(block: typeof SWAMP, armName: string, root: string, body: (cell: Night5Cell) => T): T {
  const cell = cellFor(block, armName, root);
  const installed = installBoss4Treatment(cell);
  try {
    return body(cell);
  } finally {
    installed.restore();
  }
}

// === 1. SWAMP - RETIRED: the candidate is authored source now ======================

/**
 * The swamp candidate was ADOPTED on 2026-09-19, so the comparison this section used
 * to make no longer exists: there is no live `before` to measure a control against,
 * and installing the `after` would write a value that is already standing.
 *
 * What replaces it is the guard that makes double application impossible, checked
 * rather than claimed. The venom's own functional regression - that the adopted
 * coefficient reaches the applied payload and a real tick of the real DoT system -
 * moved to `server/test/behemothVenom.test.ts` and is NOT duplicated here.
 */
{
  assert(!!SWAMP.adopted,
    'the swamp block is no longer marked adopted, but its candidate is authored source');
  assert(boss4ExpectedLive(SWAMP) === SWAMP.candidate.after,
    `swamp: an adopted block must expect its candidate's after (${SWAMP.candidate.after}) to be live`);
  assert(MONSTER_DATABASE.get(SWAMP.bossId)!.dotEffect!.damagePerStack === SWAMP.candidate.after,
    'swamp: the authored venom coefficient is not the adopted value');

  // BOTH arms are refused. A control arm is not "harmless" here: it would assert the
  // authored value equals a `before` that no longer exists, and a run that somehow
  // got past that would be measuring the adopted boss while labelling it a baseline.
  for (const arm of SWAMP.arms) {
    let refused = false;
    try {
      installBoss4Treatment(cellFor(SWAMP, arm.name, 'striker'));
    } catch {
      refused = true;
    }
    assert(refused,
      `swamp/${arm.name}: the installer accepted an ADOPTED block - the change can be applied twice`);
  }
  console.log(
    `  swamp: RETIRED - venom ${SWAMP.candidate.before} -> ${SWAMP.candidate.after}/stack is authored `
    + 'source; both arms refused by the install seam (regression: behemothVenom.test.ts)',
  );
}


// ═══ 2. CAVE — the ordinary hit and the attack-derived pattern hit ═════════════════

/**
 * Spawn the Dreadbore through the real spawn path and resolve one hit against a real
 * reference bot.
 *
 * `multiplier` is the pattern's: 1.0 for an ordinary swing, 1.6 for the authored
 * `dreadbore-emergence` value that `resolvePatternCircle` passes down. Both go through
 * `runMonsterAttack`, the same entry the live fight uses, so nothing here bypasses
 * plating, DR, stance layers or barrier.
 *
 * `grossDamage` is read out of the recorded mitigation breakdown: it IS the body's
 * attack, which makes it the direct proof that the treated field reached the hit.
 * `landed` is what actually arrived (HP plus barrier absorption), which is what the
 * effect size has to be read from — and the two fall by different percentages.
 */
function caveHit(armName: string, root: string, multiplier: number) {
  return underArm(CAVE, armName, root, (cell) => {
    const world = createBalanceWorld();
    setupArena(world, { nodeId: cell.nodeId, biomeGroup: CAVE.role, contentTier: 2, isDungeon: true });
    const { bot } = prepareSurveyBot(world, cell, BOT_SPAWN);
    const boss = createMonster(world, cell.nodeId, CAVE.bossId, { x: BOT_SPAWN.x + 40, y: BOT_SPAWN.y })!;
    world.worldLogJournal = [];
    // `uninterruptible` so the probe measures the hit rather than a stun race.
    const outcome = runMonsterAttack(world, boss, bot, Date.now(), multiplier, undefined, undefined, true, 'boss4-probe');
    const event = (world.worldLogJournal as {
      kind?: string; target?: { id?: string }; hpDamage?: number; absorbed?: number;
      mitigation?: { grossDamage: number; mitigatedTotal: number; platingBlocked: number };
    }[]).find((e) => e.kind === 'damage' && e.target?.id === bot.isPlayer.id);
    assert(!!event?.mitigation, `cave/${root}: the probe resolved no damage event (outcome ${outcome})`);
    return {
      entityAttack: boss.dealsDamage.attack,
      gross: event.mitigation.grossDamage,
      plating: event.mitigation.platingBlocked,
      postMitigation: +(event.mitigation.grossDamage - event.mitigation.mitigatedTotal).toFixed(2),
      landed: (event.hpDamage ?? 0) + (event.absorbed ?? 0),
    };
  });
}

{
  const [control, treated] = CAVE.arms;
  const rows: string[] = [];
  for (const root of ROOTS) {
    const a1 = caveHit(control!.name, root, 1), b1 = caveHit(treated!.name, root, 1);
    const a2 = caveHit(control!.name, root, 1.6), b2 = caveHit(treated!.name, root, 1.6);

    // The treated field reaches the SPAWNED BODY, which is where every pattern hit
    // reads it from. A write that landed after the spawn would fail here.
    assert(a1.entityAttack === CAVE.candidate.before,
      `cave/${root} control: the spawned body carries attack ${a1.entityAttack}, expected ${CAVE.candidate.before}`);
    assert(b1.entityAttack === CAVE.candidate.after,
      `cave/${root} candidate: the spawned body carries attack ${b1.entityAttack}, expected ${CAVE.candidate.after}`);
    // ...and it is the gross damage of both the ordinary hit and the pattern hit.
    for (const [label, r, expected] of [
      ['ordinary control', a1, CAVE.candidate.before], ['ordinary candidate', b1, CAVE.candidate.after],
      ['pattern control', a2, CAVE.candidate.before], ['pattern candidate', b2, CAVE.candidate.after],
    ] as const) {
      assert(r.gross === expected,
        `cave/${root} ${label}: gross damage is ${r.gross}, expected the body's attack ${expected}`);
    }
    // Plating is a CONTROL field here: it must be identical across arms, or the fall
    // below would be a mitigation change rather than a pressure change.
    assert(a1.plating === b1.plating,
      `cave/${root}: the player's plating moved between arms (${a1.plating} / ${b1.plating})`);
    // Strictly less damage lands, on both the ordinary and the pattern path.
    assert(b1.landed < a1.landed,
      `cave/${root}: the ordinary hit landed ${b1.landed} against ${a1.landed} — the candidate did not reduce it`);
    assert(b2.landed < a2.landed,
      `cave/${root}: the pattern hit landed ${b2.landed} against ${a2.landed} — the candidate did not reduce it`);
    // The pattern multiplier itself is untouched: a bigger hit is still bigger.
    assert(a2.landed > a1.landed && b2.landed > b1.landed,
      `cave/${root}: the 1.6x pattern path no longer exceeds the ordinary one`);

    const postFall = 100 * (1 - b1.postMitigation / a1.postMitigation);
    const landedFall = 100 * (1 - b1.landed / a1.landed);
    rows.push(
      `    ${root.padEnd(11)} post-mitigation ${a1.postMitigation} -> ${b1.postMitigation} (-${postFall.toFixed(1)}%)`
      + `  landed x1 ${a1.landed} -> ${b1.landed} (-${landedFall.toFixed(1)}%)`
      + `  landed x1.6 ${a2.landed} -> ${b2.landed}`,
    );
    // THE MEASUREMENT THE PACKET MUST NOT ASSUME. The authored cut is 25.2%; the
    // post-mitigation fall is LARGER, because plating subtracts before the scaling.
    // Asserted as an inequality, not a literal, so a retune of player plating changes
    // the printed numbers without turning this into a stale-literal failure.
    assert(postFall > 25.2,
      `cave/${root}: post-mitigation fell only ${postFall.toFixed(1)}%, at or below the authored 25.2% — `
      + 'the packet\'s reasoning about plating ordering no longer holds and must be re-derived');
  }
  console.log('  cave: attack 139 -> 104 reaches the body, the ordinary hit and the 1.6x pattern hit');
  for (const row of rows) console.log(row);
}

// ═══ 3. RESTORATION, including on the exception path ══════════════════════════════

{
  const authored = () => ({
    venom: MONSTER_DATABASE.get(SWAMP.bossId)!.dotEffect!.damagePerStack,
    attack: MONSTER_DATABASE.get(CAVE.bossId)!.stats.attack,
  });
  const start = authored();
  assert(start.venom === boss4ExpectedLive(SWAMP) && start.attack === boss4ExpectedLive(CAVE),
    `the fixtures above did not restore: ${JSON.stringify(start)}`);

  /**
   * The blocks a treatment can still be installed for.
   *
   * An adopted block is excluded rather than special-cased inside each loop: its
   * installer refuses by design (checked in section 1), so driving it through the
   * restore contract would only be testing the refusal a second time. Written as a
   * filter so a future adoption drops out of these loops automatically.
   */
  const installable = [SWAMP, CAVE].filter((b) => !b.adopted);
  assert(installable.length > 0, 'every Boss4 block is adopted; this file has nothing left to install');

  // A candidate install that THREW must still restore — the contract `bossScreen.ts`
  // relies on, since a treated observation that failed must not poison the next cell.
  for (const block of installable) {
    const treatedArm = block.arms.find((a) => a.treated)!;
    const installed = installBoss4Treatment(cellFor(block, treatedArm.name, 'striker'));
    try {
      throw new Error('simulated observation failure');
    } catch {
      // swallowed on purpose: what is under test is the `finally` below
    } finally {
      installed.restore();
    }
  }
  assert(JSON.stringify(authored()) === JSON.stringify(start),
    'a candidate install that threw did not restore');

  // CONTROL -> CANDIDATE -> CONTROL, the order the run actually drives cells in. The
  // install seam re-reads the live value and refuses a drifted one, so a missed
  // restore fails LOUDLY on the next control rather than being recorded as a clean
  // baseline. That refusal is the check; running the sequence is how it is exercised.
  for (const block of installable) {
    const [control, treated] = block.arms;
    for (const armName of [control!.name, treated!.name, control!.name]) {
      const installed = installBoss4Treatment(cellFor(block, armName, 'squire'));
      const live = block.candidate.kind === 'attack'
        ? MONSTER_DATABASE.get(block.bossId)!.stats.attack
        : MONSTER_DATABASE.get(block.bossId)!.dotEffect!.damagePerStack;
      const expected = armName === treated!.name ? block.candidate.after : block.candidate.before;
      assert(live === expected,
        `${block.name}/${armName}: the live value is ${live}, expected ${expected} in sequence`);
      installed.restore();
    }
  }
  assert(JSON.stringify(authored()) === JSON.stringify(start),
    'the control/candidate/control sequence did not restore');

  // CROSS-BLOCK ISOLATION. The two blocks run in separate child processes, so this
  // can never bite in the cohort — but a shared-process fixture or a future reuse of
  // the seam would, and a candidate that reached the other boss would be a silent
  // second change.
  for (const [block, other] of ([[SWAMP, CAVE], [CAVE, SWAMP]] as const)
    .filter(([block]) => !block.adopted)) {
    const treatedArm = block.arms.find((a) => a.treated)!;
    const installed = installBoss4Treatment(cellFor(block, treatedArm.name, 'spirit'));
    try {
      const otherDef = MONSTER_DATABASE.get(other.bossId)!;
      const otherLive = other.candidate.kind === 'attack'
        ? otherDef.stats.attack : otherDef.dotEffect!.damagePerStack;
      // Compared against the OTHER block's own expected live value, which is its
      // adopted number if it has one. Comparing against `before` unconditionally
      // would report a clean isolation check as a leak.
      assert(otherLive === boss4ExpectedLive(other),
        `${block.name}: installing this candidate moved ${other.bossId}'s ${other.candidate.kind} to ${otherLive}`);
      // And the treated boss's OWN other fields stay put.
      const def = MONSTER_DATABASE.get(block.bossId)!;
      assert(def.stats.hp === block.bossStats.hp, `${block.name}: the candidate moved boss HP`);
      assert(def.stats.plating === block.bossStats.plating, `${block.name}: the candidate moved boss plating`);
      assert(def.stats.damageReduction === block.bossStats.damageReduction, `${block.name}: the candidate moved boss DR`);
      if (block.candidate.kind !== 'attack') {
        assert(def.stats.attack === block.bossStats.attack, `${block.name}: the candidate moved the ordinary attack`);
      }
    } finally {
      installed.restore();
    }
  }
  assert(JSON.stringify(authored()) === JSON.stringify(start), 'the isolation checks did not restore');
  console.log('  restoration: exception path, control/candidate/control sequence, and cross-block isolation all clean');
}

// Everything the screen promises to hold fixed, re-checked after every install this
// file performed. A fixture that left a candidate standing would poison the next file
// the runner picks up.
assertBoss4Definitions();

console.log('boss4Pressure: ok');
