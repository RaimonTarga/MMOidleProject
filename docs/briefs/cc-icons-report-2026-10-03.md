# W1-E icon candidates — 2026-10-03

**Status: APPROVED AND PACKED, INCLUDING THE NINE ESSENCE-STYLE SHARD REPLACEMENTS.**
The designer approved the original 26 icons and then all nine essence-style shard
replacements in the gallery on 2026-10-03. The current sources contain the second shard
set, the original ten buff tiles, and the original seven payload glyphs.
Worktree: `../mmo-lin-w2b`. Branch: `feat/cc-icons-art`, based on `develop` at
`f238d9e8a279a23bce49764afc193bb2c711f44b`. Scope: W1-E only.

## Candidate set

Nine material fragments follow design §24.2's physical shard names and the exact lane
colours in `shared/src/data/lineages/packets.ts`. They use the item-icon language:
literal object plus a simple mechanic cue, bold pixel clusters and fractured material
silhouettes. They use no relic plaque treatment. Source derivatives are 32×32, with
24×24 previews for the designer to judge readability.

Ten buff tiles match the existing 48×48 square format and padding, with broad
mechanic silhouettes and opaque charcoal backdrops. Seven payload glyphs are 32×32,
transparent, and neutral ivory so a §24.6 ring can carry the moment's lane colour
independently of the lean's payload.

Generated with the built-in OpenAI `image_gen` tool: one call per distinct asset,
26 calls total, one candidate each, no rerolls. Full prompts are in
`art/manifests/cc-icons.json`; each candidate's receipt records the prompt, original
filename, source hash, derivative hash, dimensions, and preprocessing.
No PixelLab API generation was invoked and its spend ledger was not changed.
The manifest's `pixflux` endpoint is a compatibility value for the existing gallery
schema; use the staged OpenAI candidates rather than `art:generate` for this set.

## Gallery and durable handoff

Local gallery: http://localhost:4114 — select category `cc-icons`.
All 26 original entries are `accepted`. The durable archive preserves each approved bitmap.
The `cc-shards-essence` category also has nine accepted entries, now current shard art.

- Original gallery copies used `art/candidates/cc-icons/<id>/candidate-1.png` (ignored);
  those entries are now complete in the gallery.
- Local full-resolution originals: `art/candidates/cc-icons/<id>/originals/source.png`
  (1254×1254, ignored by Git).
- Durable reduced candidate archive: `art/concepts/cc-icons-2026-10-03/candidates/<id>.png`.
- Receipts: `art/concepts/cc-icons-2026-10-03/receipts/<id>.json`.
- Review sheet: `art/concepts/cc-icons-2026-10-03/review-sheet.png`. Each row shows
  actual 24px, stored size, and a nearest-neighbor enlargement. Visual acceptance
  and 24px readability remain the designer's decision.

After merging this branch into another checkout, recreate its ignored gallery copies:

```powershell
node art/concepts/cc-icons-2026-10-03/stage-gallery.cjs
pnpm art:review --port=4114
```

The staging helper checks archived hashes, preserves different existing local candidates,
skips accepted entries, and never changes manifest status or writes to `art/src`.

## Target paths

In every table below, the candidate ID identifies its archive file and gallery entry.
All 26 source targets contain designer-approved art. The nine essence-style replacements
use the same shard paths; the original shard candidates remain in their durable archive.

### Shards

All nine pack into `client/public/assets/icons.png` and `icons.json`.
The frame name is the source path relative to `art/src/`.

| Candidate | Lane | Lane colour | Target source / atlas frame |
| --- | --- | --- | --- |
| gale-shard | tempo | `#7fe3ff` | `art/src/items/materials/gale-shard.png` / `items/materials/gale-shard.png` |
| anvil-shard | empowered | `#ffb347` | `art/src/items/materials/anvil-shard.png` / `items/materials/anvil-shard.png` |
| venom-shard | affliction | `#9be564` | `art/src/items/materials/venom-shard.png` / `items/materials/venom-shard.png` |
| shackle-shard | control | `#8fb8ff` | `art/src/items/materials/shackle-shard.png` / `items/materials/shackle-shard.png` |
| bone-shard | kill-chain | `#c58fff` | `art/src/items/materials/bone-shard.png` / `items/materials/bone-shard.png` |
| spark-shard | engagement | `#ff9f9f` | `art/src/items/materials/spark-shard.png` / `items/materials/spark-shard.png` |
| sigil-shard | technique | `#ff7fd4` | `art/src/items/materials/sigil-shard.png` / `items/materials/sigil-shard.png` |
| iron-shard | bulwark | `#b8b8a0` | `art/src/items/materials/iron-shard.png` / `items/materials/iron-shard.png` |
| glass-shard | barrier-tempo | `#7fd8c8` | `art/src/items/materials/glass-shard.png` / `items/materials/glass-shard.png` |

