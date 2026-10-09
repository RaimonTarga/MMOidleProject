# Frame Loops and Range Mechanics — Current State

**Audited:** 2026-10-01 (progression rework Phase 3, built in the day run preceding run
3; untouched by run 3 itself).

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§10, §11, §18; [`briefs/frame-loops-2026-10-01.md`](briefs/frame-loops-2026-10-01.md) is
the per-root authoring brief, decided with the designer and the primary source for every
table below. **History:**
[`archive/progression-rework-plan.md`](archive/progression-rework-plan.md) Phase 3's
three progress notes are the detailed build log and divergence list; read the code where
this page and that history disagree.

Every class root has three **frames** (Light / Balanced / Heavy) and three **range nodes**
(Close / Mid / Far). Frames used to be "the same thing faster or slower" plus a stat skew;
each now has a feedback **loop** whose container encodes the skew, so the frame decides
what the build wants to scale. Range nodes used to be two mechanics (Close, Far) and a
control group (Mid, "the standard range, no cost, no mechanic") — every range now has one.

Every number below is a **placeholder** from the magnitude table's shapes, not a tuned
value; the designer hand-edits after a bench pass. Nothing here touches monster numbers,
ability ranks, or the T1/T2 lineage magnitude table.

## 1. The loop containers (design §10)

A **window** is a timed buff shorter than one cycle (or it collapses into a flat stat). A
**bank** is a capped, deterministic resource spent by the mechanic. Both route damage
through `ctx.metadata.empoweredMultiplier` — never a second multiplier on one hit, which
is why a Technique rider reads that one field as the whole truth of a hit regardless of
whether a frame window, a lineage card, or both are live on it (closed 2026-10-01 after
the bench found a rider compounding with a frame window — see §3).

| Frame | Shape | Rider |
|---|---|---|
| Light | timed window after the mechanic fires, shorter than one cycle; uptime rises with attack speed | — |
| Balanced | both containers, at reduced strength | — |
| Heavy | a bank of charge per regular hit, capped, spent by the mechanic | a non-damage effect (stagger, plating shred) |

## 2. Frame loops by root

### Striker (cadence) — `server/src/systems/classes/archetypes/cadence/frameLoop.ts`

| Frame | Container | Effect |
|---|---|---|
| Flurry (light) | `cadence.frame-window-ms` 1600 window, `cadence.frame-window-mult` 1.3 | damage up for the window |
| Skirmisher (balanced) | window 800 ms / ×1.15, plus `cadence.frame-charge-per-stack` 0.1 | both, half strength |
| Breaker (heavy) | charge per hit (`cadence.frame-charge-per-stack` 0.2), cap = the cadence threshold **minus one** (derived, no key) | finisher scales with stacks spent; `cadence.frame-stagger-ms` 750 stagger on the finisher |

### Squire (cooldown) — `.../cooldown/frameLoop.ts`

| Frame | Container | Effect |
|---|---|---|
| Warrior (light) | window after an execution (`cooldown.frame-window-ms` 2000) | regular hits shorten the next recharge (`cooldown.frame-refund-ms` 300) while the window is live |
| Knight (balanced) | both, half strength | window 1000 ms, refund 150 ms, bank cap 4 (**authored**, not derived — see §4), per-stack 0.1 |
| Bulwark (heavy) | bank per regular hit, cap **authored** at `cooldown.frame-charge-cap` 8, per-stack 0.2 | execution scales with the bank; `cooldown.frame-shred-pct` 0.15 / `-duration-ms` 6000 plating shred on the execution |

### Apprentice (dot) — by element, not by container

| Frame | Verb | Effect |
|---|---|---|
| Venom Vessel (light) | opens hard | `dot.frame-opener-stacks` 4: the first hit on a fresh (no-poison) target applies that many stacks at once |
| Ember Mage (balanced) | intensifies | `dot.frame-max-stack-mult` 1.4: hitting a target already at max burn adds direct damage |
| Rime-Bound (heavy) | chills | reuses the existing `dot.chill-*` keys at frame magnitudes (3 stacks, 2%/2% slow per stack, 4000 ms) — every frost stack slows the target's movement and attack speed |

