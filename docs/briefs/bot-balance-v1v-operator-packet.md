# V1v - Tundra boss validation with Chill and Freeze counters

Prepared 2026-09-14; **not launched**. User launches Luna; read CLAUDE.md.
Two sequential fresh runs, one worker, one ordinary boss attempt per run,
first-death stop. No adaptive retries, operator fixes or balance changes.

## Decision

V1u2 established Volcano package viability: both replicas cleared 12 guardians,
killed Cinder-Shell Magma-Salamander, earned volcanic:3 and returned recovered.
The boss combat durations were 26.530/26.517 seconds. Accept that validation gate
and move to Tundra; broad class/item balance and low TTK remain later work.

Reuse the **first chronological Volcano returned checkpoint**, B1, to retain its
clear and earned equipment. Both B replicas won; selection is chronological, not
based on damage or speed. No repeated mastery farming and no synthetic additions.
This is a next-boss screen; one eventual Tundra win would leave this character with
two T3 seals, not automatically validate or advance the entire tier.

## Frozen execution/input

Revision `36d7e418056a29e18f4eb440574653ae9bd7fb50`.
Tree `562f8d37723846e5f965c504b04caf145d7f6ec3`.
Route `spirit-tundra-boss-t3-v1v`, version1.0.0.
Mode smoke-isolated; reward1x; workers1; count2; policies intended.
Maximum run30 minutes including all travel and guardians; whole session90 minutes
including setup. Launch with at least75 minutes left. No fast boss retry or auto retry.

```powershell
$v1vRevision = '36d7e418056a29e18f4eb440574653ae9bd7fb50'
$v1vInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t152219z-spirit-volcano-tempo-barrier-t/runs/001-spirit-volcano-tempo-barrier-t3-v1u2-intended-r01/artifacts/spirit-volcano-tempo-barrier-t3-v1u2-intended-2026-09-14T15-23-06-975Z-31d17012/checkpoint-v1u2-volcano-cleared-returned.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1vInput
```

SHA256 `49afc1c9815457e7aac5ab10580c7e917d4359ca0e365f36ec9e7b9385f9a18a`.
Boundary `v1u2-volcano-cleared-returned`; persistent state hash
`42f98812fbec456349ca387249b89eefd300ff89d48c02e1279b78b391719fb5`.
Source revision `0275d223b1bf3a86ad816a72df27bfe8a4523eb6`.
Explicit-current-revision restore; expect no changed definition sections and hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
Retain all restored/synthetic/25x ancestral taints. Current1x does not make this
canonical economy evidence. Never edit input JSON or choose another checkpoint.

## Build and ordinary preparation

Keep Heavy Spirit/Wisp, GM114, Cinderlash T3+5, Mountain armor T3+5,
Mountain charm T3+5, Desert Boots T2+5 and Accelerant Core.
Learn Break Free normally at Sanctuary: Tundra mastery5 gate (input has6),
190 blue essence. Cleanse and all other selected abilities are already learned.
One identical purchase per independent replica; no equipment/skill changes.

Boss build **37/38RP**:
- Offensive stance; Frenzy and Hamstring.
- Second Wind, Brace, Cleanse and Break Free.
- Existing Find Enemies, Step Back, Keep Distance, Avoid Hazards and Recover First
  rules with their existing order/conditions. Ordinary ability triggers, no manual casts.

This replaces Volcano's Sweep (6RP) with Cleanse and Break Free (3RP each).
There are three guardian leaders, not twelve bodies, so prefer control escape
while retaining Hamstring spacing and Frenzy tempo. Guardian viability is still
an untested gate. Retain HP/barrier/large-hit mitigation for attacks that land.

Travel build **38/38RP**: Defensive stance; Sweep/Hamstring; all four guards;
existing travel rules including Avoid Enemies/Fight Back. It trades Frenzy for
Sweep and travel logic. Configure boss build only after arrival at the dungeon.
Capture `v1v-tundra-ready` after learning and before departure.

## Encounter expectations from current source

Frost-Plated Rime-Mammoth: authored HP12,895, attack204, plating12, DR12%,
attack interval4.2 seconds. These are raw definitions, not predicted final hits.
Guardians: three Glacier Bear/Frost Warden patrol leaders; HPx1.2, attackx1.05;
no follower entries. Ordinary preclear/altar activation is mandatory.

