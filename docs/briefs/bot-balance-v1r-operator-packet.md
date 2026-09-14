# V1r — Short natural Volcano targeting and pursuit screens

Prepared 2026-09-14; **not launched**. User launches Luna. Read CLAUDE.md.
Three sequential runs, one worker, no automatic retries or adaptive edits.
This replaces the provisional armor comparison in checkpoint acceptance.

## Decision from V1q

The approved Scuttler reduction produced one kill at 9.1s in all four fixed
cases, followed by death at 12.1s. The control survived 2.6s longer than V1p.
The Hound delivered 296/333 actual HP damage in control; across all arms its
share was about 89–93%. One Scuttler received no damage at all. Sweep delivered
only two secondary hits (199 total), and repeated nearest-target changes split
damage. Armor/Bramble/charm changes did not change the final outcome.

The control artifact was re-hashed and matched the V1q report:
`51f9ce61663d6605d436a5ad9374100c00c647502bfcafab3c4150a269928add`.
These findings support investigating target commitment and catcher pressure;
they do not yet isolate Hound stats from attack uptime, geometry or movement.
No further nerf is applied in this packet. Heat and cooling remain unresolved.

V1r moves to natural population and ordinary approach to check whether the
fixed three-body failure generalizes. It is **not** a paired replay of V1q.
One run per arm is a screen, not a statistical winner selection. Different
world populations and travel histories can dominate differences between arms.

## Frozen source and input

- Revision: `01491a7ac2df8ef0bcf6e860b7077be9aaa08332`.
- Source tree: `d64e29d1c0d771e5731b1b719ff84e152c24f7ec`.
- Source changes for V1r: routes, registry and setup-only validation. No gameplay values changed.
- Reward multiplier 1; mode `smoke-isolated`; one worker; one replica per route.
- Maximum bot duration 600,000 ms per run. Whole operator session: 60 minutes
  including image setup; do not launch unless at least 40 minutes remain.

Use exactly this artifact, not Snapshot B or the demonstration's Desert Boots end state:

```powershell
$v1rRevision = '01491a7ac2df8ef0bcf6e860b7077be9aaa08332'
$v1rInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t112129z-checkpoint-pre-volcano-capture/runs/001-checkpoint-pre-volcano-capture-intended-r01/artifacts/checkpoint-pre-volcano-capture-intended-2026-09-14T11-23-17-505Z-78b380cf/checkpoint-pre-volcano-rested.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1rInput
```

Required SHA256: `015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55`.
Source revision is `e4ee4cb9b5ad800320fd61b30975c5a06c2dafc4`; source persistent
hash `d200fe6ebc012dd2dbef909350917c6370a43dd75e224865d8223cfb31bd4552`.
The continuation explicitly permits current-revision reuse and validates current
definitions. Expect no changed definition sections; stop on unexpected changes.

The checkpoint is a real capture of a legacy-imported V1m descendant, with
synthetic tier-entry and 25x ancestry retained. Restoring at 1x does not turn it
into canonical progression or economy evidence. Safe/rested normalization applies
only at the Sanctuary start `(2400,2400)`, never on Volcano arrival.

## Arms and hypotheses

All retain Wisp/Far, Ruinous Axe +5, Cave Vest +5, Mountain Charm +5, Tempered
Core, Defensive stance, Sweep, Second Wind and Brace. Travel uses the existing
28-RP Avoid Enemies / Fight Back / Avoid Hazards setup. Combat removes only the
two travel-only rules identically, then applies the declared treatment.

| Route | Combat RP | Explicit difference from control | Hypothesis |
|---|---:|---|---|
| `spirit-volcano-control-t3-v1r` | 27 | None; Plains Boots +5 | Natural baseline after the Scuttler correction |
| `spirit-volcano-focus-t3-v1r` | 30 | Buy Focus Lowest HP and append `in-combat -> focus-lowest-hp` | Finish low-HP engaged enemies earlier, reduce target churn and pressure |
| `spirit-volcano-pursuit-t3-v1r` | 31 | Learn Hamstring; buy/equip Desert Boots +5 | Reduce Hound contact and sustain ranged attack uptime |

Focus Lowest HP uses current absolute HP normalized over the candidate set;
it does not hard-code Scuttlers or guarantee ignoring the Hound. Its current
server targeting implementation scopes HP preferences toward engaged threats.
The recipe is available at Swamp mastery 8; this input has 12. It costs 90 purple
essence. The full rule costs 3 RP, including the in-combat condition.

Pursuit is a **two-part counterplay package**, not an isolated Hamstring effect.
It costs 70 green, 432 yellow and 1 Dominion catalyst including Boots +5.
It retains the baseline targeting policy. Combining focus and this package would
cost 34 RP against the 31-RP budget, so that illegal combination is not authored.
The boots also apply during travel; separate arrival condition from combat results.

## Route sequence and limits

1. Restore the same input into each fresh private world. Save the authoritative
   common `checkpoint-restore.json` before purchases; verify equivalence.
2. Make only the declared normal purchases. No resource farming, gear grants,
   class resets or earlier boss/unlock prefix. Validate the combat build and save
   `checkpoint-v1r-<arm>-prepared.json` at the safe hub.
