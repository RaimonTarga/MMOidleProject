# Ability pass report — 2026-10-09

- **Brief:** [`ability-pass-run-2026-10-02.md`](ability-pass-run-2026-10-02.md) (revised 2026-10-06 for design §26)
- **Design authority:** [`progression-rework-design.md`](../../design_docs/progression-rework-design.md) §22 (all subsections), §26
- **Evidence:** [`reports/ability-pass/`](../../reports/ability-pass/) (its `README.md` lists every file and how to rerun it)
- **Run:** conductor in `../mmo-lin-w2c`, 2026-10-06 → 2026-10-09 (a usage limit stopped wave 2 on 2026-10-06 before any commit; resumed 2026-10-09, nothing lost)

> **Update, same day (wave 4).** The designer took the open calls (design §22.12), and a
> follow-up wave implemented them: Slam rank I solved on two numbers (**1.2× on a 600 ms
> wind-up: 30/30 kit cells inside ±5%, worst −4.7%**), Flow for Sidestep (all 19 first
> verbs live), the fire-shape rate guards, the boss gates, the path fixes and the renames.
> **Parity holds; `feat/ability-pass` is merged to develop.** See "Addendum: wave 4" at the
> end. The sections below are the record of waves 0–3 as they stood before those calls.

## Verdict

**Everything in the brief is built, except one verb, and the branch is NOT merged to develop.**
The T1 parity constraint fails, and it cannot be met under the brief's rules.

- **What fails.** With the tutorial kit swapped from Expose Weakness to Slam, no single Slam
  rank I value keeps every (class, T1 boss) kit cell within ±5% of the baseline. The best value,
  **2.2**, leaves **12 of 30 cells outside**. The worst are **+8.9%** (Conduit, Behemoth) and
  **−8.1%** (Striker, Behemoth).
- **Why one number cannot fix it.** Expose Weakness paid every class the same percentage. Slam
  is a 1.6 s wind-up, so its cost depends on how fast the class attacks:
  - the Striker, Slinger and Spirit stop swinging and lose;
  - the Conduit casts through one summon while the rest keep hitting, and gains;
  - the Squire and Apprentice sit in between.

  At every value tried, the spread between those groups is about 17 points, wider than the
  10-point window.
- **What does not move.** The kit still wins every T1 boss at **≥97%** (one cell moved, the
  Striker on the Behemoth, 100% → 97%). No pairing comes near the 70% floor.
- **What you need to decide.** See "Open for the designer", item 1.

**Everything else holds.**
- Typecheck is clean.
- The suite is **400/400** (baseline 389).
- Waves 1 and 2 moved no T1 cell beyond W1-A's kit swap (identity checks, below).
- A character with no cards and no changed ability fights exactly as on develop.

## Branch state

`feat/ability-pass` at the commit carrying this report (code tip `d6e1d84f`), off develop
`e56d530e`. Develop has since gained one docs-only commit (`677c9f99`, the combat-readout
brief), which does not touch this run. Not pushed.

| Task | Agent / worktree / branch | Merged as | Notes |
|---|---|---|---|
| W0 baseline, parity script, stacking | opus, `w2b`, `feat/ability-pass-baseline` | `9b2e0b74` | reproduces the legibility kit matrix exactly |
| (conductor) stale test pin | — | `7f875957` | develop was 388/389 |
| W1-B keystone + cross rows, 5 keystones | opus, `w1b`, `feat/ability-keystone-rows` | `ab36247a` | 390/390 on its branch |
| W1-A roster, kit, Slam parity | opus, `w1a`, `feat/ability-roster` | `800b8e42` | **parity fails**; merged anyway (see Divergences 5) |
| W1-C Stunning Strike offers, coverage | sonnet, `w1c`, `feat/ability-offer-coverage` | `32ab6026` | |
| W1-D Squire paths | opus, `w1d2`, `feat/t3-squire-paths` | `52cf89e3` | |
| W1-E Slinger paths | opus, `w2a`, `feat/t3-slinger-paths` | `63ed894b` | |
| W1-F Pyromancer | opus, `w2b`, `feat/t3-pyromancer` | `adcff631` | |
| (conductor) wave-1 merge fixes | — | `a07d0e73` | 396/396 |
| W2-A six Technique keystones | opus, `w1a`, `feat/ability-keystones-2` | `ae754cf4` | |
| W2-B Guard keystones | opus, `w1b`, `feat/guard-keystones` | `1d60e06f` | 7 of 8; Afterimage not built |
| W2-E fire-shapes live (conductor-added) | opus, `w2a`, `feat/ability-fire-shapes` | `6325605d` | Charge's first-touched body not live |
| W2-D names, icons, animations | opus, `w1d2`, `feat/ability-flavor` | `f9561b37` | two passes; 18 bespoke animations |
| W2-C docs | sonnet, `w1c`, `feat/ability-pass-docs` | `d6e1d84f` | |

- **Typecheck:** `pnpm typecheck` (all packages, plus `typecheck:bench` and `typecheck:test`) is
  clean.
