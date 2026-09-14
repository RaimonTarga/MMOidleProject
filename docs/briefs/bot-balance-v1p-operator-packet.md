# V1p — Volcano swarm preparation and natural Tundra counterplay

Prepared 2026-09-14 for user-launched Luna. Nothing launched. No balance changes.
Read CLAUDE.md. Astra prepares/interprets; Luna operates this packet, preserves
evidence and reports. No source fixes, adaptive builds, retries or extra cases.

## Decision

V1o established single-bear counterplay with Hamstring and Desert Boots. Its
three-body Volcano fixture died even without Heat. Test a credible anti-swarm
kit before choosing mob changes. Heat's outgoing benefit may help finish a
thinning pack; do not assume its ramp itself needs a nerf. The user reports
slow cooldown between pulls, so measure that separately once a pack clears.

Swift Repose costs2RP and halves the post-combat delay. Source uses that delay
for the combat predicate controlling Heat. It can start cooling sooner, but
does not accelerate the one-stack-per3000ms decay after combat ends. It also
cannot force combat to end while targets/contact persist. It is deferred here:
no rite, Heat, monster, target-selection or movement-engine change in V1p.

## Frozen source and evidence

Revision `7340037d6811ab2d956725b022dacdf0ba752429`;
tree `c889112d0b50c1385565eaa6cc3be3baa6dfc449`.
Diagnostic: `server/scripts/v1pDiagnostics.ts`.
Live route: `spirit-tundra-counterplay-t3-v1p`.
Both independently start from the actual retained V1m input:

`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t064043z-spirit-wisp-travel-t2-bridge-v/runs/001-spirit-wisp-travel-t2-bridge-v1m-intended-r01/artifacts/spirit-wisp-travel-t2-bridge-v1m-intended-2026-09-14T06-43-03-630Z-67442d09/snapshot-b.json`

SHA256 `c2e276b2c822c2dc18b570b064637fad845e27a3f180f5581217fa8fb7504144`.
Do not substitute the committed test fixture, V1n end state or diagnostic output.
Preserve Wisp/GM78, earned mastery, wallet and provenance. This is a follow-up
of the existing Wisp candidate, not a new default-range baseline. Future fresh
ranged validation still defaults to medium range.

Preparation evidence at `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1p-preflight-2`:
all four diagnostic setups pass profile and authoritative spawn validation;
ordinary Hamstring purchase, Desert Boots craft and five upgrades succeed from
the actual wallet; both live-route builds validate. Zero combat ticks executed.
An earlier setup-only attempt caught the triple-Guard kit costing32RP; it was
replaced with the explicitly specified Bramble-for-Brace treatment before freeze.
Diagnostic TypeScript check and `pnpm bot:preflight` pass, including bot/server
typechecks and lifecycle checks. No full repository test-suite pass is claimed.
Repeat the exact-source checks below.

RP correction to V1o prose: after removing travel-only rules, control costs27RP
and Hamstring costs31RP, not26/30. Shared fragment accounting means removing two
rules does not necessarily free two points. Both original builds were legal.
V1p diagnostic arms all cost27RP: Bramble and Brace each cost5. Live travel
uses28RP; the Hamstring farming build uses31RP, within the entry budget31.

## Part A — four local Volcano fixtures

One fresh sequential execution, seed173 per arm, fixed Hound + two Scuttlers,
Alacrity, full authored Heat and unchanged anti-kiting. Same initial geometry
as V1o: player220px left of center, monsters at center/+60Y spacing, normal
spawn projection, real node terrain, simultaneous ordinary aggro initialization.
No lava, natural population, recruitment or repopulation. Wisp, Ruinous Axe,
Tempered Core, Plains Boots and Defensive remain fixed. All gear is+5.

| Order | Arm | Armor | Charm | Guards |
|---:|---|---|---|---|
| 1 | volcano-control | Cave Vest | Mountain Charm | Second Wind + Brace |
| 2 | volcano-armor | Plains Enduring Robe | Mountain Charm | Second Wind + Brace |
| 3 | volcano-armor-bramble | Plains Enduring Robe | Mountain Charm | Second Wind + Bramble Guard |
| 4 | volcano-armor-bramble-charm | Plains Enduring Robe | Plains Stalwart Heart | Second Wind + Bramble Guard |

Every arm retains Sweep and the same Orbit/Step Back/Avoid Hazards/Recover First
combat rules; remove travel-only rules identically. Bramble uses its ordinary
three-aggro trigger. These are cumulative package comparisons, not independent
estimates of every interaction. Armor changes HP/plating and loses Cave effects;
Bramble replaces Brace rather than adding free mitigation; the on-kill charm
replaces Mountain sustain. Record benefits and costs. Plains charm is on-kill
recovery, not thorns; Bramble provides the thorns.

Gear and Bramble are diagnostic grants at legal mastery gates, not purchases.
Rewards1x remain and intra-fight progression must be reported. No output is a
valid progression checkpoint. One seed is diagnostic, not a win-rate estimate.

Stop a fight at first death or60 simulated seconds. If the entire roster dies,
continue the same world for30 seconds with no new enemies: record natural
post-combat recovery and Heat decay without clearing statuses or healing by hand.
Maximum90 simulated seconds per arm. This tail is not a chain-pull experiment.
Record failure to recover/cool by the end rather than extending it.

### Local operator commands

Create a NEW detached checkout at the frozen revision and install with
`pnpm install --frozen-lockfile`. Preserve unrelated work; no lockfile changes.
Use new output directories outside the checkout, never overwrite or resume.
Copy the two atlas files from the main project only if missing, verifying both:

- `client/public/assets/sprites.png`: `6ed9a1b7f7124cc2489d42239a73ed5f4a9382b3eeb51ce9be93a53722b72c22`
- `client/public/assets/sprites.json`: `8611f8498a03b0dbd8b7366937ef670686b2bf911c0c6e4310d0ba9aae7c1156`

From isolated root, replace placeholders with the actual input and NEW paths:

```powershell
$env:NODE_ENV = 'production'
pnpm --filter @mmo-idle/server exec tsc --noEmit -p tsconfig.diagnostics.json
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --preflight '<actual snapshot>' '<new preflight output>'
```

Require exit0, `complete.json` cases4, four setup-only case files and
`tundra-purchase-preflight.json`. Verify input/atlas hashes and hitbox hash
`7d2bb18d34e42a4c24ea720168aace8c5cc7e5e0d120080e4bbd5a34f398a0bf`.
Check frozen HEAD/tree and no tracked content changes. Then execute once:

```powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development scripts/v1pDiagnostics.ts --execute '<actual snapshot>' '<new execution output>'
```

Preserve stdout/stderr/exit status and all artifacts. Gameplay death/timeout
continues to the next independent arm. Exception, invalid setup/hash or missing
evidence stops the whole packet. No retries. Per-case compute ceiling two real
minutes is checked between ticks; operator terminates if stuck inside a tick.
Part A ceiling30 real minutes from setup start. No Docker or live services for A.

## Part B — one natural Tundra farming run

Only after A completes without infrastructure/setup failure, launch this
independent run even if all Volcano arms died. Start from unchanged V1m input.
Route performs ordinary purchases from the existing wallet: Hamstring70 green;
Desert Boots and+1..+5 total432 yellow and1 Dominion catalyst. Check authoritative
receipts; no wallet grants. The preflight proves these are affordable at entry.
Unexpected preparation farming/changed mastery must be disclosed, not hidden.

Kit: inherited Ruinous Axe/Cave Vest/Mountain Charm/Tempered Core, Desert Boots+5.
Travel28RP uses Sweep, Second Wind, Brace and both travel rules. At Sanctuary
qualify the combat build, then restore travel build for transit. At the resolved
first Tundra node configure Sweep + Hamstring, Second Wind + Brace, Defensive
and the five combat rules (31RP). On return restore the travel build. Travel
does not have Hamstring; classify any transit/build-switch death separately.

Farm for300 seconds alive/auto time, with fully recovered completion and420-second
step cap, then return to T3 Sanctuary for a recovered20-second tail. Require
actual kills for farming viability, not merely elapsed survival. First death
stops before acknowledgement. No alternative node, boss attempt or retry.
Natural population, hazards, targeting, recovery and ambient effects remain.

Use the existing isolated lifecycle from [V1n](bot-balance-v1n-operator-packet.md):
fresh exact-source bot preflight, disk/worker checks, uniquely named empty Docker
bridge capacity probe with exact-ID removal; no prune or unrelated service stop.
Create exactly one manifest from the frozen source:

```powershell
pnpm experiment:create --revision=7340037d6811ab2d956725b022dacdf0ba752429 --routes=spirit-tundra-counterplay-t3-v1p --tierEntrySnapshot='<actual snapshot>' --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

Inspect the sealed manifest: intended policy, one worker/count, automaticRetries0,
fastBossRetry=false. Follow create -> launch -> status -> report -> terminal
network release. Verify release receipt and network absence; if necessary use
`pnpm experiment:release --id=<exact-terminal-id>`. No clean/volume deletion.
Reward25 can raise mastery quickly: this is candidate farming feasibility,
not fixed-level survival or normal economy. Preserve final snapshot unchanged.

Whole packet ceiling120 real minutes from A setup start. Begin B only with60
minutes remaining. No dispatch of another agent or autonomous downstream run.
Keep A artifacts even if Docker capacity prevents B; report the parts separately.

## Report and next decision

Write/index `docs/briefs/bot-balance-v1p-report.md`, including source/input/runtime
hashes, artifact ledger, limits, setup findings, manifests and release receipts.
For A, retain each100ms sample and complete journal; compare time-to-first-kill,
Sweep secondary targets/damage, target switching, attackers, HP/barrier and
separate actual heals/absorption/thorns. Report starting derived stats per kit.
After a clear, report last contact, OUT_OF_COMBAT time, Heat at clear and stack
decay timestamps, zero-Heat time, recovery state and whether the tail completed.
Do not sum unrelated mitigation-stage fields as final delivered damage.

For B, separate purchase, outbound, farming and return windows; report actual
node/modifier, kills by species, deaths/cause, observed builds/gear, progression,
guard/control use, recovery downtime and ambient information where available.
Natural-bot telemetry may omit detailed movement/ambient histories: say so.
No live lava conclusion without observed hazard contact and escape evidence.

If a Volcano kit clears, next qualify it against natural larger packs, then
compare immediate versus recovered subsequent pulls. Swift Repose is a later
legal-loadout comparison if combat-exit delay is material. If post-combat decay
itself dominates downtime, propose a separate faster decay parameter without
changing ramp-up or outgoing benefit. No Heat edit is approved by this packet.
If all plausible swarm kits still fail, review damage spread/AoE delivery before
proposing common-filler HP and possibly attack adjustments, preserving dangerous
leader roles. No automatic nerf or exhaustive gear sweep. Tundra success advances
farming evidence; it does not validate its bosses or every class.

## Handoff

Ask Luna: “Operate bot-balance-v1p-operator-packet.md exactly: four bounded local
Volcano diagnostics, then the independent natural Tundra route if its continuation
gates pass. No changes, retries or further experiments. Preserve evidence, write
and index bot-balance-v1p-report.md, verify network release, then stop.”
