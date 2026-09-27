# Boss Lineage Redesign (working doc, started 2026-09-27)

Status: **review complete 2026-09-27; first implementation pass landed the same night**
(branch `feat/boss-lineage-redesign`, §4 steps 1–5 and the doc parts of 7). What shipped,
the seams it added and the known gaps are in
[`docs/boss-encounter-rework-current-state.md`](../docs/boss-encounter-rework-current-state.md)
("Boss lineage redesign — implemented"). **Not done:** the designer playtest of each
boss, and the numbers pass (step 6). The boss contract below replaces the old "constant
30–45s boss TTK" target in `boss-design.md`.

Current mechanics per boss: `docs/boss-encounter-rework-current-state.md` §5.
Data: `shared/src/data/monsters/bossesT1.ts` … `bossesT4.ts`, `bossPatterns.ts`.

---

## 1. Why this pass

- **Fights are too short to show their mechanics.** Measured median boss kill time
  (2026-09-26 matrix, 5 classes): T1 53s, T2 45s, **T3 93s, T4 52s**. T4 player damage
  grew 2.7× over T3 while boss HP grew only 1.6× (11,940 → 19,499 median).
- **Later tiers mostly repeat the earlier boss with bigger numbers.** Most phase beats
  are "at 50%, the same attack sooner / harder / wider".

## 2. Boss contract (draft)

| | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Target fight length (median build) | ~50s (as now) | ~60s | ~120s | ~180s |
| Distinct phases | 1–2 | 2 | 2–3 | 3 |
| Soft enrage | none | at ~1.5× target | at ~1.5× target | at ~1.5× target |

Principles:

1. **Sustained boss damage stays below class sustain.** Auto-attacks and ambient damage
   alone must not kill a reasonable build over the full target length. The threat lives
   in mechanics.
2. **Every mechanic has an answer the rune system can express** (Guard on telegraph,
   Step Back from a zone, Cleanse a mark, Break Free, burst adds with a Technique, kill
   before a cast). Solo bosses must be solvable by bots; future group bosses may ask for
   manual play and are tested by hand.
3. **A phase changes the question, not just the numbers.** A new tier of a lineage keeps
   the lineage's core idea and adds something meaningfully different: a new step in the
   sequence, a posture change, a new answer required, or an arena change.
4. **Nothing fancy.** Reuse existing seams (ordered patterns, casted beats, zones,
   conceal, pull, shields, summons) before inventing new ones.
5. **Damage windows are earned, not handed out.** A mechanic that completes gives no
   free window: at most a brief (≤ ~1s) recovery where the animation needs it. A
   mechanic the player **stops** (plate broken, mound dragged up, wind-up rooted or
   stunned) staggers the boss, shown with the **stun visual** — the one clear signal
   for "you stopped it, punish now". Removes the current long post-mechanic recoveries
   (e.g. Mountain "Overextended" 2.6s, "Spent" 3.2s); the numbers pass absorbs the
   extra boss uptime.
6. **Control is one answer, not the answer.** Control stops a mechanic only at a
   telegraphed moment (a wind-up, a mound in transit), never as general lockdown; a boss
   has at most one control-answerable mechanic; some bosses accept none (candidates:
   Tundra, Volcanic). Damage, Guard, and movement answers stay valid alongside it.

## 3. Lineages — current state and review

Legend for "evolution read": **Real** = later tiers ask something new; **Numbers** = later
tiers mostly repeat with bigger numbers.

