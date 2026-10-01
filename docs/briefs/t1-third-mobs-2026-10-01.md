# T1 third-family mobs — authoring record and art handoff (2026-10-01)

**Why.** Every T1 biome fielded two mobs, so each biome's third family (Sky, Canopy, Crag,
Brood, Coven) debuted at T2, all six Swamp nodes were the same node, and six of eight
shards were boss-only at T1 (overnight report, "The T1 map cannot field its own family
table"). Design §18 item 8 decided: one new T1 mob per biome, the younger kin of the T2
family member, plus the Mud Toad re-familied as Stalker so Swamp needs only one new body.

**Branch state.** The code landed inside `feat/morning-fixes` commit `c9946ee3` (swept in
with the T3/T4 weapon forms by a concurrent session; the diff is correct, the message does
not mention it). The blend test update is the commit after it.

## What was authored

| id | biome | family · shard | kin of | shape |
|---|---|---|---|---|
| `grass-kite` | plains | Sky · Engagement | savanna-hawk | airborne opener: one telegraphed Stoop, then fights |
| `bramble-pod` | forest | Canopy · Affliction | canopy-sprite (Thorn Spitter) | rooted ranged, light stacking Bramble Sap |
| `rockback-ram` | mountain | Crag · Empowered | cliff-hopper (species), granite-titan (role) | plated charger, flat plating 3, big slow bites |
| `brood-spiderling` | cave | Brood · Affliction | giant-spider | clutch of three, weak venom |
| `fen-hexer` | swamp | Coven · Control | bog-witch | planted caster, Mire Hex slow |
| `mud-toad` | swamp | **re-familied** Mire → Stalker | — | no change to the mob |

Registries touched: monster definitions, `biomeDatabase` T1 pools, `families/index.ts`,
`frameMaps` (frames + display scale), `corpseRemains`, `balanceProgression` rosters,
`art/manifests/monsters.json` (five `pending` entries). `variantBlend.test.ts` now expects
the authored 7/2/1 on the Plains 70/20/10 node.

**Every number on the five mobs is a PLACEHOLDER** seeded from the biome's T1 band and
marked so in the definition comment. Designer hand-edits before the lane bench reruns.

## Art: what to run

Prompts follow `design_docs/visual_and_aesthetics_design/sprite-batch-methodology.md`
§3 (locked params, TAIL, STD + GROUND + TOON ban blocks, biome palette words from the
palette bible, shape bans) and §4 (img2img anchored on the **accepted** same-biome kin
sprite at strength 250, never across biomes).

The queue also holds five stale `pending` entries from an older campaign (ruins, stormlands,
desolate-moon). They are not part of this batch. Run by id so they do not ride along:

```
pnpm art:generate --category=monsters --id=grass-kite
pnpm art:generate --category=monsters --id=bramble-pod
pnpm art:generate --category=monsters --id=rockback-ram
pnpm art:generate --category=monsters --id=brood-spiderling
pnpm art:generate --category=monsters --id=fen-hexer
```

One run at a time, in the background, gallery closed (methodology §5). Dry run on
2026-10-01 priced the five at 15 calls, about $0.10. Then `pnpm art:review`, the designer
picks, then `art:pack` → `bake:hitboxes` → `art:pack --check` → typecheck + tests.

## Review checklist (methodology §6)

- Reads as **kin**: kite next to hawk, pod next to spitter, ram next to hopper, spiderling
  next to spider, hexer next to witch. Smaller, simpler, same silhouette language.
- Value against the measured ground: Plains dusty bodies darker than wheat; Forest warm
  rust/umber on cool moss; Mountain warm hide on cold stone, stone plates darker than the
  slabs; Cave pale on near-black; Swamp dark and glossy with a pale belly flash.
- Accent discipline: Forest matte berry-red thorn tips only; Swamp chartreuse only on the
  witch-light; Cave colourless glint; nothing glowing in Plains or Mountain.
- Ground-plate and perch leaks (the kite must be airborne with nothing under it).
- No bipedal drift on the ram; no face or skin on the hexer; the spiderling is one body,
  not a swarm.
- Reject notes: what is wrong and which candidate was closest.

## After the art lands

1. Designer hand-edits the five placeholder stat lines.
2. Rerun the lane bench (`reports/progression-phase1/`), since the "has a favouring T1
   node" column and the Swamp duplicates both change.
3. Revisit the boss shard stopgap (design §17/§18 item 6): with Sky, Canopy, Crag, Brood
   and Coven live at T1, Engagement, Affliction, Empowered and Control have family sources;
   Bulwark and Barrier tempo still do not.
4. Add the new mobs to the guided tutorial's bot-validated scripts if any T1 beat walks
   through a node they now dominate.
