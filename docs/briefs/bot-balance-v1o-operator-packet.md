# V1o — Pursuit counterplay and biome pressure diagnostics

Post-run erratum, V1p preparation: shared accounting gives27RP control and31RP
with Hamstring after removing travel rules, not the26/30 prose below. Both ran
legally within31RP. Historical execution scope/source remain unchanged; do not
rerun this closed packet. See [report](bot-balance-v1o-report.md).

Prepared 2026-09-14. User launches Luna; Astra prepares and reviews. No combat
cases executed during preparation. Read CLAUDE.md and operate only this packet.
No balance changes, adaptive builds, retries, extra cases or subagent dispatch.

## Purpose and frozen source

The user identified global anti-kiting acceleration omitted from the initial
V1n interpretation. It remains enabled throughout. Tundra now tests practical
countermeasures with Heavy and Chill active, replacing the proposed modifier
ablation. Volcano retains a body-count/Heat comparison. This is an in-memory
authoritative combat diagnostic, not a live bot campaign or farming validation.

Execution revision: `91690dd471b2bc3a94908c6465a2e2adc458e124`.
Tree: `ba3b70a59966ca6f4f1c253b5e79f56ab9730bff`.
Runner: `server/scripts/v1oDiagnostics.ts`.
Changes add isolated setup/telemetry and an optional hitbox artifact path; no
gameplay tuning. Diagnostic TypeScript check and full `pnpm typecheck` pass.
Setup-only validation of all eight arms passed with zero ticks at the frozen
source; retained at `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1o-preflight-final`.
This does not qualify combat execution. Full test suite was not run for this
preparation; no new gameplay mechanic was introduced.

