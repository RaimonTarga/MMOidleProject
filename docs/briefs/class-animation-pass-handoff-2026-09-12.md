# Class animation pass — handoff for the MONSTER/BOSS pass

**Date:** 2026-09-12 · **Status:** class side SHIPPED, uncommitted on `develop`,
**zero visual verification** · **Next:** same treatment for mobs and bosses.

Read this for the seams and the rules. Do **not** re-derive them.

Also read **[monster-boss-ability-readability-handoff-2026-09-02.md](monster-boss-ability-readability-handoff-2026-09-02.md)**
first — it is an OPEN handoff covering monster/boss ability *readability* (cast
footprints, phase state, callouts) and it already lists remaining boss
conversions by tier/biome. That doc owns ability readability; this one owns
attack-animation identity. They overlap; reconcile before authoring.

---

## What shipped (class side)

17 new files in `client/src/fx/`, 22 exports, all wired and typecheck-clean.

| Area | Files |
|---|---|
| Baselines | `strikerSlash.ts` (cadence), `squireSlam.ts` (cooldown) |
| Range variants | `spearThrust.ts` Lancer · `bladeWave.ts` Phantom-Blade · `pikeBrace.ts` Phalanx · `siegeBlow.ts` Sentinel · `pointBlankShot.ts` Breacher · `arcDischarge.ts` Haunt |
| T4 path attacks | `hollowStrike.ts` Destroyer · `heavyShell.ts` Sniper · `lightningDagger.ts` Stormdancer · `bleedOpen.ts` Hemomancer · `overheatVent.ts` Melter · `equinoxArc.ts` Equinox |
| T4 thresholds | `t4Triggers.ts` (7 cues: Justicar, Berserker, Scrapper, Sunderer, Pyromancer, Icebreaker, Winter Warden) |
| Element tint | `elementTint.ts`, `dotTick.ts` |

`fxImpact` and `fxSlash` were deliberately **left untouched** — they are the
generic monster styles.

---

## Reusable seams (use these, don't rebuild)

- **`pushClientEffect(ctx, id)`** in `server/.../combat/engine/combatPipeline.ts`
  — tag an exchange with a one-shot FX id. Replaces the
  `Array.isArray(existing) ? [...existing, id] : [id]` copy-paste.
- **`shared/src/protocol/clientEffects.ts`** — the home for cross-boundary FX
  ids. Older archetype tags (`swiftblade`, `void-discharge`, …) are still
  declared twice; migrate on touch. **Add new ones here, never as literals.**
- **`AttackTint { glow, particles }`** + `resolveAttackTint()` in `elementTint.ts`
  — every attack FX takes an optional tint. `elementColor(element)` is the
  canonical numeric palette (mirrors `ELEMENT_STYLE`, so ticks/numbers/tints
  cannot drift).
- **`blendTints()`** — weighted median on the OkLCh **hue circle** with gamut
  fitting. Only for two compatible hues sharing one channel.
- **`fxDotTick(scene, x, y, element)`** — per-tick mote for bleed/poison/frost/
  fire. `conflagration`/`lightning`/`doom` keep bespoke ticks.
- **`t4Triggers.ts`** has shared `shards()` / `ring()` / `flash()` helpers.
- **`zigzagPoints()`** is now exported from `lightning.ts`.
- **`AURA_REGISTRY` + `BUFF_AURA_BY_ID`** in `client/src/fx/aura.ts`.
- **`bossCues.ts`** already exports 13 boss cues: `fxSummonBurst`, `fxShieldUp`,
  `fxMorph`, `fxBossRoar`, `fxBestialFrenzy`, `fxDireHowl`, `fxChestBeat`,
  `fxThornBarrage`, `fxShellUp`, `fxTrenchSweep/Mine/Current/Pulse`.

---

## Design rules established (keep these)

1. **Never tint the bright core.** Colour is how *empowered* and *execution*
   read; the element takes the wide glow, flash and particles only.
2. **Weight = layer, not average.** Averaging two hues in RGB collapses toward
   grey (measured: fire+frost 50/50 → `#afae95`, 14% saturation). One channel
   also cannot say "green AND violet". Give each contributor its own layer.
