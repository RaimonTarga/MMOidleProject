# T2 Canonical Validation - 2026-09-10

## Result

The corrected 1x canonical cohort did not reproduce the `node-t2-jungle-04`
engagement collapse in the portion that ran. It also did not reach Jungle or
complete enough arms to support a Squire/Striker balance conclusion. The
limiting observation was normal, very slow T2 progression from a real T1
handoff, so the next step is **need economy analysis first**.

No class, frame, item, monster, Core, Technique, stance, reward, or progression
balance values were changed.

## 1. Entry-state validity

The intended 20-run matrix was reduced to the allowed minimum of three
replicates per arm because canonical 1x progression was materially slower than
the accelerated runs. The repaired global queue was configured for 12 runs,
four simultaneous workers, one worker per isolated run, no automatic retries,
`canonical-isolated`, `full-gauntlet`, reward multiplier `1`, and natural entry
economy. The queue was stopped after the first four runs had supplied a useful
bounded observation; all artifacts were retained.

The usable T2 source was commit `0a5f89716f4b19a78e2d7e8b9368b6e7ed54af31`.
Every started run had:

- reward multiplier `1`, empty taint list, and single-run execution;
- a real T1-derived Snapshot B, `canonicalAtCapture=true`, at 1x rewards;
- GM30 / player tier 2 entry and a matching declared frame;
- profile and spawn validation passing (`211` combined checks in the run
  header), before measured T2 combat.

The frame handoffs were:

| Arm | T1 source | Frame | Entry essence total | Catalysts |
|---|---|---|---:|---|
| Squire Balanced | corrected alternate-frame T1 handoff | `cooldown-balanced` | 3,002 | fortified 4 |
| Squire Heavy | final T1 economy Snapshot B | `cooldown-heavy` | 2,930 | fortified 4 |
| Striker Balanced | final T1 economy Snapshot B | `cadence-balanced` | 2,756 | fortified 4 |
| Striker Heavy | corrected alternate-frame T1 handoff | `cadence-heavy` | 2,834 | fortified 4 |

The source snapshots are not wallet-identical, so even a completed result
would require wallet-aware interpretation. The current importer also accepts
the historical baseline snapshots that predate the `target-max-stacks` starter
Rune; it still rejects missing crafted/non-starter Runes. This is compatibility
plumbing, not a balance change.

The canonical inputs and raw run artifacts are under:

`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260910t014224z-t2-canonical-squire-balanced-real`

`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260910t014323z-t2-canonical-squire-heavy-real`

`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260910t014335z-t2-canonical-striker-balanced-real`

`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260910t014345z-t2-canonical-striker-heavy-real`

## 2. Squire comparison

| Arm | Started / target | Completed | Censored run result | Deaths | Jungle reached |
|---|---:|---:|---|---:|---:|
| Balanced / Knight | 3 / 3 | 0 | 47.6-48.1 minutes; Plains level 11; 512-537 kills | 0 | 0/3 |
| Heavy / Bulwark | 1 / 3 | 0 | 48.3 minutes; Plains level 11; 556 kills | 0 | 0/1 |

All started Squire runs were actively killing in ordinary Plains nodes. The
Balanced and Heavy arms therefore have no admissible canonical runtime,
Jungle throughput, or completion comparison from this cohort. The two queued
Heavy runs never started and are non-runs.

## 3. Striker comparison

No Striker run started before the bounded stop. All three Balanced and all
three Heavy entries were queued-only cancellations. There is consequently no
canonical Striker completion, death, Jungle, or frame comparison to report.

## 4. Combat versus economy/tooling

The four observed runs spent about 48 real minutes reaching only the first T2
biome's level-11 farm. They recorded 512-556 kills, zero deaths, and live
attacker samples throughout. The only resource waits were the expected early
offensive-stance unlock waits; after those waits, the route was farming Plains
to level 12. This is a normal progression/economy-time wall, not a combat
freeze or class failure.

The canonical route is deliberately full progression: Plains -> Forest ->
Swamp -> Mountain -> Cave -> Jungle -> Desert. Since the cohort was censored
before Forest turnover, it cannot distinguish later combat walls from later
resource delays. The standard artifact schema also has no direct
reachable/targetable-monster or movement-state field; those remain diagnostic
limitations rather than inferred failures.

The initial 30-minute farm watchdog was extended to two hours for these
validation farm steps, while the normal no-progress guard was retained. The
earlier natural-fallback attempts and Snapshot-import failures are excluded
as harness/setup diagnostics, not gameplay results. The convenience
`bot:t2-report` command was unavailable in this checkout because its `tsx`
runner dependency is missing; the measurements here come from the preserved
`events.jsonl`, run headers, and queue summaries.

## 5. Jungle regression check

No current canonical run reached Jungle, so this batch supplies no new
node-04 samples. It did supply a clean pre-Jungle control: all four started
runs saw 42-57 live monsters in Plains nodes, 32.4-36.7% zero-attacker
samples, frequent nonzero attackers, sustained kills, and no deaths. This is
incompatible with the old 90-96% fixed-point signature.

The post-fix direct node diagnostic remains the authoritative node regression
check: node-04 held 40 live monsters, had 46.2-47.5% zero-attacker samples and
534-546 kills/hour, while neighboring nodes were ordinary. The post-fix
accelerated J0 validations also completed Balanced Squire 3/3 and Balanced
Striker 3/3 without the old signature. Those earlier runs were synthetic J0 /
25x or catalyst-primed combat diagnostics, not canonical economy evidence.

The technical cause remains the safe-Jungle-thicket Recovery gate fixed in
`0075d844bf1cd204e71e90633899f678ca091bbd`: a generic node-feature marker
suppressed out-of-combat Recovery inside harmless `denseBush`, leaving
`wait-for-regen` before target acquisition. `node-t2-jungle-04` was the common
stall location because it is the Swamp-to-Jungle transit node. The fix was
narrowed to suppress Recovery only for active player-targeted damage features;
no node or combat values were retuned.

## 6. Previous T2 evidence and decision

The following classification is retained:

- The pre-fix node-04 stall rates, and any Squire/Striker frame or weapon
  conclusion drawn from those zero-engagement stalls, are node-confounded.
- The post-fix 25x/J0 frame and weapon results are valid as noncanonical
  combat/progression diagnostics with normal engagement, but not as 1x
  economy evidence and not as final balance conclusions.
- The prior Conduit Ruinous Axe separation, current Desert
  Survivalist-vs-Tempered lack of separation, and Apprentice Contagion/Sweep
  signal were not caused by this node-04 Recovery bug and remain valid in
  their original evidence class. The earlier Slinger Contagion possibility
  remains a later replication hypothesis.
- This canonical attempt adds a strong economy/pacing warning but no evidence
  that Balanced Squire or Balanced Striker is weaker under normal conditions;
  neither arm pair received the required canonical sample.

The narrow route additions, canonical alternate-frame T1 handoffs, handoff
frame-telemetry correction, historical-Rune importer compatibility, and farm
watchdog adjustment were covered by the focused tests. Full `pnpm test`
passed `153/153`, and `pnpm typecheck` passed. No balance values were changed.

**Decision: need economy analysis first.**
