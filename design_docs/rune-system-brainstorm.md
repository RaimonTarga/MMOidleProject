# Rune System — Diagnosis & Rebuild Plan

**Scope:** how to get the rune system from "underbaked MVP" to the game's signature
system. Reads `.cursor/design/runes.md` (technical design), `.cursor/design/runes_design.md`
(catalog), `shared/src/runeDatabase.ts` + `server/src/systems/combat/ai/runeConfig.ts`
(the shipped MVP). Proposals, not canon.

---

## 0. Diagnosis — it's not underdesigned, it's unstaged

The system actually has a **complete, coherent, locked design**: ECA rules
(`condition → action`), fragments found separately, BP graph economy (pay per
*word*, not per rule), flaws, charge/fuel, four-channel arbitration, intentional
trap builds with "Rune Malfunction" attribution. That design is good — parts of it
are the best design writing in the project.

What shipped is ~5% of it: 3 conditions × 3 actions, all granted free, no costs,
no budget, no events, no arbitration (the fold is three OR'd booleans), no
acquisition. And the seams show:

1. **Half-migration is the "mess" feeling.** `updateRuneDerivedConfig` already
   stamps the autocombat config every tick, "overwriting any stale settings-tab
   values" — so runes are *already* the sole driver, but the settings-tab removal
   (design §13) never happened. Two systems both think they own the AI.
2. **The MVP types drifted from the design.** `ConditionDef`/`ActionDef` lack
   `cost`, `kind`, `trigger`, `effect`; `EquippedRule` lacks `charge`. The design
   doc and the code describe different data models.
3. **The full design is all-or-nothing flavored.** Five subsystems (graph budget,
   flaws, events, arbitration, charge) + a UI overhaul + an acquisition economy,
   with no defined intermediate states. That's why the MVP stalled where it did —
   the next step looked like "build everything."
4. **The economy moved underneath it.** The charge system was designed when essence
   was over-plentiful ("deliberately generous… never blocked"). The economy patch
   then deliberately made essence scarce (capping easier, maxing costlier). The
   premise is gone.
5. Two docs disagree on the currency name (BP vs RP). Trivial but symptomatic.

The fix is not redesign — it's **one cut, one substitution, and a staged build
order** that produces a playable, honest system at every wave.

---

## 1. Verdicts on the locked decisions

| Decision | Verdict | Why |
|---|---|---|
| ECA model, fragments drop separately | **Keep — it's the moat** | Every found fragment multiplies against everything owned. No other idle game has this. |
| BP graph cost (pay per distinct word) | **Keep — best single idea in the doc** | "Builds are wiring, not shopping." Cheap to validate server-side, deep to play. |
| Budget = 2 × playerTier, T0 = 0 | **Keep** | "T1 is when the AI becomes programmable" is a great beat. T8 → 16 BP sets vocabulary targets (§5). |
| Dumb baseline, permanent lowest-priority rule | **Keep** | The un-brickable guarantee everything else leans on. |
| Trap builds + "Rune Malfunction" attribution | **Keep** | The comedy is identity. Legibility (death cause) is what makes it fun instead of confusing. |
| Settings-tab removal | **Keep, and do it FIRST** | The half-state is the mess. See wave 1. |
| Flaw conditions (negative cost, cap 2) | **Keep, defer** | Pure content; needs acquisition + family-conditions first. Wave 3. |
| Channel/category arbitration | **Keep, defer until needed** | With ≤ ~6 actions there are no real channel conflicts; OR-folding is honestly fine. Build arbitration in the same wave that adds conflicting `move` goals — not before. |
| **Charge / fuel economy** | **Cut** | See §2. |

---

## 2. The cut: charge

Charge is the one subsystem I'd remove outright, for four reasons:

1. **It taxes exactly the engagement you want.** Every other system is buy-once
   (gear, skills, recipes). Runes alone would carry upkeep — and players answer
   upkeep by minimizing use of the taxed system. The system whose adoption you
   most need is the one being made expensive to run.
2. **Its economic premise is dead.** Post-economy-patch, essence is the scarce
   currency gating the +3 grind. An any-essence drain now competes directly with
   gear progression; "a more elaborate brain has a higher electricity bill" reads
   as a fine on cleverness.
3. **Its real job is small.** Charge exists to self-terminate `oneshot` loops
   (`always → respawn-now`). That's a loop-breaker problem, not an economy problem.
4. **It's the most expensive remaining subsystem**: per-rule persisted meters,
   drain in the arbitration pass, recharge hooks in rewards, fuel-bar UI, four
   tuning knobs per action.

**Replacement loop-breaker (cheap, keeps the comedy):**

- Event/`oneshot` rules carry an **internal cooldown** (e.g. `respawn-now` fires
  at most once per 5s) — a runaway loop becomes a slow comedic loop, not a
  tick-rate one.
- A rule that causes **N self-kills within M minutes shorts out**: it goes dark
  and stays dark until the player manually re-arms it in the panel. Same "dark
  rule + death log points at the culprit" teaching moment, zero economy.
- Deaths still stamp `"Rune Malfunction"`. Everything §12.1 of the design wanted —
  bites, self-terminates, legible — survives.

If a rune-flavored essence sink is still wanted later, put it on **acquisition**
(boss unlocks the fragment, essence pays to attune it — one-time, matching the
forge pattern), never on operation.

---

## 3. The staged build (each wave ships a complete-feeling system)

### Wave 1 — "make the MVP honest" (small; mostly deletion + data)

The trick that makes this wave cheap: **every wave-1 action is an existing
`AutocombatConfig` field exposed as a fragment.** The fold already does
last-writer-wins generically; no new AI code.

1. Add `cost` to `ConditionDef`/`ActionDef`; add the BP formula (distinct lit
   words) + budget `2 × playerTier`; validate on `rune:setLoadout`.
2. **Delete the autocombat settings tab** (design §13 cleanup list). One owner.
3. Expand the catalog to ~6 conditions × ~8 actions, all mapping to existing
   engine behavior: `always` (cost 0), `hp-below(25)`, `hp-below(50)`, `in-combat`,
   `when-idle`, `solo` / `party-member` → actions: `flee`, `keep-distance`,
   `explore`, `priorityMode: damage/threat/balanced`, `shrink-radius`,
   `focus-leader-target`, `engage-ultimate-bosses`.
4. **Starter kit:** early quests grant the QoL floor fast — `hp-below(25)` + `flee`
   at the T1 quest (Survivor), `when-idle` + `explore` shortly after (Explorer).
   The baseline must carry T0 alone (design constraint already accepted).
5. Pick one currency name (RP reads better player-facing) and fix both docs.

Exit state: budget is real, fragments are owned-vs-equipped, the AI has one owner,
and the loadout panel means something. Still no events — that's fine.

### Wave 2 — events + the identity moments

1. Event conditions off existing hooks: `on-death` (`player:died` path),
   `on-kill` / `on-damaged` (combat pipeline stages). Hysteresis bands on
   `hp-below` / `n-aggro`.
2. `oneshot` channel + `respawn-now`, **with the §2 loop-breaker** and
   `"Rune Malfunction"` cause on the kill path.
3. The flagship wirings now exist: Phoenix, Revenge (`on-death →
   return-to-death-site`), Recruiter, Panic (`n-aggro(3) → flee`).
4. First real `move`-goal actions beyond flee/explore (`return-to-death-site`,
   `go-to-town-and-wait`) — **this** is when channel arbitration gets built,
   because this is when two move goals can genuinely collide.

### Wave 3 — wiring depth (content, not systems)

Flaws (cap 2, negative cost), hidden/earned conditions (`killed-by(family)` after
5 deaths to it, `sees-family(X)`), nemesis/mirror-match targeting actions, named-
pairing discovery in the UI (the existing `NAMED_RULES` flavor text is already
this — keep it, surface it as "discovered combos").

### Wave 4 — cross-system hooks (where runes become load-bearing)

- **Dungeon conditions:** `boss-shield-up`, `gauntlet-phase-cleared`,
  `fighting-elite` — the rune-puzzle content from `dungeon-design-brainstorm.md`.
- **Party linking:** `ally-hurt → intercept`, `engage-only-ally-aggroed`.
- **T5 pack hooks:** `favor-clustered-targets`, `hunt-the-alpha` — the AoE/single-
  target choice expressed as targeting rules (see t5–t8 doc).

---

## 4. Acquisition (binds runes to dungeons and bosses)

Per the unlock-not-drop principle (`dungeon-design-brainstorm.md` §4): fragments
are flags, deterministic, never RNG drops.

- **Boss first-kills** grant fragments — each tier's six dungeon bosses cover that
  tier's new vocabulary (~2 conditions + ~3–4 actions per tier matches both the
  BP curve and the bible's "~2 mechanics/tier" cadence). The tier quest still
  needs only one boss; the other five each hold a distinct word.
- **Quests** carry the QoL floor (wave-1 starter kit) so no essential behavior is
  missable.
- **Hidden conditions** stay earned-by-doing (killed-by-X, visited-N-nodes) —
  they're the system's collectible layer and cost nothing to gate.
- Vocabulary target by T8: ~20 conditions + ~25 actions ≈ 16 BP budget lighting
  up maybe a third of the board — choices stay real at endgame.

---

## 5. Open calls

- **Confirm the charge cut** (§2) — it's a locked decision in runes.md §15, so it
  needs an explicit un-lock from you, not silent drift.
- Wave-1 catalog costs: flat 1 RP per word (with `always` free and the two
  3-RP autopilot actions from the catalog doc) is probably right to start.
- Does `explore`/auto-traverse stay a 1-RP word or become the 3-RP `seek-new-biome`
  from the catalog? (Today's MVP gives it away; wave 1 should decide its price.)
- Arbitration tiebreak by loadout order requires drag-reorder UI — schedule with
  wave 2, not 1.
- Bench: give `botFactory` bots rule loadouts so AI quality differences are
  visible in `bench:balance` runs (the bench currently models the dumb baseline).
