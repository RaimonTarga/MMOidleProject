> **ARCHIVED (2026-08-09) — HISTORICAL BRAINSTORM (June 2026).** Not a live backlog: ideas that
> survived are tracked in `docs/future-plans.md` (the parking lot) and `docs/polish-and-balance-roadmap.md`.
> Companion audit: `design_docs/archive/design-audit-2026-06.md`. Kept for rationale.

# Design Development Suggestions — Brainstorm, June 2026

**Scope:** forward-looking ideas for developing the game, written against the
existing axioms (deterministic, fully-auto, build-test-not-reflex-test, separated
budgets, solo-complete/party-incentivized, server-authoritative). Everything here
is a proposal — graded by cost where useful. Companion: `archive/design-audit-2026-06.md`.

The framing I'd push hardest: **your game's "skill" is preparation — builds,
gear, routing, and (uniquely) programming your character's AI.** Every suggestion
below tries to deepen one of those four, because those are the only inputs the
player legitimately has. Anything that would require reflexes or mid-fight inputs
is out of bounds by your own axioms, and that's a feature: it forces dungeon and
itemization design into genuinely novel territory instead of copying action-RPG
patterns.

---

## 1. Dungeons — from "harder node" to the game's exam room

> **Superseded:** this section is expanded and revised in
> `archive/dungeon-design-brainstorm.md` (which also corrects §1.6 — current-tier gear
> gating was rejected; boss rewards must be carry-forward value).

### 1.0 Diagnosis: why they're bland

Today a dungeon is `isDungeon: true`: same node, same population, ×2 HP / ×1.6 ATK,
plus a persistent boss. Structurally it's a *stat tax*, not a *different
experience* — nothing about being inside one changes what the player thinks about
or how their build is interrogated. Meanwhile dungeons are load-bearing in your
progression: every tier-up quest requires a dungeon boss kill. The single mandatory
piece of content is the least designed one. That makes dungeons the highest-leverage
design target in the game.

The fix is not "more stats" — it's giving dungeons a *structure* that tests the
things your game is actually about. Five composable ideas, roughly cheapest-first:

### 1.1 Attrition rules (cheap, big effect)

Inside a dungeon, suspend or restrict out-of-combat regen (e.g. OOC regen at 25%
effectiveness, or only at fixed "campfire" sub-points). Suddenly:

- **Recovery itemization matters somewhere.** Right now sustained-recovery gear
  (Deepfreeze Ward, ramp-regen, absorb) competes with burst mitigation everywhere
  and wins nowhere special. A no-free-regen environment is its home turf.
- The dungeon becomes a *budget* question — "can my build clear 30 mobs and a boss
  on one HP economy?" — which is a build test, exactly your design language.
- Zero new systems: it's a node-scoped modifier on the existing regen rule.

Guardrail: never zero out recovery entirely (self-reliant-grind axiom). Tune so a
recovery-invested build farms the dungeon comfortably and a glass build gets in,
kills the boss, and leaves.

### 1.2 The wave-gauntlet (no terrain required — it's a spawn director)

There are no rooms in this world and there don't need to be. A "gauntlet" here is
purely **a state machine on the dungeon node's spawner**: instead of maintaining a
steady mixed population + persistent boss, the dungeon node spawns its population
in **phases**, and kills advance the phase. The boss only spawns when the final
phase is cleared. ("Slay a number of strong, buffed mobs to spawn the boss" is the
single-phase version of this; the upgrade is making the phases *differ in shape*.)

Example Mountain T2 dungeon, same node, zero terrain:

1. Phase 1 — the biome's home shape at elevated density (big-hitter pack; cap test)
2. Phase 2 — the biome's *cross* shape (DoT ambushers; tests off-shape coverage)
3. Phase 3 — 2–3 elite "boss guards" (the buffed-champions idea; the dps/eHP check)
4. Boss spawns via `ensureBoss()` — the biome shape concentrated, per boss-design.md

Why this works for *this* game specifically:

- **It's a coverage exam.** One phase is always off-shape for your build. A narrow
  specialist deletes their phase and grinds through the off-phase; a generalist
  sails evenly. The bible's gear-check philosophy, expressed entirely in spawn data.
- **It gives the threat matrix a stage.** In open-world farming, players park in
  the biome that suits them and never feel the matrix. The gauntlet forces a walk
  across it once per tier.
- **It's natively MMO.** Gauntlet progress is *node state*, not player state —
  everyone on the node contributes kills and the phase advances for all of them.
  Strangers showing up mid-gauntlet is ad-hoc cooperation for free
  (solo-complete, party-incentivized — same-node reward sharing already exists).
