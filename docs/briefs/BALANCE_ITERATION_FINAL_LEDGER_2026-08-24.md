# Final change ledger — T1-T4 balance iteration, 2026-08-24

Closing document for this session's numerical balance pass. Supersedes the earlier
`BALANCE_ITERATION_PROGRESS_REPORT_2026-08-24.md` for anything the two disagree on — this
one reflects the post-revert, post-test-fix, final state. Autonomous sweep is **stopped**
per explicit instruction; no further gameplay changes were made after this ledger.

**Repo state**: nothing committed. `pnpm typecheck` clean. `pnpm test`: **94/94 passed**
(one interim failure, `desertPairs.test.ts`, found and fixed — see Ledger 2). Reports
regenerated to match final state. `pnpm db:up` containers still running locally.

---

## 1. T1 provisional changes (kept, unchanged this session, still awaiting manual playtest)

| File | Entity | Field | Before → After |
|---|---|---|---|
| `shared/src/data/recipes/cave.recipes.ts` | Chaotic Axe | `stats.attack` curve +0→+5 | 24/26/28/30/33/36 → 22/23/25/27/30/32 |
| `shared/src/data/monsters/mountain.monsters.ts` | Cliff Hopper | `chargedAttack.multiplier` | 2.1 → 1.9 |
| `shared/src/data/monsters/mountain.monsters.ts` | Ridge Ambusher | `chargedAttack.multiplier` | 2.5 → 2.2 |
| `shared/src/data/monsters/bossesT1.ts` | Gnarled Greatbear | `rampOnCombat.perTickPct` / `.maxPct` | 0.07/0.28 → 0.05/0.20 |

Applied under designer-set D1/D2/D3 anchors from the prior session. Not re-verified this
session beyond what was already reported then.

---

## 2. High-confidence T2-T4 monster fixes (kept provisionally, verified this session)

All are cuts to a **plain, untelegraphed ordinary attack only** — every monster here was
checked for a `chargedAttack`/root/lockdown first, and if present that ability's own
multiplier was left untouched. Verified via death-trace (real combat-pipeline hit log)
followed by a full 6-class `runFarm` re-run (20 sim-minutes each, real server combat).

| File | Monster | Attack before → after | Evidence |
|---|---|---|---|
| `desert.monsters.ts` (`dust-djinn`) | Sun Scarab (T2) | 156 → 85 | 165 dmg = 63.7% of maxHP every ~2s, dominant killer |
| `desert.monsters.ts` (`sand-scorpion`) | Sand Scorpion (T2) | 132 → 75 | 136 dmg = 52.5% of maxHP |
| `desert.monsters.ts` (`stone-basilisk`) | Stone Basilisk (T2) | 138 → 55 | 144 dmg = 55.6% of maxHP; own comment says "weak normal attacks" — contradicted by the authored value |
| `volcano.monsters.ts` (`ember-scuttler`) | Ember Scuttler (T3) | 148 → 70 | 110-122 dmg (up to 42% maxHP); own comment says "weak... filler" — contradicted |
| `volcano.monsters.ts` (`cinder-hound`) | Cinder Hound (T3) | 184 → 135 | 150-165 dmg (up to 57% maxHP) |
| `volcano.monsters.ts` (`magma-brute`) | Magma Tortoise (T3) | 343 → 190 | 320-342 dmg — literal one-shot vs ~291 maxHP; own comment says "no signature ability," so this base number WAS the whole threat |
| `trench.monsters.ts` (`abyssal-serpent`) | Abyssal Serpent (T4) | 420 → 230 | 321-370 dmg (up to 81% maxHP), ordinary hit only — Abyssal Bite charged multiplier untouched |
| `trench.monsters.ts` (`hadal-stalker`) | Hadal Stalker (T4) | 401 → 210 | 304-342 dmg (up to 75% maxHP), ordinary only — Pressure Lance untouched |
| `trench.monsters.ts` (`elder-leviathan`) | Elder Leviathan (T4) | 483 → 260 | 370-376 dmg (up to 82% maxHP), ordinary only — Devour untouched |
| `desert.monsters.ts` (`sandspitter-cobra`) | Sunshield Scarab (T4) | 292 → **235** (see note) | 341 dmg = 62% of 549 maxHP every ~1.9s — was the real killer, not the analytically-flagged Dune Tyrant |
| `volcano.monsters.ts` (`obsidian-tortoise`) | Obsidian Tortoise (T4) | 262 → 100 | Clean author-error: monster's own comment computes intended DPS assuming base attack 100 (cadence-finisher comment literally says `// 220` = 100×2.2); authored value was 262 |

**Note on Sunshield Scarab**: the death-trace verified a cut to **180** as the target
value. That value broke a locked design-invariant test, `desertPairs.test.ts`, which
requires every pack controller/dealer pair to satisfy `controller.attack < dealer.attack`
— Sunshield Scarab is the shared dealer for both Dune Basilisk (attack 104, fine) and
**Dune Tyrant (attack 230, untouched)**. 180 < 230 inverted that pairing. Raised to the
minimum value that clears the constraint (235, not the trace-optimal 180) rather than
touching Dune Tyrant, which was independently confirmed (via the same trace) to be a
legitimate telegraphed-ability owner, not a plain-hit offender. This means Sunshield
Scarab's real-world fix is **weaker than verified** (a 19.5% cut, not the trace-verified
38.4% cut) — if T4 Desert is still rough after playtest, this is the first place to look.

---

## 3. Reverted hypotheses (charm buffs — explicitly unsupported, fully reverted)

All four `mechanicEffects` values below are confirmed byte-identical to their pre-session
state (`git diff --stat` on these four files returns empty).

