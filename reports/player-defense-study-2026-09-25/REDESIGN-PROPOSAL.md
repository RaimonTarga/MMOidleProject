# Defense redesign proposal — preservation, specialization and transferable answers

25 September 2026. Proposal only; no gameplay changes, new combat experiments, merge or deployment.

This extends [the initial study](STUDY.md). The supporting [current inventory](CURRENT-INVENTORY.md) and [machine-readable inventory](deep-inventory.json) were generated from local source, including all 30 armor definitions, all 12 cores, maximum authored upgrades, 18 root/frame combinations, all 54 authored specializations, and relevant supporting items. The 47-node defensive-key search is a discovery aid, not a claim that offensive/control effects cannot provide defense. Tree tiers 4–7 contain generated placeholders; they are not designed future defensive progression. Local HEAD remains `ff98ba4513cb9fcb1e5752acfd56495268aff416` with unrelated work in progress.

**Core constraint from the designer:** preserve recognizable base designs. An armor should naturally answer part of its home biome's threat profile, and also answer a useful problem elsewhere. Home armor is a good option, not a mandatory key or blanket immunity to its environment.

## 1. Where I would start

Start with three linked decisions, in this order:

1. Define which damage each defense affects and the order in which it acts. Otherwise two items with apparently comparable budgets buy different undocumented coverage.
2. Approve an armor identity map, retaining Plains/Volcano plating, Forest/Jungle evasion, Mountain Guards, Cave/Trench general protection, Swamp/Graveyard ailments/debt, and Tundra positional protection. Desert is the main conceptual replacement.
3. Allocate the full defensive budget across item stats, class affinities, innate mechanics, cores, stances and Guards. Price final builds, including their lost offense and mobility.

The first implementation candidate should be a coherent, isolated prototype of these decisions, measured in stages. Do not begin by halving every plating value in production. Do not begin by changing enemies until the present defensive ordering is understood. Existing acquired gear, progression routes and first-entry survival must remain part of the candidate's acceptance criteria.

## 2. Corrections to the broad first-pass picture

### Volcano already is the Plains successor

`volcanic-vest-t3.evolvesFrom` is `plains-vest-t2`. The first study correctly saw that Plains-named definitions end at T2, but its suggestion to create a late plating progression missed the existing cross-biome evolution. **Preserve and clarify Plains → Volcano; do not create a redundant new armor family.** Volcano armor is hardening, not healing sustain. The Volcanic recovery charm supplies the strong Recovery access seen in historical sustain experiments; those two slots must not be conflated.

### Jungle's identity arrives late and its investment curve is uneven

T2 Forest has 24% raw evasion at +0 and 30% at +5. T2 Jungle has 15% and 35%; neither has evade-strength bonuses. Jungle also jumps from 44 to 104 item HP and from 6 to 16 plating across upgrades, whereas Forest reaches 75 HP and 7 plating. At T4 Jungle finally adds +20 percentage points of evade strength, alongside 54 plating and 320 item HP at +5.

So this is not simply “Forest, slightly better.” It starts with worse frequency, becomes an exceptionally large bulk upgrade, and gains the intended second evasion axis only at the end. **Move evade strength into Jungle's debut and smooth its upgrade curve.** Forest and Jungle overlap at T2, so the comparison must include +0 vs +0 and affordable intermediate states, not only maxed items.

### Tundra is a package problem

The authored stationary DR is 15% at T3 and 20% at T4; it does not grow with upgrades. T4 Trench has 32% unconditional DR at +5 and another 5% after ten seconds. Tundra is not the highest authored standalone DR source. Its package nevertheless includes 390 item HP, 63 plating, a soft cap, and a stationary ramp that charges out of combat and decays as slowly as it builds.

A static shared-formula calculation with Squire → Bulwark → Vanguard and T4 Tundra +5 gives **794 HP, 109 plating and 7% stat DR**, before stationary DR. Adding Juggernaut Core and Tanking Stance gives **1,032 HP, 214 plating and a separate ×0.645 damage-taken multiplier**, still before the 20-point stationary bonus, cap, Guards or a charm. This is a constructed stat illustration, not an acquired build or combat result. Authored T4 Tundra ordinary attacks include 190, 220 and 230: plating alone is already consuming almost all of several swings.

The current five-second T4 ramp also retains 16 percentage points of its 20% DR after a one-second move. This is why a supposedly positional choice can travel with most of its protection intact.

### Class-adjacent ordering needs explicit repair

`initDefenseSystems()` registers shields, debt and absorb before `initAbilitySystems()` registers Brace/Endure mitigation. Thus current Guard DR acts after those layers: it does not preserve shields, and debt has already been created from a larger amount. Absorb can be credited before Guard mitigation and Conduit redirection reduce actual owner damage. This is another reason a stat-only spreadsheet will misprice defense.

Conduit descriptions also refer to a defensive-share field. That field exists in tuning/profile data, but the inspected server paths do not consume `conduitDefenseShare` to divide plating or DR; summons spawn with zero plating/DR and receive HP derived from owner max HP. Redirection is real and has its own path. **Do not assume the tooltip's broad defense split is operational, and do not implement a new split as an incidental part of this rework.** Confirm or correct the description separately from any new mechanical decision.

## 3. Proposed common defensive rules

### A legible incoming-damage contract

For enemy direct hits, use this declared order:

1. Establish the attack's gross magnitude, including charged/empowered attacker multipliers.
2. Subtract plating once. Retain a small nonzero direct-hit floor unless a subsequent explicit avoidance/absorption layer removes the damage.
3. Apply defender vulnerability and percentage damage-reduction groups, including eligible active Guards.
4. Apply deterministic evasion damage mitigation when the attack is evadable. The evade decision must already be available to suppress on-hit ailments.
5. Spend temporary wards, then permanent barrier.
6. Redirect the eligible Conduit share of the remainder once, if a living recipient exists.
7. Convert an eligible fraction of the owner's remainder to damage debt.
8. Subtract immediate HP damage; credit recuperation from actual eligible owner HP damage, not damage absorbed, redirected or deferred. Resolve death without automatic armor cheat-death.

This is the proposed order, not a description of every current path. Changing it will alter Guard/shield/debt/Conduit synergy as well as plating. Keep the changes measurable as separate stages before evaluating the combined candidate.

