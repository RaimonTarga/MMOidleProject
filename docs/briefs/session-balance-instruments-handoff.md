# Balance Instruments & Enemy Tables — Handoff

Status: complete and verified on 2026-08-11. Changes are intentionally uncommitted.

## What landed

- Bench stance selection is explicit (`perfection-stance`) and recipe-gated. T1
  bots now have no stance; T2+ bots use the same restrained baseline regardless
  of future database ordering.
- Bench rites are recipe-gated and selected from an explicit representative
  priority (Blood Offering, Purification, Ability Reprieve, Mechanic Renewal,
  Swift Repose) within the RP budget. The current canonical state legally
  resolves to Blood Offering + Purification + Swift Repose at T3, adding Ability
  Reprieve at T4. Mechanic Renewal remains the next future-facing priority but is
  not unlocked by the current T1-T4 bench progression.
- `GearSlot` and canonical gear resolution include relics. T4 relics are scored
  with the shared production preview resolver against the selected skill path and
  fully upgraded non-relic gear. Buff/debuff ratings receive credit only when the
  selected path reaches their live scaling channel (DoT's root debuff channel is
  always active). Relics remain recipe-gated and are equipped through the normal
  inventory path; no relic is equipped below T4.
- Fight and farm modes now share time scale 2 as the default. Above-ceiling runs
  carry a visible stdout warning (a CSV comment or the JSONL `run_meta.warning`
  field); explicit farm scale sweeps remain exempt.
- `tools/balance-data.ts` is the single authored-data seam for the mob report.
  The planned tuning overlay belongs there later; no overlay was built tonight.
- The mob HTML and LLM packets now lead each tier with a threat-ranked,
  cross-biome table containing mean/max HP, mean/max incoming DPS, worst spike,
  density, essence per kill, and biome XP per kill. Threat and reward deviations
  are listed separately as discovery signals, explicitly not verdicts or gates.
- Player Matchup Summary now averages resolved per-mob incoming pressure. The old
  synthetic-average monster combined mean attack and mean cooldown as though the
  model were linear, which understated some mixed rosters and disagreed with the
  new comparison table.
- Added `pnpm test:balance-instruments`, covering tier gates, the explicit stance
  and rite choices, no pre-T4 relic, an equipped T4 relic, and class-sensitive
  relic selection.

## Bench deltas (A1 and A2)

Deterministic probes used time scale 2 and the same first cadence build/target at
each tier.

| Tier / target | State | Result | Fight time | Damage dealt | Damage taken | End HP |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| T2 Plains dungeon | Before A1 (Berserker, no relic) | clear | 11.0s | 1471 | 3 | 203/203 |
| T2 Plains dungeon | After A1 (Perfection, legal rites) | clear | 11.0s | 1054 | 3 | 203/203 |
| T2 Plains dungeon | After A2 | clear | 11.0s | 1054 | 3 | 203/203 |
| T4 Desert dungeon | Before A1 (Berserker, no relic) | clear | 14.2s | 5626 | 20 | 522/522 |
| T4 Desert dungeon | After A1 (Perfection, legal rites) | clear | 20.2s | 5590 | 34 | 522/522 |
| T4 Desert dungeon | After reviewed corrections (Hastebound Dial equipped) | clear | 20.6s | 6460 | 37 | 522/522 |

A1 reduced the T2 probe's recorded damage by 28.3%. On T4 it increased clear
time by 42.3% and damage taken by 70%, demonstrating how strongly Berserker had
biased the old baseline. The reviewed scorer changes leave T2 unchanged. The
final T4 JSONL row identifies `relic-hastebound-dial` in both `gearItemIds` and
the resolved gear list, so the loadout is backed by an observed equipped item
rather than selection code alone. The single-match timing is recorded for
reproducibility, not treated as evidence that this relic is globally optimal.

## Invalidated historical data

- Previously collected boss and overlord matrices that relied on the old default
  time scale 5 are not fidelity-safe. The measured one-directional cadence loss
  at scale 5 is roughly 4.5–18%, worsening at higher tiers. Regenerate them at
  scale 2 (or 1 when establishing a reference).
- Farm mode already defaulted to 2, so A4 alone does not invalidate default farm
  matrices. Explicit farm/fight runs above 2 remain exploratory unless checked
  against a scale sweep/reference run.
- Independently of A4, all old canonical-loadout matrices omit relics and/or use
  the accidental Berserker stance. They are not comparable to the corrected
  baseline even if they happened to run at scale 1 or 2.

## Observations, not balance verdicts

- The regenerated T3 fixed-tier table shows a large authored spread: Swamp mean
  incoming DPS is 32.8 (7.39× the sibling median) versus Volcanic 1.84 (0.42×),
  while mean essence per kill is 52.3 versus 34.0. Caverns pays more essence
  (66.0) but also has much higher mean/max HP. These are review signals only.
- `server/bench/balance/progression.ts` still explicitly excludes the three
  Cooldown-heavy T3 paths because their server logic is unimplemented. This is a
  pre-existing gameplay coverage gap; it was reported, not changed.
- `docs/next-playtest-implementation-plan.md` §5.7 C still says the DPS/eHP tools
  cannot execute and require lockfile work. That statement is stale. The brief's
  hard boundary permits only this handoff under `docs/`, so the historical plan
  was not edited; `docs/polish-and-balance-roadmap.md` already carries the current
  correction.

## Judgment calls / assumptions

- Perfection was chosen as the least polarising stance: modest attack/tempo and
  no self-damage, defensive penalty, recovery loop, or conditional target rule.
- The canonical rite subset favors kill recovery and between-fight readiness;
  contradictory Swift Repose/Lingering Battle is intentionally avoided. Legal
  RP is filled in priority order rather than being left unused.
- Relic scoring compares the production resolver's before/after mechanic profile.
  Frequency/potency factors are combined with a buff/debuff magnitude factor only
  for live channels used by that selected path. This is a representative bench
  choice, not a claim of globally optimal player gearing.
- Cross-biome threat is sorted by arithmetic mean incoming DPS against the entry
  reference player. Reward columns are arithmetic per-mob means, not density- or
  spawn-frequency-weighted hourly yields; farm mode remains the authority for
  realized income rates.
- The cross-biome threat index and the ±25% review queue use sibling medians, so
  an extreme biome cannot pull the reference toward itself. The threshold remains
  discovery-only, not a target band or pass/fail boundary.

## Verification

- `pnpm typecheck` — clean (including `server/tsconfig.bench.json`).
- `pnpm test` — 72/72 passed (includes the concurrent UI session's added test).
- `pnpm test:balance-instruments` — passed.
- `pnpm dps:report` — generated successfully.
- `pnpm ehp:report` — generated successfully.
- `pnpm mob:report` — generated successfully.
- `pnpm mob:llm` — generated all T1–T4 packets successfully.
- Corrected T2 and T4 default-scale bench probes — both cleared at time scale 2.

## Boundary / working tree

This session changed only allowed paths: `server/bench/**`, `tools/**`, the root
`package.json` scripts section, `reports/**`, and this handoff. A concurrent UI
session created edits under `client/**` and `shared/**` while verification was in
progress; those files were not touched, reverted, or included in this work.
