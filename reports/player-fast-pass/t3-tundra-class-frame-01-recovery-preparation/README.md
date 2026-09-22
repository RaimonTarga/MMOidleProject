# T3 Tundra class/frame recovery — prepared, not run

This is the replacement packet authorized by `SOURCE_HANDOFF.md`. It preserves the original 52-case class/frame matrix but fixes the failed execution boundary. The published `t3-tundra-class-frame-01/run-01` remains closed and unchanged: 0 accepted observations, 1 operationally censored row, and 51 not run.

The replacement combat run has **not** been launched. `D:/t3r/run-02` does not exist and `D:/t3r/packet/run-launched.json` is absent.

## What was undercooked

The first packet qualified in the main C: checkout and executed in a frozen D: checkout. Its full applied-receipt comparison correctly rejected the first completed child because `runtime.sharedEntry` contained different absolute paths. The child’s 42 kills remain preserved raw evidence, but they are not an accepted observation and are not reused here.

The replacement uses one final source location for preparation, qualification, receipt verification, and later execution:

- Source: `D:/t3r/src`
- Packet: `D:/t3r/packet`
- Qualification: `D:/t3r/qualification`
- Receipt verification: `D:/t3r/receipt-check`
- Reserved fresh execution output: `D:/t3r/run-02`

## Frozen source

Execution commit: `7d0dadb2b4397141c5a654ab9bb658871c56147b`.

The gameplay delta from the failed source is the designer-requested movement-only Hamstring change at `6b7e5268`: Hamstring retains movement slow and no longer changes monster attack cadence. Its implementation, HUD wording, current-state documentation, and focused regression test are included. The Tundra packages themselves are unchanged; no ability, item, Rune, stance, Guard, or coefficient was retuned to compensate.

The baseline retains production Conduit R2, the session-continuity correction, and native owner-target inheritance already present before this packet. The separate in-progress Heat work is not mixed into this source and is not tested here.

Runner commit `7d0dadb2` adds only the recovery gate. It does not weaken or normalize the receipt comparator. It requires a full second zero-tick receipt comparison before Tundra combat can launch.

## Preserved experiment scope

- 52 fresh observations: 36 primary and 16 alternatives; zero reuse.
- Ordinary `node-t3-tundra-03`, seeds `101009` and `101021`.
- 100 ms step; 300,000 and 600,000 ms same-life checkpoints; 600,000 ms cap.
- First player death stops that life; valid deaths and caps continue the queue.
- One worker, zero retries, fixed published order.
- Mature legal T3 packages, 38 RP, no T4 relics, no generic Flee, no Tundra armor.
- Squire Slam remains excluded. Power Strike stays fixed in Squire rows.

The exact unchanged package catalogue is in the [original package map](../t3-tundra-class-frame-01-preparation/PACKAGES.md), and the sealed ordered cases are in `packet/manifest.json`.

## Qualification proof

Qualification constructed all 52 packages with zero combat ticks from `D:/t3r/src`. A separate `receipt-check` child then reconstructed all 52 packages, from the same final launch checkout and dependency resolution, and passed the same full `receipt(...)` deep comparison used after a combat child.

Both receipt files are byte-identical, SHA-256 `36e04cbd8a26aa6855339fb0eb076ab84b97bd31d464bdc691dcb620f669a63f`. Both report `runtime.sharedEntry` as `D:\\t3r\\src\\shared\\src\\index.ts`. Equipment, skills, abilities, Rune rules, RP, stats, formation profile, initial ecology, source bytes, definition hashes, runtime metadata, and absolute provenance remain checked.

Source SHA-256 is `202d007f010df4380680f420a540f63fc911fe98be6d03f800f20c47b164a18d`; manifest SHA-256 remains `5615531632c9604c8fb8d3be41a13fa3e852d80ebea5ef1cd4277dd62af34aef`; hitboxes SHA-256 remains `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`.

Focused Hamstring, Tundra packet, endurance ledger, script syntax, typecheck, strict source verification, 52/52 qualification, and 52/52 receipt replay passed. No new combat observation, full suite, browser playtest, deployment, Heat test, or balance tuning was performed.

Use `LUNA_RUN.md` exactly. Do not requalify, rerun the receipt check, reseal, normalize the source, or touch the failed `run-01`.
