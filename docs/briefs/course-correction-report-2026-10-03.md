# Course-correction run — report (2026-10-03)

- **Brief:** [`course-correction-run-2026-10-03.md`](course-correction-run-2026-10-03.md)
- **Design authority:** [`progression-rework-design.md`](../../design_docs/progression-rework-design.md) §24
- **UI contract:** the weapon-page mockup and the lean × verb review sheet, both linked from the brief
- **Branch:** `feat/course-correction`, merged into `develop` by the commit that follows
  this report. Not pushed.

## Verdict

**Design §24 is implemented and merged.**

- **The T1 band** is a lean and a verb that compose into one generated sentence.
- **Shards:** every node pays one shard, and a biome's families drop its weapon's lanes.
- **Non-weapon slots:** the armour, charm and boots trees are parked, and the +N ladder
  and the evolve path are retired on every slot.
- **The UI:** the weapon page, the rhythm readout and one readable effect per payload
  follow the approved mockup.
- **The guide** teaches both purchases, and all six classes completed Tier 1 at 1x, gate
  paid, in a per-class sweep.

The suite is 376/376 and typecheck is clean.

**Not yet "every card does something".** On both instruments, a verb that fires is
perceptible: the median pair is +6–7% over a no-card control, and several pairs reach
+20–38%. **But four T1 verbs barely fire, or never do:**

- **Control** never fires. No T1 kit supplies a slow, and the composition cannot hold a
  target by itself, which contradicts §24.2.
- **The Rapier's Affliction verb** fires only for the Apprentice.
- **Kill chain** barely fires on bosses.
- **Empowered on the Slinger** never pays a hit-shaped payload.

So 13 of the 45 lean × verb pairs fall under the 0.9× viability floor because they don't
fire, not because a number is too small. Those are design calls and head the list at the
end. The run also found and fixed two runtime defects:

- the Axe's Tempo verb fired only on its own misses;
- the mechanic proxy double-fired on the DoT and Conduit roots.

## How the run went

The conductor (Opus) worked in `../mmo-lin-w2c` on `feat/course-correction`. Opus subagents
worked in `../mmo-lin-w1a`, `w1b`, `w1c`, `w1d2` and `w2a`. Every merge ran typecheck and
the full suite on the merged tree before it was committed.

| Wave | Task | Branch | Run by | Merge | Full suite at merge |
|---|---|---|---|---|---|
| 0 | Baselines | — | conductor | `9ccbca49` | 363/363 |
| 1 | W1-A composition | `feat/cc-compose` | Opus | `3bfdc7fa` | 365/365 |
| 1 | W1-B shards | `feat/cc-shards` | Opus | `0347a9f5` | 366/366 |
| 1 | W1-C slots | `feat/cc-slots` | Opus | `ed8cfad4` | 367/367 |
| 1 | W1-D ladder fold | `feat/cc-fold` | the designer's session (Astra) | `33f2f563` | 368/368, after six pin fixes |
| 2 | W2-A weapon page | `feat/cc-page` | Opus | `39ac63a9` | 369/369 |
| 2 | W2-B rhythm readout | `feat/cc-readout` | Opus | `b332a5cc` | 371/371 |
| 2 | W2-C payload FX | `feat/cc-fx` | Opus | `f21df326` | 373/373, after one sandbox fix |
| 3 | W3-B tutorial + sweep | `feat/cc-tutorial` | Opus | `1fda3772` | 373/373 |
| 3 | W3-A bench floor + matrix | `feat/cc-bench` | Opus | `22912ff5` | 376/376 |
| 1 | W1-E icons (delivered last) | `feat/cc-icons-art` | the designer's session (codex) | `221036b7`, wired in `4493ed67` | 376/376 |

Conductor commits besides the merges:

- `95a9ba8b` landed shard names on `PacketDefinition` before Wave 1, so W1-A and W1-B would
  not both add them.
- `766900a1` folded the run into [`lineages-current-state.md`](../lineages-current-state.md).
- `3539665c` made the boss lab's tutorial-Rapier diagnostic read the tutorial's own pairs.
- `4493ed67` wired the approved icons to their two consumers: the shard icons and the
  rhythm-ring payload glyphs.

Four things went sideways:

1. **Two of the designer's sessions shared the main checkout.** At 13:29 the fold session
   created `feat/cc-fold` there, and at 13:34 the icons session switched the same checkout
   to `feat/cc-icons`. The fold's eleven commits therefore landed on the icons branch first.
   The fold session cherry-picked them onto `feat/cc-fold` in its own worktree (its report
   records this), and the brief was amended to one worktree per session. The conductor
   moved to `../mmo-lin-w2c` as soon as the foreign edits showed up, and did not touch the
   main checkout again until the final merge into `develop`.
