# Design Brief D4 — The Summoner Rework

**For:** an external design session. Self-contained — assume no prior knowledge
of this project.
**Returns to:** `docs/next-playtest-implementation-plan.md` (gates the last
remaining player-sprite work and the summoner's inclusion in the playtest).
**Written:** 2026-08-02.

---

## 1. The game, in one page

**MMO Idle** is an automatic-combat idle RPG. The player never controls the
character in combat — they build it. Every decision is a *preparation* decision:
class path, gear, abilities, stances, rites, runes (a programmable behavior
language), party, and where to go. The server decides all outcomes.

The player fantasy is **"you are the trainer/programmer of an autonomous hero"**
— a coach, not a fighter.

A player picks one of **six class archetypes** at the root of the skill tree and
keeps it. The tree then goes: **root → frame (light / balanced / heavy) → range
(close / mid / far) → T3 path → T3 spec**. Each archetype has 3 T3 paths × 3
specs = 9 named T3 specs.

Progression runs on player tier (T1–T4 today) and per-biome mastery.

---

## 2. What you are being asked to decide

The **Summoner** archetype's identity, path structure, and minion design — and
whether it ships in the upcoming playtest at all.

It is the sixth and least-developed archetype. It works mechanically but has
never had a real design pass, and it is currently the **only thing blocking the
last of the project's character art**.

---

## 3. Grounding — the other five archetypes

Every archetype is defined by one mechanic that answers "what makes your
autonomous hero's damage interesting to plan around."

| Archetype | The mechanic | The planning question it asks |
|---|---|---|
| **Cadence** | Every Nth hit (default 5) is **empowered** at ×2. | How do I raise hit *count* — attack speed, extra hits, counter reduction? |
| **Cooldown** | An **execution window** arms every ~7 s; the next attack lands at ×2. | How do I shorten the timer and make sure the window lands on the right target? |
| **Energy** | +14 per hit, cap 100; at max the next attack is empowered ×2 and drains the pool. | How do I fill faster, and do I want a bigger pool or a faster cycle? |
| **Reload** | A 10-shot magazine; emptying forces a reload you can't attack through. Carries a distinct "half damage / double speed" sub-identity. | How do I manage downtime — bigger magazine, faster reload, or lean into burst? |
| **DoT** | A % of attack damage converts into **stacking damage-over-time**. T3 paths are fire / frost / poison. | How do I stack faster, hold stacks longer, and pick the right element? |

Note what they have in common: each is a **legible, deterministic rhythm** the
player optimizes. Four of the five converge on a shared "empowered attack" idea
reached by three different routes (count / time / resource); DoT deliberately
does not.

**The Summoner needs an equally sharp answer.** Right now it doesn't have one —
"you have minions" describes an implementation, not a planning question.

---

## 4. Grounding — what the Summoner is today

### 4.1 Mechanics that exist and work

- **Minion slots.** Each has an independent respawn timer. When a slot's minion
  dies, the timer starts; when it expires, a new minion spawns.
- **Stat sharing.** Minions inherit a computed share of the player's stats; max
  HP and physical size are derived from that share.
- **Damage sponge.** Minions are not currently valid aggro targets for monsters —
  they absorb damage through a dedicated redirect listener instead. Area attacks
  (monster splash, boss slams) *do* hit them directly.
- **Minion AI.** Per-minion targeting and movement, run each tick.
- **Commanding.** A player intent exists (`player:commandSummons`) — shift-click
  to focus a clicked enemy, or send minions to a point.
- **Sentinel placement**, a debuff guard, and range handling all exist as
  separate mechanisms.

### 4.2 The T3 tree as currently authored

Three paths, keyed by **biome** — note this is unlike the DoT archetype, whose
paths are keyed by *element* (fire / frost / poison). Each path has three specs:

| Path | Spec A | Spec B | Spec C |
|---|---|---|---|
| **light** | Predator's Howl | Swarm | Acid Brood |
| **balanced** | Grazing Field | Trampled Path | Vital Burst |
| **heavy** | Stone Sentinel | Rockslide Cover | Mountain Guardian |

Server-side path implementations exist for three biomes: plains, mountain, cave.

These names were authored quickly and are **not** protected. Rename, restructure,
or replace freely.

### 4.3 Known problems

- **No stated identity.** The other five archetypes each have a one-sentence
  mechanic. The Summoner has a feature list.
- **Path axis is unclear.** Biome-keyed paths are inconsistent with the rest of
  the tree and don't obviously produce three distinct playstyles.
- **Minions are visually placeholder.** They all render as a generic wisp sprite.
- **Balance is deferred** — explicitly, for lack of playtest data.
- **Character art is blocked.** The class body itself is authored (a "Conduit":
  deep red robe, blank white mask, no hood — deliberately breaking the shared
  hooded silhouette so it reads at a glance next to the other classes). But the
  **nine T3 spec bodies cannot be drawn until the specs are designed**, and they
  are the last unfinished character art in the project.

---

## 5. Constraints you must not violate

1. **No defense or recovery that scales with offensive output.** No lifesteal-
   shaped mechanics. Hard axiom, not a preference.
2. **Determinism.** The player must be able to reason about outcomes in advance.
   Minion behavior needs to be predictable, not chaotic.
3. **Combat is automatic.** The player is not micromanaging minions in real time.
   Any "commanding" is a standing policy or an occasional intent, never a
   per-second input. Minion behavior should ideally be expressible through the
   existing rune (condition→action) language rather than a bespoke control UI.
4. **Server-authoritative and performance-bounded.** Every minion is a simulated
   entity in a 10 Hz world with many players. Minion *count* is a real
   performance cost — a design calling for 20 minions per player is a different
   engineering conversation than one calling for 3.
5. **Budget separation.** Minions doing damage spends the offense budget; minions
   soaking damage spends the defense budget. A design where minions do both at
   full value breaks the game's core budget rule.
6. **Solo-completable, party-friendly.** No party requirement.
7. **Sits alongside the other five.** It must be a peer, not a novelty — and it
   must not simply be "Cadence but the minions swing."

---

## 6. Questions to answer

**Q1 — The identity.** In one sentence, in the same shape as the §3 table: what
is the Summoner's mechanic, and what planning question does it ask the player?
This is the most important answer in the brief; everything else follows from it.

**Q2 — The minion contract.** How many minions, and what determines the number?
Do they persist between fights or are they summoned per encounter? What happens
when one dies — timer, resource cost, or nothing? Do they deal damage, soak
damage, or apply effects — and per §5.5, which budget is each paying from?

**Q3 — Path axis.** What are the three T3 paths, and what axis distinguishes
them? Biome-keyed (as today), or something structural — minion *count* vs *size*,
or *offensive* vs *defensive* vs *utility*, or elemental like DoT? Give each path
a one-line identity.

**Q4 — The nine specs.** For each of the 3 paths × 3 specs: a name, what it does
mechanically, and — importantly — **what it should look like**. A spec that plays
differently but looks identical is wasted; the art depends on this column.

**Q5 — Minion families.** How many visually distinct creature designs are needed?
Do minions differ by path, by tier, by spec, or not at all? Each distinct design
is a real art cost, so be deliberate: fewer, more meaningful families beat many
near-duplicates.

**Q6 — Commanding.** What standing decisions does the player make about minion
behavior, and can they be expressed as rune rules (condition → action) rather
than a bespoke control panel? Give two or three concrete example rules.

**Q7 — Ship or defer?** Should the Summoner be in the upcoming playtest, or
disabled until the rework is fully built? Both are acceptable answers.
- **Ship:** the class needs its rework, nine T3 bodies, and the minion art
  families — all on the critical path before the playtest.
- **Defer:** the class root is disabled, the game ships with five well-realized
  classes, and the last art dependency disappears. Fully reversible.

  The project's stated preference leans toward *defer if the design isn't ready
  in time*, on the grounds that a placeholder class distorts exactly the build
  feedback the playtest exists to collect. Say which you'd choose and why.

---

## 7. Return format

**A. The identity line** — one sentence answering Q1, in the exact shape of the
§3 table rows.

**B. A decisions block** — one line each for Q2, Q3, Q5, Q6, Q7.

**C. The nine-spec table**, with exactly these columns:

```
spec id | display name | path | what it does mechanically | how it changes the
minions | visual read (what the PLAYER's body looks like) | minion family used
```

> This table **is** the sprite-generation brief. The "visual read" column will be
> turned into an image prompt more or less verbatim, so write it as a physical
> description of a 64×64 pixel-art character — silhouette, colour, and one or two
> readable props — not as a mood. For reference, the base Conduit body is a deep
> red robe with a blank white mask and no hood; the three frames beneath it are
> "swarm / stable / conductor."

**D. The minion family list** — one row per distinct creature design:
`family id | what it is | which specs use it | visual description`.

**E. Two or three example rune rules** for Q6, written as `WHEN <condition> THEN
<action>`.

---

## 8. Notes on how this will be used

The identity line (A) gets checked against every subsequent decision — if a spec
in table C doesn't serve it, it gets cut. Tables C and D go straight into art
generation, which has the longest lead time of anything in the project, so the
visual columns are not decoration.

If your answer to Q7 is "defer," say so early and keep the rest of the document
anyway — the design still gets built, just after the playtest rather than before.

Anything left open gets decided by whoever implements it, probably worse. Prefer
a decided answer with a noted alternative over a deferred one.
