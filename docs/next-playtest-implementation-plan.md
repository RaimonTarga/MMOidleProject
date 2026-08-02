# Next Playtest — Implementation Plan

**Companion to** `docs/next-playtest-roadmap.md` (the *what*). This doc is the
*how* and the *in what order*: which items are blocked on design, which are pure
code, which run in parallel, and what the offline design sessions must produce.

Grounded in a code read on 2026-08-02. Where this doc and the code disagree, the
code wins.

---

## 0. What the sketch assumes vs. what the code actually says

The sketch was written without a code read. Five findings change the plan.

| Roadmap item | Reality in the repo | Effect on the plan |
|---|---|---|
| "Change tier advancement to seals" | `QUEST_DATABASE` (5 quests, `tierRequired` 0–4) + `registerKillForQuests` (45 lines) is the *entire* mechanism. The progression panel's `MilestonePips` was **deliberately built as the seal seam** — `killsRequired: 3` from distinct sources already draws three trophies with no UI work. | Smallest item on the list. ~1 session once the design lands. **Not** a big refactor. |
| "Implement the relic system / add the relic slot" | Nothing exists. `EQUIPMENT_SLOTS = [weapon, armor, recovery, mobility, core]` — cores took the fifth slot. **The axes are already separate and settled (user, 2026-08-02): cores are stat amplifiers that reinforce your *role*; relics operate at the *mechanic* level and reinforce your class mechanic.** | No design collision. The relic brief is narrower than it looked: the job is decided, so the open questions are where state lives, which mechanics each relic hooks, and acquisition. |
| "Author T5 and T6 biome content" | Regions are now data: `shared/src/world/map/regionT{1..4}.ts`, ~45 lines each (mask grid + biome list + dungeon cells + sanctuary). Adding `regionT5.ts` is trivial. But **every biome×tier needs a monster pool or the world throws at boot** (`nodeModifiers.ts:530`). | Structure is cheap; *content* is the whole cost. Roster choice is the biggest scope lever in the program. |
| "T1–T4 must be stable" | Monster/boss coverage for T1–T4 is complete and boot-validated (the `⚠ T4 trash not authored` comments on forest/plains are stale — those biomes retire before T3). But **abilities stop at T2**: 8 abilities exist (5×T1, 3×T2) while `abilitySlotCount` grants a T4 player **4 slots**. Cores = 4 items, forest only. Stances = 3. Rites = 4. | The real T1–T4 blocker isn't monsters — it's **empty build slots at T3/T4**. This outranks T5/T6 content. |
| "Decide whether Summoner is included" | Summoner has an archetype, 3 T3 paths (plains/mountain/cave), and 9 T3 specs authored as data. Minions still alias the Tiny Wisp placeholder; T3 bodies are the only sprite work left. | The decision is real and it's a *fork in the schedule*, not a footnote. Put it early. |

**Bottom line:** the roadmap's ordering is roughly inverted. Sections 1–2
(progression spine + build content) are the critical path; section 4 (T5/T6) is
the largest cost but depends on 1–2 landing first; section 3 (T1–T4 stability) is
smaller than it reads once you know it's really "fill the T3/T4 build slots."

---

## 1. The decisions that gate everything

Three offline design sessions (D2 relics, D3 T5/T6, D4 summoner) plus one item
that turned out **not** to need one (D1 seals — decided; its open work is UI).
Nothing downstream of each brief can start until its answer returns. **Write and
export the three briefs before starting implementation work** — the offline
turnaround is the long pole, and Tracks E/F/G (art, deploy, tooling) can absorb
the wait.

Each brief follows the same shape: **grounding facts → the questions → the
return format**. The return format matters most: specify the exact table/schema
you want back so the answer is directly implementable rather than prose you have
to re-interpret.

### D1 — Seals — **NOT a design brief**

The design is settled (user, 2026-08-02). What's actually open is **presentation**:
conveying to the player what they need to advance, where to get it, and how far
along they are. So D1 is a UI/information-design task in Track A, not an offline
session.

**Implementation shape (≈1 session):** add a `seals` record to
`TracksProgression` (same pattern as `catalysts` — whole-slice JSON, `{}` default
for old rows, no migration); replace the tier-advance branch in `questSystem.ts`
with a seal check against a new `TIER_ADVANCEMENT` table; grant seals in the boss
first-clear path; thread through `PlayerView` + admin grant/reset.

**The presentation work — the part that actually needs care:**
- The progression panel's `MilestonePips` were built *as the seal seam* —
  `killsRequired: 3` from distinct sources already draws three trophies with no
  UI work, and switches to a segmented `GradientConduit` above six units. The
  container exists; what it lacks is **source attribution**: a pip that says
  "obtained" doesn't say *where the unobtained ones come from*.
- Three questions the UI must answer without the player leaving the panel:
  *what do I need*, *where is it*, *how close am I*. The panel answers the first
  and third today.
- The map already carries boss-respawn markers and a discovery/unlock layer —
  that's the natural home for "where", and the quest row's existing compass
  `ActionChip` (`▶ locate dungeons on map`) is already the seam for wiring pip →
  map location.