Winter Warden (T3) authors its `chill-*` keys as **deltas** on top of the frame's base,
not independent absolutes (passives sum, so stacking two sets of absolutes would have
quietly doubled the stack count); its resolved numbers are unchanged from before the
frame shipped. **Pyromancer (T3) overlapped Ember Mage's effect; the ability pass closed
it** (design §22.5, Radiant): the path's own max-stack direct bonus is gone (the frame
owns "intensifies"), and a burn tick at max stacks also strikes every adjacent body as
damage over time; a hit at max burn does not refresh the burn (design §22.12), so Radiant
fires while the stacks last. Venomslinger's and Winter Warden's re-homes remain a T3-class-review
item (see §5).

### Slinger (reload) — by clip position

| Frame | Shape | Effect |
|---|---|---|
| Scout (light, 5-round clip) | start | `reload.frame-opener-rounds` 2 at `reload.frame-opener-mult` 1.3: the first two rounds of a fresh clip are empowered |
| Marksman (balanced, 10) | end | `reload.frame-last-round-mult` 2.2: the last round of the clip is the big one |
| Artillerist (heavy, 20) | across | `reload.frame-ramp-pct-per-shot` 0.02, uncapped below the clip length; `reload.frame-ramp-top-mult` 1.3 proportional damage at the top (`1 + (top−1) × min(1, stacks/clip)`) |

A Blunderbuss volley has no clip position and is skipped by the whole loop (its shots
carry no `reloadClipIndex`), so Marksman's last-round multiplier cannot fire on a pellet.
**Warmonger (T3)** no longer authors a ramp of its own: the frame owns it, and the path
authors `reload.ramp-carry-pct` 0.5 (design §22.5, the ability pass), so a reload keeps
half the ramp instead of resetting it (the barrel glow holds at the carried value). The
top damage, the `reload-frame-ramp` tile's fill and the glow measure against ONE clip
(`reloadFrameRampFill`, design §22.12), so the first clip is exactly the Artillerist's
(×1.3 at its end); only the attack-speed climb carries past it, to `clip / (1 − carry)`
(`reloadFrameRampCap`, twice the clip). The carry is capped at 0.9 in code, and the
toll is paid once per reload (`frameLoop.ts`, `settleRampForReload`).

### Spirit (energy) — by shape

| Frame | Shape | Effect |
|---|---|---|
| Spark (light) | chain | `energy.frame-chain-targets` 2 within `energy.frame-chain-radius` 160, each at `energy.frame-chain-share` 0.35: the discharge arcs to nearby targets |
| Wraith (balanced) | loop | `energy.frame-gain-window-ms` 2000 at `energy.frame-gain-mult` 1.6: the discharge opens a window of faster energy gain |
| Phantasm (heavy) | overcharge | a **raised arming threshold** (`energy.frame-overcharge-max` 4 extra hits past the cap, `energy.frame-overcharge-mult-per-stack` 0.15 banked per hit above cap), `energy.frame-stagger-ms` 750 on the bigger, rarer discharge |

Phantasm's container is not literally "energy banked above the cap" — the pool arms the
discharge and resets to 0 on the very next hit, so nothing above-cap can ever accumulate
under the existing energy model. It is implemented as a raised threshold instead: fewer,
bigger discharges, which is the same Heavy skew by a different mechanism.

### Conduit (summoner) — locked (Consort decided 2026-10-01)

| Frame | Trigger | Effect |
|---|---|---|
| Splinter (light, 6 small bodies) | a completed formation cycle on one target | `summoner.frame-frenzy-window-ms` 900: summon attack speed (+`frenzy-aps-pct` 0.2) and on-hit multiplier (`frenzy-onhit-mult` 1.25) up |
| Consort (balanced, 5) | **a standing condition**: every formation slot alive | "the line holds" — while all five bodies stand, each carries `summoner.frame-line-plating-pct` 0.15 of the owner's plating again and `summoner.frame-line-dr` 0.15 more damage reduction. Any death breaks it on the summoner pass that observes the death; a completed reconstruction restores it |
| Effigy (heavy, 2 large bodies) | both bodies hit the same target inside a window | `summoner.frame-link-window-ms` 2500, charge per hit up to `frame-link-max-charge` 5: a linked slam (`frame-link-slam-mult` 0.3) with `frame-link-stagger-ms` 750 stagger |