- **Reset comes free from freeze/thaw.** Monsters are already ephemeral; when the
  node empties and freezes, the gauntlet state resets with it. No death rule, no
  instance management, no persistence — deaths already punish via Clearing respawn.
- Phase markers give partial-clear feedback ("we died in phase 2 — what shape was
  that?") which teaches better than open-field deaths ever can.

Cost: modest. A per-node phase counter + per-phase spawn pool override on dungeon
nodes; the spawn system, `ensureBoss()`, freeze/thaw, and node deltas already do
the heavy lifting. Client needs only a phase-progress indicator on the HUD/node.

At T5 this slots straight into the pack axis: phases *are* packs, and the dungeon
becomes the place where pack composition is authored rather than ambient.

### 1.3 Defense-matchup phases (T4-flavored)

At T4 the axis is enemy defenses. A T4 dungeon phase keyed to one enemy defense
(all-shielded wave, all-soft-capped wave) makes the weapon-matchup lesson explicit
and gives Sunder/brittle/Plague-axe builds a place to shine on purpose. This is
also where the audit's "matchup grid" becomes content: one phase per column of the
grid. Write the grid once (build × enemy-defense), then dungeons *are* the grid.

### 1.4 Rune-gated interactivity (the signature move — nobody else can do this)

You have a gambit system (`condition → action` rules) that is currently 3×3 and
almost decorative. **Dungeons should be the content that makes runes matter.**
Design gauntlet phases whose optimal clear depends on having wired the right rule:

- A ramping-enrage elite guard whose ramp resets when it drops aggro → the
  `Hurt → Flee` rule turns a losing fight into a cycle. Players who never opened
  the rune panel learn why it exists.
- An all-kiter phase → `Fighting → Keep Distance` vs charging in.
- Later fragments unlock richer puzzles: `boss-shield-up → hold position`,
  `phase-cleared → re-engage`, `ally-hurt → intercept` (party rune!).

This is, as far as I know, **a genuinely novel genre position**: an idle RPG where
dungeon mastery = programming. FFXII's gambits were beloved and have had almost no
successors; in an idle game they're not just flavor, they're the *only* possible
expression of player skill, which makes them load-bearing in the best way. I'd
grow the fragment vocabulary on the same cadence as mechanics (~2/tier, per the
bible's vocabulary model) and treat new fragments as *dungeon drops* — the dungeon
teaches the rule, then rewards you with the fragment that automates it.

### 1.5 Boss-doc pointers (for the T4 boss doc you're planning)

- The T4 layer (defense-break window) should be **schedulable, not reactive**: the
  boss hardens on a fixed visible cycle (e.g. shield for 4s every 14s, exactly the
  trash `enemyShield` numbers), so burst builds *time out* the window naturally and
  the test is "does your damage profile fit the rhythm," not "did you react."
- Consider one **coverage boss** per tier (dungeon final boss) and keep open-world
  bosses single-shape. The dungeon boss is allowed to phase across two shapes
  because the gauntlet already taught both upstream.
- Party tier: a cleaving, debuff-stacking dungeon boss is your
  "solo-hard/party-comfortable" knob — debuff pressure scales down per-player with
  cleanse coverage spread across a party. No new mechanics needed; it falls out of
  existing cleanse math.
- Reuse the gauntlet for **boss-rush mode** later (all five T-tier dungeon bosses
  back-to-back, attrition rules on) as a cheap prestige-tier challenge.

### 1.6 Why hunt the *other* bosses — bosses as unlock sources, never drop sources

Current state: each tier has one dungeon boss per biome, the tier quest needs any
one of them, and the rest are optional with no pull. Exclusive boss *recipes* feel
wrong because they'd break the recipe system — and they would, **but only if
bosses drop things.** The fix is a reframe that fits the existing economy
philosophy exactly:

> **Level unlocks the chance. Essence pays for it. The boss *proves* it.**

A boss kill is a deterministic, per-character **flag** ("felled the Glacial
Tyrant"), never a loot drop. Flags gate things that still cost normal essence
through the normal forge. Nothing about drops, purity, the 0.16 ratio, or recipe
structure changes — you've added a third gate beside level and cost, not a
parallel acquisition path. (Bonus: loot drops were always quietly in tension with
the no-RNG axiom; flags are the deterministic-native version.) Concretely:

- **(Rejected) capstone/+3 gating:** gating the +3 step behind the biome's boss
  rewards obsolete power — next-tier +0 weapons already beat last-tier +3, and
  the boss kill lands exactly when you're moving on. Lesson kept as a rule:
  **boss flags must gate carry-forward value** (relics, rune fragments, account
  flags), never current-tier gear power. See archive/dungeon-design-brainstorm.md §4.
- **Relic recipes (T4+, the strongest repeatable identity):** relics are a new
  slot with no legacy recipe rules to break. Let each T4 dungeon boss unlock a
  different relic recipe line matching its biome's character (Mountain boss →
  potency-leaning relics, Jungle → frequency, Graveyard → buff-mult…). Boss
  unlocks the recipe; essence pays for the craft. Every boss now has a distinct
  answer to "why kill *this* one."
- **Rune fragments (the one-time pull):** each dungeon boss's first kill grants a
  rune condition/action fragment. The fragment vocabulary grows ~2/tier anyway
  (§1.4) — that's roughly one per new biome, and it pairs naturally: the gauntlet
  teaches the behavior, the boss awards the rule that automates it. Tier quest
  stays "any one boss"; completionists get a concrete reason for the other five.

Fragments pull you to each boss once, relic lines pull you back per-tier, and the
wave-gauntlet (§1.2) makes each hunt an *event* rather than a walk-up.

### 1.7 What I'd *not* do

- Random modifiers/mutators ("this week: +30% mob APS") — fights the determinism
  identity unless rotation is a fixed published schedule, and even then it's meta
  noise rather than build depth. Park it.
- Timed/leaderboard dungeons as a core mechanic — speedrunning an auto-battler is
  DPS-check-by-another-name; fine as cosmetic flavor, hollow as a pillar.
- Procedural layouts — authored rooms are your strength; proc-gen dilutes the
  exam-room precision that makes the gauntlet idea work.

---

## 2. Itemization — is it diverse enough?

### 2.1 Honest answer: mechanically rich, combinatorially thin, and that's mostly fine

The *mechanic* diversity is genuinely good — the ownership map has ~16 defensive
mechanics, 5 weapon archetypes with a real variant tree, and the T4 capstones are
distinctive. The thinness is structural: **a build is ~4 gear decisions** (weapon,
armor, charm, boots) + class/frame/range/spec. With 7 active biomes that's a large
nominal space, but the threat matrix means the *effective* space per situation is
small — vs a given biome, the right armor is usually determined.

Two things keep this from being a problem:

1. **In a deterministic game, "solved" is unavoidable — the design goal is that
   the solution *varies by context*, which the threat matrix delivers.** Diversity
   in your game shouldn't mean "many equally good choices in a vacuum" (that's
   balance mush); it should mean "the best choice changes as you move." It does.
2. The relic slot (planned) and the rune system (live) are both itemization axes
   that *don't* collapse to the threat matrix — they're build-expression layers.

So: don't add slots for slots' sake. But there are four real gaps worth filling:

### 2.2 Gap — end-of-line choice inside an item

Weapons already have upgrade-branch forks; armor and charms don't. **Extend the
fork to armor/charm at +3**: the final upgrade step offers a choice of two
capstone twists (e.g. Titan's Keep +3 picks *cap-rearms-shield* or
*shield-break-recovery*). This roughly doubles endgame defensive diversity with
**zero new items, zero new mechanics** — it recombines twists you've already
designed (the v2 doc's "alt" rows become fork branches instead of separate
recipes). It also gives the upgrade grind a decision at the top, where the economy
doc says the grind lives.

### 2.3 Gap — nothing itemizes the AI axis

Gear modifies stats and mechanics; nothing modifies *behavior capacity*. Ideas:

- **Rule slots as progression**: base 2 equipped rune rules, +1 from a T3 boot
  line, +1 from a relic. Suddenly "how smart is your character" is a build stat.
- **Fragment-bearing gear**: an item that grants a condition/action fragment while
  equipped (the Trench stealth boots are *already* secretly this — behavioral gear).
- This ties your two most original systems (runes, itemization) together and gives
  the utility slot family a unique currency that doesn't compete with eHP/DPS
  budgets — it's a *third budget*, which keeps the separation axiom clean.

### 2.4 Gap — the charm slot is one-dimensional

Every charm is recovery-shaped (regen/absorb/shield/burst variants). That's by
design (defense budget), but within recovery the *trigger* is the only variance.
Cheap widening without breaking budget separation: charms that trade raw recovery
for **recovery delivery** — e.g. a charm whose heal banks while at full HP and
releases on the next damage spike (deterministic), or one that converts overheal
to the party's lowest-HP member (party tag on the defense side, which §8 of the
bible currently lacks — almost all party tags today are offensive).

