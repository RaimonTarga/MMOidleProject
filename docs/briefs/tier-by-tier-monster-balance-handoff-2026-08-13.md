# Tier-by-Tier Monster Balance — Fresh-Session Handoff

**Prepared:** 2026-08-13  
**Purpose:** complete context transfer and implementation roadmap for a collaborative,
tier-by-tier monster-authoring pass.  
**Current branch:** `feat/biome-ecology-pass2`  
**Repo contract:** read `CLAUDE.md` and `design_docs/architecture.md` before changing code.

This is not an unattended “rebalance everything” specification. The designer and agent
will work together one tier and one biome at a time. The agent owns instruments,
calculations, proposals, simulations and reviewable implementation diffs. The designer
owns progression intent, monster fantasy, counterplay and acceptance of gameplay changes.

---

## 1. Fresh-session starting prompt

Use this prompt in the next session:

> Read `CLAUDE.md`, `design_docs/architecture.md`, and
> `docs/briefs/tier-by-tier-monster-balance-handoff-2026-08-13.md` completely. Continue
> the tier-by-tier monster balance program. Begin with the tooling/table foundation and
> then produce the comprehensive T1 monster table grouped by biome. Do not change
> canonical monster stats, ecology, bosses or rewards until we have reviewed the T1
> table and agreed on the Plains baseline together. Preserve the existing dirty
> worktree.

Recommended supporting reads, after the handoff:

- `docs/balance-lab-current-state.md`
- `docs/biome-ecology-current-state.md`, especially the ecology primitives and Desert
  controller/dealer section
- `design_docs/player-power-curve.md`
- `design_docs/design-bible.md`
- Canonical monster, biome and recipe data under `shared/src/data/`

Source code wins if any document is stale.

---

## 2. Locked design decisions from the user

### 2.1 Progression is a soft gear gate

Later biomes should be meaningfully harder, but not absolute locks:

- A player may enter ahead of the expected gearing point and have a rough time.
- Farming earlier biomes should make later biomes reliable and efficient.
- A strong build or attentive player may skip ahead.
- Normal monsters should not become universal build checks.
- Power progression is tied to **Global Mastery plus item upgrade level**, not merely
  the nominal item tier.

The intended experience is not “multiply every later biome by a larger number.” Every
monster's base stats are hand-authored, and biome difficulty should also come from
interesting, readable ecology and mechanics.

### 2.2 T1 player checkpoints

These are bands, not automatic pass/fail gates. The lower `+N` is the approximate
challenge/entry point; the upper value should trend toward reliable farming. Exact legal
loadouts and Global Mastery states must be derived from the real progression rules.

| Content | Expected reference gear | Intended reading |
|---|---|---|
| Plains | Tutorial gear | Locked starting baseline; fighting multiple enemies is expected |
| Forest | Plains gear at +0 or +1 | Early step; starting here may be rough |
| Swamp | Forest or Plains gear at +1 or +2 | Near the early midpoint; starting here is possible but rough |
| Mountain | Appropriate earlier gear at +2 or +3 | Later soft gate |
| Cave | Appropriate earlier gear at +3 or +4 | Tuned roughly around +3; +4 should improve reliability |
| T1 bosses | Appropriate gear at +4 or +5 | Tuned roughly around +4; boss pass follows normal monsters |

“Tutorial gear,” “Plains gear,” and mixed source choices must become explicit item IDs in
the instrument output. Never hide the actual loadout behind a label.

### 2.3 T2 extrapolation

T2 has seven authored biome groups rather than five:

`forest, mountain, plains, swamp, cave, jungle, desert`

Use the same +0…+5 progression span more gradually. Jungle and Desert belong toward the
late end. The exact biome ordering and exact checkpoint assigned to each T2 biome are **not
locked yet**; settle them with the user at the start of the T2 pass after T1 teaches us
how the measurements behave. Do not silently infer a canonical seven-biome order from map
or database iteration order.

### 2.4 Measure both individual combat and density/ecology

Balance must be evaluated at three levels:

1. **Individual monster** — authored stat shape and isolated counterplay.
2. **Intended ecology unit** — swarm, pack, controller/dealer group, patrol pull,
   chokepoint encounter, elite pair, and so on.
