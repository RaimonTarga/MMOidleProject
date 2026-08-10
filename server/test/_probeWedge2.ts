// Throwaway probe (leading `_` = skipped by the test runner).
//
// Corrected successor to `_probeMountain.ts`, which reports a wedge whenever the
// bot is motionless for 2 simulated minutes — a criterion a CORPSE also satisfies.
// That probe never revives the bot (the real farm loop does, via `respawnPlayer`)
// and never checks HP, so a lethal node reads as a pathing wedge.
//
// This version separates the two: it revives on death exactly as `runFarm` does,
// counts deaths, and reports a wedge ONLY when the bot is alive and motionless.
//
// Usage: pnpm --filter @mmo-idle/server exec tsx --conditions=development \
//          test/_probeWedge2.ts [nodeId] [classRoot]

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
import { respawnPlayer } from "../src/systems/world/spawning";
import { thawNode } from "../src/world/nodeLifecycle";

const NODE_ID = process.argv[2] ?? "node-t1-mountain-01";
const CLASS_ROOT = process.argv[3] ?? "cadence-root";
const SIM_SECONDS = 3600;
const TIME_SCALE = 2;
const STILL_TICKS = 600; // 2 simulated minutes
const ATTEMPTS = Number(process.argv[4] ?? 6);

const target = farmTargetForNode(NODE_ID);
const build = representativeBuildsPerClass(target.contentTier, target.biomeGroup, {
  classRoot: CLASS_ROOT,
})[0];

interface Outcome {
  wedged: boolean;
  deaths: number;
  kills: number;
  simMin: number;
}