### 2.5 Anti-recommendations

- **Set bonuses** — would fight your cross-biome mixing identity head-on. The
  crosses *are* your set system; same-biome 2-piece bonuses would tax exactly the
  hybridization the T3+ design celebrates. Skip permanently.
- **Random affixes / quality rolls** — violates determinism, full stop. If you ever
  want per-item variance, the fork model (§2.2) is the deterministic version.
- **Consumables** — manual input in an auto-game; dead on arrival unless
  rune-triggered, and rune-triggered consumables are just charms with extra steps.
- **More base slots** (rings/trinkets) — dilutes the legibility of "4 slots, each
  with a job." Relic is the right fifth slot *because* it has a distinct job
  (mechanic modulation). Stop at five.

---

## 3. Bigger-picture directions

### 3.1 Name the fantasy: you're building a *coach*, not a fighter

The emerging player identity across all systems is: *you are the
trainer/programmer of an autonomous hero* — builds, gear, routing, rune logic.
I'd elevate this from implicit to explicit in framing and UI: post-fight "why did
I die" breakdowns (which shape killed you, which rule fired), a planning-table
feel to the rune panel, dungeon previews that read like scouting reports. Genre
neighbors (Melvor, NGU, Leaf Blower) compete on numbers; nobody competes on
*"my AI is smarter than yours."* That's your moat. The audit's structural praise
all supports this: determinism makes AI behavior predictable enough to program
against, which is exactly why the no-RNG axiom is worth more than it looks.

