/**
 * The lineage coverage matrix is a TEST, not a spreadsheet (design §9).
 *
 * Four rules that no amount of care survives by hand once there are four slots,
 * four tiers and eight packets:
 *
 *   1. **Coverage.** Every packet appears on at least two lineages per slot, so no
 *      lane is a single lineage's private property, and every lane is crowned by
 *      at least one form's capstone.
 *   2. **No hand-authored numbers.** Magnitudes, durations, costs and unlock
 *      levels come from `magnitudes.ts`; the authored types have nowhere to put
 *      a literal. The belt-and-braces source scan is in
 *      `server/test/lineageAuthoring.test.ts`, because `shared/` may not import
 *      Node APIs.
 *   3. **Every card has a visual signature** from the declared `LineageFxKey`
 *      registry, and every declared key is used — a card with no signature is a
 *      stat, and an unused key is an effect the client will never draw (design §8).
 *   4. **The vocabulary is closed.** Every trigger and payoff a card names is in
 *      the union the runtime implements.
 *
 * It also resolves every card and asserts the numbers come out finite and sane,
 * which is the only place the magnitude table is exercised end to end.
 */
import { RECIPE_DATABASE } from '../recipes';
import { MONSTER_DATABASE } from '../../monsterDatabase';
import { CAPSTONE_MATERIALS } from './capstones';
import {
  LINEAGE_DATABASE, cardsForTier, formsAtGate, lineageForCardId, lineageForRecipeId,
  lineagesForSlot, lineagesWithLane,
} from './index';
import { PACKET_DEFINITIONS, packetDefaultFace, packetScalingStat } from './packets';
import {
  GATE_LOCAL_LEVEL, MAX_LINEAGE_TIER, rowBiomeLevel, rowsForTier, tierHasRow,
} from './magnitudes';
import {
  lineageGateCost, resolveLineageCapstone, resolveLineageCard,
} from './resolve';
import {
  AMPLIFIED_AXES, LINEAGE_FX_KEYS, PACKET_IDS, PAYOFF_KINDS, ROW_KINDS,
  TRIGGER_KINDS, WEAPON_PACKET_IDS, keystoneFxKey, payoffLandsOnTarget,
} from './types';
import { KEYSTONE_DEFINITIONS, keystoneDefinition } from './keystones';

/**
 * The payoff kinds that hold for a time, so a `duration` amplifier has a window to
 * lengthen. The stacking and instant ones do not: "amplifying" their duration would
 * be a card that charges a price and changes nothing.
 */
const PAYOFF_IS_TIMED: ReadonlySet<string> = new Set([
  'vulnerability', 'plating-shred', 'hemorrhage', 'poison-stack', 'slow', 'stun',
  'damage-window', 'speed-window', 'recovery-window', 'engagement-dr', 'ward',
]);
import type { LineageFxKey, PacketId } from './types';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const problems: string[] = [];
function check(cond: boolean, msg: string): void {
  if (!cond) problems.push(msg);
}

// ─── Guard the guard ─────────────────────────────────────────────────────────

assert(LINEAGE_DATABASE.size >= 5, `lineage database has only ${LINEAGE_DATABASE.size} entries — it is broken`);

// ─── 1. Structure ────────────────────────────────────────────────────────────

const seenCardIds = new Set<string>();
const seenFormIds = new Set<string>();