- **Suite:** **400/400 in 315 s** at `d6e1d84f`. Along the way: 389 at develop with the pin fixed,
  396 after wave 1, 400 after wave 2.
- **Merged to develop:** no. The brief and the user's instruction allow the merge only if parity
  holds in wave 3, and it does not.

## Parity

### Baseline vs final (the tutorial-pair kit: Effect III + the weapon's verb, 30 seeds)

The baseline is W0's, taken at `e56d530e`. The final run is at `d6e1d84f`.
- **Final vs wave 1:** the final matrix is identical to wave 1's, which is identical to W1-A's
  (1,800/1,800 each, `--identity`).
- **The Razorback cells:** they keep Sweep, and are ±0.0% for every class.

Mean dps change from the baseline; cells outside ±5% in bold.

| class | Greatbear | Toadeater | Behemoth | Broodmother | wins (all five bosses) |
|---|---:|---:|---:|---:|---|
| Striker (Axe) | **−6.8%** | −2.7% | **−8.1%** | −4.3% | 97 / 100 / 100 / 97 / 100% (Behemoth 100 → 97) |
| Squire (Axe) | **+5.2%** | +3.2% | +1.3% | −0.5% | 100% everywhere |
| Slinger (Dagger) | −3.6% | −4.8% | **−7.8%** | **−6.5%** | 100% everywhere |
| Spirit (Axe) | **−5.9%** | −1.3% | **−5.9%** | **−5.8%** | 100% everywhere |
| Apprentice (Axe) | **+8.0%** | +4.6% | +2.7% | −0.5% | 100% everywhere |
| Conduit (Axe) | **+7.4%** | +1.7% | **+8.9%** | **+6.4%** | 100% everywhere |

The no-card controls wear the kit's Technique too (ungated). They move the same way: from −8.0%
(Slinger, Behemoth) to **+26.7%** (Conduit, Behemoth). The Conduit control gains most because its
Slam costs it nothing. Squire and Striker control win rates rose on the Toadeater (87 → 100%,
90 → 100%). Full tables: `final-parity.md`.

### The Slam rank I ladder (W1-A)

| rank I | worst kit cell | cells outside |
|---|---|---|
| 1.75 | Striker, Behemoth −13.9% | 14 |
| 2.15 | Striker, Behemoth −10.1% | 11 |
| **2.2 (committed)** | Conduit, Behemoth +8.9% | 12 |
| 2.25 | Conduit, Behemoth +9.3% | 13 |
| 2.4 | Squire, Greatbear +12.1% | 10 |

Cooldown 10 s and wind-up 1.6 s are Power Strike's. Ranks II–IV (1.75 / 2.0 / 2.25) are
untouched. Per-cell ladder: `w1a-ladder.md`.

### The Effect-parity re-measure (W0, asked for by design §26.5)

`6ea13a91` (Effect `LEAN_RANK_ONE_PAYLOAD_SCALE` 0.10 → 0.50) moved the five Axe kits by
**+2.2% to +11.7%** mean dps, with no win-rate change. The Conduit gained most (+8–12%) and the
Apprentice least (+2–4%). The Dagger and every control are unchanged. Table:
`effect-parity-d593ceea-vs-tip.md`.

### The no-card identity

The frozen no-band plan was rerun at the final tip.
- **The Razorback rows match.** These 180 rows use Sweep + Second Wind, unchanged, and are
  **identical** to the legibility run's `final-base.jsonl`.
- **The other 720 rows are refused.** They name the cut Expose Weakness, and the lab refuses them
  (`illegal ability budget`), as W0 predicted. This is not a defect.

So a character with no cards and no changed ability fights exactly as on develop.
`final-base-identity.md`.

## The T3/T4 stacking before/after (W0), and the Slam rerun (W1-A)

**The legibility run's stacking change was small.** That run made `poison-stack` add instead of
stack, and a standalone `hemorrhage` add instead of refresh. Its two parity commits moved nothing
here.
- **T2 boss lab, Rapier and Dagger (6,000 fights per commit):** only pairs whose lean is
  Affliction moved.
  - The Dagger's pure Affliction pair rose **+7.6%** (others +2.2–2.3%).
  - The Rapier's moved −0.2% to +1.9%.
  - No cell lost a win.
  - The T2 capstones on their own did not move.
- **boss5Spec T3/T4 reference rows (78 fights):** only the T3 Slinger (`jungle-venomthorn-rapier`)
  moved, +0.6% pooled, with wins 6/7 → 5/7 (the Rot-Spore Croc Behemoth became a death). T4 did
  not move.
- **The ability-node Affliction rows:** no instrument measures them; not measured.

**Swapping Expose Weakness for Slam in the T3/T4 reference package hurts a lot** (a
measurement, not a target):

| tier | dps | wins |
|---|---|---|
| T3 | 105.9 → 97.2 (−8.3%) | 60% → 50% |
| T4 | 286.5 → 240.2 (−16.2%) | 89% → 78% |

