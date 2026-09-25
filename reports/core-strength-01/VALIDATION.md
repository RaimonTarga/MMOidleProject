# Core pass validation

- Six focused regression files passed: cores, coreRelicIntegration, coreAuthoring, coreRangeGate, coreCombat, coreMechanics.
- The first coreRangeGate run failed on assumptions that an unrestricted core must win at the current authored values and Catalyst must retain a damage penalty. The test now verifies those selector/scoring contracts with explicit fixtures; all real eligibility assertions remain. Its final rerun passed (`reports/core-final-coreRangeGate-recheck.log`). No production selector change was made.
- Repository-wide `pnpm typecheck`, including bench configuration: exit 0.
- `pnpm build` (shared/client/admin/server and hitbox baking): exit 0. Vite emitted bundle-size warnings.
- Corrected main preflight: 112/112 cells prepared successfully. Frost preflight: 6/6 cells prepared successfully.
- Seven valid runs have matching completed/expected/raw counts and unique case/seed keys: 352 total completed observations. Paired manifests have identical complete cell definitions and hitbox hashes.
- `git diff --check` and staged whitespace validation passed.

The full test suite, browser/human playtest, production telemetry, acquisition and economy were not tested. All encounter testing excludes Volcano. No merge, push or deployment was performed.

Source base: `9159de97`. `SOURCE-FILES.json` records final source hashes for this pass. `RESULTS.json` records raw-row and manifest hashes; raw data and logs remain local. The initial 35-row interrupted run is excluded and preserved.
