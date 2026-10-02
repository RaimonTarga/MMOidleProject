# Ability pass — run brief: roster cuts, re-homes, ability keystones, T3 path re-homes (2026-10-02)

**Read by:** the conductor session. Paste the "Conductor prompt" into a fresh session in
`../mmo-lineages` on `feat/lineage-data-model` **at or after the merge of
`balance/t1-boss-pass`** (`docs/briefs/t1-boss-pass-2026-10-02.md` step 9) plus the docs
commit that carries this brief. The run does not start before that merge: its hard
constraint is measured against the boss pass's numbers.
**Authority:** `design_docs/progression-rework-design.md` §22 (as expanded 2026-10-02; §22.1–§22.6
are the decisions, all locked with the designer), §4, §6, §19; `docs/briefs/frame-loops-2026-10-01.md`
§1 (the frame containers the T3 re-homes must not duplicate); `docs/abilities-current-state.md`
(the shipped ability system, including reference wiring and pricing);
`shared/src/data/abilityNodes/` (the generic node tree the keystone and cross rows extend);
`docs/briefs/t1-boss-pass-report-2026-10-02.md` (the boss pass's numbers and the abilities
its tuning leaned on).
**Goal:** after this run the roster is eleven Techniques and eight Guards (§22.2 with the
§22.8 additions Sidestep and Cull, Snipe at T2), casts follow the §22.9 rule, every
survivor has four node rows (packet, amplifier with a cast axis, keystone, cross) with its bespoke keystone
verb live in combat (§22.4), the offers table carries the Stunning Strike swap (§22.3), the
five T3 paths are re-homed and Justicar retagged (§22.5), names, icons and animations deepen with the rows (§22.7), the tutorial kit wears Slam and
teaches Charge at the Cave, and the T1 lab matrix is within ±5% of the baseline taken at
the start of the run.

**Hard constraint (the whole run is judged on it):** net reference-wiring DPS at T1 stays
within **±5% per class per T1 boss** of the baseline, measured by
`server/scripts/_t1BossLab.ts` (its `dps` column, mean over the same ≥10 seeds, the boss
pass's plan rows with today's tutorial kit). The baseline is taken in wave 0 on the
merged boss-pass tip; the check is re-run after every wave merge and in wave 3. A wave
that breaks it is not merged until it is back inside.

**Not in scope:** magnitudes (`magnitudes.ts`, `ABILITY_NODE_SHARE`, `ROW_SCALAR`),
except the one Slam rank I value the parity rule produces; lineage cards; monster rows;
Recovery; the tutorial beyond the kit table and the Cave recipe line; T2+ boss numbers;
the keystone alternates (appendix, for the next pass); anything that needs the designer
in the room.

---

## Conductor prompt

```
You are the conductor for an implementation run. Working directory is ../mmo-lineages on
branch feat/lineage-data-model, which must already contain the merge of
balance/t1-boss-pass (check `git log --merges -5`; if it is not there, stop and say so).
Read docs/briefs/ability-pass-run-2026-10-02.md in full, then
design_docs/progression-rework-design.md §22 (all subsections), §4, §6, §19,
docs/briefs/frame-loops-2026-10-01.md §1, docs/abilities-current-state.md, and
docs/briefs/t1-boss-pass-report-2026-10-02.md.

Run the waves in the brief: one subagent per task, the brief's prompt verbatim, the model
it names, its own worktree. The ../mmo-lin-w1a, w1b, w1c, w1d2, w2a, w2b worktrees exist
with node_modules junctioned and @mmo-idle/* repointed; ../mmo-lin-w2c too once
design/ability-pass has been merged or its session has ended. Reuse them with fresh
branches after a clean typecheck, as runs 3 and 4 did. Never install. Tasks of a wave run
in parallel; merge each wave into feat/lineage-data-model in the brief's order; resolve
conflicts yourself with a real three-way merge (never a regex over conflict markers; read
the WHOLE merge output, not its tail); run `pnpm typecheck` and `pnpm test` before the
next wave, and the parity check (wave 0's script) after every wave merge. A failing task
gets up to an hour of your fixing, otherwise stays unmerged and is recorded. If a rate
limit cuts a wave, resume from the task-branch commits; never redo committed work.

Hard rules for you and every subagent:
- Never install anything. Never push. Never rebase, reset --hard, force, or amend. Commit
  often; attribution line from the session's system reminder.
- Strip carriage returns only from files you touch, before committing.
- No Postgres/Redis in tests. No Docker in this run.
- No magnitude, lane budget, monster, boss or Recovery number moves. The ONE number this
  run authors is Slam rank I (W1-A), and only through the parity procedure.
- Player ability ids and monster ids collide by name ('frenzy' is also a monster buff,
  'power-strike' a monster attack style): a cut touches player ability data, recipes,
  nodes, wiring, tutorial and tests that attune the ability — never a monster file.
- Code on the branch wins over any sketch; record divergences in the report.

Finish by writing docs/briefs/ability-pass-report-<date>.md in the brief's report format,
commit it, stop. No PR.
```

