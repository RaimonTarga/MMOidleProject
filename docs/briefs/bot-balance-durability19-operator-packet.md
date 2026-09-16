# Durability19 — current-runtime Forest and Volcano candidate confirmation

Prepared 2026-09-16. Manual Luna operator. Full experiment NOT launched.
Execute once sequentially; no retries, adaptive builds, subagents or source edits.

## Decision from Durability18

Wolf22 offensive and Wolf27 defensive each removed Striker's death/low-HP tail
in the fixed Forest03 screen. Wolf22 kept Wolf median20s (reference19.25s), while
defensive stance extended it to30.6s. Carry Wolf22 as the shared mob candidate;
defensive stance remains an optional ordinary player answer, not a new mandatory
baseline. Apprentice also survived. Six matched sets had no long-quiet flags.

Corrected Durability18's erroneous READY table against raw artifacts: scaled Wolf
attacks32/26 and Badger30, not41/32 and37. Actual base overlays27/22 and25 were
correct. The mixed-body median decrease under Wolf22 was not faster Wolf TTK.

No more old four-arm pressure replays: confirm selected candidates against current
unmodified mob values on the same updated runtime with fresh seeds and six roots.
Conduit remains measured, but class/minion delivery weakness is a later class-pass
question. Preserve actual stalls as separate failures; do not tune all mob duration
to Conduit. Forest and Volcano decisions can be accepted/rejected separately.

## Matrix and immutable treatments

Forest T2 nodes03/05 and Volcano T3 nodes03/05, six roots, two arms, three seeds:
48 cells/144 observations,72 per biome. Seeds14009/16001/18013 are fresh to this
confirmation. Natural ecology, fresh prepared World per observation,100ms tick,
300s maximum or first player death. Existing medium-frame/native-range templates,
+5 gear, offensive stance, Sweep/guards and T3 Frenzy remain fixed within pairs.
No defensive-stance arm: the player-choice question has already been tested.

| Biome | Arm | Changed base definitions |
| --- | --- | --- |
| Forest | control | Wolf525HP/34attack; Badger315HP/31attack |
| Forest | candidate | Wolf1575HP/22attack; Badger945HP/25attack |
| Volcano | control | Tortoise2000HP/145attack; Salamander1330HP/105attack |
| Volcano | candidate | Tortoise3000HP/116attack; Salamander1330HP/84attack |

Forest Whelp155HP/14attack and Spitter300HP/31attack stay unchanged; so do Volcano
Scuttlers/Hounds. Tortoise Guard remains14%: base shield280 becomes420 with HP.
All ecology, Howl, Heat, defenses, abilities, weapons, classes and follower stats
are unchanged WITHIN each pair. Node scaling/rounding follows the actual runtime.
Candidate combines durability and attack: this confirms a package, not isolated
HP or attack causality. No production monster file is edited by the overlays.

Expected10–25 wall minutes, up to12h simulated,120s observation wall/4h block/2GiB
RSS ceilings. No Docker/DB/services or acquisition/travel. Deaths and stalls advance
through the fixed matrix; tooling failure stops and preserves partial artifacts.

## Source reconciliation and identity

