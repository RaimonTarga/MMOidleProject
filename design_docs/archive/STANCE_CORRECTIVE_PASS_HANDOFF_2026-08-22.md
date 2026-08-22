> **ARCHIVED (2026-08-22) — implemented.** Live state: `docs/stances-current-state.md`;
> the authoring contract it established is `docs/stances-authoring-guide.md`. Kept for the
> rationale behind the percentage model, the no-max-HP rule, and the Rune-owns-conditions
> split. Numbers here are the seeds that shipped, not tuned balance.

# Stance Corrective Pass Handoff

**Date:** 2026-08-22  
**Scope:** small corrective pass before full game balance/playtesting.  
**Authority:** `stances-authoring-guide.md` defines the stance design contract; `stances-current-state.md` describes the intended/current behavioral runtime. The existing flat values in `shared/src/stances.ts` are first-pass placeholders and should not be treated as balanced design.

This is **not** a stance redesign. Keep the current eleven-stance cast and the existing Rune-driven switching model. The goal is to make the authored modifiers scale correctly, expose the real server behavior to the player, fix obviously stale progression gates, and leave the system in a trustworthy state for balance testing.

---

## 1. Core correction: stances should use scale-safe temporary modifiers

The current `stances.ts` uses large flat values such as `attack: +65`, `maxHp: +250`, `plating: +45`, and `speed: +70`.

This is the wrong authoring model for a temporary modal system that must remain meaningful across tiers.

### Required direction

Prefer **percentage / multiplicative modifiers** for temporary stance effects:

- Attack -> `% Attack` / Attack multiplier.
- Attack Speed -> `% Attack Speed`.
- Plating -> `% Plating` where a stance needs to modify plating.
- Movement Speed -> `% Movement Speed`.
- Incoming damage -> preferably a stance-local multiplicative damage-taken modifier rather than piling large additive values into global DR.
- Evasion may remain an authored percentage-point mechanic where appropriate because it is already a percentage stat.
- Recovery stance behavior should activate a fraction of the existing Recovery stat, not grant large flat Recovery.

### Do not change Max HP from a stance

Remove Max HP changes from Tanking or any other stance.

Stances are temporary modes and can switch automatically. Repeatedly changing max HP creates unnecessary state/HP-preservation complexity and makes the posture scale strangely across progression.

Tanking should become harder to kill through **mitigation / plating / offensive sacrifice**, not by granting a temporary HP pool.

---

## 2. Rune conditions vs stance-intrinsic conditions

Preserve the authoring-guide rule:

> **Runes own conditions wherever practical. The stance owns the posture.**

Examples:

- `HP Below 25% -> Enraged` is a Rune rule. Enraged itself does not need an internal HP threshold.
- `HP Above 90% -> Perfection` is a Rune rule.
- `Target HP Below 25% -> Execute` can be a useful transition, but Execute also has its own target-HP damage behavior.
- `3+ Aggressors -> Brawler` is a Rune rule; Brawler's mitigation then reads the actual aggressor count.

Do not hard-code Rune transition conditions into a stance merely because that condition is an obvious use case.

Intrinsic behavior that belongs to the stance itself remains server-side:
- Berserker self-damage.
- Predator detection reduction and armed opening hit.
- Brawler aggressor-count mitigation.
- Execute low-target-HP multiplier.
- Recuperating in-combat Recovery activation.

---

## 3. Rough starting numbers

These are **rough balance seeds**, not final targets. The dedicated balance/playtest pass comes afterward.

Where the current runtime already has a behavioral magnitude documented in `stances-current-state.md` (2% Berserker self-damage, 80% Recuperating Recovery, Predator 50% detection / +75% opener, Brawler 40% cap, Execute +75% at <=25%), preserve those as the initial behavioral values unless implementation testing proves they are broken.

### Offensive Stance — 1 RP

**Identity:** simple introductory offense-for-defense trade.

Proposed:
- **+15% Attack**
- **+10% Attack Speed**
- **+10% damage taken**

Tooltip:
> **+15% Attack, +10% Attack Speed. You take 10% more damage.**

### Defensive Stance — 1 RP

**Identity:** simple introductory defense-for-offense trade.

Proposed:
- **-15% Attack**
- **+20% Plating**
- **10% less damage taken**

Tooltip:
> **+20% Plating and 10% less damage taken. -15% Attack.**

### Tanking Stance — 3 RP

