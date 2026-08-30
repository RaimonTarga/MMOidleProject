> **ARCHIVED — implemented 2026-08-30** (verified live: the Rallying Cry cast is in
> `shared/src/data/monsters/bossesT1.ts`); live state in `docs/boss-encounter-rework-current-state.md`.

# Spirit T1 boss balance handoff — 2026-08-30

## Purpose

Implementation handoff for the next agent. This is a narrow boss-balance pass driven by the latest Spirit playtest. The designer will continue running canonical class routes separately; do not broaden this into a general class rework.

## Evidence

Playtest artifact: `server/runs/human-playtests/human-2026-08-30T09-50-05-282Z-7c3acaaa` (`canonical-spirit-route`).

- Spirit failed to finish T1 Plains and Forest after repeated attempts.
- The best recorded Plains attempt reached about 10.6% boss HP.
- The best recorded Forest attempt reached about 21.9% boss HP.
- Spirit defeated Mountain, Cave, and Swamp in the same session.
- The session recorded four Plains boss deaths and two Forest boss deaths; the remaining death was outside those boss tests.
- The successful fights support the diagnosis: Spirit benefits greatly from boss downtime, while continuous pressure exposes its intentionally weak recovery and plating scaling.

The result does not justify adding mid-combat Barrier regeneration to Spirit. That would change the class's core defensive identity and would affect every encounter. The target is to make the two continuous-pressure T1 bosses barely attainable without removing their identities.

## Approved implementation scope

### 1. Plains — telegraphed reinforcement cast

Current T1 Plains behavior is authored in [`shared/src/data/monsters/bossesT1.ts`](../../shared/src/data/monsters/bossesT1.ts):

- At 50% HP: spawn four Plains Slimes, one Boar, and roar immediately.
- Every 10 seconds, after a 4-second initial delay: spawn two Plains Slimes immediately.

Change both reinforcement paths so the boss performs a 2-second `Rallying Cry` cast before the adds appear.

Required behavior:

- The boss visibly casts for 2,000 ms and cannot attack or reposition during the cast.
- Adds spawn only when the cast completes, not when it starts.
- The phase and repeating reinforcement counts, caps, offsets, and existing roar effect remain unchanged unless the runtime requires a minimal equivalent representation.
- The cast should publish the normal boss-cast presentation with the label `Rallying Cry`; reuse the existing wolf/pack aggro visual treatment where practical, but make the cue readable at boss scale.
- This is downtime and warning, not a new damage, stun, or defensive mechanic.

The current `BossAction`/boss-script runtime fires `spawn-adds` immediately, so this may require a small reusable delayed/cast action rather than a Plains-only timer hack. Keep the implementation generic enough for future scripted summon casts, but do not add unrelated boss features.

### 2. Forest — modest T1 HP reduction

Keep the Forest boss's identity intact: fast two-hit claw attacks, cadence ramp, no adds, and no new defensive mechanic. Reduce only the T1 Gnarled Greatbear's HP as the first tuning step.

Recommended starting value: `2000 -> 1800` (10% reduction). Do not exceed a 15% reduction without a new balance decision. Preserve attack, cooldown, combo count, ramp, movement, and all other stats.

The HP reduction is intended to shorten the attrition window while preserving the boss's frequent-hit test. It is not a request to reduce Forest HP across later tiers.

### 3. Swamp — +3 seconds to poison duration across the lineage

Increase the boss-applied poison/venom duration by 3,000 ms for every currently authored Swamp boss:

| Boss | Current | New |
|---|---:|---:|
| T1 Grave Toadeater | 4,000 ms | 7,000 ms |
| T2 Mire-Gorged Behemoth | 5,000 ms | 8,000 ms |
| T3 Rot-Spore Croc-Behemoth | 6,000 ms | 9,000 ms |

Also update the T3 25% `Rot Spores` morph override from 6,000 ms to 9,000 ms. Otherwise the late-phase override would silently undo the lineage change.

Do not change pool duration, pool damage, pool radius, poison damage per stack, max stacks, attack cadence, or phase thresholds. The purpose is to keep the DoT active through the boss's pool-cast/movement gaps; it should not materially change damage while the boss is continuously landing attacks because those hits already refresh the effect.

There is currently no T4 Swamp boss in the active lineage.

## Explicitly out of scope

- No Spirit Barrier recovery or new Spirit-specific combat mechanic.
- No rune-priority or hazard-AI changes.
- No changes to Plains add counts, boss HP, or roar magnitude.
- No Forest attack/cadence adjustment in this pass.
- No Forest changes to later tiers.
- No Swamp pool tuning beyond the poison-duration field.
- No changes to the canonical Slinger route; that is a separate balance workstream.

## Verification requirements

1. Add or extend a server boss-script test proving that Plains reinforcement adds are absent during the 2-second cast and appear at cast completion, while the boss does not attack during the cast.
2. Add or extend data assertions for the three Swamp durations and the T3 morph override.
3. Verify the Greatbear HP change does not alter its other authored mechanics.
4. Run `pnpm typecheck` and `pnpm test`.
5. Run the relevant boss/balance bench or a focused Spirit T1 playtest. The desired result is that Spirit can clear Plains and Forest with a normal end-of-T1 build, while the fights remain meaningfully closer than Mountain/Cave.
6. Report the exact files changed, test results, and any balance observations. Do not silently adjust additional boss numbers if the first pass is still too hard or too easy; record the result for the next balance discussion.

## Design conclusion

The intended correction is to give Spirit brief, readable recovery windows where the encounter already has a natural pause, and to shorten the Forest attrition test without erasing its cadence identity. Swamp's longer poison persistence is a separate lineage-consistency buff, not a response to Spirit's Plains/Forest failures.