Use the actual retained input, never the repository test fixture:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json`

SHA256: `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144`.
Each arm independently clones this GM78 Wisp checkpoint. Existing synthetic
entry/reward25 provenance remains. Diagnostic rewards are1x; ordinary intra-fight
XP/mastery changes are logged and must be reported if they affect later contact.
No diagnostic output is a progression checkpoint.

## Eight fixed cases

| Order | Arm | Fixed encounter / treatment |
|---:|---|---|
| 1 | volcano-single-no-heat | One Ember Scuttler, Alacrity, Heat removed |
| 2 | volcano-single-heat | Same, authored Heat |
| 3 | volcano-pack-no-heat | One Cinder Hound + two Scuttlers, Alacrity, Heat removed |
| 4 | volcano-pack-heat | Same, authored Heat |
| 5 | tundra-control | One Heavy Glacier Bear, Chill active, inherited combat kit |
| 6 | tundra-hamstring | Same + Hamstring |
| 7 | tundra-boots | Same + T2 Desert Boots at+5 |
| 8 | tundra-both | Same + Hamstring and T2 Desert Boots at+5 |

All arms retain Sweep, Second Wind, Brace, Defensive and the inherited combat
movement/recovery rules. Remove both travel-only rules identically:26RP control,
30RP with Hamstring, within31RP budget. Hamstring is added, not substituted for
Sweep; ordinary armed-technique sequencing may limit its uptime. Desert mastery6
meets the T2 boots' mastery4 gate. Gear/ability changes are diagnostic grants,
not observed purchases or ordinary acquisition. Wisp is preserved for historical
comparison; future ranged validation should use the user's medium-range default.

All cases begin full HP/barrier, reset seed173 and100ms ticks. Real target-node
terrain/modifier is retained. Player starts220px left of node center; monsters
start at center with60px vertical spacing (normal spawn projection applies).
Actual initial positions are retained. All specified monsters begin engaged
using ordinary aggro initialization, including Hound charge. This deliberately
does not test natural pack recruitment. Natural population/repopulation is
suppressed. Static damaging features are excluded; this is not a lava test.
Tundra Chill and Volcano Heat-on ambient features remain active.

Current anti-kiting source has500ms grace, then a150 speed floor and uncapped
1.5/sec multiplier ramp. Chase time decays at2x while in attack reach; it does
not immediately reset on a landed hit. Hamstring multiplies movement after
this ramp. Desert Boots' bonus is conditional on moving away from an engaged
target. Never infer either effect from equipment alone. The user's intended
reset semantics have been queried; do not change them in this experiment.

## Operator procedure

1. Record setup UTC, Node/pnpm versions, source revision/tree and input hash.
   Create a NEW detached worktree at the frozen execution revision under a
   task-specific local experiment directory. Preserve the user's working tree.
   Install dependencies with `pnpm install --frozen-lockfile`; no lockfile edits.
   Do not start Docker, databases, the live server or a bot process.
2. The atlas files may be ignored build output and absent from the checkout.
   Copy only `client/public/assets/sprites.png` and `sprites.json` from the
   project checkout to the same paths in the isolated checkout after verifying:
   PNG `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22`;
   JSON `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156`.
   If unavailable/mismatched, stop; do not repack assets or substitute files.
3. From isolated repo root, set the process-local production environment and
   run a fresh setup-only preflight. Replace the path placeholders with the
   exact input above and NEW directories outside the checkout:

```powershell
$env:NODE_ENV = 'production'
pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1oDiagnostics.ts --preflight '<actual V1m snapshot path>' '<new preflight directory>'
```

4. Require exit0, eight `setup-only` results and `complete.json`. Verify input
   and atlas hashes in `manifest.json`; generated hitbox hash must be
   `7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf`.
   Recheck tracked checkout cleanliness and frozen HEAD. If any check fails,
   stop and report; do not fix or retry. If all pass, execute exactly once:

```powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1oDiagnostics.ts --execute '<actual V1m snapshot path>' '<new execution directory>'
```

5. Preserve stdout/stderr, exit code and all artifacts, including partial JSON.
   Each case ends at first death, fixed-roster clear or60 simulated seconds.
   Gameplay death/timeout continues the matrix. Exception or invalid setup stops
   the packet. Script checks a two-minute real compute ceiling between ticks;
   operator stops the process if stuck inside a tick. Whole packet ceiling30
   real minutes including setup; begin execution only with20 minutes remaining.
   No resume or rerun. Preserve partial evidence on any stop.
6. Hash every retained artifact and input again. Report at
   `docs/briefs/bot-balance-v1o-report.md` in the main workspace; index it in
   `docs/README.md`. Preserve unrelated changes. Retain the small isolated
   checkout and artifacts for review; no Docker resources are created to clean.

## Report contract and interpretation

Report source/tree/input/assets, preflight result, execution exit/completeness,
paths/hashes, and one row per arm: outcome, time, kills, remaining enemy HP,
first contact, first kill, actual HP healing separately from absorb/ward gains,
incoming damage through lethal contact, peak/trajectory ambient stacks,
pursuit timer/effective speed, player displacement, Hamstring application/uptime,
boot activation, targeting and guard timing. Logs retain each100ms tick and
the complete world journal; mark any metric not represented as unavailable.
Do not reuse recorder `totalHealed` as HP sustain. Flag any progression changes,
unexpected geometry or movement ownership; do not label intended catch-up a bug.

These are single-seed diagnostic contrasts, not win rates or optimal builds.
Different actions consume RNG differently even with identical starting seed.
Distinguish observed contacts from inferred causes. Tundra asks whether control
and movement gear meaningfully delay contact under current Heavy/Chill;
Volcano asks how much the fixed roster and Heat compound pressure. Natural
travel, recruitment, farming recovery and boss validation remain separate.
No precise nerf, live economy conclusion or biome validation follows alone.

After review: qualify promising counterplay in an ordinary progression/farming
packet, or propose a small explicit biome tuning pass for user approval if
pressure still dominates with functional movement. Ask the user about unclear
mechanics or intended counterplay before spending another long run on assumptions.

## User handoff

Ask Luna: “Operate docs/briefs/bot-balance-v1o-operator-packet.md exactly. Perform
its source/hash/setup checks, then its eight bounded diagnostics once. No code
changes, retries, balance changes or additional experiments. Preserve artifacts,
write and index bot-balance-v1o-report.md, then stop for Astra's review.”