**Identity:** extreme survival posture with severe pressure loss.

Proposed:
- **+40% Plating**
- **25% less damage taken**
- **-40% Attack**
- **-20% Attack Speed**
- **NO Max HP modifier**

Tooltip:
> **+40% Plating and 25% less damage taken. -40% Attack and -20% Attack Speed.**

### Enraged Stance — 3 RP

**Identity:** dangerous offensive posture, normally entered through a low-HP Rune rule.

Proposed:
- **+30% Attack**
- **+15% Attack Speed**
- **+15% damage taken**

Do **not** put an HP threshold inside the stance. The Rune decides when to enter it.

Tooltip:
> **+30% Attack and +15% Attack Speed. You take 15% more damage.**

Optional UI helper text may say that it pairs naturally with HP-based Rune rules, but this must not imply the stance only functions at low HP.

### Perfection Stance — 2 RP

**Identity:** efficient posture for builds confident they can avoid being meaningfully pressured.

Rough proposed shape:
- **+12% Attack**
- **+12% Attack Speed**
- **+12% Movement Speed**
- **-20% Plating**

This is intentionally less raw offense than Enraged/Berserker and trades away robustness rather than directly increasing damage taken.

This is the least locked numerical shape in this document. Preserve the identity, not these exact values.

Tooltip:
> **+12% Attack, Attack Speed, and Movement Speed. -20% Plating.**

### Fleeting Stance — 2 RP

**Identity:** escape/reposition posture; severe offensive sacrifice.

Proposed:
- **+35% Movement Speed**
- **+15 percentage points Evasion**
- **-35% Attack**
- **-20% Attack Speed**

Tooltip:
> **+35% Movement Speed and +15% Evasion. -35% Attack and -20% Attack Speed.**

### Berserker Stance — 4 RP

**Identity:** transformative offense that deterministically kills the player if held too long.

Proposed static modifiers:
- **+35% Attack**
- **+20% Attack Speed**
- **+15% damage taken**

Behavioral effect:
- Preserve the documented **2% max HP direct self-damage each second while combat state persists**.
- Preserve its explicit bypass/death semantics unless a separate implementation audit finds they do not match the current design.

Tooltip:
> **+35% Attack and +20% Attack Speed. You take 15% more damage and lose 2% of max HP each second while in combat. This self-damage can kill you.**

### Recuperating Stance — 4 RP

**Identity:** surrender offense to keep most Recovery active in combat.

Proposed:
- **-50% Attack**
- **-30% Attack Speed**
- Preserve **80% Recovery active in combat**
- Remove the current **flat +4 Recovery** unless a later balance pass specifically proves it is needed.

Tooltip:
> **80% of your Recovery remains active in combat. -50% Attack and -30% Attack Speed.**

### Predator Stance — 3 RP

**Identity:** approach unseen and cash that setup into one strong opening hit.

Proposed static modifier:
- **+15% Movement Speed**
- **-10% Attack**

Behavioral effects:
- Preserve **50% reduced detection**.
- Preserve **+75% opening-hit damage**.
- Opener arms only while Predator is active out of combat and is consumed by the first qualifying hit.

Tooltip:
> **50% reduced enemy detection and +15% Movement Speed. Your first hit after approaching out of combat deals 75% more damage. -10% Attack.**

### Brawler Stance — 3 RP

**Identity:** trade offense for scaling protection when several enemies are engaging you.

Proposed static modifier:
- **-10% Attack**

Behavioral effect:
- Preserve diminishing incoming-damage reduction based on authoritative aggressor count.
- Preserve the documented **40% maximum**.

Suggested rough curve:

| Active aggressors | Damage reduction |
|---:|---:|
| 1 | 8% |
| 2 | 16% |
| 3 | 24% |
| 4 | 31% |
| 5+ | 40% |

Exact curve is a balance lever; it should be meaningfully diminishing and capped.

Tooltip:
> **-10% Attack. Gain damage reduction for each enemy actively engaging you, from 8% against one attacker up to 40% against five or more.**

### Execute Stance — 3 RP

**Identity:** weak neutral pressure in exchange for a powerful finishing phase.

Proposed:
- **-20% Attack**
- Preserve **+75% damage against targets at or below 25% HP**.

Tooltip:
> **-20% Attack. Deal 75% more damage to targets at or below 25% HP.**

---

