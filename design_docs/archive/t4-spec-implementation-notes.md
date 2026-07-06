> **HISTORICAL (archived 2026-07-07).** T4 implementation/tuning notes; T4 shipped. Kept for rationale. Not current.

# T4 (tier-3) Class Spec — Implementation & Tuning Notes

Implementation reference for the T4 specialisation layer (design = "T4", code = `tier: 3`).
Covers all five active classes: Cadence, Cooldown, DoT, Reload, Energy. Summoner is out of scope.

**All numbers below are placeholders** named as constants — lock mechanics first, tune later
(per `t4-spec-designs-reference.md`). This doc tells you *where* every knob lives.

> **Update note:** since the first wiring pass the whole layer went through a rework wave —
> per-tier scaling was standardised, several specs were redesigned (DoT most heavily), and a
> batch of dedicated buffs + client FX landed. The per-archetype tables below reflect the current
> constants; the **Cross-cutting** section documents the systemic conventions that now apply to
> every archetype.

---

## How a spec is wired (so you know what to touch)

A spec flows through three layers:

1. **Node data** — `shared/src/data/skillTree/t3CombatA.ts` (Cadence, Cooldown, Reload)
   and `t3CombatB.ts` (Energy, DoT). Each node has `mechanicEffects: { 'namespace.key': value }`.
   Some placeholder numbers live **inline here** (e.g. multipliers passed as passive values).
2. **Passive keys** — `shared/src/passives.ts`. The `*_KEYS` arrays are the source of truth for
   the `PassiveKey` union. A spec's flag key (`'cadence.rampage'`) and any tuning keys live here.
3. **Server mechanic** — `server/src/systems/classes/archetypes/<class>/t3/…`. Reads passives at
   runtime; most placeholder constants live in that archetype's `core/constants.ts` (or
   `paths/_constants.ts` for DoT). Runtime state lives on the archetype slice
   (`shared/src/components/archetypes/<class>/uses<Class>.ts`).

> **Two places to tune:** (a) the archetype **`constants.ts`** files, and (b) the node
> **`mechanicEffects`** values in `t3CombatA/B.ts`. When a constant has a matching passive key,
> the node value (if present) **wins at runtime** and the constant is the fallback default.

Runtime state slices reset on `recalculatePlayerStats` (re-equip / skill change) — relevant to a
couple of "should persist across a run" specs (flagged below).

---

## Cross-cutting conventions (apply to every archetype)

### Per-tier scaling & the unlock-tier anchor
Path specs are `tier: 3` nodes. Reaching one costs **4 tier-ups** (3 prior tier unlocks + the point
for the node itself), so a path spec first becomes available at **`playerTier 4`**. Every per-tier
scaling constant is anchored there with a `*_UNLOCK_TIER = 4`:

```
tierMult = Math.max(1, playerTier − UNLOCK_TIER + 1)   // 1× at unlock, +1× per tier beyond
```

`playerTier` is **0-indexed** on `tracksProgression` and is **separate** from `currentSkillTier`.
Earlier specs had an off-by-one (anchored at 3, giving 2× on unlock); all anchors are now 4.

Specs that scale a flat value per tier: Cadence **Metronome**, Cooldown **Eternal Cycle**,
Energy **Binary Cycle** (Charge on-hit) and **Energy Upkeep** (on-hit, in
`shared/src/systems/energyUpkeep.ts`), DoT **Frenzy** (on-hit half only) and **Rime Blade**.
Shared gear on-hit (Shockblade, Dualslinger) uses the same `max(1, playerTier − 4 + 1)` form in
`shared/src/systems/stats.ts`. Attack-speed bonuses are intentionally **not** scaled per tier
(the game already has too much AS — see Frenzy/Zealot).

### DoT element + colour system
`shared/src/systems/dotElements.ts` defines `DamageElement`
(`poison | fire | frost | lightning | bleed | doom`) and `dotElementForPlayer(passives, subVariant)`,
shared by server (tagging tick events) and client (FX + colours). `doom` is the purple flavour of the
poison path used by Cultist (eternal-doom).

