# V1g assessment and V1h direction

2026-09-13. Astra analysis of the completed V1g report and durable events.

## Findings

V1g finished its 13 declared slots without the earlier mistaken stop on a valid
boss death. Plains won in 52.029 seconds of boss combat with no deaths. Cave
Expose/Second Wind and Second Wind/Cleanse both lost 0/3; boss HP remaining was
about 30–33% and 34–37% respectively. Cleanse did remove corrosion, but neither
package solved that old encounter. These are valid losses on frozen d8363212,
not evidence that the current nerfed Cave is impossible.

All six T2 screens ended at the declared 30-minute ceiling. Squire reached GM62,
Jungle 2, with zero deaths; Striker GM60 with 11 Cave deaths; the other four
reached GM51–54. These legacy routes report treatmentValidity=not-asserted and
no summary templateValidation; entry checks exist in bot logs. They are useful
progression diagnostics, not qualified class rankings or balance trials.

Direct inspection of each run's events.jsonl under manifest
20260913t093354z-striker-t2-progression-squire confirms catalyst shortages:
Striker's terminal core-tempered block needs four Dominion; Spirit's Mountain
charm reconstruction needs two Heavy; Squire also waits for four Dominion.
Apprentice/Conduit hammer reconstruction needs Heavy; Slinger has Alacrity
reconstruction waits. Some earlier blocks also need essence/mastery. Do not
attribute every blocked millisecond or death exclusively to the catalyst bug.

## Changes that affect interpretation

| Source change | Consequence |
|---|---|
| e642d165 and 89ad656b | T1 Cave ordinary attacks no longer corrode; Breach gives two stacks, caps 6 then 9 at half HP; base attack 47 to 40, HP1750 and Breach multiplier1.1 retained. Reopen Cave on current source. |
| 65337a69 | T1/T2 Mountain Instinct is uncapped with stronger speed/wind-up scaling and 400ms floor. Earlier Mountain success is historical, requiring a small current check. T2 Jungle escape/stalk/ambush also changed; old Jungle boss results must not be pooled. |
| 4d39bc50 | Volcano heat vents pull on spawn (T3/T4). Outside this packet; low ordinary-mob eHP/TTK remains deferred. |
| e9a1bc1f | Debug multiplier now scales catalyst progress as well as XP/essence. Universal mint threshold100; T1 earns half progress. Previous25x screens had normal-speed catalysts. Fresh25x screens must be separately labeled. |

The historical T1 snapshot has catalyst residues 59/22/4/11/2, all below100.
Import preserves these raw values; the old T1 denominator was200. It is a fixed
historical combat input, not a migrated or representative current economy save.
Do not rewrite it or claim a continuous economy comparison. Equipped power and
boss entry gates remain checked; new charm/Brace are earned normally.

Human evidence is now concrete: human-2026-09-13T10-03-57-319Z-2df62694 records
a Broodmother victory, 46.115s boss combat, zero deaths, Axe/Mountain Vest/Cave
Charm/Plains Boots +5, root-only GM30, and Second Wind/Brace/Cleanse. Its three
movement rules differ from the bot's rules. This establishes a successful human
candidate, not an identical bot treatment or an exact source-hashed replicate.

## Next experiment and decision rules

V1h runs eight Cave cases (four packages twice), two current Mountain checks,
and three T2 screens (Striker, Squire, Spirit). Four hours of worker ceilings,
five hours total including setup/reporting. See the operator packet.

Cave retains both prior arms, then isolates Swamp-to-Cave charm under dual Guard,
then adds Brace. The triple-Guard package costs21/22RP with the same bot movement
rules: no need to remove hazard avoidance or recovery. Two cases per arm are a
candidate screen, not statistical proof. Preparation differences are reported
separately from boss outcomes. No further Cave balance changes before results.

T2 deliberately retains the existing policies and 30-minute cap for three
contrasting anchors: Squire's safe deeper progress, Striker's dangerous Core
farm, Spirit's Mountain reconstruction block. This tests whether corrected
reward acceleration permits useful coverage before changing their gear policy.
No extension, synthetic catalyst injection, automatic boss follow-on, or broad
six-class repetition. Keep not-asserted qualification limits explicit.

If T2 routes now finish or capture useful current checkpoints, the next planning
turn qualifies those exact earned builds for separate, one-boss T2 encounters
and authors alternatives against specific failures. If resource waits shrink
but deaths persist, prioritize farm-build/target-node alternatives; if an
acquisition loop remains, fix that route before lengthening its run. Human Cave
success is the reason to investigate bot differences before another nerf.

We are moving from entry/harness validation into controlled build experiments
and usable T2 preparation. T1 has candidate wins across the campaign plus human
Cave success, not six-class universal clearance. T2 has legal entry and partial
progression evidence, not prepared-boss coverage. Broad class/boss acceptance
comes after local solutions; normal-speed economy studies come later.
