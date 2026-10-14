# Slinger deep dive — prep pack (2026-10-14)

**What this is:** the starting material for the Slinger's class deep dive in the class-first
rework. The Conduit (§7) and the Striker (§12) are locked: worked examples, not templates.
The Squire dive (§8) is running; the Apprentice (§9) and Spirit (§11) dives run in
parallel with this one. The output is §10 of the
[class-first bible](../../design_docs/class-first-bible.md), written to the class template
(bible §6). Nothing here is decided unless it says so. Every lead carries an ID so the log
can cite it.

**Parallel note:** the Slinger, Apprentice and Spirit are today's three ranged classes,
designed at the same time. When this prep was written neither the Apprentice's nor the
Spirit's prep or log existed, so names and mechanics were checked against the bible and the
Conduit, Striker and Squire files only. Re-check before proposing a name or a signature.

## What the designer has already said

From the [brief](class-first-rework-brief-2026-10-13.md):

- **Core mechanic:** clip-based fire with its own fire rate; **the reload is stationary by
  default**. *Tentative.*
- **Custom system: the Loadout:** what goes in the clip, plus reload and last-bullet
  triggers. *Tentative.*
- **Disciplines:** **Gunslinger** (small clip, fast reload, reload triggers) · **Siege**
  (big clip, marks detonate on reload) · **Trickshot** (last bullet, ricochet, pierce).
  *Tentative.*
- **Drop "2× attack speed at 65% attack."** Fire rate is its own stat; the fast feel comes
  from animation and sound. *Decided.*
- **Cut generic on-hit:** bullet properties are its on-hit. *Decided.*
- Item examples, *Tentative* and written before the relic became the boss trophy (§4):
  **Hand Cannon** (weapon: 6-round clip, heavy bullets; legendary: the last bullet deals
  bonus damage per bullet that hit this clip), **Bandolier** (relic: each reload adds 2
  marking rounds), **Glass Duster** (shared armor: more damage, less defense, faster
  reload; §1 names it as an allowed trade).

From the brief's addendum (*Decided*, recorded in §3): **you load clip types** (freezing,
burning, slowing…); every bullet in a clip is the same; **the last bullet is an extra
modifier** on top; no per-bullet authoring. The Striker's Order is short and authored; the
Slinger's clip is long (around 20 rounds) and uniform.

From the Striker dive ([log](striker-deep-dive-log-2026-10-13.md), 15th–16th reviews):
**Flashpoint** (each lit swing marks the enemy it hits; the next finisher strikes every
marked enemy) was liked and dropped because it is close to **Deathmark**, a Slinger
specialization the designer has planned. Marks and Deathmark are the Slinger's (§12.15).
"Its Cannoneer will probably be replaced."

## Decided in the bible since (cross-class)

Read §1–§6 for the exact wording. In short:

- **No abilities outside the class system** (§3): *Decided* for the Striker and the Squire,
  *Proposed* for every class: **to confirm for the Slinger.** Today's shared abilities
  (Slam, the guards) and the runes driving them go.
- **Rules cost nothing; each class has its own budget,** grown by Global Mastery in steps
  and shown in class terms (§2, §3). Conduit: Command. Striker: technique slots, then
  mastering them. Squire: Resolve pips. What the Slinger's grows is this dive's question.
- **Progression** (§2): T2 discipline (a considerable power step), T3 specialization (three
  per discipline), T4 onward leaves (three per discipline per tier). Branches never nest.
