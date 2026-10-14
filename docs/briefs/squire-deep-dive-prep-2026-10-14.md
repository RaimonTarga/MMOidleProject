# Squire deep dive — prep pack (2026-10-14)

**What this is:** the starting material for the third class deep dive of the class-first
rework. The Conduit (§7) and the Striker (§12) are locked: two worked examples, not
templates. The output is §8 of the
[class-first bible](../../design_docs/class-first-bible.md), written to the class template
(bible §6). Nothing here is decided unless it says so.

**Why the Squire now:** the bible's proposed order. It shares the "who tanks?" and party
questions with the Conduit, and the Striker dive handed it countering and the reactive
window.

## What the designer has already said

From the [brief](class-first-rework-brief-2026-10-13.md):

- **Core mechanic:** the Squire builds **Resolve** from damage blocked or absorbed; a
  **retaliation slam** spends it. *Concept Tentative.* The brief and bible §5 call Resolve
  "set": it is the Squire's answer to defense and recovery.
- **Custom system: Response rules.** The Squire reacts to what the enemy does. The brief's
  three examples: a telegraph → guard; adds → taunt + slam; an ally low → intercept.
  *Concept Tentative.*
- **Disciplines:** **Bulwark** (pure tank, group anchor) · **Juggernaut** (armor and HP
  convert to damage) · **Avenger** (parry and counter telegraphs). *Tentative.*
- **Countering belongs to the Squire;** Brawler (counter on hit) left the Striker for it.
  *Decided.*
- **Melee survivability lives in class kits,** not a core slot. *Decided.*
- **The redesigned bosses stay, and they are the stage for Squire responses** (the brief's
  keep/scrap table). *Decided.*
- The audit's example, not a decision: "a Squire's plate rolls Resolve lines".

From the Striker dive ([log](striker-deep-dive-log-2026-10-13.md), §12):

- **Reactive windows probably belong to the Squire:** Brace's one good part (tenth review).
  *Tentative.*
- The Striker's Balanced leaf **Read the Blow** (telegraphed attacks aimed at you deal half
  damage) was written as "mitigation, not a counter", to keep countering the Squire's.
- The Order, the Slinger's Loadout and the Squire's Response rules must never feel like the
  same editor (§3, §12.3). *Decided.*

## Decided in the bible since (cross-class)

Read §1–§6 for the exact wording. In short:

- **No abilities outside the class system** (§3): anything else is passive, with no
  callout. *Decided for the Striker, Proposed for every class:* **to confirm for the
  Squire.** Today's Brace, Endure, Bramble Guard, Second Wind and the Taunt rune either
  become Squire responses or go.
- **Rules cost nothing** (§3). Each class has **its own budget**, grown by Global Mastery in
  steps and shown in class terms ("Command 7, next at Mastery 24") (§2). What the Squire's
  budget measures is this dive's question.
- **Progression** (§2): T2 discipline (a considerable power step), T3 specialization (three
  per discipline; the build consolidates), T4 onward leaves (three per discipline per tier),
  one capstone around T7–T8. Branches never nest.
- **Trades between offense and defense are allowed** (§1), and the bible already names
  **Juggernaut** as an example. Guardrail (*Proposed*): a conversion lives in a class kit,
  runs one way, and an item that converts never also carries above-curve defense.
- **Defense and recovery live in equipment** (armor and charm class lines), never on
  triggers that scale with attack speed; melee classes get some resilience in their T4
  leaves (§12.10). The Striker's four rules for its defensive lines: nothing triggers on
  your hits or finisher; nothing scales with attack speed; nothing makes weak hitters
  irrelevant (no shield you can keep up forever); no resource doubling as a shield (the
  Spirit's identity).
- **The relic slot holds each boss's class trophy** (§4). **Specializations are
  content-neutral** (§12.6, Decided for the Striker). **Prefer triggers that work in every
  fight**; avoid on-kill effects (§1).
- **Each biome's threat hands you its answer** (both dives' T1 method), and a returning
  biome teaches a lesson every tier: a new piece, a sidegrade or a rank-up (§12.8).
