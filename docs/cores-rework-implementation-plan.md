# Cores Rework — Implementation Plan

**Design source:** `design_docs/CORE_DESIGN_PHILOSOPHY.md` (locked foundation) and
`design_docs/CORE_CAST_REVIEW_DRAFT.md` (roster). Where this plan and those docs
disagree about *what* a core is, the design docs win; where they disagree about
*where the code lives*, the code wins.

**Audit baseline:** `design_docs/archive/CORE_ITEM_SLOT_IMPLEMENTATION_CONTEXT.md`
(2026-08-02, commit `d2fa188`). Still accurate as of this plan.

**All numbers in this document are PLACEHOLDERS** sitting inside the design doc's
bands. The balance pass is the user's, edited directly in the recipe files.

---

## 0. What is actually wrong today

Not "the cores don't work" — the gate was fixed on 2026-08-02 (`5e5219d`) and the
plumbing is sound. Three real problems:

1. **The five authored cores are tier-misplaced.** Range is selected at skill-tree
   tier 2, which is **player tier 3**. All five cores sit at forest biome level
   7–10 — the **T2** band. So a T2 player can craft Bastion, Sniper and Arcanist
   Cores and equip them, and they contribute *nothing* until T3. The philosophy
   doc's "restricted archetypes unlock at Tier 3" is a bug fix, not a preference.
2. **The eligibility axis is the wrong shape.** `rangeTag: close|mid|far|universal|party`
   encodes five buckets for a design that has three (Melee / Ranged / Unrestricted),
   forces a Ranged core to be authored twice, and carries a `party` value that means
   "always on" and gates nothing.
3. **The cast is placeholder content.** Five AI-generated cores, all in one biome,
   all pure stat multipliers, no coverage of the archetypes the design names.

### Decisions locked for this pass

| Question | Decision |
|---|---|
| Eligibility model | Replace `rangeTag` with `coreEligibility: 'melee' \| 'ranged' \| 'unrestricted'`. Drop `party`. |
| Cast scope | 12 base cores: 3 T2 unrestricted starters, 3 T3 melee, 2 T3 ranged, 4 T3 unrestricted specialists. **No evolution branches, no T4 cores.** |
| Rank model | **Branch at the next tier.** No linear ranks. A T3 core will later evolve into one of N named T4 branches — one evolve, one decision. |
| Acquisition | One thematic biome per core, gated by the existing `requiredBiomeLevel` band. |
| Survivalist recovery | One `core.recovery-mult` scaling both the passive regen stat and every heal through `applyHealToPlayer`. Replaces `core.hpregen-mult`. |
| Controller debuffs | Enumerated `SCALABLE_DEBUFFS` registry + one `applyPlayerDebuff()` helper. No blanket multiplier. |
| Fourth T3 unrestricted slot | **Catalyst (on-hit potency)**, promoted from T4. The planned Affliction/DoT core was cut — see "Why there is no DoT core" below. |
| Arcanist budgets | **Technique-only** at base. Guard cooldown/potency stays a future branch, preserving the offence/defence budget separation. |
| Bruiser / Scout mobility clause | Accepted as-is. Only Charge carries `tags: ['mobility']` today; the clause is inert without it, and both cores keep an always-on stat base. |
| Old forest cores | Deleted outright. |
| Icons | Placeholder (reused charm art). Core icon generation is its own PixelLab pass. |

---

## Phase A — Eligibility model ✅ DONE

Structural, mechanical, no new behavior. Do this first; everything else builds on it.

**Shipped.** `pnpm typecheck` clean (4 packages + bench), `pnpm test` 43/43.
`coreAuthoring.test.ts` is new. One behaviour change reached live data: the former
`mid` core (`forest-core-arcanist`) is now `ranged`, so it activates for far builds
too — those five recipes are deleted in Phase C regardless.

`isDirectionalCore` → `isRestrictedCore`, and a shared `coreEligibilityLabel()` now
backs all three UI surfaces so their copy cannot drift apart.

### A1. Type change

