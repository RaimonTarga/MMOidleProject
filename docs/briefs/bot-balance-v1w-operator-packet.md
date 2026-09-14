# V1w - Remaining T3 boss coverage; prepare the T4 handoff

Prepared 2026-09-14; **not launched**. User launches Luna. Read CLAUDE.md.
Five sequential fresh cases, one per remaining boss, one worker. No adaptive
retries, balance changes, extra cases or automatic T4 execution.

## V1v assessment and next decision

Tundra passed2/2, including guardians, named boss kills, tundra:3 progression and
recovered returns. Boss combat lasted83.069/75.560 seconds. Cleanse removed Chill;
Break Free activated2/3 times. That demonstrates usable counterplay, not proof that
every phase executed correctly or all T3 classes/builds are safe. The report has
inconsistent zone/overall damage attribution; do not resolve it by summing rows.
The checkpoint hash and authoritative restore are qualified below.

Together with Volcano2/2, this supports moving from repeated single-boss packets
to one breadth sweep of the five remaining bosses. Every case starts from the
same first chronological Tundra return. Each has two T3 seals and earns T4 on a
third distinct seal. Keep the new skill point unspent and return to T3 Sanctuary;
safe checkpoint capture supports that location after tier advancement. This is
five independent coverage results, not one character clearing all seven in sequence.

## Frozen source and input

Revision `d244eef2867cb4c6250c316df6c16379b11efc6b`.
Tree `fab39fb528bb5c7a8cf5034ee3d44e1164f4cfbf`.
All routes version1.0.0. Input is the first chronological V1v B1 returned capture.

```powershell
$v1wRevision = 'd244eef2867cb4c6250c316df6c16379b11efc6b'
$v1wInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t155945z-spirit-tundra-boss-t3-v1v/runs/001-spirit-tundra-boss-t3-v1v-intended-r01/artifacts/spirit-tundra-boss-t3-v1v-intended-2026-09-14T16-01-56-200Z-8ba40748/checkpoint-v1v-tundra-cleared-returned.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1wInput
```

SHA256 `6f849c4c5686491156fa929c54862f59a2f90b61269abd505d59fa732f4f35e1`.
Boundary `v1v-tundra-cleared-returned`; state hash
`ab0ca2e6bb1213492f8b2687c0e0eae915ae80e12944ad83abab79af6a28faf4`.
Source revision `36d7e418056a29e18f4eb440574653ae9bd7fb50`.
Explicit-current-revision; expected definition hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`,
no changed sections. Preserve restored/synthetic/25x ancestry; reward1x in this
packet does not make it canonical economy evidence. Do not edit inputs or select
a returned state from another V1w case for a later case.

## Cases and builds

Order is Mountain, Cave, Swamp, Desert, Jungle; one attempt each. Equipment remains
GM114 Heavy Spirit/Wisp, Cinderlash T3+5, Mountain armor/charm T3+5, Desert Boots
T2+5, Accelerant. All listed abilities are already learned; zero purchases/unlocks.
Boss stance Offensive; original Find Enemies/Step Back/Keep Distance/Avoid Hazards/
Recover First rules remain. Travel is the V1v Defensive38RP build with Sweep,
Hamstring, Second Wind, Brace, Cleanse, Break Free and travel rules.

| Case / route | Boss abilities | RP | Main preparation rationale |
|---|---|---:|---|
| Mountain / spirit-mountain-boss-t3-v1w | Frenzy, Hamstring; Second Wind, Brace, Cleanse, Break Free | 37 | Four Colossus guardians; spacing and Step Back against charge/contact-gated Cragbreaker, barrier and Guard mitigation if hit. |
| Cave / spirit-cave-boss-t3-v1w | Same as Mountain | 37 | Three Troll guardians; Cleanse for burrow contact slow/afflictions, movement out of eruption, retain HP/barrier against erosion. |
| Swamp / spirit-swamp-boss-t3-v1w | Frenzy, Sweep; Second Wind, Brace, Cleanse | 36 | Three Hydra leaders each with one follower: six guardians. Sweep handles paired enemies; Cleanse handles rot, Avoid Hazards handles slow/vulnerability/detonating pools. |
| Desert / spirit-desert-boss-t3-v1w | Same as Mountain | 37 | Three Basilisk guardians; cleanse Sun Mark/slow, preserve spacing through ranged morph and Execution. |
| Jungle / spirit-jungle-boss-t3-v1w | Frenzy, Sweep, Hamstring; Second Wind, Cleanse | 35 | Three Silverbacks each with two followers: nine guardians. Sweep for groups; Hamstring/fast attacks for fleeing guard, Cleanse for venom. Brace/Break Free are deliberately omitted to fit that repertoire. |

These are declared encounter candidates, not claims of global optimum. Do not
silently replace an ability after a failed attempt. Record guardian and boss
outcomes separately; an entry/guardian failure leaves boss viability unmeasured.

## Exact paths, forward and reverse

Every name below has the `node-t3-` prefix. S means sanctuary. Every hop is adjacent
and checked in both directions. Use each explicit waypoint, not biome pick:first.
No ordinary Tundra or Volcano transit is needed.

- Mountain: S, swamp-05, swamp-04, desert-05, cave-05, cave-04, mountain-02,
  mountain-01, mountain-dungeon.
- Cave: S, swamp-05, swamp-04, desert-05, cave-05, cave-04, mountain-02,
  cave-02, cave-01, cave-dungeon.
- Swamp: S, swamp-05, swamp-04, desert-05, desert-04, swamp-01, swamp-dungeon.
- Desert: S, swamp-05, swamp-04, desert-05, cave-05, cave-04, cave-03,
  desert-01, desert-dungeon.
- Jungle: S, swamp-06, jungle-04, jungle-03, jungle-02, jungle-01, jungle-dungeon.

Return follows the exact reverse for each case. The route captures
`v1w-<biome>-ready` at Sanctuary, configures travel, approaches, configures the
boss build, clears guardians and activates normally. After verified victory it
asserts playerTier>=4, returns, moves to center, recovers, and captures
`checkpoint-v1w-<biome>-cleared-returned.json`. Do not spend the new skill point,
ascend again, enter T4 nodes or switch to Voidwalker during this packet.

## Run limits, commands and lifecycle

One worker, count1 per route (five total), smoke-isolated1x, intended policy,
maxRun30 minutes, first-death stop, maxAttempts1, no fast boss retry or automatic
retries. Dungeon step has authored720s cap; travel authored180s per hop. Global
run cap takes precedence over per-step timing. Session ceiling180 minutes including
setup; require170 minutes remaining to launch the complete batch.

```powershell
pnpm experiment:create --revision=$v1wRevision --routes=spirit-mountain-boss-t3-v1w,spirit-cave-boss-t3-v1w,spirit-swamp-boss-t3-v1w,spirit-desert-boss-t3-v1w,spirit-jungle-boss-t3-v1w --tierEntrySnapshot=$v1wInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

