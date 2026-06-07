# T4 Spec Designs — Reference Document

**Purpose:** authoritative design reference for the T4 specialisation layer. Covers all five active classes (Summoner deferred). Use alongside `design-bible.md` and `player-power-curve.md` for the balance pass. All numerical values marked TBD are placeholders — lock mechanics first, then numbers.

---

## Design Constraints (established this session)

- **Deterministic.** All triggers on countable conditions (Nth hit, timer expiry, threshold crossing). No RNG.
- **Budget separation.** Offense and defense are independent pools. No spec makes offense stronger via defensive stats or vice versa.
- **No regression.** Every spec adds positive budget; choices reallocate, never reduce.
- **No damage-taken / defensive-event scaling.** No specs that scale with incoming damage, dodges, blocks, or similar. Fragile, polarising, fight-dependent.
- **No on-kill effects at this tier.** Reserved for a later tier. On-kill triggers skew heavily toward farming, away from boss/elite content.
- **Frame identity.** Light = damage through attacks. Heavy = damage through the mechanic. Balanced = meaningful contribution from both. Specs must respect their frame's lean.
- **Relic awareness (system deferred).** A future relic slot will offer frequency (mechanic rate), potency (mechanic strength), and buff-multiplier (buff efficiency) modifiers. Specs interacting with clip size, cooldown length, or mechanic frequency have implicit relic synergy — design with this in mind but do not depend on it.
- **Naming.** All names below are working names. A class-title naming pass (e.g. "Swiftblade" not "Double Time") happens after balance is locked.

---

## CADENCE (Striker)

**Class identity:** attack-count empowered strike (finisher every N hits). Melee bruiser. Defensive mechanic: big-hit reduction (hits >25% maxHP are halved before plating/DR) + periodic HoT burst (8% maxHP every 6s at root).

---

### Light — Flurry · threshold 4 · 1.5×

*Frame lean: attacks. High APS, on-hit focus, low bulk.*

**Aftershock** — After your finisher, your next 3 regular attacks fire their on-hit damage twice.
- *Identity:* on-hit amplification. The finisher "charges" the subsequent attack phase. Rewards fast attacking and on-hit gear. Does not affect the finisher itself — purely buffs the regular attack follow-through.
- *Weapon:* fast weapon + on-hit gear.

**Cursed Finale** — Your finisher curses the target: +25% damage taken for 5s, and permanently reduces their flat plating by 5. Stacks with no cap — **hard cap TBD at number pass (candidate: 20 flat).** The triggering finisher benefits from the vulnerability.
- *Identity:* party utility / anti-armor setup. Permanent plating strip rewards longer fights and group play. Addresses plating as the primary wall for fast light builds.
- *Weapon:* any; best contribution in groups.
- *Flag:* plating shred cap is mandatory before going live — uncapped shred trivialises plated bosses.

**Double Time** — Your finisher strikes twice. Both hits apply the full 1.5× multiplier. Neither hit counts twice toward the next combo.
- *Identity:* maximum finisher burst output. Two on-hit trigger events per finisher cycle. Cleanest expression of the light identity.
- *Weapon:* any; strongest with on-hit gear (two procs per finisher).

---

### Balanced — Skirmisher · threshold 5 · 2.0×

*Frame lean: 50/50. Both the buildup attack phase and the finisher carry meaningful weight.*

**Metronome** — Each regular attack in the buildup sequence grants a stacking flat attack damage bonus to all subsequent attacks in that same cycle, including the finisher. Stacks reset after each finisher.
- *Identity:* the buildup is the star. Each hit in the combo is stronger than the last, culminating in an amplified finisher payoff. Distinct from Rising Tide (which amplifies the finisher then echoes forward) — Metronome's ramp feeds into the finisher, not out of it. Sits lighter than heavy specs; a genuine mid-weight payoff.
- *Weapon:* any; high base ATK makes the ramp impact larger.

**Rising Tide** — Each attack building toward the finisher amplifies it by 20%. After a finisher, your next 5 attacks deal 50% bonus damage.
- *Identity:* bidirectional resonance. Buildup strengthens the finisher; finisher echoes into subsequent attacks. The most straightforward 50/50 balanced spec.
- *Weapon:* any.

**Delayed Verdict** — Your finisher stores a portion of the attack damage dealt into a character-side buff (not a debuff on the enemy — stored value is not lost on target switch). Re-triggering adds more stored damage and restarts the 3s fuse. If stored value ≥ target's current HP, detonation fires immediately (execute). On kill via execute, overkill is NOT wasted — excess damage is subtracted from the stored value, carrying the remainder forward.
- *Identity:* accumulating delayed burst. Stored value persists across targets, rewarding continuous combat. Execute smooths low-TTK play cleanly. Carry-forward overkill means efficient kills build toward the next detonation rather than resetting to zero.
- *Weapon:* any; stronger in longer sustained combat chains.

---

### Heavy — Breaker · threshold 6 · 4.0×

*Frame lean: mechanic. Fewer, larger finishers. Slower attack pace. Most bulk.*