| Lineage | Tiers | Core idea | Evolution read |
|---|---|---|---|
| Plains | T1–T2 | Swarm commander: trickle + rally waves | Numbers (T2 = one more rally) |
| Forest | T1–T2 | Cadence duel: attack-speed ramp | Thin (T2 adds a stun swipe + 50% frequency surge) |
| Swamp | T1–T3 | Rot arena: fight-long pools | Partly real (corrosion → vulnerability/detonation, 25% Rot Bloom) |
| Mountain | T1–T4 | Telegraphed lane charge | Real (barrier → endpoint Cragbreaker → fault lines) |
| Cave | T1–T3 | Defensive erosion; burrow eruption | Partly real (Breach → burrow → threshold poison) |
| Desert | T2–T4 | Mark → Execution | Real on paper (T3 turns kiter at 50%, T4 three acts); designer reports the kiter does not work in practice |
| Jungle | T2–T4 | Escape Guard: break it or it ambushes | Partly real (venom on ambush, cornered frenzy <50%) |
| Tundra | T3–T4 | Chill check: Deep Freeze → Shatter | Numbers (T4 = larger Collapse) |
| Volcanic | T3–T4 | Shell + Vent Heat trade | Partly real (T4 Simmering Burn + one Cataclysm cast) |
| Wasteland | T4 | Raise the dead from visible corpses | Single tier |
| Trench | T4 | Wound → Undertow → Constrict → Devour | Single tier |

### Per-lineage notes

Each lineage gets a section here as we review it: **keep / cut / add per tier**, the
phase plan against the contract, and the rune answer for each new mechanic.

#### Plains — swarm commander (T1–T2) — REVIEWED 2026-09-27

Intent: a deliberately **vanilla, entry-level AoE check**. Not meant to be hard.

- **T1 Tusked Razorback — keep as is.** Slime trickle (1 per 12s, max 3) + 50% rally
  (2 slimes + roar). Numbers settled in the 2026-09-26 T1 pass.
- **T2 Gorging Razortusk — one new twist: the rally empowers the herd.**
  - **Bug fix:** it summons T1 mobs (`plains-slime`, `boar`). Summon the T2 herd instead
    (`prairie-yearling` for the trickle, `stampede-bull` for the heavy add); spawned adds
    are not tier-scaled.
  - **Rallying Roar becomes the T2 mechanic:** a telegraphed cast on a timer (~15s) that
    empowers every living add (attack speed + damage) until it dies, instead of the
    current brief threshold-only roar. T1 asks "can you clear the trickle?"; T2 asks
    "can you clear it before the roar makes it dangerous?". Answer: AoE Techniques
    (Sweep/Slam) + add target priority.
  - **Savanna Hawks join the rally** (1–2, called at range so the Dive Bomb actually
    happens): each dives once and roots its target for 2s — the anti-kite lesson the
    zone already teaches. Answer: kill the hawks (250 HP); the root is short.
  - **Cut** the 25% boar-pair rally: one clear rhythm instead of three overlapping beats.

#### Forest — cadence duel (T1–T2) — REVIEWED 2026-09-27

Intent: entry-level duel; the designer likes the concept and execution. **No design
change.** T1 = attack-speed ramp only (50% enrage removed 2026-08-29). T2 adds a stunning
swipe (visible wind-up that shortens as the fight speeds up) and a 50% frequency surge.
Check during the numbers pass: the swipe's shortest wind-up must still leave time for a
rune-fired Brace.

#### Swamp — rot arena (T1–T3) — REVIEWED 2026-09-27

Designer: pools are a cool idea but the fight is mostly "move away from pools". Wants
pools of different kinds, the boss pulling you toward pools (T3 mobs experimented with
pulls; execution not liked), and an arena that grows increasingly corrupted. **Cleanse is
too binary** — a must-cleanse boss makes Cleanse a mandatory slot, not a choice.

- **Swamp stops demanding Cleanse.** Its intended answers are Swamp gear: DoT resistance
  (armor) and slow resistance (boots). Cleanse belongs to the mark bosses (Desert,
  Tundra). T2 Corrosion: remove, or keep only a light version answered by DoT
  resistance (open).
