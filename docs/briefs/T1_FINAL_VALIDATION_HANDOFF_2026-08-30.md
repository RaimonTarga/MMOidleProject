# T1 final validation handoff — 2026-08-30

## Purpose

Run the final unattended validation batch for the six canonical Tier 1 routes under the current code. The Plains and Forest boss changes were handled separately and are intentionally not re-documented here.

## Current conclusion

The recent playtests support moving to final validation:

- Apprentice cleared all five bosses after the recent balance changes.
- Slinger and Conduit produced successful Plains/Forest kills; Slinger had a close Plains result and Conduit’s run ended after Forest, so neither is a complete six-route gauntlet proof.
- Spirit’s pre-change failure is explained by the old Plains/Forest balance. A post-change canonical Spirit artifact is still required before calling the class validated.
- The earlier Striker and Squire runs cleared the full boss set, although they included deaths/retries.

## One route correction to verify before the batch

The dodge baseline still assigns `cleanse` to the Cave boss. Cave currently has no relevant debuff, so the baseline should use `second-wind`, matching the other non-debuff recovery cases. Keep `cleanse` for Swamp. The Brace experiment override for Cave is separate and should remain unchanged.

Do not make new Plains/Forest route changes for this batch, and do not add Barrier recovery or hazard-specific behavior unless a run exposes a reproducible blocker.

## Canonical routes to run

Run these six baseline IDs, with no manual control and no mid-run route edits:

| Class | Route ID | Required coverage |
|---|---|---|
| Striker | `striker-t1` | Full five-boss gauntlet |
| Squire | `squire-t1` | Full five-boss gauntlet |
| Slinger | `slinger-t1` | Full five-boss gauntlet; watch Plains retries |
| Spirit | `spirit-t1` | Full five-boss gauntlet; this is the important post-change confirmation |
| Apprentice | `apprentice-t1` | Full five-boss gauntlet |
| Conduit | `conduit-t1` | Full five-boss gauntlet; previous artifact stopped after Forest |

Use the canonical baseline routes, not the `v2`, Brace, or other experiment variants.

## Evidence to capture

For each route, record:

- authoritative boss-clear/kill events for all five bosses;
- boss duration, player HP/incoming damage, and number of attempts;
- every death, including whether it occurred to a boss, a telegraph, a DoT, or trash;
- rune activations, especially Cave `second-wind` and Swamp `cleanse`;
- any manual intervention or route change, which taints that route’s validation result.

Use authoritative kill events or final progression state when they disagree with the `boss-attempt` summary. The Slinger artifact showed that telemetry can report zero victories for a boss even when the kill event is present.

## Pass criteria

A route passes when it clears all five T1 bosses unattended under the canonical setup. Deaths or retries should be reported, but a close kill should not be treated as a failure solely because the summary’s attempt counter is noisy.

The final report should include a six-by-five boss matrix, deaths grouped by cause, and a short note for any route that required unusually many retries or disengagements.

## Items to observe, not pre-emptively retune

- Confirm the already-landed Plains and Forest changes behave consistently across classes; do not redesign them during this batch.
- Watch the swamp pool edge case where the player can lose its attack path between vile pools. Treat it as a follow-up unless it prevents a canonical unattended clear.
- Compare Cave recovery behavior after changing the dodge guard to `second-wind`; there is no reason to spend Cleanse there in the current boss roster.
- Do not infer a bot-route problem from human-playtest disengagement counts alone. Several human runs contained retrials and repositioning before the eventual kill.

## Scope boundary

This is a validation batch, not another balance pass. Do not change boss numbers, add a Spirit-specific Barrier mechanic, farm replacement gear, or create new route variants while the batch is running. If a route fails, preserve the artifact and report the exact boss, death trace, rune state, and final player/boss state for the next balance discussion.

## Existing verification

The current focused checks passed before handoff:

```text
server/test/bossRework.test.ts              boss rework tests passed
bot/src/routes/t1Routes.semantic.test.ts    ok
```

If the Cave guard is corrected or any other code changes land before the batch, rerun the relevant server/bot tests and the normal project checks before launching validation.
