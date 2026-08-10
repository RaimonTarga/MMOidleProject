> **PARTLY SUPERSEDED (2026-08-11).** Its phases and ordering (§2–3) are replaced
> by `docs/polish-and-balance-roadmap.md`. **Still live and worth reading:** the
> tooling audit (§5), the defect list (§5.7), and the auto-combat wedge write-up
> (§5.8). Do not plan from its phase table.

# Next Playtest — Implementation Plan

**Companion to** `docs/archive/next-playtest-roadmap.md` (the *what*, now archived). This doc is the
*how* and the *in what order*: which items are blocked on design, which are pure
code, which run in parallel, and what the offline design sessions must produce.

Grounded in a code read on 2026-08-02. Where this doc and the code disagree, the
code wins. Progress last synchronized on 2026-08-04.

---

## 0. What the sketch assumes vs. what the code actually says

The sketch was written without a code read. Five findings change the plan.

| Roadmap item | Reality in the repo | Effect on the plan |
|---|---|---|
| "Change tier advancement to seals" | **SHIPPED.** T1–T4 advancement derives seals from distinct same-tier boss first-clears (2026-08-02), with source/progress presentation on desktop and mobile (2026-08-04). | Only T5/T6 rows remain, to land alongside those tiers' bosses. |
| "Implement the relic system / add the relic slot" | **SHIPPED 2026-08-04.** `relic` is the sixth equipment slot; one shared resolver maps four universal ratings across all six root mechanics. Eight T4 mastery recipes, persistence compatibility, server equip authority, Forge/tooltip previews, origin-scoped buff/debuff scaling, and bespoke icons are live. | Final balance and T5/T6 evolutions remain; see `docs/relics-current-state.md`. |
| "Author T5 and T6 biome content" | Regions are now data: `shared/src/world/map/regionT{1..4}.ts`, ~45 lines each (mask grid + biome list + dungeon cells + sanctuary). Adding `regionT5.ts` is trivial. But **every biome×tier needs a monster pool or the world throws at boot** (`nodeModifiers.ts:530`). | Structure is cheap; *content* is the whole cost. Roster choice is the biggest scope lever in the program. |
| "T1–T4 must be stable" | Monster/boss coverage for T1–T4 is complete and boot-validated (the `⚠ T4 trash not authored` comments on forest/plains are stale — those biomes retire before T3). The twelve-core cast is now complete, but **abilities stop at T2**: 8 abilities exist (5×T1, 3×T2) while `abilitySlotCount` grants a T4 player **4 slots**. Stances = 3. Rites = 4. | The real T1–T4 blocker isn't monsters — it's **empty ability slots and thin stance/rite choices at T3/T4**. This outranks T5/T6 content. |
| "Decide whether Summoner is included" | **OVERHAUL IMPLEMENTED BEHIND THE PRODUCTION FLAG 2026-08-04.** Conduit now uses normalized persistent formations, HP-costed FIFO reconstruction, Light/Balanced/Heavy frames, Close/Mid/Far policies, and all nine frame-locked specializations. Existing persisted node IDs map forward. | Multiplayer entity/network profiling, placeholder balance, and production feature-gate approval remain; see `docs/archive/summoner-overhaul-plan.md`. |

**Bottom line:** the roadmap's ordering is roughly inverted. Sections 1–2
(progression spine + build content) are the critical path; section 4 (T5/T6) is
the largest cost but depends on 1–2 landing first; section 3 (T1–T4 stability) is
smaller than it reads once you know it's really "fill the T3/T4 build slots."

---

## 1. The decisions that gate everything

D2 (Relics) is complete. D3 (T5/T6) and D4 (Summoner) remain the external design
sessions that gate their respective implementation and art; D1 (Seals) did not
need one and its mechanism is implemented. All three export briefs already exist,
so the remaining external sessions can start without another preparation pass.

Each brief follows the same shape: **grounding facts → the questions → the
return format**. The return format matters most: specify the exact table/schema
you want back so the answer is directly implementable rather than prose you have
to re-interpret.

### D1 — Seals — **IMPLEMENTED**

The mechanism shipped 2026-08-02 and presentation shipped 2026-08-04. Seals are
derived from `bossesCleared`; there is no parallel seal wallet, migration, or
second source of truth. See `docs/seals-current-state.md`.

At seal-gated tiers the Progression panel now replaces the obsolete kill-quest
display with the actual seal requirement, countable progress pips, and every
biome boss that can supply a seal. Each source is visibly obtained or available.
The full Mastery meter remains anchored below both collapsed and expanded views,
while a separate ledger shows every configured tier. Provisional small seal
glyphs and map-locate actions were removed pending a deliberate seal symbol and
a better navigation affordance.

### D2 — Relics

**IMPLEMENTED (2026-08-04):** `docs/relics-current-state.md` is the live system
record; `design_docs/relics-design.md` remains the design authority and the completed
plan is archived at `docs/archive/relics-implementation-plan.md`.

*Narrower than it first looked — the design axis is settled.*

Relics operate at the **mechanic** level: they reinforce your class mechanic,
where cores amplify stats to reinforce your role. The two systems don't compete.

**Grounding to include:** the six archetype mechanics and their hook points
(`server/src/systems/classes/archetypes/{cadence,cooldown,dot,energy,reload,summoner}/`);
the combat pipeline stages (`beforeAttack → onAttack → onHit → onDamageTaken →
afterHit → onKill`) and `CombatContext`'s mutable fields; the archetype slices
(`syncArchetypeSlices`) that hold per-mechanic runtime state; `TracksCombat` as
server-only scratch; the evolution machinery
(`shared/src/systems/evolution.ts`); `docs/cores-current-state.md` (so relics
stay off the stat-multiplier axis); and `EQUIPMENT_SLOTS`.

**Questions to answer:**
1. **Where does relic state live?** Sixth `EQUIPMENT_SLOTS` entry (equip /
   persist / network come free, proven by cores) *or* `TracksProgression` with a
   growing slot count (proven by abilities/stances/rites)? Equipment gets slot
   plumbing free; `TracksProgression` gets slot-count scaling free.
2. **Per-archetype or universal?** A relic that modulates *the cadence counter*
   is meaningless to a DoT build. Does each archetype get its own relic family
   (6 families), or do relics modulate shared mechanics (empowered attacks,
   guard windows, crit) so any class can use any relic?
3. For each relic: **the concrete hook it reads or writes.** This is the
   deliverable that makes the brief implementable — "boosts your mechanic" isn't
   buildable; "reduces the cadence counter requirement by 1 and cuts the
   finisher multiplier by 25%" is.
4. Acquisition: one relic recipe line per T4 dungeon boss, matched to biome
   character? What pays for the craft?
5. Do relics ride the `+N` upgrade track, the evolution/lineage track, both, or
   neither? (Cores chose evolution-only with `requiredPlus 0`.)
6. How many relics equipped at once, and does that grow with tier?

**Return format:** a table of `relic id | archetype (or shared) | mechanic hook
it modifies | the cost side of the trade | source boss | rank chain (y/n)`, plus
explicit answers to Q1/Q2/Q5/Q6.

### D3 — T5 and T6

*Largest cost driver. The roster answer is worth more than the mechanics answer.*

**Grounding to include:** `design_docs/t5-t8-endgame-suggestions.md` (proposes
T5 = AoE/pack axis, T6 = layered defenses + twin bosses); the actual biome roster
roll (below); `shared/src/world/map/regionT4.ts` as the authoring format;
`BIOME_DATABASE` (`monsterPoolByTier` / `bossPoolByTier`); the boot-validation
rule that a biome present in a region at tier T **must** have a T-pool; the
`docs/biome-ecology-current-state.md` primitives (packs / patrols / swarm /
elites / openingStrike / marks / shields / antiheal) that already exist and can
be recombined; and the PixelLab cost reality (new biome = tileset + prop kit +
monster set; reused biome = monsters only).