- **Damage numbers:** client `ELEMENT_STYLE` (`client/src/render/damageNumberStyle.ts`) maps element →
  `{ color, symbol }` (e.g. doom `#9d4dff`/`☠`).
- **Target frame:** the base `dot` status tile is recoloured to the **local player's** element —
  poison green, fire red, frost light-blue, doom purple — in `client/src/hud/TargetFrame.tsx`
  (`DOT_ELEMENT_COLOR`).
- **Tick events:** `pushDotTickEvent(world, monster, element, amount, fx?)` pushes a `dot-tick` combat
  event used as a damage-number style hint (the amount shown is still the HP delta). The optional
  `fx` discriminator (`DotTickFx`, currently `'conflagration'`) requests a dedicated per-tick
  animation beyond the element styling.

### Player buffs (HUD)
The buff bar renders generically from the server-sent `PlayerBuff` (`color` / `label` / `shape` /
`category`), so adding a buff is: (1) add the id to `BUFF_IDS` in
`shared/src/components/combat/buffs.ts`, (2) add a `defineBuff(...)` descriptor to the archetype's
buff list (auto-collected by `buffSync` via `collectMechanicBuffs()`), (3) optionally a
`describeBuff` case in `buffSync.ts` for the world-log string. New since first pass:
`dot-frenzy`, `dot-rimeblade`, `energy-storm`, `cadence-crescendo` (plus the earlier dot-/cooldown-/
reload- buffs).

### Client FX added for T4
`client/src/fx/` gained: `doom.ts` (`fxDoomCloud` on-hit purple smog + `fxDoomTick` void-style
implosion→burst), `poisonExplosion.ts` (billowing green gas, not a sharp blast), `firebrand.ts`
(searing brand flash + sear ring + embers), `conflagrationTick.ts` (large rising flame lick per burn
tick). Wired in `client/src/render/combatFx.ts` (dot attack-FX switch by element, the `dot-tick`
dispatch by element/`fx`, and the `effects[]` loop for one-shots like `poison-explosion` / `firebrand`).

---

## CADENCE  (`…/archetypes/cadence/t3/`)

- **Constants:** `cadence/t3/core/constants.ts` (+ Crescendo ramp in `core/crescendo.ts`)
- **Runtime state:** `shared/src/components/archetypes/cadence/usesCadence.ts`
- **Logic:** `t3/pipeline/{normalHit,empoweredHit}.ts`, `t3/ticks/cadenceState.ts`

| Constant | Value | Spec / meaning |
|---|---|---|
| `AFTERSHOCK_ATTACKS` | 3 | Aftershock — regular attacks that fire on-hit twice |
| `CURSED_FINALE_PLATING_SHRED` | 5 | Cursed Finale — flat plating stripped per finisher |
| `CURSED_FINALE_SHRED_CAP` | 20 | Cursed Finale — hard cap on total shred per target |
| `SWIFTBLADE_EFFECT` | `'swiftblade'` | Swiftblade — client FX tag (dual diagonal slash) |
| `METRONOME_FLAT_BONUS` | 12 | Metronome — flat damage each buildup attack banks (per-tier base) |
| `METRONOME_UNLOCK_TIER` | 4 | Metronome — per-tier anchor |
| `RAMPAGE_MAX_STACKS` | 10 | Rampage — hard cap; next finisher overloads → reset to 0 |
| `RAMPAGE_THRESHOLD_FLOOR` | 2 | Rampage — threshold floor |
| `RAMPAGE_APS_PER_STACK_MS` | 60 | Rampage — attack-cooldown reduction per stack |
| `RAMPAGE_ATK_PEN_PER_STACK` | 0.08 | Rampage — regular-attack damage penalty per stack (frac) |
| `RAMPAGE_MULT_PER_STACK` | 0.15 | Rampage — finisher multiplier bonus per stack (frac) |
| `RAMPAGE_DECAY_INTERVAL_MS` | 8000 | Rampage — OOC: shed 1 stack per interval |
| `VERDICT_BANK_PCT` | 0.30 | Verdict — fraction of each finisher banked into the execute pool |
| `CRESCENDO_RAMP_SECONDS` | 15 | Crescendo — window delivering most of the scaling |
| `CRESCENDO_RAMP_MULT` | 0.4 | Crescendo — bonus across the ramp window (+40%) |
| `CRESCENDO_TAIL_PER_SEC` | 0.01 | Crescendo — infinite post-ramp growth (+1%/s, heavy DR) |
| `MOMENTUM_ECHO_HITS` / `MOMENTUM_ECHO_BONUS` | 5 / 0.5 | Rising Tide (kept) |
| `HEMORRHAGE_TICKS/_TICK_MS/_MULT` | 4 / 1000 / 1.5 | Hemorrhage (kept) |