Deep Freeze checks for at least4 Chill stacks at cast start, with1.4s cast and
2.2s Frozen, followed by a radius195 Shatter telegraph1.3s. Pattern cooldown8.5s,
initial delay4.5s. Cleanse partially reduces Chill; it does not erase environmental
pressure. Break Free automatically responds to hard control; its cooldown means
it cannot be assumed available for every pattern. Step Back needs freedom to move.

At50% the charged attack damage/radius increase; at25% the current authored
script periodically applies a24%-HP shield, with a shatter self-damage/vulnerability
reward. Despite an older nearby comment discussing removed shielding, the live
phase data still contains this shield action. Record what executes; do not treat
unobserved mechanics as validated by a kill or assume a fast fight exercises all phases.

## Audited travel

Each listed hop is adjacent in both directions. Walk each explicit waypoint;
do not replace with a single biome pick or one long navigate request:

Sanctuary -> swamp-05 -> swamp-04 -> desert-05 -> cave-05 -> cave-04 ->
mountain-02 -> mountain-01 -> mountain-05 -> tundra-dungeon.

All ids begin `node-t3-`. Return follows the exact reverse. This longer path
avoids ordinary Tundra/Rime Caster transit and Volcano before the actual dungeon.
It is a planned exposure tradeoff, not a guarantee of safety. The shorter generic
path crosses Tundra-05; do not silently substitute it. Per-hop authored180s limits
do not replace the executor's global run cap.

At the dungeon: record arrival, configure boss build, one attempt with maxAttempts1
and720s authored step cap including guardians. On victory require tundra:3,
then return, move to Sanctuary center, recover, and capture
`checkpoint-v1v-tundra-cleared-returned.json`. Any first death ends the run,
including travel/guardians/return. Do not respawn, force boss activation, debug heal,
reset Chill, suppress guardians, manually dodge or change gear/abilities.

## Operator commands/lifecycle

Before create: check clock, >=6GB free disk, no other experiment worker. Preserve
unrelated edits/services. No global Docker prune.

```powershell
pnpm experiment:create --revision=$v1vRevision --routes=spirit-tundra-boss-t3-v1v --tierEntrySnapshot=$v1vInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=2 --policies=intended --maxRunMs=1800000
```

Verify sealed manifest source/tree/input SHA, two fresh cases, worker/reward/caps,
fastBossRetry=false and zero retries. Record image metadata/hash. Then:

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# Only when supervisor and all runs are terminal:
pnpm experiment:release --id=<returned-id>
```

A gameplay failure permits the already planned second fresh replica. Setup,
restore, build or infrastructure failure stops the packet. At deadline use
experiment:stop; report/release after terminal confirmation. Automatic release
or already-released is expected. Retain artifacts/volumes/checkpoints and stop.
No new operator agent, extra experiments or automatic follow-on authorized.

## Qualification and reporting

Actual-input preflight passed: exact hash/persistent restore/definitions,
normal190-blue purchase, legal37/38RP builds, one attempt and bidirectional
waypoint adjacency/shortest single-hop checks. No modeled progression or currency.
Artifact `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1v-preflight-20260914.json`.
Bot and diagnostics TypeScript pass; tundraChill and abilityControl tests pass.
No live V1v combat or full repository suite run; prior broad static checkpoint
harness limitation remains. Source changes are routes/preflight only, no balance.

Write/index `docs/briefs/bot-balance-v1v-report.md`. Verify both initial restores
match the same persistent input, then identical Break Free debits and legal builds.
Separate approach, guardians, altar/boss start, boss outcome and recovered return.
Require named Frost-Plated Rime-Mammoth kill, victorious attempt and tundra:3
progression together; raw kill isBoss alone has known reporting limitations.

Report Cleanse/Break Free/Hamstring/Frenzy/Guard activations, Chill/Freeze/Shatter
and shield behavior where actually observable, minimum HP/barrier, cause of death,
actual outbound/reverse node trace, and boss damage/HP separately from guardians.
Mark absent phase telemetry rather than inferring it. Preserve full-route versus
encounter-only distinctions and avoid adding overlapping travel/fight totals.

One verified victory meets package beatability; two add replication. If both pass,
advance to another unvalidated T3 boss with encounter-specific preparation. If
failure, classify travel/guardians/control escape/sustain/damage before changing
anything. No automatic balance conclusion, economy inference or claim of all-class
coverage. Retain first chronological returned capture for later progression planning.

Handoff: "Operate bot-balance-v1v-operator-packet.md exactly: two independent1x
Tundra attempts from the first Volcano return, ordinary Break Free purchase,
explicit waypoint travel, report phase outcomes, release resources and stop."
