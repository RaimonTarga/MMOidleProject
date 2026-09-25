# Stances — current state

Branch note (2026-09-25): Defensive/Tanking plating bonuses are removed in the experimental defense candidate; [status and results](../reports/defense-redesign-01/REPORT.md). Not shipped.

- **Code audit:** 2026-09-04 (Tier 3 placement/economy redistribution)
- **Authoring contract:** `docs/stances-authoring-guide.md`
- **Candidate postures / design notes:** `docs/stances-future-design-notes.md`
- **Archived design handoff:** `docs/archive/stances-rework-design-handoff.md`
- **Historical implementation plan:** `docs/archive/stances-plan.md`

Stances are mutually exclusive modal postures. A character learns stances through recipes, attunes learned postures with RP, chooses one attuned default, can automate transitions among attuned stances through Rune rules, and can temporarily take direct control from the live combat HUD. There is no reactive build slot.

## State and Runic Points

```ts
interface EquippedStances { default: string | null }
interface EquippedRule {
  conditionId: string;
  actionId: string;
  targetStanceId?: string;
}
```

`activeStance` remains authoritative/networked. `attunedStances` reserves each stance's `runeCost` once. The default must be attuned. A `switch-stance` rule requires an attuned target and pays only its condition; the action costs 0 RP. Neutral is free. See [Runic attunement](runic-attunement-current-state.md) for combined costs and migration.

`OverridesStance` is a separate networked runtime component. With Auto Combat off, presence means the player owns the live stance choice and Rune/default automation yields to its attuned `stanceId`, or to the reserved free `no-stance` neutral destination. Enabling Auto Combat—or entering its temporary Fight Back travel-combat equivalent—releases that override and hands stance ownership back to Rune/default automation. It is never part of persisted build data, disappears on logout/reconnect, resets on death or a stance-loadout edit, and never rewrites `equippedStances.default` or Rune rules.

The single `STANCE` Rune channel remains priority ordered. The first active Stance rule supplies its destination. If no Stance rule is active, the player returns to the default.

Supported stance situations are Always, In Combat, Out of Combat, HP Below 25%, HP Above 90%, Target HP Below 25%, Debuffed, Target Casting, Empowered Ready, Stance Charged, While Traveling, and 3+ Aggressors. The last three were added 2026-09-02: `Empowered Ready` (an existing condition that Switch Stance simply was not allowed to name) makes `Empowered Ready -> Time to Strike` buildable; `While Traveling` turns the existing cast into travel postures (`While Traveling -> Fleeting` for speed and evasion, `-> Predator` for stealth and a loaded opener) without adding travel-specific stances; and `Stance Charged` is the general "this posture has finished charging" situation a charging stance is left on.

## Authoring model

Every static modifier is a PERCENTAGE, held in `StanceModifiers`. A stance is a temporary
mode that can switch automatically mid-fight, so a flat grant would be the whole character
at T1 and a rounding error at T5. `StanceModifiers` has no flat fields and, deliberately,
no max-HP field of any kind — resizing the pool means preserving HP percentage across a
switch the player did not ask for, so survival postures pay in mitigation and offense.

Where each field lands in `recalculatePlayerStats`:

| Field | Seam |
|---|---|
| `attackSpeedPct` | step 2a, into the shared attack-speed accumulator (must precede the reload cadence layers) |
| `evasion` | step 2a, into the shared evasion rating (already a 0-1 fraction) |
| `platingPct` / `moveSpeedPct` | step 3e, a stance-owned stat layer after class affinities |
| `damageDealtPct` | final damage resolution for direct, on-hit, DoT, proc and summon output |
| `damageTakenPct` | not a stat — read at hit time by the shared final-damage `onDamageTaken` listener, which passes the player's live HP fraction so a gated posture resolves correctly |

`damageDealtPct` and friends multiply rather than joining the class-affinity bucket on purpose:
a posture the player toggles and reads off a tooltip must mean exactly what it says for
every class. `damageTakenPct` is a multiplicative layer rather than an additive
`damageReduction` contribution because that pool clamps to [0, 0.9] — before the corrective
pass, every stance's "you take more damage" drawback was silently free for any character
without gear DR.

## Catalog

First-pass magnitudes are balance seeds in `shared/src/stances.ts`; the structure is frozen.

