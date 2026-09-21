# Player balance fast-pass: opening-run-01 review bundle

Publication-only bundle for the completed `opening-run-01`. The opening batch was
executed once from the prepared packet: 36 observations, seed `101003`, 100 ms
World ticks, and 300,000 ms observation windows/caps. This bundle does not launch,
rerun, re-prepare, relabel, or alter gameplay evidence.

## Measured revision

The copied preparation and execution identities both record:

- HEAD: `d67c7453eb0bddc0fd99558e2c928765e8e563ea`
- tree: `3058a86e1992ed31410ca3bebc7e21aca0c931dd`
- source SHA-256: `7a4da96d7cc69124b9481eb77a0c926dbdb9481cf82fd5c9b40f761de8c60317`
- Node: `v22.16.0`
- pinned hitbox SHA-256: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

The original `commit-binding.json` is preserved unchanged. It records the
qualification revision `148cccd62a33b77446436834648a64f6fe54a97e` and the measured
execution revision above. The later commit that publishes this review directory is
not substituted into any measured record.

## Preparation evidence

These are byte-for-byte copies from:

`C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/packet-committed`

- `preparation/identity.json`
- `preparation/manifest.json`
- `preparation/resolved-builds.json`
- `preparation/ready.json` (`prepared-not-executed`)
- `preparation/commit-binding.json`

The binding record's original packet reference is
`C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/packet-r1`.

## Execution evidence

These are byte-for-byte copies from:

`C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/opening-run-01`

- `execution/identity.json`
- `execution/report.json`
- `execution/complete.json`
- `execution/block-manifests/<block>/manifest.json` for all six blocks:
  `t2-farm`, `t2-boss`, `t3-farm`, `t3-boss`, `t4-farm`, and `t4-boss`.
- `execution/per-cell-ready/<block>/<cell>-s101003/ready.json` for all 36 cells.

`report.json` records `planned=36`, `completedValid=36`, `failures=[]`, and
`remainingOpeningAllocation=0`. The per-cell ready records are execution receipts;
the root `preparation/ready.json` is preparation evidence and is not an execution
receipt.

## Raw events and samples

The original raw files remain at:

`C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/opening-run-01`

There are 72 raw files: 36 `events.jsonl` and 36 `samples.jsonl`, totaling
56,598,487 bytes. Their original absolute locations, sizes, SHA-256 hashes, and
archive member names are listed in [raw-artifacts.tsv](raw-artifacts.tsv).

For transfer, the raw streams are compressed separately at:

`C:/Users/osaif/AppData/Local/mmo-idle/validation/player-fast-pass/opening-run-01-raw-events-samples.zip`

The archive contains only those 72 event/sample files under
`opening-run-01/raw/`; it is 3,907,879 bytes with SHA-256
`8ffaddef305f5854fce067c05018237de7d923bb99c5fe94ce76536dcb5f9c42`. It is not
added to Git. No credentials, environment files, database files, or unrelated
player data were copied into this review bundle or archive.

## Scope boundary

No source, balance, route, build, or gameplay files were changed for publication.
No follow-up experiment is queued or launched. The raw records and copied metadata
remain the source of truth for any later review.
