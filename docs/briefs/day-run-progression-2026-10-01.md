# Day run — progression rework Phases 3 and 5, bench rerun, live bot (2026-10-01)

**Read by:** the conductor session. Paste the "Conductor prompt" into a fresh session
started in `../mmo-lineages` on `feat/lineage-data-model` (it now includes the morning
fixes, the T1 third-family mobs, and their art).
**Authority:** `design_docs/progression-rework-design.md` (§10, §11, §17, §18),
`docs/briefs/frame-loops-2026-10-01.md` (every frame and range decision),
`docs/progression-rework-plan.md` (Phase 3, Phase 5, §1.5), and the previous run's
`docs/briefs/overnight-report-2026-10-01.md` for what the code looks like now.
**Goal:** frames with identity and range rows with a mechanic each; a T2 band with an
amplifier row, band collapse and stat absorption at the gate; every remaining root re-homed
as a form so no item is unreachable; T2 nodes blended; the lane bench rerun on the map that
now exists; one live-bot run. Then a report.

**Not in scope:** Consort's loop (open; it ships with its stat skew only), the T3 class
review (Pyromancer, Warmonger and friends are re-homed later, noted in the brief), ability
nodes (future-plans), any monster number.

---

## Conductor prompt

```
You are the conductor for an implementation run. Working directory is ../mmo-lineages on
branch feat/lineage-data-model. Read docs/briefs/day-run-progression-2026-10-01.md in
full, then docs/briefs/frame-loops-2026-10-01.md, design_docs/progression-rework-design.md
and docs/progression-rework-plan.md. Skim docs/briefs/overnight-report-2026-10-01.md for
how last night's run went and what the code looks like.

Run the waves in the brief. For each task spawn one subagent with the Agent tool, the
brief's prompt verbatim, the model the brief names, and its own worktree. Harness
worktrees have no node_modules and installs are forbidden: do what last night's conductor
did — pre-build each task worktree with the pnpm store junctioned from ../mmo-lineages and
the @mmo-idle/* workspace links repointed to the worktree's own packages, and verify with
a typecheck before handing it to the subagent. Run every task of a wave in parallel; wait;
merge the wave into feat/lineage-data-model in the brief's order, resolving conflicts
yourself (three tasks edit rootsAndFrames.ts in different regions — expect conflicts
there); run `pnpm typecheck` and `pnpm test` before the next wave. A task that fails or
leaves the suite red gets up to an hour of your fixing; otherwise leave its branch
unmerged and record why.

Hard rules for you and every subagent:
- Never install anything. Never push. Never rebase, reset --hard, force, or amend.
  Commit often on the task branch; one logical change per commit; attribution line from
  the session's system reminder.
- Strip carriage returns from every touched file before committing.
- Tests must not need Postgres or Redis except the single live-bot task, which brings
  Docker up itself and down again after.
- Subagents run only related tests plus `pnpm typecheck`; the full suite is yours.
- Do not touch monster numbers, ability ranks, the magnitude table's T1 values, or the
  Consort frame's loop.
- Where code and the plan disagree, the code on the branch wins; record the divergence in
  the plan's progress note for that phase.

Finish by writing docs/briefs/day-run-report-2026-10-01.md in the report format at the
end of the brief, commit it, and stop. No PR.
```

---

## Wave 1 — six tasks in parallel

Merge order: **W1-A, W1-B, W1-C (frames and ranges), then W1-F (band logic), then W1-D,
W1-E (data).**

### W1-A — Striker, Squire, Apprentice frame loops · model: opus

