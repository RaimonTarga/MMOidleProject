# Luna execution handoff — farming sustain 01

Execution source: **d056896dffd62dc24f0d13ead7b887e61d357006** (local commit).
Baseline production R2: `c9e65b81b2b87bd8ecc342dc0f3d36db1f5efdfa`; its gameplay sources match prior run `f9dcde59217770390752f3ce0f089e323b0a6f37`. No balance treatment revision exists. Treatment identities are the manifest's explicit charm/policy arms, all on one execution revision.

Fixed execution checkout: `C:/Users/osaif/AppData/Local/mmo-idle/fu01-0921`.
Packet: `C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/farming-sustain-01-preparation/packet`.
Verified zero-tick receipt root: `C:/Users/osaif/AppData/Local/mmo-idle/fu01-data/qualification`.
Reserved NEW main output: `C:/Users/osaif/AppData/Local/mmo-idle/fu01-data/run-01`.
Publication target: `reports/player-fast-pass/farming-sustain-01/run-01/` in the normal publishing checkout.

Read [README.md](README.md) and [CONDUIT-REVIEW.md](CONDUIT-REVIEW.md). **Run A/B only: 20 observations; no C candidate and no extra eight cases.** Do not repeat qualification or prepare/reseal the packet. Do not use a later publication checkout to execute.

After being assigned execution, use exactly:

```powershell
Set-Location 'C:/Users/osaif/AppData/Local/mmo-idle/fu01-0921'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/farming-sustain.mjs --mode=verify "--packet=C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/farming-sustain-01-preparation/packet"
if ($LASTEXITCODE -ne 0) { throw 'Source/packet verification failed; stop and preserve.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/farming-sustain.mjs --mode=run "--packet=C:/Users/osaif/Documents/Claude/Projects/MMO idle/reports/player-fast-pass/farming-sustain-01-preparation/packet" --out=C:/Users/osaif/AppData/Local/mmo-idle/fu01-data/run-01
```

The dispatcher derives each actual child command, sequentially:

```text
node <frozen server-resolved tsx/cli> --conditions=development scripts/ttkSurvey.ts
 --trial=farming-sustain-01 --block=<manifest observation ID> --mode=run
 --revision=d056896dffd62dc24f0d13ead7b887e61d357006
 --source-contract=<packet>/identity.json
 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json
 --out=C:/Users/osaif/AppData/Local/mmo-idle/fu01-data/run-01/<observation ID>
```

It validates the child source contract, runtime, hitboxes, manifests, applied receipts and unchanged ecology. A fresh output and absence of `run-launched.json` are required. Shared operational/readback/source failures stop the family; preserve logs and remaining not-run rows. The child has a 120-second wall ceiling per observation and the parent a 15-minute process timeout; either is operational failure, never an invitation to extend/retry. Valid deaths/caps continue to the next sealed row. No adaptive selection or source mutation.

Expected root files: manifest.json, identity.json, results-summary.json, resolved-builds.json, raw-inventory.json, complete.json or partial.json. Each case has process argv/log, manifest/index/completion; successful measured evidence is nested `<id>/<id>-s101003/` with ready.json, summary.json, events.jsonl, samples.jsonl, sustain-transitions.json and Conduit's conduit.json where applicable.

Write a readable report comparing charm effects, native low-HP policy and their interaction, with survival alongside fixed-window kills, unused/activated triggers, lost barrier/RP and source/measurement limits. Keep full histories externally; copy compact evidence and its inventory only. Report source-specific healing/overheal/counterfactual lost damage as unavailable unless additional existing evidence supports a clearly labeled estimate. The old Tundra “damaged target” actually took no HP damage; do not repeat that misleading inference.

Under the later execution/publication assignment, commit and push the scoped report and receipts, verify remote publication, and return branch, execution SHA, publication SHA, report link and complete/failed/not-run counts. Do not rewrite prior reports or publish unrelated files. At most three next decisions; no automatic follow-on experiments.
