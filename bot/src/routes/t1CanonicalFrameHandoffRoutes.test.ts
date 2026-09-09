import { T1_CANONICAL_FRAME_HANDOFF_ROUTES } from "./t1CanonicalFrameHandoffRoutes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

assert(T1_CANONICAL_FRAME_HANDOFF_ROUTES.length === 2, "two missing alternate-frame handoff routes");
assert(
  new Set(T1_CANONICAL_FRAME_HANDOFF_ROUTES.map((route) => route.id)).size === 2,
  "handoff route ids are unique",
);

const expected = new Map([
  ["squire-t1-balanced-handoff", { classRoot: "cooldown-root", frameId: "cooldown-balanced" }],
  ["striker-t1-heavy-handoff", { classRoot: "cadence-root", frameId: "cadence-heavy" }],
]);

for (const route of T1_CANONICAL_FRAME_HANDOFF_ROUTES) {
  const shape = expected.get(route.id);
  assert(shape, `${route.id}: expected handoff route`);
  assert(route.classRoot === shape.classRoot, `${route.id}: class root is unchanged`);
  assert(route.frameId === shape.frameId, `${route.id}: only the requested frame is selected`);
  assert(!route.startsFromTierEntry, `${route.id}: remains a real T1 route`);
  assert(
    route.steps.some((step) => step.type === "attemptBoss" && step.biomeGroup === "forest"),
    `${route.id}: includes the Forest seal before the frame unlock`,
  );
  assert(
    route.steps.some((step) => step.type === "unlockSkill" && step.skillId === shape.frameId),
    `${route.id}: purchases the intended frame after the Forest seal`,
  );
}

console.log("t1CanonicalFrameHandoffRoutes.test.ts: ok");