- **T1 Grave Toadeater — keep.** Bile Pools only (damage zones). The entry lesson.
- **T2 Mire-Gorged Behemoth — pool variety + the pull.**
  - Second pool type, **Mire**: no damage, heavy slow. Answer: slow resistance.
  - **Mire Lash**: telegraphed tongue grab that drags the target toward the nearest
    pool. Reuses the Trench Undertow pull seam (bounded, resisted by the forced-movement
    stat shared with knockback), aimed at a pool instead of the boss. Answers: keep
    pools behind you, forced-movement resistance, step out after.
  - Pools **fade after ~30–40s** instead of lasting the whole fight, so longer fights
    cannot wall the arena off.
- **T3 Rot-Spore Croc Behemoth — three phases (~2 min).**
  1. Bile + Mire pools and the drag (the T2 fight).
  2. **Spore pools** (detonate after a few seconds) become the focus; the drag now
     pulls toward spores — the combo is being yanked into a pool about to pop.
  3. **Rot Bloom = the soft enrage:** pools start **spreading** (radius grows to a cap)
     and a **room-wide rot ramp** builds (reuse the Volcanic Heat ambient-ramp seam; a
     slowly rising DoT, cleared when the boss dies). DoT resistance and Recovery stretch
     survival; killing the boss is the answer.
- New seams needed (all small): pull aimed at the nearest zone, zone radius growth over
  time, a room ambient ramp on a boss arena.

#### Mountain — "the charge is coming; how do you meet it?" (T1–T4) — REVIEWED 2026-09-27

Designer: base concept and T1 are good. The T2 plate vanishes at T3/T4, and the T3
Cragbreaker / T4 fault lines only land if the charge already hit you — more damage for
the same mistake, not a new question. Wants more than one answer to the charge.

**Core loop (all tiers, keep):** lane → charge → recovery, with **Charge Instinct**: each
charge that runs makes the next one faster until dodging stops being reliable. Answers:
**dodge** (free, but feeds Instinct), **Brace** (Guard on the telegraph; take it, reset
Instinct), and from T2 on a way to **stop** the charge. Each tier adds a stop answer that
matches the player's control ladder (root at T3, stun at T4) and one pressure that
makes dodging alone worse.

| Tier | New layer | Stop answer | Phases |
|---|---|---|---|
| T1 Crag Behemoth | none, keep as is | none: dodge or Brace | 1 (50% sooner/harder stays) |
| T2 Stoneplate Juggernaut | **Plate**: charges from behind a breakable barrier (keep) | **break the plate** → stagger | 2 |
| T3 Horn-Behemoth | **Double charge**: re-aims and charges again, shorter wind-up; **cut Cragbreaker**; plate carried over | plate break, or **root** the wind-up (Binding Strike) | 3 |
| T4 Iron-Crest Titan | **Rockfall**: delayed impact circles rain across the whole arena during the wind-ups; **cut the fault lines**; plate + double charge carried over | plate break, root, or **stun** the wind-up (Stunning Strike) | 3 |

Rules for stopping the charge:
- **Stun/freeze during the wind-up cancels** the charge and banks no Instinct (already
  how the code works; now designed and shown).
- **Root during the wind-up** (new, T3+): the charge fizzles into a short stumble, no
  damage, straight to recovery. Weaker than a stun because it does not skip the cooldown
  reset. Behavior today is undefined (pattern root vs. player root) — define it.
- **While plated, the boss ignores root and stun.** Break the plate first, or control it
  before it plates. Keeps T2's lesson alive at T3/T4.

Phase plans:
- **T3 (~2 min):** (1) single charge + plate; (2) ~60%: double charge; (3) ~25% soft
  enrage: shorter cooldown, faster Instinct.
- **T4 (~3 min):** (1) plated charge (the T2/T3 fight); (2) ~65%: double charge;
  (3) ~35%: Rockfall on every wind-up, cooldowns compress = soft enrage.

Rune answers: dodge = lane movement response (exists); Brace = Guard on telegraph;
root/stun = control Technique on "Enemy Charging" (exists); plate break = burst Technique
on "enemy shielded" (check it exists; add if not); Rockfall = step out of zone (exists).

