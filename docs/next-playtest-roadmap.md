# Next Multiplayer Playtest Roadmap

> Living implementation sketch for the next multiplayer playtest.
>
> This is a list of gameplay, content, visual, and readiness work. It does not
> describe implementation architecture, refactoring strategy, or technical
> solutions. Those decisions come later.

Last reviewed: 2026-08-04. Completed items are marked inline; unmarked items are
still open.

## Current progress

- **Cores complete:** the system, authored twelve-core catalogue, presentation,
  tests, and bespoke icon set are implemented.
- **Relics complete for T4:** the sixth equipment slot, eight-relic launch cast,
  shared mechanic resolver, presentation, tests, and bespoke icon set are
  implemented. T5/T6 evolutions and final balance remain future content work.
- **Player account flow complete:** Discord authentication plus character create,
  select, switch, and soft-delete are implemented. Admin authentication remains
  a separate deployment blocker.
- **Seal progression complete for authored tiers:** T1–T4 advancement uses
  distinct boss first-clears, and the Progression panel exposes the requirement,
  every biome source, and an all-tier ledger. T5/T6 rows wait for those tiers'
  bosses.
- **Summoner remains the largest class decision:** its current implementation is
  not the intended final design. Reworking it requires a dedicated external
  design session before implementation; decide early whether it makes this
  playtest or is temporarily disabled.

The main remaining sequence is: settle the Summoner decision; finish the T3/T4
build-content gaps; verify T1–T4 end to end; author T5/T6 (including their seal
rows); then perform the multiplayer, balance, visual-readability, Railway, and
playtest-preparation passes.

## Playtest goal

Run a multiplayer playtest on Railway with:

- Stable, playable content through T4.
- New permanent content in T5 and T6.
- Relics available from T4 onward.
- Optional multiplayer-focused encounters.
- Enough balance and visual clarity to produce useful feedback.

The game is expected to eventually support T1–T8 and potentially additional
tiers later. T5 and T6 are permanent game content, not temporary playtest-only
tiers.

## Scope boundaries

- T1–T4 must be stable and free of major progression or gameplay blockers.
- T5–T6 should be meaningfully new, authored, and playable, but do not need
  final release-level polish.
- Multiplayer content is optional and must not block normal progression.
- T7–T8 are outside the scope of this playtest.
- Discord authentication and character selection are already implemented.
- Final visual polish and complete animation coverage are not prerequisites.

## 1. Progression and core systems

- Implement the relic system. **Done 2026-08-04.**
- Add the relic equipment slot. **Done 2026-08-04.**
- Introduce the eight-relic launch cast as a T4 progression system, including
  bespoke icons. **Done 2026-08-04.**
- Change tier advancement from quest boss kills to derived first-clear seals for
  T1–T4. **Done 2026-08-02.**
- Complete seal progress, biome-source attribution, persistent mastery meter,
  and all-tier ledger presentation. **Done 2026-08-04.**
- Extend the seal table and sources through T5 and T6 as those tiers are authored.
- Ensure relics, gear, cores, stances, rites, abilities, and runes work as a
  coherent build system.
- Review progression unlocks and rewards across T1–T6.
- Review any existing systems whose placeholder content affects player
  decisions.

## 2. Authored build content

- Implement and author the twelve-core catalogue for the tiers in scope,
  including bespoke icons. **Done 2026-08-04.**
- Author stances rather than relying on AI-generated content.
- Author rites rather than relying on AI-generated content.
- Review abilities, runes, charms, and gear so they fit the finalized build
  direction.
- Author T5 and T6 equipment, relics, and other progression rewards.
- Review class and item identities that no longer fit the ability system.
- Hold the dedicated external Summoner design session, then decide whether the
  reworked class is included in this playtest or the current class is temporarily
  disabled. **Outstanding; external-session dependency.**

## 3. T1–T4 stability and content pass

- Verify the full progression path through T4.
- Extend the successful T1 ecology direction to the remaining tiers where
  necessary.
