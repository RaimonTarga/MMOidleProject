# ui:shot — browser screenshots and layout audits

Playwright + Chromium, so UI layout defects can be **reproduced and measured**
instead of guessed at. Added 2026-07-26 after a second round of blind CSS
patching on the same bestiary report.

```bash
pnpm ui:shot --html=tools/uishot/harness/bestiary-detail.html --audit
pnpm ui:shot --url=http://localhost:3000 --wait=.sidebar-left --audit
pnpm ui:shot --url=... --viewport=1366x768,1440x900 --font-scale=1.25
```

Screenshots land in `.uishot/` (gitignored). Exits non-zero when the audit finds
a defect, so it can gate a change.

| Flag | Meaning |
|---|---|
| `--url=` | A running app. Needs `pnpm dev:client` (and the server, for real state). |
| `--html=` | A static harness file. No server, no login, no character state. Accepts a `?query`. |
| `--viewport=` | Comma-separated `WxH`. Defaults to the plan's matrix plus the 1100/1101 boundary. |
| `--audit` | Run the layout audit (below). |
| `--wait=` | Wait for a selector before measuring. |
| `--font-scale=` | Sets `--ui-font-scale`, since the UI scales with `zoom`. |
| `--out=` | Screenshot directory, default `.uishot`. |
| `--shot-only` | Screenshots without the audit. |

## The audit

A screenshot shows you that something looks wrong. The audit says which element
and by how much. It reports three states for every element whose content exceeds
its box:

- **CLIPPED** — content is cut off by an ancestor that hides overflow, and the
  element cannot scroll. The content is genuinely unreachable. A real bug.
- **SILENT** — the element scrolls, but reserves no scrollbar gutter and declares
  no thin thumb, so the platform draws an overlay scrollbar that appears only
  once you already know to scroll. The content is reachable but reads as cropped.
  **This is the failure mode behind both bestiary reports**, and it is invisible
  to a screenshot, which is why two rounds of eyeballing missed it.
- **scrolls** — overflows, scrolls, and says so. Working as intended.

## Harnesses

`harness/*.html` load the *real* stylesheets and mirror the real component DOM,
so a pure-CSS layout bug reproduces without a database, a login, or a character
with the right progression. Query parameters vary the content volume — the whole
point is to push past what a normal save contains:

```bash
pnpm ui:shot "--html=tools/uishot/harness/bestiary.html?rows=10&log=14" --audit
pnpm ui:shot "--html=tools/uishot/harness/bestiary-detail.html?rows=10&mechs=5" --audit
```

Each harness copies the `#left-sidebar` shell rules out of `client/index.html`,
because those live in an inline `<style>` rather than a stylesheet. Keep them in
sync, or a harness will happily report a false negative.

Two things a harness cannot tell you: whether the React state that produces the
DOM is correct, and how it behaves with real fonts under `zoom`. For those, point
`--url` at the running app.

## Not part of CI

CI installs the npm package but never the browser binary, and no `*.test.ts`
imports Playwright, so `pnpm test` is unaffected. To use this on a fresh machine:

```bash
pnpm exec playwright install chromium
```