| Incoming source | Plating | General DR | Evasion | Ward/barrier | Debt | Brace/Endure |
|---|---|---|---|---|---|---|
| Ordinary direct attack | Yes | Yes | If evadable | Yes | Yes | Yes |
| Direct area hit / secondary splash | Yes | Yes | Explicit authored eligibility | Yes | Yes | Yes |
| Monster DoT | No | Yes | Prevent application only through eligible attack evade | Yes unless explicit bypass | No new debt | No, keep these Guards direct-hit tools |
| Environmental damage | No | Yes | No | Yes by default; named exceptions allowed | No | No |
| Debt payment | No second pass | Already priced at initial hit | No | No second absorption | No recursion | No second pass |
| Summon reconstruction / deliberate self-cost | No | No | No | No | No | No |

General DR would apply at full strength to monster DoT instead of the current half-strength rule. That makes it a genuinely broad, moderate fallback. Dedicated DoT resistance must still outperform it against ailments at comparable cost. This is a proposal that needs specific DoT validation, not an assumed harmless normalization. Environmental Heat/Chill effects retain their actual mechanics; armor reducing damage must not implicitly reduce a ramp's movement or vulnerability effects.

A telegraphed slam can be explicitly non-evadable without becoming shield-piercing. “Area” alone should not silently remove every specialist layer. Avoid multiple inconsistent minimum-damage roundings; carry fractional intermediate values and round at the actual damage/payment boundary.

### Percentage reductions should not race toward an additive 90%

Keep root/frame/range affinities additive within the class tree. For ordinary DR, compose **class**, **armor**, **core**, **stance**, and **Guard** groups multiplicatively: `taken = (1−classDR) × (1−armorDR) × ...`. Conditional armor DR replaces or joins its explicitly authored armor profile; it must not secretly add into another group's total. For example, 20% armor, 10% class and 10% stance means 35.2% reduction, not 40%.

Retain the existing combined Guard safety cap initially, but do not use that ceiling as a target budget. Most non-plating armor should have zero plating, rather than a reduced copy of the same defensive shell. Leave base player plating at 2 in the first candidate, then measure tutorial/early-game breakpoints before deciding whether even that should change.

### Remove routine soft-cap and cheat-death grants

Preferred candidate: retire the player passive soft cap from Striker and armor; retire Desert cheat death and Grave Ward's automatic debt forgiveness. Redistribute their budget into explicit protection before death. Preserve encounter rules or unrelated monster mechanics with similar names.

This deliberately keeps most armor identities while removing two mechanics that obscure what a hit actually costs. Retain a corrected specialist-cap alternative as a separately measured fallback if the preferred candidate cannot preserve a satisfying anti-burst role without adding more complexity. Never compare compensated retention with uncompensated deletion.

## 4. Armor roster: home answer, second use, real weakness

These are design hypotheses grounded in authored monsters, not demonstrated matchup wins. The same-biome armor need only address a substantial component of the threat. None must nullify an entire biome.

| Family | Preserve / proposed identity | Natural home use | Useful elsewhere | Deliberate weakness |
|---|---|---|---|---|
| Clearing | Simple starter HP and small plating | Learn survivability | First Plains pulls | Quickly outgrown; no upgrades |
| Plains → Volcano | Flat mitigation, later tempered by combat pressure | Plains pack chip; Volcano hound/scuttler pressure | Forest/Jungle packs and eligible multi-hit attacks | Large gross hits, poison/burn already applied, lava |
| Forest → Jungle | Deterministic evasion; Jungle develops evade strength | Forest repeated bites; Jungle attacks carrying venom | Swamp application prevention; Desert eligible controller attacks | Opening hit timing, non-evadable attacks, existing DoTs |
| Cave → Trench | Broad, dependable DR | Mixed elite pressure | Unfamiliar nodes, mixed boss damage, movement-heavy fights | Specialists beat it on their narrow axis |
| Mountain | Stronger timed Guards and a dependable HP floor | Telegraphs and impact windows | Tundra heavy hits; Desert control-plus-shot windows | Cooldown gaps, DoT attrition, RP opportunity cost |
| Swamp → Graveyard | Ailment resistance with a debt branch | Poison/plague and healing suppression | Jungle venom, Volcano burns; debt branch against other bursts | Clean heavy hits for ailment branch; antiheal/attrition for debt branch |
| Desert | Strong protection during a new engagement's opening | Survive the initial controller/dealer pull while closing or prioritizing | Jungle ambushes, Volcano pack arrival | Long fights and continuous reinforcements |
| Tundra | Hold a safe position to build a defensive stance | Stand through slower enemies' ordinary pressure, then respect the tell | Stationary channels or ranged holds elsewhere | Repeated repositioning; unsafe ground; charge-up exposure |

Two important limitations: early Forest's threat is mostly repeated direct hits, which also suits Plains plating. Do not force evasion to be uniquely best there through arbitrary resistances. It should be competitive, while its status-prevention advantage becomes clearer in Jungle. Conversely Tundra must still reward leaving a dangerous planted slam: it should protect between tells, not encourage ignoring them.

### Plains and Volcano: retain the lineage, repair hardening

**Keep:** flat plating against small hits; Volcano's “harden during pressure, crack under large impact” concept. It has a good home and several transferable uses.

**Change:** slash the universal raw plating supply and separate initial plating from a modest earned hardening increment. Current T4 Pyroclasm has 88 item plating at +5 plus 32 hardening; even without class scaling it can overwhelm modest direct hits. Current hardening only asks for an attack target, and resets on final damage reaching 25% max HP after shields/debt. The stronger the complete defense becomes, the harder it is to ever break the hardening. Its T4 DR bonus also lingers after hardening breaks.

Proposed contract: build to the authored hardening bonus over six seconds while actively engaged and exposed to an eligible enemy direct attack in the last three seconds. An evaded attack still establishes pressure. Idle targeting cannot charge it. No movement penalty: moving through a pack is part of its contrast with Tundra. A large **gross** hit (initial seed: at least 25% current max HP before personal mitigation) removes half the accumulated hardening for subsequent hits; evaluate this once per authored hit, even if shielded. Leaving active engagement drains the bonus over two seconds. Remove the DR-at-max rider and its linger from the main line.

That gross threshold is still HP-sensitive, so test extreme HP classes explicitly. It is a first contract to measure, not a promise that 25% is correct. An absolute tier-reference threshold is a fallback if HP stacking makes cracking meaningless.

