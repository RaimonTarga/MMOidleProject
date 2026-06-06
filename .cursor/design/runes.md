# Runes — Design Doc

> Status: design / not yet implemented.
> A system that turns the player's auto-combat AI from a fixed settings menu into
> an earned, composable set of behavior rules (Paper Mario badge / BP model crossed
> with an Event–Condition–Action engine).

---

## 1. Core idea

The player's auto-combat brain is already config-driven. The `UsesAutocombat` slice
(`shared/src/components/core/networkedSlices.ts`) holds the tunable behavior
(priority mode, acquire radius, flee threshold, leader focus, auto-traverse), and the
scoring engine in `server/src/systems/combat/ai/targetPriority.ts` reads it via
`selectAutoCombatAction(world, player, cfg, now)`.

Today the player edits that config freely in the **Autocombat settings tab**
(`client/src/hud/settings/SettingsPanel.tsx`). Runes **remove that free tunability**
and replace it with earned, composable behavior rules:

- The **baseline AI is deliberately dumb** (hits nearest, never flees, never leaves
  the node, ignores the party).
- Every "smart" (or strange) behavior is a **rule you assemble** from fragments you
  find in game, paid for within a point budget.

A rune is **not** a monolithic named upgrade. It is a **rule**: a `<condition> → <action>`
pair. You collect *condition fragments* and *action fragments* separately and wire them
together freely. `when you die → respawn immediately`, `when hp ≤ 25% → flee to clearing`,
`while exploring → seek new biome`. The combinatorial space is the content.

This fits the architecture because:

- The AI already takes a `cfg` argument — we change **where `cfg` comes from** and add an
  arbitration pass in front of the existing scorer; we do not touch the combat engine.
- It reuses the existing **passive-rebuild pattern**: `recalculatePlayerEntityStats`
  rebuilds `usesSkills.passives` from unlocked skills on every recalc. Runes use the
  identical pattern — equipped rules fold into a derived AI config + active rule set,
  never applied imperatively (per CLAUDE.md convention).
- Persistence is component-shaped JSON, so runes are just owned-fragment arrays plus an
  equipped-rule array on `tracksProgression` — no new table.

### One model, no layers

Everything is a `<condition> → <action>` rule, including the "always-on" tuning that earlier
drafts treated as a separate passive layer. A permanent parameter tweak is just a rule whose
condition is `always`:

- `while always → priorityMode: damage` (Executioner)
- `while in-combat → acquire radius 300` (cautious fighter)
- `while hp ≤ 25% → acquire radius 300` (tunnel-vision when scared)

Because config values are now driven by *conditional* actions, the same primitive expresses
both a global tweak and a situational one. There is no second system.

---

## 2. The dumb baseline (the permanent rule)

With zero runes equipped, the AI runs a single, **permanent, un-removable, lowest-priority
rule**:

```
while always → grind nearest, here
```

This guarantees a legal action every tick, so no freeform combination can ever fully brick
the character — the worst case is the dumb baseline takes over. Concretely the baseline is the
dumbest version of what already exists in `WEIGHT_PRESETS` / `DEFAULT_AUTOCOMBAT_CONFIG`:

| Behavior            | Baseline (no runes)                       | Today's default |
| ------------------- | ----------------------------------------- | --------------- |
| `priorityMode`      | `nearest` (hits the closest thing)        | `balanced`      |
| `acquireRadius`     | **full node** — grinds the entire node    | 600             |
| `fleeWhenLow`       | `false` — fights to the death             | `true` @ 25%    |
| `focusLeaderTarget` | `false` — ignores the party               | `true`          |
| auto-traverse       | `false` — never leaves the node           | setting         |
| target commitment   | dumb (high churn or dumb stickiness)      | `SWITCH_MARGIN 0.25` |

The baseline is **not** near-sighted — it works the whole node, walking to the closest
enemy and swinging until it dies, then on to the next-closest. The dumbness is in *how*
it picks and fights (nearest-only, no flee, no party awareness, never leaves the node),
not in how far it can see. Acquire radius therefore only ever goes **down** from full
node, via actions that shrink it — there are no "see farther" runes.

`DEFAULT_AUTOCOMBAT_CONFIG` (`shared/src/config/gameConfig.ts`) gets **repurposed as this
baseline rule's config**, since a player with no equipped rules runs exactly these values.

