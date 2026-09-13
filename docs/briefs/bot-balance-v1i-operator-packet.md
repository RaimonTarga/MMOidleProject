# V1i — correct preparation and begin prepared T2 boss coverage

2026-09-13. Astra prepares and interprets; Luna operates only this packet.
Frozen revision: `61080e54b2849857055b76a9b4f6d058f40e577d`.
Frozen tree: `4abc6784a7e796aa7cd81c0e6f76ea8206844425`.
Read [V1h assessment](bot-balance-v1h-assessment.md) for hypotheses and boundaries.

## Execution contract

Eight runs across three sequential manifests, one worker and one active manifest.
Three hours of worker ceilings; hard session deadline four hours after the time
recorded before setup. Do not begin another phase with less than30 minutes left.
Stop naturally when complete; do not fill unused time. No automatic retries,
global queue, edits, budget extensions, fast boss retry, balance changes, T3/T4
work or automatic follow-on runs. Astra has not created or launched a manifest.

Use a clean isolated checkout of the exact frozen revision. Run
`pnpm bot:preflight` once before any create. Inspect the runtime/tooling/source
hashes rather than reusing the V1h image: the executor and importer changed.
Verify Docker and three simultaneous empty bridge slots before creating phases.
Uniquely named temporary probes may be removed by exact ID after verifying they
are empty. Stop on unavailable capacity; never prune historical resources.

Astra parked the three completed V1h manifests' Postgres/Redis containers and
released only their verified empty networks. Receipts named
`v1i-network-preparation.json` in each V1h experiment root preserve container IDs,
mounts and original network aliases. Containers, volumes, source snapshots and
all results remain retained. Three simultaneous bridge probes passed afterward;
all empty probes were removed. Do not resume parked historical manifests.

For each create verify exact revision/tree, image digest, tooling/runtime hashes,
copied host atomic-write retry, isolated25x, intended policy, worker1, zero
automatic retries, fastBossRetry=false, planned count/cap and input identity.
Launch only the returned exact ID once. Use create → launch → status → report →
stop as needed; do not hand-edit experiment.json/state.json. Record all8 slots.

## A — targeted preparation repair (2 × 30 minutes)

```powershell
$v1iRevision = '61080e54b2849857055b76a9b4f6d058f40e577d'
pnpm experiment:create --revision=$v1iRevision --routes="striker-t2-progression,squire-t2-progression" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --entryEconomy=clean --maxRunMs=1800000
```

Synthetic clean T2 entry, no snapshot, existing Striker Balanced/Squire Heavy
gear and ability policies. Only upgrade resource selection changed: authored
destinations become preferences for these opt-in upgrade steps. No boss or T3
ascent. Report actual templateValidation values and preserve treatmentValidity=
not-asserted/eligibility flags; this remains a diagnostic progression screen.

Primary response: at the old Jungle upgrade blocks, does Striker obtain red
essence for Axe+4 and Squire blue essence for Mountain Vest+4, then move on?
Record each node, missing resource, wallet before/after, block closure and
upgrade result. Resource spans may now end with a nonempty deficit because the
next resource requires another node. That is reselection, not proof the entire
upgrade completed. Do not sum overlapping clocks. Record GM, last step, deaths,
final gear and emitted snapshots/hashes. GM72 is not itself +5 readiness.

Valid timeout or gameplay deaths do not cancel independent B/C. If a bot still
fails to acquire the needed currency, preserve the exact evidence; no manual
reroute or extension. A real infrastructure/entry/assertion failure stops the
program as specified below.

## B — Spirit Plains weapon comparison (4 × 20 minutes)

Every B/C case imports the SAME unchanged Spirit V1h file independently. Never
use A's output, a prior boss case's output, or a modified copy. The source is
GM72, tier2, Energy Heavy, no range branch or T2 seals, synthetic origin,25x,
four equipped T2 items+4 and Tempered Core; Gale Needle+4 is owned in inventory.
It already knows both stances, Sweep, Expose, Second Wind and Cleanse.

```powershell
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
if ((Get-FileHash -LiteralPath $spiritSnapshot).Hash.ToLower() -ne '4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6') { throw 'Spirit source mismatch' }
pnpm experiment:create --revision=$v1iRevision --study="docs/briefs/bot-balance-v1i-plains-study.json" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --maxRunMs=1200000
```

Order: axe, needle, needle, axe. Two cases each, independent RNG, no paired seed.
Both use Cave Vest, Mountain Charm, Plains Boots and Tempered Core. Each route
earns its weapon/armor/charm/boots from+4 to+5 with ordinary upgrades, asserts
equipped items and levels, and configures this exact ordered build:

- Techniques: Sweep, Expose Weakness; Guard: Second Wind.
- Defensive stance attuned/default; no Rite.
- Always → Find Enemies; Inside Telegraph → Step Back; In Combat → Keep Distance
  (`orbit`); Always → Avoid Hazards; Always → Recover First.
- Total29/30RP. No spending the remainder or substituting a package.

Ready markers are `v1i:spirit:plains:ruinous-axe:ready` and
`v1i:spirit:plains:gale-needle:ready`. Each case gets one ordinary guardian-inclusive
cycle against **Gorging Razortusk**. Compare whole weapon packages (cadence,
damage, dead swings), not attack speed in isolation. Record Energy/empowered-hit
telemetry if emitted, ability activations and separate boss/add targets when
identifiable. Missing telemetry stays missing. Two replicates screen candidates.

## C — Spirit Forest candidate (2 × 20 minutes)

```powershell
pnpm experiment:create --revision=$v1iRevision --routes="spirit-campaign-forest-ruinous-axe-t2" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Same original file independently for both cases, no output chaining. Same fixed
armor/charm/boots/Core, Ruinous Axe, four equipped items earned to+5. Prepare
under the Plains farming package, learn Brace normally, then configure Expose
Weakness; Guards Second Wind, Brace; defensive stance; unchanged ordered
movement rules; no Rite. Total28/30RP. Brace uses its ordinary low-HP trigger.
Require `v1i:spirit:forest:ruinous-axe:ready`, then one normal dungeon cycle per
case. The boss is Apex Timberclaw; corroborate the named kill and authoritative clear
`forest:2`; guardians are not bosses. Both planned cases run after valid losses.

## Entry, evidence and stop rules

The source file retains its historical tier2-handoff label. These routes
explicitly opt into prepared T2 resume; the converter marks only the entry
profile as prepared-t2. It requires full T2 mastery, tier2, no current-tier
boss clears, spent skill point and preserved root/frame, while existing strict
legality and atomic spawn checks remain mandatory. Never relabel the file,
change frame, inject currency, grant gear or skip a failing validation. This is
an earned continuation of a synthetic accelerated experiment, not natural T1
carryover or canonical economy evidence. HP/cooldowns reset by normal entry;
historical runtime combat state is not replayed.

B/C must pass actual profile/spawn validation, resource acquisition, exact build
reconciliation and readiness assertions before any boss-loss conclusion. Record
actual treatment/eligibility fields; never promote an ineligible artifact.
If boss cases remain not-asserted despite successful configureBuild, preserve
that qualification gap and return it for analysis instead of rewriting flags.
Preparation timeout/death before readiness is incomplete preparation, not a
boss loss; keep the declared slot, do not retry.

Worker status `failed` alone is NOT infrastructure failure. Read terminal reason
and durable summary. Valid isolated bot_partial boss deaths and ordinary capped
farming outcomes CONTINUE. Stop the exact active experiment for invalid entry,
build/assertions, unexpected treatment/isolation failure, unhealthy/exited
server, worker exception, missing/lost terminal evidence or supervisor failure.
Wait for normal finalization before classifying. Preserve any already-started
interrupted slot. At the deadline stop the exact active ID and list unstarted
slots. Direct stop of a verified owned worker is reserved for durable supervisor
fatal failure; do not stop unrelated resources or DB/Redis during execution.

Write/index `docs/briefs/bot-balance-v1i-report.md`: hashes, source input, exact
run/manifest ledger, all8 dispositions and continuation/stop reasons. Separate
preparation, guardians, boss combat and total attempt; separate last/lowest
player HP, snapshot HP and boss HP. Corroborate victory with named kill, attempt
outcome and authoritative boss-clear progression. Raw isBoss/entity-ID and
range/add aggregate limitations persist; do not infer kiting failure or boss
add pressure from those values. Damage/healing/ability counts are run-wide
unless explicitly filtered. Brace activations alone do not quantify mitigation.
No balance edit or automatic next phase beyond this packet.

## Preparation verification

Astra: pnpm typecheck PASS; final pnpm bot:preflight PASS (bot/server typechecks,17 suites, experiment and experience tests). Actual unchanged Spirit input passed166 offline checks; the normal tier-entry import still rejects that current-tier state. New regression exercises red/blue selection, resource reselection, and legacy explicit-policy preservation. Pure planner validated2+4+2 slots without creating a manifest. Full pnpm test and live boss trials were not run during preparation.
