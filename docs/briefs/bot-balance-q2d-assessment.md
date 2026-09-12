# Q2d assessment — initial local readiness complete

2026-09-12, Astra. Accept Spirit, Apprentice and Squire as functional local
readiness passes on `755b2a3642a3a417f364f5fb8486e661bfc351b0`. Together with
Q2b Striker and Q2c Conduit/Slinger, all six selected class profiles have completed
both configured observation windows. This closes the initial T2 Plains slice,
not all route, tier, recovery, Rune-condition or boss validation.

## Verified evidence

Recomputed all three manifest hashes against their sidecars; read terminal state,
run summaries and raw window boundaries; recounted kills and ability activations.
All three have valid treatment, normal completion, three verified builds and no
failed treatment assertions. See [operator report and artifact links](bot-balance-q2d-report.md).

| Class/window | Start/end ms | Kills | Expected Technique activations | Second Wind |
|---|---|---:|---:|---:|
| Spirit Sweep | 29,206 / 90,286 | 6 | 8 | 0 |
| Spirit Expose | 93,303 / 154,371 | 8 | 5 | 0 |
| Apprentice Sweep | 27,683 / 88,758 | 10 | 8 | 1 |
| Apprentice Expose | 91,768 / 188,356 | 9 | 5 | 2 |
| Squire Sweep | 19,644 / 80,705 | 11 | 8 | 0 |
| Squire Expose | 83,717 / 144,777 | 7 | 5 | 0 |

Spirit's original Q2c network failure remains a separate pre-worker event. Q2d
launched its existing queued experiment once. Spirit and Squire had no deaths;
Apprentice died during Expose and returned through Sanctuary and Forest-05 to
Plains-05. Its completion demonstrates the cumulative observation/recovery path,
not uninterrupted survival. Kills in this table are within the full step bounds;
any off-node events during recovery must not be mistaken for selected-node kills.
Preserve the report's excluded dead/off-node time and unsampled tails. Zero Guard
activations alone does not imply a defect without an eligible opportunity.

## Campaign state and next decision

- Configuration: six selected profiles passed acquisition and exact build checks.
- Local behavior: six profiles, twelve completed windows on the common frozen
  readiness source. Slinger and Apprentice also supplied death/return evidence.
- Boss coverage in this campaign: zero. No all-tier viability, class ranking,
  natural economy or reliability conclusion has been established.
- Repairs so far: observation transit selection and Docker network capacity.
  No gameplay balance changes were made for these experiments.

Proceed to [V1a](bot-balance-v1a-operator-packet.md), one Striker Tier 1 Plains
boss probe. It earns end-of-T1 preparation from a fresh character and stops after
one authored dungeon attempt. This follows the planned T1-first boss coverage;
the T2 readiness fixtures are not repurposed as overlevelled T1 boss entrants.
Preparation is accelerated 25x and separately reported. If the run never reaches
the boss, diagnose preparation/guard/transit rather than declaring the boss hard.

Next, use the encounter evidence to decide a targeted preparation adjustment,
additional replicate or next class/boss. Build toward every boss covered and a
viable path per class, not every class winning every matchup. Natural 1x economy
and assembled tier progression tests follow functional encounter coverage.

## V1a preparation rationale and source boundary

Reviewed the current `tusked-razorback` definition: 1,700 HP, 34 attack, 4 plating,
2% reduction, recurring slime reinforcements and a 50% rally with slimes/boar and
a temporary herd attack-speed buff. This is add pressure, so use Sweep and Second
Wind. Keep the existing full movement/recovery Rune package, including hazard
avoidance for transit/guardians. No stance or Rite is injected into Tier 1.

Reuse the existing Striker Tier 1 acquisition route through all five normal
biomes, GM30 and earned +5 gear. Wear Chaotic Axe, Plains Vest, Swamp Charm and
Plains Boots. Assert tier below 2, GM30, equipped identities and +5 upgrades;
then atomically verify the complete combat loadout (19 RP, GM30 budget 22).
There is no selected frame at this first T1 seal. No later boss/ascension steps
are inherited. Normal guardian clearing and altar activation remain in use.

V1a source is `53769682648bf66f8e265ebbf05c924bc4373c3c`, which includes the
independently committed Bog Lurker work since the Q2 readiness source. This is a
new current-source encounter probe, not a paired comparison with Q2. Uncommitted
HUD/buff work is excluded. No gameplay mechanics were edited for V1a.

Infrastructure: completed Spirit's owned PostgreSQL/Redis services were stopped
and detached, and its network removed to free one slot. Containers, PostgreSQL
volume and artifacts remain. Receipt: Spirit artifact-root parent experiment
directory, `v1a-network-preparation.json`. Successful temporary network creation
and removal verified current capacity. Restoring those retained services requires
reattaching an isolated network and original service aliases first. No V1a run
was launched.

Validation: full `pnpm bot:preflight` passed in a clean detached checkout of
`53769682648bf66f8e265ebbf05c924bc4373c3c`, including bot/server typechecks,
socket build preflight, route/loadout/entry semantics and experiment tooling.
The new bounded-route regression checks one Plains attempt, earned preparation,
no frame unlock/stance acquisition and RP affordability. Pure run-plan validation
confirmed one case, fastBossRetry=false and the 900,000 ms ceiling. The full
repository test suite was not rerun. These checks are tooling evidence; V1a
runtime preparation and boss viability remain untested.