Current roster roll, for the brief:

| Tier | Biomes | In | Out |
|---|---|---|---|
| T1 | mountain, cave, forest, plains, swamp | — | — |
| T2 | + jungle, desert (7) | jungle, desert | — |
| T3 | tundra, mountain, cave, jungle, desert, volcanic, swamp | tundra, volcanic | forest, plains |
| T4 | mountain, tundra, jungle, desert, volcanic, graveyard, trench | graveyard, trench | cave, swamp |

**Questions to answer:**
1. The T5 lesson and the T6 lesson, in one sentence each. Does T5 = packs/AoE
   hold, given the ecology system already shipped packs at T1?
2. **The roster for T5 and T6: how many biomes, which carry forward, which
   retire, and what the new ones are.** New biomes are wanted at both tiers
   (user, 2026-08-02) — the art pipeline's measured throughput makes them
   affordable, so the question is *which*, not *whether*. Keep the bible's
   ~2-in / ~2-out roll unless there's a reason to break it.
3. If the AoE budget rule is adopted: the break-even density number and where it
   lives (a shared formula, an item stat, or both).
4. Wall-clock target per tier (T2 is ~15–20 min today; what is T6?).
5. What each build system gains at T5/T6 — more ability slots? a second relic?
   rite slot 3? — and what deliberately gains **nothing** so complexity still
   peaks at T4.
6. The T7/T8 hook: what T5/T6 must *not* spend so the ceiling stays open.

**Return format:** two one-page tier briefs (identity, roster, monster shape
list, boss concept, what's new in the build systems), plus the answer to Q2 as a
bare list of biome ids per region.

### D4 — Summoner

*A fork in the schedule, not a detail.*

**Status 2026-08-04:** the locked design has returned in
`design_docs/summoner-overhaul-design-source.md`. The repository audit,
compatibility decisions, staged implementation, test matrix, UI-preservation
approach, and performance gates are in `docs/archive/summoner-overhaul-plan.md`.
Conduit remains feature-gated until that plan's core, vertical-slice, and
performance gates pass.

**Grounding to include:** `server/src/systems/classes/archetypes/summoner/` file
list, `shared/src/data/skillTree/t3Summoner.ts` (the 9 authored specs and their
current names), the `SummonsMinions` component + minion systems, the
`player:commandSummons` intent, the Conduit body description in
`docs/player-sprites-current-state.md`, and the note that minions still alias the
Tiny Wisp placeholder.

**Questions to answer:**
1. What is the summoner's *fantasy* and its one mechanical question the other
   five archetypes don't ask?
2. Path identities — today's three paths are keyed by biome (plains / mountain /
   cave), unlike DoT's element keying. Is that the intent?
3. The nine T3 specs: keep, rename, or replace? (This is the sprite brief.)
4. Minion families: how many distinct creature designs, and do they differ by
   path or by tier? (This is the art cost.)
5. **In or out for this playtest?**

**Return format:** the nine-spec table (`spec id | name | path | what the minions
do | visual read`) plus the minion family list — that table *is* the sprite
generation brief.

**The fork, with costs:**
- **Summoner IN** — adds a class rework, 9 T3 bodies, and N minion families to
  the critical path. Sprites can't start until Q3/Q4 come back.
- **Summoner OUT** — disable the root in the skill tree, ship five classes.
  Removes the last sprite dependency entirely; the class returns post-playtest
  with a proper design. Cheap and fully reversible.

**Recommendation:** write D4 last but *decide* it early, and set a hard gate — if
the rework design isn't back by the time Track D (T5/T6) starts, ship with
summoner disabled. Five well-realized classes beat six where one is placeholder,
and a placeholder class distorts exactly the build feedback the playtest is for.

---

## 2. Tracks

Seven tracks. A, B, C, D are sequential-ish (the critical path); E, F, G run
alongside from day one.

| Track | Content | Blocked by | Runs |
|---|---|---|---|
| **A — Progression spine** | Seal mechanism/presentation and relic machinery/T4 catalogue **done**; T5/T6 extension remains | D3 for T5/T6 | Phase 3 |
| **B — Build content** | Abilities T3/T4 rosters; stances; rites; core catalogue **done** | nothing | Phase 1–2 |
| **C — T1–T4 stability** | Progression walk-through, placeholder purge, boss/dungeon pass | nothing | Phase 0 audit, fixes throughout |
| **D — T5/T6** | Regions, biome rosters, monsters, bosses, dungeons, recipes, equipment | D3, and A+B landing first | Phase 3 |
| **E — Art** | Summoner bodies, T5/T6 biomes + monsters, ability icons, tier aura; core/relic icons **done** | D3, D4 per-item | continuous |
| **F — Deploy & ops** | New deployment, test accounts, reset tools, admin lockdown | the whole roadmap | Phase 6 only |
| **G — Balance & tooling** | eHP report, farming loop, bench updates; then your numbers pass | the systems it measures | tooling continuous, pass last |

**Track F does not run early.** The Railway deployment is live and working today
on the **release** branch, and it stays there on purpose — it is not updated until
this roadmap is cleared. When it is, a new deployment goes up and a new wave of
real-player playtesting starts against it. So Track F is a Phase 6 track, not a
parallel one, and the current deployment is a *stable reference*, not a risk to
manage.

**Track E is the real long-lead track.** Art gates nothing structurally but sits
on the critical path inside Phase 3, so briefs must be issued as early as each
design lock allows.

---

## 3. The sequence, step by step

Each step is a work unit sized to roughly one session unless marked otherwise.
`needs:` is a hard dependency; `unblocks:` is what waits on it.

---

### Phase 0 — Unblock the pipeline

*Nothing here needs a design decision. All four run while the briefs are out.*

**0.1 — Write and export the three briefs.** ✅ **DONE 2026-08-02.**
`docs/briefs/d3-t5-t6.md`, `docs/archive/briefs/d2-relics.md`,
`docs/archive/briefs/d4-summoner.md`. Each is self-contained (game overview → grounding →
constraints → questions → return format) and assumes no prior knowledge, so they
can go to a cold external model as-is. Run D3 first — D2 needs to know which
tiers relics must reach.
`unblocks:` 1.5, Phase 2's relic work, all of Phase 3, all summoner art.

**0.2 — Fix the bench blind spots.** ✅ **DONE 2026-08-02.**
`core` added to `GearSlot`/`GEAR_SLOTS`; new `coreScore` (cores carry `stats: {}`
— all power is in `mechanicEffects`, so `gearScore` scored every core at 0) and
`bestCoreForBuild`, which filters to cores *active* for the build's range and
prefers directional over universal. `canonicalLoadout(playerTier)` now fills
abilities (deepest-tier-first into `abilitySlotCount` slots, current ordered-list
shape), stances, and rites; `canonicalBiomeLevels` caps every reachable biome so
Global Mastery is realistic. Runes deliberately left unequipped — see the code
comment. Verified: `pnpm test` 40/40, full typecheck, and live bench runs at T2,
T4, and `--all-paths`.

> **Three pre-existing defects surfaced while doing this.** See §5.7.

**0.3 — Fix the report staleness.** ⚠️ **PARTIALLY DONE 2026-08-02.**
`WEAPON_UPGRADE_LEVEL` / `ITEM_UPGRADE_LEVEL` now read `MAX_UPGRADE` instead of a
literal `3`. **Not runtime-verified** — neither report executes (§5.7). The
canonical core/stance/rite context layer is still outstanding.

