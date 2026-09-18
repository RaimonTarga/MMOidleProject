# Night 5 report — launcher failure before first observation

Status: failed before survey start. The exact sealed Night5 launcher was
executed once, sequentially, from the main checkout on 2026-09-16 UTC. It
created the prescribed detached source worktree and installed dependencies,
but the first Mountain child process failed before the survey initialized.
This report contains no combat, farming, balance, economy, or playtest
evidence.

## Decision summary

- The launcher identity checks that ran passed for the frozen revision, frozen
  source tree, tracked-clean detached worktree, and hitbox artifact hash.
  The definitions input was recorded, but no block manifest was produced, so
  the definitions audit and post-run verifier did not run.
- The Mountain process started and exited with code 1 after 83ms. Node 22.16.0
  rejected the Windows `C:\...` path supplied to its `--import` loader as an
  unsupported ESM URL scheme. The frozen runner then asserted
  `Runner failure; stop without retry` as required.
- Zero of 524 cells and zero of 1,572 observations produced survey artifacts.
  All 1,572 observations are unstarted; the remaining five blocks were never
  launched.
- No `index.json`, `night5-audit.json`, `verification.json`, species samples,
  event streams, or block completion file exists. There are no medians,
  deaths, censors, casts, incoming-damage, exposure, pursuit, T4, or sustain
  findings to interpret.
- No source edit, balance patch, retry, adaptive build, service, database,
  browser, or preparation rerun was made. No production adoption or
  playtest-readiness decision is returned.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-night5-operator-packet.md](<C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-night5-operator-packet.md>) |
| Frozen runtime revision | `7f9ab446dc9ef25bd25b37c9475848185bcc0e6a` |
| Frozen source tree | `d6169eb7728f81c7f5194d836db073f88af6e8bc` |
| Definitions input | `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0` (recorded; not block-audited) |
| Hitboxes | [hitboxes.json](<C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json>) |
| Hitboxes SHA-256 | `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83` |
| Detached source worktree | [night5 source](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/source>) |
| Results root | [night5 results](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/results>) |
| Batch manifest | [batch-manifest.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/results/batch-manifest.json>) |
| Operator ledger | [operator-ledger.jsonl](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/results/operator-ledger.jsonl>) |
| Operator exit | [operator-exit.json](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/operator-exit.json>) |
| Mode / timestep / planned window | run / 100ms / packet-defined per block |
| Seeds | 26003, 28001, 30011 |
| Synthetic / economy | true / economyEligible=false (packet design; no observations completed) |

The launcher recorded `started=2026-09-16T22:05:00.836Z` in the batch
manifest and `ended=2026-09-16T22:05:00.9558927Z` in the operator exit file.
That 119ms is the launcher interval after batch setup, not simulated time;
checkout and offline dependency installation completed before it.

## Block accounting

`Started` below means survey observations with a block artifact, not merely a
child process attempt. `Full`, `dead`, and `censored` are observed artifact
counts; because no observation initialized, none can be interpreted as a
survival outcome. `Unstarted` is the exact remaining observation budget.

| Block | Planned cells / observations | Block process | Started | Full | Dead | Censored | Unstarted | Wall window / outcome |
|---|---:|---|---:|---:|---:|---:|---:|---|
| mountain | 80 / 240 | launched; exit 1 | 0 | 0 | 0 | 0 | 240 | 22:05:00.839–22:05:00.922Z; runner failure before manifest |
| t4a | 84 / 252 | not launched | 0 | 0 | 0 | 0 | 252 | stopped after Mountain failure |
| weapons | 144 / 432 | not launched | 0 | 0 | 0 | 0 | 432 | stopped after Mountain failure |
| t4b | 84 / 252 | not launched | 0 | 0 | 0 | 0 | 252 | stopped after Mountain failure |
| sustain | 48 / 144 | not launched | 0 | 0 | 0 | 0 | 144 | stopped after Mountain failure |
| t4c | 84 / 252 | not launched | 0 | 0 | 0 | 0 | 252 | stopped after Mountain failure |
| **Total** | **524 / 1,572** | **queue stopped** | **0** | **0** | **0** | **0** | **1,572** | **no batch-ended.json** |

The Mountain ledger entry is the only block outcome:

```json
{"block":"mountain","code":1,"timedOut":false}
```

There is no `budget-exhausted.json`, `stopped.json`, block `manifest.json`,
`index.json`, or `verification.json`. The launcher stopped on an unexpected
runner error, not a wall ceiling, RSS guard, block budget, death, or censor.

## Failure evidence

The raw [Mountain log](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/results/mountain.log>)
ends with:

```text
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data, and node are supported by the default ESM loader. On Windows, absolute paths must be valid file:// URLs. Received protocol 'c:'
Node.js v22.16.0
```

The frozen [night5-run.mjs:21](<C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-20260917/source/scripts/night5-run.mjs:21>)
constructs the TypeScript child command with `resolve(source,
'server/node_modules/tsx/dist/loader.mjs')`. On Windows that resolves to a
`C:\...` string, which Node interprets as the `c:` URL scheme when passed to
`--import`. The failure is therefore a launcher/platform compatibility issue,
not a combat or balance observation. The frozen source was not edited to work
around it, and this root is not retried.

## Identity, audit, and metric boundary

The launcher successfully verified the requested revision and tree, confirmed
the detached worktree had no tracked modifications, and matched the supplied
hitbox SHA-256 before writing `batch-manifest.json`. The required
`night5-audit.json` could not be produced because `ttkSurvey.ts` never reached
its first invocation. The generic reporter was not run.

Consequently, the packet-defined estimator has no eligible seed medians. No
species TTK or kill counts, casts started/fired, incoming damage, or raw
`index.json.targets` exist. The following required interpretations are all
unavailable rather than zero:

- Mountain paired seed/node/class deltas, minimum HP, player-pursuer peaks,
  3+ pursuer seconds, late joiners, recovery interruptions, outgoing gaps, and
  final 10s/30s damage sources.
- The T4 seven-biome/species map across the 18 specializations, rare or
  unreached species, short-fight pressure spikes, and role-specific candidates.
- Sustain first-five-minute versus remainder pressure, recovery accumulation,
  environmental/DoT sources, and inactivity.
- Jungle wall time, maximum tick time, and simulated seconds.

No primary duration estimate can be formed, and no survivor-selection or
censoring analysis is applicable. This failed launch must not be pooled with
Night4, Durability20, or any other packet.

## Finite worklist for planner review

1. **Mountain treatment versus stat decision:** no decision. Keep the Cave
   boots versus Mountain boots and ranged orbit versus no-orbit question open;
   do not tune Mountain attack or infer direct-melee exposure from this run.
2. **T4 numerical candidates:** none returned. The seven-biome T4 roster and
   all three specialization branches remain untested by Night5.
3. **Sustain candidates:** none returned. No safety claim may use inactive time
   because no sustain observation ran.
4. **Named tooling exception:** repair and independently validate the frozen
   runner's Windows `--import` path handling before any separately authorized
   future packet. That is a tooling prerequisite, not an automatic retry or a
   production change.
5. **Build/class exceptions:** the standardized T4 builds, weapon swaps,
   Mountain boot tradeoff, and class/ability interactions remain unknown and
   must stay separate from mob balance review.

All raw Night5 artifacts, the failed ledger, the operator exit, and the clean
detached source worktree are retained at the paths above. No production
adoption, automatic extra experiment, or readiness declaration follows from
this report.