**Pyroclasm Mantle:** main hardening specialist; its whole payoff is reliable small-hit protection after earning the ramp.

**Lava-Tempered Hide:** preserve overheal-to-ward as the hybrid branch, but trade away at least half the main line's hardening and some base plating. Limit the branch's ward contribution to a shared 10–15% max-HP capacity, with six-second expiry. Count only its own contribution toward that cap, but combine duplicate overheal converters under one rule. No infinite stockpiling or healing-from-self-cost loops. This intentionally remains a build-around with a Recovery requirement; show that requirement.

Neither branch grants immunity to lava or removes the need for Heat management. That is a legitimate home weakness, not a failed thematic fit.

### Forest and Jungle: make two evasion stats earn their place

Use the player-facing names **Evade frequency** and **Evade strength**. An evade that reduces damage by 70% should not be described as fully dodging. Preserve the deterministic accumulator and application-blocking rule.

Forest teaches the mechanic with decent frequency and a small strength bonus. Jungle takes over as the same defensive lineage, increasing strength from its T2 debut. At overlapping T2, Forest should retain slightly higher frequency while Jungle mitigates each evade more strongly; Jungle becomes the long-term route when Forest retires. Do not add unrelated hardening or conditional movement buffs to explain Jungle.

Provisional item-only endpoints, showing +0 → +5; strength is the bonus added to the 50% baseline:

| Armor tier | Raw evade frequency | Evade-strength bonus |
|---|---|---|
| Forest T1 | 28% → 36% | +10 points |
| Forest T2 | 34% → 42% | +10 points |
| Jungle T2 | 28% → 36% | +20 points |
| Jungle T3 | 32% → 40% | +25 points |
| Jungle T4 | 36% → 44% | +30 points |

These exchange plating for evasion value; they are not additive buffs on the current shells. At T2, Forest's equal-hit armor-only averages are approximately 20.4–25.2% mitigation and Jungle's 19.6–25.2%, before other effects. This gives two understandable sidegrades while Jungle's strength is more valuable to classes already supplying frequency. Test first-hit exposure and ailment prevention separately; the averages do not guarantee burst survival.

Preserve the current frequency soft cap for the first candidate. Slinger and Stormdancer require specific combination checks, because the latter dynamically adds dodge frequency after the static soft-cap conversion. Do not infer an 85% evade-frequency build is ordinary just because a single armor has moderate raw evasion.

Progression: Jungle T2 remains a new craft at its current local-biome entry. Forest T2 must not become a trap when retiring. Provide an explicit, fairly priced Forest +5 → Jungle T3 conversion route or an equivalent credit toward reconstruction. This requires a deliberate multi-predecessor/alternate-recipe design because current `evolvesFrom` is single-parent; do not silently overwrite the Jungle predecessor. Preserve IDs and upgrade investment during migration.

### Desert: replace last stand with opening protection

I recommend the suggested engagement DR window. It is coherent with the weapon's Sunlight window, and it buys time while the player is slowed/rooted and the paired ranged attacker starts shooting. It does **not** remove the controller or solve a prolonged chase, which leaves useful choices in boots, target priority, Break Free and movement skills.

Remove automatic cheat death, post-cheat-death healing, periodic non-DoT cleanse and permanent generic debuff resistance from this armor line. Status defense belongs in the system, but not every Desert item needs to carry it; existing mobility/Guard tools and the Swamp/Graveyard line can supply alternatives. The present generic debuff-resistance stat reduces supported non-DoT magnitudes; it does not shorten roots. Its name currently promises more than its scope.

**Dawnward window, first candidate:** 30/35/40% direct-hit DR at T2/T3/T4, for four seconds. Upgrades improve the modest HP shell and up to five percentage points of protection, not duration and frequency as well.

Trigger at the beginning of a new hostile engagement, before its first incoming damage: outgoing owner/owned-summon engagement or incoming hostile engagement qualifies. Use one owner-level engagement state, never one proc per minion. Do not trigger on mere target selection, an invulnerable target, an environmental tick, or a target swap. The window never stacks, refreshes, extends or queues. Re-arm only after six seconds with no active hostile engagement and no incoming hostile damage; stale chase/aggression must prevent artificial reset. Do not refresh from another enemy joining the existing fight.

This deliberately interprets “engage any enemy” as “begin fighting an enemy,” not “gain a fresh four seconds every time a new target appears.” A per-enemy version would approach permanent DR in swarms and encourage target cycling. If later data shows genuine pack transitions rarely reset the window, tune the engagement boundary rather than adding refresh-on-kill.

Desert armor and weapon can activate together without requiring one another. Existing weapon first-strike logic is target-based; do not alter weapon mechanics in order to reuse its exact trigger. The analogous fantasy is enough.

### Tundra: retain stationary DR, make movement a meaningful cost

Preserve the glacier identity. Remove soft-cap protection, reduce its incidental plating to a small value, and normalize the very large upgrade HP gains. Initially retain **15% T3 / 20% T4 maximum positional DR**; there is no need to preemptively buff the peak while reducing the rest of the shell.

Proposed timing: build from zero to full over three seconds of active combat while holding position; movement gets a 0.25-second grace against pathing jitter, then drains the whole ramp over one second of continued movement. When leaving combat, drain over one second; no out-of-combat precharging. After stopping again, rebuild from the retained amount, not instantly to full. Forced displacement counts as displacement; being rooted/stunned does not count as voluntary establishment of a position and cannot build new ramp. Specify these rules in the buff and measure the actual authority motion state, not just a possibly stale `isMoving` marker.

At full ramp, Tundra may be only moderately ahead of a generalist in overall endurance because it retains a somewhat larger HP shell. That is acceptable. Its identity does not require vastly higher DR than every alternative. If equal-budget tests show it loses even during sustained safe holds, trade some HP budget into peak positional DR; do not restore the cap or slow decay.

Bunker posture should remain possible as an intentional low-throughput build, but it must not erase danger by stacking plating multipliers. In its home, standing through ordinary hits and moving for planted slams should outperform blindly standing on every tell. In Volcano, where lava forces movement, its weakness should be visible.

### Mountain: preserve Guard specialization and repair its dependencies

Retain HP and Guard potency. Remove the soft cap at T3/T4 and the cap-triggered full barrier refill. Do not replace that refill with a free full barrier on every Guard cast.