**Hard design constraint:** because the budget is `2 * playerTier` (see below), a **T0
player can equip nothing** (unless they accept a flaw — see §4). The dumb baseline must
therefore be survivable solo through all of T0. The clearing is already soft (density 6,
level cap 4), so this is plausible — but it is now a real constraint. Reaching **T1 is the
first "the game opens up" beat**: the AI goes from headless to programmable.

---

## 3. The fragment graph & BP economy

Conditions and actions are **nodes in a graph**; equipped rules are **edges** connecting one
condition node to one action node. BP is paid for the **nodes you light up**, not the edges:

```
runeBudget = 2 * playerTier            // T0 → 0 BP, T1 → 2, T5 → 10

equippedCost =
    sum( cost(c) for each DISTINCT condition c used by ≥1 equipped rule )
  + sum( cost(a) for each DISTINCT action a    used by ≥1 equipped rule )

equip is legal iff  equippedCost <= runeBudget
```

**Shared nodes count once.** If three rules all trigger off `hp ≤ 25%`, you pay for that
condition node a single time. If four conditions all fan into `flee`, you pay for `flee`
once. This is the core of the system's feel:

- **Builds are wiring, not shopping.** Light up a few nodes, then wire them richly. The
  marginal cost of "and also, when I take damage, flee" is zero once `flee` is already paid for.
- **Thematic coherence is rewarded.** A tight build (two conditions, two actions, densely
  cross-wired) is cheap; a scattershot build (many distinct nodes, each used once) is expensive.
- **No flaw-farming exploit.** A flaw condition is one node — reusing it across many rules
  still only grants its negative BP once.

You own fragments permanently once found (no BP to own). BP is spent only when a node is
**used by an equipped rule**.

### Flaw conditions (negative cost)

Flaws live on **restrictive conditions** — conditions that limit *when* you are allowed to
act, in exchange for BP back. Examples: `target is wounded` (you only finish low-HP mobs),
`sees family(spider)` (paired with a flee action → Arachnophobia), `unlucky hp` (a joke).
Equip check is just the formula above with the negative node included.

Emergent niceness: at **T0 (budget 0)** a player can light up a −1 flaw condition to open
exactly 1 BP, then afford one cheap functional node. T0 players *can* earn a sliver of AI —
but only by accepting a flaw first. Lean into this "deal with the devil" beat.

Guardrails:

- Cap **distinct equipped flaw conditions** (e.g. **at most 2**) so builds don't become
  all-flaws-for-points.
- Flaw fragments must be **acquired**, not free — gate them behind the same drop/quest
  system so the +1 is earned.

---

## 4. Conditions: events ∪ states

A condition is one of two execution kinds. They share the data model but dispatch through
two different runtime paths.

- **Events (edge-triggered, fire once):** a discrete moment. `on-death`, `on-kill`,
  `on-damaged`, `on-aggroed`, `on-biome-clear`, `on-level`. These hook the existing combat /
  lifecycle moments the server already emits (`player:died`, the `onKill`/`onDamageTaken`
  combat pipeline stages, etc.) and fire their action **once**.
- **States (level-triggered, continuously true):** evaluated every AI tick; the action runs
  *while the predicate holds*. `in-combat`, `exploring`, `hp-below(X)`, `solo`,
  `party-member`, `party-leader`, `n-aggro(X)`, `reloading`, `biome-cleared`, `respawning`,
  `target-wounded`, `sees-family(F)`.

The thing to internalize: **multiple state conditions are true at once.** A party leader at
20% HP fighting four mobs satisfies `party-leader` + `hp-below(25)` + `in-combat` +
`n-aggro(3)` simultaneously. Every rule whose condition holds wants to fire this tick;
arbitration (§6) decides who actually drives.

**Hysteresis on thresholds.** Threshold states (`hp-below`, `n-aggro`) use enter/exit bands
(e.g. enter at 25%, release at ~40%) so flee→return builds don't chatter at the boundary.

---

## 5. Actions: category (priority) × channel (what it writes)

An action carries **two independent axes**:

- **Category** = its arbitration priority tier. In-game names, highest → lowest:
  **Instinct > Linking > Wayfinding > Targeting**.