`shared/src/items.ts`
```ts
export type CoreEligibility = 'melee' | 'ranged' | 'unrestricted';
```
- Delete `CoreRange`.
- `ItemDefinition.rangeTag?: CoreRange` → `ItemDefinition.coreEligibility?: CoreEligibility`.

`shared/src/data/recipes/types.ts` — same rename on `Recipe`, with a doc comment
stating the field is **required on `slot: 'core'` recipes and forbidden elsewhere**.

`shared/src/itemDatabase.ts` — carry the renamed field through the recipe→item mapping.

### A2. The gate

`shared/src/systems/cores.ts` — rewrite as the single authority:
```ts
export function coreIsActive(
  eligibility: CoreEligibility | undefined,
  selectedRange: string | null,
): boolean {
  if (!eligibility || eligibility === 'unrestricted') return true;
  if (eligibility === 'melee') return selectedRange?.endsWith('-range-close') ?? false;
  return selectedRange?.endsWith('-range-mid') === true
      || selectedRange?.endsWith('-range-far')  === true;
}

/** Whether this eligibility is gated at all (melee/ranged), for UI indicators. */
export function isRestrictedCore(e: CoreEligibility | undefined): boolean {
  return e === 'melee' || e === 'ranged';
}
```
`isDirectionalCore` is renamed to `isRestrictedCore` (2 client call sites).

**Keep** the comment explaining that `selectedRange` holds the full tier-2 skill id
(`cadence-range-close`), not a bare word — that regression is worth remembering.

### A3. Consumers of the renamed field

- `shared/src/systems/stats.ts:216` — the equipment loop's core gate.
- `server/bench/balance/progression.ts` — `pickCore()` filters on `recipe.rangeTag`
  and ranks directional-over-universal; rewrite for the 3-way axis.
- `client/src/ui/inventory/EquipmentSlots.tsx` (~L31–45)
- `client/src/ui/inventory/StatSheet.tsx` (~L182–186)
- `client/src/ui/crafting/MakeTab.tsx` (~L576–579)

### A4. Authoring invariant

The old shape had a footgun: a core with no tag was silently always-active. Keep the
helper permissive (missing ⇒ unrestricted, so nothing crashes), but add a test that
**every `slot: 'core'` recipe declares `coreEligibility`, and no non-core recipe does.**
That is the actual guarantee; the helper is just the safe fallback.

---

## Phase B — Passive keys and their consumers ✅ DONE

**Shipped.** `pnpm typecheck` clean, `pnpm test` 45/45. New tests:
`coreMechanics.test.ts` (debuff scaler, pure) and `coreCombat.test.ts` (recovery
funnel, elite damage, both mobility clauses, against a real `World`).

Two traps found while implementing, both now covered by tests:
- **`vulnerability` stores `1 + magnitude`, not the magnitude.** Scaling it directly
  turns a +12% core into a +34% debuff. `SCALABLE_DEBUFFS` therefore tags each field
  as `fraction` or `multiplier`, and multiplier fields scale only their excess over 1.
- **The weapon brittle listener writes its per-stack values back after applying**, to
  keep them current with the equipped weapon. Writing the raw numbers there undid the
  core's scaling one tick later — invisible to any test that only checks the first
  application. Hence `playerDebuffConfig()` alongside `applyPlayerDebuff()`.

### B1. `CORE_KEYS` after this pass

`shared/src/passives.ts`:

| Key | Status | Consumer |
|---|---|---|
| `core.attack-mult` | exists | stat rebuild |
| `core.maxhp-mult` | exists | stat rebuild |
| `core.plating-mult` | exists | stat rebuild |
| `core.speed-mult` | exists | stat rebuild |
| `core.attack-speed-mult` | exists | stat rebuild |
| `core.dr-layer-pct` | exists | combat pipeline (monster→player direct hit) |
| ~~`core.hpregen-mult`~~ | **removed** | folded into `core.recovery-mult` |
| `core.recovery-mult` | **new** | stat rebuild + `applyHealToPlayer` |
| `core.elite-damage-mult` | **new** | combat `onHit` listener |
| `core.onhit-mult` | **new** | combat pipeline (`dealsDamage.onHitDamage` term) |
| `core.debuff-duration-mult` | **new** | `applyPlayerDebuff` |
| `core.debuff-potency-mult` | **new** | `applyPlayerDebuff` |
| `core.mobility-cooldown-reduction-pct` | **new** | `techniqueCooldownMs` |
| `core.mobility-refund-on-kill-pct` | **new** | combat `onKill` listener |

