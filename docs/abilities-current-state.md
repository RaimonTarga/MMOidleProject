# Abilities — Current State

Living truth for the active **Ability** system (Technique / Guard). Paired with
`docs/archive/abilities-plan.md` (the original Step 7 plan) and
`design_docs/abilities-evolution-plan-updated.md` (the T2–T4 design baseline).
Staged work is tracked in `docs/abilities-evolution-implementation-plan.md`.

**Shipped:** Step 7 (the system + 5 T1 abilities), Step 8 (`guard.*` charm amplifiers),
and **abilities-evolution Wave 1** (the multi-slot engine + cast lifecycle + Technique
itemization + the T2 trio). Waves 2–3 (T3/T4 rosters) are not started.

> **Name collision (kept distinct).** The passive talent tree (`UsesSkills`, `skillTree/`) is
> class progression and is **untouched**. "Abilities" is the active system (Technique / Guard).

**All numbers are PLACEHOLDERS** — the user owns the balance pass.

---

## Data model — state rides `TracksProgression` (like runes)

Ability state lives on `TracksProgression`, NOT a separate component: it is build/loadout
data exactly like runes, which avoids a DB migration, a new networked slice, a new
`ServerEntity` key, and fixture churn. Two fields
(`shared/src/components/core/networkedSlices.ts`):
- `knownAbilities: string[]` — abilities learned (crafted); the slottable pool.
- `equippedAbilities: EquippedAbilities` — **ordered lists per slot kind**:
  `{ techniques: string[]; guards: string[] }`. **List order is fire priority.**

### Slots are tier-gated
`abilitySlotCount(playerTier)` (`shared/src/abilities.ts`) mirrors `riteSlotCount`:
T1–T2 → 1 Technique / 1 Guard, **T3 → 2/1**, **T4+ → 2/2**. Keyed on **player tier**, not
Global Mastery — Biome Mastery owns ability *unlocks*, tier owns *slots*. Projected on
`PlayerView` as `abilitySlots`.

### Migration (no SQL)
`normalizeEquippedAbilities` accepts the legacy Step 7 `{technique, guard}` shape and
coerces it to lists, dropping unknown ids, slot mismatches and duplicates. Applied in
`playerRepo` hydrate — the column is whole-slice JSON, so no schema migration was needed.
`RENAMED_ABILITY_IDS` maps ids that changed after shipping (`heavy-strike` →
`expose-weakness`); it is **additive-only**, since removing an entry silently strips the
ability from affected saves.

### Static catalog — `shared/src/abilities.ts`
- `AbilitySlot` (`technique` | `guard`), `AbilityShape` (`armed` | `cast` | `reposition` |
  `instant`), `AbilityTag` (`mobility`), `AbilityTrigger` (`in-combat` | `hp-below` |
  `n-aggro` | `has-debuff`).
- `AbilityEffectSpec`: `cleave` | `empower` | `cast-strike` | `expose-weakness` |
  `reposition` | `bramble` | `damage-reduction` | `cleanse` | `heal`.
- `AbilityDef` carries `tier` (home tier), `scalePerTierPct`, `lineageId`, `castMs`.

### The scaling seam — `resolveAbilityEffect`
**Every consumer must resolve effects through this.** Reading `ability.effect` raw
silently opts an ability out of both scaling layers. It applies:
- **automatic tier deepening** (`abilityTierScale`) — an owned ability improves as the
  player advances; same id, same form, no upgrade ritual;
- **Technique Power** — only on fields listed in `TECHNIQUE_POWER_FIELDS`.

Both are restricted to magnitude fields (`ABILITY_SCALABLE_FIELDS`). Durations, radii,
stun times and dash distances are **never** scaled. `ABILITY_MULTIHIT_MODE` declares, per
effect kind, whether a Reload magazine distributes the payload or lands it on the first
hit only — deliberately per-effect so a 1.5 s stun can't become five 0.3 s stuns.

---

## Firing — `abilityFiring.ts`

`updateAbilityFiring(world, now)` runs each tick after rune flags + target acquisition,
before combat resolves.

- **Cooldowns are per ABILITY** (`ability.cd.<abilityId>`), not per slot — a loadout swap
  must not dodge a cooldown, and two equipped abilities must not share a rhythm.
