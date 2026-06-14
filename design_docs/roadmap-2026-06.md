# Roadmap — T4 Playable (2 weeks, part-time)

**Goal:** content through T4 polished, balanced, playable. Includes QoL wedges.
Excludes: in-game wiki, auth, T5+ anything.

**Budget reality:** ~35–45h available; full chosen scope prices at ~60–80h.
The plan is ordered so slips cost the *lowest-ranked items*, never the tier.
Two checkpoints (day 5, day 10) carry explicit cut rules — follow them
mechanically, don't renegotiate scope mid-week.

**Definition of done:** a new character can play T0→T4, level every T4 biome,
craft/upgrade the T4 sets, fell a T4 dungeon boss, and the numbers feel like
the T3 experience did — without the player ever hitting a missing mechanic.

**Delegation note:** tasks tagged `[stamp]` are mechanical-once-patterned —
good candidates for cheap-model agent runs with the locked docs as guardrails.
Tasks tagged `[judgment]` need you.

---

## Phase 0 — Unblock (day 1, ~2h)

- [ ] Delete the old/broken T4 node implementations. One commit. No archaeology.
- [ ] Convert `t4-spec-designs-reference.md` into a work-order table:
      45 rows — spec | engine deps | placeholder numbers | status. `[judgment]`
- [ ] Create `t4-v2-ideas.md` parking file. Design is LOCKED for these two
      weeks; every new idea goes there, not into code.
- [ ] Fix the 3 trivial spec-doc bugs while you're in there (missing Fire
      header, stale addenda, Iron Patience in the impl table) so the work-order
      source is trustworthy.

## Phase 1 — T4 core engine (days 1–4, ~10–12h)

The tier must be *farmable* before anything else matters.

- [ ] **4 monster mechanics** (`cadenceFinisher`, `empoweredCooldown`,
      `enemyShield`, `enemySoftCap`) — the implementation prompt doc is ready;
      they mirror player math. Decide the enemyShield-vs-DoT tick rule (DoT
      damages shield; applied DoTs persist) before coding. ~4–6h `[stamp]`
- [ ] Verify monster evasion is the deterministic counter (port if missing).
- [ ] **World wiring:** Graveyard/Trench biome keys recognized, T4 spawn pools
      + densities, dungeons + bosses placed and reachable. Set the Graveyard
      density cap *now* (audit flag). ~2–3h
- [ ] **Decide the `ramp()` engine primitive** before touching item keys — it
      collapses ~8 of the 22 † keys (absorb-ramp, sustained-DR, stationary,
      ramp-regen variants). One decision, hours saved. `[judgment]`
- [ ] **T4 items + engine keys** from `t4-item-designs-v2.md` (post-ramp
      consolidation). Record the 5 missing boot designs while in the file.
      ~6–8h `[stamp]` after the first biome establishes the pattern.

**Milestone:** T4 zones farmable end-to-end with placeholder-tuned gear.

## Phase 2 — Specs in class waves (days 5–10, ~15–20h)

- [ ] **Pilot class first** (pick the one with fewest † flags) — 9 specs
      end-to-end: data shape, listeners in `initCombatSystems`, bench wiring.
      This sets the per-spec cost for everything after. ~4–5h `[judgment]`
- [ ] Classes 2–5 in waves, **placeholder numbers throughout** — the bench is
      the tuning loop, not the blocker. ~3–4h per class `[stamp]`
- [ ] **Pre-authorized cuts (do not implement these two weeks):** Laser,
      Channeled Beam, Singular Extraction's on-hit pass-through edge. Frames
      ship 2-of-3 where needed; the spec doc already sanctions evaluating these.
- [ ] Engine prerequisites from the cross-class table as they're hit (plating
      shred cap before Cursed Finale, etc.) — lazily, per spec, never upfront.

### CHECKPOINT — Day 5 (after pilot class)
Pilot took ≤5h → proceed all five classes. Took more → cut to 3 classes now
(pilot + the two you most want to play) and move the freed hours to Phase 3.

### CHECKPOINT — Day 10
- Specs at 4–5 classes → finish them, then Phase 3 order as listed.
- Specs at ≤3 classes → **stop adding classes.** Remaining classes are week 3.
  Jump to Phase 3; a balanced, polished partial beats an untuned complete.

## Phase 3 — Balance + polish pass (days 10–13, ~8–10h)

- [ ] **Bench balance pass** `[judgment]`: T4 trash TTK vs Fast build (~4s
      target), glass survival (~5s vs single mob — the §7 lookup), spec budget
      index ±20%, and the named "ramp stack" worst case (ramp specs ×
      long-fight items). You tune numbers directly — this phase is yours.
- [ ] T2/T3 touch-ups your playtesting already flagged ("needs a lil more work").
- [ ] **Boots pass:** tune the mobility boot values, build the missing HUD tiles
      (both flagged pending from the earlier boots session).
- [ ] Playtest sweep T0→T4 as a fresh character; fix the top-5 friction list
      only — park the rest.

## Phase 4 — QoL wedges (days 12–14, in this order, ~2–6h each)

Ranked by leverage-per-hour. Do them in order until time runs out; anything
left is week 3. None block the T4 milestone.

1. [ ] **Shape tags + mob side panel v1** (~2h): damage-shape tag + raw stats on
       click. The personalized matchup lines (client-side from shared formulas)
       are a fast follow if time allows.
2. [ ] **Monitoring panel v1** (~4–6h): kills, essence/XP per hr, deaths +
       causes, since-last-open window. Counters on existing event paths; the
       admin analytics stack is the prototype.
3. [ ] **Rune wave 1** (~4–6h): costs + RP budget (2×tier), validation on
       `rune:setLoadout`, settings-tab removal, starter-kit fragments on early
       quests. Requires the charge-cut decision (rune doc §2) — make it before
       starting. `[judgment]` on the decision, `[stamp]` on the build.
4. [ ] **Gauntlet pilot** (~4–6h): phase spawner on Mountain T2's dungeon only.
       Validates the wave-gauntlet before any rollout. Deliberately last: it
       changes mandatory content, so it lands after balance, not before.

---

## What is explicitly NOT in these two weeks

In-game wiki · auth · relics · T4 boss doc/defense-break windows · gauntlet
rollout beyond the pilot · rune waves 2–4 · Summoner anything · the three cut
specs · T5+ design. Park, don't peek.

## Week-3 spillover (pre-accepted, in priority order)

Remaining spec classes (if cut at checkpoint) → remaining QoL wedges →
matchup lines v2 → cut specs revisited → T4 boss intent pass.
