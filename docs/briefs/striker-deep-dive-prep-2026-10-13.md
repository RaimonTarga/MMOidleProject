# Striker deep dive — prep pack (2026-10-13)

**What this is:** the starting material for the second class deep dive of the class-first
rework (the Conduit was first; its §7 is locked). Read it, then run the session as a design
conversation. The output is §12 of the
[class-first bible](../../design_docs/class-first-bible.md), written to the class template
(bible §6). Nothing here is decided unless it says so.

**Why Striker next (designer, 2026-10-13):** it is the designer's standard class, the
"vanilla" one the whole game is measured by, and the one they have playtested the most; its
possible new systems are the most interesting to discuss. Squire was the bible's suggested
next class and is not forgotten.

## Session prompt (paste this to start the next session)

```text
This is the Striker deep dive: the second class dive of the class-first rework. The Conduit
was the first and its section is locked; use it as the worked example, not a template.

Read first, in this order:
1. design_docs/class-first-bible.md: §1–§6 (cross-class rules, several changed during the
   Conduit dive) and §7 (the Conduit, locked) to see what a finished class section looks
   like.
2. docs/briefs/striker-deep-dive-prep-2026-10-13.md: this prep pack (what I've said, what
   exists today, the evidence, the questions).
3. docs/briefs/class-first-rework-brief-2026-10-13.md: the Striker row and the addendum.
4. Skim docs/briefs/conduit-deep-dive-log-2026-10-13.md for how the last dive went.

How to run it: a design conversation with me. Fantasies and concepts first; rules only when
we run out of ideas. Build on my ideas, add yours, flag risks as notes. Record every call I
make in §12 of the bible as we go (dated reviews, tagged Decided / Tentative / Proposed),
and keep the bible's status table current. Ask me questions with options for any decision
that is mine. No code. When we converge, rewrite §12 to the class template, move the review
log to docs/briefs/striker-deep-dive-log-<date>.md, walk me through your unconfirmed
proposals, then I lock it.

Striker matters: it is my standard class, the one I measure the game by and the one I've
playtested most. Start by summarizing in a few lines what is already decided for Striker,
then ask me the first two or three questions.
```

## What the designer has already said

From the [brief](class-first-rework-brief-2026-10-13.md) and its addendum:

- **Core mechanic:** hits build **Momentum**, which decays when you stop attacking; the
  **finisher** spends it and grants a small shield or heal. *Concept Tentative.*
- **Custom system: the Order.** You choose what each beat of the combo does: buff, debuff,
  setup, crowd control, finisher. *Concept Tentative.* Striker **authors a short sequence
  beat by beat**; the Slinger loads whole clip types instead, so the two never feel like the
  same editor. *Decided.*
- **Disciplines:** **Flurry** (frequent finishers, on-hit, packs) · **Crescendo** (uncapped
  stacks, release timing, bosses) · a third still open (a **mobile duelist that marks a
  target?**). *Tentative.* Crescendo stays purely offensive tempo so it doesn't blur with
  the Spirit's Reservoir. *Decided.*
- **Brawler (counter on hit) moves out of Striker;** countering belongs to the Squire.
  *Decided.*
- **Melee survivability lives in class kits,** not a core slot. *Decided.*
- **Boss trophies (Conduit dive):** for Striker, a boss trophy modifies the empowered attack
  or finisher, so a new boss gives a new finisher that does something different or
  stronger, swappable. *Decided (direction).*

## Decided in the bible since (cross-class, from the Conduit dive)

Read §1–§4 for the exact wording. In short:

- **Automation is free;** each class has **its own budget system** instead of the runic
  budget (§3). What Striker's budget is (beats in the Order? Momentum capacity?) is this
  dive's question.
