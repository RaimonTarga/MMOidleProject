> **ARCHIVED — handoff completed 2026-08-08.** Live state: [`../conduit-current-state.md`](../conduit-current-state.md).

# Conduit Flavor Pass — Handoff

Written 2026-08-06 for a cold start in a new session. Assumes no memory of the
work. Read this, then `docs/summoner-flavor-pass-plan.md` (the plan and the
record of how decisions were reached) and `docs/conduit-current-state.md` (what
the code does today).

Branch: **`feat/conduit-flavor-pass`**, four commits ahead of `f359112`.

---

## 1. Where things stand

**Shipped and committed (all green: `pnpm typecheck`, 63/63 `pnpm test`):**

| Commit | What |
|---|---|
| `7e40cba` | Every Conduit branch renamed off placeholders |
| `c8e419c` | Dead tier-3 path system deleted; summons got their own body |
| `fa4514a` | Outline, per-range attack FX, lunge gate, DEV skin switcher |
| `e30c035` | Docs: current-state rewritten, visual identity locked |

**Names now in the tree** (display strings only — no id, tuning key, buff id or
icon filename moved, so none of this needed a migration):

- Frames: **Splinter / Consort / Effigy**
- Ranges: **Vigil / Procession / Harrier**
- Tier 4: **Inquisitor, Kilnmaster, Iconoclast** (Splinter) · **Marshal,
  Chorister, Ritualist** (Consort) · **Covenanter, Champion, Idolwright** (Effigy)

**Summon visuals:** one shared body, `sprites/monsters/conduit-summon.png` — a
floating human skull, pure bone, no glow, with a baked 1px `#14181a` outline.
Base display size 28px. Range renders as tint + scale + attack FX, never a body
swap.

**The one thing left in the plan:** per-frame and per-spec summon bodies. Every
formation currently shares one skull and differs only by size and tint.

---

## 2. What just failed, and the real cause

13 per-spec bodies were generated (39 candidates, $0.28). **The user rejected
all 13** — every entry in `art/manifests/conduit-summons.json` is now `regen`.

The user's guess was "img2img with too much strength." **That is not what
happened** — chasing it would waste the next round. Verified from the manifest:
`params` for all 13 were only `outline / shading / detail / view / direction`.
No `initImage`, no `initImageStrength`. No img2img was involved.

### The actual cause: prompt bloat and shared boilerplate

Measured on the shipped entries:

- **86-word prompts, of which ~66 words are byte-identical across all 13.** Only
  a `{shape}` clause varied, and it sat buried mid-sentence rather than leading.
- **78 negative terms, identical across all 13.** Many were still fighting
  round-2/round-3 problems (gore, cloth, beast skull) that stopped being risks
  once "human skull" was established.
- `styleRef: style/creatures.png` at the default `styleStrength` 65, which
  homogenises further.

Net effect: ~75% of every prompt was the same text, so the shared portion
dominated and all 13 collapsed toward one canonical skull.

**This lesson was already written down in the repo and I failed to apply it.**
`art/manifests/players.json`, round 10 note:

> GENERAL RULE FOR THIS CATEGORY: when a player entry drifts off-style, SHORTEN
> the prompt before adding anything to it — accumulated fixes are themselves a
> failure mode.

### A second, independent failure: structural subtraction is refused

Two entries were built entirely on a silhouette break, chosen deliberately
because a missing chunk survives downsampling where surface detail does not:

- **Iconoclast** — "a large piece of the cranium sheared clean away leaving a
  jagged edge" → all three candidates were **intact skulls**.
- **Champion** — "the entire left half sheared away in a clean vertical cut" →
  all three were **intact skulls**.

PixelLab will restyle a skull but will not break one. "Human skull" is a strong
canonical prior and a few words cannot subtract from it. This is the same family
of failure as the mask rounds (see plan §3).

### Third problem: the small entries cannot carry identity at all

Display sizes at the current 28px base:

| Family | Display px | Verdict |
|---|---|---|
| Splinter (Splinter, Inquisitor, Kilnmaster, Iconoclast) | 17–30 | **Indistinguishable in play.** Four near-identical pale blobs. |
| Consort (Consort, Marshal, Chorister, Ritualist) | 28–42 | Usable but read as three skulls, not three ideas |
| Effigy (Effigy, Covenanter ×2, Champion, Idolwright) | 45–92 | The only tier where per-spec art earns its cost |

---

## 3. Recommendations for the retry

In rough priority order.

1. **Cut Splinter-family per-spec art from scope.** Four sprites that are
   indistinguishable at 21–25px buy nothing and cost permanent atlas weight.
   That frame is *defined* by many small fast bodies; per-spec identity there is
   better carried by the channels that already work at that size — range tint,
   count, and the buff bar. This alone drops 13 entries to ~9.

2. **Rewrite the prompts short and differentiator-first.** Target ~25-35 words.
   Lead with the distinctive feature, not the boilerplate. Cut the shared
   negative list to maybe 15 terms that still matter (`person, body, hands,
   ground, shadow, pedestal, front view, cartoon, 3d render, text, watermark`)
   and drop the gore/beast/cloth block that is no longer fighting anything.