---

## Wave 0 — baseline (one task, serial, before anything else)

### W0 — T1 lab baseline and the parity script · model: sonnet

```
On a branch feat/ability-pass-baseline off feat/lineage-data-model, take the reference
the whole run is judged against. (1) Find the lab plan the boss pass committed under
reports/t1-boss-pass/ (six classes × five T1 bosses, each class in its tutorial boss kit
from shared/src/tutorial/scripts/plans.ts, ≥ 10 seeds per cell). Copy it to
reports/ability-pass/plan-baseline.json unchanged, and run
`tsx server/scripts/_t1BossLab.ts --plan=... --out=reports/ability-pass/baseline.jsonl
--hitboxes=<the path the boss pass used>` on the current tip. (2) Write
server/scripts/_abilityPassParity.ts (underscore: a throwaway, outside the suite) that
reads two of the lab's JSONL files, groups by (cls, boss), prints mean dps, mean dps8, win
rate and fight count per cell for both files and the % delta of mean dps, and exits
non-zero if any cell's dps delta is outside ±5% or any cell has fewer than 10 fights. Run
it baseline-vs-baseline to prove it reads the format. (3) Record in
reports/ability-pass/README.md the tip hash, the plan, the seeds, and the exact commands,
so every later wave reruns the same thing. Commit. Report the baseline matrix.
```

Merge W0 before wave 1 starts. Every later task that says "parity check" means: rerun the
lab with the SAME plan file but the kit column updated as the brief says (W1-A changes the
kit), write `reports/ability-pass/<task>.jsonl`, run the parity script against
`baseline.jsonl`.

---

## Wave 1 — six tasks in parallel

Merge order: **W1-B, W1-A, W1-C, W1-D, W1-E, W1-F.** W1-B lands the node-row
infrastructure first so W1-A's `abilityNodes.test.ts` edits merge onto it. W1-D and W1-E
both edit `shared/src/data/skillTree/t3CombatA.ts` in different path blocks: keep both
sides. W1-A and W1-C both edit `offers.ts`: W1-A removes entries, W1-C changes one; keep
both.

### W1-A — roster cuts, re-homes, the kit, Slam parity · model: opus

