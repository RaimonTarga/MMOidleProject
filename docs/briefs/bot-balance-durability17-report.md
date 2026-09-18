# Durability 17 report — T2 Forest adult durability and pack pressure

Durability17 completed the frozen 48-cell / 144-observation T2 Forest
adult-durability experiment. The run is complete and verifier-backed, but it is
synthetic combat evidence only. No source, balance, item, class, ability, or
production data was changed.

## Decision summary

- All 48 cells and 144 runs completed with exit code 0: 136 window-ended runs
  and 8 player deaths.
- All eight deaths occurred in Forest03: seven were Striker deaths and one was
  an Apprentice death. There were eight additional window-ended survivors whose
  runner minimum was below 20%.
- The exposure audit found 36 complete four-arm matched sets. Two entire sets
  are excluded from matched sensitivity because one arm had a 30-second
  outgoing-damage gap: Forest05 Apprentice seed 9029 and Forest05 Conduit seed
  12007. The affected arms remain in all-outcome reporting.
- Doubling and tripling adult HP materially lengthened Dire Wolf and Badger
  clean TTK, but the result is not a global Forest pass. Forest03 Striker
  failed at adults2 and adults3 and still had one death in adults3-pressure80.
- The adults3-pressure80 arm reduced aggregate incoming HP in 11 of 12
  node/class comparisons and improved the median minimum-HP result in 11 of 12
  aggregates, but it did not repair the Forest03 Striker case. Its result is a
  targeted pressure candidate, not a winner or a production recommendation.

Role-specific recommendation:

| Role | Evidence-supported next action | Primary limiter and boundary |
|---|---|---|
| Striker | Reject adults2/adults3 as a global Forest candidate; carry adults3-pressure80 only into a targeted Forest03 pressure/movement follow-up. | Forest03 adult pressure and extended live exposure are lethal even after attack relief. Do not infer a Wolf-only fix from this bundled treatment. |
| Squire | Carry adults3-pressure80 as the safer candidate arm for a narrow confirmation. | No deaths; Forest03 sub-20% tail improves strongly under pressure relief. Avoid adding more HP until the pressure result is reconciled. |
| Apprentice | Carry adults3-pressure80 as a candidate; do not adopt adults3 by itself. | Forest03 adults3 produced one death and two sub-20% survivors; pressure relief removed the death in this screen. The remaining concern is adult pressure plus a slow-class tail, not a missing universal HP multiplier. |
| Slinger | Choose the intermediate adults2 HP level for follow-up; do not escalate solely to force a 15-second Wolf TTK. | Survival is robust and adults3 adds duration without a required safety benefit. The limiting factor is fast class damage, not insufficient body duration. |
| Conduit | Keep the adults2/adults3-pressure80 comparison exploratory and carry pressure80 only as a class-specific probe. | Player attack beats remain zero while minion attack beats carry the run; long species tails are class/minion-delivery evidence, not a reason for automatic HP escalation. |
| Spirit | Keep adults3-pressure80 as the safer candidate overlay, with no further HP escalation. | No deaths and generally high minimum HP; pressure relief helps the tail. The class is already fast on followers, so the remaining uncertainty is encounter exposure rather than body survivability. |

The experiment does not validate the live runtime, every T2 Forest node, or any
other tier. Fresh confirmation and source reconciliation are required before
adoption. Quiet survival is not proof of sustained engagement.

## Frozen identity and execution

| Item | Value |
|---|---|
| Operator packet | [bot-balance-durability17-operator-packet.md](bot-balance-durability17-operator-packet.md) |
| Frozen revision | 413a43e5cd2c8afbbcf02dbcdc62e804cb5a3eb2 |
| Frozen branch retained | codex/durability17-frozen |
| Frozen source tree | 093ee08db54a589e1def6525206123282550ca97 |
| Definitions SHA-256 | 75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 |
| Hitbox SHA-256 | 08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83 |
| Detached checkout | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability17-20260916/source |
| Results root | C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability17-20260916/results-forest |
| Trial / mode | durability17 / run |
| Seeds | 9029, 10427, 12007 |
| Timestep / maximum | 100 ms / 300 s per observation |
| Synthetic / economy eligible | true / false |
| Start / end | 2026-09-16T16:30:37.1489020Z / 2026-09-16T16:40:06.6020180Z |
| Operator wall time | 9m 29.453116s |
| Operator exit | 0; no relaunch, retry, or adaptive rerun |

The operator ledger records the same single execution. The frozen checkout was
detached at the packet revision, installed offline, and remained clean. The
reporter, verifier, and exposure audit all ran against the retained result
root.

## Matrix and treatments

The matrix was six classes across Forest03 and Forest05, four arms, and three
seeds: 48 cells / 144 runs. The fixed setup used Sweep, the medium frame,
existing T2 ranges, forest armor and charm, inherited baseline weapons,
mountain boots, and Tempered Core, with +5 on the configured upgradeable slots,
offensive stance, Second Wind/Cleanse, and the existing movement and recovery
rules.

| Arm | Dire Wolf HP / attack overlay | Ironclaw Badger HP / attack overlay |
|---|---:|---:|
| control | 525 / 34 | 315 / 31 |
| adults2 | 1050 / 34 | 630 / 31 |
| adults3 | 1575 / 34 | 945 / 31 |
| adults3-pressure80 | 1575 / 27 | 945 / 25 |

Only adult Wolf and Badger HP changed in the first three arms. The pressure arm
changed both adult attacks at fixed adults3 HP. Dire Whelp and Thorn Spitter
were not changed by the treatment. Howl, charge, Barrage, pack sizes, spawn
ecology, attack speed, defenses, items, classes, and abilities were unchanged.
The pressure arm is a joint adult attack treatment; it does not isolate Wolf
from Badger or soften Howl itself.

## Completion, verification, and retained artifacts

| Check | Result |
|---|---|
| Planned matrix | 48 cells / 144 runs |
| Completed matrix | 48 cells / 144 runs |
| Result outcomes | 136 window-ended / 8 player-died |
| Verifier | passed: 48 cells / 144 runs / verified true |
| Exposure audit | 144 runs / 36 matched sets / 2 long-quiet runs / 8 deaths |
| Raw result inventory | 583 files / 414,741,781 bytes / 144 run directories |

The two long-quiet rows were Forest05 Apprentice control / seed 9029
(55.5 seconds maximum quiet interval) and Forest05 Conduit adults3 / seed
12007 (46.9 seconds maximum and terminal quiet interval). Their complete
four-arm sets are excluded from matched sensitivity together.

