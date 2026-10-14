/**
 * The environment respects the Guard gates too (design §22.13).
 *
 * Design §22.12 put the boss appliers behind the player's one admission check
 * (`playerRefusesStatus`, bossGuardGates.test.ts). §22.13 extends it to the
 * environment:
 *
 *  - node-feature terrain slows (the Swamp rot pool, the Jungle bush: every
 *    `statusWhileInside` a player can stand in) pass the gate under the slow's own
 *    status id;
 *  - Frost Nova's Chill (`addsAmbientStacks`) and the room's ambient Chill ramp add
 *    no stack while Immunity holds the Chill kind (`tundra-chill`, the id Cleanse
 *    strips it under).
 *
 * Wiring smoke, per applier: refused under the gate, and unchanged without it (the
 * same write lands exactly as authored: a refusal only, no resistance or duration
 * change). The gates are raised as bare state, as bossGuardGates.test.ts raises
 * them.
 *
 * Run: node --conditions=development --import tsx test/environmentGuardGates.test.ts
 */
import {
  ABILITY_IMMUNITY_EFFECT_ID,
  ABILITY_UNYIELDING_EFFECT_ID,
  AMBIENT_RAMP_KEY,
  MONSTER_DATABASE,
  RESOLVED_NODE_FEATURES,
  TUNDRA_CHILL_EFFECT_ID,
  abilityImmunityKindKey,
  applyStatusEffect,
  getStatusEffect,
  pointInNodeFeatureShape,
  removeStatusEffect,
  type ResolvedNodeFeature,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../src/ecs/entity';
import { runningBossPatternDef, updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { updateNodeFeatures } from '../src/systems/world/nodeFeatures';
import { World } from '../src/world/World';
import { NODE, assert, playerSlices } from './_bossLineageHarness';

initCombatSystems();

const LONG_MS = 600_000;

type Gate = (player: PlayerEntity) => void;

/** Endure's Unyielding, raised as the bare status it is. */
const unyielding: Gate = (player) => {
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_UNYIELDING_EFFECT_ID, maxStacks: 1, remainingMs: LONG_MS, refreshable: true,
    sourceId: player.isPlayer.id, data: { totalMs: LONG_MS },
  });
};

/** Cleanse's Immunity, carrying the refused kinds exactly as the keystone keys them. */
const immunity = (...kinds: string[]): Gate => (player) => {
  const data: Record<string, number> = { totalMs: LONG_MS };
  for (const kind of kinds) data[abilityImmunityKindKey(kind)] = 1;
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_IMMUNITY_EFFECT_ID, maxStacks: 1, remainingMs: LONG_MS, refreshable: true,
    sourceId: player.isPlayer.id, data,
  });
};

function spawn(world: World, id: string, nodeId: string, at: { x: number; y: number }, gate?: Gate): PlayerEntity {
  const player = world.attachPlayerEntity(playerSlices(id, at.x, at.y, 100_000, nodeId), id);
  gate?.(player);
  return player;
}