- **Channel** = the AI control resource it writes. The AI controls a small set of
  mutually-exclusive resources:

| Channel    | Holds                     | Possible values |
| ---------- | ------------------------- | --------------- |
| `move`     | one movement goal         | grind-here · flee-to-clearing · go-to-town-and-wait · traverse-to-biome · seek-new-biome · return-to-death-site · approach-target |
| `target`   | one target-selection rule | scoring weights / overrides (lowest-TTK, revenge, focus-leader, glory-hound …) |
| `config`   | numeric AI params         | acquire radius, standoff gap, switch margin … |
| `oneshot`  | fire-and-forget           | respawn-now |

The two axes are **independent**: `while hp ≤ 25% → set radius 300` is a `targeting`-category
action on the `config` channel even though a scared-instinct condition triggers it. The
condition only decides *when*; the action's own `category` decides *who wins*.

| Category (priority) | Typically writes        | Example actions |
| ------------------- | ----------------------- | --------------- |
| **Instinct** (high) | `move`, `oneshot`       | flee, flee-to-clearing, panic-retreat, respawn-now |
| **Linking**         | `move`, `target`        | wait-for-party, go-to-leader, focus-leader-target, engage-only-ally-aggroed |
| **Wayfinding**      | `move`                  | traverse-to-biome, seek-new-biome, return-to-death-site, wander |
| **Targeting** (low) | `target`, `config`      | priorityMode, scoring-weight nudges, shrink-radius, wider-standoff |

### 5.1 `oneshot` actions fire unconditionally — `respawn-now` is a foot-gun on purpose

`oneshot` actions don't check whether they "make sense" in the current state — they just fire
the instant their condition holds. This is deliberate, and `respawn-now` is the canonical
example we lean into:

- Wired to `on-death` it is **Phoenix** — the intended use, just skips the death screen.
- Wired to *any state condition*, it fires **while the player is still alive**, and a respawn
  cannot happen without a death first — so it **kills the player and respawns them**. There is
  no guard against this. `when you're hit → respawn immediately` is a character that drops dead
  the instant anything touches it; `always → respawn immediately` is a permanent death loop.

These are **intended trap builds**, not bugs (see §12.1). They do not run forever — each
self-kill also burns the rule's charge (§7), so a runaway loop drains itself dark within
seconds and self-terminates. To make them readable instead of mystifying, any death caused by an
`oneshot` self-kill is attributed to the cause **`"Rune Malfunction"`** (surfaced on the death
overlay / floater). When `killPlayer` is invoked by the rune arbiter rather than by combat
damage, it stamps that cause so the player can see exactly which of their wirings just killed
them.

> Implementation note: this requires a `cause`/`source` field on the kill path. `killPlayer`
> already exists (`server/src/world/playerLifecycle.ts`) and emits `player:died`; extend it with
> an optional cause (default = the killing monster / damage source) and pass `"Rune Malfunction"`
> when the rune arbiter triggers a `respawn-now` on a live player. The client death overlay reads
> the cause string. Phoenix (`on-death → respawn-now`) does **not** stamp this cause — the player
> is already dead from the real source, so respawn-now only accelerates the existing respawn.

---

## 6. Arbitration

Each tick, `selectAutoCombatAction` runs an arbitration pass **in front of** its existing
scorer:

1. Evaluate every equipped rule's condition → collect the **active** rules.
2. Group active rules by **channel** (`move` / `target` / `config` / `oneshot`).
3. Within a channel, the highest **category** wins (Instinct > Linking > Wayfinding > Targeting).
4. **Ties — and numeric last-writer — break by loadout order.** Later rules in the player's
   loadout strip override earlier ones writing the same channel. This single mechanism resolves
   both within-category ties and "two rules set the same numeric config" — and the player
   controls the order in the UI, so it's a feature, not a quirk.
5. `oneshot` actions just fire; they hold no channel.

Channels do **not** conflict across each other, so a `targeting` rule and an `instinct` `move`
rule run **concurrently** — the character flees while still choosing who to swing at on the way
out. The winning `config`/`target`/weight values are then handed to the existing scorer, which
runs unchanged.

---

## 7. Rune charge — fuel, the essence sink, and the loop-breaker

