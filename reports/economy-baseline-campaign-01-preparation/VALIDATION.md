# Preparation validation

2026-09-24; source `ff98ba4513cb9fcb1e5752acfd56495268aff416`.

| Check | Outcome | Evidence boundary |
|---|---|---|
| Initial Git state | Clean `develop`; exact reference SHA | Local committed source, not a remote fetch |
| Read-only preparer | PASS; 140 normal nodes, 1,332 R rows, 32 P rows | Imports static production registries; no campaign simulation |
| External snapshot inventory | 784 files inspected/hashed; 225 preliminary candidates | Standard `%LOCALAPPDATA%/mmo-idle/experiments` only; duplicates retained; preliminary metadata does not certify eligibility |
| Eight predeclared historical T2 inputs | REJECTED 8/8 | Current `tierEntryProfileFromT1Snapshot` rejects Rune ownership mismatch; preserved in `t2-input-validation.json` |
| `pnpm bot:preflight` | PASS | Bot/server typechecks, 17 focused TS test scripts, experiment and experience runner tests; noncanonical infrastructure validation |
| Packet integrity and structure | PASS | JSON parses; hashes match; unique case IDs; 4×4×2 P design; all R targets normal and at/below player tier; all launch flags false |
| `git diff --check` | PASS | Whitespace check |
| Full `pnpm test` / full workspace typecheck / build | Not run | No production changes; broader suite not claimed |
| Live restore/resource/ledger qualification | Not run | Required before any execution seal |
| Measured campaign | Not run | No economy or human-playtest pacing conclusion |

An initial preparer typecheck rejected `import.meta` under the bot's module configuration; it was replaced with the project's CommonJS-compatible `__dirname` before the successful final preflight. No gameplay changes were made to obtain the pass.

General preflight success does not override the exact input rejections or qualify missing T3/T4 routes. The “actual earned T3 checkpoint” test log is an infrastructure regression fixture, not new evidence of an eligible four-profile campaign input inventory.
