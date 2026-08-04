# Next Multiplayer Playtest Roadmap

> Rough implementation sketch for the next multiplayer playtest.
>
> This is a list of gameplay, content, visual, and readiness work. It does not
> describe implementation architecture, refactoring strategy, or technical
> solutions. Those decisions come later.

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
- Character selection is a later convenience feature, not a prerequisite.
- Final visual polish and complete animation coverage are not prerequisites.

## 1. Progression and core systems

- Implement the relic system. **Done 2026-08-04.**
- Add the relic equipment slot. **Done 2026-08-04.**
- Introduce relics as a T4 progression system. **Done 2026-08-04.**
- Change tier advancement from boss kills to seals.
- Ensure seals support progression through T4, T5, and T6.
- Ensure relics, gear, cores, stances, rites, abilities, and runes work as a
  coherent build system.
- Review progression unlocks and rewards across T1–T6.
- Review any existing systems whose placeholder content affects player
  decisions.

## 2. Authored build content

- Author the core item catalogue for the tiers in scope.
- Author stances rather than relying on AI-generated content.
- Author rites rather than relying on AI-generated content.
- Review abilities, runes, charms, and gear so they fit the finalized build
  direction.
- Author T5 and T6 equipment, relics, and other progression rewards.
- Review class and item identities that no longer fit the ability system.
- Decide whether Summoner is included in this playtest or remains disabled until
  its rework is complete.

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
- Rework Summoner as part of this pass if it is included in the playtest.
- Redesign classes or items where the finalized systems require it.

Before the playtest, perform only enough tuning to prevent impossible,
trivial, or clearly broken progression. The larger balance pass can continue
after playtest feedback.

## 7. Visual and presentation pass

### Required for readability

- Complete enough player character sprite work to distinguish players and
  classes during multiplayer play.
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

- Restore the Railway deployment to a usable development state.
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
- Character selection and multiple-character convenience features.
- Final player sprite overhaul and complete animation coverage.
- Final tier aura and presentation polish.
- Full failure-diagnosis and onboarding polish.
- Release-level balance and economy perfection.
- Any content or systems not needed to support the T1–T6 playtest scope.