### D2 — Relics

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
| **A — Progression spine** | Seals; relic machinery + slot; relic catalogue | D1, D2 | Phase 1–2 |
| **B — Build content** | Abilities T3/T4 rosters; cores catalogue; stances; rites | nothing (D2 for relic interactions) | Phase 1–2 |
| **C — T1–T4 stability** | Progression walk-through, placeholder purge, boss/dungeon pass | nothing | Phase 0 audit, fixes throughout |
| **D — T5/T6** | Regions, biome rosters, monsters, bosses, dungeons, recipes, equipment | D3, and A+B landing first | Phase 3 |
| **E — Art** | Summoner bodies, T5/T6 biomes + monsters, relic/ability icons, tier aura | D3, D4 per-item | continuous |
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
`docs/briefs/d3-t5-t6.md`, `docs/briefs/d2-relics.md`,
`docs/briefs/d4-summoner.md`. Each is self-contained (game overview → grounding →
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

**0.4 — The farming loop.**
Open-world node, repopulation on, no clear-break, run for simulated hours, ledger
the `tracksProgression` deltas. Validate rate stability across `timeScale` before
trusting long runs.
`touches:` `server/bench/balance/{worldFactory,runMatch}.ts`, a new ledger
reader, a new CLI mode.
`done when:` kills/hr, essence/hr, catalysts/hr print per node × build × tier,
and the numbers hold across at least three time scales.
`unblocks:` authoring T5/T6 costs against measured income instead of guesses —
which is the main lever on how big Phase 5 ends up being.

**0.5 — T1–T4 progression walk-through.** *(1–2 sessions)*
Walk a character T0→T4 and record every blocker, empty slot, dead recipe, and
unreachable unlock.
`done when:` a written defect list, each item tagged blocker / content / polish.
`unblocks:` 1.6 (you'll be fixing from this list, not from guesses).

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

**1.2 — Seals: presentation.**
Source attribution on the milestone pips (an unobtained pip must say where it
comes from), and pip → map location wiring through the existing compass
`ActionChip`.
`touches:` the progression cluster, map layer.
`done when:` a player who has never seen the game can answer *what do I need*,
*where is it*, *how close am I* without leaving the panel.

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

**1.5 — Relic machinery.** `needs:` D2.
Slot or `TracksProgression` state per D2's Q1, recipe type, biome/boss gating,
equip + persistence + network + PlayerView, panel UI. Machinery only.
`done when:` a hand-granted relic equips, persists across restart, and visibly
modifies its class mechanic. Catalogue is Phase 2.

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

**2.1 — Cores catalogue.** *(2–3 sessions)*
Today: 4 items, forest only. Needs a family per biome across the range axis
(close / mid / far / universal / party), plus rank chains via the evolution
machinery (`requiredPlus 0`).
`done when:` every biome a T1–T4 player farms offers a core that rewards their
range choice.

**2.2 — Stances.** *(1–2 sessions)*
Today: 3 generic (Offensive / Defensive / Tanking). These are the most
placeholder-feeling content in the game. Needs identities that mean something
next to cores — cores amplify your role continuously, stances trade posture
reactively.
`done when:` the default/reactive pair presents a real decision, not a slider.

**2.3 — Rites.** *(1–2 sessions)*
Today: 4. Always-on out-of-combat passives, T3 gate, 2 fixed slots.
`done when:` enough rites that the 2 slots are a choice.

**2.4 — Relic catalogue.** `needs:` 1.5. *(2–3 sessions)*
The archetypes and their boss-unlocked lines from D2's return table.
`done when:` each T4 dungeon boss unlocks a distinct relic line — "why kill *this*
one" has an answer per boss.

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

≈45–70 sessions to playtest, with Phase 3 carrying roughly half the risk and most
of the compressibility. Art (Track E) runs alongside throughout and is the
long-lead item inside Phase 3.

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

⚠️ **Validate rate stability against `timeScale` first.** `dt = BENCH_DT_MS ×
timeScale` = 100 ms × scale, so `timeScale: 10` means a **one-second tick** —
attack timers, DoT ticks, movement, aggro, and respawn cadence all resolve in one
lump. Run the same node at several time scales and confirm essence/hour holds. If
the rate moves with the scale, the fast runs are lying and you need a fidelity
ceiling before trusting long sims.

### 5.7 Defects found while doing 0.2 / 0.3 (2026-08-02)

All three were confirmed pre-existing by stashing the session's changes and
reproducing on clean `master`.

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

**The pattern worth noting:** all three are silent. Nothing threw in the live
game, the failing bench modes were simply never run, and the one test that
covered the core gate passed while asserting fictional state. Treat "the tool ran
and produced numbers" as weak evidence until 0.2–0.4 are complete.

### 5.6 Recommended tooling order

1. **Fix `botFactory` blind spots + the `+3`/`+5` staleness.** Cheap; everything
   downstream is wrong without it.
2. **The farming loop** (§5.5). Two flags and a ledger reader; unblocks the
   economy pass on its own, and becomes the substrate the agent harness runs on.
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
rune logic"* (`design-development-suggestions.md` §3.1). An agent harness is that
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
