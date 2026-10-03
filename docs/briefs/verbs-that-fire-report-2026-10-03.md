# Verbs-that-fire run — report (2026-10-03 → 04)

- **Brief:** [`verbs-that-fire-run-2026-10-03.md`](verbs-that-fire-run-2026-10-03.md)
- **Design authority:** [`progression-rework-design.md`](../../design_docs/progression-rework-design.md)
  §24, §24.9 last
- **Follows:** [`course-correction-report-2026-10-03.md`](course-correction-report-2026-10-03.md)
- **Branch:** `feat/verbs-that-fire` off develop `733325c4`, merged into `develop` by the
  commit that follows this report. Not pushed.
- **Evidence:** `reports/verbs-that-fire/`

## Verdict

**Design §24.9 is implemented and merged.** The suite is 379/379 and typecheck is clean.

- **The leans seed their condition.** The Affliction lean lays a light bleed on every hit
  and the Control lean a short slow, for every class, and a knockdown counts as held. The
  two verbs that never fired at T1 now fire wherever their own lean is slotted:
  - **Control:** 0 of 2,880 matrix runs → 960 (every run with the Control lean). The pure
    pair fires 9–10 times a minute on bosses. It pays in survival: the Hammer's win rate
    against no cards rises +5 → +16 pp, the Dagger's +0 → +12 pp.
  - **The Rapier's Affliction verb:** the Apprentice only → every class with the Affliction
    lean. The lean lifts every Rapier verb on bosses (Tempo +10.2 → +19.6%).
- **The Empowered moment is capped at 4 s.** It binds only the Conduit: 33 → 11 firings a
  minute.
- **T2+ bands compose.** The verb's payload grows with the tier and its cadence does not;
  the amplifier moves an axis of the pair the player has. On the Rapier and Broadsword T2
  bands, the verb's own share is at least its T1 share in 16 of 18 pairs (the other two
  are within noise).
- **The tutorial teaches the tree on the weapon each class fights with**: the Axe for five
  classes, the Dagger for the Slinger.
  - **Every fight fired the verb:** in the 1x six-class sweep, the bought verb fired in all
    30 boss fights (two seals and three gate wins per class), 4–23 times a fight.
  - **Faster:** every class reached Tier 2 sooner, by 1.7–9.1 min.
  - **The T1 verb row** opens at Global Mastery 10 (it was 18).
- **Data:** the eight T2–T4 nodes now pay a family they field, and the boss stopgap stops
  paying the parked trees' shards.

**Not yet "every pair does something on every instrument."** 12 of 45 pairs sit under the
0.9× floor on both the boss lab and the lane bench (13 before). Firing is no longer the main
cause:

| Reason | Pairs | What would change it |
|---|---|---|
| **Never fires:** an off-lane lean on a conditional verb, with no other source of the condition | 4: Rapier Tempo × Affliction; Hammer Engagement × Control; Dagger Affliction × Control and Kill chain × Control | A designer call: open call 1 |
| **Fires, and nothing measured sees it:** a Control lean (a slow) paying a root, against a boss already in melee range | 4: Hammer Control × Empowered and Control × Engagement; Dagger Control × Affliction and Control × Kill chain | Open call 2 |
| **Small, or starved on bosses** | 4: the Broadsword's Technique lean on all three verbs; Dagger Affliction × Kill chain | Numbers, or "weak on bosses", which the page already says |

## How the run went

The conductor (Opus) worked in `../mmo-lin-w2c` on `feat/verbs-that-fire`, off `develop`
`733325c4`. Opus subagents worked in `../mmo-lin-w1a`, `w1b`, `w1c` (wave 1) and `w1d2`
(wave 2). Every merge ran typecheck and the full suite on the merged tree before it was
committed.

| Wave | Task | Branch | Merge | Full suite at merge |
|---|---|---|---|---|
| 0 | Baseline | — | `733325c4` | 376/376 |
| 1 | A — leans seed their condition | `feat/vf-conditions` | `e7d99225` | 378/378 |
| 1 | B — T2+ bands compose | `feat/vf-t2` | `bb7c2209` | 378/378 |
| 1 | C — data and docs | `feat/vf-data` | `57916b52` | 378/378 |
| 2 | Tutorial | `feat/vf-tutorial` | `359b1549` | 379/379 |