```
On a branch feat/ability-roster off feat/lineage-data-model, apply design §22.2 exactly.

Cuts (player ability data only; see the conductor's id-collision rule): remove Expose
Weakness, Power Strike, Hamstring, Frenzy and Quick Strike from shared/src/abilities.ts,
their recipes from shared/src/abilityRecipes.ts, their rows from
shared/src/data/abilityNodes/offers.ts, their reference-wiring rows from
shared/src/abilityWiring.ts, any ability-icon allowlist entries, and any client fx case
that only they used. Then grep every package for the five ids and fix each hit that
refers to the PLAYER ability: tests that attune them (server/test/*, including the
durability and boss-reference suites), bench specs (server/bench/balance/*Spec.ts,
poolRaise.ts uses 'frenzy'), the bot's build tables, and the tutorial. A bench or test
that attuned a cut ability as "a generic Technique" attunes Slam (casts) or Sweep (armed)
instead; one that tested the cut ability's own mechanic is deleted with a one-line note
in the commit. Monster files, boss patterns, monster buff ids and combat-event kinds that
share the name are NOT touched.

Re-homes (design §22.2 roster table): Slam → T1 Mountain level 5 (it absorbs Power
Strike: author a rank I at T1 that is the single-target-leaning rank, keeping the T2
rank as rank II and so on — the shape is unchanged, cast with a radius); Charge → T1 Cave
level 3 (author rank I at T1); Binding Strike → T2 Jungle level 3 (author rank I at T2);
Imbue Lightning → T3 Volcanic level 3 (author rank I at T3). An ability's ranks are
authored per tier from its home tier, so each move adds exactly one rank at the new home
and re-indexes nothing else; `abilityRanks.test.ts` and `validateAbilities()` must stay
green. Move each recipe to the new biome and level with the biome's own essence colour;
the mid-band rule (level 3 and 5 of the biome's own band) holds.

Saves: extend shared/src/attunementMigration.ts so a save that knows, attunes, wires
(`use-ability` rules with `targetAbilityId`) or holds node progress for a cut ability
drops those entries silently and logs one line per character; `attunement.test.ts` pins
it. A re-homed ability keeps its id, so nothing else migrates.

Tutorial: in shared/src/tutorial/scripts/plans.ts the boss kits for forest, mountain,
swamp and cave swap technique 'expose-weakness' → 'slam' (plains keeps 'sweep'); in
classScript.ts the Cave beat learns 'ability-recipe-charge' instead of
expose-weakness, with its one-line copy rewritten for Charge ("Learn Charge: it closes
the gap and lands the first blow"). `tutorialAnchors.test.ts` and the tutorial suites
stay green.

Slam parity (the run's hard constraint, design §22.1 last bullet and §22.2): with the kit
swapped, rerun the wave-0 lab plan and the parity script. Slam rank I's damageMult (and
only that field; cooldown 10 s and cast 1600 ms stay as Power Strike had them) is the one
number you may move, via the lab's `ap` override on the same seeds until every (cls,
boss) cell's mean dps is within ±5% of baseline.jsonl; then commit that value as the
authored rank I. Expect something between Slam's old 1.75× and Power Strike's 3.0×.
Record each candidate's matrix under reports/ability-pass/w1a-slam-<mult>.jsonl and the
final one as reports/ability-pass/w1a.jsonl. If no single value brings every cell inside,
stop at the value that minimises the worst cell, commit it, and report the cells outside
with their deltas — do not touch any other number.

Additions and reshapes (design §22.8, §22.9): re-home Snipe to T2 Desert 3 with an
authored rank II-equivalent at T2 (its +300 reach, hold-position and the T4 ranks stay).
Reshape Contagion to `armed` (your next hit spreads what the target carries; drop
castMs; the Conduit formation adapter treats it as an armed rider) and Imbue Lightning
to `instant` (drop castMs; the charge window opens on activation; `validateAbilities`
must stay green). Author two NEW abilities with ranks from their home tier, recipes at
the stated biome level in the biome's essence colour, offers.ts rows exactly as §22.8
lists, reference wiring (Sidestep: In Combat → Use Ability; Cull: In Combat → Use
Ability) and attunementCost priced net of it like every other ability, and a placeholder
icon tile until art is generated: SIDESTEP (Guard, instant, T1 Forest 5: an
`evasion-window` plus a short move-speed burst, both from the magnitude table's units,
no number in the ability file beyond the authored rank shape; situational gate: it does
not fire with nothing in reach) and CULL (Technique, cast, T3 Tundra 3: a strike whose
multiplier rises as the target's health share falls, and that refunds its own cooldown
on a kill; Technique Power scales the strike; the threshold curve is the rank's shape).
Neither enters the tutorial kit. Add abilityCull.test.ts (multiplier rises as health
falls; a kill refunds) and abilitySidestep.test.ts (window opens, speed burst ends with
it, no fire out of combat); extend abilityAffliction.test.ts for armed Contagion and
abilityImbue's suite for instant Imbue.
Second review (design §22.10): apply the three revised offers (Binding Strike
Affliction hemorrhage instead of the Technique refund; Snipe Kill chain technique-refund
on kill instead of the Technique refund; Detonate Control slow instead of the Empowered
brand), tag the Kill chain offers of Charge, Contagion, Disengage, Snipe and Cull with
the `kill` trigger, and add the `fire` column to offers.ts from the §22.10 fire-shape
table EXACTLY as the designer left it after review (the table is marked PROPOSED; if it
is still marked so when you start, stop and say so). Each fire-shape maps to an existing
trigger seam; a fire-shape with no seam is a defect to report, not a new primitive.

Update docs/abilities-current-state.md's roster tables (22 → 19, the per-tier tables, the
reference-wiring table, the summoner ownership lists that name cut abilities) and
abilityNodes.test.ts's count (19). Related tests + typecheck; strip CR on touched files;
commit in steps (cuts / re-homes / migration / tutorial / parity). Report the parity
matrix and the Slam value.
```

### W1-B — keystone and cross rows for ability nodes, plus five Technique keystones · model: opus

