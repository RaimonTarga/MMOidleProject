import { advancePlayerPath, clampPlayerStepToNode, movePlayerWithCollisions } from './playerMotion';
import { moverOverlapsBlockShapes } from '../systems/spatial';
import type { NodeFeatureShape } from '../world/nodeFeatures';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function near(actual: number, expected: number, tolerance = 1e-4): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function assertVec(actual: { x: number; y: number }, expected: { x: number; y: number }, message: string): void {
  assert(near(actual.x, expected.x) && near(actual.y, expected.y), `${message}: ${JSON.stringify(actual)}`);
}

const wall: NodeFeatureShape = { kind: 'rect', x: 100, y: 100, halfW: 10, halfH: 40 };
const pad = { x: 4, y: 4 };

for (const x of [-100, 2500, 4900]) {
  for (const y of [-100, 2500, 4900]) {
    const bounded = clampPlayerStepToNode({ x, y }, 4800, 4800);
    const predicted = movePlayerWithCollisions({ x: 2400, y: 2400 }, bounded, []);
    assert(predicted.x >= 0 && predicted.x <= 4800 && predicted.y >= 0 && predicted.y <= 4800,
      'prediction waits inside the current node for authoritative crossing');
  }
}

const free = movePlayerWithCollisions({ x: 0, y: 0 }, { x: 30, y: 20 }, [wall]);
assertVec(free, { x: 30, y: 20 }, 'free movement reaches destination');

const headOn = movePlayerWithCollisions({ x: 40, y: 100 }, { x: 180, y: 100 }, [wall], pad);
assert(near(headOn.x, 85.5), 'head-on rectangle stops before the padded face');
assert(near(headOn.y, 100), 'head-on rectangle has no lateral drift');
assert(!moverOverlapsBlockShapes(headOn, [wall], pad), 'head-on endpoint is outside blocker');

const diagonal = movePlayerWithCollisions({ x: 40, y: 40 }, { x: 180, y: 180 }, [wall], pad);
assert(diagonal.x <= 85.65, 'diagonal wall contact removes inward x');
assert(diagonal.y > 100, 'diagonal wall contact preserves tangential y');
assert(!moverOverlapsBlockShapes(diagonal, [wall], pad), 'diagonal endpoint is outside blocker');

const away = movePlayerWithCollisions({ x: 85, y: 100 }, { x: 40, y: 100 }, [wall], pad);
assertVec(away, { x: 40, y: 100 }, 'moving away from a wall works immediately');

const circle: NodeFeatureShape = { kind: 'circle', x: 100, y: 100, radius: 20 };
const ellipse: NodeFeatureShape = { kind: 'ellipse', x: 200, y: 100, halfW: 40, halfH: 20 };
const circleGraze = movePlayerWithCollisions({ x: 50, y: 80 }, { x: 150, y: 80 }, [circle]);
assertVec(circleGraze, { x: 150, y: 80 }, 'circle tangent does not invent a slide');
const ellipseGlance = movePlayerWithCollisions({ x: 140, y: 120 }, { x: 260, y: 120 }, [ellipse]);
assert(!moverOverlapsBlockShapes(ellipseGlance, [ellipse]), 'ellipse glancing endpoint is outside blocker');

const cornerShapes: NodeFeatureShape[] = [
  { kind: 'rect', x: 100, y: 80, halfW: 10, halfH: 30 },
  { kind: 'rect', x: 80, y: 100, halfW: 30, halfH: 10 },
];
const corner = movePlayerWithCollisions({ x: 40, y: 40 }, { x: 140, y: 140 }, cornerShapes);
const reversedCorner = movePlayerWithCollisions({ x: 40, y: 40 }, { x: 140, y: 140 }, [...cornerShapes].reverse());
assertVec(corner, reversedCorner, 'inside corner is independent of shape order');
assert(!moverOverlapsBlockShapes(corner, cornerShapes), 'inside corner endpoint is outside both blockers');

const closeBlockers: NodeFeatureShape[] = [
  { kind: 'rect', x: 80, y: 100, halfW: 5, halfH: 30 },
  { kind: 'rect', x: 100, y: 100, halfW: 5, halfH: 30 },
];
const close = movePlayerWithCollisions({ x: 20, y: 100 }, { x: 160, y: 100 }, closeBlockers);
assert(!moverOverlapsBlockShapes(close, closeBlockers), 'closely spaced blockers never overlap endpoint');
assert(Math.hypot(close.x - 20, close.y - 100) <= 140 + 1e-5, 'movement never exceeds requested budget');

