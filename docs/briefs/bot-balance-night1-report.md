# Night 1 — T1 boss coverage, dual-Guard Swamp comparison, T2 progression

Status: stopped at the first B infrastructure/evidence failure. This is the durable operator ledger and morning handoff
for the bounded program in `bot-balance-night1-operator-packet.md`.

## Session ledger

| Field | Value |
|---|---|
| Session started | 2026-09-13T01:37:23.7012421+02:00 |
| Deadline | 2026-09-13T10:37:23.7012421+02:00 |
| Frozen revision | `0514ad0139b7c4d6a48b3512ae496857de8f4164` |
| Frozen source tree | `9cd86a5ab18a3f1f110bd6e3f7e1f3be8cd92060` |
| Preflight | PASS on clean detached worktree `C:\Users\osaif\AppData\Local\mmo-idle\validation\q2-06c0818a` at the frozen revision |
| Preflight scope | Bot/server typechecks, route/entry/readiness/behavior/boss tests, experiment and experience harness tests; infrastructure validation only |
| Invoking checkout | `develop` at `7e73b48f70e273ba4f767c1257d86cd4c207d1b4`; two pre-existing untracked human-playtest directories preserved; uncommitted changes are excluded from frozen images |
| Worker policy | One active worker and one active manifest; no global cross-cohort queue |
| Reward policy | `25x` for all phases; not canonical economy evidence |
| Retry policy | `fastBossRetry=false`; no automatic or unplanned retries |

An older out-of-scope manifest had a failed supervisor record with its worker
already exited and its storage containers still present. It was inspected only;
it was not resumed, rewritten, cleaned, or counted in this session.

| Phase | Planned | Manifest ID | Started | Terminal | Unstarted | Stop reason / disposition |
|---|---:|---|---:|---:|---:|---|
| A — earned armor preparation | 1 | `20260912t233824z-striker-campaign-night-kit-t1` | 1 | 1 | 0 | completed validly; handoff snapshot sealed |
| B — Swamp expose vs dual Guard | 6 | `20260912t235144z-striker-campaign-night-swamp-t` | 4 | 6 | 2 | stopped after case 3 entry/evidence failure; case 4 interrupted |
| C — remaining T1 bosses | 12 | unstarted | 0 | 0 | 12 | not created; program stopped on B failure |
| D — six-class T2 screen | 6 | unstarted | 0 | 0 | 6 | not created; program stopped on B failure |
| **Total** | **25** |  | **5** | **7** | **18** | program stopped; no cleanup or retries |

## Evidence rules

The frozen manifest, source/tree/image/tooling/runtime hashes, input hashes,
eligibility flags, terminal agreement, run counts, and exact artifact paths will
be copied here as each phase is sealed. Gameplay losses, deaths, and valid
timeouts remain evidence; entry/assertion failures, isolation loss,
infrastructure failures, or lost evidence stop the active manifest and program.
The accelerated `25x` results are progression/combat evidence only, never
canonical economy evidence. No balance or gameplay values are changed by this
operation.

## Phase A

Manifest: `20260912t233824z-striker-campaign-night-kit-t1`.

| Field | Value |
|---|---|
| Artifact root | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t233824z-striker-campaign-night-kit-t1` |
| Source revision / tree | `0514ad0139b7c4d6a48b3512ae496857de8f4164` / `9cd86a5ab18a3f1f110bd6e3f7e1f3be8cd92060` |
| Image / build ID | `sha256:415c4b288b44f59b9405c055673bc9ce433889d5d36dd3c8219b8f782575a513` / `9a647c402126687255d1d881` |
| Manifest SHA-256 | `4ad3808d71e0952f4c7aa270947ee9aa7877a5bf36858c2a5a73070780af0587` |
| Tooling / runtime hash | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` / `8e48ec4278c22f820a90de56886aafeb25e34f0e780411d763bb38ae60259c40` |
| Input | V1d `snapshot-b.json`, SHA-256 `7917f16cd5ad24534934472a4f9a57e35d0fb40c88b21fd706dd099ea12f5f29` |
| Configuration | `smoke-isolated`, 1 worker, 1 run, intended policy, 25x, `maxRunMs=1200000`, `fastBossRetry=false`, automatic retries `0` |
| Initial state | queued; launched once; completed |

The input is mounted/copied unchanged. The completed run must produce the
earned `Mountain Vest +5` kit, `night:kit-build` and `night:kit-ready`,
T1/root-only/GM30, and zero boss clears before phases B/C may reuse its exact
snapshot file and hash.

