# T4 (tier-3) Class Spec — Implementation & Tuning Notes

Implementation reference for the T4 specialisation layer (design = "T4", code = `tier: 3`).
Covers all five active classes: Cadence, Cooldown, DoT, Reload, Energy. Summoner is out of scope.

**All numbers below are placeholders** named as constants — lock mechanics first, tune later
(per `t4-spec-designs-reference.md`). This doc tells you *where* every knob lives.

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

## CADENCE  (`…/archetypes/cadence/t3/`)

- **Constants:** `server/src/systems/classes/archetypes/cadence/t3/core/constants.ts`
- **Runtime state:** `shared/src/components/archetypes/cadence/usesCadence.ts`
- **Logic:** `t3/pipeline/normalHit.ts`, `t3/pipeline/empoweredHit.ts`, `t3/ticks/cadenceState.ts`

| Constant | Value | Spec / meaning |
|---|---|---|
| `AFTERSHOCK_ATTACKS` | 3 | Aftershock — regular attacks that fire on-hit twice |
| `CURSED_FINALE_PLATING_SHRED` | 5 | Cursed Finale — flat plating stripped per finisher |
| `CURSED_FINALE_SHRED_CAP` | 20 | Cursed Finale — max total shred per target (hard cap) |
| `METRONOME_FLAT_BONUS` | 12 | Metronome — flat damage each buildup attack banks |
| `RAMPAGE_THRESHOLD_FLOOR` | 2 | Rampage — threshold can never drop below this |
| `RAMPAGE_APS_PER_STACK_MS` | 60 | Rampage — attack-cooldown reduction per stack |
| `RAMPAGE_ATK_PEN_PER_STACK` | 0.08 | Rampage — regular-attack damage penalty per stack (frac) |
| `RAMPAGE_MULT_PER_STACK` | 0.15 | Rampage — finisher multiplier bonus per stack (frac) |
| `RAMPAGE_DECAY_INTERVAL_MS` | 8000 | Rampage — OOC: shed 1 stack per interval |
| `CRESCENDO_FLAT_PER_STACK` | 18 | Crescendo — flat finisher bonus per stack |
| `CRESCENDO_TICK_MS` | 1000 | Crescendo — in-combat: +1 stack per tick |
| `CRESCENDO_DECAY_MS` | 2000 | Crescendo — OOC: shed 1 stack per interval |
| `DELAYED_VERDICT_STORE_PCT` | 0.40 | Delayed Verdict — fraction of buildup damage stored |
| `DELAYED_VERDICT_FUSE_MS` | 3000 | Delayed Verdict — detonation fuse (reset on re-trigger) |
| `MOMENTUM_ECHO_HITS` / `MOMENTUM_ECHO_BONUS` | 5 / 0.5 | Rising Tide (kept) — echo hits / bonus |
| `HEMORRHAGE_TICKS/_TICK_MS/_MULT` | 4 / 1000 / 1.5 | Hemorrhage (kept) |

**Node-level placeholders** (`t3CombatA.ts`): `cadence.metronome-flat: 12`, `cadence.crescendo-flat: 18`,
`cadence.debuff-plating-shred: 5`, `cadence.debuff-shred-cap: 20`, `cadence.debuff-vuln-pct: 25`,
`cadence.debuff-vuln-ms: 5000`. Rising Tide: `momentum-buildup: 0.20`, `momentum-echo: 5`.

**Notes / flags:**
- Cursed Finale cap is enforced by `maxStacks = floor(cap / shred)` on the `plating-shred` status.
- Delayed Verdict is **character-side** (`usesCadence.verdictStored/verdictFuseMs`) — persists across
  targets, executes when stored ≥ target HP, carries overkill forward.
- **TODO(engine):** Rampage stacks/threshold/APS reset on recalc (slice re-init); design wants them
  to survive a run.
- **TODO:** Aftershock applies the on-hit *damage* twice but does not re-fire on-hit *procs* (DoT/gear).

---

## COOLDOWN  (`…/archetypes/cooldown/t3/`)

- **Constants:** `server/src/systems/classes/archetypes/cooldown/t3/core/constants.ts`
- **Runtime state:** `shared/src/components/archetypes/cooldown/usesCooldown.ts`
- **Logic:** `t3/pipeline/{beforeAttack,normalHit,empoweredHit,postEmpoweredHit}.ts`, `t3/ticks/cooldownState.ts`
- **Frame bases** (for delta-based nodes): `shared/src/data/skillTree/rootsAndFrames.ts`
  — light 5000ms/1.5×, balanced 7000ms/2.0×, heavy 9000ms/3.0×.

