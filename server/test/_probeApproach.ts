// Throwaway probe (leading `_` = skipped by the runner).
// Does `approachPoint` actually return a destination inside attack range?
// It advances along the CENTRE-to-CENTRE line by (gap - desiredGap), where gap is
// the EDGE-to-EDGE hitbox gap. Those only agree when the approach is axis-aligned;
// off-axis, closing the centre distance by X shrinks the edge gap by less than X,
// so the destination lands short. Pure geometry — no world, no simulation.

import { approachPoint, hitboxGap, type PosHitbox } from "@mmo-idle/shared";

const RECT = { offsetX: 0, offsetY: 0, halfW: 16, halfH: 24 };
const ph = (x: number, y: number): PosHitbox => ({ pos: { x, y }, rects: [RECT] });

const ATTACK_RANGE = 12; // the cadence melee value seen in the bench

console.log(`attackRange=${ATTACK_RANGE}, desiredGap=${Math.max(ATTACK_RANGE - 8, ATTACK_RANGE * 0.5)}\n`);
console.log("angle   startGap   destGap   inRange?");

let failures = 0;
for (let deg = 0; deg <= 90; deg += 10) {
  const rad = (deg * Math.PI) / 180;
  const dist = 400;
  const from = { x: 0, y: 0 };
  const to = { x: Math.cos(rad) * dist, y: Math.sin(rad) * dist };

  const fromPH = ph(from.x, from.y);
  const toPH = ph(to.x, to.y);
  const startGap = hitboxGap(fromPH, toPH);

  const { dest } = approachPoint(from, fromPH, to, toPH, ATTACK_RANGE);
  const destGap = hitboxGap(ph(dest.x, dest.y), toPH);
  const ok = destGap <= ATTACK_RANGE;
  if (!ok) failures++;

  console.log(
    `${String(deg).padStart(3)}°  ${startGap.toFixed(1).padStart(8)}  ${destGap.toFixed(1).padStart(8)}   ${ok ? "yes" : "NO  <-- unreachable by the idle-branch test"}`,
  );
}

console.log(
  `\n${failures}/10 approach angles produce a destination OUTSIDE attackRange.`,
);
console.log(
  "Any of those makes `pathEndsInAttackRange` false, so `nearestEngageableMonster`\n" +
    "rejects the monster even though the route to it is perfectly clear.",
);