Top-level result hashes:

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| manifest.json | 41,459 | F3F10357502B7F4981D5C5776AD7ABB290B516B475AC4DE9E5C8F7A4B9F521EB |
| index.json | 3,823,713 | BCD7FBC967D9780E260A7C4C0E4E1F8E0F973CA96413B9A9043BCE5FCEE80FE0 |
| complete.json | 36 | 52E62DB9E7D570436F0EEA3C90E817DD5776D129F319B3E2406DA3B0EF809A0C |
| analysis.json | 205,271 | 6615D10EBE2BF46A45BFC8718ECDE789B7CB1B347B0C01DD2ADF352411170F39 |
| analysis.md | 21,550 | 59AA1AE667A5C6AE07C0F40205F4EC4B7070CF90073AEC659DA9B4715B786FB0 |
| exposure-audit.json | 43,987 | 53561AEFDC29A171866E7FA111E71AC621F2BE51685CED12B53D959926F26797 |
| verification.log | 64 | F08E094913B9AB854618EBF56069EA3088C84C79E25A4BE85A4C99D9081E4B52 |
| operator-ledger.jsonl | 111 | 95B6C17E1E643824E19D08D7C425E23B8D39E75C06ED9E2804CD7E65D397F096 |

Every run directory retains ready.json, summary.json, events.jsonl, and
samples.jsonl. The raw artifacts are outside the repository at the results root
above and were not deleted or rewritten.

## READY and paired geometry/equipment audit

The overlay values below are the pre-node values recorded in READY. Forest03
has the existing node-level scaling visible in its spawned READY roster, while
Forest05 records the overlay values directly.

| Node | Arm | Dire Wolf HP / attack | Ironclaw Badger HP / attack | Dire Whelp HP / attack | Thorn Spitter HP / attack |
|---|---|---:|---:|---:|---:|
| F03 | control | 578 / 41 | 347 / 37 | 171 / 17 | 330 / 37 |
| F03 | adults2 | 1155 / 41 | 693 / 37 | 171 / 17 | 330 / 37 |
| F03 | adults3 | 1733 / 41 | 1040 / 37 | 171 / 17 | 330 / 37 |
| F03 | adults3-pressure80 | 1733 / 32 | 1040 / 30 | 171 / 17 | 330 / 37 |
| F05 | control | 525 / 34 | 315 / 31 | 155 / 14 | 300 / 31 |
| F05 | adults2 | 1050 / 34 | 630 / 31 | 155 / 14 | 300 / 31 |
| F05 | adults3 | 1575 / 34 | 945 / 31 | 155 / 14 | 300 / 31 |
| F05 | adults3-pressure80 | 1575 / 27 | 945 / 25 | 155 / 14 | 300 / 31 |

F03 attack values reflect the frozen node multiplier and integer rounding; the
underlying pressure overlay remains 27 for Wolf and 25 for Badger.

All four arms used the same class-specific weapon per node: Gale Needle for
Striker, Quake Hammer for Squire, Ruinous Axe for Apprentice, Conduit, and
Spirit, and Jungle Stinger Rapier for Slinger. Forest vest T2, forest charm T2,
and mountain boots T2 were +5; core-tempered was +0. All runs used offensive
stance, Sweep, Second Wind, and Cleanse.

The paired audit passed for all 36 node/class/seed four-arm sets:

| Audit | Result |
|---|---:|
| Four-arm geometry equality | 36 / 36 |
| Four-arm equipment and upgrade equality | 36 / 36 |
| Four-arm adult treatment presence | 36 / 36 |
| Dire Whelp and Thorn Spitter stats unchanged within each set | 36 / 36 |

The geometry/equipment audit does not make the synthetic results production
valid. It only confirms that the intended treatment boundary was preserved.

## Measurement rules

Clean TTK is computed separately for each target species within each run from
targets that were killed, had no observed HP regain, and were not censored. The
per-seed value is the median of clean target TTKs; the displayed outer value is
the median of the three available per-seed medians. Missing, censored, killed,
regained, and all-outcome counts are retained separately.

The all-outcome body TTK column is the outer median of each run's clean
all-target cell median. It is not a pack-clear duration. Attack beats are
cooldown timestamp changes, not guaranteed hits. Recovery is the persisted
recovery window; the approach metric later in this report is only the
episode-start to first-damage delta.

## Clean TTK by species

Values are in seconds and use seed order 9029 / 10427 / 12007, followed by the
outer median. A dash means that no clean target was available for that
seed/species cell.

### Forest03

