# Abilities Evolution — Implementation Plan

**STATUS: Wave 1 SHIPPED (2026-07-24).** Waves 2–3 not started.

Wave 1 delivered the whole engine plus the T2 trio: ordered multi-slot loadouts with
priority arbitration, per-ability cooldowns, per-slot Guard buffs, the player cast
lifecycle, `TECHNIQUE_KEYS` itemization with the tier-deepening/Technique-Power seam, the
reposition and reflect primitives, slot-2 rune channels + `target-elite`, the T1 biome
re-key, and Bramble Guard / Charge / Charged Strike. Typecheck clean, `pnpm test` 34/34
(5 ability suites added). Live state: `docs/abilities-current-state.md`.

Deliberately **not** done in Wave 1: icon art for the T2 trio (manifest entries drafted,
not generated — see §8 O7), and evolution-lineage presentation (no lineage has a second
form until Whirlwind lands in Wave 2).

- **Design baseline:** `design_docs/abilities-evolution-plan-updated.md` (user-authored, external LLM).
  That doc owns *what* the system should be. This doc owns *how* and *in what order*.
- **Live state:** `docs/abilities-current-state.md` (Step 7 + Step 8). Partly stale — see §1.3.
- **Scope shape (user decision):** engine machinery first with the T2 trio as worked content, then
  T3 and T4 as content waves on stable machinery. Mirrors how Steps 6–11 shipped.

---

## 1. Audit — design doc vs. shipped code

### 1.1 Confirmed accurate

| Design-doc claim | Verified |
|---|---|
| Two equipped fields: one `technique`, one `guard` | ✅ `EquippedAbilities` in `shared/src/abilities.ts:107` |
| Five existing abilities | ✅ Sweep, Brace, Cleanse, Expose Weakness, Second Wind (`shared/src/abilities.ts:118`) |
| Unlocks tied to Biome Mastery | ✅ `AbilityRecipe.recipeGroup` + `requiredBiomeLevel`, `isAbilityRecipeUnlocked` (`shared/src/abilityRecipes.ts`) |
| `GUARD_KEYS` guard-side itemization exists | ✅ 4 keys in `shared/src/passives.ts:507`, read only in `abilityFiring.ts` |
| No Technique-side itemization | ✅ nothing exists |
| Monster charged-attack lifecycle is proven | ✅ `MonsterDefinition.chargedAttack` (`shared/src/data/monsters/types.ts:538`), state machine inline in `server/src/systems/combat/engine/combat.ts:1058`, helpers `beginCharge`/`completeCharge`/`abortMonsterCast` in `engine/monsterMechanics.ts`, client bar in `client/src/render/castBars.ts` |
| Player channeling exists but is not the ability system | ✅ `isChanneling` component, cooldown-T3 Channeled Beam; it's a tick-driven beam, not a wind-up→resolve shape |
| Runes decide *when*, abilities decide *what* | ✅ `fire-technique` / `fire-guard` actions on dedicated `TECHNIQUE` / `GUARD` channels |
| A Mountain trigger can react to an enemy charged attack | ✅ `target-casting` condition already exists **and is already allowed on `fire-guard`** — Parry is directly supported with zero rune work |
| Abilities are class-agnostic today | ✅ all five are |
| Reusable lineage concepts exist | ✅ `lineageId` / `evolvesFrom` on gear recipes (`docs/gear-evolution-current-state.md`) — the naming is reusable, the *semantics* are not (gear consumes the predecessor; abilities must not) |

### 1.2 Corrections and gaps the design doc does not account for

These are the real cost drivers.

1. **The rune trigger layer is much thinner than the doc assumes.** There are exactly two ability
   rune actions, each **single-claim on its own channel**. With two Technique slots, one
   `fire-technique` rune cannot drive both independently — the doc's whole "narrow trigger per slot"
   payoff (§4.4, §5) does not work without new rune plumbing. Available conditions today:
   - `TECHNIQUE`: `in-combat`, `before-empowered`, `n-aggro-3`
   - `GUARD`: `in-combat`, `hp-below-25`, `has-debuff`, `target-casting`, `n-aggro-3`
   - There is **no "target is elite" condition** (an elite-focus *action* exists, but not the
     condition), which the doc leans on to differentiate Expose Weakness from Stun Strike.

