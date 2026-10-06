# Combat readout run — brief (2026-10-06, parallel to the ability pass)

Damage numbers, the crit look, overhead health bars, the target frame's chrome, the
player's vitals and a boss frame have not been redesigned since the prototype. This run
gives them one grammar. **Opus, one session**, in `../mmo-lineages`: `pwd` and `git
status` first (clean; it sits on the parked `feat/boss-reach`, which stays as a ref), then
`git checkout -b feat/combat-readout develop` (develop at or after `e56d530e`). Never
`pnpm install`, never push, never merge (the designer merges), strip CR on touched files
only, never kill a process by image name. The ability pass runs at the same time in
`../mmo-lin-w2c` and the `w1*`/`w2a`/`w2b` worktrees on `feat/ability-pass`: stay out of
every file it owns (below).

**Authority:** design §24.1 (perceptibility is a shape rule: the payoff reads with the
sound off, a magnitude is a whole swing, not a few percent), §26.4 (the fight HUD is
nearly empty, one channel per fact, panels may be dense and the HUD may not; the skin is
a LATER track — this run builds structure and tokens, never ornament),
docs/combat-animation-current-state.md (the premium grammar: readable wind-up, visible
payoff, lasting mark), docs/briefs/ui-prototypes-report-2026-10-04.md ("What no thesis
solved": the phone camera floor, memory, a ready verb that cannot fire),
docs/future-plans.md "Kill chain boss quarters" (needs the boss bar to show quarters).

**Today, so the run knows what it replaces:**
- Numbers: `client/src/render/combatText.ts` turns every `damage` event into one floater;
  `damageNumberStyle.ts` colours by element, gold-and-larger for `empowered` (crit styling
  only; `mechanicConsumed` is the server's "mechanic spent its charge" flag and is a
  different fact), blue with a glyph for shield absorbs; DoT ticks are the same floaters
  smaller; the floating WORD for a lineage verb is `fx/cardWord.ts` and stays as it is.
- Overhead bars: `client/src/render/healthBars.ts`, one 32 px Graphics per body, green /
  amber / red by thirds, one absorb band for barrier and wards, no damage chip, no name,
  the same bar on a boss as on a rat.
- The target frame: `client/src/hud/TargetFrame.tsx` + `targetFrame.css`, reworked by the
  legibility run for the three fixed homes (owes / slowed / held, `targetHomes.ts`) and a
  phase tile on bosses. The TILES are done; the chrome around them is the prototype's.
- There is NO boss frame: a boss's health is its overhead bar and the target frame's tiles.
- Player vitals: the HP bar in `hud.css` / `MobileHUD.tsx`, with the verb ring beside it
  since §26.4 (`RhythmReadout.tsx`, NOT yours).

## The grammar to build (one system, not five fixes)

1. **Numbers say share, not digits.** A floater's size is set by the hit's share of the
   target's max HP (bands: chip / hit / heavy / whole-swing), its colour by kind (direct,
   element, shield, DoT), its motion by kind (a hit pops and drifts, a DoT tick rises
   small and steady, a heal floats inward). Digits stay, but a player reads the size first.
   DoT ticks on one target coalesce per second into one number. Floaters never overlap
   unreadably: a per-target lane stack with a cap, oldest dropped. Incoming damage on the
   player uses the same bands against the player's pool, in the damage-taken colour.