- The Striker and Slinger lose about 19% at both tiers.
- **The Spirit at T4 loses 44%.**
- The Squire is flat, and the Conduit gains 7.7% at T3.

At T3/T4, Expose Weakness's +17.5–20% damage-taken window was worth more than Slam's
2.0–2.25× cast. Full tables: `stacking.md` (with "Rerun").

## What to playtest

**Where things unlock.** A keystone row sits at the ability's home tier + 2:
- T1 abilities' keystones open at **T3**;
- T2 abilities' at **T4**;
- T3 and T4 abilities' rows sit above the cap and fold into the **T4 band** (home + N, unclamped,
  design §22.10).

A keystone needs an active packet option on the same ability. The panel shows the trio's other two
verbs as silhouettes.

**The 18 live verbs** (Afterimage is not built):

| Ability (home) | Verb | What to look for |
|---|---|---|
| Sweep (T1) | Whirlwind | a 1 s spin that cleaves twice more; a stun or freeze breaks it |
| Slam (T1) | Aftershock | the cracked ground erupts again 1 s later at the same spot |
| Charge (T1) | Breakthrough | arriving staggers the target (a Conduit's summon delivers it) |
| Contagion (T2) | Outbreak | an infected body that dies passes its afflictions to its neighbour |
| Binding Strike (T2) | Dragnet | the root takes every body next to the target; one net, strands between them |
| Detonate (T3) | Chain Reaction | a Detonate kill sets off every afflicted body in reach, each once |
| Disengage (T4) | Vanish | stepping away drops nearby normal monsters' aggro until your next hit (bosses, boss adds and dungeon guardians ignore it) |
| Snipe (T2) | Pierce | the shot runs on through everything behind the target |
| Stunning Strike (T4) | Relay | when the stun ends it jumps to the nearest body not stunned yet |
| Imbue Lightning (T3) | Fork | every imbued hit arcs to the nearest other body |
| Cull (T3) | Harvest | a Cull kill re-strikes the next low body, and keeps going while it kills |
| Second Wind (T1) | Shared Breath | the mend also runs on your summons and same-node party |
| Cleanse (T1) | Immunity | the stripped kind cannot land again for 5 s |
| Brace (T1) | Riposte | a melee hit taken while Braced staggers the attacker, once per attacker per Brace |
| Bramble Guard (T2) | Entangle | a body that hits you while brambled is slowed ("Entangled") |
| Endure (T2) | Unyielding | no stun or root lands while Endure is up |
| Break Free (T3) | Backlash | breaking free staggers every adjacent body |
| Recuperate (T4) | Overflow | healing past full while the mend runs becomes a ward |

**The rest of the pass to check in play:**
- **The kit swap and the Cave.**
  - The tutorial's boss kits wear **Slam** (Forest, Mountain, Swamp, Cave bosses; Plains keeps
    Sweep).
  - The Cave leg's end now learns **Charge** ("Learn Charge: it closes the gap and lands the first
    blow"), then **Slam**, which the seals need.
  - Watch the Mountain seal and the gate: Slam's wind-up is the cost the lab measured.
- **Fire-shapes** (design §22.10, now live):
  - Sweep, Slam and Contagion nodes fire on every body hit.
  - Imbue's fires on each imbued hit.
  - Brace and Bramble fire per hit absorbed; Sidestep per hit dodged.
  - Endure and Recuperate fire every 4 s while up; Cleanse once per kind stripped.
  - Disengage fires on the body you left.
  - Brace's and Bramble's node cards now visibly differ from Endure's.
- **The five T3 path changes** (table below): Reverb's second beat, Destroyer riding your next
  Technique, Duelist's clip climbing past max on kills (the HUD shows "+N"), Warmonger's glow
  holding through the reload, and Pyromancer fire leaping to neighbours at max burn.
- **Names and icons.**
  - The hotbar shows the keystone's noun, e.g. "Whirlwind III".
  - Tooltips show the whole name, e.g. "Bleeding Whirlwind of Many I, with Echoes", with the base
    name beneath.
  - The icon gains a lane frame, an axis glyph, a keystone border and a silhouette as rows are
    bought.

## Divergences from the brief

1. **W0 reproduction.** The brief asked for "same tip", which develop's tip could not give:
   `6ea13a91` moves the Axe kit on purpose.
   - The matrix was reproduced at `d593ceea` (1,800/1,800 identical to the legibility file); the
     baseline was taken at the tip.
   - Only the 750 Axe-kit rows moved, all explained by `6ea13a91`.
2. **The parity script's grouping.** It groups by (candidate, class, boss) and gates the kit cells
   only. The plan mixes the kit with a no-card control; the controls are printed ungated.
3. **W0's boss5 measurement.** `pnpm bench:balance` does not read `boss5Spec`, and the spec's own
   runner refuses to start: it expects five rules and the package has seven. Its T3/T4 cells were
   run verbatim through the lab instead. Instrument (c) has none.
4. **Develop's suite was 388/389** (`lineageComposition`, a pin `6ea13a91` missed). It was fixed on
   the branch (`7f875957`); develop still carries the failure.
