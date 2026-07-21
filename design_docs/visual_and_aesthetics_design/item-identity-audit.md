# Item Identity Audit (Step 1 — concept pass)

**Purpose:** Reconcile the full crafted-item roster against `item-aesthetic-bible.md`
and the *current* skill/mechanic systems, before any icon art is generated. This is
the paper pass that locks each item's `{slot, object noun, damage-profile motif}` so
icon generation (later) never has to be redone.

**Not in scope here:** icon generation and balance numbers.

**Implementation status (2026-07-21):** the swamp→poison retheme, the frost relocation to
Tundra, and the `trenchUltimate.ts` orphan deletion are **DONE** (typecheck clean, 25/25
tests pass). The `ashbrand` code identifiers were renamed to a neutral `hasWeaponDot`
marker (the shared burn-family marker), which also fixed a latent invariant bug (the old
check only matched `ashbrand-burn`, so any non-ashbrand weapon burn reported a false
violation). Mountain armor redesign remains deferred; the two minor open decisions below
are unresolved. Recipe/item ids were kept stable (persisted in saves); only names,
elements, effect ids, and the marker changed.

## Disposition tags

Every item is tagged with what this overhaul does to it:

- **`keep`** — name, mechanic, and flavor all fit. Icon-only later. No action now.
- **`rename`** — display name changes; mechanic unchanged. Internal recipe id can stay
  stable (decouple shown name from code id).
- **`retheme`** — the damage-profile motif changes (e.g. fire → poison). Icon depends on
  this, so it must be settled before iconing. May touch `element` + effect ids.
- **`redesign`** — the mechanic itself changes. Gameplay/balance work; blocks its icon
  until settled.
- **`delete`** — remove the item.

Roster status: **the large majority are `keep`.** Flavor lines already exist and read
well across all biomes. Only the items listed below need action; everything not listed
is `keep`.

---

## Headline findings

### 1. Swamp DoT weapons are fire/frost, not poison (biggest issue)

`item-aesthetic-bible.md` §9 and §21 are explicit: **Swamp = poison/venom/rot; fire
belongs to Volcanic, frost to Tundra.** The swamp weapon line violates this at every tier:

| id | name | element | should be |
|---|---|---|---|
| `ashbrand-blade` | Ashbrand Blade | **fire** | poison |
| `swamp-mirebrand` | Mirebrand | **fire** | poison |
| `swamp-frostbrand` | Frostbrand | **frost** | poison (or delete) |
| `swamp-blightbrand` | **"Flamebrand"** (id says blightbrand!) | **fire** | poison |
| `swamp-rimebrand` | Rimebrand | **frost** | poison (or delete) |

`poison` is a valid `DamageElement` (`shared/src/systems/dotElements.ts`), so the retheme
is mechanically cheap. Note the weapon `element` mainly drives DoT number color/glyph and
target tile — the class's own DoT element comes from its spec — so re-coloring to poison
is low-risk.

**Why it's like this:** swamp was the DoT-teaching biome and prototyped all three
profiles (fire/frost/poison) before Volcanic and Tundra existed. Those biomes now own
fire and frost natively (`volcanic-blightbrand` = fire, `tundra-glacial-rimebrand` =
frost), so the swamp fire/frost variants are redundant with, and thematically stolen
from, the later biomes.

The fast-vs-heavy split is real and worth keeping: the "fire" variants are fast/low-conv
(APS ~0.85–1.0, conv 0.50); the "frost" variants are slow/heavy (APS 0.75, conv 0.70).
That is a legitimate *within-swamp* branch (quick venom vs. slow rot) — it just needs to
be re-skinned from fire/frost to two poison profiles. **See "Swamp resolution" below.**

Also: the `-brand` suffix (a *branding iron* — a fire word) is used across swamp, tundra,
and volcanic as a generic "DoT weapon" suffix. Per the bible each biome should own its
vocabulary. Swamp should drop `-brand` entirely for dagger/venom/rot/fang words.

### 2. `trenchUltimate.ts` is a broken orphan → delete

It is a mangled find-replace copy of `abyssUltimate.ts`: names like "trenchal Plate" and
"Heart of the trench", and it re-defines `voidstride-greaves` and `edge-of-oblivion` with
the same ids as the abyss file. It is **not imported** (`weaponFamilies.ts` imports only
`abyssUltimate`; `index.ts` has both commented out). `delete` the file.

### 3. Mountain armor damage-cap → defensive-cooldown (a `redesign`, deferred)

The whole mountain armor line (`mountain-vest-t1..t4`, `defense.max-hit-pct`) is the
"damage cap / anti-spike" identity. You want to repurpose it toward reducing defensive
(Guard) ability cooldowns. This is a mechanic change, not flavor — the "heavy stone
plate" silhouette and names survive it, so it does **not** block iconing the mountain
armor. It's tracked here as `redesign` and belongs to the later mechanical pass.

---

## Per-item action list

Everything not listed is `keep` (icon-only later).

### Swamp weapons — `retheme` + `rename` (LOCKED)

Swamp becomes a **single, pure-poison** DoT line (fast venom daggers). Names are taken
straight from the bible's DoT weapon line (§19) — all canonical:

| id | current | LOCKED name | element |
|---|---|---|---|
| `ashbrand-blade` | Ashbrand Blade (fire) | **Poison Dagger** | poison |
| `swamp-mirebrand` | Mirebrand (fire) | **Venom Knife** | poison |
| `swamp-blightbrand` | "Flamebrand" (fire) | **Plague Fang** | poison |
| `swamp-frostbrand` | Frostbrand (frost, T2) | **DELETE** | — |
| `swamp-rimebrand` | Rimebrand (frost, T3) | **RELOCATE → Tundra T3** (see below) | frost |

Internal recipe ids can stay stable (`ashbrand-blade` etc.); only the `name`, `element`,
and effect-family wiring change. The `ashbrand` code identifiers (`HasAshbrandBurn`,
`ashbrand-burn`, `world.ashbrandMonsters`, burn-family tick) get renamed to poison
vocabulary in the mechanical pass — user has accepted the variable churn.

### Ultimate recipes

| id / file | action | note |
|---|---|---|
| `trenchUltimate.ts` (whole file) | `delete` | broken orphan, unimported, dup ids |
| `trenchal-plate`, `heart-of-the-trench` | `delete` | live in the orphan file |

### Minor / optional

| id | issue | suggested |
|---|---|---|
| `desert-sunsteel-cross` / `desert-solar-cross` / `desert-zenith-cross` | "Cross" is an unusual weapon noun for a first-strike/ambush burst weapon | optional `rename` to a blade/glaive noun (e.g. Sunsteel Falchion) — low priority |
| Cave axes (`chaotic-axe`, `cataclysm-axe`) | bible §9 flags "Chaotic/Cataclysm" as too dramatic for T1/early | optional; the cave identity is intentionally strange, so defensible as-is |
| `trench.recipes.ts` header comment | stale copy-paste of the Graveyard header ("renamed from necropolis") | trivial comment fix |

### Mountain armor — `redesign` (deferred to mechanical pass)

`mountain-vest-t1`, `mountain-vest-t2`, `mountain-vest-t3`, `mountain-vest-t4`,
`mountain-vest-t4-stormwall` — damage-cap → defensive-cooldown repurpose. Icons NOT
blocked (silhouette/name survive).

---

## DoT profile ownership by biome (LOCKED)

The core decision: each DoT element lives in the biome that actually fits it mechanically,
instead of all three being crammed onto swamp. This is an **actual mechanical change**
(weapons move/appear at new tiers), which the user has opted into for the DoT line
specifically (mountain armor stays deferred — see below).

| Element | Owner biome | Starts at | Notes |
|---|---|---|---|
| **Poison** | Swamp | T1 | Swamp's whole line, T1→T3. Fast venom daggers. |
| **Frost** | Tundra | **T3** | Removed from swamp entirely; frost DoT debuts on Tundra. |
| **Fire** | Volcanic | **T4** | Removed from swamp; fire DoT already lives at Volcanic T4. |

Implied recipe operations (mechanical pass):

1. **Swamp:** retheme `ashbrand-blade`/`swamp-mirebrand`/`swamp-blightbrand` to `poison`
   + rename (Poison Dagger / Venom Knife / Plague Fang). Single line, no branch.
2. **Swamp:** `delete` `swamp-frostbrand` (frost no longer belongs pre-Tundra).
3. **Tundra:** frost DoT must exist at **T3**. Today Tundra's only frost DoT is
   `tundra-glacial-rimebrand` at **T4**. Relocate the swamp `swamp-rimebrand` identity
   into Tundra as its **T3** frost DoT weapon (keep the "Rimebrand" name → "Glacial
   Rimebrand" at T4 reads as a clean progression).
4. **Volcanic:** fire DoT already lives at T4 (`volcanic-blightbrand`) — no move needed.
   *Optional cleanup:* rename `volcanic-blightbrand` off the "blight" (rot/poison) word
   onto fire vocab (e.g. Cinderbrand / Emberfang), since "blight" now reads poison. The
   reclaimed fire name "Ashbrand" could even land here.

---

## Open decisions — all resolved

- **Swamp resolution:** pure poison, single line (Poison Dagger / Venom Knife / Plague
  Fang). DONE.
- **Volcanic fire-DoT rename:** `volcanic-blightbrand` → **Cinderbrand** (effect id
  `blightbrand-burn` → `cinderbrand-burn`); recipe id kept stable. DONE.
- **Desert "Cross" noun:** Sunsteel / Solar / Zenith **Cross → Falchion** (display-name
  only; recipe ids `desert-*-cross` kept stable). The sun/crusader prefix carries the
  holy-war flavor; "Falchion" just reads clearly as a blade. DONE.
- **Mountain armor redesign** (damage-cap → defensive-cooldown): deferred to the later
  mechanical pass.

---

## Downstream

Once decisions 1–2 are locked, the `keep` + `rename` + `retheme` items form the settled
icon-generation list (each item's slot/object/motif is fixed). `redesign` items get iconed
against their *current* silhouette; only their stat line changes later. This audit is the
front half of the icon pipeline's concept work.
