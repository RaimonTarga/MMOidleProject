# Q2c assessment — two passes, infrastructure stop

2026-09-12, Astra. Accept Conduit and Slinger as functional local-behavior
passes on `755b2a3642a3a417f364f5fb8486e661bfc351b0`. Together with Q2b
Striker, three class roots have passed this observation slice. Spirit has no
gameplay evidence; Apprentice and Squire were never created.

## Evidence review

Verified all three Q2c manifest hashes against their files and sidecars, inspected
terminal state and run summaries, and recounted kills and activations inside the
raw route-step boundaries linked in the [operator report](bot-balance-q2c-report.md).
Both completed runs have three verified builds, valid treatment and no failed
assertions. Their noncanonical evidence flags remain unchanged.

| Class/window | Start/end ms | Kills | Expected Technique activations | Second Wind |
|---|---|---:|---:|---:|
| Conduit Sweep | 27,136 / 88,195 | 5 | 6 | 1 |
| Conduit Expose | 91,211 / 152,260 | 5 | 3 | 0 |
| Slinger Sweep | 17,175 / 97,306 | 5 | 4 | 2 |
| Slinger Expose | 100,321 / 161,397 | 6 | 5 | 2 |

Conduit used Plains-05 after preparation and had no deaths. The operator records
formation arms/deliveries and Sweep secondary damage. Slinger died once to a
Savanna Hawk, returned to the selected Plains-04, and completed the cumulative
window. This is useful recovery evidence, not a death-free viability claim.
Unsampled tails remain 669 ms for Conduit Expose and 717 ms for Slinger Expose.
Neither kills nor formation/clip counts support DPS rankings or balance tuning.
Slinger's Expose window includes residual clip shots but no new Sweep activation;
retain that observation without misclassifying it as a loadout mismatch.

## Infrastructure diagnosis and repair

Spirit experiment `20260912t182552z-spirit-campaign-local-behavior` was created
but launch failed at Docker network creation, before supervisor/worker startup.
Its state remains `not-started`, one queued attempt, no gameplay artifact.
This is address-pool exhaustion, not a Spirit route or combat failure.

Live inspection found retained per-experiment networks and running database/Redis
services from completed experiments. Astra reclaimed three networks belonging to
completed Q2b Striker and Q2c Conduit/Slinger only, after checking completed
supervisor/run state, container ownership labels and absence of active workers.

| Completed experiment | Detached and removed network |
|---|---|
| `20260912t170727z-striker-campaign-local-behavio` | `mmoexp-9acd08ad105a-network` |
| `20260912t181057z-conduit-campaign-local-behavio` | `mmoexp-efd95661219b-network` |
| `20260912t181639z-slinger-campaign-local-behavio` | `mmoexp-ace960407e2e-network` |

Their six service containers were stopped and disconnected, not deleted. All
three named PostgreSQL volumes, manifests, images and filesystem artifacts were
preserved. Verified containers exited with no attached networks and volumes still
exist. No broad prune, experiment:clean, database deletion, development-service
stop or daemon configuration change was performed.

Infrastructure receipt, including original network configuration, is saved at
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t182552z-spirit-campaign-local-behavior\q2d-network-preparation.json`.
To inspect those databases later, first create an available isolated network and
reconnect each retained service with its original `postgres` or `redis` alias
before starting it; old network IDs no longer exist. Do not relaunch terminal
experiments for inspection. No restoration was performed during this repair.

Created Spirit's exact expected network `mmoexp-6c5539466337-network` successfully,
with zero endpoints. Also created two simultaneous temporary bridge networks to
verify capacity for the remaining cases, then removed both probes. Capacity is
verified now, not reserved against unrelated future Docker activity. Spirit's
manifest and queued state were not edited; no supervisor or worker was launched.

## Next decision

[Q2d](bot-balance-q2d-operator-packet.md) explicitly authorizes one renewed launch
of the existing never-started Spirit experiment, then Apprentice and Squire if
each preceding case passes. Preserve the original failed launch in the ledger.
This is an infrastructure recovery authorization, not a gameplay rerun or hidden
replacement. No Conduit/Slinger/Striker repeats, template edits or balance changes.
Same frozen revision, builds, local windows and limits; current unrelated source
changes are excluded. After three remaining passes, prepare the first local boss
packet with an encounter-specific hazard/build review.

Validation this turn: raw evidence/hash checks, terminal/ownership checks,
retention checks, successful Spirit network creation and two-network capacity
probe. No source changed; prior exact-revision preflight remains historical,
not claimed as a new full-suite run.
