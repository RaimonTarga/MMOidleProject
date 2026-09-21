# Conduit R1 adoption and breadth recovery — preparation

The user requested preparation and the adjustments described in the supplied brief.
**No farming or R2 combat window has been run. No deployment or remote push occurred.**
Use **packet-v3**. `packet` and `packet-v2` are superseded preparation attempts,
retained with qualification history; do not launch them.

## Production adjustment

R1 was adopted in local `develop` commit `02488129` independently of packet/report
work. [Exact adoption diff](adoption.patch), [checks](checks.json), and
[profile equivalence](equivalence.json) are included. There was no separate merge,
and local adoption is not a live-server deployment.

Light/Balanced nominal intervals are 2,500/3,000 ms. Heavy remains 3,920 ms and Root
3,500 ms. Selected far range adds x0.85, Endless Swarm/Kilnmaster x0.80, and final
Light/Balanced floors are 2,000 ms. Root/Heavy floors stay 2,500 ms. Relic frequency
applies before the final floor. Damage, slot definitions, HP cost, payment safety,
queue healing, FIFO, other classes, enemies, gear, RP, encounters and acquisition
were not retuned. Normal previews and runtime no longer require experiment opt-in.
Historical candidate labels now fail closed on the adoption source.

768 pure profiles match the old measured R1 implementation, including range,
all frames/specializations, passives and positive/negative relic frequency.
48 Root checks remain identical to the old untreated profile. All 18 historical
applied candidate profiles (including slots and HP costs) match normal production
with zero World ticks. Six focused test files, full typecheck including benches,
shared/server TypeScript builds and diff checks passed. The full suite and human
playtesting were outside this bounded qualification.

## Historical farm completion — primary packet

[Farm manifest](packet-v3/farm-manifest.json) contains exactly 102 failed farming
cases: 90 main untreated identities, three T3 far-range untreated extensions and
nine original R1 candidates. Tier totals including candidates are 20/25/57.
Each row links its failed original case in the preserved publication. The existing
102 completed boss observations remain untouched and are not scheduled again.
Seed 101003, 100 ms ticks, 300,000 ms windows and original packages are unchanged.

The provisioned isolated worktree is:
`C:/Users/osaif/AppData/Local/mmo-idle/validation/conduit-recovery-20260921/historical-source`

Its HEAD is exactly `5024be692d8a1854b7f61e007d371f2ee9aab46b`. It passes the original
source/runtime/hitbox seal (`47770ddababff0a26e03497effbd6cebbbbc543359f0e8c47fb440a4c059fed2`).
Git normalized mixed newlines during checkout; those layouts were restored only
when the original SHA-256 matched. Git may consequently report EOL-only changes.
The original seal was not changed, bypassed or relaxed. For recreating this worktree,
[the newline layout](historical-line-endings.json) and
`scripts/conduit-restore-line-endings.mjs` reproduce the exact bytes while refusing
any content drift. Install dependencies with `pnpm install --offline --frozen-lockfile`.
Do not replace the historical worktree with the adoption source.

The actual `ttkSurvey.ts --mode=qualify` child passed its exact-HEAD assertion and
original applied-package comparison. [Qualification receipt](packet-v3/farm-manifest.json.qualified.json)
reuses that check against the identical farm manifest; it is not a farming result.

Run from the main repository in PowerShell, when execution is requested:

```powershell
node scripts/conduit-farm-completion.mjs --mode=verify --source=C:/Users/osaif/AppData/Local/mmo-idle/validation/conduit-recovery-20260921/historical-source --packet=reports/player-fast-pass/breadth-01-preparation/packet --recovery=reports/player-fast-pass/conduit-recovery-preparation/packet-v3/farm-manifest.json
node scripts/conduit-farm-completion.mjs --mode=run --source=C:/Users/osaif/AppData/Local/mmo-idle/validation/conduit-recovery-20260921/historical-source --packet=reports/player-fast-pass/breadth-01-preparation/packet --recovery=reports/player-fast-pass/conduit-recovery-preparation/packet-v3/farm-manifest.json --out=C:/Users/osaif/AppData/Local/mmo-idle/validation/conduit-recovery-20260921/farm-completion-run-01
```