Provisional Guard potency from +0 → +5: T1 15→25%, T2 20→30%, T3 25→35%, T4 30→40%. Guard reduction acts before shields and debt under the new common contract, so the same apparent potency has broader value. Keep meaningful unprotected cooldown intervals; do not simultaneously raise mitigation, duration and recharge rate.

Titan's Keep becomes the straightforward T4 Guard/HP option. Stormwall remains a shield-linked alternative: somewhat less Guard potency, a small **self-contained** barrier (seed 10% max HP) and the existing break-heal idea, repriced around the actual depleted shield pool. A heal worth 20% of a 10%-HP barrier is only 2% max HP: report that honestly. An external shield investment can enlarge the payoff, but the armor must function without a mandatory charm. Keep a shared break-rider cooldown, and never trigger from expiry or an already-empty shield. No automatic full refill.

The HP floor makes Mountain serviceable before perfect Rune conditions are assembled. Guard attunement/access must be reachable around the armor's unlock, or its signature budget is dead. Mountain need not also be the best permanent plating armor.

### Cave and Trench: keep the clear generalist

This is already a useful design. Preserve unconditional DR, trim plating to zero, and avoid offsetting the entire lost plating budget by stacking more percent DR. A provisional item DR sequence is T1 10→14%, T2 12→16%, T3 14→18%, T4 Trench 16→20% (+0→+5). These are broad protection levels under the proposed full-DoT coverage, not calibrated final numbers.

Retain Trench's small sustained-fight rider: up to five percentage points of its **own armor profile** after ten seconds, not a separately multiplied extra defense. It becomes a slightly better generalist in long fights, while Tundra has the different positional condition and HP allocation. Its small ramp must not turn it into the best specialist against every threat.

Keep Cave available early and price its craft and first useful upgrade competitively. Do not put the only generalist behind clearing a biome that already assumes it. Existing mixed-damage builds should have a comfortable default without committing to a new conditional mechanic.

### Swamp and Graveyard: keep ailments, make the debt branch real

Keep Swamp's DoT resistance and gradual introduction of debt. Remove incidental plating, and move generic non-DoT resistance into explicit, named supported effects (e.g. weaken enemy-applied healing suppression and vulnerability); do not imply root immunity. Retain status tools elsewhere so choosing another armor does not abandon this axis.

Swamp candidate DoT resistance at +0→+5: T1 25→35%, T2 30→40%, T3 35→45%. Debt begins at T2 with 15%, rising to 20% at T3; it should be felt as a time buffer instead of the current 8–10% side effect. Keep sufficient independent value against poison so this is not a mandatory Recovery combo.

**Plaguebound Mantle:** the T4 ailment specialist. About 40→50% DoT resistance, modest explicit non-DoT debuff weakening, 15% debt as a secondary benefit. Remove reactive plating. Its current evolution drops DoT resistance from Swamp T3's 46% base/52% upgraded to 35%, and debt from 10% to 8%, while buying bulk; the proposed evolution should preserve the advertised specialist strength.

**Grave Ward:** the debt specialist. About 30% debt and 25→35% DoT resistance, no automatic forgiveness when debt exceeds HP. Keep the same HP budget as the sibling so its trade is clear: more time against clean bursts, less resistance to ongoing poison. Test with both moderate Recovery and dedicated sustain; antiheal remains a real counter.

Proposed debt contract: pay each converted hit in four equal one-second installments with fractional carry, snapshotting its debt-resistance treatment when queued. No tiny-debt deletion, out-of-combat cancellation, cleanse deletion, self-cost conversion or mitigation applied again. Death clears the character's combat debt normally. Total debt and upcoming payment need visible UI. This replaces the current exponential pool, so timing is a separate measured intervention.

Keep the current idea that DoT resistance reduces debt payments for the first candidate; the total eventual eligible hit loss is approximately `D × (1 − conversion × resistance)`. At 30% conversion and 30% resistance it is 91% of D: useful smoothing plus 9% eventual mitigation, not 30% free DR. Consider decoupling debt from poison resistance only if this linkage prevents either branch being priced fairly.

## 5. Raw item budgets and all 30 dispositions

The following numbers are **prototype seeds**, selected to make the tradeoffs concrete. They are not fitted to live data and are not approved production values. Do not combine them with the corrected big-hit ordering and ship without encounter tests.

Normalize item HP around T1/T2/T3/T4 bases **30/55/100/180**, with +5 at approximately 150% of +0 (rounded once); +1…+5 add 10% of base per step. Choose a family factor: Plains 0.9; Forest/Jungle 0.95; Cave/Trench/Desert/Volcano 1.0; Swamp/Graveyard 1.05; Mountain/Tundra 1.2. HP may move during tuning; the initial goal is to remove arbitrary twofold upgrade-shell differences within a tier.

For plating, seed the specialist bases at T1/T2/T3/T4 **2/5/8/12**, with max-upgrade values **3/8/12/18**. Volcano adds a bounded hardening maximum of 4 at T3 and 6 at T4. Mountain/Tundra receive at most roughly one quarter of that static plating budget; other families receive zero. Existing base player plating remains separate. Rounded upgrade steps must not create gratuitous +0 upgrades: HP or the signature stat still improves on every step.

Calibrate those seeds against hit distributions after class/core changes. Desired shape: a dedicated build strongly reduces the small-hit band; incidental plating does not halve ordinary same-tier hits; large hits retain most of their magnitude before general DR. It is acceptable to trivialize obsolete content. Never set plating from a global median spanning all biomes and damage types.

