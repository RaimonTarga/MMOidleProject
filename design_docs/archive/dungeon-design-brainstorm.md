> **HISTORICAL (archived 2026-07-07).** Early brainstorm; implemented as the gauntlet system — see `docs/dungeon-current-state-and-gauntlet-plan.md`. Not current.

# Dungeon Design — Brainstorm

**Scope:** making dungeons fun and interactive within the axioms (deterministic,
fully-auto, build-test, no terrain — a dungeon is a node). Supersedes §1 of
`../design-development-suggestions.md`. Proposals, not canon.

---

## 0. Diagnosis

Today a dungeon is `isDungeon: true`: the same node with ×2 HP / ×1.6 ATK mobs and
a persistent boss. Two problems:

1. **It's a stat tax, not an experience.** Nothing inside changes what the player
   thinks about or how the build is interrogated — yet dungeons are the *only
   mandatory content* (every tier quest = one dungeon boss kill). The game's one
   required activity is its least designed.
2. **Five of six bosses per tier are pointless.** One boss kill advances the tier;
   the others have no pull, and there's nothing else to do in their dungeons.

Constraint to respect: there are no rooms, no terrain, no instances. Everything
below is **spawn logic and node state** — systems the server already owns
(spawn pools, `ensureBoss()`, freeze/thaw, node deltas, `world:events`).

---

## 1. The wave-gauntlet (core proposal)

A dungeon node runs a **phase state machine on its spawner** instead of a steady
population + standing boss. Kills advance the phase; the boss only spawns when the
final phase clears. ("Slay N buffed mobs to spawn the boss" is the one-phase
version — the upgrade is phases that *differ in damage shape*.)

Example Mountain T2 dungeon, same node, zero terrain:

| Phase | Population | What it tests |
|---|---|---|
| 1 | home shape, elevated density (big-hitter pack) | the biome's own lesson (cap) |
| 2 | the biome's *cross* shape (DoT ambushers) | off-shape coverage |
| 3 | 2–3 buffed **elite guards** | the eHP/DPS check |
| 4 | boss spawns via `ensureBoss()` | the concentrated shape, per boss-design.md |

Why this fits this game specifically:

- **Coverage exam.** One phase is always off-shape for any build. A narrow
  specialist deletes its phase and grinds the off-phase; a generalist sails evenly.
  The bible's gear-check philosophy, expressed entirely in spawn data.
- **Forces a walk across the threat matrix.** Open-world farmers park where their
  build is comfortable and never feel the matrix; the gauntlet makes them cross it
  once per tier.
- **Natively MMO.** Gauntlet progress is **node state, not player state** —
  everyone present contributes kills and the phase advances for all. Strangers
  arriving mid-gauntlet is ad-hoc co-op for free (same-node reward sharing
  already exists). A `world:events` broadcast when a gauntlet reaches its final
  phase ("the Crag Behemoth stirs…") actively pulls players together — a real MMO
  moment from one event emit.
- **Reset comes free from freeze/thaw.** Monsters are ephemeral; node empties →
  freezes → gauntlet resets. No instances, no run persistence, no special death
  rule (death already costs a Clearing respawn).
- **AFK-safe.** Phase 1 is just a denser farm; an idle player parked there farms
  it forever and never advances — fine. Advancing is opt-in by killing through.

Per-tier escalation reuses each tier's axis, so gauntlets deepen on the same
schedule as everything else:

