/**
 * Boss mechanics respect the Guard gates (design §22.12).
 *
 * Endure's Unyielding refuses new hard control and roots; Cleanse's Immunity
 * refuses the affliction kinds its Cleanse stripped. Both are refusals at the
 * player debuff writers' one admission check (`playerRefusesStatus`). The boss
 * appliers that used to write straight onto the player — the pattern
 * `apply-status` step, the burrow's contact slow, the ground-zone hazard's slow
 * and sunder, the boss room debuff — and the engage sequence's landing root now
 * ask it too.
 *
 * Wiring smoke, per applier: the gate refuses, and without the gate the same
 * mechanic lands exactly as authored. Real boss pattern steps wherever one exists.
 * The gates are raised as bare statuses, the way any future source would raise
 * them.
 */
import {
  ABILITY_IMMUNITY_EFFECT_ID,
  ABILITY_UNYIELDING_EFFECT_ID,
  FROSTBITE_EFFECT_ID,
  FROZEN_STATUS_ID,
  MONSTER_DATABASE,
  SUNDERED_EFFECT_ID,
  SUN_MARK_EFFECT_ID,
  abilityImmunityKindKey,
  applyStatusEffect,
  getStatusEffect,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { updateMonsters } from '../src/systems/combat/ai/ai';
import { runningBossPatternDef, updateBossPatterns } from '../src/systems/combat/ai/bossPatterns';
import { updateBossScripts } from '../src/systems/combat/ai/bossScripts';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import { updateCombatState } from '../src/systems/combat/engine/combatState';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { publishPatternPool, publishToxicPool, updateGroundZones } from '../src/systems/world/groundZones';
import { World } from '../src/world/World';
import { NODE, arena, assert, pin, playerSlices, runUntil } from './_bossLineageHarness';

initCombatSystems();

const LONG_MS = 600_000;

// The arena harness pins Date.now and Math.random for its run; put them back after.
const REAL_NOW = Date.now;
const REAL_RANDOM = Math.random;
function restoreClock(): void {
  Date.now = REAL_NOW;
  Math.random = REAL_RANDOM;
}

/** Endure's Unyielding, raised as the bare status it is. */
function raiseUnyielding(player: PlayerEntity): void {
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_UNYIELDING_EFFECT_ID, maxStacks: 1, remainingMs: LONG_MS, refreshable: true,
    sourceId: player.isPlayer.id, data: { totalMs: LONG_MS },
  });
}

/** Cleanse's Immunity, carrying the refused kinds exactly as the keystone keys them. */
function raiseImmunity(player: PlayerEntity, ...kinds: string[]): void {
  const data: Record<string, number> = { totalMs: LONG_MS };
  for (const kind of kinds) data[abilityImmunityKindKey(kind)] = 1;
  applyStatusEffect(player.tracksCombat, {
    id: ABILITY_IMMUNITY_EFFECT_ID, maxStacks: 1, remainingMs: LONG_MS, refreshable: true,
    sourceId: player.isPlayer.id, data,
  });
}

type Gate = (player: PlayerEntity) => void;

/** A pattern boss aggroed onto a durable player at node-5-5, not yet ticked. */
function patternBoss(monsterId: string, playerAt: { x: number; y: number }, label: string, gate?: Gate) {
  const world = new World();
  const id = `gates-${label}`;
  const player = world.attachPlayerEntity(playerSlices(id, playerAt.x, playerAt.y, 100_000), id);
  gate?.(player);
  const pattern = MONSTER_DATABASE.get(monsterId)!.bossPattern!;
  const monster = world.createMonster(NODE, monsterId, { x: 400, y: 400 });
  assert(monster, `${monsterId} should spawn`);
  setAggroTarget(world, monster, { id, kind: 'player' }, 1_000);
  monster.hasAwareness.state = 'attacking';
  const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
  return { world, player, monster, armedAt };
}

