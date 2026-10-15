# CD6-UI, CD7-ROUTE, CD8-CLEANUP: the Conduit's delegate tasks

Three tasks, the Conduit's versions of CS5-UI/CQ5-UI, CS6/CQ6-ROUTE and CS7/CQ7-CLEANUP. **Read the
Striker brief of the same number first** (`CS5-striker-ui.md`, `CS6-striker-route.md`,
`CS7-striker-cleanup.md`) and `CQ-squire-delegates.md`: the rules, the "edit only" shape, the checks
and the report are the same; only what differs is written here. Also read `C-conduit.md` and the
bible §7.2, §7.3, §7.4, §7.13. The conductor's runtime is in (CD.1–CD.5, `be52d9fa`…`8cbe526f`);
`server/test/conduitFormation.test.ts` shows every behaviour you will present.

| Task | Agent | Worktree · branch | Needs |
|---|---|---|---|
| **CD6-UI** | Grok | `../mmo-rw-cd6-ui` · `rw/cd6-ui` | `composeFormationView` (done, `shared/src/classKits/formationView.ts`) |
| **CD7-ROUTE** | Codex or Grok | `../mmo-rw-cd7-route` · `rw/cd7-route` | — |
| **CD8-CLEANUP** | Codex or Grok | `../mmo-rw-cd8-cleanup` · `rw/cd8-cleanup` | CD6 merged is NOT required; it touches server/shared only |

## CD6-UI: the Formation editor, Command pips, the rebuild queue

- **Editor** (`client/src/ui/class/FormationEditor.tsx`, rendered by `ClassSystemEditor` when
  `view.systemKind === 'formation'`, beside the Order and Response editors), from
  `composeFormationView` (`shared/src/classKits/formationView.ts`; copy `useOrderView` /
  `ResponsesEditor` for how a hook feeds it and how an edit goes out through the existing class
  config intent):
  - **Command** as pips (`command.used` of `command.total`).
  - **The roster**, grouped by row (front / middle / back), one card per body (name, role, mode,
    Command cost, text), with a remove button; **the bound summons** below it as cards with an add
    button (`withRoster`). Adding past Command is allowed to be tried: show the validator's reason
    from `problems` as it is.
  - **The four orders** as choice buttons (`withOrders`): attack first, tanks guard, rebuild first,
    and the Recall rule listed read-only with a "never" button that sets `recallWhen: []` and a
    "when my HP is low" button that sets `[{ id: 'hp-low' }]`.
  - **The Soul**: its name and line, or "No Soul yet" text from the view.
- **HUD** for a Conduit (find what renders the summoner mechanic: `client/src/hud/mechanics/
  SummonerMechanic.tsx` and `CompactMechanic.tsx`; the shared view models are in
  `shared/src/systems/summonerHud.ts`): Command pips (used of total), the bodies in the formation
  (alive / fallen), the rebuild queue with the next rebuild's HP cost. Keep what exists where it
  already shows these; add what is missing.
- **Remove the client's shift-click focus and move** (the server ignores them for a Formation
  now): the `commandSummons` intent in `client/src/net/intents.ts`, its input handler and hint
  text. **Keep Recall (R).**
- Icons: pieces use `classPieceIconSource(id)`, Souls `trophyIconSource(id)`. Do not make art.

## CD7-ROUTE: the Conduit's guided tutorial and bot route

- **Tutorial** `shared/src/tutorial/scripts/conduit.ts` registered in
  `TUTORIAL_CLASS_BEATS['summoner-root']`, on the seal route's structure (see `striker.ts`,
  `squire.ts`). Beats (bible §7.4): after the class pick, Command as pips and the four Thralls; the
  roster and the orders on the class screen; Recall on R; the Plains Warden binds at its zone level
  and taunts (around minute 6); one line as each zone's specialist arrives (Thornrunner, Bile
  Spitter, Ridge Marksman, Cave Brute); the first boss gives a Soul, held in the relic slot as a
  free extra body. Keep lines under the script cap (170 characters).
- **Bot route** `bot/src/routes/conduitT1.ts` (`conduit-t1`), like `striker-t1`, with a
  `classConfig` step in `auto` mode (the §7.13 default roster); register it in `ROUTES` and
  `CONTROLLED_ROUTE_IDS`.

## CD8-CLEANUP: delete the Conduit's old frame, range and specialization content

The runtime now builds the formation from the roster. The old inputs are inert for a new
character; a transitional gate keeps them alive for a character still on a frame or range pick.
Delete them and the gate.

- **Gate to remove:** `rosterOf` in `summoner/profile.ts` (the `selectedSubVariant || selectedRange`
  early return) and `ordersOf` in `summoner/formationOrders.ts` (the same line). After this the
  roster is the only path.
- **Delete:** `summoner/frameLoop.ts`, `lineHolds.ts`, `specs/`, `formationTechnique.ts`, the
  Battle Bond direct-attack path, `registerSummonerFrameLoop` and its call, the
  `resolveSummonerProfile` frame / range / specialization / relic-profile branches (keep the
  roster branch and the pieces it uses; `SUMMONER_CORE_TUNING` stays), `SUMMONER_FRAME_TUNING`,
  the specialization tuning and `summonerSpecializationFor` in `shared/src/data/summoner.ts`, the
  summoner relic profile in `shared/src/systems/relics.ts`, and the `summoner.*` passive keys and
  labels nothing else reads. The default damage sponge's percentage path in
  `summoner/damageSponge.ts` goes (keep Big-Hit Intercept). In `command.ts` focus and move go;
  Recall stays.
- **Tests:** delete the ones that pin the dead content (`summonerSpecializations`,
  `summonerSprites`, the frame / range / specialization parts of `summonerOverhaul`,
  `summonerRuneTargeting`, `conduitPathFx`, the Conduit parts of `defensePipeline`, ...: the
  failing suites tell you). **These must stay green:** `conduitFormation.test.ts`,
  `conduitKit.test.ts`, `formationView.test.ts`, `summonDebuffs.test.ts`, `summonerMitigation.test.ts`,
  `minionOocRegen.test.ts`, `abilityConduitTechniqueAdapter.test.ts` (or its Conduit parts if the
  technique adapter goes with the formation technique: say which in the report).
- **Do not touch** `summonPieces.ts`, `souls.ts`, `minionHits.ts`, `formationOrders.ts` beyond
  removing the gate.