```
On a branch feat/ability-keystone-rows off feat/lineage-data-model, extend the generic
ability node tree (shared/src/data/abilityNodes/, server/src/systems/combat/abilityNodes.ts,
server/src/systems/player/economy/abilityNodes.ts, client/src/ui/AbilityNodeRows.tsx) with
two rows, per design §22.1:

- `keystone`: one option per ability, bespoke. Add `AbilityKeystoneDefinition` {
  abilityId, id, name, rule, fx } in a new shared/src/data/abilityNodes/keystones.ts,
  mirroring lineages/keystones.ts; the server behaviour is one named module per keystone
  under server/src/systems/combat/keystones/ability/ registered through the existing
  keystone registry pattern (registry.ts) so live and bench harnesses are identical
  (combatBootstrap). The row's price is `rowEssenceCost(tier,'keystone')` plus the shard
  of the ability's ACTIVE packet option (owning a packet option is the prerequisite, as
  the amplifier already requires). Like the lane keystones, a keystone whose rule has no
  magnitude authors a payoff only so coverage.test's "every non-stat row does something"
  holds; one that pays a share of a hit resolves it from the magnitude table at
  ROW_SCALAR.keystone through the existing payoffValue path — no literal anywhere.
- `cross`: derived, no authoring. The option borrows one of the ability's OTHER two
  packet offers at ROW_SCALAR.cross, one option per non-active offer, exactly as a
  lineage cross row borrows a second lane. It needs no new runtime: it is a second
  packet-row payoff at the cross scalar.
- Row tiers: `abilityNodeRowTier` becomes home + {0,1,2,3} clamped at 4 (design §22.1).
  `AbilityNodeRow` and `ABILITY_NODE_ROWS` gain the two members; persisted
  `AbilityNodeProgress.active` already keys by row.
- UI: the Abilities panel shows the two new rows in the same card grammar; the keystone
  card shows the rule sentence; the cross card the borrowed packet's name at the cross
  scalar. HUD: a keystone that opens a window or a stack uses the existing lineage card-fx
  and buff-bar seams (`card-fx` events, buff ids), never a per-tick boolean.
- Cast axis (design §22.9): `AmplifiedAxis` gains `cast` ("shorter wind-up"), offered by
  `nodePayoffAxis` only when the ability's shape is `cast` (or `charge`); it applies
  through the existing `technique.cast-speed-pct` path so the 60% cap holds against every
  source combined. The Technique lane's stat card shows cast speed beside Technique
  Power. A test proves no combination of lane stat, weapon and amplifier shortens a cast
  below 40% of its authored wind-up.
- Second review (design §22.10) applies to every row above: tiers are home + N with NO
  clamp (rows above the current cap fold into the cap band and unfold when the tier
  ships; owned stays owned); a fifth row `keystone2` exists in the union and the
  resolver at home + 4 with NO option authored this run (the second verbs are a later
  wave); the amplifier offers every axis on the active route (second body, longer
  window, bigger payoff, and the cast axis on casts), `nodePayoffAxis` is the default
  only; a Kill chain packet option on a Technique fires on the kill its hit makes, not on
  landing (W1-A tags those offers); `AbilityKeystoneDefinition` carries `delivery:
  'owner' | 'delivering-body' | 'formation'` and the module resolves on that body (Reload:
  keystone echoes are first-hit-only); display names follow the §22.10 grammar through
  `abilityDisplayName` (adjective from the payoff, "of X" from the axis, the keystone's
  noun, ", with Y" from the cross).

Then implement the first five Technique keystones from design §22.4, each its own module,
each with a wiring smoke test in a new server/test/abilityKeystones.test.ts (attach, tick,
assert the rule's observable: the extra hits land / the aggro drops / the root spreads;
never a balance number):
  Sweep WHIRLWIND — Sweep becomes a one-second spin that cleaves every tick (reuse the
    channelled-beam tick machinery and applyPlayerAoe; the spin is interruptible by hard
    control like a cast).
  Slam AFTERSHOCK — the ground erupts again at the same spot one second later (a delayed
    applyPlayerAoe at the resolved cast position; the share from the magnitude table).
  Charge TRAMPLE — the rush hits every body it passes through (a path sweep while
    isChargingAbility moves the player; each body once).
  Contagion OUTBREAK — a body Contagion infected passes its afflictions to its nearest
    neighbour when it dies (tag the infected bodies; on their kill event spread once via
    the affliction toolkit; a body infected by an Outbreak does not re-tag).
  Binding Strike DRAGNET — the root takes every body adjacent to the target (the root
    writer in monsterControl, same duration, each adjacent body once).
Every on-hit application early-returns on evadeBlocksDebuffs(ctx); one multiplier per hit
holds; an area hit of a keystone never counts as an attack-equivalent for Sweep Tempo.
abilityNodes.test.ts gains the row-tier table and the cross derivation; keystones.test.ts
(lineage) is untouched. Related tests + typecheck; strip CR; commit in steps (rows /
cross / each keystone). Report the fx keys you reused and any seam you could not reuse.
```