/**
 * The pattern loop alone, in the real tick order (statuses age and the lockout
 * reconciles first), with no ordinary attacks: what lands is the pattern's.
 * Stops when `until` holds; returns whether it did.
 */
function runPattern(world: World, from: number, until: (now: number) => boolean, maxTicks = 300): boolean {
  let now = from;
  for (let i = 0; i < maxTicks; i++) {
    updateCombatState(world, 100);
    updateBossPatterns(world, 100, now);
    if (until(now)) return true;
    now += 100;
  }
  return false;
}

function stepName(monster: MonsterEntity): string | undefined {
  const state = monster.runsBossPattern;
  const step = state ? runningBossPatternDef(monster)?.steps[state.stepIndex] : undefined;
  return step && 'name' in step ? step.name : step?.kind;
}

function applyStatusStep(monsterId: string, name: string, patternId?: string) {
  const def = MONSTER_DATABASE.get(monsterId)!;
  const patterns = [def.bossPattern!, ...(def.bossPatternVariants ?? [])];
  const pattern = patterns.find((p) => !patternId || p.id === patternId)!;
  const step = pattern.steps.find((s) => s.kind === 'apply-status' && s.name === name);
  assert(step?.kind === 'apply-status', `${monsterId} should author ${name}`);
  return step;
}

// ── 1. Deep Freeze: Unyielding refuses the Frozen, and its lockout ───────────
for (const monsterId of ['frost-plated-rime-mammoth', 'glacial-patriarch']) {
  const step = applyStatusStep(monsterId, 'Deep Freeze');
  assert(step.effectId === FROZEN_STATUS_ID && !!step.requires, `${monsterId}: Deep Freeze applies Frozen behind its Chill gate`);
  const requires = step.requires!;

  const freeze = (label: string, gate?: Gate) => {
    const a = patternBoss(monsterId, { x: 405, y: 400 }, `${monsterId}-${label}`, gate);
    // Seed the room's Chill to the gate, one application per stack.
    for (let i = 0; i < requires.minStacks; i++) {
      applyStatusEffect(a.player.tracksCombat, {
        id: requires.effectId, maxStacks: requires.minStacks, remainingMs: 60_000,
        refreshable: true, sourceId: 'room', data: { totalMs: 60_000 },
      });
    }
    let frozen = false;
    let locked = false;
    let cast = false;
    const resolved = runPattern(a.world, a.armedAt, () => {
      if (stepName(a.monster) === 'Deep Freeze') cast = true;
      if (getStatusEffect(a.player.tracksCombat, FROZEN_STATUS_ID)) frozen = true;
      if (a.player.isRooted || a.player.cannotAttack) locked = true;
      // The freeze resolves the tick it spends the Chill that fed it.
      return cast && (getStatusEffect(a.player.tracksCombat, requires.effectId)?.stacks ?? 0) < requires.minStacks;
    });
    assert(cast && resolved, `${monsterId}/${label}: setup — Deep Freeze should cast and resolve`);
    return { frozen, locked };
  };

  const guarded = freeze('unyielding', raiseUnyielding);
  assert(!guarded.frozen, `${monsterId}: Unyielding refuses Deep Freeze's Frozen`);
  assert(!guarded.locked, `${monsterId}: and the lockout a Frozen would have synced`);

  const open = freeze('open');
  assert(open.frozen, `${monsterId}: without Unyielding, Deep Freeze freezes`);
  assert(open.locked, `${monsterId}: and the Frozen locks the player`);

  // Immunity is not Unyielding: Frozen is not a kind any Cleanse strips.
  const cleansed = freeze('immunity', (p) => raiseImmunity(p, 'slow', SUN_MARK_EFFECT_ID));
  assert(cleansed.frozen, `${monsterId}: Immunity of other kinds does not refuse the freeze`);
}

