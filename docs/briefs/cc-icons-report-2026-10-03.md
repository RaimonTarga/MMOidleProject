# W1-E icon candidates — 2026-10-03

**Status: READY FOR DESIGNER REVIEW.** All 26 candidates are staged; none accepted or rejected.
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
Each entry has one `candidate-1.png` and is `pending`.

- Gallery copies: `art/candidates/cc-icons/<id>/candidate-1.png` (ignored by Git).
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
The source targets are written only when the designer accepts the corresponding candidate.

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
Both reported that shipped assets already match `art/src`. This is expected:
pending candidates have not been promoted to the accepted source tree.
No packed atlas was edited by hand.

No TypeScript was changed. The ten aliases in
`client/src/ui/conceptIcons.ts` remain because their runtime PNGs do not yet exist.
After designer acceptance:

1. Run `pnpm art:pack` to copy accepted loose PNGs and pack accepted shard frames.
2. Verify the ten exact buff runtime paths in the table exist.
3. Remove only the ten corresponding entries and their obsolete introductory comment
   from `BUFF_ICON_ALIASES`. Keep all other aliases.
4. Run `pnpm art:pack --check` and `pnpm typecheck`.

Shard and payload consumers can use the exact frame/URL contracts above when their
page/readout work lands. This art pass does not change their TypeScript lookup or
implement gameplay, card data, page layout, rhythm rings, or combat effects.

## Validation

- 26 entries, 26 staged candidates, 26 distinct bitmap hashes; 26 pending, 0 accepted,
  0 rejected.
- All candidate dimensions match their manifest; gallery files match the durable
  archive and receipt hashes.
- All ten buff tiles have alpha 255 at every pixel; all sixteen shards/glyphs preserve
  transparency.
- All nine shard prompts use their current packet colour exactly.
- The review sheet was opened at its original resolution to check preparation and labels;
  this is inspection, not art acceptance.
- `pnpm art:status`: `cc-icons` reports 26 pending / 26 review / 26 no-art.
  The no-art count means no accepted source, as intended. Its ten existing coverage
  warnings concern training/test targets and three Iron Marches boss sources outside
  this task.
- `pnpm art:pack`, `pnpm art:pack --check`, and `pnpm typecheck`
  (packages, bench, tests) passed.
- No install, push, full combat test suite, or merge was performed. No gameplay code
  changed; the conductor retains the brief's full-suite requirement before merging.

The generated full-resolution originals remain local and ignored; the archived
ship-size candidates, receipts, prompt manifest, and staging helper survive the merge.