// ── 1. Node-feature terrain slows ────────────────────────────────────────────
//
// Every feature that lays a status on a player standing in it, one per distinct
// authored status (the rot pools share theirs, the bushes theirs), stood in at a
// centre no other such feature overlaps.
{
  const seen = new Set<string>();
  const cases: { nodeId: string; feature: ResolvedNodeFeature }[] = [];
  for (const [nodeId, features] of Object.entries(RESOLVED_NODE_FEATURES)) {
    for (const feature of features ?? []) {
      const status = feature.statusWhileInside;
      if (!status?.targets.includes('player') || feature.shape.kind !== 'circle') continue;
      const key = JSON.stringify(status);
      if (seen.has(key)) continue;
      const centre = { x: feature.shape.x, y: feature.shape.y };
      const overlapped = (features ?? []).some((other) =>
        other !== feature && other.statusWhileInside && pointInNodeFeatureShape(centre, other.shape));
      if (overlapped) continue;
      seen.add(key);
      cases.push({ nodeId, feature });
    }
  }
  const effectIds = new Set(cases.map((c) => c.feature.statusWhileInside!.effectId));
  assert(cases.length >= 2 && effectIds.has('slow'), 'fixture: the rot pool and the bush both lay a terrain slow');

  for (const { nodeId, feature } of cases) {
    const status = feature.statusWhileInside!;
    const at = { x: feature.shape.x, y: feature.shape.y };
    const stand = (label: string, gate?: Gate) => {
      const world = new World();
      const player = spawn(world, `env-${feature.id}-${label}`, nodeId, at, gate);
      updateNodeFeatures(world, 100);
      return getStatusEffect(player.tracksCombat, status.effectId);
    };
    const asAuthored = (label: string, gate?: Gate) => {
      const slow = stand(label, gate);
      assert(slow, `${nodeId} ${feature.id} (${label}): the terrain lays its ${status.effectId}`);
      assert(slow.sourceId === `node-feature:${feature.id}`, `${feature.id} (${label}): the feature owns it`);
      assert(slow.remainingMs === status.refreshMs, `${feature.id} (${label}): its own clock, unchanged`);
      for (const [key, value] of Object.entries(status.data)) {
        assert(slow.data[key] === value, `${feature.id} (${label}): ${key} lands as authored (${slow.data[key]} vs ${value})`);
      }
    };

    asAuthored('no gate');
    // Unyielding refuses hard control only: a soft terrain slow is not its kind.
    asAuthored('unyielding', unyielding);
    // Immunity for another kind leaves it alone.
    asAuthored('other kind', immunity('antiheal'));
    assert(stand('immunity', immunity(status.effectId)) === undefined,
      `${nodeId} ${feature.id}: Immunity refuses the terrain's ${status.effectId}`);
  }
}

// ── 2. The room's ambient Chill ramp ─────────────────────────────────────────
{
  const CHILL_NODE = 'node-t4-tundra-01';
  const CHILL = RESOLVED_NODE_FEATURES[CHILL_NODE]!.find((f) => f.ambientRamp)!.ambientRamp!;
  assert(CHILL.effectId === TUNDRA_CHILL_EFFECT_ID, 'fixture: the tundra room ramps Chill');
  const SPOT = { x: 400, y: 400 };

  /** The node-feature pass for `ms`, the player held in combat. */
  const fight = (world: World, player: PlayerEntity, ms: number): void => {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
      player.tracksEngagement = Date.now();
      updateNodeFeatures(world, 100);
    }
  };
  const stacks = (player: PlayerEntity): number =>
    getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)?.stacks ?? 0;
  const carry = (player: PlayerEntity, n: number): void => {
    applyStatusEffect(player.tracksCombat, {
      id: TUNDRA_CHILL_EFFECT_ID, maxStacks: CHILL.maxStacks, remainingMs: -1, refreshable: false,
      sourceId: `node-feature:${CHILL.effectId}`,
      data: { [AMBIENT_RAMP_KEY]: 1, maxStacks: CHILL.maxStacks, rampMs: CHILL.rampMs, rampAccum: 0 },
    });
    getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)!.stacks = n;
  };

  // Without the gate: the first stack on entering the fight, then the climb.
  {
    const world = new World();
    const player = spawn(world, 'env-chill-open', CHILL_NODE, SPOT);
    fight(world, player, 100);
    assert(stacks(player) === 1, 'the room lays its first Chill stack');
    fight(world, player, CHILL.rampMs);
    assert(stacks(player) === 2, 'and climbs one per rampMs');
  }

  // Under Immunity for Chill: no first stack, however long the fight; the moment
  // it lapses the room lays it as before.
  {
    const world = new World();
    const player = spawn(world, 'env-chill-refused', CHILL_NODE, SPOT, immunity(TUNDRA_CHILL_EFFECT_ID));
    fight(world, player, CHILL.rampMs * 2);
    assert(stacks(player) === 0, 'Immunity refuses the room its first Chill stack');
    removeStatusEffect(player.tracksCombat, ABILITY_IMMUNITY_EFFECT_ID);
    fight(world, player, 100);
    assert(stacks(player) === 1, 'once it lapses, the room lays it again');
  }

  // Carried Chill under Immunity: kept (the refusal removes nothing), not climbed,
  // not lifted to a boss floor, and the refused time is not banked.
  {
    const world = new World();
    const player = spawn(world, 'env-chill-carried', CHILL_NODE, SPOT, immunity(TUNDRA_CHILL_EFFECT_ID));
    carry(player, 2);
    world.ambientRampOverrides.set(CHILL_NODE, { minStacks: 4 });
    fight(world, player, CHILL.rampMs * 2);
    assert(stacks(player) === 2, `the room adds no Chill under Immunity: not the climb, not the floor (got ${stacks(player)})`);
    removeStatusEffect(player.tracksCombat, ABILITY_IMMUNITY_EFFECT_ID);
    fight(world, player, 100);
    assert(stacks(player) === 4, `once it lapses the floor lifts it, and nothing banked climbs on top (got ${stacks(player)})`);
  }

  // The same carried Chill without the gate: the floor and the climb, as authored.
  {
    const world = new World();
    const player = spawn(world, 'env-chill-floor', CHILL_NODE, SPOT);
    carry(player, 2);
    world.ambientRampOverrides.set(CHILL_NODE, { minStacks: 4 });
    fight(world, player, 100);
    assert(stacks(player) === 4, 'the boss floor lifts the carried Chill');
    fight(world, player, CHILL.rampMs);
    assert(stacks(player) === 5, 'and the room climbs on from it');
  }
}

