# Final candidate validation

2026-09-25. All checks below passed on the final gameplay implementation. Subsequent edits only changed documentation, comments, report generation and whitespace.

- 15 focused server test files, each run with `pnpm --filter @mmo-idle/server exec tsx --conditions=development test/<name>.test.ts`: defenseRedesign, cores, coreRelicIntegration, hudStatusTooltips, nodeFeatureRegenSuppression, barrier, abilityGuardsAndReach, coreAuthoring, coreRangeGate, coreCombat, coreMechanics, stances, stancesUnplaced, mountainT2ChargedDefenses, desertPairs.
- Repository-wide `pnpm typecheck`, including the bench TypeScript configuration: exit 0.
- `pnpm build` for shared, client, admin and server, including hitbox artifact baking: exit 0. Vite emitted bundle-size warnings.
- `git diff --check`: passed.
- All runs used for final comparisons have matching terminal completed/expected counts, matching raw-row counts and unique case/seed keys. Raw SHA-256 receipts are in FINAL-RESULTS.json.
- All 30 armor definitions exported successfully to the inventory.

Logs: `../defense-final-check-summary.txt`, `../final-check-*.log`, `../defense-typecheck-complete.log`, `../defense-build-complete.log` in this worktree. Earlier failed/preliminary check logs are retained; the final focused check set supersedes outdated-value assertions that were updated with the candidate.

Not run: full test suite, browser verification, human playtest, production telemetry replay, acquisition/economy simulation. The wider redesign is held for balance reasons despite passing these checks.
