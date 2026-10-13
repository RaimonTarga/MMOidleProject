# Lineage Trees — Current State

**Audited:** 2026-10-06, the legibility run (design §26: the T1 band is a ranked lean trio
and the weapon's own verb, one damage-over-time record per weapon, T1 nodes as rosters, the
HUD and panels — report:
[`briefs/legibility-report-2026-10-05.md`](briefs/legibility-report-2026-10-05.md); §3a and
§16 below). Before that 2026-10-03, twice: the course-correction run (design §24: the T1 lean and
verb, one shard per node, non-weapon trees parked, the ladder retired on every slot, the
weapon page and the rhythm readout — report:
[`briefs/course-correction-report-2026-10-03.md`](briefs/course-correction-report-2026-10-03.md)),
then the verbs-that-fire run (design §24.9: leans seed their condition, the Empowered cap,
T2+ bands compose, the tutorial on the fighting weapon — report:
[`briefs/verbs-that-fire-report-2026-10-03.md`](briefs/verbs-that-fire-report-2026-10-03.md)).
Earlier audit 2026-10-01 (run 3: keystones, T3/T4 bands, defensive lineages, ability
nodes, re-homed forms, T2 amplifiers, band collapse).

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§2–9, §18, §19, §21, §23, §24, §26 (§26 supersedes §24 where they differ; §24 supersedes
§18.9's ±3pp band, and §17's non-weapon trees while they are parked). **History:** [`archive/progression-rework-plan.md`](archive/progression-rework-plan.md)
§1–§5 and their progress notes are the detailed build log, including every divergence from
the original sketch; read the code where this page and that history disagree.

A gear slot no longer holds an item with a `+N` ladder — it holds a **lineage**: a small
tree of permanent card purchases plus a chain of "forms" (the actual equipped item, still
an ordinary `RECIPE_DATABASE`/`ITEM_DATABASE` entry). All four gear slots have lineage
DATA, but since design §24.5 **only the weapon tree is live**: the fifteen armour, charm
and boots lineages are `parked` (§2), and those slots hold plain items crafted at full
power. The `+N` ladder and the evolve path are retired on every slot (§9).

## 1. The vocabulary (`shared/src/data/lineages/types.ts`)

- **Packet** (`PacketId`): one of nine lanes. Seven are weapon-eligible (`tempo`,
  `empowered`, `affliction`, `control`, `kill-chain`, `engagement`, `technique`); two are
  defensive-only (`bulwark`, `barrier-tempo`). A lineage carries exactly three packets as
  its lanes. Each packet names the stat it scales, what fires it, what it pays out, what it
  is weak against, its colour, its **shard name** (Gale, Anvil, Venom, Shackle, Bone,
  Spark, Sigil, Iron, Glass — the player never reads a lane name on a material), and, for
  the seven weapon packets, its two **halves** (the moment and the payload, §3a) —
  `shared/src/data/lineages/packets.ts`.
- **Card** (`LineageCard`): one tree node. Authored with **no numbers at all** — tier,
  row, lane, trigger/payoff kind, and (for amplifier/keystone/cross rows) which card it
  `modifies` or which lane it `borrowsLane` from. `resolveLineageCard` (`resolve.ts`) is
  the only place a number is attached, from the per-tier scalar table in
  `magnitudes.ts`. `coverage.test.ts` scans every authored card source to keep this true.
- **Row** (`RowKind`): `stat` → `payoff` → `amplifier` → `keystone` → `cross`, one band
  per tier (T1 asks stat/payoff, T2 adds amplifier, T3 adds keystone, T4 adds cross). A
  row is a **choice**, not a shopping list — `LineageProgress.active` holds one active
  card per owned row, across the whole tree (not per band — see §3). The ids stayed;
  the player reads them through `ROW_LABELS`: `stat` is the **Lean**, `payoff` the
  **Verb** (§3a).
- **Form** (`LineageForm`): the actual wearable item, keyed by an ordinary recipe id.
  Tier-1 forms are crafted normally (Make tab, no gate). Tier ≥2 forms are bought at the
  tier-below's **gate**: essence, the shard of the lane the new form crowns, and the home
  biome boss's capstone material — "the boss is the only way up."
- **Capstone** (`LineageCapstone`): the verb a worn form adds, granted for free the moment
  you wear it. A capstone crowns one lane; every lane is now crowned by some form
  (`UNCROWNED_LANES` in `coverage.test.ts` is empty — the Phase 1 gap on `engagement` was
  closed by the defensive lineages in Phase 4).
- **Face** (`DefensiveFace`): derived, never authored, via `packetDefaultFace(lane)` —
  Avoid (Engagement, Tempo, Control), Sustain (Kill chain, Barrier tempo, Affliction),
  Endure (Bulwark, Empowered). A defensive card pays full on the matching player frame and
  `OFF_FACE_SCALAR` off it (a bias, never a lock); weapon cards carry no face and are
  frame-neutral.

## 2. The twenty lineages

`shared/src/data/lineages/index.ts` registers twenty: five weapon, fifteen defensive
(five per non-weapon slot, one per T1 biome each).

| Slot | Plains | Forest | Mountain | Cave | Swamp |
|---|---|---|---|---|---|
| weapon | `broadsword` | `rapier` | `hammer` | `axe` | `dagger` |
| armor | `robe` | `bindings` | `plate` | `hide` | `wrappings` |
| recovery/charm | `stone` | `heartroot` | `barrier` | `pulse` | `eye` |
| mobility/boots | `fleet` | `wraps` | `treads` | `wing` | `marsh` |