const tunneled = movePlayerWithCollisions({ x: 0, y: 100 }, { x: 300, y: 100 }, [wall]);
assert(tunneled.x < 90, 'large displacement cannot tunnel through a wall');

const invalidStart = movePlayerWithCollisions({ x: 100, y: 100 }, { x: 20, y: 20 }, [wall]);
assertVec(invalidStart, { x: 100, y: 100 }, 'invalid start remains unchanged');

const path = advancePlayerPath(
  { x: 0, y: 0 },
  [{ x: 10, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 10 }],
  25,
  [],
);
assertVec(path.position, { x: 15, y: 10 }, 'path consumes multiple waypoints in one update');
assert(path.waypoints.length === 1 && path.waypoints[0].y === 10, 'path preserves unfinished corner');
assert(!path.blocked, 'clear path is not blocked');

const blockedPath = advancePlayerPath(
  { x: 40, y: 100 },
  [{ x: 180, y: 100 }, { x: 180, y: 140 }],
  200,
  [wall],
);
assert(blockedPath.blocked, 'blocked path reports blockage');
assert(blockedPath.waypoints.length === 2, 'blocked path retains its head and tail');
assert(blockedPath.position.x < 100, 'blocked path stops before the wall');

const stationary = advancePlayerPath({ x: 0, y: 0 }, [{ x: 0, y: 0 }], 0, []);
assertVec(stationary.position, { x: 0, y: 0 }, 'stationary path remains at its origin');
assert(stationary.waypoints.length === 0 && !stationary.blocked, 'stationary reached waypoint completes');
const zeroBudget = advancePlayerPath({ x: 0, y: 0 }, [{ x: 0.005, y: 0 }, { x: 0.01, y: 0 }], 0, []);
assert(zeroBudget.position.x === 0 && zeroBudget.waypoints.length === 2, 'arrival tolerance cannot spend distance without a movement budget');

console.log('player motion tests ok');

const tallWall: NodeFeatureShape = { kind: 'rect', x: 100, y: 0, halfW: 10, halfH: 1000 };
function walkAt(fps: number, shape: NodeFeatureShape, heading: { x: number; y: number }): { x: number; y: number } {
  let position = { x: 40, y: 0 };
  for (let i = 0; i < fps * 2; i++) {
    position = movePlayerWithCollisions(position, {
      x: position.x + heading.x * 120 / fps,
      y: position.y + heading.y * 120 / fps,
    }, [shape], pad);
    assert(!moverOverlapsBlockShapes(position, [shape], pad), 'every temporal sample is clear');
  }
  return position;
}
const flatSamples = [10, 30, 60, 144].map(fps => walkAt(fps, tallWall, { x: Math.SQRT1_2, y: Math.SQRT1_2 }));
for (const sample of flatSamples) {
  assert(Math.hypot(sample.x - flatSamples[0].x, sample.y - flatSamples[0].y) < 1, 'flat-wall steering agrees within 1px across tick/frame rates');
}
const repeatedHeadOn = walkAt(60, tallWall, { x: 1, y: 0 });
assert(repeatedHeadOn.y === 0, 'two-second head-on wall hold has no sideways drift');

const diagonalBlockedPath = advancePlayerPath({ x: 40, y: 0 }, [{ x: 200, y: 160 }], 200, [tallWall], pad);
assert(diagonalBlockedPath.blocked, 'diagonal blocked path reports contact');
assert(Math.abs(diagonalBlockedPath.position.y - (diagonalBlockedPath.position.x - 40)) < 1e-6, 'path contact stays on the planned segment instead of sliding');
const nearBlockedHead = advancePlayerPath({ x: 89.995, y: 100 }, [{ x: 90.001, y: 100 }], 1, [wall]);
assert(nearBlockedHead.blocked && !moverOverlapsBlockShapes(nearBlockedHead.position, [wall]), 'numerical arrival tolerance cannot snap into a blocked head');

const curvedSamples = [10, 30, 60, 144].map(fps => walkAt(fps, { kind: 'ellipse', x: 110, y: 70, halfW: 35, halfH: 60 }, { x: Math.SQRT1_2, y: Math.SQRT1_2 }));
const curvedDrift = Math.max(...curvedSamples.map(point => Math.hypot(point.x - curvedSamples[0].x, point.y - curvedSamples[0].y)));
console.log(`player motion temporal tests ok; curved-contact endpoint spread ${curvedDrift.toFixed(3)} px`);