**Phase clarity (all lineages):** phase transitions today are silent — `bossScripts`
applies the actions with no event. Add one small generic beat: an announced phase
change (short uninterruptible cast / roar + a phase label on the boss bar). Mountain's
phases also change visibly (two lanes, rocks falling), so they read by themselves.

Designer, after review: the fault lines are cut outright (not kept as a tail).
Recovery after a charge that completes (dodged or landed) shrinks to ≤ ~1s per
principle 5; the stagger is reserved for a stopped charge.

#### Cave — the burrower (T1–T3) — REVIEWED 2026-09-27

Designer: dislikes the T1 design (Breach plating shred); likes the T2/T3 burrow →
surface → eruption, but it is binary. Move the burrow down to T1 and build on it in
T2/T3. The burrowed boss should be targetable.

**Burrow answers (all tiers):** while burrowed, the boss is a visible, **targetable**
mound travelling toward you.
- **Damage:** enough damage on the mound drags it up early — it surfaces **staggered**
  (stun visual) and the eruption fizzles harmlessly. The damage answer, like the
  Mountain plate.
- **Slow** slows the mound's travel (more time to clear the spot).
- **Root (T3+)** pins the mound and forces it up where it is (staggered).
- Always: step out of the eruption circle, or Guard it.

**Erosion becomes a stacking damage-taken debuff, not plating shred.** Plating used to
dominate, so the lineage stops being about it.

