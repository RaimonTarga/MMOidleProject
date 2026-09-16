# Durability17 — T2 Forest adult durability and pack pressure

Prepared 2026-09-16. Manual Luna operator. Full experiment NOT launched.
Run once sequentially, no subagents/retries/adaptive templates/source edits.

## Durability16 assessment and campaign decision

Raw results confirm72 observations: reference one death; each attack-relief arm
zero deaths. Seven long-quiet rows exclude3/18 complete four-arm sets. Conduit03
now has two usable matched seeds, but its lethal8089 case is excluded from the
matched screen because the surviving treatment arms stop fighting; retain that
death in all-outcome reporting. Conduit05 has no clean Tortoise median even in
its two retained sets. These are specific unresolved cases, not a global pass.

Both80 is the leading Volcano candidate at Tortoise HP3000: stronger minimum-HP
medians in the four Apprentice/Slinger groups than either single reduction.
The single reductions are inconsistent; this does not prove both are necessary
for every build. Both80 lowest observed HP is34.3%, versus37.1% for tortoise80;
it does not dominate every metric.36/36 repeated bookends matched Durability15,
which is reproducibility, not another independent confirmation.

Carry candidate Tortoise HP3000/attack116 and Salamander attack84 forward without
production adoption. Do not repeat the old four-arm Volcano matrix. Preserve
Conduit8089/3911 as a separate movement/minion follow-up, reconcile current combat
changes and test fresh seeds before adopting. That work does not block Forest.
The report's closing request to keep all four arms in every follow-up is advisory,
not a standing requirement to repeat answered comparisons.

## Why Forest and what changes

Night4's T2 Forest Dire Wolf body medians were roughly3–4s at the node aggregate,
with class variation. This is a baseline clue, not a controlled estimate for the
new seeds/runtime. Forest is a remaining T2 role gap; T2 is not a finished target
reference. Forest's damage identity is frequent attacks/evasion, so do not add
plating or DR to obtain duration. Test larger bodies, retain vulnerable followers.

Six baseline roots x Forest03/05 x four arms x three fresh seeds =48 cells/144 runs.
Seeds9029/10427/12007; fixed Sweep, medium frame, existing T2 ranges, forest armor
and charm, inherited baseline weapons/mountain boots/tempered core at +5,
offensive stance, Second Wind/Cleanse, existing movement/recovery rules.
This is not a Sweep-versus-Slam or gear-optimization test.

| Arm | Dire Wolf HP / attack | Badger HP / attack |
| --- | ---: | ---: |
| control | 525 /34 | 315 /31 |
| adults2 | 1050 /34 | 630 /31 |
| adults3 | 1575 /34 | 945 /31 |
| adults3-pressure80 | 1575 /27 | 945 /25 |

Attack relief rounds each base attack to the nearest integer. Dire Whelp stays
155HP/14attack; Thorn Spitter stays300HP/31attack. T1 definitions untouched.
Howl, charge, Barrage, pack sizes, spawn ecology, attack speed, defenses, items,
classes and abilities remain unchanged. A longer-lived Wolf can Howl more often:
this is a meaningful consequence of durability, not an attack-stat confound to hide.
The adult pressure arm changes Wolf AND Badger, not all incoming sources. It does
not isolate their individual attack effects or soften Howl itself.

The2x/3x values bracket a substantial duration change; they are probes, not chosen
production multipliers. The provisional T2 toughest-monster target has a15s floor,
but whelps and every adult in a four-wolf pack need not independently meet it.
Measure pack pressure and role duration before applying a solitary-elite target.

Fresh World per observation,100ms tick,300s maximum, first player death ends the
observation. Natural ecology only. Process-local overlays restore definitions.
Expected15–30 wall minutes, up to12h simulated;120s per-observation wall/4h block/
2GiB RSS ceilings. No Docker, DB, travel or acquisition runs. Deaths/stalls advance
the matrix; tooling failure stops and retains partials. No movement gate/retries.

## Frozen source and preparation

- Revision: `413a43e5cd2c8afbbcf02dbcdc62e804cb5a3eb2`
- Branch retained: `codex/durability17-frozen`
- Tree: `093ee08db54a589e1def6525206123282550ca97`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Parent is Durability16's frozen combat baseline. Concurrent combat/DoT/status
changes remain excluded; this is comparative candidate discovery, not evidence
that current shared HEAD has been balanced. Reconcile before production adoption.
No Volcano numeric changes are installed in the Forest trial.

