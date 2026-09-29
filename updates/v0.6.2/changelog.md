# v0.6.2 — Guided Tier 1

2026-09-29

A small patch with one addition: an optional guide that plays Tier 1 with you, one step
at a time.

> **Returning characters:** your character carries over unchanged.

## Highlights

- **Guided Tier 1 (optional).** On desktop, characters at Tier 0 or 1 see an offer at
  the top of the right-hand menu. Start it and the guide does the playing: it goes
  through the Clearing, every Tier 1 zone and two boss seals, and all you do is press
  **Next**. A short line explains the reason behind each choice.
- **You see every click.** A gold ring moves over the buttons the guide presses, so you
  learn where things are: crafting, equipping, upgrading, learning abilities and
  setting up Runes, one step at a time.

## The guide

- It follows the class you pick, with a route for all six classes. It masters every
  Tier 1 zone before taking the Plains and Mountain seals, and says goodbye when you
  reach Tier 2.
- Long fights show a progress bar. When one finishes, Next lights up and a soft sound
  plays; the guide never moves on without you.
- **Stop** asks first, then tucks the guide into a small **Guide** tab. Reopen it any time
  and it picks up where your character is, even after you played on your own, reloaded
  or reconnected.
- If you start it partway through Tier 1, it will swap your gear, abilities and Runes to
  its plan (you are told before you start). Nothing is ever destroyed.
- If you fall, press Next to get back up, and the guide carries on.

## Other changes

- Conduit: summons told to Step Back now hold outside a slam until it lands.

## Technical changelog

- No migrations and no save-shape changes; saves are kept. Tutorial opt-in is stored in
  the browser per character; progress is derived from game state, never saved.
- New `shared/src/tutorial` (scripts, conditions, resume logic) and `client/src/tutorial`
  (guide, panel, highlight). Two client intents added: `setAuto` and `moveTo`.
- Each class's script is also a bot route (`tutorial-<class>-t1`). Six-class bot runs at
  25x rewards: five reached Tier 2; Squire stalled on the Plains boss (fight stuck at 1-3%
  boss HP for 12 minutes, twice), still under investigation.
- Bot harness fix: routes that attune an ability no longer fail the build-drift check
  (a regression since the 2026-09-25 ability-wiring change).
- Found, not changed here: the default Rune loadout places Flee below Chase in the same
  lane, so it cannot fire mid-fight; the guide's Runes place it above. Unlock badges are
  stored per connection rather than per character.
- Design and results: `docs/guided-tutorial-plan.md`.

## Validation

- `pnpm typecheck`, full `pnpm test` (325/325), `pnpm build` and `git diff --check`.
  Publishing logic unchanged, so `scripts/release.test.mjs` was not rerun.
- The guide was played in a real browser on the dev server, pressing only Next, through
  the Clearing and the Plains (crafting, equipping, upgrades, Sweep, Runes, travel) and a
  Plains boss fight; opt-out, reload and server restart all resume correctly.
- Not yet checked on the live server.