2. **Guard buffs collide at two slots.** Every Guard boon writes the single status effect
   `ABILITY_GUARD_EFFECT_ID` (`"ability-guard"`), and the buff descriptor labels it by reading
   `equippedAbilities.guard` (`abilityBuffs.ts:26`). Two DR Guards would overwrite each other and
   mislabel. `BUFF_IDS` (`shared/src/components/combat/buffs.ts:5`) is a fixed const list, and
   status-effect `data` is `Record<string, number>` only — so the ability identity **cannot** live in
   effect data. It has to live in the effect id.

3. **Cooldowns are per-slot, not per-ability.** `ability.technique.cd` / `ability.guard.cd` are two
   fixed scratch keys. Two slots need per-ability keys.

4. **No player-side cast infrastructure.** The monster lifecycle is monster-only and is driven inline
   inside `combat.ts`'s monster loop; it is not a reusable module. `castBars.ts` renders monster casts
   only. Charged Strike needs a new player component + tick driver + node events + client bar.

5. **No numeric tier deepening mechanism at all** (design §4.1). `AbilityDef` has no tier field and
   effect magnitudes are flat constants.

6. **Detonate / Contagion sit on a DoT model that cannot express "caster-owned".** Player DoT on a
   monster is a **single non-instanced** `DOT_EFFECT_ID` status effect with **one** `sourceId`, applied
   only by the DoT class root (`appliesDots`) — `server/src/systems/classes/archetypes/dot/dotPrototype.ts:344`.
   In a party the last applier owns it. Resolved by user decision (§2).

7. **No reflect/thorns infrastructure** for Bramble Guard. Confirmed: the only "thorn" hits in the
   repo are item names and art manifests. This is the single largest net-new mechanic in Wave 1.

8. **Chill/slow is not a general primitive.** `applyMonsterSlow` and the chill/freeze status live
   inside the DoT-T3 frost path (`archetypes/dot/t3/ticks/chillFreeze.ts`). Frost Bite needs it lifted
   out. Stun, by contrast, *is* general (`combat/status/stun.ts`) and is already honored by the
   monster charged-cast interrupt — Stun Strike is cheap.

9. **Name collision: "Frenzy".** The DoT T3 path already ships a buff named Frenzy
   (`dot-frenzy` in `BUFF_IDS`, `FRENZY_UNLOCK_TIER`). The T4 Guard needs a different name or the
   existing buff needs a relabel.

10. **`Expose Weakness` has the legacy id `heavy-strike`.** Cosmetic, but `knownAbilities` persists
    ids, so renaming needs a hydrate-time remap.

11. **Reload already silently picks a semantic.** `hasArmedAbility` is detached on the first landed
    `onHit`, so a Technique applies to bullet 1 only. That is *a* valid answer to design §12, but it
    is currently implicit and unauthored.

### 1.3 Stale statements in `docs/abilities-current-state.md`

Fix these when Wave 1 lands (code wins per CLAUDE.md):

- Claims Second Wind's trigger is `hp-below 0.35`. Code says `{ kind: "in-combat" }` plus an
  HP-below-max gate in `guardEffectCanFire` (`abilityFiring.ts:256`).
- Claims Brace is 40% for **5 s**, cd **8 s**. Code says 3000 ms, cd 7000 ms.
- Claims Sweep/Brace are the "forest worked pair" — still true today, but Wave 1 re-keys them.
- Says "Heavy Strike has no client FX tag". It now stamps `ABILITY_TECHNIQUE_FIRED_FX`.

---

## 2. Decisions locked this session

