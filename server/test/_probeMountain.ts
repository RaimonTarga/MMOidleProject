// Throwaway probe (leading `_` = skipped by the test runner).
//
// Diagnoses the auto-combat wedge documented in
// `docs/next-playtest-implementation-plan.md` §5.8: a player on auto-combat stops
// moving at full HP with live, reachable monsters in the node, and never resumes.
//
// Ticks a real node until the bot has been motionless for 2 simulated minutes,
// then replays `nearestEngageableMonster` step by step for every live monster —
// `canReach`, the approach goal, the route, and whether the route's endpoint is
// actually in attack range — and reports the per-tick cost of the wedged state.
//
// CAUSE 1 (`approachPoint` returning out-of-range destinations off-axis) is FIXED.
// CAUSE 2 is open: target acquisition now SUCCEEDS and the player still does not
// move, so the failure is downstream in `steerTowardTarget` / `requestNavMotion`.
// Start at `autoTarget.ts:496` (the melee / no-keep-distance branch — bench bots
// carry no runes, so the keep-distance and hazard branches are inert).
//
// The wedge is stochastic at roughly 50/50 per run, so this retries. NEVER mix
// evidence across attempts: each is a different world with different geometry.
// Conflating two of them cost a wrong root-cause diagnosis once already.
//
// Usage: pnpm --filter @mmo-idle/server exec tsx --conditions=development \
//          test/_probeMountain.ts [nodeId] [classRoot]

import {
  approachPoint,
  findPathForMover,
  hitboxGap,
  posHitboxFromEntity,
  withinReach,
} from "@mmo-idle/shared";
import { BENCH_DT_MS } from "../bench/harness";
import { createFarmWorld } from "../bench/balance/worldFactory";
import { setupArena, BOT_SPAWN } from "../bench/balance/arena";
import { materializeBot } from "../bench/balance/botFactory";
import { farmTargetForNode } from "../bench/balance/farmTargets";
import { representativeBuildsPerClass } from "../bench/balance/progression";
import { nearestEngageableMonster } from "../src/systems/combat/ai/targetPriority";
import { navigationPadForEntity } from "../src/systems/world/movement";
import { suppressedFeatureIdsForNode } from "../src/systems/world/pathMotion";

const NODE_ID = process.argv[2] ?? "node-t1-mountain-01";
const CLASS_ROOT = process.argv[3] ?? "cadence-root";
const SIM_SECONDS = 3600;
const TIME_SCALE = 2;
/** 2 simulated minutes of no movement — long past any legitimate attack pause. */
const STILL_TICKS = 600;
const ATTEMPTS = 8;

const target = farmTargetForNode(NODE_ID);
const build = representativeBuildsPerClass(target.contentTier, target.biomeGroup, {
  classRoot: CLASS_ROOT,
})[0];

/** Run one world to completion. Returns true if it wedged (and prints why). */
function attempt(): boolean {
  const world = createFarmWorld();
  setupArena(world, target);
  const bot = materializeBot(world, build, target, BOT_SPAWN);

  const dt = BENCH_DT_MS * TIME_SCALE;
  const maxTicks = Math.ceil((SIM_SECONDS * 1000) / dt);

  let now = 0;
  let stuck = 0;
  let last = { ...bot.hasPosition.current };
  // Exponential means of tick cost, split by whether the bot was moving. The
  // wedge is a CPU hazard as well as a progression one, so measure it.
  let msMoving = 0;
  let msWedged = 0;

  for (let tick = 1; tick <= maxTicks; tick++) {
    const started = process.hrtime.bigint();
    world.tick(dt, now);
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    world.pendingDeaths = [];
    world.clearNodeEvents(NODE_ID);
    now += dt;

    const pos = bot.hasPosition.current;
    const moved = Math.hypot(pos.x - last.x, pos.y - last.y);
    last = { ...pos };
    stuck = moved < 0.5 ? stuck + 1 : 0;
    if (stuck === 0) msMoving = msMoving * 0.99 + elapsedMs * 0.01;
    else msWedged = msWedged * 0.99 + elapsedMs * 0.01;

    if (stuck < STILL_TICKS) continue;

    const pad = navigationPadForEntity(bot);
    const suppressed = suppressedFeatureIdsForNode(world, NODE_ID);
    const attackRange = bot.performsAttack.attackRange;
    const playerPH = posHitboxFromEntity(bot);

    console.log(
      `${NODE_ID} / ${CLASS_ROOT}: WEDGED at ${Math.round(now / 60000)} sim-min, ` +
        `pos=(${Math.round(pos.x)},${Math.round(pos.y)}), ` +
        `hp=${Math.round(bot.hasHealth.hp)}/${bot.hasHealth.maxHp}, ` +
        `attackRange=${Math.round(attackRange)}`,
    );
    console.log(
      `  tick cost: moving ~${msMoving.toFixed(2)}ms  wedged ~${msWedged.toFixed(2)}ms  ` +
        `(${(msWedged / Math.max(msMoving, 1e-6)).toFixed(1)}x)`,
    );
    console.log(
      `  nearestEngageableMonster -> ` +
        `${nearestEngageableMonster(world, bot)?.entityId ?? "NULL"}` +
        `   <- a non-NULL result here means acquisition works and STEERING is at fault\n`,
    );

    for (const monster of world.monsterEntitiesInNode(NODE_ID)) {
      const mp = monster.hasPosition.current;
      const monsterPH = posHitboxFromEntity(monster);
      const goal = approachPoint(pos, playerPH, mp, monsterPH, attackRange).dest;
      const path = findPathForMover(NODE_ID, "player", pad, pos, goal, suppressed);
      const end = path?.[path.length - 1];
      const endsInRange = end
        ? withinReach({ pos: end, rects: playerPH.rects }, monsterPH, attackRange)
        : false;

      console.log(
        `  ${monster.isMonster.monsterTypeId.padEnd(16)} ` +
          `gap=${String(Math.round(hitboxGap(playerPH, monsterPH))).padStart(4)} ` +
          `canReach=${world.collision.canReach(bot, monster, attackRange) ? "Y" : "n"} ` +
          `path=${path ? `${String(path.length).padStart(3)}pts` : "NONE  "} ` +
          `endOffGoal=${end ? Math.round(Math.hypot(end.x - goal.x, end.y - goal.y)) : "-"} ` +
          `endGapToMob=${end ? Math.round(hitboxGap({ pos: end, rects: playerPH.rects }, monsterPH)) : "-"} ` +
          `endsInRange=${endsInRange ? "Y" : "n"}`,
      );
    }
    return true;
  }

  return false;
}

let wedged = false;
for (let i = 1; i <= ATTEMPTS && !wedged; i++) {
  wedged = attempt();
  if (!wedged) console.log(`attempt ${i}: no wedge in ${SIM_SECONDS / 3600} sim hour(s)`);
}
if (!wedged) {
  console.log(`${NODE_ID} / ${CLASS_ROOT}: no wedge in ${ATTEMPTS} attempts`);
}