| Current definition(s), covering all 30 | Disposition |
|---|---|
| Bark Wrap (1) | Keep tutorial; seed +20 HP/+2 plating instead of +4 plating; fixed power |
| Survivor's Robe, Enduring Robe (2) | Preserve plain specialist plating; small HP tradeoff |
| Shaded Bindings, Phantom Bindings (2) | Preserve early evasion; strengthen readable mitigation; no plating |
| Verdant Weave, Wildgrowth Weave, Primal Canopy (3) | Preserve successor; evade strength from T2, balanced upgrade growth; no plating |
| Bestial Hide, Dire Bestial Hide, Deepscale Hide (3) | Preserve generalist DR; zero plating; moderate shared HP budget |
| Fallen Knight Plate, Iron Crusader Plate, Summit Aegis (3) | Preserve Guard potency; low plating and high HP; remove Summit cap |
| Titan's Keep (1) | Preserve Guard capstone; remove cap and cap-refill rider |
| Stormwall Plate (1) | Preserve shield-break alternative; self-contained small barrier; no cap |
| Arcane Wrappings, Bog Wrappings, Plaguebound Shroud (3) | Preserve ailment protection; stronger debt progression; no plating |
| Glacial Bulwark, Permafrost Sovereign (2) | Preserve positional DR; faster loss, no preload/cap, smaller shell |
| Duneplate of the Last Stand, Eternal Duneplate, Deathless Duneplate (3) | Redesign as engagement protection; rename last-stand/deathless language; preserve IDs |
| Emberforge Plate, Pyroclasm Mantle (2) | Preserve Plains evolution and hardening; cut flat supply and remove DR rider |
| Lava-Tempered Hide (1) | Preserve overheal hybrid with bounded wards and much less plating/hardening |
| Plaguebound Mantle (1) | Preserve late ailment answer; remove reactive plating, restore specialist continuity |
| Grave Ward (1) | Preserve debt branch; meaningful conversion replaces debt forgiveness |
| Deep Sea Carapace (1) | Preserve Cave successor and modest long-fight DR; no plating |

Recipe economics are part of this table: preserve mastery gates and IDs initially, then compare total acquisition/evolution/reconstruction cost per viable package. Do not make +5 compulsory for the new signature effect. No new armor slots, elemental resistance system, or unrelated crafting redesign is required.

## 6. Class defense proposal

### What classes currently contribute

Numbers below are root plus frame before range, gear, stance/core and temporary state. Triples are HP affinity / plating affinity / flat DR. Evasion is listed separately.

| Class | Light | Balanced | Heavy | Innate defensive mechanic |
|---|---|---|---|---|
| Striker | 22 / 15 / 2% | 28 / 25 / 2% | 36 / 35 / 4% | Recovery pulse; soft cap |
| Squire | 35 / 35 / 4% | 42 / 45 / 6% | 52 / 55 / 7% | 10% Recovery always active |
| Apprentice | 16 / 8 / 0% | 22 / 18 / 0% | 30 / 28 / 3% | 18% DoT resistance; 10% debt |
| Slinger | 11 / 0 / 0% | 15 / 0 / 0% | 21 / 12 / 0% | Raw evasion 37/34/30%; +20-point evade strength; kill Recovery |
| Spirit | 6 / 0 / 0% | 10 / 6 / 0% | 17 / 12 / 2% | 30%-HP barrier |
| Conduit | 12 / 0 / 0% | 16 / 6 / 0% | 24 / 12 / 1% | Interception, redirection, reconstruction; separate summon HP profiles |

The plate-heavy classes already multiply a universal item stat. More item plating disproportionately rewards them, especially near a damage floor. Keep class distinctions, but give the heavy classes reliable health/general protection rather than another set of large plating multipliers.

### Concrete first candidate for root/frame/range

**Root changes:**

- **Squire:** keep +30% HP and 10% active Recovery. Reduce root plating affinity 30→10%; raise class DR 4→6%. Preserve the slow, reliable chassis.
- **Striker:** remove the soft cap; seed compensation at HP 18→25%, DR 2→4%, plating affinity 15→5%. Keep the existing Recovery pulse. This compensates some ordinary endurance, not the full protection against enormous hits; reprice boss spikes and measure them explicitly.
- **Apprentice:** keep +12% HP and 18% DoT resistance; remove the 8% plating affinity; raise debt 10→15%. Retain attrition identity without forcing Swamp armor.
- **Slinger:** keep +7% HP, 30% raw evade frequency and kill-based Recovery. Reduce innate evade-strength bonus 20→10 points because meaningful strength becomes available on armor from the early game. No new plating affinity. Check viability in other armor: the class must still evade competently without Jungle.
- **Spirit:** keep +3% HP and the 30%-HP barrier. Do not add generic DR or passive healing to solve its weakness under sustained pressure. Correct the description: runtime recharge is based on undamaged time, so combat status alone does not forbid recharge.
- **Conduit:** keep +8% HP and existing formation identities/redirect coefficients initially. Do not substitute a new armor-sharing model. Its current benefits and reconstruction costs must be counted together.

**Frame changes:** keep existing HP, offensive cadence and movement distinctions for this first candidate. Change only plating affinities: Squire light/balanced/heavy +0/+5/+10%; Striker +0/+5/+10%; Apprentice +0/+0/+5%; Slinger +0/+0/+5%; Spirit +0/+0/+5%; Conduit +0/+0/+5%. Preserve existing frame DR contributions initially, except Squire heavy can be evaluated at +4% rather than +3% if needed after plate removal. Preserve Scout/Marksman frequency bonuses.

This makes maximum root+frame plating affinity approximately +20% for Squire, +15% for Striker, and +5% for the other classes instead of quietly approaching +55% before range.

**Range changes:** remove generic plating affinity from all close/mid/far nodes. Preserve their HP and offense/reach compensation initially. Keep the recognizable close-range class payoff: Striker larger Recovery pulse; Apprentice recuperation; Slinger stronger/more frequent evades; Spirit larger barrier. Reduce Squire's close-range extra active Recovery from +20 to +10 points as an initial anti-bunker candidate (total 20% rather than 30%); test this separately from its item changes. Conduit remains the exception where range changes formation protection and replacement economics rather than simply making the owner more or less melee.

Do not give mid-range every benefit at a smaller cost until it becomes a universal optimum. Evaluate actual contact time, travel and kill throughput. Light/heavy frame labels do not justify mechanically identical defenses across classes.

### Specializations: preserve offense, audit their defensive consequences

All 54 authored specialization descriptions/values are in the inventory. Most alter offense rather than direct defensive stats; leave their coefficients unchanged in the first defense prototype. Priority interaction checks:

