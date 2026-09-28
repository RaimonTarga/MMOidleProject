# Release v0.6 record (2026-09-28)

Operational companion to the player notes in [`updates/v0.6/changelog.md`](../../updates/v0.6/changelog.md).
Scope: everything on `develop` since v0.5 patch 3 (`2628c020`), 88+ commits.

## Decisions

- **Version v0.6**, not v0.5 patch 4 or v0.5.1. The release tooling handles X.Y only, and the
  scope (boss lineage redesign, audio, animation pass, T2–T4 numbers) is a new version. The
  v0.5 notes stay as they were.
- **Notes pages:** the notes window now pages through every release (`client/src/hud/releaseNotes.ts`).
- **Saves carry over.** No game-DB or log-DB migration in this release. Save-compat on load:
  `LEGACY_ITEM_IDS` maps `thorn-needle` → `gale-needle`; the admin validator tolerates the
  legacy `ultimate:void-overlord` clear token.
- **Void Overlord deleted** (designer's call; no node hosted it since the sparse map). Its
  `worldStateRepo` DB table stays in place, unused.
- Conduit remains enabled; no environment changes.

## Merged into develop for this release

| Branch | What |
|---|---|
| `feat/conduit-early-attrition` | Area share, OOC rebuild, Step Back for summons, recall (2 s hold, 2× speed, defend in place), Recall Summons rune |
| `codex/tileset-corner-repairs` | Trench/Wasteland tile seams |
| `feat/boss-lineage-redesign` | All 11 lineages, phases, weather, boss animation pass |
| `codex/audio-integration` | Music and SFX (+ follow-ups: phase thresholds, altar-driven suite, prompt end, Ogg SFX with WAV masters in `art/audio/sfx-masters/`, SFX streaming) |
| `fix/stabilize-loose-ends` | Conduit manual abilities, dead defense code removed, two T4 Mountain nav fixes |
| `feat/premium-mob-animations` | Mob pass, player attack progression, bespoke T3 spec attacks |
| `balance/t4-power-curve` | T2 bosses ~60 s, T3/T4 bosses ~2/~3 min, T4 outlier trims, Spirit floor, Conduit Effigy, Void Overlord deletion |

Integration fixes made during the merges: combatFx sound routing (no doubled cues), the
flaky boss-lineage harness (seeded `Math.random`), dead Void animations removed, three
sandboxed render tests given the new animation helpers, `shadows.json` rebaked.

## Bandwidth

- SFX: 10.2 MB WAV preloaded → 1.2 MB Ogg total, ~0.2 MB preloaded; the rest streams on
  first play. Music already streamed per zone / boss suite.
- Static assets keep the content-ETag + 1 h cache policy (`server/src/net/staticAssets.ts`).

## Validation

See the release conversation of 2026-09-28 for the exact run. Gates on the candidate:
`pnpm typecheck`, full `pnpm test`, `pnpm build`, `git diff --check`.

Not verified by a human before release:
- The new T2–T4 boss numbers (bot-measured only; see `reports/t4-power-curve-2026-09-27/REVIEW.md`).
- The Ogg SFX and the boss music transitions in a real browser session (engine-level checks only).
- The notes pager (typechecked; not visually checked).

## Deployment check

`/healthz` reports no git revision. Confirm a deploy by (1) the `process.tick` counter
dropping (it was ~2.01 M before the push) and (2) the live client serving the v0.6 notes
heading "v0.6 — Every boss, rebuilt".