The five weapon lineages carry a T1 base form (crafted) plus T2/T3/T4 gated forms along
the existing `evolvesFrom` graph (e.g. Rapier: `flash-rapier` T1 → `gale-needle` /
`jungle-stinger-rapier` T2 → `jungle-venomthorn-rapier` T3 → `jungle-deathfang-rapier`
T4). **Every weapon is reachable** — `server/test/weaponReachability.test.ts`'s
`KNOWN_UNREACHABLE` allowlist is **empty** — and since §24.5 every non-weapon item is a
plain recipe unlocked at its biome level (`server/test/itemReachability.test.ts`). (This
closes the Phase 2b gap this page used to carry: T3/T4 weapons were unreachable until
design §18.5's T3/T4 form authoring and the Phase 5 re-homing table landed — see §6.)

**The fifteen non-weapon lineages are PARKED (design §24.5, 2026-10-03).** `parked: true`
on each definition; `isLineageParked` / `liveLineages()` in `index.ts`. A parked lineage
has no page entry (`lineageForEquippedItem` returns undefined), refuses every purchase,
swap and gate with "This slot has no tree yet." before any other check, resolves no
runtime cards, absorbed rows or capstones, is never created or written by
`ensureLineageProgress` / `syncLineagesFromInventory`, and earns no boss Lane-A shards
(§10). A save that already holds a parked
tree keeps it untouched and unresolved. Coverage and reachability tests walk the live
lineages only, so review P4 (78 unreachable non-weapon cards) is moot while they are
parked. The data stays for when the trees return.

All fifteen non-weapon lineages, and all PROVISIONAL assignments inside them, are flagged
in their own file headers — design §17 (the non-weapon lane matrices) is itself marked
"proposed, not approved" and the defensive-lineage authoring pass (Phase 4) built from it
as given, so none of the fifteen is final. The five weapon lineages' T1 lane matrix
(design §3.2) is locked; everything above T1 (the keystones, cross cards, re-homed forms)
inherits that lock.

## 3. Bands and rows (design §4)

One band per tier; each tier adds exactly one row, and the screen never gets wider.

| Tier | Rows | The question |
|---|---|---|
| T1 | Stat, Payoff | which lane? |
| T2 | + Amplifier | how does it fire? |
| T3 | + Keystone | what does it become? (a rule change) |
| T4 | + Cross | what do I borrow? |

Non-weapon lineages author no `stat` row (base stats come from the form); `rowsForTier`
derives which rows a panel shows from which cards actually exist for that tier, so a
transitional state (e.g. a tier whose amplifier cards aren't authored yet) never promises
a row with nothing behind it.

**Band collapse and stat absorption (Phase 5).** Paying a gate to a tier-N+1 form folds
the tier-N **stat** row's resolved value into the new form's base stats — derived at
recalc from the WORN form, not mutated at the gate, so it is reversible by wearing the old
form back and needs no save migration. Only one stat card absorbs per collapsed band (the
lane of the player's current stat row, else lineage lane order); the absorbed card stays
buyable (to change which lane absorbs) but is no longer selectable
(`checkSetActive` refuses it). The collapsed band renders as one summary line
("T1: Keen Edge, Rend"), expandable to reslot the payoff row underneath it, which stays
buyable and selectable. The panel always shows one lit band and a dashed "Nothing beyond
this band yet" placeholder where the next tier's cards don't exist yet.

**Which lean a collapsed band leaves behind (verbs-that-fire B).** The lean is
`active.stat` of any tier, so a collapsed T1 lean the save still points at keeps naming
the payload until a T2 lean is slotted, and above T2 no band has a stat row, so the lane
carried through the T2 gate stays the lean. A composed payload's SIZE comes from the
**verb's** tier, not the lean's: a T1 verb reslotted under the T2 form composes with the T2
lean at T1 size, and the T2 amplifier (which modifies the T2 verb) does nothing while it is
slotted. Nothing a gate does shrinks a slotted card.

**Which biome a band gates on — the door biome (design §21, 2026-10-01).** A band of
tier N asks for levels in the biome of the form worn at tier N, its **door biome**, never
in the lineage's `homeBiome`. The home biome is only ever the T1 door, so gating every band
on it made the upper bands unbuyable rather than expensive: the Rapier's T3 rows wanted
Forest 14–17 against a Forest that stops at 12, and the Axe's T4 rows wanted Cave 19–23
against a Cave that stops at 18.

- `lineageBandBiome(lineage, progress, tier)` is the policy: the worn form if it is of that
  tier, else an owned form of that tier (a collapsed band is still a wardrobe to buy from),
  else the first authored one as a display default — which at T1 is the crafted base form,
  i.e. the home biome, so **T1 is unchanged**.
- `resolveLineageCardFor(lineage, progress, card)` is how any caller holding the tree
  resolves a card. `resolveLineageCard` with no `bandBiome` still falls back to the home
  biome, which is correct only at T1 and for an unreached band's silhouette.
- `bandBiomeLevel(tier, row, biome)` is the arithmetic. `rowBiomeLevel` is an **absolute**
  reference level (what a biome debuting in T1 would call it); a biome that debuts later
  numbers its own levels from 1 and `biomeLevelCap` is in those same local numbers, so the
  door's `biomeLevelOffset` comes off. A T3 Jungle door asks for Jungle 8, not Jungle 14.
- The resolved card carries `requiredBiomeGroup` alongside `requiredBiomeLevel`, so
  `checkUnlockCard`, its refusal message and the tree panel all name the same biome.
- **Global Mastery is untouched**: it is a tier-wide band (design §4), so the door never
  moves it. A row's position *within* its tier is also identical whichever door you came
  through — the Broadsword's T2 stat row is the second level of the tier whether that tier
  is spent in the Plains (8 of 12) or the Desert (2 of 6). That invariant is what "T1 and T2
  are unchanged in practice" means, and `reachability.test.ts` pins it.
- **A row's Global Mastery** is the +1..+5 ladder's band (`ladderMasteryLevelForRow`) unless
  `ROW_GLOBAL_MASTERY` (`magnitudes.ts`) sets it by hand. One row does: the **T1 verb row is
  Global Mastery 10** (the ladder said 18, three mastered zones), so a verb lands at its home
  zone's level 4 with one zone mastered before it — a Rapier player's Forest 4 with the Plains
  behind them (design §24.9; PROVISIONAL, the designer's number, = the Global Mastery the
  verbs-that-fire 1x sweep reads at Forest 4). Lineage cards only: the ability nodes keep the
  ladder. `reachability.test.ts` §4 pins the rows' Global Mastery monotone inside a tier, at or
  under the gate, and the T1 verb reachable with one zone mastered.
- Where a lineage holds two forms of one tier from different biomes (the Rapier's T2 Gale
  Needle/Forest and Stinger/Jungle; the Broadsword's T2 Plains/Desert; the Hammer's and
  Dagger's T3/T4 Mountain-or-Tundra and Tundra-or-Volcanic pairs; the Axe's T4
  Graveyard-or-Trench), the band gates on the **worn** one and swapping — free, as always —
  re-resolves the whole band.
- `formGateBiomeLevel` had the identical offset defect in the gate it already read off the
  *form's* biome, which left six lineages' upper doors unpayable at any tier (the Axe's T4
  Graveyard door needed Graveyard 18 against a cap of 6); it takes the same shift. One
  consequence worth naming: for a door into a biome that **debuts at the new tier**
  (Jungle/Desert at T2, Tundra/Volcanic at T3, Graveyard/Trench at T4) the level
  requirement collapses to 1, because that biome has no content at the tier below. There is
  nothing to have mastered there, so the **boss capstone is the real gate** for those doors,
  which is what design §5 says it should be.

No magnitude moved for any of this: `magnitudes.ts` is untouched, and
`shared/src/data/lineages/reachability.test.ts` walks every lineage × tier × form with no
allowlist to assert each band is finishable behind its own door, at that band's own tier.

## 3a. The T1 band is a ranked lean and the weapon's own verb; T2 composes (design §26.1, §24.2)

**T1 deepens; T2 branches (legibility run, 2026-10-05).** A weapon's T1 band is ONE lean
row of three generic cards and ONE verb:

- **The lean trio** — `<weapon>-t1-attack`, `<weapon>-t1-speed`, `<weapon>-t1-effect`, named
  "Attack", "Speed", "Effect" on every weapon (`LineageCard.leanKind`). Attack is attack %,
  Speed attack speed %, and Effect the weapon's own mechanic made stronger: poison potency
  on the Dagger (its reservoir, §26.2), the slow on hit on the Hammer (the seed of its verb's
  condition), and on the Rapier, Axe and Broadsword the size of the verb's payload
  (`payloadScale`, a resolve-time stat that never reaches the stat rebuild; the Flurry /
  Chopping Rhythm echo, the Set Piece refund). An absorbed Effect keeps scaling its own
  lane's payload above the T2 gate (`lineagePayloadScales`).
- **Three ranks per lean** (`MAX_LEAN_RANK`, `LineageProgress.ranks`; an owned ranked card
  with no entry is rank I, `normalizeLineageProgressMap`). `lineage:unlockCard` on an owned
  ranked card buys the NEXT rank (`checkUnlockCard`, `nextCardRank`; "Already at rank III."
  at the cap). Values rank I / II / III: Attack and Speed +8 / +12 / +16%, Effect +10 /
  +15 / +20% (`LEAN_RANK_ONE` × `LEAN_RANK_VALUE_SCALE` 1 / 1.5 / 2). Gates: Global Mastery
  6 / 10 / 14 (the lean row's gate + `LEAN_RANK_MASTERY_OFFSET` 0 / 4 / 8; all under the T1
  gate's 30) and home-biome level 2 at every rank. Price: 30 / 45 / 60 home essence and
  3 / 5 / 6 shards (`LEAN_RANK_PRICE_SCALE` 1 / 1.5 / 2). All PROVISIONAL, the designer's.
- **Which shard** (PROVISIONAL, the conductor's rule): each lean takes one of the weapon's
  three lanes as its CURRENCY only — its colour is the trio's own (`LEAN_COLORS`, design
  §26.4 decided 2026-10-06: Attack warm gold, Speed pale steel, Effect ivory, the same on
  every weapon; `cardColor` in `weaponPageModel.ts` and the Stats panel read it, the shard
  shows in the cost line) — Effect the verb's lane, Attack Empowered if
  the weapon has it, Speed Tempo if it has it, the rest filling in lane order — so all three
  home-biome shards buy something at T1. Dagger: Attack Shackle, Speed Bone, Effect Venom;
  Rapier: Attack Venom, Speed Spark, Effect Gale; Hammer: Attack Anvil, Speed Spark, Effect
  Shackle; Axe: Attack Anvil, Speed Bone, Effect Gale; Broadsword: Attack Anvil, Speed Bone,
  Effect Sigil.
- **The verb is the weapon's identity, not a choice** (card ids unchanged, still Global
  Mastery 10): Dagger *Into the Wound* (`dagger-t1-affliction-payoff`, the Affliction pure
  pair: re-doses the reservoir), Rapier *Flurry* and Axe *Chopping Rhythm* (Tempo pure: every
  6th hit strikes twice), Hammer *Easy Prey* (`hammer-t1-control-payoff`, renamed from
  Pinned: Control pure, a held target is knocked down), Broadsword *Set Piece* (Technique
  pure: a landed Technique refunds half its cooldown).
- **At T1 the pair is always pure.** `leanPayloadLane` gives Attack and Speed NO payload
  lane and Effect the verb's own, so `composeVerb` (unchanged) always reads the verb's pure
  pair; Effect then scales it. The composition grammar below, and the choice among a lane's
  three verbs, open at the T2 gate, where the existing T2 stat row (the three lane leans at
  T2 size) and the three T2 verbs compose exactly as before.
- **Retired T1 cards** (`shared/src/data/lineages/retired.ts`, 25 ids: the old lane-named
  T1 leans and each weapon's two non-fixed T1 verbs) are dropped from the save on
  `loadCharacter` and refunded at today's full T1 price, in the lineage's essence and the
  card's own lane shard (`retiredLineageCardRefund`; idempotent, logged once; a dangling
  `active` pointer is cleared). What a save actually paid was never recorded, so the refund
  errs in the player's favour. `server/test/lineageRetiredCards.test.ts`.

The rest of this section is the composition machinery: at T1 it produces the pure pair; at
T2 it is the band's grammar. A verb is authored with **no trigger and no payoff**
(`isVerbCard`), because both come from the packets at resolve time:

- **The rule** (`composeVerb`, called from `resolveLineageCards`): the active verb fires its
  packet's **moment**; what happens is the active lean's packet **payload**. Same lane →
  that lane's hand-authored **pure** pair. No lean active → the verb's own pure pair (the
  composed own-lane reading is degenerate for Empowered: "when your mechanic fires, the hit
  counts as your mechanic firing"). The lean is whichever owned card sits in the active
  `stat` row, at any tier. Every live weapon band's payoff row, T1 and T2, is verbs (§3b);
  only the parked non-weapon trees still author their own trigger/payoff.
- **Sentences are generated, never hand-typed per pair** (`sentences.ts`): subject moments
  read "X <payload>.", clause moments "X, the hit <payload>.", and same lane / no lean reads
  the pure sentence. The phrases are templates whose numbers come from the magnitude table,
  so a number change rewrites the sentence. `cardSentence(card, progress, { rank })` and
  `composedSentence(lineage, progress, { leanId, rank })` are what the page renders (the
  options preview another lean or rank); `composedSentenceParts` returns the two halves
  (`moment`, `payload`, their lanes) for the two-colour sentence, and `moment + ' ' +
  payload` always equals the sentence (a pure sentence carries a never-rendered ' | ' split
  marker in `packets.ts`). A lean card's sentence is its stat line; a DoT-potency lean on a
  weapon with a reservoir reads "Your poison is +10% stronger." (`weaponReservoirNoun`), not
  a bleed. `composeVerb(...).needs === 'slow'` marks a Control verb with no hold
  source — empty once the Control lean is active, since the lean is a hold source.
  Capped moments read "(every N s at most)"; the Technique payload reads "refunds a third
  of your Technique cooldowns", which is true at a hit moment too.
- **Caveats are data** (`PacketHalves.momentCaveat`, `verbNote` in `weaponPageModel.ts`): a
  verb card shows at most one caveat line — "needs a slow" (a Control verb with no hold
  source), "your mechanic has no hit yet" (the Slinger's Empowered verb when its payload
  needs the hit: `big-hit`, `mechanic-proxy`, `heal-and-load`; a reload has no hit, a
  known asymmetry, design §24.9) or "weak on bosses" (Kill chain).
- **Numbers** (`PACKET_HALF_NUMBERS` in `magnitudes.ts`, all PROVISIONAL and the
  designer's): payloads are PER FIRING — event-shaped and NOT divided by the trigger rate
  (§24.1: the 4–6 s cadence and the caps carry the budget).

| Packet | Moment (verb) | Payload (lean) | Pure pair (same lane, or no lean) | Lane lean stat (T1 size; since §26 the T2 stat row, scaled by tier) |
|---|---|---|---|---|
| Tempo | `hit-nth` n = 6 (landed swings) | `echo-hit` 1.0: a whole second swing through the proc seam, carrying on-hit | the same | attack speed +9% |
| Affliction | `hit-afflicted`, cap 5000 ms | bleed 1.0 × the hit over 4 s, ADDED to the one record (`lineage.bleed`, or the weapon's reservoir, §11a) | `redose`: 1.0 × what its DoTs still owe, over 4 s, added to that same record | DoT potency +10% (`dotPotencyPct` → `dot.mechanic-mult` AND a light bleed on every hit, below; on a reservoir weapon the reservoir's potency instead) |
| Engagement | `first-hit`, per body | `big-hit` ×2 | the same | Attack +3 |
| Empowered | `mechanic-fired`, cap 4000 ms | `mechanic-proxy` (the class's own multiplier; the Duelist's ×3.5 from `reload.mechanic-proxy-mult`, a key only the proxy reads, design §22.12; 1.5 for dot, summoner and every other reload spec) | `big-hit` ×1.5 on the mechanic's hit | attack +9% |
| Control | `hit-held` (slowed, rooted, chilled, frozen or stunned — a knockdown is held), cap 5000 ms | `root` 2000 ms | `stun` 1500 ms | `slowOnHit` 15% (a slow on every hit, below) |
| Kill chain | `kill` + carry (the next landed hit after a kill) | `heal-and-load`: heal 10% of max HP, the hit ×1.5 | the same ("Your next hit after a kill heals a tenth of your pool and lands loaded (+50%).") | move speed +11 |
| Technique | `technique-cast` | refund ⅓ of the Technique cooldowns | refund ½ | Technique power +9% |

- **Leans seed their lane's condition (design §24.9, verbs-that-fire A).** The two
  conditional moments look for a state on the target, and before this no T1 kit supplied
  either for five classes of six (Control fired 0 times in 2,880 matrix runs). The lane's
  own lean is now that source, for every class, through one listener,
  `server/src/systems/combat/leanConditions.ts` (registered in `combatBootstrap` right after
  the card runtime), which reads two passives the stat rebuild writes (`stats.ts`):
  - **Affliction** — `dotPotencyPct` still feeds `dot.mechanic-mult`. On a weapon with NO
    reservoir it also writes `shared.bleed-on-hit-pct`: every landed hit ADDS its share
    (0.10 at T1, scaled by tier; of the hit as it was before any empowered multiplier,
    `hitBasis`) to the one lineage bleed, `lineage.bleed`, spread over the longer of 4 s or
    what it has left; the tick clock is never reset. On a weapon that owns a reservoir
    (`weaponDot`: the Ashbrand / Poison Dagger, the Mirebrand) it writes
    `weapon.reservoir-potency-pct` instead, which `feedWeaponReservoir` multiplies into what
    each converted hit banks, and no lineage record is ever created (design §26.2, §11a).
    The Apprentice gets both effects (the multiplier scales its DoT, the bleed its hit).
  - **Control** — `slowOnHit` (Control's `scalingStat`; the Hammer's Effect lean at T1, 10 /
    15 / 20% by rank) writes `shared.slow-on-hit-pct`: every landed hit slows the target,
    "Hobbled" (`lineage.hobbled`, its own id since the legibility run, not Hamstring's
    `ability-slowed`), through `applyMonsterSlow` (max-wins; the reconciler takes the
    strongest slow across both ids), for the longer of 1.5 s or the wielder's swing interval
    + 500 ms (`LEAN_CONDITION_NUMBERS.control.swingBridgeMs`) — a Heavy Hammer swings slower
    than 1.5 s. Only the depth scales with tier; the window never does. Control immunity
    refuses the root ("Pinned", `lineage.pinned`) and stun payloads, not a slow.
  - Both respect `evadeBlocksDebuffs`, both still apply on a chaotic miss (the dead swing
    "still applies on-hit effects"), and both are live wherever the form is worn — an
    absorbed T1 lean still slows (but `needs` reads only the active lean).
  - `monsterIsHeld` (`status/monsterControl.ts`) counts a stun; a boss's own pattern stagger
    is not counted.
  - Pinned by `server/test/leanConditions.test.ts` (the Affliction cases on the Rapier's T2
    cards; a Hammer Striker with the Effect lean and no range node fires Easy Prey, and the
    slow lands as Hobbled; the Dagger's Effect writes the reservoir's potency and no bleed),
    `server/test/lineageDots.test.ts` (one record per weapon: the Dagger at rank I and III
    ends with exactly its reservoir, the Rapier's T2 Affliction lean with exactly
    `lineage.bleed`) and `server/test/empoweredCap.test.ts` (a real Conduit on the Hammer's
    T2 Empowered verb).
  - **A fixed T1 verb seeds its own condition** (design §26.5, decided 2026-10-06). The
    legibility matrix found Easy Prey firing under the Effect lean only (0 firings under
    Attack and Speed for all six classes). Now `LineageCard.seeds: 'slow'` on the Hammer's
    verb makes the lean-condition listener lay `VERB_SEED_SLOW_PCT` (0.10, PROVISIONAL)
    on every landed hit whatever the lean, max-wins against the Effect lean's deeper slow,
    on the same window as the lean seed; it runs after the `hit-held` check so a hit's own
    seed counts for the next swing. `composeVerb(..., verbSeedsHold)` drops the "needs a
    slow" caveat for a seeding verb; the T2 choice row never seeds and keeps the caveat.
    Pinned by `leanConditions.test.ts` F, `compositionPairs.test.ts` A1,
    `composition.test.ts` and `weaponPage.test.ts`.

- **Caps and latches** (`server/src/systems/combat/lineageCards.ts`, keys in
  `lineageKeys.ts`): a capped moment sets `lineage.cap.<cardId>` when its payoff lands;
  `hit-nth` counts per card and only landed swings; the Engagement latch is per body, kept
  on the monster; the kill carry is armed by a kill and spent by the next landed hit.
- **A chaotic miss is not a landed hit for any hit moment.** A Chaotic Axe whiff
  (`ctx.metadata.chaoticMiss`) returns before anything moves in `hit-nth`, `first-hit`,
  `hit-afflicted`, `hit-held` and the kill carry: it neither fires the moment nor advances
  its counter, spends its opener latch, re-arms the engagement clock or starts its cap, so
  the first landed hit after a whiff is the one that pays (`hit-nth` since `dcd06e5e`; the
  other three since the verbs-that-fire run). `server/test/lineageChaoticMiss.test.ts`
  swings the real Axe for each.
- **A proxy never recurses** (hard rule 3): `mechanic-proxy` applies the archetype's
  resolved empowered multiplier (`resolveEffectiveMultiplier`, shared with the real path)
  and sets `mechanicConsumed` plus `mechanicProxy`. It never consumes the class's charge and
  never emits `mechanic-fired` (`emitMechanicFired` refuses a proxied exchange); it does
  nothing on an exchange whose real mechanic already fired, whether it spent a charge
  (`mechanicConsumed`) or only announced (`mechanicAlreadyFired`: the DoT stack fill, the
  Conduit formation); and every
  frame loop returns early on `mechanicProxy`. Range mechanics and Shockwave do treat it as
  the mechanic.
- **One multiplier per hit:** big-hit and the loaded hit fold into
  `ctx.metadata.empoweredMultiplier`, like `damage-window`.

## 3b. T2+ bands compose too (design §24.9, verbs-that-fire B)

The fifteen weapon T2 payoff cards author no trigger and no payoff any more, so they are
verbs (card ids unchanged). `composeVerb(verb, lean, tier)` uses the same halves and the
same `PACKET_HALF_NUMBERS` as T1; **the tier multiplies the payload's size, never the
moment**, so the cadence stays 4–6 s and the caps stay 5 s / 4 s.

- **Size** (`PAYLOAD_SIZE`, `scalePayloadSize` in `magnitudes.ts`), multiplied by
  `verbTierScalar(tier)` = `TIER_SCALAR.fraction` (1 / 1.15 / 1.32 / 1.5 — every payload is
  already relative to something that grows with the tier, so the `absolute` column would
  double-dip): a `share` is multiplied (echo, heavy bleed, re-dose, heal, refund; heal and
  refund capped at 1), a `bonus` multiplies only what is above 1 (lunge ×2 → ×2.15, crash
  ×1.5 → ×1.575, the Kill-chain load with its heal), a `duration` lengthens (root 2 → 2.3 s,
  knockdown 1.5 → 1.7 s, rounded to the 100 ms tick), and the `proxy` carries `bonusScale`
  on the class mechanic's own bonus (`applyMechanicProxy`). All PROVISIONAL.
- **The amplifier moves one axis of the COMPOSED pair** (`composedAmplifierMove`), by
  `ROW_SCALAR.amplifier` (+60%): frequency (`quickenMoment`: a count of 6 → 4, never below
  every 2nd hit; a cap 5 s → 3.1 s), targets, duration (`lengthenPayload`; a bleed keeps its
  tick rate, so its total grows) or size. On a pair the `trigger` axis means frequency; the
  amplifier's own authored trigger is not read. **An axis the active pair does not have
  moves its size instead**, so an amplifier never costs and does nothing
  (`coverage.test.ts` checks every live amplifier against every lean). +60% of a per-firing
  size is large (×2.15 lunge → ×2.84): a designer number.
- The page labels rows Lean / Verb only where the band composes (`bandComposes`,
  `rowLabel`; every live weapon band does), and an amplifier tile says what it changes on
  the player's current pair ("Deep Bloodletting can fire every 3.1 s (was every 5 s).") or,
  when its axis is missing, what it does instead.
- The T3 keystone and T4 cross rows are unchanged in kind.
- The T2 instrument is the boss lab one tier up (`_t1BossPlan.ts --matrix=composition
  --tier=2 [--leans]`): the band-2 form with its T2 lean and verb against the same form
  with no cards, the tutorial kit's T2 items, the five T1 biomes' T2 bosses.
  [`reports/verbs-that-fire/t2-matrix.md`](../reports/verbs-that-fire/t2-matrix.md): on the
  Rapier and Broadsword the verb's own share is at least its T1 share in 16 of 18 pairs
  (the two short by 0.3–0.4 pp, inside the lab's noise); every whole pair that reads lower
  at T2 loses it in the LEAN (the Rapier's Tempo lean is worth 0 at T2 to the tick
  quantisation; the Broadsword's move-speed lean is −0.8% on a boss). Every T2 number is at
  least its T1 number by construction (`composition.test.ts`, all 45 T2 pairs).

## 4. Keystones (design §4, amended 2026-10-01)

**One keystone per packet, eight in all, shared by every lineage that carries the lane in
any slot** — not one per lane per slot. The T3 `keystone` row's card IS the keystone; its
name/description/fx are the lineage's own flavour of the shared rule.

| Packet | Keystone | Rule | Runtime seam |
|---|---|---|---|
| Tempo | Chain | the echo keeps re-triggering until a miss or no fresh target | the `echo-hit` payoff case in `applyOnTarget`, link by link |
| Empowered | Shockwave | the mechanic's hit becomes an area hit | an `onHit` listener on `empoweredAttack`, paid through `applyPlayerAoe` |
| Affliction | Festering | stacks don't decay while you keep hitting | a per-hit window that re-adds `dt` before decay runs, each tick |
| Control | Ladder | slow → root → stun on hit, once per step per target | an `onHit` listener climbing `applyMonsterRoot` then `applyStun`, latched per target |
| Kill chain | Refund | a kill readies the mechanic (cadence counter, cooldown recharge, reload, energy to cap, next dot hit at max stacks) | an `onKill` listener writing each root's own readiness state |
| Engagement | Always First | every new target's first hit counts as the mechanic firing | an `onHit` listener calling `emitMechanicFired`, latched per body |
| Bulwark | Immovable | stationary DR and plating stacks persist 2 s after moving; no displacement while either is live | predicates asked by stationary-DR, reactive-plating, and the forced-movement/drag seams |
| Barrier tempo | Unbroken | barrier keeps recharging through hits above 50% HP | a refusal inside the one shared barrier-damage entry point |

**Shape.** Identity (lane, name, rule text, fx key, payoff kind) is data in
`KEYSTONE_DEFINITIONS` (`shared/src/data/lineages/keystones.ts`), keyed by `PacketId`.
Behaviour is one small module per lane under `server/src/systems/combat/keystones/`,
declared via `defineKeystone` and collected in `KEYSTONE_MODULES`.
`registerKeystones()` runs from `registerLineageCards()`, so the live server and the bench
see one set. `keystoneActive(player, lane)` reads the same resolved-card cache every other
row reads — owned, active and worn by construction.

A keystone row does **not** fire as a payoff (`firingsFor` skips `row === 'keystone'`);
the authored trigger/payoff pair still supplies the rule's **share** via
`keystoneShare` (the tier column and the defensive frame-face bias apply exactly as to a
payoff row), so the magnitude table is never bypassed and a keystone card is never paid
twice. Six new authored units in `LINEAGE_UNITS` back the five rules with no magnitude of
their own (`chainMaxLinks` 4, `shockwaveRadius` 90, `ladderRootMs` 1500, `ladderStunMs`
750, `immovableGraceMs` 2000, `unbrokenHpFraction` 0.5) — no constants live in the runtime
modules (design §18.4).

Tests: `server/test/keystones.test.ts` (one block per keystone plus its bound, a registry
block, a no-double-fire block, a per-player ownership block).

## 5. T3 keystone cards and T4 cross cards

All twenty lineages author one keystone card per lane at T3 and one **cross** card per
lane at T4 (`row: 'cross'`), each `borrowsLane` a derangement of the lineage's other two
lanes — three cards per lineage, never a fixed point, never two cards naming the same
borrowed lane. A cross card is a second lane's payoff at reduced strength
(`ROW_SCALAR.cross` = 0.5; `ROW_SCALAR.keystone` = 1.2); both resolve through the same
generic `resolveLineageCard`/`cardScalar` path as every other row, so authoring them added
zero runtime code. A cross card's `fx` draws its **own** lane's established visual, not
the borrowed lane's — lane grammar belongs to the slot the card sits in (design §8), not
to the mechanic it borrows.

All 54 T3 class skill-tree paths (`t3CombatA/B.ts`, `t3Summoner.ts`) carry a PROVISIONAL
`packet: PacketId` tag, chosen from each path's description, for design §4's keystone
handoff ("the item keystone and the class path name the same lane"). Coverage: every
weapon-eligible packet has at least one tagged path (tempo 15, empowered 20, affliction
13, control 2, kill-chain 1, engagement 3); `bulwark`/`barrier-tempo` have none by design
(no class attack path should name a defensive-only lane). The T3 class paths themselves
are reviewed as a whole after the rework — these tags are a label on existing paths, not
a rewrite of them. The ability pass re-homed five (design §22.5; see
[`abilities-current-state.md`](abilities-current-state.md) "T3 path re-homes"), which
closed the Pyromancer and Warmonger overlaps with their root's frame loop; see
[`frames-current-state.md`](frames-current-state.md) §3.

## 6. Re-homed forms

Fourteen later-biome debut weapons/armor/charms/boots that would otherwise dead-end are
re-homed as second (or third) gated doors on an existing lineage, each adding one
`LineageForm` plus one capstone, approved in the day-run's re-homing table:

| Root recipe | Lineage | Tier | Door biome |
|---|---|---|---|
| `desert-sunsteel-cross` | broadsword | 2 | desert |
| `tundra-permafrost-maul` | hammer | 3 | tundra |
| `tundra-rimebrand` | dagger | 3 | tundra |
| Jungle vest (T2) | bindings (forest armor) | 2 | jungle |
| Desert vest (T2) | robe (plains armor) | 2 | desert |
| Tundra vest (T3) | plate (mountain armor) | 3 | tundra |
| Jungle charm (T2) | heartroot (forest recovery) | 2 | jungle |
| Desert charm (T2) | stone (plains recovery) | 2 | desert |
| Tundra charm (T3) | barrier (mountain recovery) | 3 | tundra |
| Trench charm (T4) | pulse (cave recovery) | 4 | trench |
| Tundra boots (T3) | treads (mountain mobility) | 3 | tundra |
| Volcanic boots (T3) | wing (cave mobility) | 3 | volcanic |
| Trench treaders (T4) | marsh (swamp mobility) | 4 | trench |
| Graveyard boots (T4) | fleet (plains mobility) | 4 | graveyard — thematically the weakest fit (a death-and-decay boot crowning sunlit Plains), mechanically clean (its kill-stack-speed payoff maps directly onto Fleet's native kill-chain lane) |

The eleven non-weapon doors in this table belong to PARKED lineages (§2): while the trees
are parked those items are plain recipes, crafted at their biome level, and wearing one
grants no capstone.

No new `LineageFxKey`s were needed for any of the fourteen — every lane already had a
non-stat fx verb to reuse. The T3/T4 weapon forms proper (Jungle Venomthorn/Deathfang on
Rapier, Mountain Avalanche/Earthsunder/Warmaul and Tundra Permafrost/Glacial Tyrant on
Hammer, Desert Pilgrim/Solar Cross/Sunmonk/Zenith on Broadsword, and their siblings on Axe
and Dagger) were authored straight from the existing `evolvesFrom` graph per design §18.5
("author the T3 and T4 forms now … with empty bands above T2 until Phase 5"), closing the
reachability gap §2 describes.

## 7. Ability nodes (design §19, §22)

A generic tree keyed to packets, not per-class trees: **four rows per ability, 19
abilities** (the ability pass roster, `abilities-current-state.md`). A node means "this
ability also fires the chosen packet's payoff at a share when it lands (Technique) or
casts (Guard)", through the lineage payoff runtime. Nodes decide *what* an ability does;
runes still decide *when* it fires. The keystone row is the one place a node is bespoke
(the keystone table, fire-shapes, tier rule and cast axis are in
[`abilities-current-state.md`](abilities-current-state.md) "The ability pass"; the verbs
are design §22.4 / §22.11).

| Row | Tier | What it is |
|---|---|---|
| **packet** | home | one of the ability's three offered `(lane, payoff)` pairs, at `ABILITY_NODE_SHARE.packet` |
| **amplifier** | home + 1 | a free choice of axis on the active packet's route: second body, longer window, bigger payoff, and on a cast or charge a shorter wind-up (the `cast` axis) |
| **keystone** | home + 2 | one of three bespoke verbs, paid in the active packet's shard |
| **cross** | home + 3 | one of the OTHER two offers, borrowed at `ROW_SCALAR.cross` (derived, never authored; the packet's own lane is never borrowed) |

- **Data:** `shared/src/data/abilityNodes/` — `offers.ts` (three pairs per ability, the
  fire-shape table and the Kill chain kill-trigger set) and `keystones.ts` (the 19 trios,
  57 verbs, each `live` or a silhouette) are the hand-authored tables; the amplifier and
  cross rows, option names and fx keys are DERIVED (`index.ts`). Techniques offer three
  of the six offensive packets; Guards offer the three defensive faces.
  **`speed-window` is deliberately not offered on a Guard's avoid face** (defence
  scaling offence is forbidden by the ability-design axioms). Binary payoffs (`stun`,
  `cleanse`) are never offered as a "half" share. Names, icons and animations grow
  with the rows (`shared/src/data/abilityNodes/flavor.ts`: the name grammar behind
  `abilityDisplayName` and the composed icon's layer list; the keystone animations in
  [`combat-animation-current-state.md`](combat-animation-current-state.md));
  `abilities-current-state.md` has the summary.
- **Tier rule:** `abilityNodeRowTier(ability, row)` = home tier + 0/1/2/3, NOT clamped
  (design §22.10): a T1 ability reads 1/2/3/4, a T2 one 2/3/4/5. Rows above
  `MAX_LINEAGE_TIER` (4) FOLD into the T4 band today (`abilityNodeBandTier`: gated at
  that band's unlock level for the row's kind, priced at that band) and unfold when the
  tier ships; option ids carry no tier, so no save is touched.
- **Numbers:** `ABILITY_NODE_SHARE` in `magnitudes.ts` — `packet` 0.5, `amplifier` 0.6;
  keystones and crosses resolve at `ROW_SCALAR.keystone` / `ROW_SCALAR.cross`. Cost and
  unlock reuse the lineage row costs. Unbenched.
- **State:** `TracksProgression.abilityNodes: Record<abilityId, { owned: string[];
  active: Partial<Record<'packet' | 'amplifier' | 'keystone' | 'cross', string>> }>` —
  owned is forever, active is a free swap. An amplifier of a packet that is not active
  does nothing, as a lineage amplifier; a cross on the active packet's own lane does
  nothing.
- **Protocol:** `ability:unlockNode` / `ability:setNode` (client→server),
  `ability:nodeResult` (server→client) — `shared/src/protocol/socketEvents.ts`. Server
  handlers: `server/src/systems/player/economy/abilityNodes.ts`. Runtime dispatch:
  `server/src/systems/combat/abilityNodes.ts`, which reuses `fireLineagePayoffs`, so the
  node path inherits the evade early-return, max-wins debuff records and the
  amplified-target spread. A node fires on the ability's **resolution**, not its
  activation; WHERE it fires is the ability's §22.10 fire-shape (live — see the
  fire-shape table in `abilities-current-state.md`), under §22.12's rate guards: a self
  payoff fires once per resolution, a node's ward refreshes the one ward it owns, and
  every per-hit, per-tick and on-strip Guard route pays under its packet's `capMs`, else
  Control's 5 s. A Technique's Kill chain offer fires on the kill.
- **Keystone verbs:** all 19 first verbs are live (11 Techniques, 8 Guards), one
  server module each under `server/src/systems/combat/keystones/ability/`; Sidestep's is
  Flow (design §22.12). The second and third verbs of every trio, Afterimage among them
  (a decoy target needs a new primitive), are silhouettes: shown on the row, refused by
  the purchase check.
- **Client:** `client/src/ui/AbilityNodeRows.tsx` on the Abilities panel, the same card
  component the lineage tree uses.

**Not done / provisional:** `ABILITY_NODE_SHARE` is unbenched (a Guard node is a free
extra defensive window on a cooldown the player already pays for — the first thing a
bench should check); no gameplay-telemetry row for node unlocks/sets (the lineage
handlers emit telemetry, the node handlers do not).

## 8. Shared authority (`shared/src/systems/lineages.ts`)

Pure functions the server applies and the client gates buttons with, mirroring
`checkUpgrade`/`checkEvolve`:

- Every check below refuses a **parked** lineage first, with "This slot has no tree yet."
  (§2), and refusal reasons name shards and biomes as the player reads them ("Not enough
  Gale Shards (need 4).", "Requires Forest level 2.").
- `checkUnlockCard` — gate requirements (worn-form tier ≥ card tier, any `modifies`
  target owned), then (unless `wallet.isTestRoom`) **door-biome** level (§3: the biome of
  the form worn at that tier, read off `resolved.requiredBiomeGroup`), Global Mastery,
  essence and shard affordability.
- `lineageBandBiome` / `resolveLineageCardFor` — which door a band gates on, and the only
  way a caller holding the player's tree should resolve a card (design §21, §3 above).
- `checkSetActive` — swapping which owned card is active for a row. Free and instant,
  refuses only ownership/row mismatch and a collapsed band's stat card. **"Owned is
  forever, active is a choice"** is the governing invariant.
- `checkUnlockForm` / `checkWearForm` — paying a gate (essence + the crowned lane's shard
  + **the new form's own** biome's boss capstone, plus that biome's level per
  `formGateBiomeLevel`), and swapping worn form among owned ones (free).
- `lineageSwitchDiscount` — a card is half price if the player already owns the same
  tier+row on another lineage of the same slot. Gates are never discounted.
- `statRowIsCollapsed` / `absorbedStatCards` / `lineageCardTie` — the Phase 5 band-collapse
  machinery described in §3.

Server handlers: `server/src/systems/player/economy/lineages.ts`
(`unlockLineageCard`, `setLineageActive`, `unlockLineageForm`, `wearLineageForm`), wired to
`lineage:unlockCard` / `lineage:setActive` / `lineage:unlockForm` / `lineage:wearForm`,
all replying with `lineage:result`.

## 9. The `+N` ladder and the evolve path are retired on every slot (design §23, §24.5)

One rule for four slots since 2026-10-03: an item is crafted at full power from its recipe,
and there is no within-tier number grind anywhere.

- **The fold.** Weapons first (§23, `74ab24ac`), then armour, charm and boots (the
  designer's W1-D session, `feat/cc-fold`, 86 items): each item's old `+1..+5` total —
  stats AND `mechanicEffects` steps — is in its base, and no recipe carries `upgrades`.
  `shared/src/data/recipes/recipeCurve.test.ts` pins every fold against
  `nonWeaponLadders.fixture.ts` (the original bases and steps); `weaponCurve.test.ts` still
  pins the weapons. Report: [`briefs/cc-fold-report-2026-10-03.md`](briefs/cc-fold-report-2026-10-03.md).
- **The upgrade path** refuses for every slot (`checkUpgrade`, server `upgradeItem`);
  `getMaxUpgrade` is 0; `stats.ts` no longer reads `itemUpgrades`, so a stale `+5` adds
  nothing (it would double the fold). The Upgrade tab, its menu entries and every `+N`
  badge are gone. `upgradeCostFor` survives only for legacy bot routes and is marked
  retired.
- **The refund.** `refundRetiredUpgradeEssence` (on `loadCharacter`, idempotent, mirroring
  migration 0009) pays back every non-weapon level the player had taken, from the frozen
  per-step table `server/src/db/gearUpgradeRefund.ts` (86 items × 5 steps), and keeps the
  item. Like 0009 there is no SQL migration: SQL cannot tell which slot an item is in.
- **The evolve path** refuses everywhere (`checkEvolve`, `checkReconstruct`, server
  `evolveItem`). Non-weapon recipes lost `evolvesFrom`; a T2+ vest, charm or boot is a
  plain recipe unlocked at its biome level and crafted for its `cost`.
  `isGatedLineageForm` is the one check (server craft guard, Make tab, tutorial, bot): true
  for a weapon form of tier ≥ 2, false for a parked lineage's forms. Weapon T2+ forms are
  still only bought at their gate (review B4), and the Make tab lists them as "from its
  lineage tree".

## 10. Materials — shards and capstones

Both wallets live on `TracksProgression` (`shards: Partial<Record<PacketId, number>>`,
`capstones: Record<biome, number>`) and are the only kill-driven material wallets since
Phase 2b deleted the catalyst accumulator outright.

- **Shards.** Granted by `grantLineageMaterials` on every non-boss kill, by the NODE
  (design §24.3; see [`variants-current-state.md`](variants-current-state.md) §4):
  `shards[nodeShard(nodeId)] += max(1, round(SHARD_BASE_PER_KILL ×
  SHARD_TIER_MULT[biomeTier] × debugMult))`, where `nodeShard` is the node's dominant
  family's `drops`. A node with no blend (a dungeon) pays the dead mob's own family shard,
  and nothing for a mob in no family. The player reads shard names (Gale, Anvil, Venom,
  Shackle, Bone, Spark, Sigil, Iron, Glass — `shardName`), never lane names. **Every node
  pays a family it fields**: its leader has a body in its tier pool (`nodeShards.test.ts`,
  no allowlist; the eight T2–T4 nodes that paid a bodiless family were re-led by the
  verbs-that-fire run, then restored to their authored leads on 2026-10-12 when six new
  mobs gave those families bodies — table in [`variants-current-state.md`](variants-current-state.md) §4).
- **Capstones.** Granted on every boss kill whose biome has a capstone material: `+= max(1,
  round(debugMult))` per kill — not scaled by node identity.
- **Boss Lane-A stopgap (design §18.6, provisional).** Every biome boss kill also drops
  `BOSS_LANE_A_SHARD_AMOUNT` (4, so a boss-only lane buys a T1 payoff in two kills) shards
  of each **distinct Lane-A packet of the LIVE lineages** homed in that biome
  (`biomeLaneAPackets`, deduplicated per packet). **Parked lineages pay nothing**
  (verbs-that-fire run, course-correction report item 17): while the armour, charm and
  boots trees are parked the stopgap pays the weapon lanes only — Plains Technique (half
  of Technique's two T1 sources), Forest Tempo, Mountain Empowered, Cave Tempo, Swamp
  Affliction — and no boss pays Iron (Bulwark) or Glass (Barrier tempo) Shards nothing
  could spend. Read off `isLineageParked`, so un-parking a tree restores its Lane A (and,
  for Bulwark and Barrier tempo, their only T1 income — no T1 family drops either; open
  decision 3) with no other edit. `lineageMaterials.test.ts` pins both directions through
  the live reward seam.
- Both wallets are wiped (not refunded) by `resetPlayerProgress` and start at `{}` on a
  fresh character.

## 11. Runtime effects

`resolveActiveLineages(inventory, frameFace?)` is what a player's lineages contribute,
across every slot, **only while the worn form is actually equipped**. It folds stat-row
contributions (including any absorbed row, §3) into the stat rebuild and resolves the
active card per owned row plus the worn form's capstone.

- `stat` rows fold into `itemMechanicEffectsAt`'s seam, same `*Pct` sum-then-apply-once
  semantics as everything else.
- Every other row has a trigger (`hit-nth`, `mechanic-fired`, `first-hit`, `kill`,
  `evade`, `hit-taken`, `guard-cast`, `standing`, `pulse`, `barrier-break`,
  `technique-cast`, and since §24.2 `hit-afflicted` and `hit-held`; `kill` may carry to the
  next hit) and a payoff (`vulnerability`, `plating-shred`, `echo-hit`, `hemorrhage`,
  `poison-stack`, `slow`, `stun`, `damage-window`, `speed-window`, `recovery-window`,
  `ward`, `cleanse`, `plating-stack`, `engagement-dr`, `contagion`, `technique-refund`,
  `technique-window`, `evasion-window`, and since §24.2 `big-hit`, `mechanic-proxy`,
  `heal-and-load`, `root`, `redose`), each mapped onto an existing combat primitive. The
  vocabulary is now 13 triggers and 23 payoffs against design §6's "≤12 / ≤18" (a
  designer call). Wiring lives in `server/src/systems/combat/lineageCards.ts`; `standing`/
  `pulse` run off `updateLineageCards(world, dt)` from `World.tick` since they have no
  listener seam to ride.
- The two condition-seeding leans are not cards: `leanConditions.ts` reads the passives
  the stat rebuild writes (`shared.bleed-on-hit-pct`, `shared.slow-on-hit-pct`) on every
  landed hit, so they push no `card-fx` (§3a).
- Defensive cards carry a `face` and pay `OFF_FACE_SCALAR` off their frame's native face
  (§1); weapon cards carry none and are frame-neutral.
- Each application pushes one `card-fx` event (with the firing card's `cardId`, the
  payload's applied `durationMs`, and for a refund the `abilityIds` it moved); a
  Kill-chain load also pushes `lineage-load` when it arms and when it is spent. A composed
  firing draws its PAYLOAD's fx key ([`combat-animation-current-state.md`](combat-animation-current-state.md), "Lineage payloads").
- Every card the player buys adds one visible signature on screen (`LineageFxKey`) —
  "a card with no signature is a stat," per design §8. T2 payoff/amplifier cards and
  defensive capstones mostly **reuse** their lane's existing T1 fx key rather than minting
  a new one (a departure from design §8's "payoff = a new event" table, recorded per-task
  in the archived plan); amplification reads as a bigger/second-target draw of the same
  key, not a new effect.

## 11a. One damage-over-time record per weapon (design §26.2, legibility run)

**A weapon that already afflicts is amplified, never joined.** Every lineage affliction —
the composed heavy bleed, the Affliction re-dose, `poison-stack`, a standalone
`hemorrhage` — goes through one routing point,
`server/src/systems/combat/damage/lineageAffliction.ts` (`addLineageAffliction`,
`addLineageBleed`):

- **On a weapon with a reservoir** (`weaponDot`), it ADDS to that reservoir (what it still
  owes) and restarts its drain window. No `lineage.*` record is ever created; the target
  shows one poison record. The Effect / Affliction lean's `dotPotencyPct` becomes
  `weapon.reservoir-potency-pct` (§3a).
- **On any other weapon**, it adds to the ONE lineage bleed, `lineage.bleed`, without
  resetting the tick clock. The old ids `lineage.hemorrhage` (heavy, refreshed),
  `lineage.lean-bleed` (light) and `lineage.poison` (`poison-stack`'s own stacking record)
  are gone; all three were collapsed into it. `lineage.poison` had live writers (the
  Dagger's Numbing Dose and Cinderbrand capstones, its T4 Plague Dose, the Rapier's
  Venomthorn capstone, the ability-node Affliction options).
- Every reader sees the one id: the bleed driver, the DoT inventory family, the Affliction
  moment's "afflicted" test, the re-dose, Contagion and Detonate, and the ability pass's readers of the same record:
  Outbreak (`copyPlayerDotOnto` on a tagged body's death), Chain Reaction (`resolveDetonate`
  over every afflicted body in reach) and Pyromancer's Radiant (a burn tick at max stacks).
- **Two behaviour changes, PROVISIONAL:** a `poison-stack` firing now adds what one
  application promises (its share of the hit × the window ÷ the class DoT's tick) instead of
  stacking toward the class cap, which lowers the T3/T4 Dagger and Rapier capstones, Plague
  Dose and the ability nodes for builds that fired it faster than its window; and a
  standalone `hemorrhage` (the Plague Fang capstone, the Rapier's T4 cross) adds where it
  used to refresh.

**The status registry** (`shared/src/systems/targetConditions.ts` and the client's
`targetStatusMeta.ts`, `statusHelp.ts`, `statusTooltips.ts`, `conceptIcons.ts`):

- The Control lean's slow is "Hobbled" (`lineage.hobbled`) and the Control payload's root
  "Pinned" (`lineage.pinned`), each its own id with its own help, instead of borrowing
  the ability slow (`ability-slowed`, "Slowed" since design §22.12) and Binding Strike's "Bound"
  (`ability-rooted`). They sit on the same ladder rungs (`MONSTER_SLOW_STATUS_IDS`,
  `MONSTER_ROOT_STATUS_IDS`, `monsterHasLiveRoot`, `monsterIsHeld`). The `slow` payoff, the
  ability-node slows and the T3 Control keystone's root still use the ability ids.
- `isAfflictionStatusId` (the class DoT, Conflagration, every weapon reservoir,
  `lineage.bleed`) and `isHoldStatusId` (both slows, chill, both roots, frozen, stunned)
  are the shared classification the client's ring reads for its *blocked* state (§16).
- `stunned` has a player tile (projected through the `debuff-stunned` display id); lava
  has one (`debuff-lava-burn`); the dead entries `root`, `vuln`, `void-corruption` and
  dead boss copy are gone; the Effigy link record is hidden from the target mirror.
- **Zero open gaps, pinned.** The audit is a library (`server/scripts/statusAudit.ts`, CLI
  `_statusAudit.ts`): 28 gaps before, 0 open after, 6 accepted with reasons in
  `ACCEPTED_GAPS` (internal latches, two unused icon keys, `cooldown-temporal-ext`, whose
  mechanic has no writer — a designer question). `server/test/statusRegistry.test.ts` fails
  CI on any new status id without label, help, badge and icon, a stale acceptance, or an
  unexplained dynamic id.
- **The target frame** (`client/src/hud/TargetFrame.tsx`, `targetHomes.ts`) draws three
  fixed homes that never reflow — Owes, Slowed, Held — one badge per effect with the
  registry's icon and the damage still owed (`TargetStatusView.owed`, filled server-side
  by `dotOwedOnMonster`) or the seconds left.

## 12. Known limitations

- The T2 amplifier row **is** wired, and its numbers are the open question rather than
  its mechanics. `composeAmplifiers` (`shared/src/systems/lineages.ts`) removes each
  amplifier from the resolved set and moves one axis of the card it `modifies`, in place,
  by `ROW_SCALAR.amplifier`: `duration` lengthens a timed window (and only a timed one),
  `magnitude` scales the payoff, `targets` adds a body through `extraTargets`, and
  `trigger` adds a MOMENT the same payoff also fires on — or, where it names the trigger
  the card already has, re-scopes a `first-hit` from once per engagement to once per body.
  So an amplifier never resolves as a payoff row of its own, which is what keeps "one
  multiplier per hit" true of an amplified build. `applyAmplifiedAxis` is shared with the
  ability-node amplifier (§19) so there is one copy of the arithmetic. Those legacy axis
  meanings now apply only to parked data; a weapon amplifier moves an axis of the composed
  pair (§3b).
- All fifteen defensive lineages are PROVISIONAL — design §17 is itself unapproved — and
  PARKED (§2).
- Every T1 lean/verb number (`PACKET_HALF_NUMBERS`, the lane-lean `STAT_UNIT`s, the
  `LEAN_RANK_*` tables, the shard-per-lean rule) is PROVISIONAL; the course-correction and
  legibility reports list each with its reason.
- **What the legibility matrix measured on the new band** (boss lab, 16,500 fights,
  `reports/legibility/after-composition.md`): the median pair is +15.8% over no cards; the
  Effect lean is the weakest of the three on the Rapier, the Axe and the Broadsword (+10% of
  a per-firing payload against +8% on every hit: Axe Effect I +12.8% vs Speed I +21.4%,
  Broadsword Effect ≈ the verb alone); the Dagger's verb alone is +42.8% (its re-dose of the
  reservoir; the same pair read +42.0% before the run); the Hammer's verb never fires under
  Attack or Speed and is worth survival, not DPS, under Effect. Several Speed ranks read the
  same uplift (I = II = III for some classes): the tick quantisation below.
- Off-lane conditional pairs (T2 since §26.1) still never fire for a class with no source of the
  condition, by design: the Tempo or Engagement lean on the Rapier's Affliction verb for a
  non-DoT class, the Empowered or Engagement lean on a Control verb. The page says "needs a
  slow" for Control; there is no "needs an affliction" note, because whether a verb has an
  affliction source depends on the weapon and the class (the Ashbrand Dagger and the
  Apprentice afflict on their own).
- The Mid range's at-bay slow (20% / 1.2 s) wears off before a Heavy Hammer's next swing,
  so §24.2's "the Mid range makes Control reliable" does not hold on the Hammer; only the
  Control lean's slow bridges the swing.
- Attack timing is quantised to the 10 Hz tick (design §24.9, open): the Rapier's Tempo
  lean is worth 0 to three classes at T1 and to every class measured at T2.
- All T3/T4 family and blend data behind the shard economy is PROVISIONAL — see
  [`variants-current-state.md`](variants-current-state.md).
- The T3 path `packet` tags are PROVISIONAL labels, not a class-path rewrite.
- `ABILITY_NODE_SHARE` is unbenched.
- Bulwark and Barrier-tempo have NO shard income while their trees are parked (the boss
  Lane-A stopgap skips parked lineages, §10); un-parking a tree makes the stopgap their
  only T1 source again. Technique's T1 income is one Swarm-led Plains node plus the Plains
  boss; since design §24.4 every other weapon lane is paid by at least two T1 nodes'
  territories.
- The six T2–T4 family gaps were filled on 2026-10-12 and the eight nodes re-led in §10
  are back on their authored leads (variants-current-state §3–§4).

## 13. The weapon page and the rhythm readout (design §24.6)

**Superseded in part by §16 (design §26.4, legibility run):** the page now lives in the
Upgrade panel and shows lean ranks, the "In the fight" plate and the locked T2 choice; the
readout's rings are named, sit under the HP bar and have five states; the floating word is
teaching-only; the proc strip is gone. What follows is still true where §16 does not say
otherwise.

- **The page** (`client/src/ui/lineage/LineageTreePanel.tsx`, the pure
  `weaponPageModel.ts`, `weaponPage.css`): reached by clicking the equipped weapon; the
  form's art and name; one row per tier-row as a choice of three in lane colours, one lit;
  each card is its name, ONE generated sentence (`cardSentence`, never `description`), cost
  chips (essence label, shard name) and the requirement that actually blocks it; hovering a
  lean shows before → after on the real stat sheet (`previewEquipmentStats`) and re-reads
  every verb with that lean; the next band shows locked; one gate block per boss
  (portrait, capstone pips, what it opens, pay buttons); a materials column that says where
  each shard drops. Card states come only from the shared `check*` functions. Parked slots
  show no entry. A purchase auto-activates only into an empty row server-side, so the page
  (and the tutorial) send `lineage:setActive` after a buy. A verb card carries at most one
  caveat line (§3a); an amplifier tile reads what it does to the current pair (§3b). The
  Empowered ring is a cap clock since the 4 s cap.
- **The rhythm readout** (`client/src/hud/RhythmReadout.tsx`, `rhythmReadoutModel.ts`):
  at most three rings near the HP bar — one per active triggered card (k/n toward a
  `hit-nth`, a clock for a capped moment, ✦/— for a per-body latch or a kill carry, a pulse
  for the mechanic and Technique moments) plus the frame's window/bank ring — and a
  floating word (the card's name) over the player when it pays. The server exposes the
  counters on a small networked slice, `ShowsRhythm` (present only while the player has a
  triggered card; written on change, never per tick; detached on death). The lineage
  window tiles left the buff bar; their statuses remain for the tooltips.
- **Icons** (the designer's W1-E session, approved and packed): the nine shard crystals
  are `items/materials/<shard>.png` in the item atlas, read by `shardIconSource`; the ten
  lineage/frame buff tiles are concept-icon PNGs (their old aliases are gone); the seven
  payload glyphs (`/assets/concept-icons/payloads/`) label the readout rings through
  `RHYTHM_PAYLOAD_GLYPHS`.

## 14. Card telemetry — the first LIVE run (2026-10-01)

`lineage:unlockCard` and `lineage:setActive` had existed since Phase 1c and had never run
against a live server until route `striker-lineage-forest-t1` did. Run: cadence-root /
cadence-balanced, Forest, **25× reward multiplier**, **955.9 s**, ended by the operator's
timeout — **non-canonical for economy** (the harness flags it `NON_CANONICAL_REWARD_
MULTIPLIER` itself); treat every pacing number below as a smoke test, not a balance read.

| metric | value |
|---|---:|
| time to first card | 215.9 s (3 m 36 s) |
| `unlockCard` round trip | 508 ms |
| `setActive` round trip | 0 ms (correct — `unlockCard` into an empty row already activates) |
| swaps per session | 0 (a pure-lane route buys one card per row by construction; needs a route that buys a second card in a row) |
| gate paid | 0 (the route has no boss step) |
| kills / deaths | 112 / 0 |

**The seam works end to end** (bought, persisted, telemetered). The run also surfaced a
pacing finding and a harness defect: at T1 the **payoff** row sits at Global Mastery 18
(three biomes at level 6), unreachable from farming one or two maxed biomes however much
currency is held, and `doUnlockCard`'s `farmBlocked` only names a stall for "this packet
has no T1 shard source" — a Global-Mastery shortfall the farm node cannot fix farmed
silently instead of raising a named stall. Neither is a card-runtime defect. (Both stalls
are named now: the Global-Mastery one since `b88779fb`, the unfarmable-shard one since the
course-correction run's W1-B, review L26.)

## 15. The bench criterion — a viability floor (design §24.1, course-correction 2026-10-03)

**The criterion is a FLOOR, not a band.** No lane (or lean × verb pair) below **0.9× the
median uplift of its tier**, per instrument; a lane above the median is a reading, never a
failure. It retires design §18.9's "median ±3 percentage points, absolute" (which had
itself replaced §9's "±10% of the tier median"): a similarity band balanced every card to be
indistinguishable from its neighbours, which §24.1 calls imperceptible by construction.
The **ordinal encounter check is unchanged** — on a family's own node, does the favoured
lane out-uplift the punished lane, and by what margin (reported, never thresholded).

- Arithmetic: `server/bench/lineage/viabilityFloor.ts` (`viabilityFloor`, `floorFor`), one
  implementation for every instrument; the ordinal check is `lineage/encounterOrdinal.ts`.
  Both are pinned on synthetic rows by `server/test/viabilityFloor.test.ts`.
- A non-positive tier median is reported as such ("the lanes collectively buy nothing
  here"); the floor is then read as a tenth of the median's size below it, so the median
  lane never fails its own floor (a bench pick, flagged for the designer).
- The lane matrix (`server/bench/lineageLaneMatrix.ts`) prints the floor per tier and per
  packet; `LANE_SHARD`/`LANE_SHARDS` split it across processes and `LANE_REPLAY=a,b,...`
  merges the shards' rows back into one report.
- **The composition matrix** measures every weapon's nine T1 pairs (plus a no-band control)
  on all six tutorial classes with two instruments: the boss lab
  (`server/scripts/_t1BossPlan.ts --matrix=composition`, bought through the real economy in
  `_t1BossLab.ts`) and the lane bench (`server/bench/compositionLanes.ts`, home-biome
  family-dominated nodes). `server/bench/compositionReport.ts` writes
  `composition-matrix.md`: per weapon a 3 × 3 lean × verb grid of
  median uplift and verb firings per minute, per-class rows, the floor and the outliers
  (above 1.5× / below 0.9× of the median), never-fired verbs, refusals and deaths. The
  latest is [`reports/verbs-that-fire/composition-matrix.md`](../reports/verbs-that-fire/composition-matrix.md)
  (at `57916b52`): 12 of 45 pairs under the floor on both instruments, four of them because
  the verb never fires (an off-lane lean on a conditional verb, no other source of the
  condition), four Control-lean pairs whose slow and root a DPS metric cannot see, and four
  small or boss-starved (the Broadsword's Technique lean, Kill chain on bosses). The first
  run is [`reports/course-correction/composition-matrix.md`](../reports/course-correction/composition-matrix.md).
- **DPS is the only metric the floor reads.** The Control pure pair's value on a boss is
  survival (the Hammer's win rate against the no-card control +16 pp, the Dagger's +12 pp),
  which the floor does not see; the run report carries the win-rate column per pair.
- **Since design §26.1 the T1 matrix is lean × rank × the one verb** (legibility run):
  per weapon 3 leans × 3 ranks with the weapon's fixed verb, the verb alone and the no-band
  control — 11 rows × 6 classes × 5 bosses × 10 seeds = 16,500 boss-lab fights
  (`compositionPairs.ts`, `_t1BossPlan.ts --matrix=composition`, `compositionReport.ts`
  tables T1 as lean × rank). The T2 instrument keeps its 45 pairs. Latest:
  [`reports/legibility/after-composition.md`](../reports/legibility/after-composition.md)
  (boss lab only; the lane bench was not rerun).

## 16. The HUD and the panels (design §26.4, legibility run 2026-10-05)

**The rule: panels may be dense; the HUD may not.** Each fact has one channel. Screenshots
(desktop 1440×900 and portrait 390×844) are in
[`reports/legibility/screens/`](../reports/legibility/screens/).

- **The ring** (`client/src/hud/RhythmReadout.tsx`, `rhythmReadoutModel.ts`,
  `rhythmReadout.css`): one ring per active verb, **named** (the verb's short name under the
  dial, "Wound" for Into the Wound; the full name in the tooltip). On desktop it sits under
  the HP bar inside the left rail's Character panel (`StatPlate`'s `beside` slot); on a phone
  it is the top strip's second row. The old floating `#rhythm-overlay` mount is gone. Five
  states: **clock** (a count or a cap clock), **coming** (the last second of a cap
  brightens and pulses — with a 500 ms swing and a 5 s cap the moment fires on the first
  swing after the cap clears, so the clock IS the forecast), **ready**, **blocked** (dashed,
  "–": a `hit-afflicted` verb whose current target has no affliction, a `hit-held` verb
  whose target is not held — derived client-side from the target's networked statuses with
  the shared `isAfflictionStatusId` / `isHoldStatusId`, §11a; no target, nothing blocked)
  and **rest**. An **away count** "+N" on the dial counts firings while the player was not
  watching, until the next watched firing.
- **The proc strip is off the field.** The desktop buff bar's 52 px labelled tiles over the
  field's top-left (the playtest's "top-left proc icons are extra bloat") are replaced by a
  26 px status row beside the HP bar, words in the tooltip; critical debuffs keep their size
  and halo. On a phone the scaled row stays at the field's bottom-left.
- **The floating word teaches, then never plays** (`client/src/fx/cardWord.ts`): only on a
  `card-fx` event the server marks `teach: true`. The server counts a card's first
  `CARD_TEACHING_FIRINGS` (3, PROVISIONAL) WATCHED firings in the persisted
  `TracksProgression.cardFiringsTaught` (hydrated by `normalizeFiringsTaught`, clamped 0–3,
  wiped by `resetPlayerProgress`). "Watched" is the server-only `isAway` marker that
  `player:setActive` attaches and detaches (`setFightOnScreen`; a character loaded while
  its tab is hidden starts away; a player with no client — benches, tests — is never away).
  A firing while away never teaches and adds one to `ShowsRhythm.moments[key].away`
  (runtime only); a watched firing clears it. The hook is `noteCardFiring` in
  `lineageCards.ts`'s `fire()`, because `syncRhythmReadout` cannot see pulse firings on its
  own. Limit: "watched" is tab visibility only — a full-screen panel over the fight still
  counts as watching.
- **The Upgrade panel** (`client/src/ui/lineage/UpgradePanel.tsx`, `upgradeListModel.ts`,
  `useUpgradeList.ts`; the crafting dialog's `'upgrade'` tab; a rail entry "Upgrade" with a
  count badge and a row in the phone's More sheet): opens on the worn items, weapon first,
  with the step pips (form · lean I · II · III · verb · gate) and a "1 rank · 2 cards to buy"
  badge from the shared checks; armour, charm and boots say "plain item". The weapon opens
  its page in the panel; clicking the equipped weapon still opens the standalone dialog.
- **The weapon page** (`LineageTreePanel.tsx` exports `WeaponPage`; `weaponPageModel.ts`,
  `weaponPage.css`): the band's steps line; the **"In the fight" plate** — the lean's
  sentence and the verb's in two colours from `composedSentenceParts`, re-reading under a
  lean hover or a rank preview; the lean cards with rank pips ("II of III"), the next rank's
  price (`lineageCardPrice({ progress, rank })`), a Rank up control (hover previews the
  plate and the stat sheet) and "swap free"; the verb card with its mini ring and a beat
  line drawn from the composed moment; the Tier 2 choice row (the band's three verbs,
  dimmed, locked); the gate. On a phone a ◉ Preview toggle pins a diff bar ("Effect rank III
  · Poison potency +15% → +20%"). The page's contract reads go through one file,
  `client/src/ui/lineage/legibilityContracts.ts`.
- **The Stats panel** (`client/src/ui/stats/StatsPanel.tsx`, `statsPanelModel.ts`,
  `stats.css`; a rail entry "Stats", the Character panel's title, the phone's Stats tab):
  thesis D's dense ordered layout — offence, defence, recovery, movement & rhythm. Every
  value is `previewEquipmentStats`; each number's source is found by ablation (with minus
  without that item or lean) and the lean's share is drawn in its lane colour (the Dagger's
  Effect on "Poison potency"; an Effect payload share on its verb's rhythm row). Rites and
  passives moved here. **Nothing expands on the left any more**: the Character panel lost
  its expanding details, and the inventory's stat sheet lost its character-sheet mode (with
  nothing selected it points to Stats); its item comparison stays, because it holds the only
  Equip / Unequip button and the tutorial's `inventoryAction` anchor (the phone tab is
  "Compare").
- **The territory line stays** (`client/src/hud/AreaInformation.tsx`,
  `areaInformationModel.ts` `territoryHereLine`): the node's name and "Mire territory ·
  every kill pays Venom" stay on screen, not only on arrival — top-left on desktop, bottom-
  left when the field is under 860 px (clear of the target frame), above the XP bar on a
  phone, hidden while the arrival banner shows. T1 nodes are rosters (a leader and at most
  one guest; one crossroads per biome — `variants-current-state.md` §2a), so the bodies in
  front of the player and this line agree.
- **The target frame's three homes** (Owes / Slowed / Held) are §11a's.
- Tests: `rhythmReadoutModel` (the five states), `cardTeaching` (three watched firings
  teach then never, the away count, the save round trip, reset), `weaponPageRanks` (rank
  prices, Effect values, steps, the plate's halves), `statsPanel`, `weaponPage`.
- **Not in this run:** the Ornate skin and every ornament (the later skin track, design
  §26.4); the phone camera floor (0.4 draws a 64 px body at ~26 px).
- **Known gap:** a target's status list carries every player's effects with no owner, while
  the server's Affliction moment counts only the player's own DoTs, so in a party the
  client-derived *blocked* state can disagree with the server.