| Class / arm | Dire Wolf | Ironclaw Badger | Dire Whelp | Thorn Spitter |
|---|---:|---:|---:|---:|
| Striker / control | 6.50/6.00/6.00 -> 6.00 | 3.50/3.50/3.50 -> 3.50 | 3.00/3.00/3.00 -> 3.00 | 3.50/3.50/3.00 -> 3.50 |
| Striker / adults2 | 12.50/15.00/14.50 -> 14.50 | 7.00/7.00/7.00 -> 7.00 | 3.50/3.50/2.00 -> 3.50 | 3.00/—/3.25 -> 3.13 |
| Striker / adults3 | 19.00/—/— -> 19.00 | 10.50/10.50/10.50 -> 10.50 | 3.00/1.50/2.75 -> 2.75 | 3.00/—/3.50 -> 3.25 |
| Striker / adults3-pressure80 | 18.50/20.00/19.25 -> 19.25 | 10.50/10.50/10.50 -> 10.50 | 4.00/3.25/5.00 -> 4.00 | 3.50/3.50/3.50 -> 3.50 |
| Squire / control | 3.80/5.70/3.80 -> 3.80 | 0.00/0.00/0.00 -> 0.00 | 2.85/1.90/1.90 -> 1.90 | 0.00/0.00/0.00 -> 0.00 |
| Squire / adults2 | 13.30/15.20/13.30 -> 13.30 | 5.70/5.70/5.70 -> 5.70 | 1.90/1.90/0.00 -> 1.90 | 0.00/0.00/0.00 -> 0.00 |
| Squire / adults3 | 19.95/17.10/20.90 -> 19.95 | 7.60/9.50/7.60 -> 7.60 | 1.90/1.90/1.90 -> 1.90 | 0.00/0.00/0.00 -> 0.00 |
| Squire / adults3-pressure80 | 17.10/19.00/19.00 -> 19.00 | 7.60/8.55/7.60 -> 7.60 | 1.90/1.90/1.90 -> 1.90 | 0.95/0.00/0.00 -> 0.00 |
| Apprentice / control | 5.60/5.60/5.60 -> 5.60 | 3.20/3.20/3.20 -> 3.20 | 1.50/1.50/1.60 -> 1.50 | 3.20/3.20/3.20 -> 3.20 |
| Apprentice / adults2 | 11.60/9.60/9.60 -> 9.60 | 6.00/6.00/5.20 -> 6.00 | 2.20/1.60/1.50 -> 1.60 | 3.20/3.20/3.20 -> 3.20 |
| Apprentice / adults3 | 14.40/15.00/— -> 14.70 | 8.20/9.00/9.00 -> 9.00 | 1.50/1.60/2.20 -> 1.60 | 3.20/3.20/— -> 3.20 |
| Apprentice / adults3-pressure80 | 15.00/14.95/14.75 -> 14.95 | 8.20/9.00/9.00 -> 9.00 | 1.60/1.50/1.55 -> 1.55 | 3.20/3.20/3.20 -> 3.20 |
| Slinger / control | 3.80/5.00/3.80 -> 3.80 | 1.20/1.20/2.90 -> 1.20 | 0.90/0.90/1.20 -> 0.90 | 1.20/1.20/1.20 -> 1.20 |
| Slinger / adults2 | 10.30/9.40/8.80 -> 9.40 | 4.40/4.40/4.40 -> 4.40 | 0.60/0.90/1.20 -> 0.90 | 1.20/2.90/1.20 -> 1.20 |
| Slinger / adults3 | 11.80/10.30/10.30 -> 10.30 | 5.90/5.90/5.90 -> 5.90 | 1.35/1.05/0.60 -> 1.05 | 2.90/1.20/2.90 -> 2.90 |
| Slinger / adults3-pressure80 | 12.80/12.15/11.15 -> 12.15 | 5.90/6.75/5.90 -> 5.90 | 0.90/0.60/0.60 -> 0.60 | 2.90/1.20/2.05 -> 2.05 |
| Conduit / control | 21.35/9.45/13.90 -> 13.90 | 2.80/2.80/3.10 -> 2.80 | 2.80/4.35/4.70 -> 4.35 | 2.70/2.60/2.70 -> 2.70 |
| Conduit / adults2 | 23.60/21.50/21.20 -> 21.50 | 17.65/7.90/7.45 -> 7.90 | 5.60/4.20/4.90 -> 4.90 | 3.10/2.70/3.20 -> 3.10 |
| Conduit / adults3 | 30.20/27.20/28.80 -> 28.80 | 29.10/22.65/39.15 -> 29.10 | 6.85/4.50/5.90 -> 5.90 | 2.80/2.95/2.85 -> 2.85 |
| Conduit / adults3-pressure80 | 31.60/38.05/29.20 -> 31.60 | 30.25/21.75/22.30 -> 22.30 | 3.40/4.15/6.10 -> 4.15 | 2.80/3.75/2.60 -> 2.80 |
| Spirit / control | 3.85/4.90/3.50 -> 3.85 | 1.40/1.40/1.40 -> 1.40 | 1.05/0.70/1.40 -> 1.05 | 2.10/1.40/1.40 -> 1.40 |
| Spirit / adults2 | 7.70/7.70/7.35 -> 7.70 | 3.50/4.20/3.50 -> 3.50 | 0.70/0.70/0.70 -> 0.70 | 1.75/1.40/1.40 -> 1.40 |
| Spirit / adults3 | 11.20/13.30/11.20 -> 11.20 | 6.30/6.30/6.30 -> 6.30 | 0.70/1.40/0.70 -> 0.70 | 2.10/2.10/1.75 -> 2.10 |
| Spirit / adults3-pressure80 | 11.90/11.20/11.55 -> 11.55 | 6.30/6.30/6.30 -> 6.30 | 0.70/0.70/0.70 -> 0.70 | 2.10/1.75/2.10 -> 2.10 |

### Forest05

