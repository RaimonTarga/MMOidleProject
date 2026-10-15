# T4W2-SLINGER report
**Agent:** Claude (Sonnet)   **Branch:** rw/t4w2-slinger   **Last commit:** see `git log -1` (the report is committed on top of the code)

## Done
- **Status entry owed: `debuff-immune`** (Pressure Suit). Buff-bar tile (`reload/slingerBuffs.ts` descriptor, id added to `BUFF_IDS`), help, badge, icon alias (`squire-guard`, a stand-in; the designer swaps). `statusRegistry` no longer lists it (wiring assertion added to `slingerT4.test.ts`). No art made.
- **Visible T4 state.** Loadout editor: a leaf card under the specialization card (name, kit text, one tip line; or "pick a leaf in the Passive Tree" at tier 4+ with none picked). The leaf is read from `unlockedSkillsAtom` against the kit's leaves for the picked discipline. The other T4 state (Thermite, Hallowed, Exploit clips, Toll and Harpoon rounds, Shellbreaker II etc.) shows through the existing clip cards and rack, which read the kit.
- **Leaf pick through the Passive Tree.** `classFirst.ts` builds the nine leaves as tree nodes (tier 3, parent = discipline, `disciplineId` set); the route test confirms each exists in `SKILL_TREE`. Read, not changed; the panel was not opened.
- **Tutorial T4 stretch** (`shared/src/tutorial/scripts/slinger.ts`): after the T3 stretch, per T4 zone three beats (`t4:<zone>`, `slinger:<lesson>`, `boss:<zone>:4`): Mountain (Shellbreaker II, Quake IV; the leaf pick line rides `t4:mountain`), Tundra (Frost II, Rime II), Jungle (Tracer III, Hunter's III), Desert (Hollow-point II, Bounty III), Volcanic (Thermite, Cinder II), Wasteland (biome id `graveyard`; Hallowed, Toll Round), Trench (Exploit, Harpoon Round). Reuses `zoneBeats(zones, tier)`; existing step and condition types only. `tutorial.test.ts` extended (tail ids, trophy names, gates equal the tier-4 caps).
- **Bot route `slinger-t4`** (`bot/src/routes/slingerT4.ts`, registered in `routes/index.ts`, not in `CONTROLLED_ROUTE_IDS`, test `slingerT4.test.ts`): the whole T3 route, then `unlockSkill` of the leaf (route choice `slinger-leaf`, default `light-hands`), then the seven T4 zones: travel, farm to the tier-4 cap (pinned equal to the tutorial's), `attemptBoss` tier 4. Milestones `t4-<zone>-lesson|level-N|boss`. For another discipline pass all three choices, e.g. `--choices '{"slinger-discipline":"siege","slinger-specialization":"deathmark","slinger-leaf":"bunker"}'`.

## Checks
- pnpm typecheck: clean (0 errors)
- pnpm test -- slinger tutorial statusRegistry loadout: 13/14 passed; the one failure is `statusRegistry`, now only on Conduit ids (`conduit-ice-shell/withdraw/last-stand/fall-back/seal`), which are the Conduit task's. No Slinger id is in the gap list. Includes `slingerT4` (server and bot route), `slingerT3`, `tutorial`.
- `git diff --numstat`: no whole-file line-ending changes.

## Not done, or unsure
- No browser or bot run; the leaf card and the route are untested live. Tip lines in the editor are my own short text (no numbers); the designer may reword.
- The default leaf only matches the default discipline; a different discipline needs all three choices passed, or the server refuses the unlock.
- Quick Swap lets `ammo` exceed `ammoMax` for one clip; the ammo ring and HUD were not checked for it.
- No beats for the T4 gear jobs (Reaper's Repeater, Hallowed Ground, Vigil, Pressure Rifle, Pressure Suit, Ballast), only leaf, lessons and trophies. Farewell panel text is still stale (conductor).
- Still owed from Task 1 (conductor, outside my paths): Steady Nerve's knockback hook in `knockback.ts`; Harpoon/Tether outright block of dive/burrow in `bossPatterns.ts`.

## Files outside the brief I needed (edited)
- `shared/src/components/combat/buffs.ts` (one `BUFF_IDS` line), `client/src/hud/statusHelp.ts`, `client/src/hud/targetStatusMeta.ts`, `client/src/ui/conceptIcons.ts` (one line each), `shared/src/tutorial/tutorial.test.ts`, `server/test/slingerT4.test.ts` (one assertion).