### W1-C — the Stunning Strike offer swap and the offer coverage test · model: sonnet

```
On a branch feat/ability-offer-coverage off feat/lineage-data-model, apply design §22.3:
in shared/src/data/abilityNodes/offers.ts Stunning Strike offers
['control','slow'], ['tempo','echo-hit'], ['technique','technique-refund'], with the
comment rewritten (a stunned target eats a second hit). Add to abilityNodes.test.ts a
coverage assertion over the SURVIVING roster of design §22.2 (list the ten Technique ids
explicitly so the test is independent of W1-A's merge order): every offensive packet
appears on at least three Technique packet rows, and every Guard row is one avoid, one
sustain, one endure face. The assertion must read the live offers table, so until W1-A
merges it will count the cut abilities too — write it so it filters to the ten named ids.
Add the 'tempo/echo-hit' fx mapping if Stunning Strike needs one (it already exists in
ABILITY_NODE_FX). Related tests + typecheck; strip CR; commit.
```

### W1-D — Squire paths: Reverb, Destroyer; Justicar retag · model: opus

```
On a branch feat/t3-squire-paths off feat/lineage-data-model, apply design §22.5 for the
Squire (cooldown root) in shared/src/data/skillTree/t3CombatA.ts and
server/src/systems/classes/archetypes/cooldown/:

Reverb (cooldown-balanced-t3-a): remove the bank. The execution lands now and lands
again at half strength when its cooldown reaches the halfway mark, on whatever the
player is hitting then (if nothing is in reach at that moment the echo is lost, not
held). Tag stays 'empowered'. The echo is an empowered hit through the normal pipeline so
on-hit and empowered gear apply; one multiplier per hit; HUD a clock on the buff bar
through the existing frame-window seam.

Destroyer (cooldown-heavy-t3-b): retag 'technique'. Regular hits deal normal damage
again (delete the no-damage mechanicEffect and the 5 s cooldown override). When the
execution is ready it waits, primed; the next Technique the player LANDS fires it with
that Technique's shape (an armed rider lands it on the armed hit; a cast lands it on the
cast's target or area — Slam's area, Snipe's range; Contagion/Detonate on their target)
at a higher multiplier than the frame's. Hook on the Technique-resolution seam
(server/src/systems/combat/techniqueResolved.ts) — the same seam `technique-cast` fires
from — never from a Guard. Distinct from the Signature keystone: Signature makes a landed
Technique COUNT as the mechanic (lane payoffs fire); Destroyer makes the mechanic RIDE
the Technique. If a Destroyer also owns Signature, the one execution fires once and
counts once — write that test.

Justicar (cadence-balanced-t3-c): retag 'empowered', comment updated. No effect change.

Rewrite each path's description to the new rule; shared/src/data/skillTree/t3PacketTags.test.ts
and skillTreeMechanicCopy.test.ts stay green. Tests: extend frameLoops.test.ts or add
t3SquirePaths.test.ts — Reverb's echo lands at the halfway mark and is lost with no
target; Destroyer's execution fires on an armed Technique and on a cast Technique with
the cast's shape, and once with Signature. Related tests + typecheck; strip CR; commit per
path. Report any seam the frame brief's containers already occupied.
```

### W1-E — Slinger paths: Duelist, Warmonger · model: opus

```
On a branch feat/t3-slinger-paths off feat/lineage-data-model, apply design §22.5 for
the Slinger (reload root) in shared/src/data/skillTree/t3CombatA.ts and
server/src/systems/classes/archetypes/reload/:

Duelist (reload-light-t3-a): retag 'kill-chain'. Remove the exploding last bullet and
the +1 ammo. New rule: every kill adds one round above the clip's size until the next
reload — the clip grows with the chain; a reload returns it to the authored size. The
ammo counter on the HUD must show the count climbing past max (the networked ammo slice
already carries current and max; mark it dirty, add no boolean). Distinct from the Kill
chain keystone Refund (a kill readies the mechanic = completes the reload): a Duelist
with Refund gets the refill AND the extra round; write that test. Scout's first-two-rounds
opener interacts (more rounds, same opener) and is not touched.

Warmonger (reload-heavy-t3-b): keep the tag 'tempo'. Per the frame brief §1, the
Artillerist frame now owns the per-clip ramp; Warmonger becomes "half the ramp carries
through a reload": on reload the ramp is halved, not reset, so a sustained fight climbs
past what one clip reaches. The barrel-glow charge visual persists through the reload at
the carried value. Numbers come from the frame's existing ramp keys; the path authors
the carry fraction as a mechanicEffect at 0.5 (a shape constant, not a tuning number).

Rewrite both descriptions; t3PacketTags.test.ts and skillTreeMechanicCopy.test.ts green.
Tests: frameLoopsRanged.test.ts or t3SlingerPaths.test.ts — Duelist's clip grows by one
per kill and resets on reload, with and without Refund; Warmonger's ramp after a reload
equals half the pre-reload ramp and keeps climbing. Related tests + typecheck; strip CR;
commit per path.
```