- Revision: `6ac0a4b783f89c45dc672e96b646b17bbc016cfb`
- Retained branch: `codex/durability19-frozen`
- Tree: `3dc3a4cb18c3efaca44e80cab083ee269685ad80`
- Definitions SHA256: `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Source snapshot parent c9738063c198227cff8b331a8eb7a0a5e908c843 copies the current
tracked server/shared edits and their tests into the detached checkout, including
deathAttribution.test.ts. It does not stage/commit those concurrent edits in the
main checkout. This captures current simulation code at preparation time, not a
promise that later shared-checkout changes are included.

Reviewed differences include Heat/chill clearing on biome exit/death (rather than
lingering), source snapshots and names for DoT/death attribution, status labels,
and committed Detonate FX payload metadata. New attribution can change telemetry
classification even when HP damage is unchanged. Heat cleanup primarily affects
exit/death; this no-travel trial does not validate traversal. Boss label changes
alter the definitions hash but no boss combat is measured. Compare new pairs for
balance; historical numbers remain context, not isolated treatment estimates across
runtimes. No new numeric class/ability balance was introduced for this snapshot.

Preparation:48 setups qualified and four30s pilot observations (Striker03,
control/candidate in each biome) passed with zero deaths/long-quiet flags. Overlay
full-database isolation/restoration test, benchmark typecheck, deathAttribution,
ambientRamp, tundraChill and abilityAffliction tests passed. Full suite and browser
playtest not rerun. Pilot is tooling evidence, not a balance result.
Artifacts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability19/{qualify,pilot}.
Do not rerun preparation. Use durability19-exposure.mjs for TWO-arm matched sets.

## Operator commands

Run from main repository. Existing output root means inspect/report, not relaunch.
```powershell
$dur19Revision = '6ac0a4b783f89c45dc672e96b646b17bbc016cfb'
$dur19Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability19-20260916'
$dur19Checkout = "$dur19Root/source"
$dur19Out = "$dur19Root/results-confirmation"
$dur19Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur19HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur19Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur19Hitboxes).Hash -ne $dur19HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur19Root | Out-Null
git worktree add --detach "$dur19Checkout" $dur19Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur19Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur19Checkout" rev-parse HEAD) -ne $dur19Revision) { throw 'Revision mismatch' }
if ((git -C "$dur19Checkout" rev-parse 'HEAD^{tree}') -ne '3dc3a4cb18c3efaca44e80cab083ee269685ad80') { throw 'Tree mismatch' }
if (git -C "$dur19Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur19Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur19Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability19 --mode=run "--revision=$dur19Revision" "--hitboxes=$dur19Hitboxes" "--out=$dur19Out"
$dur19Exit = $LASTEXITCODE
@{trial='durability19'; start=$dur19Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur19Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur19Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur19Out/index.json") {
    node "$dur19Checkout/scripts/ttk-survey-report.mjs" "$dur19Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur19Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur19Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur19Out" --trial=durability19 "--revision=$dur19Revision" --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 "--hitboxes=$dur19HitboxHash" --cells=48 --runs=144 --seeds=14009,16001,18013 2>&1 | Tee-Object -FilePath "$dur19Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
node "$dur19Checkout/scripts/durability19-exposure.mjs" "$dur19Out"
if ($LASTEXITCODE -ne 0) { throw 'Exposure audit failed; preserve and stop' }
```

## Required report and decision boundary

Write docs/briefs/bot-balance-durability19-report.md and index it. Record hashes,
completeness, resources/wall time and72 paired geometry/equipment/stance audits.
Read actual ready.json for both hpTreatment and initialStats: do not infer scaled
attacks from a previous report. Audit fixed whelp/spitter/scuttler/hound values.

Report deaths, minHP, kills, recovery, incoming-source windows and species TTK
separately by biome/class/node/seed/arm. Compute per-seed clean target medians then
outer medians, keeping missing/unfinished/regained separate. Do not call mixed-body
TTK a Wolf/Tortoise median or pack-clear duration. Report raw minion delivery for
Conduit; zero player attack beats alone do not mean inactivity. Inspect deaths and
<20% survivors with10s/30s source windows; separate direct/DoT/debt/environmental
state and note new attribution fields. Include Howl/Guard cast counts where useful.

Expose all raw outcomes, then paired sensitivity excluding BOTH arms of any set
with >=30s internal/terminal outgoing inactivity. Keep deaths visible even when
excluded from that sensitivity. Fewer than two usable seeds per class/node means
inconclusive, not permission to select favorable survivors. No movement gate or
automatic retry. New seeds are a small confirmation sample, not a precise death rate.

Decision at review: does each package retain intended adult duration while improving
pressure across roots/nodes without a new severe regression? Wolf/Tortoise durations
must be read against role and class spread, not a mandatory universal15/20s floor.
An optional defensive player strategy remains valid; offensive survival is a useful
baseline, not a game-design axiom. Keep Conduit's class uncertainty distinct from
true engagement defects; a Conduit exception does not automatically reject every
other class's evidence or automatically certify Conduit.

Recommend adoption, rejection or one specific unresolved limitation per biome.
Do not auto-apply production balance or launch another matrix. If these confirmations
hold, the next planner decision should be concrete shared mob patches and remaining
T2/T3 coverage, rather than repeating the same candidate-selection loop. Deferred
Volcano Conduit failures remain an explicit issue; the new sample does not erase
historical failures. Class/ability, boss TTK and T4 passes remain later.
Synthetic prepared combat only: no acquisition/economy, route, browser/human-feel or
complete-tier certification. Preserve partials and unrelated workspace changes.