**`mechanic-fired` for the summoner moved.** It used to fire on a command intent (a
click); that let it fire for an idle player, which contradicts the whole point of a
mechanic-fired card. It now fires on a **completed formation cycle** — every living
summon has hit the same target since the last fire — read off the formation system's own
existing `cycleCompleted` state, so a full dodge or a cancelled swing (which never reach
`onHit`) correctly do not commit a cycle.

## 3. Rules that hold across every root

- **One multiplier per hit, closed end to end.** A Technique rider reads
  `ctx.metadata.empoweredMultiplier` **unconditionally** now, not only when the
  mechanic's own empowered flag (`empoweredAttack`) was also set. Before this fix, a rider
  landing inside a frame window (which deliberately does *not* set `empoweredAttack` —
  doing so would restart cooldowns and double-fire every `mechanic-fired` card) divided by
  1 instead of the window's real multiplier, silently under-scaling. Fixed and endorsed by
  the designer as the one-multiplier rule **before** the lane bench reran, so the bench
  numbers were not measured against the defect.
- **Light's window is clamped by the runtime, not trusted from authoring.** The brief
  requires a window shorter than one cycle; because the cycle itself moves with attack
  speed, haste and relics, `resolveFrameWindowMs` caps every window at 60% of the *live*
  cycle and treats the authored value as a ceiling. Uptime therefore rises with attack
  speed until the clamp binds, then flattens at 60% — a deliberate design, not a bug.
- **A derived cap vs. an authored cap.** Cadence (Striker) already owns a hit-count
  threshold, so its Heavy bank cap is *derived* (`threshold − 1`, no key). A cooldown
  cycle is time-based, so an equivalent derived cap would hand a faster weapon a bigger
  bank — Squire's cap is therefore *authored* instead (`cooldown.frame-charge-cap`).
- **HUD.** Windows ride the existing status-effect buff sync (`data: { totalMs }`); banks
  are resources on `TracksCombat` exposed the same way, except the Artillerist ramp, which
  reuses the existing authoritative `usesReload.clipSpeedStacks` field rather than adding
  a parallel resource. A `frame-charge` combat event (`{ playerId, stacks, max }`, next to
  `card-fx` in `CombatEvent`) exists on the wire for every bank change, for a one-shot
  weapon-glow pulse a 5 Hz buff sample can't distinguish from a resend — but **no client
  renderer reads it yet** (`client/src/render/combatFx.ts` silently ignores unknown event
  kinds). Stack counters and window clocks already render through the ordinary buff sync.
- **No HUD art yet** for any of the new buff tiles; the ranged/summoner ones alias an
  existing authored tile (e.g. `energy-frame-overcharge` → `energy-overcharge`) until
  dedicated art exists.

## 4. Range mechanics and the at-bay layer (design §11)

One module, `server/src/systems/combat/rangeMechanics.ts` (`initRangeMechanics`,
registered in `initCombatSystems()` after `initAllMechanics()`, before the defense
systems), consuming `mechanicEffects` authored on each root's range nodes in
`rootsAndFrames.ts`. Range stays a **leaf** — nothing downstream (T3 paths, capstones)
reads it.

**The at-bay band.** `isAtBay(player, target)` is true when the edge-to-edge hitbox gap
is `<= player.attackRange` **and** `> target.attackRange` — the same measure
`inAttackRange`/`collision.canReach`/the attack gate already use, so "inside your reach"
means one thing everywhere, and a monster settled at its own standoff (which can hit
back) is never "at bay." "From max reach" (the Far payoffs) is the outer band, `reach ×
frac <= gap <= reach`, with `frac` authored per node (`<root>.range-far-max-reach-pct`,
0.75 seeded).