3. **Shard direction is grammar.** Outward = something broke. Inward = something
   closed on the target. Icebreaker vs Winter Warden are deliberate mirrors.
4. **Chip buffs are authoritative and must never be removed.** Everything with a
   buff has a chip; an aura is a *visual representation* of a chip. Auras are
   derived client-side from `activeBuffs`, so one cannot exist without its chip.
   Auras serve two jobs only: visual **progression** (power climbing with
   stacks) and opposed **state** (Equinox's two phases).
5. **Signature FX are excluded from tinting** when colour is a *mechanic tell* —
   Dualslinger's red/blue alternation IS the on-hit rhythm indicator.
6. **Don't animate pure stat modifiers.** A node with no discrete event gets
   nothing; forcing an animation adds noise.

---

## Traps (all cost real time; do not rediscover)

- **Never tween `scaleX` on a Graphics built from the world-space attack
  vector.** `scaleX` is *screen* X, so "lengthen along the firing axis" silently
  squashes the shape's **width** when the attack is vertical. Build along local
  `+x` and `setRotation(angle)`. Hit twice this session.
- **A tag string near a `pushEvent` does not mean the client sees it.** Justicar
  passed `['verdict-execute']` to `recordMonsterDamagedByPlayer` — the damage
  **log** — while its event had no `effects` field at all. Check the event object.
- **Phaser eases:** it is `Stepped` (not `Steps.*`), step count via
  `easeParams: [n]`. `Power2` is real but registered unquoted (`Power2: Cubic.Out`).
- **`BuffId` in `shared/src/components/combat/buffs.ts` is a closed union** —
  the enforcement point for the chip rule. An unregistered chip id will not compile.
- **`shared/` has ONE entry point.** New shared modules need a re-export in
  `shared/src/index.ts`; deep imports do not resolve.
- **Effect-tag cross-check.** Diff emitted-vs-handled tags after editing; a tag
  on one side only fails silently. Same for `ATTACK_FX_BY_RANGE` keys, which are
  `Record<string, …>` — a typo falls through to the archetype and TS cannot see it.

---

## Starting data for the monster/boss pass

**148 monster entries.** `attackStyle` census (every style already has an FX in
`ATTACK_FX_BY_STYLE`):

```
41 impact     25 poison    15 fire      13 frost     8 slash
 7 quake       7 magic      6 bite       5 sandblast  3 talons
 3 arrow       2 void       2 stonespit  2 hex        2 boulder
 2 bear-claws  1 gunshot
```

**The obvious headline: 41 monsters share `impact`**, which is also the
`?? ATTACK_FX_BY_STYLE.impact` fallback for anything unrecognised. That is the
monster-side equivalent of the Squire-baseline finding — one generic orange bloom
doing the work of a quarter of the bestiary. Splitting it by family (heavy
slam / claw / blunt-beast / construct …) is likely the highest-leverage move.

**Bosses:** `bossesT1..T4.ts` + `bossPatterns.ts`. `bossScript` cues in use:
`barrage`, `chest-beat`, `dive-bomb`, `frenzy`, `frost-tusk-impact`, `howl`,
`huge-boulder`, `power-shot`, `rime-pounce`, `roar`, `savage-maul`, `shield`,
`strong-kick`, `trench-carapace`, `trench-current`, `volcanic-eruption`,
`volcanic-guard`, `volcanic-shell`.

**Suggested method** (what worked here): census styles → read the actual
mechanic, not the name → classify as *attack identity* / *threshold cue* /
*persistent state* / *skip* → fix shared channels before authoring bespoke FX.

---

## Verification status

**Nothing has been seen in motion.** Phaser FX have no test coverage; the whole
claim is "typechecks clean and wired". A 40-item visual checklist was produced in
the session that created this doc. Highest risks: empowered/execution legibility
under an element tint, and five simultaneous auras reading as noise.

Live detail lives in the agent memory `project_attack_animation_pass.md`.

## Still unbuilt (class side, by choice)

- **T1-frame axis** — Flurry/Skirmisher/Breaker etc. are pixel-identical. Do it
  by modulating scale/speed/palette, not three animations per class.
- Minor polish on covered nodes: Bounty hunter stack markers, Cannoneer charge tell.
