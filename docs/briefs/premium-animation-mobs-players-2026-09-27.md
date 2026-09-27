# Premium animation pass for mobs and players — handoff (2026-09-27)

The boss-lineage session gave every boss "premium" animations, and the user wants the
same treatment for **ordinary mobs**, and later **player attacks and abilities**. This is
the starting point for that session. Branch: `feat/boss-lineage-redesign` in the
`mmo-t1-balance` worktree (not pushed).

## The grammar (what the user liked)

The Trench boss was the favourite. Every action should have:

1. **A wind-up you can read**: a clock, often drawn over the victim (jaws closing, a
   sigil drawing itself, ice closing in).
2. **A visible payoff** when it lands, and **a visible cancel** when a stun or root
   stops it (jaws crack apart, the boss stumbles).
3. **Body motion** on the sprite: crouch, leap, squash, lean, tremble, afterimages.
4. **Weight** on heavy hits: subtle shake and hit-stop (behind Settings -> Screen shake).
5. **A lasting look for lasting states**, not just a burst when they start.

Everything is procedural (graphics, particles, pose tweens); no PixelLab frames.

## The toolkit (all in `client/src/fx/`)

| File | Use it for |
|---|---|
| `bodyPose.ts` | `tweenPose`, `posePath` (keyframed crouch/leap/land), `releasePose`, `setTremble`, `afterimages`. Poses layer over the sprite pipeline every frame, so never tween `sprite.scale`. |
| `windups.ts` | `registerWindup(scene, casterId, { fire, cancel, expire }, { fx, ttlMs })`; `combatFx` resolves it on the matching `monster-cast-end`. `fire` returning `'continue'` lets the ordinary cue play too. Also `follow`, `castTargetId`, `spriteAt`, `suppressBossFx`. |
| `impactFeel.ts` | `impact(scene, 'light' \| 'medium' \| 'heavy', at?)`. Use sparingly on mobs: with many mobs, shake everywhere is noise. |
| `bossAuras.ts` + `auraDefs.ts` + `auraTypes.ts` | View-driven persistent looks. Rows can target `on: 'boss' \| 'monster' \| 'player'`, with ground/body/overhead/beat layers, stacks, and start/end one-shots. |
| `bossKit.ts` | Primitives: `debrisKick`, `dustCloud`, `inhale`, `ring`, `lob` (arced projectile with shadow), `drawCracks`, `drawSigil`, `dirTo`. |
| Lineage modules | Worked examples: `trenchBoss.ts` (best reference), `jungleBoss.ts` (leap/pounce), `earthBosses.ts`, `swampBoss.ts`, `desertBoss.ts`, `tundraBoss.ts`, `volcanicBoss.ts`, `beastBosses.ts`, `wastelandBoss.ts`. |

## Where mob animations hook in

- **Basic attacks**: `spawnAttackEffect` in `client/src/render/combatFx.ts` (~line 2014),
  called from `render/monsters.ts` on `lastAttackAt` changes, keyed by `attackStyle`.
  `server/test/monsterStyleCoverage.test.ts` lists the styles. Earlier traps (see memory
  `project_monster_animation_audit`): monsters used to pass no flags, and grep-based
  counts of the 124 mobs were unreliable.
- **Named mob abilities**: the `monster-cast-start` / `monster-cast-end` handlers in
  `combatFx.ts` (fx ids from the data; unknown ids fall through to `fxPowerShot`).
- **Mob states**: add `auraDefs.ts` rows with `on: 'monster'` (see `rallied`).

## Budget: mobs are many, bosses are few

A boss can afford per-frame followers; a room of 15 mobs cannot:
- Prefer one-shot tweens to `follow` loops.
- Cap afterimage counts.
- Skip off-screen mobs.
- Keep hit-stop to player-relevant hits only.
- Everything must respect `shouldRunClientFx()` and hidden tabs.

## Suggested order

1. Mob basic attacks, one style family at a time (bite, claw, slam, ranged bolt, ...),
   each getting a small wind-up pose and a better payoff.
2. Named mob abilities (they already have fx ids and cast events).
3. Mob states (enrage, packs, elites) as aura rows.
4. Player attacks and abilities, building on the earlier Striker/Lancer attack pass
   (memory `project_attack_animation_pass`).

## Working agreements

- **Tests:** run only the tests related to a change, plus `pnpm typecheck`. The user does
  not want the full suite (~30 min) run by default.
- **Review:** the user reviews in a browser. Rebuild the client with `VITE_DEV_TOOLS=true`
  and restart the port-4100 playtest server (command in the session notes/memory).

## Still open from the boss-lineage session (not part of this pass)

- Art to generate with Codex: `docs/briefs/boss-lineage-art-list-2026-09-27.md`.
- Boss numbers pass (fight lengths) and T4 player damage being too high.
- The bench bots do not wire the new runes (Enemy Shielded / Escaping / Debuff Pile).
- Push and merge `feat/boss-lineage-redesign`: expect conflicts with
  `feat/conduit-early-attrition` in `runeDatabase.ts` and `abilityTargeting.ts`.
- Investigate why the test suite takes ~30 minutes.