### W1-F — Apprentice path: Pyromancer Radiant · model: opus

```
On a branch feat/t3-pyromancer off feat/lineage-data-model, apply design §22.5 for
Pyromancer (dot-balanced-t3-a) in shared/src/data/skillTree/t3CombatB.ts and
server/src/systems/classes/archetypes/dot/. Keep two stacks per hit at 55%. Remove the
max-stack direct-damage bonus (the Ember Mage frame owns "intensifies", frameLoop.ts).
New payoff RADIANT: a burn tick on a target at max stacks also strikes every adjacent body
for the tick's damage (applyPlayerAoe from the ticking target's position, radius from the
existing adjacency unit in LINEAGE_UNITS; DoT rules apply: no plating, half DR, monster
dotResistance; it applies no stacks and spreads nothing). Distinct from the Warlock range
node (a stack applied at reach also lands one adjacent), from Contagion and from the
Outbreak keystone (all of which move STACKS). Tag stays 'affliction'. Rewrite the
description; t3PacketTags.test.ts and skillTreeMechanicCopy.test.ts green. Test in
frameLoops.test.ts or t3ApprenticePaths.test.ts: at max stacks a tick damages an adjacent
body and applies no stack to it; below max it does not. Related tests + typecheck; strip
CR; commit.
```

After the wave-1 merge: `pnpm typecheck`, `pnpm test`, then the parity check with W1-A's
kit (`reports/ability-pass/wave1.jsonl`). The keystone rows are at T3/T4 and no T1 kit
owns them, so the only expected movement is W1-A's; any other movement is a defect.

---

## Wave 2 — four tasks, after the wave 1 merge

Merge order: **W2-A, W2-B, W2-D, W2-C.** W2-A and W2-B both append to
`shared/src/data/abilityNodes/keystones.ts` and `server/test/abilityKeystones.test.ts`:
keep both sides.

### W2-A — the remaining five Technique keystones · model: opus

```
On a branch feat/ability-keystones-2 off feat/lineage-data-model, implement the remaining
Technique keystones of design §22.4 and §22.8 on the rows W1-B landed, one module each under
server/src/systems/combat/keystones/ability/, one wiring smoke test each in
server/test/abilityKeystones.test.ts:
  Detonate CHAIN REACTION — a Detonate kill detonates every afflicted body in reach (on
    the kill event of a Detonate cast, run the detonate resolution once per afflicted
    body in reach, each once; a body detonated this way does not chain again).
  Disengage VANISH — breaking contact drops you from every nearby monster's aggro until
    your next hit (clear setAggroTarget on monsters in reach of the departure point; mark
    the player; the first player hit clears the mark; monsters do not re-acquire while it
    stands unless the player hits).
  Snipe PIERCE — the shot passes through its target and hits everything in line behind
    it (a line segment from the player through the target to the ability's reach; each
    body once; the share from the magnitude table).
  Stunning Strike RELAY — when the stun ends it jumps to the nearest body not yet stunned
    this fight (on the stun's expiry, applyStun on the nearest un-relayed body; a per-
    fight set in TracksCombat; post-stun immunity still applies to the first body).
  Imbue Lightning FORK — every imbued hit arcs to the nearest other body (an echo at the
    share to the nearest body other than the target, spending no extra charge).
  Cull HARVEST — a Cull kill lands the same strike on the nearest body below the same
    health share and keeps going while it keeps killing (each body once per Cull; Chain
    Reaction spends afflictions, Harvest spends health — write the test that a body both
    could take is taken once).
Same rules as W1-B: evadeBlocksDebuffs on every application, one multiplier per hit,
keystone area hits are not attack-equivalents, fx through existing card-fx keys. Related
tests + typecheck; strip CR; commit per keystone.
```

### W2-B — the seven Guard keystones · model: opus

