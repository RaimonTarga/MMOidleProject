# V1x - Earn the four-seal T4 handoff

Prepared 2026-09-14. **Not launched. User launches Luna.** Read CLAUDE.md.
One fresh character, one sequential route, Mountain then Cave. No balance edits,
Swamp retries, skill purchases, T4 travel or automatic follow-on experiments.

## Decision and V1w correction

V1w verified Mountain, Cave, Desert and Jungle boss wins. Together with Volcano
and Tundra, six of seven T3 bosses have candidate-build diagnostic wins. Swamp
cleared its six guardians then died to late pool/DoT pressure; it remains open.
Desert's sampled minimum HP was about16.4%, so its win is not a robustness claim.
These restored smoke runs are not canonical combat/economy certification.

My V1w packet incorrectly claimed that three T3 seals unlock T4. Shared
`sealsRequiredForTier(3)` requires FOUR. All four winners correctly stayed T3,
and the bad assertion stopped them before return. Their wins stand, but none
produced a returned handoff checkpoint. Do not combine their independent seals.

V1x earns Mountain and Cave on ONE character from the actual two-seal V1v return.
Both were clean V1w wins with no unabsorbed damage. Return and checkpoint after
each; the second win should unlock T4 and one skill point. Leave that point
unspent for the subsequent Voidwalker preparation pass. This is a progression
handoff test, not another five-boss breadth sweep or complete T3 validation.

User has not playtested T3 Swamp and will revisit it later; explicitly permits
moving forward. Keep pool escape/re-entry, persistent late pool coverage and
DoT pressure as unresolved questions, not confirmed balance defects. Swamp armor
is a possible future resistance candidate, not a qualified treatment in this
packet. Do not hold T4 entry hostage to that optional fourth-plus boss seal.

## Frozen source and actual input

Revision `4a6703f3f3a9e7dfb0d72c2a78789cffa884a1f6`.
Tree `464ad79a17c9fea62906dafd9ecca4971d858e91`.
Route `spirit-t4-handoff-v1x`, version1.0.0.

```powershell
$v1xRevision = '4a6703f3f3a9e7dfb0d72c2a78789cffa884a1f6'
$v1xInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v/runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748/checkpoint-v1v-tundra-cleared-returned.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1xInput
```

Input SHA256 `6f849c4c5686491156fa929c54862f59a2f90b61269abd505d59fa732f4f35e1`.
Boundary `v1v-tundra-cleared-returned`; state hash
`ab0ca2e6bb1213492f8b2687c0e0eae915ae80e12944ad83abab79af6a28faf4`.
Input revision `36d7e418056a29e18f4eb440574653ae9bd7fb50`.
Explicit-current-revision restore, unchanged definition hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
Preserve synthetic/restored/25x ancestry and all evidence eligibility flags;
reward1x does not make this canonical economy evidence. No checkpoint editing.

## Build, paths and checkpoints

GM114 Heavy Spirit/Wisp, tier3, skillPoints0, Volcano and Tundra T3 seals.
Keep Cinderlash T3+5, Mountain armor/charm T3+5, Desert Boots T2+5, Accelerant.
Zero purchases or skill unlocks. Boss build is V1v Offensive37/38RP: Frenzy,
Hamstring; Second Wind, Brace, Cleanse, Break Free. Travel is V1v Defensive38/38RP:
Sweep, Hamstring; same guards, Avoid Enemies/Fight Back and existing hazard rules.
Retain original spacing, Step Back, Avoid Hazards and recovery rules.

All waypoints below have `node-t3-` prefix; S means sanctuary. Use explicit hops.

- Mountain: S, swamp-05, swamp-04, desert-05, cave-05, cave-04, mountain-02,
  mountain-01, mountain-dungeon. Four guardians, then boss.
- Cave: S, swamp-05, swamp-04, desert-05, cave-05, cave-04, mountain-02,
  cave-02, cave-01, cave-dungeon. Three guardians, then boss.

Return each exact path in reverse. No ordinary Volcano/Tundra transit. The second
leg begins at the Sanctuary after the first recovered capture, not via a reset.
The route has one normal boss attempt per leg; no fast retry.

| Boundary | Expected authoritative state |
|---|---|
| v1x-two-seal-ready | T3, two T3 seals, zero skill points, rested at S |
| v1x-mountain-three-seal-returned | T3, Volcano/Tundra/Mountain, zero points, rested at S |
| v1x-t4-unlocked-returned | T4, those three plus Cave, one unspent point, rested at S |

Capture files use `checkpoint-<boundary>.json`. Recovery requires ordinary
Sanctuary movement/rest, no debug healing. A T4 character may be captured at T3
Sanctuary; this has been qualified through the capture validator. It is not yet
a T4 farming checkpoint. On any death, stop the case, retain all earlier captures
and report; no automatic resume from the intermediate checkpoint.

