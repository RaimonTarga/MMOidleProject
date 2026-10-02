# Run 3 — everything left before the playtest (2026-10-01)

**Read by:** the conductor session. Paste the "Conductor prompt" into a fresh session in
`../mmo-lineages` on `feat/lineage-data-model`, **after** the day-run conductor has
committed `docs/briefs/day-run-report-2026-10-01.md` (check `git log -1`).
**Authority:** `design_docs/progression-rework-design.md` (§4 keystones as amended, §18,
§19 ability nodes), `docs/briefs/frame-loops-2026-10-01.md`,
`docs/progression-rework-plan.md`, the two previous reports
(`overnight-report-2026-10-01.md`, `day-run-report-2026-10-01.md`).
**Goal:** the designer plays once, after this, with every system in. So: the T3 keystone
and T4 cross rows on all twenty lineages; T3 and T4 families and blends; ability nodes
(T1 packet, T2 amplifier) on all twenty-two abilities; the tutorial teaching the tree;
the harness follow-ups; a benched, provisional player pool raise; shard drops re-mapped
where the bench is clear; a monster stat proposal table; the known gaps closed; docs
folded. Then a report.

**Not in scope:** monster stat changes (propose only), the Consort loop, the T3 class
review (tag the paths, change nothing), ability keystone/cross rows.

---

## Conductor prompt

```
You are the conductor for an implementation run. Working directory is ../mmo-lineages on
branch feat/lineage-data-model. Confirm `git log -1` is at or after the commit of
docs/briefs/day-run-report-2026-10-01.md; if that report is not committed yet, stop and
say so. Read docs/briefs/run3-progression-2026-10-01.md in full, then
design_docs/progression-rework-design.md (§4, §18, §19), docs/progression-rework-plan.md,
and both previous run reports for what the code looks like now.

Run the waves in the brief: one subagent per task, the brief's prompt verbatim, the model
it names, its own worktree. Harness worktrees have no node_modules and installs are
forbidden: pre-build each worktree as the previous conductors did (pnpm store junctioned
from ../mmo-lineages, @mmo-idle/* links repointed to the worktree's own packages, verified
by a typecheck). Tasks of a wave run in parallel; merge each wave into
feat/lineage-data-model in the brief's order, resolve conflicts yourself, run
`pnpm typecheck` and `pnpm test` before the next wave. A failing task gets up to an hour of
your fixing; otherwise leave its branch unmerged and record why. If a rate limit cuts a
wave, resume from the commits on the task branches; never redo committed work.

Hard rules for you and every subagent:
- Never install anything. Never push. Never rebase, reset --hard, force, or amend. Commit
  often on the task branch; attribution line from the session's system reminder.
- Strip carriage returns from touched files before committing.
- No Postgres/Redis in tests. Only W2-C (pool bench) and W2-A (harness) run anything long,
  and both are in-process; nothing in this run needs Docker.
- Do not change monster stats, ability ranks, or the T1/T2 magnitude values. The pool
  raise (W2-C) is the one numeric change, committed PROVISIONAL and flagged.
- Code on the branch wins over the plan sketch; record divergences in the plan's progress
  notes.

Finish by writing docs/briefs/run3-report-2026-10-01.md in the brief's report format,
commit it, stop. No PR.
```

---

## Wave 1 — six tasks in parallel

Merge order: **W1-A (keystone runtime), W1-B (T3/T4 cards + path tags), W1-D (ability
nodes), W1-C (T3/T4 families), W1-E (tutorial), W1-F (gaps).**

### W1-A — the eight keystones (runtime) · model: opus