| Stance | RP | Static posture | Behavioral |
|---|---:|---|---|
| Offensive | 1 | +15% Damage, +10% Attack Speed, +10% damage taken | — |
| Defensive | 1 | -10% damage taken, -15% Damage | — |
| Tanking | 3 | -25% damage taken, -40% Damage, -20% Attack Speed | — |
| Enraged | 3 | +30% Damage and +15% Attack Speed **only at <=25% HP**; no defensive penalty | HP gate, see below |
| Perfection | 2 | +10% damage taken always; +20% Damage / +15% Attack Speed / +15% Move Speed **only at >=90% HP** | HP gate, see below |
| Fleeting | 2 | +35% Move Speed, +15pp Evasion, -35% Damage, -20% Attack Speed | — |
| Berserker | 4 | +35% Damage, +20% Attack Speed, +15% damage taken | 2% max HP self-damage per second while in combat; can kill |
| Recuperating | 4 | -50% Damage, -30% Attack Speed | 80% of Recovery stays active in combat |
| Predator | 3 | +15% Move Speed, -10% Damage | 50% reduced detection; +75% armed opening hit |
| Brawler | 3 | No offensive penalty | 8/16/24/31/40% damage reduction at 1/2/3/4/5+ aggressors |
| Execute | 3 | No unconditional modifier | +75% damage to targets at or below 25% HP |
| Time to Strike | 3 | No Attack Speed penalty | +1.0 to empowered multiplier; ordinary hits -40% |
| Reaper | 3 | -15% Damage | a kill stores one charge; leaving starts 10s of +35% damage / +25% Attack Speed; re-entry discards the buff |
| Warding | 3 | -50% Damage, -25% Attack Speed | incoming harmful statuses -50% duration; incoming DoTs -40% per-stack damage |
| Powering Up | 4 | -50% Damage, -30% Attack Speed | charges up to 8s in combat; leaving spends it for +50% damage / +30% Attack Speed for as long as it charged |

All fifteen catalogued stances are now taught by recipes. Warding remains a T3
reward; Time to Strike, Reaper, Recuperating, and Powering Up are T4 rewards in
Mountain, Volcanic, Graveyard, and Trench respectively. See
`docs/stances-future-design-notes.md` for the design intent; final placement is
covered by `server/test/t3ProgressionEconomy.test.ts`,
`server/test/t4ProgressionEconomy.test.ts`, and `server/test/stancesUnplaced.test.ts`.

Every behavioral magnitude above is a named constant in `shared/src/stances.ts`
(`BERSERKER_SELF_DAMAGE_PCT`, `PREDATOR_OPENER_BONUS`, `BRAWLER_REDUCTION_BY_AGGRESSORS`,
`EXECUTE_HP_THRESHOLD`, ...). The server systems and the player-facing copy both read those
constants, so a stance cannot advertise a number it does not apply.

Predator's opener is armed only while the posture is active out of combat and is consumed by the first hit. Berserker damage is deterministic, bypasses ordinary mitigation/shields/cheat-death/on-damage listeners, and can kill with the dedicated stance death cause. Brawler's crowd table and the shared damage-taken multiplier compose in one listener, so a Brawler carrying a `damageTakenPct` would multiply both.

Runes normally own CONDITIONS; the stance owns the POSTURE. Intrinsic payoff requirements
still live on the stance: Enraged's bonuses function only at or below 25% player HP, while
Perfection's function only at or above 90% player HP. A Rune rule can choose when to enter
either stance, but cannot bypass its payoff gate.

### Intrinsic HP payoff gates

`StanceDef.gatedModifiers` (`StanceHpGate`) holds the UPSIDE half of a posture whose identity
IS a maintained state. Enraged uses an inclusive upper bound: `+30% Damage / +15% Attack
Speed` apply only at or below `ENRAGED_HP_THRESHOLD` (0.25), with no unconditional downside.
Perfection uses an inclusive lower bound: its bonuses apply at or above
`PERFECTION_HP_THRESHOLD` (0.9), while its `+10% damage taken` remains unconditional.

