> **HISTORICAL (archived 2026-07-07).** June 2026 T4-era design-doc audit. Kept for rationale; not a current reference.

# Design Audit — June 2026

**Scope:** review of the existing design documentation, with focus on the T4 layer
(specs, items, monsters). Companion doc: `../design-development-suggestions.md`
(forward-looking brainstorm: dungeons, itemization, new directions).
**Status: external review, not canon.** Where this doc and the bible disagree, the
bible wins until you decide otherwise.

---

## 1. Overall assessment

The documentation set is unusually coherent for a solo project. The load-bearing
ideas are genuinely strong and reinforce each other:

- **Determinism as identity.** "No RNG, ever" is rare in the genre and pays off
  everywhere: balance is computable, fights are reproducible in sim, and "build-test,
  not reflex-test" follows naturally. This is the game's most distinctive axiom —
  protect it.
- **The mechanic ownership map** (bible §4) is the single best anti-sprawl tool in
  the docs. Every mechanic has one home; crosses are explicit borrows. Most games
  this size drown in mechanic soup; yours has a registry.
- **Biome retirement with handoff rule** elegantly solves the "content must grow
  forever" trap. Vocabulary accumulates, vessels rotate, active roster stays ~5–7.
- **Separated offense/defense budgets + the threat matrix as the immortality cap.**
  Using content shape (you can't counter all shapes on a split budget) instead of
  hard stat caps is structurally sound and much more interesting than clamps.
- **One axis per tier** (T1 shapes → T2 conditionals → T3 range → T4 enemy defenses
  → T5 packs) gives every tier a teachable lesson and keeps complexity paced.
- **Economy in three coupled knobs** with a single essence ratio (0.16 × biomeXp)
  and "cap before you can max" tension — clean, legible, tunable from one constant.
- The **discarded-concepts sections** in the T4 spec doc are excellent practice.
  Knowing what you rejected and why is half the design record.

The main risks are not in the ideas but in **execution surface area**: T4
introduces ~22 new engine keys, ~45 specs, a relic layer, two new biomes, and four
new monster mechanics simultaneously. Each is individually justified; together they
are a large combinatorial audit burden (see §5).

---

## 2. T4 class specs (`t4-spec-designs-reference.md`)

### What's working

- Frame identity discipline (light = attacks, heavy = mechanic, balanced = both) is
  applied consistently across all five classes — each frame's three specs really are
  three *relationships with the frame*, not three stat packages.
- The "no damage-taken scaling" and "no on-kill at this tier" constraints are doing
  real work — several rejected concepts (Counter-Fire, Chain Discharge, Virulence)
  show the constraints being enforced, not just stated.
- Several specs encode the *idle* identity directly: Momentum, Critical Mass, and
  Rampage all reward long uninterrupted farming sessions. That's the right power
  fantasy for this game and worth doing deliberately in every class (currently
  Cadence/Reload/Energy have one each; Cooldown and DoT don't).
- Cross-class implementation table + pending-numbers list = a real handoff artifact.

### Doc bugs (fix before next session uses this doc)

1. **DoT "Balanced — Fire" section header is missing.** Fan the Flames, Ignition,
   and Conflagration sit under the *Light — Venom Vessel* header but are Fire
   Balanced specs (the addendum and the flags table both say so). Anyone pasting
   this doc into a balance session will misread the frame assignments.
2. **Stale addenda referencing discarded specs:**
   - Cadence heavy addendum lists *Thunderclap* and *Iron Patience* (both
     discarded) and omits Rampage and Crescendo.
   - Cooldown balanced addendum lists *Acceleration* (replaced by Reverb).
   - DoT light addendum lists *Invigorating Toxins* (replaced by Frenzy).
   - Reload light addendum says *Exploding Clip*; the spec body calls it *Last
     Bullet* (and the discarded list also references "Exploding Clip" as live).
3. **Cross-class implementation table and pending-numbers list still carry "Iron
   Patience charge ceiling"** — a discarded spec. Dead work item; remove it.

### Design-level iteration candidates

- **Execute vocabulary is drifting.** The bible reserves *Execute* (bonus damage vs
  low-HP targets) as Trench's signature new mechanic. The T4 specs independently
  give execute-style triggers to Delayed Verdict (Cadence Bal), Death Mark (Reload
  Bal), and Singularity Execute (Energy Heavy). These are mechanically different —
  they're *anti-overkill smoothing* ("fire stored damage early if it would kill"),
  not damage bonuses — but the naming blurs the line. Suggest: rename the smoothing
  pattern (e.g. "primed/overkill-carry") and reserve "execute" strictly for the
  Trench-style threshold multiplier. Cheap fix, protects the ownership map.
- **Out-of-combat persistence rules need one global vocabulary.** Rampage stacks
  "decay slowly OOC," Momentum stacks "decay slowly OOC," Critical Mass "resets on
  5s without dealing damage," Flash energy "decays on disengage." Four ad-hoc
  persistence rules invite four edge-case implementations. Define 2–3 canonical
  decay profiles (e.g. *combat-bound*, *grace-window (Ns)*, *session-persistent*)
  and tag each spec with one. Same argument as the component-presence axiom: shared
  rules, not per-spec flags.
- **Implementation-cost outliers should have a kill criterion now, not later.**
  Laser (custom firing system), Channeled Beam (not implemented), and Singular
  Extraction (suppress damage but not triggers) are the three expensive ones. The
  doc already flags Laser; suggest writing the fallback designs *now* while the
  design context is warm, so a cut during implementation doesn't reopen the whole
  Reload Heavy frame.
- **Anti-plating overlap check.** Cursed Finale (plating shred), Rupture (plating
  bypass window), Rimeshatter (DR debuff), brittle/shatter (Tundra weapon), and the
  Plague Axe vulnerability swing all answer "enemy defenses" — which is correct for
  the T4 axis, but they should be placed on one matchup grid (which build beats
  which T4 enemy defense) to confirm every class has *some* answer and no class has
  three. Currently Cooldown has two native answers (Rupture + weapon choice) while
  Energy has none class-side (gear only). May be fine — but make it a deliberate
  row in a table, not an accident. (See suggestions doc §1.3 for the grid.)
- **Summoner is now two layers behind.** Deferred at frames, deferred again at T4
  specs. Reasonable, but the longer it waits the more the spec/relic/item layers
  assume "5 classes" in their math (relic frequency/potency mapping already has no
  Summoner row). Suggest a one-page placeholder spec sheet of *constraints* (what a
  Summoner relic would modify, what its frames differentiate) so other systems stop
  hard-coding 5.
- **Name collisions** (Overdrive ×2) are flagged in-doc — fine, just confirming
  they're tracked.

---

## 3. T4 items (`t4-item-designs-v2.md`)

### What's working

- The retirement/inheritance table at the top is exactly the right artifact — you
  can audit "no mechanic goes homeless" at a glance, and it checks out (Cave →
  Graveyard charm + Trench armor/boots/axe; Swamp → Tundra/Volcanic weapons +
  Graveyard armor).
- Capstone twists genuinely read as *signatures*, not stat bumps (cap-rearms-shield,
  evasion-speed-scaling, brittle-shatter, debt-cheat-death). The T1→T4 deepening
  pattern from the bible is visibly executed.
- The "Brainstormed Mechanics Not Yet Assigned" table is good hygiene — parked ideas
  with candidate homes instead of forced placements.

### Iteration candidates

- **Engine-key sprawl is the real cost of this tier.** 22 new keys for one tier vs
  ~6 player-side keys at T3. Several are near-duplicates that could be one key with
  a context: `shield-break-hp-recovery-pct` and `shield-break-heal-pct` are
  explicitly aliases; `absorb-ramp-*` and `sustained-fight-dr-*` and the existing
  `ramp-regen-*` and `stationary-dr-*` are four bespoke implementations of "stat
  ramps over combat time." A generic `ramp(stat, start, max, time, resetCondition)`
  engine primitive would collapse maybe 8 of the 22 keys and make every future
  "long-fight variant" free. Worth deciding *before* the implementation pass, since
  it changes what gets built.
- **Option density is uneven across biomes.** Mountain: 2 weapons + 2 armors +
  2 charms. Tundra: 2/1(+opt)/2. Volcanic: 2/2/1. Graveyard: 1/2/2. Desert:
  1/1/1. Jungle: 1/1/2. Trench: 1/1/1 + 2 boots. Desert players get zero choices
  inside their biome at the capstone tier. If deliberate (Desert is the "simple
  alpha-strike" biome), write that down; if not, Desert and Jungle are the cheapest
  places to add one alt each.
- **Boots are still a documentation hole.** Five biomes say `[Designed]` with no
  recorded design (only Graveyard and Trench have actual entries). The mobility-boots
  pass exists elsewhere (memory: biome boot engine, values untuned, HUD pending) —
  this doc should at least name each biome's boot mechanic so the "locked" claim is
  true for all six slots.
- **Relic sketch needs an interaction audit before numbers.** `buff_multiplier`
  touches *every* spec's buff magnitudes — that's a multiplicative meta-layer over
  ~45 specs. The dangerous cells are the ramp/snowball specs (Rampage, Momentum,
  Critical Mass, Binary Cycle): +40% buff magnitude on a compounding loop is much
  more than +40% output. Suggest the relic balance pass explicitly sims the worst
  ~6 relic×spec pairs rather than trusting the budget index, and consider whether
  `buff_multiplier` should exclude stacking-type buffs at first ship.
- **Plague Axe dead-swing vulnerability** (20% increased damage taken, 4s) is the
  game's first generic *damage-taken amplifier* on a weapon. It's party-multiplied
  by construction (everyone's damage on the target goes up), which makes it the
  strongest party tag in the item set. Check it against the §8 incentive math —
  the solo value vs party value gap is bigger here than for any aura.

---

## 4. T4 monsters (`t4-monster-mechanics-claude-code-prompt.md`)

### What's working

- **Player-mechanic mirroring is the right call.** `cadenceFinisher`,
  `empoweredCooldown`, `enemyShield`, `enemySoftCap` reuse player math, keep
  determinism for free, and — best of all — teach by symmetry: the player's
  damage-cap armor answers the monster's cadence finisher *because it's the same
  mechanic*. Cheap to build, deep to read.
- Spike values are appropriately tiered (×2.0 trash-elite finishers up to ×3.4
  abyssal cooldown slams), and routing everything through the normal damage pipeline
  means all player mitigation applies correctly.

### Iteration candidates / checks

- **`enemyShield` vs the DoT class needs a stated rule.** Shield "rewards burst,
  punishes DoT/chip" — but chip *is* the DoT class's entire identity, and the bible
  guardrail says no enemy defense may make a fight unwinnable for any build. The
  uptimes chosen (sandspitter 50%, magma-salamander ~36%, leviathan ~38%) leave
  windows, which is probably fine — but two things should be written down: (1) do
  DoT ticks damage the shield (they should — wasted ticks is the punishment, immune
  ticks would be a wall), and (2) does an applied DoT *persist* through the shield
  window. Define once, in the doc.
- **`enemySoftCap` currently has no weapon-side answer.** It punishes slow/empowered
  builds; the prescribed counter is "fast consistent damage" — i.e. *swap builds*.
  Sunder (the anti-cap/anti-plating strip variant) is still parked. That's an
  acceptable v1 (the matchup axis is supposed to make off-builds harder, not
  impossible) — but the three soft-cap monsters (cragback-rhino, permafrost-behemoth,
  elder-leviathan) are exactly the targets a Mountain-hammer player will be fighting.
  Mountain's own tier's defining enemy mechanic counters Mountain's weapon. Either
  that's the deliberate lesson ("your biome's weapon isn't your biome's answer") —
  worth one sentence in the doc — or one of the three should move off the
  hammer-matchup path.
- **There is no T4 monster *design* doc, only the implementation prompt.** T1–T3
  have rationale docs (bible, tier3 plan); T4 monster intent (which biome got which
  defense and why, density tuning targets for the two extreme biomes) lives only in
  the prompt's "used by" lists. When you write the T4 boss doc, consider folding a
  short "T4 trash intent" section into it so the tier has a design record, not just
  a task spec.
- **Graveyard/Trench density extremes are the actual risk surface.** The mechanics
  above are well-specified; what's unspecified is the thing the bible calls the
  headline — *extreme* density. Graveyard at very high density multiplies every
  on-hit, per-enemy, and nearby-enemy effect in the game simultaneously
  (nearby-enemy-plating, Bulwark-style effects, on-hit gear, dead-swing
  vulnerability spread). A density target + per-node mob cap for Graveyard should
  be set during design, not discovered during tuning.

---

## 5. Cross-cutting risks

1. **Combinatorial audit debt.** T4 ships: 45 specs × 22 item keys × relics ×
   4 enemy defenses. The equal-budget index (±20%) covers single comparisons, not
   interactions. The compounding loops are where the blowups live: ramp specs ×
   buff-mult relics × long-fight items (Deepfreeze Ward, sustained-DR) all reward
   the same axis (fight length) and stack multiplicatively. Recommend a named "ramp
   stack" sim scenario in the bench before the number pass.
2. **Doc drift is starting.** The spec doc's stale addenda (§2), the missing Fire
   header, the nodeBiomes header comment calling Graveyard a T3-ring debut while the
   nodes are correctly `biomeTier: 4`, BALANCE_REFERENCE's quest table vs the bible.
   None individually serious — but these docs are pasted into sessions as ground
   truth, so drift compounds. A short "doc-of-docs" freshness pass after each major
   design lock would pay for itself.
3. **The "T4 = mundane midpoint" flavor rule is under pressure.** Bible §2 says keep
   T4 flavor mundane (midpoint, not endgame). The T4 content includes: abyssal
   leviathans, cheat-death armor, a weapon named Glacial Tyrant Maul, and 6×
   discharges. The *mechanics* budget is fine; the *naming/flavor* budget reads
   endgame. If T5–T8 need headroom above "Deathless Duneplate" and "Abyssal
   Terror," the adjective inflation starts now. Cheap fix during the planned naming
   pass: hold the superlatives (Deathless, Tyrant, Eternal) in reserve for T6+.
4. **Bosses are the next doc (you've said so) — the T4 boss layer depends on the
   enemy-defense axis landing first.** Sequencing note: lock the trash defense
   tuning (shield uptimes, soft-cap thresholds) *before* designing the T4
   defense-break boss windows, since the windows are defined relative to those
   numbers. Pointers for that doc are in the suggestions doc §1.5.

---

## 6. Quick-reference fix list

| # | Item | Where | Effort |
|---|---|---|---|
| 1 | Add missing "Balanced — Fire" header | t4-spec-designs-reference.md | trivial |
| 2 | Refresh 4 stale addenda (Cadence H, Cooldown B, DoT L, Reload L) | same | trivial |
| 3 | Remove Iron Patience from impl table + pending numbers | same | trivial |
| 4 | Rename smoothing-executes; reserve "execute" for Trench | spec doc + bible | small |
| 5 | Define 2–3 canonical OOC decay profiles, tag specs | spec doc | small |
| 6 | Write Laser/Channeled-Beam fallback designs now | spec doc | small |
| 7 | Decide generic `ramp()` engine primitive vs 8 bespoke keys | item doc / engine | medium, before impl |
| 8 | Record boot designs for the 5 `[Designed]` placeholders | item doc | small |
| 9 | State enemyShield-vs-DoT tick rules | monster prompt | trivial |
| 10 | Set Graveyard density target + mob cap at design time | monster/boss doc | small |
| 11 | Relic × ramp-spec worst-case sim list | relic pass | medium |
| 12 | Fix nodeBiomes header comment (graveyard ring vs tier) | nodeBiomes.ts | trivial |
