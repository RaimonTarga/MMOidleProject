> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/rune-system-current-state.md`. Kept for design rationale — do not treat as current.

# Design Document: Automated Behavior Engine & Rule Arbitrator

**Status:** Working Draft (Wave 1 Rework Architecture)
**Target Architecture:** Flat Token Sandbox Budget / Single-Attack Automated Loop

---

## 1. System Core Philosophy

The core objective is to transition the game from a rigid 3×3 MVP (using overlapping OR’d boolean logic blocks) into an expandable, predictable **Categorized Token Loop**. The engine processes player-configured rule scripts from **top to bottom** every server tick. The first rule to evaluate to `true` within a behavioral channel claims that channel for the tick; lower-priority rules in that same channel are ignored for that pass.

### Key System Rules

* **No Active Skill Hotbars:** Runes do not grant or cast active buttons or skills. They modify positioning, targeting filters, and engine attribute states dynamically.
* **Index Order Priority:** Structural tiebreaking is governed strictly by the rule's vertical position in the script array.
* **Strict State Separation:** Overworld navigation map-routing functions entirely separate from tactical combat movement vectors to eliminate engine-level state conflicts.

---

## 2. Core Behavioral Channels

To prevent simultaneous, conflicting engine instructions (such as attempting to flee and orbit at the same time), all tactical and strategic actions are strictly bound to one of four mutually exclusive channels.

| Channel (Category) | Engine Operational Scope | Priority Pass |
| --- | --- | --- |
| **1. MOVEMENT** | Real-time combat positioning, kiting vectors, tactical retreats, and combat stances. | **Highest** |
| **2. TARGETING** | Filters the single automated attack loop to evaluate who gets attacked when multiple targets are in range. | **Second** |
| **3. OOC_MAINTENANCE** | Out-of-combat optimizations, resource management, and safety recovery thresholds. | **Third** |
| **4. GLOBAL_STRATEGY** | Overworld macro-navigation and node routing. Automatically suppressed when combat state is active. | **Lowest** |

---

## 3. The Functional Vocabulary Catalog

The hybrid progression model ensures players have access to an **Open Baseline Syntax** immediately, while specialized modifiers are unlocked deterministically via biome progression or bosses.

### Condition Fragments

| Condition ID | Parameter | Cost | Tier | Functional Logic |
| --- | --- | --- | --- | --- |
| `always` | None | 0 RP | T1 | Evaluates to `true` on every engine tick. |
| `in-combat` | None | 1 RP | T1 | Returns `true` if an enemy has active aggro on the player. |
| `when-idle` | None | 1 RP | T1 | Returns `true` if no enemies are engaged and combat state is cleared. |
| `hp-below` | Percentage (`X%`) | 1 RP | T1 | Triggers when player health falls below the threshold. |
| `ammo-below` | Percentage (`X%`) | 1 RP | T1 | Triggers when class-specific ammo falls below the threshold. |
| `in-party` | None | 1 RP | T1 | Returns `true` if actively grouped with one or more players. |
| `ally-hurt` | None | 2 RP | T4 | Triggers if any party member drops below a 75% HP threshold. |
| `target-casting` | None | 2 RP | T4 | Triggers during an enemy empowered telegraphed cast window. |
| `n-aggro` | Integer (`N`) | 2 RP | T4 | Triggers when surrounded by $N$ or more active targets. |

### Action Fragments

| Action ID | Channel | Cost | Tier | Engine Execution |
| --- | --- | --- | --- | --- |
| `chase-enemy` | MOVEMENT | 0 RP | T1 | Paths directly into the baseline range vector required by the equipped weapon frame. |
| `flee` | MOVEMENT | 1 RP | T1 | Paths directly away from the current enemy center-of-threat coordinates. |
| `orbit` | MOVEMENT | 2 RP | T1 | Circumnavigates the target at maximum weapon range to exploit target velocity. |
| `step-back` | MOVEMENT | 3 RP | T4 | Breaks positioning momentarily to back out of a telegraphed AoE radius. |
| `focus-closest` | TARGETING | 0 RP | T1 | Standard target-locking fallback mechanic. |
| `focus-leader-target` | TARGETING | 1 RP | T1 | Locks the automated single attack onto the designated party leader's current target. |
| `focus-lowest-hp` | TARGETING | 2 RP | T4 | Prioritizes target with the lowest remaining health pool to reduce enemy density. |
| `focus-shielded` | TARGETING | 2 RP | T4 | Bypasses standard proximity to lock onto targets with active mitigation layers. |
| `tactical-reload` | OOC_MAINTENANCE | 1 RP | T1 | Initiates an accelerated weapon reload sequence outside of combat active frames. |
| `wait-for-regen` | OOC_MAINTENANCE | 1 RP | T1 | Freezes physical player coordinates until player HP or Shields hit 100%. |
| `auto-path-enemy` | GLOBAL_STRATEGY | 0 RP | T1 | Scans overworld map tier grid for the nearest valid monster spawn coordinate and routes toward it. |

---

## 4. Immutable Initial Loadout (Safety Net Blueprint)

To ensure immediate onboarding out-of-the-box and prevent character aimlessness, all new characters run this hardcoded configuration at 0 RP cost:

1. **Rule 1 (OOC_MAINTENANCE):** `when-idle` + `ammo-below(100%)` $\rightarrow$ `tactical-reload`
2. **Rule 2 (MOVEMENT):** `in-combat` $\rightarrow$ `chase-enemy`
3. **Rule 3 (TARGETING):** `in-combat` $\rightarrow$ `focus-closest`
4. **Rule 4 (GLOBAL_STRATEGY):** `when-idle` $\rightarrow$ `auto-path-enemy`

---

## 5. Combat Stances (Tentative Layer)

Stances act as core attribute modifiers applied to the engine loop. They are bound exclusively to the **MOVEMENT** channel to prevent multi-stance stacking.

### Core Stance Matrix

```
                      +-------------------+
                      |   BASE INSTANCE   |
                      | (Default Profiles)|
                      +-------------------+
                                |
        +-----------------------+-----------------------+
        |                                               |
        v [Confirmed - 100%]                            v [Tentative - 75%]
