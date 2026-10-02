/**
 * Plan generator for the T1 boss pass (2026-10-02, docs/briefs/t1-boss-pass-2026-10-02.md).
 *
 * Emits `_t1BossLab.ts` rows for the six-class x five-boss win-rate matrix, with each
 * class's kit read straight out of `TUTORIAL_CLASS_PLANS` rather than retyped here, so
 * the lab fights what the guide actually equips at the seal: the class's `bossKit`
 * (weapon / charm / boots), the per-boss armour, technique and guard, and the
 * tutorial's own `final` Rune stage. Everything is at GM 30 and +5, which is where the
 * script's boss chapter sits (every zone mastered before the first seal).
 *
 * Two things this is deliberately NOT: it buys no lineage band (`materializeBot`, see
 * the run-4 report) and the melee plans' swap to the Chaotic Axe leaves the one card
 * the guide teaches inert. Both make this the FLOOR a real player sits on.
 *
 *   tsx scripts/_t1BossPlan.ts --out=plan.json [--cand=base] [--seeds=20] [--fixed]
 *                              [--classes=striker,squire] [--bosses=crag-behemoth]
 *                              [--armor=forest-vest-t1]
 *
 * `--armor` is a DIAGNOSTIC, not a candidate: it replaces the per-boss armour every
 * class wears, to price the tutorial's armour choice against a boss nerf. It exists
 * because the Greatbear is authored as the evasion exam and the Toadeater as the DoT
 * exam, and in each case the only class that beats it is the one whose tutorial
 * armour happens to carry the counter.
 *
 * Rows carry the lab's seeded approach geometry (`jitter`) by default, because
 * without it a solo T1 boss fight is deterministic and a win rate can only be 0% or
 * 100% -- see the field's own comment in `_t1BossLab.ts`. `--fixed` returns to the one
 * fixed spawn point, which is the right mode for reading a single fight's mechanics.
 */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { ITEM_DATABASE, TUTORIAL_CLASS_PLANS, tutorialRunes, T1_BIOME_ORDER, type T1Biome } from '@mmo-idle/shared';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

const BOSS_BY_BIOME: Record<T1Biome, string> = {
  plains: 'tusked-razorback',
  forest: 'gnarled-greatbear',
  swamp: 'grave-toadeater',
  mountain: 'crag-behemoth',
  cave: 'obsidian-broodmother',
};

/**
 * Thirty seeds. The 70% floor lands on a whole fight (21/30) and the binomial spread
 * on a cell near the floor is about +/-16 points at 95%, which is the resolution this
 * pass actually has -- a 21/30 and a 24/30 are not distinguishable, and the report
 * says so rather than reading a 3-point move as a result. The first three are
 * `SURVEY_SEEDS`, so the three-seed numbers in the run-4 report stay readable as a
 * subset of this matrix rather than a separate measurement.
 */
const SEEDS = [173, 947, 2027, 3331, 4409, 5501, 6607, 7717, 8821, 9929,
  11027, 12133, 13241, 14351, 15463, 16577, 17693, 18811, 19931, 21053,
  22171, 23291, 24413, 25537, 26663, 27791, 28921, 30053, 31187, 32323];

/**
 * Tuning candidates. Each is a `bp` block the lab installs on top of the live
 * definition, so a candidate and the baseline share their seeds exactly and the only
 * moving part is the number under test. `base` is the live numbers.
 */