5. **W1-A merged into the integration branch although it breaks parity.** The brief says both "a
   wave that breaks it is not merged until it is back inside" and, in W1-A's own task, "if no
   single value brings every cell inside, stop at the value that minimises the worst cell, commit
   it". Its conductor prompt also says "if parity does not hold, leave the branch unmerged". No
   allowed fix brings parity back, so I merged W1-A into `feat/ability-pass` to finish the pass,
   and kept the whole branch off develop.
6. **The tutorial needed one more learn.** After the swap, the seals wear Slam but nothing taught
   it (`tutorial.test`: "attunes slam before learning it").
   - W1-A added one `learn` for Slam, directly after the Cave's end-of-leg Charge learn.
   - It also rewrote three seal and gate copy lines that named Expose Weakness.
   - Caveat: Slam's learn beat farms at the Mountain, already mastered there, so a player short
     of 190 blue walks back.
7. **W1-A's choices.**
   - Re-homed recipes take the price of the slot they move into.
   - Each new rank copies the next rank's numbers.
   - Snipe has two ranks.
   - Tests, benches and the bot swap cut ids by role:
     - Expose Weakness and Power Strike → Slam;
     - Hamstring → Binding Strike;
     - Frenzy → Imbue;
     - Quick Strike → Sweep;
     - the Tundra packet → Cull.
   - Effect kinds only the cut abilities used were removed.
   - Hamstring's own `ability-slowed` tile was **kept**, because the lineage `slow` payoff and the
     Mid-range slow still write that id.
8. **W1-B's choices.**
   - The cross row is priced at `rowEssenceCost(band, 'cross')` plus the borrowed lane's shard,
     which the brief left open.
   - New provisional unit `whirlwindTickMs` 500 (equal to the beam tick).
   - Whirlwind does not suppress basic attacks.
   - The silhouettes are unbuyable (`KEYSTONE_NOT_YET_REASON`).
9. **W1-D: Destroyer's execution is ×3.0, not "higher than the frame's" ×3.5.**
   - The path's authored −0.5 stays; three banked charges pass ×3.5.
   - The armed shape decides in an `onHit` hold, before the cooldown multiplier; casts use the
     Technique-resolution seam.
   - Reverb's "half strength" is half the execution multiplier.
10. **W1-E.**
    - Warmonger's ramp ceiling is now twice the clip, so the first clip reaches ×1.15, not ×1.3.
    - A Duelist with Refund keeps its chain through a Refund refill.
    - An Artillerist + Refund compounding bug was fixed.
    - The Duelist's Empowered `mechanic-proxy` falls back to ×1.5, since the ×3.5 exploding bullet
      is gone.
11. **W1-F.** A Pyromancer hit at max burn now refreshes the burn, which the old path deliberately
    did not. Without the refresh, Radiant would rarely fire.
12. **Conductor merge fixes.**
    - W1-B's Kill chain test: Charge's route now pays a cooldown refund, which needs a running
      cooldown.
    - The orphaned `reload-hair-trigger` status, from W1-E, was retired; the Warmonger drum reads
      `reload-frame-ramp`.
    - W1-D's Imbue fixture: Imbue is now instant.
    - W2-B's test file was rebuilt from both sides; git had interleaved two appended sections.
    - W2-E's five seam conflicts with W2-A: each kept both sides, node payoff before keystone verb.
    - Two doc passages written while W2-D was unmerged were updated.
13. **W2-A.**
    - Vanish exempts bosses, boss adds and dungeon guardians, whose targeting runs on a script's
      clock.
    - Harvest has no link ceiling.
    - Relay skips control-immune bodies and ends if its carrier dies.
    - On a Reload weapon, Fork arcs once per charge.
14. **W2-B.**
    - **Afterimage is not built.** A monster can target only a player or a minion; a decoy needs a
      new target kind or a fake entity.
    - Immunity's window is the ward unit's 5 s (provisional).
    - Shared Breath mends summons by pool share, in combat only; party members get no tile.
    - Overflow works only while Recuperate's mend runs.
    - Riposte defines melee by `isRanged`.
15. **W2-E was added by the conductor.** Wave 1 left the §22.10 fire-shapes as data only; W2-E
    made them live.
    - **Charge's "first body the rush touches" is not live.** Players pass through monster bodies,
      so there is no contact seam (the primitive Trample was dropped over).
    - A self payoff on an every-body-hit route fires once per body, so Slam's and Sweep's
      Technique-refund routes compound.
    - "Per hit absorbed" counts a hit a ward swallowed whole.
    - Endure and Recuperate fire as the window comes up, then every 4 s.
16. **W2-D.**
    - It added a cross-row icon layer and a `form` argument on the name entry point (full / noun /
      plain).
    - Four silhouette glyphs are approximations: Vanish uses a waning moon, Afterimage a doubled
      crescent; Relay and Shared Breath borrow theirs.
17. **Order.** W2-C (docs) started after W2-A, W2-B and W2-E merged, so it could document the final
    code. W2-D ran in two passes so it could animate the keystones W2-A and W2-B added.

