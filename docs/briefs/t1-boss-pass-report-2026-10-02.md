# T1 boss pass — report (2026-10-02)

**COMPLETE 2026-10-02**, and confirmed by a canonical six-class 1x sweep on the same
revision (section 12): all six classes finish the script with the gate paid, against three
before the pass, and no boss killed anyone. Source revision `637ce2f5` on
`balance/t1-boss-pass`, merged into `feat/lineage-data-model`. Three shipped boss rows moved; the numbers below are scoped to
the tutorial's own boss kit at GM 30 with no lineage band, which is a FLOOR, not a real
player. Read section 0 before any win rate in this report.

Branch `balance/t1-boss-pass` off `feat/lineage-data-model`, merged back at the end.
Brief: `docs/briefs/t1-boss-pass-2026-10-02.md`. Evidence: `reports/t1-boss-pass/`
(its README has the two commands that reproduce any row).

**Three boss rows moved, one commit each, and the floor half of the bar is met.** Every
class now beats every T1 boss on the guide's own kit; the hardest pairing, Striker
against the Crag Behemoth, wins 77%. The ceiling half is not met and, more importantly,
**is not measurable in this instrument** — the reason is the first finding below and it
is the thing to read before any number in this report.

Two things the pass found that are worth more than the numbers it moved:

- **A solo T1 boss fight is deterministic.** The lab had been returning twenty identical
  fights per seed set. Fixed, and the fix changed real conclusions.
- **The Behemoth and the Broodmother are a 10x melee/ranged split**, not a difficulty.
  The Spirit takes *literally zero damage* from the Broodmother across a whole fight.
  That is the structural story under three of the five columns, and it is out of this
  pass's scope.

---

## 0. The instrument finding, first, because it conditions everything else

The brief asked for at least 10 seeds per cell. Seeds were doing nothing in 24 of the 30
cells.

Measured on the untouched baseline: **20 seeds produced 20 byte-identical fights** — same
duration to 100 ms, same boss HP left to a tenth — in every cell except the six Razorback
ones. Nothing in a solo T1 boss fight rolls a die. No T1 boss authors `evasion`; the
tutorial kits carry no dodge; the Chaotic Axe's "whiffs now and then" is a **counted**
`weapon.dead-swing-interval`, not a roll; and `forceBossPhase` strips the guards. Only
the Razorback varied, off its adds' spawn offsets.

So a seedless win rate can only ever be 0% or 100%, and the brief's bar needs a cell to
be able to say "sometimes".

**The fix restores the one source of variance the arena removed, rather than inventing a
distribution.** `BOT_SPAWN` is a single fixed pixel; a player walks to the altar from the
node's entrance. The lab's new `jitter` samples a uniform bearing at the same engagement
distance (400 ± 80 px; the altar is node centre). It is the question a directional lane
charge and a travelling mound actually ask.

It moved real conclusions, in both directions:

| cell | fixed spawn | seeded approach |
|---|---|---|
| Squire vs Behemoth | 20/20 | **4/10** |
| Striker vs Toadeater | 0/20 | **15/30** |
| Conduit vs Greatbear | 0/20 | **15/30** |

The 20/20 was the dangerous one: the pre-pass Squire looked like a clean pass on the
Behemoth and is actually a coin flip on which way it walks in.

**What this costs the bar.** The lab's remaining variance is narrower than live variance,
so its response curves are near-cliffs: the Greatbear goes 43% to 100% between HP 1350
and 1200, and 43% to 100% between attack 15 and 13. A 70–90% band is therefore **not
reliably reachable** for most cells — a candidate either leaves a class under the floor or
puts every class at 100%. Only the Toadeater landed a genuine band.

That is why the two halves of the brief's bar are not jointly measurable here, and why
the live sweep is the instrument that answers the second half. Live variance is much
wider: the 2026-10-02 canonical sweep had the Spirit take **three Greatbear kills in
eight attempts** on a boss this lab can only score 0% or 100%.

A second instrument note, on resolution: at 30 seeds the binomial spread near the floor
is about ±16 points at 95%. **21/30 and 24/30 are the same measurement.** No conclusion
below rests on a three-point move.

---

## 1. Before and after

Both matrices are six classes × five bosses × 30 seeds, GM 30, +5 gear, the guide's own
`bossKit` and per-boss armour/technique/guard read straight out of
`TUTORIAL_CLASS_PLANS`, seeded approach geometry, same seeds on both sides.

**Before** (`reports/t1-boss-pass/pre-pass.jsonl`):

| class | Razorback | Greatbear | Toadeater | Behemoth | Broodmother | worst |
|---|---|---|---|---|---|---|
| striker | 90% | **0%** | 50% | **3%** | 100% | 0% |
| squire | 100% | **0%** | **0%** | 50% | 100% | 0% |
| slinger | 100% | 97% | **0%** | 100% | 100% | 0% |
| spirit | 100% | **0%** | **0%** | 100% | 100% | 0% |
| apprentice | 100% | **0%** | 100% | 100% | 100% | 0% |
| conduit | 100% | 50% | **0%** | 100% | 100% | 0% |
| **floor** | 90% | **0%** | **0%** | **3%** | 100% | |

**After** (`reports/t1-boss-pass/final.jsonl`):