3. **Do the structural breaks in code, not in prompts.** Iconoclast's shattered
   cranium and Champion's half-skull should be a deterministic post-process over
   an accepted intact skull — the same shape as
   `art/workbench/outline-summons.mjs`, which already works well. Cheap, exact,
   repeatable, and a model prior cannot refuse it. This is the single highest
   value change and it needs no API spend.

4. **Consider `generationScale: 2`** on the small entries so detail is authored
   at 128px and nearest-neighbour resized down on accept.

5. **If a retry still homogenises**, try per-entry `styleStrength` below the
   default 65, or drop `styleRef` on the entries that need to diverge most.

---

## 4. Cost model (important)

`art:generate --dry-run` **over-estimates by roughly 9×**, consistently, across
four separate batches:

| Batch | Estimated | Actual |
|---|---|---|
| Bake-off round 1 (9 images) | $0.54 | $0.06 |
| Round 2 (9) | $0.54 | $0.06 |
| Round 3 (9) | $0.54 | $0.06 |
| 13 bodies (39) | $2.34 | $0.28 |

Price from `art/pixellab.lock.json`, not the estimate. Real cost is ~$0.007 per
64–96px pixflux image. **Balance after the last run: $1.67.**

Always `--dry-run` first anyway (project rule), and never generate while the
review gallery is open.

---

## 5. Uncommitted right now

```
 M art/pixellab.lock.json              # spend ledger from the 13-body run
?? art/manifests/conduit-summons.json  # the 13 entries, all status=regen
?? art/workbench/summons-sheet.mjs     # contact-sheet generator
?? art/workbench/summons-{splinter,consort,effigy}.png
```

Decide whether to keep the manifest as the base for a rewrite or delete and
re-author. The sheets are a useful record of what the failure looked like.

---

## 6. Gotchas that cost time this session

- **`pnpm art:pack --check` is broken in this environment** — `Command "tsx" not
  found`, though `pnpm --filter @mmo-idle/server exec tsx --version` resolves
  fine and the same script worked earlier. Workaround: run `pnpm art:pack` bare
  against a clean tree and check `git status`.
- **`sprites.json` reports phantom drift.** There is no `.gitattributes`, so a
  CRLF checkout against pack's LF write shows as modified with an empty content
  diff. Not real drift.
- **Accepting a bake-off entry whose `out` is under `files/`** copies it into
  `client/public/assets/` on the next pack. Retire bake-off entries to `draft`
  and delete the `art/src/files/**` copies, as `plains-bakeoff` did.
- **Candidates are consumed on accept** — `art/candidates/<cat>/<id>/` is emptied,
  so compare against the accepted file, not the candidate.
- The repo's Bash tool is Git Bash. **`@'...'@` is PowerShell here-string syntax
  and will put a literal `@` in a commit message.** Use `git commit -F -` with a
  heredoc.

---

## 7. Known gaps unrelated to the art

- **`conduitDefenseShare`** is authored in `SUMMONER_RANGE_TUNING` (0.25/0.5/0.75)
  and exposed on the profile, and the range descriptions promise it — but
  **nothing reads it**. Unimplemented overhaul surface, not dead code.
- **Kilnmaster reads at ~17px** even after the clamp floor was raised to 0.6.
  That spec may need its own size floor rather than art.
- **`summoner-howl-banner` concept icon** is retained only because the gauntlet
  pre-encounter rally aura aliases to it in `conceptIcons.ts`. The `summoner-`
  prefix is now misleading; worth renaming in a future art pass.
- **Two losing round-3 candidates** (`conduit-summon-teal`,
  `conduit-summon-porcelain`) are in the atlas but not in `MONSTER_FRAMES`,
  reachable only via the DEV skin switcher. They are shipped weight until a
  winner is confirmed.

---

## 8. Key files

**Data / contract**
- `shared/src/data/summoner.ts` — all tuning, size multipliers, `SUMMON_ATTACK_STYLE`, clamps
- `shared/src/systems/summonerProfile.ts` — the one resolver turning (frame, range, spec) into runtime values
- `shared/src/sprites/frameMaps.ts` — `MONSTER_FRAMES`, `SUMMON_RANGE_TINT`
- `shared/src/hitbox/constants.ts` — `MINION_BASE_DISPLAY_SIZE` (28; feeds hitboxes, not just sprites)
- `shared/src/data/skillTree/{rootsAndFrames,t3Summoner}.ts` — the names

**Server**
- `server/src/systems/classes/archetypes/summoner/spawn.ts` — `resolveMinionType`, the sprite seam
- `server/src/systems/classes/archetypes/summoner/specs/buffs.ts` — tier-4 buff labels and log names

**Client**
- `client/src/render/minions.ts` — sprite, tint, lunge gate
- `client/src/render/summonSkins.ts` — DEV skin switcher (Shift+[ / Shift+])
- `client/src/fx/conduitSummon.ts` — bolt and beam

**Art tooling**
- `art/workbench/outline-summons.mjs` — outline bake; the model for any future deterministic post-process
- `art/workbench/conduit-summon-raw/` — un-outlined originals the bake reads from
- `art/manifests/conduit-bakeoff.json` — three retired rounds with the mask findings in their notes
