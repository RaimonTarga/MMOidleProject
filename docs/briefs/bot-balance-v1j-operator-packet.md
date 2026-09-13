# V1j — Mountain coverage and Swamp recovery comparison

2026-09-13. Astra prepares and interprets; Luna operates this packet only.
Read [V1i assessment](bot-balance-v1i-assessment.md) for the hypotheses.

Frozen revision: `6365651b5fcbcd0b32284343df29d01121ceb5d3`.
Frozen tree: `11a5298b9a2ce6a32c374979108f1fa6ddd10841`.
Includes the committed monster-control correction `bab111f9`; do not reuse the V1i image.

## Contract

Six runs in two sequential manifests, one worker and one active manifest. A: two Mountain cases capped at 20 minutes each. B: four Swamp cases capped at 25 minutes each. Total worker ceilings 140 minutes; hard session deadline 3h30m after the timestamp recorded before setup. Do not begin phase B with less than 30 minutes left. Stop naturally when finished; no filling spare time, retries, extensions, automatic follow-on, source edits, balance edits, T3/T4 or fast boss retry. Astra has not created or launched a manifest.

Use a clean isolated checkout of the exact revision and run `pnpm bot:preflight` before create. Verify the image, runtime/tooling hashes and host atomic-write retry. Confirm capacity for two additional experiment bridges before creation using uniquely named empty probes; remove only the exact verified empty probe IDs. Do not prune old resources or resume historical experiments. Capacity is not pre-cleared by Astra for V1j; if unavailable, stop before create and report it.

For each create verify frozen revision/tree, smoke-isolated, reward 25, intended policy, one worker, zero retries, fastBossRetry=false, exact slot count/caps and the copied input hash. Use create → launch → status → report → stop as needed. Launch the returned exact ID once, never hand-edit experiment.json or state.json. Finalize A before creating B.

## Unchanged prepared input

Every case independently imports the original V1h Spirit Snapshot B, never an output of V1i or another V1j run:

```powershell
$v1jRevision = '6365651b5fcbcd0b32284343df29d01121ceb5d3'
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
if ((Get-FileHash -LiteralPath $spiritSnapshot).Hash.ToLower() -ne '4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6') { throw 'Spirit source mismatch' }
```

Tier2, GM72, Energy Heavy, no range branch/current-tier boss clear; synthetic accelerated origin. Routes explicitly opt into strict prepared-T2 import. Do not relabel the snapshot or grant gear, currency, abilities, seals or skill points. HP/cooldown reset is normal importer behavior; historical combat runtime is not replayed. Preserve actual eligibility/taint fields, including false combat/economy eligibility.

## A — Mountain (two runs)

```powershell
pnpm experiment:create --revision=$v1jRevision --routes="spirit-campaign-mountain-mountain-charm-t2-v1j" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Ordinary resource-aware upgrades earn Ruinous Axe, Cave Vest, Mountain Charm and Plains Boots to +5; Tempered Core remains equipped, no relic. Learn Brace normally. Final build: Expose Weakness; Second Wind and Brace; defensive stance attuned/default; no Rite. Ordered rules: Always → Find Enemies, Inside Telegraph → Step Back, In Combat → Keep Distance, Always → Avoid Hazards, Always → Recover First. Total 28/30 RP. No spending the remainder.

Require `v1j:spirit:mountain:mountain-charm-t2:ready`, then one ordinary guardian-inclusive attempt at Stoneplate Juggernaut. Record barrier appearances/breaks, charge casts/impacts, stagger and recovery if emitted. Distinguish plate-breaking from charge avoidance; missing mechanic telemetry remains unknown. Victory requires named boss/attempt/progression `mountain:2` corroboration. A valid boss death does not cancel B.

## B — Swamp charm comparison (four runs)

```powershell
pnpm experiment:create --revision=$v1jRevision --study="docs/briefs/bot-balance-v1j-swamp-study.json" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --maxRunMs=1500000
```

Order: barrier, recovery, recovery, barrier. Independent RNG, not paired seeds. Study working-file SHA-256 at preparation: `1ae42fa85e0e83bfc9d6ceed616a8fa047d355d6338c4d33b5faac809b0ba8d7`. Compare normalized JSON if clean checkout line endings differ and preserve both hashes; arm order and values must match.

Both arms use the same +5 Axe/Cave Vest/Mountain Charm/Plains Boots preparation kit and Tempered Core. Both learn Brace in shared preparation, retain it unattuned in the final Swamp build, ensure Cleanse is learned, reconstruct Bog Eye (`swamp-charm-t2`) with ordinary purple/fortified costs and upgrade it to +5. Both farm wearing Mountain Charm. This prevents unequal acquisition work from being the designed factor.

Final build in both arms: Expose Weakness; Second Wind and Cleanse; defensive stance; no Rite; same ordered movement rules as A. Total 26/30 RP. Only final equipped charm differs: Mountain Charm versus Bog Eye. Both owned charms must be +5. Do not substitute other abilities or spend remaining RP.

Ready markers:

- `v1j:spirit:swamp:mountain-charm-t2:ready`
- `v1j:spirit:swamp:swamp-charm-t2:ready`

Each case gets one ordinary guardian-inclusive attempt at Mire-Gorged Behemoth. Corroborate victory with named boss, attempt outcome and `swamp:2` progression. Record actual boss-entry HP/barrier, poison/status burden, Cleanse/SW activations, recovery/healing, pool exposure/avoidance and boss HP at death when emitted. The comparison is whole charms, including Recovery stats, not isolation of one passive. Activation counts alone do not prove effectiveness.

## Validity, stopping and reporting

Require successful profile/spawn checks, exact equipment/upgrades, final configureBuild reconciliation and ready marker before classifying a boss loss. Preparation timeout/death is incomplete preparation; preserve the slot without retry. A configureBuild failure or unexpected eligibility/assertion regression is a treatment stop, not a gameplay verdict. Keep synthetic/25x limitations even when treatment validity passes.

Ordinary ready-marker boss deaths and capped gameplay outcomes continue to the remaining independent cases. A worker row labelled failed is not by itself infrastructure failure: inspect durable terminal reason/summary. Stop the active exact manifest on unhealthy/exited server, worker exception, supervisor failure, invalid entry/build/isolation or missing terminal evidence. At the deadline stop the exact active ID and list unstarted slots. Allow normal finalization. Direct intervention against a verified owned worker is reserved for durable supervisor fatal failure; do not stop unrelated containers or databases.

Write and index `docs/briefs/bot-balance-v1j-report.md` with all six dispositions, hashes and artifact paths. Separate preparation, guardian, named-boss and whole-attempt clocks. Separate sampled lowest/last HP from snapshot HP, and run-wide damage/healing from boss-window observations. Preserve the known raw `isBoss`/entity-ID limitation; use corroborating victory evidence. Retargeting/disengagement is not automatically failure or manual intervention. Do not infer empowerment, dead swings, kiting quality, pool exposure or mitigation from aggregates that do not measure them.

Conclude with evidence and uncertainties, not an automatic winning template or balance proposal. Return to Astra for next selection.

## Preparation verification

`pnpm typecheck` PASS. `pnpm bot:preflight` PASS: bot/server typechecks, 17 suites and experiment/experience checks. Route checks include GM72 RP legality, independent single-cycle encounters, correct uncleared-boss assertion and matching Swamp acquisition steps. Actual original Spirit input passed 166 offline checks. Pure study planner produced barrier/recovery/recovery/barrier without creating a manifest. Full `pnpm test`, Docker capacity probes and live boss trials were not run by Astra during preparation; clean frozen preflight and capacity checks remain operator prerequisites.