const CANDIDATES: Record<string, Record<string, Record<string, number>>> = {
  base: {},

  /**
   * The numbers as they stood BEFORE the 2026-10-02 pass, so the before and after
   * matrices run on the same lab build and the comparison is not confounded by the
   * instrumentation that landed alongside the tuning. This is also the pass's own
   * revert list, expressed as data.
   */
  'pre-pass': {
    'crag-behemoth': { 'stats.attack': 56 },
    'gnarled-greatbear': { 'stats.hp': 1800, 'stats.attack': 18 },
    'grave-toadeater': { 'stats.hp': 2100 },
  },

  // ---- Crag Behemoth (decision 3: the dominant hit's magnitude or multiplier) ----
  // `stats.attack` is the magnitude BOTH the Crag Charge and the ordinary swing scale
  // from, which is why it is the single lever here: the measured mechanism is a
  // sawtooth (the Striker arrives at each charge lower than the last), not one hit in
  // isolation, so trimming only `damageMultiplier` would leave the grind that puts the
  // Striker at 46% when the charge lands. `mult` rows are the alternative, kept so the
  // designer can see what the other half of decision 3 buys.
  'beh-atk53': { 'crag-behemoth': { 'stats.attack': 53 } },
  'beh-atk52': { 'crag-behemoth': { 'stats.attack': 52 } },
  'beh-atk50': { 'crag-behemoth': { 'stats.attack': 50 } },
  'beh-atk48': { 'crag-behemoth': { 'stats.attack': 48 } },
  'beh-atk46': { 'crag-behemoth': { 'stats.attack': 46 } },
  'beh-atk42': { 'crag-behemoth': { 'stats.attack': 42 } },
  'beh-mult165': { 'crag-behemoth': { 'bossPattern.damageMultiplier': 1.65 } },
  'beh-mult150': { 'crag-behemoth': { 'bossPattern.damageMultiplier': 1.5 } },

  // ---- Gnarled Greatbear (decision 4: whole-fight pressure, HP and/or attack) ----
  // Its Frenzy stacks attack speed 1.20x every 6 s with NO cap, so the loss mechanism
  // is "the fight lasts long enough for the ramp to win". Cutting HP shortens the ramp
  // window AND closes the measured margin at once, without the stack cap the data
  // file's own comment rules out (a capped boss stops casting and gets HARDER).
  'bear-hp1500': { 'gnarled-greatbear': { 'stats.hp': 1500 } },
  'bear-hp1350': { 'gnarled-greatbear': { 'stats.hp': 1350 } },
  'bear-hp1200': { 'gnarled-greatbear': { 'stats.hp': 1200 } },
  'bear-atk16': { 'gnarled-greatbear': { 'stats.attack': 16 } },
  'bear-atk15': { 'gnarled-greatbear': { 'stats.attack': 15 } },
  'bear-atk14': { 'gnarled-greatbear': { 'stats.attack': 14 } },
  'bear-atk13': { 'gnarled-greatbear': { 'stats.attack': 13 } },
  // Both single levers CLIFF -- HP goes 43% -> 100% between 1350 and 1200, attack
  // 43% -> 100% between 15 and 13 -- so neither alone can leave the melee pair in a
  // band. These pair a shorter fight with a smaller claw.
  'bear-hp1600-atk15': { 'gnarled-greatbear': { 'stats.hp': 1600, 'stats.attack': 15 } },
  'bear-hp1500-atk16': { 'gnarled-greatbear': { 'stats.hp': 1500, 'stats.attack': 16 } },
  'bear-hp1500-atk15': { 'gnarled-greatbear': { 'stats.hp': 1500, 'stats.attack': 15 } },
  'bear-hp1350-atk16': { 'gnarled-greatbear': { 'stats.hp': 1350, 'stats.attack': 16 } },
  'bear-hp1450-atk16': { 'gnarled-greatbear': { 'stats.hp': 1450, 'stats.attack': 16 } },
  'bear-hp1400-atk16': { 'gnarled-greatbear': { 'stats.hp': 1400, 'stats.attack': 16 } },
  'bear-hp1700-atk15': { 'gnarled-greatbear': { 'stats.hp': 1700, 'stats.attack': 15 } },
  // The ramp itself, for the designer's comparison: a SMALLER step, not the stack cap
  // the data file rules out. 1.20^5 = 2.49x attack speed by 29 s; 1.14^5 = 1.93x.
  'bear-frenzy114': { 'gnarled-greatbear': { 'bossScript.repeating.0.actions.0.actions.0.mult': 1.14 } },
  'bear-hp1600-frenzy114': { 'gnarled-greatbear': { 'stats.hp': 1600, 'bossScript.repeating.0.actions.0.actions.0.mult': 1.14 } },

  // ---- Grave Toadeater (step 4: below the floor, smallest lever) ----
  // The attrition exam, and the losses are near-misses, so HP is the lever that keeps
  // every mechanic at its authored size and only shortens the window they work in.
  'toad-hp1900': { 'grave-toadeater': { 'stats.hp': 1900 } },
  'toad-hp1750': { 'grave-toadeater': { 'stats.hp': 1750 } },
  'toad-hp1600': { 'grave-toadeater': { 'stats.hp': 1600 } },
  'toad-pool2': { 'grave-toadeater': { 'chargedAttack.pool.damagePerTick': 2 } },
  'toad-dot1': { 'grave-toadeater': { 'dotEffect.damagePerStack': 1 } },
};

