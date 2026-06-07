# v0.2 - 2026-06-06

## Highlights

- Added in-game release announcements so returning players can see update notes after a new production release.
- Retuned late Tier 3 build options: Laser now belongs to the light reload path, Snipe to balanced reload, and Exploding Clip/Cover Fire to heavy reload.
- Improved Mountain Guardian responsiveness by increasing its minion movement speed.
- Prepared the project for a more reliable production release flow, including release snapshots and Railway-oriented deployment updates.

## Changes since origin/master

- Update release flow to advance master (efe96ab)
- Add release tooling and deployment updates (da6c930)
- Update remaining skill tuning (83601d2)

## Technical changelog

- Added release tooling for `develop` -> `release-vX.Y` -> `master`, including package version updates, release metadata, changelog generation, and production fast-forward checks.
- Added release announcement plumbing across server, shared socket protocol, and client HUD.
- Added account `last_login_at` migration and login tracking so release announcements only show to returning players after a release.
- Hardened server startup around DB/log migrations and hitbox cache hydration from baked artifacts or the database.
- Updated release docs, agent release command guidance, Docker/Railway configuration, and package dependencies for the release workflow.

## Validation

- `pnpm typecheck`