**Notes / flags:**
- **Verdict** (was "Delayed Verdict") is character-side (`usesCadence`) — banks `VERDICT_BANK_PCT` of
  each finisher into a pool and instantly executes a target whose remaining HP is within the pool
  (no fuse; the old timed-detonation model was replaced).
- **Crescendo** is a time-based infinite scaler: `crescendoMultiplier(combatMs)` ramps to +40% over
  15s then keeps climbing at +1%/s; the cadence tick resets it when combat ends.
- **Rampage** now overloads at `RAMPAGE_MAX_STACKS` (resets to 0 on the next finisher).
- **TODO(engine):** Rampage/Crescendo ramps reset on recalc (slice re-init); design wants them to
  survive a run.
- **TODO:** Aftershock applies the on-hit *damage* twice but does not re-fire on-hit *procs* (DoT/gear).

---

## COOLDOWN  (`…/archetypes/cooldown/t3/`)

- **Constants:** `cooldown/t3/core/constants.ts`
- **Runtime state:** `shared/src/components/archetypes/cooldown/usesCooldown.ts`
- **Logic:** `t3/pipeline/{beforeAttack,normalHit,empoweredHit,postEmpoweredHit}.ts`, `t3/ticks/cooldownState.ts`
- **Frame bases:** `shared/src/data/skillTree/rootsAndFrames.ts` — light 5000ms/1.5×,
  balanced 7000ms/2.0×, heavy 9000ms/3.0×.

| Constant | Value | Spec / meaning |
|---|---|---|
| `OVERDRIVE_BUFF_MS` | 2500 | Overdrive/"Burst" (kept) — buff window |
| `OVERDRIVE_ATTACK_SPEED_PCT` | 1.0 | Overdrive — flat attack-speed buff (+100%) |
| `ETERNAL_CYCLE_FLAT_PER_STACK` | 8 | Eternal Cycle — per-tier base flat per stack on execution |
| `ETERNAL_CYCLE_UNLOCK_TIER` | 4 | Eternal Cycle — per-tier anchor |
| `ETERNAL_CHARGE_DURATION_MS` | 10000 | Eternal Cycle — stack fall-off window |
| `TEMPORAL_INIT_MS/_MAX_MS/_EXTEND_MS/_FLAT_DMG` | 3000 / 4500 / 1000 / 6 | Temporal Extension (kept) |
| `RUPTURE_WINDOW_MS` | 2000 | Rupture — post-execution 50%-bypass window |
| `RUPTURE_WINDOW_PLATING_MULT` | 0.5 | Rupture — plating multiplier during window |
| `RUPTURE_DR_PIERCE` | 0.10 | Rupture — DR pierce (node: `cooldown.rupture-dr-pierce`) |
| `REVERB_BONUS_PER_ATTACK` | 0.04 | Reverb — next-execution bonus per attack landed |
| `PATIENCE_PAID_RAMP_MS` | 7000 | Patience Paid — ramp window |
| `PATIENCE_PAID_ATK_MAX` | 0.50 | Patience Paid — max regular-attack bonus at full ramp |
| `PATIENCE_PAID_EXEC_MAX` | 0.75 | Patience Paid — max execution bonus at full ramp |
| `VENGEANCE_MULTIPLIER` | 1.5 | Vengeance — bonus per point of damage taken |
| `VENGEANCE_FLOOR` | 30 | Vengeance — minimum execution bonus |
| `SINGULAR_EXTRACTION_CD_MS` / `_MULT` | 4000 / 5.0 | Singular Extraction — absolute target (ref) |
| `SINGULAR_NO_TARGET_MS` | 4000 | Singular Extraction — no-target gap before CD resets |
| `BATTERY_ATK_PER_STACK` | 2 | Battery (kept) |
| `BEAM_DURATION_MS/_TICK_MS/_DMG_PER_TICK_MULT` | 3000 / 500 / 1.0 | Channeled Beam (see flag) |

