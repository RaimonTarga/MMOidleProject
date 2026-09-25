# Iteration 02 results — surviving setups change the recommendation

Latest follow-up: [iteration 03 — T4 fast-end target around 50 minutes](../iteration-03/RESULTS.md). Earlier results below are retained as historical evidence.

2026-09-25. **T1 XP is restored. T2's first proposed increase was wrong for the tested supported builds. T3 now has useful positive evidence. T4 still varies too much to choose one universal correction from this sample.**

The user confirmed the essence target means **one mastered biome should fund all four ordinary gear slots at +3**, with +5 requiring roughly 50% more farming. This report keeps that target. No real-player database access or deployment occurred.

Primary comparison: [final matched pairs](PAIRS.md), using the isolated candidate and replacement frozen controls. Mutable-main controls are superseded; see the source-drift section below.

## Changes applied and tested

The isolated checkout remains `C:/Users/osaif/Documents/Claude/Projects/mmo-reward-candidate`, branch `codex/reward-mastery-candidate-01`. Current incremental XP budgets are **1,750 / 3,750 / 42,000 / 108,000**. T1 restores the original 1,750; T2 replaces the first candidate's 18,000 with 3,750 after the screen, followed by a separate confirmation batch. T3/T4 XP and the previous experimental essence and price settings remain unchanged. After the pacing runs, the T2 catalyst scalar is corrected from 5/18 to 4/3 (= original 5,000 / revised 3,750), preserving the original intended catalyst opportunity per XP segment. Other catalyst scalars remain unchanged. The fixed-loadout runs do not spend catalysts; their catalyst wallet quantities precede this correction and are not final reward-ledger evidence. This is not an adopted package: the T1/T2 prices still fail the funding target.

| Tier / supported setup | Baseline mastery | Tested candidate mastery | Decision |
|---|---:|---:|---|
| T1 Plains, developed Striker | 4.04–4.38 min | 4.04–4.38 min at 1,750 | Keep original XP. |
| T2 Desert, heavy Striker | 19.95–20.79 | 15.03–15.50 at 3,750 | Promising correction; 18,000 did not cap within 30 min. |
| T2 Desert, heavy Squire | 20.60–20.97 | 15.46–16.22 at 3,750 | Independent build supports roughly 3,500–4,000 for this encounter. |
| T3 Swamp, balanced Squire | 3.70–4.00 | 23.74–25.49 at 42,000 | Reasonable faster side of a rough 30-minute target. |
| T3 Tundra, heavy Squire | 5.90–6.23 | 35.10–36.91 at 42,000 | Reasonable slower side; keep 42,000 as a working center. |
| T4 Desert, heavy Squire | 4.35–4.59 | 48.76–49.00 at 108,000 | Around 130,000–135,000 is a conditional next budget. |
| T4 Tundra, balanced Conduit | 1.90–2.02 | 24.47–25.31 at 108,000 | Around 255,000–265,000 by linear throughput projection. |
| T4 Volcanic, heavy Striker | 1.54–1.57 | 15.37–16.74 at 108,000 | Around 385,000–425,000 by linear throughput projection. |

Ranges are two observed seeds per build, not population confidence intervals. The higher T4 budgets in the last column have **not been executed**. Class, equipment, node and biome differ between these setups; these comparisons cannot isolate a biome effect from a build effect. Do not install per-biome multipliers from this table alone. The earlier Trench Cadence screen also supports roughly 130,000 for that particular setup, but is a different fixture and equipment level.

In the original screen and confirmation, all **36 runs producing gameplay result files survived their observed windows**. The final primary comparison uses **16 matched pairs / 32 results**, with zero observed deaths, after replacing mutable-main controls. Thirty-two of those reach their full configured horizon; four Volcanic runs are runtime-censored after 54.6–71.0 simulated minutes, after mastery was already observed. The historical setups therefore address the main weakness of the first screen: its early deaths were not sufficient grounds to abandon later-tier pacing work.

