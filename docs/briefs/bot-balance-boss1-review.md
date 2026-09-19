# Boss1 review — a finite baseline, retained

Prepared 2026-09-19 from the existing sealed records at `66d33d57` (tree `bad68e01`).
No fight was rerun and no new fight was run. Companion: the
[retrospective declaration audit](bot-balance-boss1-stance-declaration-audit.md).

Boss1 was a **first numerical baseline screen and a check of the repaired recorder**. It was
not certification of all bosses or all builds, and nothing below approves a change to any
boss, player, reward, gear, ability, stance, Rune-cost or mob value.

---

## 1. Apex Timberclaw — six observations, seed 96011, cap 300 s

Block verified as originally recorded (`artifactVerified: true`).

| Root | Treatment | Outcome | Elapsed | Boss HP remaining | % removed | Player min HP | Casts seen |
|---|---|---|---:|---:|---:|---:|---|
| **spirit** | **corroborated** | **boss-killed** | 30.3 s | 0 / 3750 | 100% | 57.4 (24.9%) | 8 |
| slinger | constructed | bot-died | 29.0 s | 212 / 3750 | 94.3% | 0 | 8 |
| squire | constructed | bot-died | 29.3 s | 1227 / 3750 | 67.3% | 0 | 8 |
| apprentice | constructed | bot-died | 27.6 s | 1270 / 3750 | 66.1% | 0 | 7 |
| conduit | constructed | bot-died | 49.3 s | 1342 / 3750 | 64.2% | 0 | 13 |
| striker | constructed | bot-died | 30.8 s | 1835 / 3750 | 51.1% | 0 | 8 |

Guard/ability use: all six ran the same shape — defensive stance, Expose Weakness, Second
Wind + Brace, five ordered rules with Step Back ahead of the movement rule. Casts recorded
are the boss's (`Stunning Swipe`, `Bestial Frenzy`); the player's guard activations are not
separately counted in these records, so guard *uptime* is unmeasured rather than zero.
`maxAddsAlive: 0` on every row — this boss summons nothing.

**How to read this.** Spirit is historically corroborated: it reproduces the V1i package
exactly (231 maxHp / 100 attack / 18 plating / 0.19 DR / 129 barrier). The other five are the
same shape carried onto each root's tier-legal weapon — **reference constructions, not
historical results**, and they are kept in the coverage map precisely because a constructed
build is not invalid for losing.

Three things this table does **not** say:

- It does not rank causes of death. All five losses crossed the 50% phase, so all five were
  exposed to the enrage; that is phase-exposure context, **not** evidence the enrage killed
  them. No per-cause attribution is supported by these records.
- It does not treat the five as equivalent. Slinger left **212** HP on a 3750 pool — a near
  clear. Striker left **1835**. Averaging them, or calling them all "the same failure",
  discards the only gradient the block contains.
- It does not require a historical victory from each root as a condition for inclusion. No
  further historical-reference replay is needed, and none is authorized.

## 2. Charnel-Crown Sovereign — twelve observations, seeds 94011/94019, cap 600 s

**Status: completed; original frozen verification failed on stance declaration;
retrospectively reviewed and confirmed.** Not certified, and the original
`artifactVerified: false` stands. See the audit for the full resolution.

All 12 ended `boss-killed` with authoritative per-fight kill evidence naming the Sovereign as
victim. No deaths, resets, caps, vanishes or ambiguous terminals.

| Root | Duration spread (2 seeds) | 50% phase crossed | Player min HP | Max adds |
|---|---:|---:|---:|---:|
| apprentice | 36.8 / 40.8 s | 24.2 / 25.6 s | 58.4–59.8% | 5 |
| striker | 37.6 / 38.4 s | 24.2 / 21.8 s | 68.2–73.7% | 5 |
| spirit | 53.0 / 58.8 s | 32.2 / 34.0 s | 57.6–59.3% | 5 |
| slinger | 56.6 / 56.6 s | 33.6 / 37.1 s | 76.6–80.5% | 5 |
| conduit | 81.5 / 83.2 s | 50.8 / 50.9 s | 53.8–56.6% | 5 |
| squire | 97.8 / 100.0 s | 60.0 / 64.8 s | 74.8–74.9% | 5 |

Mass Resurrection fired in every fight. Conduit's `attackBeats: 0` with nonzero
`minionAttackBeats` is `CannotAttack` by design and does not invalidate its rows. Escort
damage is attributed per species and is never folded into the boss's own output; Risen
variants keep their own keys.

**Keep Sovereign unchanged provisionally.** 36.8–100 s clears at 53.8–80.5% minimum HP do not
establish that it should be made harder. This is a six-root duration spread on one screen,
not a class ranking, and its success rate must not be compared with Timberclaw's as an
isolated estimate of tier difficulty — the two slots differ in tier, in package origin, in
gear biome and in seed count simultaneously.

## 3. What remains unmeasured

- **Guardian / access.** Stripped by design in both blocks
  (`guardianAccess: "not-measured-guard-stripped"`), and never pooled into a boss figure.
  Pooling it is what produced the stale T1 band.
- **Seed sensitivity** on Timberclaw was *measured* inert (no adds, fixed spawn, deterministic
  evasion). On the Sovereign, two seeds moved elapsed time and damage taken.
- **Player guard uptime**, and any cause-of-death attribution.

## 4. Evidence quality

The original report spot-checked three of eighteen fights against their raw event logs. This
review extended that to **all eighteen**: every outcome, kill/death evidence record, killer,
victim and terminal timestamp agrees with `events.jsonl` to the millisecond, with zero
disagreements. See audit §5.

## 5. Carried forward

The six Timberclaw rows are carried into the Boss2 coverage map, tagged as **reused Boss1
observations** with their original source and seed (`66d33d57`, seed 96011) — not as six new
Boss2 observations. Build equivalence across the two screens is proven, not assumed: all six
packages re-qualify to byte-identical effective stats on every Boss2 boss, at an unchanged
definitions hash. The intended combined map is seven T2 bosses × six roots; only 36 rows are
newly executed.
