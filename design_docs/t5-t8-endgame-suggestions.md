# T5–T8 — Scaling Into Endgame

**Scope:** suggestions for the back half of the game. Operating principle
(confirmed): **complexity peaks at T4.** T5 introduces the last big axis
(AoE / packs); T5–T8 is the long grind — harder content recombining the
established vocabulary, not new vocabulary. Proposals, not canon.

---

## 0. The design problem of the back half

The front half's engine of novelty (a new axis per tier) deliberately shuts off.
What replaces it must make *repetition* interesting, because T5–T8 is mostly
repetition by intent. Three replacement engines, in order of importance:

1. **Recombination** — the vocabulary is fixed; the *combinations* aren't.
   Mixed-shape packs, layered enemy defenses, dual-mechanic biomes, gauntlet
   compositions. The bible already plans this (later biomes carry 2–3 mechanics).
2. **Build maturity** — the player systems finally at full expression: relic
   depth, rune vocabulary completion, +3 fork choices, cross-biome capstones.
3. **Grind quality** — the systems that make hour 200 feel good: boss routes,
   away-game design, world events, party play. These carry four tiers; they're
   worth front-loading (most are specced in the dungeon and rune docs).

---

## 1. T5 — the AoE / pack axis (the last lesson)

### Enemy side: packs

Mobs spawn and act as **packs**, not individuals. Deterministic pack behavior:

- **Shared aggro** — engage one member, the pack engages you (the defining rule).
- **Formation spawn** — packs spawn as authored compositions (e.g. 1 bruiser +
  3 skirmishers; 5 chaff + 1 ranged), not density soup. Composition IS the
  content at T5 — it's how fixed vocabulary keeps producing new questions.
- **Alpha (optional, the good twist):** one member is the pack's anchor — while
  alive, the pack holds a capped buff (the existing `rampOnCombat`/buff plumbing,
  pack-scoped). Kill the alpha, the pack deflates.

The alpha makes the player's T5 choice *tactical, not just statistical*:
**AoE the followers down, or assassinate the alpha** — and which is right depends
on the pack composition, so neither branch is globally correct.

### Player side: the AoE-or-double-down choice

Tools arrive through both passives and items (this is also where the T4–T7 tree
placeholder nodes get real):

- **AoE branch:** the parked variants finally land — *Seismic* (slow weapon
  cleave), *Plague* (DoT contagion, Graveyard lineage), Energy storm AoE
  ("nearby enemies" was explicitly deferred to T5), cleave passives. Targeting
  rune: `favor clustered targets`.
- **Single-target branch:** *Execute* lineage (Trench), alpha-killer tools,
  empowered-multiplier depth. Targeting rune: `hunt the alpha`.

**The AoE budget rule (write it into the bible before building anything):**
AoE pays a **per-target discount** such that there is an explicit **break-even
density** (suggest ~3 targets): below it single-target wins, above it AoE wins.
This keeps budget separation intact (same offense budget, spread), keeps
single-target the boss answer, and makes the branch choice a density bet — which
is already the biomes' distinguishing axis, so biome choice and branch choice
finally interlock.

### Content fit

- T5 boss layer = **adds** (boss-design.md, already planned) — the boss version of
  the pack lesson.
- Gauntlet phases become authored packs (dungeon doc §1) — the dungeon is where
  pack composition is curated rather than ambient.
- The slow-boss **cleave guardrail** (anti-summon) is unrelated plumbing that
  becomes the AoE implementation seed — same `attackAoe` shape.

---

## 2. T6–T8 — tier identities without new axes

Each tier still needs a nameable identity. Recombination supplies them; suggested
assignments (one per tier, mirroring trash→boss as always):

| Tier | Trash identity | Boss layer (new, one per tier) |
|---|---|---|
| **T6 — layered defenses** | enemies combine two defenses (shield **+** soft-cap; evasion **+** plating); mixed-shape packs | **twin bosses** — two bodies, complementary shapes/defenses, shared or linked HP. The ultimate coverage exam; naturally party-friendly without requiring a party |
| **T7 — elite war** | pack + defense combined: elite packs with alphas that carry boss-grade mechanics; density extremes return harder | **the raid gauntlet** — the dungeon structure at full strength: multi-phase boss with adds *and* defense windows, attrition rules on; the designed party-optional peak |
| **T8 — the void** | every vocabulary element at maximum, void-corrupted variants of earlier archetypes (the callback tier) | **the Void Overlord** as the finale it already is (`overlord:felled`, persisted cooldown, ultimate-encounter plumbing all exist) |