function kitFor(cls: (typeof TUTORIAL_CLASS_PLANS)[number], biome: T1Biome) {
  const slots: Record<string, string> = {};
  for (const id of cls.bossKit) {
    const slot = ITEM_DATABASE.get(id)?.slot;
    assert(slot, `${cls.className}: unknown boss-kit item ${id}`);
    assert(!slots[slot], `${cls.className}: two ${slot} items in bossKit`);
    slots[slot] = id;
  }
  const loadout = cls.bosses[biome];
  assert(ITEM_DATABASE.get(loadout.armor)?.slot === 'armor', `${cls.className}/${biome}: ${loadout.armor} is not armour`);
  return {
    weapon: slots['weapon']!, charm: slots['recovery']!, boots: slots['mobility']!,
    armor: args.armor ?? loadout.armor, techniques: [loadout.technique], guards: [loadout.guard],
  };
}

/**
 * What the adopted rows LEAN ON. Not tuning candidates: each zeroes one tutorial
 * ability's key effect on top of whatever boss numbers are live, so the ability pass
 * can see how much of each win rate it is holding up before it changes one. Run these
 * against `final`, not `base` -- the question is what the tuned matrix depends on.
 */
const ABILITY_CANDIDATES: Record<string, Record<string, { field: string; values: number[] }>> = {
  // Expose Weakness is the technique in four of the five boss loadouts.
  'abl-no-expose': { 'expose-weakness': { field: 'damageTakenPct', values: [0, 0, 0, 0] } },
  // Second Wind is the guard in four of five, and it is a Recovery activation --
  // `recoveryPct` is the fraction of the flat rate it switches on.
  'abl-no-secondwind': { 'second-wind': { field: 'recoveryPct', values: [0, 0, 0, 0] } },
  // Sweep's cleave only matters where there are adds, i.e. the Razorback.
  'abl-no-sweep': { 'sweep': { field: 'splashPct', values: [0, 0, 0, 0] } },
};

const cand = args.cand ?? 'base';
const ap = ABILITY_CANDIDATES[cand];
const bp = ap ? {} : CANDIDATES[cand];
assert(bp, `unknown candidate ${cand} (have: ${[...Object.keys(CANDIDATES), ...Object.keys(ABILITY_CANDIDATES)].join(', ')})`);
const nSeeds = Number(args.seeds ?? SEEDS.length);
assert(nSeeds >= 1 && nSeeds <= SEEDS.length, `seeds must be 1..${SEEDS.length}`);
const onlyClasses = args.classes?.split(',');
const onlyBosses = args.bosses?.split(',');
if (args.armor) assert(ITEM_DATABASE.get(args.armor)?.slot === 'armor', `--armor=${args.armor} is not armour`);

const rows: unknown[] = [];
for (const cls of TUTORIAL_CLASS_PLANS) {
  const name = cls.className.toLowerCase();
  if (onlyClasses && !onlyClasses.includes(name)) continue;
  for (const biome of T1_BIOME_ORDER) {
    const boss = BOSS_BY_BIOME[biome];
    if (onlyBosses && !onlyBosses.includes(boss)) continue;
    const kit = kitFor(cls, biome);
    for (const seed of SEEDS.slice(0, nSeeds)) {
      rows.push({
        id: `${cand}${args.armor ? `+${args.armor}` : ''}|${name}|${boss}|${seed}`,
        boss, cls: name, seed, tier: 1, upgrade: 5,
        ...(args.fixed ? {} : { jitter: true }),
        ...kit,
        rules: tutorialRunes(cls.movement, 'final', cls.classRoot),
        ...(Object.keys(bp).length > 0 ? { bp } : {}),
        ...(ap ? { ap } : {}),
      });
    }
  }
}

writeFileSync(args.out!, JSON.stringify(rows, null, 1));
console.log(`${cand}: ${rows.length} rows -> ${args.out}`);