- **Global Mastery grows that budget in steps**, shown in class terms ("Command 7, next at
  Mastery 24") (§2).
- **Progression shape (§2):** T1 class, **T2 discipline** (a considerable power step), **T3
  specialization** (3 per discipline; the build consolidates), **T4 onward leaf nodes**,
  three per discipline per tier, modest steps. One discipline-scoped capstone around
  T7–T8. Branches never nest.
- **The relic slot is the boss trophy slot** (§4): each boss drops your class's trophy.
- **Prefer triggers that work in every fight; avoid on-kill effects** (§1).
- **Signature payoffs stay with their class; themes may cross** (§3). **Collision to
  resolve:** the brief's Striker example "finisher form Cleave / Execute / Shatter" uses
  Shatter, which is the Apprentice's Frost payoff.
- **Weapons are class-specific; armor and charms are shared bases with class lines** (§4).
  Components are under review in their own session.
- **Every class system has a T1 form** a fresh player sees in the first ten minutes
  (§2, Proposed). Most players never reached T2 (25 of 38 in the Sep 24–27 live data).
- **Debuffs and party buffs:** decided for the Conduit (§7.10, §7.12); check whether the
  same rules matter for Striker.

## What worked in the Conduit dive (method, not a template)

- **The designer's T1 sketch, biome by biome:** "each biome's threat hands you its answer"
  (a summon, a weapon, an armor). It made T1 concrete fast and carried to T2–T4.
- **A clickable mockup** of the class screen once the system's shape was clear.
- **Fantasies first;** structural rules were rejected when proposed up front.
- **Walking through the agent's unconfirmed proposals** before locking.
- It took one long session. The section was then rewritten to the template and the log
  moved out.

## What exists today, and what it might become

| Piece | Today | In the rework |
|---|---|---|
| Core loop | A hit-count finisher cycle: the finisher lands on the 5th hit (frames change it) as an empowered hit | Momentum (builds on hits, decays when idle); the finisher spends it |
| Class sustain | A Recovery pulse: +20% Recovery for 4 s every 6 s | The brief gives the finisher a small shield or heal; the pulse's fate is open |
| Frames (T2 today) | Flurry: 4 hits at ×1.5, the finisher opens a 1.6 s ×1.3 window · Skirmisher: 5 at ×2, both halves at half strength · Breaker: 6 at ×4, banks charge per hit, staggers on the finisher | Discipline material; "Flurry" survives as a discipline name |
| Range (T3 today) | In-Fighter · Lancer (at-bay slow) · Phantom-Blade (an opening strike from max reach) | Scrapped as a node; the at-bay slow and the opener are possible Order beats |
| T3 paths (T4 today) | Light: Shockblade (next 3 attacks fire on-hit twice), Scrapper (finisher curses: +25% damage taken, plating shred), Swiftblade (finisher strikes twice) · Balanced: Maestro (each buildup hit adds flat damage), Wavecrest (buildup amplifies the finisher; next 3 hits +50%), Justicar (finishers bank a Verdict; execute at or below it) · Heavy: Berserker (Rampage stacks lower the threshold), Hemomancer (finisher becomes a bleed), **Juggernaut** (time in combat ramps a finisher multiplier: today's Crescendo) | Specialization and leaf material; mine the ideas, don't port them |
| HUD | The rhythm readout (hit pips toward the finisher) | The Momentum / Order readout |
| Abilities | Shared abilities with class adapters (Power Strike and others) | Gone; abilities become Order pieces |
| Art | The Striker slash is liked; player bodies through T3; the elemental tint layers | Reused |

Source files: `shared/src/data/skillTree/rootsAndFrames.ts` (root, frames, range),
`shared/src/data/skillTree/t3CombatA.ts` (the nine paths),
`server/src/systems/classes/archetypes/cadence/` (runtime),
[frames-current-state.md](../frames-current-state.md) (frame loops).

## Evidence

- **Striker is still the weakest class on the Plains and Forest at T2,** "a class issue, not
  a boss one" ([tier-balance-current-state.md](../tier-balance-current-state.md), T2 pass):
  melee could not out-sustain the Plains herd or the Forest frenzy ramp.
- **Playtest 3 was a Striker** (guided T1, ~48 min;
  [report](playtest-3-report-2026-10-12.md)): the first Plains fight took it to 15/177 HP
  (only the Flee rune saved it); the Mountain boss was won at 7% HP; the class text reads
  as system language ("a five-hit finisher cycle, plus a Recovery pulse that activates 20%
  of your Recovery every 6s for 4s"); "frame" and "style" were one thing with two names.
- **The designer measures the game on Striker:** its feel and numbers are the reference the
  other classes are judged against, so its T1 has to feel good before anything else.

## Collisions to keep in view

- **Shatter** (the brief's finisher-form example) is the Apprentice's payoff (§3).
- **"Juggernaut"** is now three things: the old Striker path (the Crescendo ramp), a
  Conduit summon (§7.8), and a Squire discipline in the brief. Names are placeholders;
  pick owners eventually.
- **Crescendo vs the Spirit's Reservoir:** keep Crescendo purely offensive tempo.
- **Countering** belongs to the Squire (Brawler moved out).
- **The Order vs the Squire's Response rules and the Slinger's Loadout:** three different
  editors (§3).

## The questions, in order

Leads are seeds to argue with, not rules.

1. **Fantasy in one line.** What a new player would say Striker is.
2. **Momentum.** How it looks (a bar, pips), how it builds and decays, what the finisher
   spends, what the finisher's shield or heal is, and whether the Recovery pulse survives.
3. **The Order.** What a beat is; the beat vocabulary (buff, debuff, setup, crowd
   control, finisher); how long a sequence is at T1 and how it grows; how it differs in
   feel from the Squire's and the Slinger's systems; what the bots set.
4. **The class budget.** What Global Mastery's steps grow for Striker: beats in the Order,
   Momentum capacity, or something else.
5. **The T1 form.** The first ten minutes, and T1 biome by biome: each biome's threat and
   the answer it hands a Striker (a beat? a weapon? an armor line?). Plains swarms and
   Forest fast packs are exactly where Striker is weakest today.
6. **Disciplines (3).** Flurry, Crescendo, and the third (the mobile duelist that marks a
   target?). Their fantasies first.
7. **Specializations (T3, 9).**
8. **Leaves (T4, 9).**
9. **Boss trophies.** One per boss lineage, each a finisher or empowered attack that does
   something different; how they plug into the Order.
10. **Items.** What a Striker weapon shapes (the Order? Momentum? the finisher?); the
    armor and charm lines (melee survivability lives in the kit).
11. **Defense and recovery.** The finisher's shield or heal; the Plains and Forest weakness.
12. **Party role.**
13. **Bot plan.** A default Order per discipline; what the harness must set.
14. **T2–T4 biome by biome**, as the Conduit did.

**Useful during the session:** a clickable mockup of the Order screen once questions 2–4
have answers.
