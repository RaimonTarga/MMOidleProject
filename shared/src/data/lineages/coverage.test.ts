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
import { biomeLevelOffset } from '../../config/gameConfig';
import { RECIPE_DATABASE } from '../recipes';
import { MONSTER_DATABASE } from '../../monsterDatabase';
import { CAPSTONE_MATERIALS } from './capstones';
import {
  LINEAGE_DATABASE, cardsForTier, formsAtGate, lineageForCardId, lineageForRecipeId,
  lineagesForSlot, lineagesWithLane, liveLineages,
} from './index';
import { PACKET_DEFINITIONS, packetDefaultFace, packetHalves, packetScalingStat } from './packets';
import {
  GATE_LOCAL_LEVEL, LEAN_RANK_ONE, LEAN_RANK_ONE_PAYLOAD_SCALE, LEAN_RANK_PRICE_SCALE, LEAN_RANK_VALUE_SCALE, MAX_LEAN_RANK,
  MAX_LINEAGE_TIER, rowBiomeLevel, rowEssenceCost, rowShardCost, rowsForTier, tierHasRow,
} from './magnitudes';
import {
  bandBiomeLevel, composeVerb, isRankedCard, isVerbCard, lineageGateCost, maxCardRank,
  resolveLineageCapstone, resolveLineageCard,
} from './resolve';
import { RETIRED_LINEAGE_CARDS } from './retired';
import { applyComposedAmplifier } from '../../systems/lineages';
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
  'technique-window',
  'evasion-window',
]);
import type { LeanKind, LineageFxKey, LineageStatKey, PacketId } from './types';

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
    } else if (isVerbCard(card)) {
      // A VERB (design §24.2, §24.9): it carries only its lane — the moment comes
      // from the packet, the payload from the active lean, the size from its tier —
      // and that shape exists only in a weapon band, on a lane with halves.
      check(lineage.slot === 'weapon', `${card.id}: only a weapon band composes (non-weapon trees are parked)`);
      check(!!packetHalves(card.lane), `${card.id}: lane '${card.lane}' has no halves to compose a verb from`);
    } else {
      // Every weapon band's payoff row composes (design §24.9: "T2+ bands compose
      // too"): a weapon payoff that authors its own pair would read "Verb" on the
      // page and pay a per-pull legacy number next to its T1 verb.
      check(
        !(lineage.slot === 'weapon' && card.row === 'payoff'),
        `${card.id}: a weapon band's payoff row is a verb — author it with no trigger and no payoff (design §24.9)`,
      );
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
      if (target && isVerbCard(target)) {
        // On a VERB the pair is the player's: the amplifier meets every payload a
        // lean of this lineage can hand the verb (and the pure pair, with no lean).
        // Whatever it meets, it must MOVE the pair — its own axis where the pair
        // has it, the pair's size where it does not (design §24.9) — and never
        // charge a price for nothing.
        for (const lean of [undefined, ...lineage.lanes]) {
          const composed = composeVerb(target.lane, lean, target.tier);
          check(!!composed, `${card.id}: ${target.id} × ${lean ?? 'no lean'} did not compose`);
          if (!composed) continue;
          const pair = { trigger: { ...composed.trigger }, payoff: { ...composed.payoff } };
          const before = JSON.stringify(pair);
          const move = applyComposedAmplifier(pair, card.amplifies);
          check(
            JSON.stringify(pair) !== before,
            `${card.id}: on ${target.id} × ${lean ?? 'no lean'} its '${card.amplifies}' (moved as '${move}') changed nothing`,
          );
          if (move === 'targets') {
            check(payoffLandsOnTarget(pair.payoff.kind), `${card.id}: a second body for '${pair.payoff.kind}', which lands on no body`);
          }
        }
      } else if (target?.payoff) {
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
      if (target && !isVerbCard(target)) {
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
  //
  // T3 and T4 are PARTIAL bands as of run 3 (design §18.5: "empty bands above T2
  // until Phase 5"): W1-B ships only the T3 keystone row and the T4 cross row,
  // ahead of Phase 5's stat/payoff/amplifier rows at those tiers. So the full
  // "every row this tier has" rule applies at T1/T2 only; T3/T4 are checked for
  // just the row this phase actually authors.
  //
  // A weapon's T1 PAYOFF row is the one exception (design §26.1: "T1 deepens; T2
  // branches"): it is one card, the weapon's own verb, so only its lane has one.
  // The T1 band's own shape is pinned in section 1b below.
  const tiers = new Set(lineage.cards.map((c) => c.tier));
  for (const tier of tiers) {
    const rows = tier <= 2
      ? rowsForTier(tier).filter((row) => lineage.slot === 'weapon' || row !== 'stat')
        .filter((row) => !(lineage.slot === 'weapon' && tier === 1 && row === 'payoff'))
      : tier === 3 ? ['keystone' as const] : ['cross' as const];
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

// ─── 1b. The T1 weapon band after design §26.1 ───────────────────────────────
//
// "The T1 band is one lean row and one verb, and the verb is not a choice: it is
// the weapon's identity." The lean row is Attack, Speed and Effect — the same three
// on every weapon — each RANKED; the payoff row is ONE verb, the weapon's own. The
// lane of a T1 lean is its colour and its shard only (PROVISIONAL rule, legibility
// run): Effect takes the fixed verb's lane, Attack takes Empowered where the weapon
// has it (else the first lane left), Speed takes Tempo where the weapon has it
// (else the lane left) — so all three of the home biome's shards buy something.

/** The fixed verb per weapon (design §26.1; the brief's names). */
const FIXED_VERBS: Record<string, { id: string; name: string; lane: PacketId }> = {
  dagger: { id: 'dagger-t1-affliction-payoff', name: 'Into the Wound', lane: 'affliction' },
  rapier: { id: 'rapier-t1-tempo-payoff', name: 'Flurry', lane: 'tempo' },
  hammer: { id: 'hammer-t1-control-payoff', name: 'Easy Prey', lane: 'control' },
  axe: { id: 'axe-t1-tempo-payoff', name: 'Chopping Rhythm', lane: 'tempo' },
  broadsword: { id: 'broadsword-t1-technique-payoff', name: 'Set Piece', lane: 'technique' },
};

/** Effect is the weapon's own mechanic (design §26.1). */
const EFFECT_STAT: Record<string, LineageStatKey> = {
  dagger: 'dotPotencyPct', // the reservoir's poison
  hammer: 'slowOnHit', // the slow's depth, the verb's source
  rapier: 'payloadScale', // no mechanic of its own: Flurry's second strike
  axe: 'payloadScale', // no mechanic of its own: Chopping Rhythm's second swing
  broadsword: 'payloadScale', // the Technique refund Set Piece pays
};
const KIND_STAT: Record<Exclude<LeanKind, 'effect'>, LineageStatKey> = {
  attack: 'attackPct',
  speed: 'attackSpeedPct',
};

let t1Weapons = 0;
for (const lineage of liveLineages().filter((l) => l.slot === 'weapon')) {
  t1Weapons += 1;
  const band = lineage.cards.filter((c) => c.tier === 1);
  const leans = band.filter((c) => c.row === 'stat');
  const verbs = band.filter((c) => c.row === 'payoff');
  check(band.length === 4, `${lineage.id}: the T1 band is three leans and one verb, got ${band.length} cards`);
  check(leans.length === 3, `${lineage.id}: three T1 leans, got ${leans.length}`);

  // The fixed verb: one, a VERB, the brief's card and name.
  const fixed = FIXED_VERBS[lineage.id];
  check(!!fixed, `${lineage.id}: no fixed verb listed for this weapon`);
  check(verbs.length === 1, `${lineage.id}: the T1 payoff row is ONE verb (design §26.1), got ${verbs.length}`);
  const verb = verbs[0];
  if (fixed && verb) {
    check(verb.id === fixed.id, `${lineage.id}: the fixed verb is '${fixed.id}' (its id kept), got '${verb.id}'`);
    check(verb.name === fixed.name, `${lineage.id}: the fixed verb reads '${fixed.name}', got '${verb.name}'`);
    check(verb.lane === fixed.lane, `${lineage.id}: the fixed verb is the ${fixed.lane} verb`);
    check(isVerbCard(verb), `${verb.id}: the fixed verb is a VERB (no trigger, no payoff)`);
  }

  // The trio: one of each kind, ranked, three distinct lanes that ARE the weapon's.
  const byKind = new Map<LeanKind, typeof leans[number]>();
  for (const lean of leans) {
    check(isRankedCard(lean), `${lean.id}: a T1 lean is one of the ranked trio`);
    check(maxCardRank(lean) === MAX_LEAN_RANK, `${lean.id}: ${MAX_LEAN_RANK} ranks`);
    if (lean.leanKind) {
      check(!byKind.has(lean.leanKind), `${lineage.id}: two '${lean.leanKind}' leans`);
      byKind.set(lean.leanKind, lean);
      check(lean.id === `${lineage.id}-t1-${lean.leanKind}`, `${lean.id}: the trio's id is <weapon>-t1-<kind>`);
      const label = lean.leanKind[0]!.toUpperCase() + lean.leanKind.slice(1);
      check(lean.name === label, `${lean.id}: reads '${label}', got '${lean.name}'`);
    }
  }
  check(new Set(leans.map((c) => c.lane)).size === 3, `${lineage.id}: the trio takes three different lanes`);
  check(lineage.lanes.every((lane) => leans.some((c) => c.lane === lane)), `${lineage.id}: the trio covers all three lanes`);

  const attack = byKind.get('attack');
  const speed = byKind.get('speed');
  const effect = byKind.get('effect');
  check(!!attack && !!speed && !!effect, `${lineage.id}: Attack, Speed and Effect`);
  if (attack) check(attack.statKey === KIND_STAT.attack, `${attack.id}: Attack is attack %`);
  if (speed) check(speed.statKey === KIND_STAT.speed, `${speed.id}: Speed is attack speed %`);
  if (effect) {
    check(effect.statKey === EFFECT_STAT[lineage.id], `${effect.id}: Effect is ${EFFECT_STAT[lineage.id]}, got ${effect.statKey}`);
    check(effect.lane === verb?.lane, `${effect.id}: Effect takes the fixed verb's lane (its shard and colour)`);
  }
  // The shard rule (PROVISIONAL): Attack → Empowered if present, Speed → Tempo if
  // present, each else the first lane still free in matrix order.
  if (attack && speed && effect) {
    const free = lineage.lanes.filter((lane) => lane !== effect.lane);
    const attackLane = free.includes('empowered') ? 'empowered' : free[0];
    check(attack.lane === attackLane, `${attack.id}: Attack takes '${attackLane}', got '${attack.lane}'`);
    const left = free.filter((lane) => lane !== attackLane);
    const speedLane = left.includes('tempo') ? 'tempo' : left[0];
    check(speed.lane === speedLane, `${speed.id}: Speed takes '${speedLane}', got '${speed.lane}'`);
  }

  // Every rank resolves: rank I is the kind's number, each rank above adds half of
  // rank I again, the price climbs in the SAME essence and the SAME shard.
  for (const lean of leans) {
    if (!lean.leanKind) continue;
    for (let rank = 1; rank <= MAX_LEAN_RANK; rank++) {
      const resolved = resolveLineageCard(lean, lineage, { rank });
      const entries = Object.entries(resolved.statEffects ?? {});
      // Effect on a payload-scale weapon reads its own rank-I number (design §26.5).
      const rankOne = lean.leanKind === 'effect' && lean.statKey === 'payloadScale' ? LEAN_RANK_ONE_PAYLOAD_SCALE : LEAN_RANK_ONE[lean.leanKind];
      const expected = Math.round(rankOne * LEAN_RANK_VALUE_SCALE[rank - 1]! * 1000) / 1000;
      check(entries.length === 1 && entries[0]![0] === lean.statKey && Math.abs(entries[0]![1] - expected) < 1e-9,
        `${lean.id} rank ${rank}: ${JSON.stringify(resolved.statEffects)}, expected ${lean.statKey} ${expected}`);
      check(resolved.rank === rank && resolved.maxRank === MAX_LEAN_RANK, `${lean.id} rank ${rank}: rank recorded`);
      const essence = Object.values(resolved.cost.essence);
      const shards = Object.entries(resolved.cost.shards);
      check(essence[0] === Math.round(rowEssenceCost(1, 'stat') * LEAN_RANK_PRICE_SCALE[rank - 1]!),
        `${lean.id} rank ${rank}: essence ${essence[0]}`);
      check(shards.length === 1 && shards[0]![0] === lean.lane
        && shards[0]![1] === Math.round(rowShardCost(1, 'stat') * LEAN_RANK_PRICE_SCALE[rank - 1]!),
      `${lean.id} rank ${rank}: shards ${JSON.stringify(resolved.cost.shards)} in its own lane`);
    }
    const one = resolveLineageCard(lean, lineage, { rank: 1 });
    const three = resolveLineageCard(lean, lineage, { rank: 3 });
    check(Math.abs((Object.values(three.statEffects!)[0]!) - 2 * Object.values(one.statEffects!)[0]!) < 1e-9,
      `${lean.id}: rank III is twice rank I`);
  }
}
check(t1Weapons === 5, `five live weapon lineages carry the T1 trio, got ${t1Weapons}`);

// Only the T1 weapon leans are ranked; every other card is bought once.
for (const lineage of LINEAGE_DATABASE.values()) {
  for (const card of lineage.cards) {
    if (!isRankedCard(card)) {
      check(maxCardRank(card) === 1, `${card.id}: an unranked card has one rank`);
      continue;
    }
    check(lineage.slot === 'weapon' && card.tier === 1 && card.row === 'stat',
      `${card.id}: only a T1 weapon lean is ranked (design §26.1)`);
  }
}

// The retired T1 cards (design §26.1) are gone from the data and priced for the
// save refund: every one names a live weapon lineage, one of its lanes, and an id
// that no live card reuses.
check(RETIRED_LINEAGE_CARDS.size === 25, `five weapons × (three leans + two verbs) retired, got ${RETIRED_LINEAGE_CARDS.size}`);
for (const [id, retired] of RETIRED_LINEAGE_CARDS) {
  const lineage = LINEAGE_DATABASE.get(retired.lineageId);
  check(!!lineage && lineage.slot === 'weapon', `${id}: retired from a weapon lineage`);
  check(!lineageForCardId(id), `${id}: a retired id is still a live card`);
  check(!!lineage?.lanes.includes(retired.lane), `${id}: retired lane '${retired.lane}' is not on ${retired.lineageId}`);
  check(id === `${retired.lineageId}-t1-${retired.lane}-${retired.row}`, `${id}: the id is its shape`);
}

// ─── 2. Coverage (design §9, §17) ────────────────────────────────────────────
//
// Weapons: every packet on >= 2 lineages of the (single) weapon slot (design
// §9). Non-weapon: design §17's explicit override — "every packet completes on
// at least two non-weapon lineages across the three slots (45 lane slots for
// eight packets), not two per slot" — because "any slot may complete a packet"
// (design §7) is what makes borrowing a sibling slot legal.

// Coverage is a rule about trees a player can REACH, so it reads the live
// lineages: every armour, charm and boots tree is parked (design §24.5), which
// leaves no non-weapon slot authored and skips the §17 block below until they
// return. Their data stays, and the structural rules above still walk it.
const SLOTS_AUTHORED = [...new Set(liveLineages().map((l) => l.slot))];
const NON_WEAPON_SLOTS_AUTHORED = SLOTS_AUTHORED.filter((slot) => slot !== 'weapon');

/**
 * Packets that do not meet the two-lineages rule yet, and the gap each one is.
 *
 * `technique` is the ninth packet (design §22), pulled into run 4 so the playtest
 * sees the real wallet. §22 moves exactly ONE lineage onto it — the Plains
 * Broadsword, whose Desert forms crown it — so it is on one weapon lineage and
 * no non-weapon one, and neither gap is this task's to fill:
 *
 *  - a second WEAPON carrier means taking a lane off a lineage whose own coverage
 *    is already at the floor (after §22, Tempo, Affliction, Control and
 *    Engagement are each on exactly two), i.e. a new design call, not an
 *    authoring one;
 *  - a NON-WEAPON carrier means answering "what does Technique look like on the
 *    defensive face", which is the ability pass's roster audit (§22.1) — the
 *    same pass that decides whether the lane keeps `packetDefaultFace`'s
 *    provisional `avoid`.
 *
 * The loops below FAIL when a listed packet HAS met the rule, so an entry can
 * never outlive its gap — the same self-cleaning shape as `UNCROWNED_LANES`.
 */
const WEAPON_COVERAGE_BELOW_TWO = new Set<PacketId>(['technique']);
const NON_WEAPON_COVERAGE_BELOW_TWO = new Set<PacketId>(['technique']);

if (SLOTS_AUTHORED.includes('weapon')) {
  for (const packet of WEAPON_PACKET_IDS) {
    const carriers = lineagesWithLane('weapon', packet);
    if (WEAPON_COVERAGE_BELOW_TWO.has(packet)) {
      check(
        carriers.length < 2,
        `WEAPON_COVERAGE_BELOW_TWO lists '${packet}', which is now on ${carriers.length} weapon ` +
        'lineages — remove the entry',
      );
      // A weapon packet with no carrier at all is unreachable, which is a
      // different and worse bug than a thin one.
      check(
        carriers.length >= 1,
        `coverage: weapon packet '${packet}' is on no weapon lineage at all`,
      );
      continue;
    }
    check(
      carriers.length >= 2,
      `coverage: packet '${packet}' is on ${carriers.length} weapon lineage(s); the rule is at least two`,
    );
  }
}

if (NON_WEAPON_SLOTS_AUTHORED.length > 0) {
  for (const packet of PACKET_IDS) {
    const carriers = NON_WEAPON_SLOTS_AUTHORED.flatMap((slot) => lineagesWithLane(slot, packet));
    if (NON_WEAPON_COVERAGE_BELOW_TWO.has(packet)) {
      check(
        carriers.length < 2,
        `NON_WEAPON_COVERAGE_BELOW_TWO lists '${packet}', which is now on ${carriers.length} ` +
        'non-weapon lineages — remove the entry',
      );
      continue;
    }
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
      // The two keystones that pay out a share of a hit name the payoff kind
      // their share is resolved from, so twenty flavours of one rule pay the
      // same thing. Authoring another kind makes the card's own magnitude
      // unreadable to the rule and silently falls back to the canonical share.
      const laneKeystone = keystoneDefinition(card.lane);
      if (laneKeystone?.payoff) {
        check(
          card.payoff === laneKeystone.payoff,
          `${card.id}: keystone '${laneKeystone.id}' resolves its share from '${laneKeystone.payoff}', so the card must be authored with that payoff, not '${card.payoff}'`,
        );
      }
    }
  }
  for (const form of lineage.forms) {
    if (!form.capstone) continue;
    check(declaredFx.has(form.capstone.fx), `${form.capstone.id}: fx '${form.capstone.fx}' is not in LINEAGE_FX_KEYS`);
    usedFx.add(form.capstone.fx);
  }
}
// A payload owns its fx (design §24.2): a composed T1 verb pushes the key its
// lean's packet names, so a key a packet half names is drawn without any card
// authoring it.
for (const packet of PACKET_DEFINITIONS.values()) {
  if (!packet.halves) continue;
  for (const fx of [packet.halves.payloadFx, packet.halves.pure.fx]) {
    check(declaredFx.has(fx), `packet '${packet.id}': fx '${fx}' is not in LINEAGE_FX_KEYS`);
    check(fx.startsWith(`${packet.id}.`), `packet '${packet.id}': fx '${fx}' does not speak its lane's grammar`);
    usedFx.add(fx);
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

    // With no door biome passed, a card resolves against its lineage's HOME
    // biome (design §21's T1 case, and the UI's default for a band with no door
    // chosen yet). Every home biome debuts in T1, so its offset is zero and the
    // level is the table's own absolute number. The door-biome bands — where the
    // offset is NOT zero — are walked by `reachability.test.ts`.
    check(
      resolved.requiredBiomeGroup === lineage.homeBiome,
      `${card.id}: resolved with no door biome should fall back to the home biome`,
    );
    check(
      resolved.requiredBiomeLevel === bandBiomeLevel(card.tier, card.row, lineage.homeBiome),
      `${card.id}: unlock level does not match the table`,
    );
    check(
      biomeLevelOffset(lineage.homeBiome) === 0
        && resolved.requiredBiomeLevel === rowBiomeLevel(card.tier, card.row),
      `${card.id}: a home biome debuts in T1, so its band level is the table's absolute one`,
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
      // A ranked T1 lean scales its KIND's stat (section 1b); its lane is colour
      // and currency only. Every other stat row scales its lane's stat.
      const expectedStat = isRankedCard(card) ? card.statKey : packetScalingStat(card.lane);
      check(
        entries[0]?.[0] === expectedStat,
        `${card.id}: scales '${entries[0]?.[0]}' but should scale '${expectedStat}'`,
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
  cardsForTier(LINEAGE_DATABASE.get('rapier')!, 1).length === 4,
  'the rapier T1 band is the lean trio and its one verb (design §26.1)',
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

// ─── 5c. Keystone (T3) and cross (T4) coverage, run 3 (design §4 amended) ───
//
// One keystone card per lane at T3, one cross card per lane at T4, on every one
// of the twenty lineages (five weapon, fifteen defensive). The keystone card's
// fx is always `<lane>.keystone`, and every lane the keystone fires on needs a
// runtime module — W1-A (feat/keystones) registers one per packet in
// `server/src/systems/combat/keystones/`, which `shared/` cannot import (package
// boundary), so this asserts against the closed `PACKET_IDS` list instead; the
// conductor reconciles with W1-A's actual registry at merge.
//
// Live lineages only. This is where review finding P4 bit (78 non-weapon T3/T4
// cards authored on trees with no form to open their band); it is MOOT while
// those trees are parked (design §24.5) — nothing on a parked tree is buyable at
// all. When the trees return, P4's rule comes back with them: every authored
// card's tier must be ≤ the highest gate-reachable form tier of its lineage.

for (const lineage of liveLineages()) {
  const keystoneCards = lineage.cards.filter((c) => c.tier === 3 && c.row === 'keystone');
  const crossCards = lineage.cards.filter((c) => c.tier === 4 && c.row === 'cross');

  for (const lane of lineage.lanes) {
    const keystonesForLane = keystoneCards.filter((c) => c.lane === lane);
    check(
      keystonesForLane.length === 1,
      `${lineage.id}: lane '${lane}' has ${keystonesForLane.length} T3 keystone cards, expected exactly one`,
    );
    for (const card of keystonesForLane) {
      check(
        card.fx === `${lane}.keystone`,
        `${card.id}: keystone fx is '${card.fx}', expected '${lane}.keystone' (design §4, run 3 W1-B)`,
      );
    }

    const crossForLane = crossCards.filter((c) => c.lane === lane);
    check(
      crossForLane.length === 1,
      `${lineage.id}: lane '${lane}' has ${crossForLane.length} T4 cross cards, expected exactly one`,
    );
  }

  // Three cross cards, each borrowing a DIFFERENT other lane — not just "not its
  // own lane" per card, but a derangement across the three, so the lineage's
  // three lanes are each borrowed exactly once (two cross cards per lane slot,
  // or the same lane borrowed twice, is the shape the brief calls out as wrong).
  if (crossCards.length === 3) {
    const borrowed = crossCards.map((c) => c.borrowsLane).filter((l): l is PacketId => !!l);
    check(
      new Set(borrowed).size === 3,
      `${lineage.id}: T4 cross cards borrow ${borrowed.join('/')} — each of the lineage's three lanes should be borrowed exactly once`,
    );
  }
}

// Both halves of the handoff, reconciled at the run-3 wave-1 merge (W1-A's
// registry is now on the same branch as W1-B's cards): every packet is carried
// by a T3 keystone card somewhere, and every lane a keystone card names has a
// row in `KEYSTONE_DEFINITIONS`. `shared/` may not import the server's module
// map (package boundary), so the module-per-lane half stays pinned by
// `server/test/keystones.test.ts`, which asserts its ids against this same table.
const keystonedLanes = new Set<PacketId>();
for (const lineage of LINEAGE_DATABASE.values()) {
  for (const card of lineage.cards) {
    if (card.tier === 3 && card.row === 'keystone') keystonedLanes.add(card.lane);
  }
}
for (const packet of PACKET_IDS) {
  check(
    keystonedLanes.has(packet),
    `keystone coverage: packet '${packet}' has no T3 keystone card on any lineage, so its keystone (W1-A) would be unreachable`,
  );
  const keystone = keystoneDefinition(packet);
  check(
    keystone !== undefined && keystone.lane === packet,
    `keystone coverage: packet '${packet}' is carried by a T3 card but has no row in KEYSTONE_DEFINITIONS`,
  );
}

// ─── 5d. The Broadsword after design §22 ─────────────────────────────────────
//
// The generic loops above would catch a Broadsword with a missing row, but they
// would say "a lineage" where a reader needs "the Broadsword". §22 changed its
// lanes and its capstones and nothing else, so what is pinned here is both halves:
// the Technique lane is fully authored, and REACHABILITY is untouched — the same
// seven forms, the same recipe ids, the same tiers and biomes, the same one crafted
// base form and six gated ones. A lane swap must not quietly move a door.

{
  const broadsword = LINEAGE_DATABASE.get('broadsword');
  check(!!broadsword, 'the Broadsword is still in the database');

  if (broadsword) {
    check(
      broadsword.lanes.join('/') === 'technique/kill-chain/empowered',
      `the Broadsword carries Technique / Kill chain / Empowered (design §22), got ${broadsword.lanes.join('/')}`,
    );
    // Lane A is what §18.6's boss stopgap pays, which is half of Technique's two
    // T1 shard sources (`server/test/lineageMaterials.test.ts` pins the other half).
    check(
      broadsword.lanes[0] === 'technique',
      `Technique must be Lane A so the Plains boss pays its shard, got '${broadsword.lanes[0]}'`,
    );

    // Reachability: the forms are the doors, and §22 touched none of them.
    const forms = [...broadsword.forms]
      .map((f) => `${f.recipeId}@T${f.tier}/${f.biome}`)
      .sort();
    check(
      forms.join(' ') === [
        'desert-pilgrim-quarterstaff@T3/desert',
        'desert-solar-cross@T3/desert',
        'desert-sunmonk-warstaff@T4/desert',
        'desert-sunsteel-cross@T2/desert',
        'desert-zenith-cross@T4/desert',
        'iron-broadsword@T1/plains',
        'knight-steelsword@T2/plains',
      ].sort().join(' '),
      `the Broadsword's doors are unchanged by the lane swap, got ${forms.join(' ')}`,
    );

    // Every row of every tier the Broadsword authors, on the Technique lane.
    for (const tier of [1, 2]) {
      for (const row of rowsForTier(tier)) {
        check(
          broadsword.cards.some((c) => c.tier === tier && c.row === row && c.lane === 'technique'),
          `the Broadsword's Technique lane has no T${tier} '${row}' card`,
        );
      }
    }
    check(
      broadsword.cards.some((c) => c.tier === 3 && c.row === 'keystone' && c.lane === 'technique'),
      "the Broadsword's Technique lane has no T3 keystone card",
    );
    check(
      broadsword.cards.some((c) => c.tier === 4 && c.row === 'cross' && c.lane === 'technique'),
      "the Broadsword's Technique lane has no T4 cross card",
    );
    // Tempo is GONE from it — that is the swap, and a leftover Tempo card would be
    // a row the player can buy on a lane the lineage does not carry.
    check(
      !broadsword.cards.some((c) => c.lane === 'tempo'),
      'no Tempo card may survive on the Broadsword',
    );

    // The Desert line crowns Technique; the Plains door keeps Kill chain.
    for (const form of broadsword.forms) {
      if (!form.capstone) continue;
      const expected = form.biome === 'desert' ? 'technique' : 'kill-chain';
      check(
        form.capstone.lane === expected,
        `${form.recipeId}: a ${form.biome} Broadsword form crowns '${expected}' (design §22), got '${form.capstone.lane}'`,
      );
    }
  }

  // And Tempo still meets the coverage rule without it, on the two lineages that
  // carry it as Lane A. Named, because §22's own sentence promises exactly this.
  const tempoWeapons = lineagesWithLane('weapon', 'tempo').map((l) => l.id).sort();
  check(
    tempoWeapons.join('/') === 'axe/rapier',
    `Tempo's weapon coverage is the Axe and the Rapier, got ${tempoWeapons.join('/') || 'none'}`,
  );
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
