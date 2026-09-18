# Night5-R1 review and invited-playtest roadmap

Updated 2026-09-17. Planner assessment; no experiment or balance patch executed.
User approved shortening the campaign to an initial mob pass through T4, then a
small invited playtest with continued iteration. Exhaustive player-build balance
is no longer a pre-playtest requirement. This supersedes the former sequential
requirement to finish all item/class/economy polishing before player feedback.

## Evidence checked

Read the operator report and recomputed block outcome counts, death locations,
Mountain tier/arm counts, weapon death summaries and T4 species aggregates from
raw index.json and night5-audit.json. Checked all six manifest revisions and
definitions hashes and uniqueness of cell/seed rows. This is not a substitute for
full verification of the four partial matrices or a full event-stream audit.
Source d0492235; current checkout changes are not automatically represented.
Raw root: C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results.

Queue wall time6:43:40.864. 1222/1572 observations started:1107 full windows,
57 deaths,58 wall-censored,350 unstarted. No new loader failure. Four blocks hit
75-minute budgets; Weapons and Sustain reached every planned observation.
The wall-time estimate was useful, but the scheduling order was not: alphabetical
biome order plus expensive Jungle repeatedly starved late T4 biomes. Next packets
must guarantee biome breadth before branch depth. Do not repeat the whole night.

## Decisions supported now

### Mountain: use the build evidence; keep one residual pressure question

T2 ranged orbit arms are complete and directly comparable across24 observations:
Mountain boots2 deaths; Cave boots0. All T2 no-orbit observations: Mountain boots
24/36 deaths; Cave boots10/36. Those latter groups include melee and ranged roots,
so do not compare their rates directly against the ranged-only orbit groups.
Orbit plus Cave boots is a credible reference for future ranged Mountain checks.
No need for another generic boots-versus-boots selection loop before using it as
a template. This is not a production item-stat change or universal best-boots claim.

The user's chain-pull hypothesis is consistent with lower paired late-joiner
medians with Cave boots (10 to2 in the orbit comparison), but no-orbit was generally
less safe. Do not disable kiting globally. Boot effects include speed/protection
tradeoffs; this is not a pure estimate of the stealth coefficient.
T2 Striker still died4/6 with EACH boot package; Squire died5/6 with Mountain boots
and0/6 with Cave boots. Residual Striker pressure deserves focused sequence/build
inspection before deciding whether a small mob adjustment is necessary.
T3 had only one death across94 started observations and one wall cutoff; coverage
is incomplete. Do not pool this into a blanket T2/T3 Mountain attack nerf.
Mountain elite duration summaries are near intended ranges: Granite Titan15.05s,
Mountain Colossus27.0s, across eligible observed cells/builds.

### T4: clear durability signals, plus a finite coverage gap

No T4 Tundra or Volcano observation ran. Trench coverage is only five branchB
cells. These are the next coverage priorities, not evidence of safety.
Eligible Granite Mammoth cell medians have branch-level outer medians2.45/1.85/
2.20s (A/B/C), with10/12/9 eligible cells respectively. Cragback Rhino2.70/2.65/
2.30s. These are species statistics, not mixed biome averages, and strongly support
reviewing T4 Mountain durability. They do not establish an exact HP multiplier.
Desert Dune Tyrant6.1/4.7/4.0s and Gravewright6.6/5.93/6.1s similarly warrant role
review. Trench Elder Leviathan18.75s is based on only four eligible branchB cells:
retain its limited coverage rather than forcing the same multiplier across T4.

Raw rows confirm both T4A deaths were Spirit/Desert (Equinox), and all four T4B
deaths were Slinger/Graveyard (Blunderbuss). Treat these as build-specific review
items before applying biome-wide damage reductions. The user offers help with
T4 specializations: request it when equipment/ability fit remains unclear.
Conduit differences stay in the later class/build track unless progression is
blocked. Jungle's54 T4 wall cutoffs are performance-limited; separate its runtime
investigation from numerical mob decisions and give it its own bounded block.