**0.4 — The farming loop.** ✅ **DONE 2026-08-02.**
`--mode farm` on the balance bench: `createFarmWorld` leaves repopulation on, the
loop has no clear-break, and `ledger.ts` diffs `tracksProgression` before/after
into kills/hr, essence/hr (per colour), catalysts/hr (per pace family), and
biome XP/hr. Targets are one representative open-world node per (biome × tier),
preferring the biome's native pace family; builds are one representative per
class root (`--all-builds` for the full matrix). Full sweep = 162 runs.

Two shaping decisions, both deliberate:
- **Death does not end the run.** The bot is revived in place through the live
  `respawnPlayer` and put back in the node; deaths are counted and reported as
  `deaths/hr`, so rates stay comparable across builds while a build that cannot
  hold the node still shows up.
- **The farmed biome starts at level 0.** `materializeBot` caps every reachable
  biome, and `applyBiomeXP` early-returns at the cap — a canonical bot would
  report exactly 0 XP/hour by construction. Starting at 0 also measures
  `hoursToBiomeCap`, which is the recipe-unlock pacing number.

⚠️ **The time-scale warning was justified: rates are NOT stable.** See §5.5b —
the fidelity ceiling is `timeScale ≤ 2`, and the *fight* bench's default of 5 is
distorted too.

⚠️ **And the tool immediately earned its keep: auto-combat can wedge forever.**
See §5.8. Mountain nodes at every tier report 5–300 kills/hr against 900–1500
elsewhere, because the bot stops moving and never restarts. Live gameplay defect,
tagged blocker, handed to 0.5.

**First numbers (partial sweep, 65 of 162 cells, `timeScale 2`, 1 sim hour each,
mean across the six class builds).** Treat as provisional — mountain is wedged
(§5.8) and the sweep could not finish because of it.

| biome · tier | kills/hr | essence/hr | catalysts/hr |
| ------------ | -------: | ---------: | -----------: |
| clearing T0  |      848 |        848 |          0.0 |
| plains T1    |     1220 |       3050 |         30.5 |
| forest T1    |      975 |       2683 |         26.8 |
| swamp T1     |      620 |       3250 |         32.5 |
| cave T1      |      429 |       4911 |         49.1 |
| mountain T1  |  **272** |       1822 |         18.2 |
| forest T2    |     1243 |       7448 |         82.8 |
| jungle T2    |     1110 |       6598 |         76.6 |
| desert T2    |      872 |       5811 |         66.8 |
| cave T2      |      490 |       7789 |         90.9 |
| mountain T2  |   **59** |        655 |          7.7 |

**Catalysts are not an independent wallet today.** `catalystWeight` defaults to
the monster's *base* essence reward and `CATALYST_PROGRESS_PER_UNIT` is 100, so
catalysts/hr is essence/hr ÷ 100 divided by the tier's essence multiplier —
exactly ×100 at T1 (mult 1.0) and ×86–90 at T2 (mult 0.85). Pricing anything in
catalysts is therefore pricing it in essence with a rename, unless monsters start
carrying explicit `catalystWeight` values that diverge from their essence. Worth
settling in Phase 3 before costs are authored. The clearing mints none at all by
design (modifier-excluded).

`done when:` ✅ rates print per node × build × tier; ✅ stability measured across
six time scales at two tiers — and it failed, which is why farm mode now has a
measured fidelity ceiling instead of an assumption.
`unblocks:` authoring T5/T6 costs against measured income instead of guesses —
which is the main lever on how big Phase 5 ends up being.