| Class / arm | Dire Wolf | Ironclaw Badger | Dire Whelp | Thorn Spitter |
|---|---:|---:|---:|---:|
| Striker / control | 6.00/6.50/5.00 -> 6.00 | 3.00/3.00/3.00 -> 3.00 | 1.50/2.50/3.00 -> 2.50 | 2.50/2.50/2.50 -> 2.50 |
| Striker / adults2 | 10.00/11.00/10.50 -> 10.50 | 5.50/6.00/6.00 -> 6.00 | 2.50/1.50/1.50 -> 1.50 | 2.50/2.50/2.50 -> 2.50 |
| Striker / adults3 | 15.00/16.50/16.75 -> 16.50 | 9.00/9.00/9.00 -> 9.00 | 2.50/1.50/1.50 -> 1.50 | 2.50/2.50/2.50 -> 2.50 |
| Striker / adults3-pressure80 | 15.25/15.00/15.75 -> 15.25 | 9.00/9.00/9.50 -> 9.00 | 2.00/2.50/1.50 -> 2.00 | 2.50/2.50/2.50 -> 2.50 |
| Squire / control | 3.80/7.60/3.80 -> 3.80 | 0.00/0.00/0.00 -> 0.00 | 1.90/1.90/1.90 -> 1.90 | 1.90/0.95/0.00 -> 0.95 |
| Squire / adults2 | 9.50/11.40/13.30 -> 11.40 | 3.80/3.80/3.80 -> 3.80 | 1.90/1.90/1.90 -> 1.90 | 0.00/0.00/0.00 -> 0.00 |
| Squire / adults3 | 15.20/15.20/15.20 -> 15.20 | 7.60/9.50/7.60 -> 7.60 | 1.90/1.90/1.90 -> 1.90 | 0.00/0.00/0.00 -> 0.00 |
| Squire / adults3-pressure80 | 15.20/17.10/15.20 -> 15.20 | 7.60/7.60/7.60 -> 7.60 | 1.90/1.90/1.90 -> 1.90 | 0.00/0.00/0.00 -> 0.00 |
| Apprentice / control | 4.65/5.85/4.30 -> 4.65 | 3.00/3.00/3.00 -> 3.00 | 1.60/1.60/1.50 -> 1.60 | 3.00/3.00/3.00 -> 3.00 |
| Apprentice / adults2 | 10.50/10.40/9.00 -> 10.40 | 6.00/6.00/6.00 -> 6.00 | 1.60/1.50/1.60 -> 1.60 | 3.00/3.00/3.00 -> 3.00 |
| Apprentice / adults3 | 14.60/12.80/12.80 -> 12.80 | 8.00/7.50/7.50 -> 7.50 | 1.50/1.50/1.60 -> 1.50 | 3.00/3.00/3.00 -> 3.00 |
| Apprentice / adults3-pressure80 | 13.15/12.80/12.85 -> 12.85 | 7.50/7.50/8.00 -> 7.50 | 1.50/1.55/1.55 -> 1.55 | 3.00/3.00/3.00 -> 3.00 |
| Slinger / control | 5.30/3.65/2.95 -> 3.65 | 1.20/1.20/1.20 -> 1.20 | 0.60/0.60/0.60 -> 0.60 | 0.90/0.90/0.90 -> 0.90 |
| Slinger / adults2 | 5.60/5.60/7.30 -> 5.60 | 4.10/4.10/4.10 -> 4.10 | 0.75/0.60/0.60 -> 0.60 | 0.90/2.60/0.90 -> 0.90 |
| Slinger / adults3 | 9.40/9.40/10.00 -> 9.40 | 5.30/5.30/5.30 -> 5.30 | 0.60/1.05/0.60 -> 0.60 | 0.90/0.90/0.90 -> 0.90 |
| Slinger / adults3-pressure80 | 9.40/9.40/11.20 -> 9.40 | 5.30/5.30/5.30 -> 5.30 | 0.60/0.60/0.60 -> 0.60 | 0.90/0.90/0.90 -> 0.90 |
| Conduit / control | 7.10/11.65/9.80 -> 9.80 | 2.70/2.60/2.65 -> 2.65 | 2.00/2.70/2.80 -> 2.70 | 2.50/2.30/2.00 -> 2.30 |
| Conduit / adults2 | 18.00/16.10/15.80 -> 16.10 | 6.55/6.00/6.00 -> 6.00 | 1.90/1.80/1.50 -> 1.80 | 2.40/2.70/2.40 -> 2.40 |
| Conduit / adults3 | 27.95/31.15/27.70 -> 27.95 | 15.30/13.00/16.10 -> 15.30 | 1.60/2.65/2.10 -> 2.10 | 2.50/3.50/2.40 -> 2.50 |
| Conduit / adults3-pressure80 | 22.20/26.85/21.60 -> 22.20 | 17.00/14.30/17.40 -> 17.00 | 1.60/2.00/5.60 -> 2.00 | 2.50/3.50/2.50 -> 2.50 |
| Spirit / control | 3.15/3.50/3.50 -> 3.50 | 2.10/2.10/2.10 -> 2.10 | 1.40/0.70/0.70 -> 0.70 | 2.10/1.40/1.75 -> 1.75 |
| Spirit / adults2 | 7.35/7.35/8.05 -> 7.35 | 2.80/2.80/3.15 -> 2.80 | 0.70/0.70/0.70 -> 0.70 | 1.75/2.10/1.40 -> 1.75 |
| Spirit / adults3 | 10.15/9.80/10.50 -> 10.15 | 5.60/5.60/5.60 -> 5.60 | 0.70/0.70/0.70 -> 0.70 | 1.40/2.10/1.40 -> 1.40 |
| Spirit / adults3-pressure80 | 9.80/10.50/10.15 -> 10.15 | 5.60/5.60/5.60 -> 5.60 | 1.40/0.70/0.70 -> 0.70 | 2.10/2.10/2.10 -> 2.10 |

Across all 144 runs there were 3,065 Dire Whelp records, 1,009 Dire Wolf
records, 813 Ironclaw Badger records, and 972 Thorn Spitter records. Their
global clean medians were 1.50s, 10.20s, 5.30s, and 2.10s respectively. There
were 5,731 target kills, 128 censored records, 87 records with observed HP
regain, and 5,683 clean records. Regain can overlap killed or censored and is
not a partition.

## All-outcome cell accounting

This table retains every target record, including censored and regained targets.
Minimum HP is the median / minimum runner fraction across the three seeds.
Incoming HP is the median / maximum per-run incoming total. Recovery is
completed / interrupted telemetry. Howl is cast start / fired-end telemetry.
Pack counts are observed episode member counts: solo / small (2–3) / swarm
(4+). They are not body TTK and are not used as exact pack-clear durations.