```
Implement the eight packet keystones from design §4 (amended 2026-10-01: one keystone per
packet, shared by every lineage that carries the lane in any slot) on a branch
feat/keystones off feat/lineage-data-model. Read design §4, §6, §18 and the day-run
report's runtime notes first. A keystone is the ONE bespoke row: it changes a rule, so
each is a small named module under server/src/systems/combat/keystones/, registered from
lineageCards' listener setup, active when the player's active `keystone` row card of that
lane is owned-and-active in any lineage.

| Packet | Keystone | Rule |
|---|---|---|
| tempo | Chain | an echo-hit keeps re-triggering until a hit misses (evade) or no fresh target is in reach; each link is one echo-hit payoff at the lane's magnitude |
| empowered | Shockwave | the mechanic's hit (the hit that consumed the empowered flag) becomes an area hit around the target, using the Sweep/aoe seam at the lane's magnitude share |
| affliction | Festering | the player's DoT stacks on a target do not tick down their duration while the player has hit that target within the last tick interval |
| control | Ladder | hitting a target that carries the player's slow applies a root; hitting one that carries the player's root applies a stun; each step once per target per engagement; stun ladder durations |
| kill-chain | Refund | a kill readies the mechanic: cadence counter to threshold, cooldown recharge cleared, reload completed, energy to cap, dot: next hit counts as max stacks |
| engagement | Always First | the first hit on each new target counts as mechanic-fired (emits it, does not set the empowered flag) |
| bulwark | Immovable | stationary DR and plating stacks persist 2 s after the player moves; knockback, pull and drag on the player are refused while either is live |
| barrier-tempo | Unbroken | barrier recharge is not interrupted by hits while HP is above 50% |

Rules: route damage through ctx.metadata.empoweredMultiplier only; every on-target effect
early-returns on evadeBlocksDebuffs(ctx); card-fx per application with the keystone's
own LineageFxKey (add `<lane>.keystone` keys, eight, and a client handler each in
combatFx.ts that draws the lane's grammar larger). Tests:
server/test/keystones.test.ts, one block per keystone, asserting the rule and its bound
(Chain stops on evade; Shockwave hits only in radius; Festering resumes decay when hits
stop; Ladder climbs once per step per target; Refund readies each root's mechanic;
Always First emits once per target; Immovable refuses a knockback; Unbroken keeps
recharging). Related tests + typecheck; strip CR; commit per keystone. Report any
keystone you could not express and the seam you used for each.
```

### W1-B — T3 keystone and T4 cross cards, and T3 path packet tags · model: sonnet

```
On a branch feat/t3-t4-bands off feat/lineage-data-model:

1. For every lineage (five weapon, fifteen defensive) author the T3 band's `keystone` row:
   one card per lane, `row: 'keystone'`, tier 3, naming the lane's shared keystone from
   design §4 (the card's effect IS the keystone; its name/description/fx are the
   lineage's own flavour of it; `fx: '<lane>.keystone'`). And the T4 band's `cross` row:
   one card per lane, `row: 'cross'`, tier 4, `borrowsLane` = each of the lineage's other
   two lanes is a separate card (so two cross cards per lane slot is wrong — author ONE
   cross card per lane whose borrowsLane is the lane it borrows; three per lineage, each
   borrowing a different other lane), magnitude from ROW_SCALAR.cross. Unlock levels
   per design §4 within the tier's band.
2. Coverage test: every lineage has one keystone card per lane at T3 and one cross card
   per lane at T4; every keystone card's lane has a runtime module (import the registry
   W1-A exposes; if W1-A is not visible on your branch, assert against the eight packet
   ids and the conductor will reconcile).
3. Tag every T3 class path (shared/src/data/skillTree/t3*.ts, 54 nodes incl. Conduit) with
   `packet: PacketId` chosen from its description, PROVISIONAL, so the keystone handoff
   (design §4: the item keystone and the class path name the same lane) is checkable. Add
   a test that every lane carried by a root's frames has at least one T3 path tagged with
   it, and list the misses in the report rather than forcing tags.

Related tests + typecheck; strip CR; commit per step. Report the card counts and the path
tag table.
```

### W1-C — T3 and T4 families and blends · model: sonnet