// ── 2. Frost Spikes: Unyielding refuses the pattern's root ───────────────────
{
  const monsterId = 'frost-plated-rime-mammoth';
  const step = applyStatusStep(monsterId, 'Frost Spikes', 'rime-frost-spikes');
  assert(step.effectId === 'slow' && step.data?.['speedMult'] === 0, 'Frost Spikes authors a zero-speed root');

  const spikes = (label: string, gate?: Gate) => {
    // Beyond 320px: the far posture arms Frost Spikes (a variant its script enables).
    const a = arena(monsterId, { x: 2400, y: 2400 }, { x: 2900, y: 2400 }, undefined, 'node-t3-tundra-dungeon');
    gate?.(a.player);
    updateBossScripts(a.world, 0);
    let rooted = false;
    const advanced = runUntil(a, () => {
      pin(a.player, { x: 2900, y: 2400 });
      if (getStatusEffect(a.player.tracksCombat, 'slow')?.data['speedMult'] === 0) rooted = true;
      return stepName(a.boss) === 'Advance';
    }, 8_000);
    restoreClock();
    assert(advanced, `${label}: setup — Frost Spikes should resolve into its Advance`);
    return rooted;
  };
  assert(!spikes('unyielding', raiseUnyielding), 'Unyielding refuses the Frost Spikes root');
  assert(spikes('open'), 'without Unyielding, Frost Spikes roots');
}

// ── 3. Death Sting and Numbing Sting: Immunity refuses the stripped kind ─────
{
  const monsterId = 'dune-stalker-emperor';
  const numbing = applyStatusStep(monsterId, 'Numbing Sting');
  const death = applyStatusStep(monsterId, 'Death Sting');
  assert(numbing.effectId === 'slow' && death.effectId === SUN_MARK_EFFECT_ID, 'the Emperor stings a slow and a Sun Mark');
  const numbingSpeed = numbing.data?.['speedMult'];

  const stings = (label: string, gate?: Gate) => {
    const a = patternBoss(monsterId, { x: 405, y: 400 }, `stings-${label}`, gate);
    // The payoff's cast start: both stings have resolved, nothing has cashed the mark.
    const reached = runPattern(a.world, a.armedAt, () => stepName(a.monster) === 'Execution');
    assert(reached, `${label}: setup — the sequence should reach the Execution`);
    return {
      slow: getStatusEffect(a.player.tracksCombat, 'slow'),
      mark: getStatusEffect(a.player.tracksCombat, SUN_MARK_EFFECT_ID),
    };
  };

  const noSlow = stings('immunity-slow', (p) => raiseImmunity(p, 'slow'));
  assert(!noSlow.slow, 'Immunity of the slow kind refuses Numbing Sting');
  assert(!!noSlow.mark, 'but not the Sun Mark, a kind it never stripped');

  const noMark = stings('immunity-mark', (p) => raiseImmunity(p, SUN_MARK_EFFECT_ID));
  assert(!noMark.mark, 'Immunity of the sun-mark kind refuses Death Sting');
  assert(noMark.slow?.data['speedMult'] === numbingSpeed, 'and Numbing Sting still lands');

  const open = stings('open');
  assert(open.slow?.data['speedMult'] === numbingSpeed, 'without Immunity, Numbing Sting slows as authored');
  assert(!!open.mark, 'and Death Sting marks');

  // A soft slow is not hard control: Unyielding lets it through.
  const endured = stings('unyielding', raiseUnyielding);
  assert(endured.slow?.data['speedMult'] === numbingSpeed, 'Unyielding does not refuse a soft slow');
}

