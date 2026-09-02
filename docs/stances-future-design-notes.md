# Stances — Future Design Notes

Status: **design notes.** The four candidate postures below were IMPLEMENTED on
2026-09-02 but are deliberately **unplaced** — no stance recipe teaches any of them, so
no character can learn one and every listener behind them is inert. Placing them (writing
recipes in `shared/src/stanceRecipes.ts`) is a separate decision, taken when there is a
tier, biome and cost that make sense. `server/test/stancesUnplaced.test.ts` asserts they
stay unplaced, so the day one is placed, that is a deliberate act and not a side effect.

The rest of this document is the design intent as written, kept because the reasoning
behind each posture is what should govern its placement and tuning.

Live implementation state: `docs/stances-current-state.md`. Authoring rules:
`docs/stances-authoring-guide.md`.

## Current design direction

Stances should remain mutually exclusive postures whose real depth comes from combining them with Rune conditions.

The intended progression is:

* early: choose a useful free default Stance;
* midgame: afford one or two useful automated transitions;
* later: increasing Global Mastery / Runic Point capacity allows increasingly sophisticated Stance state machines;
* highly optimized Stance micro should remain optional and compete with other advanced Rune and Rite spending.

Do not aim for every player to automate every useful Stance transition.

Fixed Rune conditions remain preferable for now. Parameterized thresholds such as arbitrary HP percentages or arbitrary enemy counts can be revisited if playtesting shows a real need.

---

## Future Stance candidate: Time to Strike

> **Implemented 2026-09-02 as `time-to-strike-stance` (unplaced).** `+1.0` to the
> empowered multiplier via the shared `shared.empowered-mult-add` passive, `-40%` on every
> non-empowered hit, `-35%` Attack Speed. `Empowered Ready` is now a legal Switch Stance
> situation, so `Empowered Ready -> Time to Strike` is buildable.

A posture for builds centered around large empowered attacks.

Core identity:

* substantially increase empowered-strike damage;
* reduce ordinary/non-empowered attack damage;
* reduce Attack Speed.

The Attack Speed penalty is important. The Stance should disproportionately reward slower, heavier empowered-hit builds such as Squire-style heavy subpaths rather than becoming a generic upgrade for fast Striker/Energy builds that generate empowered attacks frequently.

Potential Rune interaction:

`Empowered Ready -> Time to Strike`

This may justify allowing `Empowered Ready` as a Stance-switch condition in the future.

The posture should remain unattractive as a permanent default and reward deliberate timing around empowered attacks.

---

## Future Stance candidate: Reaper

> **Implemented 2026-09-02 as `reaper-stance` (unplaced).** `-15%` Attack; a kill landed
> while the stance is active arms a 6s window of `+35%` damage and `+25%` Attack Speed that
> outlives the stance. Kills made *outside* Reaper do not refresh it — otherwise the window
> never ends.

A kill-conversion / momentum Stance intended as an alternative to Execute.

Core identity:

* Reaper itself should carry a modest drawback or reduced neutral output;
* killing an enemy while Reaper is active grants a substantial short-lived offensive buff;
* the kill buff should persist after leaving Reaper;
* subsequent qualifying kills should preferably refresh the duration rather than stack its magnitude.

Likely payoff:

* increased Attack;
* increased Attack Speed;
* short duration, enough to carry momentum into nearby enemies.

Natural Rune interaction:

`Target HP Below 25% -> Reaper`

This creates a meaningful alternative to:

`Target HP Below 25% -> Execute`

**Execute**
optimizes finishing the current target and is especially valuable against bosses.

**Reaper**
converts the current kill into momentum against subsequent enemies and should excel in dense multi-enemy farming.

Example state loop:

Default combat Stance
→ target becomes low HP
→ Reaper
→ kill
→ return to default Stance while retaining Reaper's temporary kill buff
→ use that momentum against the next target.

Do not let Reaper's normal posture already be excellent; entering it before the kill should represent a small commitment made in exchange for the expected payoff.

---

## Future Stance candidate: Warding

> **Implemented 2026-09-02 as `warding-stance` (unplaced).** Incoming harmful statuses are
> applied with `-50%` duration and incoming DoTs with `-40%` per-stack damage, for `-50%`
> Attack and `-25%` Attack Speed. It is expressed as two passives
> (`shared.status-duration-resist` / `shared.status-potency-resist`) read by
> `server/src/systems/combat/status/harmfulStatus.ts`, so the resistance axis is open to
> gear later. Duration resistance covers the whole monster→player debuff surface (slow,
> root, mark, antiheal, vulnerability, plating-shred ramp, stun, DoT); potency resistance
> covers DoT per-stack damage only, because "potency" is a different number on every other
> debuff and one function cannot honestly scale all of them.

Lower priority than Time to Strike or Reaper, but potentially valuable if later encounters make persistent/deep debuff pressure important.

Core identity:

* substantially reduce the potency and/or duration of harmful statuses;
* severe offensive sacrifice while active;
* endure debuff pressure rather than cleanse it outright.

