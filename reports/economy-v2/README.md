# Economy v2 delivery

Implemented candidate on `codex/economy-v2`, isolated from the original working checkout. Base: `ff98ba4513cb9fcb1e5752acfd56495268aff416`. No production deployment and no dynamic economy campaign. The attached handoff supplies implementation guidance; the user's later decisions control fresh-character scope and the premium-tail target.

## Reports

- [Current implementation and design decisions](../../docs/economy-current-state.md)
- [Candidate projection](ECONOMY_V2_CANDIDATE.md): projected prices, original route choices.
- [Post-implementation static validation](ECONOMY_V2_STATIC_VALIDATION.md): actual public prices, corrected acquisition routes, full price catalogues, representative old/new items and monsters, mastery income, 108 opportunity checks.
- `baseline.json` and `live.json`: exported production static data and route demand inputs; JSON companion reports contain calculated nodes/checks/demand. Snapshot `source` is the base HEAD at export, not a claim that uncommitted changes were part of that commit. `source-manifest.json` identifies the delivered implementation files by SHA-256.

The source model preserves authored biome identity, rewards, enemy stats and upgrade benefits. All 108 static comparisons pass: current-tier essence/XP efficiency beats lower-tier comparisons by at least 25 percent, and best same-family catalyst efficiency by at least 10 percent, for the documented work proxies. This is not measured hourly income. The model excludes survival, evasion, overkill, travel, ecology and class-specific throughput.

## Affordability summary

Representative primary-item essence demand divided by gross zone-mastery essence:

| Tier | Base through +3 | Base through +5 |
|---|---:|---:|
| T2 | 0.34-0.57 | 0.78-1.31 |
| T3 | 0.49-0.59 | 1.13-1.37 |
| T4 | 0.51-0.61 | 1.16-1.41 |

These support affordable +3 and a moderate +5 premium for most lines. Cheap T2 items and some later lines finish earlier than the 25-50% premium target; within-tier price identity is preserved. Ratios are gross currency projections, not measured times, and exclude other purchases and cross-colour travel. Existing global-mastery gates still control upgrade availability.

## Reproduce static validation

From this worktree, after installing dependencies:

```powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../tools/economySnapshot.ts ../reports/economy-v2/live.json
python tools/economy-v2-audit.py reports/economy-v2/baseline.json
python tools/economy-v2-audit.py reports/economy-v2/baseline.json reports/economy-v2/live.json
```

The live validation compares every public recipe database and helper-derived upgrade cost with the independent candidate projection, and verifies T1 normal-node payouts remain unchanged. It exports literal payable prices; authoring-file prices alone are no longer payable T2+ prices.

## Campaign 02 rebase requirements — deferred

The user explicitly deferred the experiment. No campaign 02 is sealed, qualified or launched by this change. The existing campaign 01 preparation and frozen artifacts are untouched. Do not run its old source identities, literal wallets or checkpoints against this candidate.

When requested, prepare `economy-baseline-campaign-02` from the candidate's final source identity and newly earned fresh-character checkpoints. Retain milestone/bottleneck telemetry, but regenerate prices, purchase budgets, route hashes, XP targets, entry-state identities, wait limits and terminal receipts. Preserve earned wallet carryover inside each fresh campaign; do not migrate old saves. Use the corrected predecessor top-up plan and separately account for T1 top-up spending during T2 acquisition.

Stage 1 should compare fixed earned characters on Mountain chains, Cave/Swamp old/current, Jungle T2/T3/T4, Desert/Tundra/Volcanic controls and same-colour alternatives. Use ordinary rewards and 20 simulated minutes per cell, timeScale <= 2, measuring per-colour essence/hour, uncapped XP/hour, per-family catalysts/hour, kills/hour and deaths/hour. Targets remain +25 percent essence/XP and +10 percent same-family catalysts where comparable. Report ecological exceptions rather than silently changing the whole curve.

Only after Stage 1 should independent T1-T4 pacing runs be frozen. Measure mastery, +3 and +5 times; isolate essence, catalyst and mastery gating; measure current-content farming preference and total comparable-loadout effort. T3/T4 fragments in these reports are not canonical full-tier routes. Do not add reward-multiplier A/B arms.

## Verification

Final typecheck and production build passed. All 108 static opportunity comparisons passed, with exact public-price/projection parity and no monster, biome, modifier or mastery-cap drift. Focused economy, reward-zero, T2 acquisition and T2-T4 progression checks passed.

The full `pnpm test` invocation completed **274/277**: three fixtures still assumed old prices or XP thresholds. Updated `catalystRekey.test.ts`, `tierEntryBootstrap.test.ts` and `gameConfig.test.ts`; all three passed their focused reruns. Thus every discovered test file has a passing result on the final relevant implementation, but the original full invocation remains recorded as failed rather than being relabeled green. A second full suite was not run. See [verification receipt](verification.json) for all file outcomes and reruns.

`git diff --check` passed. Build reports the existing Vite chunk-size advisory. No browser/live-play evidence is claimed. The original checkout retains its pre-existing dirty docs index and campaign-01 preparation files unchanged.