### A result

| Field | Value |
|---|---|
| Terminal agreement | `completed` / `bot_completed`; started `2026-09-12T23:41:02Z`, ended `2026-09-12T23:48:28Z`, duration `438399 ms` |
| Summary | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t233824z-striker-campaign-night-kit-t1\runs\001-striker-campaign-night-kit-t1-intended-r01\artifacts\striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2\summary.json` |
| Handoff snapshot | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t233824z-striker-campaign-night-kit-t1\runs\001-striker-campaign-night-kit-t1-intended-r01\artifacts\striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2\snapshot-b.json` |
| Handoff snapshot SHA-256 | `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Readiness | profile/spawn `PASS` (213 checks); `night:kit-build` and `night:kit-ready` each observed once; 14/14 route steps completed |
| Final progression | T1, GM30, Clearing 4 / Plains 6 / Forest 6 / Swamp 6 / Mountain 6 / Cave 6; boss attempts 0, boss victories 0 |
| Final build | Chaotic Axe +5, Plains Vest +5 equipped, Swamp Charm +5, Plains Boots +5; Mountain Vest +5 earned and retained in inventory for B/C |
| Final wallet | essences `{ red: 11502, blue: 10191, green: 1559, yellow: 10601, purple: 303 }`; catalysts `{ swarming: 0, alacrity: 0, heavy: 0 }`; progress `{ fortified: 59, swarming: 22, heavy: 4, dominion: 11, alacrity: 2 }` |
| Eligibility | isolation `isolated`, treatment `valid`, `canonical=false` because of 25x, combat/economy evidence `false` |

The exact handoff snapshot above is the sole `$kitSnapshot` for B and C. It is
not edited or relabeled; its `snapshotKind` is `tier2-handoff`, its internal
revision is the frozen SHA, and `canonicalAtCapture=false` is retained.

## Phase B

Manifest: `20260912t235144z-striker-campaign-night-swamp-t`.

| Field | Value |
|---|---|
| Artifact root | `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t235144z-striker-campaign-night-swamp-t` |
| Source revision / tree | `0514ad0139b7c4d6a48b3512ae496857de8f4164` / `9cd86a5ab18a3f1f110bd6e3f7e1f3be8cd92060` |
| Image / build ID | `sha256:415c4b288b44f59b9405c055673bc9ce433889d5d36dd3c8219b8f782575a513` / `9a647c402126687255d1d881` |
| Manifest SHA-256 | `0b79b10ce2a61d432c634160bf1e4ffed09b4e4a5017f1aa84d4397d04c0617b` |
| Tooling / runtime hash | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` / `8e48ec4278c22f820a90de56886aafeb25e34f0e780411d763bb38ae60259c40` |
| Study | factor `route`; arms `expose-cleanse`, `dual-guard`; sealed order `expose-cleanse-r1`, `dual-guard-r1`, `dual-guard-r2`, `expose-cleanse-r2`, `expose-cleanse-r3`, `dual-guard-r3` |
| Input | copied `inputs\tier-entry\snapshot-b.json`, SHA-256 `1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755` |
| Configuration | `smoke-isolated`, 1 worker, 6 runs, intended policy, 25x, `maxRunMs=900000`, `fastBossRetry=false`, automatic retries `0` |
| Initial state | six queued; launched once; sequential execution required |

Each case was required to pass its arm-specific readiness marker and exact final
build before the one authored Swamp dungeon cycle. Results are reported per arm
without survivor-only timing ranking.

### B terminal cases