// ── 3. Frost Nova's Chill ────────────────────────────────────────────────────
{
  const BOSS = 'frost-plated-rime-mammoth';
  const nova = MONSTER_DATABASE.get(BOSS)!.bossPatternVariants!.find((p) => p.id === 'rime-frost-nova')!;
  const impact = nova.steps.find((s) => s.kind === 'impact');
  assert(impact?.kind === 'impact' && (impact.addsAmbientStacks ?? 0) > 0, `fixture: ${BOSS}'s Frost Nova adds Chill`);
  const adds = impact.addsAmbientStacks!;

  /** A close player carrying one Chill stack draws the Nova; the pattern loop alone runs it. */
  const takeNova = (label: string, gate?: Gate) => {
    const world = new World();
    const player = spawn(world, `env-nova-${label}`, NODE, { x: 480, y: 400 }, gate);
    applyStatusEffect(player.tracksCombat, {
      id: TUNDRA_CHILL_EFFECT_ID, maxStacks: 6, remainingMs: -1, refreshable: false,
      sourceId: 'node-feature:tundra-chill',
      data: { [AMBIENT_RAMP_KEY]: 1, maxStacks: 6, rampMs: 4000, rampAccum: 0 },
    });
    const boss = world.createMonster(NODE, BOSS, { x: 400, y: 400 });
    assert(boss, `${BOSS} should spawn`);
    setAggroTarget(world, boss, { id: player.isPlayer.id, kind: 'player' }, 1_000);
    boss.hasAwareness.state = 'attacking';
    updateBossScripts(world, 0); // its first phase adds the Nova
    const hp = player.hasHealth.hp;
    let cast = false;
    let resolved = false;
    let now = 1_000;
    for (let tick = 0; tick < 400 && !resolved; tick++) {
      now += 100;
      player.hasPosition.current = { x: 480, y: 400 };
      updateCombatState(world, 100);
      updateBossPatterns(world, 100, now);
      const state = boss.runsBossPattern;
      const step = state ? runningBossPatternDef(boss)?.steps[state.stepIndex] : undefined;
      if (step && 'name' in step && step.name === 'Frost Nova') cast = true;
      else if (cast) resolved = true;
    }
    assert(resolved, `${label}: the Nova resolved`);
    assert(player.hasHealth.hp < hp, `${label}: and its burst landed (the refusal is the Chill's only)`);
    return getStatusEffect(player.tracksCombat, TUNDRA_CHILL_EFFECT_ID)?.stacks ?? 0;
  };

  assert(takeNova('open') === 1 + adds, `without the gate the Nova adds its ${adds} Chill`);
  assert(takeNova('other-kind', immunity('slow')) === 1 + adds, 'Immunity for another kind leaves the Nova alone');
  assert(takeNova('immunity', immunity(TUNDRA_CHILL_EFFECT_ID)) === 1,
    'under Immunity for Chill the Nova adds none, and takes none away');
}

console.log('environmentGuardGates: ok');