Natural Rune interaction:

`When Debuffed -> Warding`

Warding becomes substantially more compelling if enemy design eventually includes dedicated debuff specialists rather than occasional single debuffs.

Possible encounter archetype:

A "Poison Master" or curse specialist applies several different effects consecutively, for example:

* DoT;
* Movement Speed reduction;
* Attack Speed reduction;
* increased damage taken;
* reduced damage dealt.

Cleanse can remove part of the problem, but repeated or layered applications can overwhelm pure cleansing. This creates multiple valid responses:

* kill/focus the debuffer quickly;
* automate Cleanse;
* build relevant resistances;
* temporarily enter Warding and endure the status barrage.

Do not introduce Warding until encounter ecology gives it enough reason to exist.

---

## Future experimental concept: Powering Up

> **Implemented 2026-09-02 as `powering-up-stance` (unplaced),** in the charge-then-release
> shape below, not the naive one. `-50%` Attack and `-30%` Attack Speed while charging;
> charge accrues only while the stance is active AND the player is in combat, caps at 8s,
> and is DISCARDED when combat ends. Leaving the stance — however it is left — spends the
> charge for `+50%` Attack and `+30%` Attack Speed lasting exactly as long as the charge
> did. Charge under 1s is discarded rather than paid out, so tapping in and out is
> worthless. A general `Stance Charged` Rune situation was added, as anticipated below.

Interesting, but intentionally deferred to later tiers.

Avoid the simple design:

> Stay in this Stance and continuously become stronger.

That risks becoming an obvious generic Stance players never want to leave.

More promising design:

> Enter a deliberately weak "Powering Up" posture, accumulate charge, then receive a temporary offensive buff when leaving the Stance.

Possible release payoff:

* Attack bonus;
* Attack Speed bonus;
* temporary burst window.

This creates an actual state trajectory:

Power Up
→ charge
→ leave Stance
→ unleash temporary buff.

However, it carries significant design risks.

Do not allow it to become free out-of-combat preparation before every pull.

Its charging requirement probably needs meaningful opportunity cost, potentially requiring time spent charging during combat or another substantial drawback.

A mature implementation might eventually justify a general Rune condition such as `Stance Ready` / `Stance Fully Charged`, but do not add a condition solely to support this speculative Stance.

Keep this concept for later tiers where more advanced Stance state machines are appropriate.

---

## Existing Stances gain new uses from Rune expansion

> **Enabled 2026-09-02.** `While Traveling` is now a legal Switch Stance situation, so both
> rules below are buildable today with the existing cast — no new stance required.

The new `While Traveling` condition creates additional value from the existing cast.

### Fleeting while traveling

`While Traveling -> Fleeting`

Uses Fleeting's high Movement Speed and Evasion while accepting its severe offensive penalties during a state where offense is normally unimportant.

### Predator while traveling

`While Traveling -> Predator`

Provides a different travel strategy:

* moderate movement benefit;
* substantially reduced enemy detection;
* prepared opening strike.

This creates a meaningful contrast:

**Fleeting**
fast traversal and evasiveness.

**Predator**
stealthier traversal and stronger encounter openings.

This is desirable reuse of existing Stances rather than a reason to add dedicated "travel Stances."

---

## Long-term Stance design principle

Prefer adding Stances that create a new **state transition decision**, not merely another arrangement of stats.

Strong examples:

* Perfection — exploit maintaining near-perfect HP;
* Execute — exploit a wounded current target;
* Reaper — convert a kill into momentum for the next target;
* Time to Strike — exploit an empowered attack window;
* Brawler — respond to escalating enemy count;
* Predator — exploit the transition into combat;
* future Powering Up — prepare, then deliberately release stored power.

New Stances should preferably make existing Rune conditions more interesting rather than requiring a new condition for every new Stance.

The cast does not need regular additions simply because later tiers exist. Add a Stance when a new combat state or play pattern creates a genuinely different posture decision.

---

## Open questions before placing any of these

1. **Tier and biome.** Every stance recipe must satisfy the three reachability rules
   enforced by `shared/src/data/recipeGates.test.ts`: the biome has nodes at the recipe's
   tier, `requiredBiomeLevel` is within `biomeLevelCap(tier, group)`, and `catalystCost`
   names a live node-modifier family the biome can roll.
2. **Destination RP.** Seeded at 3 / 3 / 3 / 4 (Time to Strike / Reaper / Warding /
   Powering Up). With `Switch Stance` at 0 RP these price as condition + destination, so
   `Empowered Ready -> Time to Strike` is 5 RP and `Target HP Below 25% -> Reaper` is 4 RP.
3. **Every magnitude is a seed.** None of these has been benched. Reaper in particular is
   the one to watch: a momentum window that reliably outlasts the gap between kills in
   dense content is a permanent buff wearing a timer.
4. **Warding needs its encounter.** As the notes above say, it should not be placed until
   an enemy exists that layers debuffs faster than a cleanse can answer.
