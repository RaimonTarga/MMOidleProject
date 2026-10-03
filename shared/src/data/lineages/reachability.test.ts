/**
 * Every band has to be finishable in the biome it gates on (design §21).
 *
 * A lineage band of tier N is earned in the biome of the form worn at tier N —
 * its DOOR biome — and a biome has only six levels of content per tier it spans,
 * so a band and its door can disagree. They did: before §21 the band gated on the
 * lineage's HOME biome, which is only ever the T1 door, so the Rapier's T3 rows
 * asked for Forest 14–17 against a Forest that stops at 12, and the Axe's T4 rows
 * asked for Cave 19–23 against a Cave that stops at 18. Those cards were not
 * expensive, they were unbuyable.
 *
 * This walks EVERY live lineage, EVERY tier, EVERY form, with no allowlist, and
 * asks four questions of each door. A PARKED lineage (design §24.5: every armour,
 * charm and boots tree) has no doors — its forms are plain recipes crafted at
 * their biome level — so it is skipped, and review finding P4 (its unbuyable
 * T3/T4 cards) is moot until it returns:
 *
 *   1. Is the door biome real, and alive at the form's own tier? A T4 form behind
 *      a Forest door is a dead door — the Forest retires after T2.
 *   2. Can that biome reach every row of the band, at the authored cap it will
 *      ever have (`BIOME_FINAL_TIER_BY_GROUP`)? This is the floor the whole fix
 *      stands on.
 *   3. Can it reach them AT THE BAND'S OWN TIER, without ascending past it? A row
 *      you can only buy after you have outgrown the band is a row you never buy.
 *   4. Is the gate into the form payable at the earliest tier a player could be
 *      standing at it?
 *
 * It also pins the invariant that makes "T1 and T2 are unchanged in practice"
 * true: a band's position WITHIN its tier is the same whichever door you came
 * through. The door decides where you grind, never how far in.
 *
 * Run: node --conditions=development --import tsx shared/src/data/lineages/reachability.test.ts
 */
import {
  BIOME_FINAL_TIER_BY_GROUP, BIOME_LEVELS_PER_TIER, BIOME_START_TIER_BY_GROUP,
  biomeLevelCap,
} from '../../config/gameConfig';
import { liveLineages } from './index';
import { MAX_LINEAGE_TIER, rowsForTier } from './magnitudes';
import { bandBiomeFloor, bandBiomeLevel, formGateBiomeLevel } from './resolve';

const problems: string[] = [];
function check(cond: boolean, msg: string): void {
  if (!cond) problems.push(msg);
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

// ─── 1. Every door is reachable, every band finishable behind it ─────────────

let doorsWalked = 0;

for (const lineage of liveLineages()) {
  for (const form of lineage.forms) {
    const biome = form.biome;
    const start = BIOME_START_TIER_BY_GROUP[biome];
    const final = BIOME_FINAL_TIER_BY_GROUP[biome];
    const where = `${lineage.id} T${form.tier} '${form.recipeId}' (${biome} door)`;

    if (start === undefined || final === undefined) {
      problems.push(`${where}: '${biome}' is not a biome group with authored nodes`);
      continue;
    }
    // A door into a biome whose content does not span the form's tier is a door
    // the player can never be standing at.
    check(start <= form.tier, `${where}: the ${biome} does not exist until T${start}`);
    check(final >= form.tier, `${where}: the ${biome} retires after T${final}`);

    // The cap this biome will EVER have, and the cap it has while the band is lit.
    const authoredCap = biomeLevelCap(final, biome);
    const capAtTier = biomeLevelCap(form.tier, biome);

    // EVERY row of the band, not only the rows whose cards are authored today:
    // the band's shape is what has to fit behind the door, so a later authoring
    // pass cannot quietly land a row in a biome that cannot reach it. The binding
    // row is the last one anyway (keystone at T3, cross at T4).
    for (const row of rowsForTier(form.tier)) {
      const required = bandBiomeLevel(form.tier, row, biome);
      check(required >= 1, `${where}: the ${row} row resolved to level ${required}`);
      check(
        required <= authoredCap,
        `${where}: the ${row} row needs ${biome} ${required}, but the ${biome} caps at ${authoredCap}`,
      );
      check(
        required <= capAtTier,
        `${where}: the ${row} row needs ${biome} ${required}, out of reach at T${form.tier} (cap ${capAtTier})`,
      );
    }

    // The gate that opens this form. A T1 form is crafted, not gated.
    if (form.tier > 1) {
      // The earliest tier a player can be paying for this door: the tier whose
      // band the gate sits under, or the tier the biome debuts at if that is
      // later (a Graveyard door cannot be paid before the Graveyard exists).
      const doorTier = Math.max(form.tier - 1, start);
      const gate = formGateBiomeLevel(form);
      check(gate >= 1, `${where}: the gate resolved to level ${gate}`);
      check(
        gate <= biomeLevelCap(doorTier, biome),
        `${where}: the gate needs ${biome} ${gate}, out of reach at T${doorTier} `
        + `(cap ${biomeLevelCap(doorTier, biome)})`,
      );
    }

    doorsWalked++;
  }
}

assert(doorsWalked > 0, 'fixture: no lineage forms walked');

// ─── 2. The door moves WHERE you grind, never HOW FAR IN ────────────────────
//
// This is the whole content of "T1 and T2 are unchanged in practice" (design
// §21): a band's position inside its tier's six levels is a property of the row,
// not of the door. The Broadsword's T2 stat row is the second level of the tier
// whether that tier is spent in the Plains (level 8 of 12) or the Desert (level 2
// of 6) — the same amount of play, counted the way each biome counts.

for (let tier = 1; tier <= MAX_LINEAGE_TIER; tier++) {
  for (const row of rowsForTier(tier)) {
    const doors = new Set<string>();
    for (const lineage of liveLineages()) {
      for (const form of lineage.forms) if (form.tier === tier) doors.add(form.biome);
    }
    const positions = new Map<number, string[]>();
    for (const biome of doors) {
      const local = bandBiomeLevel(tier, row, biome) - bandBiomeFloor(tier, biome);
      const seen = positions.get(local) ?? [];
      seen.push(biome);
      positions.set(local, seen);
    }
    check(
      positions.size <= 1,
      `T${tier} ${row}: the door changes how far into the tier the row sits — `
      + [...positions].map(([local, biomes]) => `L${local} in ${biomes.join('/')}`).join(', '),
    );
    const [local] = [...positions.keys()];
    if (local !== undefined) {
      check(
        local >= 1 && local <= BIOME_LEVELS_PER_TIER,
        `T${tier} ${row}: sits at local level ${local}, outside the tier's ${BIOME_LEVELS_PER_TIER}`,
      );
    }
  }
}

// ─── 3. T1 is the home biome, which is what keeps T1 unchanged ──────────────

for (const lineage of liveLineages()) {
  const base = lineage.forms.filter((f) => f.tier === 1);
  check(base.length === 1, `${lineage.id}: a lineage has exactly one crafted T1 form`);
  for (const form of base) {
    check(
      form.biome === lineage.homeBiome,
      `${lineage.id}: the T1 door is '${form.biome}' but the home biome is '${lineage.homeBiome}' `
      + '— the T1 band would gate somewhere the lineage does not debut',
    );
  }
}

assert(
  problems.length === 0,
  `lineage band reachability failures (${problems.length}):\n  ${problems.join('\n  ')}`,
);

console.log(`reachability.test.ts: ok (${doorsWalked} doors)`);