3. **Biome farm** — population density, simultaneous pulls, travel/contact time,
   repopulation, deaths and income over time.

Plains is explicitly expected to create multi-enemy fights. A one-on-one Field Hare
reading cannot represent Plains difficulty. Conversely, a low-density Cave should not be
made into a swarm simply to lift a composite score.

### 2.5 Ordering is contextual, not universal

- Overall engagement/farming experience should follow the agreed biome progression.
- Individual monsters may cross over between biomes.
- Builds should have favorable and unfavorable matchups.
- No biome needs to be harder on every axis or for every class.
- A biome must not dominate all others across every build, metric and reward dimension.

### 2.6 Difficulty is a profile, not one authoritative score

The primary result is a multi-axis threat profile:

- durability;
- sustained damage;
- burst/spike;
- attrition/DoT;
- control;
- mobility/pursuit;
- ecology/group pressure;
- farm risk and efficiency.

A summary index may be shown for sorting or outlier discovery, but it must identify its
reference profile and must never decide whether content is balanced.

### 2.7 Mechanical-authoring authority

The agent may freely **propose**:

- compositions of existing mechanics such as packs, patrols, swarms, charges, wind-ups,
  DoTs, death effects, control and encounter relationships;
- new mechanics when they materially improve identity and readable counterplay;
- exact per-field base-stat changes with reasons.

The agent may implement approved existing-mechanic compositions and stat changes after a
biome review. A genuinely new engine-level mechanic requires explicit user design approval
before implementation. The user's example of future exploration is flying Mountain
eagles/rocs; this is an idea, not yet an approved mechanic specification.

### 2.8 Approval cadence

1. Normal T1 monsters.
2. One biome at a time, starting with Plains as the measured control.
3. Review and approve a small biome proposal.
4. Implement it and rerun tables/simulations.
5. Stabilize all normal T1 biomes.
6. Balance T1 bosses.
7. Revisit T1 rewards.
8. Proceed to T2 and repeat.

Do not rebalance classes or items inside this monster pass. They are reference inputs and
possible later balance subjects, not simultaneous moving targets.

---

## 3. What the comprehensive tier table must contain

The deliverable must be available in the Balance Lab and exportable to a stable textual
format (Markdown and/or CSV) suitable for discussion and diffing. Group rows by biome and
preserve authored pool weights.

### 3.1 Authored facts — no reference build required

| Category | Required fields |
|---|---|
| Identity | tier, biome, monster ID/name, normal/elite/boss, intended role |
| Spawn/ecology | pool weight, biome density, expected bodies per ecology unit, pack/swarm/patrol/post/charge relationships |
| Durability | HP, plating, damage reduction, evasion, shields/soft caps when present |
| Offense | attack, cooldown, attacks/sec, range, direct raw DPS, DoT DPS, spike multiplier |
| Movement/aggro | speed, pull range, behavior, kite/charge/engagement properties |
| Mechanics | concise mechanic list plus readable counterplay; do not reduce this to “special” |
| Rewards | essence, biome XP, catalyst weight, boss bundles where relevant |

### 3.2 Derived values — always name the reference

There is no attacker-independent eHP and no defender-independent effective DPS in this
combat model. Plating creates a per-hit cliff, DoTs can bypass parts of the direct-hit
model, and class cycles differ. Therefore:

- **Monster effective HP** must be shown against named player damage profiles. A useful
  calculation is `monster HP × raw reference DPS / applied reference DPS`, alongside the
  resulting TTK. At minimum include representative fast-hit and heavy-hit profiles; later
  add class-specific columns or a selectable profile view.
- **Monster effective DPS** must be shown against named player defensive profiles and
  split into direct sustained damage, DoT/attrition and spike. Do not fold control or
  multi-body pressure into invisible DPS.
- Every result must display the concrete gear item IDs, upgrade levels, skill path,
  Global Mastery/biome-level state, stance, rites and runes used by the reference.
- When a mechanic is not modeled, mark the value as partial instead of pretending it is
  complete.

Recommended derived columns per selected reference:

- applied player DPS;
- effective monster HP;
- expected TTK;
- applied direct monster DPS;
- DoT DPS;
- effective total DPS;
- worst spike as damage and percent of player max HP;
- player TTL without healing and, separately, simulated outcome with full systems;
- hits to kill / hits to die where that is more legible than seconds.

### 3.3 Ecology-unit and farm results

For each authored scenario, report at least:

- scenario composition and body count;
- number concurrently engaged and peak concurrent attackers;
- time to first contact and time to clear;
- player damage taken, ending HP, death/timeout outcome;
- damage contribution by monster type when practical;
- control/DoT uptime and important mechanic activations when practical.

For the representative biome farm:

- kills/hour and deaths/hour;
- damage taken/hour;
- essence, catalyst and biome XP/hour;
- density and actual mean/peak concurrent engagement;
- hours to biome cap where applicable;
- result spread across representative builds, not only the mean.

The existing farm ledger already provides much of the economic output, but it does not yet
provide all engagement-shape telemetry.

### 3.4 Threat-profile presentation

Show the underlying numbers first. A compact profile may normalize the seven axes for
visual comparison, but it must:

- compare within a declared tier and reference checkpoint;
- retain raw values in the same view;
- distinguish analytical estimates from runtime results;
- expose uncertainty/model omissions;
- never be used as an automatic tuning target.

---

## 4. Reference-profile model to implement

The current instruments usually equip fully upgraded gear and the current Lab uses broad,
averaged profiles. Neither represents the checkpoints in §2.2.

Create a typed `BalanceReferenceCheckpoint` (exact name is flexible) with at least:

- stable ID and player-facing label;
- content tier and target biome;
- player tier;
- explicit gear source/lineage and exact `gearItemIds` by slot;
- per-item upgrade level, not one implied global maximum;
- explicit `biomeLevel` map and derived Global Mastery;
- skill/class build ID;
- abilities, stance, rites and runes;
- intent: challenge, expected, reliable, boss-ready;
- provenance/status: designer-approved, generated candidate or diagnostic.

Do not merely force `itemUpgrades` to `getMaxUpgrade`. The current bench does this in
`server/bench/balance/botFactory.ts`. Parameterize bot construction so +0 through +5 and
legal mastery states can be simulated. Use the real gates in:

- `shared/src/config/gameConfig.ts` (`globalMastery`, biome caps);
- `shared/src/systems/itemUpgrades.ts` (`getMaxUpgrade`, required levels and checks);
- canonical recipe/item data.

The first T1 table should present candidate concrete loadouts for the agreed checkpoint
labels. The user should approve or correct those concrete profiles before their results
become baseline evidence. Avoid averaging all classes into a fictional player; provide a
small named set and show spread.

---

## 5. Implementation roadmap

### Milestone 0 — Preserve and re-establish the workspace

1. Read the required docs and inspect `git status` before editing.
2. The worktree is currently dirty and includes the Balance Lab plus other session work;
   do not reset, checkout or overwrite it.
3. Confirm the existing focused Balance Lab test, typecheck and admin build.
4. Record the exact starting revision and whether the user has since committed the work.

**Exit:** the next session can distinguish pre-existing edits from its own changes.

### Milestone 1 — Table and reference contracts

1. Define typed authored-stat, derived-profile, ecology-scenario and confidence/provenance
   records in shared or tooling-owned code as appropriate.
2. Define candidate T1 reference checkpoints from §2.2 using explicit items, upgrades and
   mastery state.
3. Parameterize bench bot creation for partial upgrades and checkpoint progression.
4. Add invariants proving +0, +3 and +5 produce distinct legal stats and that the output
   reports the exact loadout used.

**Review gate:** show the concrete T1 checkpoint loadouts to the user. Do not tune monsters.

### Milestone 2 — Comprehensive individual-monster table

1. Extend the shared Balance Lab snapshot or create a pure balance-analysis module that
   emits every §3.1 field.
2. Add named-reference eHP, effective DPS, TTK and TTL calculations.
3. Preserve duplicate pool weights and expose unpooled ecology followers clearly.
4. Add grouped T1 table UI plus Markdown/CSV export generated from the same typed rows.
5. Consolidate duplicated formulas between `tools/mob-report.ts` and the Lab where safe;
   do not maintain two subtly different threat models.