### Longer windows and weapons: retain findings without opening a full item pass

Sustain: T2 Forest36 full windows/no deaths; T2 Swamp36/no deaths; T3 Volcano35
full/one cutoff/no deaths; T3 Tundra33 full/three deaths, all Apprentice. Eight
long-quiet runs across Sustain prevent a blanket safety claim. Tundra gets a
control/equipment review using prior successful kiting tools, not an automatic
Bear nerf. T2 Forest and T3 Volcano still use local selected overlays: promoting
these to production is an explicit implementation step, not already accomplished.

Weapons:432 observations,11 deaths, no wall cutoffs. Conduit on-hit alternate had
0 deaths versus1 with axe and aggregate median minimum HP72.4% versus54.8% across
these encounters; useful candidate, not a universal ranking. Apprentice's on-hit
alternate had4 deaths versus1 baseline, Slinger DoT alternate1 versus0 on-hit.
Do not prematurely replace every class weapon or declare DoT best for Slinger.
Keep the full class/node/species comparison for item/class polishing. Operator
report largely omitted this completed block's build interpretation; these results
should not be lost simply because mob readiness is the immediate priority.

## Active roadmap: minimum credible mob pass, then player feedback

1. Close T4 breadth first. Prepare a compact five-minute screen for Tundra,
   Volcano and missing Trench coverage, six roots with one sensible specialization
   each, two nodes and three seeds. Use separate biome budgets/interleaved order,
   so expensive Jungle cannot consume their allocation. No eighteen-build repeat.
   Identify unobserved species explicitly. Investigate Jungle performance in a
   separate bounded task; do not count censored survival as a pass.
2. Assemble one role-based production mob pass. Inventory all T1–T4 species and
   mark evidence-supported retain/change/unknown decisions, including previous
   selected Forest/Volcano overlays still awaiting adoption. Address gross T4
   durability gaps and severe pressure outliers. Small swarm followers remain
   distinct from leaders, controllers and solo elites. Consider reduced damage
   where longer fights make attrition excessive. Exact T4 duration goals and
   numerical patch remain for review; do not auto-apply global HP multipliers.
3. Focused regression: changed encounters across representative six-root builds,
   residual T2 Mountain Striker issue, representative bosses and progression to
   T4. Verify boss access/preparation still works. Repair actual blockers; allow
   ordinary class asymmetry and known nonblocking quirks. Ask for targeted human
   playtests where bot behavior and encounter readability remain uncertain.
4. Basic x1 pacing and operational check: early game and major upgrade gates,
   time to reach feedback-relevant tiers, save/reconnect/death recovery. This is
   not the comprehensive economy study. Decide cohort size, reset expectations
   and feedback collection before release; no deployment authorized by this doc.
5. Open a small invited playtest once every mob tier has an initial pass, credible
   progression and no known severe blocker. Iterate in batches with player logs
   and qualitative feedback. Don't wait for perfect specialization parity.

No calendar commitment yet: size the numerical pass after missing T4 coverage.
Do not turn the finish line into zero deaths for every standardized build.

## Preserve for deeper polishing after feedback begins

- Six-root baselines, medium/native-range references and all frozen raw evidence.
- Weapon and equipment synergies; Conduit compensation; class/frame/range and T4
  specialization breadth, including the successful heavy Voidwalker reference.
- Ability/stance/rune experiments alongside builds (Sweep/Slam, defensive stance,
  dual guards, control tools); numerical parity is deferred, functional bugs are not.
- Boss TTK and mechanic-frequency tuning beyond the basic regression gate.
- Full x1 acquisition/economy curves and late-game upgrade pacing after basic sanity.
- Human feel/readability feedback and outlier investigation. Experimental success
  never certifies live usability, but live feedback need not await exhaustive bots.

Immediate recommendation: missing-biome T4 screen plus bounded review of T2
Striker Mountain and the two T4 specialization death cases. Then a consolidated
mob patch and focused regression, not another open-ended micro-tuning campaign.
