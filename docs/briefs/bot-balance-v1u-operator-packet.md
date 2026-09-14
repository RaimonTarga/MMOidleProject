# V1u — Earn the full T3 tempo/barrier kit, then validate Volcano

Prepared 2026-09-14. **Not launched.** Astra prepares; user launches Luna.
Read CLAUDE.md. This authorizes one preparation run and, only after its success,
two fresh boss runs. No balance edits, adaptive builds, extra attempts or automatic
continuation beyond this packet.

## Decision after V1t

V1t cleared all 12 guardians in both replicas and reached the named boss normally,
but died in the boss phase in both. Boss-target damage was 8,579 / 9,375; remaining
boss HP was not recorded, so do not claim a measured low-HP finish. The second
terminal 550-damage hit is not by itself proof of Final Eruption. Avoid Hazards
was active and recorded vent damage was small. V1s farming validity stands; V1t
adds repeated guardian-clear evidence, not a boss win or a reason for another nerf.
Both summary hashes and the network-release receipt were checked against disk.

V1t retained the farming kit: Wisp, GM78, Ruinous Axe +5, Cave Vest T2 +5,
Mountain Charm T2 +5, Desert Boots T2 +5, Tempered Core, Defensive stance;
Sweep/Hamstring/Second Wind/Brace. This was an entry-kit screen, not expert end-T3
preparation. The user's human win used **fully upgraded T3** Mountain armor/charm,
the fast Volcano weapon, Accelerant, an aggressive stance and Frenzy/defenses.
That changes the preparation target materially. Do not infer a balance wall from
the underprepared comparison or claim that the human and bot builds are identical.

## Candidate and reasoning

Retain earned Heavy Spirit/Wisp; do not reset its range or grant a specialization.
Map the user's fast Volcano weapon to current `volcanic-cinderlash` (Cinderlash),
and aggressive stance to `offensive-stance` (Offensive Stance).

Final boss equipment:
- Cinderlash T3 +5, Summit Aegis (Mountain armor T3) +5.
- Bastion Heart (Mountain charm T3) +5, Accelerant Core.
- Desert Boots **T2 +5** retained for movement; the user did not specify boots.
- Offensive stance; Frenzy, Sweep, Hamstring, Second Wind, Brace: **37/38 RP at GM114**.
- Existing Find Enemies / Step Back / Keep Distance / Avoid Hazards / Recover First
  rules, with their original order and conditions. Travel uses the familiar
  Defensive 28-RP build, Avoid Enemies and Fight Back.

Cinderlash has 1.65 base attacks/sec and a five-stack flurry buff. Frenzy and
Accelerant increase attack frequency, feeding Heavy Spirit's energy/discharges.
Accelerant also costs 18% damage dealt; speed alone does not prove superiority.
Offensive adds damage/attack speed but increases incoming damage. Mountain armor
brings HP, Guard potency and a soft large-hit reduction: damage above 25% maxHP
has its excess halved. This is not a hard 25%-HP cap. HP also grows the charm's
percentage barrier. These are complementary offensive/defensive hypotheses.

Sweep remains because the existing attempt clears guardians before activating
the boss; Hamstring preserves movement control. Expose Weakness cannot simply
be added within 38 RP. It would require dropping an existing tool; do not substitute
it automatically. This is package viability, not an isolated weapon/core comparison.

## Frozen source and common input

Execution revision `bbba7c2d576a43e45f2a1825abd188b25cf1b18b`.
Tree `0ba2f2dddc731cd730db32cbe5c5fa87715ddf33`.
Routes version 1.0.0:
- A: `spirit-volcano-preparation-t3-v1u`.
- B: `spirit-volcano-tempo-barrier-t3-v1u`.