Naming note: cooldown keys use the established `*-cooldown-reduction-pct` shape
(**positive = shorter**), not the `*-mult` shape, so they read the same way as
`technique.cooldown-reduction-pct` and `guard.cooldown-reduction-pct`.

Arcanist needs **no new key at all** — it authors the existing `technique.*` keys.

### B2. `core.recovery-mult` — Survivalist

Two sites, both trivial:
- `shared/src/systems/stats.ts` — in the core-multiplier pass, replace the
  `core.hpregen-mult` branch: `hasHealth.hpRegen *= (1 + recoveryMult)`.
- `server/src/systems/defense/regen/healing.ts` → `applyHealToPlayer()` — scale
  `amount` by `(1 + player.usesSkills.passives['core.recovery-mult'])` **before**
  the antiheal multiplier, so antiheal still counters it.

This single funnel covers regen burst, in-combat regen, ramp regen, kill burst,
`guard.heal-on-fire-pct`, ability heals and the post-cheat-death HoT. Leave
`applyHealToMinion` untouched — minion sustain is the summoner's budget.

### B3. `core.elite-damage-mult` — Duelist

New file `server/src/systems/combat/cores.ts`, registered from `combatBootstrap.ts`
(the only legal place to register combat listeners):

```
onHit: attackerType === 'player' && defenderType === 'monster'
  -> look up the monster def; if (def.elite || def.isBoss)
     ctx.damage = round(ctx.damage * (1 + core.elite-damage-mult))
```
`elite?: boolean` and `isBoss?: boolean` already exist on monster defs
(`shared/src/data/monsters/types.ts:271,279`). No data authoring needed.

### B4. `core.onhit-mult` — Catalyst

One edit. `server/src/systems/combat/engine/combat.ts` (~L281–288) adds the on-hit
term **after** plating and DR are applied:

```
ctx.damage  = max(0, attack − plating × platingMult) × (1 − dr)   // mitigated
ctx.damage += round(onHitDamage × onHitMult)                      // unmitigated
```

Fold `core.onhit-mult` into the existing `onHitMult` (which the reload Alternating
Cadence listener already writes via `ctx.metadata.onHitDamageMult`), so the two
compose instead of racing.

Because the on-hit term bypasses plating and DR entirely, this is a genuinely
independent axis from `core.attack-mult` — that is the whole reason it works as a
core and DoT potency did not.

**Known limitation, accepted:** `onHitDamage` is carried by only two weapon
lineages today (one forest T2 weapon, and the jungle rapier chain across T2/T3/T4)
plus a few T4 class-spec passives. Catalyst is therefore **weapon-gated, not
class-gated** — any of the six classes can opt in by wielding an on-hit weapon,
but few builds currently do. Structurally the same accepted tradeoff as the
Bruiser/Scout mobility clause. Widening the on-hit weapon pool is a data-only
change in the weapon recipes and belongs to the balance pass, not this plan.

### B5. Debuff scaling — Controller

The expensive one. 69 `applyStatusEffect` call sites, no chokepoint, and most of
them are not debuffs at all (class resource clocks, self-buffs, monster-applied
effects). A blanket multiplier would corrupt all three.

**New `shared/src/systems/debuffScaling.ts`** — an explicit registry naming which
effect ids a core may scale and which of their `data` fields count as "potency".
Same fencing pattern as `TECHNIQUE_POWER_FIELDS` in `shared/src/abilities.ts`:

```ts
export const SCALABLE_DEBUFFS = {
  'vulnerability':   ['damageMultiplier'],
  'expose-weakness': ['damageTakenPct'],
  // ...duration-only entries author an empty field list
} as const satisfies Record<string, readonly string[]>;

export function scaleDebuffConfig(
  cfg: StatusEffectConfig,
  durationMult: number,
  potencyMult: number,
): StatusEffectConfig
```

**New `server/src/systems/classes/shared/applyPlayerDebuff.ts`** —
`applyPlayerDebuff(player, targetState, config)` reads the two core passives,
runs `scaleDebuffConfig`, then calls `applyStatusEffect`. Player→monster debuff
sites migrate to it; everything else keeps calling `applyStatusEffect` directly.

**Registry starting set** (enumerate exactly during implementation by walking the
player→monster call sites — do not trust this list without checking each id):
vulnerability, expose-weakness, brittle armour-shred, DR shatter, slow, root,
chill, frostbite, reload suppressing-fire shred, cadence plating shred, summoner
acid corrosion.

Two rules for the registry:
- **Never** scale an effect whose duration is load-bearing for a class's own
  timing (resource clocks, paired stack timers).
- **Never** route a monster→player or self-buff application through this helper.

`totalMs` must still be stored in effect data for slow/root so the buff-UI clocks
stay correct after scaling (`CLAUDE.md`, Data Authoring).

### B6. Mobility clauses — Bruiser and Scout

- **Scout** — `server/src/systems/player/abilities/abilityCooldowns.ts` →
  `techniqueCooldownMs()`. If `ability.tags?.includes('mobility')`, add
  `core.mobility-cooldown-reduction-pct` to the reduction *before* the existing
  `CD_REDUCTION_CAP` 0.9 clamp, so the cap still holds when stacked with
  `technique.cooldown-reduction-pct`.
- **Bruiser** — `onKill` listener in the same new `combat/cores.ts`. Cooldowns are
  stored as **remaining ms** and ticked down (`getCooldown`/`setCooldown` on
  `TracksCombat`), so a refund is one subtraction:
  `setCooldown(cs, key, remaining - ability.cooldownMs * refundPct)`.
  Walk `equippedAbilities.techniques`, act on entries tagged `mobility`.

**Known limitation, accepted:** Charge is the only ability tagged `mobility` today
(`shared/src/abilities.ts:392`). Both clauses are inert without it. Both cores keep
a substantial always-on stat base so neither is ever a dead slot, and both clauses
broaden for free as abilities Waves 2–3 add mobility abilities.

---

## Phase C — The cast

Delete all five recipes from `shared/src/data/recipes/forest.recipes.ts`
(`forest-core-bastion`, `-bastion-2`, `-sniper`, `-arcanist`, `-universal`).

Safe: the equipment loop at `shared/src/systems/stats.ts:213` already does
`if (!def) continue;` for unknown ids. **Add** a hydrate-time sweep in
`server/src/db/playerRepo.ts` that strips inventory/equipment ids missing from
`ITEM_DATABASE`, so a dead id can't sit in a slot rendering blank.

### Placement

Verified against `biomeLevelCap(playerTier, group) = (playerTier − startTier + 1) × 6`.
Every T3 core below is unreachable at player tier 2 and reachable at tier 3 —
i.e. exactly when the player picks a range.

**T2 — unrestricted starters** (`tier: 2`)

| Core | Biome | Level | Cost | Effects |
|---|---|---|---|---|
| **Tempered** | plains | 7 | 45 yellow + 1 volatility | `attack-mult 0.09`, `maxhp-mult 0.09` |
| **Survivalist** | forest | 7 | 45 green + 1 blight | `recovery-mult 0.20`, `maxhp-mult 0.10` |
| **Force** | cave | 8 | 45 red + 1 predation | `attack-mult 0.13`, `maxhp-mult −0.07` |

**T3 — melee** (`tier: 3`, `coreEligibility: 'melee'`)