## Keystones

Seams are the server's; the fx key is the `card-fx` the verb pushes (all through
`pushAbilityKeystoneFx`, so each carries its keystone id). The icon is W2-D's silhouette glyph
plus a border in the verb's lane colour. Animations are in
[`combat-animation-current-state.md`](../combat-animation-current-state.md).

| Verb | Seam reused | fx key | Delivery | Icon (glyph, border lane) | Animation |
|---|---|---|---|---|---|
| Whirlwind | scheduled hits (server-only, ticked in `World.tick`) + `applyPlayerAoe` around the owner | `tempo.gale-wake` | owner | `flurry`, tempo | a coil, the body turns, wind blades and a cleave ring per tick |
| Aftershock | one delayed `applyPlayerAoe` at the cast position, the rank's radius | `empowered.quake-ring` | delivering body | `cadence-aftershock`, empowered | the spot cracks under a clock ring; rock erupts; the cracks stay and cool |
| Breakthrough | `applyStun` at `ladderStunMs` on the arrival blow | `control.knockdown` | delivering body | `debuff-stunned`, control | a contact starburst, a force cone, the knockdown, a dazed halo |
| Outbreak | a tag in `resolveContagion`'s victim loop; `copyPlayerDotOnto` on the tagged body's death | `affliction.stinger-echo` + `dot-spread` | delivering body | `dot-rot-spores`, affliction | the corpse swells and bursts, a glob lands on the neighbour, a miasma pool |
| Dragnet | `applyMonsterRoot` on each adjacent body | `control.shackle` | delivering body | `payloads/root`, control | a thrown net, shackles, strands tying the bodies |
| Chain Reaction | `resolveDetonate` once per afflicted body in reach on a Detonate kill; no re-chain | `affliction.keystone` | delivering body | `energy-critical-mass`, affliction | a fuse leaps body to body; a scorched star where it began |
| Pierce | `applyPlayerAoeTo` on every body the line crosses behind the target | `tempo.ruin-afterimage` | delivering body | `stats/range`, tempo | a muzzle glint, a rail of light, each body punctured, a smoke wake |
| Harvest | Cull's own strike through `applyPlayerAoeTo`, chained while it kills | `kill-chain.keystone` | delivering body | `reaper-stance`, kill-chain | a pale scythe reaps each next low body, a wisp rises |
| Fork | Imbue's charge consumer (`onChargeSpent`), nearest body within `contagionRadius` | `kill-chain.spread-arc` | delivering body | `energy-storm`, kill-chain | static gathers, a forked bolt, the reached body jolts |
| Relay | a tick hook watches the stun expire; `applyStun`; a per-fight set reset by `onCombatEnded` | `control.keystone` | the stunned body | `summoner-coordinated-hunt`, control | the daze gathers into a spark that arcs on, a stagger flash |
| Vanish | `setAggroTarget(null)` + a gate in `selectMonsterAggroCandidate` | `engagement.sidestep-blur` | owner | `cadence-echo`, engagement | smoke, an outline of you left behind that thins over 1.7 s |
| Shared Breath | `activateRecovery(member, 'skill')` on same-node party; `mendSummonWithOwner` in the summoner's tick | `kill-chain.recovery-pulse` | formation | `summoner-howl-banner`, kill-chain | the pulse runs body to body down the formation and party |
| Immunity | the stripped ids as refused kinds on `ability-immunity`; `playerRefusesStatus` in the debuff writers | `barrier-tempo.ward-shell` | owner | `summoner-debuff-immune`, barrier-tempo | the stripped thing is wrenched out; a hex shell seals |
| Riposte | `afterHit` on a melee hit taken while `ability-guard` stands; `applyStun` | `control.knockdown` | owner | `debuff-stunned`, control | chips off the Brace, a counter crescent, the stagger flash |
| Entangle | Bramble's thorn moment; `applyMonsterSlow` under `ability-entangled` (counts as held) | `control.frost-drag` | owner | `debuff-root`, control | a vine lashes and coils round the attacker's legs |
| Unyielding | `ability-unyielding` on Endure's clock; `refusesHardControl` in the stun/root appliers | `bulwark.keystone` | owner | `defense-hardening`, bulwark | plates fly in and lock; they ring the feet |
| Backlash | the Guard-cast seam; `applyStun` on each adjacent body | `control.knockdown` | owner | `stance-release`, control | the hold bursts into shards, a shockwave, staggers a beat apart |
| Overflow | an overheal sink on `applyHealToPlayer` while the mend runs; one ward up to the ward payoff's cap | `barrier-tempo.ward-shell` | owner | `defense-absorb`, barrier-tempo | the heal rises to the brim and sets into a ward bubble |
| Afterimage | **not built** (needs a decoy target) | — | owner | `payloads/lands-twice`, engagement | keyed stub (draws the lane fx) |