- **T1:** 2 phases (home shape → boss). Teaches what a dungeon is.
- **T2:** + the cross phase.
- **T3:** + a range phase (all-kiter or all-charger wave — the toggle exam).
- **T4:** + a defense phase (all-shielded or all-soft-capped wave — the weapon-
  matchup exam; the audit's matchup grid as content).
- **T5+:** phases become authored **packs** (the T5 axis); the elite-guard phase
  becomes a pack with an alpha. See the t5–t8 doc.

## 2. Attrition rules (cheap, pairs with the gauntlet)

Inside dungeon nodes, out-of-combat regen runs at reduced effectiveness
(e.g. 25–50%). Effects:

- The gauntlet becomes an **HP-economy question** — "can my build clear three
  phases and a boss on one recovery budget?" — a pure build test.
- Sustained-recovery itemization (ramp-regen, absorb, Deepfreeze-style long-fight
  charms) finally gets a home where it beats burst mitigation.
- One node-scoped modifier on the existing regen rule; no new systems.

Guardrail: never zero (self-reliant-grind axiom). A recovery-invested build farms
the dungeon comfortably; a glass build gets in, kills, gets out.

## 3. Rune hooks (the signature layer — see rune-system-brainstorm.md wave 4)

Gauntlet phases are where rune rules earn their keep, and dungeon boss first-kills
are where fragments come from (closed loop: the dungeon teaches the behavior, the
boss awards the word that automates it):

- A ramping elite guard that resets when it drops aggro → `hurt → flee` cycles it.
- An all-kiter phase → `fighting → keep-distance`.
- Later: `boss-shield-up → hold position`, `phase-cleared → re-engage`,
  `ally-hurt → intercept` (party rune).

## 4. Why hunt the other five bosses

**Principle (revised): boss rewards must be carry-forward value.** Current-tier
gear power is the wrong reward — next-tier +0 weapons already beat last-tier +3,
and the boss kill happens exactly when you're about to move on. So: never gate
gear power behind bosses; gate things that stay valuable across tiers. Bosses are
**unlock sources, never drop sources** — a kill is a deterministic flag
(`bossesCleared` already persists `"biome:tier"` keys, so the infrastructure
exists), and flags gate things that still cost essence at the forge. Level
unlocks, boss proves, essence pays.

- **Relic recipe lines (T4+, the strongest pull):** each dungeon boss unlocks a
  relic recipe line matching its biome's lean (Mountain → potency, Jungle →
  frequency, Graveyard → buff-mult…). Relics are a new slot with no legacy recipe
  rules to break, and they carry forward by design. Every boss gets a distinct
  answer to "why kill *this* one."
- **Rune fragments (every tier, the one-time pull):** each boss's first kill
  grants a condition/action word (rune doc §4). Six bosses ≈ a tier's vocabulary.
  Tier quest stays "any one boss"; completionists have five more reasons.
- **(Option, parked) hybrid-cross gating:** a T3+ hybrid recipe's splash could
  require felling the *splash* biome's boss at that tier — "you can't borrow a
  mechanic you haven't mastered," and hybrids are desirable *while current*,
  unlike +3s. Legible (read the splash color → that boss). Cost: friction on
  build experimentation. Decide after relics land.
- **Ambient repeatables:** boss respawn timers already exist — bosses following
  the standard essence ratio on big XP makes a "boss route" circuit naturally
  decent essence/hour without any new economy rules. Plus the cheap cosmetic
  layer: per-boss first-fell world records (`world:bossFelled` exists), titles.

## 5. What I'd not do

- **Random/rotating modifiers** — fights determinism; meta noise, not build depth.
- **Timed/leaderboard clears as a pillar** — a DPS check in disguise; cosmetic at
  most.
- **Procedural anything** — authored phases are the exam-room precision that makes
  this work.
- **Instancing** — the shared node *is* the MMO texture; freeze/thaw already
  provides reset semantics.

## 6. Implementation sketch

- Per-dungeon-node `GauntletState` (phase index + kills-in-phase) in the node
  registry / world runtime — runtime-only, reset on freeze (never persisted,
  consistent with "never persist monster state").
- Per-phase spawn-pool overrides in the dungeon's node/biome data (the same shape
  as existing spawn pools, keyed by phase).
- Boss spawn gated on final phase clear instead of always-maintained
  (`ensureBoss()` call site moves behind the phase check).
- Client: a phase-progress strip on the node HUD (reads a small networked node
  field or a `world:events` emit per phase transition).
- Attrition: node-scoped regen multiplier read where OOC regen applies.
- Build order: gauntlet state machine → phase pools for one pilot dungeon
  (Mountain T2) → attrition rule → HUD strip → roll out per biome → boss-unlock
  flags (relic lines when relics land; rune fragments when wave-2 runes land).