The external dispatcher derives each real child command from the sealed original
manifest/launcher: `ttkSurvey.ts --trial=player-breadth --block=<original case ID>
--mode=run --hitboxes=<sealed artifact> --revision=5024be... --out=<fresh case path>`.
It retains the child revision guard and full package/profile readback checks.
Development conditions are passed through the tsx CLI so children load the sealed
shared source rather than a missing or stale dist build. It checks source bytes
before/after cases, refuses overwrite/relaunch, preserves failures, and stops the
shared farm family on the first operational/readback failure for diagnosis.
Gameplay deaths and caps with valid receipts remain measured outcomes.

## Optional R2 — separate, unadopted candidate

[Manifest](packet-v3/r2-manifest.json) declares exactly 24 observations: six identities,
farm and boss, adopted R1 and candidate R2. No historical observation is reused.
Both arms use the same fixed production-R1 revision
`59c895b3979dbe5867e21c9b81bdffdfb17d7c9c` in isolated worktree
`C:/Users/osaif/AppData/Local/mmo-idle/cr2-0921`.

The six identities are T2 Light, T2 Balanced, T3 Balanced/mid, T4 Marshal
(balanced-a), T4 Kilnmaster (light-b), and T4 Iconoclast (light-c). Exact farm/boss
loadouts are captured in qualification arm receipts and checked on execution.
R2 changes only Light 2,500 -> 2,000 ms, Balanced 3,000 -> 2,500 ms and their final
floors 2,000 -> 1,500 ms. It is a process-local bench overlay; there is no new
production toggle, damage buff, HP-cost change or automatic adoption.

The outer manifest and `arm.json` identify the true arm. Existing child telemetry
retains the transport label `untreated`, meaning no historical opt-in; it must not
be interpreted as pre-adoption tuning. Historical rows remain in their original
publication and retain their original meaning.

All 24 packages passed zero-tick qualification. See [effective intervals](effective-intervals.md) and the final qualification
receipts for per-package floors, relic composition and tick quantization.
Run the historical farming completion first. Optional R2 execution commands:

```powershell
node C:/Users/osaif/AppData/Local/mmo-idle/cr2-0921/scripts/conduit-recovery.mjs --mode=verify "--packet=C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/conduit-recovery-preparation/packet-v3"
node C:/Users/osaif/AppData/Local/mmo-idle/cr2-0921/scripts/conduit-recovery.mjs --mode=run "--packet=C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/conduit-recovery-preparation/packet-v3" --out=C:/Users/osaif/AppData/Local/mmo-idle/validation/conduit-recovery-20260921/r2-run-01
```

The launcher requires all 24 zero-tick qualifications, immutable packet/source
hashes, fresh output and no prior run marker. Child runtime profiles must match
the qualified arm. Operational failure blocks its farm/boss family while the
independent family can continue. No adaptive search or automatic second buff.

## Interpretation and reporting contract

Report measured and publication revisions separately. Preserve process failures,
deaths, caps, censoring and partial records; do not turn them into successful kills.
Prioritize terminal outcomes, useful target progress, authored formation availability,
zero-body fraction/duration, and recovery to useful delivery. Availability measures
remaining authored weights, not delivered-DPS percentages. Normalize different
observation lengths; HP bands are not boss script phases.

Use the existing conduit recorder for timer backlog versus ready-but-unaffordable
exposure, HP paid, actual queue healing, replacement lifetime, and first-attack
attempt/death before an attack. An attack attempt is not necessarily useful damage.
Keep Iconoclast's deliberate sacrifices distinct from hostile attrition. Retain
intact exposure and target/HP-band context; sparse intact exposure cannot establish
full-formation balance. Faster reconstruction can worsen health margins and
strengthen sacrifice throughput without changing a damage coefficient. The 20%
payment threshold is not an overall health floor. Return any further adoption
recommendation to the designer; do not automatically adopt R2.

## Preparation history

Initial child qualification found missing shared dist resolution; development
conditions were moved to the tsx child CLI. No combat ran. A second R2 preparation
revealed separate ESM/CommonJS tuning instances; its nine partial qualification
rows are superseded and not valid treatment evidence. The wrapper now uses the
runtime shared instance and explicitly asserts both a reduced interval and the
1,500 ms floor. Earlier outputs and process logs are retained in
[qualification-history](qualification-history), not relabeled as successful combat.