### Approved essence-style shard replacements

The designer requested a second shard set matching the existing essence icons, and
selected **a shared crystal shape with distinct symbols**. References are the five
32px icons under `art/src/UI_icons/essences/`. Gale was generated from the existing
blue essence; each later shard used Gale's generated crystal geometry plus an existing
essence reference. These were also generated with Codex's built-in OpenAI image tool,
one call per shard, nine calls total, no rerolls. They were not generated by PixelLab.

All nine are 32×32 transparent PNGs, directly reduced with nearest-neighbor sampling.
The comparison sheet places the five existing essences, the approved fragments, and
the new variants together, with 3× enlargements and actual 16px, 24px and 32px previews.
Visual matching and readability are reserved for the designer's review.

| Approved candidate | Embedded symbol | Target source / atlas frame |
| --- | --- | --- |
| gale-shard-essence-v2 | curved gust | `art/src/items/materials/gale-shard.png` / `items/materials/gale-shard.png` |
| anvil-shard-essence-v2 | broad anvil impact | `art/src/items/materials/anvil-shard.png` / `items/materials/anvil-shard.png` |
| venom-shard-essence-v2 | poison droplet | `art/src/items/materials/venom-shard.png` / `items/materials/venom-shard.png` |
| shackle-shard-essence-v2 | open restraint | `art/src/items/materials/shackle-shard.png` / `items/materials/shackle-shard.png` |
| bone-shard-essence-v2 | diagonal bone | `art/src/items/materials/bone-shard.png` / `items/materials/bone-shard.png` |
| spark-shard-essence-v2 | four-point spark | `art/src/items/materials/spark-shard.png` / `items/materials/spark-shard.png` |
| sigil-shard-essence-v2 | hooked angular slashes | `art/src/items/materials/sigil-shard.png` / `items/materials/sigil-shard.png` |
| iron-shard-essence-v2 | overlapping scales | `art/src/items/materials/iron-shard.png` / `items/materials/iron-shard.png` |
| glass-shard-essence-v2 | diagonal fault | `art/src/items/materials/glass-shard.png` / `items/materials/glass-shard.png` |

- Manifest: `art/manifests/cc-shards-essence.json` (contains the exact generation prompts).
- Durable candidates, receipts and comparison sheet:
  `art/concepts/cc-shards-essence-2026-10-03/`.
- Gallery: category `cc-shards-essence`, nine accepted entries. Its current art is the
  selected shared crystal set.
- Local full-resolution originals:
  `art/candidates/cc-shards-essence/<id>/originals/source.png` (ignored).

The staging helper remains available if a candidate is reopened for review:

```powershell
node art/concepts/cc-shards-essence-2026-10-03/stage-gallery.cjs
pnpm art:review --port=4114
```

The staging helper verifies receipt hashes without altering source art or review
status. All nine replacements were accepted by the designer, then packed.
The material-tab TypeScript lookup is unchanged under W1-E's scope restriction;
its consumer can use the shard atlas frames in the table above.

### Buff tiles

| Candidate | Target source | Target runtime PNG |
| --- | --- | --- |
| lineage-damage | `art/src/files/concept-icons/statuses/buffs/lineage-damage.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-damage.png` |
| lineage-speed | `art/src/files/concept-icons/statuses/buffs/lineage-speed.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-speed.png` |
| lineage-recovery | `art/src/files/concept-icons/statuses/buffs/lineage-recovery.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-recovery.png` |
| lineage-guard | `art/src/files/concept-icons/statuses/buffs/lineage-guard.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-guard.png` |
| lineage-ward | `art/src/files/concept-icons/statuses/buffs/lineage-ward.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-ward.png` |
| lineage-plate | `art/src/files/concept-icons/statuses/buffs/lineage-plate.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-plate.png` |
| lineage-technique | `art/src/files/concept-icons/statuses/buffs/lineage-technique.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-technique.png` |
| lineage-evasion | `art/src/files/concept-icons/statuses/buffs/lineage-evasion.png` | `client/public/assets/concept-icons/statuses/buffs/lineage-evasion.png` |
| frame-window | `art/src/files/concept-icons/statuses/buffs/frame-window.png` | `client/public/assets/concept-icons/statuses/buffs/frame-window.png` |
| frame-charge | `art/src/files/concept-icons/statuses/buffs/frame-charge.png` | `client/public/assets/concept-icons/statuses/buffs/frame-charge.png` |