Notes:

- **Twin bosses (T6)** need one new behavior (two bosses sharing an encounter +
  a link rule), and they're the cleanest "harder without new mechanics" payoff:
  each twin is a solved problem; the *pair* is not. Deterministic link options:
  shared HP pool, or "while both live, both keep a capped DR buff."
- **T8 as callback tier** is cheap and emotionally right: void-touched versions of
  T1–T4 archetypes (the swarm, the slammer, the rotter) at endgame numbers — the
  player re-meets the whole game at the end with a full build. This is also where
  the held-back superlative naming finally spends itself (audit §5.3).
- Biome roster keeps rolling per the bible (~2 in / ~2 out per tier, mechanics
  re-housed). Flavor ramp: T4 stays mundane; T5–T7 grow stranger (storm peaks,
  ruin fields, abyssal depths); T8 is openly otherworldly. The void is the
  endgame flavor budget — don't spend it earlier.

---

## 3. Build maturity systems (what the grind is *for*)

- **Relics deepen, not widen:** keep the one slot; T5+ adds higher relic tiers of
  the same nine archetypes (bigger trade-offs, e.g. Brutality at −0.4/+0.6), plus
  the boss-unlocked recipe lines (dungeon doc §4). The "fewer but enormous" build
  space is the endgame itemization story.
- **Rune completion:** vocabulary finishes growing ~T6 (~20 conditions / ~25
  actions vs 16 BP at T8) — endgame rune play is *optimization*, lighting a third
  of the board well. Hidden/flaw fragments are the back half's collectibles.
- **+3 forks** (suggestions doc §2.2): at T5–T8 tiers last long enough that the
  +3 choice is lived with — the fork matters more here than at T1–T4 pace.
- **Crosses widen:** the 75/25 hybrid system plus retiring biomes means late-tier
  recipes are where cross-biome identity peaks; T7–T8 capstones can run 60/20/20.

---

## 4. Grind quality (the systems that carry hour 200)

- **Boss routes:** respawn timers + standard essence ratio on boss XP already make
  a six-dungeon circuit good essence/hour — surface it (map shows boss-up status)
  rather than inventing a new reward system.
- **World events:** gauntlet final-phase broadcasts, overlord windows, "first
  fell" records — presence-based MMO texture, no interdependence (and still no
  trade; the economy's purity rule outranks it).
- **The away-game needs its one-pager before T5** (suggestions doc §3.2): T5
  ramp/pack farming and AoE clears change offline math materially, and the rune
  system is the natural away-permission language ("your overnight routine is
  whatever your rules say").
- **Ascension:** `player:ascended` exists in the protocol but has no design doc.
  The endgame loop deserves one page: what triggers it (Overlord?), what resets,
  and what carries. Natural answer given everything above: **owned rune fragments
  carry (knowledge), stats and gear don't** — "your character's mind is what
  survives" is thematically perfect for this game and mechanically clean (BP
  budget re-grows with tier anyway, so carried fragments don't break early
  balance — you know the words, you can't afford them yet).

---

## 5. Numbers discipline

- The existing XP curve (`25 × n^2.8`, +4 levels/tier) extrapolates fine: each
  T5–T8 phase is ~1.5–1.6× the previous phase's XP. The real decision is
  **wall-clock targets per tier** (T2 is ~15–20 min; what is T6 — days? a week?).
  Set those targets explicitly before tuning T5 mob XP; everything else follows
  from `BIOME_XP_BASE` as designed.
- The treadmill rule holds: ~1.9–2× stats/tier, eHP/H ≈ constant, TTK ≈ constant.
  "Bigger numbers, same feel" is *correct* — texture variety (packs, layered
  defenses, compositions) is what changes, per §2.
- Watch the two compounding seams flagged in the audit at every tier: heal
  throughput soft cap (~3–4% maxHP/s) and ramp-stacking (ramp specs × buff relics
  × long-fight items), since T5–T8 content is *longer fights by design* — the
  exact axis those all scale on.

---

## 6. Suggested order

1. AoE budget rule + pack behavior spec (write into bible §, before any T5 item)
2. T5 biome/item/monster pass (the parked variants: Seismic, Plague, storm AoE)
3. T5 boss layer (adds) + gauntlet pack phases
4. Away-game one-pager + ascension one-pager (before T6 design)
5. T6 layered defenses + twin-boss prototype
6. T7 raid gauntlet (the dungeon system at full strength)
7. T8 void callback tier + Overlord finale polish
