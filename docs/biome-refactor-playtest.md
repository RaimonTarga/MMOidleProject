# Biome Refactor — Dungeon Playtest Notes

Running notes + open questions from the per-biome T1 dungeon authoring pass
(Step 13). One section per biome. Numbers are placeholders unless stated — the
goal of a playtest is to answer the questions below, not to confirm tuning.

See `docs/dungeon-current-state-and-gauntlet-plan.md` for the shared T1 rule and
the per-biome behavior specs.

---

## Forest T1 — alpha-priority / predator-burst (`node-6-7`, Gnarled Greatbear)

**Intended exam:** read the dangerous one (the alpha), survive a telegraphed
burst (Brace timing), and manage split focus when the boss calls a wolf pack.
Explicitly *not* a Plains swarm.

**What shipped:**
- Pre-encounter = one alpha den (1 buffed Wolf alpha + 2 Young Wolves), spawned as
  a real pack with call-allies. Only the alpha is buffed/named (`Pack Alpha`) and
  it is pinned to its post (`localWanderRadius 0`) so it reads as a **territorial**
  den guardian, not an ambient roamer.
- **Predator howl:** the alpha projects a damage aura (`range 220 / mult 1.18`) over
  its pups — kill the alpha first and the pups hit softer. The aura SOURCE shows a
  **"Rally"** buff tile on its target frame (the `pre-encounter-aura` indicator,
  via the existing `targetStatus` mirror) so players can read "this one buffs its
  pack." (The Plains caller got the same indicator.)
- Uncleared alpha joins the boss (shared `join` hook). Clearing it = clean start;
  leftover pups alone do not affect boss start.
- Boss: **Marked Prey → Savage Maul** as the core identity. The charged Maul paints
  "Scent of Blood" (the shared MARKED debuff via `marksTarget`) when the charge
  *begins* — a cleansable tell shown in the buff bar during the ~1.2s wind-up —
  then lands the telegraphed ×2.4 spike + pounce-shove (Brace-able), consuming the
  mark on impact. The 50% young-wolf call is reduced to a **one-time capped pair
  (×2)** + light enrage; no repeating add beat. No AoE.

**Playtest questions:**
1. Does the alpha actually *read* as the priority now (territorial pin + howl aura
   + the "Rally" target-frame tile), or do players still AoE the den down without
   noticing it? Does killing the alpha-first to drop the pups' damage feel like a
   real, noticeable payoff, or is the aura mult (1.18) too subtle? Is `focus-elites`
   rewarded here?
2. Is the den the right size? 3 bodies is meant to be "a threat, not a swarm." With
   the 50% call now only a pair (×2), does leaving the den alive (join) + the pair
   still ever stack into too many bodies, or is it now comfortably readable?
3. **Marked Prey beat:** does the "Scent of Blood" mark (a separate buff-bar tell)
   read as a distinct *warning* ahead of the pounce, or is it redundant with the
   cast bar? Does it teach "cleanse / Brace the pounce" — i.e. does cleansing the
   mark feel meaningful, or do players just Brace and ignore it?
4. **Maul wind-up (1.2s):** long enough to Brace/interrupt/cleanse on mobile, short
   enough to threaten? Does the cast bar + mark read clearly against the melee scrum?
5. Maul multiplier (×2.4) + knockback (130): does Brace feel *necessary*, or is it
   free to facetank at T1 HP? Does the pounce-shove ever knock the player into
   something bad, or is it just flavor?
6. Does the fight reward burst (killing the alpha/adds fast) over pure sustain now
   that the boss leans on one big telegraphed hit instead of add pressure?
7. Should the uncleared alpha instead **empower the boss's first mark/pounce** (the
   spec's alternative) rather than join directly? Join is simpler and shipped;
   revisit if "den joins" feels like just more bodies.

**Known gaps / deferred:**
- `onPackAlphaDead` (scatter the pups when the alpha dies) is still unwired dead
  code — killing the den alpha does NOT clear the pups yet. With the howl aura now
  in, wiring it would make the "kill the alpha first" lesson far stronger; flagged
  for the AI pass.
- The mark reuses the Desert `sun-mark` status + "MARKED" tile (generic copy:
  "the next heavy hit lands amplified"). A bespoke Forest "Scent of Blood" label /
  color is a polish item; the howl aura and Maul reuse `strong-kick` / no bespoke
  FX (a bear-lunge animation + a distinct howl pulse are polish items).
- The "Rally" aura indicator is target-frame only (shows when you target the
  source). A persistent world-space over-sprite indicator would need an aura art
  asset (none exists yet) — deferred.
- All numbers are placeholders (Step 15 balance pass).

---

## Plains T1 - herd swarm / body-pressure (`node-4-3`, Tusked Razorback)

**Intended exam:** concentrated many-body pressure. The player should feel local
herds collapsing in, not a generic guardian ring or one node-wide blob.

**What shipped:**
- Pre-encounter = three authored local herds. Each herd has one `Prairie Caller`
  (`prairie-wolf`) plus 3 Plains Slimes and 1 Boar, linked as a pack.
- Callers project a small local damage aura to nearby herd members. Only callers
  count as uncleared threats.
- Uncleared callers are consumed into capped extra boss-start adds (`extra-adds`).
  Killing callers first produces a clean boss start.
- Boss: capped periodic slime trickle, plus a 50% larger herd call (slimes + one
  boar) and light enrage.