// ── 4. Ground-zone hazards: the slow and the sunder ──────────────────────────
{
  // The Dreadbore's own sinkhole, laid under the player.
  const dreadbore = MONSTER_DATABASE.get('chitinous-dreadbore')!;
  const impact = dreadbore.bossPattern!.steps.find((s) => s.kind === 'impact' && s.pool);
  assert(impact?.kind === 'impact' && impact.pool, 'the Dreadbore eruption leaves a pool');
  const pool = impact.pool;
  assert((pool.slowSpeedMult ?? 1) < 1, 'its sinkhole slows');

  const sinkhole = (label: string, gate?: Gate) => {
    const world = new World();
    const id = `zone-${label}`;
    const player = world.attachPlayerEntity(playerSlices(id, 405, 400, 100_000), id);
    gate?.(player);
    const boss = world.createMonster(NODE, 'chitinous-dreadbore', { x: 1_400, y: 400 })!;
    publishPatternPool(world, boss, { x: 405, y: 400 }, pool, impact.radius, 1_000);
    updateGroundZones(world, 1_000);
    const first = getStatusEffect(player.tracksCombat, 'slow');
    // The hazard reapplies every tick it is stood in: still refused next tick.
    updateGroundZones(world, 1_100);
    return { first, second: getStatusEffect(player.tracksCombat, 'slow') };
  };
  const refused = sinkhole('immunity', (p) => raiseImmunity(p, 'slow'));
  assert(!refused.first && !refused.second, 'Immunity of the slow kind refuses the hazard slow, and its reapply');
  const open = sinkhole('open');
  assert(open.first?.data['speedMult'] === pool.slowSpeedMult && open.first?.data['isGroundZone'] === 1,
    'without Immunity, the hazard slows as authored');
  const endured = sinkhole('unyielding', raiseUnyielding);
  assert(endured.first?.data['speedMult'] === pool.slowSpeedMult, 'Unyielding does not refuse a soft hazard slow');

  // A sundering pool (no authored pool carries one today; the applier is generic).
  const sunder = (label: string, gate?: Gate) => {
    const world = new World();
    const id = `sunder-${label}`;
    const player = world.attachPlayerEntity(playerSlices(id, 405, 400, 100_000), id);
    gate?.(player);
    const boss = world.createMonster(NODE, 'chitinous-dreadbore', { x: 1_400, y: 400 })!;
    publishToxicPool(world, NODE, {
      kind: 'toxic-pool', pos: { x: 405, y: 400 }, radius: 120,
      startedAtMs: 1_000, expiresAtMs: 60_000, damagePerTick: 0, tickIntervalMs: 1_000,
      vulnerability: { damageTakenPct: 0.2, durationMs: 3_000 }, ownerId: boss.isMonster.id,
      killer: { monsterTypeId: boss.isMonster.monsterTypeId, monsterName: boss.isMonster.name, isBoss: true, nodeId: NODE },
    });
    updateGroundZones(world, 1_000);
    return getStatusEffect(player.tracksCombat, SUNDERED_EFFECT_ID);
  };
  assert(!sunder('immunity', (p) => raiseImmunity(p, SUNDERED_EFFECT_ID)), 'Immunity of the sundered kind refuses the hazard sunder');
  assert(sunder('open')?.data['damageTakenPct'] === 0.2, 'without Immunity, the hazard sunders');
}