| Node | Class | Arm | Body TTK | Clean/records | Kills / censored / regained | D / LQ | MinHP med/min | Incoming HP med/max | Player/minion beats | Recovery done/int. | Howl start/fired | Pack solo/small/swarm |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| F03 | Striker | control | 3.50s | 122/123 | 122 / 1 / 0 | 0 / 0 | 30.9%/18.0% | 3283.0/3635.0 | 756/0 | 58/0 | 21/21 | 40 / 1 / 20 |
| F03 | Striker | adults2 | 4.00s | 41/47 | 41 / 6 / 0 | 3 / 0 | 0.0%/0.0% | 2211.0/2433.0 | 418/0 | 20/0 | 13/12 | 15 / 0 / 8 |
| F03 | Striker | adults3 | 3.75s | 16/24 | 16 / 8 / 0 | 3 / 0 | 0.0%/0.0% | 821.0/1880.0 | 232/0 | 9/0 | 5/5 | 8 / 0 / 4 |
| F03 | Striker | adults3-pressure80 | 10.00s | 77/80 | 77 / 3 / 0 | 1 / 0 | 1.7%/0.0% | 3924.0/4286.0 | 928/0 | 36/0 | 27/27 | 24 / 0 / 14 |
| F03 | Squire | control | 1.90s | 134/134 | 134 / 0 / 0 | 0 / 0 | 50.5%/48.9% | 2514.0/2920.0 | 209/0 | 65/0 | 28/28 | 43 / 3 / 21 |
| F03 | Squire | adults2 | 1.90s | 106/108 | 106 / 2 / 0 | 0 / 0 | 37.1%/32.7% | 3306.0/3898.0 | 262/0 | 53/0 | 37/34 | 36 / 3 / 16 |
| F03 | Squire | adults3 | 1.90s | 92/94 | 92 / 2 / 0 | 0 / 0 | 21.7%/13.3% | 3907.0/4345.0 | 289/0 | 42/0 | 33/33 | 27 / 1 / 16 |
| F03 | Squire | adults3-pressure80 | 1.90s | 96/98 | 96 / 2 / 0 | 0 / 0 | 54.5%/53.6% | 3283.0/3324.0 | 303/0 | 42/0 | 35/35 | 26 / 0 / 18 |
| F03 | Apprentice | control | 3.20s | 125/132 | 126 / 6 / 6 | 0 / 0 | 48.5%/45.5% | 1634.8/1784.7 | 520/0 | 35/0 | 34/34 | 24 / 2 / 12 |
| F03 | Apprentice | adults2 | 3.20s | 99/107 | 101 / 6 / 6 | 0 / 0 | 28.2%/21.2% | 1964.5/2014.2 | 551/0 | 24/0 | 30/30 | 17 / 1 / 9 |
| F03 | Apprentice | adults3 | 3.20s | 63/65 | 63 / 2 / 0 | 1 / 0 | 6.6%/0.0% | 1858.6/2681.6 | 453/0 | 31/0 | 26/23 | 23 / 1 / 10 |
| F03 | Apprentice | adults3-pressure80 | 3.20s | 89/93 | 90 / 3 / 3 | 0 / 0 | 41.8%/39.0% | 1600.7/1630.8 | 656/0 | 33/1 | 34/30 | 25 / 2 / 9 |
| F03 | Slinger | control | 1.35s | 182/185 | 183 / 2 / 2 | 0 / 0 | 59.9%/54.4% | 1203.0/1306.0 | 813/0 | 65/1 | 33/33 | 46 / 1 / 22 |
| F03 | Slinger | adults2 | 2.30s | 151/159 | 155 / 4 / 6 | 0 / 0 | 49.8%/48.7% | 1696.0/1777.0 | 1037/0 | 43/0 | 28/28 | 30 / 1 / 15 |
| F03 | Slinger | adults3 | 2.30s | 129/132 | 129 / 3 / 1 | 0 / 0 | 48.7%/45.3% | 1693.0/1721.0 | 1121/0 | 53/1 | 43/27 | 38 / 1 / 18 |
| F03 | Slinger | adults3-pressure80 | 2.30s | 124/126 | 125 / 1 / 1 | 0 / 0 | 50.5%/50.4% | 1267.0/1413.0 | 1111/0 | 54/0 | 43/25 | 35 / 2 / 19 |
| F03 | Conduit | control | 3.80s | 106/112 | 110 / 2 / 4 | 0 / 0 | 55.1%/53.7% | 550.0/1195.0 | 0/1659 | 48/4 | 147/84 | 36 / 11 / 8 |
| F03 | Conduit | adults2 | 4.90s | 84/91 | 89 / 2 / 6 | 0 / 0 | 55.3%/17.9% | 813.0/1510.0 | 0/1831 | 25/0 | 161/103 | 17 / 5 / 6 |
| F03 | Conduit | adults3 | 7.15s | 67/70 | 67 / 3 / 2 | 0 / 0 | 37.9%/35.3% | 917.0/1236.0 | 0/1789 | 18/3 | 131/87 | 12 / 6 / 5 |
| F03 | Conduit | adults3-pressure80 | 6.30s | 62/66 | 62 / 4 / 0 | 0 / 0 | 54.7%/51.5% | 636.0/856.0 | 0/1865 | 34/2 | 135/105 | 24 / 11 / 4 |
| F03 | Spirit | control | 1.40s | 187/190 | 189 / 1 / 2 | 0 / 0 | 52.6%/51.8% | 223.0/540.4 | 616/0 | 43/27 | 40/40 | 53 / 2 / 17 |
| F03 | Spirit | adults2 | 1.40s | 165/168 | 165 / 3 / 2 | 0 / 0 | 51.6%/47.7% | 1230.8/1232.3 | 773/0 | 23/18 | 37/37 | 27 / 1 / 15 |
| F03 | Spirit | adults3 | 1.40s | 137/141 | 138 / 3 / 1 | 0 / 0 | 44.3%/44.3% | 1574.8/1863.0 | 830/0 | 36/20 | 46/39 | 35 / 4 / 20 |
| F03 | Spirit | adults3-pressure80 | 1.40s | 144/149 | 146 / 3 / 3 | 0 / 0 | 51.2%/19.5% | 1177.4/1613.8 | 889/0 | 29/36 | 50/41 | 44 / 4 / 19 |
| F05 | Striker | control | 3.00s | 151/152 | 151 / 1 / 0 | 0 / 0 | 50.4%/48.8% | 2817.0/2962.0 | 776/0 | 68/0 | 27/27 | 44 / 0 / 27 |
| F05 | Striker | adults2 | 2.75s | 120/120 | 120 / 0 / 0 | 0 / 0 | 37.2%/34.3% | 3140.0/3508.0 | 855/0 | 54/0 | 27/21 | 36 / 0 / 21 |
| F05 | Striker | adults3 | 6.00s | 106/110 | 106 / 4 / 0 | 0 / 0 | 24.8%/22.4% | 3907.0/4090.0 | 1068/0 | 50/0 | 36/36 | 34 / 0 / 19 |
| F05 | Striker | adults3-pressure80 | 3.50s | 100/102 | 100 / 2 / 0 | 0 / 0 | 55.9%/48.5% | 2900.0/2968.0 | 1038/0 | 48/0 | 34/34 | 32 / 2 / 16 |
| F05 | Squire | control | 1.90s | 158/158 | 158 / 0 / 0 | 0 / 0 | 53.3%/53.3% | 2290.0/2495.0 | 249/0 | 72/0 | 34/32 | 43 / 4 / 27 |
| F05 | Squire | adults2 | 1.90s | 117/119 | 117 / 2 / 0 | 0 / 0 | 54.1%/50.7% | 2382.0/2955.0 | 249/0 | 56/0 | 32/29 | 37 / 0 / 21 |
| F05 | Squire | adults3 | 3.80s | 106/108 | 106 / 2 / 0 | 0 / 0 | 50.5%/49.7% | 3403.0/3412.0 | 311/0 | 46/0 | 39/39 | 29 / 1 / 19 |
| F05 | Squire | adults3-pressure80 | 1.90s | 100/102 | 100 / 2 / 0 | 0 / 0 | 57.2%/56.4% | 2245.0/2334.0 | 310/0 | 41/0 | 39/38 | 24 / 0 / 20 |
| F05 | Apprentice | control | 3.00s | 134/144 | 139 / 5 / 7 | 0 / 1 | 50.2%/50.1% | 1576.9/1648.5 | 482/0 | 49/1 | 39/39 | 32 / 1 / 20 |
| F05 | Apprentice | adults2 | 3.00s | 121/126 | 122 / 4 / 3 | 0 / 0 | 50.7%/35.6% | 1721.3/1862.8 | 578/0 | 32/0 | 36/34 | 20 / 1 / 14 |
| F05 | Apprentice | adults3 | 3.00s | 107/111 | 108 / 3 / 1 | 0 / 0 | 40.6%/28.6% | 1949.5/1985.4 | 629/0 | 44/0 | 41/36 | 28 / 5 / 14 |
| F05 | Apprentice | adults3-pressure80 | 2.70s | 98/103 | 99 / 4 / 2 | 0 / 0 | 54.3%/54.3% | 1264.8/1362.8 | 618/0 | 24/0 | 37/34 | 20 / 0 / 7 |
| F05 | Slinger | control | 1.20s | 200/200 | 200 / 0 / 0 | 0 / 0 | 70.2%/66.6% | 910.0/1001.0 | 771/0 | 102/0 | 35/35 | 66 / 7 / 29 |
| F05 | Slinger | adults2 | 2.30s | 164/165 | 164 / 1 / 1 | 0 / 0 | 58.8%/53.3% | 1247.0/1383.0 | 904/0 | 74/1 | 29/29 | 50 / 3 / 24 |
| F05 | Slinger | adults3 | 2.45s | 148/150 | 148 / 2 / 0 | 0 / 0 | 48.0%/47.9% | 1520.0/1527.0 | 1130/0 | 68/0 | 31/27 | 47 / 2 / 22 |
| F05 | Slinger | adults3-pressure80 | 0.90s | 148/151 | 149 / 2 / 2 | 0 / 0 | 55.0%/49.7% | 1295.0/1322.0 | 1105/0 | 61/1 | 31/28 | 37 / 4 / 24 |
| F05 | Conduit | control | 2.65s | 128/134 | 133 / 1 / 6 | 0 / 0 | 67.1%/63.4% | 182.0/189.0 | 0/1729 | 48/5 | 164/115 | 38 / 14 / 3 |
| F05 | Conduit | adults2 | 2.60s | 100/101 | 101 / 0 / 1 | 0 / 0 | 56.3%/54.7% | 309.0/488.0 | 0/1959 | 63/6 | 142/112 | 56 / 8 / 5 |
| F05 | Conduit | adults3 | 2.70s | 74/79 | 74 / 5 / 1 | 0 / 1 | 57.2%/52.7% | 593.0/635.0 | 0/1886 | 37/2 | 134/117 | 32 / 6 / 4 |
| F05 | Conduit | adults3-pressure80 | 3.50s | 78/88 | 78 / 10 / 6 | 0 / 0 | 56.7%/55.0% | 295.0/441.0 | 0/1908 | 29/2 | 131/105 | 28 / 4 / 2 |
| F05 | Spirit | control | 1.40s | 189/194 | 192 / 2 / 4 | 0 / 0 | 74.1%/57.4% | 245.6/296.6 | 628/0 | 35/31 | 44/43 | 46 / 2 / 21 |
| F05 | Spirit | adults2 | 1.40s | 158/162 | 162 / 0 / 4 | 0 / 0 | 54.6%/50.5% | 758.8/810.0 | 693/0 | 25/24 | 38/38 | 32 / 4 / 15 |
| F05 | Spirit | adults3 | 1.40s | 146/149 | 147 / 2 / 2 | 0 / 0 | 49.5%/45.3% | 1094.3/1269.8 | 841/0 | 20/24 | 40/30 | 30 / 2 / 15 |
| F05 | Spirit | adults3-pressure80 | 1.40s | 134/137 | 135 / 2 / 2 | 0 / 0 | 52.8%/52.3% | 700.5/847.5 | 772/0 | 36/26 | 33/26 | 45 / 2 / 18 |