## Essence and gear costs

These amounts include native-set acquisition/evolution plus upgrades; prior-tier +3 evolution inputs are assumed owned. The four-slot native reference set is a price benchmark, not the mixed-biome historical gear used to measure combat. Color balances remain distinct, and catalysts and Global Mastery can block purchases. No actual purchases are made in this iteration.

| Candidate fixture | Essence earned at mastery, summed | Reference full +3 cost, summed | Interpretation |
|---|---:|---:|---|
| T1 Plains | 286–289 | 590 | Candidate early upgrade prices are about twice the affordable budget. |
| T2 Desert, 3,750 XP | 443–448 | 2,412 | Candidate prices are about 5.4× the available budget. |
| T3 Swamp | 4,416–4,420 | 4,319 | Close: +3 funding at 23.07–24.94 min, +5 at 35.37–36.29 min. |
| T3 Tundra | 4,426–4,436 | 4,242 | Total quantity is close; missing other colors prevent full funding. |
| T4 Desert | 8,874–8,904 | 9,645 | About 92% of the total +3 benchmark; missing other colors also matter. |
| T4 Tundra | 9,030–9,049 | 8,485 | About 106–107% of total, but cross-color requirements remain. |
| T4 Volcanic | 8,966–8,983 | 8,576 | About 105% of total, but cross-color requirements remain. |

T3 Swamp is the strongest joint result: +5 essence funding takes **1.42–1.49× mastery time**, very close to the requested 1.5×, with no death during the 60-minute observation. Tundra and the T4 rows do **not** prove full funding merely because the summed quantity looks sufficient.

**Retract the blanket constraint that every tier's existing +5 lifetime price must be preserved.** That was an implementation choice in the original proposal, not a user requirement. With T1's correct mastery time, baseline Plains already funds +3 in 4.83–5.05 minutes, but +5 takes 11.68–12.61. Moving more cost into +1/+2/+3 and reducing income made its alignment worse. The candidate funds +3 at 8.80–8.95 minutes and +5 at 13.06–13.66.

Conditional next price tests, expressed as total four-piece budgets rather than per-item prices:

- **T1 Plains:** with candidate income, approximately **285–330 through +3 / 430–495 through +5**. With original income, approximately **300–365 / 450–550**. Preserve original XP; shorten the price tail. These are static options, not yet applied or purchase-tested.
- **T2 Desert at 3,750 XP:** approximately **440–480 through +3 / 660–720 through +5** would match observed quantities. The existing candidate's 2,412 / 3,617 cannot meet a 15-minute mastery goal on this fixture. Its base acquisition is 263, so this is mathematically feasible, but a large price change that needs additional biome/build and real-player evidence before broad application. Reducing essence further would move this fixture in the wrong direction.
- **T3:** retain the current joint candidate as the next reference. Swamp supports it; resolve the cross-color interpretation for other native sets and broaden supported builds.
- **T4:** slowing XP alone will make essence too abundant relative to +3 at the later cap. Once representative throughput is established, test coordinated XP and essence reward adjustments, or matching costs, so the quantity earned at mastery stays near a +3 budget. Do not simply raise XP to 260,000–400,000 globally while leaving essence untouched.

## What was run, including exceptions

See [protocol and exact historical source paths](README.md). There were **44 scheduled cases**: a 32-case screen and a 12-case confirmation. Repeated baseline rows in confirmation are reproducibility checks, not new independent players.