| Constant | Value | Spec / meaning |
|---|---|---|
| `ETERNAL_CYCLE_FLAT_PER_STACK` | 8 | Eternal Cycle — flat added to execution per stack |
| `ETERNAL_CHARGE_DURATION_MS` | 10000 | Eternal Cycle — stack fall-off window |
| `RUPTURE_WINDOW_MS` | 2000 | Rupture — post-execution 50%-bypass window |
| `RUPTURE_WINDOW_PLATING_MULT` | 0.5 | Rupture — plating multiplier during window |
| `RUPTURE_DR_PIERCE` | 0.10 | Rupture — planned DR pierce (**not yet wired**) |
| `REVERB_BONUS_PER_ATTACK` | 0.04 | Reverb — next-execution bonus per attack landed |
| `PATIENCE_PAID_RAMP_MS` | 7000 | Patience Paid — ramp window (natural CD) |
| `PATIENCE_PAID_ATK_MAX` | 0.50 | Patience Paid — max regular-attack bonus at full ramp |
| `PATIENCE_PAID_EXEC_MAX` | 0.75 | Patience Paid — max execution bonus at full ramp |
| `VENGEANCE_MULTIPLIER` | 1.5 | Vengeance — bonus per point of damage taken |
| `VENGEANCE_FLOOR` | 30 | Vengeance — minimum execution bonus |
| `SINGULAR_EXTRACTION_CD_MS` | 4000 | Singular Extraction — target absolute CD (ref) |
| `SINGULAR_EXTRACTION_MULT` | 5.0 | Singular Extraction — target absolute multiplier (ref) |
| `OVERDRIVE_BUFF_MS` / `OVERDRIVE_SPEED_FACTOR` | 2500 / 0.667 | Overdrive (kept) |
| `BATTERY_ATK_PER_STACK` | 2 | Battery (kept) |