BP decides *what you may equip*; **charge** decides *whether an equipped rule actually runs
right now*. It is the AI's fuel, paid for in essence, and it doubles as the safety valve that
makes the §12.1 trap builds self-terminate instead of softlocking the character.

### Model

- Every **equipped rule** (edge) carries its own **charge meter** (`0 … chargeMax`). Per-rule,
  not per-node — a malfunctioning rule burns down its *own* fuel and goes dark in isolation,
  leaving the rest of the loadout running. This is the one place the system is edge-scoped
  rather than node-scoped: **BP is capacity per node; charge is fuel per behavior.**
- A rule **spends charge when its action takes effect**:
  - **event / `oneshot` actions** — a flat `drawPerFire` each time they execute.
  - **continuous overrides** (`move` / `target` / `config` winners) — a small `drawPerSecond`
    metered only while the rule is *actually winning its channel*, not merely eligible. A rule
    that is outranked every tick costs nothing.
- A rule whose charge hits **0 goes dark** — it stops firing entirely — and only re-arms once
  recharged past a **re-arm threshold** (e.g. 50% of `chargeMax`). The hysteresis is essential:
  without it a runaway loop would empty, refill one tick's worth, fire once, empty again — a
  stutter-loop. Dark → half-full → live keeps it cleanly off until genuinely refueled.

### Recharge (the essence sink)

- Charge refills from **essence, any type** — deliberately generous, so you are never blocked by
  lacking a specific biome's essence. Incoming essence auto-flows into under-full equipped rules
  (the wallet is the reservoir; runes sip from it).
- **Efficient builds are net-positive while grinding.** A handful of event-gated or
  rarely-winning rules draw a trickle far below kill income, so your essence still climbs. Charge
  is a tax on *how busy your AI is*, not a wall.
- **Busy builds cost more.** `always`-gated continuous rules (Executioner, a permanent radius
  tweak) pay `drawPerSecond` every second they steer — a real, steady upkeep. Stacking many
  always-on behaviors is where a build can tip net-negative and you feel the sink.

### Loop-breaker

This is what tames `always → respawn immediately`:

1. `always` holds every tick → `respawn-now` fires every tick → each fire is a death
   (`Rune Malfunction`, §5.1) **and** a `drawPerFire` charge hit.
2. Firing every tick drains that rule's meter to 0 within seconds — far faster than essence can
   refill it.
3. The rule **goes dark**: no more respawns-on-the-spot. The player is left alive (at the
   clearing from the last respawn) with one obviously-empty rule in their loadout.
4. It won't re-arm until recharged past the threshold — by which point the player has seen the
   dead rule and the `Rune Malfunction` death log, and (hopefully) un-wires it.

So the trap still *bites* (you die a few times, you bleed essence), but it **self-terminates**
rather than bricking the character. The cost — a fistful of essence and a few embarrassing
deaths — is the lesson.

### Data & implementation

- Persist per-rule charge alongside the loadout (a `charge` field on each `EquippedRule`, §8).
  Component-shaped JSON, no new table.
- Drain runs inside the same arbitration pass (`selectAutoCombatAction`, §6): a **dark** rule is
  skipped during arbitration (treated as not-active); after a live rule wins/fires, subtract its
  draw.
- Recharge runs off the existing essence path (`grantMonsterRewards`) plus a slow idle trickle —
  both outside the hot per-tick combat math.
- Tuning knobs per action: `drawPerFire`, `drawPerSecond`, `chargeMax`, `rearmPct`. Cheap
  behaviors (flee) draw little; spectacular ones (respawn-now, seek-new-biome) draw more, so
  loops self-limit faster and busy autopilots cost more.

---

## 8. Data model

### Persisted (on the existing progression slice)

```typescript
// shared/src/components/core/networkedSlices.ts — TracksProgression
runesOwned: string[];        // every condition + action fragment id the player has found
runesEquipped: EquippedRule[]; // assembled rules (validated against budget), ordered (loadout), each carrying its own charge
```

`EquippedRule[]` is ordered — order is the arbitration tiebreak (§6.4).

### Catalog (mirrors MONSTER_DATABASE / SKILL_TREE)

