// Conduit/Summoner formation attack packets split one offense budget across
// several physical bodies, so each packet used to pay the target's FULL flat
// Plating on its own share of the damage. Reload already solves the same
// shape of problem (many partial-damage packets vs one full hit) by setting
// `ctx.platingMult = 0.5` in its `beforeAttack` listener; this suite covers
// the same compensation applied to every formation contributor at the shared
// seam in `runPlayerAttack` (see combat.ts, right after `ctx.formation` is
// resolved).
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/formationPlatingCompensation.test.ts

import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { World } from '../src/world/World';
import { syncArchetypeSlices } from '../src/ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import {
  registerCombatListener,
  type FormationAttackContribution,
} from '../src/systems/combat/engine/combatPipeline';
import { applyPlayerAoe } from '../src/systems/combat/damage/aoeDamage';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function eq(actual: number, expected: number, message: string): void {
  assert(Math.abs(actual - expected) < 1e-8, `${message}: got ${actual}, expected ${expected}`);
}

const NODE = 'node-clearing';
let serial = 0;

function makeSlices(opts: {
  archetype: 'reload' | 'summoner' | null;
  selectedSubVariant?: string | null;
  selectedRange?: string | null;
  unlockedSkills?: string[];
}): PersistedPlayerSlices {
  const id = `plating-comp-${serial++}`;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000_000, maxHp: 1_000_000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0, essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [],
      questProgress: {}, playerTier: 4, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: opts.unlockedSkills ?? (opts.archetype ? [`${opts.archetype}-root`] : []),
      passives: {},
      selectedClass: opts.archetype ? `${opts.archetype}-root` : null,
      selectedSubVariant: opts.selectedSubVariant ?? null,
      selectedRange: opts.selectedRange ?? null,
      combatArchetype: opts.archetype,
    },
  };
}

function attach(world: World, opts: Parameters<typeof makeSlices>[0]): PlayerEntity {
  const slices = makeSlices(opts);
  const player = world.attachPlayerEntity(slices, slices.isPlayer.id);
  syncArchetypeSlices(world, player);
  recalculatePlayerEntityStats(world, player);
  return player;
}

function targetFor(world: World, plating: number, dr: number): MonsterEntity {
  const target = world.createMonster(NODE, 'plains-slime', { x: 450, y: 400 });
  if (!target) throw new Error('missing target');
  target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
  target.mitigatesDamage.plating = plating;
  target.mitigatesDamage.damageReduction = dr;
  return target;
}

function packet(weight: number, tag: string): FormationAttackContribution {
  return {
    ownerId: 'owner', physicalEntityId: `summon-${tag}`, slotId: `normal:${tag}`,
    directDamageWeight: weight,
    onHitMagnitudeWeight: weight,
    secondaryEffectMult: 1,
    procWeight: weight,
    tempoWeight: weight,
    targetId: 'target',
    cycleSerial: 0,
    cycleCompleted: true,
    side: 'summon',
  };
}

initCombatSystems();

// Probe: registered AFTER initCombatSystems(), so it runs LAST among every
// beforeAttack listener (registration order = execution order) and observes
// the fully-resolved platingMult for the attack, regardless of whether a
// later guard (e.g. reload's empty-clip check) goes on to cancel the swing.
let lastPlatingMult: number | undefined;
registerCombatListener('beforeAttack', (ctx) => {
  if (ctx.attackerType === 'player') lastPlatingMult = ctx.platingMult;
});

function directAttack(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  formation: FormationAttackContribution | undefined,
  aggroKind: 'player' | 'minion',
): { damage: number; platingMult: number | undefined } {
  lastPlatingMult = undefined;
  const before = target.hasHealth.hp;
  runPlayerAttack(world, player, target, 1_000, {
    attackOrigin: player.hasPosition.current,
    aggroSource: { id: player.isPlayer.id, kind: aggroKind },
    formation,
  });
  return { damage: before - target.hasHealth.hp, platingMult: lastPlatingMult };
}

// 1. A normal non-Summoner direct attack still uses platingMult = 1.
{
  const world = new World();
  const player = attach(world, { archetype: null });
  const target = targetFor(world, 40, 0);
  player.dealsDamage.attack = 100;
  const res = directAttack(world, player, target, undefined, 'player');
  eq(res.platingMult!, 1, 'plain direct attack must keep platingMult at 1');
  eq(res.damage, 60, 'plain direct attack damage must use full plating');
}

// 2. Reload still uses its existing 0.5 behavior.
{
  const world = new World();
  const player = attach(world, { archetype: 'reload' });
  const target = targetFor(world, 40, 0);
  player.dealsDamage.attack = 100;
  const res = directAttack(world, player, target, undefined, 'player');
  eq(res.platingMult!, 0.5, 'reload must keep its existing 0.5 plating compensation');
}

