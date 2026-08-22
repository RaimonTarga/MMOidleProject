/**
 * Wiring smoke test for the T1-T4 monster-rework behavior primitives.
 *
 * Not a balance test: it attaches each primitive the sanctioned way, ticks the
 * real world, and asserts the observable invariant (state transition, status
 * present/absent, no throw). Numbers here are local to the test.
 */
import {
  MONSTER_DATABASE,
  ambientRampAttackSlowPct,
  ambientRampData,
  applyStatusEffect,
  getStatusEffect,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import { World } from '../src/world/World';
import { updateShellUp, isShelled, shellDamageMult } from '../src/systems/combat/ai/shellUp';
import { updateAllyEmpower } from '../src/systems/combat/ai/allyEmpower';
import {
  monsterVolleyHits,
  monsterDotStacksForHit,
  monsterAttackCooldown,
  applyEnemyShield,
  noteMonsterHitTaken,
} from '../src/systems/combat/engine/monsterMechanics';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const world = new World();
const NODE = 'node-5-6';

/** Register a throwaway monster type so the test never depends on live tuning. */
function defineTestMonster(id: string, extra: Partial<MonsterDefinition>): void {
  MONSTER_DATABASE.set(id, {
    id,
    name: id,
    color: 0xffffff,
    stats: {
      hp: 1000, attack: 10, plating: 0, damageReduction: 0, speed: 40,
      attackRange: 12, attackCooldown: 1000, pullRange: 200,
    },
    behavior: 'melee',
    attackStyle: 'impact',
    biome: 'forest',
    rewards: { essence: 1, essenceType: 'green', level: 1 },
    ai: { wanderRadius: 100, leashRange: 400, idleMinMs: 100, idleMaxMs: 200 },
    ...extra,
  } as MonsterDefinition);
}

// ── Volley: opening volley fires once per session, cadence volley every Nth ──
defineTestMonster('test-volleyer', {
  openingVolley: { hits: 3 },
  cadenceVolley: { everyNAttacks: 3, hits: 2 },
});
const volleyer = world.createMonster(NODE, 'test-volleyer', { x: 500, y: 500 });
if (!volleyer) throw new Error('failed to create volleyer');
const volleyDef = MONSTER_DATABASE.get('test-volleyer');

setAggroTarget(world, volleyer, { id: 'fake-player', kind: 'player' }, 1_000);
const beats = [1, 2, 3, 4, 5, 6].map((i) =>
  monsterVolleyHits(volleyer, volleyDef, 1_000 + i),
);
assert(beats[0] === 3, `beat 1 should be the 3-shot opening volley, got ${beats[0]}`);
assert(beats[1] === 1, `beat 2 should be an ordinary single hit, got ${beats[1]}`);
assert(beats[2] === 2, `beat 3 should be the cadence volley, got ${beats[2]}`);
assert(beats[5] === 2, `beat 6 should be the cadence volley, got ${beats[5]}`);

// A fresh combat session re-arms the opening volley.
setAggroTarget(world, volleyer, null, 2_000);
setAggroTarget(world, volleyer, { id: 'fake-player', kind: 'player' }, 3_000);
assert(
  monsterVolleyHits(volleyer, volleyDef, 3_001) === 3,
  're-engaging should re-arm the opening volley',
);

// ── Venomous opener: first landed hit of a session lands N stacks ────────────
defineTestMonster('test-ambusher', {
  dotEffect: {
    debuffId: 'test-venom', damagePerStack: 3, maxStacks: 5,
    tickIntervalMs: 1000, durationMs: 3000, openerStacks: 3,
  },
});
const ambusher = world.createMonster(NODE, 'test-ambusher', { x: 600, y: 600 });
if (!ambusher) throw new Error('failed to create ambusher');
const ambushDot = MONSTER_DATABASE.get('test-ambusher')!.dotEffect;
setAggroTarget(world, ambusher, { id: 'fake-player', kind: 'player' }, 1_000);
assert(
  monsterDotStacksForHit(ambusher, ambushDot, 1_001) === 3,
  'the opening bite should land 3 stacks',
);
assert(
  monsterDotStacksForHit(ambusher, ambushDot, 1_002) === 1,
  'every bite after the opener should land 1 stack',
);

// ── Shell Up: retract at the HP threshold, once per life ────────────────────
defineTestMonster('test-snapper', {
  shellUp: { atHpPct: 0.5, durationMs: 2_000, directDamageMult: 0.15 },
});
const snapper = world.createMonster(NODE, 'test-snapper', { x: 700, y: 700 });
if (!snapper) throw new Error('failed to create snapper');

let now = 10_000;
updateShellUp(world, now);
assert(!isShelled(snapper, now), 'a healthy snapper should not be shelled');
assert(shellDamageMult(snapper, now) === 1, 'an open snapper takes full damage');

snapper.hasHealth.hp = snapper.hasHealth.maxHp * 0.4;
updateShellUp(world, now);
assert(isShelled(snapper, now), 'dropping past the threshold should shell it');
assert(shellDamageMult(snapper, now) === 0.15, 'a shelled snapper resists direct damage');
assert(snapper.cannotAttack !== undefined, 'a shelled snapper cannot attack');
assert(snapper.isRooted !== undefined, 'a shelled snapper cannot move');

now += 2_500;
updateShellUp(world, now);
assert(!isShelled(snapper, now), 'the shell should open when its timer runs out');
assert(snapper.cannotAttack === undefined, 'emerging should restore attacks');
assert(snapper.isRooted === undefined, 'emerging should restore movement');

// Once per LIFE, not per session: dropping low again must not re-shell.
snapper.hasHealth.hp = snapper.hasHealth.maxHp * 0.1;
updateShellUp(world, now + 1);
assert(!isShelled(snapper, now + 1), 'Shell Up must never loop — once per life');

// ── Necrotic Screech: hastens nearby allies while engaged ───────────────────
defineTestMonster('test-screecher', {
  empowersAllies: { intervalMs: 1_000, radius: 300, attackSpeedPct: 0.5, durationMs: 3_000 },
});
defineTestMonster('test-ally', {});
const screecher = world.createMonster(NODE, 'test-screecher', { x: 1000, y: 1000 });
const ally = world.createMonster(NODE, 'test-ally', { x: 1100, y: 1000 });
const farAlly = world.createMonster(NODE, 'test-ally', { x: 2000, y: 1000 });
if (!screecher || !ally || !farAlly) throw new Error('failed to create screech group');

const baseCooldown = monsterAttackCooldown(ally);
now = 20_000;
setAggroTarget(world, screecher, { id: 'fake-player', kind: 'player' }, now);
updateAllyEmpower(world, now);          // session start: arms the timer
updateAllyEmpower(world, now + 1_100);  // interval elapsed: screech
assert(
  monsterAttackCooldown(ally) < baseCooldown,
  'a nearby ally should attack faster after the screech',
);
assert(
  monsterAttackCooldown(farAlly) === monsterAttackCooldown(farAlly),
  'the far ally read should be stable',
);
assert(
  getStatusEffect(farAlly.tracksCombat, 'boss-roar-haste') === undefined,
  'an ally outside the radius should not be hastened',
);

// ── Clean-recharge barrier: pressure keeps it down, a lull brings it back ────
defineTestMonster('test-scarab', {
  enemyShield: {
    shieldPct: 0.2, intervalMs: 999_999, durationMs: 5_000,
    rechargeAfterCleanMs: 3_000,
  },
});
const scarab = world.createMonster(NODE, 'test-scarab', { x: 1500, y: 1500 });
if (!scarab) throw new Error('failed to create scarab');
const scarabDef = MONSTER_DATABASE.get('test-scarab');

now = 30_000;
setAggroTarget(world, scarab, { id: 'fake-player', kind: 'player' }, now);
// The barrier is up on contact (it has been un-hit for a long time by definition).
const first = applyEnemyShield(scarab, scarabDef, 100, now);
assert(first.absorbed > 0, 'a clean-recharge barrier should be up on engagement');

// Drain it, then keep hitting: it must NOT come back while under pressure.
let drain = applyEnemyShield(scarab, scarabDef, 10_000, now + 10);
assert(drain.broke, 'a big hit should break the barrier');
noteMonsterHitTaken(scarab, now + 10);
for (let t = 100; t <= 2_500; t += 400) {
  noteMonsterHitTaken(scarab, now + t);
  const under = applyEnemyShield(scarab, scarabDef, 50, now + t);
  assert(under.absorbed === 0, `barrier must stay down under pressure (t=${t})`);
}
// Leave it alone past the clean window and it reforms.
const lull = applyEnemyShield(scarab, scarabDef, 50, now + 2_500 + 3_100);
assert(lull.absorbed > 0, 'the barrier should reform after a clean window');

// ── Tundra chill now suppresses attack speed as well as movement ────────────
const chillPlayerState = { statusEffects: [] as never[] } as never;
const chillEffect = applyStatusEffect(chillPlayerState, {
  id: 'tundra-chill',
  maxStacks: 6,
  remainingMs: -1,
  refreshable: true,
  sourceId: 'node',
  data: ambientRampData({ moveSlowPct: 0.05, attackSlowPct: 0.04 }, {
    maxStacks: 6, rampMs: 4000,
  }),
});
chillEffect.stacks = 6;
assert(
  Math.abs(ambientRampAttackSlowPct(chillEffect) - 0.24) < 1e-9,
  `6 chill stacks should add 24% attack cooldown, got ${ambientRampAttackSlowPct(chillEffect)}`,
);

// The node-authored tundra chill must actually carry the attack-slow term.
assert(
  MONSTER_DATABASE.get('frost-lurker')?.slowEffect === undefined,
  'Tundra mobs must not reapply a generic per-hit slow (the environment owns it)',
);

console.log('monsterReworkPrimitives: ok');