## Matched four-arm sensitivity

Matched sensitivity keeps all four arms for a node/class/seed set only when
none of its four arms has an internal or terminal outgoing-damage gap of at
least 30 seconds. The two excluded sets are not partially repaired by dropping
one arm. Forest05 Apprentice therefore retains seeds 10427 and 12007; Forest05
Conduit retains seeds 9029 and 10427. All other node/class comparisons retain
all three seeds.

Each cell below is eligible-seed count; clean target records / all target
records; outer body TTK.

| Node / class | control | adults2 | adults3 | adults3-pressure80 |
|---|---:|---:|---:|---:|
| F03 / Striker | 3; 122/123; 3.50s | 3; 41/47; 4.00s | 3; 16/24; 3.75s | 3; 77/80; 10.00s |
| F03 / Squire | 3; 134/134; 1.90s | 3; 106/108; 1.90s | 3; 92/94; 1.90s | 3; 96/98; 1.90s |
| F03 / Apprentice | 3; 125/132; 3.20s | 3; 99/107; 3.20s | 3; 63/65; 3.20s | 3; 89/93; 3.20s |
| F03 / Slinger | 3; 182/185; 1.35s | 3; 151/159; 2.30s | 3; 129/132; 2.30s | 3; 124/126; 2.30s |
| F03 / Conduit | 3; 106/112; 3.80s | 3; 84/91; 4.90s | 3; 67/70; 7.15s | 3; 62/66; 6.30s |
| F03 / Spirit | 3; 187/190; 1.40s | 3; 165/168; 1.40s | 3; 137/141; 1.40s | 3; 144/149; 1.40s |
| F05 / Striker | 3; 151/152; 3.00s | 3; 120/120; 2.75s | 3; 106/110; 6.00s | 3; 100/102; 3.50s |
| F05 / Squire | 3; 158/158; 1.90s | 3; 117/119; 1.90s | 3; 106/108; 3.80s | 3; 100/102; 1.90s |
| F05 / Apprentice | 2; 96/103; 2.73s | 2; 80/83; 2.70s | 2; 71/73; 2.30s | 2; 66/70; 2.50s |
| F05 / Slinger | 3; 200/200; 1.20s | 3; 164/165; 2.30s | 3; 148/150; 2.45s | 3; 148/151; 0.90s |
| F05 / Conduit | 2; 84/89; 2.63s | 2; 67/68; 3.42s | 2; 47/50; 3.50s | 2; 48/51; 3.00s |
| F05 / Spirit | 3; 189/194; 1.40s | 3; 158/162; 1.40s | 3; 146/149; 1.40s | 3; 134/137; 1.40s |

Matched contrasts are differences of matched aggregate medians. They are joint
adult treatments, not species-specific causal multipliers.