- **Defense and recovery live in equipment** (armor and charm class lines), plus some T4
  resilience for melee; never on triggers that scale with attack speed. The Striker's four
  rules (§12.10): nothing triggers on your hits; nothing scales with attack speed; nothing
  makes weak hitters irrelevant; no resource doubling as a shield (the Spirit's).
- **The relic is the boss trophy** (§4); a plain version until the first boss kill, no
  starter trophy (Striker, Squire). Both melee classes split their trophies into two kinds:
  spark/weight (Striker), slam/Resolve (Squire).
- **Signature payoffs stay with their class** (§3): freeze-then-shatter and
  stack-then-detonate are the Apprentice's. The Striker's Momentum lives on the Striker,
  never on the target, for that reason (§12.5).
- **Specializations are content-neutral** (§12.6, Striker). **Prefer triggers that work in
  every fight;** no on-kill (§1). **Each biome's threat hands you its answer,** and a
  returning biome teaches a lesson every tier: new, sidegrade or rank-up (§12.8). Jobs move
  when a biome retires. **The same buff or debuff from two players doesn't stack** (§7.12).
- **Every class system has a T1 form** a fresh player sees in the first ten minutes (§2,
  *Proposed*): 25 of 38 live players never reached T2 (Sep 24–27).

## What worked in the earlier dives (method, not a template)

The designer's T1 sketch biome by biome, then extended to T2–T4. Fantasies first. The old
frames (light, balanced, heavy) became the disciplines in both melee dives. An ownership
statement (techniques own the beats, the relic owns the finisher, the discipline owns the
resource, a specialization bends it) settled many later calls. Turned down before: vanilla
ramps, effects too flashy to read, a specialization for one kind of content, abilities
outside the system, defense riding offensive triggers, on-kill triggers, per-piece
authoring sprawl.

## What exists today, and what it might become

| Piece | Today | In the rework |
|---|---|---|
| Core loop | A clip of `reload.max-ammo` rounds; empty, a reload timer runs (1.6 s default) and no shot fires. **The Slinger keeps moving while it reloads in combat**; nothing makes it stationary (`reloadPrototype.ts`, `reloadLifecycle.ts`) | Clip types, a fire rate of its own, a stationary reload by default |
| Chassis | +20% attack, +7% HP, +10% attack speed, +10% move speed, +120 reach, 30% evasion. Weapon Attack at 65% "at this extreme cadence", flat on-hit at full strength. Kills turn on 20% of Recovery for 4 s; evades mitigate 10% more; target pickup radius ×2.5. Shots pay half an enemy's plating (`platingMult` 0.5) | The 65% rule goes (brief). The on-kill Recovery goes (§1). Per-class stats are §5's question |
| Frames (T2 today), by clip position | **Scout** (5 rounds, 1.2 s; the first two rounds of a fresh clip ×1.3) · **Marksman** (10, 2.0 s; the last round ×2.2) · **Artillerist** (20, 3.0 s; +2% attack speed per shot, damage up to ×1.3 by the clip's end; resets on reload) | The disciplines' skeleton: Scout → Gunslinger (fresh clips, fast reloads), Marksman → Trickshot (the last round), Artillerist → Siege (the big clip) |
| Range (T3 today) | **Breacher** (close: −120 reach, +18% HP, sharper evasion) · **Enforcer** (mid: shots on an enemy held at bay slow it 20% for 1.2 s) · **Deadeye** (far: shots from the outer quarter of reach +20%) | Scrapped as nodes; the at-bay slow and the long-range bonus are clip-type or weapon-job material |
| T3 paths (T4 today) | Light: **Duelist** (each kill loads a round past the clip's size), **Desperado** (each reload completion stacks +6% attack speed and −10% reload time, up to 5), **Sniper** (3 shells at a fixed 0.5 shots/s; attack speed turns into damage; ×2 on targets above 95% HP). Balanced: **Bounty hunter** (each shot adds a Death Mark stack, up to 10; the reload detonates them for attack × stacks × 0.3), **Blunderbuss** (the whole clip as one point-blank volley that shoves), **Dualslinger** (even rounds 2× attack, odd rounds 2× on-hit). Heavy: **Melter** (a heat laser instead of a clip), **Warmonger** (a reload halves the ramp; 40-round clip), **Cannoneer** (shots bank damage; at the reload a cannon fires the pool) | Mine the ideas, don't port them. Bounty hunter *is* stack-then-detonate (collision 1); Duelist is on-kill; Desperado is a reload trigger (Gunslinger material); Cannoneer is a bank on the Slinger (an allowed shape) the designer expects to replace |
| Runes | **Reload Safely** (`tactical-reload`): after combat, reload a partial clip at double speed and hold still until done. **Keep Distance:** ranged kiting is rune-only today | Reload rules become free Loadout rules; kiting is a standing-order question |
| HUD | The ammo ring: pips around a circle, denser past 12 and 18 rounds, with shot and refill animations (`client/src/hud/mechanics/ReloadMechanic.tsx`); a reload-start event carries the duration | The Loadout's readout: the ring coloured by the loaded clip type, the next clip, the last round marked |
| Art | Bodies through T3: a hood over a pale mask with a painted eye, an amber sash; scout → marksman → artillerist. **No firearms are drawn** (the prompts avoided gun nouns). Bespoke FX in `client/src/fx/bespoke/slinger.ts` (Dualslinger's gold slug and blue arcane round, the Bounty detonation, the Cannoneer blast, the barrel glow); impact style `gunshot` | Reused; the fantasy question decides whether guns appear |

**Runtime seams worth knowing:**

- **Every shot knows its place in the clip:** `ctx.metadata.reloadClipIndex` (1-based) is
  set before the hit (`reloadPrototype.ts`) and read by the frame loop (`frameLoop.ts`).
  The first-round and last-round seams exist.
- **Reload hooks:** `onStart` and `onComplete` lifecycle hooks are the reload-trigger seam;
  a reload can be requested by hand (`requestManualReload`) or completed early (Refund).
- **A clip type is a set of on-hit effects keyed off the loaded clip:** the combat pipeline
  needs nothing new. Blunderbuss pellets (a volley in one beat, a shove per pellet) and the
  Melter's heat are working code for a scatter round, stopping power and a clipless gun.

Sources: `server/src/systems/classes/archetypes/reload/` (runtime, frame loop, the nine
paths), `shared/src/data/skillTree/rootsAndFrames.ts` (root, frames, range),
`shared/src/data/skillTree/t3CombatA.ts` (the nine paths),
[frames-current-state.md](../frames-current-state.md),
[rune-system-current-state.md](../rune-system-current-state.md).

## Evidence

- **Ranged classes are the hardest to hurt, and the reason is orbiting.** In the T1 boss
  pass ([report](t1-boss-pass-report-2026-10-02.md) §6, §8, §9) the Slinger won every T1
  boss every time (with the Conduit: the "ceiling half" not met). It took 4.4 HP/s on
  average against the Striker's 8.7 and the Squire's 7.7; on the Behemoth 1.2 against the
  Striker's 8.2. Two of the five T1 bosses deal all their damage through one telegraphed
  ground attack that an orbiting ranged class never stands in; the report calls it "orbit
  versus a committed lane" and its biggest open item. **A stationary reload is a
  class-level answer:** the Slinger stands still for part of every clip.
- **Its weak spot is attrition, like everyone's:** on the Toadeater its lowest HP was 17%
  and it healed back only 26% of the damage it took.
- **It kills fast:** the Greatbear in 27 s (the others about 31 s); the guided T1 route in
  63 minutes, both seals first try.
- **Pauses cost fast shooters the most:** the ability pass (2026-10-09) found a 1.6 s Slam
  wind-up makes the Striker, Slinger and Spirit stop attacking and lose while the Conduit
  gains. The stationary reload is the Slinger's built-in pause; its price belongs in the
  class's numbers from the start.
- **Two owners of the last round collided once:** the Duelist's exploding last bullet (×3.5
  with splash) was retired because it duplicated the Marksman's last round (design §22.5).
  The rework needs one owner of what the last round does.
- **Evasion buys little for a player:** an evade is a graze scaled by evade mitigation; the
  Forest vest's 36% evasion was worth about 3.6% mitigation (boss pass §4). The Slinger's
  30% root evasion is mostly decoration.
- **Late packages:** the T3/T4 Slinger trails the pre-pass baseline by 3–8% (ability pass);
  Melter ran 1.28–1.34× the median but lost 14–43% of its fights
  ([tier-balance-current-state.md](../tier-balance-current-state.md)).
- **No human playtest covers a Slinger** (playtest 3 was a Striker).

## Collisions to resolve

1. **Siege's "marks detonate on reload" vs the Apprentice's stack-then-detonate** (§3).
   Today's Bounty hunter is exactly stack-then-detonate. Leads:
   - **M1, breadth marks:** one mark per enemy, never stacks; the payoff hits every marked
     enemy at once (the reload's volley finds them all). Many targets, one blow each,
     where the Apprentice's is depth on one target. Flashpoint had this shape.
   - **M2, the bank on the Slinger:** the clip charges something the reload fires (the
     Cannoneer's shape; the Striker's rule that banks live on the class, never the target).
   - **M3, marks as targeting:** a marked enemy draws your shots (ricochets and pierces seek
     it); nothing detonates.
2. **Deathmark** is the designer's planned specialization. Ask what it is before proposing.
3. **The Loadout must not feel like the Order or the Response rules** (§3). Lead **L1:** the
   decision point is the reload. A free rule picks which clip type to load next, for the
   next ten seconds or so: a choice of ammunition for the situation, never a sequence of
   rounds and never an instant answer to an enemy move. Risk: it is still condition →
   action, the same engine (§3: same engine, different surface).
4. **Elemental clips vs the Apprentice's payoffs:** freezing rounds chill and slow, never
   freeze-then-shatter; burning rounds burn, never detonate (as the Conduit's Icebound and
   Berserk steered clear, §7.16).
5. **Ricochet and lines elsewhere:** the Conduit's Dartcaller ricochets (§7.16, T4 Jungle);
   the Squire's Faultline and the Striker's Earthsplitter run down a line. Trickshot's
   signature may need to be the last round, not ricochet itself.
6. **Fire rate vs attack speed (cross-class):** fire rate is its own stat. Does any other
   class's attack-speed effect (today all self-only or summon-only) ever touch it? A note
   for the log's cross-class list.
7. **The stationary reload vs the defense rules** (§12.10): a shield or heal on reload
   breaks the first rule in spirit, since small clips and fast fire reload more often
   (Gunslinger would farm it). A state ("while reloading…") is allowed by the Striker's
   reading, but its uptime also grows with fire rate. Lead **R3:** the reload's cover comes
   from equipment lines and free positioning rules, never a reload-triggered shield.
8. **On-kill:** the root's Recovery on kill and the Duelist's kill chain go (§1); their
   replacements trigger on a new target, on time or on rounds.
9. **Names:** "Siege" is close to the Squire's Juggernaut leaf **Siege Engine** (§8, being
   written now); Duelist (old Slinger path; also the Striker's dropped discipline);
   Executioner (a Conduit summon); Longshot (a Conduit weapon job); Pin (a Striker
   technique); Expose (the Striker's Cave trophy). Scout, Marksman, Artillerist, Breacher,
   Enforcer and Deadeye are today's ids: names may return, ids may not (§2).
10. **What the Slinger fires.** The brief speaks of bullets, clips and a Hand Cannon; the
    effects say `gunshot`; the bodies carry no firearm.

## The questions, in order

Leads are seeds to argue with, not rules.

1. **Fantasy in one line, and what it fires.** Leads: **F1** the gunslinger ("I load the
   right rounds and empty the clip"); **F2** the artillerist who sets up and shells; **F3**
   the trick-shooter whose last round is the show. Guns, slings, crossbows or conjured
   rounds decide names, effects and art.
2. **No abilities outside the class system** (§3): confirm.
3. **Fire and the clip.** What fire rate is (the weapon's; does attack speed exist for the
   Slinger at all?); the T1 clip size and reload time; the "~20 rounds" against
   Gunslinger's small clip (uniformity, not length, is what keeps it apart from the Order).
   Lead **P1:** a per-round effect builds to a cap, so fire rate buys how fast you get
   there, not how high.
4. **The reload.** Stationary by default (the class's risk window and its answer to the
   orbit finding); what moves it (Gunslinger, a boots or armor line); free reload rules
   (**R1** reload early when nothing threatens you; **R2** never start a reload inside a
   telegraph). What the reload looks and sounds like.
5. **The Loadout.** What you configure: a rack of clip types (**L1**), the last round, the
   reload's trigger. Who owns what (lead **O1:** clip types own each round; the relic owns
   the last round or the reload; the discipline owns the rhythm: clip size, reload, where
   in the clip the damage lives; a specialization bends the rhythm). Defaults; the screen
   next to the Order and Formation.
6. **The budget.** What Global Mastery's steps grow. Leads: **B1** clip types carried
   (1 → 2 → 3, then mastering); **B2** properties per clip (two in one clip at a step);
   **B3** clip size (probably not: the discipline owns it, as the Striker's combo length).
7. **The relic.** **K1** last-round trophies; **K2** reload trophies; **K3** both kinds,
   one twist each (as the melee classes split theirs).
8. **The T1 form**, then T1 biome by biome: each threat's clip type, weapon, armor, charm
   and trophy. Seeds below.
9. **Disciplines (3):** Gunslinger, Siege, Trickshot. Fantasies first, then rules; Siege's
   marks (collision 1).
10. **Specializations (9),** Deathmark among them.
11. **Leaves (T4).** The Slinger's T4 question (Conduit: do your summons survive? Striker:
    what kills you?). Lead: **"what happens when they reach you?"**
12. **Items.** What a weapon sets (fire rate, clip, reload, one job); the armor's question
    (lead: "what covers your reload?"); the charm's (lead: "when do you get your breath
    back?"); the Hand Cannon, Bandolier and Glass Duster re-homed.
13. **Defense and recovery.** The reload window under §12.10; evasion's fate; what replaces
    the on-kill Recovery; kiting as a standing order.
14. **Stance-like modes.** Probably none: the loaded clip already is the mode.
15. **Party role.** Lead: ranged damage that marks targets for the party, under the
    no-stacking rule and clear of the Striker's Expose.
16. **Bot plan:** the rack, the clip rules, the relic, the reload rules per discipline.
17. **T2–T4 biome by biome,** as the other dives did.

### Seeds for question 8: the T1 biomes (*Proposed*, agent)

| Biome | Threat | A clip type it could teach | Note |
|---|---|---|---|
| Plains | swarms | **Scatter rounds:** each round bursts on impact and nicks up to two enemies beside the target | The answer to the Plains entry spike; small, not the Blunderbuss volley |
| Forest | fast packs | **Snare rounds:** each round slows the target's movement and attacks a little, stacking to a cap | Keeps fast packs off you through the reload |
| Swamp | attrition | **Venom rounds:** each round adds a poison (damage over time) | A theme crossing with the Apprentice's Poison: no spread, no detonation |
| Mountain | the hardest hits | **Stopping rounds:** each round shoves the target back a little; a charger reaches you late | Control that scales with fire rate (P1); bosses may shrug it off |
| Cave | elites, plating | **Breaching rounds:** every round ignores most of the target's plating | Today every Slinger shot already pays half plating; that becomes this clip's |

Freezing and burning clips (the addendum's examples) would arrive with the Tundra and the
Volcanic at T3, chilling and burning without the Apprentice's payoffs (collision 4).

## Useful during the session

- A clickable mockup of the Loadout screen once questions 3–6 have answers, if wanted.
- Check every defensive piece against §12.10, and every per-round effect against fire rate.