3. Restore the common travel rules; record `approach-start`. Travel normally to
   exact `node-t3-volcanic-01`, maximum 180 seconds. No debug teleport, population
   suppression, manual path nudging or healing. First death stops the run.
4. Record `target-arrival`, apply the combat build and record `measurement-start`.
   Preserve any incoming damage, cooldowns and Heat from approach/configuration.
   Farm for 60 seconds of alive auto-enabled observation, with a 75-second step
   ceiling. The finish predicate does **not** require full HP in Volcano.
5. If alive, record `measurement-end`, switch to travel build, record
   `return-start`, and return to Sanctuary (180-second ceiling). Walk to the
   interior center before recovery/capture, avoiding the known gate-position
   capture failure. Recovery observes 10 seconds, maximum 60 seconds. Save
   `checkpoint-v1r-<arm>-returned.json` only if the safe/rested policy passes.

Natural recruitment, additional pulls, lava and ecology remain active. No forced
single-pack isolation or post-clear cooling tail is promised by this route.
Measure cooling only when an actual out-of-combat interval occurs. Death reset
is never evidence of cooling. Ordinary gameplay death continues to the next
independent arm; setup/restore/build/infrastructure failure stops the packet.
No same-arm retry, resume, winner replay, balance patch, Tundra or T4 run.

## Preparation validation already executed

Server diagnostics typecheck and bot typecheck passed. Setup-only script
`server/scripts/v1rPreflight.ts` restored the exact artifact into three fresh
Worlds, verified persistent fidelity, exercised normal purchases and all five
boot upgrades, and checked combat/travel legality. Zero simulation ticks.
It also asserts no old unlock/boss prefix and the bounded observation predicate.
Results: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1r-preflight-20260914.json`.

Post-purchase wallets were control unchanged; focus purple 1432; pursuit green
5272 / yellow 13280 / Dominion 17. All other wallets remained unchanged.
The named capture/two-restore live acceptance was completed separately; this
preflight is not V1r combat evidence. No full repository test-suite claim.

If preparation must be rechecked, use a detached checkout at the frozen revision,
install with `pnpm install --frozen-lockfile`, then run only:

```powershell
$env:NODE_ENV = 'development'
pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1rPreflight.ts $v1rInput '<new absolute preflight JSON path>'
```

Never use the older V1q instruction setting NODE_ENV=production for named restore.

## Launch and lifecycle — Luna only

Preserve unrelated work and development services. Check free disk (at least 6 GB),
no other experiment worker, and sufficient packet time before create. On address
pool/resource failure, stop and report; do not globally prune Docker.
From project root, using the variables above:

```powershell
pnpm experiment:create --revision=$v1rRevision '--routes=spirit-volcano-control-t3-v1r,spirit-volcano-focus-t3-v1r,spirit-volcano-pursuit-t3-v1r' --tierEntrySnapshot=$v1rInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=600000
```

Record the returned ID and inspect `experiment.json` for exact revision/tree,
sealed input hash, three routes, one worker, 1x rewards, no fast retry and zero
automatic retries. Then:

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# Only once the supervisor and every run are terminal:
pnpm experiment:release --id=<returned-id>
```

Use `experiment:stop` on packet deadline or a setup/infrastructure failure; preserve
partial output, then report/release when terminal. Network release is automatic
at normal completion; `already-released` is expected. Retain artifacts/volumes.

## Report and decision gates

Write and index `docs/briefs/bot-balance-v1r-report.md`. Include manifest, source,
input, receipt and prepared/final checkpoint hashes; inherited taints; actual
starting equivalence; purchase debits/build/RP; setup, approach, arrival build
configuration, measured window, return and recovery separately.

Report each phase reached and death location. Target observation must distinguish
time to first kill, kills by species, Hound contact/damage, concurrent attackers,
target changes, attack/Sweep/Hamstring delivery and Heat when observable. Use
retained server logs and bot events/snapshots; mark unavailable detail explicitly
rather than infer a full combat journal from coarse samples. Summarize actual
population/pack context. No claim of identical populations across runs.

- An alive 60-second segment with kills is initial natural farming evidence;
  a successful recovered return is a separate gate. Neither validates all Volcano.
- A focus improvement supports a targeted fixed-roster follow-up to isolate
  commitment; pursuit improvement supports separating slow from footwear next.
- If all reach the target and fail under Hound-dominated pressure despite delivered
  counterplay, return for a narrow Hound attack/cadence tuning proposal supported
  by observed hits. Do not automatically cut Scuttler HP or Heat again.
- If travel or hazard behavior prevents target observation, report that blocker
  separately; do not label it an encounter-stat failure.
- T3 other-biome TTK and T4 low-TTK/balance remain flagged; T4 Scuttler-counterpart
  change is still provisional. T1/T2 validation is not reopened by this packet.

Handoff: “Operate bot-balance-v1r-operator-packet.md at its frozen revision.
Run the three checkpoint-based Volcano screens once, sequentially. Verify common
restore and paid treatments, report phase-specific results and resource release,
write/index the V1r report, and stop. No edits, retries or extra experiments.”