Local48-case setup qualification and four-arm Squire05/9029 30s pilot passed,
zero pilot deaths/long-quiet flags. Full-database overlay isolation/restoration
test and frozen benchmark typecheck passed. Pilot is tooling evidence only.
Full suite/live browser not rerun. Artifacts under:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability17/{qualify,pilot}.
Do not rerun these. The manifest-driven durability15-exposure.mjs handles the
new four-arm names and was checked against the pilot.

## Operator commands

Run from main repository. Existing root means inspect/report, never overwrite.
```powershell
$dur17Revision = '413a43e5cd2c8afbbcf02dbcdc62e804cb5a3eb2'
$dur17Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability17-20260916'
$dur17Checkout = "$dur17Root/source"
$dur17Out = "$dur17Root/results-forest"
$dur17Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur17HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur17Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur17Hitboxes).Hash -ne $dur17HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur17Root | Out-Null
git worktree add --detach "$dur17Checkout" $dur17Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur17Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur17Checkout" rev-parse HEAD) -ne $dur17Revision) { throw 'Revision mismatch' }
if ((git -C "$dur17Checkout" rev-parse 'HEAD^{tree}') -ne '093ee08db54a589e1def6525206123282550ca97') { throw 'Tree mismatch' }
if (git -C "$dur17Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur17Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur17Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability17 --mode=run "--revision=$dur17Revision" "--hitboxes=$dur17Hitboxes" "--out=$dur17Out"
$dur17Exit = $LASTEXITCODE
@{trial='durability17'; start=$dur17Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur17Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur17Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur17Out/index.json") {
    node "$dur17Checkout/scripts/ttk-survey-report.mjs" "$dur17Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur17Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur17Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur17Out" --trial=durability17 "--revision=$dur17Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur17HitboxHash" --cells=48 --runs=144 --seeds=9029,10427,12007 2>&1 | Tee-Object -FilePath "$dur17Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
node "$dur17Checkout/scripts/durability15-exposure.mjs" "$dur17Out"
if ($LASTEXITCODE -ne 0) { throw 'Exposure audit failed; preserve and stop' }
```

## Required report

Write docs/briefs/bot-balance-durability17-report.md and index it. Record all hashes,
wall time,48/144 completeness,36 four-arm geometry/equipment checks, READY HP/attack
values and unchanged follower/ranged stats. Preserve every death and raw artifact.

Report per-species, per-class/node/seed clean body TTK medians then outer medians;
retain counts for killed, censored, regained and missing targets. Keep all-outcome
results plus sensitivity on entire four-arm matched sets without any >=30s internal
or terminal outgoing gap. Never remove only the failing arm. Keep death outcomes
visible even when their matched set is excluded. Quiet survival is not safety.
Record approach/recovery time and minion attack beats, not only player attacks.

Measure Dire Wolf, Badger, Whelp and Thorn Spitter separately. Include kills per
window, minimumHP, pressure sources, recovery, Howl casts and temporal pack overlap
where telemetry supports it. Do not call global body TTK a pack-clear duration;
if exact pack lifetimes are unavailable, mark that metric unavailable. Unchanged
whelp stats can still have changed exposure due to prolonged Howl/pack combat.
Inspect all deaths and <20% survivors with10s/30s incoming-source windows.

Compare adults2/control and adults3/control for the joint adult durability effect;
compare adults3-pressure80/adults3 for the joint adult attack effect at fixed HP.
Do not infer species-specific causal multipliers from the bundled treatments.
Do not claim fresh seeds alone validate the live runtime or all tiers.

End with a role-specific recommendation: keep, choose an intermediate HP level,
carry the pressure arm, or reject. Identify whether the limiting factor is adult
body duration, extended Howl, follower/ranged pressure, class damage or movement.
No automatic HP escalation to make the fastest class take15s; avoid excessive
slow-class tails. If fewer than two matched seeds survive in a class/node, mark
that comparison exploratory/inconclusive rather than choosing the best-looking arm.

No automatic production patches, extra matrices or ability changes. After this,
review Forest alongside remaining T2/T3 role coverage and the parked Volcano
candidate. Source reconciliation/fresh confirmation precede adoption. Slam/ability,
item/class balance, boss TTK and T4 remain later. Synthetic combat only: no economy,
route/acquisition, browser/human-feel or complete-tier certification.