**Rampage** — Each empowered attack grants a Rampage stack. Each stack: reduces the sequence threshold by 1, increases APS, reduces regular attack damage, and increases the empowered attack multiplier. Caps when threshold reaches 2 (every other attack is an empowered hit). Stacks decay slowly out-of-combat (generous duration — designed so you do not lose ramp between nearby encounters).
- *Identity:* snowball mechanic. The empowered attack (mechanic) is what builds the ramp; regular attacks are progressively suppressed in its favour. At cap, the character alternates between one regular attack and one empowered attack in tight rapid succession — a completely different rhythm from the base heavy frame.
- *Flag:* threshold floor is 2 — must be enforced by the engine to prevent divide-by-zero or sub-1 sequence values.
- *Flag:* APS increase + threshold reduction compound (lower threshold AND faster APS both accelerate the empowered cycle). Monitor for instability at full ramp.
- *Weapon:* any; close range preferred (stay in combat to sustain stacks).

**Hemorrhage** — Your finisher converts all its damage into a bleeding wound (non-stacking DoT) dealing 150% of the finisher damage over 4 seconds. Re-triggering refreshes duration.
- *Identity:* DoT payoff. Benefits slow weapons — DoT ticks throughout the long buildup to the next finisher. Strong against elites/bosses. Turns the 4.0× burst into sustained drain.
- *Weapon:* slow heavy weapon.

**Crescendo** — Every second in active combat, gain a stack of Crescendo. When your empowered attack fires, consume all stacks — each stack adds flat bonus damage to that empowered hit. Stacks decay slowly out-of-combat.
- *Identity:* pseudo-cooldown cross-pollination. The buildup axis is time (like cooldown class); the spend trigger is attack count (like cadence class). Rewards patience: the longer the gap between empowered attacks, the larger the bonus. For heavy cadence (slow APS, threshold 6), the cycle is already long — Crescendo converts that natural patience directly into a bigger payoff.
- *Flag:* flat bonus per stack TBD at number pass. Must be calibrated so a full heavy-frame cycle (roughly 10–15s at slow APS) produces a meaningful but budgeted bonus — not an effectively infinite multiplier.
- *Weapon:* heavy/slow weapon; high ATK magnifies the bonus more.

---

### Cadence Addendum

**Design intent per frame:**
- *Light:* three distinct "what happens around the finisher" identities — Aftershock amplifies the attack phase that follows, Cursed Finale sets up the enemy for all subsequent damage, Double Time doubles the finisher's output directly.
- *Balanced:* three ways of distributing weight across the cycle — Metronome makes the buildup progressive, Rising Tide creates a bidirectional loop, Delayed Verdict defers the payoff for a burst.
- *Heavy:* three relationships with the big finisher — Thunderclap pairs it with a heal, Hemorrhage converts it to DoT, Iron Patience feeds it from the buildup.

**Discarded concepts:**
- *Accelerando* — APS stacks per finisher. Generic; stacks lost on death/re-equip; no identity beyond "go faster."
- *Reprisal* — combo counter advances on big hit. Broken: damage-cap threshold is 25% maxHP; at T3, almost every hit qualifies on a light build.
- *Rapid Tempo* — reduce combo threshold by 2. Shifts balanced toward light with no distinct identity of its own.
- *Overwhelming Force* — extend threshold + increase multiplier. Pure number escalation; zero design identity.
- *Thunderclap* — finisher triggers HoT burst, burst interval extended 50%. Replaced; felt too passive/defensive for heavy and overlapped with energy's sustain design space.
- *Iron Patience* — 30% of buildup attack damage stored as charge, finisher consumes all. Replaced; Crescendo covers the same "patience → payoff" intent through the time axis more interestingly.
- *Vengeance* — finisher bonus from damage taken since last finisher. Moved to Cooldown Heavy where the fixed time window makes the payoff predictable.

---

## COOLDOWN (Squire)

**Class identity:** time-trigger empowered strike (execution every N seconds). Tankiest class. Defensive mechanic: in-combat regen (10% of OOC regen rate applies in combat at root). Slow base attack speed. Weak to DoTs.

---

### Light — Warrior · 5s CD · 1.5×

*Frame lean: attacks. Most aggressive cooldown frame; fastest execution cycle.*