| Core | Biome | Level | Cost | Effects |
|---|---|---|---|---|
| **Juggernaut** | mountain | 13 | 110 blue + 3 brutality | `maxhp 0.25`, `plating 0.32`, `dr-layer 0.12`, `attack-speed −0.20`, `speed −0.07` |
| **Bruiser** | jungle | 7 | 110 green + 3 brutality | `attack 0.20`, `maxhp 0.15`, `speed 0.12`, `mobility-refund-on-kill 0.40` |
| **Duelist** | cave | 13 | 110 red + 3 predation | `attack 0.12`, `maxhp 0.10`, `elite-damage 0.15` |

**T3 — ranged** (`tier: 3`, `coreEligibility: 'ranged'`)

| Core | Biome | Level | Cost | Effects |
|---|---|---|---|---|
| **Sniper** | desert | 7 | 110 yellow + 3 predation | `attack 0.26`, `maxhp −0.20`, `plating −0.15` |
| **Scout** | tundra | 1 | 110 blue + 3 alacrity | `attack 0.14`, `speed 0.16`, `mobility-cooldown-reduction 0.20`, `maxhp −0.15` |

**T3 — unrestricted specialists** (`tier: 3`, `coreEligibility: 'unrestricted'`)

| Core | Biome | Level | Cost | Effects |
|---|---|---|---|---|
| **Arcanist** | mountain | 15 | 90 blue + 2 volatility | `technique.cooldown-reduction-pct 0.18`, `technique.power-pct 0.08` |
| **Controller** | swamp | 13 | 90 purple + 2 blight | `debuff-duration-mult 0.25`, `debuff-potency-mult 0.12` |
| **Accelerant** | forest | 13 | 90 green + 2 alacrity | `attack-speed 0.25`, `attack −0.12` |
| **Catalyst** | volcanic | 1 | 90 red + 2 volatility | `onhit-mult 0.28`, `attack −0.12` |

Essence colours follow the biome (plains/desert yellow, forest/jungle green,
mountain/tundra blue, cave/volcanic red, swamp purple). Catalyst families are the
post-Stage-A combat families (alacrity / brutality / blight / volatility / predation).

Nine biomes carry twelve cores; forest, cave and mountain carry two each (one T2,
one T3), which also gives those biomes a reason to be revisited at T3.

---

## Phase D — Presentation

- `client/src/ui/crafting/itemDisplay.ts` (~L491–504) — the `coreMults` table needs
  the renamed and new keys, each with a readable line. `core.dr-layer-pct` keeps
  its "separate multiplicative layer" explanation; the two debuff keys and
  `core.dot-mult` need one too.
- `client/src/ui/crafting/MakeTab.tsx` — replace the range copy with eligibility
  copy: "Melee builds only" / "Mid or Far range" / "Any range".
- `client/src/ui/inventory/EquipmentSlots.tsx` — inactive tooltip becomes
  "Inactive — needs a melee build" / "needs a ranged build".
- `client/src/ui/inventory/StatSheet.tsx` — same label change.
- Stat help text — the seven old core keys are documented there; update to the new set.

---

## Phase E — Tests

Repo style: plain `tsx` scripts constructing a real `World`, hand-rolled `assert`,
trailing `console.log("<name>: ok")`. Run with
`pnpm --filter @mmo-idle/server exec tsx --conditions=development test/<file>`.

Rewrite:
- `server/test/coreRangeGate.test.ts` — the 3-way matrix against **real full
  range-node ids**. Keep the assertion that a bare `'close'` must not match; that
  is what caught the original regression.
- `server/test/cores.test.ts` — eligible core contributes, ineligible contributes
  nothing (no positives *and no tradeoffs*), passives don't linger across rebuilds.

New wiring smoke tests (component presence / state transition / no throw — not
balance numbers):
- `coreAuthoring` — every core recipe declares `coreEligibility`; no non-core does;
  every core is reachable at its intended player tier and **not** the one below.
- `coreRecovery` — `core.recovery-mult` scales both the regen stat and a heal
  through `applyHealToPlayer`.