## Limits and lifecycle

One worker, one case, intended policy, smoke-isolated1x. First-death stop,
maxAttempts1 per boss, maxRun45 minutes. Session ceiling75 minutes including
setup; require55 minutes remaining to launch. Each dungeon step720 seconds,
travel hop180 seconds; global run deadline wins. No adaptive retries or new cases.

```powershell
pnpm experiment:create --revision=$v1xRevision '--routes=spirit-t4-handoff-v1x' --tierEntrySnapshot=$v1xInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=2700000
```

Keep routes arguments quoted as one string (including any future CSV), avoiding
V1w's PowerShell comma parsing issue. Before launch verify the sealed manifest
has exactly one fresh case with the source/tree/input/reward/worker/caps above;
record image metadata/hash. Do not reuse a different checkpoint or working tree.

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# After supervisor and all runs are terminal:
pnpm experiment:release --id=<returned-id>
```

If the session deadline arrives use experiment:stop, then report/release when
terminal. Infrastructure, restore or build failure stops the packet. Do not fix
code, restart cases, spawn agents or launch T4 from this operator session.

## Resource observations and hygiene

The user restarted Docker after seeing about12GB RAM usage. After restart only
mmo-logdb/mmo-gamedb/mmo-redis were running: about59-65MiB combined in two samples.
A later Windows snapshot showed vmmemWSL about1764MiB working set. These are
separate scopes; neither reconstructs pre-restart usage or proves a leak.
V1w workers sampled153-171MiB; the sampler reads worker cgroup memory, not total
Docker Desktop/WSL memory. The15.58GiB docker-stats denominator is the limit.

Before launch and after terminal release record the following with timestamps:

```powershell
Get-Date -Format o
docker ps --format '{{.Names}} {{.Status}}'
docker stats --no-stream --format '{{.Name}} {{.MemUsage}}'
Get-Process | Where-Object { $_.ProcessName -match 'vmmem|docker' } | Select-Object ProcessName,@{Name='WorkingSetMiB';Expression={[math]::Round($_.WorkingSet64 / 1MB,1)}}
Get-PSDrive C | Select-Object Name,Used,Free
```

Ensure no competing experiment worker. Check disk capacity before image build;
V1w's about5.47GB free was explicitly accepted by the user and succeeded. Do not
reintroduce a6GB approval gate solely for that same advisory condition. Actual
insufficient space/resource errors stop execution and must be reported. Preserve
normal services and other agents' resources. Release this experiment's network
when terminal, verify its workers/services stopped and retain captures/artifacts
and volumes. Already-released is normal. No global prune, destructive cleanup,
Docker restart or RAM-setting changes. If memory stays high, retain scoped
measurements for diagnosis instead of assuming extra RAM is the solution.

## Required report and next decision

Write/index `docs/briefs/bot-balance-v1x-report.md`. Record source/input hashes,
definition sections, image and resource/release evidence. Separate approach,
guardians, actual boss combat, return and recovery; do not call guardian start
boss activation or add overlapping timing/damage totals.

Verify each named boss kill + victorious attempt + matching authoritative seal;
raw isBoss=false is not alone a rejection. Require same character continuity,
three-seal T3 checkpoint then four-seal T4 checkpoint, one unspent point, unchanged
skills/gear, zero purchases, no death/DoT and recovered Sanctuary captures. Report
SHA256/state hash/path for each capture. A return failure preserves a verified
win but leaves the handoff incomplete. Do not promote pre-departure captures.

If complete, Astra next prepares normal unlock of Voidwalker (`energy-heavy-t3-a`),
retaining ranged Wisp and the user's attack-speed strategy, then qualifies T4
travel, farming and affordable upgrades before boss screens. Low TTK/mechanic
exposure and Volcano swarm pressure remain future balance questions. Swamp T3
stays explicitly open for human playtest and a focused follow-up; six-of-seven
coverage must not be described as complete T3 validation. Broad mobs -> items ->
classes balance and canonical1x economy remain downstream.

## Qualification

`server/scripts/v1xPreflight.ts` restores the exact retained input, validates
unchanged definitions/build legality and both forward/reverse paths. In a separate
disposable World it checks the actual two/three/four-seal sequence through the
shared rule and authoritative advancement handler, including one skill point,
no repeated advancement and legal T4 capture at T3 Sanctuary. No simulated
progression checkpoint is exported for gameplay; this is setup-only, zero ticks.

Artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1x-preflight-qualified-20260914.json`.
Bot and diagnostics TypeScript, actual-input preflight and tierSeals test passed.
Full repository suite and live V1x have not run. No gameplay balance changes.

Handoff: "Operate docs/briefs/bot-balance-v1x-operator-packet.md exactly: one
character earns Mountain then Cave, preserve both recovered returns and the real
four-seal T4 unlock, report resource scopes and release, then stop."