| File | Item | What was tried | Result |
|---|---|---|---|
| `desert.recipes.ts` | `desert-charm-t2` (Mirage Talisman) | `cleanse-empty-heal-pct` 0.03→0.10 (+5 total 0.08→0.25), interval 6000→4500ms | **Reverted.** Re-test showed Desert deaths barely moved (Slinger 1047→990/hr, still 0 kills) |
| `tundra.recipes.ts` | `tundra-charm-t3` (Frostward Charm) | `barrier-pct` 0.12→0.18, `absorb-pct` 0.08→0.12 (+5 total 0.40→0.50) | **Reverted.** Part of the same disproven hypothesis |
| `volcanic.recipes.ts` | `volcanic-charm-t3` (Magmaheart Stone) | `recovery-active-pct` 0.06→0.14, `recovery-on-kill-pct` 0.04→0.09 (+5 total 0.30→0.43) | **Reverted.** Same |
| `trench.recipes.ts` | `trench-charm-t4` (Pressure Vessel) | `absorb-pct` 0.16→0.22, `recovery-pulse-pct` 0.10→0.15 (+5 total 0.51→0.62) | **Reverted.** Same |

**Why this matters methodologically**: the correlation (weak charm magnitude ↔ broken
biome) was real in the data but not causal. The actual cause in all four biomes was
oversized monster ordinary-attack values (Ledger 2), found only after building a
death-trace tool that logs real per-hit combat events. Do not re-propose a charm-magnitude
fix for these four items without new evidence — this exact hypothesis was tested and
falsified this session.

---

## 4. Unresolved class/mechanic issues (diagnosed, explicitly not touched)

| Issue | Evidence | Why not fixed |
|---|---|---|
| **Apprentice (dot-root) target-switching** | Death-traced at T2 Desert: 3 separate death cycles, 0 kills each, despite dealing real damage — spread across 3 different targets (Stone Basilisk/Sand Scorpion/Sun Scarab) each cycle, never enough sustained focus on one target to finish a kill. Still the worst class in T3 Tundra/Volcanic post-fix. | AI/aggro-priority behavior + DoT-stack-reset-on-target-switch — a mechanic, not a monster number. User separately floated a possible future "DoT spreading" mechanic for Apprentice as a theoretical idea, explicitly not for this session. |
| **Conduit (summoner-root) low summon output** | Death-traced at T2 Desert: 1 kill in ~40s of trace time; summon-formation damage (5 hits × 16 dmg/volley ≈ 80/volley) too low to finish a 660 HP monster before the pack kills the 261 HP player. Note: NOT broken everywhere — T3 Volcanic/T4 Trench Conduit results improved substantially from the Ledger-2 monster fixes (90→240 kills at T3 Volcanic). Only reliably bad at T2 Desert, worse at T3 Tundra. | Class/summon DPS output — explicitly "item and class numbers... escalate instead" per the very first handoff of this whole balance program. |

Both are real, reproducible, and now have concrete trace evidence attached in this
document — good starting point for a dedicated class-balance session.

---

## 5. Items requiring manual playtest before further action

- **All of Ledger 1 (T1)** — per the standing rule from the prior session; nothing new
  this session changes that status.
- **All of Ledger 2 (T2-T4 monster fixes)** — verified against the real farm-bench
  simulation (genuine server combat pipeline, full ability/stance/rite loadout), which is
  a much stronger signal than the analytical reports, but still a bot, not a human.
- **Sunshield Scarab specifically** — flagged above as under-strength relative to what
  the trace actually verified, because of the `desertPairs.test.ts` constraint. If T4
  Desert still reads rough in play, the honest fix is to raise Dune Tyrant's HP or lower
  ITS ordinary attack (untouched, unverified either way this session) so Sunshield Scarab
  can drop further without breaking the pack invariant — not to just override the test.
- **Deferred CC/telegraph-gated spikes** (not touched, still flagged from the prior
  session and this one): T2 Caverns Cave Troll (127%, `engageSequence` lockdown), T3 Rime
  Caster (94.6%, stack-gated Frostbind), T4 Desert Dune Tyrant (131% via its own
  telegraphed Pincer Smash, confirmed via trace to be legitimate, not a plain hit).
- **T4 Tundra Permafrost Behemoth** (203% per the analytical Walk table) — a full 6-class
  farm re-run showed 0 deaths for every class. Simulation disagrees with the analytical
  flag and, per the project's standing rule, wins. Treat the analytical flag as a false
  positive; do not tune this monster without new contrary evidence.
- **T1 Mountain concurrency** and **Swamp counterplay-vs-numbers ambiguity** — untouched,
  unchanged from the prior session, still awaiting the designer's manual playtest.

---

## 6. Explicitly stopped, not chased

Per this turn's instruction, the following remaining report flags were identified in the
prior progress report but are **deliberately not being pursued further**:

- Remaining "Heavy spike" flags under 100% maxHP (Ridge Ambusher 50%, Cave Brute 87%,
  Granite Titan 71%, Mountain Colossus 72%, Cavern Troll 88%, Granite Mammoth 84%, Elder
  Leviathan 87%) — within the magnitude band already treated as acceptable elsewhere in
  this program.
- "Difficulty wall" / "No progression" shape flags (Forest walls, Jungle stalls, Desert/
  Tundra walls at T3/T4) — step-size signals from the cost-per-kill Walk table, not raw
  danger signals, and none of T2-T4 has a designer-set absolute-pitch anchor (D1/D2 was
  T1-only) to tune toward.

---

## 7. What was NOT examined at all

Weapons, armor, boots, cores, and relics across every tier except the 4 reverted T2-T4
charms — untouched and unexamined. The item diagnostic only ever covered the `recovery`
(charm) slot, for 4 specific biomes, and that whole line of investigation was disproven
(Ledger 3). No conclusions exist about any other item slot.
