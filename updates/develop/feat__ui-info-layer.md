# UI info layer, bespoke item art, and two new build slots

Thirty-three commits that had accumulated on `feat/ui-info-layer` while `develop`
sat behind. Four themes: the UI information pass the branch is named for, the
PixelLab art campaign, the balance-bench repairs, and two new equipment slots
(Cores and Relics) with their art.

## Player-facing changes

### Reading your build
- A shared tooltip primitive and a `describe` module put concrete numbers on
  abilities, stances, rites and runes instead of vague text.
- Class mechanics and evasion now explain themselves on hover.
- The skill tree lets you select a node to read it and confirm before spending,
  and it no longer shrinks the nodes you didn't pick.
- The rune composer is pinned so **ADD RULE** stays reachable.
- The craft tab is new-first and shows only what you can actually make.
- **EQUIPPED** reads at a glance on the upgrade screen; materials rows and
  loadout sockets share a uniform shape with drawn occupants.
- Map discovery and a revised unlock schedule ship with the crafting UI pass.

### New build slots
- **Cores** — a fifth equipment slot. Twelve cores, one per biome, each a
  percentage amplifier on overall stats with a real trade-off. Eligibility is
  melee / ranged / unrestricted, and the range axis is chosen at player T3.
- **Relics** — a sixth equipment slot, unlocked at T4. A relic carries no
  ordinary stats and no +N track; it carries four universal ratings that resolve
  differently against whichever root archetype you run, so one relic means a
  lower cadence threshold for one player and a shorter summon respawn for
  another. Eight relics across eight biomes.

### Art
- 121 bespoke item icons across weapons, armor, charms and boots.
- 45 bespoke Tier 3 player bodies replace the earlier recolours, plus identity
  head rings and a roster-wide colour pass.
- Twelve core icons (circular cut gemstone in a metal setting) and eight relic
  icons (square iron plate, frame encodes the trade).

### Fixes
- Every directional core was permanently inactive.
- `approachPoint` stopped short of reach on every off-axis approach.
- An infinite render loop in the unlock badges.
- Rail labels wrap between words instead of mid-word.
- Tier advancement runs on seals rather than a boss kill-quest.

## Technical notes

- **Cores and Relics both ride the generic slot list.** Neither needed a database
  migration; relics persist and network through the existing inventory slice, and
  legacy saves are normalized by `normalizeEquipment()` adding `relic: null`.
- `shared/src/systems/relics.ts` is the single formula authority for server
  combat, HUD values, Forge previews and item details, so the stat panel cannot
  disagree with combat.
- Relic ratings are signed and clamped to `[-0.75, 2]`, with explicit floors on
  interval resolvers and deterministic rounding on discrete values.
- Mechanic-origin effect scaling is an explicit opt-in registry, not blanket
  status scaling — weapon, ability, monster and ally effects do not inherit it.
- The benches are now inside `typecheck`, which immediately caught a tier >= 3
  crash and a stale `MAX_UPGRADE` literal. A `--mode farm` income bench measures
  income per hour rather than just clear time.
- Art source lives in `art/src/`; the atlases under `client/public/assets` are
  build output of `art:pack`. Recipe `icon:` fields are wired by `art:wire`.

### Not in this PR

Concurrent auth and character-select work — Discord OAuth, migration `0004`,
`client/src/auth/`, `server/src/auth/` — is still uncommitted in the working tree
and follows as a separate PR. The two sets are disjoint at file level; the one
overlap, three new exports in `shared/src/index.ts`, was split by hand so only
the two relic exports landed here.

## Validation

- `pnpm typecheck` clean.
- `pnpm test` 53/53 passing.
- `pnpm art:pack --check` reports no drift between `art/src` and the shipped
  atlases.
- Note: the above ran against a working tree that also contained the uncommitted
  auth changes. CI on this PR is the first check of these commits in isolation.