These are deliberate exceptions to "Runes own conditions": a Rune decides when the player
*enters* a posture, but cannot make a payoff work outside its intrinsic window. Enraged remains
inactive above 25% even if selected manually or as the default; Perfection becomes inactive
below 90% even before a Rune reconciliation switches away. The gates are intrinsic in the same
sense as Execute's target-HP window and Brawler's aggressor count.

Below the threshold Perfection is deliberately **worse than no stance at all**: the drawback
persists, the payoff does not. That asymmetry is the reason to leave, and the tooltip says so.
The threshold is not configurable and is not a Rune condition.

Authoring rule, enforced by `server/test/stances.test.ts`: a gate may only hold upsides.
Unconditional drawbacks, when a stance has them, remain active on both sides of the line;
Enraged intentionally has none because its <=25% availability is the downside.

Mechanically: `activeStanceModifiers(stanceId, hpFraction)` in `shared/src/stances.ts` is the
ONLY resolver stat code may use — reading `def.modifiers` directly silently drops the conditional
half. `recalculatePlayerStats` captures the HP fraction before step 1 resets `maxHp`, and
`updateStanceSwitch` edge-triggers a `recalculatePlayerStanceStats` off a stored
`stance.gate.met` flag whenever the player crosses the line in either direction. The rebuild
preserves HP percentage and no stance touches `maxHp`, so the reading is identical on both sides
of the recalc and the gate cannot oscillate. Recalculating unconditionally every tick would
discard cadence/rampage state ten times a second; the flag is what makes it edge-triggered.

### The recently added postures, mechanically

None of the four needed a new subsystem; each was routed onto a seam that already existed.
Three are now reachable through their Tier-3 recipes, while Powering Up remains
unreachable until its intentional Tier-4 placement.

- **Time to Strike** rides `shared.empowered-mult-add`, the universal empowered bonus every
  archetype's empowered attack already reads, so the stance never touches cadence, cooldown,
  energy or reload code. Only the ordinary-hit penalty is a listener, and it keys off the
  `empoweredAttack` metadata the archetype multipliers set — they register first
  (`initAllMechanics` precedes `initStanceCombatEffects`), so the flag is truthful by then.
  The ordinary-hit penalty supplies the timing cost; no Attack Speed penalty remains.
  The bonus is still additive +1.0, not a final +100% multiplier.
- **Reaper** stores a single pending charge in `TracksCombat` after a kill while active.
  It supplies no offensive bonus until the shared manual/Rune switch releases it as a
  10-second status. Re-entry discards the active status and requires another kill.
  Extra earning kills do not stack; outside kills do not refresh. Stance loadout edits
  and loss of attunement discard both pending and active momentum. Death, respawn and
  build reset clear it through `resetTracksCombat`. Ordinary combat end does not reset
  the released timer: it keeps counting down between targets.
- **Warding** has no listener at all. It is two passives —
  `shared.status-duration-resist` and `shared.status-potency-resist` — read by
  `server/src/systems/combat/status/harmfulStatus.ts`, the ONE writer for how hard an
  incoming harmful status lands. That module folds the stance together with mobility-boot
  tenacity so two sources cannot each treat the other's output as the clean base, and every
  application site (slow, root, mark, antiheal, vulnerability, plating-shred ramp, stun,
  monster DoT) calls it instead of the individual sources. Duration resistance covers that
  whole surface; POTENCY resistance covers DoT per-stack damage only, because potency is a
  different number on every other debuff and one function cannot honestly scale them all.
  Both are capped strictly below 1: Warding endures, it never grants immunity.
- **Powering Up** keeps its charge as a `tracksCombat` counter that accrues only while the
  stance is active AND the player is in combat, and is discarded when combat ends — the
  design hazard is a posture you charge for free before every pull, which is a loading
  screen rather than a decision. Leaving the stance spends the charge however it was left,
  so there is no way to hoard it. The `Stance Charged` Rune situation is what lets a rule
  leave at full charge on purpose.

Reaper's and Powering Up's attack-speed windows are read at the ATTACK-CADENCE GATE in
`combat.ts`, never written into `performsDamage.attackCooldown`. The Zealot's Frenzy
already mutates that stat from a cached base, and a second mutator treating Frenzy's output
as "the clean base" ratchets the cooldown toward zero over a few ticks. Frenzy's own haste
already rides the gate for exactly this reason; these sum with it.

## Switching semantics