**0.5 — T1–T4 progression walk-through.** *(1–2 sessions)*
Walk a character T0→T4 and record every blocker, empty slot, dead recipe, and
unreachable unlock.
`done when:` a written defect list, each item tagged blocker / content / polish.
`unblocks:` 1.6 (you'll be fixing from this list, not from guesses).

> **The auto-combat wedge that used to head this list is FIXED (2026-08-10; see
> §5.8).** The 0.4 sweep's mountain numbers are still meaningless, but for a
> different reason than believed: mountain kills a T1 ranged build ~30 times per
> simulated hour, so those rows measure **death**, not pathing. Re-collect them.

> **Railway is not a Phase 0 item.** The deployment works today, running the
> **release** branch, and stays there deliberately. It is not updated until this
> roadmap is cleared — at which point a *new* deployment goes up and a new wave of
> real-player playtesting begins. See Phase 6.

**Phase 0 exit:** three answers returned, a trustworthy bench, real economy
rates, and a written defect list.

---

### Phase 1 — Progression spine + the T3/T4 build gap

**1.1 — Seals: mechanism.** ✅ **DONE 2026-08-02.**

Decisions (user): a seal **is** a boss first-clear, derived — not stored;
requirement **scales with tier**; sources are **any distinct biome boss at your
current tier**; **seals only**, no mastery or level gate alongside.

Because `bossesCleared` already persists one `biomeGroup:tier` key per first
clear, this needed **no new state, no migration, and no new networked field** —
`bossesCleared` is already on `PlayerView`, so the client can derive progress with
the same shared helper the server uses.

- `shared/src/systems/tierAdvancement.ts` — `SEALS_REQUIRED_BY_TIER`
  (**placeholder numbers, yours to tune**), `sealsHeldAtTier`,
  `tierAdvancementProgress` (returns `held`/`required`/`canAdvance`/
  **`remainingSources`** — the "where do I get the next one" answer 1.2 needs),
  and `validateTierAdvancement`.
- Quests **keep** their counters but lose advancement authority above tier 0.
  Deleting them would have silently broken two things: `targetPriority.ts:611`
  gives quest-target monsters auto-combat priority, and `hud/uiUnlocks.ts` gates
  HUD unlocks on quest progress. Tier 0 still advances by quest — there are no
  bosses at tier 0 to mint a seal from.
- `checkSealTierAdvance` runs in `rewards.ts` **after** the first-clear is
  recorded, so the boss that completes the requirement advances on that same kill.
- Boot invariant wired next to `validateNodeModifiers`.

**The invariant immediately earned its place:** it rejected a tier-5 row
requiring 5 seals when tier 5 has 0 bosses authored. Tiers above the table are now
a ceiling (require 0 → cannot advance) rather than an impossible gate; add the row
in the same commit that adds the tier's bosses.

**Numbers set by the user 2026-08-02: T1→2, T2→3, T3→4, T4→5**, against 5/7/7/7
available sources. The requirement **plateaus at 5** (`SEAL_REQUIREMENT_CAP`) —
T5+ should ask for 5, not keep climbing. The cap is enforced as a boot-time
report, not a hard failure, so raising it is a one-line decision.

This makes T1 stricter than the old quest (which took one boss), so tier-up now
requires visiting at least two biomes from the very first tier. Every gated tier
keeps at least two spare sources, so the route is always a choice rather than a
completion checklist — the test asserts `available > required` for exactly that
reason.

Verified: 41/41 tests, typecheck clean, new `server/test/tierSeals.test.ts`.

**1.2 — Seals: presentation.** ✅ **DONE 2026-08-04.** The Progression panel
shows the real derived seal total instead of the non-authoritative legacy quest,
lists every biome source with obtained/available state, and keeps the mastery bar
visible below its collapsed summary. That summary expands into current-tier detail,
while the separate Boss Seal Ledger records every configured tier and its
optional trophies. Small placeholder seal pips and the ineffective map-locate
actions were removed pending dedicated designs. Both maximum-source layouts are
covered by static UI harnesses.

**1.3 — Abilities Wave 2 (T3 roster).** *(2 sessions)*
Six abilities per the shipped plan §5: Whirlwind (Volcanic), Stun Strike (Cave),
Ward (Tundra), Frost Bite (Tundra), Parry (Mountain), Detonate (Swamp). Two
primitives are genuinely new — lift `applyMonsterSlow` + chill out of
`archetypes/dot/t3/ticks/chillFreeze.ts` into a shared monster-control primitive,
and Parry's negate-next-hit + attack-timer reset. Then turn on the second
Technique slot and confirm arbitration holds with a real specialist pairing.
`done when:` `abilitySlotCount` gives 2/1 at T3 and both slots have distinct,
tier-appropriate options.

**1.4 — Abilities Wave 3 (T4 roster).** *(2 sessions)*
Fervor (Volcanic), Disengage (Desert), Contagion (Wasteland), Abyssal Ward
(Trench), Weakening Strike (biome TBD), plus one more casted Technique. Needs
open items **O4** (T4 third-cast identity) and **Weakening Strike's biome**
closed first — they're small calls, not a brief.
`done when:` 2/2 slots at T4, all four fillable with T3/T4-tier content.

**1.5 — Relic machinery.** ✅ **DONE 2026-08-04.** Sixth equipment slot,
old-save normalization, server-authoritative T4 equip gate, universal resolver,
all six root integrations, and resolved UI previews shipped. See
`docs/relics-current-state.md`.

**1.6 — Track C blocker fixes.** *(1–3 sessions, sized by 0.6)*
Only the items tagged *blocker*. Content and polish items wait for Phase 4.

**Phase 1 exit:** a character walks T0→T4 with every build slot fillable, and
advancement runs on seals.

---

### Phase 2 — Authored build content

*Same shape four times: a finished system with 3–4 worked examples that needs a
real catalogue. Order matters — each later system is authored knowing what the
earlier ones already cover, or you get four systems that all say "more damage,
less defense."*

**2.1 — Cores catalogue.** ✅ **DONE 2026-08-04.** Twelve authored cores across
the T2/T3 biome bands, with melee/ranged/unrestricted eligibility, dedicated
mechanic hooks, presentation, tests, and bespoke icons. See
`docs/cores-current-state.md`.

**2.2 — Stances.** *(1–2 sessions)*
Today: 3 generic (Offensive / Defensive / Tanking). These are the most
placeholder-feeling content in the game. Needs identities that mean something
next to cores — cores amplify your role continuously, stances trade posture
reactively.
`done when:` the default/reactive pair presents a real decision, not a slider.

**2.3 — Rites.** *(1–2 sessions)*
Today: 4. Always-on out-of-combat passives, T3 gate, 2 fixed slots.
`done when:` enough rites that the 2 slots are a choice.

**2.4 — Relic catalogue.** ✅ **DONE 2026-08-04.** Eight universal base Relics
ship as mastery rewards across Forest, Mountain, Plains, Jungle, Tundra, Swamp,
Desert, and Wasteland. Cave, Volcanic, and Trench remain intentionally open for
future distinct lines, per the approved design.

**2.5 — Coherence review.** *(1–2 sessions)*
The roadmap's "review abilities, runes, charms, and gear so they fit the finalized
build direction" and "class and item identities that no longer fit the ability
system." Now possible because the build systems are finally all present at once.
`done when:` a written list of identity conflicts, each resolved or explicitly
deferred.

**Phase 2 exit:** no placeholder-feeling build content in T1–T4; relics playable
at T4.

---

### Phase 3 — T5, then T6

*The largest phase. Do T5 completely before starting T6 — the first tier teaches
you the per-tier cost, and interleaving means discovering a structural problem
twice.* `needs:` D3.

Per tier, in order:

**3.1 — Region scaffold.** `regionT5.ts` (mask, biome list, dungeon cells,
sanctuary) + `WORLD_REGIONS` entry + `regions.ts` respawn node.
`done when:` `validation.test.ts` passes and the region is walkable.

**3.2 — Biome roster.** Wire `monsterPoolByTier` / `bossPoolByTier` for every
biome present at the new tier. Boot validation names anything missing.
`done when:` the server boots and every node in the region spawns something.

**3.3 — Monsters.** *(1 session per biome)* Author per biome, recombining the
existing ecology primitives (packs, patrols, swarm, elites, openingStrike, marks,
shields, antiheal) rather than inventing new ones.
`done when:` each biome's pool expresses that biome's identity at the new tier.
⚠️ **Issue the art brief the moment the monster *list* exists — not after the defs
are written.** Art has the longest lead time in the program.

**3.4 — Bosses and dungeons.** *(1 session per 2 biomes)* Gauntlet defs,
pre-encounters, uncleared-threat hooks, boss scripts.
`done when:` each dungeon is a readable exam with a threat, a counterplay, and a
reward.

**3.5 — Seals.** The tier's rows in `TIER_ADVANCEMENT`, minted by the new bosses.

**3.6 — Recipes, equipment, relic tiers.** *(2–3 sessions)* Costs authored
against the **measured** income from 0.4.

**Phase 3 exit:** T5 and T6 are walkable and rewarding, if untuned.

---

### Phase 4 — Stability sweep and placeholder purge

**4.1** — The rest of the 0.6 defect list (content + polish tiers).
**4.2** — Boss encounter readability pass across T1–T4: does each have a legible
identity, threat, counterplay, and reward?
**4.3** — Placeholder purge: anything that would distort playtest feedback.

Best done here because it's the first point where T1→T6 is visible as one arc.

---

### Phase 5 — Balance

Yours, per the established split — I build tooling, you tune numbers. Scope it to
the roadmap's own instruction: *only enough tuning to prevent impossible,
trivial, or clearly broken progression.* The real pass happens after playtest
feedback, and 0.4 should have removed most of the guesswork from the economy half.

---

### Phase 6 — Deployment and playtest preparation

*The only phase where the live deployment is touched. Everything before this runs
locally; the release-branch deployment stays untouched as a stable reference.*

**Player account prerequisite — DONE 2026-08-04.** Discord OAuth and the
character create/select/switch/delete flow are implemented locally. Phase 6 must
still configure and verify the OAuth credentials and callback on the new
deployment. Admin authentication remains separate and open.

**6.1** — Cut the new deployment: new build to Railway, production game DB, log
DB, and Redis verified, persistence across reconnect and restart confirmed.
**6.2** — Multiplayer smoke: sessions, parties, travel, combat, rewards, deaths,
disconnects, retries — with two real clients.
**6.3** — Test accounts, reset tools, fast-travel-to-content support.
**6.4** — The intended tester progression path, T1→T6.
**6.5** — Known-limitations list and the specific questions the playtest should
answer.
**6.6** — Bug-reporting channel and a triage scheme (blocker / balance / content /
visual / future).
**6.7** — Admin lockdown; confirm logs and telemetry can diagnose a live problem.

---

### Rough size

| Phase | Sessions |
|---|---|
| 0 — Unblock | 4–6 |
| 1 — Spine + build gap | 8–11 |
| 2 — Authored content | 8–12 |
| 3 — T5/T6 | 18–28 *(new biomes included; the lever is biomes-per-region, not new-vs-reused)* |
| 4 — Stability sweep | 4–6 |
| 5 — Balance | yours |
| 6 — Deploy + playtest prep | 4–6 |

The original full-roadmap estimate was ≈45–70 sessions. It has not been rebased
after the completed seal mechanism, cores, relics, tooling, and account flow;
Phase 3 still carries roughly half the risk and most of the compressibility. Art
(Track E) runs alongside throughout and is the long-lead item inside Phase 3.

**Optional multiplayer boss** slots between Phases 3 and 6 if there's room. It is
the correct thing to cut first — parties, shared nodes, and same-node reward
sharing already exist and will generate multiplayer feedback without it.

---

## 4. Scope levers

The roadmap as written is a large program. If it needs to compress, these are the
levers in order of value-preserved-per-hour-saved:

1. **Five biomes per T5/T6 region instead of seven.** Regions are mask grids; a
   smaller mask is a smaller region, and the sanctuary/dungeon-cell pattern is
   unchanged. This is the roster lever now that new biomes are in scope — fewer
   biomes per tier, not fewer new ones.
2. **Author build content to depth, not completeness.** A core family for four
   biomes that players will actually reach beats eleven thin ones.
3. **Cut the optional multiplayer boss.** Already marked optional; parties work.
4. **Summoner out.** Removes a class rework, 9 bodies, and N minion families.

*Not a lever:* dropping new T5/T6 biomes. New biomes are wanted at both tiers and
the art pipeline's measured throughput makes them affordable.

The one thing I would *not* cut: **abilities at T3/T4**. Empty build slots at the
tiers the playtest spends most of its time in will dominate the feedback and
drown out everything else you're trying to learn.

---

## 5. Tooling readiness for the balance pass

*Audited 2026-08-02. The balance pass is the last step, but the tooling that
feeds it must be fixed **first** — a pass tuned on a tool with blind spots bakes
those blind spots into the numbers.*

### 5.1 The framing that matters: the Rust tool is not the simulator

`tools/balance-tui` (2.4k lines of Rust) is a **viewer and orchestrator**: it
spawns `pnpm bench:balance -- --format jsonl` workers, shards them across cores,
merges the JSONL streams, computes the difficulty score, and renders the
table/rollup/histogram/detail panes. The actual simulation — build enumeration,
bot materialization, the fight — is TypeScript in `server/bench/balance/`
(≈1.5k lines) running the **real** `World` and combat systems.

**Consequence:** almost everything the new systems need is TS work on the
harness, not Rust work on the TUI. The Rust side only changes where a new axis
needs a new *column, filter, or detail pane*. That's the cheap half.

### 5.2 The blocking defect: bench bots don't have the new systems

`server/bench/balance/botFactory.ts` materializes every bot with:

| Field | Value today | Should be |
|---|---|---|
| `GearSlot` union (`types.ts:15`) | `weapon \| armor \| recovery \| mobility` | **`core` is missing entirely** |
| `knownAbilities` / `equippedAbilities` | `[]` / `{ technique: null, guard: null }` | abilities equipped; also the **legacy scalar shape**, pre-Wave-1 ordered lists |
| `knownStances` / `activeStance` | `[]` / `null` | a stance active |
| `knownRites` / `equippedRites` | `[]` / `[]` | rites equipped |
| `runesEquipped` | `[]` (starters owned, none equipped) | a representative loadout |
| `biomeLevel` | target biome only | enough biomes that `globalMastery` is realistic |

So the bench currently measures **skill tree + four gear slots, and nothing
else**. That was accurate when it was written; it isn't now. Cores alone are
+8–30% attack / HP / plating and a separate multiplicative DR layer, so every
build in every run is systematically under-powered by a large, *uneven* margin
(range-gated cores only apply when `selectedRange` matches — so the distortion
differs per build, which is worse than a flat offset).

**This is the single highest-leverage fix in the tooling track.** Nothing else
here matters until it lands.

Cost: mostly mechanical. Add `'core'` to `GearSlot` + `GEAR_SLOTS` +
`SLOT_PRIMARY_STAT` in `progression.ts`; extend `resolveGearLoadout` to pick a
core (it must respect `rangeTag` vs. the build's range node); populate the four
loadout fields in `buildBotSlices` and fix the ability shape. Rust changes:
`gear` already renders as a list, so a fifth slot needs no Rust — but abilities,
stances, rites, and runes need a place in the detail pane's build view.

### 5.3 The combinatorics problem is now the real constraint

The matrix is already at ~1.9M parties for T4 overlord runs. Multiplying it by
cores (families × 5 range tags) × abilities (2 technique + 2 guard from a growing
pool) × stances (2 slots) × rites (2 slots) × relics is not enumerable — not with
sharding, not with days of compute.

**Do not extend the cross product. Switch to layered sweeps.** Fix a canonical
loadout for every axis except one, sweep that axis, record the delta, move on.
That answers the question a balance pass actually asks ("is this core / ability /
relic in line with its siblings?") at a cost linear in content rather than
exponential. The existing overlord `--sample` machinery already proves the
pattern: stratified sampling with an "optimized builds first" heuristic
(`rangeFitScore`) rather than exhaustion.

Concretely: a `--sweep <axis>` mode with a canonical-baseline resolver, plus a
"delta vs baseline" column in the TUI. That's the one piece of genuinely new
design in the tooling track, and it's worth doing before the content lands, not
after.

### 5.4 `dps-report` / `ehp-report`: same gap, plus a live staleness bug

Both are closed-form calculators over the skill tree and gear (`dps-report.ts`
2.4k lines, `ehp-report.ts` 1.7k). Neither reads `CORE_KEYS`, `GUARD_KEYS`,
stances, rites, or abilities — `ehp-report` iterates literally
`slot: 'armor' | 'recovery'`.

**Concrete bug worth fixing regardless:** `dps-report.ts:50` hardcodes
`WEAPON_UPGRADE_LEVEL = 3` and `ehp-report.ts:55` hardcodes
`ITEM_UPGRADE_LEVEL = 3`, but `MAX_UPGRADE` became **5** in the gear-evolution
step. Both reports currently under-report fully-upgraded gear by two levels, and
neither knows evolution lineages exist. That's a five-minute fix and it silently
distorts every number they print today.

These two are the right tools for *item-vs-item* comparison and should stay
closed-form; they don't need cores/stances/rites as *sweeps*, but they do need
them as a **fixed context layer** (apply a canonical core + stance + rite when
computing, so item deltas are measured on top of realistic totals rather than a
naked build).

### 5.5 The missing tool: the farming loop (and why it's nearly free)

Both existing tools measure **a fight**. Nothing measures **a run**. There is no
model of essence and catalyst income against recipe, upgrade, evolution, and
learn costs; no time-to-+5; no Global Mastery growth curve; no seal pacing.

**But the bench is two flags away from producing the rates.** It is deliberately
an arena, not a farm:

- `worldFactory.ts:6` — `world.suppressRepopulation = true` (monsters never
  respawn)
- `runMatch.ts:81` — `if (isNodeCleared(...)) break` (the loop ends the moment
  the node empties)

Flip both, run an ordinary open-world node for simulated hours, and read the
bot's `tracksProgression` deltas as the ledger — `essences`, `catalysts`,
`catalystProgress`, `biomeXP`, `biomeLevel` all already accrue through the real
`grantMonsterRewards` path inside `world.tick`. That yields **kills/hour,
essence/hour, catalysts/hour per (node × build × tier)** — the exact numbers that
have blocked every previous economy pass — with no new simulation code, only a
new loop mode and a ledger reader.

**Do this before the agent harness.** It is the cheapest item in the whole
tooling track and it unblocks the economy pass on its own.

### 5.5b The time-scale result (measured 2026-08-02) — **the fast runs were lying**

`--scale-sweep` re-runs one fixed (build × node) at several time scales and
reports the drift. Over **1 simulated hour**, baseline `timeScale: 1`:

| scale | plains T1 kills/hr | drift | cave T3 kills/hr | drift |
| ----- | -----------------: | ----: | ---------------: | ----: |
| 1     |               1063 |     — |              489 |     — |
| 2     |               1052 | −1.0% |              486 | −0.6% |
| 3     |                994 | −6.5% |              458 | −6.3% |
| 4     |                955 | −10%  |                — |     — |
| 5     |               1015 | −4.5% |              402 | −18%  |
| 10    |                758 | −29%  |              332 | −32%  |

Run-to-run noise at 1 sim hour is ~1–2% (measured by repeating scale 1), so
everything from scale 3 up is a real, **one-directional understatement**, not
variance. Essence, catalysts, and biome XP all track kills within a point.

**Cause:** `dt = 100 ms × timeScale`, and a coarse tick quantizes attack cadence
downward — a 700 ms swing resolves once per 1000 ms tick instead of ~1.4 times.
Throughput can only lose, never gain, so the error compounds with the scale.

**Ceiling: `timeScale ≤ 2`.** Farm mode now defaults to 2 (not the fight bench's
5) and warns on stdout when pushed higher outside a sweep.

> ⚠️ **This is not only a farm-mode problem.** `--mode boss` and `--mode
> overlord` default to `--time-scale 5`, where T3 throughput measured ~18% low.
> Every clear time, `dps`, and difficulty rating collected at scale 5 is
> distorted in the "harder than reality" direction. Not changed here — dropping
> the fight bench's default invalidates previously-collected matrices and is a
> balance call, not a tooling one. **Decide before the next difficulty pass.**

### 5.7 Defects found while doing 0.2 / 0.3 / 0.4 (2026-08-02)

All pre-existing. A–C were confirmed by stashing the session's changes and
reproducing on clean `master`; D–F surfaced when the benches were typechecked and
run for the first time in farm mode.

**A. Every directional core was permanently inactive. FIXED.** *(gameplay, not
tooling — this one shipped to players.)*
`coreIsActive` compared its `close|mid|far` tag against `usesSkills.selectedRange`
with strict equality, but `selectedRange` holds the **full tier-2 skill id**
(`cadence-range-close`), assigned at `progression/skills.ts:42`. Every other
consumer — including `stats.ts:193`, four lines above the core gate — matches it
with `.endsWith('-range-<kind>')`. So `'close' === 'cadence-range-close'` was
always false and only `universal`/`party` cores ever applied. The server gate and
both client indicators read the same helper, so they agreed with each other and
it read as intended behaviour.
**Why it survived:** `server/test/cores.test.ts` existed and passed — its fixture
set `selectedRange: "far"`, a bare value the real game never produces. The test
encoded the bug. Fixture corrected; new `server/test/coreRangeGate.test.ts` pins
the real id shape and asserts every authored directional core is reachable.

**B. The bench crashed on every content tier ≥ 3. FIXED.**
`enumerateBuildsForContentTier` pushed the range node as a bare suffix
(`range-close`) instead of `${prefix}-${range}`, throwing
`unlock failed: range-close`. It hit both the `maxSkillTier >= 2` and `>= 3`
branches, so **all of `--all-paths` and every content tier ≥ 3 were unrunnable** —
including the T4 overlord party matrix the TUI is largely built around. The bench
only ever worked at T1–T2.

**C. `dps-report` and `ehp-report` do not execute. NOT FIXED.**
Both die at the first import with `Cannot find module '@mmo-idle/shared'`.
`tools/` is not a workspace package, so it has no link of its own; the scripts run
`pnpm --dir server exec tsx ../tools/…`, but tsx resolves from the *file's*
directory, walks up from `tools/` to the repo root, and finds no
`node_modules/@mmo-idle/shared` (the link lives at `server/node_modules/`).
`server/tsconfig.json` has no `paths` and includes only `src`, so nothing bridges
it. **Fix:** add `@mmo-idle/shared` as a root workspace dependency and reinstall.
Left undone because it touches the lockfile.

**D. The bench had never been typechecked at all. FIXED.**
`server/tsconfig.json` includes only `src` (it drives the emitted build, rooted
there), so `pnpm typecheck` and CI never looked at `bench/`. New
`server/tsconfig.bench.json` covers `src` + `bench`, wired into the root
`typecheck` script. It immediately surfaced three latent bugs, all now fixed:
- `bench/harness.ts` built players with the pre-multi-slot
  `equippedAbilities: { technique: null, guard: null }` — a malformed slice the
  load bench had been writing since the Wave 1 ability rework.
- `isBenchEquippable` gated on `recipe.ultimate`, a field `Recipe` does not have,
  so the check was dead. (`requiredBossClear` already covers ultimate gear.)
- `BALANCE_JSONL_SCHEMA_VERSION`'s literal type made `toJsonlMatch` unassignable
  to its own return type.

`test/` is deliberately still outside that config — those files carry a large
backlog of pre-existing strictness errors (~60) and run fine under tsx. Worth its
own cleanup pass; not this one.

**E. Every tier-0 bench match was fake. FIXED.**
`enumerateContentTargets` hard-coded `node-5-5` as the tier-0 target — a node id
that stopped existing at the map rework. The node resolved to nothing, so
`isNodeCleared` was true on tick one and every tier-0 row reported
`outcome: clear` with `initial_mob_count: 0`. Now `CLEARING_NODE_ID`; a T0 clear
takes ~67 s against 12 real mobs.

**F. Overlord party sampling never prioritized anything. FIXED.**
`rangeNodeOf` compared skill-path entries against the bare `range-close` — the
same wrong id shape as defect B. It matched nothing, so `rangeFitScore` returned
"neutral" for every build and `--sample`'s advertised "optimized builds first"
ordering was a no-op; samples were effectively arbitrary. Now matched by suffix.

**The pattern worth noting:** all six are silent. Nothing threw in the live game,
the failing bench modes were simply never run, the one test that covered the core
gate passed while asserting fictional state, and the whole bench tree sat outside
the typechecker. Treat "the tool ran and produced numbers" as weak evidence.

### 5.8 The first thing the farm loop found: auto-combat can wedge forever

> **STATUS 2026-08-10: both causes are FIXED.** Cause 1 (`approachPoint`) closed
> earlier; cause 2 (a mover standing on its own waypoint permanently losing
> `isMoving`) closed below. What remains on mountain is a **balance** problem —
> ~30 deaths per simulated hour for a T1 ranged build — not a pathing one.

**This is a live gameplay defect, not a bench artifact** — the farm loop runs the
same `updateAutoTargets` the real server does. Tagged **blocker** for 0.5.

**Symptom.** On `node-t1-mountain-01`, a T1 cadence bot stops moving ~15 sim
minutes in and never moves again. Probe output, one line per 5 sim minutes:

```
t=15min kills=8 hp=182/182 pos=(2672,1872) still atk=none aggro=none mobs=12 nearest=687px
t=20min kills=0 hp=182/182 pos=(2672,1872) still atk=none aggro=none mobs=12 nearest=687px
…unchanged through t=60min…
```

Full HP, no attack target, no aggro target, twelve live monsters ~690 px away,
zero kills for 45 simulated minutes. A real player idling on auto-combat in that
node parks permanently.

**Mechanism.** `nearestEngageableMonster` (`targetPriority.ts:491`) returns
`null` when **no** candidate passes `canReach` *or* `findPathForMover` +
`pathEndsInAttackRange`. The idle branch of `updateAutoTargets`
(`autoTarget.ts:322`) treats that as "node empty" and calls `stopEntity` — with
no wander, no re-path, no retry, and no node change. The state is absorbing.

**Ruled out by probing (`_probeMountain.ts`), in this order:**
- *Lodged in geometry* — `movement.ts:126` already depenetrates every tick.
- *Broken terrain topology* — all **140** open-world nodes have exactly **one**
  connected player-walkable region, and the recorded wedge cell is walkable.
- *Mover asymmetry* — the `player` and `monster` nav grids are byte-identical
  (5719 walkable cells on `node-t1-mountain-01`); only 1–2 of 12 monsters spawn
  on a blocked cell, nowhere near enough.
- *Candidate filters* — at wedge time all 8 live monsters were `awareness=idle`,
  well inside leash (spawnDist 10–23 vs leashRange 460–640), not invulnerable.
  Every one reached the path check.
- *Route existence* — pathing straight at each monster succeeds with `endGap=0`.

#### Cause 1 — `approachPoint` returned out-of-range destinations. **FIXED.**

A step-by-step replay of `nearestEngageableMonster` inside a single wedge
instance settled it. Every monster's route landed **exactly** on the requested
approach goal (`endOffGoal=0`) — so grid snapping was innocent — but that goal sat
**14–18 px** from the target against a **12 px** melee `attackRange`, so
`endsInRange` was false for all twelve.

`approachPoint` (`shared/src/systems/spatial.ts`) advanced along the
**centre-to-centre** ray by the **edge-to-edge** gap deficit. For rectangles those
shrink at the same rate only when the approach runs along an axis. Reproduced in
pure geometry with no simulation — a 12-reach attacker closing on an identical
hitbox:

| approach angle | 0° | 10° | 20° | 30° | 40° | 50°+ |
| -------------- | -: | --: | --: | --: | --: | ---: |
| gap at destination | 6.0 | 10.8 | **15.8** | **17.2** | **14.7** | 8.7 → 6.0 |

Three of ten angles land outside a 12 px reach. Fixed by bisecting along the ray
for the smallest advance that actually achieves the standoff; all angles now
resolve to exactly 6.0. Postcondition documented on the function.

**Why it survived:** every existing `approachPoint` case in
`spatialHitbox.test.ts` approached at **0°** — `{x:100,y:0}`, `{x:400,y:0}`,
`{x:25,y:0}` — the one angle the old code got right. Same shape as defect A: the
tests covered only the case that worked. Now swept over 36 angles × 3 ranges.

**Effect:** mountain T1 cadence went 17 → 302 kills/hr, cooldown 160 → 323.

#### Cause 2 — a mover standing on its own waypoint loses motion forever. **FIXED 2026-08-10.**

**The earlier diagnosis in this section was wrong in two ways, and both matter.**

*First, the instrument was lying.* `_probeMountain.ts` declares a wedge whenever the
bot is motionless for 2 simulated minutes — a criterion a **corpse** also satisfies.
It never checks HP and never revives the bot the way `runFarm` does. Mountain T1
kills a T1 ranged bot **~30 times per simulated hour**, so most of what it reported
as wedges were deaths. A corrected probe (`_probeWedge2.ts`, revives on death,
reports only *live* wedges) is now the one to use; `_probeMountain.ts` carries a
warning header.

*Second, the surviving live wedge was not in `steerTowardTarget` at all.* Path
planning succeeds — the captured state shows `planPath` returning 24 points for the
steering goal and 23 for the acquisition goal. The real state is:

```txt
GATES: auto=true manualIntent=false rooted=false fleeing=false
       moving=FALSE movePath=25wp casting=false channeling=false
```

A valid 25-waypoint route and **no `isMoving` component**. The chain:

1. The mover lands exactly on `waypoints[0]`.
2. `requestNavMotion`'s "existing path is still valid" reuse branch steers at
   `waypoints[0]` via `attachMotionToward`.
3. Already *on* it → `magnitude === 0` → `attachMotionToward` **detaches** `isMoving`.
4. `world.movingPlayers` is `livePlayers.with("isMoving")`, and `processMoverStep`
   — the only caller of `advanceMovePath` — iterates it. So the queue never advances.
5. Next tick: same valid path, same reached waypoint, magnitude 0, detach again.
   **Absorbing.**

It is stochastic because it needs an exact waypoint landing; mountain's ledge
geometry produces long, corner-heavy routes and hits it far more often. It is not
mountain-specific in principle — any node can produce it.

**Fix:** the reuse branch now calls `advanceMovePath` to pop reached waypoints
before steering at the head (`server/src/systems/world/pathMotion.ts`). This also
repairs the stuck-watchdog path at `movement.ts`, which deliberately detaches
`isMoving` while preserving `hasMovePath` on the assumption that "the next
autonomous steering tick" restores motion — an assumption that failed for exactly
the same reason.

**Verified:** `server/test/navWaypointWedge.test.ts` pins the invariant and fails on
the pre-fix code with the intended assertion. `_probeWedge2.ts` went from 3 live
wedges in ~23 runs to **0 in 24 runs** across cadence (melee, reach 12) and energy
(ranged, reach 142). Typecheck clean, `pnpm test` 71/71.

> **The remaining mountain problem is balance, not pathing.** With the wedge gone, a
> T1 energy bot still dies **~30x per simulated hour** on `node-t1-mountain-01`
> while a cadence bot dies ~1x and a plains bot dies **0**. The blast-radius table
> below was collected with the broken probe and a live wedge in play; treat its
> kills/hr figures as measuring *death*, not pathing, and re-collect before drawing
> any balance conclusion from it.


**Blast radius.** Mountain kills/hr across every class, vs 900–1500 on
plains/forest/jungle at the same tier:

| class | mountain T1 | mountain T2 |
| ----- | ----------: | ----------: |
| cadence | 17 | 19 |
| cooldown | 160 | 5 |
| reload | 193 | 161 |
| energy | 298 | — |
| dot | 143 | — |
| summoner | 826 | — |

Summoner is the tell: it scores near-normal because it fights *through minions*,
which roam independently of the player's own pathing.

It is also non-deterministic — the identical config produced 486 kills/hr over
20 sim minutes and 11 kills/hr over 60. **Any single farm run on an affected node
is worthless**, and the variance is a wedge, not noise.

**It was also a server CPU hazard — and that half is already fixed.** When *no*
candidate passes, `nearestEngageableMonster` pathfinds every live monster and
fails on all of them, every tick, forever (the nav grid is cached; the search is
not). Measured before the fix: **3.27 ms/tick moving vs 48.7 ms/tick wedged, 14.9x**
— roughly half the 100 ms logic tick burnt by one idle player. After the cause-1
fix, acquisition succeeds and returns on the first candidate, so the same probe
now reads **2.18 ms moving vs 0.44 ms wedged (0.2x)**. The cause-2 wedge is cheap.
The CPU hazard was specific to the empty-candidate path.

**Worth doing as defence in depth, no longer urgent:** throttle the idle
re-check. The measured hazard is gone, but the shape that produced it remains — an
empty candidate list still means a full per-monster pathfind sweep at 10 Hz, so
any future bug that empties it re-creates the same 15x cost silently.

**Repro scripts** (leading `_` = skipped by the test runner):
- `server/test/_probeMountain.ts` — ticks a real node until the bot is motionless
  for 2 sim minutes, then replays `nearestEngageableMonster` per monster
  (`canReach`, approach goal, path, `endsInRange`) and times wedged vs moving
  ticks. Takes `[nodeId] [classRoot]`. Retries up to 8 times, since the wedge is
  stochastic at roughly 50/50 per run — **do not mix evidence across runs, they
  are different worlds.**
- `server/test/_probeApproach.ts` — the pure-geometry `approachPoint` check that
  isolated cause 1. No world, no RNG.

**Repro:** `server/test/_probeMountain.ts` (leading `_` = skipped by the test
runner). It ticks the node until the bot is motionless for 2 sim minutes, then
dumps per-mob pathability and whether the bot can path anywhere at all.

### 5.6 Recommended tooling order

1. ✅ **Fix `botFactory` blind spots + the `+3`/`+5` staleness.** (0.2 / 0.3)
2. ✅ **The farming loop** (§5.5). Shipped as `--mode farm`; see §5.5b for the
   time-scale result, which is the part that mattered.
3. **Layered-sweep mode** (`--sweep <axis>` + baseline + delta column). Design it
   before the content lands.
4. **Agent harness** (§6) — the decision layer on top of #2. Independent of #1
   and #3, so it can run in parallel.

---

## 6. The agent play-harness

**Verdict: worth building, and cheaper than it sounds — but it's a different
instrument from the sim, not a better one.**

### 6.1 Why it fits this game unusually well

The write half of the API **already exists**. `ClientToServerEvents`
(`shared/src/protocol/socketEvents.ts`) is already a strategic-decision surface,
not a twitch-control surface:

```
player:navigateTo · player:setAuto · player:setAutoTraverse ·
player:setAutocombatConfig · player:activateDungeonAltar ·
player:unlockSkill · rune:setLoadout · ability:setLoadout ·
stance:setLoadout · rite:setLoadout · inventory:equipItem/unequip ·
inventory:upgradeItem · crafting:craftRecipe · crafting:evolveItem ·
{rune,ability,stance,rite}:craftRecipe · party:join/leave
```

That is *exactly* the list of decisions your instinct described — plan and
choose, don't drive. `setAuto` + `setAutoTraverse` already **are** the character
controller; the agent never touches movement or attacks. Every action is
server-validated, so a confused agent can't corrupt state, only waste a turn.

This isn't a coincidence: the design docs already name the player fantasy as
*"you are the trainer/programmer of an autonomous hero — builds, gear, routing,
rune logic"* (`design_docs/archive/design-development-suggestions.md` §3.1). An agent harness is that
fantasy with the human swapped out. The decision surface matches because the game
was designed around it.

### 6.2 The gap is the read half

`state:sync` / `node:delta` are `DeltaSnapshot` — component deltas at 5 Hz,
shaped for a renderer. Feeding that to a model is both the wrong shape and
ruinously expensive. What the agent needs is:

- **A state digest** — low-frequency, semantic, a few KB: tier, biome levels,
  global mastery, wallets, equipped loadouts across all systems, current node +
  neighbours, recent outcomes (deaths, clears, seals). `composePlayerView`
  (`shared/src/protocol/views.ts:254`) is already most of this.
- **An affordance list** — *what can I legally do right now, and what does it
  cost*: craftable recipes, learnable abilities/stances/rites, affordable
  upgrades, reachable nodes, unlocked skill nodes. Every one of these already has
  a shared gate function (`isRuneRecipeUnlocked`, `isAbilityRecipeUnlocked`,
  `checkUpgrade`, `checkEvolve`, …) — the harness assembles, it doesn't compute.
- **A tick/turn boundary** — the agent acts, the world runs N simulated minutes,
  the agent gets a new digest. Not a real-time loop.

### 6.3 Your cost intuition is right, with one correction

Token cost is dominated by **state size × decision count**, not model size. A 2 KB
digest × ~200 decisions per run is trivial; a raw delta stream is unusable at any
model size. So **the harness quality *is* the cost model** — the digest design is
the whole engineering problem, and it's what makes a weak model viable.

### 6.4 Where I'd push back

- **It won't replace the sim.** The sim asks "is this combination viable" across
  millions of combos. The agent asks "would a person find and choose this."
  Agent runs are N≈dozens. Both, not either.
- **The agent optimizes against the digest, not the UI.** It will never notice
  that information exists but is buried three panels deep. That's precisely what
  human playtesting is for — so this complements testers, it doesn't replace
  them.
- **Whatever you expose becomes what it optimizes.** If the digest reports DPS,
  it plays DPS. Keep the digest *descriptive* (what a player can observe), never
  *evaluative* (rankings, scores, "best" flags), or you'll measure your own
  heuristics coming back at you.

### 6.5 The turn structure: commit-and-check-back

The agent does **not** report per step. It commits to an intent for a duration —
*"farm swamp on auto for 5 simulated minutes, then show me what I have"* — and
the world runs unattended until the check-back. This is the right shape, and not
only for token cost: it's the decision cadence the game actually has. An idle
game's real questions are *where do I farm, how long, and what do I spend it on*,
and those are exactly the moments the agent is present for.

Three things this structure requires:

- **The check-back digest must be a diff, not a snapshot.** "Since your last
  check-in: 340 kills, +1,240 green essence, +3 alacrity catalysts, 2 deaths,
  swamp 3→4." Without the delta neither the agent nor you can reason about
  rates, and the whole structure loses its point.
- **The interval is itself a measured variable.** If the agent picks it freely
  you are partly measuring the agent's impatience, not the game's pacing. Fix it
  as an experiment parameter — and separately, *log* how often it wanted to check
  in, because "this idle game demands attention every 90 seconds" is a real
  finding.
- **Death during a commit needs an explicit policy.** `player:ackDeath` exists.
  Auto-respawn and resume, or bank the remainder as lost time? It changes the
  numbers materially, and "what does dying cost you in throughput" is a question
  worth modelling deliberately rather than by accident.

### 6.6 Oracle mode vs. player mode — tag every run

The agent optimizes against whatever the digest exposes, which makes this a
*choice*, not a limitation:

- **Oracle mode** — the digest carries true rates and costs. The agent routes
  near-optimally, and you measure the **economy's ceiling**: how fast progression
  goes when played well. This is the mode that feeds balance numbers.
- **Player mode** — the digest carries only what the UI actually shows. Now the
  agent's routing mistakes *are* findings: it farmed the wrong biome for an hour
  because nothing told it where catalysts come from.

Both are valuable and they answer different questions. Tag runs by mode and never
mix them in one dataset.

### 6.7 The output I'd actually value most

Not the balance data — **the stuck log**. Every turn the agent can't decide, or
picks something incoherent, or has to ask "what now", is a legibility defect a
human tester would also hit but would rationalize away instead of reporting.
That feeds the roadmap's deferred "failure diagnosis" work and §9's "define the
questions the playtest should answer" directly.

Second-highest value: it's a **regression harness**. A scripted run from T0 to T4
asserting *never softlocked, always had at least one legal progression action,
every tier reachable* is the roadmap's "verify the full progression path through
T4" item — automated, repeatable, and re-runnable after every content change.
That's why it moves up the schedule: it does Phase 0's manual walk-through for
you.

### 6.6 Build shape

Small. A headless `socket.io-client` session + a digest composer (reuse
`composePlayerView`) + an affordance resolver (reuse existing gate functions) + a
thin action wrapper over `ClientToServerEvents` + a turn loop with a transcript
log. Roughly two sessions for a v1 that can drive a character from T0 to T2, and
it needs no design decisions from D2/D3/D4 to start.

---

## 7. Start here

Concretely, the next few sessions:

1. **Write the three brief docs** (D2 relics, D3 T5/T6, D4 summoner) as
   `docs/briefs/`. Mostly assembly — the grounding sections are quotes and file
   references from existing current-state docs. Export them; the offline
   turnaround is the long pole.
2. **Fix the bench blind spots** (§5.2) + the `+3`/`+5` staleness (§5.4). No
   decisions required, and every number produced before this is fiction.
3. **Seals** (§D1) — implementation is settled; the care goes into the
   source-attribution UI.
4. **T1–T4 progression walk-through** (§0.5) → written defect list.

The agent play-harness (§6) is **parked as a luxury** (user, 2026-08-02): real
dev time on something no player ever sees. The farming loop (§0.4) is *not* the
same item and stays in scope — two flags and a ledger reader, and it is what lets
Phase 3 author costs against measured income.

Art continues alongside on anything D3/D4 don't gate.