| Tier | Layer | Question |
|---|---|---|
| T1 Obsidian Broodmother | **Burrow → surface near you → erupt** (today's T2 fight, simplified). **Cut** Breach and plating shred. | Read the mound, leave the circle. |
| T2 Chitinous Dreadbore | **Sinkholes**: each eruption leaves collapsed ground for ~30s; standing in it slows you and stacks **Eroded** (+damage taken per stack, decays). 50%: dives straight back down for a second eruption. | Where you dodge now matters. |
| T3 Deep-Core Burrow-Gorger | Three phases: (1) the T2 fight; (2) ~60% **Tunnel chase**: stays under longer and erupts **3 times in a row** along your path, each landing just behind you; (3) ~25% soft enrage: shorter gaps between burrows, sinkholes last longer and pile up. **Cut** threshold poison. | Keep moving and choose the path. |

Open: the tunnel chase count (3) is a first guess; settle it in playtest. Decoy mounds
were considered and dropped (one real mound among fakes reads poorly in auto-combat).

Rune answers: step out of zone (exists); Guard on telegraph (exists); damage the mound
= target a concealed-but-targetable boss (new: the bot must target the mound);
slow/root = control Technique on the burrow (needs an "enemy burrowed" condition, or
reuse "Enemy Charging").

New seams: targetable burrow, damage-threshold surfacing, a stacking damage-taken
debuff zone.

#### Desert — mark, slow, execute, across changing postures (T2–T4) — REVIEWED 2026-09-27

Designer: the mark → slow → Execution sequence is fine conceptually, but unclear
whether it scales. Likes the ranged boss (never explored before); in practice the
ranged phase does not work.

**Why the current ranged phase fails (investigated):**
1. The kiter backs off at 42–44 px/s against a 120 px/s player, and only once the
   player is inside 60% of its 240–250 range (~145px). A ranged player usually stands
   outside that, so the boss never moves; a melee player catches it at once.
2. The Death Sting pattern roots the boss ~6.5s per ~7s cycle after 50%, so it is
   standing still for most of the "kiting" act anyway.
3. The Execution lands on the player at any distance, so range changes nothing about
   the question.

**Lineage rule:** the sequence (Death Sting mark → Numbing Sting slow → Execution
cashes the mark) stays the same at every tier. What evolves is the **posture** around
it: melee duel → ranged standoff → hit-and-run.

| Tier | Layer | Phases |
|---|---|---|
| T2 Dune-Stalker Emperor | Mark → slow → Execution, one-Cleanse dilemma (keep) | 2 |
| T3 Dune-Carapace Monarch | + **Standoff** (ranged posture, done right) | 3 |
| T4 Dune-Throne Sovereign | + **Hit-and-run** act | 3 |

**Standoff (T3 phase 2 at 50%; T4 Act II):** it leaps back to range and runs the
sequence from there (marks and Executions from range). When the player closes in, it
**dash-escapes** back to range (reuse the Jungle flee movement, ~250 px/s, ~6s
cooldown). Between dashes it stands and shoots, so a chasing melee player gets ~4s of
hits after each dash. The Execution must not root it into a free melee target during
the standoff (keep the sequence short, or let it fire while holding its distance).
Answers: ranged builds duel it; melee chases; **root (T3+) stops the dash**.

**T3 phase 3 (~20%):** soft enrage — the sequence repeats faster.

**Hit-and-run (T4 Act III, last ~20%):** fast and deliberately hard to catch. It marks
from range, **dashes in, performs a combo (the Execution, cashing the mark), then
retreats faster than the player can follow** — out of reach of melee and most ranged
builds. It can be uncatchable, but it must never be unhittable: the combo is the
damage window for every build. Bursts come faster over time (this act is the soft
enrage).
- Gaps between bursts ≥ 4s so **Dawn armor** (engagement DR, re-arms after 4s quiet)
  resets before each dash-in — the Desert boss is where Desert gear pays off.
- **Root/stun on the dash-in or combo** leaves it stuck in melee and staggered (stun
  visual, principle 5): the earned big window.
- Guard the combo; Cleanse the mark.

Rune answers: Guard on telegraph (exists); Cleanse on mark (exists); control Technique
on "Enemy Charging" for the dash-in (exists, if the dash raises it); root on a fleeing
boss (check the condition exists).

New seams: dash-escape when approached (flee seam, triggered by proximity), a
dash-in → combo → retreat loop, a pattern that runs while the boss holds range.

#### Jungle — pursuit and failed escape (T2–T4) — REVIEWED 2026-09-27

Designer likes the loop (Escape Guard → flee; stopped = stays in the fight; escaped =
prowl → ambush) but it does not work well: the flee is too slow to matter, and the
ambush is a single alpha strike.

**Flee:** base flee speed high enough that, with no Instinct stacks, it usually escapes
an ordinary chaser; a heavy Squire should only catch it with a charge or by hindering
it. Instinct (failed flee → next flee faster) stays. Ways to stop it:
- **Break the Escape Guard barrier with damage** (kept: the ranged answer; resize it for
  the new speed).
- **Hinder:** slow shortens the run; root (T3+) or stun (T4) ends it on the spot.
- **Catch it:** close the gap (charge / gap-closer).

**A stopped flee is not a stagger window** (exception to principle 5): being stopped is
already the boss's punishment — it stays in the fight and loses its ambush. Keep only a
short (≤1s) stumble with the stun visual, so the player reads "you stopped it".

**Ambush → burst window:** it reveals with a short wind-up, opens with the
**Venomous Bite** (several short-lived poison stacks: extra damage during the burst,
not lingering pressure), then **frenzies for ~5s** (+attack speed, +attack). Answers:
Guard on the reveal, defense, or deny the escape. The bite is the ambush's opening
hit at T3+ (T2 opens with a plain hit).

| Tier | New layer | Phases |
|---|---|---|
| T2 Dread Gorger | The cycle: flee → (stopped, or escaped → prowl → ambush → frenzy) | 2 (50%: longer frenzy) |
| T3 Bramble-Slasher | + **Venomous Bite** opens the ambush | 3: cycle → ~60% bite joins → ~25% soft enrage (flees more often) |
| T4 Verdant-Crown Predator | + **Thorn snares** dropped along its flee path, rooting the chaser; + **Cornered** last act | 3: cycle with bite → ~60% snares → <30% Cornered: stops fleeing, permanent frenzy = soft enrage |

Snares make chasing on foot risky at T4 and push toward the other answers (barrier
damage, hindering from range, Break Free on the root). Cornered replaces today's <50%
wounded frenzy, moved later.

**Bug (fix with the implementation):** chased into a corner, the boss can no longer
flee. The flee AI (straight collision-clear line away from the pursuer, outward turns
≤75°, never past the pursuer) has no way out of a corner. It needs to pick an escape
line along the wall or past the pursuer's side when every outward line is blocked.

Rune answers: burst Technique on "enemy shielded" (shared with Mountain); control
Technique while it flees (needs a "fleeing" condition, or the flee raises "Enemy
Charging"); Guard on the ambush reveal; Break Free on the snare root.

#### Tundra — the Chill clock (T3–T4) — REVIEWED 2026-09-27

Problems found: **Cleanse outpaces Chill**, so a build with Cleanse never meets Deep
Freeze; the Shatter is centred on the boss, so a ranged player frozen at range is
never threatened; T3 still carries a 25% Ice Armor shield the 2026-09-04 rework
claimed to remove (stale comments too); T4 is only "bigger".

**Core, both tiers:** the room builds **Chill**; a second debuff, **Frostbite**, stacks
slowly over the fight, **cannot be cleansed**, and makes Chill build faster. Cleanse
still strips Chill but only delays the freeze. **Deep Freeze fires when you reach the
threshold** (short visible cast), not on a timer, and resolving it spends the
Frostbite. Your build sets how often freezes come, never whether. The freeze burst
(renamed **Frost Burst**; the T3 "Shatter" / T4 "Glacial Collapse" circle) is
**centred on the frozen player**, so ranged builds are tested too. Answers: Break Free
then step out, Guard, or tank (Tundra armor).

**Reactive posture (replaces the proposed Frost Aura; melee is not punished for
existing):**
- Player **close** → **Frost Nova**: telegraphed burst around the boss, adds Chill and
  damage. Step out of the circle.
- Player **at range** → **Frost Spikes**: a projectile that roots/heavily slows, then
  the boss walks up. Break Free (T3 Guard).

**Tundra accepts no control** (principle 6): its casts ignore root and stun.

| Tier | Phases |
|---|---|
| T3 Rime-Mammoth | (1) Chill + Frostbite + freeze, reactive posture; (2) ~50% **Brittle**: a Frost Burst leaves you Brittle for a few seconds and the boss follows up with a heavy telegraphed **Shatter** swing (Guard on the swing, or stay out of reach); (3) ~20% **Blizzard** soft enrage: room Chill and Frostbite build faster and faster. Remove the stale 25% Ice Armor. |
| T4 Glacial Patriarch | (1) the T3 fight including Brittle/Shatter; (2) ~60% **Ice Armor** (tentative): it encases itself and stops attacking. **Break it** → staggered + takes extra damage; **or disengage** and use the breather (Recovery, out-of-combat gear such as Dawn re-arm). The boss must keep aggro and never regenerate or reset while encased. (3) ~25% Blizzard, harsher. |

The Ice Armor is a real choice (burst it, or step away and recover) — the same kind
the Jungle flee offers. Rune answers: burst Technique on "enemy shielded"; a
"disengage while enemy shielded" rune for the breather (check exists; new if not);
Break Free; Guard on telegraph; step out of telegraph.

**Presentation hook — boss weather.** Blizzard (and later other intense phases:
storm, ash fall) gets a screen-space weather particle layer. Cheap: one pooled
Phaser emitter, a few hundred sprites in one batched draw, capped count, paused in
hidden tabs, behind a quality toggle. Server publishes only a node-level weather tag
(no gameplay). The same layer can later drive dynamic weather events per node →
record in `docs/future-plans.md` when this doc is committed.

#### Volcanic — the Heat race (T3–T4) — REVIEWED 2026-09-27

Designer likes the structure: Heat builds, the fight gets harder, and at the end the
boss stops attacking and charges a final strike you must kill it through. Problems:
fights are too short to show it; tanky melee soaks the final strike (fixed 650/1000
raw through normal defenses); the Vent is not interactive (stand on it, keep going);
the shell stops the boss attacking, so the Vent cycle **relieves** pressure instead of
adding it.

**Vents, both tiers:** vents appear **around the arena**, not under the boss, and the
boss **keeps attacking**. **Cut the shell cycle** (its no-attack window is the
pressure relief). Standing on a vent speeds up your Heat (more damage dealt and taken,
unchanged); each vent **erupts on a telegraphed rhythm**, and you must be off it when it
does. You can pull the fight onto a vent if you want the Heat. Bots that ignore vents
forgo the bonus. Rune: step out of telegraph (exists); vent stays `movementResponse:
'none'` between eruptions.

**Final strike at 25%, both tiers (T3 Final Eruption, T4 Cataclysm):** the boss stops
attacking and charges; uninterruptible (Volcanic accepts no control). A **hard DPS
check**, but an **extreme tank build can survive it**: a fixed raw hit through normal
defenses (plating, DR, barrier, Guard), calibrated with the eHP report so only
top-end tank setups (full tank gear + Guard) live through it and a median build dies.
Cast length is the knob: ~1.3× the median time to kill the last 25% at the new fight
length (roughly 20–30s, not today's 8s). It is the soft enrage.

| Tier | Phases |
|---|---|
| T3 Magma Salamander | (1) Heat + erupting vents around the arena; (2) ~50% caldera opens: Heat builds faster, vents erupt more often; (3) 25% **Final Eruption** |
| T4 Caldera Sovereign | (1) the T3 cycle + **Simmering Burn** building slowly all fight (Cleanse removes part of it, like Chill); (2) ~50% **Magma Shove**: a telegraphed shove that pushes you onto the nearest vent — the Heat bonus is yours if you can get off before it erupts; (3) 25% **Cataclysm**, with Simmering Burn accelerating during the cast ("kill it while burning up") |

Magma Shove reuses the Swamp "pull toward nearest zone" seam in reverse (push toward
a zone); resisted by the forced-movement stat. Rune answers: step out of telegraph;
Cleanse (partial) for Simmering Burn. Presentation: ash-fall weather in the final
phase.

#### Wasteland — the necromancer (T4) — REVIEWED 2026-09-27

Designer intent: the **successor to Plains** — an adds fight where **AoE is the most
important thing**. Raises should favour **numbers over quality**: more, weaker risen
(e.g. 2–3 per Raise, higher `maxAlive`, lower risen HP), rather than a few strong
ones. Risk noted: some builds cannot handle add-heavy fights, so risen stay weak
enough for single-target builds to clear, and Bone Tithe is capped. Designer will
iterate after playtest.

Keep: visible corpses and tethered claims, the one-time opening entourage (the seed
corpses), permanent risen deaths (the tide terminates).

| Phase | What happens | Answer |
|---|---|---|
| (1) 100–60% | Raise Dead on a cadence, several weak risen per cast. **The Raise cast can be stunned** (its one control-answerable beat; stun arrives at T4); a stopped raise staggers the boss (principle 5). | Stun the cast, or AoE the risen |
| (2) ~60% | **Mass Resurrection**, then **Bone Tithe**: the boss takes less damage per living risen (visible stacks, capped). | Clear the adds first; AoE Techniques |
| (3) ~25% | **Harvest** soft enrage: every few seconds it devours one of its risen and gains **permanent attack** (buff only, no heal: healing would lengthen the fight). | Clear adds before it eats them, or race the boss |

Rune answers: AoE Technique on "enemies nearby ≥ N" (check exists); stun Technique on
the Raise cast ("Enemy Charging"/casting condition); target priority for adds (bot
targeting rule).

#### Trench — the pressure hunt (T4) — REVIEWED 2026-09-27

Designer: the current sequence (Wound → Undertow → Constrict → Devour that heals 6%)
does not feel interesting. The Trench is meant to be **deep pressure**: an ancient sea
beast hunting you, and a fight where **the enemy overwhelms you with more debuffs than
Cleanse can keep up with**. Trench elites should feel like mini-bosses.

**Core: the debuff pile.** The serpent's attacks stack three debuffs faster than one
Cleanse can answer:
- **Wound** (bite): anti-heal.
- **Crushing Pressure**: slow.
- **Rend** (tail lash): increased damage taken.

The room builds **Depth** (ambient ramp, the Heat/Chill seam) that lengthens every
debuff over time. Cleanse chooses which debuff to drop; the real answers are **debuff
resistance** (Trench armor's niche), Recovery, and killing faster.

**Devour: no heal.** It deals extra damage **per distinct debuff on you** (the pile-up
payoff; Desert's Execution counts one mark, this counts everything). Cleanse becomes a
timing decision (before the Devour). A **stunned Devour staggers** the boss (its one
control-answerable beat). Cut: the 6% heal, Undertow and Constrict as fixed sequence
steps (the pull can return as a surge tool if needed).

| Phase | What happens |
|---|---|
| (1) 100–60% | **The hunt begins:** bite, pressure, lash → Devour. Learn the pile. |
| (2) ~60% | **Into the dark:** it sinks into the abyss — untargetable, shown only as a shadow circling you — and **Depth builds faster while it is gone**. It surges up in short bursts, each strike adding a debuff, then sinks again. Distinct from Desert's hit-and-run: there you cannot catch it; here you cannot see it, and the pressure grows while it hides. |
| (3) ~25% | **Crushing Depth** soft enrage: Depth accelerates, debuffs last longer and longer. |

**Presentation — the room goes deeper.** During Into the dark (and on into Crushing
Depth): a darkening overlay/vignette plus a **water-distortion** effect (a
screen-space displacement or drifting-caustics layer, same client layer and budget as
the Blizzard weather; server publishes only the node's ambience tag).

Rune answers: Cleanse on "carrying ≥ N debuffs" (check exists); Guard on the Devour
and on each surge telegraph; stun Technique on the Devour cast; build answers (debuff
resistance, Recovery).

**Follow-up, with the Trench implementation — mob pass:** the regular Trench monsters
become scary elites that each show one boss debuff at full strength: Abyssal Serpent
= Wound, Hadal Stalker = Crushing Pressure, Elder Leviathan = Rend.

---

## 4. Implementation plan (after the review)

Shared seams first, then lineages tier by tier with a designer playtest after each:

1. **Shared seams:** phase-change beat (announced cast/roar + phase label on the boss
   bar); stagger-on-stop with the stun visual, and the ≤ ~1s completed-mechanic
   recovery (principle 5); pull/push toward the nearest zone; zone radius growth; room
   ambient ramp on a boss arena (Swamp rot, Tundra Blizzard, Trench Depth);
   targetable burrow with damage-threshold surfacing; flee/dash-escape by proximity;
   root-on-wind-up behavior; rune conditions (enemy shielded, enemy fleeing/burrowed,
   carrying ≥ N debuffs, disengage while enemy shielded — check what exists).
2. **T1–T2 lineages:** Plains, Forest (check only), Swamp, Mountain, Cave, Desert T2,
   Jungle T2.
3. **T3:** Swamp, Mountain, Cave, Desert, Jungle, Tundra, Volcanic.
4. **T4:** Mountain, Desert, Jungle, Tundra, Volcanic, Wasteland, Trench (+ Trench mob
   pass).
5. **Client ambience layer:** weather particles (Blizzard, ash fall) and the Trench
   darkness/distortion; later reused for dynamic node weather.
6. **Numbers pass** against the contract (§2) with the all-spec boss matrix; then
   class residuals.
7. **Docs:** rewrite `design_docs/boss-design.md` and `player-power-curve.md` against
   this contract; update `docs/boss-encounter-rework-current-state.md` as each lineage
   ships.
