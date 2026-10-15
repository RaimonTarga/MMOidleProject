# AP5-UI, AP6-ROUTE, AP7-CLEANUP: the Apprentice's delegate tasks

The Apprentice's versions of CS5-UI/SP5-UI, CS6/SP6-ROUTE and CS7/SP7-CLEANUP. **Read the Striker brief
of the same number first** (`CS5-striker-ui.md`, `CS6-striker-route.md`, `CS7-striker-cleanup.md`)
and `SP-spirit-delegates.md`: the rules, the "edit only" shape, the checks and the report are the
same; only what differs is written here. Also read bible §9.2–§9.4, §9.13. The conductor's runtime is
in; `server/test/apprenticeSigils.test.ts` shows every behaviour you will present.

| Task | Agent | Worktree · branch | Needs |
|---|---|---|---|
| **AP5-UI** | Grok | `../mmo-rw-ap5-ui` · `rw/ap5-ui` | `composePayoffsView` (done, `shared/src/classKits/payoffsView.ts`) |
| **AP6-ROUTE** | Codex or Grok | `../mmo-rw-ap6-route` · `rw/ap6-route` | — |
| **AP7-CLEANUP** | Codex or Grok | `../mmo-rw-ap7-cleanup` · `rw/ap7-cleanup` | server/shared only |

## AP5-UI: the Payoff rules editor and the sigil ring

- **Editor** (`client/src/ui/class/PayoffsEditor.tsx`, rendered by `ClassSystemEditor` when
  `view.systemKind === 'payoffs'`, beside the Order, Response, Formation, Loadout and Thresholds
  editors), from `composePayoffsView` (copy `ResponsesEditor` for the hook and the way an edit goes
  out through the existing class config intent). The bible's picture is **an enemy card with its
  sigil ring and the moments around it**:
  - the card: an enemy silhouette with a ring of `sigils.cap` pips (violet: raw magic at T1);
  - each moment (`moments[]`, with its `text`) as a slot around the card, holding its placements in
    priority order: the payoff chip (name, family colour: poison / fire / frost), its conditions in
    words, a remove button (`withoutPlacement(config, placement.index)`), and an "only when ..."
    condition control (read-only listing is fine; one preset toggle "only with three or more
    enemies near" via `withPlacementConditions` is nice);
  - **the payoffs you know** below as cards (`available`: name, family, text) with an "add to a
    moment" action (`withPlacement(config, moment, pieceId)`); a moment shows on the card only once
    you own a lesson that uses it (the view already does this);
  - **Sigils** as the class budget ("Sigils 6"), the relic's name and line (`relic`), and `problems`
    as they are.
- **HUD: the sigil ring at the enemy's feet**: find where the target frame shows the class DoT stacks
  (`PlayerView`'s `targetDotStacks` / `dotTickPct`, `client/src/hud/` target frame and the world
  render of monster statuses) and draw the sigils as pips in a ring under the enemy, coloured violet,
  the ring sized by the cap. **Callouts** only for the trophy's payoff (by name) and a chain of three
  or more: skip them if the client cannot tell (say so in the report). Plain ticks and spreads never
  call out.
- Icons: payoffs are class pieces (`classPieceIconSource(id)`), trophies `trophyIconSource(id)`. Do
  not make art.

## AP6-ROUTE: the Apprentice's guided tutorial and bot route

- **Tutorial** `shared/src/tutorial/scripts/apprentice.ts` registered in
  `TUTORIAL_CLASS_BEATS['dot-root']`, on the seal route's structure (see `striker.ts`, `squire.ts`).
  Beats (bible §9.4): after the class pick, the plain wand, Sigils 4 as pips on enemies, and one
  moment filled (full → Detonate); the Plains teaches Spread around minute 6 with its default (full
  and two or more enemies near → Spread, otherwise Detonate); one line as each zone teaches its
  payoff (Numb, Siphon, Seize, Converge); the first boss is won with the base kit and gives
  Outbreak. Keep lines under 170 characters.
- **Bot route** `bot/src/routes/apprenticeT1.ts` (`apprentice-t1`), like `striker-t1`, with a
  `classConfig` step in `auto` mode (the §9.13 default); register it in `ROUTES` and
  `CONTROLLED_ROUTE_IDS`.

## AP7-CLEANUP: delete the Apprentice's old frame, range and T3 content

The sigil runtime is in (`server/src/systems/classes/archetypes/dot/sigils.ts`). The old DoT machinery
is inert for a character with Payoff rules (`dotPrototype`'s hit listener and `applyClassDotStack`
hand over to it). Delete it.

- **Delete:** `dot/frameLoop.ts` and `dot/t3/` (Pyromancer's Radiant, Permafrost, Frost paths,
  Eternal Doom, Plague, Conflagration...), their buffs and `dot.*` passive keys and labels nothing
  else reads, `shared/src/systems/dotClassProfile.ts`'s frame profiles (`DOT_SUBVARIANT_META`,
  `POISON/FIRE/FROST_DOT_PROFILE`, `resolveDotClassProfile`, `computeDotClassDamagePerStack`,
  `resolveDotStackCap`) and the relic delivery profile (`resolveDotRelicDeliveryProfile`) with their
  callers, `computeScaledDotDamage`'s front-loaded curve (keep the linear tick the sigils use: make
  sigils the only class DoT, drop the `data.sigil` flag if everything is a sigil), the
  `AppliesDots` fields only they used, status ids only they wrote (the status audits tell you), and the
  tests that pin them.
- **Keep:** `dot/sigils.ts`, `dot/index.ts`, `dotPrototype.ts`'s tick loop and the monster-to-player
  DoT listener (monsters' poison on players still ticks there), `tickDamage.ts`'s mitigation rule (no
  plating, half DR, the monster's DoT resistance; inline or move the Smolder / Frozen / Frostbite
  multipliers away from `t3/core/selectors`: delete them if nothing else uses them), `DOT_EFFECT_ID`.
- **These must stay green:** `apprenticeSigils.test.ts`, `apprenticeKit.test.ts`, `payoffsView.test.ts`,
  `statusRegistry.test.ts`, `classAffinity.test.ts`, `abilitySweepAdapters.test.ts` (or delete its
  Apprentice parts if the Sweep adapter goes: say which). If a test pins a deleted behaviour, delete
  it and say so in the report.