for (const [key, lineage] of LINEAGE_DATABASE) {
  check(key === lineage.id, `lineage keyed '${key}' but its id is '${lineage.id}'`);
  check(new Set(lineage.lanes).size === 3, `${lineage.id}: three DISTINCT lanes, got ${lineage.lanes.join('/')}`);

  for (const lane of lineage.lanes) {
    check(PACKET_DEFINITIONS.has(lane), `${lineage.id}: unknown lane '${lane}'`);
    if (lineage.slot === 'weapon') {
      check(
        WEAPON_PACKET_IDS.includes(lane),
        `${lineage.id}: weapons draw from the first six packets, not '${lane}' (design §3)`,
      );
    }
  }

  // Forms
  const baseForms = lineage.forms.filter((f) => f.tier === 1);
  check(baseForms.length === 1, `${lineage.id}: exactly one tier-1 form is crafted, found ${baseForms.length}`);
  for (const form of lineage.forms) {
    check(!seenFormIds.has(form.recipeId), `form '${form.recipeId}' belongs to two lineages`);
    seenFormIds.add(form.recipeId);

    const recipe = RECIPE_DATABASE.get(form.recipeId);
    check(!!recipe, `${lineage.id}: form '${form.recipeId}' is not a recipe`);
    if (recipe) {
      check(recipe.slot === lineage.slot, `${form.recipeId}: recipe slot '${recipe.slot}' but lineage slot '${lineage.slot}'`);
      check(recipe.tier === form.tier, `${form.recipeId}: recipe tier ${recipe.tier} but form tier ${form.tier}`);
    }

    if (form.tier === 1) {
      check(!form.capstone, `${form.recipeId}: a tier-1 base form is crafted and crowns nothing`);
      continue;
    }
    check(!!form.capstone, `${form.recipeId}: a gated form must add a verb (design §5)`);
    check(
      CAPSTONE_MATERIALS.has(form.biome),
      `${form.recipeId}: biome '${form.biome}' has no capstone material, so its gate cannot be paid`,
    );
    if (form.capstone) {
      check(
        lineage.lanes.includes(form.capstone.lane),
        `${form.capstone.id}: crowns lane '${form.capstone.lane}', which is not on ${lineage.id}`,
      );
      check(TRIGGER_KINDS.includes(form.capstone.trigger), `${form.capstone.id}: unknown trigger '${form.capstone.trigger}'`);
      check(PAYOFF_KINDS.includes(form.capstone.payoff), `${form.capstone.id}: unknown payoff '${form.capstone.payoff}'`);
    }
  }

  // Cards
  for (const card of lineage.cards) {
    check(!seenCardIds.has(card.id), `card id '${card.id}' is used twice`);
    seenCardIds.add(card.id);
    check(card.lineageId === lineage.id, `${card.id}: lineageId '${card.lineageId}' but it lives on '${lineage.id}'`);
    check(ROW_KINDS.includes(card.row), `${card.id}: unknown row '${card.row}'`);
    check(
      lineage.lanes.includes(card.lane),
      `${card.id}: lane '${card.lane}' is not one of ${lineage.id}'s three`,
    );
    check(
      tierHasRow(card.tier, card.row),
      `${card.id}: tier ${card.tier} has no '${card.row}' row (design §4 — the band never gets wider)`,
    );

    if (card.row === 'stat') {
      check(!card.trigger && !card.payoff, `${card.id}: a stat row is the one row that is a number, not an effect`);
    } else {
      check(!!card.trigger, `${card.id}: every row but stat fires on something`);
      check(!!card.payoff, `${card.id}: a card must DO something the moment it is bought (design §4)`);
      if (card.trigger) check(TRIGGER_KINDS.includes(card.trigger), `${card.id}: unknown trigger '${card.trigger}'`);
      if (card.payoff) check(PAYOFF_KINDS.includes(card.payoff), `${card.id}: unknown payoff '${card.payoff}'`);
    }

    if (card.row === 'cross') {
      check(!!card.borrowsLane, `${card.id}: a cross-lane card names the lane it borrows`);
      check(
        !card.borrowsLane || card.borrowsLane !== card.lane,
        `${card.id}: a cross-lane card borrows a DIFFERENT lane`,
      );
    }
    if (card.modifies) {
      check(
        lineage.cards.some((c) => c.id === card.modifies),
        `${card.id}: modifies '${card.modifies}', which is not on this lineage`,
      );
    }
    if (card.row === 'amplifier') {
      check(!!card.modifies, `${card.id}: an amplifier modifies an owned payoff (design §4)`);
      // An amplifier modifies a PAYOFF card of its OWN lineage, OWN lane, and OWN
      // tier — not the T1 payoff, and not a payoff the lineage never authored at
      // this tier. "The T2 band now has its own payoff row for it to modify."
      const target = lineage.cards.find((c) => c.id === card.modifies);
      check(!!target, `${card.id}: amplifier modifies '${card.modifies}', which does not exist`);
      if (target) {
        check(target.row === 'payoff', `${card.id}: amplifier modifies '${target.id}', which is a '${target.row}' row, not a payoff`);
        check(target.lane === card.lane, `${card.id}: amplifier modifies '${target.id}' on lane '${target.lane}', not its own lane '${card.lane}'`);
        check(target.tier === card.tier, `${card.id}: amplifier (T${card.tier}) modifies '${target.id}' (T${target.tier}) — an amplifier modifies its OWN tier's payoff`);
      }
      // WHICH axis it moves. Without this an amplifier is indistinguishable from a
      // second payoff on the same lane, which is exactly what the row shipped as.
      check(
        !!card.amplifies && AMPLIFIED_AXES.includes(card.amplifies),
        `${card.id}: an amplifier must declare which axis it moves (${AMPLIFIED_AXES.join(' | ')})`,
      );
      if (target?.payoff) {
        // A second body is meaningless for a payoff that lands on the player.
        check(
          card.amplifies !== 'targets' || payoffLandsOnTarget(target.payoff),
          `${card.id}: amplifies 'targets', but '${target.id}' pays with '${target.payoff}', which lands on the player`,
        );
        // A duration amplifier needs a window to lengthen.
        check(
          card.amplifies !== 'duration' || PAYOFF_IS_TIMED.has(target.payoff),
          `${card.id}: amplifies 'duration', but '${target.id}' pays with '${target.payoff}', which has no window`,
        );
      }
      // The `trigger` axis normally ADDS a moment, so naming the one the payoff
      // already fires on would be a dead card with a price — EXCEPT for
      // `first-hit`, the one trigger that latches per engagement rather than per
      // hit, kill or clock tick. There, naming it again re-scopes the latch to per
      // BODY ("every new body counts as a fresh opening"), which is a real effect.
      if (target) {
        check(
          card.amplifies !== 'trigger'
            || card.trigger !== target.trigger
            || card.trigger === 'first-hit',
          `${card.id}: amplifies 'trigger' with '${card.trigger}', the trigger '${target.id}' already fires on — only 'first-hit' has a per-engagement latch to re-scope`,
        );
      }
    } else {
      check(
        card.amplifies === undefined,
        `${card.id}: only an 'amplifier' row declares an amplified axis, not a '${card.row}' row`,
      );
    }
  }

  // Every lane the lineage carries must be playable at every tier it authors.
  // Non-weapon slots run one row fewer per tier: no stat row, base stats come
  // from the form (design §4, §17).
  const tiers = new Set(lineage.cards.map((c) => c.tier));
  for (const tier of tiers) {
    const rows = rowsForTier(tier).filter((row) => lineage.slot === 'weapon' || row !== 'stat');
    for (const lane of lineage.lanes) {
      for (const row of rows) {
        const has = lineage.cards.some((c) => c.tier === tier && c.lane === lane && c.row === row);
        check(has, `${lineage.id} T${tier}: lane '${lane}' has no '${row}' card — the row is a choice between three`);
        // An amplifier is one card modifying one payoff, not a shopping list: a
        // lane that authors a tier's amplifier row authors exactly one.
        if (row === 'amplifier') {
          const amplifiers = lineage.cards.filter((c) => c.tier === tier && c.lane === lane && c.row === 'amplifier');
          check(
            amplifiers.length === 1,
            `${lineage.id} T${tier}: lane '${lane}' has ${amplifiers.length} amplifier cards, expected exactly one`,
          );
        }
      }
    }
  }
}