**Node-level placeholders** (`t3CombatA.ts`): `reverb-bonus-per-attack: 0.04`, `vengeance-mult: 1.5`,
`vengeance-floor: 30`. **Singular Extraction is delta-based:** `empowered-cd-ms: -5000` (→4000ms)
and `empowered-mult: +2.0` (→5.0×) on the heavy frame. Eternal Cycle now sets **no** `empowered-cd-ms`
(stays at the frame's 5000ms — the old +5000 "10s" value was a bug, now fixed).

**Notes / flags:**
- Additive execution bonuses live in `postEmpoweredHit.ts` (same placement as Battery → applied after
  the execution multiplier).
- **TODO(engine):** Rupture's 10% DR pierce has no `ctx` hook yet.
- **STUB:** Channeled Beam is not production-ready (warns on trigger); `BEAM_*` constants exist but the
  channel firing mode needs engine work.

---

## DOT  (`…/archetypes/dot/t3/`)

- **Constants:** `server/src/systems/classes/archetypes/dot/t3/paths/_constants.ts`
  (cross-path FREEZE/CHILL etc. in `t3/core/constants.ts`)
- **Runtime state:** `shared/src/components/archetypes/dot/appliesDots.ts` (Frenzy fields)
- **Logic:** `t3/paths/{poison,fire,frost}.ts`, `t3/ticks/frenzy.ts`, dispatched from `t3/index.ts`

| Constant | Value | Spec / meaning |
|---|---|---|
| `PE_MAX_STACKS` | 10 | Poison Explosion — stack cap (was 20) |
| `PE_BURST_TICKS` | 10 | Poison Explosion — burst = maxStacks × dmgPerStack × this |
| `FRENZY_APS_FACTOR` | 2 | Frenzy — attack-speed multiplier at max stacks |
| `IGNITION_VALUE_MULT` | 0.6 | Ignition — tick value of each front-loaded stack |
| `RIMESHATTER_DR_DEBUFF` | 0.08 | Rimeshatter — DR reduction while at max stacks |
| `RIMESHATTER_DR_MS` | 2000 | Rimeshatter — DR debuff refresh window |
| `SHATTER_STRIKE_BONUS_PER_STACK` | 10 | Shatter Strike — flat direct bonus per active stack |
| `FTF_STACKS_PER_HIT/_DMG_MULT/_BONUS_MULT` | 2 / 0.5 / 3 | Fan the Flames (kept) |
| `CONF_TICK_MS` / `CONF_DMG_FACTOR` / `CONF_TICKS` | 500 / 2 / 5 | Conflagration (kept) |
| `CHILL_MAX/_SPEED_MULT/_ATK_MULT/_MS` | 3 / 0.12 / 0.12 / 6000 | Freezing Cold (kept) |
| `FREEZE_BONUS` / `FREEZE_MS` | 0.35 / 2000 | Freezing Cold (kept) — in `core/constants.ts` |
| `ED_BASE_STACKS/_DIMINISH_RATE/_MAX_STACKS` | 8 / 0.5 / 50 | Eternal Doom (kept) |

**Notes / flags:**
- Frenzy is tick-driven (`ticks/frenzy.ts`) — toggles a doubled APS while the current target is at
  max stacks; no on-hit path (normal stacking handled by the base prototype).
- Rimeshatter's DR debuff **reuses the brittle effect** (`BRITTLE_EFFECT_ID`), already read by
  `effectiveDamageReductionAfterBrittle`. At max stacks it undoes the dispatcher's DoT-conversion so
  direct hits land full.
- **TODO(balance):** verify Rimeshatter full-power hits vs high-plating enemies.

---

## RELOAD  (`…/archetypes/reload/t3/`)  — frames reorganized

- **Constants:** `server/src/systems/classes/archetypes/reload/t3/core/constants.ts`
- **Runtime state:** `shared/src/components/archetypes/reload/usesReload.ts` (Momentum/Siege fields)
- **Logic:** `t3/pipeline/lightPaths.ts` (Alternating Cadence), `t3/lifecycleHandlers.ts`
  (Momentum + Siege on reload), `t3/ticks/momentum.ts`
- **Shared combat change:** `server/src/systems/combat/engine/combat.ts` now honors
  `ctx.metadata['onHitDamageMult']` (used by Alternating Cadence; also reused by Energy Upkeep / Binary).

| Constant | Value | Spec / meaning |
|---|---|---|
| `ALT_CADENCE_ATTACK_MULT` | 2 | Alternating Cadence — even shots: 2× attack (on-hit zeroed) |
| `ALT_CADENCE_ONHIT_MULT` | 2 | Alternating Cadence — odd shots: 2× on-hit (attack zeroed) |
| `DEFAULT_MOMENTUM_APS_PER_STACK` | 0.06 | Momentum — APS per stack |
| `DEFAULT_MOMENTUM_MAX_STACKS` | 5 | Momentum — max stacks |
| `MOMENTUM_DECAY_INTERVAL_MS` | 12000 | Momentum — OOC: shed 1 stack per interval |
| `DEFAULT_SIEGE_DAMAGE_PER_SHOT` | 0.5 | Siege — burst = attack × shotsFired × this |
| `DEFAULT_EXPLODING_CLIP_MULT` | 3.5 | Last Bullet (kept mechanic) |
| `DEFAULT_HAIR_TRIGGER_PCT/_MAX` | 0.07 / 5 | base clip-ramp (Chain Gun overrides via node) |

**Node-level placeholders** (`t3CombatA.ts`): Last Bullet `exploding-clip-mult: 3.5`;
Sniper `max-ammo: -2` (5→3 shells), `snipe-cooldown-ms: 2500`, `snipe-baseline-cd-ms: 1000`,
`snipe-fullhp-mult: 2`; Blunderbuss `attackRange: -100` + spread/knockback values;
Momentum `momentum-aps-per-stack: 0.06`, `momentum-max-stacks: 5`;
**Chain Gun** `hair-trigger-pct-per-shot: 0.05`, `hair-trigger-max-stacks: 13` (spans the 14-round clip);
Siege `siege-damage-per-shot: 0.5`; Laser `laser-*` values (kept).

**Notes / flags:**
- Frame moves are pure data: Last Bullet/Sniper → light, Blunderbuss → balanced, Laser/Chain Gun → heavy.
  The server reads passive keys (not node ids), so the kept mechanics work regardless of frame.
- Alternating Cadence shot position = `ammoMax - ammo`. On-hit **triggers** still fire on every shot;
  only the on-hit **damage value** is scaled.
- **Laser/Chain Gun** reuse existing implemented mechanics; re-evaluate Laser against the design's full
  heat model if desired (flagged in the node).

---

## ENERGY  (`…/archetypes/energy/t3/`)  — largest (7 new mechanics)

- **Constants:** `server/src/systems/classes/archetypes/energy/t3/core/constants.ts`
- **Runtime state:** `shared/src/components/archetypes/energy/usesEnergy.ts`
- **Logic:** `t3/pipeline/{beforeAttack,normalHit,empoweredHit,afterHit}.ts`, `t3/ticks/energyState.ts`

| Constant | Value | Spec / meaning |
|---|---|---|
| `ENERGY_OVERDRIVE_ATK_PCT` | 0.40 | Overdrive — +ATK% while active |
| `OVERDRIVE_DECAY_PER_SEC` | 25 | Overdrive — energy lost/sec while active |
| `UPKEEP_THRESHOLD_PCT` | 0.20 | Energy Upkeep — energy% above which timer runs |
| `UPKEEP_DECAY_PER_SEC` | 8 | Energy Upkeep — continuous energy decay |
| `UPKEEP_ONHIT_SCALE` | 0.05 | Energy Upkeep — on-hit bonus per upkeep-second |
| `BINARY_CHARGE_ATK_BONUS` | 0.30 | Binary Cycle — +ATK% in Charge State |
| `BINARY_DISCHARGE_ONHIT_BONUS` | 0.30 | Binary Cycle — +on-hit% in Discharge State |
| `BINARY_CHARGE_GAIN_MULT` | 1.5 | Binary Cycle — energy gain mult in Charge State |
| `BINARY_CHARGE_DISCHARGE_MULT` | 1.3 | Binary Cycle — big discharge ending Charge State |
| `BINARY_DISCHARGE_DISCHARGE_MULT` | 0.8 | Binary Cycle — light discharge ending Discharge State |
| `AWAKENED_N` | 5 | Awakened Lightning — empowered attacks after discharge |
| `AWAKENED_MULT` | 1.5 | Awakened Lightning — multiplier per empowered attack |
| `CHARGE_STATE_MIN` | 0.5 | Charge State — attack damage at 0 energy (→1.0 at max) |
| `CRITICAL_MASS_MAX` | 3 | Critical Mass — max stacks |
| `CRITICAL_MASS_DMG_PER_STACK` | 0.20 | Critical Mass — +discharge mult per stack |
| `CRITICAL_MASS_GAIN_PER_STACK` | 0.20 | Critical Mass — +energy gain per stack |
| `CRITICAL_MASS_RESET_MS` | 5000 | Critical Mass — no-damage gap that resets stacks |
| `ENDLESS_STORM_DPS` | 40 | Endless Storm — storm damage per second |
| `ENDLESS_STORM_TICK_MS` | 1000 | Endless Storm — storm tick interval |
| `ENDLESS_STORM_DURATION_MS` | 600000 | Endless Storm — effectively permanent (until death) |
| `SE_ENERGY_MAX` / `SE_ACCEL_SCALE` | 200 / 0.5 | Singularity Execute (kept core) — doubled cap / accel fill |
| `FLASH_*` | various | Flash (kept) |

**Notes / flags:**
- Singularity Execute now **scales the discharge by stored energy** (`dischargeEnergy/100`), captured
  when the discharge is armed (full fill in `afterHit`, or current energy in the `beforeAttack` execute).
- **TODO(engine):** Binary Cycle's per-state **attack-speed swing** isn't applied yet (damage textures only).
- **TODO(engine):** Awakened Lightning applies 1.5× damage but doesn't set the `empoweredAttack` flag,
  so empowered-triggered gear won't observe those attacks.
- **TODO(perf/engine):** Endless Storm's tick scans all monsters (no marker query yet), and **storm
  transfer to the next target on death is not implemented** — it currently just expires with the target.

---

## Cross-cutting items

- **Discarded specs left inert:** the replaced concepts (Accelerando, Rapid Tempo, Overwhelming Force,
  Iron Patience, Temporal Extension, Acceleration, Alignment, Entropy Collapse, Micro-Venting,
  Polarity Decay, Alternating Currents, Harmonic Equilibrium, Capacitor Shunt, Cascading Induction,
  Superconducting Mass, Smoldering Ember, Permafrost, Glacial Fracture, Invigorating Toxins,
  Suppressing Fire, Cover Fire, Gatling) — their **server code still exists but is unreachable** (no node
  produces their passive key). Safe to delete later; left in to avoid cascading into
  mirroring/selectors/buffs. Their constants are also still present.
- **Naming collisions:** "Overdrive" exists in both Cooldown Light and Energy Light (distinct node ids,
  flagged with `NOTE(naming)` comments) — resolve display names at the naming pass.
- **Buff HUD:** not extended for new specs (out of scope). Stacking states like Rampage/Crescendo/
  Momentum/Critical Mass don't show a HUD buff icon yet.
- **Status:** wired-and-working, **not balance-tuned**. Recommended next steps: balance pass over the
  tables above, then the flagged engine items, then a playtest per frame.

## File index (quick jump)

- Node data: `shared/src/data/skillTree/t3CombatA.ts` (Cadence/Cooldown/Reload), `t3CombatB.ts` (Energy/DoT)
- Passive keys: `shared/src/passives.ts`
- Frame bases: `shared/src/data/skillTree/rootsAndFrames.ts`
- Constants: `server/src/systems/classes/archetypes/<class>/t3/core/constants.ts`
  (DoT: `…/dot/t3/paths/_constants.ts`)
- Runtime slices: `shared/src/components/archetypes/<class>/uses<Class>.ts`