- **Party:** the same buff or debuff from two players doesn't stack; the strongest copy
  applies (§7.12, §12.12).
- **Every class system has a T1 form** a fresh player sees in the first ten minutes (§2,
  Proposed). Most players never reached T2 (25 of 38 in the Sep 24–27 live data).

## What worked in the two dives (method, not a template)

- **The designer's T1 sketch, biome by biome** ("each threat hands you its answer"), then
  extended to T2–T4 at the end of the dive.
- **Fantasies first.** Structural rules proposed up front were rejected (Conduit: "each
  discipline covers packs / bosses / sustain"; Striker: combo-recovery leaves).
- **The designer stepping back:** when the agent's alternatives were all good, they became
  disciplines and specializations instead of rejected options (Striker, third review).
- **Kinds of idea the designer turned down** (patterns, not rules): effects too flashy to
  read (the afterimage echo); vanilla ramps (Flow); a whole specialization for one kind of
  content (Earthshaker); abilities outside the class system (Brace, Second Wind); defense
  riding offensive triggers (the finisher's shield or heal); a dodge counter followed
  across many bodies (the Conduit's Forest evasion); per-piece authoring sprawl (Promote);
  on-kill triggers; unclear class casts (Call the Horde, Empower).
- A clickable mockup helped the Conduit; the Striker had none, by the designer's choice.
- Each dive took one long session. Questions inline, lettered options, IDs on proposals.

## What exists today, and what it might become

| Piece | Today | In the rework |
|---|---|---|
| Core loop | A **timed execution**: every 7 s the next attack is empowered ×2; the clock restarts after it lands (`cooldownPrototype.ts`) | Resolve (from damage blocked or absorbed) and a retaliation slam that spends it; no clock |
| Chassis | The heaviest in the game: +30% HP, +10% plating, +28% DR, +18% attack, −15% attack speed, −10% move speed; 10% of Recovery stays on in combat | Per-class stats are §5's open question; the in-combat Recovery share's fate is open (the Striker's pulse was dropped) |
| Frames (T2 today) | **Warrior** (5 s ×1.5; hits inside a 2 s window shorten the next recharge) · **Knight** (7 s ×2; both halves at half strength) · **Bulwark** (8 s ×3.5; each regular hit banks +0.2×, up to 8; the execution strips 15% plating for 6 s) | Discipline material; "Bulwark" survives as a discipline name |
| Range (T3 today) | **Vanguard** (close; 20% of Recovery on in combat) · **Phalanx** (mid; at-bay slow, executions stagger) · **Sentinel** (far; an execution from max reach exposes the target) | Scrapped as nodes; the stagger and the expose are possible slam or response pieces |
| T3 paths (T4 today) | Light: **Assassin** (the execution starts a 2.5 s attack-speed burst), **Transcendant** (hits ramp flat damage), **Sunderer** (the execution ignores plating). Balanced: **Reverb** (the execution echoes at half strength halfway through the recharge), **Dynamo** (power per second of recharge), **Stalwart** (a patience ramp). Heavy: **Avenger** (the execution adds a share of all damage taken since the last one), **Destroyer** (Techniques deliver the execution), **Devout Priest** (the execution becomes a 3 s beam) | Specialization and leaf material; mine the ideas, don't port them. **Avenger is the brief's Resolve loop in miniature**, and its numbers carry a warning (Evidence) |
| Taunt | Any class: the **Taunt Target** rune ("Challenge", or "Protector" in a party): on hit, your target attacks you; 4 s cooldown (`server/src/systems/combat/ai/taunt.ts`) | The Squire's, and the Conduit's tank summons'; no rune |
| Guards | Shared abilities: Brace and Endure (DR), Bramble Guard (plating, reflect), Sidestep, Break Free, Cleanse, Second Wind, Recuperate. Simultaneous guards multiply, capped at 90% | Gone as shared abilities (§3); the good parts may return as Squire responses |
| Rune conditions | Reactive conditions already exist: an enemy attacking you charges a cast (`target-casting`), standing in a telegraph, melee contact, three or more enemies on you, in a party, a debuff on you, three different debuffs, controlled, a boss escaping, a shielded target, an elite, HP below 25% | The Response rules' trigger vocabulary. **Missing:** an ally low, an ally under a telegraph, adds arriving |
| HUD | The cooldown dial (the execution's recharge), the mechanic flash, the "Revenge" buff (Avenger's bank) | The Resolve readout; callouts for the announced responses |
| Art | The `squireSlam` base effect; bespoke `fx/bespoke/squire.ts` (the payoff replaces the execution; Reverb's echo look); the brace pose; Squire bodies through T3 (iron great helm, plate and tabard; mobile → knight → fortress) | Reused |

**Runtime seams worth knowing:**

- **"Damage blocked" is computable today.** `onDamageTaken` carries
  `ctx.metadata.incomingGross`, the raw monster hit before your plating and DR, so blocked
  = gross − taken. Avenger already banks it
  (`cooldown/t3/ticks/cooldownState.ts`).
- **Monster wind-ups can be interrupted:** a stun or freeze during a wind-up interrupts it;
  some boss steps are authored uninterruptible; boss patterns end as completed,
  interrupted or staggered (`combat/engine/monsterMechanics.ts`, `combat.ts`,
  `ai/bossPatterns.ts`). A counter or interrupt response has a seam.
- **How monsters choose targets:** regular mobs attack the closest target in pull range;
  bosses prefer players (`prefersPlayers`); a taunt overrides both, and no monster ignores
  taunts. **There is no threat table.** Solo, everything already attacks you; in a party
  the melee Squire is usually the closest anyway (`ai/monsterTargeting.ts`).
- **The player cast machine** (arm → wind-up → resolve; a stun aborts it) and the
  callouts and cast bars are the Striker's salvage too.

Sources: `server/src/systems/classes/archetypes/cooldown/` (runtime, frame loop, the nine
paths' runtime), `shared/src/data/skillTree/rootsAndFrames.ts` (root, frames, range),
`shared/src/data/skillTree/t3CombatA.ts` (the nine paths),
[frames-current-state.md](../frames-current-state.md),
[abilities-current-state.md](../abilities-current-state.md).

## Evidence

- **No human playtest report covers a Squire** (playtest 3 was a Striker); its evidence is
  bots and benches. Playtest 3 did show its class card in system language: "prepare a
  timed execution on the 7s reference cycle at ×2; 10% of your Recovery stays…", cut off
  mid-sentence ([report](playtest-3-report-2026-10-12.md)).
- **Melee takes about twice the damage.** In the T1 boss pass the Squire took 7.7 HP/s on
  average across the five T1 bosses, the Striker 8.7, the four ranged classes 3.7–5.3; on
  the Behemoth 7.0, against 1.2 for the Slinger and 0.8 for the Spirit
  ([report](t1-boss-pass-report-2026-10-02.md) §9). A class fed by the hits it takes will
  never lack fuel, and a Resolve tied to raw damage will swing with how hard each enemy
  hits.
- **Its weak spot is attrition.** After the boss pass the Squire beat four T1 bosses every
  time and the Toadeater (Swamp, rot) 87% of the time, at 9% HP at its lowest, healing back
  43% of the damage it took. Before the pass it lost every Greatbear and Toadeater fight.
  At Forest T2 the Squire's light frame was among the three weakest frame cells (median
  fight-end HP 0.64; [recovery-current-state.md](../recovery-current-state.md)).
- **The Avenger warning.** Today's Avenger banks the raw damage you take into the next
  execution: the closest thing to Resolve in the code. When T4 boss offense was resized it
  grew with it, to 1.42–1.49× the median specialization's kill speed on T4 bosses (0.96× on
  a dummy), and was cut from 1.5 to 0.5 (2026-09-28, `t3CombatA.ts`). A resource built from
  incoming damage follows enemy tuning unless it is capped or counted in steps. Stalwart (a
  patience ramp) was the Squire's other T4 outlier (1.35–1.44×).
- **The Plains-boss stall.** In two guided-tutorial batches (2026-09-29) the Squire's
  Razorback fight sat at 1–3% boss HP for the full 12 minutes. Suspected, not verified:
  the boss's trickle of slimes kept the timed execution landing on adds
  ([guided-tutorial-current-state.md](../guided-tutorial-current-state.md)). A big hit on a
  clock, blind to what it hits, is the problem Response rules answer.
- **Telegraphs are uneven across content.** Bosses telegraph heavily. Among regular mobs
  the Mountain's data has 13 wind-up or telegraph fields, the Desert 8, the Cave and Swamp
  6, the Plains, Forest and Graveyard 2 each. Responses keyed to telegraphs have plenty to
  do on bosses and in the Mountain and little in the Plains and Forest, so every biome needs
  some response that fires (to swarms, fast hits, debuffs).

## Collisions to resolve

1. **"Juggernaut"** names the brief's Squire discipline and a Conduit summon (§7.16: the
   Cave heavy's T2 variant, whose hits scale off its own max HP), and was an old Striker
   path. The ideas overlap too (HP into damage). Lead: the Squire keeps the name (a
   discipline name players read on the class card) and the Conduit summon is renamed,
   which doesn't reopen §7 (its names are placeholders).
2. **Resolve vs the Spirit.** "Both damage resource and shield; spending lowers defense" is
   the Spirit's identity, and the Striker's rules forbid a resource doubling as a shield.
   If Resolve defends, it must do it another way (paying for responses, say), never as a
   passive shield the slam spends.
3. **Resolve vs the Striker's Momentum** (§12.5): both bank and spend everything on one big
   hit. Keep them apart by source and moment: Momentum comes from the Striker's own swings
   and is spent at the end of its combo; Resolve comes from the enemy's hits and is spent
   in answer to them.
4. **Countering vs the Striker's reactive pieces.** Read the Blow (telegraph mitigation, a
   Striker leaf); the Striker's control techniques also interrupt wind-ups (Concuss, Pin,
   Frostbind) and feed Subjugator; Centered (less damage while three or more enemies attack
   you) is a Striker leaf. The Striker's interrupts are placed in a sequence; the Squire's
   would be reactive. Check the Squire's pieces don't duplicate these.
5. **Holding on:** the Striker's Unbreakable (once per fight, a killing hit leaves you at 1
   HP) and Immovable, and the Conduit's Last Stand leaf. A Squire last stand needs another
   shape, or another owner.
6. **Retaliation elsewhere:** the Conduit's Bramble armor (thorns on summons, Forest). Thorns
   is the obvious Squire armor line. Themes may cross (§3); signature payoffs may not. Is
   retaliation the Squire's signature?
7. **Intercept and redirection.** The Conduit has no default redirection (§7.10) and keeps
   it on gear lines (the Mountain "big-hit intercept", Sentinel, Grave Pact). The brief's
   "an ally low → intercept" is redirection between players.
8. **Two tanks in one party.** A Squire's taunt and a Conduit tank summon's taunt; today the
   last taunt wins (each player's taunt has a 4 s cooldown). The party rule (the same buff
   doesn't stack) needs a taunt equivalent.
9. **Old ids:** Bulwark is today's heavy frame (`cooldown-heavy`) and Avenger today's heavy
   path (`cooldown-heavy-t3-a`, the Resolve-like one). Names may return, ids may not (§2).
10. **The code name `cooldown`:** the rework removes the clock; renaming the archetype id is
    a build question, not a design one.

## The questions, in order

Leads are seeds to argue with, not rules.

1. **Fantasy in one line.** What a new player would say the Squire is. Leads: the shield
   that hits back; the guardian who reads the fight; the squire who becomes a knight (an
   arc the sprites already draw: mobile → knight → fortress).
2. **No abilities outside the class system** for the Squire (§3): confirm.
3. **Resolve.** What fills it (damage your defenses stopped; how hard you're hit; how often
   you're hit; your shield's blocks), how it shows (bar, pips), whether it drains out of
   combat, how it is capped (the Avenger warning), and what it buys (the slam only, or the
   responses too).
4. **The slam.** When it fires (full bar, a rule, as a response), what it hits (around you,
   the target), what it does beyond damage.
5. **Response rules.** What you react to (a telegraph at you or an ally, adds, being
   surrounded, a cast, a debuff, a big hit, an ally low) and how you answer (guard, taunt,
   slam, intercept, parry, interrupt, shrug off). What limits a response (Resolve,
   cooldowns, slots); how the screen reads next to the Order and Formation; the default
   rules.
6. **The budget.** What Global Mastery's steps grow: Resolve's size, how many responses you
   carry, or something else.
7. **The T1 form.** The first ten minutes, then T1 biome by biome: each threat's response,
   weapon, armor and charm, and the first trophy. Seeds below.
8. **Disciplines (3).** Bulwark, Juggernaut, Avenger: fantasies first, then what each
   changes and the content it is best at. Bulwark needs solo value: solo, everything
   already attacks you, so a pure tank must still kill things.
9. **Specializations (9).**
10. **Leaves (T4).** The Squire's T4 question (the Conduit's: do your summons survive? The
    Striker's: what kills you?).
11. **Boss trophies.** What the relic modifies: the slam, a signature response, or Resolve.
12. **Items.** What a Squire weapon shapes (sword and shield, a two-hander for Juggernaut;
    slam size, Resolve gain, tempo); the questions the armor and charm lines ask (the
    Conduit's armor: who tanks? The Striker's: what keeps you swinging?).
13. **Defense and recovery.** What Resolve defends without being a shield; the in-combat
    Recovery share; the Toadeater weakness.
14. **Stance-like modes.** A tank invites one (shield up, shield down); the other two
    classes have none.
15. **Party role.** Taunts, intercepts, two tanks, bosses preferring players, buffs that
    don't stack, the Juggernaut owner.
16. **Bot plan.** Default rules per discipline; what the harness must set.
17. **T2–T4 biome by biome**, as the other two dives did.

### Seeds for question 7: the T1 biomes (*Proposed*, agent)

| Biome | Threat | A response it could teach | Note |
|---|---|---|---|
| Plains | swarms | **Challenge:** a shout that pulls every enemy around you onto you; solo it gathers the swarm (stragglers, ranged ones) into the slam, in a party it holds them off your allies | Taunt's solo value is gathering, not holding |
| Forest | fast packs; the Greatbear's cadence | **Riposte:** every third hit one enemy lands on you, you strike it back at once (Brawler's counter on hit) | The Conduit's Forest armor is thorns: same biome, same theme |
| Swamp | attrition, rot | **Steel Will:** when a poison or bleed lands on you, shrug it off | The Toadeater is the Squire's worst T1 boss |
| Mountain | the hardest hits, telegraphed | **Guard:** when a telegraphed blow is aimed at you, brace: it deals much less, and what you blocked fills Resolve (Brace's reactive window) | The densest telegraphs among regular mobs |
| Cave | elites, casters, defensive erosion | **Shield Bash:** when the enemy you fight starts a wind-up, bash it: the stun interrupts it | The interrupt seam exists; some boss steps are uninterruptible |

The brief's other two examples sit with later questions: an ally low → intercept (party
role) and parry and counter telegraphs (Avenger).

## Useful during the session

- A clickable mockup of the Response-rules screen once questions 3–6 have answers, if the
  designer wants one.
- Check every defensive piece against the Striker's four rules (§12.10).