| # | Decision |
|---|---|
| D1 | **Staging:** engine first + T2 trio as worked content (Wave 1); T3 roster (Wave 2); T4 roster (Wave 3). Reuse what Step 7/8 already built — this is an extension, not a rebuild. |
| D2 | **Detonate/Contagion:** keep them class-agnostic in definition but **inert without DoTs**. Broaden what counts to *any player-sourced damage-over-time on the monster* (class DoT, weapon venom/burn procs), so non-DoT builds reach them through gear. **No DoT-instancing rework.** Party ownership stays best-effort (single `sourceId`). |
| D3 | **Player cast interrupts:** hard CC only (stun, freeze). Normal attacks are suppressed during the wind-up, **auto-movement continues** so casting never fights autocombat pathing. Target death / leaving the node aborts the cast harmlessly (no cooldown burn). |
| D4 | **T1 biomes re-keyed** to the design doc's table: Sweep→Plains, Second Wind→Forest, Brace→Mountain, Cleanse→Swamp (unchanged), Expose Weakness→Cave. Safe: `knownAbilities` stores ability ids, so nobody loses a learned ability. |

---

## 3. Architecture decisions this plan commits to

Each of these resolves a §1.2 gap. They are proposals until Wave 1 starts; flag disagreement early
because later steps build on them.

**A3.1 — Equipped representation becomes ordered lists.**
`EquippedAbilities` goes from `{ technique: string | null; guard: string | null }` to
`{ techniques: string[]; guards: string[] }`, mirroring `EquippedRites`. **List order is arbitration
priority** (index 0 first) — that satisfies design §7.1's "explicit and deterministic priority" with
no new field, and makes reordering in the UI a real build decision. Length ≤ slot count.
Migration is a normalize in `playerRepo` hydrate (`{technique, guard}` → arrays) — **no SQL
migration**, the column is whole-slice JSON.

**A3.2 — Slot count is a pure function of `playerTier`.**
`abilitySlotCount(playerTier): { technique: number; guard: number }` in `shared/src/abilities.ts`,
exactly mirroring `riteSlotCount` (`shared/src/rites.ts:44`). T1–T2 → 1/1, T3 → 2/1, T4+ → 2/2.
Projected on `PlayerView` as `abilitySlots` alongside the existing `riteSlots`. Global Mastery is
deliberately not consulted (design §3.1).

**A3.3 — `ability:setLoadout` carries the whole loadout.**
Rather than `(slot, abilityId)`, the intent sends the full `EquippedAbilities`; the server validates
known / slot-type / within-slot-count / no-duplicates. Makes reordering (= re-prioritising) one
round trip and removes index-shuffling edge cases.

**A3.4 — Per-ability cooldown keys.**
`ability.cd.<abilityId>` on `TracksCombat` replaces the two fixed keys. Technique cooldown reduction
(new stat) and `guard.cooldown-reduction-pct` (existing) both apply at set time.

**A3.5 — Guard buffs get one status id and one descriptor per slot index.**
`ability-guard` (slot 0) and `ability-guard-2` (slot 1), both added to `BUFF_IDS`; each descriptor
labels itself from the ability in *its* slot. Two entries covers the locked 2-Guard ceiling; if a
third slot ever lands, add a third. This is the only shape compatible with the fixed `BUFF_IDS` list
and the numbers-only status `data` rule.

**A3.6 — Technique arbitration channel = existing components.**
`hasArmedAbility` (armed) plus a new `isCastingAbility` (casting/resolving) are **mutually exclusive
and singular**. `updateAbilityFiring` walks equipped techniques in priority order and fires the first
eligible one only if neither component is present. That is design §7.1 with no new machinery.

**A3.7 — Guard activation window = a short shared gate.**
A `ability.guard.window` cooldown key (~one tick) set whenever any Guard fires. Already-active Guard
buffs are untouched, so Ward + a later Brace layer correctly (design §7.2), but no combo-dump.

**A3.8 — New offensive stat namespace `TECHNIQUE_KEYS`** in `shared/src/passives.ts`, riding the
existing equipment `mechanicEffects → usesSkills.passives` pipeline (no new state, no migration —
the same trick Step 8 used for `GUARD_KEYS`):
- `technique.power-pct` — scales explicitly opted-in offensive payloads only
- `technique.cooldown-reduction-pct`
- `technique.cast-speed-pct` — only reduces real `castTime`
Carried by **weapons/offensive gear**. Guard potency stays on the recovery slot. No universal
"ability damage" stat (design §3.3, §6.2).