```typescript
// shared/src/runeDatabase.ts
export type RuneCategory = 'instinct' | 'linking' | 'wayfinding' | 'targeting';
export type RuneChannel  = 'move' | 'target' | 'config' | 'oneshot';

export interface ConditionDef {
  id: string;
  name: string;
  blurb: string;
  cost: number;                 // negative ⇒ flaw (restrictive condition)
  kind: 'event' | 'state';
  trigger: ConditionTrigger;    // discriminated: which event / which state predicate (+ params)
}

export interface ActionDef {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  category: RuneCategory;       // arbitration priority tier (in-game flavor name)
  channel: RuneChannel;         // which AI resource it writes
  effect: ActionEffect;         // discriminated: config patch | weight nudge | move goal | oneshot
}

export interface EquippedRule {
  conditionId: string;
  actionId: string;
  charge: number;     // fuel for this behavior (§7); drains on fire, refills from essence
}

export const CONDITION_DATABASE = new Map<string, ConditionDef>([ /* ... */ ]);
export const ACTION_DATABASE    = new Map<string, ActionDef>([ /* ... */ ]);
```

### The seam (mirrors `passives`)

Add derived, **non-persisted** fields rebuilt on recalc:

```typescript
// UsesSkills does this with `passives`; do the same for runes.
// foldRuneRules(equippedRules) folds into:
player.derivedAutoConfig   // baseline config + any `always`-condition overrides
player.activeRuleSet       // the ECA rules the arbiter evaluates each tick
```

A pure helper `foldRuneRules(equipped) → { baseConfig, weights, rules }` lives in shared (so
the bench harness and client can preview a loadout). `recalculateRuneConfig(player)` (server)
calls it on every recalc. `selectAutoCombatAction` then evaluates `activeRuleSet` (arbitration,
§6) and feeds the resolved config/weights to the existing scorer. `move`-channel winners route
through the goal-override plumbing that `flee.ts`, `partyFollow.ts`, and `updateAutoTraverse`
already own — runes route existing behaviors through the arbiter rather than via ad-hoc flags.

---

## 9. Example rules (the range)

Every previously hand-authored "named rune" reconstructs as a fragment pair — proof the model
is complete. Named runes survive only as **recommended pairings** in the UI / catalog, not as
engine primitives.

| Concept        | condition                        | action |
| -------------- | -------------------------------- | ------ |
| Survivor       | `hp-below(25)`                   | `flee` (instinct) |
| Coward         | `hp-below(50)`                   | `flee` (instinct) |
| Dramatic Exit  | `hp-below(25)`                   | `flee-to-clearing` (instinct) |
| Panic          | `n-aggro(3)`                     | `flee` (instinct) |
| Phoenix        | `on-death`                       | `respawn-now` (instinct/oneshot) |
| Recruiter      | `on-death`                       | `wait-in-clearing-for-party` (linking) |
| Revenge        | `on-death`                       | `return-to-death-biome` (wayfinding) |
| Alpha          | `solo`                           | `go-to-town-wait-as-leader` (linking) |
| Pack Tactics   | `party-member`                   | `focus-leader-target` (linking) |
| Executioner    | `always`                         | `priorityMode: damage` (targeting) |
| Kiter          | `in-combat`                      | `wider-standoff` (targeting/config) |
| Arachnophobia  | `sees-family(spider)` **(−1)**   | `flee` (instinct) |
| Pacifist Streak| `target-wounded` **(−1)**        | `engage` (targeting) |

Emergent combos require no extra authoring: `on-death → seek-new-biome` (momentum after death),
`hp-below(25) → set radius 300` (hunkers down when hurt), `party-leader → seek-new-biome`
(a leader who drags the party forward).

---

## 10. Acquisition (the "in game" part)

Hooks that already exist:

- **Boss drops** — most functional fragments (conditions and actions both) drop from
  tier-appropriate bosses (`bossesCleared` is already tracked).
- **Quest rewards** — `QUEST_DATABASE` entries grant a fragment on completion alongside XP.
- **Hidden conditions** for the weird/flaw fragments — e.g. a `killed-by-type` condition
  unlocks after the same monster type kills you 5×; a `wander` action from visiting N nodes.
  These tie into data already persisted (`questProgress`, `clearedNodes`, death tracking).

Because conditions and actions drop separately, finding a new condition instantly recombines
with every action you already own (and vice versa) — each drop multiplies build space.

---

## 11. UI