```
On a branch feat/guard-keystones off feat/lineage-data-model, implement the Guard
keystones of design §22.4 and §22.8 on the rows W1-B landed, one module each, one wiring smoke test
each in server/test/abilityKeystones.test.ts. Defence never scales with offence and a
Guard never deals damage: these grant immunity, control the attacker, or share a mend.
  Second Wind SHARED BREATH — the mend also runs on your summons and same-node party
    members (the Recovery engine's `skill` source applied to each, at the owner's
    fraction; summons through the minion mitigation sync, party through InParty).
  Cleanse IMMUNITY — the affliction kind you stripped cannot be reapplied for a few
    seconds (a status on the player keyed by the stripped kind; appliers of that kind
    early-return while it stands; duration from the magnitude table).
  Brace RIPOSTE — a melee hit absorbed while Braced staggers the attacker (the control
    ladder's shortest rung on the attacker, once per attacker per Brace).
  Bramble Guard ENTANGLE — a body that hits you while brambled is slowed (monsterControl
    movement slow, totalMs in the status data for the buff clock).
  Endure UNYIELDING — you cannot be hard-controlled while Endure is up (the player hard-
    control list's appliers early-return; roots too; an existing control is not removed).
  Break Free BACKLASH — breaking free staggers every adjacent body (shortest rung, each
    body once).
  Recuperate OVERFLOW — healing past full becomes a ward (the overheal-ward hook; the
    ward's cap from the magnitude table's ward unit).
  Sidestep AFTERIMAGE — a hit you dodge during the window leaves an afterimage the
    attacker keeps swinging at until it is struck (a decoy marker the monster's target
    resolves to, via setAttackTarget/setAggroTarget; one afterimage at a time; it takes
    no damage and deals none; struck = the attacker's next hit resolves on it, then it
    clears and the monster re-acquires).
Related tests + typecheck; strip CR; commit per keystone.
```

### W2-C — docs and the panel copy · model: sonnet

```
On a branch feat/ability-pass-docs off feat/lineage-data-model (after W1 merged), bring
the living docs to the code: docs/abilities-current-state.md (roster 17, the node rows now
four with their tier rule, the keystone table with a pointer to design §22.4, the kit and
Cave beat change, the migration rule for cut abilities), docs/lineages-current-state.md if
it describes the ability node rows, docs/skill-tree or class current-state doc for the
five re-homed paths and the Justicar retag, docs/guided-tutorial-plan.md for the kit
swap, and docs/README.md for anything new. Check every ability id in client copy
(client/src/hud/statusHelp.ts, client/src/ui/conceptIcons.ts, shared/src/data/mechanicLabels.ts, the tutorial copy) and the admin
character tab for the five cut ids. Do not write what the code does not do; if W2-A/W2-B
are not merged yet, document the rows and point at §22.4 for the verbs. Strip CR; commit.
```

### W2-D — flavor progression: names, composed icons, keystone animations · model: opus

```
On a branch feat/ability-flavor off feat/lineage-data-model (after W1 merged), implement
design §22.7 so that an ability's identity deepens with its rows:

Names: a shared helper (shared/src/data/abilityNodes/flavor.ts) derives the display name
from the ability's active rows — the packet row prefixes the lane's own word (from the
packet definitions, e.g. "Bleeding Sweep", "Drilled Sweep"), the amplifier adds its axis
qualifier, the keystone renames the ability to the keystone's name with the base name as
the lineage line beneath, the cross row yields the compound ("Bleeding Whirlwind").
Rank numerals stay after the name. `abilityDisplayName` becomes the one entry point;
the hotbar, the Abilities panel, tooltips, the buff bar and the tutorial copy all read
it. Nothing authored per ability: a test proves every (ability, row combination) yields
a non-empty, number-free name.

Icons: client/src/ui/abilityIcons.ts composes at runtime from existing atlases — base
glyph; packet row = lane colour tint or frame (the lane colours in the lineage theme);
amplifier = a small axis overlay glyph; keystone = a border treatment plus, where
§22.4's rule has a silhouette (spin, line, fork, shell), a second glyph layered over the
base from the existing concept/lane icon set. No new PNGs; never edit packed atlases.
The composition is a pure function of (ability, active rows) and is unit-tested at the
shared level for the layer list it emits.

Animation: the packet row already draws the lane's fx (ABILITY_NODE_FX); the amplifier
scales or extends it (longer trail, second echo) through the same card-fx event with the
axis in its data; each keystone owns ONE bespoke animation on the client, keyed by the
keystone id, in the premium grammar of docs/combat-animation-current-state.md (readable
wind-up, visible payoff, lasting mark where the rule leaves one: Aftershock's cracked
ground, Vanish's fading outline, Riposte's stagger flash, Shared Breath's pulse down the
formation). Server emits the keystone's event through world.pushEvent with the keystone
id; no per-tick booleans. Guards use the face grammar (blur / pulse-shell / chips).

Scope: all 19 abilities' names and icons; keystone animations for every keystone merged
by the time you start (W1-B's five at least; add the rest if W2-A/W2-B have merged, else
leave a keyed stub that draws the lane fx and list them). Related tests + typecheck;
strip CR; commit in steps (names / icons / animations). Report the layer list per
keystone and any keystone whose silhouette you could not express from existing glyphs.
```