- **36 gameplay result files**, zero observed deaths: 24 screen + 12 confirmation.
- **Four Jungle operational censors**: excessive pathfinding/collision runtime, stopped around 15 wall minutes. No completed pacing result; not classified as deaths. CPU profile and process-stop receipt are retained.
- **Four T4 Desert setup failures**: the initial preserved Striker setup cost 45 RP but resetting target mastery left a 44-RP budget. It never entered measurement. No ability was silently removed. Confirmation uses a different historical heavy Squire setup with 39 RP, which fits the same 44-RP entry budget and survives 90 minutes.
- **Four Volcanic partial results**: a three-minute soft wall budget stopped them after 54.6–71.0 simulated minutes. Mastery is observed, but later missing endpoints remain censored. A separate four-minute external watchdog was installed for excessively long individual ticks; it did not turn these partial runs into gameplay failures.
- Separate diagnostic runs are not counted in the 44-case comparison: a completed 60-second Jungle probe, an interrupted longer probe, and an interrupted CPU profile. A first profiler launch failed to resolve tsx from the root and was corrected to the server package directory. None is evidence for full mastery pacing.

Historical fixtures were selected for survival in both old seeds and active late-window killing. The screen validates their equipment/loadouts on the current source, then unlocks mastery progression and resets the tested biome to segment entry. It retains mature gear and known abilities, so it measures **conditional supported-build throughput**, not the time for a fresh player to earn the entire setup. That limitation remains important even when every measured bot survives.

## Artifacts and verification

- [Screen summary](screen/summary.json), [screen completion](screen/complete.json), [confirmation summary](confirmation/summary.json), [confirmation completion](confirmation/complete.json).
- Each batch retains its manifest, jobs, exact selected historical cells, per-run JSON/logs and progress snapshots. Runtime and horizon amendments are explicit; no old campaign artifacts were changed.
- `source-screen.json` identifies the initial screen gameplay/harness; `run-bot-survivors-original.ts.txt` preserves that harness. `source-confirmation.json` identifies the subsequent bounded harness and T2 XP revision. The bounded harness was also used for screen jobs started after the Jungle operational censors, with unchanged gameplay source.
- Final game-config and reward-multiplier focused tests passed. Final project/benchmark typecheck passed. Candidate `git diff --check` passed. No additional full-suite run: candidate 01's documented 271/275 result and four historical-price-contract failures still apply; this iteration does not claim a green full suite.
- `candidate-iteration-02.patch` captures current source changes against the candidate base. Existing-character XP migration is still unimplemented. No merge or deployment.

The next useful experiment is a crossed T4 build/node comparison to separate class and biome throughput, alongside explicit T1/T2 price candidates. The one-biome funding interpretation is now confirmed; no further user clarification is required to prepare that work.

## Baseline source drift and control replacement

The final source audit detected concurrent changes in the main checkout's volcano.monsters.ts and nodeFeatures.ts. The initial screen source capture itself already contained a hazard-file change absent from the isolated candidate. Treat ALL main-checkout baseline rows as superseded for causal comparison; do not infer a treatment effect from those rows. Candidate source remained isolated and its absolute timings are retained.

A detached baseline checkout at ff98ba45 was created at C:/Users/osaif/Documents/Claude/Projects/mmo-reward-baseline. It restores the initial visual reward-event patch and exact source bytes. Windows checkout line endings required byte normalization; the initial two preparation parity checks did not execute combat. The hazard reference is explicitly the isolated candidate's original non-economic hazard source, rather than the already-drifting main file. frozen-controls-final/source-parity.json records the successful per-file parity check. Sixteen unique relevant controls are rerun there; the completion artifact checks source hashes again. Original observations and failed preparation receipts remain untouched.

Use frozen-controls-final/summary.json for baseline comparisons. The full audit now comprises the original 44 cases plus 16 replacement controls; those controls are replacements, not extra independent players. See source-drift-audit.json and source-final.json for provenance. The candidate-final.json and candidate-iteration-02.patch describe current implementation, including the post-pacing catalyst correction.

Frozen controls completed 16/16 with zero process failures and an empty source-drift list. Only Volcanic baseline mastery changed materially versus the discarded controls (now 1.54–1.57 minutes); the final table uses these frozen values. All other listed baseline mastery values were reproduced. The complete primary comparison is PAIRS.md / paired-final.json.