**A3.9 — Technique Power opts in per effect field.**
Each `AbilityEffectSpec` variant declares which of its fields Technique Power touches, in one small
table rather than a blanket multiplier. Damage/splash/burst scale; stun duration, movement distance,
slow percent and radii do not (design §6.2).

**A3.10 — Numeric tier deepening is authored per ability.**
`AbilityDef` gains `tier: number` (home tier) and `scalePerTierPct?: number`. Effective magnitude =
`base × (1 + scalePerTierPct × max(0, playerTier − tier))`, applied to **magnitude fields only** via
the same opt-in table as A3.9. Same ability id, same form — the UI can show a rank. Numbers are the
user's balance pass.

**A3.11 — Ability evolution ≠ gear evolution.**
`AbilityDef.lineageId?` groups a family; `AbilityRecipe.requiredAbilityId?` means "must already know
X to learn this". The predecessor is **never consumed and stays equippable** (design §4.2). No
`reconstruct` path. The Abilities panel groups by lineage.

**A3.12 — Multi-hit (Reload) semantics become explicit.**
A per-effect-kind mode — `first-hit` (default, = today's behaviour) or `distribute` (payload split
across the magazine) — authored in one table. Stun, casts, and DoT-spread are hard-coded
`first-hit`; only scalar payloads are eligible for `distribute` (design §12).

**A3.13 — Per-slot rune channels.**
Add channels `TECHNIQUE_2` / `GUARD_2` with actions `fire-technique-2` / `fire-guard-2`, following
exactly how `STANCE` was added in Step 10. Keeps `EquippedRule`'s `{conditionId, actionId}` shape and
needs zero protocol churn. ⚠️ Slightly inelegant — see §8 O1 for the alternative.

---

## 4. Wave 1 — engine + T2 content — ✅ SHIPPED

Goal: every mechanism the T3/T4 rosters need exists and is proven by three shipped abilities.
Nothing here should require rework in Waves 2–3.

**Deviations from the plan as written, and why:**
- **A `cast-strike` effect kind was added** (W1.5/W1.10). The plan assumed Charged Strike
  could reuse `empower`, but `empower` means "the next attack hits harder" — a cast has no
  triggering attack to ride. A distinct kind keeps the semantics honest and gives the
  future T4 AoE cast a `radius` to grow into.
- **Cooldown helpers live in a third file** (`abilityCooldowns.ts`). `abilityFiring` needs
  `beginAbilityCast` and `abilityCasting` needs the cooldown helpers; splitting the shared
  pair out avoids an import cycle.
- **The client fired/cooldown atoms are keyed by ABILITY ID**, not slot kind (W1.11). The
  plan didn't call this out, but with two Techniques equipped a slot-kind key pulses
  whichever tile happens to be first. The consuming-hit pulse consequently moved to the
  armed-entry teardown — the only place the consumed ability's identity is known.
- **Guard DR stacks multiplicatively**, which the plan left open. Additive stacking reaches
  the 0.9 cap far too easily and would make a second Guard strictly the best pairing.
  Knockback resist takes the best slot instead of stacking, for the same reason.
- **Bramble reflect reuses the `proc` world-log damage type** rather than widening
  `WorldLogDamageType`, so existing log filters keep working.

### W1.1 — Shared schema + slot model
`shared/src/abilities.ts`, `shared/src/abilityRecipes.ts`, `shared/src/components/core/networkedSlices.ts`, `shared/src/protocol/views.ts`
- `EquippedAbilities` → ordered lists (A3.1); `emptyEquippedAbilities()` returns `{techniques: [], guards: []}`.
- `abilitySlotCount(playerTier)` (A3.2); `abilitySlots` on `PlayerView`.
- `AbilityDef` gains `tier`, `scalePerTierPct?`, `lineageId?`, `shape` (`armed | cast | reposition | guard`), `castMs?`.
- `AbilityEffectSpec` union stays the extension point; add the A3.9/A3.12 tables next to it.
- `AbilityRecipe` gains `requiredAbilityId?`.
- **Done when:** shared typechecks and the five existing abilities are expressible unchanged.