`updateRuneDerivedConfig` writes the winning destination into server-only `TracksCombat`; `updateStanceSwitch` reconciles it once per tick. With Auto Combat off, a validated attuned or neutral `OverridesStance` destination takes precedence. Auto Combat and active Fight Back clear stale manual ownership so Rune/default decisions remain effective. Both automatic and manual changes use the same authoritative switch helper, stat rebuild, Powering Up release, event and 1500 ms minimum dwell. Neutral remains a held manual choice only while Auto Combat is off.

`recalculatePlayerStanceStats` performs the derived rebuild while preserving unrelated live state:

- combat counters/resources/cooldowns/flags/strings/status effects;
- Cadence progress and Rampage state;
- shields and archetype-owned resources;
- current HP percentage across max-HP changes.

A switch emits a server-authoritative `stance-switch` combat event and dirties progression. Dynamic combat listeners are registered through `initCombatSystems()`.

## Persistence and validation

Hydration filters known IDs, retains a legal default, initializes active stance to that default, and migrates legacy `{default, reactive}` saves. A legacy `switch-stance` rule without a target receives the saved reactive stance as its destination when that stance is still known.

Rune loadout intents are atomic: malformed/unowned/incompatible rules, unknown or unlearned stance destinations, and shared-RP overspending reject the whole proposal. Results use `build:loadoutResult`.

## Player interface