2. **The crit look is one look.** An empowered hit (the class mechanic's hit, a lineage
   verb's doubled or echoed hit that the server marks `empowered`) draws the gold, larger,
   with a short flash on the body; nothing else is gold. Elemental crits keep the element
   colour with the crit size. The verb's name stays the floating word's job. Define the
   bands and colours as tokens in one module (`damageNumberConstants.ts` grows into it) so
   the skin track can restyle without touching logic.
3. **Health bars read the fight.** Overhead bars: width by body size class (small / medium
   / large / boss), a damage CHIP that lags the fill and drains (the last hit is visible
   for a beat), the absorb band kept, colour by thirds kept but tokenised, a thin segment
   every 25% on elites and bosses only. Minions and summons: a slimmer bar. Bars never
   draw text. Depth and y-sort rules unchanged.
4. **A boss frame.** A HUD-level frame for the current boss (the target frame's boss
   branch grows into it, or a sibling `BossFrame.tsx`, your call, one component): name,
   the phase tile first (as today), a wide HP bar with **quarter markers** (the Kill chain
   prerequisite from future-plans; mark them as the quarters the boss has LOST so the
   fourth firing is readable before it happens), the absorb band, a slim cast/telegraph
   progress line driven by the boss pattern presentation state the server already
   publishes (`server/src/systems/combat/engine/monsterStateMirror.ts`, see the animation
   doc "Presentation state the server publishes"), and the damage chip. Desktop: top centre, under nothing. Phone: the
   top bar's row under the vitals, same height as the ring row. It appears when a boss is
   the target or has aggro on the player, lingers like the target frame, and never
   overlaps the rhythm ring.
5. **The target frame's chrome.** Keep the three homes and the tiles exactly; restyle the
   frame: portrait slot (the monster's sprite frame, no new art), name and tier, a proper
   HP bar with the number and the chip, elite/boss marks, the phase tile where it is.
6. **Player vitals.** The HP bar gets the chip and the absorb band drawn the same way as
   the others (one bar module, three uses), the number inside, low-health treatment at a
   quarter (a tokenised edge glow, not a screen flash). The ring beside it is not moved.
7. **Phone.** At 390 wide everything above reads; the camera floor is NOT changed by this
   run (design open item) — if a number is unreadable at the floor, scale the floater's
   screen size, not the world, and say so in the report.

Rules: no per-tick booleans on networked slices (everything is driven by events the
server already pushes and by view deltas); no new socket events; `shouldRunClientFx()`
and the hidden-tab rules hold; `prefers-reduced-motion` respected; every colour and size
from the tokens module; no flavour text; no ornament, frames, gems or light passes.

## Order

1. **Wave 0, a mockup first (half a day).** `reports/combat-readout/mockup.html`: one
   HTML page, three scenes (a T1 fight on a rat, a Behemoth fight, a Slinger vs a swarm),
   desktop and 390 wide, built from the REAL event shapes (take a `combat-playback`
   capture or synthesise events through `prepareCombatText`'s input shape) showing the
   number bands, the crit, the chip, the overhead bars by size class, the boss frame with
   quarters, the target frame chrome and the vitals. Two variants of the number language
   (size-by-share versus digit-weight-by-share) side by side; pick one as the reviewer and
   say why. Commit the page before building anything.
2. **Build**, one commit per numbered item above, in order 1 → 7. Tests: pure functions
   only, no balance: band selection by share, coalescing, the lane stack's cap, the chip's
   decay, quarter markers from (hp, maxHp), the boss frame's model from the view, the
   tokens module's shape. Extend `client`-side model tests where the legibility run put
   them (`server/test/rhythmReadoutModel.test.ts` is the pattern).
3. **Verify in the real client**: screenshots per item at desktop 1440×900 and 390×844
   with `tools/uishot` (the legibility run's `reports/legibility/screens/` are the
   pattern), and one capture of a live Behemoth fight through the spectator route: a
   production client build with `VITE_DEV_TOOLS=true`, a server on its own port (43xx)
   with `NODE_ENV=production DEV_TOOLS=true` and explicit DB/Redis/admin env, a
   socket-driven guest that creates a character, `debug:prepareFastBossRetry
   {includeGuardians:false}`, `player:activateDungeonAltar` near the node centre, then a
   browser at `/?watch=<socket.id>` clipped to the canvas (unequip the weapon so the
   phase-tester kit does not end the fight in seconds; the guest auth is rate-limited per
   IP, cache the token). Never use :4000. All of it in
   `reports/combat-readout/screens/`. Zero console errors.
4. Full suite + `pnpm typecheck`. Report
   `docs/briefs/combat-readout-report-2026-10-06.md`: the grammar as built, the tokens,
   before/after screenshots per item, what could not be verified, open calls (the camera
   floor, the quarters' exact look, anything provisional). Leave the branch unmerged; fold
   the living truth into `docs/combat-animation-current-state.md` (a new "Readouts"
   section) and `docs/README.md`.

## Files this run owns (and only these)

`client/src/render/{combatText,damageNumberStyle,damageNumberConstants,healthBars,
combatPlayback}.ts`, the damage-number drawing in `client/src/fx/particles.ts` (that
function only), `client/src/hud/{TargetFrame.tsx,targetFrame.css}` chrome (not
`targetHomes.ts`, not the tile semantics), a new `client/src/hud/BossFrame.tsx` + css, the
vitals block of `hud.css` and `MobileHUD.tsx`, a new tokens module, their tests, the
reports folder and the two docs.

## Files the ability pass owns — do not touch

`client/src/fx/**` except the one particles function (keystone animations, W2-D),
`client/src/hud/{BuffBar,buffTransitions,statusHelp,statusTooltips,targetStatusMeta,
RhythmReadout,rhythmReadoutModel}.*`, `client/src/ui/**`, `shared/**`, `server/**`,
`bot/**`, the tutorial. If the readout needs a field the view does not carry, write the
need in the report; do not add it.

## Not in scope

The Ornate skin and any ornament (design §26.4's later track: this run leaves tokens for
it). The rhythm ring. Card fx and the floating word. The camera floor. Monster or boss
numbers. Sound.