```powershell
$v1uRevision = 'bbba7c2d576a43e45f2a1825abd188b25cf1b18b'
$v1uInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t122828z-spirit-volcano-control-t3-v1s/runs/002-spirit-volcano-pursuit-t3-v1s-intended-r01/artifacts/spirit-volcano-pursuit-t3-v1s-intended-2026-09-14T12-36-05-203Z-633b2496/checkpoint-v1s-pursuit-prepared.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1uInput
```

Expected SHA256 `db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79`.
Boundary `v1s-pursuit-prepared`; persistent hash
`b001138205903a9cfe785eeaa9d60dec5e593ba7267acf3c96aeb7ed3a2c704c`.
Definitions hash `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`;
expect no changed definition sections. Stage A uses explicit-current-revision
restore. Retain all synthetic-entry/restored-checkpoint/25x ancestry taints.
Never edit input JSON. This is diagnostic preparation, not canonical economy.

## A — Earn preparation once

One worker, one run, 25x rewards, smoke-isolated, 120-minute global cap, first-death
stop, no retry. Reward acceleration applies to preparation only; it does not prove
1x progression pacing. Whole packet ceiling **210 minutes**, including setup.
Launch A with at least 180 minutes remaining; launch B only with at least 50 minutes
remaining. If there is insufficient time, retain the completed checkpoint and stop.

Ordinary travel/farming, initially in the inherited paid kit:
1. Mountain mastery 18 and at least 4,000 blue essence; return/recover/capture.
2. Jungle mastery 12; return/recover/capture. GM is at least 90.
3. Learn Frenzy, buy Cinderlash and Accelerant. Evolve the owned Mountain armor
   T1 +5 to T2, upgrade that to +5, then evolve to T3. Unequip/evolve the owned
   Mountain charm T2 +5 to T3. Upgrade new weapon/armor/charm to +2, equip them
   with Desert Boots and Accelerant, recover, capture `v1u-intermediate-kit`.
4. Farm Swamp18, Cave18 (also at least 3,000 red), Desert12, Tundra6, returning
   and capturing safely after each leg. Volcano is already capped at6. Together
   with inherited Plains12/Forest12 this earns GM114, the gate for T3 +5.
5. Upgrade weapon/armor/charm to +5 through ordinary purchases, recover at Sanctuary
   center, configure and validate the boss build, capture
   `checkpoint-v1u-tempo-barrier-prepared.json`. No boss is attempted in A.

