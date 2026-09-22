# T3 Tundra class/frame 01 — prepared, not run

This packet prepares the next T3 class/frame experiment from `SOURCE_BRIEF.md`. The brief is advisory; the user's correction is authoritative: **Squire Slam is discarded entirely**. Every Squire row uses Power Strike, and no Slam arm exists in the manifest.

The main combat run has **not** been launched. Preparation performed only source inspection, focused validation, and zero-tick construction/readback.

## Frozen scope

- Fixture: ordinary `node-t3-tundra-03`, not the dungeon or boss.
- Seeds: `101009`, `101021`.
- Time step: 100 ms; endpoints: 300,000 and 600,000 ms; cap: 600,000 ms.
- Stop each observation at first player death.
- 52 observations: 36 primary class/frame rows plus 16 matched alternatives.
- One worker, zero retries, sequential order fixed by `packet/manifest.json`.
- Synthetic mature T3 ownership; `economyEligible=false`.
- No enemy, balance, acquisition, T2, boss, generic Flee, Tundra armor, or Glacial Bulwark changes.

The 18 primary identities are six roots by three frames. `PACKAGES.md` records the human-readable packages. The exact ordered cells, item IDs, abilities, Rune rules, source identity, and hashes live in the sealed packet. `qualification/resolved-builds.json` is the applied zero-tick readback.

## Alternatives

Eight alternatives are repeated on both seeds, giving 16 paired observations:

| ID | Identity | Only intended change |
| --- | --- | --- |
| W1-W3 | Striker Light/Balanced/Heavy | Cinderlash to Cataclysm Axe |
| W4 | Squire Heavy | Avalanche Maul to Permafrost Maul; Power Strike stays fixed |
| W5 | Slinger Balanced | Venomthorn Rapier to `swamp-blightbrand` (Plague Fang) |
| A2 | Apprentice Balanced | Frenzy to Detonate, with Fully Afflicted timing |
| W6 | Conduit Balanced | Cataclysm Axe to Permafrost Maul |
| A3 | Spirit Balanced | Hamstring to Binding Strike |

There is no A1 and no replacement for it. The user rejected the proposed Power Strike/Slam comparison because the ordinary Tundra screen is single-target-oriented and Slam is AoE.

## Qualification and evidence limits

All **52/52** rows constructed and read back successfully with **zero combat World ticks**, zero failures, and zero reused observations. Applied RP costs are 34-37 against a budget of 38. No prepared row equips Slam, generic Flee, Tundra armor, or Glacial Bulwark.

The packet verifies at source commit `ce9ae8d14da009034996c055e3bfa5d96422e80d`, source SHA-256 `652607c303d600a4339eefef37c91d4ff72f857d614de69c3968fbe9faeaf132`, Node `v22.16.0`, and hitbox SHA-256 `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`. A fresh Git checkout normalizes bytes differently on this Windows host, so the frozen execution checkout was materialized from the sealed tracked byte set. The strict verifier passes there; do not normalize, reset, reinstall, or reseal it.

`HISTORICAL_EVIDENCE.md` contains context from the older one-seed T3 Mountain boss breadth screen. It is not Tundra evidence, not a control, and not a reason to select a winner. The previous breadth farming rows failed before outcome evidence and are not reused.

Focused packet/neighbor suites, root typecheck, and `git diff --check` passed. The full suite, browser/live playtest, and the main 10-minute observations were not run. Qualification proves package construction and readback only, not combat viability, sustain, acquisition, economy, or live feel.

## Operator handoff

Use `LUNA_RUN.md` exactly. The authoritative frozen locations are:

- Source: `D:/mmo-idle/t3-tundra-class-frame-01/source`
- Packet: `D:/mmo-idle/t3-tundra-class-frame-01/packet`
- Fresh output reserved for execution: `D:/mmo-idle/t3-tundra-class-frame-01/run-01`

The repository `packet/` and `qualification/` directories are byte-preserved review mirrors. `REPORT_CONTRACT.json` defines the compact later publication. Preserve failed and not-run rows; never retry, extend, adapt, or overwrite this family.
