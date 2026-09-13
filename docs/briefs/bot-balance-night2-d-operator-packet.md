# Night 2 packet D — Squire Plains armor screen

Fourth and final overnight packet. Execute only on Astra's exact frozen
revision/tree dispatch. Four declared cases in ABBA order, one worker, one
manifest. Each case25minutes maximum; entire packet150minutes from actual
setup start, never beyond finalization2026-09-14 04:34:42 UTC. No retries,
extra cases, downstream runs, source edits or gameplay balance changes.

## Decision and class-specific rationale

C earned T3 but failed static-lava transit. Its source attribution and
static-hazard/recovery gap are parked for diagnosis; no further T3 bridge
attempt tonight. Use the approved fallback from the overnight plan: a
contrasting class with its own verified prepared checkpoint.

Bulwark Squire is a slow melee fighter with high HP/plating and an8s,3.5×
Execution cadence. Quake Hammer supports empowered strikes; it has no Axe
dead-swing penalty. Plains boss adds give Sweep and kill-triggered Plains
charm/boots a plausible role. Hold these fixed and compare Mountain armor's
HP/Guard potency against Plains armor's stronger flat plating. Defensive
stance supports the plating investment. Mountain T2 armor does not cap hits.
Do not claim either armor globally optimal, or directly rank this melee class
against previous Spirit cases.

Known/ordinary acquisition: Quake Hammer, both Mountain and Plains armors,
Plains charm and Plains boots start at+4 in the input; upgrade all five to+5
in the same order in every case. Keep Mountain armor during acquisition.
Learn Brace ordinarily. No reconstruct, gear grant or new skill/range branch.
Only select the armor arm at T2 Sanctuary after identical acquisition.

Final build both arms: Sweep; Second Wind, Brace; defensive stance; Find
Enemies, Step Back, Chase, Avoid Hazards, Recover First.25RP. No named Guard
timing override, no Expose Weakness, no rite. Core Tempered remains equipped,
no relic. Recover to full HP/no DoT in Sanctuary before readiness. One normal
guardian-inclusive T2 Plains attempt. After a win, observe20seconds alive/auto
and reach full HP/no DoT in the cleared dungeon, cap180seconds. First death
anywhere aborts that case before respawn; the remaining declared cases may
continue after an ordinary valid gameplay death. Entry/treatment/infra/evidence
failure stops the packet and returns to Astra, not a substitute run.

## Input and exact command

Use the actual V1i Squire prepared snapshot unchanged:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t161141z-striker-t2-progression-squire/runs/002-squire-t2-progression-intended-r01/artifacts/squire-t2-progression-intended-2026-09-13T16-35-10-143Z-9d6d71de/snapshot-b.json`

SHA256 `f7f6a884f4f03798ee5c1019a3f49a6e18ecd4fb82f6bc357d00642f9b44d344`.
Astra verified original hash and state: T2,currentSkillTier2,GM72,max T2
biome levels, cooldown-root/cooldown-heavy,no range,no skill points,no T2
seals; source HP272.800048/307. Normal strict prepared-entry bootstrap applies,
not a relabelled Spirit state. Original synthetic/reward25 provenance remains.

Use clean exact frozen `pnpm bot:preflight`, copied committed host tooling,
image/revision/tree/tooling seals and the empty capacity-probe/terminal-release
controls from [A](bot-balance-night2-a-operator-packet.md). Record the actual
D setup clock, not a prior packet's clock. Hash the study's actual bytes;
record normalized equality if checkout line endings differ.

```powershell
$squireSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t161141z-striker-t2-progression-squire/runs/002-squire-t2-progression-intended-r01/artifacts/squire-t2-progression-intended-2026-09-13T16-35-10-143Z-9d6d71de/snapshot-b.json'
pnpm experiment:create --revision=$night2Revision --study="docs/briefs/bot-balance-night2-squire-study.json" --tierEntrySnapshot="$squireSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --maxRunMs=1500000
```

Verify sealed order Mountain,Plains,Plains,Mountain (two per arm), intended
policy, automatic retries0,fastBossRetryfalse. Markers
`night2:squire:mountain:ready` and `night2:squire:plains:ready`.

## Report and finish

Write/index `docs/briefs/bot-balance-night2-d-report.md`. For each case record
input/manifest/artifact hashes paired directly with filenames; readiness,
observed stats/25RP/equipment/stance/runes, acquisition time and any resource
stalls, guardian and boss-only windows separately, named boss kill plus
plains:2 clear, authoritative death cause/stale-window caveats, and final
HP/DoT/snapshot if completed. Count Sweep/SW/Brace inside the boss window
separately from whole-run counts. Record Execution, kill-recovery and damage
layer attribution only where telemetry actually supports them. No winner
promotion, causal passive ranking, or normal economy conclusion.

Verify terminal release receipt and exact network absence, retain volumes,
artifacts and service containers. No global prune or historical resume.
Return the report to Astra. This exhausts the night's four-packet ceiling;
do not start anything further.