```
Implement the Striker (cadence), Squire (cooldown) and Apprentice (dot) frame loops from
docs/briefs/frame-loops-2026-10-01.md §1 on a branch feat/frames-melee-dot off
feat/lineage-data-model. Read design §10 and §18 first.

- Containers are `mechanicEffects` on the three frame nodes per root in
  shared/src/data/skillTree/rootsAndFrames.ts, with new keys named `<root>.frame-*`
  (window ms, bank cap, per-stack scalar, rider) and consumed in the root's prototype
  (server/src/systems/classes/archetypes/<root>/). Light: a timed window after the
  mechanic fires, shorter than one cycle. Heavy: a bank of charge per regular hit, capped
  at threshold−1, spent by the mechanic, plus the rider (Striker stagger via the stun
  ladder at its shortest duration; Squire plating shred through the shared record under
  the §18 max-wins rule). Balanced: both at half.
- Apprentice is by element, not by container: Venom Vessel's first hit on a target with
  no poison applies 3–4 stacks; Ember Mage adds direct damage when hitting a target at
  max burn; Rime-Bound's frost stacks each slow movement and attack speed (reuse the
  existing dot.chill-* keys at frame magnitudes; Winter Warden at T3 keeps deepening the
  same chill — do not duplicate its freeze). Pyromancer's T3 overlap is NOTED in the
  plan's progress note, not resolved.
- Route every damage change through ctx.metadata.empoweredMultiplier. Never a second
  multiplier on one hit.
- HUD: windows as `frame.<root>.window` status effects with data { totalMs }; banks as a
  resource on TracksCombat exposed through the existing buff sync with data { stacks };
  push the existing weapon-glow intent if one exists, else add a `frame-charge` member
  to CombatEvent next to card-fx with { playerId, stacks, max }.
- Tests: server/test/frameLoops.test.ts — window shorter than cycle; bank capped at
  threshold−1 and emptied by the finisher; uptime rises with attack speed on Light; the
  Venom opener applies its stacks once per fresh target; Frost chill scales per stack;
  Ember's max-stack bonus fires only at max.

Related tests + pnpm typecheck; strip CR; commit per root. Report the keys you added and
any prototype seam you could not reach.
```

### W1-B — Slinger, Spirit, Conduit frame loops · model: opus

```
Implement the Slinger (reload), Spirit (energy) and Conduit (summoner) frame loops from
docs/briefs/frame-loops-2026-10-01.md §1 on a branch feat/frames-ranged-summoner off
feat/lineage-data-model. Read design §10 and §18 first.

- Slinger by clip position: Scout's first two rounds of a fresh clip are empowered;
  Marksman's last round of the clip is empowered; Artillerist's attack speed ramps per
  shot with NO cap below the clip length and the top of the ramp adds damage, reset on
  reload. Warmonger (reload-heavy-t3-b) currently owns a capped ramp: leave the path's
  data in place but make the frame's ramp the one that applies (frame wins; note the
  path's planned re-home — "half the ramp carries through a reload" — in the plan).
- Spirit: Spark's discharge chains to nearby targets (reuse the existing AoE/chain
  seams in the energy archetype); Wraith's discharge opens a window of faster energy
  gain; Phantasm banks energy above the cap into the discharge multiplier and the
  discharge staggers.
- Conduit: the mechanic-fired event is the FORMATION CYCLE — every living summon has hit
  since the last fire — emitted from the summoner prototype and routed through
  emitMechanicFired (never the click command). Splinter: a completed cycle on one target
  opens a frenzy window (summon attack speed and on-hit multiplier up). Effigy: each body
  banks charge per hit; when both bodies have hit the same target inside a window the pair
  deals a linked slam with a stagger. Consort: NO loop; leave its stat skew.
- Same routing, HUD and glow rules as W1-A (coordinate on the `frame-charge` event name:
  use exactly `frame-charge { playerId, stacks, max }`).
- Tests: extend server/test/frameLoops.test.ts (or a sibling file if W1-A's branch is
  not visible to you — the conductor will merge) for: Scout's two rounds, Marksman's last
  round, Artillerist ramp uncapped to clip length and reset on reload, Spark chain count,
  Wraith window, Phantasm overcharge; summoner cycle fires once per full cycle and
  mechanicFired.test.ts gains the summoner case.

Related tests + pnpm typecheck; strip CR; commit per root. Report what you did with
Warmonger and any seam you could not reach.
```

### W1-C — Range mechanics and the at-bay layer · model: opus

```
Implement docs/briefs/frame-loops-2026-10-01.md §2 on a branch feat/range-mechanics off
feat/lineage-data-model.

- One helper on the player hit seam: `isAtBay(player, target)` — the target is inside the
  player's reach and outside its own attack range. Lancer (cadence-range-mid), Phalanx
  (cooldown-range-mid) and Enforcer (reload-range-mid) apply a short movement slow on
  every hit while the target is at bay. SLOW ONLY — no knockback, no shove. Phalanx's
  executions at reach stagger; Shade's (energy-range-mid) discharge at reach staggers.
  Warlock (dot-range-mid): a stack applied at reach also lands one stack on an adjacent
  enemy. Procession (summoner) unchanged.
- Far: Phantom-Blade's first hit on a new target from max reach is an opening strike
  (empowered via empoweredMultiplier); Sentinel's execution from max reach opens a
  vulnerability window (shared record, §18 max-wins); Harbinger gets +1 max stack on a
  single target and longer stacks, and Warlock's spread does not apply; Deadeye's shots
  from max range hit harder; Wisp's discharge does not chain and all of it lands on one
  target (coordinate with W1-B's Spark chain: Wisp sets the chain count to zero and adds
  the chained share back to the primary). Harrier unchanged.
- Close nodes: untouched.
- Everything as mechanicEffects on the range nodes in rootsAndFrames.ts (new keys
  `<root>.range-*`), consumed in one new module server/src/systems/combat/rangeMechanics.ts
  registered in initCombatSystems(). Every on-target effect early-returns on
  evadeBlocksDebuffs(ctx).
- Tests: server/test/rangeMechanics.test.ts — at-bay slow applies only inside the band
  and only on the three nodes; Far payoffs fire only from max reach; Harbinger's extra
  stack; Wisp's no-chain.

Related tests + pnpm typecheck; strip CR; commit. Report the keys and the at-bay band
definition you settled on.
```