```
On a branch feat/t3-t4-families off feat/lineage-data-model, extend
shared/src/data/families/ to the T3 and T4 pools of every biome (starter biomes' T3/T4
members join their existing families where the role matches; Tundra, Volcanic, Trench,
Graveyard, Wasteland and any other T3+ biome get two or three families each, partitioned
by the role comments in shared/src/data/monsters/*.ts and the ecology doc's role grids).
Drops: assign the shard of the lane the family's SHAPE should favour (slow heavy bodies →
Empowered; many short-lived bodies → Tempo or Kill chain; ranged openers → Engagement;
DoT-heavy → Affliction is the lane that answers them, not the lane they punish — think
"what beats this family"), and mark every T3/T4 assignment PROVISIONAL in the file
header. Then author blends for every T3 and T4 normal node in regionT3.ts / regionT4.ts
(same 70/20/10, 20/70/10 … pattern; two-way where a biome has two families). Partition
test and variantBlend test extended to T3/T4. Related tests + typecheck; strip CR; commit
per biome. Report families per biome and node counts.
```

### W1-D — ability nodes, T1 packet and T2 amplifier · model: opus

```
Implement design §19 (ability nodes keyed to packets, data-only first version) on a branch
feat/ability-nodes off feat/lineage-data-model. Read §19, the ability roster in
shared/src/abilities.ts (family technique/guard, tags), and the lineage card runtime.

- Data: shared/src/data/abilityNodes/ — for each of the 22 abilities, a T1 `packet` node
  with three options and a T2 `amplifier` node with three options (one per chosen packet's
  amplifier axis). Techniques offer three of the six offensive packets, chosen to fit the
  ability (a control ability offers Control, Tempo, Engagement; a burst one Empowered,
  Kill chain, Affliction…); Guards offer the three faces (avoid → engagement-dr /
  speed-window, sustain → recovery-window / ward, endure → plating-stack), per the
  ability-design axiom that defence never scales with offence. No literal numbers: the
  node's payoff share comes from a new ABILITY_NODE_SHARE column in magnitudes.ts.
- State: `UsesSkills`-adjacent persisted slice `abilityNodes: Record<abilityId, {owned:
  string[]; active: Partial<Record<'packet'|'amplifier', string>>}>` (component-shaped,
  no migration expected; verify hydration). Unlock on the ability's home tier band with
  Global Mastery like lineage rows; cost essence plus the packet's shard.
- Runtime: when an ability with an active packet node lands (Technique) or casts (Guard),
  fire the packet's payoff at the share through the existing lineage payoff dispatcher;
  the amplifier node applies its axis the way lineage amplifiers do. One card-fx per
  application with the ability's packet fx key.
- Protocol: `ability:unlockNode`, `ability:setNode`, result on `lineage:result`'s shape
  under a new `ability:nodeResult`. Intent helpers; no direct emits.
- Client: nodes render on the Abilities panel with the lineage card component, two rows.
- Tests: abilityNodes.test.ts — unlock/set paths, Technique restricted to offensive
  packets, Guard to faces, payoff fires once per landing/cast, amplifier axis applies.
Related tests + typecheck; strip CR; commit per layer. Report the per-ability packet
offers you chose.
```

### W1-E — tutorial beats · model: opus

```
On a branch feat/tutorial-tree off feat/lineage-data-model, restore what the removal of
the weapon upgrade beats took from the guided T1 tutorial (docs/guided-tutorial-plan.md,
the bot-validated scripts): a "first card" beat after Forest level 2 (open the Rapier
tree, buy Quick Wrist), a "shards" beat that names where Tempo shards drop, a "gate" beat
at the Forest boss (the capstone material, pay the gate, see the T2 band), and a
"frames" line pointing at the frame-charge glow. Scripts must pass the bot validation the
plan describes. Typecheck + the tutorial tests; strip CR; commit. Report the beats and
their validation status.
```

### W1-F — known gaps · model: sonnet

```
On a branch feat/gaps off feat/lineage-data-model, close the carried gaps from the two
reports: (1) previewEquipmentStats and the stat sheet / swap preview include active
lineage cards; (2) defensive FX keys: give each defensive lineage's capstone its own key
so two lineages crowning one lane differ on screen (data + handler); (3) remove the
vestigial `modifier` field from T1 nodes, re-cut the T1 mask to 25 normal cells and trim
the Cave/Swamp blends to five each (update validation tests); (4) shard icons in the
materials panel and the map node info instead of text glyphs (reuse economyIcons /
UI_icons if a fitting frame exists, else a lane-coloured glyph component); (5) the
materials panel groups shards and capstones and hides zero rows. Related tests +
typecheck; strip CR; commit per gap. Report what each gap needed.
```

