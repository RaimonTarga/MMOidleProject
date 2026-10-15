# T3W2-SQUIRE report
**Agent:** Claude   **Branch:** rw/t3w2-squire   **Last commit:** see `git log -1` (report committed with the code)

## Done
- **Moments switched to the real registry.** `chill-threshold` (Frostward) and `fire-attack` (Backdraft, still aimed at the attacker whose style is fire) now read `momentActive`; the stand-in for `chill-threshold` is deleted. Two local reads remain, in `LOCAL_MOMENTS`, with reasons: `drag-or-push` (the registry's event fires inside `applyForcedMovement` as the push happens, too late to plant, so Anchor still looks ahead at the wind-up/pull step) and the ordinary-kiter half of `target-flees` (the registry only knows a boss escaping). Edit in `server/src/systems/classes/archetypes/cooldown/squire.ts` (outside the brief's paths; the addendum asked for it).
- **Statuses.** `squire-frostward` and `squire-rampage`: buff ids, server tiles (`squireBuffs.ts`), help text, icon lookup (both wear the existing `squire-guard` icon; no art). `statusRegistry` shows no Squire gap left (it still fails on other classes' Conduit ids).
- **Resolve dial past budget.** New networked `usesCooldown.resolveBudget` (slice, `PlayerView`, mechanic model, written with `markSliceDirty`). `ResolvePips` draws pips past the budget dashed and adds a help line.
- **Specialization visible.** `specializationIdAtom`; the Responses editor shows the picked specialization (name and text) or, at tier 3+ with a discipline, "Pick a specialization" with that discipline's three.
- **Passive Tree pick.** `SkillTreePanel` and the unlock gate are class-generic and list the specializations under the picked discipline; verified by a test of `canUnlockSkill` for all nine Squire specializations (right discipline only). No panel change needed.
- **Tutorial.** `buildSquireTierThreeBeats()` appended after the T2 stretch: specialization line, then Mountain (Guard II, Faultline III), Cave (Earthstamp II, Corrode III), Swamp (Anchor, Rot-Eater III), Jungle (Chain Hook, Strangler Vine II), Desert (Challenge II, Executioner's Oath II), Tundra (Frostward, Deep Winter), Volcanic (Backdraft, Kindling). Existing step types only.
- **Bot route `squire-t3`** (`bot/src/routes/squireT3.ts`, registered, NOT in `CONTROLLED_ROUTE_IDS`): the T2 route, `unlockSkill` on the specialization (default Measure for Measure; `squireT3Route(id)` picks the matching discipline), then each T3 zone farmed to its cap and its boss. Test `squireT3.test.ts`.
- Wiring test `server/test/squireT3W2.test.ts` (tiles, budget vs. bar, spec gate, tutorial stretch).

## Checks
- pnpm typecheck: clean
- pnpm test -- squire tutorial classKit mechanicFired moments classFirstTree: 29/29 passed
- pnpm test -- statusRegistry: still fails, only on Conduit ids (`conduit-burn-bright`, `-hibernate`, `-horn`, `-hunt`, `-spore`, ...); no Squire gap.

## Not done, or unsure
- The tutorial has no step reading the specialization pick (same as the discipline in T2): the line rides on a farm beat.
- Backdraft needs the fight snapshot refreshed this tick (it is, at the top of each tick); a monster that aggros and fires in the very same tick may miss one answer.
- Anchor stays a look-ahead (above); if the conductor wants the registry's `drag-or-push` to be predictive, that is in `moments/`.
- Route not run live; no T3 gear crafting steps. Deep Winter's help text says the slam "hits harder the fuller the bar" per the T3 reading. Not verified in a browser.
- `TutorialPanel` farewell timing is unchanged (the farewell still shows after the last beat, now Volcanic T3).

## Files outside the brief I needed (edited)
- `squire.ts` (moments switch, `resolveBudget` write), `shared/src/components/archetypes/cooldown/usesCooldown.ts`, `shared/src/protocol/views.ts`, `server/test/mechanicFired.test.ts` and `squireT3.test.ts` (one-line fixes for the new field and the real moment's snapshot).