**Exit:** one command and the Admin Lab produce the same reviewable T1 facts.

### Milestone 3 — Ecology and density scenarios

1. Define explicit scenario fixtures from authored ecology: Plains multi-pull/swarm,
   Forest wolf pack, Swamp attrition fights, Mountain positional/charged threats and Cave
   elite/patrol encounters.
2. Reuse the authoritative `World` and `initCombatSystems`; do not build a parallel combat
   simulator.
3. Add deterministic/repeatable scenario execution and capture composition, concurrency,
   clear time, damage, death and mechanic events.
4. Extend farm results with mean/peak concurrent attackers and useful per-monster
   contribution data.
5. Keep fight/farm time scale within the measured fidelity ceiling (`<= 2`) unless a new
   validation proves otherwise.

**Exit:** the Lab can contrast isolated, ecology-unit and farm outcomes.

### Milestone 4 — T1 baseline review

Produce the complete T1 dossier without changing canonical balance values:

1. Plains control and multi-enemy baseline.
2. Forest.
3. Swamp.
4. Mountain.
5. Cave.

For each biome, summarize current stat shapes, mechanics, ecology, reference outcomes,
class/build spread, outliers and model limitations. Use Plains as a control, not an assumed
perfect answer.

**Review gate:** user confirms/corrects the baseline and chooses the first biome proposal.

### Milestone 5 — Collaborative normal-monster authoring

Repeat for each biome in the approved order:

1. State biome fantasy, player test and each monster's encounter role.
2. Identify problems in current base stats/ecology with evidence.
3. Propose per-monster base values and mechanic/ecology changes. Include before/after
   fields, purpose, counterplay, expected profile movement and risks.
4. Obtain user approval, especially for new mechanics.
5. Implement one small biome batch in canonical data/server behavior.
6. Run individual, ecology and farm suites across named reference builds.
7. Update the table and present deltas. Iterate or accept.

Do not use a permanent biome-wide multiplier. Temporary what-if scaling may estimate the
size of a gap, but every accepted result is hand-authored in the monster/ecology data.

### Milestone 6 — T1 bosses, then rewards

Only after normal T1 progression stabilizes:

1. Evaluate bosses against +4 challenge / +5 reliable checkpoints.
2. Review boss mechanics separately from trash ecology.
3. Tune boss base values and scripts in small reviewed batches.
4. Revisit normal and boss essence, XP and catalyst rewards against measured risk and farm
   rate. Do not pay rewards purely from a composite difficulty score.

### Milestone 7 — T2 and later tiers

1. Agree on the exact seven-biome T2 order and checkpoint map with the user.
2. Stretch +0…+5 more gradually; keep Jungle and Desert toward the late end.
3. Repeat Milestones 4–6 for T2.
4. Continue tier by tier. Do not let unfinished/missing T3+ rosters distort an earlier
   tier's acceptance criteria.

---

## 6. What already exists and is reusable

Most of the 2026-08-12/13 work is useful foundation, not throwaway work:

- `shared/src/systems/balanceLab.ts` builds a typed server-provided snapshot across T1–T4.
- The Admin app has tier navigation, a biome overview, searchable roster and Encounter
  Inspector in `admin/src/tabs/BalanceLabTab.tsx`.
- The snapshot already exposes authored HP/attack/defenses/rewards/mechanics plus planning
  TTK, player TTL, spikes, density and pool weights.
- `shared/src/systems/dpsEstimate.ts` models class cycles more honestly than the old
  direct-hit estimate.
- `tools/balance-data.ts` is an authored-data seam suitable for a later reversible
  experiment overlay.
- `tools/mob-report.ts` and generated mob packets already provide textual tier reports.
- `server/bench/balance/` already runs the authoritative combat world in fight and farm
  modes and records deaths, damage, kills and economic rates.
- `server/test/balanceInstruments.test.ts` protects important canonical bench choices.
- The Admin protocol/socket path for the Lab is wired and working.
- `shared/src/data/balanceProgression.ts` demonstrates a machine-readable design-policy
  shape and a locked baseline concept.

