# Autonomous Night 2 ledger

Activated 2026-09-13 21:04:42 UTC on explicit user approval. Deadline 2026-09-14 05:04:42 UTC; reserve final30 minutes. Ceilings: eight hours,20 gameplay cases,four frozen packets,one Luna operator and one active manifest. No gameplay balance edits. Astra prepares/interprets; Luna operates.

Status: Luna operating packet A, six declared cases (Cave4, Jungle2), frozen revision `14bda8be14f067654f305e8a10a7179ccf4eab22`, tree `81f7064241dc7797fe550ec569b7897e04133d57`. Cave manifest `20260913t211850z-spirit-cave-control-t2-night2`; Jungle manifest `20260913t214400z-spirit-jungle-hamstring-t2-nig`. Await terminal report before judging results. Luna read-only audit passed: all24 V1k summary/events/deaths hashes, three manifests/cohort summaries/receipts match; all three supervisors completed and released networks absent. Docker services healthy; host drive about27 GB free at setup. Retain volumes/artifacts. Initial source `dc41eb93f3c920aad1c5681c0b52c87b873a5417`.

## Source and evidence audit

Cave V1k B1: slam outcomes at182216/191221/200224/209230/218237ms, HP damage12/15/12/12/98.7855. Second Wind213033; Brace213234, so its3s protection expires before the final eruption. Cleanse181415 removed slow;191421/201425/211432/221437 removed2/1/1/2 shred stacks. Final death221836, authoritative cause melee88. HP before/after final recorded eruption164.1621/65.3766, absorbed45.2145. This is not the final killing blow.

Cave B2: slams187839/196642ms,25.72825/102.2355 HP damage. Second Wind191639, Cleanse191840 removes2 shred, Brace196642 occurs after the slam result in recorder order; its3s window expires before death200451. Authoritative death cause melee90. Final recorded eruption HP187.4519→85.2164, absorbed38.7645. Earlier Cleanse181833 removed1 shred.

Telemetry correction to V1k interpretation: `death.record.killingBlow` is stale in both files, pointing to the preceding eruption (218237/196642), not the later lethal melee. Use death cause88/90 for the lethal hit, never98.7855/102.2355. The damage window lacks that final event. Run-wide heal totals also include absorb-like entries with unchanged HP; do not treat them as effective HP restoration. Exact full-fight barrier/shred history remains unavailable. Raw files and hashes remain unchanged.

Current-source guard audit: `guardableThreatsFor` recognizes pattern `cast` only, not `impact`; Burrow explicitly opts out. Enemy Charging would not answer this eruption. `runeConfig` derives Inside Telegraph from actual hostile ground geometry; `deriveAutoConfigFromRunes` allows its named Brace rule alongside Step Back. Rune-targeted abilities precede defaults in `updateAbilityFiring`; only one Guard activates per window. Candidate adds Inside Telegraph→Use Ability(Brace), cost2, to the24RP control. Brace therefore loses its low-HP default and may not cover every9s eruption with10s cooldown; measure coverage rather than promise it.

Jungle: escape barrier7% of3625HP =253.75,3s flee,210 base speed,0.30 speed per instinct. Movement still multiplies authored flee speed by `monsterMoveSpeedMult`; Hamstring's40% movement slow can affect it. It does not reduce attack speed, guarantee a hit before fleeing, cancel stealth, or prevent later instinct escalation. Heavy Spirit empowered Axe delivery may break the shield in one landed hit; not yet observed. Candidate Hamstring/Second Wind/Brace, defensive stance, unchanged ranged-orbit rules and Cave/Mountain kit,25RP. No Expose competing for the offensive channel; Brace keeps its ordinary HP trigger because payoff Ambush is also not a recognized pattern cast. This is a package feasibility probe, not an isolated Hamstring effect estimate.

## Packet accounting

| Packet | Planned cases | Started | Terminal | State |
|---|---:|---:|---:|---|
| A Cave timing + Jungle | 6 | 6 | 6 | Completed; all boss wins and safe tails, both networks released |
| B continuous bridge | 1 | Await report | Await report | Dispatched to Luna22:02 UTC |

Bridge preparation source `8ebfbbada901b65bde5e65834c7a7961c4cc1d4f`, tree `e19354beaeb761591748c37166bd4b8b067b5222`: ordinary full-HP/no-DoT recovery, first-death stop before respawn, cumulative failed-seal prerequisites, strict T3 import preserving the earned unspent branch point. Shared converter/validator changes are dev harness support, not gameplay balance. Full typecheck, bot preflight, focused T3 server bootstrap and final bot typecheck passed. Packet B remains conditional on review; no independent T2 snapshots are merged.

Next decision after A: continuous Plains→Forest→Desert→T3 bridge using one original checkpoint, without granting or merging seals. T3 Volcano/Tundra high outgoing damage and low mob eHP remain separate concerns. No gameplay proposal applied.

## A review / B dispatch

[A report](bot-balance-night2-a-report.md) verified: all24 run artifact hashes plus both manifests/cohorts/release receipts match. Cave control2/2 and reactive2/2, Jungle2/2; every final snapshot231/231HP and incomingDoT0. Corrected whole-run versus boss-window telemetry counts. Candidate Brace is599–602ms before three of six eruptions per case; all24 Cave boss slams still land. Controls also succeed, so no causal survival ranking or claim that Rune timing solved Cave. This closes narrow Spirit candidate coverage of all seven T2 bosses across independent runs; consistency and class-wide progression are not established.

Dispatch B at22:02 UTC against exact8ebfbbad/treee19354be above. One first-death-bounded continuous bridge. Next useful question is composed progression; no further Cave comparison tonight. If B earns entry, prepare small range/access reference before Volcano/Tundra probes. Counters: two packets dispatched, seven cases allocated; six terminal. Five-plus hours remain within the original hard deadline.
