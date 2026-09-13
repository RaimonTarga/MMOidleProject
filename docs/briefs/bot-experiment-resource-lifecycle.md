# Experiment resource lifecycle

Updated 2026-09-13 after V1j's pre-create capacity stop.

Docker exhausted its default bridge address pools, not RAM. A stopped container does not by itself release its network's subnet. Each finished experiment previously left its bridge and database services allocated; `experiment:clean` was manual and also removed the database volume.

## Routine terminal release

Newly created experiments copy `release.mjs` with their host supervisor tooling. After all runs finalize and the supervisor saves completed state, it stops owned database services, disconnects retained containers and removes the verified empty experiment bridge. It retains containers, PostgreSQL volumes, images, snapshots, summaries, events and manifests. `network-release.json` records original IDs, mounts and network aliases before mutation, then records completion. Cleanup failure emits `infrastructure-release-failed` without rewriting gameplay outcomes.

For older terminal experiments or a cleanup retry:

```powershell
pnpm experiment:release --id=<exact-experiment-id>
```

Release refuses nonterminal records, live workers, foreign containers and foreign network endpoints. It uses exact IDs and does not prune Docker globally. Already released resources are a no-op. Fatal supervisor failures require inspection and proper finalization; they are not automatically discarded. Existing frozen supervisors are not rewritten retroactively.

Retained containers still appear in Docker Desktop but consume no running CPU/RAM or experiment subnet after release. This is capacity release, not disk reclamation. Do not directly resume a parked historical experiment: its removed network/aliases require an explicit restoration using the receipt. Prefer independent experiments with preserved input snapshots.

`pnpm experiment:clean --id=...` remains the separate destructive disposal command: it removes runtime containers and the database volume while retaining external artifacts/images. It is not the automatic finish operation. Disk/image retention can be addressed separately when needed.

## V1j incident resolution

Released ten verified completed experiment networks: six September 10 economy diagnostic networks, Night 1 Swamp, and all three V1i networks. Stopped the six still-running V1i PostgreSQL/Redis services. Retained all database volumes and artifacts. Development server/client/admin and their DB/Redis services remained running. Nonterminal historical records were left untouched; no states/manifests were relabelled.

The experiment network count fell from 28 to 18. Two simultaneous new bridge probes succeeded and were removed after exact identity/empty checks. V1j can start a fresh session using its unchanged gameplay revision and new host lifecycle tooling; no experiment was launched during cleanup.

Validation: experiment tests (including release terminal/ownership/live-worker/idempotence guards), experience tests and supervisor syntax check passed. The release operation was exercised on the ten real terminal networks. Full gameplay tests were not rerun for this host-only change.