### Rhythm payload glyphs

| Candidate | Payload lane | Target source | Target runtime PNG |
| --- | --- | --- | --- |
| lands-twice | tempo | `art/src/files/concept-icons/payloads/lands-twice.png` | `client/public/assets/concept-icons/payloads/lands-twice.png` |
| heavy-poison | affliction | `art/src/files/concept-icons/payloads/heavy-poison.png` | `client/public/assets/concept-icons/payloads/heavy-poison.png` |
| lunge | engagement | `art/src/files/concept-icons/payloads/lunge.png` | `client/public/assets/concept-icons/payloads/lunge.png` |
| mechanic-proxy | empowered | `art/src/files/concept-icons/payloads/mechanic-proxy.png` | `client/public/assets/concept-icons/payloads/mechanic-proxy.png` |
| root | control | `art/src/files/concept-icons/payloads/root.png` | `client/public/assets/concept-icons/payloads/root.png` |
| heal-and-load | kill-chain | `art/src/files/concept-icons/payloads/heal-and-load.png` | `client/public/assets/concept-icons/payloads/heal-and-load.png` |
| technique-refund | technique | `art/src/files/concept-icons/payloads/technique-refund.png` | `client/public/assets/concept-icons/payloads/technique-refund.png` |

## Packing and alias follow-through

`pnpm art:pack` was run successfully, followed by `pnpm art:pack --check`.
After approval, the packer updated 19 assets: the two shard atlas files, ten buff
tiles, and seven payload glyphs. The drift check confirms runtime art matches
the approved `art/src` sources. After the designer accepted the essence-style set,
the packer updated `icons.png` again to ship those selections; the atlas frame
layout and JSON did not change in that second pack.
No packed atlas was edited by hand.

The ten corresponding entries and their obsolete introductory comment were removed
from `BUFF_ICON_ALIASES` in `client/src/ui/conceptIcons.ts` after all ten runtime PNGs
existed. All other aliases remain. This is the only TypeScript change.
`pnpm typecheck` passed after that change.

Shard and payload consumers can use the exact frame/URL contracts above when their
page/readout work lands. This art pass does not change their TypeScript lookup or
implement gameplay, card data, page layout, rhythm rings, or combat effects.

## Validation

- Original set: 26 entries, 26 distinct archived bitmap hashes, 26 designer approvals,
  0 rejected. Its 17 buff/glyph sources still match the original archive; its nine
  shard targets now match the approved essence-style replacement archive.
- All candidate dimensions match their manifest; archived bitmaps match their receipt
  hashes and the new gallery copies match the durable archive.
- All ten buff tiles have alpha 255 at every pixel; all sixteen shards/glyphs preserve
  transparency.
- Both shard sets' prompts use the current packet colours exactly.
- Replacements: nine accepted entries with nine distinct 32px transparent bitmaps.
  All nine current shard sources match the replacement receipt hashes.
  Both archives' generation receipts and `validation.json` preserve their initial
  pending preparation state; `accepted-validation.json` in the new archive records
  the final source/runtime checks after the designer's selections.
- The review sheet was opened at its original resolution to check preparation and labels;
  this is inspection, not art acceptance.
- `pnpm art:status`: `cc-icons` reports 26 accepted / 0 no-art;
  `cc-shards-essence` reports 9 accepted / 0 no-art. The ten existing coverage
  warnings concern training/test targets and three Iron Marches boss sources outside
  this task.
- `pnpm art:pack`, `pnpm art:pack --check`, and `pnpm typecheck`
  (packages, bench, tests) passed.
- No install, push, full combat test suite, or merge was performed. No gameplay code
  changed; the conductor retains the brief's full-suite requirement before merging.

The generated full-resolution originals remain local and ignored; the approved sources,
packed assets, archived candidates, receipts, prompt manifests and staging helpers
survive the merge.
