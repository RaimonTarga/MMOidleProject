# Non-Volcano core strength experiment

## Outcome

Retain Force 22% damage, Scout 18% damage, Sniper 30% damage and removal of Catalyst's 15% damage penalty in the isolated defense candidate. Revert the additional Juggernaut HP and Controller potency experiments. Preserve Bruiser/Duelist melee durability. [Patch notes](PATCH-NOTES.md) include new core concepts and exact changes.

This pass intentionally excludes **all Volcanic nodes, monsters, bosses and hazards**. Catalyst's authored recipe lives in the Volcanic file, but only that core's effects and misleading armor-bypass description were edited there. Armor/class values remain those of the unshipped defense candidate at `9159de97`. Results do not establish that the larger redesign is ready for release.

## Scope and evidence

The main screen contains 112 cells × two seeds = **224 cases**. T3 uses all six classes with declared balanced packages, +3 equipment, Jungle farming and the Cave boss. Each class gets Tempered, Force, Survivalist, Arcanist and Accelerant, plus eligible melee or ranged cores. T4 adds heavy Squire/Striker tank packages in Tundra and the Mountain dungeon, plus light Apprentice/Slinger specialist packages in Trench and Graveyard. All 12 existing cores are represented; exposure counts differ, so pooled core totals are not a ranking.

The proposed four buffs were retested on their **64 affected cases**. Scout received a separate 16-case paired expansion using four fresh seeds on Slinger/Spirit farms in Jungle and Cave. A 12-case Frost/Freezing Cold specialist comparison examined Tempered, Controller and Arcanist. Controller/Catalyst follow-up buffs used 16 matching main-screen cases, with four additional matching Frost Controller cases. Total completed observations across the seven valid runs: **352**, including repeated treatment comparisons; this is not 352 independent builds.

Real in-memory server Worlds, canonical combat bootstrap, native abilities/Runes, 100 ms ticks, fixed seed sets and a 180-second cap were used. Farming stops at first death; there is no respawn. Boss success requires dungeon cooldown state. Mastery and ownership are synthetic and qualified by the existing survey helper. No economy, human play, production telemetry or optimal-build inference is made.

The initial main run was interrupted after 35 rows when matrix review found an invalid T4 Swamp destination. It is excluded. The corrected matrix uses Trench/Graveyard and passed all 112 cells through preparation before measurement. Preflight output directories contain no combat evidence. No other agent's process or output was changed.

## Paired results

| Change | Paired cases | Deaths before → after | Kills before → after | Finding |
|---|---:|---:|---:|---|
| Force 18 → 22% damage | 24 | 10 → 10 | 95 → 94 | All eight matched boss wins become faster; farm work is essentially flat |
| Scout 12 → 18% damage | 16 | 7 → 7 | 53 → 46 | Faster boss wins, mixed farm routing/outcomes |
| Scout fresh-seed farm expansion | 16 | 8 → 7 | 136 → 155 | Positive aggregate response, still variable by seed and biome |
| Sniper 25 → 30% damage | 16 | 7 → 7 | 54 → 57 | Four matched boss wins become faster; survival count unchanged |
| Juggernaut 20 → 30% HP | 8 | 0 → 0 | 15 → 15 | No clear-time or outcome benefit; baseline already very safe |
| Catalyst removes 15% damage penalty | 8 | 2 → 0 | 150 → 178 | Clearest improvement; retained |
| Controller potency 25 → 40%, main specialists | 8 | 1 → 1 | 125 → 120 | No useful improvement; reverted |
| Controller potency 25 → 40%, Frost | 4 | 1 → 1 | 50 → 51 | No useful improvement; reverted |

Force's Cave boss clear times improve 132.3 → 123.8 seconds for Squire, 131.1 → 126.2 for Striker, 126.4 → 122.6 for Slinger and 115.6 → 110.5 for Spirit. Sniper improves Slinger 121.7 → 113.8 seconds and Spirit 108.9 → 104.9. Both seeds produce the same boss times in these comparisons; do not treat duplicated deterministic outcomes as strong statistical replication.