| Specialization / group | Why defense redesign can change it |
|---|---|
| Stormdancer | +25% static evasion plus up to +45 points dynamic dodge frequency after the normal static conversion can reach the 85% ceiling; stronger Jungle evades multiply that payoff. Measure before considering a dynamic-frequency reduction |
| Devout Priest and any stationary channel package | Tundra's stationary DR may be a natural cross-biome fit; forced channel commitment must still have a cost against ground hazards |
| Blunderbuss | Knockback and self-displacement affect exposure and Tundra uptime; do not infer its defense from HP alone |
| Winter Warden | Enemy attack/movement slowing reduces incoming pressure and prolongs safe positions; account for it alongside armor |
| Avenger | Its retaliation accumulator reads `incomingGross` in `cooldown/t3/ticks/cooldownState.ts`; preserve that gross-damage basis through ordering changes so better defense does not suppress its offense |
| Berserker, Juggernaut specialization, Desperado and other long-fight ramps | More survival can unlock disproportionate offense and change work per minute; defense-only endurance is incomplete evidence |
| Sniper/Destroyer/Marshal and opening-burst packages | Desert protection can cover their opening execution window; target cycling must not make it permanent |
| Kilnmaster/Iconoclast | Formation deaths and deliberate replacements are not qualifying hostile damage for armor procs; reconstruction may consume the apparent defensive improvement |
| Covenanter/Champion/Idolwright | Twin distribution, owner exposure and concentrated summon loss need separate accounting; do not rank by owner HP alone |

The specialization called Juggernaut and Juggernaut Core are different sources. Keep reports explicit about which is present.

## 7. Cores, stances, recovery and Guards cannot remain outside the budget

### Cores should amplify a build without invalidating its survival floor

The reported T3 Slinger + Jungle + negative-HP core death is a priority diagnostic case. It is not yet a reproduced death: exact frame, range, upgrades, other equipment, specialization, stance, HP before impact, Heat, and killing ability are unknown. The source nevertheless supports the concern. Sniper removes 30% max HP and 25% plating; Scout removes 20% HP; even the unrestricted Force removes 12% HP. Meanwhile Bruiser grants damage, HP, movement and mobility refunds, and Duelist grants damage, HP and a Focus ramp. This is an asymmetric treatment of melee and ranged build identity.

Max HP is a breakpoint stat. Losing 30% is not merely losing 30% endurance: against an unchanged hit it increases the fraction of your life lost by about 43%, before the plating penalty. It also reduces the absolute output of percentage-HP Recovery and the size of percentage-HP shields. Those latter effects preserve proportional recovery time; do not count them as independent multiplicative EHP penalties. They still make the cost broader than the tooltip's apparent health tradeoff. Evasion reduces eligible hits over time but does not guarantee the next hit will be mitigated; its deterministic accumulator starts at zero out of combat.

**Recommendation: remove negative max-HP modifiers from Force, Scout and Sniper, and remove Sniper's plating penalty.** Reprice their offensive benefits and compare the whole core roster. Do not replace these penalties with increased damage taken, reduced shields or a low-HP condition: those reproduce the same lethal-hit problem. A one-slot specialist already pays an opportunity cost by foregoing another core. Some same-axis tradeoffs remain appropriate, such as attack speed versus hit size; every core does not need a drawback.

All 12 cores were imported from current recipes. The following are **prototype seeds, not measured balance values**. Existing eligibility stays intact for the first experiment; ranged cores work for mid/far nodes and melee cores for close nodes, not by weapon appearance. Revisit eligibility separately if it prevents an otherwise coherent build.

| Core | Current authored package | Proposed disposition / first seed |
|---|---|---|
| Tempered, T2 unrestricted | +12% final damage, +12% HP | Keep as the simple mixed benchmark initially; it must not dominate specialized choices |
| Survivalist, T2 unrestricted | +30% Recovery, +15% HP | Preserve sustain identity; initially keep values and measure activation-dependent value and bunker interaction |
| Force, T2 unrestricted | +22% final damage, -12% HP | Pure output choice: +18% damage, no HP penalty; compare against Tempered's 12%/12% package before adoption |
| Duelist, T3 melee | +18% final damage, +10% HP; +5% direct attack damage per same-target hit, max five Focus | Preserve sustained same-target commitment; initially hold values while ranged penalties are removed; compare against bosses and target switching separately |
| Bruiser, T3 melee | +28% final damage, +20% HP, +18% speed; 50% mobility cooldown refund on qualifying kills | Too many generic upsides to ignore: seed +18% damage, +10% HP, retain speed/refund identity; measure actual direct-kill eligibility and refund utilization |
| Scout, T3 ranged | +24% final damage, +25% speed, 25% mobility cooldown reduction, -20% HP | Keep +25% speed and mobility CDR, reduce damage to +12%, remove HP penalty. It buys spacing/repositioning, not permanent immunity to pursuit |
| Sniper, T3 ranged | +40% final damage, -30% HP, -25% plating | Seed +25% damage with neither defensive penalty. Preserve the simple ranged-output identity; do not add a new proc or rotation just to justify its name |
| Arcanist, T3 unrestricted | 20% Technique cooldown reduction, +20% Technique power | Preserve; opportunity cost is needing meaningful Technique contribution; measure utility/control as well as damage |
| Accelerant, T3 unrestricted | +55% attack speed, -18% final damage | Preserve cadence identity for first candidate; the authored damage penalty has broader coverage than merely reducing basic-hit size, so audit actual damage lanes before changing the copy or coefficient |
| Juggernaut, T4 melee | +30% HP, +40% plating, 14% less damage taken, -25% attack speed, -10% speed | Reduce overlapping defense to +20% HP, +10% plating, 10% less damage taken; reassess costs after survival/work measurement |
| Controller, T4 unrestricted | +35% debuff duration, +25% debuff potency | Preserve amplifier identity; review slow/control uptime and boss applicability as indirect defense; no added HP drawback |
| Catalyst, T4 unrestricted | +115% on-hit damage modifier, -15% final damage | Preserve existing on-hit amplification identity and coverage; it grants no on-hit source. Evaluate actual existing procs rather than nominal tooltip DPS |

No core here should be priced using maximum theoretical value from kiting, permanent target uptime, full Recovery activation or infinite control uptime. Those are encounter-dependent. Higher core tier is also not evidence that every earlier core should be obsolete: a specialized late choice can coexist with a reliable mixed earlier choice.

### T3 Volcano case: separate routine contact from the encounter's final check

Current `bossesT3.ts` authors Cinder-Shell Magma-Salamander at 179 attack / 3-second cooldown, with an attack multiplier of 1.15 below half health. Its shell vent deals authored 12-per-tick pressure, accelerates Heat and pulls inward. Final Eruption arms below 25% boss HP, casts for 8 seconds, then has a 400 ms impact telegraph, radius 2000 and **650 raw damage**. This is a distinct late-fight check, not a normal melee swing. The pattern circle passes its explicit raw damage into the normal monster/player attack resolver. Player Heat and other current state can still change the result; source comments about no hidden scaling do not replace checking those paths.