// ── 5. The burrow's contact slow ─────────────────────────────────────────────
{
  const monsterId = 'chitinous-dreadbore';
  const def = MONSTER_DATABASE.get(monsterId)!;
  const conceal = def.bossPattern!.steps.find((s) => s.kind === 'conceal');
  assert(conceal?.kind === 'conceal' && conceal.contactSlow, 'the Dreadbore burrow pins on contact');
  const contactSpeed = conceal.contactSlow.speedMult;

  /** Burrow onto a sprinting player; the slow on the player the tick it surfaces. */
  const surface = (label: string, gate?: Gate) => {
    const world = new World();
    const id = `contact-${label}`;
    const player = world.attachPlayerEntity(playerSlices(id, 2_400, 2_400, 100_000), id);
    gate?.(player);
    const pattern = def.bossPattern!;
    const monster = world.createMonster(NODE, monsterId, { x: 2_400 - def.stats.attackRange, y: 2_400 })!;
    setAggroTarget(world, monster, { id, kind: 'player' }, 1_000);
    monster.hasAwareness.state = 'attacking';
    const armedAt = 1_000 + (pattern.initialCooldownMs ?? pattern.cooldownMs) + 1_000;
    monster.performsAttack.lastAttackAt = armedAt - monster.performsAttack.attackCooldown;
    updateBossPatterns(world, 100, armedAt);
    let now = armedAt;
    let sawConcealed = false;
    let surfaced = false;
    let slow: ReturnType<typeof getStatusEffect> | undefined;
    for (let i = 0; i < 260 && !monster.recoversFromPattern && !surfaced; i++) {
      world.tick(100, now);
      player.hasPosition.current = {
        x: player.hasPosition.current.x + player.hasPosition.speed * 0.1,
        y: player.hasPosition.current.y,
      };
      if (monster.isConcealed) sawConcealed = true;
      else if (sawConcealed) {
        surfaced = true;
        slow = getStatusEffect(player.tracksCombat, 'slow');
      }
      now += 100;
    }
    assert(sawConcealed && surfaced, `${label}: setup — the boss should burrow and surface`);
    return slow;
  };
  assert(!surface('immunity', (p) => raiseImmunity(p, 'slow')), 'Immunity of the slow kind refuses the contact slow');
  assert(surface('open')?.data['speedMult'] === contactSpeed, 'without Immunity, the contact slow pins as authored');
}

// ── 6. The boss room debuff ──────────────────────────────────────────────────
{
  const T3 = { id: 'frost-plated-rime-mammoth', node: 'node-t3-tundra-dungeon' };
  const room = (gate?: Gate) => {
    const a = arena(T3.id, { x: 2400, y: 2400 }, { x: 2650, y: 2400 }, undefined, T3.node);
    gate?.(a.player);
    // Frostbite's first stack lands after one interval (9.6 s).
    runUntil(a, () => { pin(a.player, { x: 2650, y: 2400 }); return false; }, 9_800);
    restoreClock();
    return getStatusEffect(a.player.tracksCombat, FROSTBITE_EFFECT_ID);
  };
  assert((room()?.stacks ?? 0) >= 1, 'the room lays Frostbite');
  assert((room(raiseUnyielding)?.stacks ?? 0) >= 1, 'Frostbite is not control: Unyielding lets it land');
  // Frostbite cannot be cleansed, so no Cleanse ever keys its kind; a record that
  // carries it anyway proves the room debuff asks the admission check.
  assert(!room((p) => raiseImmunity(p, FROSTBITE_EFFECT_ID)), 'the room debuff passes the Immunity gate');
}

// ── 7. The engage sequence's landing root (Savanna Hawk's Dive Bomb) ─────────
{
  const dive = (label: string, gate?: Gate) => {
    const world = new World();
    const id = `dive-${label}`;
    const player = world.attachPlayerEntity(playerSlices(id, 800, 400, 100_000), id);
    gate?.(player);
    const hawk = world.createMonster(NODE, 'savanna-hawk', { x: 400, y: 400 })!;
    updateMonsters(world, 0, 1_000);
    updateMonsters(world, 0, 2_000);
    hawk.hasPosition.current = { x: 789, y: 400 };
    updateMonsters(world, 0, 2_100);
    const landed = world.takeNodeEvents(NODE).some((e) =>
      e.kind === 'monster-engage-land' && e.targetId === player.isPlayer.id);
    assert(landed, `${label}: setup — the dive should land`);
    return getStatusEffect(player.tracksCombat, 'slow');
  };
  assert(!dive('unyielding', raiseUnyielding), 'Unyielding refuses the Dive Bomb root; the dive still lands');
  assert(dive('open')?.data['speedMult'] === 0, 'without Unyielding, the Dive Bomb roots');
}

console.log('bossGuardGates.test.ts: ok');
