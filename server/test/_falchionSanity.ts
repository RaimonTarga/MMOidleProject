/**
 * Falchion alpha-strike vs alpha-window sanity check (throwaway).
 *
 * Drives the REAL combat pipeline: a player armed with the authored passives
 * attacking a plating/DR-free dummy at its authored cadence, for a fixed fight
 * length. Reports total damage and the share attributable to the opener, the
 * Sunlight window, and the plain weapon.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  tickStatusEffectDurations,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import type { MonsterEntity, PlayerEntity } from '../src/ecs/entity';
import { initCombatSystems } from '../src/systems/combatBootstrap';
import { runPlayerAttack } from '../src/systems/combat/engine/combat';
import { World } from '../src/world/World';

const NODE = 'node-5-5';

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 100_000, maxHp: 100_000, recovery: 0 },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [], runesEquipped: [], knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

interface Design {
  name: string;
  mult: number;
  pct?: number;
  ms?: number;
}

interface Build {
  name: string;
  attack: number;
  aps: number;
}

const TICK_MS = 100;

function spawnDummy(world: World, x: number): MonsterEntity {
  const m = world.createMonster(NODE, 'stone-basilisk', { x, y: 400 })!;
  m.mitigatesDamage.plating = 0;
  m.mitigatesDamage.damageReduction = 0;
  if (m.evadesHits) m.evadesHits.dodgeRate = 0;
  m.hasHealth.maxHp = 1_000_000_000;
  m.hasHealth.hp = 1_000_000_000;
  return m;
}

/** One fight: a single fresh target, attacked at `aps` for `seconds`. */
function simulate(design: Design, build: Build, seconds: number) {
  const world = new World();
  const id = `${design.name}-${build.name}-${seconds}-${Math.random()}`;
  const player: PlayerEntity = world.attachPlayerEntity(makePlayerSlices(id), id);
  player.dealsDamage.attack = build.attack;
  const p = player.usesSkills.passives;
  if (design.mult > 1) p['weapon.first-strike-mult'] = design.mult;
  if (design.pct) p['weapon.first-strike-buff-damage-pct'] = design.pct;
  if (design.ms) p['weapon.first-strike-buff-duration-ms'] = design.ms;

  const target = spawnDummy(world, 420);
  const swingMs = 1000 / build.aps;

  let total = 0;
  let opener = 0;
  let hits = 0;
  let hitsInWindow = 0;
  let nextSwing = 0;

  for (let t = 0; t < seconds * 1000; t += TICK_MS) {
    while (nextSwing <= t) {
      const before = target.hasHealth.hp;
      const windowUp = player.tracksCombat.statusEffects.some(
        (e) => e.id === 'sunlight' && e.remainingMs > 0,
      );
      runPlayerAttack(world, player, target, t, {
        attackOrigin: player.hasPosition.current,
        aggroSource: { id: player.isPlayer.id, kind: 'player' },
      });
      const dmg = before - target.hasHealth.hp;
      total += dmg;
      hits++;
      if (hits === 1) opener = dmg;
      if (windowUp) hitsInWindow++;
      nextSwing += swingMs;
    }
    tickStatusEffectDurations(player.tracksCombat, TICK_MS);
  }
  return { total, hits, opener, hitsInWindow };
}

const CONTROL: Design = { name: 'no mechanic', mult: 1 };

function report(design: Design, build: Build, seconds: number) {
  const run = simulate(design, build, seconds);
  const base = simulate(CONTROL, build, seconds);
  const perHit = base.total / base.hits;
  const openerShare = run.opener - perHit;
  const windowShare = run.total - base.total - openerShare;
  return { ...run, baselineTotal: base.total, openerShare, windowShare };
}

const DESIGNS: Design[] = [
  { name: 'OLD T2 (x2.0)', mult: 2.0 },
  { name: 'NEW T2 (x1.4 +15%/4s)', mult: 1.4, pct: 0.15, ms: 4000 },
  { name: 'OLD T3 (x2.5)', mult: 2.5 },
  { name: 'NEW T3 (x1.5 +20%/5s)', mult: 1.5, pct: 0.20, ms: 5000 },
  { name: 'OLD T4 (x3.0)', mult: 3.0 },
  { name: 'NEW T4 (x1.6 +25%/6s)', mult: 1.6, pct: 0.25, ms: 6000 },
];

// Authored Falchion cadence is 0.80 aps. "Slow/heavy" is the Falchion itself;
// "fast/light" is a same-DPS-budget fast weapon carrying the same mechanic, which
// is the case the old design served worst.
const BUILDS: Build[] = [
  { name: 'slow/heavy  (atk 200, 0.80 aps)', attack: 200, aps: 0.80 },
  { name: 'fast/light  (atk  67, 2.40 aps)', attack: 67, aps: 2.40 },
];

const LENGTHS = [4, 10, 20, 30];

initCombatSystems();

for (const build of BUILDS) {
  console.log(`\n=== ${build.name} ===`);
  console.log(
    'design'.padEnd(24) + 'fight'.padStart(7) + 'hits'.padStart(6) +
    'total'.padStart(10) + 'vs base'.padStart(9) +
    'opener'.padStart(9) + 'window'.padStart(9) + 'base'.padStart(9) + 'lit'.padStart(7),
  );
  for (const design of DESIGNS) {
    for (const seconds of LENGTHS) {
      const r = report(design, build, seconds);
      const uplift = ((r.total / r.baselineTotal - 1) * 100).toFixed(1);
      const share = (v: number) => `${((v / r.total) * 100).toFixed(1)}%`;
      console.log(
        design.name.padEnd(24) +
        `${seconds}s`.padStart(7) +
        `${r.hits}`.padStart(6) +
        `${Math.round(r.total)}`.padStart(10) +
        `+${uplift}%`.padStart(9) +
        share(r.openerShare).padStart(9) +
        share(r.windowShare).padStart(9) +
        share(r.baselineTotal).padStart(9) +
        `${r.hitsInWindow}`.padStart(7),
      );
    }
    console.log('');
  }
}