// 3. A Conduit/Summoner formation packet uses 0.5.
{
  const world = new World();
  const player = attach(world, { archetype: null });
  const target = targetFor(world, 40, 0);
  player.dealsDamage.attack = 100;
  const res = directAttack(world, player, target, packet(1, 'solo'), 'minion');
  eq(res.platingMult!, 0.5, 'a formation packet must receive the 0.5 plating compensation');
  eq(res.damage, 80, 'formation packet damage must reflect the halved effective plating');
}

// 4/5/6. Count-scaling behavior: the swarm must remain worse into Plating
// than a low-count formation (compensation is per-packet, never 1/count),
// and a high enough count (Endless Swarm's shape) must not become neutral.
{
  const world = new World();
  const player = attach(world, { archetype: null });
  player.dealsDamage.attack = 1_000;
  const plating = 40;

  // Low-count / Colossus-style: one packet carries the whole offense budget.
  const loTarget = targetFor(world, plating, 0);
  const lo = directAttack(world, player, loTarget, packet(1, 'colossus'), 'minion');
  eq(lo.platingMult!, 0.5, 'a single-body fixed formation gets exactly the same 0.5, no extra compensation');

  // High-count: five packets splitting the same total budget evenly.
  const hiTarget = targetFor(world, plating, 0);
  let hiTotal = 0;
  for (let i = 0; i < 5; i++) {
    const hit = directAttack(world, player, hiTarget, packet(0.2, `hi${i}`), 'minion');
    eq(hit.platingMult!, 0.5, 'every high-count packet gets the same flat 0.5, never 1/count');
    hiTotal += hit.damage;
  }

  const loTax = 1_000 - lo.damage;
  const hiTax = 1_000 - hiTotal;
  assert(hiTax > loTax,
    `a high-count formation must pay more total plating tax per logical cycle than a low-count one: lo=${loTax} hi=${hiTax}`);

  // Endless-Swarm-shaped count (8 equal bodies): still not plating-neutral.
  const swarmTarget = targetFor(world, plating, 0);
  let swarmTotal = 0;
  for (let i = 0; i < 8; i++) {
    swarmTotal += directAttack(world, player, swarmTarget, packet(1 / 8, `swarm${i}`), 'minion').damage;
  }
  assert(swarmTotal < 1_000,
    `Endless Swarm packets must still pay a plating tax, not become plating-neutral: got ${swarmTotal}`);
}

// 7. Battle Bond's Conduit-side contribution (built implicitly inside
// runPlayerAttack from the player's own resolved SummonerProfile, not passed
// via opts.formation) receives the same rule.
{
  const world = new World();
  const player = attach(world, {
    archetype: 'summoner',
    selectedSubVariant: 'heavy',
    selectedRange: 'summoner-range-far',
    unlockedSkills: ['summoner-root', 'summoner-heavy', 'summoner-range-far', 'summoner-heavy-t3-b'],
  });
  const target = targetFor(world, 40, 0);
  player.dealsDamage.attack = 100;
  const res = directAttack(world, player, target, undefined, 'player');
  eq(res.platingMult!, 0.5, "Battle Bond's Conduit-side formation contribution must get the same 0.5");
}

// 8. Zero-Plating targets produce unchanged damage (direct and formation).
{
  const world = new World();
  const player = attach(world, { archetype: null });
  player.dealsDamage.attack = 100;
  const direct = directAttack(world, player, targetFor(world, 0, 0), undefined, 'player');
  const formation = directAttack(world, player, targetFor(world, 0, 0), packet(1, 'zero'), 'minion');
  eq(direct.damage, 100, 'zero plating: plain direct attack is unaffected');
  eq(formation.damage, 100, 'zero plating: formation packet is unaffected by the compensation change');
}

// 9. AoE (a separate, non-runPlayerAttack damage path) is untouched: it keeps
// hardcoding platingMult = 1 regardless of the attacker running a formation.
{
  const world = new World();
  const player = attach(world, {
    archetype: 'summoner',
    selectedSubVariant: 'heavy',
    selectedRange: 'summoner-range-far',
    unlockedSkills: ['summoner-root', 'summoner-heavy', 'summoner-range-far', 'summoner-heavy-t3-b'],
  });
  const target = targetFor(world, 40, 0);
  const before = target.hasHealth.hp;
  applyPlayerAoe(world, player, target.hasPosition.current, 999, 100);
  const dealt = before - target.hasHealth.hp;
  eq(dealt, 60, 'AoE damage must keep applying full plating, untouched by the formation compensation');
}

console.log('formationPlatingCompensation: ok');