Build on those seams rather than creating a spreadsheet-only second model.

---

## 7. What is provisional and must not become accidental authority

- The current Lab “Threat” index is driven mainly by incoming DPS. It is not overall
  difficulty.
- `encounter-burden-v1` (damage expected during an analytical average kill) is diagnostic
  only. It substantially exaggerates differences when TTK changes and ignores much of
  movement, control and multi-body ecology.
- Current Lab reference profiles average broad class/build sets and use generic gear
  assumptions. Replace/supplement them with the approved checkpoint model.
- Current fight/farm bench bots generally wear fully upgraded gear and capped reachable
  biome mastery. This must be parameterized before using it for +0…+5 progression.
- Current analytical incoming damage does not model healing or simultaneous attackers.
- Current planning TTK omits several runtime mechanics, movement, shields and soft caps.
- The draft biome authoring briefs in `balanceProgression.ts` are agent hypotheses. They
  are prompts for review, not user-approved canon.
- The current T1 policy's strict ordering display was exploratory. The user's newer rule
  is contextual ordering across ecology/farming, not a demand that every isolated scalar
  rise monotonically.
- The Lab snapshot is cached at server/admin registration because it uses immutable
  authored data. An experiment overlay will need explicit regeneration/versioning.
- Some analysis logic remains duplicated between the Lab and `mob-report`; reconcile it
  before treating close numerical differences as meaningful.

Nothing here needs to be deleted immediately. Demote these readings visually and replace
them as the stronger individual/ecology/farm views arrive.

---

## 8. Agent autonomy and future decision gates

### May proceed without another design decision

- typed table/reference/scenario contracts;
- read-only data extraction and exports;
- formula provenance and confidence labels;
- parameterizing partial-upgrade/mastery bench bots;
- tests, UI layout, report generation and deterministic instrumentation;
- producing candidate reference loadouts and per-monster proposals;
- running and analyzing simulations.

### Must return to the user

- approval of concrete named reference loadouts before they become baselines;
- the exact T2 biome order and checkpoint allocation;
- acceptance of each biome's fantasy, monster roles and target pressure;
- any genuinely new engine-level mechanic (including the eventual flying design);
- canonical monster stat/mechanic changes, unless the user has just approved that exact
  proposal;
- boss and reward changes.

These are intentional collaboration gates, not tooling blockers.

---

## 9. Verification and acceptance criteria

Every tooling milestone should satisfy:

- `pnpm typecheck` passes.
- Relevant focused tests pass; run `pnpm test` after meaningful shared/server changes.
- Admin production build passes after UI changes.
- Live Balance Lab verification has no console errors and shows the expected tier rows.
- Every derived value states its named reference and analytical/runtime provenance.
- Tables preserve authored pool weighting and ecology members.
- A checkpoint result includes exact items, upgrade levels and mastery state.
- Canonical monster values remain untouched until a reviewed biome proposal is approved.
- Generated reports are regenerated rather than edited by hand.

Last known verification before this handoff:

- Full suite: **75/75** on 2026-08-12, before the final authoring-brief extension.
- Focused `balanceLab.test.ts`: passes on 2026-08-13.
- `pnpm typecheck`: clean on 2026-08-13.
- Admin production build: clean on 2026-08-13 (existing large-chunk warning only).
- Live progression/authoring UI check: rendered with no console errors.

---

## 10. Worktree warning

At handoff time the branch is `feat/biome-ecology-pass2` at commit `3eb5e1f`, with a
substantial dirty worktree. Balance Lab files are untracked/modified alongside earlier UI,
report and balance-instrument work. Run `git status` and inspect diffs before any edit.
Do not assume the listed commit contains the Balance Lab, do not reset the tree, and do not
discard unrelated changes.

Key uncommitted Balance Lab/program files include:

- `admin/src/tabs/BalanceLabTab.tsx`
- `shared/src/systems/balanceLab.ts`
- `shared/src/systems/balanceLab.test.ts`
- `shared/src/data/balanceProgression.ts`
- `docs/balance-lab-current-state.md`
- Admin state/socket/app wiring and shared admin protocol/server namespace changes

The next session should verify this state again because the user may commit or modify it
between sessions.

