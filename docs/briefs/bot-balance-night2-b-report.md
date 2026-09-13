# Night2-B operator report — continuous T2 to T3 bridge

Status: stopped at the packet's declared first-death condition. Setup started
at `2026-09-13T22:04:47.4767673Z`; the 75-minute packet deadline was
`2026-09-13T23:19:47.4767673Z`. One case ran once; no retry, replicate,
downstream run, source edit or balance edit was made.

## Immutable input and preflight

- Frozen revision/tree: `8ebfbbada901b65bde5e65834c7a7961c4cc1d4f` /
  `e19354beaeb761591748c37166bd4b8b067b5222`
- Original Spirit Snapshot B input SHA-256:
  `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`
- Clean detached exact-checkout `pnpm bot:preflight` passed, including strict
  progression, failed-seal dependencies and release suites. Offline install
  was required and completed from cache.
- Image ID:
  `sha256:52682e953db0ec456fb9f1db771d17467d4ebc1a257dd3d9c2fdecc96dcf3980`.
  Tooling hash `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1`;
  runtime hash `f77975c67c8a759e0a1e3039f1d3ae4cbe88f42de3e691282d69202814fb700f`.

## Manifest and disposition

Manifest `20260913t220504z-spirit-continuous-t2-bridge-ni` used one intended
route, one worker, one case, `2700000ms` cap, smoke-isolated mode, reward 25,
automatic retries 0 and `fastBossRetry=false`.

- Manifest SHA-256: `033e4522777a8b7d86c10894c3d17aba73ded187d65978bdc0e4cb2735fa6cb6`
- Cohort summary SHA-256: `fecf9b5d1f66fb9ce368a16532b210b777b216c1217254b370e9eeb0277a976f`
- Run status: `failed`, terminal reason `declared first-death stop`.
- Artifact directory:
  `C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t220504z-spirit-continuous-t2-bridge-ni/runs/001-spirit-continuous-t2-bridge-night2-intended-r01/artifacts/spirit-continuous-t2-bridge-night2-intended-2026-09-13T22-07-05-546Z-8ce3a42f`
- Artifact hashes: `summary.json` `30065920b0a523887fb41393d2b68b406caaef493a29b93073df3f91d27d72b1`; `events.jsonl` `d640ee5c2b8ff470a41ad28e73ad044c5a1cd26c65999fe864a078a1651bbefd`; `deaths.jsonl` `70a43ceac75541b86b4bf0cf670506965cec1755fb7195416f5520c9882c3756`.

The empty capacity probe was `25978a324ef5293f550eed5022645242e0f2e9c5978e0168f49232b0c4dccd13`; it was inspected empty and removed by exact ID before creation.

## Progression and encounter clocks

All three prepared builds and markers passed. The common kit was Ruinous Axe,
Cave Vest, Mountain Charm, Plains Boots, Tempered Core and no relic; ordinary
upgrades reached Axe/Cave Vest/Mountain Charm/Plains Boots +5. Plains used
Sweep + Expose Weakness with Second Wind (29 RP), Forest used Expose Weakness
with Second Wind + Brace (28 RP), and Desert used Expose Weakness with Second
Wind + Cleanse (26 RP). All used defensive stance and the packet's common
Find Enemies, Step Back, Keep Distance, Avoid Hazards and Recover First rules.
Recovery steps were recorded at
`6122ms`, `377402ms` and `723162ms` with zero duration because the character
was already at the required recovery predicate. Boss combat windows were
Plains `181760–232802ms` (51042ms), Forest `561541–586560ms` (25019ms), and
Desert `965828–1008358ms` (42530ms). Attempt closes were `233302ms`,
`587060ms`, and `1008859ms`; each was a victory with a named kill and clear
fact (`plains:2`, `forest:2`, `desert:2`). Named kills were Gorging Razortusk,
Apex Timberclaw and Dune-Stalker Emperor respectively.

The run emitted all three ready markers and then `tier-up` at `1007929ms`.
The resulting progression summary is player tier 3, GM72, biome levels
Plains12/Forest12/Swamp12/Mountain12/Cave12/Clearing4/Jungle6/Desert6, and
seals `plains:1`, `forest:1`, `swamp:1`, `mountain:1`, `cave:1`, `plains:2`,
`forest:2`, `desert:2`. Route progress was 54/56 steps.

The first death occurred at `1025400ms` during `travel node-t3-sanctuary`, in
`node-t3-volcanic-05` (Fortified), from authoritative direct melee damage 31 by
Ember Scuttler with five concurrent attackers. The recorder's `killingBlow`
also points to that Ember Scuttler hit at `1024175ms`; the death cause and
timestamp are authoritative. A preceding Cinder Hound 52 damage event at the
same timestamp was the largest hit. The route aborted at `1025402ms`; no
respawn acknowledgement or post-clear T3 observation occurred.

This was not a safe bridge completion: the character earned all three seals
and tier 3, but died before reaching T3 Sanctuary. No final `snapshot-b.json`
was produced (`snapshot-index.json` records `snapshotB: null`), so there is no
valid final T3 snapshot path/hash to hand off. The final wallet/node evidence
is retained in the run-end event: red721, blue1007, green5226, yellow14058,
purple1522; node `node-t3-volcanic-05`. Absorb-like heals in the death window
left HP unchanged and are not effective HP healing.

Ability counts are run-wide: Sweep15, Expose Weakness22, Second Wind6,
Cleanse6, Brace1. They are not boss-window counts. This case provides no
normal-speed economy evidence: synthetic prepared entry and reward25 remain
taints, and combat/economy eligibility is false.

## Release

Astra review: all three run artifact hashes and manifest/cohort/release hashes
match. The character entered Volcano at1016696ms and died8.704seconds later,
about4.827seconds after first recorded incoming damage. First-hit HP was231,
so this was not entry at depleted health. No ability activations or kills were
recorded during the crossing. Source inspection shows navigation disables Auto
and the frozen build had no Fight Back travel Rune; normal abilities require
Auto or the shipped fightsWhileTraveling state. This is a preparation gap to
test with ordinary travel rules before attributing the failure to unavoidable
Volcano balance. Five simultaneous attackers and rapid HP loss remain a risk
signal. Concurrent damage records overlap in HP snapshots; do not sum blindly.

The terminal receipt SHA-256 is
`c5c21d2bbd70b409efcb272a4c029789406058d97f6aac3641041450aaf2a8c1`.
It reports `released` at `2026-09-13T22:24:23Z`; the supervisor emitted
`infrastructure-release` with two retained containers at `22:24:25Z`. Network
`mmoexp-6c66f2410141-network`, ID
`7b47bee75f2d324b2f5202d6f822bb6348e6e927294ffbb301e7a7260d6e8328`, was
absent after release. No resources were globally pruned or deleted.