// ─── 2. Coverage (design §9, §17) ────────────────────────────────────────────
//
// Weapons: every packet on >= 2 lineages of the (single) weapon slot (design
// §9). Non-weapon: design §17's explicit override — "every packet completes on
// at least two non-weapon lineages across the three slots (45 lane slots for
// eight packets), not two per slot" — because "any slot may complete a packet"
// (design §7) is what makes borrowing a sibling slot legal.

const SLOTS_AUTHORED = [...new Set([...LINEAGE_DATABASE.values()].map((l) => l.slot))];
const NON_WEAPON_SLOTS_AUTHORED = SLOTS_AUTHORED.filter((slot) => slot !== 'weapon');

if (SLOTS_AUTHORED.includes('weapon')) {
  for (const packet of WEAPON_PACKET_IDS) {
    const carriers = lineagesWithLane('weapon', packet);
    check(
      carriers.length >= 2,
      `coverage: packet '${packet}' is on ${carriers.length} weapon lineage(s); the rule is at least two`,
    );
  }
}

if (NON_WEAPON_SLOTS_AUTHORED.length > 0) {
  for (const packet of PACKET_IDS) {
    const carriers = NON_WEAPON_SLOTS_AUTHORED.flatMap((slot) => lineagesWithLane(slot, packet));
    check(
      carriers.length >= 2,
      `coverage: packet '${packet}' is on ${carriers.length} non-weapon lineage(s) across ` +
      `${NON_WEAPON_SLOTS_AUTHORED.join('/')}; the rule is at least two across the three slots (design §17)`,
    );
  }
}