**Overdrive** — Execution triggers a 50% attack speed burst for 2.5 seconds (~half-uptime at 5s CD). Execution deals its normal 1.5× damage.
- *Identity:* execution as speed enabler. Frequent bursts of rapid attacks bookended by execution moments. Fast cycling; the execution empowers an attack window rather than dealing most damage itself.
- *Weapon:* medium weapon.
- *(Name collision: Energy Light also has a working spec named "Overdrive." Both need distinct final class titles. Desired theme for Cooldown Light's version: burst/assassination — candidate names: "Killing Intent," "Assassin," or similar.)*

**Eternal Cycle** — Each attack during the cooldown window stacks flat bonus damage (stacks accumulate, reset on execution). Execution fires at 1.5× plus all stored flat bonus.
- *Identity:* APS drives stack accumulation. Light's high APS builds charge fast for a meaningfully boosted execution. Both attack phase (stacking) and execution (spending) contribute.
- *Formula:* Version A — flat bonus added to execution damage; stacks do NOT replace the 1.5× multiplier.
- *Flag:* code sets CD to 5000ms (correct, matches Warrior frame). Description in code says "10s" — this is a bug; fix the description.
- *Flag:* exact flat bonus per stack TBD at number pass.
- *Weapon:* fast weapon (more stacks per cycle).

**Rupture** — Execution bypasses 100% of enemy plating on that hit. For the following 2 seconds, regular attacks also bypass 50% plating.
- *Identity:* anti-armor execution window. Addresses plating as the primary wall for fast light builds. Brief window rewards high APS during those 2 seconds.
- *Planned addition:* execution window will also pierce a portion of enemy DR (exact value TBD) — ensures the spec is not dead weight against targets with low plating but meaningful DR.
- *Rename flag:* candidate name "Giant Slayer" or similar armor-breaking archetype title.
- *Weapon:* any; most useful against armored enemies.

---

### Balanced — Knight · 7s CD · 2.0×

*Frame lean: 50/50. Both attack phase (7s buildup) and execution contribute.*

**Reverb** — The number of attacks you land between two consecutive executions determines the bonus damage of the next execution. More attacks during the current CD window = bigger next execution hit.
- *Identity:* two-cycle horizon. Each CD window's attack output charges the following execution's bonus. Both phases of every cycle feed the next cycle's payoff — attack phase builds the charge, execution fires and resets the window. Distinct from Battery (time stacks spent within the same cycle) and Patience Paid (both phases of the current cycle scale together).
- *Flag:* engine tracks attack count between executions; bonus applied multiplicatively to the following execution. Bonus value per attack TBD at number pass.
- *Weapon:* fast weapon; high APS during the 7s window maximises the charge built.

**Battery** — Each second the execution cooldown ticks down, you gain 1 stack of attack damage bonus. Execution fires the execution AND spends all stacks.
- *Identity:* steady buildup. Regular attacks during the 7s window deal progressively more damage as stacks accumulate. Execution fires normally and clears the ramp. Both phases active: attacks benefit from stacks, execution resets.
- *Weapon:* any.

**Patience Paid** — The longer your execution cooldown runs uninterrupted, the more attack damage you gain during the buildup AND the more bonus damage the execution deals (both ramp; cap TBD). Maximum payoff at the full natural 7s.
- *Identity:* the "patient" option. Rewards letting the full CD expire naturally. Creates genuine intra-frame tension: Acceleration wants to shorten the CD, Battery is neutral, Patience Paid wants to maximise it.
- *Weapon:* slow/heavy weapon (ATK scaling benefits more from the ramp).

---

### Heavy — Bulwark · 9s CD · 3.0×

*Frame lean: mechanic. Maximum patience; execution is the identity.*

**Vengeance** — Execution deals bonus damage equal to X% of total damage taken since the last execution. The 9s fixed window provides predictable incoming damage.
- *Identity:* absorb punishment, cash it out. The fixed time window (vs cadence's variable hit-count window) makes the payoff consistent and balanceable. Tank-into-punish loop.
- *Flag:* needs a minimum bonus floor — spec feels dead in trivial-damage environments.
- *Flag:* X TBD at number pass; calibrate against T3 single-mob DPS × 9s window.
- *Weapon:* any; close range for more sustained incoming hits.

**Singular Extraction** — Regular attacks deal no damage. Execution cooldown greatly shortened; execution deals significantly more damage. Leaving combat for 4s resets preparation.
- *Identity:* pure execution machine. Zero regular attack DPS. All damage is execution spam. Completely invalidates APS. Radical but coherent expression of "heavy = mechanic only."
- *Flag:* "regular attacks deal no damage" must NOT suppress on-hit gear or charm triggers — those still fire normally.
- *Flag:* shortened CD value and execution multiplier increase TBD; must land within ±20% budget of Vengeance and Channeled Beam.
- *Weapon:* irrelevant; slowest weapon recommended (APS does nothing).

**Channeled Beam** — Execution becomes a 3-second focused channel dealing continuous damage to the current target. If the target dies mid-channel, briefly attempts to reacquire.
- *Identity:* sustained burst instead of instant spike. 9s patience → 3s deal damage → repeat. Distinct from Vengeance (instant bonus) and Singular Extraction (rapid execution spam).
- *Flag:* not currently implemented — needs engine work before this spec can go live.
- *Weapon:* any.

---

### Cooldown Addendum

**Design intent per frame:**
- *Light:* execution enables attack windows. Overdrive grants a speed burst, Eternal Cycle uses attack frequency to charge a bigger execution, Rupture uses execution as an armor-pierce gate.
- *Balanced:* three paces of the same cycle — Acceleration speeds it up, Battery enriches it, Patience Paid slows it down for a larger payoff.
- *Heavy:* three ways to be a pure execution machine — Vengeance rewards tanking hits through the window, Singular Extraction removes all non-execution damage, Channeled Beam extends the execution into a sustained beam.

**Discarded concepts:**
- *Temporal Extension* — on-hit buff extending per attack. Too similar to Aftershock (cadence light); light cooldown identity is attack damage, not on-hit.
- *Acceleration* — attacks reduce CD by 1s, floor at 3s. No distinct mechanic or identity; effectively a stat, not a specialisation. Replaced by Reverb.
- *Alignment* — post-execution APS burst + halved CD on next cycle. Inconsistent cycle lengths confuse auto-combat rhythm; two-phase timing doesn't land cleanly.
- *Resonance* — post-execution empowered attacks. Simpler alternative to Patience Paid; less interesting.
- *Entropy Collapse* — execute-DoT scaling with missing HP. Anti-synergistic: strongest when target is nearly dead and you'd kill them anyway; trespasses on DoT class identity.

---

## DOT (Apprentice)

**Class identity:** conversion attacker — each hit converts X% of attack damage into stacking DoT (refreshes duration on hit, front-loaded stack weight). Defensive mechanic: DoT resistance (18%) + hit-to-dot conversion (10% of incoming direct hits become delayed damage). Mid-range class.

**Three elemental identities by frame:**
- Light = Poison (8 stacks, 30% conversion, high APS)
- Balanced = Fire (6 stacks, 50% conversion, medium pace)
- Heavy = Frost (3 stacks, 70% conversion, slow hard hits)

---

### Light — Venom Vessel · 8 stacks · 30% conversion

*Frame lean: attacks. High APS, many stacks, on-hit focus.*

**Poison Explosion** — Poison can stack up to 10 (overrides frame's 8-stack cap). Reaching 10 stacks instantly detonates all stacks, dealing 10 full ticks' worth of damage as a single burst, then clearing all stacks.
- *Identity:* threshold burst. Fast APS builds to explosion quickly. Clean loop: spam stacks → BOOM → rebuild. Rewards staying on target.
- *Flag:* "10 full ticks" formula needs verification against equal-budget index at number pass.
- *Weapon:* fast weapon.

**Eternal Doom** — No stack limit. First 8 stacks deal full damage per tick. Each additional stack beyond 8 deals 50% effectiveness, naturally plateauing around 30–40 stacks.
- *Identity:* long-fight escalator. Largely irrelevant against trash (dies before stacks build meaningfully). Devastating against elites/bosses over extended fights. Accepted as a designed outlier — performs above curve in sustained content by design.
- *Flag:* needs isolated balance pass. Track plateau DPS vs T3 elite HP; must not exceed budget ceiling.
- *Weapon:* any; best in sustained fights.

**Frenzy** — At max poison stacks (8), your attack speed doubles. Sustained as long as you maintain max stacks; dropping below max ends the burst immediately.
- *Identity:* high-speed feedback loop. Build stacks fast → reach max → APS doubles → attacks maintain stacks more easily → burst sustained. Rewards fast stack application; punishes slow ramp-up and prolonged target switching. Pure light identity.
- *Flag:* feedback loop (more APS → easier max-stack maintenance) needs sanity check at high-APS gear levels. APS doubling must not cause hit-registration instability.
- *Weapon:* fastest possible weapon; the burst compounds hardest on high base APS.

**Fan the Flames** — Each hit applies 2 burn stacks at 50% tick value each (reaches max stacks in 3 hits instead of 6, same total DoT rate). Hitting a max-stacked target deals bonus direct damage equal to 3× the max-stack DoT damage per hit. Overflow hit is treated as an empowered attack under the existing empowered system.
- *Identity:* overflow mechanic. Ramp to max fast, then every hit overflows for bonus direct damage. Both DoT ticking and direct overflow hits are active simultaneously.
- *Flag:* overflow proc fires on every attack at max stacks — high-priority budget calibration required before going live.
- *Weapon:* medium weapon; balanced APS.

**Ignition** — Your first attack on a new or freshly-unburned target instantly applies all burn stacks at 60% tick value each.
- *Identity:* instant front-load on fresh targets. Burn starts immediately on approach (mechanic), regular attacks maintain stacks and clean up (attack). Rewards the balanced player's medium kill rhythm.
- *Weapon:* any.

**Conflagration** — When a target reaches max burn stacks, all stacks are consumed and replaced with Conflagration: the same total damage delivered at double tick rate in half the time (2s instead of 4s). Cannot stack further while Conflagration burns.
- *Identity:* accelerated burn phase. Rewards reliable max-stack application. Distinct from Poison Explosion (instant burst vs fast burn window). Better in longer fights where Conflagration has time to fully complete.
- *Flag:* against fast-dying trash, Conflagration may not finish before death — acceptable niche tradeoff.
- *Weapon:* any; medium APS.

---

### Heavy — Rime-Bound · 3 stacks · 70% conversion

*Frame lean: mechanic. Slow hard hits; each frost stack is precious and massive.*

**Rimeshatter** — At max frost stacks (3), your direct attacks deal damage as if not converted: 100% direct damage, 0% to DoT. Stacks are maintained; DoT continues ticking AND applies a %DR debuff to the target while active. Below max stacks, normal 70% conversion applies.
- *Identity:* two-phase power shift with layered debuff. Buildup phase (30% direct while applying stacks) → full-power phase: 100% direct hits + DoT ticking + DR debuff. The DR debuff completes the synergy — the DoT that normally reduces the target's defences also makes the full-power direct hits land harder.
- *Flag:* full-power phase hits as direct damage through plating (DoT bypasses plating). Verify against high-plating enemies — may need partial plating bypass retained.
- *Flag:* DR debuff value TBD at number pass. Overlaps conceptually with Rupture (Cooldown Light) but different delivery (persistent DoT-applied debuff vs execution-window pierce) — acceptable.
- *Weapon:* slow heavy weapon (maximise the 100% direct hits at full stacks).

**Freezing Cold** — Each frost stack also applies a Chill stack (up to 3). Each Chill reduces enemy movement and attack speed by 12%. At 3 Chill stacks (= max frost stacks), the target is Frozen for 2 seconds and takes 35% bonus damage from all sources.
- *Identity:* CC/debuff specialist. Reaching max frost = automatic Freeze. Defensive (reduces incoming attack rate) and offensive (35% bonus damage window). Party utility.
- *Flag:* "Frozen" must be implemented as severe slow (~80% movement and APS reduction), NOT CC-immunity — full CC causes AI/animation issues. Add internal cooldown on Freeze trigger (candidate: 8s between Freeze procs).
- *Weapon:* any; debuff focus.

**Shatter Strike** — Each frost stack grants a bonus to direct attack damage. At max stacks (3), the bonus is maximised but you can NO LONGER refresh stack duration — stacks tick down naturally. When all stacks expire, the cycle resets and you begin reapplying. Short cycle due to frost's 3-stack cap.
- *Identity:* locked-peak burst cycle. Ramp phase (3 hits to build stacks, bonus building) → peak phase (max bonus active, stacks ticking down, can't extend them) → reset → ramp again. The race during the peak window: land as many heavy hits as possible before the stacks expire.
- *Comparison with Rimeshatter:* Rimeshatter is a steady two-phase state (buildup → locked full-power, repeating consistently). Shatter Strike is a shorter sharper cycle — the locked peak window is brief before it resets.
- *Flag:* bonus value per stack TBD at number pass; calibrate against Freezing Cold's Freeze-window DPS.
- *Weapon:* slow heavy weapon (maximise hits during the locked peak window).

---

### DoT Addendum

**Design intent per frame:**
- *Light/Poison:* three ways to exploit fast stack application — Poison Explosion detonates a threshold burst, Eternal Doom scales indefinitely, Invigorating Toxins converts stack count into on-hit power.
- *Balanced/Fire:* three ways to control the burn cycle — Fan the Flames overflows at max stacks, Ignition front-loads on fresh targets, Conflagration accelerates the max-stack burn window.
- *Heavy/Frost:* three relationships with the precious 3 stacks — Rimeshatter uses max stacks to unlock full direct hits, Freezing Cold converts stacks to CC and damage amplification, Shatter Strike uses active stacks to power each direct hit.

**Discarded concepts:**
- *Smoldering Ember* — burn stacks add 3% vulnerability each (up to 18%). Generic damage amplifier; no balanced identity; makes everything stronger equally with no spec character.
- *Permafrost* — reduce to 1 stack, +1% ATK per hit ramp, cap at 35 hits. Guts the front-load advantage; 35 slow hits to max = 100+ seconds. Too slow and too conditional.
- *Glacial Fracture* — max stacks shatter for a burst on hit, then reset. Same build-and-burst shape as Poison Explosion and Conflagration — redundant across all three elements. Knockback also problematic for melee-range heavy frost builds.
- *Virulence* — stacks spread to nearest enemy on kill. On-kill effect; deferred to the AoE layer at a later tier.
- *Invigorating Toxins* — on-hit bonus per active poison stack, earned on-hit and persisting briefly on target switch. Valid but generic; replaced by Frenzy for a stronger, more distinctive light identity.

---

## RELOAD (Slinger)

**Class identity:** burst-then-reload rhythm (double APS, half attack damage as base modifier, 50% plating bypass). Deterministic evasion (dodge 1-in-4 attacks, 70% mitigation). Ranged.

**Archetype assignment by clip size:**
- Small clip (light, 5 rounds) → precision, per-shot importance → Sniper archetype
- Medium clip (balanced, 10 rounds) → burst-all-at-once feasible → Blunderbuss archetype
- Large clip (heavy, 14 rounds) → sustained ramp → Chain Gun archetype

**Relic note (deferred):** frequency relic = reduced reload time; potency relic = increased clip size. Specs interacting with clip size or reload timing have natural relic synergy.

---

### Light — Scout · 5 rounds · 1.2s reload

*Frame lean: attacks. Small clip, fast reload, high evasion.*

**Last Bullet** — The last bullet of every clip deals 3.5× damage.
- *Identity:* end-of-clip spike. Every 5 shots delivers a payoff hit. Simple, clean, reliable.
- *Weapon:* fast weapon (cycle to last bullet quickly).

**Alternating Cadence** — Even shots deal 2× attack damage, no on-hit damage. Odd shots deal 2× on-hit damage, no attack damage. At 5 rounds: 3 odd (on-hit) + 2 even (attack) per clip.
- *Identity:* the only spec in the game that forces investment in both attack damage AND on-hit simultaneously. Pure attack investment wastes odd shots; pure on-hit investment wastes even shots. Rewards genuinely balanced gear split.
- *Flag:* "no on-hit damage" on even shots only. On-hit TRIGGERS (DoT application, charm procs, gear effects) still fire on all shots — not suppressed.
- *Weapon:* medium weapon; both attack and on-hit gear required.

**Sniper** — 3 heavy shells instead of 5. Fixed slow cadence ignoring APS. APS stats scale per-shot damage instead of attack speed. Bonus damage vs full-HP targets.
- *Identity:* precision alpha strike. Light's doubled APS base becomes a massive per-shot damage multiplier via the Sniper formula. Fast 1.2s reload; very few shots but each enormous. Best against fresh targets.
- *Weapon:* slow/heavy weapon (high base ATK amplified by the APS conversion).

---

### Balanced — Marksman · 10 rounds · 2s reload

*Frame lean: 50/50. Both clip phase and reload event carry weight.*

**Death Mark** — Each shot stacks a mark on the target (up to 10). Reloading detonates all marks for attack × stacks × 0.65 bonus damage. Execute: if stored mark damage ≥ target's current HP, detonate fires immediately.
- *Identity:* the canonical balanced reload spec. Clip builds stacks (attack phase), reload detonates (mechanic phase). Execute trigger smooths low-TTK play.
- *Weapon:* any; high base ATK for maximum detonation value.

**Blunderbuss** — Fires all 10 rounds simultaneously as a point-blank volley, then reloads. Close range mandatory (attack range penalty preserved). Each shot deals normal damage.
- *Identity:* instant burst, full recovery. Clip consumed in one moment (attack), 2s reload is the deliberate downtime (mechanic). Clean 50/50 by construction.
- *Flag:* close-range only — far-range Marksman builds cannot use this meaningfully. Acceptable niche.
- *Weapon:* any; close-range commitment required.

**Momentum** — Each reload grants +X% APS (up to N stacks). Stacks persist through combat; decay slowly out-of-combat (not instant wipe).
- *Identity:* sustained grinding power. At balanced (10 rounds, ~9s cycle), stacking to cap takes ~40–50s — a genuine warm-up. Rewards continuous uninterrupted farming. Reload is the mechanic event that builds the buff.
- *Flag:* exact APS per stack and max stacks TBD at number pass.
- *Weapon:* any; synergises with all reload builds during extended sessions.

---

### Heavy — Artillerist · 14 rounds · 3s reload

*Frame lean: mechanic. Large clip and long reload are the defining identity.*

**Laser** — Replaces clip/reload entirely with a continuous heat-based firing system. Fires every server tick while a target is in range, building heat 0→100%. At 100%, overheats and cannot fire until fully cooled.
- *Identity:* the "abandon the reload mechanic entirely" option. Consistent sustained DPS, no reload window to manage. Radical departure; exists as an extreme choice.
- *Flag:* fully custom firing system — highest implementation cost of any spec in this document. Evaluate before committing. If cost is prohibitive, design a replacement. DPS must land within ±20% budget of Chain Gun and Siege.
- *Weapon:* irrelevant.

**Chain Gun** — APS ramps up per shot fired through the clip, resetting on reload. Shot 1 fires at base APS; shot 14 fires at peak ramp. Only the 14-round clip delivers the full ramp expression.
- *Identity:* the clip IS the ramp. Light (5) and balanced (10) clips cannot reach the same peak speed. Rewards firing every round before reloading.
- *Flag:* hard APS ceiling at server tick rate — verify hit registration stability at peak ramp.
- *Weapon:* fast weapon (maximise shots fired during early clip while still reaching shot 14).

**Siege** — On reload completion, fires a burst of bonus damage proportional to how many shots were used in the previous clip. Full 14-round clip = maximum burst.
- *Identity:* reload is the offensive event. Distinct from Chain Gun (clip ramps speed) and Laser (ignores clip/reload). Distinct from Death Mark (balanced): Siege charges the gun and fires regardless of enemy state; Death Mark stacks on the enemy and is lost if the enemy dies mid-clip.
- *Flag:* burst value TBD; calibrate so full-clip burst is within ±20% budget of Chain Gun sustained DPS over the same window.
- *Weapon:* any; rewards emptying the full clip before reloading.

---

### Reload Addendum

**Design intent per frame:**
- *Light:* three distinct "hot moment" positions within or around the small clip — Exploding Clip rewards the last shot, Alternating Cadence rewards both damage types on every shot, Sniper rewards the first (and only) shots of a shrunken precision clip.
- *Balanced:* three ways the clip and reload interact — Death Mark accumulates in the clip and explodes on reload, Blunderbuss spends the clip instantly and uses the reload as pure recovery, Momentum counts reloads as buff events.
- *Heavy:* three relationships with the 14-round clip and 3s reload — Chain Gun ramps through the clip, Siege converts the reload into an offensive burst, Laser abandons the system entirely.

**Discarded concepts:**
- *Hair Trigger (original)* — APS ramp per shot within clip. Too similar in shape to Chain Gun; ramp-per-shot is heavy territory, not light.
- *Quick Draw* — first shot after reload deals 2×. Too similar to Exploding Clip (last shot 3.5×); two "hot single-shot" specs in the same frame.
- *Gatling* — doubles APS and clip. Turns Scout into Marksman-lite with no distinct identity.
- *Tactical Pause* — first 3 shots after reload deal 2×. Functional but user found it uninspired.
- *Suppressing Fire* — flat plating shred per hit (up to 5 stacks). No distinct identity; does not interact with the reload mechanic at all.
- *Cover Fire* — 45% DR during reload. Defensive-only spec; boring regardless of frame.
- *Counter-Fire* — dodges charge weapon for bonus shot damage. Scales with defensive events — violates design constraint.
- *Concentrated Fire* — consecutive shots on same target stack flat damage bonus. Same ramp shape as Chain Gun and Hair Trigger; redundant.
- *Iron Wall* — 60% DR during 3s reload. Defensive-only; boring.
- *Sniper in Heavy / Blunderbuss in Heavy* — wrong clip size for their archetypes. Redistributed to correct frames.

---

## ENERGY (Spirit)

**Class identity:** energy-buildup discharge (gain energy on hit, discharge at max for an empowered hit). Glass cannon, highest range, lowest HP. Defensive mechanic: max-HP shield (30% maxHP buffer, ~100% uptime at root via 10s interval / 10s duration).

---

### Light — Spark · 20 energy/hit · 1.5× · ~5 hits to discharge

*Frame lean: attacks. Fast discharge cycle; discharge supports the attack identity.*

**Flash** — Melee energy. Blue Shift (low energy pool) = harder direct hits. Red Shift (high energy pool) = faster attacks, faster movement, more evasion. Energy builds in sustained combat and decays on disengage.
- *Identity:* the only melee energy build. `flashActive` flag forces melee mode. Blue/red shift creates a tension between charging toward discharge and sustaining the fast-attack Red Shift phase.
- *Flag:* friend-designed spec; must be kept. Numbers need tuning.
- *Flag:* verify interaction with Far-range node builds (`flashActive` overrides ranged combat behaviour).
- *Weapon:* melee weapon.

**Overdrive** — Discharge triggers an Overdrive state (no direct damage on trigger — pure mode switch). During Overdrive: significant % ATK bonus (not APS — intentionally favours weapons with higher base ATK). Energy decays from 100 to 0; state ends when empty. Then rebuild and repeat.
- *Identity:* discharge as a mode-change gate. Frequent moderate Overdrive windows on light's fast cycle. ATK% bonus skews away from fast weapons — two distinct weapon affinities within light.
- *Weapon:* medium/heavy weapon (ATK% scales on larger base ATK values).
- *(Name collision: Cooldown Light also has a working spec named "Overdrive." Both need distinct final class titles.)*

**Energy Upkeep** — Discharge suppressed. Energy decays continuously; maintaining energy above a threshold accumulates an upkeep timer. On-hit damage scales with how long the upkeep timer has been running — the longer sustained maintenance, the stronger each on-hit proc. No APS bonus.
- *Identity:* on-hit scaling with commitment. Fast weapon + external APS maximise procs and offset decay. Ramps across longer fights; weak against trash. The fast-weapon specialist within light.
- *Flag:* decay rate must be tuned so fast-weapon APS doesn't trivially offset all decay — tension between gain and decay must be real.
- *Weapon:* fastest weapon + external APS sources.

---

### Balanced — Wraith · 14 energy/hit · 2.0× · ~7 hits to discharge

*Frame lean: 50/50. Both the attack buildup phase and discharge events contribute.*

**Binary Cycle** — Each discharge cycles you between two states. **Charge State:** increased energy gain, lower APS, increased ATK damage; buffs ramp progressively up during the cycle; discharge at the end hits hard. **Discharge State:** on-hit damage bonus, increased APS, lower ATK damage; buffs ramp progressively up; discharge at the end hits lighter. Creates an alternating big/small discharge pattern with distinct attack textures in each phase.
- *Identity:* two permanently-alternating modes. Never in a neutral state — always in one phase working toward the next. Both attack character (which stats dominate) and discharge strength vary by cycle.
- *Flag:* progressive in-cycle buff ramp requires a per-cycle timer in implementation.
- *Weapon:* flexible; hybrid gear suits both phases.

**Awakened Lightning** — Discharge deals no instant damage. Instead empowers the next N regular attacks: each counts as an empowered hit (1.5× multiplier). Total Awakened damage ≈ original 2.0× discharge damage distributed across N hits.
- *Identity:* discharge spreads as a sustained empowered attack sequence. The discharge is a trigger, not a damage spike. Both attack phase (builds energy) and post-discharge window (empowered attacks) are rewarding.
- *Flag:* N × 1.5× must approximately equal a normal 2.0× discharge DPS contribution over the same window. Calibrate N at number pass.
- *Flag:* verify that the "empowered attack" flag does not interact unexpectedly with other triggered effects.
- *Weapon:* any; on-hit gear benefits (on-hit fires on each empowered attack).

**Charge State** — Your attack damage scales linearly with current energy percentage (0% = weakest, 100% = strongest). Natural oscillating damage wave — strongest attacks land right before discharge, weakest immediately after.
- *Identity:* smooth continuous energy management. No discrete events or triggers; energy level is the power level at all times. Contrasts with Binary Cycle (event-driven state switching) and Awakened Lightning (discharge-triggered empowered sequence).
- *Weapon:* any; high base ATK makes the percentage scaling matter more.

---

### Heavy — Phantasm · 10 energy/hit · 6.0× · 10 hits to discharge

*Frame lean: mechanic. The discharge is the identity — the highest single-hit multiplier in the game.*

**Singularity Execute** — Doubles max energy capacity (200). Energy generation accelerates the fuller the pool. Discharge damage scales linearly with stored energy: 50 energy = 50% damage, 100 energy = 100% (normal discharge), 200 energy = 200% (double normal discharge). If stored energy's projected discharge damage ≥ target's current HP, the discharge fires immediately.
- *Identity:* smart burst with scalable ceiling. At 200 energy, the discharge deals double the already-massive 6.0× hit. The execute fires at whatever energy is stored — early executes are proportionally weaker (correctly balanced by design). Against bosses, building to the full 200 gives a defining hit; against near-dead targets the execute fires efficiently at lower energy.
- *Formula:* discharge_damage = (current_energy / 100) × base_6x_discharge. At 200 energy: 2.0 × base discharge. Linear, no cliffs.
- *Flag:* the doubling of max capacity (200) means 20 hits at 10 energy/hit to fill — a very long buildup at heavy's slow APS. The energy-acceleration mechanic near full partially compensates.
- *Weapon:* slow weapon; high ATK for maximum discharge value.

**Critical Mass** — Each consecutive discharge (no prolonged combat gap between them) adds a stack: +discharge damage multiplier AND +energy gain rate (up to 3 stacks). Resets on 5s+ without dealing damage.
- *Identity:* continuous grinding payoff. At max stacks: harder discharges AND faster buildup. The energy gain bonus makes it viable in low-density content. Rewards uninterrupted farming sessions.
- *Flag:* both bonuses must be balanced against Singularity Execute. "5s without dealing damage" is the candidate stack-reset condition.
- *Weapon:* slow weapon.

**Endless Storm** — Discharge creates a near-permanent storm attached to the current target, dealing continuous single-target DoT. Storm persists until target dies, then transfers to the next engaged target. Subsequent discharges refresh the storm.
- *Identity:* persistent offense. Never not dealing damage. The discharge sets the storm in motion; the attack phase sustains energy for subsequent refreshes. High discharge multiplier (6×) makes each storm application significant.
- *Flag:* single-target only — NOT AoE. "Nearby enemies" version is T5 territory.
- *Flag:* storm transfer behaviour on kill needs explicit implementation definition (instant, or brief delay?).
- *Weapon:* any; faster attack builds refresh the storm more frequently.

---

### Energy Addendum

**Design intent per frame:**
- *Light:* three distinct weapon affinities in one frame — Flash for melee, Overdrive for medium/heavy weapon (ATK% bonus), Energy Upkeep for fastest weapon (on-hit frequency). Unified by the fast discharge cycle; discharge supports rather than dominates.
- *Balanced:* three relationships between the energy bar and combat output — Binary Cycle makes every discharge a state-transition, Awakened Lightning distributes the discharge across a sequence of attacks, Charge State makes energy level a continuous damage scalar.
- *Heavy:* three ways to use the 6.0× discharge — Singularity Execute makes it smarter and bigger, Critical Mass makes it escalate across consecutive procs, Endless Storm converts it into permanent DoT.

**Discarded concepts:**
- *Micro-Venting* — discharge disabled; above 50% energy, attacks consume energy for on-hit bonus. Nearly identical shape to Polarity Decay; both cut.
- *Polarity Decay* — reduced discharge gives 5 overcharge stacks for bonus attack damage. Same sustained-bonus concept as Micro-Venting.
- *Chain Discharge* — killing enemy within 2s of discharge restores 50% energy. On-kill effect; violates design constraint.
- *Harmonic Equilibrium* — +60% damage while energy is between 40–60%. Unmaintainable in auto-combat; no decisions available to the player.
- *Capacitor Shunt* — 50/50 energy split to a reservoir that amplifies discharge. Passive multiplier; no decision points.
- *Alternating Currents (for balanced)* — auto-loops between charge and discharge phases. Awkward fit for balanced's "both phases simultaneously" identity; cut. (Considered for heavy but ultimately cut in favour of Endless Storm.)
- *Discharge Burn* — discharge deals damage over 4s instead of instant. Similar shape to Endless Storm; redundant.
- *Arc Burst, Overcharge, Pulse Cascade, Feedback Loop* — brainstormed for balanced slot C, all rejected in favour of Charge State.

---

## SUMMONER (Conduit)

Deferred. Design and balance as a standalone pass after all other classes are locked. The summoner's frame system does not differentiate offense in the standard way, requiring a bespoke design approach.

---

## Cross-Class Implementation Notes

Items that need engine or implementation work before any spec in this document can be balanced:

| Item | Spec | Priority |
|---|---|---|
| Plating shred cap | Cursed Finale (Cadence Light) | Before balance pass |
| Iron Patience charge ceiling | Iron Patience (Cadence Heavy) | Before balance pass |
| Channeled Beam implementation | Channeled Beam (Cooldown Heavy) | Before spec goes live |
| Singular Extraction on-hit pass-through | Singular Extraction (Cooldown Heavy) | Before spec goes live |
| Eternal Cycle description fix | Eternal Cycle (Cooldown Light) | Minor; fix before ship |
| Rimeshatter plating bypass at full stacks | Rimeshatter (Frost Heavy) | Before balance pass |
| Freezing Cold Frozen definition + internal CD | Freezing Cold (Frost Heavy) | Before balance pass |
| Fan the Flames overflow rate | Fan the Flames (Fire Balanced) | Before balance pass |
| Eternal Doom plateau DPS | Eternal Doom (Poison Light) | Isolated balance pass |
| Alternating Cadence on-hit scope | Alternating Cadence (Reload Light) | Before ship — define "no on-hit damage" explicitly |
| Laser implementation cost | Laser (Reload Heavy) | Evaluate before committing; fallback design needed if cut |
| Chain Gun APS ceiling | Chain Gun (Reload Heavy) | Before balance pass |
| Singularity Execute energy scaling | Singularity Execute (Energy Heavy) | Before balance pass — must not be flat 6× |
| Endless Storm transfer behaviour | Endless Storm (Energy Heavy) | Before ship |
| Flash range node interaction | Flash (Energy Light) | Before ship |
| Overdrive naming collision | Overdrive (Cooldown Light + Energy Light) | Naming pass |

---

## Pending Numerical Values (balance pass)

All of the following are TBD and should not block design lock:

- Cursed Finale plating shred cap
- Iron Patience stored charge ceiling value
- Eternal Cycle flat bonus per stack
- Vengeance damage-taken multiplier (X%)
- Battery stack bonus per second
- Patience Paid ramp rate and cap
- Singular Extraction CD reduction and multiplier increase
- Shatter Strike attack bonus percentage (X%)
- Fan the Flames overflow cap
- Momentum APS per stack and max stacks
- Siege burst damage multiplier
- Awakened Lightning empowered hit count (N)
- Overdrive (Energy) ATK% bonus value
- Energy Upkeep on-hit ramp rate
- Binary Cycle buff magnitudes and ramp rates
- Critical Mass damage and energy gain bonuses per stack
- All instances of X, Y, N throughout