**Conductor calls before launch** (the brief's "Decide before launch" items were not decided):

- **Task D, tick quantisation, was left out.** The brief offers it as a wave-1 task "or
  leave it", §24.9 lists it as the designer's open call, and it moves every attack-speed
  number in the game. It stays open; the run measured what it costs (below).
- **A ran on the brief's provisional numbers:** slow 15% / 1.5 s, Empowered cap 4 s, bleed
  share 0.10 (the 8–10% lean rule of §24.2).
- **C's copy item (3) moved to A**, so `packets.ts` and `sentences.ts` had one owner in the
  wave. A did all of it.

One thing went sideways:

- **The conductor's matrix slowed the sweep.** For the first ~24 min, five lane-bench shards
  beside the six-server sweep held the box at 100% CPU and the sweep servers at 8.7 Hz.
- The conductor cut the bench to two shards, and the servers held 9.2 Hz, this box's ceiling.
- The three paused shards resumed after the bots finished, and the ledger flags the early
  stretch.

The merges were clean:

- **A and B:** B merged A into its own branch to resolve their overlap in `magnitudes.ts`,
  `sentences.ts`, `resolve.ts` and `weaponPageModel.ts`.
- **C, then wave 2:** C merged clean on top, and wave 2's one shared file
  (`lineages-current-state.md`) auto-merged.

**Conductor commits besides the merges:**

- `1a9a35e5` folded A and B into `lineages-current-state.md` (§3a, the new §3b, §11–§13).
- `d2361966` holds the close-out composition matrix and the no-band after/before.
- The final docs commit (this report, current-state §15, the README, and the brief's
  status line) closes the run.

## What moved

Every number below is PROVISIONAL and the designer's. Where a task picked one, the reason is
given. [`lineages-current-state.md`](../lineages-current-state.md) §3, §3a, §3b, §10, §12 and
§13 hold the living truth.

### A — the leans seed their condition (§24.9)

| Item | What shipped | Number | Reason |
|---|---|---|---|
| Affliction lean | `dotPotencyPct` still feeds `dot.mechanic-mult` and now also puts a light bleed on every landed hit, for every class | share 0.10 of the hit (pre-empowered) over 4 s; 0.115 / 0.132 / 0.15 at T2–T4 | the brief; the lean's own value, so the bleed IS the lean |
| Its id | `lineage.lean-bleed`, its own id in the bleed driver and the lineage DoT family | — | the heavy payload keeps its refresh rule and its drip visual; neither bleed can overwrite or truncate the other |
| Its merge | a reservoir: each hit ADDS its share to what is still owed, spread over the longer of 4 s or what is left; the tick clock never resets | — | a refresh would deliver one tick's worth per hit |
| Control lean | new stat key `slowOnHit`, Control's `scalingStat` (`attack` was the placeholder) | 15% slow; 0.173 / 0.198 / 0.225 at T2–T4 (depth only) | the brief |
| Its window | the longer of 1.5 s or the wielder's swing + 500 ms | **picked** | a T1 Heavy Hammer swings every 1.5–2.5 s, so a flat 1.5 s slow wears off before the next swing and the Hammer test cannot pass |
| `hit-held` | slowed, rooted, chilled, frozen **or stunned** (a knockdown is held) | — | §24.9 |
| Empowered moment | capped like Affliction and Control | 4000 ms | the brief; binds only the Conduit (every other root's mechanic is slower) |
| Composed heavy bleed | ADDS to a heavy bleed still owed instead of refreshing it, for any composed firing (`firing.composed`; since B that includes the T2 verbs); hand-authored cards keep the refresh rule | — | **not in the brief**: a Tempo verb on a fast Rapier fires every ~3.6 s and the refresh cut ~¼ off each payload; kept by the conductor as a payload-honesty fix |

Both seeds respect `evadeBlocksDebuffs` and apply on a chaotic miss, matching the dead
swing's "still applies on-hit effects". Control immunity refuses the root and the stun, not
the slow (same as Hamstring and the at-bay slow).

**Page copy:** "needs a slow" (and not once the Control lean is active); the Slinger's
Empowered verb reads "your mechanic has no hit yet" only where its payload needs the hit
(`big-hit`, `mechanic-proxy`, `heal-and-load` — the echo, bleed, root and refund do land from
a reload); Kill chain carries "weak on bosses" as data (`momentCaveat`); Kill chain's pure
sentence is "Your next hit after a kill heals a tenth of your pool and lands loaded (+50%)."
(report item 20); the Hammer's two leans read their own stats; the Technique payload reads
"refunds a third of your Technique cooldowns"; capped phrases read "(every 5 s at most)".

### B — T2+ bands compose (§24.9)

- The fifteen weapon T2 payoff cards are verbs (ids unchanged). `composeVerb(verb, lean,
  tier)` uses the T1 halves and `PACKET_HALF_NUMBERS`; **the tier scales the payload's
  size, never the moment** (n stays 6, the caps stay 5 s / 4 s).
- **Tier scalar = `TIER_SCALAR.fraction`** (1 / 1.15 / 1.32 / 1.5), picked because every
  payload is already relative to something that grows with the tier; the `absolute` column
  would double-dip.

| Size kind | Payloads | Rule | T1 → T2 |
|---|---|---|---|
| share | echo, heavy bleed, re-dose, heal, refund | multiplied; heal and refund capped at 1 | echo 1 → 1.15 |
| bonus | lunge, crash | the bonus above 1 is multiplied | ×2 → ×2.15; ×1.5 → ×1.575 |
| load | the Kill-chain load | with the heal | ×1.5 → ×1.575 |
| duration | root, knockdown | the hold, to the 100 ms tick | 2 → 2.3 s; 1.5 → 1.7 s |
| proxy | mechanic proxy | `bonusScale` on the class mechanic's own bonus | bonus ×1.15 |

- **The amplifier moves one axis of the composed pair**, by `ROW_SCALAR.amplifier` (+60%):
  frequency (n 6 → 4, never below every 2nd hit; a 5 s cap → 3.1 s), targets, duration, or
  size. **Fallback (B's rule):** an axis the active pair does not have moves its size, so an
  amplifier never costs and does nothing. +60% of a per-firing size is large (lunge ×2.15 →
  ×2.84) — a designer number.
- **Band collapse:** the lean is `active.stat` of any tier; a payload's size comes from the
  VERB's tier, so a T1 verb reslotted under a T2 form pays T1 size and the T2 amplifier
  idles while it is slotted.
- Rows read Lean / Verb only where the band composes (every live weapon band does).

**The gate never makes cards smaller** — B's T2 boss lab
([`t2-matrix.md`](../../reports/verbs-that-fire/t2-matrix.md); Rapier and Broadsword, nine
pairs × six classes × five T2 bosses × 10 seeds, 9,600 fights, measured before A merged on
both tiers): the VERB's own share at T2 is at least its T1 share in 16 of 18 pairs; the two
short (Broadsword technique × empowered −0.3 pp, Rapier tempo × engagement −0.4 pp) are
inside the lab's noise. Every whole pair that reads lower at T2 loses it in the **lean**:
the Rapier's Tempo lean is worth +4.0% at T1 and 0% at T2 (tick quantisation: the Squire's
T1 swing gains a whole tick, its T2 swing stays at 600 ms), and the Broadsword's move-speed
lean is −0.8% on a boss. Every T2 number is at least its T1 number by construction, pinned
for all 45 T2 pairs in `composition.test.ts`. Not measured: the amplifier row, and the
Hammer, Axe and Dagger T2 bands (tests only); the T2 lane bench was built and smoke-run only.

### C — data and docs

**The eight nodes** (report item 15) are re-led to a family their pool fields, one commit per
node; **no monster was added anywhere** — every candidate body was off-tier (T1 rewards, or
1.5–5× its tier-mates' rewards, or ~40% of a T4 body's HP), and pools are shared per biome
tier, so an added body would move every sibling node too.

| Node | Was | Now | Spawns |
|---|---|---|---|
| t2-swamp-01 | Mire → Venom | Coven .7 / Stalker .3 → Shackle | unchanged |
| t2-swamp-04 | Mire (won a 45/45 tie) → Venom | Coven .8 / Stalker .2 → Shackle | unchanged |
| t2-swamp-05 | Mire → Venom | Stalker .6 / Coven .4 → Bone | 5/5 → 6/4 |
| t2-jungle-03 | Stalker → Spark | Undergrowth .6 / Ape .4 → Venom | Ape 7/3 → Undergrowth 6/4 |
| t3-jungle-02 | Undergrowth → Venom | Stalker .7 / Ape .3 → Spark | unchanged |
| t3-desert-02 | Scorpion → Shackle | Stalker .7 / Basilisk .3 → Bone | unchanged |
| t3-swamp-03 | Stalker → Bone | Mire .7 / Coven .3 → Venom | unchanged |
| t4-mountain-02 | Ridge → Shackle | Hopper .7 / Crag .3 → Spark | unchanged |

The rule: lead with the fielded family that already makes most of the node's spawns, unless
that leaves one of the tier's fielded families leading fewer than two nodes. What the doors
lost: Swamp T2 pays no Venom (the Dagger's T2 door), Jungle T2 no Spark and Jungle T3 no
Venom (the Rapier's Jungle forms crown Affliction), Desert T3 and Mountain T4 no Shackle — the
page's "where it drops" falls back to the home biome's T1 nodes for those. `nodeShards.test.ts`
now checks every node in the registry with no allowlist.

**The stopgap** (report item 17): `biomeLaneAPackets` skips `isLineageParked` lineages, so
boss kills pay only the weapon lanes (Plains Technique, Forest Tempo, Mountain Empowered, Cave
Tempo, Swamp Affliction) and never Iron or Glass; un-parking restores them with no other edit.

**Chaotic misses:** `first-hit`, `hit-afflicted` and `hit-held` skip them like `hit-nth`
(a real Chaotic Axe test per trigger).

**Docs:** §9's lane budget, §18.9 point 9's first paragraph and the stray item above the
design doc's title are marked SUPERSEDED by §24.1 in place. C found that the stray block
(items 9–13, from commits 1525e185 and 22302bbf) was meant to append to §18: 9 and 10 are
drafts of §18.9/§18.10, and 11–13 (band gating by door biome, the monster pass delegated,
the Consort loop) exist only there — it did not move them (designer's document).

### Wave 2 — the tutorial on the weapon each class fights with (§24.9)

- **Where the lesson goes:**
  - **The five Axe plans** (Striker, Squire, Spirit, Apprentice, Conduit) craft and wear the
    Chaotic Axe at Cave 1. The bot used to swap to it only after Step Back. The lean comes at
    Cave 2 and the verb at Cave 4.
  - **The Slinger** makes and wears the Poison Dagger first thing in the Swamp (Swamp 1); it
    used to keep the Rapier until the Cave. The lean comes at Swamp 2 and the verb at
    Swamp 4.
  - **The Rapier gets no lesson.** There is one page, learned once, on the weapon kept
    through the seals and the gate. The Rapier is still the farming weapon from the Forest
    to the Cave.
  - The cost: the page now arrives in the Cave leg (GM 24–30), or the Swamp leg for the
    Slinger (GM 12–18), instead of the Forest (GM 6–12).
  - The first-hour checklist still holds: at most two new ideas per level.
- **The gate is the taught weapon's.** The five Axe plans pay the Ruinous Axe with three
  Broodmother Chitin from the Cave boss; the Slinger pays the Venom Knife
  (`swamp-mirebrand`) with three Toadeater Glands from the Swamp boss.
  - The gate form is derived from the data: the lineage's tier-2 form in its home biome.
  - Paying the Rapier's gate instead would equip a page nobody bought from (review P9), and
    end the tutorial on a tier-2 Rapier with an empty band.
  - The capstone beat equips that boss's loadout from the boss matrix. That changes nothing
    for the Axe plans; for the Slinger it brings Cleanse back.
- **The T1 verb row opens at Global Mastery 10**, where the ladder said 18. It is a new data
  table, `ROW_GLOBAL_MASTERY` in `magnitudes.ts`, for lineage cards only; the ability nodes
  keep the ladder.
  - The value is the Global Mastery every class held at Forest 4 in the sweep (Plains 6 +
    Forest 4).
  - `reachability.test.ts` pins three things: a row's mastery never drops within a tier, it
    stays at or under the gate, and the T1 verb is reachable with one zone mastered.
- **Per-class picks:** on the class's fighting weapon, the pair with the best boss-lab DPS
  uplift among those whose verb fired, from the matrix rerun at `57916b52`. A median tie
  goes to the mean over bosses. Detail:
  [`tutorial-picks.md`](../../reports/verbs-that-fire/tutorial-picks.md).

  | Class | Pick (lean → verb) | Uplift | Fires/min | The verb reads |
  |---|---|---:|---:|---|
  | Striker | Loose Grip → Cleaving Blow | +31.2% | 10.2 | When your class mechanic fires (every 4 s at most), the hit lands twice. |
  | Squire | Hewing Arc → Cleaving Blow (pure) | +25.4% | 6.6 | Your mechanic hits half again as hard. |
  | Slinger | Coated Edge → Into the Wound (pure) | +42.8% | 11.6 | Hitting an afflicted target doubles its affliction. |
  | Spirit | Loose Grip → Chopping Rhythm (pure) | +24.8% | 7.3 | Every 6th hit strikes twice. |
  | Apprentice | Hewing Arc → Chopping Rhythm | +14.0% | 6.0 | Every 6th hit counts as your class mechanic firing. |
  | Conduit | Loose Grip → Chopping Rhythm (pure) | +17.0% | 26.9 | Every 6th hit strikes twice. |

  - Four of the six picks are same-lane pairs. For those, the lesson says the lean "is the
    same colour" rather than "your lean chose that".
  - The Spirit's pick tied on the median and won on the mean.
  - The Apprentice's pure Empowered pair never fired, so its pick is the best pair that does.
- **The bot records card firings** (the previous report's gap). It logs a `card-fired`
  event for each of its own landed `card-fx` that carries a `cardId`, and `own-dot-ticks`
  in 5 s batches; `cardFirings.test.ts` covers both.
  - One server change came with it: the bleed tick event now carries `sourceId`.
  - The route moved to v1.4.0.
  - `_t1BossPlan.ts --matrix=tutorial-pair` replaces the old tutorial-Rapier diagnostic.

## Composition matrix (close-out rerun)

[`reports/verbs-that-fire/composition-matrix.md`](../../reports/verbs-that-fire/composition-matrix.md)
holds the full grids, per-class rows, firings and findings.

**The runs:**

- **Code:** `57916b52`, which is wave 1 merged. Wave 2 changed no combat code.
- **Boss lab:** 15,000 fights (5 weapons × 10 rows × 6 classes × 5 bosses × 10 seeds), with
  0 errors and 0 refused purchases.
- **Lane bench:** 9,000 runs of 90 s each on the weapon's home-biome family-dominated nodes.
  It was resumed by (cell, seed) across shard changes, with no duplicate or torn rows.
- **Before:** the course-correction run's files.

| Instrument | Median pair | Floor (0.9×) | Pairs below | Above 1.5× |
|---|---|---|---|---|
| Boss lab | +6.8% → +6.8% | +6.1% | 20 → 20 | 15 → 16 |
| Lane bench | +6.2% → +6.8% | +5.5% → +6.1% | 19 → 21 (the floor rose) | 14 → 13 |
| Below on both | | | **13 → 12** | |

**What moved, pair by pair.** Each cell reads before → after. "Win" is the win rate against
the no-card control, the median over classes. Every pair not listed is unchanged on both
instruments.

| Weapon · lean × verb | Boss DPS uplift | Boss fires/min | Boss win vs control | Lane uplift | Lane fires/min |
|---|---:|---:|---:|---:|---:|
| Rapier affliction × tempo | +10.2 → **+19.6%** | 13.7 → 13.4 | +4 → +7 pp | 0.0 → +2.2% | 7.2 → 7.0 |
| Rapier affliction × affliction (pure) | 0.0 → **+12.5%** | **0 → 10.7** | +0 → +5 pp | 0.0 → +2.5% | **0 → 7.5** |
| Rapier affliction × engagement | +1.1 → +9.0% | 2.6 → 2.6 | +0 → +4 pp | +3.6 → +4.4% | 11.2 → 11.4 |
| Hammer control × control (pure) | +4.7 → 0.0% | **0 → 9.9** | **+5 → +16 pp** | +5.0 → **+8.5%** | **0 → 7.5** |
| Hammer control × empowered | +4.8 → 0.0% | 5.2 → 5.1 | +5 → +5 pp | +6.1 → 0.0% | 2.5 → 2.4 |
| Hammer control × engagement | +4.8 → −0.1% | 2.6 → 2.5 | +6 → +3 pp | +2.6 → 0.0% | 5.8 → 5.6 |
| Dagger control × control (pure) | +6.4 → +0.9% | **0 → 9.5** | **+0 → +12 pp** | +2.5 → **+9.3%** | **0 → 6.7** |
| Dagger control × affliction | +7.2 → 0.0% | 10.3 → 10.2 | +3 → 0 pp | +5.8 → +0.4% | 7.7 → 7.6 |
| Dagger control × kill-chain | +5.8 → −0.1% | 1.5 → 1.4 | +0 → +2 pp | +4.5 → +0.6% | 5.9 → 5.8 |
| Dagger affliction × affliction (pure) | +38.4 → +42.0% | 10.3 → 10.3 | +11 → +12 pp | +11.2 → +12.6% | 7.2 → 7.1 |
| Dagger affliction × control | 0.0 → +3.3% | 0 → 0 | 0 → 0 pp | 0.0 → 0.0% | 0 → 0 |
| Dagger affliction × kill-chain | 0.0 → +3.3% | 1.4 → 1.4 | 0 → 0 pp | +3.7 → +4.7% | 5.9 → 6.0 |
| Broadsword kill-chain × empowered | +10.1 → +6.5% | 7.5 → 7.5 | +25 → +25 pp | +4.3 → +4.3% | 4.0 → 4.0 |
| Broadsword empowered × empowered (pure) | +17.3 → +13.2% | 6.7 → 6.7 | +13 → +13 pp | +1.4 → +1.4% | 3.7 → 3.7 |
| Hammer empowered × empowered (pure) | +17.4 → +14.4% | 4.4 → 4.4 | +12 → +10 pp | +8.1 → +7.8% | 2.4 → 2.4 |
| Hammer engagement × empowered | +25.2 → +18.4% | 4.3 → 4.3 | +9 → +8 pp | +8.1 → +7.9% | 2.4 → 2.4 |
| Axe tempo × empowered | +25.4 → +24.1% | 7.2 → 7.2 | +4 → +4 pp | +6.0 → +4.8% | 4.1 → 4.1 |
| Axe kill-chain × empowered | +11.7 → +7.8% | 6.7 → 6.7 | +4 → +4 pp | +10.7 → +11.4% | 4.2 → 4.2 |
| Axe empowered × empowered (pure) | +19.1 → +15.7% | 6.5 → 6.5 | +3 → +3 pp | +6.2 → +5.7% | 3.7 → 3.7 |

**What the table says:**

- **The Affliction lean works on bosses for every class.** On farms it is small, because a
  T1 mob dies inside the 4 s bleed. That matches the packet's own "weak against short
  fights".
- **The Control lean trades DPS for a firing verb.** Its row lost the +3 Attack it used to
  carry, so it reads about 0% on DPS.
  - With the pure pair, the knockdown pays in survival on bosses and in kills on farms.
  - With a root payload it does nothing on a boss: a movement slow and a root change nothing
    against a target already in melee range.
- **The Empowered-verb medians fell 3–7 pp because of the Conduit's cap.** Firing rates over
  every Empowered-verb pair, per minute: Conduit 33.2 → 11.4, and every other class within
  0.1 (Striker 7.8, Squire 7.0, Spirit 5.2, Slinger 3.7, Apprentice 1.4).
- **The Dagger's pure Affliction rose** (+38 → +42%, the Apprentice +80%), because the light
  bleed gives the re-dose more to double.

**Firing, per verb:**

- **Control** fired in 600 of 1,800 boss fights and 360 of 1,080 lane runs, against 0 before.
  That is exactly every run with the Control lean.
- **The Rapier's Affliction verb** fires for all six classes when the Affliction lean is
  slotted (50 of 150 fights per non-DoT class, against 0 before). The Apprentice fires it
  with any lean.
- **Never fired:** the off-lane conditional pairs listed in the verdict.
- **Kill chain on bosses:** 1.2–1.5 a minute, unchanged; the page now says "weak on bosses".
- **No purchase was refused anywhere.**

## T2 — the gate never makes cards smaller (wave 1 B)

[`reports/verbs-that-fire/t2-matrix.md`](../../reports/verbs-that-fire/t2-matrix.md).

**The instrument:**

- **Command:** the boss lab one tier up, `_t1BossPlan.ts --matrix=composition --tier=2
  [--leans]`.
- **Setup:** the band-2 form (Gale Needle, Knight's Steelsword) with its T2 lean and verb,
  against the same form with no cards. The kit is the tutorial's T2 items, and the bosses are
  the five T1 biomes' T2 bosses.
- **Scale:** 9,600 fights, 10 seeds.
- **Timing:** measured before A merged, on both tiers, so both tiers ran the same rules.
- **Isolating the verb:** "lean alone" rows separate the verb's own share from the lean's.

| Weapon · lean × verb | T1 uplift | T2 uplift | Verb share T1 → T2 | Fires/min T1 → T2 |
|---|---:|---:|---:|---:|
| Broadsword technique × technique | +5.1% | +5.6% | +5.1 → +5.6 | 13.1 → 14.0 |
| Broadsword technique × kill-chain | 0.0% | 0.0% | 0.0 → 0.0 | 1.2 → 1.3 |
| Broadsword technique × empowered | +0.8% | +0.5% | +0.8 → **+0.5** | 7.6 → 7.1 |
| Broadsword kill-chain × technique | +5.7% | +5.1% | +5.6 → +6.3 | 7.6 → 8.5 |
| Broadsword kill-chain × kill-chain | +0.2% | −0.2% | +0.1 → +0.5 | 1.4 → 1.4 |
| Broadsword kill-chain × empowered | +10.1% | +8.2% | +8.6 → +9.1 | 7.5 → 6.9 |
| Broadsword empowered × technique | +14.8% | +18.1% | +8.0 → +9.1 | 7.0 → 7.4 |
| Broadsword empowered × kill-chain | +7.6% | +9.6% | 0.0 → 0.0 | 1.3 → 1.5 |
| Broadsword empowered × empowered | +17.3% | +24.6% | +9.7 → +14.2 | 6.7 → 6.7 |
| Rapier tempo × tempo | +15.8% | +16.1% | +14.2 → +15.1 | 14.5 → 15.5 |
| Rapier tempo × affliction | +5.8% | 0.0% | 0.0 → 0.0 | 0 → 0 |
| Rapier tempo × engagement | +5.7% | +1.5% | +1.6 → **+1.2** | 2.7 → 2.6 |
| Rapier affliction × tempo | +10.2% | +11.1% | +10.2 → +11.1 | 13.7 → 14.5 |
| Rapier affliction × affliction | 0.0% | 0.0% | 0.0 → 0.0 | 0 → 0 |
| Rapier affliction × engagement | +1.1% | +1.7% | +1.1 → +1.5 | 2.6 → 2.5 |
| Rapier engagement × tempo | +26.9% | +36.3% | +16.5 → +19.3 | 13.4 → 14.3 |
| Rapier engagement × affliction | +11.8% | +17.1% | 0.0 → 0.0 | 0 → 0 |
| Rapier engagement × engagement | +11.6% | +19.1% | +1.3 → +2.1 | 2.7 → 2.7 |

**Reading the table:**

- **The verb's own share** is at least its T1 share in 16 of 18 pairs. The two short (bold
  in the table) are 0.3–0.4 pp, inside the lab's noise.
- **Every whole pair that reads lower at T2 loses it in the lean:**
  - The Rapier's Tempo lean is worth +4.0% at T1 and 0% at T2: the Squire's T1 swing gains a
    whole tick (800 → 700 ms), and its T2 swing stays at 600 ms with or without the lean.
    That is the tick-quantisation call.
  - The Broadsword's move-speed lean is −0.8% on a boss.
- **Every T2 number is at least its T1 number by construction**, pinned for all 45 T2 pairs
  in `composition.test.ts`.
- **The Affliction rows** predate A's light bleed, so the T2 Affliction lean is not yet
  measured with it.

## Boss lab after/before (the no-band plan)

[`reports/verbs-that-fire/after-boss.md`](../../reports/verbs-that-fire/after-boss.md).

- **The rerun:** the plan is `plan-base.json`, the same 900 fights (six classes × five bosses
  × 30 seeds, the tutorial kit, no band), rerun on the merged tree against the
  course-correction `after-boss.jsonl`.
- **The result: 900 of 900 fights are byte-identical.** Wave 1 changes nothing for a
  character with no cards.
- **The kit's new pair:** the tutorial kit now carries a lean and a verb. Its effect is the
  composition matrix's Axe and Dagger rows above (the picks table), and the sweep below
  shows it live.

## Sweep ledger (1x, one server and one database per class)

[`reports/verbs-that-fire/sweep-1x.md`](../../reports/verbs-that-fire/sweep-1x.md)
(machine-readable: `sweep-1x.json`).

- **Setup:** revision `d42e4953`, route v1.4.0, `taints: []`.
- **Harness:** bots were launched directly, so the run is 1x and untainted, but not
  frozen-runner canonical.
- **Outcome:** all six classes completed the whole script with the gate paid. Every beat
  ended `done`, there were no stalls, and both seals fell first try for every class.

| Class | Wall | Deaths | Lean (time, level, GM) | Verb (time, level, GM) | Verb firings: Plains seal / Mountain seal / gate wins | Tier 2 | Gate paid |
|---|---|---|---|---|---|---|---|
| Striker | 64m42s | 2 | 27m52s, Cave 2, 26 | 30m27s, Cave 5, 29 | 8 / 7 / 7·7·7 | 44m35s | 64m42s |
| Squire | 64m01s | 2 | 29m01s, Cave 3, 27 | 30m12s, Cave 5, 29 | 6 / 7 / 6·6·6 | 44m21s | 64m01s |
| Slinger | 53m56s | 2 | 15m20s, Swamp 2, 14 | 18m23s, Swamp 5, 17 | 6 / 6 / 4·4·4 | 36m47s | 53m56s |
| Spirit | 46m42s | 2 | 21m12s, Cave 2, 26 | 22m21s, Cave 4, 28 | 6 / 5 / 5·5·5 | 31m33s | 46m42s |
| Apprentice | 68m33s | 2 | 32m59s, Cave 2, 26 | 35m06s, Cave 4, 28 | 5 / 4 / 4·4·4 | 48m11s | 68m32s |
| Conduit | 50m20s | 2 | 23m18s, Cave 2, 26 | 24m10s, Cave 4, 28 | 23 / 20 / 23·23·23 | 33m38s | 50m20s |

- **The verb fired in every boss fight.** Five classes fired it 4–8 times a fight (one firing
  every 5–12 s); the Conduit fired it 20–23 times. The live rates match the boss lab's.
- **The pair is live for 24–36 min**, every boss fight included. In the course-correction
  sweep it was live for 4.6–8.6 min and inert in every boss fight.
- **The lean's own condition shows** for the Slinger's Affliction lean. Its own bleed ticks
  were 0 before the lean, 64 in the 3 min with the lean alone, and 975 after the verb.
- **Against the course-correction sweep:**
  - GM 30 is sooner for all six, by 0.6–6.2 min.
  - Tier 2 is sooner for all six, by 1.7–9.1 min.
  - The gate is paid sooner for five classes, by 0.7–4.7 min. The Squire's is 2.1 min later:
    its Cave gate rounds take 19.7 min, against 15.8 min for the Greatbear's.
  - The Striker went from 4 deaths to 2, and its Mountain seal from 1/3 to 1/1.
- **Deaths:** all 12 are in the gate's second round, right after the first win (the guard
  pack reforms and the boss is woken at full HP). That is the same shape as the old Forest
  guard pack, now in the Cave and Swamp dungeons.
- **Tick rate: 8.7 Hz for the first 24 min, then 9.2 Hz.**
  - For the first 24 min the box was at 100% CPU, with the conductor's matrix running beside
    the sweep. After the bench was cut to two shards, the servers held 9.2 Hz.
  - A bare `setInterval(100)` measures 8.3 Hz on this box under the same load, so 10 Hz is
    out of reach here.
  - The simulation advances by real `dt`, so game time kept pace with wall time.
  - The six servers moved together, so the classes stay comparable with each other.
- **Another session's load:** another session's three bots ran on 4341–4343 from 00:45.

## What could not be verified

- **In a live client** (nothing was opened in a browser this run):
  - the page's caveat lines;
  - the T2 Lean/Verb labels and the amplifier tile copy;
  - the readout's Empowered ring, now a cap clock;
  - the tutorial director's purchases on the Axe and Dagger pages;
  - the lesson's "same colour" line;
  - the gate chapter's loadout swap.
- **T2:**
  - the T2 lane bench (built, smoke-run only);
  - the amplifier row;
  - the Hammer, Axe and Dagger T2 bands (tests only);
  - the T2 Affliction lean with A's light bleed.
- **The tutorial:**
  - one replica per class;
  - a Rapier verb bought at Forest 4 in play (no run buys one now);
  - the cause of the gate's second-round deaths;
  - the Dagger's own share in the Slinger's faster legs, against keeping the Rapier.
- **Nodes:**
  - the two nodes whose spawns changed (t2-swamp-05, t2-jungle-03) are unbenched;
  - old bench specs that name `node-t2-jungle-03` (the durability36 ladder) will now see an
    Undergrowth-led node;
  - the page's "where it drops" falls back to the home biome's T1 nodes for the doors that
    lost their shard.
- **Not observable to the bot:** the Control lean's slow (no pick uses it).

## The designer's open calls

### Firing — what decides whether every pair does something

1. **Off-lane leans on conditional verbs never fire.** A verb whose moment needs a condition
   (Affliction, Control) fires only if something supplies it, and at T1 the only universal
   source is that lane's own lean. The Tempo or Engagement lean on the Rapier's Affliction
   verb (five classes), and any non-Control lean on a Control verb, therefore fire nothing.
   This contradicts §24.2's "a verb alone never does nothing" for the off-lane case.
   - Option: the conditional verb seeds its own condition lightly.
   - Option: its moment falls back to a plain cadence when the condition is absent.
   - Option: accept it, and add a "needs an affliction" note beside "needs a slow". It
     cannot be a static note, because whether a verb has an affliction source depends on the
     weapon and the class: the Ashbrand Dagger and the Apprentice afflict on their own.
2. **The Control lean's slow and root do nothing against a boss in melee range.** Both stop
   movement, not attacks, so Control × Empowered, Control × Engagement and the Dagger's
   Control × Affliction / Kill chain read 0% on DPS with no survival gain. The Hammer
   Striker's Control × Empowered lost 28 of 50 fights, against 22 with no cards.
   - Option: make the slow or root also slow attacks.
   - Option: accept Control as a kiting and farm lane outside its pure pair.
   - Also: should the floor read a survival metric beside DPS? The pure Control pair's value
     (+12–16 pp win rate) is invisible to it.
3. **The Conduit's summons drive `hit-nth`.** A summoner's minion attacks are the player's
   own exchanges in the combat pipeline, so the Axe's Tempo verb fires about 27 times a
   minute on the Conduit, against §24.1's one firing every 4–6 s, uncapped. The Empowered
   moment's 4 s cap fixed the same thing for the mechanic.
   - Option: count only the wielder's own swings.
   - Option: give Tempo a cap.
4. **§24.2's "the Mid range makes Control reliable" is false on the Hammer.** The at-bay slow
   (20% / 1.2 s) wears off before a Heavy Hammer's next swing.

### Numbers (all provisional; data in `magnitudes.ts`)

5. **Wave 1 A:**
   - the light bleed's share (0.10, scaled by tier) and window (4 s);
   - the slow (15%; depth 0.173 / 0.198 / 0.225 at T2–T4);
   - the slow's window: the longer of 1.5 s or one swing + 0.5 s — **picked**;
   - the Empowered cap (4 s);
   - whether the Apprentice should get the bleed as well as the DoT multiplier (a one-line
     change to exclude it);
   - the composed heavy bleed that now adds to one still owed (not in the brief; kept).
6. **Wave 1 B:**
   - the verb's tier scalar (`TIER_SCALAR.fraction`);
   - the per-payload size rules;
   - the amplifier's +60% on a per-firing size (lunge ×2.15 → ×2.84);
   - the frequency amplifier (n 6 → 4; a 5 s cap → 3.1 s);
   - the size fallback for a missing axis;
   - the band-collapse reading (the payload's size follows the verb's tier).
   Does a frequency amplifier respect "synergy buys reliability, never rate"? It is a card,
   not synergy, but it does buy rate.
7. **Wave 2:**
   - the T1 verb row at Global Mastery 10;
   - the picks rule (DPS uplift among pairs that fire).
8. **Outliers:**
   - Dagger pure Affliction, +42% (+80% for the Apprentice);
   - Rapier Engagement × Tempo, +26.9%;
   - Hammer Empowered × Engagement on farms, +21.4%;
   - the Axe's Tempo lean.

### The tutorial

9. **The page arrives later.** The tree is first met in the Cave (GM 24–30), or the Swamp for
   the Slinger, instead of the Forest, and the Rapier gets no lesson. The pair is live in
   every boss fight; the cost is that the tree is learned in the last third of T1.
10. **Four of six picks are pure pairs**, so the composed sentence is taught to two classes
    only (Striker, Apprentice). Prefer cross-lane picks for the lesson, even at some uplift?
11. **The gate now pays the taught weapon's gate** (the Ruinous Axe, the Venom Knife), not the
    Rapier's.
12. **The gate's second-round deaths:** two per class, right after the first win. This is a
    harness or encounter question.

### Shapes, data and docs

13. **The eight re-led nodes** (C's table) cost these doors their shard:
    - Swamp T2 pays no Venom (the Dagger's T2 door);
    - Jungle T2 pays no Spark, and Jungle T3 no Venom (the Rapier's Jungle forms crown
      Affliction);
    - Desert T3 and Mountain T4 pay no Shackle.
    C also flagged `dune-stalker` and `bog-lurker` as filed under the "wrong" family; re-filing
    either one only moves the gap. Every pick has its own commit, so each can be reverted
    alone.
14. **The stray block above the design doc's title** (items 9–13) belongs to §18: 11–13 exist
    nowhere else. It is marked, not moved.
15. **Tick quantisation** (task D, not launched): the Rapier's Tempo lean is worth 0 to three
    classes at T1 and to every class measured at T2.
16. **Still open from the course-correction report:**
    - the vocabulary over §6's caps;
    - the price of a plain craft;
    - the Striker's pulse after the fold;
    - the readout and FX questions;
    - purchase auto-activation into an occupied row.
17. **Scratch databases to drop when done:** `gamedb_vftut1`–`6` (this run), plus the earlier
    `gamedb_ccpage`, `gamedb_ccreadout`, `gamedb_ccfx` and `gamedb_tut1`–`5`. None were
    dropped here.