| class | Razorback | Greatbear | Toadeater | Behemoth | Broodmother | worst |
|---|---|---|---|---|---|---|
| striker | 90% | 100% | 97% | **77%** | 100% | 77% |
| squire | 100% | 100% | 87% | 100% | 100% | 87% |
| slinger | 100% | 100% | 100% | 100% | 100% | **100%** |
| spirit | 100% | 100% | 87% | 100% | 100% | 87% |
| apprentice | 100% | 97% | 100% | 100% | 100% | 97% |
| conduit | 100% | 100% | 100% | 100% | 100% | **100%** |
| **floor** | 90% | 97% | 87% | **77%** | 100% | |

- **Floor half: met.** Every class beats every T1 boss, and the hardest pairing —
  Striker vs Behemoth — is 77%, above the 70% floor.
- **Ceiling half: not met.** The Slinger and the Conduit win every cell. Per the brief's
  step 5 this is reported, not answered with a buff. Section 6 has the numbers.
- Four of six classes still lose to something: Striker (Razorback 90%, Behemoth 77%),
  Squire and Spirit (Toadeater 87%), Apprentice (Greatbear 97%).

`pre-pass.jsonl` was measured with the final lab build, reverting only the three boss rows
through `bp`, and it reproduces the original `base.jsonl` **exactly: all 900 fights match
on outcome, duration and boss HP left, and 0 of 30 cells differ by a single win.** That is
the check that the instrumentation which landed alongside the tuning did not itself move
any fight, and it is also a check on the `bp` override path — reverting three numbers
through it lands back on the measurement taken before they were edited in the data file.

---

## 2. Every number moved

Three rows in `shared/src/data/monsters/bossesT1.ts`, one commit each, revertible by row.

| boss | field | before | after | change | commit |
|---|---|---|---|---|---|
| Crag Behemoth | `stats.attack` | 56 | **50** | −11% | `716f741c` |
| Gnarled Greatbear | `stats.hp` | 1800 | **1450** | −19% | `84c06fa0` |
| Gnarled Greatbear | `stats.attack` | 18 | **16** | −11% | `84c06fa0` |
| Grave Toadeater | `stats.hp` | 2100 | **1750** | −17% | `7012dcbc` |

One test moved with them: `server/test/bossRework.test.ts` pinned the Greatbear's HP and
attack. It now pins the new pair and still pins the cadence (1900 ms) and the two-hit
combo, which the pass deliberately did not touch.

Nothing else changed. **Tusked Razorback and Obsidian Broodmother are untouched.** No mob
row, no Recovery value, no `PLAYER_POOL_FACTOR_BY_TIER`, no T2+ boss, no ability, no
seal.

The revert list also exists as data: the `pre-pass` candidate in
`server/scripts/_t1BossPlan.ts` is exactly these four numbers.

---

## 3. Crag Behemoth — attack 56 to 50

**The dominant hit is not what kills the Striker, and the lab can prove it.** Decision 3
offered the hit's magnitude or its multiplier. Cutting the multiplier by 21% moved the
Striker three points; cutting the magnitude by 11% moved it 74.

| candidate | striker | squire | others | mean burst5s | dps-in |
|---|---|---|---|---|---|
| base (atk 56, x1.9) | **3%** @24.6 | 50% @3.4 | 100% | 43.8% | 4.5 |
| atk 53 | 10% @18.9 | 100% | 100% | 41.4% | 4.3 |
| **atk 50 (adopted)** | **77%** @6.2 | 100% | 100% | 38.5% | 3.9 |
| atk 48 | 100% | 100% | 100% | 36.6% | 3.7 |
| atk 46 | 100% | 100% | 100% | 34.9% | 3.5 |
| atk 42 | 100% | 100% | 100% | 31.2% | 3.1 |
| `damageMultiplier` 1.65 | 7% @24.3 | 83% @1.4 | 100% | 39.0% | 4.3 |
| `damageMultiplier` 1.50 | 10% @23.4 | 100% | 100% | 36.0% | 4.2 |

Read the last two rows against `atk 50`. On the **Striker specifically**, `mult 1.50`
does strictly better than the adopted row on both burst measures and still loses:

| Striker vs Behemoth | biggest single hit | worst 5 s window | wins |
|---|---|---|---|
| base (atk 56, x1.9) | 92.6 (40.6% of pool) | 150.0 (65.8%) | 1/30 |
| `mult 1.50` | **72.7** (31.9%) | **130.1** (57.1%) | **3/30** |
| **`atk 50` (adopted)** | 82.6 (36.2%) | 133.0 (58.4%) | **23/30** |

**A smaller biggest hit and a smaller burst window, and it wins three fights in thirty
instead of twenty-three.** The burst is not the binding constraint.

This also means decision 3's stated criterion — make the sequence survivable from ~60%
HP — **is not sufficient on its own**, and is worth flagging as such: `mult 1.50` satisfies
it better than the row I adopted and leaves the Striker walled. The adopted row meets the
criterion, but that is not why it works.

What kills the Striker is a **sawtooth**. Its HP trace through one losing fight, as a
percentage of a 228 pool, sampled per second:

```
100 100 100 100 100  82 82 85 71 76 81 84 85 88  72 75 77 77
 59 61 66 71 76  61 62 64 67  51 54 54 54 56 61  48 53 56 57
 41 44 46   7
```

Every 3.5-second swing cycle costs about ten points of pool that Recovery does not get
back, so the Striker meets each Crag Charge lower than the last — **46% when the fatal one
lands**, not the ~60% decision 3 was sized against. The charge then finishes a bar the
ordinary attack emptied. `attack` is the one number both the swing and the charge scale
from, which is why it is the single lever.

**Decision 3's own criterion, met.** The worst 5-second window — the Crag Charge sequence
end to end, 2.4 s cast plus ~1.3 s run plus 1 s recovery — against the Striker's 228 pool:

| | biggest single hit | worst 5 s window |
|---|---|---|
| before | 92.6 (40.6% of pool) | 150.0 (**65.8%**) |
| after | 82.6 (36.2% of pool) | 133.0 (**58.4%**) |

58.4% is survivable from ~60% HP, which is the bar. **Stated plainly: the mean meets it,
the tail does not** — the worst single window in 30 fights is still 155 (68%), so a
Striker that walks in on the wrong bearing and is already low can still be killed by one
sequence. That is the 23% it still loses.

The encounter is untouched: the charge keeps 1.9, its 2.4-second committed lane, the 0.30
charge instinct and the 1.15 empower at 50%. The single hit is now ~45–50% of an
end-of-T1 pool, which is the `boss-design.md` anchor the data file cites; it was above it
on purpose and is now on it.

---

## 4. Gnarled Greatbear — hp 1800 to 1450, attack 18 to 16

It beat **five of six classes 30/30** on the guide's Forest kit, losses at 19–26% of its
bar left. This is the one boss that needed two levers, and the one where I checked the
cheaper non-boss answer first and it failed.

### The armour is not the lever — measured, not assumed

The boss's own header calls it "the evasion exam", so the obvious suspicion was that the
guide brings the wrong vest. It brings the right one.

| armour worn (boss untouched) | striker | squire | slinger | spirit | apprentice | conduit | dps-in |
|---|---|---|---|---|---|---|---|
| **Plains vest +5 (the guide's)** | 0% @26.3 | 0% @25.3 | 97% | 0% @19.3 | 0% @19.3 | 50% | 9.8 |
| Forest vest +5 (36% evasion) | 0% @26.8 | 0% @25.8 | 97% | 0% @19.5 | 0% @19.3 | 53% | **10.1** |
| Mountain vest +5 | 0% @28.3 | 0% @33.2 | **40%** | 0% @19.5 | 0% @22.2 | 50% | **10.8** |

The Plains vest is the **best** of the three, because this boss's beat is two small hits
and plating is a flat subtract — Plains +5 carries plating 3 against Mountain's 2. The
Mountain vest is actively worse and drops the Slinger from 97% to 40%.

And the Forest vest's 36% evasion is worth almost nothing: on the player side an evade is
a *graze*, scaled by `defense.evade-mitigation`, which that vest sets to **0.1**. So 36%
evasion buys about **3.6%** average mitigation, and the vest pays for it with 1 plating
and 2% DR. **Nothing in T1 gear answers the evasion exam this boss is named for.**
Flagged for the designer; not fixed here.

The Slinger's win is not its armour, then — it simply kills the bear in 27 s while the
others die at ~31 s having left a fifth of the bar.

### Why two levers

Both single levers cliff, so neither alone can put all six classes over the floor:

| candidate | striker | squire | slinger | spirit | apprentice | conduit |
|---|---|---|---|---|---|---|
| base (hp 1800 / atk 18) | 0% @26.3 | 0% @25.3 | 97% | 0% @19.3 | 0% @19.3 | 50% |
| hp 1500 | 0% @11.6 | 0% @10.4 | 100% | 17% | 37% | 100% |
| hp 1350 | 17% | 43% | 100% | 97% | 83% | 100% |
| hp 1200 | 100% | 100% | 100% | 100% | 100% | 100% |
| atk 16 | 0% @15.9 | 0% @13.7 | 100% | 0% @10.7 | 0% @11.2 | 87% |
| atk 15 | 0% @8 | 43% | 100% | 33% | 30% | 100% |
| atk 14 | 100% | 43% | 100% | 100% | 100% | 100% |
| atk 13 | 100% | 100% | 100% | 100% | 100% | 100% |
| Frenzy step x1.14 | 0% @11.7 | 0% @3.9 | 100% | 0% @16.7 | 0% @15.4 | 87% |
| hp 1700 + atk 15 | 43% @3.8 | 100% | 100% | 100% | 93% | 100% |
| hp 1600 + atk 15 | 100% | 100% | 100% | 100% | 100% | 100% |
| hp 1500 + atk 16 | 60% @0.7 | 100% | 100% | 97% | 83% | 100% |
| **hp 1450 + atk 16 (adopted)** | 100% | 100% | 100% | 100% | **97%** @0.8 | 100% |
| hp 1400 + atk 16 | 100% | 100% | 100% | 100% | 100% | 100% |

- The **one-lever** answer is `atk 13`, a 28% cut. It would put the Greatbear's per-hit at
  exactly the Toadeater's 13, which that boss's own comment calls "trivial" — it ends this
  boss's identity as the tier's pressure fight.
- `atk 14` is not monotonic across classes: the Striker flips to 100% while the Squire
  stays at 43%.
- **`hp 1450 + atk 16` is the adopted row**, and it is the only candidate that clears the
  floor for all six while leaving a real loss anywhere (Apprentice 29/30).

### Why most of it came out of fight length

Because that is where the boss's actual loss mechanism lives, and because it is the
authored identity. Bestial Frenzy stacks attack speed x1.20 every 6 seconds **with no
cap** — five stacks and 2.5x speed by 29 seconds, which is exactly when the losing classes
died. A shorter fight caps the ramp *reached* without a stack cap, which the data file's
own comment rules out ("a capped boss stops spending 1.5s of every 6s casting, so a cap
made the fight HARDER"). The header's own three words for this boss are "fast, frequent,
**frail**".

It keeps its pressure: **incoming 8.5 HP/s against the old 9.8**, still the highest of the
five bosses by a clear margin (the next is the Razorback at 6.6).

### A context the brief's own evidence sits in

The tutorial never fights the Greatbear at Tier 1. `classScript.ts` runs `gate()` after
`bosses()`, so the Greatbear is the **gate** boss, fought by a **Tier-2** character with a
Tier-2 pool factor and base Recovery — and it is wanted three times. The brief's cited
Greatbear evidence (Squire 0/13, Apprentice 0/11) is therefore Tier-2 evidence, while this
matrix is Tier-1.

I did **not** build a synthetic Tier-2 gate row for it: `canonicalBiomeLevels(2)` would
also hand the bot Tier-2 biome levels a freshly promoted character does not have, and an
approximated character is worse than none. The live sweep fights the real gate, and it is
the measurement: section 12 has it. The answer is that the gate is **not** too cheap. Every
class now banks its three kills in five attempts, the Slinger's cost is identical to before
the pass, and the two failed attempts per class are guard-pack deaths rather than boss
losses. So this row does not want pulling back down.

---

## 5. Grave Toadeater — hp 2100 to 1750

Four of six classes 30/30, the Striker 15/30. **The only class that won is the
Apprentice, and only because its plan wears `swamp-vest-t1` for this one fight** — 25%
`defense.dot-resistance` against a boss authored to deliver ~85% of its damage through
channels plating and DR never touch.

| candidate | striker | squire | slinger | spirit | apprentice | conduit | dps-in |
|---|---|---|---|---|---|---|---|
| base (hp 2100) | 50% @6.5 | 0% @11 | 0% @4.3 | 0% @11.6 | 100% | 0% @6.8 | 5.9 |
| hp 1900 | 83% | 47% | 100% | 3% | 100% | 83% | 5.8 |
| **hp 1750 (adopted)** | **97%** | **87%** | 100% | **87%** | 100% | 100% | 5.7 |
| hp 1600 | 100% | 100% | 100% | 100% | 100% | 100% | 5.5 |
| pool `damagePerTick` 3 to 2 | 50% @6.5 | **0%** @10.8 | **0%** @3.8 | **0%** @11.3 | 100% | **0%** @6.8 | 5.9 |
| dot `damagePerStack` 2 to 1 | 100% | 100% | 100% | 100% | 100% | 100% | **3.8** |

**This is the one boss where both halves of the bar hold at once**: every class at 87% or
better, and three of six still lose sometimes.

Two findings in that table worth keeping:

- **The Bile Pool is not this fight.** Cutting its damage by a third changes *nothing* —
  every 0/30 stays 0/30, dps-in moves 0.0. The poison is the whole encounter. Worth
  knowing before anyone tunes the pool again.
- Halving the poison per stack puts all six at 100% and cuts incoming damage 36%. Far too
  blunt; it ends the attrition exam.

HP is the right lever for an attrition boss: it shortens the window the poison and the
permanent pools work in and leaves every mechanic at its authored size.

### The cheaper fix is not a boss row, and the designer should see it

Giving every class the Swamp vest for this fight — which the Apprentice's plan **already
does** — takes the **untouched** boss from four 0/30s to:

| armour worn (boss untouched) | striker | squire | slinger | spirit | apprentice | conduit | dps-in |
|---|---|---|---|---|---|---|---|
| Mountain vest (the guide's) | 50% @6.5 | 0% @11 | 0% @4.3 | 0% @11.6 | 100% | 0% @6.8 | 5.9 |
| **Swamp vest (+25% DoT resist)** | **100%** | **100%** | **100%** | 53% @2 | 100% | **100%** | 5.0 |

This boss is the tier's DoT exam and five of six tutorial plans bring no DoT answer to it.
One line in `DEFAULT_BOSSES.swamp` would do most of what the HP cut does, without
weakening the boss for a player who gears correctly. **If that is changed in `plans.ts`,
revert `7012dcbc`.** The pointer is in the data file's comment so the next reader finds it.

A caveat on scope that applies only here: the Toadeater is **not a tutorial boss at all** —
the seals are Plains and Mountain and the gate is Forest — so "the tutorial's own boss kit"
for the Swamp is a row of `plans.ts` data for a fight the guide never has. The bar is still
a real bar (a Tier-1 character should beat a Tier-1 boss) but the kit it is measured on is
the under-specified part of the brief.

---

## 6. The two bosses left alone, and the ceiling

### Tusked Razorback — untouched, 90% floor

The weapon fold (`74ab24ac`) fixed it as the brief said. Striker 27/30, everyone else
30/30. Its three Striker losses are the only reason the Striker is not at 100% on the
first column, and at 90% it is comfortably over the floor. **It is also the only boss with
genuine seed variance of its own** (its adds' spawn offsets), which is why its cell reads
90% rather than 0% or 100%.

### Obsidian Broodmother — untouched, and the tier's pushover

100% for all six classes, before and after, and nobody spends a *single tick* under 25% HP
against it:

| class | raw damage taken, whole fight | incoming HP/s | lowest HP reached |
|---|---|---|---|
| striker | 472 | 8.0 | 37.8% |
| squire | 444 | 6.8 | 48.0% |
| slinger | 63 | 1.5 | 80.8% |
| **spirit** | **0** | **0.0** | **100%** |
| apprentice | 84 | 1.7 | 87.4% |
| conduit | 89 | 1.6 | 88.5% |

The Spirit finishes the fight on a full bar having taken **zero damage**. Per step 5 of the
brief this is reported and not answered with a buff.

### The ceiling half of the bar

The Slinger and the Conduit win all five cells. Three things to say about it:

1. It is partly the instrument. Section 0's cliffs mean a cell that clears the floor
   usually clears it to 100%; the lab cannot express a 10% loss rate for a cell it can
   only score in thirtieths of a near-deterministic fight.
2. It is partly real, and the structural finding in section 8 is why: the Slinger and the
   Conduit are ranged, and three of the five bosses deal almost no damage to a ranged
   class.
3. **It cannot be fixed by buffing a boss**, and not only because step 5 forbids it. The
   same buff that gives the Slinger a loss would take the Striker back below the floor —
   the melee/ranged spread is 10x on two of these bosses, so one number cannot sit on both
   sides of it.

---

## 7. The seal decision — keep Mountain

Decision 6 said to move the second seal back to Forest **if Mountain is still the harder
seal for most classes**. Post-pass, on the seals' own loadouts:

| class | Mountain seal (Behemoth) | Forest seal (Greatbear) | harder |
|---|---|---|---|
| striker | **77%**, 67 s | 100%, 31 s | Mountain |
| squire | 100%, 76 s | 100%, 38 s | equal |
| slinger | 100%, 47 s | 100%, 27 s | equal |
| spirit | 100%, 54 s | 100%, 32 s | equal |
| apprentice | 100%, 50 s | **97%**, 32 s | Forest |
| conduit | 100%, 75 s | 100%, 31 s | equal |

Mountain is harder for **one** class of six, not for most. The condition for moving the
seal is not met. **`TUTORIAL_SEALS` stays `['plains', 'mountain']`.**

Two structural reasons it should stay even if the numbers were a tie:

1. **Step Back has no payoff against the Greatbear.** The guide teaches the Step Back Rune
   in the Cave, the leg immediately before the seals, and `SEAL_SECOND.mountain` sells the
   Mountain boss as the fight it answers. The rule is `inside-telegraph -> step-back`, and
   `inside-telegraph` reads `ctx.insideDangerousTelegraph`. The Greatbear authors **no
   telegraphed damaging attack at all** — no `chargedAttack`, no `bossPattern`, and its one
   cast is a self-buff — so the rune the player just bought is inert for the whole fight.
   The Behemoth's committed 2.4-second lane is the one T1 encounter that pays for it.
2. **The Greatbear is already the gate boss.** The Gale Needle's gate wants three Forest
   capstones, so a Forest second seal would have the player fight the same boss for the
   seal and then three more times for the gate — four Greatbear kills and never a Behemoth.
   Mountain-as-seal keeps the chapter's two boss fights distinct encounters.

Note the 2026-09-29 swap's stated reason is now obsolete either way: Forest was dropped
*because* the Greatbear walled a GM-30 Striker, and the Striker now beats it 30/30.

---

## 8. The structural finding this pass could not fix

The reason the matrix looks the way it does is not boss difficulty. It is that **two of
the five T1 bosses deal their entire damage output through one telegraphed ground
attack**, which an orbiting ranged class never stands in and a melee class on
`chase-enemy` cannot leave.

Incoming HP/s by class, on the untouched baseline:

| boss | striker | squire | slinger | spirit | apprentice | conduit | spread |
|---|---|---|---|---|---|---|---|
| Razorback | 8.6 | 6.9 | 5.6 | 4.3 | 6.6 | 5.0 | 2.0x |
| Greatbear | 12.8 | 11.3 | 8.8 | 8.6 | 9.6 | 7.8 | 1.6x |
| Toadeater | 6.3 | 6.5 | 6.3 | 5.7 | 4.5 | 6.3 | 1.4x |
| **Behemoth** | **9.8** | 7.8 | **1.3** | **1.0** | 4.0 | 2.9 | **9.8x** |
| **Broodmother** | **8.0** | 6.8 | **1.5** | **0.0** | 1.7 | 1.6 | **infinite** |

The three bosses with a continuous, non-telegraphed damage channel sit at a healthy
1.4–2.0x class spread. The two built around a single readable ground attack sit at ten
times and infinity.

This is why the Behemoth's answer had to be `attack` rather than its charge multiplier
(section 3), and it is the whole of why the Broodmother is a pushover (section 6). **It is
a rune and encounter-design question — `orbit` versus a committed lane — not a boss row**,
so it is out of this pass's scope. It is the biggest single thing I would put in front of
the next pass.

---

## 9. Recovery — report only, nothing changed (decision 7)

Per class and boss, on the final numbers. `healed` is **exact**: raw hpDamage minus the
bar's net decline, so every point of damage that did not end up missing from the bar.

| class | boss | pool | HP/s | raw dmg | healed | share healed | time < 25% HP | lowest HP | dps-in |
|---|---|---|---|---|---|---|---|---|---|
| striker | Razorback | 208 | 12.5 | 414 | 262 | 63% | 5.5% (2.4 s) | 24.3% | 8.6 |
| striker | Greatbear | 208 | 12.5 | 363 | 181 | 50% | 13.3% (4.1 s) | 11.8% | 11.2 |
| striker | Toadeater | 228 | 12.5 | 365 | 194 | 53% | 6.7% (3.8 s) | 19.0% | 6.1 |
| striker | Behemoth | 228 | 12.5 | 553 | 366 | 66% | **18.4% (12.5 s)** | 12.7% | 8.2 |
| striker | Broodmother | 228 | 12.5 | 472 | 335 | 71% | 0% | 37.8% | 8.0 |
| squire | Razorback | 229 | 12.5 | 394 | 271 | 69% | 0.5% (0.2 s) | 37.3% | 6.9 |
| squire | Greatbear | 229 | 12.5 | 383 | 179 | 47% | 9.8% (3.7 s) | 12.0% | 9.8 |
| squire | Toadeater | 251 | 12.5 | 404 | 175 | 43% | 14.4% (8.7 s) | 9.1% | 6.4 |
| squire | Behemoth | 251 | 12.5 | 542 | 378 | 70% | 0.5% (0.4 s) | 29.9% | 7.0 |
| squire | Broodmother | 251 | 12.5 | 444 | 321 | 72% | 0% | 48.0% | 6.8 |
| slinger | Razorback | 193 | 12.5 | 270 | 218 | 81% | 0% | 64.6% | 5.6 |
| slinger | Greatbear | 193 | 12.5 | 195 | 105 | 54% | 0% | 48.4% | 7.0 |
| slinger | Toadeater | 193 | 12.5 | 211 | 55 | **26%** | 5.8% (2.0 s) | 17.4% | 5.9 |
| slinger | Behemoth | 193 | 12.5 | 56 | 44 | 77% | 0% | 75.8% | 1.2 |
| slinger | Broodmother | 193 | 12.5 | 63 | 61 | 96% | 0% | 80.8% | 1.5 |
| spirit | Razorback | 181 | 12.5 | 222 | 160 | 72% | 0.9% (0.5 s) | 56.5% | 4.3 |
| spirit | Greatbear | 181 | 12.5 | 236 | 90 | 38% | 9.9% (3.1 s) | 22.5% | 7.3 |
| spirit | Toadeater | 199 | 12.5 | 238 | 50 | **21%** | 10.2% (4.3 s) | 5.6% | 5.6 |
| spirit | Behemoth | 199 | 12.5 | 42 | 23 | 55% | 0% | 79.9% | 0.8 |
| spirit | Broodmother | 199 | 12.5 | **0** | 0 | — | 0% | 100% | 0.0 |
| apprentice | Razorback | 197 | 12.5 | 319 | 169 | 53% | 7.9% (3.5 s) | 16.7% | 6.6 |
| apprentice | Greatbear | 197 | 12.5 | 289 | 126 | 44% | 6.4% (2.0 s) | 16.6% | 8.5 |
| apprentice | Toadeater | 207 | 12.5 | 187 | 62 | 33% | 0% | 37.5% | 4.4 |
| apprentice | Behemoth | 216 | 12.5 | 182 | 99 | 54% | 0% | 59.3% | 3.5 |
| apprentice | Broodmother | 216 | 12.5 | 84 | 84 | 99% | 0% | 87.4% | 1.7 |
| conduit | Razorback | 190 | 12.5 | 274 | 192 | 70% | 0% | 49.4% | 5.0 |
| conduit | Greatbear | 190 | 12.5 | 229 | 120 | 53% | 0% | 36.6% | 7.2 |
| conduit | Toadeater | 208 | 12.5 | 233 | 59 | **25%** | 8.9% (3.4 s) | 16.3% | 6.0 |
| conduit | Behemoth | 208 | 12.5 | 195 | 195 | 100% | 0% | 53.5% | 2.6 |
| conduit | Broodmother | 208 | 12.5 | 89 | 87 | 98% | 0% | 88.5% | 1.6 |

**The designer's hypothesis is that flat Recovery is why classes now lose to bosses. These
numbers do not support it, and here is the specific reason rather than a restatement of
the bisect:**

1. **The Recovery stat is 12.5 HP/s for every one of the six classes, in every one of the
   thirty cells.** The `swamp-charm-t1` +5 the guide buys is the only Recovery source any
   tutorial build carries, and no class root or tutorial skill adds to the stat.

   The *access fraction* does differ by root — the Squire's is permanent in combat, others
   are windowed — so what each class realizes is not identical. But measured rather than
   assumed, the realized healing barely varies and the damage does:

   | | striker | squire | slinger | spirit | apprentice | conduit | spread |
   |---|---|---|---|---|---|---|---|
   | share of raw damage healed back | 62% | 61% | 61% | 44% | 51% | 64% | **1.5x** |
   | incoming HP/s, mean over 5 bosses | 8.7 | 7.7 | 4.4 | 3.7 | 5.3 | 4.6 | **2.4x** |
   | incoming HP/s, worst single boss | 11.2 | 9.8 | 7.0 | 7.3 | 8.5 | 7.2 | — |
   | incoming HP/s, Behemoth only | 8.2 | 7.0 | **1.2** | **0.8** | 3.5 | 2.6 | **10x** |

   Recovery varies across classes by half again; the damage it is answering varies by
   two and a half times over the tier and by **ten times** on the two bosses in section 8.
   The quantity that separates a class that loses from a class that wins is the bottom
   row, not the top one.
2. **It is not a small share of the fight.** It heals back **38–72%** of all raw damage in
   the four non-trivial columns, and up to 100% in the trivial ones. Against the Behemoth
   the Striker heals 366 HP into a 228 pool — one and a half bars over a 67-second fight,
   an active fraction of roughly 44%. Recovery is carrying a large part of the T1 boss
   economy, not failing to.
3. **Where it is weakest is exactly where the content says it should be.** The lowest
   shares in the table are the Toadeater's 21–33% for the four ranged classes — the DoT
   attrition boss, authored so that ~85% of its damage arrives through channels mitigation
   does not touch and faster than a flat rate answers. That is the exam working, not
   Recovery failing.
4. **Time under 25% HP is the melee/geometry story again, not a Recovery story.** It is 0%
   for every ranged class against the Behemoth and the Broodmother, and 6–18% for the melee
   pair. The Striker spends **12.5 seconds** under a quarter of its bar against the
   Behemoth; the Spirit never drops below full against the Broodmother.

**Nothing was changed.** These are numbers for the designer to judge it against in the
playtest.

### One defect found in passing, in the heal log rather than in healing

`applyHealToPlayer` logs `Math.round` of a per-tick applied amount, and flat Recovery at
10 Hz arrives in sub-1 slices. So a 0.5 HP/tick heal logs as **1** — double — and anything
under 0.5 logs as **0**. The combat log therefore over-reports small healing by up to 2x
and under-reports the smallest to nothing at all.

Measured on one cell: the Striker's Toadeater fight logs **378 HP healed** against a true
**215**, while four classes log **literally zero** healing in fights where they
demonstrably heal 50–65 HP.

**HP itself is correct in every case** — `applyHealToPlayer` applies the fractional amount
and only the *log line* rounds — so this is a readability bug, not a gameplay one. It is in
front of the designer because the combat log is what a human reads when judging Recovery by
hand in a playtest, and right now it will show them the wrong number in both directions.
Not fixed here: it is not a boss row, and the fix is a decision about whether to accumulate
a sub-1 remainder or log at a coarser cadence.

---

## 10. What the adopted rows lean on — for the ability pass

The brief asks this pass to name any ability its tuning depends on, so the ability pass
that follows can keep it under its own constraint (reference-wiring T1 DPS within a few
percent of today). Measured rather than listed: each row zeroes one ability's key effect
on top of the **tuned** boss numbers, 30 seeds, same seeds as `final`.

**Second Wind is the single most load-bearing number in T1 boss combat.** Zeroing its
`recoveryPct` (0.5 at rank 0 — it activates half the flat Recovery rate for 4 s):

| boss | striker | squire | slinger | spirit | apprentice | conduit |
|---|---|---|---|---|---|---|
| Razorback | 90 → **0** | 100 → **43** | 100 → 97 | 100 → 80 | 100 → **3** | 100 → 70 |
| Greatbear | 100 → **0** | 100 → **0** | 100 → 100 | 100 → **7** | 97 → **0** | 100 → 87 |
| Toadeater | *no change* | *no change* | *no change* | *no change* | *no change* | *no change* |
| Behemoth | 77 → **0** | 100 → **0** | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 |
| Broodmother | 100 → **0** | 100 → **23** | 100 → 100 | 100 → 100 | 100 → 100 | 100 → 100 |

Without it the melee pair loses almost the whole tier — **including the Broodmother**,
which is otherwise a pushover nobody drops below 37% HP against. The Toadeater row is
unchanged because the Swamp loadout runs Cleanse instead, which is the check that this is
measuring what it claims to.

**Expose Weakness is what makes my Greatbear row work for the Striker.** Zeroing its
`damageTakenPct` (+15% at rank 0):

| boss | striker | squire | slinger | spirit | apprentice | conduit |
|---|---|---|---|---|---|---|
| Greatbear | 100 → **0** | 100 → 90 | 100 → 100 | 100 → 97 | 97 → 80 | 100 → 100 |
| Toadeater | 97 → 90 | 87 → **60** | 100 → 100 | 87 → 77 | 100 → 100 | 100 → 93 |
| Razorback / Behemoth / Broodmother | *no change* | | | | | |

The Razorback is unchanged because its loadout runs Sweep, and the Behemoth and
Broodmother because neither fight is damage-limited for the classes that already win it.

**Sweep matters only where there are adds**, which is one boss:

| boss | striker | squire | others |
|---|---|---|---|
| Razorback | 90 → **3** | 100 → **47** | *no change* |
| all four others | *no change* | | |

**What the ability pass needs to keep.** In priority order: Second Wind's `recoveryPct`,
because every adopted row assumes it; Expose Weakness's `damageTakenPct`, because the
Striker's Greatbear win is 100% with it and 0% without; and Sweep's `splashPct` for the
Razorback alone. If any of the three moves materially downward, **all three boss rows in
section 2 need re-measuring** — they were tuned against these abilities as they stand.

---

## 11. What I could not verify

- **The ceiling half of the bar.** Not measurable in this instrument (section 0). The
  Slinger and Conduit read 100% on all five. The sweep does not settle it either, and in
  one sense argues the other way: **no boss killed anyone in it at all**, so on live
  evidence every class is currently 100% against every boss it fights. What kills players
  in the T1 boss chapter is the Forest guard pack, which is not a boss row. Whether a boss
  should ever beat a well-played character is the designer's call, and it cannot be
  answered by either instrument I have.
- **The 70–90% band, for four of the five bosses.** The lab's cliffs (section 0) mean the
  adopted rows land at 97–100% for most cells rather than in a band. Only the Toadeater
  landed one. The win rates are therefore a floor, not a prediction of live rates.
- **Any absolute number against a real player.** The lab buys no lineage band
  (`materializeBot`), and the melee plans' Chaotic Axe swap leaves the one card the guide
  teaches inert — a lineage pays only while its own form is worn. Every number here is the
  **floor** a player with no tree sits on; a real player is stronger.
- ~~The Greatbear at the gate, i.e. at Tier 2~~ — **settled by the sweep** (section 12):
  3 kills in 5 attempts for every class, the Slinger unchanged from before the pass, and
  the failures are guard-pack deaths. The lab was never asked to model it.
- **The Behemoth's burst tail.** The mean 5-second window meets decision 3's criterion; the
  worst of 30 does not (section 3).
- **The Razorback's and Broodmother's rows at all.** Untouched and unmeasured beyond the two
  matrices — in particular the Squire's 2026-09-29 Razorback stall (the fight sitting at
  1–3% boss HP for twelve minutes) did not reproduce here, but this lab force-wakes the boss
  and strips the guards, so it is not the instrument that would show it.
- **The ability-dependency rows against a real player.** Section 10 zeroes an ability
  entirely, which prices whether a row leans on it, not how it responds to a 10% trim.
  A partial change needs its own measurement.
- **Whether `attack` was the right axis for the Behemoth as a matter of design**, as
  opposed to arithmetic. The lab says it is the lever that works; whether the Mountain
  lineage should instead get a second, non-telegraphed damage channel so melee has
  something to mitigate is the section 8 question and a designer's call.

---

## 12. Canonical 1x sweep — the confirmation

Ran on the committed tip `637ce2f5`, `canonical-isolated`, `taints: []`, reward multiplier
1, no fast boss retry, one server and one game DB per class, 4 workers, 2 h cap. Full
ledger appended to `docs/guided-tutorial-plan.md`; only the conclusions are here.

The revision it ran is the shipped one: **no non-comment change landed in `shared/` or
`server/src/` after `637ce2f5`**, so this validates the exact numbers in section 2.

### All six classes completed the whole script, gate paid

| Class | Plains seal | Mountain seal | Greatbear (gate, 3 kills) | route | deaths |
|---|---|---|---|---|---|
| Striker | 1/1 | **1/1**, 74 s | **3/5** | **67m40s** | 2 (0 to a boss) |
| Squire | 1/1 | 1/1, 75 s | **3/5** | **68m31s** | 2 (0 to a boss) |
| Slinger | 1/1 | 1/1, 50 s | 3/5 | **63m15s** | 2 (0 to a boss) |
| Spirit | 1/1 | 1/1, 56 s | 3/5 | **54m38s** | 2 (0 to a boss) |
| Apprentice | 1/1 | 1/1, 50 s | **3/5** | **77m28s** | 2 (0 to a boss) |
| Conduit | 1/1 | 1/1, 74 s | 3/5 | **58m13s** | 2 (0 to a boss) |

Against the morning sweep on the same harness: the **Striker** went from 0/12 on the
Behemoth and a 2 h cap with 17 deaths to both seals first try and a finished route; the
**Squire** from 0/13 at the gate to 3/5; the **Apprentice** from 0/11 to 3/5. The three
walls the brief named are closed, and no beat in the whole sweep returned `stalled` or
`blocked`.

### The two results that most constrain what to do next

**The nerfs are sized, not overshot.** The Slinger's gate is *identical* pre and post —
3 kills in 5 attempts — and the Spirit's moved only from 3/8 to 3/5. A Greatbear that had
been trivialised would have moved the classes that were already comfortable; it did not.
Pacing is also unchanged: 55–77 min against the morning's 60–65, GM 30 at 27–41 against
26–44.

**No boss killed anyone in the entire sweep.** The Greatbear went **18 victories and no
losses** in 28–36 s a fight. All twelve deaths are Forest dungeon guardians, and the reason
is a concurrency spike this lab cannot see, because `forceBossPhase` strips the guards:

| dungeon | max concurrent attackers (identical for all six classes) |
|---|---|
| Plains (seal 1) | 4 |
| Mountain (seal 2) | **1** |
| **Forest (the gate)** | **9** |

Every gate death is the same shape: rest to full, hold at full through the travel, engage,
die 55–60 s later under seven to nine wolves to a 12–15 damage blow. Not a low-HP
re-entry — the HP trace sits at max until the engagement — and not the boss.

This is **not** a consequence of the pass. The morning sweep's three finishers show `—` in
their loss-hp-left column too, so their failures were already guard deaths. What changed is
that the boss is no longer *additionally* a wall for half the roster, leaving everyone at
the guard-pack cost that the capable classes always paid. **If the designer wants the gate's
difficulty to live in the boss rather than in nine wolves, the lever is the guard pack, not
the Greatbear row** — and the lab is the wrong instrument for it.

The Mountain dungeon's **1** concurrent attacker is the corollary that justifies section 3:
the Behemoth is a pure duel, so its own `attack` was the only thing that could have been
the lever there.

### The lab predicts fight length well and win rate badly

Ten independent cells, lab mean TTK against the live fight:

| cell | lab | live | error |
|---|---|---|---|
| striker / Behemoth | 69 s | 74 s | −7% |
| squire / Behemoth | 76 s | 75 s | +1% |
| slinger / Behemoth | 47 s | 50 s | −6% |
| spirit / Behemoth | 54 s | 56 s | −4% |
| striker / Razorback | 46 s | 45 s | +2% |
| squire / Razorback | 54 s | 51 s | +6% |
| slinger / Razorback | 46 s | 45 s | +2% |
| spirit / Razorback | 50 s | 51 s | −2% |
| slinger / Greatbear | 27 s | 28 s | −4% |
| spirit / Greatbear | 32 s | 31 s | +3% |

Within 1–7% everywhere, which is a good independent check on the instrument — and a useful
boundary on it. The lab models **fight length** accurately; it does not model **win rate**,
because the variance that decides a win lives in things it holds fixed (the guard pack,
arrival state, approach) — see section 0. Read a lab TTK as a prediction; read a lab win
rate as a floor.