A **Runes panel** as a new sidebar/drawer button (alongside SKILL / BAG / FORGE / MAP /
QUEST in `MenuButtons.tsx` / `MobileHUD.tsx`):

- Header shows **BP: used / budget**, computed by the graph formula (distinct lit nodes).
- A **rule builder**: pick an owned condition, pick an owned action, wire them into a rule.
  Owned fragments are grouped condition / action; lit (paid-for) nodes are highlighted so the
  player sees that adding another edge off an already-lit node is free.
- An ordered **loadout strip** of equipped rules; drag to reorder (order = arbitration
  tiebreak, §6.4). Equipping/reordering is blocked if it would exceed budget.
- Each rule in the strip shows a **charge/fuel bar** (§7). A depleted, **dark** rule is greyed
  out and labelled out-of-charge — the in-fiction tell for "this behavior is running away with
  your essence" (the runaway-loop diagnosis). Optionally surface a net essence/min readout so
  players can see when a busy build has tipped negative.

**The Autocombat settings tab is removed entirely** (see §13). The player has **no dials** —
the only way to change AI behavior is to find fragments and wire rules.

---

## 12. Guardrails (keep "see what happens" fun, not broken)

Guardrails exist to prevent the runtime from **deadlocking or chattering**, not to prevent the
player from making bad choices. They protect the `move` / `target` / `config` channels:

- **Permanent baseline rule** (§2): `while always → grind nearest, here`, lowest priority,
  un-removable. No freeform combination can leave the `move`/`target` channels empty.
- **Threshold hysteresis** (§4): enter/exit bands on `hp-below` / `n-aggro` to stop flee↔return
  ping-pong.
- **Charge depletion** (§7): the catch-all loop-breaker. Any rule that fires pathologically
  often (the `oneshot` death loops below) drains its own charge to zero and goes dark, so even
  behaviors the baseline can't protect against — `oneshot` self-kills — self-terminate.
- **Flaw cap**: at most 2 distinct equipped flaw conditions (§3).

Beyond those, **degenerate combos are allowed on purpose** (`while exploring → flee-to-clearing`
is a character that paces the clearing forever) — they're the player's choice, and the baseline
guarantees the game still runs.

### 12.1 Intentional bad interactions (anti-guardrails)

Some combinations are *meant* to hurt. The system does **not** guard `oneshot` actions (§5.1)
or self-defeating wirings — they are part of the comedy and the cautionary tale of building
your own brain. The baseline rule cannot save you from these (an `oneshot` self-kill fires
regardless of what owns the `move`/`target` channels) — instead, **charge depletion** (§7) is
what bounds them: the runaway rule burns its own fuel to zero and goes dark, so the trap costs
you essence and a few deaths but never bricks the character.

Curated trap interactions to make sure exist (and to seed `runes_design.md`):

| Wiring | Result |
| ------ | ------ |
| `when you're hit → respawn immediately` | drops dead the instant anything touches you → `Rune Malfunction`, until the rule burns out (§7) |
| `always → respawn immediately`          | death loop every tick — drains its charge in seconds, then goes dark → repeated `Rune Malfunction`, self-terminating (§7) |
| `when you kill → respawn immediately`   | every kill is pyrrhic — you die on the killing blow → `Rune Malfunction` |
| `in combat → flee`                       | bolts the moment a fight starts; never actually trades hits |
| `below 25% HP → charge the boss first`   | suicides into the biggest enemy exactly when you can least afford it |
| `party member → flee to the clearing`    | abandons the party the instant you join one |

Death attribution: any death the rune arbiter causes by firing `respawn-now` (or any future
self-killing `oneshot`) on a **live** player is reported with cause **`"Rune Malfunction"`**
(§5.1). This keeps the trap *legible* — the player sees the system telling them their own wiring
did it, which is the joke landing rather than a confusing bug.

---

## 13. Removing the Autocombat settings tab — concrete cleanup

The `AutocombatConfig` *fields* stay on the slice (the AI still reads them); they just become
100% rune-derived and no longer user-editable.

- **`SettingsPanel.tsx`** — drop the `'autocombat'` tab and its render branch, remove it from
  the `SettingsTab` union and the tab bar. Remove `handleAutocombatPatch`, the `autocombat`
  state, and `hudBus.requestSetAutocombatConfig`.
