# Durability26 — targeted T4 anchor pacing

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Execute once sequentially.
No subagents, retries, adaptive builds, production edits, commits, pushes or cap extensions.

## Decision from Durability25

216 observations completed, 194 windows / 22 deaths / no wall cutoffs. Verified
Mountain deaths by tier: T2 14/36, T3 2/36, T4 4/36. Desert: 1/36, 0/36, 1/36.
Representative primary TTK T2/T3/T4: Mountain 19.28/25.27/14.50s; Desert
8.80/22.10/14.61s. T4 pacing reverses despite selected HP increases.

Planner correction: this is a gap against user intent, not grounds to reject
the intent of rising TTK. It supports a local HP candidate experiment, though
not immediate global adoption. Trial only the two recurring primary anchors;
do not retune every T4 species or the whole progression scalar. Slow class tails
and attrition must remain visible. Broad class balancing stays later.

T2 Mountain's 14/36 deaths warrant focused pressure review; they are not dismissed
as occasional losses. Death attribution alone does not prove the Eagle dive is
the culprit. Review existing evidence as specified below, without a new T2 run.

## Sealed matrix

Mountain and Desert blocks, each 24 cells / 72 observations: six T4 branch-A
builds, nodes03/05, paired control/candidate, seeds62003/64007/66029.
Total48 cells /144 observations. Each lasts600 simulated seconds or first death.
Same fully prepared synthetic builds as Durability25 T4: medium/native range,
Maestro, Reverb, Pyromancer, Bounty Hunter, Marshal, Equinox. Same weapons, biome
armor/charm, Mountain boots, Tempered Core, Colossus Heart, +5 gear, normal
targeting, Offensive stance, Frenzy/Sweep, Second Wind/Cleanse and existing runes.
No economy, travel, Docker or services. Natural ecology,100ms ticks.

Both arms install the selected Durability22 HP package. Control is therefore
the Durability25 selected T4 baseline, NOT the original low-HP production data.

| Block | Only additional candidate change | Control base HP | Candidate base HP |
| --- | --- | ---: | ---: |
| Mountain | Granite Mammoth HP | 6900 | 13800 |
| Desert | Dune Basilisk HP | 4503 | 9006 |

Mammoth ward percentage halves again to preserve the SAME absolute ward capacity.
No attack, plating, DR, ability cadence, other shield, ecology or build change.
Other selected species values remain identical between arms. Definition overlays
restore after each run. Node03 Mountain modifiers still apply to actual READY HP.

Doubling is a probe intended to bring the representative primary T4 durations
above T3; duration is not assumed linear. It may produce excessive Reverb/Marshal
tails. Do not force the fastest class to meet a universal floor or silently drop
the slow classes. Other anchors such as Rhino/Tyrant are monitored unchanged, not
automatically given this factor. Trench's40–60s band is NOT a universal T4 target.

## Frozen identity / readiness

Revision `9c333816f4e81f73bbc984a0fc62e0bcbd5603ba`
Branch `codex/durability26-frozen`
Tree `c86a7520b2af038ae0eee284030019273d013154`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen gameplay as Durability25; concurrent shared-checkout changes excluded.
Current-source reconciliation is still required before shipping. Readiness receipts:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability26.
Preparation uses identical source around freezing; metadata may name its parent.
All 48 setup checks and 24 short pilots passed; matrix/fixed-ward/restoration test,
benchmark typecheck and syntax/diff checks passed. These are readiness, not live balance proof.
No full-suite or live/browser test is claimed.

Expected20–40 wall minutes, uncertain because longer fights can affect simulation.
Per observation120s wall/2GiB RSS; per block30min soft/35min watchdog; queue3h safety.
No cap extensions. Budget partials advance; unexpected identity/runner/audit failures
stop. Preserve all partials. No global cleanup or forced source deletion.

## Execute once

```powershell
$dur26Revision = '9c333816f4e81f73bbc984a0fc62e0bcbd5603ba'
$dur26Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability26-20260917'
$dur26Source = "$dur26Root/source"
if(Test-Path -LiteralPath $dur26Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur26Root | Out-Null
git worktree add --detach "$dur26Source" $dur26Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur26Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur26Source/scripts/durability26-run.mjs" "--out=$dur26Root/results" "--revision=$dur26Revision" --tree=c86a7520b2af038ae0eee284030019273d013154 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur26Exit = $LASTEXITCODE
@{exit=$dur26Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur26Root/operator-exit.json"
```

## Required analysis

Write docs/briefs/bot-balance-durability26-report.md and index docs/README.md.
Verify READY builds, paired geometry by node/class/seed and actual HP/defense
products. Only primary body HP differs; absolute Mammoth ward must match arms.
Compare the new control and candidate on fresh paired seeds. Durability25 T3 is
a reference on the same gameplay, NOT a same-seed paired counterfactual.

Use eligible per-seed clean body medians then cell medians from night5-audit.json;
at least2 eligible seed pairs. Show each named specialization/node, equal-root
centers, fastest/slowest tails, deaths, time/kills before death and missingness.
Never pool all kills to manufacture average DPS. Retain unfinished/regained,
long-quiet, dead and wall-cutoff observations. Observe actual episode duration
from index episodes, initial members and late joiners, not pooled body TTK.
Long chain pulls are not evidence of a high simultaneous swarm count.

Show candidate/control effects and candidate-versus-T3 reference separately.
Inspect incoming10s/30s windows for repeated losses; normalize pooled cast and
damage exposure by simulated time. If pacing improves but losses/long tails worsen,
recommend a bounded compromise or damage review; no automatic damage compensation.

### Bounded read-only T2 Mountain pressure review

Use existing Durability25 Mountain data at:
C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917/results/mountain.
Review the14 T2 deaths, their10s/30s event/sample windows, and same-node/class
surviving seeds when present. Separate Eagle charge/dive, ordinary Eagle hits,
Titan attacks and Boulder Thrower damage; killing blow is not total cause.
Record health before pull, overlapping attackers, telegraph/escape activity,
recovery interruptions and late joins. If ability attribution is unavailable,
say so. No extra simulation, source changes or broad log exploration. Cap this
review at30 minutes; preserve a precise unresolved question if incomplete.
The comparison is descriptive, not a causal survival control.

## Finite next decisions

Recommend adopt/adjust/reject for EACH primary candidate. Do not declare every
class equally paced or the entire tier finished. Retain the selected Graveyard
normal-targeting shape and other prior candidates; no Focus repeat grid.
List remaining work explicitly: resolve T4 role timing, T2 Mountain pressure,
T2 Desert's short controller timing, Jungle performance/durability, Trench Stalker
below target, then consolidate/reconcile production values and run focused current-
source checks. Representative bosses/progression, basic x1 pacing and operations
precede invited players; deep item/class/ability balancing stays later.
No production adoption or extra run is authorized by this packet.
