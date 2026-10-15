# ICONS-3: redraw the three Striker crests and five flat class icons

**Agent:** Codex (image generation) · **Worktree:** `../mmo-rw-icons-3` · **Branch:** `rw/icons-3` ·
**Size:** S (8 icons) · The designer asked for both on 2026-10-15.

**Read first:** `AGENT-RULES.md`; `ICONS-T1.md` and `ICONS-2.md` (this folder: the style rules,
references, workflow and the crest recipe, all unchanged);
`design_docs/visual_and_aesthetics_design/openai-icon-generation.md`.

## Why

Two kinds of icons don't match the new set:
- **The Striker's three discipline crests** (`striker-light`, `striker-balanced`, `striker-heavy`)
  were copied from the old frame crests (a shield on an iron plate). Next to the 15 new
  discipline crests they read as a different series.
- **Five Tier 1 class icons** are old ability icons reused, flatter than the new set:
  `squire-shield-bash` (a yellow bolt), `striker-hamstring` (a flat green arc),
  `apprentice-detonate`, `apprentice-spread`, `squire-slam`.

## Draw

| id | Kind | What it is (bible) | Subject idea |
|---|---|---|---|
| `striker-light` | crest, 96 px | Light: a storm of blades; the finisher lights the next combo | twin light blades in a fan, a spark trail; steel and pale gold |
| `striker-balanced` | crest, 96 px | Balanced: the technique fighter; the edge sharpens through the combo | one blade with a sharpening gleam running up its edge; steel and white-blue |
| `striker-heavy` | crest, 96 px | Heavy: every swing a wind-up for one blow; Momentum spent on the finisher | a great two-handed blade mid-downswing, a gathering weight glow; steel and ember |
| `squire-shield-bash` | piece, 64 px | the enemy winds up: bash it; the stun interrupts the cast | a tower shield rim slamming forward into a broken orange wind-up sigil |
| `squire-slam` | piece, 64 px | at a full bar, slam everything around you with the shield | a shield driven into the ground, a ring shockwave of cracked earth, ember light |
| `striker-hamstring` | piece, 64 px | the target attacks and moves slower for a moment | a low hooked cut across a beast's hock, slowing trails behind it; steel and cold blue |
| `apprentice-detonate` | piece, 64 px | sets off the target's sigils at once | a cluster of violet sigils bursting outward from one point, school-neutral |
| `apprentice-spread` | piece, 64 px | Poison: a full target passes a sigil to its nearest neighbour | a violet poison sigil leaping in an arc from one glowing mote to another, acid green |

Crests follow the crest recipe (`ICONS-2.md`, "Crests"): attach the Striker class crest
(`...\openai-icons\classes\cadence.png`) as the lineage anchor and two of the new crests (e.g.
`disciplines/squire-bulwark.png`, `disciplines/spirit-tide.png` from `art/candidates`) as the
style references, so the three read as siblings of the new 15. Pieces follow the ICONS-T1 piece
rules with four same-class T1 references.

## Where files go

**Overwrite** the shipped files: `client/public/assets/concept-icons/disciplines/striker-*.png`
(96 px) and `client/public/assets/concept-icons/class-pieces/<id>.png` (64 px), through the
preview script as before. If `client/src/ui/conceptIcons.ts` has a cache-busting revision for
these folders by the time you finish, bump it; otherwise leave the code alone. Commit a review
sheet `reports/icons-3-review.png` showing old and new side by side.

## Report

`reports/ICONS-3.md` (AGENT-RULES shape): one line per icon (subject, palette, regenerated?).