---

## Wave 2 — three tasks, after the wave 1 merge

### W2-A — harness follow-ups, drops remap, monster proposals · model: opus

```
On a branch feat/bench-followups off feat/lineage-data-model:
1. Eighteen reference profiles (three frames per root) in bot/src/tierEntry/profiles.ts;
   a two-card swap route (buy a second card in a row, flip twice); farmBlocked raises a
   named stall on any unsatisfiable requirement including a Global Mastery shortfall the
   farm biome cannot fix. Tests for each.
2. Rerun the lane bench with the frames column and T1–T2 blends; write
   reports/progression-phase1/lane-matrix-run3.md under design §18.9's criterion.
3. Where the bench is CLEAR (favoured lane ranks last on the family's own 70/20/10 node
   with both seeds agreeing, and one other lane ranks first with both seeds), move the
   family's `drops` to the lane that beats it (design §18 3b), commit per family with the
   evidence in the message. Where it is not clear, leave it.
4. Write reports/progression-phase1/monster-proposals-run3.md: for every family whose
   favoured lane still ranks last after step 3, and for Plains under-pressure, a table of
   proposed stat edits (mob, stat, from, to, why) that would let the family express its
   shape. APPLY NOTHING; the designer owns monster numbers.
Report the frames column, the remaps made, and the proposal table.
```

### W2-B — docs fold · model: sonnet

```
On a branch feat/docs-fold off feat/lineage-data-model: fold every shipped phase into
current-state pages — docs/lineages-current-state.md (bands, rows, keystones, cross,
re-homed forms, ability nodes), docs/variants-current-state.md (families T1–T4, blends,
shards, capstones, drops rule), a new docs/frames-current-state.md (loops and range
mechanics, from the frame brief), docs/recovery-current-state.md (flat model, pool raise
if W2-C lands first — otherwise leave a pointer); archive docs/progression-rework-plan.md
phases 0–5 content into docs/archive/ with the ARCHIVED header once their current-state
pages exist, keeping the plan page as a short status index; update docs/README.md,
docs/system-rework-status.md, design_docs/design-bible.md §1 (recovery is flat; heal cap
retired) and §4 (packets/families vocabulary). Nothing but docs. Strip CR; commit per
page. Report what each page says is provisional.
```

### W2-C — player pool raise, benched and provisional · model: opus

```
On a branch feat/pool-raise off feat/lineage-data-model, implement Phase 0 call four:
add GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER (seeded 1.25 / 1.30 / 1.35 / 1.40 for T1–T4,
1.0 for T0) applied to base max HP and to armor maxHp at recalc (stats.ts, one place,
tested), with RECOVERY_REFERENCE_POOL_BY_TIER left untouched (recovery must not scale
with it — that is the point). Bench three factors per tier (1.0, the seed, 1.5) against
each tier's bosses with the reference profiles: time-to-death versus kill time per lane,
and fight-end HP on normal nodes as a sanity column. Pick per tier the factor where
median boss time-to-death exceeds median kill time for the pure lanes without pushing
normal-node fight-end HP above 0.8. Commit the picked factors with PROVISIONAL in the
message and the table in reports/progression-phase0/pool-raise-run3.md. Report the table.
```

---

## Wave 3 — conductor

Merge wave 2, full suite, `/code-review high` on the branch diff vs develop, fix
CONFIRMED correctness findings, write `docs/briefs/run3-report-2026-10-01.md`:

```
# Run 3 report — 2026-10-01
## Branch state (hash; merged/unmerged; typecheck; suite N/N)
## What to playtest (numbered, the whole arc: craft, first card, shards on the map, the
   frame loop, at-bay, the gate, the T2 band, an amplifier, an ability node, a T3
   keystone in the test room, a T4 cross in the test room, the pool raise on a boss)
## Divergences from the brief
## Bench: frames column, drops remapped, monster proposal table, pool-raise table
## Code review
## Open for the designer (Consort; T3 path tags; provisional T3/T4 families; pool
   factors; ability packet offers; anything a task could not express)
```
