/**
 * Boss5 QUALIFICATION (functional) — do Block C's two arms actually reach the damage
 * the fight resolves, does Block B genuinely install nothing, and is 139 restored?
 *
 * This spends ZERO fights: no boss wake, no combat loop, no arena watchdog. It
 * installs the real arms through the real install seam, spawns the real bodies
 * through the real spawn path, and fires the real damage entry points.
 *
 * What it must establish, per the work order:
 *
 *   1. BLOCK C — BOTH arms are treated, and each one's ABSOLUTE attack reaches the
 *      spawned body, the ordinary hit AND the attack-derived pattern hit. This is
 *      the structural difference from Boss4, where one arm ran bare: here 104 is the
 *      Boss4 candidate rather than authored source, so an arm that failed to install
 *      would silently run the authored 139 and be recorded as a treated observation.
 *   2. THE EFFECT SIZE IS MEASURED, NOT DERIVED. 85 is about 18.3% below 104 in
 *      AUTHORED terms. What actually lands falls by a different, non-uniform amount,
 *      because plating subtracts before the scaling. The packet is forbidden from
 *      stating the authored cut as the effect size, so this measures the real one.
 *   3. BLOCK B INSTALLS NOTHING, and a breadth boss resolves its AUTHORED values —
 *      the negative control that a leaked Block C install would fail.
 *   4. RESTORATION — after every install, including one that threw, 139 is back.
 *   5. ISOLATION — installing a Cave arm does not touch any breadth boss.
 *
 * MUTATION-CHECKED. Each claim is paired with a negative control that fails on the
 * cheap wrong implementation: an arm that wrote a definition the fight never reads
 * fails the body/gross assertions; a restore that never ran fails the next install's
 * own live re-read; and a Block B cell that somehow installed something fails against
 * the authored readback.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/boss5Pressure.test.ts
 */
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { createBalanceWorld } from '../bench/balance/worldFactory';
import { setupArena, BOT_SPAWN } from '../bench/balance/arena';
import { createMonster } from '../src/systems/world/spawning/index';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { prepareSurveyBot } from '../bench/balance/ttkSurveySpec';
import { runMonsterAttack } from '../src/systems/combat/engine/combat';
import {
  BOSS5_BLOCKS_DEF, BOSS5_CAVE_ARMS, BOSS5_CAVE_AUTHORED_ATTACK, BOSS5_CAVE_BOSS_ID,
  BOSS5_CAVE_FIXED, BOSS5_ROSTER, assertBoss5Definitions, boss5CaveArmCells,
  installBoss5Treatment,
} from '../bench/balance/boss5Spec';
import type { Night5Cell } from '../bench/balance/night5Spec';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

initCombatSystems();
assertBoss5Definitions();

const ROOTS = ['striker', 'squire', 'apprentice', 'slinger', 'conduit', 'spirit'] as const;
const caveAttack = () => MONSTER_DATABASE.get(BOSS5_CAVE_BOSS_ID)!.stats.attack;

/** This arm's cell for one root, named by arm rather than by index. */
function caveCell(armName: string, root: string): Night5Cell {
  const cell = boss5CaveArmCells(armName).find((c) => c.className === root);
  assert(!!cell, `cave-refinement/${armName}: no cell for root ${root}`);
  return cell;
}

/**
 * Run `body` with this cell's arm installed through the real seam, and restore
 * afterwards — the same `finally` contract `bossScreen.ts` uses, so a fixture that
 * throws cannot leave an arm standing for the assertions after it.
 */
function underArm<T>(cell: Night5Cell, body: () => T): T {
  const installed = installBoss5Treatment(cell);
  try {
    return body();
  } finally {
    installed.restore();
  }
}

// ═══ 1-2. BLOCK C — the ordinary hit, the pattern hit, and the MEASURED fall ══════

/**
 * Spawn the Dreadbore through the real spawn path and resolve one hit against a real
 * reference bot.
 *
 * `multiplier` is the pattern's: 1.0 for an ordinary swing, 1.6 for the authored
 * `dreadbore-emergence` value that `resolvePatternCircle` passes down. Both go
 * through `runMonsterAttack`, the same entry the live fight uses, so nothing here
 * bypasses plating, DR, stance layers or barrier.
 *
 * `grossDamage` IS the body's attack, which makes it the direct proof that the
 * installed field reached the hit. `landed` is what actually arrived (HP plus barrier
 * absorption), which is what an effect size has to be read from — and the two fall by
 * different percentages.
 *
 * NOTE, because Boss4's report got this wrong: `grossDamage` reads the body's BASE
 * attack on both paths. It does NOT scale with the pattern multiplier, so the absence
 * of a 1.6x-sized `grossDamage` in a fight log is not evidence the pattern never
 * landed. The assertions below pin exactly that, so the Boss5 report cannot repeat
 * the inference.
 */
