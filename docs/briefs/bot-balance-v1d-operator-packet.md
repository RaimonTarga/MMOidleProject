# V1d — Preparation with repaired transit recovery

2026-09-12. Astra plans/interprets; Luna operates one bounded run.
Frozen source: `028e8933118364e6b5e7129e57acb4c4fb7cd23d`.
Route: `striker-campaign-preparation-t1`, version 1.0.0.

## Treatment and execution

Use the complete [V1c packet](bot-balance-v1c-operator-packet.md) treatment,
readiness gates, evidence requirements and supervisor-failure contingency, with
the revision and output report below. The route is unchanged, so its final
labels remain `v1c:verified-plains-build`, `v1c:preparation-complete` and
`v1c:final-readiness`. The executor repair is the only new treatment factor.

```powershell
pnpm experiment:create --revision=028e8933118364e6b5e7129e57acb4c4fb7cd23d --routes="striker-campaign-preparation-t1" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

Run preflight, verify sealed source/tree/image and runtime hashes, then launch
only the returned exact experiment ID once. One fresh clean-entry Striker, no
snapshot/profile import, fastBossRetry=false, no boss step. Keep the full earned
GM30/four +5 kit, exact Sweep/Second Wind build and all assertions. No retries,
resource injection, route edits, tactical intervention or ceiling extension.
Do not resume V1c or reuse its incomplete snapshot.

## Additional travel observations

For each natural transit death, record death time/node, live respawn time/node,
subsequent node arrivals, destination arrival or failure, attackers and elapsed
travel/recovery. Preserve existing intent evidence if available; do not infer
that a navigation intent was sent merely from a travel activity label. Do not
induce deaths to manufacture a test. With no death, runtime respawn recovery is
untested even if preparation succeeds; the deterministic regression is separate.

Distinguish repeated dangerous crossings from remaining navigation defects and
from supplier farming. The 10-minute arrival timeout and 30-minute run ceiling
remain unchanged. Stop/report if they fire; do not extend a live run.

Write/index `docs/briefs/bot-balance-v1d-report.md`, including all V1c final-kit,
readiness, acquisition, death, provenance and terminal-agreement requirements.
Keep eligibility flags: 25x is noncanonical and cannot support 1x economics.
Preserve final summary, events, character identity, database volume and snapshots
for Astra's review. No cleanup, snapshot relabeling, boss attempt or downstream
experiment follows automatically. Return after this one run.