function attempt(): Outcome {
  const world = createFarmWorld();
  setupArena(world, target);
  const bot = materializeBot(world, build, target, BOT_SPAWN);

  const dt = BENCH_DT_MS * TIME_SCALE;
  const maxTicks = Math.ceil((SIM_SECONDS * 1000) / dt);

  let now = 0;
  let stuck = 0;
  let deaths = 0;
  let last = { ...bot.hasPosition.current };

  for (let tick = 1; tick <= maxTicks; tick++) {
    world.tick(dt, now);
    world.pendingDeaths = [];
    world.clearNodeEvents(NODE_ID);
    now += dt;

    // Death is NOT a wedge. Revive exactly as runFarm does and keep going.
    if (bot.isDead !== undefined || bot.hasHealth.hp <= 0) {
      deaths += 1;
      respawnPlayer(world, bot.isPlayer.id);
      const from = bot.hasPosition.nodeId;
      if (from !== NODE_ID) {
        if (world.isNodeFrozen(NODE_ID)) thawNode(world, NODE_ID);
        bot.hasPosition.nodeId = NODE_ID;
        world.movePlayerNode(from, NODE_ID, bot.isPlayer.id);
        world.resetNodeDeltaState(NODE_ID);
      }
      bot.hasPosition.current = { ...BOT_SPAWN };
      bot.hasHealth.hp = bot.hasHealth.maxHp;
      last = { ...bot.hasPosition.current };
      stuck = 0;
      continue;
    }

    const pos = bot.hasPosition.current;
    const moved = Math.hypot(pos.x - last.x, pos.y - last.y);
    last = { ...pos };
    stuck = moved < 0.5 ? stuck + 1 : 0;
    if (stuck < STILL_TICKS) continue;

    const pad = navigationPadForEntity(bot);
    const suppressed = suppressedFeatureIdsForNode(world, NODE_ID);
    const attackRange = bot.performsAttack.attackRange;
    const playerPH = posHitboxFromEntity(bot);
    const mobs = [...world.monsterEntitiesInNode(NODE_ID)];

    console.log(
      `LIVE WEDGE at ${Math.round(now / 60000)} sim-min  ` +
        `pos=(${Math.round(pos.x)},${Math.round(pos.y)}) ` +
        `hp=${Math.round(bot.hasHealth.hp)}/${bot.hasHealth.maxHp} ` +
        `deaths=${deaths} mobs=${mobs.length} attackRange=${Math.round(attackRange)}`,
    );
    const chosen = nearestEngageableMonster(world, bot);
    console.log(`  nearestEngageableMonster -> ${chosen?.entityId ?? "NULL"}`);

    // Why is a player with a valid target not moving? Dump every gate that can
    // suppress motion, in the order the code consults them.
    console.log(
      `  GATES: auto=${bot.usesAutocombat.auto} ` +
        `manualIntent=${bot.hasManualMoveIntent !== undefined} ` +
        `rooted=${bot.isRooted !== undefined} ` +
        `fleeing=${bot.isFleeing !== undefined} ` +
        `moving=${bot.isMoving !== undefined} ` +
        `movePath=${bot.hasMovePath ? String(bot.hasMovePath.waypoints.length) + "wp" : "none"} ` +
        `casting=${bot.isCastingAbility !== undefined} ` +
        `channeling=${bot.isChanneling !== undefined} ` +
        `attackTarget=${bot.hasAttackTarget !== undefined}`,
    );

    // Replicate steerTowardTarget's OWN far-approach destination (which is NOT
    // approachPoint) and ask nav for a route to it — the suspected divergence.
    if (chosen) {
      const tp = chosen.hasPosition.current;
      const dxs = tp.x - pos.x;
      const dys = tp.y - pos.y;
      const dists = Math.hypot(dxs, dys);
      const chosenPH = posHitboxFromEntity(chosen);
      const cgap = hitboxGap(playerPH, chosenPH);
      const settleGap = Math.max(0, Math.min(attackRange - 4, attackRange * 0.9));
      const aimGap = Math.max(0, settleGap - 64);
      const advance = Math.max(0, Math.min(cgap - aimGap, dists));
      const steerDest = {
        x: pos.x + (dxs / dists) * advance,
        y: pos.y + (dys / dists) * advance,
      };
      const steerPath = findPathForMover(NODE_ID, "player", pad, pos, steerDest, suppressed);
      const apGoal = approachPoint(pos, playerPH, tp, chosenPH, attackRange).dest;
      const apPath = findPathForMover(NODE_ID, "player", pad, pos, apGoal, suppressed);
      console.log(
        `  STEER dest=(${Math.round(steerDest.x)},${Math.round(steerDest.y)}) ` +
          `planPath=${steerPath ? String(steerPath.length) + "pts" : "NULL <-- STOPS THE PLAYER"}`,
      );
      console.log(
        `  ACQUIRE goal=(${Math.round(apGoal.x)},${Math.round(apGoal.y)}) ` +
          `planPath=${apPath ? String(apPath.length) + "pts" : "NULL"}`,
      );
    }
    console.log("");

    for (const monster of mobs) {
      const mp = monster.hasPosition.current;
      const monsterPH = posHitboxFromEntity(monster);
      const goal = approachPoint(pos, playerPH, mp, monsterPH, attackRange).dest;
      const path = findPathForMover(NODE_ID, "player", pad, pos, goal, suppressed);
      const end = path?.[path.length - 1];
      console.log(
        `  ${monster.isMonster.monsterTypeId.padEnd(16)} ` +
          `gap=${String(Math.round(hitboxGap(playerPH, monsterPH))).padStart(4)} ` +
          `canReach=${world.collision.canReach(bot, monster, attackRange) ? "Y" : "n"} ` +
          `path=${path ? `${String(path.length).padStart(3)}pts` : "NONE  "} ` +
          `endsInRange=${
            end && withinReach({ pos: end, rects: playerPH.rects }, monsterPH, attackRange)
              ? "Y"
              : "n"
          }`,
      );
    }
    return { wedged: true, deaths, kills: 0, simMin: Math.round(now / 60000) };
  }

  return { wedged: false, deaths, kills: 0, simMin: Math.round(now / 60000) };
}

for (let i = 1; i <= ATTEMPTS; i++) {
  const out = attempt();
  if (out.wedged) {
    console.log(`attempt ${i}: LIVE WEDGE (deaths before it: ${out.deaths})`);
    process.exit(0);
  }
  console.log(
    `attempt ${i}: no live wedge in ${SIM_SECONDS / 3600} sim hour(s) — ` +
      `deaths=${out.deaths}`,
  );
}