- Review T1–T4 monster identities, spawning, and combat pressures.
- Author or improve T1–T4 dungeon encounters.
- Author or improve T1–T4 boss encounters.
- Ensure boss encounters have readable identities, threats, counterplay, and
  rewards.
- Remove major placeholder or AI-generated content that would distort playtest
  feedback.

## 4. T5 and T6 permanent content

- Define the identity and purpose of T5.
- Define the identity and purpose of T6.
- Author the T5 and T6 biome or region content required for the playtest.
- Author new monsters and ecology for T5 and T6.
- Author T5 and T6 dungeons.
- Author T5 and T6 bosses.
- Add T5 and T6 seals, recipes, equipment, and rewards.
- Establish how T5 and T6 extend the power and progression curve without being
  the final game ceiling.
- Leave a clear path for future T7 and T8 content.

## 5. Optional multiplayer content

- Author optional multiplayer-focused boss encounters.
- Ensure these encounters are distinct from normal solo progression.
- Provide meaningful cooperative rewards without making multiplayer mandatory.
- Verify shared rewards, party participation, deaths, disconnects, and retries.
- Test whether the encounters create meaningful cooperation rather than simply
  requiring more damage.

## 6. Balance and economy pass

After the gameplay systems and in-scope content are in place:

- Rebalance player power across T1–T6.
- Rebalance monster and boss power across T1–T6.
- Rebalance relics and their effect on builds.
- Rebalance gear, cores, stances, rites, abilities, runes, and charms.
- Rebalance essence, catalysts, recipes, upgrade costs, and rewards.
- Review biome XP, mastery, seals, and tier advancement pacing.
- Check that no class, build, item, or progression route is mandatory.
- Preserve enough power headroom for future T7 and T8 content.
- If Summoner is included, implement its external-session design before this pass
  and balance the completed rework here.
- Redesign classes or items where the finalized systems require it.

Before the playtest, perform only enough tuning to prevent impossible,
trivial, or clearly broken progression. The larger balance pass can continue
after playtest feedback.

## 7. Visual and presentation pass

### Required for readability

- Complete enough player character sprite work to distinguish players and
  classes during multiplayer play.
- Complete the bespoke core and relic icon sets. **Done 2026-08-04.**
- Complete readable item icons for inventory and loadout decisions.
- Ensure new T5/T6 content has a distinct visual identity.
- Ensure no missing or misleading visual assets obscure gameplay information.

### Additional polish

- Continue player sprite iteration.
- Add new character and combat animations.
- Rework the player tier aura effect.
- Add further visual polish to new monsters, bosses, environments, and items.

## 8. Railway multiplayer readiness

This is a separate deployment/readiness track from the gameplay roadmap.

- Implement Discord player authentication and character selection. **Done
  2026-08-04.**
- Restore the Railway deployment to a usable development state.
- Configure and verify Discord authentication in the deployed environment.
- Confirm production game DB, log DB, and Redis operation.
- Confirm persistence across reconnects and server restarts.
- Confirm multiplayer sessions, parties, travel, combat, rewards, and deaths.
- Provide test accounts, reset tools, or equivalent playtest setup support.
- Keep administrative access restricted during the playtest.
- Confirm logs and telemetry are sufficient to diagnose playtest problems.

## 9. Playtest preparation

- Define the intended tester progression path through T1–T6.
- Prepare ways to reset characters and access relevant content quickly.
- Prepare a list of known limitations and placeholder content.
- Define the specific questions the playtest should answer.
- Prepare a consistent way for testers to report bugs, balance issues, and
  confusing mechanics.
- Record which issues are blockers, balance problems, content problems, visual
  polish, or future work.

## Deferred until after this playtest

- T7 and T8 content.
- Additional tiers beyond T8.
- Final player sprite overhaul and complete animation coverage.
- Final tier aura and presentation polish.
- Full failure-diagnosis and onboarding polish.
- Release-level balance and economy perfection.
- Any content or systems not needed to support the T1–T6 playtest scope.