**Notes / flags:**
- Additive execution bonuses live in `postEmpoweredHit.ts` (applied after the execution multiplier).
- **Singular Extraction is delta-based:** node applies `-5000ms` (→4000) and `+2.0×` (→5.0×) on the
  heavy frame. Eternal Cycle sets **no** `empowered-cd-ms` (stays at the frame's value).
- **TODO(engine):** verify Rupture's DR-pierce node hook (`cooldown.rupture-dr-pierce`) is read at
  mitigation time.
- **STUB:** Channeled Beam — constants present; confirm the channel firing mode is production-ready
  before shipping (was a stub at first wiring).

---

## DOT  (`…/archetypes/dot/t3/`)  — most reworked

- **Constants:** `dot/t3/paths/_constants.ts` (cross-path FREEZE/CHILL/CONF etc. in `t3/core/constants.ts`)
- **Runtime state:** `shared/src/components/archetypes/dot/appliesDots.ts`
- **Logic:** `t3/paths/{poison,fire,frost}.ts`, `t3/ticks/{frenzy,conflagration,chillFreeze,permafrost}.ts`,
  dispatched from `t3/index.ts`; buffs in `t3/core/buffs.ts`; selectors `t3/core/selectors.ts`
- **Base DoT:** `dmgPerStack = attack × convPct / maxStacks`, normalised by `tickIntervalMs / DOT_TICK_MS`
  so a faster tick interval keeps total damage the same (Cultist uses this).

Active specs by frame: **Poison (light)** Venomslinger / Cultist / Zealot · **Fire (balanced)**
Pyromancer / Firebrand / Cinder Lord · **Frost (heavy)** Icebreaker / Winter Warden / Rime Blade.

| Constant | Value | Spec / meaning |
|---|---|---|
| `PE_MAX_STACKS` | 10 | Venomslinger — poison stack cap (was 20); UI also reads 10 |
| `PE_BURST_TICKS` | 10 | Venomslinger — detonation = maxStacks × dmgPerStack × this |
| `ED_BASE_STACKS/_DIMINISH_RATE/_MAX_STACKS` | 8 / 0.5 / 50 | Cultist (eternal-doom) — stacks past 8 at 50%; node sets `dot.tick-interval-ms: 500` |
| `FRENZY_FX` | `'dot-frenzy'` | Zealot — player status id |
| `FRENZY_DURATION_MS` | 6000 | Zealot — buff duration, refreshed on each max-stack hit |
| `FRENZY_APS` | 0.30 | Zealot — **flat** attack-speed bonus (does NOT scale per tier) |
| `FRENZY_ONHIT_PER_TIER` | 10 | Zealot — +flat on-hit per tier (the scaling half) |
| `FRENZY_UNLOCK_TIER` | 4 | Zealot — per-tier anchor |
| `FTF_STACKS_PER_HIT/_DMG_MULT/_BONUS_MULT` | 2 / 0.5 / 2 | Pyromancer (fan-the-flames) — bonus mult was 3 (OP), now 2; full-stack hit shows an aesthetic crit |
| `IGNITION_VALUE_MULT` | 0.6 | Firebrand — tick value of each front-loaded stack |
| `CONF_TICK_MS` / `CONF_DMG_FACTOR` / `CONF_TICKS` | 250 / 1 / 10 | Cinder Lord — fast cadence (10×250ms @ factor 1 = same total/duration as old 5×500ms @ factor 2) |
| `RIMESHATTER_DR_DEBUFF` / `_DR_MS` | 0.08 / 2000 | Icebreaker (rimeshatter) — DR debuff at max stacks |
| `CHILL_MAX` | 9 | Winter Warden — chill stacks to freeze (was 3; avoids perma-freeze) |
| `CHILL_SPEED_MULT` / `CHILL_ATK_MULT` | 0.05 / 0.05 | Winter Warden — per-chill slow (45% at 9) |
| `CHILL_MS` | 6000 | Winter Warden — chill refresh window |
| `FREEZE_SPEED_MULT` / `FREEZE_ATK_MULT` | 0.80 / 2.0 | Winter Warden — frozen severe slow (−80% move, ×3 cooldown) |
| `FREEZE_BONUS` / `FREEZE_MS` | 0.35 / 2000 | Winter Warden — +dmg-taken while frozen; freeze duration (`core/constants.ts`) |
| `SHATTER_STRIKE_BONUS_PER_STACK` | 10 | Rime Blade — flat direct bonus per frost stack (× tierMult) |
| `SHATTER_STRIKE_UNLOCK_TIER` | 4 | Rime Blade — per-tier anchor |

**Spec notes:**
- **Venomslinger (poison-explosion):** at 10 stacks, detonates as a **real empowered AoE** (not a
  cosmetic crit) and pushes the `'poison-explosion'` client effect (gassy green cloud `fxPoisonExplosion`).
- **Cultist (eternal-doom):** purple "doom" element. Ticks twice as fast (`dot.tick-interval-ms: 500`)
  for the same total damage. On-hit FX = `fxDoomCloud` (purple smog); per-tick FX = `fxDoomTick`
  (Voidwalker-style implosion → burst).
- **Zealot (frenzy):** hitting a max-stack target grants `dot-frenzy` for 6s (refreshes on each such
  hit) — flat `FRENZY_APS` attack speed + per-tier on-hit. Buff descriptor `dot-frenzy`. The on-hit
  granting/adding lives in `t3/index.ts`; the attack-speed reassert (recalc-safe) in `ticks/frenzy.ts`
  via `appliesDots.frenzyBaseCd/frenzyAppliedCd`.
- **Pyromancer (fan-the-flames):** full-stack bonus hit nerfed 3×→2×, flagged as an aesthetic crit
  (`empoweredAttack`; empowered hits no longer carry an inherent AoE splash).
- **Firebrand (ignition):** first hit on a fresh target sears in all stacks at 60% tick value and
  pushes the `'firebrand'` client effect (`fxFirebrand`). Once fully branded, hits **bypass the DoT
  conversion** and land as full 100% direct attacks (dividing out the dispatcher's `convPct` cut, same
  pattern as Icebreaker) and refresh the burn. No aesthetic crit.
- **Cinder Lord (conflagration):** at max burn, consumes stacks into a rapid burn. Now ticks
  10×250ms (balance-neutral vs the old 5×500ms). Each tick pushes a `dot-tick` with
  `fx: 'conflagration'` → dedicated `fxConflagrationTick` (large rising flame). Scoped to Conflagration
  only (regular fire ticks have no per-tick FX).
- **Icebreaker (rimeshatter):** at max stacks, hits land full direct damage (undo conversion) and apply
  a DR debuff that **reuses the brittle effect** (`BRITTLE_EFFECT_ID`, read by
  `effectiveDamageReductionAfterBrittle`).
- **Winter Warden (freezing-cold):** see the **Freeze redesign** below.
- **Rime Blade (shatter-strike):** flat **direct-attack** bonus per active frost stack, now scaled per
  tier; buff descriptor `dot-rimeblade` (frost-blue diamond) shows the live bonus. Boring spec, flagged
  as a likely future rework.

**Freeze redesign (Winter Warden):**
- Frozen is now a **severe slow, not full CC** (matches the node text). Removed the `isMonsterFrozen`
  attack-gate in `combat.ts` (player + minion paths) and the movement-stop in `ai.ts`; frozen monsters
  path and attack, just very slowly. `chillFreeze.ts` applies the severe slow (`FREEZE_SPEED_MULT` /
  `FREEZE_ATK_MULT`) via a unified `applyMonsterSlow`/`restoreMonsterStats` that also fixed a chill→
  freeze stuck-stats bug.
- **Root-cause fixed:** the old CC branch set `performsAttack.lastAttackAt = now` *every tick* while
  frozen; the client animates a monster attack whenever `lastAttackAt` advances, so frozen mobs spammed
  the swing animation (and dealt no damage, since the attack was gated). **Stun and knockback still use
  the same per-tick `lastAttackAt = now` pattern** in `ai.ts` — latent identical spam, just brief.
- Chill now needs **9** stacks to freeze (was 3) at 5%/stack; the dedicated chill UI in
  `client/src/hud/stat/StatPanel.tsx` reads `CHILL_MAX_STACKS = 9` (counter `/9` + 9 pips).

---

## RELOAD  (`…/archetypes/reload/t3/`)  — frames reorganized

- **Constants:** `reload/t3/core/constants.ts`
- **Runtime state:** `shared/src/components/archetypes/reload/usesReload.ts` (Momentum/Cannon fields)
- **Logic:** `t3/pipeline/lightPaths.ts` (Alternating Cadence), `t3/lifecycleHandlers.ts`
  (Momentum + Cannon on reload), `t3/ticks/momentum.ts`
- **Shared combat change:** `combat.ts` honors `ctx.metadata['onHitDamageMult']` (Alternating Cadence;
  also reused by Energy Upkeep / Binary).

| Constant | Value | Spec / meaning |
|---|---|---|
| `ALT_CADENCE_ATTACK_MULT` | 2 | Alternating Cadence — even shots: 2× attack (on-hit zeroed) |
| `ALT_CADENCE_ONHIT_MULT` | 2 | Alternating Cadence — odd shots: 2× on-hit (attack zeroed) |
| `DEFAULT_MOMENTUM_APS_PER_STACK` | 0.06 | Momentum — APS per stack |
| `DEFAULT_MOMENTUM_MAX_STACKS` | 5 | Momentum — max stacks |
| `MOMENTUM_DECAY_INTERVAL_MS` | 4000 | Momentum — OOC: shed 1 stack per interval (was 12000) |
| `DEFAULT_MOMENTUM_RELOAD_REDUCTION` | 0.10 | Momentum — −10% reload time per stack |
| `MOMENTUM_RELOAD_REDUCTION_FLOOR` | 0.30 | Momentum — never below 30% of base reload |
| `DEFAULT_CANNON_DAMAGE_PER_SHOT` | 0.5 | Cannon (was "Siege") — banks attack × this per shot |
| `CANNON_CHARGE_FRACTION` | 0.5 | Cannon — charge time = reload × this |
| `CANNON_BLAST_EFFECT` | `'reload-cannon-blast'` | Cannon — client explosion FX id |
| `DEFAULT_EXPLODING_CLIP_MULT` | 3.5 | Last Bullet (kept) |
| `DEFAULT_HAIR_TRIGGER_PCT/_MAX` | 0.07 / 5 | base clip-ramp (Chain Gun overrides via node) |

**Node-level placeholders** (`t3CombatA.ts`): Last Bullet `exploding-clip-mult: 3.5`; Sniper
`max-ammo: -2`, `snipe-cooldown-ms: 2500`, `snipe-baseline-cd-ms: 1000`, `snipe-fullhp-mult: 2`;
Blunderbuss `attackRange: -100` + spread/knockback; Momentum `momentum-aps-per-stack: 0.06`,
`momentum-max-stacks: 5`; Chain Gun `hair-trigger-pct-per-shot: 0.05`, `hair-trigger-max-stacks: 13`;
Cannon `cannon-damage-per-shot: 0.5`; Laser `laser-*` (kept).

**Notes / flags:**
- Frame moves are pure data; the server reads passive keys (not node ids), so kept mechanics work
  regardless of frame.
- Alternating Cadence shot position = `ammoMax - ammo`. On-hit **triggers** still fire on every shot;
  only the on-hit **damage value** is scaled.
- **Laser/Chain Gun** reuse existing implemented mechanics; re-evaluate Laser against the full heat
  model if desired.

---

## ENERGY  (`…/archetypes/energy/t3/`)  — largest

- **Constants:** `energy/t3/core/constants.ts` (on-hit/upkeep formulas in
  `shared/src/systems/energyUpkeep.ts`, max-energy in `energyMax.ts`)
- **Runtime state:** `shared/src/components/archetypes/energy/usesEnergy.ts`
- **Logic:** `t3/pipeline/{beforeAttack,normalHit,empoweredHit,afterHit}.ts`, `t3/ticks/energyState.ts`

| Constant | Value | Spec / meaning |
|---|---|---|
| `ENERGY_OVERDRIVE_ATK_PCT` | 0.40 | Surge/Overdrive — +ATK% while active |
| `OVERDRIVE_DECAY_PER_SEC` | 18 | Overdrive — energy lost/sec while active |
| `UPKEEP_DECAY_BASE` | 12 | Channeler/Upkeep — decay/sec at start of a sustain |
| `UPKEEP_DECAY_RAMP_PER_SEC` | 1.5 | Channeler — extra decay/sec added per sustained second |
| `BINARY_CHARGE_ONHIT_BONUS` | 0.30 | Equinox/Binary — +on-hit% in Charge State |
| `BINARY_CHARGE_ONHIT_PER_TIER` | 6 | Binary — flat on-hit added per tier in Charge |
| `BINARY_DISCHARGE_ATK_BONUS` | 0.30 | Binary — +ATK% in Discharge State |
| `BINARY_CHARGE_GAIN_MULT` / `BINARY_DISCHARGE_GAIN_MULT` | 0.6 / 1.5 | Binary — slow vs fast energy gain |
| `BINARY_CHARGE_SPEED_FACTOR` / `BINARY_DISCHARGE_SPEED_FACTOR` | 1.25 / 0.75 | Binary — slower vs faster attacks |
| `BINARY_CHARGE_DISCHARGE_MULT` / `BINARY_DISCHARGE_DISCHARGE_MULT` | 0.8 / 1.3 | Binary — weak vs strong end-of-state discharge |
| `BINARY_UNLOCK_TIER` | 4 | Binary — per-tier anchor |
| `AWAKENED_N` / `AWAKENED_MULT` | 4 / 1.5 | Stormbringer — empowered attacks after discharge / mult |
| `CHARGE_STATE_MIN` / `CHARGE_STATE_MAX` | 0.5 / 2.0 | Aetherist — attack mult at empty / full energy |
| `CRITICAL_MASS_MAX` | 3 | Invoker — max stacks |
| `CRITICAL_MASS_DMG_PER_STACK` / `_GAIN_PER_STACK` | 0.20 / 0.20 | Invoker — +discharge mult / +energy gain per stack |
| `CRITICAL_MASS_RESET_MS` | 5000 | Invoker — no-damage gap that resets stacks |
| `STORM_FX` | `'energy-storm'` | Tempest — Storm debuff id |
| `ENDLESS_STORM_TOTAL_MULT` | 8.0 | Tempest — storm total = attack × this over base duration |
| `ENDLESS_STORM_TICK_MS` | 1000 | Tempest — storm tick interval |
| `ENDLESS_STORM_DURATION_MS` | 4500 | Tempest — base duration a discharge applies/refreshes |
| `ENDLESS_STORM_EXTEND_MS` / `_MAX_MS` | 1000 / 7500 | Tempest — each normal attack extends; hard cap |
| `SE_ENERGY_MAX` / `SE_ACCEL_SCALE` | 200 / 0.5 | Voidwalker (singularity) — doubled cap / accel fill |
| `FLASH_*` | various | Stormdancer/Flash (kept) |

**Notes / flags:**
- **Voidwalker (singularity):** doubles max energy to 200 **+100 per tier beyond** (energyMax.ts);
  scales the discharge by stored energy; an early execute spends stored energy (`energy = 0` +
  `suppressEmpoweredMult`). FX `fxVoidDischarge`.
- **Channeler (upkeep):** no threshold gate — Flow builds while energy > 0; decay **ramps** with
  sustain time (`base + ramp × upkeepSec`) until it outpaces gain and resets. On-hit scaling is
  uncapped/per-tier/DR'd in `shared/src/systems/energyUpkeep.ts`.
- **Equinox (binary):** Charge = +on-hit (flat per tier) + slower attacks + weak discharge; Discharge =
  +ATK% + faster attacks + strong discharge. The per-state **attack-speed swing is now applied**
  (`BINARY_*_SPEED_FACTOR`) — previously a TODO.
- **Tempest (endless-storm):** redesigned from a permanent DPS aura into a **Storm DoT debuff** —
  worth `attack × 8` over a 4.5s base, extended +1s per normal attack up to 7.5s; discharges refresh it.
  Buff/target tile `energy-storm`.
- **TODO(engine):** Stormbringer (awakened) applies 1.5× but doesn't set `empoweredAttack`, so
  empowered-triggered gear won't observe those attacks.

---

## Cross-cutting items (status)

- **Discarded specs left inert:** replaced concepts (Accelerando, Rapid Tempo, Overwhelming Force,
  Iron Patience, Temporal Extension's old form, Acceleration, Alignment, Entropy Collapse,
  Micro-Venting, Polarity Decay, Alternating Currents, Harmonic Equilibrium, Capacitor Shunt,
  Cascading Induction, Superconducting Mass, Smoldering Ember, Permafrost, Glacial Fracture,
  Invigorating Toxins, Suppressing Fire, Cover Fire, Gatling) — server code still exists but is
  **unreachable** (no node produces their passive key). `dotElementForPlayer` still lists some of them
  as element fallbacks (harmless). Safe to delete later.
- **Naming collisions:** "Overdrive" exists in both Cooldown Light and Energy Light (distinct node ids,
  `NOTE(naming)`) — resolve display names at the naming pass.
- **Status:** wired-and-working, **not balance-tuned**. Recommended next steps: balance pass over the
  tables above, then the flagged engine items, then a playtest per frame.

## File index (quick jump)

- Node data: `shared/src/data/skillTree/t3CombatA.ts` (Cadence/Cooldown/Reload), `t3CombatB.ts` (Energy/DoT)
- Passive keys: `shared/src/passives.ts`
- Frame bases: `shared/src/data/skillTree/rootsAndFrames.ts`
- Per-tier / elements / stats: `shared/src/systems/{energyUpkeep,energyMax,dotElements,stats}.ts`
- Buff ids: `shared/src/components/combat/buffs.ts`; server registry `…/combat/buffs/buffSync.ts`
- Constants: `server/src/systems/classes/archetypes/<class>/t3/core/constants.ts`
  (DoT: `…/dot/t3/paths/_constants.ts` + `…/dot/t3/core/constants.ts`; Cadence Crescendo: `…/cadence/t3/core/crescendo.ts`)
- Runtime slices: `shared/src/components/archetypes/<class>/uses<Class>.ts`
- Freeze/CC: `server/src/systems/combat/{engine/combat.ts,ai/ai.ts}` + `…/dot/t3/ticks/chillFreeze.ts`
- Client FX: `client/src/fx/{doom,poisonExplosion,firebrand,conflagrationTick,…}.ts`,
  dispatch in `client/src/render/combatFx.ts`; DoT element colours in `client/src/hud/TargetFrame.tsx`
