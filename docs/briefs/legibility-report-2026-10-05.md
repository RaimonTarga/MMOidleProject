# Legibility run — report (2026-10-05 → 06)

- **Brief:** [`legibility-run-2026-10-05.md`](legibility-run-2026-10-05.md)
- **Design authority:** [`progression-rework-design.md`](../../design_docs/progression-rework-design.md)
  §24 whole, §26 last (§26 wins where they differ)
- **Follows:** [`verbs-that-fire-report-2026-10-03.md`](verbs-that-fire-report-2026-10-03.md),
  [`ui-prototypes-report-2026-10-04.md`](ui-prototypes-report-2026-10-04.md),
  [`status-registry-audit-2026-10-05.md`](status-registry-audit-2026-10-05.md)
- **Visual target:** the composite mockup, https://claude.ai/artifact/6a6e1DPH6gQGs8WbdiMAnc
  (Stone skin only)
- **Branch:** `feat/legibility` off develop `7360e3b0` (conductor in `../mmo-lin-w2c`),
  merged into `develop` by the commit that follows this report. Not pushed.
- **Evidence:** [`reports/legibility/`](../../reports/legibility/) (its `README.md` lists
  every file and how to rerun it; `SCOPE.md` is the run's ownership map and contracts)

## Verdict

**Design §26.1–§26.4 is implemented and merged.** Typecheck is clean and the suite passes
389/389 on the merged tree (baseline 383; six new test files).

- **T1 deepens, T2 branches.** The T1 band is a lean row of three ranked cards (Attack,
  Speed, Effect, the same on every weapon) and ONE verb, the weapon's own. The six T1 steps
  are form, lean I, II, III, verb, gate. T2 is unchanged: three lane leans, three verbs, the
  amplifier, composing as before.
- **One damage-over-time record per weapon.** The Dagger's poison is amplified and re-dosed,
  never joined. Any other weapon gets one lineage bleed, `lineage.bleed`.
- **The status registry has zero open gaps.** Every target status has a label, help, badge
  and icon, and a test fails CI on any new id without them.
- **T1 nodes are rosters.** Each fields its leader and at most one guest. One crossroads per
  biome fields all three.
- **The HUD is nearly empty.** One named ring per verb sits under the HP bar, in five states
  plus a count of firings while away. The proc strip is gone. The floating word plays for a
  card's first three watched firings, then never. The target shows one badge per effect.
- **The panels are dense.** The Upgrade panel opens on the worn items and leads to the
  weapon page with ranks. The Stats panel stands on its own. The territory line stays on
  screen.
- **The tutorial teaches it once.** All six classes complete it at 1x and pay the gate. The
  verb fired in all 30 boss wins.

**A character with no cards fights exactly as on develop.** All 900 no-band boss-lab fights
are identical before and after (sorted, `wallMs` removed), at wave 1 and again at the final
tip.

**What the designer has to decide is in "Open calls".** The two big ones:

- The Effect lean, the identity lean the tutorial teaches, is the weakest of the three on
  the Axe, the Rapier and the Broadsword.
- The Hammer's verb never fires under its Attack or Speed lean.

## What shipped, by part

| Part | Agent / worktree / branch | Merge | Suite on the merged tree |
|---|---|---|---|
| 0 — baselines, scope | conductor, `w2c` / `w2b` | `04725e0b`, `211414f3` | 383/383 (develop + scope) |
| C — rosters (§26.3) | `w1c`, `feat/lg-rosters` | `ba0337fc` (merged early: no file overlap) | 384/384 |
| A — the band (§26.1) | `w1a`, `feat/lg-band` | `b63dc123` | 385/385 |
| B — one DoT + registry (§26.2) | `w1b`, `feat/lg-dot` | `8deb861d` | 386/386 (B's run on the identical tree) |
| D — HUD and panels (§26.4) | `w1d2`, `feat/lg-ui` | `41536caa` | 389/389 (D's run; the merge adds only report files) |
| E — tutorial, bot, sweep | `w2a`, `feat/lg-tutorial` | `4b9fe4b1` | 389/389 (the final run, typecheck clean) |

The brief's merge order was A → B → C → D. I merged C first because it touched no file A,
B or D owned. Each agent merged `feat/legibility` back into its own branch before its merge,
so every merge was tested on its final tree.

### A — the band (design §26.1)

- **The lean trio.** Each weapon gets `<weapon>-t1-attack|speed|effect` (`leanKind`), named
  "Attack", "Speed", "Effect".
- **Ranks.** They live on `LineageProgress.ranks`; a missing entry hydrates to rank I.
  `lineage:unlockCard` on an owned ranked card buys the next rank, and refuses at III
  ("Already at rank III.").
- **What Effect scales:**
  - the Dagger's poison potency;
  - the Hammer's slow on hit;
  - on the Rapier, Axe and Broadsword, the verb's payload, through a resolve-time
    `payloadScale`.
- **At T1 the pair is always pure.** Attack and Speed name no payload lane, so the verb
  reads its own pure pair, and `composeVerb` is unchanged.
- **One verb per weapon.** The ids are unchanged. The Hammer's verb was renamed from
  "Pinned" to *Easy Prey*, as the brief names it; that frees "Pinned" for the root status.
- **T2 is unchanged.** Its stat row already was the three lane leans at T2 size. The T2
  composition test keeps all 45 pairs.
- **Retired cards are refunded.** 25 ids leave T1: the old lane-named leans and each
  weapon's two other verbs (`retired.ts`). On `loadCharacter` they are dropped and refunded
  at today's full T1 price, in essence plus the card's own lane shard. The refund is
  idempotent and logged once.
- **Contract 1 shipped**, with small signature additions that D adapted to:
  - `cardRank`, `maxCardRank`, `resolveLineageCardAtRank`, `nextCardRank`;
  - `composedSentenceParts(…, { leanId, rank })`, which returns the two halves of the
    two-colour sentence;
  - `lineageCardPrice({ progress, rank })`.
- **The bench takes rank as a row.** At T1 that gives 16,500 fights (see the matrix below).

### B — one DoT per weapon and the registry (design §26.2)

- **One routing point.** Every lineage affliction goes through `lineageAffliction.ts`: the
  heavy bleed, the re-dose, `poison-stack` and a standalone `hemorrhage`.
  - On a reservoir weapon it adds to that reservoir, and no `lineage.*` record is ever
    created.
  - On any other weapon it adds to `lineage.bleed`, which replaces `lineage.hemorrhage`,
    `lineage.lean-bleed` and `lineage.poison`.
  - `lineage.poison` was not retired for lack of writers. It had live ones: two Dagger
    capstones, Plague Dose, the Rapier's Venomthorn capstone and the ability-node Affliction
    options. It got the same one-record treatment.
- **The Control lean's slow and root have their own ids.** The slow is `lineage.hobbled`
  ("Hobbled") and the root `lineage.pinned` ("Pinned"). They sit on the same ladder rungs as
  Hamstring and Binding Strike.
- **Shared classifiers.** `isAfflictionStatusId` and `isHoldStatusId` are exported from
  shared, and the ring's *blocked* state reads them.
- **Status audit.** `_statusAudit.ts` is now a library: 28 gaps before, **0 open after**.
  - 6 gaps are accepted, each with a reason (two internal latches, two unused icon keys,
    and `cooldown-temporal-ext`, whose mechanic nothing writes).
  - The proof is `server/test/statusRegistry.test.ts`. It fails on any new id without
    label, help, badge or icon, on a stale acceptance, and on an unexplained dynamic id.
- **New tiles and removals.** `stunned` has a player tile and lava has one. The dead
  entries `root`, `vuln` and `void-corruption` are gone.
- **The target frame** has three fixed homes: Owes, Slowed, Held. The owed number comes from
  a server-filled `TargetStatusView.owed`.

### C — rosters (design §26.3)

All 25 T1 normal nodes now follow three shapes:

- **pure:** one family at 1.0;
- **pair:** 70/30, or 60/40 on a biome's two "door" nodes;
- **crossroads:** 34/33/33, on the node the dungeon is entered from.

The shares are whole tenths, so the map shows exactly what spawns. The crossroads are Swiftgrass Meadow (`plains-01`),
Windstep Grove (`forest-01`), Stonefall Ridge (`mountain-01`), Rushing Grotto (`cave-01`) and
Rushing Reedfen (`swamp-01`).

- **One node changed currency:** `mountain-03` Crownpeak Rise, from Crag to Ridge (Anvil →
  Shackle). Ridge's only territory had become the crossroads.
- **No spawner change.** It was verified on 1.0, 60/40 and 70/30 blends with a real World
  (30, 18/12 and 12/9/9 spawns).
- **The family-contract bench is identical before and after,** by construction: it
  overwrites the host node's blend.

The full node table is in `reports/legibility/rosters.md`.

### D — the HUD and the panels (design §26.4)

`docs/lineages-current-state.md` §16 has the full description.

- **The ring:** named, under the HP bar (on a phone, the top strip's second row). Five
  states: clock, coming, ready, blocked (dashed), rest. A "+N" away count shows firings
  missed.
- **The proc strip is gone.** The desktop buff bar's 52 px top-left tiles became a 26 px row
  beside the HP bar.
- **The teaching counter** is persisted as `cardFiringsTaught` and counts only watched
  firings (`isAway` via `player:setActive`).
- **The Upgrade panel and weapon page:** the "In the fight" plate, lean ranks with Rank up,
  the verb with its mini ring and beat line, the locked T2 row and the gate; on a phone, a
  Preview toggle.
- **The Stats panel:** sources by ablation, with the lean's share in its lane colour.
- **The territory line** stays on screen.
- **The inventory stat sheet was trimmed, not removed.** Its character-sheet mode is gone,
  but its item compare stays, because it holds the only Equip button and the tutorial's
  anchor.

### E — tutorial, bot, sweep

The guide teaches the brief's lesson once:

- Effect rank I at Cave 2 (Swamp 2 for the Slinger);
- the verb at Cave 4 (Swamp 4);
- rank II at Cave 5 (Swamp 5), one level after the verb because Cave 4 already carries two
  ideas;
- rank III at Cave 6 (Swamp 6).

There is no pair choice and no copy says a lean changes the verb. The ring copy and
`lesson.ring` say "under your health bar".

The bot buys ranks one at a time; the route is v1.5.0. E added one anchor attribute
(`lineageRankUp`) on D's Rank up button.

## Every number picked (all PROVISIONAL, the designer's, flagged in data)

| What | Value | Where |
|---|---|---|
| Attack / Speed per rank | +8 / +12 / +16% | `LEAN_RANK_ONE` × `LEAN_RANK_VALUE_SCALE` 1 / 1.5 / 2 |
| Effect per rank | +10 / +15 / +20% of the weapon's mechanic | same |
| Rank gates (Global Mastery) | 6 / 10 / 14 (the lean gate, +4, +8; T1 gate 30) | `LEAN_RANK_MASTERY_OFFSET` |
| Rank biome gate | the home biome's level 2 at every rank | the stat row's level |
| Rank price | 30 / 45 / 60 home essence, 3 / 5 / 6 shards (4.5 → 5) | `LEAN_RANK_PRICE_SCALE` |
| Shard per lean (the conductor's rule) | Effect = the verb's lane; Attack = Empowered if the weapon has it; Speed = Tempo if it has it; the rest in lane order | `coverage.test` pins it |
| The fixed verbs | Dagger *Into the Wound*, Rapier *Flurry*, Hammer *Easy Prey*, Axe *Chopping Rhythm*, Broadsword *Set Piece*; Global Mastery 10 as before | the brief |
| Teaching firings | 3 watched firings per card | `CARD_TEACHING_FIRINGS` |
| Crossroads shard | its leader-by-a-hair's (the shard it paid before) | `regionT1.ts` |
| Roster shapes | 1.0 / 70-30 / doors 60-40 / crossroads 34-33-33 | `regionT1.ts` |
| Retired-card refund | today's full T1 price, essence + the card's lane shard | `retired.ts` |
| `poison-stack` amount | one application's promise (share × window ÷ the class DoT's tick), added | `lineageAffliction.ts` |

| Weapon (essence) | Attack (shard) | Speed (shard) | Effect (shard): what it scales |
|---|---|---|---|
| Dagger (Rot) | Shackle | Bone | Venom: poison potency (the reservoir) |
| Rapier (Wild) | Venom | Spark | Gale: Flurry's echo ×1.10 / 1.15 / 1.20 |
| Hammer (Stone) | Anvil | Spark | Shackle: slow on hit 10 / 15 / 20% |
| Axe (Deep) | Anvil | Bone | Gale: Chopping Rhythm's echo ×1.10 / 1.15 / 1.20 |
| Broadsword (Might) | Anvil | Bone | Sigil: Set Piece's refund 55 / 57.5 / 60% |

## The matrices

### The composition matrix (boss lab, 10 seeds)

[`before-composition.md`](../../reports/legibility/before-composition.md) has the old 45
lean × verb pairs: median +6.8%, 20 of 45 under the 0.9× floor.
[`after-composition.md`](../../reports/legibility/after-composition.md) has per weapon 3
leans × 3 ranks with the one verb, plus the verb alone: 16,500 fights. Its median is
+15.8%, with 21 of 50 rows under the floor and 0 refused purchases.

| Weapon | Attack I → III | Speed I → III | Effect I → III | verb alone | verb fires/min |
|---|---|---|---|---|---|
| Broadsword | +11.8 → +18.8% | +13.5 → +16.7% | +5.8 → +6.7% | +5.1% | 13–15 |
| Rapier | +19.4 → +27.6% | +15.8 → +21.1% | +14.4 → +15.7% | +13.0% | 13–16 |
| Hammer | +6.0 → +14.1% (verb 0/min) | +7.7 → +10.0% (verb 0/min) | +0.0% (verb 9.8/min; Striker win 100% vs 56%) | +0.0% (0/min) | — |
| Axe | +19.1 → +28.1% | +21.4 → +25.9% | +12.8 → +14.3% | +11.4% | 6.3–7.1 |
| Dagger | +51.7 → +53.7% | +49.1 → +52.3% | +50.3 → +57.5% | +42.8% | 10.3–10.7 |

What this says:

- **Effect is the weakest lean on the Rapier, the Axe and the Broadsword.** Its +10% applies
  to a per-firing payload, while Attack and Speed apply to every hit. On the Broadsword it is
  worth about what the verb alone is.
- **The Dagger's large numbers are its verb, not this run.** Re-dosing the reservoir was
  already +42.0% as a pure pair before.
- **The Hammer's verb needs its Effect lean** (§24.9's seed): no other lean fires it. Under
  Effect its value is survival, which DPS doesn't measure; the Striker wins 100% against
  56% with no cards.
- **Speed ranks often read flat** (I = II = III for several classes). That is the 10 Hz tick
  quantisation, design §24.9's open call.

### The no-band floor

[`before-base.jsonl`](../../reports/legibility/before-base.jsonl),
[`after-base.jsonl`](../../reports/legibility/after-base.jsonl) and
[`final-base.jsonl`](../../reports/legibility/final-base.jsonl) are identical, 900 rows each.

### The tutorial kit (the boss-pass bar)

[`final-tutorial-pair.md`](../../reports/legibility/final-tutorial-pair.md) is the guide's
kit at Effect III plus the verb, 30 seeds; the before file has the verbs-that-fire picks.

| Class | win before → after | worst boss after | DPS over no cards, before → after |
|---|---|---|---|
| Striker | 99.3% → 99.3% | Razorback 97% | +32.8% → +14.7% |
| Squire | 100% → 100% | 100% | +25.9% → +12.9% |
| Slinger | 100% → 100% | 100% | +42.9% → +55.6% |
| Spirit | 100% → 100% | 100% | +23.9% → +15.4% |
| Apprentice | 100% → 100% | 100% | +13.8% → +5.7% |
| Conduit | 100% → 100% | 100% | +15.7% → +18.8% |

- **Every class is at least 70%:** held, worst 97%.
- **"No class 100% on all five": broken, and it was already broken before this run.** Five
  classes were at 100% on all five with the verbs-that-fire picks, and they still are. No
  boss was retuned, as the brief asks.
- **The guide kit's DPS fell for the four Axe classes:** Effect is the Axe's weakest lean.
  It rose for the Slinger and the Conduit.

## The sweep (1x, six classes, one server and DB each)

Full ledger: [`reports/legibility/sweep-1x.md`](../../reports/legibility/sweep-1x.md). The
comparison is against the verbs-that-fire sweep.

| Class | beats | Effect I | verb | Effect III | Mountain seal | gate paid (before → after) | deaths |
|---|---|---|---|---|---|---|---|
| Striker | 63/63 | 26m55s | 28m03s | 29m21s | **1/3** (was 1/1) | 64m42s → 66m04s | 2 → 4 |
| Squire | 63/63 | 26m20s | 27m59s | 29m12s | 1/1 | 64m01s → 64m01s | 2 → 2 |
| Slinger | 66/66 | 16m36s | 19m38s | 21m06s | 1/1 | 53m56s → 57m45s | 2 → 2 |
| Spirit | 66/66 | 24m11s | 25m02s | 25m47s | 1/1 | 46m42s → 51m29s | 2 → 3 |
| Apprentice | 68/68 | 33m27s | 34m52s | 36m38s | 1/1 | 68m32s → 68m58s | 2 → 2 |
| Conduit | 66/66 | 24m13s | 25m22s | 26m23s | 1/1 | 50m20s → 55m05s | 2 → 2 |

- **All six classes finish the script and pay the gate.** No beat ended anything but `done`,
  and there were no stalls.
- **The verb fired in all 30 boss wins:** 4–5 times a fight for five classes, 19–23 for the
  Conduit.
- **The gate is paid 0–4.8 min later.** The ranks' own farms are 0.5–1.5 min of that; the
  rest is one-replica noise and the Striker's losses.
- **The Striker's Mountain seal fell to 1/3.** It lost twice with the Crag Behemoth at 7% and
  1% left. This is the course-correction sweep's shape, and Effect is the Striker's weakest
  Axe lean.
- **C's Forest entry-pressure risk did no harm.** There were 0 Forest deaths and the leg time
  moved −54 s to +19 s, although moments with three or more attackers roughly doubled for the
  Striker, Squire and Spirit. C's data-only fallback was not applied.
- **Checklist:** no level showed more than two new ideas. The Squire skipped two farm lines
  (it arrived at the Cave chapter with both farms already met).

## Screenshots, per view

All are in [`reports/legibility/screens/`](../../reports/legibility/screens/), desktop
1440×900 and portrait 390×844. The ring states and their targets were staged by holding the
client's atoms. The away count and the target badges come from real fights.

| View | Desktop | Portrait |
|---|---|---|
| Fight HUD | `desktop-1440-fight-hud.png` | `portrait-390-fight-hud.png` |
| Ring: clock / coming / ready / blocked | `desktop-1440-ring-*.png` + `desktop-crop-ring-*.png` | `portrait-390-ring-*.png` |
| Ring: away count | `desktop-1440-ring-away-count.png` | — |
| Target badge (B's three homes) | `desktop-1440-target-badge.png` | `portrait-390-target-badge.png` |
| Upgrade list | `desktop-1440-upgrade-list.png` | `portrait-390-upgrade-list.png` |
| Weapon page (+ rank preview, + lower half) | `desktop-1440-weapon-page*.png` | `portrait-390-weapon-page.png`, `-preview-diffbar.png` |
| Stats panel | `desktop-1440-stats-panel.png` | `portrait-390-stats.png` |
| Territory line (narrow field) | `desktop-1280-territory-line-bottom-left.png` | (in the fight HUD) |

## Where the run departed from the brief

- **The Hammer's verb is named *Easy Prey*,** as the brief names it. The card was "Pinned";
  "Pinned" is now the root status's label.
- **The T2 band is untouched.** The brief's "re-tier today's T1 lane stat cards to 2" read
  as already true: T2's stat row was the three lane leans at T2 size. The T1 lane leans were
  retired instead, and refunded.
- **The shard each lean pays was not in the brief.** I set the rule in the numbers table so
  that all three home shards buy something at T1.
- **C merged before A and B** (no shared files).
- **The inventory stat sheet was trimmed, not removed.** See D above.
- **"Watched" means tab visibility only.** A full-screen panel over the fight still counts.
  A finer signal would need a new client intent.
- **The tutorial-pair plan now carries `leanRank`** (a conductor fix), so the lab fights the
  rank-III kit the gate is paid with.
- **The lane bench was not rerun** for the T1 matrix; the boss lab only, as the brief's
  wave 0 named.

## Not verified

- **The live client,** beyond D's staged screenshots. Nobody played a rank purchase, the
  lean and rank lessons, or the ring lesson's highlight in a browser; the bot proves them by
  intent only.
- **Sample size.** The sweep is one replica per class. The boss lab is 10 seeds (matrix) and
  30 (kit).
- **Parties.** A target's statuses carry no owner, so the client-derived *blocked* ring can
  disagree with the server's own-DoT check in a party.
- **T3/T4 balance.** `poison-stack` now adds one application where it used to stack, and a
  standalone `hemorrhage` adds where it used to refresh. That lowers some T3/T4 Dagger and
  Rapier capstones, Plague Dose and the ability nodes. Nothing above T2 was benched.
- **Telemetry gaps:**
  - The bot cannot attribute the Slinger's weapon poison ticks (they carry no `sourceId`).
  - Gameplay telemetry has no rank field; a rank-up logs as another `card-unlocked`.

## Open calls (the designer's)

1. **The Effect lean.**
   - It is the identity lean, but the weakest on the Axe, Rapier and Broadsword, by 2–3×
     against Attack and Speed.
   - Options: raise Effect's numbers on payload-scale weapons; keep the identity framing but
     teach a stronger lean per class; or accept it.
   - The tutorial's per-class alternative is one line (`AXE_BAND.lean`). E's table:
     Striker and Spirit → Speed, Apprentice and Conduit → Attack.
2. **The Hammer at T1.** Easy Prey never fires under Attack or Speed. Should the verb carry
   its own slow, or is Effect the Hammer's only real lean? Effect rank I also slows 10%,
   below the old Control lean's 15%.
3. **Lean colours follow the shard rule.** That makes the Rapier's Attack Affliction-green
   and the Dagger's Attack Control-blue. Decouple colour from currency?
4. **Rank gates use Global Mastery only.** The biome level is 2 at every rank. Should ranks
   II and III also gate on biome level?
5. **The absorbed Effect** keeps scaling its own lane's payload above the T2 gate (A's rule).
   Confirm.
6. **The refund** pays today's full price, not the unknown price actually paid. Confirm.
7. **The crossroads:** one shard (today's leader-by-a-hair) or a roll per kill? Also the
   60/40 doors, and whether `mountain-03` should stay Crag. Three node names contradict
   their rosters: Spidernest Grotto, Crownherd Prairie, Leechbrood Mire.
8. **T2–T4 rosters** (113 nodes; `ROSTER_TIERS` is the switch).
9. **Status names.** The `slow` payoff and the ability-node slows still read "Hamstrung", and
   the T3 Control keystone's root still reads "Bound". "Pinned" now means both the player's
   cave lockdown and the monster's Control root. Venomthorn (a poison capstone) now shows
   "Bleed". Also: `cooldown-temporal-ext` has no writer.
10. **The boss-pass bar.** "No class 100% on all five" fails on the tutorial kit, as it did
    before this run.
11. **The tutorial's farm-line ideas** can be skipped (the Squire's case). Give them a home
    that is never skipped?
12. **The phone camera floor** (0.4 draws a 64 px body at ~26 px), **the Ornate skin and the
    ornament track**: not in this run.
13. **Still open from before:** tick quantisation (§24.9); boss reach (parked, §25).

## Housekeeping

- **Databases left in place:** `gamedb_lgui` (D's screenshots) and `gamedb_lg1`…`gamedb_lg6`
  (E's sweep). `pnpm db:inventory` lists them.
- **Worktrees** `../mmo-lin-w1a`, `w1b`, `w1c`, `w1d2` and `w2a` hold the merged branches.
  `w2b` is detached at `b6d3b130` with untracked run logs and plans under
  `reports/legibility/`.
- **No process was left listening** on 4301–4306, 4311 or 3011.