| Class | Mid (gains a mechanic) | Far (gains a mechanic) |
|---|---|---|
| Striker (Lancer / Phantom-Blade) | at-bay slow (`cadence.range-mid-at-bay-slow-pct/-ms`) | first hit on a fresh target from max reach is an opening strike (`range-far-max-reach-pct`, `range-far-opener-pct`) |
| Squire (Phalanx / Sentinel) | at-bay slow + executions at reach stagger (`cooldown.range-mid-at-bay-slow-pct/-ms`, `range-mid-execution-stagger-ms`) | an execution from max reach opens a vulnerability window (`range-far-vuln-pct/-ms`) |
| Apprentice (Warlock / Harbinger) | a stack applied at reach also lands one on an adjacent enemy (`dot.range-mid-spread-stacks/-radius`) | +1 max stack on a single target, stacks last longer, no spread (`range-far-stack-cap-bonus/-duration-pct`) |
| Slinger (Enforcer / Deadeye) | shots at reach pin/slow (`reload.range-mid-at-bay-slow-pct/-ms`) | shots from max range hit harder (`range-far-damage-pct`) |
| Spirit (Shade / Wisp) | the discharge at reach staggers (`energy.range-mid-discharge-stagger-ms`) | the discharge does not chain; all of it lands on one target (`range-far-single-target`, consumed by the Spark chain resolution in §2) |
| Conduit (Vigil / Procession / Harrier) | unchanged — all three already carry formation geometry | unchanged |

Close nodes are untouched at every class. Stagger uses the existing stun ladder at its
shortest rung (750 ms, authored per node rather than read from the magnitude table, which
has no column for it yet); it refuses a control-immune or plate-shielded boss exactly
like every other stun. The at-bay slow does not check control-immunity, matching the
`slow` lineage payoff. Harbinger's extra stack raises the **delivery cap**, not
`dot.max-stacks` (which also divides per-stack damage — raising that key would have made
the ninth stack thin the other eight); its longer duration is an absolute floor, not a
multiply, so a refresh can't ratchet it. Phantom-Blade's "fresh target" is latched per
monster body, the same shape `weapon.first-strike-mult` already uses, so node
freeze/respawn resets it for free.

The §18.1 max-wins debuff-composition helper (never lower a multiplier, never shorten a
window) moved out of `lineageCards.ts` into `server/src/systems/combat/status/
sharedDebuffRecord.ts` because Sentinel's vulnerability window is its second consumer.

## 5. Not reached / open

- **Range's own loop interaction (design §11's "Close builds charge faster on adjacent
  targets; Far extends the Light window") is not implemented** — only each range's own
  standalone mechanic (§4) shipped. The frame loop and the range mechanic exist side by
  side today, not yet cross-wired.
- **Consort's line is unbenched** (§2) — the container is decided and implemented, but 0.15
  plating share / 0.15 DR are magnitude-table units taken raw (`plating-stack` and
  `engagement-dr`), with no tier or row scaling, exactly as Effigy's stagger took the
  `stun` unit. A standing condition's "uptime" is the share of the fight the formation is
  whole — the monsters set it, not the player — so it needs the bench more than a window
  does.
- **Pyromancer/Ember Mage and Warmonger/Artillerist overlaps** (§2) were closed by the
  ability pass (design §22.5); Venomslinger's and Winter Warden's planned re-homes are
  still left for the T3 class review.
- **No client renderer for `frame-charge`** and no authored HUD art for the new tiles
  (§3) — both are drawing-layer follow-ups, not data or runtime gaps.
- **No bench pass.** Every magnitude above is a first-pass placeholder seeded off the
  lineage magnitude table's shapes (window/bank sizes, the stun ladder's shortest rung,
  the `vulnerability`/`slow` payoff units). The lane bench that measured lineage cards
  (`reports/progression-phase1/lane-matrix-run3.md`) now includes a Light/Balanced/Heavy
  uplift column per root, now that loops exist — read that report for the first numbers,
  not this page.

## 6. Tests

`server/test/frameLoops.test.ts` (window shorter than cycle and clamped at 60%; bank
capped at threshold−1 for cadence and at its authored cap for cooldown; uptime rises with
attack speed on Light; the Venom opener fires once per fresh target; Ember's bonus fires
only at max stacks; Frost chill scales per stack) and `server/test/frameLoopsRanged.test.ts`
(Scout's two rounds, Marksman's last round, the uncapped Artillerist ramp reset on reload,
Spark's chain count, Wraith's window, Phantasm's overcharge, one emission per formation
cycle). `server/test/rangeMechanics.test.ts` (at-bay slow only inside the band and only on
the three Mid nodes; Far payoffs only from max reach; Harbinger's extra stack; Wisp's
no-chain). `server/test/mechanicFired.test.ts` carries the summoner formation-cycle case.
`abilityTechniqueRune.test.ts` carries the one-multiplier regression case (Quick Strike
inside a frame window).