Farming uses Sweep/Hamstring/Second Wind/Brace and Defensive stance. Swamp/Cave
instead replace Hamstring with Cleanse, for afflictions and cleansable Cave slow.
After the intermediate checkpoint, farming uses the newly purchased equipment.
All travel uses the existing 28-RP build. Each mastery farm has a 30-minute step
cap and five-minute no-progress stall threshold. Returns use normal movement and
recovery. Global caps take precedence; per-step travel timing is not a guaranteed
hard interrupt (V1t's r01 travel exceeded its authored 180 seconds).

Capture checkpoints after each successful returned mastery leg; they preserve
progress for later planning, but **this packet does not authorize resuming a failed
run** or using an intermediate boundary for B. A preparation death/timeout means
preparation is incomplete, not that this boss build failed.

```powershell
pnpm experiment:create --revision=$v1uRevision --routes=spirit-volcano-preparation-t3-v1u --tierEntrySnapshot=$v1uInput --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=7200000
```

Inspect sealed manifest, source/tree, actual reward/caps, fresh character,
fastBossRetry=false and zero automatic retries. Record image metadata/hash.
Then use the ordinary lifecycle below. After A terminates, inspect its nested
artifacts and final checkpoint. Require successful route completion, no deaths,
GM114, all three target items +5 and equipped, Accelerant, Desert Boots +5,
Frenzy known, legal build, original eight boss clears with `volcanic:3` absent,
Wisp retained, fullHP/noDoT and safe stationary Sanctuary capture.

## B — Two independent boss attempts, shared prepared input

Only after A passes all gates: resolve its single final checkpoint using the
run's snapshot index, record its exact absolute path, SHA256, source revision,
definitions hash, persistent hash and capture ancestry. Never select a later
combat outcome or substitute a returned boss checkpoint. The new route requires
`same-revision`; both restores must faithfully match the one prepared state.

```powershell
# Set to the verified final capture from the successful A run, not an intermediate.
$v1uPrepared = '<absolute-path-to-checkpoint-v1u-tempo-barrier-prepared.json>'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1uPrepared
pnpm experiment:create --revision=$v1uRevision --routes=spirit-volcano-tempo-barrier-t3-v1u --tierEntrySnapshot=$v1uPrepared --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Check/seal as for A. One ordinary attempt per run, including all guardians and
altar activation; 20-minute global cap, first-death stop. No purchases or farming
prefix. A gameplay failure in B1 permits the already planned fresh B2; a setup,
restore, build or infrastructure failure stops the packet. Victory must have a
named kill, victorious attempt and `volcanic:3` marker. Then ordinary return,
center movement, recovery and `checkpoint-v1u-volcano-cleared-returned.json`.
No fast retry, forced activation, guardian suppression, manual movement, debug
healing, Heat resets or adaptive gear changes.

## Lifecycle and resource discipline

Before create: check clocks, at least 6GB free disk and no other experiment worker.
Never globally prune Docker or touch unrelated services. For each returned id:

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# Once supervisor and runs are terminal:
pnpm experiment:release --id=<returned-id>
```

Use `experiment:stop` for the deadline or infrastructure/setup failure; then report
and release after terminal confirmation. Release A before creating B. Automatic
release / already-released is expected. Retain artifacts, checkpoints and volumes.
No new operator subagent or downstream packet is authorized.

## Qualification completed by Astra

Bot TypeScript and server diagnostics TypeScript pass. `server/scripts/v1uPreflight.ts`
restores the actual sealed V1s input, checks persistent equality and definitions,
and qualifies the initial builds. It then **models** the authored future mastery
and wallet floors in memory and runs real purchase/evolution/upgrade handlers,
checking affordability and final RP. This is arithmetic/setup qualification with
zero combat ticks; those future gates were not earned, and no checkpoint is exported.
Final artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1u-preflight-qualified-20260914.json`.
Modeled purchases leave 354 blue, 439 red, 4,122 green, and ample catalysts; actual
farming can yield more. Offensive stance is already known, so no duplicate purchase.

Broader `bot/src/harness.test.ts` stops on the older V1r control route: its static
walker uses a fresh-character rune inventory and 16-RP budget for the named
checkpoint route. It does not reach V1u. Do not report the full harness as passing;
the actual-input qualification covers this packet's restore/build assumptions.
Full repository suite and live V1u execution have not run. No gameplay balance changed.

## Required report / next decision

Write and index `docs/briefs/bot-balance-v1u-report.md`, even if A fails. Separate:
- Preparation: mastery trajectory, travel/farming deaths or stalls, purchased
  gear, costs, intermediate/final captures, and actual resource multiplier.
- Boss replicas: approach, all guardian clears/reformations, altar/spawn, boss
  combat, kill/progression, and recovered return. Attempt start precedes guardians.
- Phase-specific boss HP if observed, damage dealt/taken, barrier/Guard/Frenzy
  activations, movement, vents and Final Eruption only where supported by events.
  Mark missing measurements; never turn guardian aggregate counts into boss adds.

A win establishes fully prepared Wisp package viability; two wins add replication.
A failure requires phase/mechanic review before new balance proposals. Differences
from V1t include mastery, gear, core, stance and ability repertoire; do not attribute
an improvement to any one component. Preserve farming evidence and defer broad
T3/T4 low-TTK tuning, Heat/cooling, other classes and item ablations.

Handoff: "Operate bot-balance-v1u-operator-packet.md exactly: earn and capture the
full T3 tempo/barrier preparation once, then only if its gates pass run the two
frozen 1x Volcano boss replicas. Report, release resources and stop."