The shared equipment preview gives this deliberately limited sensitivity example: Slinger light/far, Jungle T3 +0, no weapon/charm/relic/specialization/stance, no Heat or active Guard. Values below are static un-evaded arithmetic, **not the reported player's loadout, an acquisition-qualified build, or a combat reproduction**.

| Core | HP | Plating | Ordinary 179 attack after plating | Consequence from full HP under these limited assumptions |
|---|---:|---:|---:|---|
| None | 205 | 15 | 164 | 41 HP remains |
| Force | 180 | 15 | 164 | 16 HP remains |
| Scout | 164 | 15 | 164 | Lethal at equality |
| Sniper | 144 | 11 | 168 | Lethal |
| Tempered | 230 | 15 | 164 | 66 HP remains |

At Jungle +3 the same constructed Sniper build has 187 HP and takes 161 before extra multipliers: the immediate one-shot disappears, but only 26 HP remains. At +5 it has 216 HP against 156. Investment, Heat, the below-half phase, damage already taken and other slots matter. The 650 raw Eruption exceeds even the no-core +5 constructed build's 308 HP before an evade or active defense. We therefore cannot infer the player's killing event from the report alone.

Anti-kiting reinforces the need for a contact budget: ordinary non-kiter monsters ramp chase speed after 500 ms at an uncapped multiplier gain of 1.5 per second; a landed ordinary hit halves accumulated chase time. That makes indefinite evasion by range a poor balance assumption, although terrain, control and kill timing still affect actual contact. This is a speed ramp, not evidence of an anti-kite damage multiplier.

**Acceptance contract:** an appropriately progressed ranged build using its intended armor and a shape-amplifying core must retain a useful response window after a routine, un-evaded, forced-contact hit from full health. Start with a provisional ceiling of 60–70% HP for that hit at ordinary environmental pressure, then test whether the actual automation/Guard cadence can act before a follow-up. Also measure the worst plausible short sequence: two attackers in the same tick, contact plus vent damage, or control plus a follow-up. This is an encounter/build tuning target, not a global runtime damage cap or a promise that every naked build survives everything.

Telegraphed heavy attacks, accumulated avoidable Heat and final-enrage checks get separate success conditions. Final Eruption needs an explicit design decision: is the intended answer killing before completion, using an accessible timed defense, leaving the encounter, or some combination? Its 2000 radius means we must not casually call it a normal sidestep test. Check whether the game's automatic decision tools and typical ranged loadout can execute the intended answer. A tank surviving does not demonstrate that the encounter is fair to other intended builds; nor does a failed enrage prove normal attack scaling is too high.

Do not postpone all monster analysis until after reducing plating. Build a threat envelope now from authored hits, attack cadence, synchronized packets, debuffs and environmental multipliers; use it to constrain armor/HP seeds before prototyping. Defer the **global monster rescale decision** until the corrected defense contract and comparable acquired builds have evidence. In particular, reducing universal plating without checking this envelope can worsen exactly the failure being reported.

When player telemetry becomes available, retrieve the killing event plus the preceding 10 seconds: source/version, equipment and upgrade snapshot, class nodes, stance, max/current HP, evade accumulator/result, gross hit, each mitigation stage, shields/debt, Heat, attack/ability identity, nearby attackers and simultaneous damage. Compare normal-contact deaths and Eruption failures separately. Future bot pairs should vary only the core within the same build and encounter, then compare equivalent investment across melee/ranged builds; report one-hit lethality and recovery opportunity alongside average damage and completion. No new bot campaign or player-data query was performed here.

### Supporting defenses

**Juggernaut Core:** current +30% HP, +40% plating and 14% less damage taken stack with Tanking's +40% plating and class affinity. Prototype +20% HP, +10% plating and 10% less damage taken, preserving its attack/movement costs initially. If the package becomes too slow for its new durability, review those costs against work rather than restoring all three defensive upsides.

**Defensive/Tanking Stances:** retain broad less-damage-taken and the offense tradeoff; remove their +20/+40% plating multipliers in the first candidate. Preserve 10%/25% less damage taken initially. A posture already amplifies the value of existing plating by reducing what gets through; it need not also multiply plating itself. Tanking must be judged on useful farming and hazard escape, not surviving while accomplishing nothing.

**Recovery:** retain the existing percentage-of-max-HP rate model for this proposal. Do not quietly add a second complete recovery redesign. It is nevertheless load-bearing: at Recovery 26, Squire close's current 30% activation gives 7.8% max HP per second before other sources. Adding Volcanic charm +16% active activation makes that 11.96% max HP/s before its kill window. Strong mitigation plus that healing can cross the indefinite-sustain threshold. Include uptime, antiheal, overheal and missed activations in pricing. Freeze charm identities initially, then tune activation magnitudes where the combined candidate still has a sustain runaway.

**Absorb/recuperation:** it is delayed healing, not shield absorption. Display and record it separately. Credit only actual eligible HP damage after redirection/debt/Guards. Do not credit again on debt payment or ward loss. Keep antiheal relevant.

**Barriers:** retain undamaged-time recharge and distinct temporary wards. Correct damage-path bypasses under the common contract. Avoid granting arbitrary full refills on node crossing, armor swapping or reconnecting during an unfinished encounter; inspect current refill call sites during implementation. This is an explicit migration/reset audit, not a claim that every current refill is exploitable.

**Guards:** preserve Brace as brief strong direct protection and Endure as longer modest direct protection. Keep their attunement and automation opportunity costs. Measure both separately and together; correct their position in the damage pipeline before tuning Mountain potency. Cleanse and Break Free remain important tools against threats DR does not remove. Do not hand Mountain all of their functions as passive riders.

**Conduit:** owner barriers and armor protect the owner; summon direct attacks currently hit bodies with their own HP and zero plating/DR. Owner HP increases summon HP and the HP price of replacement. Keep those three facts visible. The proposed phase order prevents owner recuperation from being credited on damage the minion actually paid. Deliberate reconstruction costs must bypass normal mitigation and must not trigger Desert, hardening or damage-debt benefits. Hold existing overkill/redirection semantics fixed in the initial candidate and instrument them rather than silently changing them too.

