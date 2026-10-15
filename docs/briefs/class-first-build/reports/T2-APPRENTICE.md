# T2-APPRENTICE report
**Agent:** Claude (Sonnet 5.5)   **Branch:** rw/t2-apprentice   **Last commit:** a786d988 (report committed with it)
## Done
Status of every T2 item (bible §9.5, §9.8, §9.16). Before this task only the six T1 payoffs ran; every row below was `missing` except the data.

| Item | Status now | Notes |
|---|---|---|
| Poison: cap +2, fast ticks, small sigils | wired | `capShift`, `tickSpeed`, `sigilDamageMult` kit params (PLACEHOLDER) |
| Poison signature: walking plague (Spread on its own, frees "full") | wired | full carrier passes 1 sigil/s to nearest neighbour; Spread placement no longer claims the moment |
| Poison: dying carrier passes on what it carried, no damage | wired | tracked per tick (`carried`), spent sigils pass nothing |
| Wither (piece) | wired | spend sigils, enemy deals less damage (status + onDamageTaken listener) |
| Fire: burn, hits into a full bar strike harder | wired | listener, `burnHitPct` |
| Fire signature: Chain Detonate | wired | burn thrown on neighbours, any filled goes off, once per chain |
| Fuse (piece) | wired | fuse resource on the target; blows after 3 s with everything laid meanwhile |
| Frost: cap -1, heavy sigils, slow per sigil | wired | |
| Frost signature: Seize freezes; boss that accepts no control turns Brittle | wired | `dot-frozen` + `hasFrozen`; Brittle = shared `brittle` id with `apprenticeBrittle` (+damage listener) |
| Frost: Shatter (Detonate on frozen/brittle) | wired | heavier hit, chills neighbours, ends the freeze |
| Cold Snap (piece) | wired | |
| Blast Back (Detonate sidegrade, charging-at-me) | wired | detonates the charging enemy, zeroes its charge, knockback |
| Sear (shielded target) | wired | burns the barrier at double through `applyEnemyShield`; lands if it breaks |
| Seep (out of reach) | wired | sigils keep ticking doubled while concealed/invulnerable (dot tick loop reads `data.seep`) |
| Snag (flees / kites) | wired, stand-in | roots a full-bar flee/kiter; see Not done (moment) |
| Recoil (debuff lands on you) | wired | caster found from the new status's `sourceId`; lays a full bar |
| Outbreak II / Firstbrand II / Glut II / Brood Sigils II / Petrify II | wired | rank params live in the kit (`ranks[].params`); read with `trophyParamsAt` |
| Petrify rank 1 "held enemy takes more damage" | wired (was missing at T1) | `apprentice-held` status |
| Scent (Jungle trophy) | wired | sigils on a fleeing/kiting enemy never expire while it runs, tick x1.5 |
| Dune Wind (Desert trophy) | wired | Spread and chain may leap to any carrier in the node |
| Stalker's Rod, Second Skin, Patient Hunter | wired | keys `apprentice.flee-tick`, `.second-skin`, `.patient-hunter` (also on the T3/T4 copies of the job) |
| Dune Staff, Sun-Ward, Cool Draught | wired | `apprentice.far-linger`, `attackRange +40` (PLACEHOLDER), `.sun-ward`, `.cool-draught` |

Files: `server/src/systems/classes/archetypes/dot/sigilsT2.ts` (new), edits to `sigils.ts`, `dotPrototype.ts`, `tickDamage.ts`, `constants.ts`; kit params in `shared/src/classKits/apprentice/kit.ts`; gear keys in `shared/src/data/classGear/apprentice.ts`; keys in `shared/src/passives.ts` and `shared/src/data/mechanicLabels.ts`; test `server/test/apprenticeT2.test.ts`.

## Checks
- pnpm typecheck: clean
- pnpm test -- apprentice classKits classGear dot sigil momentsT2 passives mechanicLabels: 21/21 passed (includes `apprenticeT2`, `apprenticeSigils`, `classGear`, `momentsT2`, all kit tests)

## Not done, or unsure
- **Default Payoff rules ignore T2 pieces** (conductor): `shared/src/classKits/configs/apprentice.ts` `T1_DEFAULTS` only places T1 pieces, so an `auto` config never fires Wither/Fuse/Cold Snap/Blast Back/Sear/Seep/Snag/Recoil until a player (or that file) places them. The file is outside my paths. Suggested defaults: charging-at-me -> Blast Back, target-shielded -> Sear, target-out-of-reach -> Seep, target-flees -> Snag, debuff-landed -> Recoil, and each discipline piece on `target-full`.
- **`target-flees` moment is boss-only** (conductor, `moments/`): ordinary fleeing/kiting enemies are not read. Snag, Scent and Stalker's Rod read them locally (`fleesOrKites`: a kiter-behaviour monster with aggro that is moving, or a boss pattern escaping). If the moment gains an ordinary-kiter reading this local check can go.
- Brittle on monsters reuses the shared `brittle` id so `target-frozen` sees it; the plating/DR reduction it normally carries is 0 there (it only adds `damageTakenPct` through my listener).
- Seep applies to any carrier out of reach once a Seep rule is placed, not only the target (no per-target moment gating). Seep II, Snag II, Spread II, Recoil II and everything T3+ are not touched (out of scope).
- Scent/Dune Wind "leap any distance" is limited to monsters in the node; Dune Wind on a chain only reaches enemies already carrying sigils.
- PLACEHOLDERS (all in kit `params` or constants at the top of `sigilsT2.ts`): every discipline number, piece cooldowns, Frost freeze slows (0.95 move / x10 attack cooldown, since freeze is a severe slow on the shared ladder), Dune Staff `attackRange +40`, `far-linger` 0.5 and 220 px "far", gear values (`second-skin` 0.33, `sun-ward` 0.1/each capped 0.5, `cool-draught` 0.03 max HP), Scent x1.5.
- Not browser/bot tested; wiring tests only.

## Files outside the brief I needed (not edited)
- `shared/src/classKits/configs/apprentice.ts` (default placements, see above)
- `server/src/systems/combat/moments/fightSnapshot.ts` (ordinary flee/kite reading for `target-flees`)
