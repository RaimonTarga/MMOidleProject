# Durability 11 — fresh-seed confirmation of adopted balance and preparation

Prepared2026-09-16. Manual Luna operator packet; run once. Full run NOT launched.

## Applied decisions

- Glacier Bear: HP1500->3750, attack185->148, shield fraction0.20->0.08.
  Preserve300 authored shield capacity before node HP modifiers. Shield cadence,
  duration, shatter12% max-HP damage and vulnerability30%/4s unchanged. Shatter
  damage still scales with the larger body; do not call this an HP-only patch.
- T3 Plague-Shell Snapper: HP1160->2320. Attack37, plating4, shell/pool/poison
  and support mobs unchanged. No DoT resistance added.
- T2 Jungle Squire and T3 Jungle Conduit templates use defensive stance.
  Other classes retain offensive stance. Silverback HP2090/ramp cap45% retained.
  These are campaign benchmark preparations, not changes to player defaults or
  retroactive edits to historical frozen templates.

## Fixed confirmation

Trial `durability11`:42 configurations,126 observations. Nodes03/05:

| Area | Builds | Cells | Runs |
| --- | --- | ---: | ---: |
| T3 Tundra | six baselines plus Slinger DoT/Conduit on-hit alternatives | 16 | 48 |
| T3 Swamp | six baselines | 12 | 36 |
| T3 Jungle | six baselines, Conduit defensive | 12 | 36 |
| T2 Jungle | Squire defensive only | 2 | 6 |

FRESH seeds3911/6151/8089; no replay of173/947/2027. One selected configuration
per build, no overlays. This is confirmation/generalization, not another causal
old/new comparison. Historical results are context, not same-seed controls.
Fresh300s Worlds,100ms ticks, stop first death, natural ecology. All existing
gear/weapon/ability/rune choices retained: +5 biome armor/charm, Mountain boots,
Tempered Core, medium frames and normal close/mid range, Sweep, Second Wind,
Cleanse and T3 Frenzy. No Slam, adaptive equipment or changed recipes/rewards.

Estimate10–20 wall minutes; maximum10.5 simulated hours. Existing120s observation,
4h batch and2GiB RSS limits. Deaths advance the matrix; tooling failure stops.
No retries, extra seeds, source edits, automatic winners or live balance edits.

## Separate known Swamp movement issue

Durability10 Swamp05 Striker/s173 never reached a Snapper, identically in all
three HP arms. Preserve those runs as a movement issue, not safe Snapper exposure.
Evidence directory:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916/results-durability10swamp/dur10-node-t3-swamp-05-striker-control-s173`.

Last outgoing damage was12s to a Mire Hexer. Samples30s/100s/200s/299s retain
position approximately(1875.729,1294.267), goal(1852.253,1262.852), attack intent,
null player target and empty static-damage contacts. This is a reproducible
stalled-movement symptom; collision/path/target cause remains unproven. No movement
fix or retry is bundled here. Investigate in a separate movement task using the
preserved artifacts and frozen6d8f97fc source. New seeds do not resolve that issue.

In confirmation, any no-target or prolonged no-progress run is an engagement
limitation. Report it separately; never replace missing target TTK with0 or
count non-contact survival as combat success. Do not silently discard the seed.

## Frozen identity

- Revision: `9f58ee4641c36bd39ed67c1d76bc5712e0c0b7ba`
- Tree: `094c79f8f1973e3e722e52c8e475ed216d1e6ecb`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitboxes SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Workspace/bench typecheck and Durability11, Durability9/10 overlay restoration,
Tundra chill and ecology polish tests passed. Historical definition guards remain
attached to their original frozen packet revisions; current tests exercise
restoration against current definitions. Full suite/human playtest not run.
Qualification receipt appended below. Pilots establish tooling, not balance.

## Operator commands

Run from shared repository. Preserve dirty files and prior runs. No Docker,
database or service restart. New detached checkout/output only.

```powershell
$dur11Revision = '9f58ee4641c36bd39ed67c1d76bc5712e0c0b7ba'
$dur11Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability11-20260916'
$dur11Checkout = "$dur11Root/source"
$dur11Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur11HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur11Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur11Hitboxes).Hash -ne $dur11HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur11Root | Out-Null
git worktree add --detach "$dur11Checkout" $dur11Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur11Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur11Checkout" rev-parse HEAD) -ne $dur11Revision) { throw 'Revision mismatch' }
if ((git -C "$dur11Checkout" rev-parse 'HEAD^{tree}') -ne '094c79f8f1973e3e722e52c8e475ed216d1e6ecb') { throw 'Tree mismatch' }
if (git -C "$dur11Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur11Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur11Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability11 --mode=run "--revision=$dur11Revision" "--hitboxes=$dur11Hitboxes" "--out=$dur11Root/results"
$dur11Exit = $LASTEXITCODE
@{start=$dur11Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur11Exit} | ConvertTo-Json | Set-Content -LiteralPath "$dur11Root/operator-ledger.json"
if (Test-Path -LiteralPath "$dur11Root/results/index.json") {
    node "$dur11Checkout/scripts/ttk-survey-report.mjs" "$dur11Root/results"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur11Exit -ne 0) { throw 'Simulation failed; preserve partial and stop' }
node "$dur11Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur11Root/results" --trial=durability11 "--revision=$dur11Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur11HitboxHash" --cells=42 --runs=126 '--seeds=3911,6151,8089' 2>&1 | Tee-Object -FilePath "$dur11Root/results/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; retain named errors and stop' }
```

No repeat qualification/pilots, additional experiments or unrelated cleanup.

## Required report

Write `docs/briefs/bot-balance-durability11-report.md` and index in docs/README.md.
Record hashes, completeness, verification log, timings/resources and censoring.
Verify ready values and actual stance, not just template labels.

- Per species/node/build: seed clean TTK medians -> class outer median -> six
  baseline center; alternatives separate. Show all three seed values, sample
  counts, kills, unfinished/regained and no-contact rows. Do not pool species.
- Baseline survival and actual target exposure first. For every death and
  survivor<20% HP inspect10s/30s around the death or minimum-HP timestamp.
  Attribute Bear/caster and Silverback/Stalker/Chameleon separately.
- Track DoT Slinger Bear failures without letting a known poor alternative
  erase six-baseline success. Still report severity and any new baseline failures.
- Check whether targeted defensive stance remains useful on fresh Jungle seeds;
  retain offensive Apprentice/Spirit. Minion/slot snapshots can explain Conduit
  delivery/exposure; do not treat player-only zero attack beats as inactivity.
- Swamp duration remains below the25–35s toughest-body reference. Do not call
  that target reached or demand more HP automatically. Check shell/pool exposure,
  class spread and engagement stalls before proposing the next durability step.
- Summarize retain/watch/revisit for each adopted change. No operator-selected
  balance edits. Death-free but stalled is not a successful combat observation.

Synthetic prepared combat only: no economy/acquisition/travel/client/human-feel
certification. A green confirmation permits planning the next roster/ability
scope; it does not close every tier or resolve the known movement issue.

## Qualification receipt

READY: all42 configurations qualified on frozen source. Three30s tooling pilots
and report generation passed. Actual stances, target presence, seed set and
absence of overlays verified. No full experiment launched.

- Root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability11` (`qualification` and `pilot`).
- Qualification index SHA256: `4fbccf258e410f462ff1d69ddf2f8db62b07761adfd46810c00ecd99e2986dc4`.