## 8. Transferable build examples

These are proposed choices to validate, not recommended current best builds:

- **Jungle armor + steady Recovery:** evades reduce direct pressure and prevent some venom applications in Jungle; the same build helps against eligible debuff-applying attacks in Swamp or Desert. It remains weak to damage already ticking and some ground attacks.
- **Desert armor + an offensive weapon/stance:** survive the dangerous pull and remove the ranged dealer before the window expires. Also helps with Jungle ambushes. A long boss encounter needs another plan for the uncovered time.
- **Tundra armor + a stationary channel:** establish a protected firing position, reposition on a dangerous tell, then rebuild. Cave/Trench armor is the alternative when frequent repositioning makes that rhythm unreliable.
- **Volcano armor + a barrier charm:** the barrier covers arrival while hardening builds against pack pressure. A large impact cracks the hardening despite the barrier, preventing the two from deleting each other's weakness.
- **Grave Ward + Recovery:** debt creates time for healing after a heavy hit; a cleanse/antiheal answer may be more valuable than more conversion in an ailment-heavy zone. Plaguebound Mantle is the alternative when incoming damage is predominantly poison.
- **Mountain armor + timed Brace:** answer a Mountain slam and use the same tool against a Tundra heavy hit or a Desert controller/dealer timing window. Taking a recovery Guard instead changes the armor's effective payoff and must be priced as a complete loadout.

The goal is for several choices to work in a biome for different reasons. A home specialist should be understandable and useful without being the sole viable entry route.

## 9. How to turn this into evidence

### Stage A — mechanical contract, no balancing conclusions

Freeze the current baseline and verify production parity when telemetry is available. Add focused fixtures for charge-before-plating, generic splash coverage, Guard-before-pools, debt conservation, actual-HP recuperation, deterministic evasion/status blocking, conditional DR composition, and one-owner Desert activation. Include Conduit, simultaneous hits, forced movement, DoTs and direct self-costs. Confirm tooltip semantics against these paths.

### Stage B — coherent candidate, independently attributable steps

Measure the baseline, ordering/coverage changes alone, item redistribution on the corrected contract, class/core/stance changes on top, and the combined candidate. These intermediate arms are diagnostic; they need not all be shippable. Separate cap removal/compensation and debt-drain timing so their effects remain interpretable. Use a predeclared small factorial subset where interactions are likely, especially Jungle × Slinger/Stormdancer and Tundra × Tanking/Core/Guard.

### Stage C — home, second home, counterexample

Every armor family gets a home encounter, a cross-biome application and an unfavorable threat. Include two different same-biome enemy compositions when the supposed home threat varies. Test arrival, intermediate investment, and late upgrades; all six classes need at least one viable non-home armor route. Do not average Forest/Jungle, direct/DoT, bosses/farming or light/heavy classes into one defense score.

Stress cases: Jungle first hit and rapid mixed attackers; Desert fresh-target spam, summoned attacks and chain pulls; Tundra alternating 0.5s/1s movements, roots and planted slams; Volcano big hits absorbed by shields/debt; Grave Ward retreat with outstanding debt and antiheal; Mountain with zero/one/two relevant Guards; late Conduit replacement pressure.

### Stage D — progression and live cohorts

Validate crafting/evolution/reconstruction prices, Forest retirement continuity, RP availability, actual affordability and first-entry routes. Preserve existing gear IDs, owned unlocks and investment. Any substantial repricing should include a one-time respec or reconstruction-credit plan; decide it before release. On deployment, recalculate HP/shields/debt safely and version telemetry; do not carry stale runtime pools across a changed formula without an explicit migration rule.

Human telemetry is observational: selection conditional on available options, exposure-normalized deaths, retreats and boss outcomes can guide the next experiment, but do not prove a causal armor effect. Existing historical bot packets remain bounded by their frozen source/package and seeds. No new combat observations were collected for this proposal.

### Accept/reject criteria

- Each preserved identity is legible by its first obtainable version, not only +5 or T4.
- Each family has one demonstrated home use and one useful cross-biome use, plus a documented weakness.
- Generalist gear remains viable for learning and first entry; no mandatory matching armor.
- No low-investment incidental plating puts ordinary same-tier damage broadly at its floor.
- Heavy defenses buy endurance at a visible work/mobility cost, not near-immunity plus sustain for free.
- Armor choice does not collapse to a single best item across most classes and threats.
- Opening protection, stationary protection and hardening obey their timing contracts under actual autocombat.
- Report death-free completion, common-endpoint work, downtime, low-HP windows, shield loss, debt liability, healing and Conduit replacement cost separately. A time-capped survivor is not proof of infinite sustain.

## 10. Recommended decision

Approve the **identity and interaction contracts first**, with the numerical tables treated as prototype starting points. Preserve eight recognizable routes, make Desert the focused conceptual redesign, and remove overlapping cap/cheat-death mechanics with explicit compensation. Next implement an isolated candidate with stage-specific receipts, then use bot and human evidence to set final coefficients.

No launch, implementation, economy migration, or production change is authorized by this document alone.

## Source and reproduction notes

Primary sources reviewed: all recipe definitions through actual `ITEM_DATABASE`/upgrade imports; `shared/src/data/skillTree/{rootsAndFrames,t3CombatA,t3CombatB,t3Summoner,generated}.ts`; `shared/src/systems/{stats,equipmentPreview,finalDamage,alphaWindow,summonerProfile}.ts`; `shared/src/data/summoner.ts`; `shared/src/stances.ts`; `shared/src/abilities.ts`; the authored biome monster files; `server/src/systems/combatBootstrap.ts`; defense mitigation/barrier/recovery modules; `combat/status/{debuffGuard,harmfulStatus}.ts`; `player/abilities/{abilityEffects,abilityFiring}.ts`; Conduit spawn/redirection paths; Stormdancer's `energy/t3/ticks/flash.ts`. Current-code claims come from these sources, not old design comments.

Run `pnpm --filter @mmo-idle/server exec tsx --conditions=development ../reports/player-defense-study-2026-09-25/deep-inventory.ts` to regenerate the static inventory and constructed shared-formula examples. This does not start a World or produce combat/economy evidence. It does not verify exact runtime semantics for every offensive specialization; those are retained and listed as interaction risks rather than claimed fully tested.