### W1.2 — Persistence, protocol, admin
`server/src/db/playerRepo.ts`, `server/src/index.ts`, `shared/src/protocol/socketEvents.ts`, `shared/src/protocol/admin.ts`, `admin/src/tabs/CharactersTab.tsx`, `server/src/admin/gameActions.ts`
- Hydrate-time migration `{technique, guard}` → lists; drop unknown/over-cap entries via `validAbilityIds`.
- Optional: remap legacy id `heavy-strike` → `expose-weakness` at hydrate (§1.2 #10).
- `ability:setLoadout` carries the whole loadout (A3.3).
- **Done when:** an existing save with the old shape loads, keeps its two abilities, and re-saves in the new shape.

### W1.3 — Per-ability cooldowns + priority firing
`server/src/systems/player/abilities/abilityFiring.ts`
- Per-ability cooldown keys (A3.4); walk `techniques` / `guards` in priority order.
- Technique arbitration via `hasArmedAbility` + `isCastingAbility` mutual exclusion (A3.6).
- Guard activation window (A3.7).
- **Test:** two Techniques equipped, both conditions true → exactly one arms; the loser arms on the following window. Two Guards → only one activates per window, but both buffs coexist if staggered.

### W1.4 — Guard buffs per slot
`server/src/systems/player/abilities/abilityBuffs.ts`, `abilityEffects.ts`, `shared/src/components/combat/buffs.ts`
- Two status ids / two descriptors (A3.5); the `onDamageTaken` reader sums both, still capped at `GUARD_DR_CAP` 0.9.
- **Test:** two DR Guards active simultaneously show as two distinct buff tiles with correct labels and clocks, and the DR cap holds.

### W1.5 — Player cast lifecycle
new `server/src/systems/player/abilities/abilityCasting.ts`; `server/src/ecs/entity.ts`, `server/src/systems/combat/engine/combat.ts`, `shared/src/protocol/combatEvents.ts`, `client/src/render/castBars.ts`, `client/src/render/state.ts`, `client/src/render/combatFx.ts`
- Server-only `isCastingAbility { abilityId, endsAt }`. Begin → suppress normal attacks (same seam as the existing `isChanneling` check at `combat.ts:944`) → resolve on tick → cooldown.
- Interrupt on player stun/freeze; abort on target loss / node change with no cooldown burn (D3). Movement continues.
- `player-cast-start` / `player-cast-end` node events; extend `castBars.ts` to render player casts.
- `technique.cast-speed-pct` shortens `castMs`.
- **Test:** cast completes and applies its payload; a stun mid-cast aborts it and no payload lands; the player keeps moving throughout.

### W1.6 — Technique offensive stats
`shared/src/passives.ts`, `server/src/systems/player/abilities/abilityEffects.ts`, item data
- `TECHNIQUE_KEYS` (A3.8) folded into `PassiveKey` + `ALL_PASSIVE_KEYS`.
- Opt-in payload scaling (A3.9) + tier deepening (A3.10) applied at one shared resolve seam so every
  future ability inherits both.
- Seed one weapon per relevant biome with a `technique.*` modifier (magnitudes = placeholder).
- **Test:** with `technique.power-pct` equipped, Sweep's splash rises and Expose Weakness's *duration* does not.

### W1.7 — Reposition primitive
`server/src/systems/combat/damage/knockback.ts` (+ ability effect kinds)
- `applyPlayerKnockback` already exists (used by the Reload blunderbuss recoil). Add a toward-target
  dash for Charge; Disengage uses the away-from-target direction directly.
- **Test:** Charge closes distance to the current target and does not tunnel through node obstacles.

### W1.8 — Reflect / temporary hardening primitive (largest net-new)
new listener alongside `abilityEffects.ts`; `server/src/systems/combat/damage/effectivePlating.ts`
- `onDamageTaken` reflect: while the buff is active, deal flat damage back to a **monster** attacker,
  credited to the player through the normal damage-recording path.
- Temporary plating/hardening rides the existing plating seam rather than a new stat.
- **Test:** reflect fires only on monster melee/ranged hits (not DoT ticks, not self-damage), credits kills correctly, and cannot loop.

### W1.9 — Rune plumbing for slot 2
`shared/src/runeDatabase.ts`, `server/src/systems/combat/ai/runeConfig.ts`, `client/src/ui/BuildRunesTab.tsx`
- `TECHNIQUE_2` / `GUARD_2` channels + actions (A3.13), added to `STARTER_RUNE_IDS` like their siblings.
- New condition **`target-elite`** so Expose Weakness and Stun Strike can be given genuinely different
  narrow triggers in Wave 2 (elite detection already exists behind `focus-elites`).
- **Test:** a `fire-technique` and a `fire-technique-2` rune drive their own slots independently.

### W1.10 — T1 re-key + T2 content
`shared/src/abilityRecipes.ts`, `shared/src/abilities.ts`, `art/manifests/ability-icons.json`
- Re-key the five T1 recipes per D4; give Plains its Sweep recipe.
- **Bramble Guard** (Guard, Jungle) — temporary hardening + flat reflect. Exercises W1.8.
- **Charge** (reposition Technique, Desert) — close distance, empowered strike. Exercises W1.7.
- **Charged Strike** (casted Technique, Mountain, T2 biome-level band) — exercises W1.5 + W1.6.
- Note: T2 abilities in T1-native biomes (Mountain) gate on the **T2 level band** —
  `BIOME_LEVELS_PER_TIER = 6`, so T2 content sits at mountain levels 7–12. No new gating concept needed.
- Icons: three new entries in the ability-icons manifest → generate → **hand off to the gallery for the
  user to accept** (never self-accept; see the PixelLab review rule).

### W1.11 — Client UI
`client/src/ui/AbilitiesPanel.tsx`, `client/src/hud/AbilityBar.tsx`, `client/src/ui/BuildPanel.tsx`, `client/src/hud/atoms.ts`, `client/src/hud/systemVisibility.ts`
- Panel: N Technique + M Guard slots from `abilitySlots`, drag/reorder = priority, lineage grouping,
  "learn requires X" for evolution recipes.
- Bar: render N+M tiles; per-ability cooldown sweep (now server-truthful via per-ability keys);
  cast progress on the casting tile.
- **Done when:** a T2 character sees 1+1, a T3 character sees 2+1, and nothing renders a stale slot after a tier-up.

### W1.12 — Verify
`pnpm typecheck`, `pnpm test`, new tests in `server/test/` alongside the four existing `ability*.test.ts`.
Refresh `docs/abilities-current-state.md` (including the §1.3 stale entries) and tick
`docs/system-rework-status.md`.

---

## 5. Wave 2 — T3 roster + second Technique slot

Engine already done; this is content plus two small primitives.

| Ability | Biome | New machinery needed |
|---|---|---|
| **Whirlwind** (armed, Sweep-line evolution) | Volcanic | none — `applyPlayerAoe` + A3.11 lineage |
| **Stun Strike** (armed) | Cave | none — `applyStun` already works on monsters and already interrupts monster casts |
| **Ward** (Guard, absorb) | Tundra | none — `applyShield` |
| **Frost Bite** (armed, stacking chill) | Tundra | **lift `applyMonsterSlow` + chill status out of `archetypes/dot/t3/ticks/chillFreeze.ts`** into a shared monster-control primitive |
| **Parry** (Guard) | Mountain | negate-next-qualifying-hit state + attack-timer reset (`performsAttack.lastAttackAt`); rune side is already free via `target-casting` |
| **Detonate** (cast) | Swamp | DoT cash-out per D2 — consume player-sourced DoT stacks, convert at an authored fraction, **no double-dipping Technique Power on top of the underlying DoT's own modifiers** (design §11) |

Turn on the second Technique slot (`abilitySlotCount` → 2/1 at T3) and confirm the W1.3 arbitration
holds with a real specialist pairing (Expose Weakness on `target-elite` + Whirlwind on `n-aggro-3`).

## 6. Wave 3 — T4 roster + second Guard slot

| Ability | Biome | New machinery needed |
|---|---|---|
| **Fervor** (Guard, tempo) | Volcanic | none — renamed from the design doc's "Frenzy", which collides with the shipped DoT-T3 buff |
| **Disengage** (reposition Guard) | Desert | none — W1.7 |
| **Contagion** (armed, Whirlwind-line evolution) | Wasteland (`graveyard`) | DoT spread per D2; ownership preserved best-effort |
| **Abyssal Ward** (Guard, Ward-line evolution) | Trench | redirect heal → shield at the single `applyHealToPlayer` funnel (the same seam `defense.overheal-shield-pct` already uses) |
| **Weakening Strike** (armed) | TBD — biome pass | new monster **outgoing**-damage debuff read in `runMonsterAttack` (the existing helper is damage-*taken*) |
| **Additional casted Technique** | TBD | none — W1.5; identity still open (design §18.2) |

Turn on the second Guard slot (2/2 at T4) and validate the A3.7 activation window under real layering.

---

## 7. Cross-cutting checklist (every wave)

- Component presence gates behavior — no `castMs: 0` or `null` sentinels.
- Register every combat listener from `initCombatSystems()` so the balance bench matches live.
- Any evaded hit applies no debuffs: new on-hit appliers must early-return on `evadeBlocksDebuffs(ctx)`.
- Slow/root effects store `totalMs` in status data for the buff-bar clock.
- Status-effect `data` stays `Record<string, number>`.
- New static data goes in `shared/src/data/`, not the legacy root shims.
- Each new mechanic ships a wiring smoke test (attach, tick, assert invariants — not balance numbers).
- All magnitudes are placeholders; the user owns the numeric balance pass.

---

## 8. Open items

**~~O1~~ — RESOLVED (user, 2026-07-24).** Ship `fire-technique-2` / `fire-guard-2` actions on their
own channels (A3.13), matching the STANCE precedent. Adding `slot?: number` to `EquippedRule` was the
cleaner long-term alternative but touches the rune protocol, persistence, cost model, and the whole
Build UI for a system the design caps at 2+2. Revisit only if a third slot is ever approved.

**~~O2~~ — RESOLVED (user, 2026-07-24).** Second Wind keeps the shipped `in-combat` trigger gated by
"not at full HP". The current implementation works and the rune layer already lets a player override
the timing. **This is a docs fix, not a code fix** — `docs/abilities-current-state.md` is what's wrong.

**~~O3~~ — RESOLVED.** The T4 Volcanic tempo Guard is named **Fervor**, not Frenzy. The shipped
DoT-T3 `dot-frenzy` buff keeps its name.

**O7 — T2 icon art is drafted, not generated (opened by Wave 1).**
`art/manifests/ability-icons.json` carries `status: "draft"` entries for `bramble-guard`,
`charge` and `charged-strike`, with prompts modelled on the accepted sweep/brace recipe
(including the weapon bans the sweep round proved necessary). They are deliberately NOT in
`abilityIcons.ts`'s approved allowlist, so those abilities render the placeholder tile
until the art is generated and **the user accepts candidates in the gallery**. Generating
spends real API credits — `--dry-run` first.

**O4 — T4 third cast identity** (design §18.2) and **Weakening Strike's biome** (§18.3) stay open
through Wave 2; they only block Wave 3 authoring.

**O5 — Contagion in parties.** Under D2 the spread preserves whatever `sourceId` the DoT already
carries, which in a party is "the last applier", not necessarily the Contagion caster. Acceptable for
now; genuinely fixing it requires the DoT-instancing rework D2 explicitly declined.

**O6 — Expose Weakness id rename** (`heavy-strike` → `expose-weakness`) is optional cleanup. Cheap
during W1.2 while the hydrate path is already being touched; noise if done later on its own.