/**
 * Lanes with no form crowning them yet.
 *
 * Phase 1 left `engagement` uncrowned (both weapon doors that carried it spent
 * their capstone on another lane). Phase 4's defensive capstones crown their
 * lineage's Lane A (design §17), and Engagement is Lane A for four of the
 * fifteen non-weapon lineages (Bindings, Wraps, Treads, Wing) — so it is
 * crowned now and the entry is gone. Bulwark and Barrier tempo, which had NO
 * capstone at all before Phase 4, are crowned the same way.
 *
 * Adding an entry here is choosing to ship an uncrowned lane. The loop below
 * fails if a listed lane HAS been crowned, so a fixed entry cannot linger.
 */
const UNCROWNED_LANES = new Set<PacketId>([]);

const crownedLanes = new Set<PacketId>();
for (const lineage of LINEAGE_DATABASE.values()) {
  for (const form of lineage.forms) {
    if (form.capstone) crownedLanes.add(form.capstone.lane);
  }
}
for (const packet of PACKET_IDS) {
  if (UNCROWNED_LANES.has(packet)) {
    check(
      !crownedLanes.has(packet),
      `UNCROWNED_LANES lists '${packet}', which now has a form crowning it — remove the entry`,
    );
    continue;
  }
  check(crownedLanes.has(packet), `coverage: no form's capstone crowns lane '${packet}' (design §9)`);
}

// ─── 3. Visual signatures (design §8) ────────────────────────────────────────

const declaredFx = new Set<LineageFxKey>(LINEAGE_FX_KEYS);
const usedFx = new Set<LineageFxKey>();

for (const lineage of LINEAGE_DATABASE.values()) {
  for (const card of lineage.cards) {
    check(!!card.fx, `${card.id}: every card adds one thing the player can see (design §8)`);
    check(declaredFx.has(card.fx), `${card.id}: fx '${card.fx}' is not in LINEAGE_FX_KEYS`);
    usedFx.add(card.fx);
    check(
      card.fx.startsWith(`${card.lane}.`),
      `${card.id}: fx '${card.fx}' does not speak its lane's grammar (expected '${card.lane}.*')`,
    );
    // One keystone per packet (design §4): a keystone row draws its LANE's
    // keystone signature, because every lineage carrying the lane plays the same
    // rule and two different effects for one rule would be a lie on screen.
    if (card.row === 'keystone') {
      check(
        card.fx === keystoneFxKey(card.lane),
        `${card.id}: a keystone row draws '${keystoneFxKey(card.lane)}', not '${card.fx}' (design §4)`,
      );
      check(
        keystoneDefinition(card.lane) !== undefined,
        `${card.id}: lane '${card.lane}' has no keystone in KEYSTONE_DEFINITIONS`,
      );
    }
  }
  for (const form of lineage.forms) {
    if (!form.capstone) continue;
    check(declaredFx.has(form.capstone.fx), `${form.capstone.id}: fx '${form.capstone.fx}' is not in LINEAGE_FX_KEYS`);
    usedFx.add(form.capstone.fx);
  }
}
for (const key of declaredFx) {
  // A `<lane>.keystone` key is owned by the keystone REGISTRY, not by a card's
  // authoring choice: design §4 (amended 2026-10-01) gives each packet exactly one
  // keystone, so all eight keys exist and have client handlers from the moment the
  // rules do, whether or not a band has authored its flavour of them yet. The
  // check below pins the other half — a keystone card must use its lane's key.
  if (key.endsWith('.keystone')) continue;
  check(usedFx.has(key), `LINEAGE_FX_KEYS declares '${key}', which no card uses — the client would never draw it`);
}