After the wave-2 merge: `pnpm typecheck`, `pnpm test`, parity check
(`reports/ability-pass/wave2.jsonl`).

---

## Wave 3 — conductor

1. Final parity: rerun the lab plan on the tip, `reports/ability-pass/final.jsonl`, the
   parity script against `baseline.jsonl`. Every cell inside ±5% or the report says which
   are not and by how much. Also report win rate per cell next to the boss pass's own
   matrix, so the designer sees whether the kit swap moved any pairing across the 70%
   floor.
2. `pnpm typecheck` (all packages, plus `typecheck:bench` and `typecheck:test`), `pnpm
   test`; record N/N and the time.
3. Report (format below). Commit it. Stop.

---

## Tests the run must leave green or add

- `abilityNodes.test.ts` (count 19, four rows, tier rule, cast axis, cross derivation, offer
  coverage), `abilityRanks.test.ts`, `abilityWiring.test.ts`, `attunement.test.ts`
  (migration of cut ids), `coverage.test.ts` (unchanged), `keystones.test.ts` (unchanged),
  new `abilityKeystones.test.ts` (17 wiring smokes), `t3PacketTags.test.ts`,
  `skillTreeMechanicCopy.test.ts`, `frameLoops.test.ts` / `frameLoopsRanged.test.ts` or
  the new per-root path tests, `tutorialAnchors.test.ts`, `abilitySlam.test.ts` (Slam at
  T1 rank I), `abilityCharge.test.ts` (Charge at T1), new `abilityCull.test.ts` and
  `abilitySidestep.test.ts`, armed Contagion and instant Imbue in their suites, every durability and boss-reference
  suite that attuned a cut ability.
- Each task: related tests + `pnpm typecheck` before commit; the conductor runs the full
  suite after each wave merge (`pnpm test`, ~4–6 min).

## Report format

```
# Ability pass report — <date>
## Branch state (hash; merged/unmerged per task; typecheck; suite N/N and time)
## Parity: baseline vs final matrix (cls × boss: mean dps, Δ%, win rate), the Slam rank I
   value and its candidate ladder, any cell outside ±5% with the reason
## What to playtest (the 17 verbs: where each unlocks, what to look for; the kit swap;
   Charge at the Cave; the five path changes)
## Divergences from the brief
## Keystones: per keystone the seam reused, the fx key, the icon layers and the animation, and anything that needed a seam
   the vocabulary did not have
## T3 paths: per path the old and new description, the tag, the test
## Code review (a self-review pass over the merged diff: every hook early-returns on
   evadeBlocksDebuffs, no second multiplier on one hit, no per-tick HUD booleans, no
   number outside Slam rank I)
## Open for the designer (names to confirm; alternates not taken; anything provisional)
```

---

## Appendix — the second verbs (Keystone II, design §22.10; designed, implemented in a later wave)

Technique: Sweep *Reap* (a Sweep kill cleaves again from the body it killed); Slam
*Tremor* (every body hit is staggered); Charge *Breakthrough* (arriving staggers the
target); Contagion *Carrier* (afflicted bodies infect what touches them); Binding Strike
*Impale* (a rooted target cannot attack you while you stand at max reach); Detonate *Fuse*
(the detonation lands a second later, doubled on a body still afflicted); Disengage
*Parting Shot* (also arms the next hit as an opening strike); Snipe *Mark* (the sniped
body takes your next Technique as if from max reach); Stunning Strike *Concussion* (an
area stun, shorter); Imbue Lightning *Static* (an imbued hit that kills refunds its
charge).

Guard: Second Wind *Deep Breath* (no hard control while it runs); Cleanse *Purge* (the
stripped affliction is thrown back onto its applier); Brace *Set* (roots you, doubles the
footing); Bramble Guard *Thicket* (thorns also hit bodies adjacent to the attacker); Endure
*Second Skin* (the shell persists at half while you keep taking hits); Break Free *Slip*
(untargetable for a moment); Recuperate *Battle Rest* (full rate while hit).

Open after this run: lane coverage across the T3 paths (Control 2, Engagement 2 after the
review) is recorded in §22.5 for the next class review, not fixed here.