- **Techniques share ONE offensive channel** (`hasArmedAbility` and `isCastingAbility`,
  mutually exclusive and singular). The driver walks the list in order and stops at the
  first ability that fires. A loser is *not* put on cooldown — it stays eligible.
- **Guards** activate independently but at most **one activation per decision window**
  (`ability.guard.window`, one tick). Already-active buffs layer freely, so Ward + a later
  Brace is legal while an instant defensive combo-dump is not.
- **Rune overrides are per slot INDEX**: `fire-technique`/`fire-guard` drive slot 0,
  `fire-technique-2`/`fire-guard-2` drive slot 1 (rune channels are single-claim, so a
  second slot needs its own channel).

## Execution shapes

| Shape | Mechanism | Worked by |
|---|---|---|
| `armed` | attaches `hasArmedAbility`; rider lands in `abilityEffects.ts` on the next hit | Sweep, Expose Weakness |
| `cast` | attaches `isCastingAbility`; see below | Charged Strike |
| `reposition` | resolves immediately by moving the player; optionally also arms | Charge |
| `instant` | immediate self-facing effect | Brace, Cleanse, Second Wind, Bramble Guard |

### Cast lifecycle — `abilityCasting.ts`
Mirrors the proven monster `chargedAttack` machine: arm → wind-up → resolve, aborting on
hard CC. Two deliberate differences:
- **Movement continues.** A monster roots itself while charging; the player does not,
  because auto-movement is rune-driven and a cast that fought pathing would be unusable in
  an idle game. Only *normal attacks* are suppressed (the `isCastingAbility` check in
  `combat.ts`, beside the existing `isChanneling` one).
- **An aborted cast costs nothing.** The cooldown is charged only on resolve, so losing a
  target or eating a stun mid-wind-up is not punished twice.

`technique.cast-speed-pct` shortens the wind-up (capped at 60% — the telegraph is the cost
that makes the payoff fair). Node events `player-cast-start` / `player-cast-end` drive the
client; the cast bar reuses `castBars.ts` wholesale, since `castState` is keyed by entity
id and players have sprites.

---

## Guard buffs are EXPLICIT buffs, one id per slot

Guard boons go through the buff system (icon + timer in the buff bar), not raw shields.
Because two Guards can be equipped, the DR effect id is **per slot**: `ability-guard`
(slot 0) and `ability-guard-2` (slot 1), each with its own descriptor labelling itself
from the ability in *its* slot. This shape is forced: `BUFF_IDS` is a fixed const list and
status-effect `data` is numbers-only, so the owning slot cannot live in effect data.

The `onDamageTaken` reader sums active slots **multiplicatively** (each is a separate
reduction of what got through), capped at `GUARD_DR_CAP` 0.9. Additive stacking would hit
the cap far too easily and make the second Guard strictly the best defensive pairing.
Knockback resist takes the **best** active slot rather than stacking, so a second Guard
can't make the player immovable.

## Technique itemization — `TECHNIQUE_KEYS`

The offensive sibling of `GUARD_KEYS`, riding the existing equipment
`mechanicEffects → usesSkills.passives` pipeline (no new state, slice, or migration):
- `technique.power-pct` — scales opted-in offensive payloads only
- `technique.cooldown-reduction-pct` (capped 0.9)
- `technique.cast-speed-pct` (capped 0.6)

Carried by **weapons**; Guard potency stays on the recovery/charm slot. The budgets are
deliberately not interchangeable. Seeded (PLACEHOLDER magnitudes) on the plains T2 sidearm
(cooldown), mountain T2 hammer (cast speed), and desert T2 opener (power).

---

## Roster

### T1 — the base vocabulary
Re-keyed to the design table; safe to move because `knownAbilities` stores ability ids, so
no save lost an ability. Each sits mid-band (biome level 3 of the L1–6 T1 band) so the
player meets the biome's challenge before earning its answer.