2. **The first Wave 0 suite was contaminated** by the fold's uncommitted edits in that shared
   checkout (361/363). The clean rerun was 363/363.
3. **An API session limit** stopped all three Wave 2 agents mid-task. They were resumed with
   their work intact.
4. **The permission system refused W2-C's own merge** of the integration tip into its
   branch. It did not work around that, and the conductor resolved the three conflicts in
   the integration merge.

## What moved

Every number below is PROVISIONAL and the designer's to change. Where a task picked a number,
the reason is given. [`lineages-current-state.md`](../lineages-current-state.md) §3a, §9, §13
and §15 hold the living truth.

### Wave 0 — baselines (before any change, `95a9ba8b`)

**Suite:** 363/363. **Typecheck:** clean.

**T1 boss lab:** `reports/course-correction/baseline-boss.{jsonl,md}`, from the 900-fight
`plan-base.json` (six classes × five bosses × 30 seeds, the tutorial kit, no lineage band).

| Boss | Floor (worst class's win rate) |
|---|---|
| Razorback | 90% |
| Greatbear | 97% |
| Toadeater | 87% |
| Behemoth | 77% (Striker 23/30) |
| Broodmother | 100% |

**T1 lane bench:** `reports/course-correction/baseline-lanes.{json,jsonl,md}` (T1 nodes,
band 1, family-dominated nodes, frames off). The median packet uplift was +3.9%. That
spread is the "imperceptible" texture §24.1 describes:

| Packet | Uplift |
|---|---|
| Engagement | +8.9% |
| Affliction | +6.4% |
| Control | +6.3% |
| Kill chain | +3.9% |
| Empowered | +1.5% |
| Tempo | +1.2% |
| Technique | +0.8% |

### W1-A — the lean and the verb compose (§24.2)

The conductor settled five gaps in the brief:

1. **Numbers live in `magnitudes.ts`** (`PACKET_HALF_NUMBERS`), and `PacketDefinition.halves`
   carries only shapes and phrases. This keeps the "one magnitude table" invariant.
2. **Payloads are per firing**, not divided by the trigger rate (§24.1).
3. **No lean active → the verb reads its own pure pair.** Otherwise Empowered alone is
   degenerate: "when your mechanic fires, the hit counts as your mechanic firing".
4. **Kill chain's "next hit after a kill"** is `kill` plus a carry latch, not a third new
   trigger kind.
5. **A proxied hit is flagged `mechanicProxy`**, and every frame loop skips it.

| Number | Value | Reason |
|---|---|---|
| Tempo moment | every 6th landed hit | the brief; §24.1 "n of 5–6" (≈4 s at 1.5 attacks/s) |
| Tempo payload | echo, 1.0 of the hit, carrying on-hit | "lands twice" is a whole second swing |
| Affliction moment | a hit on an afflicted target, capped once per 5000 ms | §24.2 |
| Affliction payload | lineage bleed, 1.0 × the hit over 4 s | "a whole swing over 4 s" |
| Affliction pure | `redose`: 1.0 × what the target's DoTs still owe, over 4 s | "doubles its affliction"; copying a DoT onto itself merges rather than doubles it |
| Engagement | first hit on each body, `big-hit` ×2 | the brief |
| Empowered payload | `mechanic-proxy`: the class's own multiplier (1.5 for dot, summoner and non-Duelist reload) | the fallback is the pure number |
| Empowered pure | `big-hit` ×1.5 on the mechanic's hit | "half again as hard" |
| Control moment | a hit on a slowed, rooted, chilled or frozen target, capped once per 5000 ms | §24.2 |
| Control payload / pure | `root` 2000 ms / `stun` 1500 ms | the brief |
| Kill chain | heal 10% of max HP; the next hit ×1.5 | the brief |
| Technique payload / pure | refund ⅓ / ½ of that Technique's remaining cooldown | the brief |
| Lean: attack speed | 0.06 → 0.09 | §24.2 "8–10%" |
| Lean: attack % | 0.05 → 0.09 | same |
| Lean: Technique power | 0.10 → 0.09 | same |
| Lean: DoT potency (new) | 0.10, into `dot.mechanic-mult` | §24.2 |
| Lean: move speed | 4 → 11 | 9% of the reference 120 |
| Lean: Attack | 3 (unchanged) | ≈10% of a 29-Attack T1 weapon |
| Normalisation | `hit-afflicted` and `hit-held`: 2 fires per pull | 12 s ÷ 5 s |

The lean units also feed the T2–T4 stat rows through the tier scalar:

- attack speed and attack % now run 0.09 / 0.104 / 0.119 / 0.135 across T1–T4;
- move speed runs 11 / 24 / 55 / 121, so T4 is +121.

**Card names.** The Rapier's come from the mockup. For the other weapons, each verb names its
moment:

| Weapon | Leans | Verbs |
|---|---|---|
| Rapier | Quick Wrist / Envenomed / Keen Edge | Flurry / Venom Point / Opening Lunge |
| Broadsword | Drilled Form / Warpath / Weight Behind It | Set Piece / Onward / Crowning Blow |
| Hammer | Overhead / Crushing Weight / Closing Stride | Crash Down / Pinned / Doorbreaker |
| Axe | Loose Grip / Bloodscent / Hewing Arc | Chopping Rhythm / Next Head / Cleaving Blow |
| Dagger | Coated Edge / Tendon Cut / Silent Step | Into the Wound / Easy Prey / Next Throat |

### W1-B — one shard per node; families follow lanes (§24.3–§24.4)

- **Family drops:** Sky → kill-chain, Grove → engagement, Hopper → engagement, Brood → tempo.
  Family sources now match §24.4 exactly.
- **Node shards:** `nodeShard(nodeId)` is the dominant family's `drops`. Every non-boss kill
  in a blended node pays it; dungeons keep the per-mob rule.
- **T1 nodes paying each shard:**

  | Shard | Nodes |
  |---|---|
  | Anvil | 7 |
  | Gale | 6 |
  | Venom | 4 |
  | Bone | 3 |
  | Shackle | 2 |
  | Spark | 2 |
  | Sigil | 1 (+ the Plains boss) |

  All 15 (weapon, lane) pairs can be paid in their home biome.
- **Swamp reorder** (review P17), following the arrival order from the Forest
  (02 > 01 > 04 > 03 > 05):

  | Node | Arrival | Old blend | New blend |
  |---|---|---|---|
  | 02 | 1st | coven 70 | 34 / 33 / 33 |
  | 01 | 2nd | mire 70 | mire 45 / coven 45 / stalker 10 |
  | 04 | 3rd | 45 / 45 | mire 70 |
  | 03 | 4th | stalker 70 | stalker 70 (unchanged) |
  | 05 | 5th | 34 / 33 / 33 | coven 70 |

  The 70% blends go mildest first by pull radius (Mire 165, Stalker 180, Coven 210). That
  order was the subagent's pick.
- **Copy and surfaces:**
  - shard names everywhere;
  - the arrival banner reads "Pack territory · every kill here drops Gale Shards";
  - the node panel and map tiles name the territory and its shard;
  - refusal reasons use shard and biome names (review L21);
  - the shard-farm stall is a named block reason (review L26).

### W1-C — non-weapon trees parked; the ladder and evolve retired everywhere (§24.5)

- **Parked lineages:** all 15 are `parked`. Every way into them refuses with "This slot has
  no tree yet.", and none resolves cards or capstones. Review P4 is moot.
- **Evolve retired:** 58 non-weapon `evolvesFrom` lines are dropped.
  - T2+ vests, charms and boots are now plain recipes at their biome level.
  - Weapon T2+ forms stay gated (review B4).
  - The evolve UI is deleted, which also makes review P11 impossible.
- **Ladder retired:** upgrades are refused on every slot, `stats.ts` ignores `itemUpgrades`,
  and the Upgrade tab and the +N badges are gone.
- **Refund:** a frozen 86 × 5 table pays back non-weapon levels on load. Totals: red 21,644,
  blue 26,640, green 23,653, yellow 19,490, purple 23,713.
- **Unlock levels:** none needed picking.

### W1-D — the ladder fold (the designer's session)

86 armour, charm and boots items carry their old +5 total (stats and `mechanicEffects`) in
base. Report: [`cc-fold-report-2026-10-03.md`](cc-fold-report-2026-10-03.md).

**The merge.** The fold clashed with W1-C on adjacent lines in ten recipe files. The
conductor took the fold's version minus exactly W1-C's `evolvesFrom` deletions, count-checked
per file.

**Six tests** pinned the retired ladder. They were fixed in the merge, with no data touched:

- the bot `economyInstrumentation` test now checks that no recipe carries a ladder, and reads
  essence shortages off a craft;
- the natural-entry wallet anchor is frozen at its retirement values (red 195, blue 155,
  green 150, yellow 150, purple 150); a live read is now zero, which would collapse the
  natural arm into the clean one;
- the t3 and t4 lifetime-ladder sections are retired, with a no-ladder assertion in their
  place;
- `itemSourceOutliers` "completed" speed is the base now (113/157/209, which hold exactly);
- `tierEntryBootstrap` returns to 166.

### W1-E — icons (the designer's session)

- **What shipped:**
  - nine shard crystals in the essence-icon language;
  - ten buff tiles;
  - seven payload glyphs.
- **Provenance:** generated with the built-in OpenAI image tool, approved by the designer in
  the gallery, and packed. Report: [`cc-icons-report-2026-10-03.md`](cc-icons-report-2026-10-03.md).
- **In code:** the branch removed the ten buff-tile aliases. The conductor then pointed
  `shardIconSource` at the `items/materials/<shard>.png` atlas frames and filled the readout's
  `RHYTHM_PAYLOAD_GLYPHS` hook with the glyph files.

### Wave 2 — the page, the readout, the FX (§24.6, rule 4)

#### W2-A, the weapon page

- It follows the mockup; see current-state §13.
- Copy and layout picks:
  - row questions say "weapon", not "blade";
  - the gate block names the boss's lair, not "node 05";
  - there is one gate block per boss (the Rapier's two T2 doors sit behind two bosses);
  - no new animations.
- Behaviour picks:
  - a purchase also sends `setActive`, because the server only auto-activates into an empty
    row;
  - cards that refuse stay clickable and toast their reason.

#### W2-B, the rhythm readout

- **Transport:** a `ShowsRhythm` networked slice, written only on change. The buff path
  would have written a world-log line on every hit.
- **Ring behaviour:**
  - a count ring is READY at n−1;
  - Empowered and Technique rings pulse only;
  - the frame ring is labelled "Frame", because "Flurry" is both a frame and a verb.
- **Sizes and timings:** rings are 40 px (34 px on mobile, where they form a column); the
  ready flash is 520 ms; the floating word rises 28 px over 900 ms.

#### W2-C, the payload FX

- **One effect per payload**, on the bodies. Server truth drives every duration: `card-fx`
  carries `durationMs` and `abilityIds`, plus a new `lineage-load` event.
- **A real bug fixed:** the Technique refund now publishes the new cooldown; the HUD used to
  keep sweeping the old one.
- **Timings:**
  - the echo comes 190 ms after the first swing;
  - the lunge takes 110 / 70 / 260 ms (dash, hold, return);
  - the knockdown takes 260 ms, and the get-up 410 ms;
  - the refund flash lasts 900 ms.
- **Looks:** flair is capped at 1.3× size and 1.6× sparks, and the heavy drip is drawn in
  Venom green even for a bleed.

### Wave 3

#### W3-A, the bench floor, the composition matrix and two fixes

- **Defect fix 1, `dcd06e5e`:** `hit-nth` counts landed hits only. A chaotic miss neither
  advances nor fires it; before the fix, the Axe's Tempo verb fired only on its own whiffs.
- **Defect fix 2, `9390689c`:** the proxy now also refuses an exchange whose real mechanic
  already fired. The DoT stack fill and the Conduit formation announce their mechanic
  without spending a charge, so the hit counted twice.
- **The criterion is §24.1's viability floor:** no lane or pair below 0.9× its tier's median.
  The ±3 pp band is retired in code and in the living docs. The ordinal encounter check is
  unchanged.
- **Three named wiring tests** (`compositionPairs.test.ts`):
  - a Control loop stays under its 5 s cap;
  - the proxy never emits `mechanic-fired`, on all six roots;
  - the Affliction moment on an Apprentice fires at the cap (12 times in 101 hits), never
    per hit.

#### W3-B, tutorial and bot routes

- **The two purchases:**
  - the guide buys a lean at Forest 2;
  - it buys the verb where Forest 4 AND Global Mastery 18 both hold, which is the end of the
    Swamp leg;
  - the lesson is the verb's sentence, then its ring.
- **The Rapier stays worn** for every lineage step and for the gate beat.
- **The first-hour checklist** (at most two new ideas per level and per beat) is data and is
  tested.
- **Smaller changes:**
  - the club and the Bark Wrap are now crafted during the tier-0 quest, so the tier-up comes
    at 102 s instead of 118–128 s;
  - the Slinger's Forest armour moves to Forest 3.
- **Picks:** every pick crosses two lanes, so the verb's sentence visibly changes when the
  lean is bought.

  | Class | Lean → verb |
  |---|---|
  | Striker, Slinger, Conduit | Quick Wrist → Opening Lunge |
  | Squire, Spirit | Keen Edge → Flurry |
  | Apprentice | Envenomed → Opening Lunge |

## Composition matrix

The full tables, per-class rows and outlier lists are in
[`reports/course-correction/composition-matrix.md`](../../reports/course-correction/composition-matrix.md).

**The runs:**

- **Boss lab:** 15,000 fights (5 weapons × 10 rows × 6 classes × 5 bosses × 10 seeds).
- **Lane bench:** 9,000 runs (each weapon's 3 home-biome family-dominated nodes × 10 seeds,
  90 s each).

**How to read a cell:** median uplift over the six classes · verb firings per minute.
Uplift is against the same class wearing the same form with no cards. Rows are the lean,
columns the verb, and the diagonal is the pure pair.

| Weapon (verb columns) | Lean | Boss lab | Lane bench |
|---|---|---|---|
| Broadsword (technique / kill-chain / empowered) | technique | +5.1·13.1 / +0.0·1.2 / +0.8·7.6 | −0.3·15.8 / +0.5·11.1 / +1.2·3.1 |
| | kill-chain | +5.7·7.6 / +0.2·1.4 / +10.1·7.5 | +15.2·14.0 / +16.5·16.3 / +4.3·4.0 |
| | empowered | +14.8·7.0 / +7.6·1.3 / +17.3·6.7 | +16.3·12.0 / +19.8·14.8 / +1.4·3.7 |
| Rapier (tempo / affliction / engagement) | tempo | +15.8·14.5 / +5.8·0 / +5.7·2.7 | +7.5·7.4 / +2.9·0 / +8.9·12.1 |
| | affliction | +10.2·13.7 / +0.0·0 / +1.1·2.6 | +0.0·7.2 / +0.0·0 / +3.6·11.2 |
| | engagement | +26.9·13.4 / +11.8·0 / +11.6·2.7 | +11.3·6.7 / +7.8·0 / +13.3·12.6 |
| Hammer (empowered / control / engagement) | empowered | +17.4·4.4 / +6.6·0 / +10.8·2.6 | +8.1·2.4 / +6.6·0 / +21.4·5.8 |
| | control | +4.8·5.2 / +4.7·0 / +4.8·2.6 | +6.1·2.5 / +5.0·0 / +2.6·5.8 |
| | engagement | +25.2·4.3 / +4.7·0 / +8.0·2.7 | +8.1·2.4 / +5.0·0 / +14.1·6.7 |
| Axe (tempo / kill-chain / empowered) | tempo | +21.4·6.8 / +8.8·1.4 / +25.4·7.2 | +10.0·4.0 / +12.6·6.7 / +6.0·4.1 |
| | kill-chain | +6.8·6.0 / +0.2·1.4 / +11.7·6.7 | +12.6·4.1 / +13.5·7.4 / +10.7·4.2 |
| | empowered | +18.3·6.3 / +8.6·1.5 / +19.1·6.5 | +2.8·3.1 / +5.3·6.4 / +6.2·3.7 |
| Dagger (affliction / control / kill-chain) | affliction | +38.4·10.3 / +0.0·0 / +0.0·1.4 | +11.2·7.2 / +0.0·0 / +3.7·5.9 |
| | control | +7.2·10.3 / +6.4·0 / +5.8·1.5 | +5.8·7.7 / +2.5·0 / +4.5·5.9 |
| | kill-chain | +4.4·10.5 / +0.2·0 / +0.2·1.4 | +8.3·7.7 / +3.5·0 / +6.8·6.0 |

**The floor:**

| Instrument | Median pair | Floor (0.9×) | Pairs below | Pairs above 1.5× |
|---|---|---|---|---|
| Boss lab | +6.8% | +6.1% | 20 of 45 | 15 |
| Lane bench | +6.2% | +5.5% | 19 of 45 | 14 |

**Below the floor on both instruments (13 pairs).** Each is a firing problem, not a
magnitude problem:

- every Control-verb pair, and the Hammer's Control lean on its Engagement verb;
- the Rapier's three Affliction pairs: tempo × affliction, affliction × affliction, and
  affliction × engagement;
- the Broadsword's Technique lean on all three verbs;
- the Dagger's affliction × kill-chain and control × kill-chain.

**Firing:**

- the Control verb fired 0 times in 1,800 boss fights and 1,080 lane runs;
- the Rapier's Affliction verb fires only for the Apprentice;
- the Slinger's Empowered verb never lands a hit-shaped payload, because a reload has no hit;
- the Conduit's Empowered moment fires 25–40 times a minute, against 1–9 for every other
  class;
- Kill chain fires 0.3–1.5 times a minute on bosses (only on adds);
- no purchase was refused anywhere.

**Above 1.5×:**

- **Boss lab:**
  - Dagger pure Affliction: +38% (+76% on the Apprentice);
  - Rapier engagement × tempo: +27%;
  - Hammer engagement × empowered: +25%;
  - Axe tempo × empowered: +25%;
  - Axe tempo × tempo: +21%.
- **Lane bench:**
  - Hammer empowered × engagement: +21%; the first hit on every body counts as the mechanic,
    which one-shots T1 mobs;
  - the Broadsword's Kill-chain and Empowered leans on its Technique and Kill-chain verbs:
    +15–20%.

**An engine finding, not touched:** attack timing is quantised to the 10 Hz tick.

- The Tempo lean is worth exactly 0 to the Striker, the Spirit and the Slinger on the Rapier,
  because 590 → 543 ms still rounds to 600 ms.
- To the Squire it is worth a whole tick (+11.6%).

## Boss lab: after vs before

The baseline plan (tutorial kit, no band, 900 fights) rerun on the merged code:
[`reports/course-correction/after-boss.md`](../../reports/course-correction/after-boss.md).

**750 of 900 fights are byte-identical**, which confirms the W1-D fold kept the old +5
power. All 150 that moved are the Striker's:

| Class | Win rate before → after | Median TTK on wins |
|---|---|---|
| Striker | 93% → 91% (Toadeater 29/30 → 27/30) | 55.2 → 55.1 s |
| Squire, Slinger, Spirit, Apprentice, Conduit | unchanged (97 / 100 / 97 / 99 / 100%) | unchanged |

| Boss | Win rate before → after |
|---|---|
| Razorback | 98% → 98% |
| Greatbear | 99% → 99% |
| Toadeater | 95% → 94% |
| Behemoth | 96% → 96% |
| Broodmother | 100% → 100% |

The cause, bisected to the W1-C/W1-D merges:

- The Swamp charm's old ladder steps added `recovery-pulse-pct` with no interval.
- The fold put that bonus on the charm's 8 s cadenced pulse.
- The pulse accumulator normalises cadenced sources to the fastest interval, and the
  Striker's own 6 s pulse is faster.
- So the Striker's pulse fell from 0.45 to 0.425.

**The tutorial's own pair** is a no-op in the lab, because every boss kit wears the Axe or
the Dagger. A labelled diagnostic kept the Rapier on with each class's pair:

- **The pair itself:**
  - Keen Edge × Flurry pays +23–32% for the Squire and +32–38% for the Spirit;
  - Quick Wrist × Opening Lunge pays only +0.5–3%, since it fires once per target.
- **The cost of the Rapier itself:**
  - the Striker's Razorback win rate falls from 90% to 30–40%;
  - the Apprentice's Greatbear falls from 97% to 47% (77% with its pair);
  - the Conduit's median TTK rises from 53 s to 63–82 s.

## Sweep ledger (1x, one server and one database per class)

Full ledger: [`reports/course-correction/sweep-1x.md`](../../reports/course-correction/sweep-1x.md).

- **Setup:** revision `1297b206`, `taints: []`. Bots were launched directly, so the runs are
  1x and untainted but not frozen-runner canonical: the frozen runner cannot target
  per-class servers.
- **Outcome:** all six classes completed the whole script with the gate paid. Every beat
  ended `done`, and no stall was raised.

| Class | Wall | Beats | Deaths | Lean bought | Verb bought (GM 18) | Plains seal | Mountain seal | Greatbear (gate) |
|---|---|---|---|---|---|---|---|---|
| Striker | 68m41s | 60/60 | 4 | 12m26s | 23m22s | 1/1 | 1/3 | 3/5 |
| Squire | 61m55s | 60/60 | 2 | 12m51s | 23m38s | 1/1 | 1/1 | 3/5 |
| Slinger | 58m38s | 63/63 | 2 | 11m29s | 23m52s | 1/1 | 1/1 | 3/5 |
| Spirit | 47m26s | 63/63 | 2 | 10m40s | 17m43s | 1/1 | 1/1 | 3/5 |
| Apprentice | 69m26s | 65/65 | 2 | 16m00s | 29m40s | 1/1 | 1/1 | 3/5 |
| Conduit | 51m19s | 63/63 | 2 | 10m28s | 18m56s | 1/1 | 1/1 | 3/5 |

- **Deaths:** 12 of the 14 are the Forest guard pack in the gate rounds, two per class, as
  before. The Striker's other two are the Crag Behemoth at 8% left.
- **Gate timing:** five classes pay the gate 4.6–8.0 min sooner than the 2026-10-02 evening
  sweep; the Striker is 1.0 min later.
- **Verb lifetime:** the verb is live for only 4.6–8.6 min (28–37 kills) before the Cave
  swaps every plan's weapon.

## Screenshots

All are under `reports/course-correction/screens/`, taken on per-task servers and clients
built from each branch.

**`w2a-page/` (15):**

- (a) a fresh Rapier, nothing bought;
- (b) a lean active with another lean hovered: the stat sheet shows before → after, and the
  verbs re-read;
- (c) a lean and a verb both active;
- (d) the gate blocks with their capstone pips;
- (e) the Hammer's Control verb showing "needs a slow";
- (f) mobile, three shots;
- (g, h) buy toasts;
- (i) the Apprentice hovering the DoT lean;
- (j) a T2 band, collapsed and expanded;
- (k) a gate paid, then the new form worn with the T2 band lit.

**`w2b-readout/` (9):**

- rings beside the HP bar, with the floating word;
- Flurry at 3/6 beside a full frame bank;
- Flurry ready (5/6) beside an open frame window;
- the word mid-rise;
- the Opening Lunge latch, ready and spent;
- the Venom Point cap clock, and the cap ready;
- mobile.

**`w2c-fx/` (11 strips, captioned in ms):**

- lands twice;
- the lunge, plus the Opening Lunge on a live boar;
- the mechanic flash on a Striker and on a Squire;
- crash;
- heavy drip;
- double dose;
- shackle;
- knockdown;
- heal-and-load;
- the Technique refund flash on the ability bar.

The FX strips predate the merge, so W2-B's floating word does not appear in them, and most
were shot on the test-room dummy (a grey box).

## What could not be verified

- **In a live client:**
  - the tutorial director's `setActive` and lesson playback (the dev client is hard-wired to
    :4000);
  - the page's keyboard-focus preview, and any touch device;
  - the readout's kill-carry ring, capstone pulse and energy/summoner/reload frame rings,
    plus reduced motion and other UI font scales;
  - the FX early-end paths (a resisted root or stun, a shackle broken by death), the FX seen
    by a remote viewer, the mobile ability tile, and most FX on real mobs (only the lunge and
    heal-and-load were shot on live mobs);
  - W1-B's map, banner and wallet beyond the page's materials column;
  - the W1-E icons after the conductor's wiring (typecheck and tests only).
- **In the runs:**
  - whether the bought verb actually fires during the tutorial: the bot does not record card
    firings, though the boss lab and lane bench do;
  - the reordered opening was smoke-run for only 8 minutes (it is later than the sweep's
    revision);
  - the sweep is 1x and untainted, but not frozen-runner canonical;
  - the classic lane matrix was not rerun under the new floor (only replayed on the
    baseline).
- **Not exercised:**
  - the legacy bot routes: 76 T2 routes that evolve a weapon and now stall with a named
    reason, and about 135 upgrade steps that are now skipped;
  - the `dps-report` and `ehp-report` tools, which now clamp to +0.
- **Latent, not fixed:** `first-hit`, `hit-afflicted` and `hit-held` do not skip chaotic
  misses. No T1 Axe lane uses them.

## The designer's open calls

### Verbs that do not fire at T1 — these decide whether the band works

1. **Control is dead at T1.** No T1 kit slows a target. The pure Control payload is a
   knockdown, and a stun is not "held". That contradicts §24.2's "the Control payload itself
   supplies [a slow] once it has fired once".
   - Option: let the knockdown count as held.
   - Option: give the T1 Control lean a slow.
   - Option: accept that Control waits for the Mid range at T3.
2. **The Rapier's Affliction verb fires only for the Apprentice.** Separately, the Affliction
   lean (DoT potency) moves a number only for the DoT root: the lineage bleed and poison
   payloads do not read it.
3. **Kill chain on bosses** fires 0.3–1.5 times a minute.
4. **The Slinger's Empowered verb** never lands a hit-shaped payload, because a reload has
   no hit.
5. **The Conduit's Empowered moment** fires 25–40 times a minute and needs a cap, or a
   normalisation entry from the mechanic's reference cadence (§24.2).

### The tutorial

6. **The verb lands at Global Mastery 18** (the end of the Swamp leg), not at Forest 4 as
   the mockup implies. Lower the T1 verb row's mastery gate if Forest 4 is the intent.
7. **The bought pair is inert in every boss fight**, because the Cave swaps every plan to the
   Axe or the Dagger. The diagnostic above is the cost list for keeping the Rapier on.
8. **Other tutorial choices to confirm:**
   - the per-class picks;
   - crafting the club and the Bark Wrap during the tier-0 quest;
   - the Slinger's Forest armour at Forest 3;
   - the Striker's Mountain seal went 1/3 in the sweep.

### Numbers (all provisional)

9. **Every value in the W1-A table**, including the T4 move-speed lean of +121.
10. **The outliers above 1.5×:**
    - Dagger pure Affliction (+38%, +76% on the Apprentice);
    - the Engagement lean on frequent verbs;
    - the Hammer's Empowered lean on its Engagement verb on farms;
    - the Axe's Tempo lean.
11. **The price of a plain craft.** T2+ armour, charms and boots now cost the old evolve
    `cost`, about 3.5× below `reconstructCost` (`forest-vest-t2` costs 48 green + 12 yellow
    instead of 168 + 42). On craft cost alone, the slot ordering (armour > charm > boots) now
    ties in places.
12. **The Striker's pulse after the fold:** keep 0.425, or fold the Swamp charm's ladder as
    pct-only to restore 0.45.
13. **Attack-speed tick quantisation:** carry the remainder past each tick (which moves every
    attack-speed number in the game), or accept it.

### Shapes and rules

14. **The Brood now drops and punishes Tempo.** It is the one family whose favoured and
    punished lane are the same.
15. **Eight T2–T4 nodes pay a family they cannot field:** t2-swamp-01, -04 and -05;
    t2-jungle-03; t3-jungle-02; t3-desert-02; t3-swamp-03; and t4-mountain-02.
16. **Ties go to the family listed first**, so in each T1 biome one lane is paid by three
    nodes and the other two by one each. For example, the Rapier's Venom and Spark shards
    each come from a single Forest node.
17. **Parked lineages and shards:**
    - parked lineages grant no capstone, so a T2+ vest no longer carries its capstone verb;
    - the boss Lane-A stopgap still pays Iron and Glass Shards, which cannot be spent while
      the trees are parked.
18. **The vocabulary is over design §6's caps:** 13 trigger kinds against ≤12, and 23 payoff
    kinds against ≤18.
19. **Proxy semantics:**
    - a proxied hit counts as the mechanic for Shockwave, the range gates, Time-to-Strike and
      the T3 afterHit riders;
    - it suppresses Always First and Signature on that exchange;
    - roots without a damage mechanic use the 1.5 fallback.
20. **Kill chain's pure sentence** says "A kill heals…", but the heal lands on the next hit.
21. **T2+ cards** still use the old per-pull resolution, so they read tiny next to the T1
    verbs (Running Riposte echoes 6.7% of a hit). T2 rows are labelled Lean / Verb but do not
    compose.
22. **Copy:**
    - the Hammer's Control and Engagement leans both read "+3 Attack.";
    - "Every 6th hit refunds a third of that Technique's cooldown" says "that Technique" at a
      hit moment;
    - the "(once every 5 s)" phrases run long.
23. **Purchases:** should buying a card activate it server-side even when its row is already
    occupied?

### UI and FX

24. **Readout:**
    - should the Empowered ring mirror the mechanic's readiness?
    - is it acceptable that the frame ring is dropped at T4 when three cards trigger?
    - should a count ring show READY at n−1?
    - should the frame ring say "Frame" or the frame's own name?
    - should a Control ring hint "needs a slow"?
    - should the floating word show for allies (it is node-wide now), and stay in Cinzel?
25. **FX:**
    - do additive afterimages count as "no tints as FX"?
    - should the refund flash be immediate (as now) or synced to the hit?
    - is a smaller boss knockdown right?
    - should the bleed drip be red or Venom green?

### Bench and docs

26. **A floor when the median is non-positive** is read as median − 0.1·|median|; that was a
    bench pick.
27. **The Swamp's 70% blend order** was a pick, and the Cave's arrival order is not curated.
28. **Design lines §24.1 supersedes** (`design_docs/` was not edited here):
    - §18.9 point 9's first paragraph (the ±3 pp band);
    - §9's "Lane budget" bullet;
    - the stray decision item above the design doc's title, which also restates the ±3 pp
      band.