Scout's initial Slinger Jungle runs illustrate why a damage buff need not improve every farm outcome: one seed improves 12 → 13 kills, while another shifts from surviving the cap with 10 kills to dying at 67 seconds with five. The fresh-seed expansion improves total work and saves one previously dying run. Changes to kill timing can alter later movement and engagement; these tests show the outcome, not a fully traced causal explanation for each routing change. Both sets are retained, not cherry-picked or pooled into a claimed universal improvement.

Retaining only the four selected changes gives a **composite** main result of 64 deaths and 1,338 kills, versus 66 deaths and 1,315 kills before, with 64 boss clears in both. It reuses 160 unchanged baseline rows and replaces 64 rows with retained treatments; it is not a fresh 224-case final run. Kills are work completed before death/cap, not equal-time DPS or economy throughput.

## What the roster needs

- **Tempered:** keep as the generalist reference. There should be situations where health plus modest damage beats a specialist.
- **Force/Sniper:** the retained buffs strengthen their offensive reason to exist without reintroducing compounded HP penalties. They do not solve Apprentice/Conduit survival in the fixed packages.
- **Scout:** mobility already has material value in some tested encounters. Retain the moderate offensive increase, but keep the mixed farming evidence visible. Mobility cooldown benefits still require an equipped mobility ability.
- **Bruiser/Duelist:** the T3 melee samples have no deaths for either core; Duelist clears the boss faster while Bruiser is a strong farming choice. Preserve the intentional melee health compensation. These are two fixed class packages, not proof of global equality.
- **Juggernaut:** no extra HP is justified by these samples. The baseline minimum HP was 72.9%; Squire never lost HP in its Mountain boss attempts, while Striker timed out with substantial boss HP remaining. Tanking has a real offensive cost; increasing HP again does not address that tradeoff. Broader threat coverage would be needed to settle the original redesign's Juggernaut budget.
- **Survivalist:** +Recovery scales an existing healing rate; it does not itself activate all of that rate during combat. Evaluate access and timing of recovery before increasing its multiplier or promising that it prevents burst deaths. No change retained.
- **Arcanist:** in the Frost specialist comparison it produces 76 kills/no deaths, versus Tempered's 71/no deaths and Controller's 50/one death. That does not justify a blanket buff. Technique usage and loadout fit still matter.
- **Accelerant:** improves some frequency-based packages, but the screen does not establish a broad shortfall. Preserve its speed/individual-hit tradeoff pending more targeted evidence.
- **Catalyst:** the requirement for existing on-hit investment is already a meaningful cost. Removing the additional generic damage penalty improves both tested specialist packages: Apprentice 58 → 74 kills with two deaths removed; Slinger 92 → 104 with no deaths in either arm. The same packages with Tempered produce 74 and 99 kills respectively. This is a healthier competitive result, not evidence that Catalyst should win on builds lacking on-hit damage.
- **Controller:** the stronger coefficient barely changes the Frost outcome and does not close the gap to Tempered or Arcanist. Its limited registered effects and actual debuff uptime deserve an identity/coverage audit. Do not simply scale every status: many are class resource clocks or unrelated effects. A separate DoT-amplifying core would serve poison/burn builds without muddling Controller's control/debuff role.

## New concepts and validation

The strongest next concepts are **Warden** (existing Guard potency, no free defenses or initial cooldown reduction) and **Affliction** (existing outgoing DoT damage). See the patch notes for constraints and a provisional test value. Neither has been implemented or measured. Keep melee-exclusive health cores distinct, and require each new specialist to give up another core's offense or durability.

Final checks are recorded in VALIDATION.md. The range-gate regression test originally required one particular balance distribution to leave an unrestricted T3 winner. Higher Sniper damage invalidated that assumption. It now checks the same selector contract using a deliberately strong unrestricted fixture, while preserving all real-core eligibility checks. Signed damage-penalty scoring is likewise tested with an explicit penalty fixture now that Catalyst no longer has one. No production selector logic was changed.

`RESULTS.json` contains summaries, terminal completion counts and SHA-256 receipts for raw rows/manifests. Raw data and excluded preliminary files remain locally under this report directory. Each manifest records the base revision, tracked source diff, complete runner source/hash, cells and hitbox hash. Recipe modules are imported once before a process writes its manifest; subsequent source edits for another process do not hot-reload into an already-running baseline. Applied passives are also captured per row. This is an iterative local experiment, not a sealed production campaign.