| Node / class | adults2 - control | adults3 - control | pressure80 - adults3 |
|---|---:|---:|---:|
| F03 / Striker | -30.9 pp / -1072.0 HP / +0.50s | -30.9 pp / -2462.0 HP / +0.25s | +1.7 pp / +3103.0 HP / +6.25s |
| F03 / Squire | -13.4 pp / +792.0 HP / +0.00s | -28.8 pp / +1393.0 HP / +0.00s | +32.8 pp / -624.0 HP / +0.00s |
| F03 / Apprentice | -20.3 pp / +329.7 HP / +0.00s | -42.0 pp / +223.8 HP / +0.00s | +35.2 pp / -257.9 HP / +0.00s |
| F03 / Slinger | -10.0 pp / +493.0 HP / +0.95s | -11.1 pp / +490.0 HP / +0.95s | +1.7 pp / -426.0 HP / +0.00s |
| F03 / Conduit | +0.2 pp / +263.0 HP / +1.10s | -17.2 pp / +367.0 HP / +3.35s | +16.8 pp / -281.0 HP / -0.85s |
| F03 / Spirit | -1.0 pp / +1007.8 HP / +0.00s | -8.3 pp / +1351.8 HP / +0.00s | +6.8 pp / -397.4 HP / +0.00s |
| F05 / Striker | -13.2 pp / +323.0 HP / -0.25s | -25.6 pp / +1090.0 HP / +3.00s | +31.1 pp / -1007.0 HP / -2.50s |
| F05 / Squire | +0.8 pp / +92.0 HP / +0.00s | -2.8 pp / +1113.0 HP / +1.90s | +6.7 pp / -1158.0 HP / -1.90s |
| F05 / Apprentice | +0.1 pp / +224.1 HP / -0.03s | -8.7 pp / +346.3 HP / -0.42s | +11.3 pp / -513.3 HP / +0.20s |
| F05 / Slinger | -11.5 pp / +337.0 HP / +1.10s | -22.3 pp / +610.0 HP / +1.25s | +7.1 pp / -225.0 HP / -1.55s |
| F05 / Conduit | -14.2 pp / +213.5 HP / +0.80s | -12.4 pp / +277.0 HP / +0.88s | -2.3 pp / -211.5 HP / -0.50s |
| F05 / Spirit | -19.4 pp / +513.1 HP / +0.00s | -24.5 pp / +848.6 HP / +0.00s | +3.2 pp / -393.8 HP / +0.00s |

The large negative minimum-HP changes under HP-only adult durability in the
Forest03 Striker and Apprentice rows are survival evidence, not a justification
for raising all classes further. Pressure80 reverses much of that tail in the
matched screen, but the Forest03 Striker death remains.

## Pressure sources, Howl, recovery, and pack overlap

Incoming event damage totaled 244,860.9 HP across the matrix. The event stream
contained only direct and debt damage against the player; no incoming event was
labelled dot. Debt is kept separate rather than silently folded into direct
pressure.

| Source | Incoming events | Direct HP | Debt HP | Total HP |
|---|---:|---:|---:|---:|
| Dire Wolf | 9,857 | 162,042.8 | 1,542.0 | 163,584.8 |
| Ironclaw Badger | 1,841 | 32,449.2 | 59.0 | 32,508.2 |
| Dire Whelp | 7,569 | 23,885.5 | 118.0 | 24,003.5 |
| Thorn Spitter | 1,598 | 24,542.4 | 222.0 | 24,764.4 |
| Total | 20,865 | 242,919.9 | 1,941.0 | 244,860.9 |

The event stream recorded 2,490 Howl starts and 2,065 fired Howl ends; 425
starts did not reach a fired end because the cast was interrupted or the
observation ended. Longer-lived adults therefore changed the number of Howl
opportunities as expected. No Howl or follower attack value was edited by the
experiment.

Recovery telemetry contained 2,101 completed windows and 236 interrupted
windows. Across 2,455 observed episodes with a usable first-damage timestamp,
the episode-start to first-damage delta had a 0.40s median and a 0–2.00s
observed range. This is an approach-to-first-damage proxy, not a travel or
pathfinding proof. Persisted samples provided no blockedApproach samples.

| Node | Arm | Peak aggroed adults median/max | Peak aggroed monsters median/max | Samples with 2+ adults, median seconds/run | Longest 2+ adult interval median/max | Longest 4+ monster interval median/max | Approach median | Recovery median | Episodes solo/small/swarm |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| F03 | control | 1.0/1 | 4/4 | 0s | 0.00s/0.00s | 2.00s/10.00s | 0.40s | 2.90s | 242 / 20 / 100 |
| F03 | adults2 | 1.0/2 | 4/5 | 0s | 0.00s/0.00s | 3.00s/6.00s | 0.40s | 2.80s | 142 / 11 / 69 |
| F03 | adults3 | 1.0/1 | 4/4 | 0s | 0.00s/0.00s | 1.50s/7.00s | 0.40s | 3.50s | 143 / 13 / 73 |
| F03 | adults3-pressure80 | 1.0/2 | 4/6 | 0s | 0.00s/1.00s | 2.00s/5.00s | 0.30s | 3.05s | 178 / 19 / 83 |
| F05 | control | 1.0/1 | 4/4 | 0s | 0.00s/0.00s | 2.50s/7.00s | 0.40s | 2.60s | 269 / 28 / 127 |
| F05 | adults2 | 1.0/2 | 4/4 | 0s | 0.00s/1.00s | 2.00s/3.00s | 0.40s | 2.90s | 231 / 16 / 100 |
| F05 | adults3 | 1.0/2 | 4/5 | 0s | 0.00s/6.00s | 2.00s/5.00s | 0.40s | 2.40s | 200 / 16 / 93 |
| F05 | adults3-pressure80 | 1.0/2 | 4/4 | 0s | 0.00s/6.00s | 2.00s/6.00s | 0.40s | 2.80s | 186 / 12 / 87 |

The pack telemetry shows that a normal four-member Wolf pack is generally one
adult plus three Whelps, not four simultaneously aggroed adults. The one-second
sampling resolution can miss brief overlap, so the occasional sampled peak of
two adults is not evidence of sustained multi-adult contact. Exact independent
pack-clear lifetimes are not available as a stable measurement here; observed
episode duration and body TTK must not be substituted for that metric.

Forest has no lava or Heat mechanic in scope. Samples had no heat field, no
staticDamageContacts samples, and no environmental-contact evidence. The
persisted incomingDot field was nonzero in 1,879 one-second samples across 24
observations, with a maximum value of 11; it is reported as separate state
telemetry and was not reclassified as event damage.

## Death and sub-20% survivor audit

The runner minimum is evaluated on the 100ms simulation tick; persisted samples
are one second apart. Incoming windows below are event-stream HP damage in the
stated interval, centered on the player-death event or the lowest persisted
sample. Direct and debt components are shown where debt was present. The
nearest sample is context, not the authoritative runner minimum.