+-------------------------------+               +-------------------------------+
|       stance-vanguard         |               |        stance-evasive         |
| - Binary Threat: Aggro Lock   |               | - Binary Threat: Aggro Drop   |
| - Move Speed: -40% Penalty    |               | - Move Speed: +40% Buff       |
| - Combat Stat: Under Review   |               | - Combat Stat: -80% DPS Cut   |
+-------------------------------+               +-------------------------------+

```

### Stance Specific Logic & Stress Testing

#### A. `stance-vanguard` (100% Confirmed)

* **Aggro Rule:** Binary state lock. When active, the monster's target pointer is forcefully overridden to lock onto the tank, neutralizing any threat generated by high-damage party specs.
* **Mobility Penalty (-40%):** Enforced to solve the "infinite kite-tanking" exploit. Ranged kiters attempting to use the taunt stance will lose their speed buffer and be caught by the monster acceleration system.
* **The Defensive Bonus Dilemma (Under Review):**
* *The Problem:* Adding defensive bonuses (+% Damage Reduction or flat plating) risks making it an automatic choice for solo players who just want to facetank content, reducing tactical complexity.
* *Alternative 1 (Damage Penalty):* Lowering damage output while in the stance forces party-reliance, but runs the risk of making tank execution boring or slowing down solo progression loops to a crawl.
* *Alternative 2 (Status Quo):* The stance offers *no* defensive buffs natively. It is purely a positioning and aggro tool. The tank's survival must come entirely from choosing the right physical gear frame (Heavy Frame/Plating) or choosing when to drop the stance.



#### B. `stance-evasive` (75% Confirmed)

* **Aggro Rule:** Completely sheds the binary taunt override.
* **Modifiers:** Grants $+40\% \text{ Movement Speed}$ and increased evasion chance, but applies a $-80\% \text{ Attack Damage and Attack Speed}$ penalty.
* **Intended Use:** Designed as a tactical retreat mechanism (e.g., `hp-below(30%) → stance-evasive`) to drop aggro and outrun the monster's acceleration vector, or as an overworld transit optimization tool between spawn coordinates while `when-idle`.

#### C. Other Stance Concepts (Heavy Speculation / Deferred)

* `stance-sniper`: Immobile root, increased range, massive critical strike multipliers.
* `stance-berserk`: Massive damage output spike, but introduces a proportional self-inflicted Max HP percentage drain per second to avoid free party-tank exploits.
* `stance-juggernaut`: Lockout immunity against movement crowd control (slows, knockbacks), locked baseline movement speed.

---

## 6. Structural Controls and Guardrails

1. **Global Stance Switch Cooldown:** Changing stances triggers a hard global lock on the stance subsystem for 1.5–2 seconds to eliminate rapid script flickering on high-frequency server ticks.
2. **Kite Exploitation Prevention:** Monsters run a native exponential acceleration check. If an entity has aggro but cannot land a hit within a certain window, its baseline chasing speed scales dynamically until an attack connects, naturally punishing unmitigated kiting setups.

---