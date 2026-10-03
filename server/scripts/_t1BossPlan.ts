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
 *   tsx scripts/_t1BossPlan.ts --out=plan.json --matrix=composition [--seeds=10]
 *                              [--weapons=rapier,axe] [--classes=...] [--bosses=...]
 *                              [--tier=2] [--leans]
 *
 * `--matrix=composition` is the course-correction lean × verb matrix (W3-A): see the
 * block that builds it below. `--tier=2` is its T2 instrument (verbs-that-fire B).
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
import { ITEM_DATABASE, LINEAGE_DATABASE, TUTORIAL_CLASS_PLANS, tutorialRunes, T1_BIOME_ORDER, type T1Biome } from '@mmo-idle/shared';
import { bandFormOf, compositionPairs, leanOnlyPairs, weaponLineages } from '../bench/lineage/compositionPairs';

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
 * The same five biomes one tier up: each T1 biome's T2 dungeon boss
 * (`_t1BossLab.ts`'s `BOSS_NODE`). The T2 composition matrix fights these, so a
 * T2 pair is read on the encounter set its own tier's player meets, biome for
 * biome, against the T1 pair on the T1 set.
 */
const T2_BOSS_BY_BIOME: Record<T1Biome, string> = {
  plains: 'gorging-razortusk',
  forest: 'apex-timberclaw',
  swamp: 'mire-gorged-behemoth',
  mountain: 'stoneplate-juggernaut',
  cave: 'chitinous-dreadbore',
};

/**
 * The tier-2 counterpart of a tier-1 armour / charm / boot: the same lineage's
 * tier-2 form in the SAME biome — the derivation the lane bench's band-2
 * references use (`t2CounterpartItem`, `bot/src/tierEntry/profiles.ts`), so the
 * T2 kit is the tutorial kit one tier up and nothing else.
 */
function t2Counterpart(recipeId: string): string {
  for (const lineage of LINEAGE_DATABASE.values()) {
    const t1 = lineage.forms.find((f) => f.recipeId === recipeId && f.tier === 1);
    if (!t1) continue;
    const t2 = lineage.forms.find((f) => f.tier === 2 && f.biome === t1.biome);
    assert(t2, `${recipeId}: its lineage has no same-biome tier-2 form`);
    return t2.recipeId;
  }
  throw new Error(`${recipeId}: belongs to no lineage, so it has no tier-2 counterpart`);
}

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
const onlyWeapons = args.weapons?.split(',');
if (args.armor) assert(ITEM_DATABASE.get(args.armor)?.slot === 'armor', `--armor=${args.armor} is not armour`);

const rows: unknown[] = [];

/**
 * `--matrix=composition` (course-correction W3-A): the lean × verb composition
 * matrix. Every live weapon lineage's nine T1 pairs plus its no-band control
 * (`bench/lineage/compositionPairs.ts`), on every tutorial class, against every
 * boss, with the class's tutorial boss kit EXCEPT the weapon, which is the
 * lineage's T1 form — a lineage pays only while its own form is worn, so the pair
 * is measured on a character wearing it, against the same character with the form
 * and no cards. The lab buys the band through the real economy handler.
 *
 * Row ids are `cmp-<lineage>-<lean>×<verb>|<class>|<boss>|<seed>` (the control is
 * `cmp-<lineage>-control|...`), so `_t1BossMatrix.ts` groups each pair as one
 * candidate. Rows are `compact`: the matrix is ~15k fights and the per-second HP
 * track is not what it reads. `--seeds` defaults to 10 here.
 *
 * `--tier=2` (verbs-that-fire B, design §24.9) is the same matrix one tier up: the
 * lineage's band-2 form (`bandFormOf`) with its T2 lean and T2 verb (or no cards,
 * the control), the T2 counterpart of every other kit item, a tier-2 character
 * (the balanced frame, `tier: 2`), against each T1 biome's T2 boss. Ids are
 * `cmpt2-<lineage>-<pair>|...`, so a T1 and a T2 reading never share a key.
 */
if (args.matrix === 'composition') {
  const seeds = SEEDS.slice(0, Number(args.seeds ?? 10));
  const tier = Number(args.tier ?? 1);
  assert(tier === 1 || tier === 2, `--tier must be 1 or 2, got ${args.tier}`);
  const bossOf = tier === 1 ? BOSS_BY_BIOME : T2_BOSS_BY_BIOME;
  const prefix = tier === 1 ? 'cmp' : `cmpt${tier}`;
  for (const cls of TUTORIAL_CLASS_PLANS) {
    const name = cls.className.toLowerCase();
    if (onlyClasses && !onlyClasses.includes(name)) continue;
    for (const lineage of weaponLineages()) {
      if (onlyWeapons && !onlyWeapons.includes(lineage.id)) continue;
      const form = bandFormOf(lineage, tier);
      // `--leans`: the band's three leans ALONE (no verb, no control) — the
      // decomposition rows `t2CompositionReport.ts` reads the verb's own share from.
      for (const pair of args.leans ? leanOnlyPairs(lineage, tier) : compositionPairs(lineage, tier)) {
        for (const biome of T1_BIOME_ORDER) {
          const boss = bossOf[biome];
          if (onlyBosses && !onlyBosses.includes(boss)) continue;
          const t1Kit = kitFor(cls, biome);
          const kit = tier === 1
            ? { ...t1Kit, weapon: form }
            : {
              ...t1Kit, weapon: form,
              armor: t2Counterpart(t1Kit.armor), charm: t2Counterpart(t1Kit.charm), boots: t2Counterpart(t1Kit.boots),
            };
          for (const seed of seeds) {
            rows.push({
              id: `${prefix}-${lineage.id}-${pair.label}|${name}|${boss}|${seed}`,
              boss, cls: name, seed, tier, upgrade: tier === 1 ? 5 : 0, jitter: true, compact: true,
              ...kit,
              rules: tutorialRunes(cls.movement, 'final', cls.classRoot),
              lineage: lineage.id, lean: pair.leanCardId, verb: pair.verbCardId,
            });
          }
        }
      }
    }
  }
  writeFileSync(args.out!, JSON.stringify(rows));
  console.log(`composition matrix: ${rows.length} rows -> ${args.out}`);
  process.exit(0);
}

/**
 * `--matrix=tutorial-rapier` — a DIAGNOSTIC, not the tutorial kit (course-correction
 * W3-A item 4). The tutorial (W3-B) buys a lean and a verb on the Rapier, but every
 * boss kit wears the Chaotic Axe or the Poison Dagger, and a lineage pays only while
 * its own form is worn — so in the seal and gate fights those two cards do nothing.
 * This plan is the baseline plan with ONE change, the Rapier swapped in as the
 * weapon, run twice: with the class's own tutorial lean + verb (`diag-rapier-<pair>`)
 * and with no cards (`diag-rapier-control`) — what the bought pair would do in those
 * fights if the guide kept the Rapier on.
 *
 * The picks mirror `weaponCards` in W3-B's `TUTORIAL_CLASS_PLANS`
 * (feat/cc-tutorial, `shared/src/tutorial/scripts/plans.ts`), which this branch
 * does not have yet; read them from there once merged.
 */
// The tutorial's own pair per class, read from the plan it teaches
// (`TUTORIAL_CLASS_PLANS[*].weaponCards`, course-correction W3-B) rather than copied,
// so a change of pick moves the diagnostic with it. The label is the two lanes.
const laneOfCard = (cardId: string): string =>
  LINEAGE_DATABASE.get('rapier')?.cards.find((c) => c.id === cardId)?.lane ?? cardId;
if (args.matrix === 'tutorial-rapier') {
  const seeds = SEEDS.slice(0, nSeeds);
  for (const cls of TUTORIAL_CLASS_PLANS) {
    const name = cls.className.toLowerCase();
    if (onlyClasses && !onlyClasses.includes(name)) continue;
    const cards = cls.weaponCards;
    assert(cards, `${name}: no tutorial Rapier pair`);
    const pick = { ...cards, label: `${laneOfCard(cards.lean)}×${laneOfCard(cards.verb)}` };
    for (const withCards of [true, false]) {
      for (const biome of T1_BIOME_ORDER) {
        const boss = BOSS_BY_BIOME[biome];
        if (onlyBosses && !onlyBosses.includes(boss)) continue;
        const kit = { ...kitFor(cls, biome), weapon: 'flash-rapier' };
        for (const seed of seeds) {
          rows.push({
            id: `diag-rapier-${withCards ? pick.label : 'control'}|${name}|${boss}|${seed}`,
            boss, cls: name, seed, tier: 1, upgrade: 5, jitter: true, compact: true,
            ...kit,
            rules: tutorialRunes(cls.movement, 'final', cls.classRoot),
            lineage: 'rapier', lean: withCards ? pick.lean : null, verb: withCards ? pick.verb : null,
          });
        }
      }
    }
  }
  writeFileSync(args.out!, JSON.stringify(rows));
  console.log(`tutorial-rapier diagnostic: ${rows.length} rows -> ${args.out}`);
  process.exit(0);
}

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