| Case | Outcome / cause | Runner minimum / nearest persisted sample | ±10s incoming sources | ±30s incoming sources | DoT / environmental state |
|---|---|---|---|---|---|
| F03 Striker adults2 / 9029 | Death at 174.1s; Dire Wolf melee, 32 HP | 0%; 174.0s: 27.2/251 (10.9%) | Wolf 288; Whelp 100 | Wolf 320; Whelp 143; Badger 70; Spitter 56 | incomingDot 0; no contacts |
| F03 Striker adults2 / 10427 | Death at 60.9s; Dire Wolf melee, 32 HP | 0%; 60.0s: 32.1/251 (12.8%) | Wolf 288; Whelp 147 | Wolf 432; Whelp 168 | incomingDot 0; no contacts |
| F03 Striker adults2 / 12007 | Death at 143.0s; Dire Wolf melee, 32 HP | 0%; 143.0s: 0/251 (0%) | Wolf 320; Whelp 119 | Wolf 320; Badger 196; Whelp 151 | incomingDot 0; no contacts |
| F03 Striker adults3 / 9029 | Death at 117.0s; Dire Wolf melee, 32 HP | 0%; 117.0s: 0/251 (0%) | Wolf 320; Whelp 130 | Wolf 320; Whelp 151; Spitter 56; Badger 28 | incomingDot 0; no contacts |
| F03 Striker adults3 / 10427 | Death at 36.5s; Dire Wolf melee, 16 HP | 0%; 36.0s: 11.2/251 (4.5%) | Wolf 272; Whelp 139 | Wolf 304; Badger 238; Whelp 157 | incomingDot 0; no contacts |
| F03 Striker adults3 / 12007 | Death at 49.1s; Dire Wolf melee, 32 HP | 0%; 49.0s: 16.8/251 (6.7%) | Wolf 336; Whelp 91 | Wolf 352; Whelp 119; Spitter 56 | incomingDot 0; no contacts |
| F03 Striker adults3-pressure80 / 9029 | Death at 161.2s; Dire Wolf melee, 23 HP | 0%; 161.0s: 21.2/251 (8.4%) | Wolf 173; Whelp 101 | Wolf 416; Whelp 191 | incomingDot 0; no contacts |
| F03 Apprentice adults3 / 12007 | Death at 41.8s; Dire Wolf melee, 29.7 HP | 0%; 41.0s: 31.5/240 (13.1%) | Wolf 224.8 (208.8 direct, 16 debt) | Wolf 304.4 (284.4 direct, 20 debt); Whelp 63.3 (60.3 direct, 3 debt); Badger 27.1 (26.1 direct, 1 debt) | incomingDot max 9; no contacts |
| F03 Striker control / 12007 | Window-ended survivor | 18.0%; 229.0s: 48.7/251 (19.4%) | Wolf 288; Whelp 115 | Wolf 288; Whelp 115; Spitter 112 | incomingDot 0; no contacts |
| F03 Striker adults3-pressure80 / 10427 | Window-ended survivor | 18.4%; 252.0s: 47.0/251 (18.7%) | Wolf 278; Whelp 65 | Wolf 636; Whelp 216; Badger 180 | incomingDot 0; no contacts |
| F03 Striker adults3-pressure80 / 12007 | Window-ended survivor | 1.7%; 102.0s: 11.4/251 (4.5%) | Wolf 232; Whelp 89 | Wolf 613; Whelp 345; Spitter 56 | incomingDot 0; no contacts |
| F03 Squire adults3 / 9029 | Window-ended survivor | 13.3%; 141.0s: 39.0/279 (14.0%) | Wolf 233 | Wolf 568; Badger 176; Whelp 80; Spitter 25 | incomingDot 0; no contacts |
| F03 Apprentice adults3 / 9029 | Window-ended survivor | 6.7%; 263.0s: 22.3/240 (9.3%) | Wolf 264.5 (238.5 direct, 26 debt) | Wolf 374.9 (342.9 direct, 32 debt); Spitter 81.3 (78.3 direct, 3 debt); Whelp 38.7 | incomingDot max 11; no contacts |
| F03 Apprentice adults3 / 10427 | Window-ended survivor | 6.6%; 167.0s: 22.1/240 (9.2%) | Wolf 197.1 (179.1 direct, 18 debt); Whelp 1 debt | Wolf 590.6 (552.6 direct, 38 debt); Whelp 89.4 (86.4 direct, 3 debt); Badger 27.1 (26.1 direct, 1 debt) | incomingDot max 10; no contacts |
| F03 Conduit adults2 / 10427 | Window-ended survivor | 17.9%; 268.0s: 46.7/227 (20.6%) | Wolf 96; Spitter 94 | Wolf 228; Spitter 115; Whelp 18 | incomingDot 0; no contacts |
| F03 Spirit adults3-pressure80 / 12007 | Window-ended survivor | 19.5%; 157.0s: 42.2/216 (19.5%) | Wolf 156; Spitter 15 | Wolf 307; Spitter 88.4; Whelp 8 | incomingDot 0; no contacts |

All eight deaths were attributed to a non-boss Dire Wolf melee hit. The
Forest03 Striker failures occur while the adult is still contributing direct
pressure; there is no lava-contact or environmental explanation in the
persisted context. The Apprentice low-health windows show the separate
incomingDot state and small debt contributions, but no environmental contact.

## Planner interpretation and exit boundary

Adults2 and adults3 are useful duration probes, not universal balance
multipliers. Their strongest clean Wolf medians were in the intended range for
some F05 roles, while Conduit and some F03 species tails became much longer.
The large class spread and the F03 Striker deaths make a global HP escalation
unsupported.

The pressure comparison is also joint: adults3-pressure80 changes both adult
attacks and leaves Whelp, Spitter, Howl, pack ecology, and all player setup
unchanged. It lowers aggregate incoming HP in 11 of 12 node/class comparisons;
Forest03 Striker is the counterexample because the relief arm stayed active
longer while still producing one death. Its tail still includes two additional
sub-20% survivors. Treat that as evidence for a narrow adult-pressure/movement
investigation, not proof that both adult attacks or either species independently
requires the same reduction.

The no-death F05 results are encouraging for targeted role follow-up, but the
Forest05 Apprentice and Conduit matched screens have only two eligible seeds
after exposure exclusion. They remain descriptive and should not be used to
declare a final winner. No extra matrix, ability change, automatic HP
escalation, production patch, economy run, route/acquisition run, browser
playtest, or live-feel certification follows from this packet.

The next balance review should reconcile this Forest evidence with the
remaining T2/T3 role coverage and the parked Volcano candidate. Source
reconciliation and fresh confirmation precede adoption.