**New seams the vocabulary did not have.** All are additive, and none is a combat primitive.
- **Registry:** the keystone registry and its hooks (`onAbilityKeystoneResolved`,
  `onAbilityKeystoneInfected`, `onChargeSpent`, `tick`, `onCombatEnded`, the Guard-cast seam).
- **Server scratch:** the `schedulesKeystoneHits` component.
- **Damage:** `applyPlayerAoeTo` (a victim list rather than a circle).
- **Defence:** an overheal sink hook, and `refusesHardControl` / `playerRefusesStatus`.
- **The monster acquisition gate** for Vanish.
- **Site fields:** `casterMinionId`, `from`, `targetHealthShare`, `departedFrom`.
- **`card-fx` fields:** `keystone`, `windupMs`, `axis`.

## T3 paths

| Path | Old | New | Tag | Test |
|---|---|---|---|---|
| Reverb (Squire balanced-a) | attacks during one cooldown bank bonus damage into the next execution | the execution lands now and again at half strength when its recharge reaches halfway, on whatever you are hitting; lost if nothing is in reach | empowered (unchanged) | `t3SquirePaths` |
| Destroyer (Squire heavy-b) | normal attacks deal no damage; execution on a 5 s cooldown at 3×; first strike on a new target is an execution | your execution waits, primed, and rides the next Technique you land with its shape (armed hit; Slam's area; Snipe's range); 3× (the frame's 3.5 − 0.5); regular hits deal normal damage; a Guard never fires it | engagement → **technique** | `t3SquirePaths` |
| Justicar (Striker balanced-c) | unchanged | unchanged (no effect change) | affliction → **empowered** | `t3PacketTags` |
| Duelist (Slinger light-a) | the last bullet fires empowered (3.5×) with splash; +1 ammo | every kill loads a round past the clip's size until the next reload; the counter climbs past max | empowered → **kill-chain** | `t3SlingerPaths` |
| Warmonger (Slinger heavy-b) | attack speed ramps per shot, resets on reload | a reload halves the ramp instead of resetting it; the glow holds at the carried value | tempo (unchanged) | `t3SlingerPaths`, `frameLoopsRanged` |
| Pyromancer (Apprentice balanced-a) | 2 stacks at 55%; a hit at max burn adds 1.5× bonus damage | 2 stacks at 55%; **Radiant**: at max burn each tick also strikes every adjacent body for the tick (damage over time, no stacks) | affliction (unchanged) | `t3ApprenticePaths` |

Path lane counts after the pass (`t3PacketTags`): tempo 15, empowered 20, affliction 12,
control 2, kill-chain 2, engagement 2, technique 1.

## Code review

I reviewed the merged diff myself, against the brief's checklist.

- **`evadeBlocksDebuffs`.** Every keystone that applies a debuff off a player's hit checks it:
  Breakthrough, Dragnet, Chain Reaction, Fork, Harvest, Pierce, Relay, Whirlwind, Aftershock. The
  modules without the check apply nothing off a hit exchange:
  - Backlash, Immunity and Unyielding are Guard casts or player statuses;
  - Outbreak fires on a death;
  - scheduled hits are damage only.

  Riposte and Entangle react to monster hits on the player, and skip full dodges and zero-damage
  hits respectively.
- **One multiplier per hit.**
  - Reverb's echo carries only the execution's own multiplier.
  - Destroyer's delivery records it.
  - Node payoffs on bodies other than the exchange's resolve on the owner's Attack, the basis a
    cast area already used, with no stacked multiplier.
- **No per-tick HUD booleans.** No new boolean on a networked slice or in the protocol. The
  Duelist's extra rounds are a number on the ammo slice, marked dirty.
- **No number outside Slam rank I, unless marked provisional.** `magnitudes.ts` changed in
  comments only. New numbers, all marked PROVISIONAL in code:
  - **Sidestep** (3 RP, 10 s cooldown, green 45) and **Cull** (4 RP, 2.0 → 4.0 at T3 and
    2.25 → 4.5 at T4 under 50% health, blue 150);
  - `ABILITY_KEYSTONE_UNITS`: Whirlwind 1 s and Aftershock 1 s, both from the design, and
    Whirlwind's 500 ms tick;
  - the shape constants **0.5** for Reverb's echo and Warmonger's carry, and `reload.kill-chain` 1;
  - re-homed recipe prices, taken from their slots.
- **Nothing touches the weapon verb's counter or ring.** Keystone code names `hit-nth` only in
  comments that forbid it. The keystone tests assert no attack event and unchanged counters for
  every keystone hit. No keystone adds a ring or a floating word (keystone `card-fx` carries no
  `cardId`).

**Known gaps found in review, reported and not fixed:**
- **Unyielding is bypassed** by the boss pattern `apply-status` step. The T3 Rime Mammoth's
  Deep Freeze applies `dot-frozen` straight onto the player.
- **Immunity is bypassed** by the same step (Death Sting's Sun Mark, Numbing Sting's slow), by
  `applyContactSlow`, by ground-zone hazards and by the boss room debuff.
- **Dead code** with no remaining source:
  - the `tools/dps-report.ts` Duelist and Hair Trigger branches;
  - the `reload.exploding-clip*` and `reload.hair-trigger*` passive keys;
  - the client exploding-clip effect branch and `fxDuelistShot`;
  - `DEFAULT_EXPLODING_CLIP_MULT` / `DEFAULT_EXPLODING_AOE_MULT`.
- **The frozen `volcanoHeatCases.json` and `volcanoHeatReferences.json`** still name Frenzy and
  Expose Weakness. They are outside the suite.

## Open for the designer

1. **Parity: the run's one blocker.** Pick one:
   - **(a)** Accept the deltas. The kit still wins every boss at ≥97%. Merge as is.
   - **(b)** Give the kit a Technique per class. For example, Sweep instead of Slam for the
     Slinger, Spirit and Striker, whose cells fall.
   - **(c)** Allow a second number, such as rank I's wind-up. The cadence split is about the 1.6 s
     window.
   - **(d)** Re-tune the T1 boss rows against the new kit.

   The branch is ready to merge after (a); (b) and (c) are a short W1-A follow-up and one lab
   ladder.
2. **Slam's ranks.** Rank I (T1) is 2.2× but rank II (T2) is still 1.75×, so **tiering up lowers
   Slam's multiplier**. Also: should the T3/T4 reference package wear Slam? It costs −8% / −16%
   there, and the Spirit at T4 loses 44%.
3. **Afterimage.** Authorise a decoy target kind (a new primitive), or W2-B's cheap reading. That
   reading cancels the attacker's next hit on you and draws an afterimage at the spot, but the
   monster does not walk to it or swing at it.
4. **Charge's first-touched body** needs a path sweep, the primitive Trample was dropped over.
   Keep Charge on its target?
5. **Fire-shape consequences.**
   - Slam's and Sweep's refund routes compound per body hit.
   - Per-hit Guard nodes fire far more often. Brace's ward route is 14–40 a minute, against 6 on
     cast. Wards stack.
   - Sidestep's node fires less (about 2/min against 6).
   - Cap self payoffs to once per resolution?
6. **The path numbers the shape rules produced:**
   - Destroyer ×3.0 against the frame's ×3.5;
   - Warmonger's first clip ×1.15, with sustained fights near +158% attack speed;
   - the Duelist's Empowered proxy now ×1.5;
   - the Pyromancer's burn now refreshes at max.
7. **Keystone readings:**
   - Vanish ignores bosses, boss adds and guardians;
   - Harvest has no link ceiling;
   - Immunity's window is 5 s;
   - Overflow works only during the mend;
   - Shared Breath mends summons by pool share.
8. **Boss appliers that bypass Unyielding and Immunity** (above), Deep Freeze above all.
9. **Names.**
   - Every keystone name is still a placeholder.
   - The shared slow status still reads "Hamstrung".
   - The Dagger cards "Deeper Hamstring", "Envenomed Hamstring" and "Hamstrung Plague", and the
     Axe's "Deeper Frenzy", echo cut abilities.
   - Four icon silhouettes are approximations.
10. **Provisional numbers to confirm:**
    - Sidestep: 3 RP, 10 s cooldown, green 45;
    - Cull: 4 RP, 2.0 → 4.0 / 2.25 → 4.5 under 50% health, 10 s cooldown, 1.6 s wind-up, blue 150;
    - the re-homed recipe prices;
    - Whirlwind's 500 ms tick.
11. **The trios' second and third verbs** (design §22.11) are designed and not built. They land in
    the same row as a follow-up wave. Momentum and Long Night carry the designer's "test first"
    flags.

## Addendum: wave 4, the designer's calls (2026-10-09)

The designer answered the open calls in one sitting; they are recorded as design §22.12
(`cc620463`) and were built by a follow-up wave of five tasks off `9463f1d4` (§22.12 + the
renames, committed by the conductor).

### What was decided and what was built

| Call (§22.12) | Built by | Merged | Result |
|---|---|---|---|
| Parity on two Slam numbers (rank I multiplier + wind-up) | W4-A, `w1a`, `feat/ap-slam-parity` | `e7f495fc` | **1.2× on 600 ms: 30/30 kit cells inside ±5%** |
| Slam never weakens on tier-up: ranks II–IV 2.45 / 2.7 / 2.95 | W4-A | `e7f495fc` | a test pins that `damageMult` never falls rank to rank |
| Sidestep ships Flow; Afterimage stays a silhouette | W4-B, `w1b`, `feat/ap-keystone-calls` | `5b7cbc0f` | all 19 first verbs live; Flow leads the trio |
| Vanish works on bosses, adds and dungeon guardians | W4-B | `5b7cbc0f` | a server-only `holdsForVanished` hold keeps the script and the aggro session |
| Harvest capped at `chainMaxLinks` (4); Overflow always on; Immunity 3 s | W4-B | `5b7cbc0f` | |
| Fire-shapes keep their rate | W4-C, `w2a`, `feat/ap-fire-shape-rate` | `4c73531e` | self payoffs once per resolution; a node's ward refreshes its own; every per-hit/per-tick/on-strip Guard route capped (packet cap, else Control's 5 s) |
| Boss mechanics pass the Guard gates | W4-D, `w1c`, `feat/ap-boss-gates` | `80602d53` | Deep Freeze, the stings, contact slows, ground hazards, room debuffs and a dive-bomb root refused under Unyielding/Immunity; T1 lab identical |
| Destroyer ×3.5, Warmonger fill per clip, Duelist proxy ×3.5, Pyromancer no refresh | W4-E, `w1d2`, `feat/ap-path-calls` | `c72f6044` | the Duelist's ×3.5 is on its own proxy key, so its openers and the DPS estimate do not move |
| Charge fires on its target | — | — | already the built behaviour |
| Renames: "Slowed", Deeper Hobble, Envenomed Hobble, Hobbled Plague, Deeper Fury | conductor | `9463f1d4` | |

