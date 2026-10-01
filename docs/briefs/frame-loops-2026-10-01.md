# Frame loops and range nodes — per-root brief (2026-10-01)

**Status:** decided with the designer 2026-10-01; closes bible open decision 1 except where
marked OPEN. This is the authoring input for Phase 3 of `docs/progression-rework-plan.md`.
**Design authority:** `design_docs/progression-rework-design.md` §10, §11, §18.

Rules that hold for every root:

- The container encodes the skew (§10). A **window** must be shorter than one cycle or it
  collapses into a stat. A **bank** is capped and deterministic. Everything routes through
  `empoweredMultiplier`; never a second multiplier on one hit.
- `mechanic-fired` is the hook (plan, Phase 1c contract): cadence finisher, cooldown
  execution, dot max stacks, reload complete, energy discharge, **summoner formation cycle**
  (every living summon has hit since the last fire; a click command is NOT the event, it
  never fires unattended).
- HUD: a stack counter for banks, a clock for windows, a weapon glow that grows with charge.
  These are part of the feature.
- T3 paths deepen the frame's shape; where a frame now owns what a path did, the path is
  re-homed. **The T3 classes are reviewed as a whole after the rework**, so re-homing is
  noted here, not designed.
- Numbers are placeholders from the magnitude table; the designer hand-edits after the bench.

---

## 1. Frame loops

### Striker (cadence) — locked

| Frame | Container | Effect | Rider |
|---|---|---|---|
| Flurry (light) | timed window after the finisher, shorter than one 4-hit cycle | damage up for the window; attack speed pays twice (shorter cycle, more hits in the window) | — |
| Skirmisher (balanced) | both, half strength | | — |
| Breaker (heavy) | charge stacks per regular hit, cap threshold−1, spent by the finisher | finisher scales with stacks spent | stagger on the finisher |

### Squire (cooldown) — locked

| Frame | Container | Effect | Rider |
|---|---|---|---|
| Warrior (light) | window after an execution | regular hits shorten the next recharge while the window is live | — |
| Knight (balanced) | both, half strength | | — |
| Bulwark (heavy) | bank per regular hit into the next execution | execution scales with the bank | plating shred on the execution |

### Apprentice (dot) — locked, by element

| Frame | Verb | Effect | Overlap to resolve in the T3 review |
|---|---|---|---|
| Venom Vessel (light) | **opens hard** | the first hit on a target with no poison applies 3–4 stacks | Venomslinger raises the cap and detonates: compatible |
| Ember Mage (balanced) | **intensifies** | hitting a target already at max burn adds direct damage | **Pyromancer does this at T3** — give the path a new effect in the T3 review |
| Rime-Bound (heavy) | **chills** | every frost stack slows the target's movement and attack speed a little | Winter Warden deepens to 9 stacks + Freeze: compatible, it is the same chill |

Each frame scales a different stat: Venom attack speed and target switching, Ember kills
and max-stack uptime, Frost duration on one target.

### Slinger (reload) — locked, by where in the clip the payoff lives

| Frame | Shape | Effect |
|---|---|---|
| Scout (light, 5 rounds) | **start** | the first two rounds of a fresh clip are empowered; reload speed = more openers |
| Marksman (balanced, 10) | **end** | the last round of the clip is the big one; a countdown the player watches |
| Artillerist (heavy, 20) | **across** | attack speed ramps with every shot, **no early cap**, and the top of the ramp adds damage; the 3 s reload is the cool-down |

**Warmonger (reload-heavy-t3-b)** loses its ramp to the frame. Agreed re-home: half the
ramp carries through a reload (a per-clip climb becomes a sustained one). Design it in the
T3 review.

### Spirit (energy) — locked

| Frame | Shape | Effect |
|---|---|---|
| Spark (light) | **chain** | the discharge arcs to nearby targets |
| Wraith (balanced) | **loop** | the discharge opens a window where hits generate energy faster |
| Phantasm (heavy) | **overcharge** | energy above the cap banks into the discharge multiplier; the discharge staggers |

### Conduit (summoner) — Splinter and Effigy locked, Consort OPEN

| Frame | Trigger | Effect |
|---|---|---|
| Splinter (light, 6 small) | a completed formation cycle on one target | frenzy window: summon attack speed and the on-hit multiplier up |
| Consort (balanced, 5) | **OPEN** | rejected: a heal pulse on reconstruction. Candidates: "the line holds" (plating/DR while all five live, broken by a death, restored by reconstruction); an owner window per cycle. Designer wants to keep thinking. |
| Effigy (heavy, 2 large) | both bodies hit the same target inside a window | banked charge per hit is spent as a linked slam with a stagger |

Parked for later: Splinter bodies exploding on death (Iconoclast already does this at T3;
keep it there). A behaviour axis (Effigy holds aggro natively, Splinter steps back out of
telegraphs natively) was offered and not taken; revisit with Consort.

---

## 2. Range nodes — the axis (locked)

**Close = attrition and defence. Mid = the standard range, with a control layer on melee
classes. Far = kiting, mobility, single target.** Close nodes keep their existing payoffs.
Mid and Far gain a mechanic each. Range stays a leaf; nothing downstream reads it (§18).

**The melee at-bay layer (locked: slow only, no shove).** On a player hit, if the target is
inside the player's reach and outside its own attack range it is "at bay", and the hit
applies a short movement slow. Every hit, deterministic, no displacement. Pathing is
untouched.

| Class | Close (keeps) | Mid | Far |
|---|---|---|---|
| Striker | In-Fighter: bulk, tighter pulses | **Lancer:** at-bay slow | **Phantom-Blade:** first hit on a target from max reach is an opening strike |
| Squire | Vanguard: constant 30% regen | **Phalanx:** at-bay slow; executions at reach stagger | **Sentinel:** an execution from max reach opens a vulnerability window |
| Apprentice | Hexblade: absorb drain-tank | **Warlock:** a stack applied at reach also lands one on an adjacent enemy (no control) | **Harbinger:** +1 max stack on a single target, stacks last longer, no spread |
| Slinger | Breacher: evasion that cuts deeper | **Enforcer:** shots at reach pin (movement slow) | **Deadeye:** shots from max range hit harder |
| Spirit | Haunt: 40% barrier | **Shade:** the discharge at reach staggers | **Wisp:** the discharge does not chain; all of it lands on one target |
| Conduit | Vigil | Procession | Harrier — all three already carry formation geometry; **unchanged** |

---

## 3. Authoring notes for Phase 3

- Frame containers live as `mechanicEffects` on the frame nodes in `rootsAndFrames.ts`
  and are consumed in each root's prototype; the Apprentice's three verbs and the Slinger's
  clip positions need new keys, named `<root>.frame-*`.
- The at-bay check is one helper on the player hit seam (distance to target vs
  `target.performsAttack.attackRange`), used by Lancer, Phalanx and Enforcer.
- Stagger uses the existing stun ladder at its shortest duration; vulnerability uses the
  shared record under the §18 max-wins rule.
- Tests: `frameLoops.test.ts` (window shorter than cycle; bank capped at threshold−1; uptime
  rises with attack speed; Artillerist ramp has no cap below the clip length),
  `rangeMechanics.test.ts` per class (at-bay slow applies only in the band; Far payoff only
  from max reach), `mechanicFired` extended for the summoner cycle.
- Consort ships with no loop until decided; the frame keeps its stat skew.