// NOTE: rule 2 — "no numeric literals in card files" — is a SOURCE scan, and
// `shared/` may not import Node APIs, so it lives in
// `server/test/lineageAuthoring.test.ts`. Everything a card file could smuggle a
// number through is still structurally impossible here: the authored types have
// no numeric field but `tier`.

// ─── 4. The table resolves ───────────────────────────────────────────────────

for (const lineage of LINEAGE_DATABASE.values()) {
  for (const card of lineage.cards) {
    const resolved = resolveLineageCard(card, lineage);

    check(
      resolved.requiredBiomeLevel === rowBiomeLevel(card.tier, card.row),
      `${card.id}: unlock level does not match the table`,
    );
    check(resolved.requiredBiomeLevel > 0, `${card.id}: non-positive unlock level`);
    check(resolved.requiredGlobalMastery > 0, `${card.id}: non-positive Global Mastery gate`);

    const essence = Object.values(resolved.cost.essence);
    check(essence.length === 1 && essence[0]! > 0, `${card.id}: a card costs exactly one essence type`);
    const shards = Object.entries(resolved.cost.shards);
    check(shards.length === 1, `${card.id}: a card costs exactly one shard type`);
    check(shards[0]?.[0] === card.lane, `${card.id}: pays in '${shards[0]?.[0]}' shards, not its own lane's`);
    check((shards[0]?.[1] ?? 0) > 0, `${card.id}: non-positive shard cost`);

    // Half price on a switch, and never free.
    const discounted = resolveLineageCard(card, lineage, { discounted: true });
    const full = Object.values(resolved.cost.essence)[0]!;
    const cut = Object.values(discounted.cost.essence)[0]!;
    check(cut < full && cut > 0, `${card.id}: switch discount produced ${cut} from ${full}`);

    if (card.row === 'stat') {
      const effects = resolved.statEffects ?? {};
      const entries = Object.entries(effects);
      check(entries.length === 1, `${card.id}: a stat row scales exactly one stat`);
      check(
        entries[0]?.[0] === packetScalingStat(card.lane),
        `${card.id}: scales '${entries[0]?.[0]}' but its lane scales '${packetScalingStat(card.lane)}'`,
      );
      check(Number.isFinite(entries[0]?.[1]) && (entries[0]?.[1] ?? 0) > 0, `${card.id}: stat row resolved to ${entries[0]?.[1]}`);
      check(!resolved.payoff, `${card.id}: a stat row has no payoff`);
    } else {
      check(!!resolved.payoff, `${card.id}: payoff did not resolve`);
      check(Number.isFinite(resolved.payoff?.magnitude), `${card.id}: payoff magnitude is not finite`);
      check((resolved.payoff?.magnitude ?? 0) > 0, `${card.id}: payoff magnitude is not positive`);
      check(!!resolved.trigger, `${card.id}: trigger did not resolve`);
      if (resolved.trigger?.kind === 'hit-nth') {
        check((resolved.trigger.n ?? 0) >= 1, `${card.id}: hit-nth interval below 1`);
      }
      check(!resolved.statEffects, `${card.id}: only a stat row contributes stats`);
    }
  }

  // Gates resolve, cost a capstone, and are never discounted.
  for (const tier of new Set(lineage.cards.map((c) => c.tier))) {
    for (const form of formsAtGate(lineage, tier)) {
      const cost = lineageGateCost(form, lineage);
      check(cost.capstone.biome === form.biome, `${form.recipeId}: gate spends the wrong biome's capstone`);
      check(cost.capstone.amount > 0, `${form.recipeId}: gate costs no capstone, so the boss is skippable (design §5)`);
      check(Object.values(cost.essence)[0]! > 0, `${form.recipeId}: gate costs no essence`);
      const capstone = resolveLineageCapstone(form);
      check(!!capstone, `${form.recipeId}: capstone did not resolve`);
      check((capstone?.payoff.magnitude ?? 0) > 0, `${form.recipeId}: capstone payoff is not positive`);
    }
  }
}

// ─── 5. Lookups ──────────────────────────────────────────────────────────────

