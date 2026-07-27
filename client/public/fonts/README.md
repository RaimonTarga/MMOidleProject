# Bundled display face

Wave 3 §15 gives panel and dialog *titles* an engraved serif. Body text,
numerals, and 9px micro-labels deliberately keep the existing sans/mono, because
display faces stop being readable at those sizes.

| File | Family | Weight | Bytes |
|---|---|---|---|
| `cinzel-600.woff2` | Cinzel | 600 | 14776 |

Latin subset from `@fontsource/cinzel` 5.2.5, licensed under the SIL Open Font
License 1.1 (`OFL.txt`).

Chosen on 2026-07-26 after comparing it in-game against Alegreya SC and
Marcellus, which were bundled for the comparison and then removed. If the face is
ever reconsidered, the whole switch is the `--hud-font-display` /
`--hud-font-display-weight` pair at the top of
`client/src/hud/primitives/tokens.css`, plus the `@font-face` block in
`displayFont.css` beside it.