Effect text is generated from the stance definition by `stanceLines` in
`client/src/ui/describe/`, and covers static modifiers, every authored `behaviors` entry,
`mechanicEffects`, and the destination RP cost. Surfaces with room for only one line
(crafting, the Rune destination wheel, the map's unlock list) render `blurb`, which is
therefore written as a mechanics sentence rather than flavour.

What is deliberately absent: the Rune condition a stance is reached through. The stance
tooltip still describes intrinsic payoff gates, so Enraged explicitly says its bonuses work
only at or below 25% HP even if another Rune condition or a manual selection activates it.

- Stances is its own rail entry, opening the shared arrangement dialog (Abilities / Stances / Rites / Runes) on the Stances tab: a crest/sigil sanctum for attuning postures and choosing an attuned default.
- The compact live combat dock shows an icon-only neutral posture followed by each currently attuned stance icon. The neutral control reuses the hollow-diamond `No Stance` grammar from the Rune editor; no standalone art asset is required. A shared dark radial sweep covers the stance controls during the 1500 ms switch cooldown. With Auto Combat off, clicks hold a manual stance choice. With Auto Combat on, clicks can request an immediate legal switch but do not block subsequent Rune/default decisions. Manual selection and the actually active stance are separately visible. The default keyboard chords are `Shift+1` for Neutral and `Shift+2` onward for attuned stances in displayed order; compact badges expose them on the rail, and every chord is rebindable without colliding with the unmodified ability-number keys. `Shift+0` is deliberately unused.
- The Runes tab opens a horizontal destination wheel when `Switch Stance` is selected; its first sigil is the zero-cost neutral `No Stance` posture, followed by learned stance crests. Once a situation is picked, each crest quotes the WHOLE rule price (condition + destination), not the surcharge — with the verb at 0 RP, the surcharge alone would understate what committing the rule spends.
- The sanctum's own header names the default posture and the total shared RP pool.
- Crafting contains recipes for all fifteen stances across T2–T4 mastery bands;
  the four stateful postures use the later T4 placements described below.

## Progression

Recipes live in `shared/src/stanceRecipes.ts`. Three placement rules hold, all enforced by
`shared/src/data/recipeGates.test.ts` across every recipe database in the game:

1. the biome must have nodes at the recipe's tier;
2. `requiredBiomeLevel` must be within `biomeLevelCap(tier, group)`;
3. `catalystCost` must name a live node-modifier family the biome is allowed to roll.

The 2026-09-13 playtest correction leaves **only Offensive, Defensive, and Fleeting
in Tier 2**. Tanking and Enraged move to Tier 3; Perfection moves to Tier 4 Jungle
(Forest no longer has nodes there). Recipe IDs and already learned stances are preserved.
All gates use a living biome, reachable mastery band, local essence, and live catalysts.

| Tier | Stance | Biome / gate | Essence | Catalyst |
|---|---|---|---:|---|
| 2 | Offensive | Plains L7 | 60 yellow | 1 alacrity |
| 2 | Defensive | Plains L7 | 60 yellow | 1 fortified |
| 2 | Fleeting | Swamp L8 | 110 purple | 1 alacrity |
| 3 | Tanking | Mountain L13 | 220 blue | 2 heavy |
| 3 | Enraged | Cave L14 | 230 red | 2 dominion |
| 3 | Warding | Swamp L13 | 220 purple | 2 fortified |
| 3 | Berserker | Cave L13 | 230 red | 2 dominion |
| 3 | Predator | Tundra L2 | 210 blue | 2 dominion |
| 3 | Execute | Desert L7 | 230 yellow | 2 dominion |
| 4 | Perfection | Jungle L14 | 450 green | 3 alacrity |
| 4 | Time to Strike | Mountain L20 | 450 blue | 3 heavy |
| 4 | Brawler | Jungle L14 | 500 green | 3 swarming |
| 4 | Reaper | Volcanic L8 | 500 red | 3 swarming |
| 4 | Recuperating | Graveyard L2 | 450 purple | 3 fortified |
| 4 | Powering Up | Trench L2 | 550 green | 4 dominion |

No stance has a boss-clear requirement. Progression tests pin the 3 / 6 / 6 tier rosters.

New stances currently reuse the closest existing stance crests until dedicated concept art is authored.

## Coverage

`server/test/stances.test.ts` verifies destination rules, minimum dwell, stat replacement, unrelated cooldown/counter preservation, and HP-percentage semantics including a max-HP stance. Since 2026-09-02 it also covers Perfection's gate in both directions (bonuses on at full HP, off one point below the threshold, back on above it), that the drawback persists across the crossing, that the crossing corrupts no combat state and switches no stance, that a gate may hold no drawbacks, and that `Switch Stance` contributes 0 RP while destination and condition costs stay authoritative.

`server/test/balanceInstruments.test.ts` asserts the canonical bench stance is unconditional. The bench baseline MOVED on 2026-09-02: it ran Perfection as its "least polarising" posture, which the gate invalidated (a benched fight leaves >=90% HP in the first exchange, so the bot would have carried the -20% Plating with none of the payoff). It now runs Offensive. Pre-2026-09-02 bench runs are not comparable.

`shared/src/data/recipeGates.test.ts` covers recipe reachability for stances, rites, runes, abilities and items.

`server/test/t2ProgressionEconomy.test.ts` locks the three current T2 stance homes,
gates, exact essence/catalyst costs, and the introductory versus specialized
economy bands.

`server/test/stancesUnplaced.test.ts` covers all four implemented postures end to end —
Time to Strike's empowered/ordinary split, Reaper's earn-leave-spend rules including
that a kill outside the stance must NOT refresh, Warding's duration and potency reductions
through the shared seam and at the live monster-DoT site, and Powering Up's in-combat-only
charge, its cap, its release window and the discard on combat ending — plus the invariant
and asserts that all four now have exactly one authored recipe.

Known balance follow-ups: tune all magnitudes/costs/gates; decide whether post-combat Berserker damage is desirable with Lingering Battle; add authored icons and a client switch animation for the emitted event.

Known scope limit: the stance damage-taken multiplier and Brawler's crowd mitigation both
ride the `onDamageTaken` listener, which direct monster attacks emit but node AoE and DoT
ticks do not. That was already true of Brawler before this pass; widening it is a combat-
pipeline change, not a stance change.


## Final damage follow-up — 2026-09-12

Static offense now uses `damageDealtPct` at final damage resolution, rather than
resizing Attack. Core and stance factors multiply independently. Reaper momentum
and Powering Up release also amplify all owned damage, including on-hit and DoT,
and remain active after leaving their stance. Predator/Execute/Time to Strike
retain their explicitly hit-specific behavior. Plating, movement, evasion and
attack-speed modifiers retain their existing axes. Self-damage remains an HP cost.

Core/stance incoming factors now share the early `onDamageTaken` seam and cover
non-pipeline AoE/DoT/hazard damage through the same resolver. They never add to
normal DR. Brawler's live aggressor reduction is included in the authoritative
final-damage-taken value mirrored to the character sheet. HP-gated stance bonuses
are evaluated from the same HP fraction on both equipment comparison sides.