**Playtest questions:**
1. Do the three herds read as local groups, or do they still visually feel like a
   renamed guardian ring?
2. Is 3 herds too many bodies for T1, especially with a summon-heavy player?
3. Does killing callers first feel meaningfully cleaner without becoming mandatory?
4. Is the caller aura noticeable enough to teach target priority, or should it be
   stronger/clearer?
5. Do periodic boss adds create pressure without turning into uncontrolled swarm
   growth?
6. Does plating feel rewarded against the many small hits?

**Known gaps / deferred:**
- The aura has no bespoke visual yet; the caller is readable mostly through name,
  pack-alpha tint, and behavior.
- Boss periodic adds are simple `spawn-adds`, not a full authored herd pack.
- All numbers are placeholders (Step 15 balance pass).

---

## Swamp T1 - rot basins / attrition-positioning (`node-7-4`, Grave Toadeater)

**Intended exam:** rot, attrition, and positioning. Hazard-aware movement, dot
resistance, sustain, and cleanse should all feel useful.

**What shipped:**
- Pre-encounter = three authored rot basins, each guarded by one `Rot Keeper`
  (`mud-toad`).
- Only living keepers count as uncleared threats. Clearing a keeper disables that
  basin for the boss attempt.
- Uncleared keepers seed temporary boss rot pools at boss start.
- Boss: periodically creates capped temporary rot pools; temporary pools expire,
  slow/poison players, and render with a brighter pulsing outline distinct from
  permanent terrain pools. The 50% `bog-witch` call remains.

**Playtest questions:**
1. Are temporary boss pools visually distinct enough from permanent swamp terrain?
2. Does clearing keepers feel like it reduces boss clutter in an obvious way?
3. Are pool count, radius, and duration modest enough that Avoid Hazards is
   rewarded but not mandatory?
4. Does cleanse/dot resistance feel useful, or is the damage too low to notice?
5. Does the 50% bog-witch call stack too much attrition with active pools?
6. Is the fight still clearable by straightforward T1 builds?

**Known gaps / deferred:**
- Basin art is still represented by keeper placement and existing placeholder
  hazard visuals; no bespoke basin prop yet.
- Temporary pools are runtime dungeon hazards rather than node features, by design,
  so they can expire independently.
- All numbers are placeholders (Step 15 balance pass).

---

## Cave T1 — sparse-elite / careful-pulling (`node-3-6`, Obsidian Broodmother)

**Intended exam:** the *opposite* of Plains. Low density; each enemy matters.
Read the three sentinels orbiting the altar, pull them deliberately (Cave's
high-detection / overpull-risk identity), and grind a durable %DR sponge boss
whose pressure comes from single, predictable adds — never a swarm.

**What shipped:**
- Pre-encounter = the **Deep Watch**: 3 `cave-brute` "Cave Sentinel" guardians
  that **circle the altar** on a bespoke absolute patrol ring (300px, evenly
  separated 120° apart), keeping their 240 high-detection pull range. Solo
  single-mob pack leaders, no follower bodies — live density is 3. The orbit is a
  `patrolOverride` distinct from the brute's open-world patrol.
- Uncleared sentinels use the shared `join` hook (all are leaders). Clear them =
  clean start; leave any = it joins the boss. Normal rewards, no bonus for leaving.
- Boss: durable as before; **infrequent single `cave-lurker`** (24s / cap 1) + a
  **50% single stronger `giant-spider` brood** behind a timed shield. Heavy Strike
  + Second Wind both meant to pay off.

**Playtest questions:**
1. Does the Cave dungeon actually *feel* different from Plains — "each enemy
   matters" vs. "survive the crowd"? Is density-3 too sparse / not threatening
   enough, or just right?
2. Does the **altar orbit** read well — can the player time the gaps and slip to
   the altar between passes, or does the 300px ring + 240 pull cause unintended
   double-pulls? Is 300px the right orbit radius (closer = harder to reach the
   altar untouched; wider = the guards feel detached)? Should the three circle
   *faster/slower*, or in opposite directions for more interesting gaps?
3. Does leaving the sentinels alive (`join`) stack into too much at the boss (3
   elites + boss + the occasional lurker + 50% spider), or is it a fair "you didn't
   clear, now you pay" tax? Is clearing-first meaningfully cleaner without being
   mandatory?
4. Boss adds: is **one** lurker every 24s + **one** 50% spider the right cadence to
   read as "single meaningful adds" now that the lurker is much rarer, or is it now
   *too* sparse? Is `maxAlive 1` on the lurker the right ceiling?
5. Does the durable %DR boss + single adds genuinely reward **Heavy Strike**
   (single-target burst through DR/shield) and **Second Wind** (sustain through a
   long grind), as intended? If a summoner/AoE build trivializes it, the adds may
   need to be more disruptive rather than more numerous.

**Known gaps / deferred:**
- No bespoke guardian/altar art; sentinels read through the orbit behavior + the
  guardian name + (future) elite/guardian outline.
- The 50% "stronger brood add" reuses `giant-spider` (a T2 mob) as a placeholder
  for "stronger than a lurker"; a bespoke brood/spiderling could replace it.
- Orbit radius/segments/speed, pull ranges, guardian buffs, add cadence/caps, and
  shield values are all placeholders (Step 15 balance pass).