for (const lineage of LINEAGE_DATABASE.values()) {
  for (const card of lineage.cards) {
    check(lineageForCardId(card.id)?.id === lineage.id, `lineageForCardId('${card.id}') missed`);
  }
  for (const form of lineage.forms) {
    check(lineageForRecipeId(form.recipeId)?.id === lineage.id, `lineageForRecipeId('${form.recipeId}') missed`);
  }
}
check(lineagesForSlot('weapon').length === 5, 'five weapon lineages, one per T1 biome (design §2)');
check(
  lineagesForSlot('armor').length === 5 && lineagesForSlot('recovery').length === 5
  && lineagesForSlot('mobility').length === 5,
  'Phase 4 authors five lineages per non-weapon slot (design §17)',
);
check(
  cardsForTier(LINEAGE_DATABASE.get('rapier')!, 1).length === 6,
  'the rapier T1 band is three stat rows and three payoff rows (design §13)',
);
check(
  cardsForTier(LINEAGE_DATABASE.get('robe')!, 1).length === 3,
  'a non-weapon T1 band is three payoff rows and no stat row (design §4, §17)',
);
check(GATE_LOCAL_LEVEL > 0 && MAX_LINEAGE_TIER >= 4, 'magnitude table bounds are wrong');

// ─── 5a. One keystone per packet (design §4, amended 2026-10-01) ─────────────
//
// Eight rules, shared by every lineage that carries the lane in any slot. The
// runtime half (a named module per lane) is pinned by `server/test/keystones.test.ts`;
// this is the data half.

check(
  KEYSTONE_DEFINITIONS.size === PACKET_IDS.length,
  `${KEYSTONE_DEFINITIONS.size} keystones for ${PACKET_IDS.length} packets — design §4 wants exactly one each`,
);
for (const lane of PACKET_IDS) {
  const keystone = keystoneDefinition(lane);
  check(!!keystone, `packet '${lane}' has no keystone`);
  if (!keystone) continue;
  check(keystone.lane === lane, `keystone '${keystone.id}' is keyed under '${lane}' but names lane '${keystone.lane}'`);
  check(keystone.fx === keystoneFxKey(lane), `keystone '${keystone.id}': fx must be '${keystoneFxKey(lane)}'`);
  check(
    LINEAGE_FX_KEYS.includes(keystone.fx),
    `keystone '${keystone.id}': fx '${keystone.fx}' is not in LINEAGE_FX_KEYS`,
  );
  check(keystone.name.length > 0 && keystone.rule.length > 0, `keystone '${keystone.id}': needs a name and a rule`);
  if (keystone.payoff) {
    check(
      PAYOFF_KINDS.includes(keystone.payoff),
      `keystone '${keystone.id}': unknown payoff kind '${keystone.payoff}'`,
    );
  }
}

// ─── 5b. Defensive faces (design §3.1, §17) ──────────────────────────────────
//
// A card's `face` is DERIVED from its lane, never hand-picked: every non-weapon
// card must carry exactly the face `packetDefaultFace` says its lane has, and a
// weapon card (offensive, frame-neutral) must carry none at all.

for (const lineage of LINEAGE_DATABASE.values()) {
  for (const card of lineage.cards) {
    if (lineage.slot === 'weapon') {
      check(card.face === undefined, `${card.id}: a weapon card is frame-neutral and must carry no face`);
    } else {
      check(
        card.face === packetDefaultFace(card.lane),
        `${card.id}: face '${card.face}' does not match lane '${card.lane}''s derived face '${packetDefaultFace(card.lane)}' (design §17)`,
      );
    }
  }
}

// ─── 6. Capstone materials ───────────────────────────────────────────────────

for (const material of CAPSTONE_MATERIALS.values()) {
  check(
    MONSTER_DATABASE.has(material.bossMonsterId),
    `capstone '${material.name}': boss '${material.bossMonsterId}' is not a monster`,
  );
  const boss = MONSTER_DATABASE.get(material.bossMonsterId);
  check(boss?.isBoss === true, `capstone '${material.name}': '${material.bossMonsterId}' is not a boss`);
}

assert(problems.length === 0, `lineage coverage failures:\n  ${problems.join('\n  ')}`);

console.log('coverage.test.ts: ok');