Verify exact frozen source/tree/input, five fresh cases in that order, no duplicates,
worker/reward/caps and no retries in sealed manifest. Record image metadata/hash.
Check >=6GB free disk and no other experiment worker; preserve unrelated services.

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# Only after supervisor and all cases are terminal:
pnpm experiment:release --id=<returned-id>
```

A first gameplay death ends that case; continue the remaining preplanned cases.
Infrastructure, restore or build failure stops the packet. Use experiment:stop at
session deadline, then report/release after terminal. No global prune; keep artifacts,
volumes and checkpoints. Automatic release/already-released is expected. No new
subagents, extra experiments, ad hoc retries or operator code fixes.

## Reporting and next decision

Write/index `docs/briefs/bot-balance-v1w-report.md`. For each case verify common
initial persistent hash, untouched gear/skills, zero purchases, named boss kill,
victorious boss-attempt and matching biome:3 marker together. Require third-seal
T4 advancement, newly available skill point left unspent, safe return/noDoT and
capture. A return failure does not erase a verified boss win, but it leaves the
progression handoff incomplete. Do not rely on raw isBoss flags alone.

Report approach/guardian/boss/return phases, actual path observations (mark missing
node-enter samples), durations and observed minimum HP/barrier. Capture Cleanse,
Hamstring, Frenzy, Sweep/Guard and movement evidence, but do not infer named boss
mechanics from generic telegraph events. Keep missing phase telemetry explicit.
Do not combine overlapping travel/fight totals or use synthetic ancestry as economy
proof. Retain failures and unused checkpoints; no automatic winner selection.

If all five bosses pass, the sampled T3 boss-coverage gate is complete for the
selected Heavy Spirit packages; one screen per new boss is weaker replication
than Volcano/Tundra's2/2 and does not establish all-class balance. Any failure
gets a focused strategy/mechanic review. No new balance values are authorized.

## T4 direction saved from user advice

User reports manual completion using **Voidwalker**, with attack speed central.
Current node is `energy-heavy-t3-a`, parent energy-heavy, cost one skill point.
It increases the energy pool, accelerates generation as the pool fills, and can
trigger an early discharge when projected discharge damage would kill. This
supports testing Cinderlash/Accelerant/Frenzy-style tempo, while still checking
actual T4 equipment costs and survival rather than assuming old gear is optimal.

After review, plan normal purchase of Voidwalker using the earned T4 point,
preserve the ranged Wisp playstyle, and prepare a safe T4 entry checkpoint. Prefer
the Mountain case's returned checkpoint if it passed (predeclared order); otherwise
report available cases for Astra selection. T4 unlock does not mean all five
independent clears were combined into one character. Do not synthesize those seals.
T4 first needs ordinary travel/farming/gear qualification before boss screens;
low TTK and provisional Volcano fodder tuning remain known balance questions.
No T4 execution is authorized by this packet.

## Qualification completed

`server/scripts/v1wPreflight.ts` checks the exact real Tundra-return file SHA,
authoritative persistent restore/definitions, GM114/tier3 and both prior seals,
all five legal builds, actual dungeon definitions, bidirectional adjacency and
single-hop shortest paths, and one attempt with no purchase/skill prefix.
Artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1w-preflight-20260914.json`.
Zero combat ticks, no granted progression or currency. Bot/diagnostics TypeScript
and tierSeals tests pass. Full repository suite and live V1w have not run.
Only routes/preflight/docs changed; no gameplay balance changes.

Handoff: "Operate bot-balance-v1w-operator-packet.md exactly: five independent
remaining T3 boss screens from the common Tundra return, explicit travel and
per-boss builds, retain tier advancement and recovered captures, report, release,
and stop before any Voidwalker unlock or T4 execution."