- `coreEliteDamage` — elite/boss take more, normal monsters take base.
- `coreOnHit` — `core.onhit-mult` scales the on-hit term and **not** the mitigated
  term; composes with `ctx.metadata.onHitDamageMult` rather than overwriting it;
  a build with `onHitDamage: 0` is unaffected.
- `coreDebuffScaling` — a registered debuff scales duration and its listed potency
  field; an unregistered effect is untouched; a monster-applied debuff is untouched.
- `coreMobility` — mobility-tagged technique cooldown shortens; on-kill refund
  reduces remaining cooldown; a non-mobility technique is unaffected.

Also update `server/bench/balance/progression.ts` (`coreScore`, `pickCore`) and
re-run `pnpm bench:balance` — the bench already dresses bots in cores, so the new
cast feeds it for free. `pnpm typecheck` and `pnpm test` must both be green.

---

## Phase F — Docs

- Rewrite `docs/cores-current-state.md`. It currently describes the state *before*
  Step 9 ("There is no core system") and is stale twice over.
- Update `docs/system-rework-status.md` scoreboard.
- Leave both `design_docs/CORE_*.md` in place — they are the living design source,
  not shipped plans. Archive **this** file once the work lands.

---

## Why there is no DoT core

`CORE_CAST_REVIEW_DRAFT.md` lists an **Affliction Core** (+20–30% DoT potency or
duration) as a T3 unrestricted specialist. It was cut during planning. The reason
is worth recording, because the core reads perfectly sensible on paper:

`computeDotClassDamagePerStack` takes `attacker.dealsDamage.attack` — the **final**
stat, after the core multiplier pass. So:

```
DoT per stack  ∝  attack × conversionPct × dotMechanicMultiplier × tickMs / maxStacks
```

**`core.attack-mult` already scales DoT damage linearly.** A DoT potency core is
therefore a second multiplier on a quantity another core already multiplies, and it
can only land in one of two bad places:

- Sized within the design doc's band, it loses to plain attack cores. At the drafted
  `dot-mult 0.25 / attack −0.12` it yields 0.88 × 1.25 = **+10%** DoT damage, versus
  **+26%** from the Sniper Core and **+13%** from the T2 Force Core at half the
  price. A trap, not a specialisation.
- Sized to win (≈ +50%, no penalty), it becomes the mandatory pick for every DoT
  build — the pigeonholing the roster is meant to avoid — and has to be balanced
  against every attack core across two separate DoT engines.

Related trap in the same formula: `dot.max-stacks` sits in the **denominator**, so
total damage at full stacks is `attack × conv × mult × tick` regardless of stack
count. Stacks are a ramp-shape lever, not a damage lever. A "more stacks" core would
do nothing.

The genuinely DoT-only axes are **duration** (pressure that persists through target
switches and kills) and **conversion** (shifting damage out of the direct hit into
the DoT). Both are viable future cores; neither is a damage multiplier. If a DoT
core is revisited, start there — not at potency.

## Deferred (explicitly out of scope)

| Item | Why |
|---|---|
| T4 cores (Amplifier, Heavy, Advanced Survivalist) | Amplifier needs a buff-potency layer that does not exist in any form — there is no unified buff magnitude field. Heavy is cheap and could be pulled forward if wanted. Catalyst was promoted into T3 (see above). |
| Affliction / DoT core | Cut — see "Why there is no DoT core". Revisit on the duration or conversion axis, never on potency. |
| All evolution branches (~60 recipes) | Base cast first; branch identities are worth choosing after the base cores have been played. |
| Same-target amplification (Duelist evolutions) | Needs per-target combat state. |
| Distance-band damage (Sniper *Longshot*) | Needs a distance read at hit time. |
| Taunt / threat cores (Juggernaut *Warden*) | **No taunt system exists** beyond the `taunt-current-target` rune; `monsterDatabase` types call it a "future taunt hook". |
| AoE, summon and party core families | Deferred by the philosophy doc §13 until those systems mature. |
| Core icons | Own PixelLab pass; 12 reused charm icons until then. |
| Final balance numbers | User's pass, edited directly in the recipe files. |