| Ability | Slot / shape | Biome | Job |
|---|---|---|---|
| **Sweep** | Technique / armed | Plains | Next attack cleaves — the density answer |
| **Second Wind** | Guard / instant | Forest | HoT sustain vs. frequent small hits |
| **Brace** | Guard / instant | Mountain | DR + knockback resist vs. telegraphed spikes |
| **Cleanse** | Guard / instant | Swamp | Strip debuff/DoT stacks + short DR |
| **Expose Weakness** | Technique / armed | Cave | Elite damage amplification |

### T2 — new execution shapes
Not roster growth for its own sake: these introduce **reflect, repositioning and casting**
while every T1 ability keeps auto-scaling.

| Ability | Slot / shape | Biome (level) | Job |
|---|---|---|---|
| **Bramble Guard** | Guard / instant | Jungle (3) | Temporary plating + flat thorns |
| **Charge** | Technique / reposition | Desert (3) | Close the gap, land an empowered blow |
| **Charged Strike** | Technique / **cast** | Mountain (**9**) | The first player cast |

A T2 ability can live in a T1-native biome because `BIOME_LEVELS_PER_TIER = 6` — the T2
band is levels 7–12. Mountain teaching you to *read* a wind-up and then to *perform* one
is deliberate.

### Bramble Guard — `abilityBramble.ts`
The first reflect mechanic. Plating folds into `mitigatesDamage.plating` per tick from the
status effect (same pattern as reactive plating) and unwinds exactly once. Reflect is
**flat, never a fraction of damage taken** — a percentage would scale with incoming damage
and turn "get hit harder" into "deal more damage", the exact offence/defence leak the
design forbids. It fires on `afterHit` (a resolved hit), skips DoT ticks, and is unmitigated.

---

## Rune layer

Each ability slot index has its own single-claim channel: `TECHNIQUE`, `TECHNIQUE_2`,
`GUARD`, `GUARD_2` (+ `STANCE`, `CONTROL`). Actions `fire-technique[-2]` /
`fire-guard[-2]`, all in `STARTER_RUNE_IDS` — the override is a timing preference for an
ability you already had to unlock. The `-2` actions are inert until the tier grants that slot.

Conditions available to ability channels: `in-combat`, `hp-below-25`, `has-debuff`,
`n-aggro-3`, `target-casting` (enemy winding up a charged attack — this is what makes a
future Parry automatic), `before-empowered`, and **`target-elite`** (new: lets two equipped
Techniques specialise against the same enemy, e.g. Expose Weakness to kill it faster vs. a
future Stun Strike to control it).

## Protocol + client

- `ability:craftRecipe`, `ability:setLoadout`, `ability:craftResult`.
  **`ability:setLoadout` carries the WHOLE loadout** — equip, clear and re-prioritise are
  one intent, and the server validates learned / slot-type / slot-count / duplicates,
  rejecting the whole request rather than silently dropping entries.
- **Abilities panel** renders one row per unlocked slot, labels slot 2+ with its priority
  meaning, and hides abilities already used in another slot of the same kind.
- **Ability bar** renders every equipped ability. Fired/cooldown timestamps are keyed by
  **ability id** (not slot kind) so the right tile pulses; the consuming-hit pulse is
  raised where the armed entry is dropped, since that is the only place the consumed
  ability's identity is known. A casting tile shows a *filling* sweep.
- Admin `CharactersTab` lists both loadout lists.

## Verified

`pnpm typecheck` clean (4 packages); `pnpm test` **34/34**. Ability coverage:
`abilities`, `abilityMultiSlot`, `abilityCast`, `abilityCharge`, `abilityBramble`,
`abilitySecondWind`, `abilityTechniqueRune`, `abilityTelegraphEvents`.

## Known gaps

- **Icons for the T2 trio are drafted but not generated.** `art/manifests/ability-icons.json`
  has `status: "draft"` entries for bramble-guard / charge / charged-strike; they are NOT in
  the `abilityIcons.ts` approved allowlist, so those abilities render the placeholder until
  art is generated and accepted in the gallery.
- No bespoke in-world FX for Charge / Charged Strike / Bramble (they use the generic
  technique-fired tag and the reused cast bar).
- Ability **evolution presentation** (`lineageId` grouping in the panel) is not built yet —
  the field exists and Sweep carries `lineageId: "sweep"`, but nothing consumes it until
  Whirlwind lands in Wave 2.
- All numbers are PLACEHOLDERS.