## 4. Client presentation is part of this corrective pass

The stance UI must describe **actual effective behavior**, including server-runtime effects.

Current blurbs are flavor summaries and are not sufficient as mechanic tooltips.

For every stance, the visible effect text should include:

1. all static benefits;
2. all static drawbacks;
3. server-side behavioral effect;
4. intrinsic thresholds/caps;
5. whether an effect only functions in combat / out of combat;
6. whether an effect can kill the player;
7. stance destination RP cost.

Information that must no longer be hidden:
- Berserker loses 2% max HP/sec in combat and can die from it.
- Predator has 50% reduced detection and a +75% first-hit effect, including how that opener arms.
- Brawler scales with aggressor count and caps at 40%.
- Execute activates against targets <=25% HP.
- Recuperating activates 80% of the player's Recovery in combat.

### Do not confuse Rune conditions with stance effects

The stance tooltip should not say:
> "Activates below 25% HP"

for Enraged, because that is not intrinsic behavior.

The Rune rule UI already exposes:
> `HP Below 25% -> Switch Stance -> Enraged`

The stance tooltip only describes what Enraged does once active.

---

## 5. Recipe/progression cleanup

The current recipe file contains progression gates that no longer match the biome structure.

Known stale placements:
- **Fleeting** is T2 but placed in Tundra, which does not exist at T2.
- **Brawler** is T3 but placed in Plains, which has retired by T3.
- **Recuperating** is T4 but placed in Forest, which has retired well before T4.

Re-home these recipes into biomes that actually exist at their intended tier.

Suggested low-drama homes:
- **Fleeting T2 -> Jungle**.
- **Brawler T3 -> Jungle**.
- **Recuperating T4 -> Jungle**.

These placements are convenience/progression fixes, not deep thematic commitments. If the project already has a newer stance-placement map, prefer that map.

### Economy

Do **not** rebalance essence or catalyst costs in this pass. Preserve existing costs as far as possible when re-homing recipes.

---

## 6. Implementation guidance

The exact internal key names may differ from the proposal above. The important requirement is the behavior.

If the existing generic stat system cannot express scale-safe stance multipliers cleanly:
- add stance-specific percentage/multiplier fields or mechanic readers;
- do not emulate `% Attack` by guessing a flat Attack amount appropriate to one tier.

For incoming damage:
- prefer a stance-local multiplicative damage-taken modifier where practical;
- avoid stacking enormous additive `damageReduction` values with gear/class DR in a way that causes nonlinear runaway mitigation.

Switching must continue to preserve:
- current HP percentage;
- unrelated cooldowns;
- class mechanic state/resources;
- statuses;
- barriers/shields;
- unrelated combat counters.

Only the outgoing/incoming derived posture should change.

---

## 7. Verification checklist

Before entering the general balance pass, verify:

### Static scaling
- [ ] No stance grants flat Max HP.
- [ ] Attack modifiers are percentage/multiplicative rather than tier-dependent flat Attack.
- [ ] Plating and Movement bonuses are scale-safe rather than large flats.
- [ ] Recuperating no longer relies on flat Recovery as its identity.

### Behavioral runtime
- [ ] Berserker applies 2% max-HP self-damage each second in combat and can kill correctly.
- [ ] Predator reduces detection, correctly arms the opener OOC, and consumes it on first qualifying hit.
- [ ] Brawler uses authoritative aggressor count and respects its cap.
- [ ] Execute applies its multiplier only at/below the target HP threshold.
- [ ] Recuperating activates the intended fraction of Recovery in combat.

### UI
- [ ] Tooltip exposes all static modifiers.
- [ ] Tooltip exposes all hidden server-side effects.
- [ ] Thresholds/caps/durations are visible.
- [ ] Rune-owned transition conditions are not falsely presented as stance-owned conditions.
- [ ] Destination RP cost is visible.

### Progression
- [ ] No recipe is placed in a biome/tier that does not exist.
- [ ] Recipe economy is otherwise unchanged.

---

## 8. Balance status after this pass

These numbers are deliberately only **starting points**.

After the corrective pass:
1. freeze stance mechanics;
2. enter the general player/monster/item balance loop;
3. tune stance magnitudes using real class builds and actual combat;
4. only reopen stance design if testing shows a structural problem that numerical tuning cannot fix.

The objective of this pass is simply:

> **Make the existing stance system truthful, scalable, readable, and testable.**