| Case | Arm / readiness | Terminal disposition | Guardians | Boss result | Deaths | Ability / damage-healing evidence |
|---|---|---|---:|---|---:|---|
| `001-expose-cleanse-r1` | expose-cleanse; `night:swamp:ready` | valid gameplay loss: `partial` / `bot_partial`; profile/spawn `PASS` (215 checks), isolated, treatment `valid` | 6/6 cleared in `66060 ms` | Named victim Grave Toadeater; one attempt, no authoritative clear; terminal/last HP fraction `18.9048%`; total attempt `196180 ms`, boss combat `41032 ms` | 1, poison DoT death | Expose 7, Cleanse 8 (4 swamp-poison + 4 Grave Toadeater poison removals); player damage `2885`, damage taken `928`, healed `698`; Bile Pool 3 contacts / 18 damage; separate lowest-HP sample not emitted |
| `002-dual-guard-r1` | dual-guard; `night:swamp-dual:ready` | valid gameplay success: `completed` / `bot_completed`; profile/spawn `PASS` (215 checks), isolated, treatment `valid` | 6/6 cleared in `61054 ms` | Named Grave Toadeater kill plus boss-attempt `victory`; progression `bossesCleared=[swamp:1]`; terminal HP `0%`; total attempt `209203 ms`, boss combat `58055 ms` | 0 | Second Wind 5, Cleanse 9 (3 swamp-poison + 6 Grave Toadeater poison removals); player damage `3111`, damage taken `972`, healed `824`; Bile Pool 3 contacts / 21 damage; separate lowest-HP sample not emitted |
| `003-dual-guard-r2` | dual-guard; no readiness marker | entry/evidence failure: worker `bot_process_exit_without_summary`; profile `PASS` (113 checks) but spawn `FAIL` (102 checks) on `live-full-hp` and `live-no-buffs`; no gameplay summary | — | no boss attempt evidence | 0 | no abilities or gameplay evidence; bot log records refusal to produce evidence from the invalid spawn; preserved artifact/log path below |
| `004-expose-cleanse-r2` | expose-cleanse; `night:swamp:ready` | started but interrupted by required manifest stop: `cancelled` / `worker_received_sigterm`; profile/spawn `PASS` (215 checks), isolated, treatment `valid`; no gameplay failure classification | not reached | authored boss-attempt step started at `3607 ms`, but no guardian or boss combat result before interruption | 0 | no ability activations; `18656 ms` partial artifact retained |
| `005-expose-cleanse-r3` | expose-cleanse; no readiness marker | `cancelled` / `user_cancelled_before_start`; unstarted | — | no evidence | — | no artifact; not a gameplay failure |
| `006-dual-guard-r3` | dual-guard; no readiness marker | `cancelled` / `user_cancelled_before_start`; unstarted | — | no evidence | — | no artifact; not a gameplay failure |

The boss victim is corroborated by the death record (`isBoss=true`) and the
named damage sources; the ordinary kill stream’s hardcoded `isBoss=false` flag
is not used as the clear criterion. The run ended at the authored single
attempt after death and did not authorize a retry. For the dual-Guard victory,
the named `Grave Toadeater` kill, boss-attempt victory, and progression clear
corroborate the authoritative result despite the same kill-stream flag.

### B per-arm disposition

| Arm | Planned | Started | Valid gameplay cases | Successes | Deaths | Invalid/interrupted/unstarted |
|---|---:|---:|---:|---:|---:|---:|
| expose-cleanse | 3 | 2 | 1 | 0 | 1 | 1 interrupted, 1 unstarted |
| dual-guard | 3 | 2 | 1 | 1 | 0 | 1 entry failure, 1 unstarted |

These are dispositions, not a winner claim: the arm comparison is censored by
the required stop after case 3 and has one valid gameplay case per arm.

### B stop evidence

The cohort report is
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t235144z-striker-campaign-night-swamp-t\cohort-summary.json`.
Case 3’s preserved bot log is
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t235144z-striker-campaign-night-swamp-t\runs\003-dual-guard-r2\bot.log`.
The same run’s worker result records exit code `1` and
`bot_process_exit_without_summary`; its bot log records the two spawn errors.
Case 4’s partial summary and events remain at
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t235144z-striker-campaign-night-swamp-t\runs\004-expose-cleanse-r2\artifacts\striker-campaign-night-swamp-t1-intended-2026-09-13T00-00-38-926Z-4efd3a92`.

The program stopped before C or D creation. Therefore all 12 C cases and all 6
D cases are explicitly unstarted, not gameplay failures or censored outcomes.

## Morning handoff

No gameplay, route, build, runtime, assertion, economy, or balance values were
changed by Night 1. The Night 1-specific workspace edits are this report and
its `docs/README.md` index entry; additional concurrent tracked/untracked
workspace changes appeared after session start and were left untouched.
Experiment artifacts remain outside the repository. The strongest
observed signal is one valid Swamp victory with dual Guard and one valid loss
with Expose/Cleanse, but the evidence window is not decision-complete because
the third case exposed a spawn-state/evidence failure. The next questions are to
diagnose and repair the snapshot spawn reset/validation path, then rerun only
under a new explicitly authorized packet; do not infer tuning from this censored
pair.