function caveHit(armName: string, root: string, multiplier: number) {
  return underArm(caveCell(armName, root), () => {
    const world = createBalanceWorld();
    setupArena(world, { nodeId: 'node-t2-cave-dungeon', biomeGroup: 'cave', contentTier: 2, isDungeon: true });
    const { bot } = prepareSurveyBot(world, caveCell(armName, root), BOT_SPAWN);
    const boss = createMonster(world, 'node-t2-cave-dungeon', BOSS5_CAVE_BOSS_ID,
      { x: BOT_SPAWN.x + 40, y: BOT_SPAWN.y })!;
    world.worldLogJournal = [];
    // `uninterruptible` so the probe measures the hit rather than a stun race.
    const outcome = runMonsterAttack(world, boss, bot, Date.now(), multiplier, undefined, undefined, true, 'boss5-probe');
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
  const [hi, lo] = BOSS5_CAVE_ARMS;
  const rows: string[] = [];
  /** The authored step, stated once so the measured fall can be compared to it. */
  const authoredFall = 100 * (1 - lo!.attack / hi!.attack);

  for (const root of ROOTS) {
    const a1 = caveHit(hi!.name, root, 1), b1 = caveHit(lo!.name, root, 1);
    const a2 = caveHit(hi!.name, root, 1.6), b2 = caveHit(lo!.name, root, 1.6);

    // BOTH arms install. Neither body may carry the authored 139 — the failure mode
    // unique to this block, where a missed install looks like a valid observation.
    assert(a1.entityAttack === hi!.attack,
      `cave/${root} ${hi!.name}: the spawned body carries attack ${a1.entityAttack}, expected ${hi!.attack}`);
    assert(b1.entityAttack === lo!.attack,
      `cave/${root} ${lo!.name}: the spawned body carries attack ${b1.entityAttack}, expected ${lo!.attack}`);
    assert(a1.entityAttack !== BOSS5_CAVE_AUTHORED_ATTACK && b1.entityAttack !== BOSS5_CAVE_AUTHORED_ATTACK,
      `cave/${root}: an arm ran at the AUTHORED ${BOSS5_CAVE_AUTHORED_ATTACK}; this block repeats no baseline`);

    // The installed value is the gross damage of BOTH the ordinary and the pattern
    // hit — and the pattern hit's gross is the BASE attack, not 1.6x of it.
    for (const [label, r, expected] of [
      ['ordinary 104', a1, hi!.attack], ['ordinary 85', b1, lo!.attack],
      ['pattern 104', a2, hi!.attack], ['pattern 85', b2, lo!.attack],
    ] as const) {
      assert(r.gross === expected,
        `cave/${root} ${label}: gross damage is ${r.gross}, expected the body's attack ${expected}`);
    }
    assert(a2.gross === a1.gross && b2.gross === b1.gross,
      `cave/${root}: grossDamage moved with the pattern multiplier — the Boss4 report's `
      + 'inference about an unobserved 1.6x gross would become valid and this note must be revised');

    // Plating is a CONTROL field: identical across arms, or the fall below would be a
    // mitigation change rather than a pressure change.
    assert(a1.plating === b1.plating,
      `cave/${root}: the player's plating moved between arms (${a1.plating} / ${b1.plating})`);
    // Strictly less lands on the lower arm, on both paths.
    assert(b1.landed < a1.landed,
      `cave/${root}: the ordinary hit landed ${b1.landed} against ${a1.landed} — 85 did not reduce it`);
    assert(b2.landed < a2.landed,
      `cave/${root}: the pattern hit landed ${b2.landed} against ${a2.landed} — 85 did not reduce it`);
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
    // THE MEASUREMENT THE PACKET MUST NOT ASSUME. The authored step is ~18.3%; the
    // post-mitigation fall is LARGER, because plating subtracts before the scaling.
    // Asserted as an inequality against the computed authored step rather than a
    // literal, so a retune of player plating changes the printed numbers without
    // turning this into a stale-literal failure.
    assert(postFall > authoredFall,
      `cave/${root}: post-mitigation fell only ${postFall.toFixed(1)}%, at or below the authored `
      + `${authoredFall.toFixed(1)}% — the packet's reasoning about plating ordering no longer holds `
      + 'and must be re-derived');
  }
  console.log(
    `  cave: attack ${hi!.attack} -> ${lo!.attack} (authored -${authoredFall.toFixed(1)}%) reaches the body, `
    + 'the ordinary hit and the 1.6x pattern hit; BOTH arms treated',
  );
  for (const row of rows) console.log(row);
}

// ═══ 3. BLOCK B — installs nothing, and resolves AUTHORED values ══════════════════

{
  let checked = 0;
  for (const block of BOSS5_BLOCKS_DEF.filter((b) => b.kind === 'breadth')) {
    const boss = BOSS5_ROSTER.find((b) => b.bossId === block.bossId)!;
    for (const cell of block.cells) {
      const installed = installBoss5Treatment(cell);
      try {
        assert(installed.changes.length === 0,
          `${cell.id}: a breadth observation recorded ${JSON.stringify(installed.changes)}`);
        // The negative control: with this cell "installed", the boss it fights still
        // carries its authored values, and the Cave boss is untouched.
        const m = MONSTER_DATABASE.get(block.bossId)!;
        assert(m.stats.attack === boss.stats.attack && m.stats.hp === boss.stats.hp,
          `${cell.id}: the breadth boss's authored stats moved under a no-op install`);
        assert(caveAttack() === BOSS5_CAVE_AUTHORED_ATTACK,
          `${cell.id}: the Cave boss moved to ${caveAttack()} during a breadth install`);
      } finally {
        installed.restore();
      }
      checked++;
    }
  }
  assert(checked === 108, `expected 108 breadth cells, checked ${checked}`);
  console.log(`  breadth: ${checked} cells install nothing and resolve authored source`);
}

// ═══ 4-5. RESTORATION and ISOLATION ══════════════════════════════════════════════

{
  assert(caveAttack() === BOSS5_CAVE_AUTHORED_ATTACK,
    `the fixtures above did not restore: attack is ${caveAttack()}`);

  // An arm install that THREW must still restore — the contract `bossScreen.ts`
  // relies on, since a treated observation that failed must not poison the next cell.
  for (const arm of BOSS5_CAVE_ARMS) {
    const installed = installBoss5Treatment(caveCell(arm.name, 'striker'));
    try {
      throw new Error('simulated observation failure');
    } catch {
      // swallowed on purpose: what is under test is the `finally` below
    } finally {
      installed.restore();
    }
  }
  assert(caveAttack() === BOSS5_CAVE_AUTHORED_ATTACK, 'an arm install that threw did not restore');

  // 104 -> 85 -> 104, the order the run drives cells in. The install seam re-reads
  // the live value and refuses a drifted one, so a missed restore fails LOUDLY on the
  // next arm rather than being recorded as a clean observation. That refusal is the
  // check; running the sequence is how it is exercised.
  for (const armName of [BOSS5_CAVE_ARMS[0]!.name, BOSS5_CAVE_ARMS[1]!.name, BOSS5_CAVE_ARMS[0]!.name]) {
    const arm = BOSS5_CAVE_ARMS.find((a) => a.name === armName)!;
    const installed = installBoss5Treatment(caveCell(armName, 'squire'));
    assert(caveAttack() === arm.attack,
      `cave-refinement/${armName}: the live attack is ${caveAttack()}, expected ${arm.attack} in sequence`);
    installed.restore();
  }
  assert(caveAttack() === BOSS5_CAVE_AUTHORED_ATTACK, 'the 104/85/104 sequence did not restore');

  // CROSS-BOSS ISOLATION. The blocks run in separate child processes, so this can
  // never bite in the cohort — but a shared-process fixture or a future reuse of the
  // seam would, and an arm that reached a breadth boss would be a silent second
  // change to a block that declares itself untreated.
  for (const arm of BOSS5_CAVE_ARMS) {
    const installed = installBoss5Treatment(caveCell(arm.name, 'spirit'));
    try {
      for (const b of BOSS5_ROSTER) {
        const m = MONSTER_DATABASE.get(b.bossId)!;
        assert(m.stats.attack === b.stats.attack,
          `installing ${arm.name} moved ${b.bossId}'s attack to ${m.stats.attack}`);
        assert(m.stats.hp === b.stats.hp, `installing ${arm.name} moved ${b.bossId}'s HP`);
      }
      // And the treated boss's OWN other fields stay put.
      const dread = MONSTER_DATABASE.get(BOSS5_CAVE_BOSS_ID)!;
      assert(dread.stats.hp === BOSS5_CAVE_FIXED.hp, `${arm.name}: the arm moved boss HP`);
      assert(dread.stats.plating === BOSS5_CAVE_FIXED.plating, `${arm.name}: the arm moved boss plating`);
      assert(dread.stats.damageReduction === BOSS5_CAVE_FIXED.damageReduction, `${arm.name}: the arm moved boss DR`);
      assert(dread.bossPattern!.damageMultiplier === BOSS5_CAVE_FIXED.patternMultiplier,
        `${arm.name}: the arm moved the pattern multiplier`);
    } finally {
      installed.restore();
    }
  }
  assert(caveAttack() === BOSS5_CAVE_AUTHORED_ATTACK, 'the isolation checks did not restore');
  console.log('  restoration: exception path, 104/85/104 sequence, and cross-boss isolation all clean');
}

// Everything the screen promises to hold fixed, re-checked after every install this
// file performed. A fixture that left an arm standing would poison the next file the
// runner picks up.
assertBoss5Definitions();

console.log('boss5Pressure: ok');