### Parity, final (merged tip `5b7cbc0f`)

The tip's matrix is IDENTICAL to W4-A's authored run (1,800/1,800): nothing else in wave 4
moved a T1 cell. Kit cells, mean dps change from the baseline (Razorback ±0.0 everywhere):

| class | Greatbear | Toadeater | Behemoth | Broodmother |
|---|---:|---:|---:|---:|
| Striker | −4.7% | −2.0% | −3.1% | −4.2% |
| Squire | +0.4% | +4.6% | +0.4% | −0.8% |
| Slinger | −4.5% | −4.4% | −0.2% | −2.0% |
| Spirit | −3.8% | −2.5% | −2.4% | −3.4% |
| Apprentice | +4.5% | +2.2% | +0.4% | +1.1% |
| Conduit | −0.2% | +1.3% | +4.1% | +1.8% |

Every kit cell wins 100% except the Striker's Razorback, 97% as in the baseline (the
Striker's Behemoth, 97% at 2.2, is back to 100%). The no-card controls move −4.3% to +9.9%
(the Conduit's Behemoth, +26.7% at 2.2). The two-number ladder (`w4a-ladder.md`): the
wind-up closed the class spread from ~17 points at 1.6 s to ~9 at 600 ms; 600 ms is the
longest that passes (at 700 ms one cell is always out, because the Striker's and
Apprentice's equal Attack moves their cells in whole hit points). Tables:
`final-w4-parity.md`, `w4a-parity.md`.

**No-card identity:** the 180 rows whose abilities survive unchanged are identical to the
legibility run's again (`final-w4-base.jsonl`). **Suite 401/401 (221 s), typecheck clean.**

### T3/T4 with the new Slam ranks (W4-A's Rerun 2, a measurement)

| tier | W0 (Expose Weakness) | W1-A (old Slam ranks) | tip, old ranks | W4-A (2.7 / 2.95) | wins W0 → W4-A |
|---|---:|---:|---:|---:|---|
| T3 | 105.9 | 97.2 | 97.2 | 102.6 | 25 → 22 / 42 |
| T4 | 286.5 | 240.2 | 217.1 | 228.1 | 32 → 29 / 36 |

The new ranks lift every class but the T3 Slinger. Against W0, the Striker and Slinger
still trail 14–19% at both tiers and the T4 Spirit ~40%. The tip-with-old-ranks control
shows a further T4 drop that is NOT Slam: the T4 Apprentice falls 349.7 → 207.9 dps
(−40.5%) between W1-A's branch and the tip, from the pass's Pyromancer change (the 1.5×
max-burn bonus hit is gone). That was measured before W4-E's "no refresh at max", which
can only lower it further. Per class: `stacking.md` "Rerun 2".

### New open calls for the designer

1. **Slam's rank I → II step is big:** 1.2× / 0.6 s at T1, then 2.45× / 1.6 s at T2.
2. **The T4 Pyromancer Apprentice lost ~40%** in the T3/T4 package (the max-burn bonus is
   gone, and now the burn does not refresh at max). The Ember frame owns "intensifies";
   is the path now too weak at T4?
3. **Flow is a gamble on low evasion:** the window adds ~0.15 evasion, so the first hit
   usually lands and ends it.
4. **Cleanse's "sized by what it removed" is now inert:** every Guard offer is a self
   payoff, so a strip fires once under the rate guard.
5. **A Deep Freeze refused by Unyielding still spends the player's Chill and Frostbite**
   (the precedent of every other refusal); a one-line move if the cold should be kept.
6. **A Vanished player can keep a boss holding** as long as something else keeps them in
   combat and they never attack; the script keeps running and their next hit ends it.
7. **Not gated, environment:** terrain slows (Swamp rot pool, Jungle bush), Frost Nova's
   ambient Chill ramp under Immunity, and an ordinary monster's rally handing a Vanished
   player to allies.
8. **Imbue's per-hit Tempo echo** is a Technique route and stays uncapped.
9. `biomeEcology.test.ts` failed once under the lab's CPU load (a patrol sentinel did not
   move; the test seeds its clock from `Date.now()`); it passes alone and in the final run.