### 3.2 The away-game needs a design doc

For an idle MMO, "what happens while I'm offline / tabbed out" is a first-class
design surface and currently undocumented (the server simulates, but is offline
progression intended? capped? summarized?). Whatever the answer, it interacts with
everything above: Momentum/Critical-Mass-style session ramps, dungeon runs,
auto-traverse runes. Suggest a one-pager with the same rigor as the economy doc.
Notable synergy: **the rune system is the natural offline-permission system** —
what your character does while you're away is precisely what your rules say. "Set
up your character's overnight routine" is a killer idle hook that again only your
game can do.

### 3.3 Tier rhythm: T4 is the complexity peak; T5–T8 is the long grind

(Confirmed direction:) complexity does not keep scaling past the midpoint — T4 is
where most mechanics are out, T5 introduces the last big axis (AoE/packs: mobs
acting as packs; players choosing between AoE tools or doubling down on
single-target), and T5–T8 is the long grind with harder content recombining the
established vocabulary. Two consequences worth designing for:

- **The AoE-vs-single-target choice is the perfect partner for the dungeon split
  (§1).** Trash farming and gauntlet phases reward the AoE branch; elite guards
  and boss hunting reward the single-target branch. If both halves of every
  dungeon exist (waves *and* boss), neither specialization is a trap — and the
  choice finally differentiates *content preference*, not just combat math.
- **The grind tiers live or die on grind-quality, not novelty.** Since T5–T8 add
  fewer mechanics, the systems that make repetition interesting carry the load:
  the rune/AI layer (§1.4, §3.1), capstone/boss/relic pulls (§1.6), and the
  away-game design (§3.2). Those are the investments that pay off four tiers in a
  row.

### 3.4 The MMO layer: presence over interdependence

Party play is well-designed (incentive math, debuff tags). The cheap *MMO-feeling*
wins that don't compromise solo-complete: world-boss respawn announcements (you
have `world:bossFelled` already), seeing other players' fights in shared nodes
(you have this), a per-biome "first to fell this tier's boss" record board. I'd
**avoid trade** — the economy doc's "pick a biome for its fight, not its payout"
invariant dies the moment essence is transferable. If you want player-to-player
economy later, trade *rune fragments* or cosmetics, never essence/gear.

### 3.5 Sequencing suggestion

1. **Dungeon attrition rules + gauntlet structure** (§1.1–1.2) — highest leverage,
   touches mandatory content, mostly reuses existing systems.
2. **T4 boss doc** with the defense-rhythm framing (§1.5) — you're already planning
   it; the gauntlet decision shapes it, so do it second.
3. **Rune fragment expansion + first rune-gated room** (§1.4) — the signature.
4. **+3 fork itemization** (§2.2) — cheap, post-T4-lock, feeds the economy grind.
5. **Away-game one-pager** (§3.2) — before any T5 work, since T5 ramp specs and
   AoE farming change offline math.