### W1-D — T2 amplifier row for all twenty lineages · model: sonnet

```
Author the T2 band's amplifier row for every lineage (five weapon, fifteen defensive) on a
branch feat/t2-amplifiers off feat/lineage-data-model. Read design §4 and §17, and the
existing T1 cards in shared/src/data/lineages/*.ts.

- One amplifier card per lane per lineage, tier 2, row 'amplifier', `modifies` = that
  lane's T1 payoff card id. An amplifier changes HOW the owned payoff fires: longer
  duration, a second target, an extra trigger kind, more stacks. Express it only with the
  existing TriggerKind / PayoffKind vocabulary and the magnitude table's amplifier
  scalar; if a lane cannot be amplified with the vocabulary, say so in the report rather
  than inventing a kind.
- fx keys: reuse the payoff's key; the client draws amplified payoffs bigger or on a
  second target from the same handler (W1-F owns the client side).
- Extend coverage.test.ts: every lineage has exactly one amplifier per lane at T2;
  every amplifier's `modifies` names a T1 payoff of the same lane and lineage.
- Add the T2 unlock levels for the amplifier row to lineageMasteryLevelForRow if they
  are not already there (design §4: L2 stat, L3 payoff, L5 amplifier, gate L6 within the
  tier). Do not touch T1 magnitudes.

Related tests + pnpm typecheck; strip CR; commit per slot. Report the sixty card ids and
any lane you could not amplify.
```

### W1-E — Re-homed forms, T2 families and T2 blends · model: sonnet

```
On a branch feat/rehoming-t2-families off feat/lineage-data-model:

1. Re-home the fourteen roots in design §18's approved table (it is in the brief
   docs/briefs/day-run-progression-2026-10-01.md under "Re-homing table") as second
   doors on their lineages: add a LineageForm { recipeId, tier, biome, capstone } to each
   named lineage file, one capstone each that adds a verb in the form's lane with an
   existing LineageFxKey (add keys only if a lane truly has none). Then remove the matching
   ids from UNCROWNED_LANES / the weaponReachability allowlist and make sure
   server/test/weaponReachability.test.ts and a new itemReachability.test.ts (armor,
   recovery, mobility) pass with NO allowlisted ids. Gravewalker Boots → Plains Fleet is
   flagged "weakest fit" — implement it and note it.
2. T2 families in shared/src/data/families/: Jungle — Ape (jungle-ape, silverback,
   apex-silverback; drops Empowered), Undergrowth (jungle-snake, jungle-blowdarter,
   emerald-constrictor, thornback-lizard; drops Affliction), Stalker (jungle-stalker,
   canopy-harrier, hunting-panther; drops Engagement). Desert — Basilisk (stone-basilisk,
   desert-basilisk, dune-basilisk; drops Empowered), Scorpion (sand-scorpion, sand-viper;
   drops Control), Stalker (dune-stalker, dune-tyrant; drops Kill chain; T3+ only).
   `punishes` per design §12's table logic. Partition test extended to T2 pools.
3. Blends for every T2 node in shared/src/world/map/regionT2.ts (starter biomes use
   their existing T1 families, which already list their T2 mobs; Jungle and Desert use the
   new ones; Desert at T2 has two families, so its blends are two-way). Extend
   variantBlend.test.ts to assert T2 blends sum to 1 and resolve to live families.

Related tests + pnpm typecheck; strip CR; commit per step. Report the fourteen forms, the
family partition result, and the T2 node count per biome.
```

### W1-F — Band collapse, stat absorption, amplifier rendering · model: opus