- **Auto-traverse toggle** lives in the autocombat tab *and* as `autoTraverseEnabled` in the
  **gameplay** tab / `gameplaySettings.ts`. With a `traverse-to-biome` action governing it,
  remove both — auto-traverse is purely a rule now.
- **`gameplaySettings.ts`** — drop `autocombat` from `GameplaySettings` and the localStorage
  shape (bump the storage key version).
- **Intents** — `player:setAutocombatConfig` (`socketEvents.ts` / `intents.ts` / `hudBus.ts` /
  `hudEvents.ts`) becomes dead client→server traffic. Delete the client path; have
  `recalculateRuneConfig` write the derived config server-side directly (no round-trip — it's
  authoritative anyway). Add `rune:equipRule` / `rune:unequipRule` / `rune:reorder` intents
  with graph-budget validation.
- **`DEFAULT_AUTOCOMBAT_CONFIG`** (`gameConfig.ts`) — repurpose as the baseline rule's config.
  Bench harnesses (`harness.ts`, `botFactory.ts`) that `Object.assign(...)` it keep working but
  now represent "no-rune baseline"; to test *smart* AI, give bots an equipped-rule loadout.

---

## 14. Build order (shared → server → client)

1. **Shared**: `CONDITION_DATABASE` / `ACTION_DATABASE`, `ConditionDef` / `ActionDef` /
   `EquippedRule` (incl. per-rule `charge` + per-action charge tuning knobs), add `runesOwned` /
   `runesEquipped` to `TracksProgression`, the pure
   `foldRuneRules(equipped) → { baseConfig, weights, rules }` helper, and the graph-budget
   cost function (distinct lit nodes).
2. **Server**: `recalculateRuneConfig(player)` (called wherever stats recalc runs), set the
   permanent baseline rule + dumb defaults in `attachPlayerEntity` (`playerLifecycle.ts`), add
   the arbitration pass to `selectAutoCombatAction` (incl. **charge drain + dark-rule skip**,
   §7), wire `move`-channel winners through `flee.ts` / `partyFollow.ts` / `updateAutoTraverse`,
   add event-condition dispatch off the combat pipeline / `player:died`, stamp
   `"Rune Malfunction"` on rune-arbiter self-kills, add `rune:*` socket intents with
   graph-budget validation. Grant fragments and **recharge rule charge from essence** in
   `grantMonsterRewards` / quest completion (any essence type), plus an idle trickle.
3. **Client**: Runes panel (rule builder + ordered loadout strip with per-rule charge bars) +
   sidebar button, intents through `intents.ts` / `hudEvents.ts`, remove the Autocombat
   settings tab.

---

## 15. Decisions locked

- **Model**: every rune is a `<condition> → <action>` rule. Conditions are events ∪ states.
  No separate passive layer — always-on tweaks are `always`-condition rules.
- **Freeform**: players assemble any condition+action pair from day one.
- **Budget**: `2 * playerTier` (T0 has 0 BP — fully dumb until T1, unless a flaw opens a point).
- **BP is a graph cost**: pay once per **distinct** condition node and once per **distinct**
  action node used by equipped rules. Shared nodes count once.
- **Flaws**: negative-cost **restrictive conditions**; at most 2 distinct equipped; counted once.
- **Arbitration**: per-channel; category ladder **Instinct > Linking > Wayfinding > Targeting**;
  ties + numeric last-writer broken by loadout order.
- **Baseline**: permanent, un-removable, lowest-priority `while always → grind nearest, here`.
- **`oneshot` actions fire unconditionally** — `respawn-now` on a live player kills then respawns
  them; self-kills are attributed to cause **`"Rune Malfunction"`**. Trap builds are intended,
  not guarded (§5.1, §12.1).
- **Rune charge** (§7): a second currency orthogonal to BP. BP = build capacity (per node);
  charge = operating fuel (per equipped rule), refilled by **any essence**. Rules go dark at 0
  charge with a re-arm threshold. Efficient builds are net-positive while grinding; busy
  always-on builds carry real upkeep; pathological `oneshot` loops self-terminate by draining
  their own charge. This is the AI-wide essence sink **and** the catch-all loop-breaker.
- **Autocombat settings tab**: removed entirely; AI is 100% rune-derived.
