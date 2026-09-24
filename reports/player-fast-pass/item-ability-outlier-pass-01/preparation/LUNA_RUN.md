# Luna runbook — item and ability outlier pass 01

Preparation only. Execute once only after the operator assigns this exact matrix and candidates. No assignment is implied by the preparation request. Read BRIEF.md, REVIEW.md, CANDIDATES.md, PACKAGES.md and BACKLOG.md first. Nothing is adopted or merged by this packet.

## Frozen identity and paths

- Source: `0d392fdddaec7ed31876699589f291c8c840a5e5` at `D:/mmo-idle/item-ability-outlier-pass-01/source`.
- Gameplay baseline: `1980a6b06d6b483c0310ee86d9e2d464dedba8df`.
- Packet: `D:/mmo-idle/item-ability-outlier-pass-01/packet`.
- Qualification: `D:/mmo-idle/item-ability-outlier-pass-01/qualification`.
- Receipt replay: `D:/mmo-idle/item-ability-outlier-pass-01/receipt-check`.
- Reserved fresh combat destination: `D:/mmo-idle/item-ability-outlier-pass-01/run-01`.
- Hitboxes: `D:/mmo-idle/item-ability-outlier-pass-01/hitboxes.json`.
- Publication checkout: `D:/iaop1pub`, branch `codex/item-ability-outlier-pass-01-packet`.
- Future compact results: `reports/player-fast-pass/item-ability-outlier-pass-01/run-01/`.
- Node/runtime/source/file hashes: identity.json. The control/candidate identity aliases point to the same immutable test harness; the candidate is a child-local item overlay recorded in each applied receipt, not a different source checkout.

Do not edit, build, install, checkout, normalize or publish in the frozen source. Receipt identity includes absolute paths. Do not copy this packet to a new path and assume it remains qualified. Do not edit the independent active Volcano experiment or consume its worker allocation. One combat child at a time; if the host is already running the Heat worker, obtain the operator's scheduling assignment before starting this run. Preparation is not permission to run concurrently.

## Matrix

44 fresh lives, all farming, seeds101009/101033, 100ms ticks, 600000ms cap, first owner death stops. 300000/600000ms endpoints. No boss lives; the general 300000ms boss cap remains unused. Wasteland boss, Volcano, guardian/economy and broad stance/roster screens are excluded.

- Mobility16: Desert T4 Ritualist and Slinger light-a **Duelist** (the sealed case label `desert-ranger` is only a fixture label), control/D; Swamp T2 Squire light established Desert and T3 Slinger light Swamp, control/S; two seeds each.
- Arcanist12: T4 Reverb and Idolwright, current .20 power / candidate .30 power / Tempered; two seeds each. Other gear and Technique kit fixed within each triple.
- Abilities8: T4 Reverb and Idolwright, Power Strike6 RP versus Quick Strike5 RP, same Frenzy/defenses/native timing; one additional RP remains free in the Quick Strike arm. Two seeds each. Whole ability-choice opportunity comparison, not pure cast occupation or equal-budget optimality.
- Rites8: T4 Reverb Tundra, no Rite versus Swift Repose2 RP, and separately no Rite versus Ability Reprieve5 RP; two seeds each. Controls are separately fresh and count toward44. Historical actual boundary/cooldown opportunity is recorded in rite-opportunity-evidence.json.

The unused4 slots remain unused. ORDERED_CASES.tsv and manifest.json prescribe the sequence; do not replace duplicates, change order, add seeds or fill the allocation. T4 GM148/45 RP/+4 ordinary/+0 cores/relics; T2 GM70/30 RP/+4; T3 GM102/36 RP/+3. Exact mastery, gates, recipes, prior purchases, abilities, stances and assembled Rune costs are in resolved-builds.json. No Blood Offering ownership or attunement. T3 retained core remains T3 +0, not promoted to T4. Native formation/owner delivery and explicit historical Rune rules remain as declared.

## Already performed preparation — do not repeat

The dispatcher prepared and qualified44/44 at zero ticks from the final execution path. The subsequent receipt-check uses the same child path and compares complete applied receipts. VALIDATION.md and the copied completion receipts give final replay status. Neither operation is combat or budget consumption.

## Execute once after assignment

Read-only verification may be repeated. The run branch remains deliberately unexercised during preparation; no pilot is authorized.

```powershell
Set-Location D:/mmo-idle/item-ability-outlier-pass-01/source
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/item-ability-outlier.mjs --mode=verify --packet=D:/mmo-idle/item-ability-outlier-pass-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/item-ability-outlier.mjs --mode=run --packet=D:/mmo-idle/item-ability-outlier-pass-01/packet --out=D:/mmo-idle/item-ability-outlier-pass-01/run-01
```

Use one durable supervised terminal. A launch marker prevents retries. Do not clear it. Each child writes process.json/log and authoritative ready/summary/complete artifacts. One worker, 5GiB free disk, 1GiB host free RAM, 2GiB child RSS, five-second polling,120s heartbeat bound, zero retries. An inherited eight-hour wall scheduling ceiling finishes the active observation and records unstarted rows rather than extending. There is no automatic second run.

Gameplay death is an observation: continue the fixed queue. Source/runtime/process/receipt failure is operational: the shared farm family stops; preserve failed/not-run rows. No reseed, adaptive rescue, changed caps, tuning, live-source import or repair. A later relevant patch does not relabel the measured source and does not authorize rerunning.

## Required result interpretation

Compare within fixture, progression and matched arms. Preserve equal-window work, completed kills, survival/time-to-death, unfinished targets/stalls, HP/barrier, meaningful slow/kite exposure, actual delivered ability effects, cast interruptions and owner/summon availability/payments. Existing raw events, guard cooldown records, samples, sustain transitions and Conduit streams are the evidence. Do not infer useful damage from activation totals or exclusive healing from unlabeled aggregate heals. Exact counterfactual lost attacks/damage may remain unavailable; report that limit rather than manufacture attribution. Ability budgets include all attunements and condition+action costs.

For Rites, count true phase changes into OOC rather than every sustain log row; join remaining cooldown at those boundaries. If current cases provide no meaningful opportunity, report an uninformative contrast and do not change fixture/duration. For mobility, identify actual relevant slows/away motion and note sampled uptime resolution. Root/control-duration resistance remains distinct. Post-death endpoints remain null. Do not pool biomes or convert a passive ratio directly into kills/minute.

## Publish once and stop

Use the publication checkout, leaving frozen source/packet/raw outputs unchanged. Produce REPORT.md, compact results-summary.json, PATCH_PROPOSALS.md (at most six changes), applied/terminal/source receipts and preserved external raw inventory. Raw JSONL stays external; inventory alone is not an archive. Include at most selective proposals supported by matched evidence, with current/candidate values, consumer, source, counterexamples and adoption risk. No automatic merge/deployment.

Scoped commit and push to the publication branch; verify remote branch SHA and retrieved REPORT.md blob. Publication failure does not authorize combat replay. Return source/publication identities, planned/completed/dead/failed/not-run counts, wall time and limitations. Stop after the compact result bundle.