```
Implement design §4's "Keep the screen the same size" on a branch feat/band-collapse off
feat/lineage-data-model:

- Stat absorption: when a form of tier N+1 is worn, the tier-N stat row's resolved
  effect folds into the worn form's base stats (apply at recalc in
  shared/src/systems/stats.ts step 2b: the absorbed row contributes once, as part of the
  form, and the tier-N stat row is no longer selectable). Tests in lineageEconomy.test.ts.
- Band collapse in client/src/ui/lineage/LineageTreePanel.tsx: bands below the worn
  form's tier render as one summary line ("T1: Keen Edge, Rend") expandable to reslot;
  the worn tier's band is lit; the next tier is a silhouette (already exists). Amplifier
  rows render with the existing card component; `modifies` draws a short connector to the
  modified card.
- Client FX: an amplified payoff draws the same handler bigger or on the second target —
  read `stacks`/`targetId` from the card-fx event; no new keys.
- The build readout names the amplifier picks.

pnpm typecheck + client tests; strip CR; commit. Report the UI states you added.
```

---

## Wave 2 — two tasks, after the wave 1 merge

### W2-A — Lane bench rerun on the new map · model: opus

```
On a branch feat/bench-rerun off feat/lineage-data-model, rerun the §1.5 lane bench
(reports/progression-phase1/, LANE_REPLAY is gone — run it fresh) with: the five new T1
mobs and their families in every blend, the trigger-rate-normalised magnitudes, T2
blends, and the three reference profiles per frame now that frames have loops. Write
reports/progression-phase1/lane-matrix-2026-10-01.md with the uplift table (per design
§18 item 3: uplift over the lane-less control on the lane's favoured node), the §9
encounter check per family including the five new families, and a frames column (Light /
Balanced / Heavy uplift per root now that loops exist). Do not change any magnitude.
Report the off-budget list and whether every packet now has a favouring T1 node.
```

### W2-B — Live-bot run · model: opus

```
On feat/lineage-data-model (no branch; read-only on code), bring Docker up (`pnpm db:up`),
run the live Striker T1 and T2 Forest routes with the lineage route steps (unlockCard,
setActive) for 40 minutes each at the 25x dev reward multiplier, and record
combat.fights, time-to-first-card, swaps-per-session and gate-paid from the gameplay
telemetry. Note that 25x makes it non-canonical for economy. Bring Docker down after.
Write the numbers into docs/recovery-current-state.md §8 (fights) and a new section in
docs/lineages-current-state.md (card telemetry). Commit the docs only. Report the numbers.
```

---

## Wave 3 — conductor

Merge wave 2, full suite, `/code-review high` on the branch diff vs develop, fix CONFIRMED
correctness findings, write `docs/briefs/day-run-report-2026-10-01.md`:

```
# Day run report — 2026-10-01
## Branch state  (hash, merged/unmerged tasks, typecheck, suite N/N)
## What to playtest (numbered; now includes: pick a frame and watch its loop; stand at
   reach with a melee Mid node and watch the at-bay slow; pay a T2 gate and see the
   band collapse; buy an amplifier)
## Divergences from the brief
## Bench (W2-A tables unedited) and live bot (W2-B numbers unedited)
## Code review
## Open for the designer (Consort loop; Pyromancer/Warmonger re-home; Gravewalker fit;
   any lane an amplifier could not express; anything else)
```

---

## Re-homing table (approved 2026-10-01)

| Root recipe | Lineage | Tier | Door biome |
|---|---|---|---|
| desert-sunsteel-cross | broadsword | 2 | desert |
| tundra-permafrost-maul | hammer | 3 | tundra |
| tundra-rimebrand | dagger | 3 | tundra |
| jungle-vest-t2 | bindings (forest armor) | 2 | jungle |
| desert-vest-t2 | robe (plains armor) | 2 | desert |
| tundra-vest-t3 | plate (mountain armor) | 3 | tundra |
| jungle-charm-t2 | heartroot (forest recovery) | 2 | jungle |
| desert-charm-t2 | stone (plains recovery) | 2 | desert |
| tundra-charm-t3 | barrier (mountain recovery) | 3 | tundra |
| trench-charm-t4 | pulse (cave recovery) | 4 | trench |
| tundra-boots-t3 | treads (mountain mobility) | 3 | tundra |
| volcanic-boots-t3 | wing (cave mobility) | 3 | volcanic |
| trench-boots-t4-treaders | marsh (swamp mobility) | 4 | trench |
| graveyard-boots-t4 | fleet (plains mobility) | 4 | graveyard — weakest fit, review |

Lineage ids above are the fifteen defensive lineage ids from the overnight run
(`robe bindings plate hide wrappings · stone heartroot barrier pulse eye · fleet wraps
treads wing marsh`); check the actual ids in shared/src/data/lineages/ before authoring.
