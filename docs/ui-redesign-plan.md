# Desktop UI Redesign Plan

**Status:** approved for incremental implementation; not a broad rewrite  
**Last reviewed:** 2026-07-24
**Scope:** desktop React HUD, rails, overlays, and modal presentation around the
Phaser game viewport. Mobile is regression-only until the final adaptation phase.

This document is the cross-agent implementation guide for the MMO Idle desktop
UI redesign. It records the architecture audit, sequencing, review gates, model
budget recommendations, and handoff requirements so later agents do not need to
re-derive the plan.

The target is an old-school MMO interface with a restrained ritual-machine or
arcane-apparatus identity: opaque iron rails, worn materials, engraved edges,
tactile controls, modern information clarity, and limited early-tier glow.

---

## 1. Non-negotiable guardrails

- Preserve the central Phaser viewport and the left rail / game / right rail
  desktop composition.
- Do not rewrite gameplay systems. The server remains authoritative and the
  React UI continues to send intent through existing helpers and `hudBus`.
- Implement one visually reviewable vertical slice at a time.
- Do not redesign all modals together.
- Do not change mobile intentionally before the final phase. Scope desktop CSS
  under a desktop owner or `min-width: 1101px` where shared components are used.
- Do not expose every system from the beginning merely because the UI has room.
  Unlock visibility needs an explicit policy backed by authoritative state.
- Do not create eight interfaces for eight tiers. Use one stable component
  system with tier-dependent tokens and modifiers.
- Do not bake placeholder glyphs into component contracts. Components accept an
  icon source or asset reference and provide a temporary fallback.
- Do not edit generated atlas PNG/JSON files by hand. Author assets under
  `art/src`, dry-run generation first, and pack through the documented pipeline.
- Preserve unrelated and pre-existing working-tree changes.

---

## 2. Model budget guide

Use the lowest band listed for a phase unless its escalation conditions apply.
Capability labels are deliberately independent of a specific vendor release.

| Band | Models | Use for |
|---|---|---|
| **High** | ChatGPT 5.6 Sol or Claude Fable 5 | Cross-boundary architecture, new reusable primitives, protocol/state semantics, complex responsive behavior, or decisions that will constrain many later passes. |
| **Medium** | Terra or Opus | Bounded component refactors, implementing an approved visual system, moderate accessibility/state work, and migrations with clear acceptance criteria. |
| **Low** | Sonnet or Luna | Mechanical migrations after an exemplar exists, token replacement, asset-frame hookup, screenshot capture, documentation, and narrow CSS cleanup. |

### Escalation rules

Escalate one band when any of these becomes true:

- The phase needs a new shared protocol field or changes server/client semantics.
- More than two independent React roots or both React and Phaser must coordinate.
- The implementation changes shared mobile/desktop components rather than only
  desktop wrappers.
- The agent discovers that the approved primitive cannot express an existing
  panel without adding exceptions.
- Accessibility, focus, or overlay ordering cannot be preserved with the
  documented approach.

Do not escalate merely because a file is large. Split the work into a smaller
pass first.

---

## 3. Verified current architecture

### Layout and ownership

- `client/index.html` defines fixed 260px desktop rails and a flexible center.
  At `max-width: 1100px`, the rails and desktop Auto Combat control hide and
  `MobileHUD` takes over.
- `client/src/main.ts` mounts the two rails, ability dock, Auto Combat, status
  bars, and overlays as independent React roots around the Phaser game.
- The roots share Jotai's default store. Cross-root visual theme state therefore
  belongs on `document.documentElement`, `body`, or `#app`, not inside one root.
- Phaser owns the lower-right minimap in
  `client/src/scenes/game/overlays.ts`. Matching its frame to the React HUD is a
  separate Phaser presentation change.

### State and interaction

- `client/src/hud/atoms.ts` owns player presentation and modal-open state. It
  already includes `playerTierAtom`, so tier styling does not need new gameplay
  authority.
- Gameplay actions flow through intent helpers and `hudBus`; presentation work
  must not emit socket events directly.
- Tactical Mode is synchronized from Phaser through `hudBus` into local React
  state in the right rail.
- Several modal open states are independent booleans. Multiple same-z-index
  overlays can currently be open, while `client/src/input/overlayStack.ts`
  closes them in a manually defined order.

### Reusable pieces already worth keeping

- `sidebar-panel`, collapsible panel headers, stat rows, bars, and HUD tooltips.
- `RightNavButton` for icon-led system navigation.
- `UIIcon`, `BuildIcon`, and the atlas-frame lookup layer.
- Jotai presentation state and `hudBus` intent routing.
- Separate desktop/mobile ability rendering paths.
- `ArchetypeMechanics`, currently shared by desktop and mobile.
- Existing portal-based modal behavior and backdrop-click handling, pending a
  shared shell.

### Duplication and pressure points

- `client/src/hud/hud.css` owns rails, stats, class mechanics, combat controls,
  overlays, and mobile styling. Split by concern as components are touched; do
  not perform a standalone mass CSS rewrite.
- Inventory, Crafting, Map, and Passive Tree duplicate backdrop, frame, header,
  title, and close-button styling.
- `BuildPanel` borrows shell and tab styles from multiple unrelated stylesheets.
- `ArchetypeMechanics` contains every class branch, including an oversized DoT
  detail panel, and needs a stable wrapper plus per-mechanic components.
- `PartyPanel` and parts of the ability UI contain inline visual styling that
  should move into named component classes when those areas are redesigned.

### Intent data gap

The current Intent panel uses hard-coded action, reason, and automation copy.
The server already publishes `HasAutoIntent`, but that contract only includes:

- action kind: attack, follow, travel, flee, or idle;
- target monster type for attacks;
- leader id for following;
- destination biome for travel.

It does not include the decision reason or triggering automation/rune rule. The
compact panel can be made truthful from existing state. The expanded explanation
requires a deliberate shared contract and server-authored presentation payload;
the client must not infer authoritative AI reasoning from incidental state.

---

## 4. Target primitive set

Do not build this entire list up front. Add a primitive when its exemplar phase
needs it, then reuse it in later phases.

- `HudPanel` - opaque rail/panel surface with restrained bevel and tier hooks.
- `DisclosureHeader` - title, compact summary, chevron, and accessible state.
- `HudDock` - lightweight shared bottom-HUD grouping surface.
- `AbilitySlot` - icon source plus cooling, ready, active, triggered, disabled,
  selected, and optional key-hint presentation.
- `MechanicFrame` - stable location and footprint for bespoke class widgets.
- `GameDialog` - portal, backdrop, size variant, focus boundary, and close policy.
- `DialogHeader` - title, optional icon/actions, and close button.
- `DialogTabs` - compact icon-capable tabs with shared selected/focus states.
- `GameIcon` or equivalent icon-source contract - atlas frame, asset reference,
  or supplied React node, with a fallback that does not affect layout.

Core token families should cover material surfaces, engraved edges, text,
semantic status colors, Technique/Guard accents, spacing, slot size, ornament
opacity, energy-channel intensity, focus rings, and motion intensity.

---

## 5. Implementation phases

Every phase ends at its review gate. Do not automatically continue into the next
phase merely because the current one compiled.

### Phase 0 - Baseline and regression matrix

**Model:** Low - Sonnet/Luna  
**Type:** verification and documentation  
**Dependencies:** none

Tasks:

1. Capture the current desktop at 1366x768, 1440x900, 1920x1080, and 1101px.
2. Capture the 1100px mobile boundary without modifying mobile.
3. Record Auto Combat ON/OFF and ability ready/cooling/active/triggered states.
4. Record character compact/expanded, Intent compact/expanded, death-disabled
   economy controls, and at least one open modal.
5. Run the client typecheck.

Review gate: baseline images and state matrix are available for comparison.

Escalate to Medium only if reliable state setup needs a reusable dev fixture.

### Phase 1 - Desktop combat dock vertical slice

**Model:** Medium - Terra/Opus  
**Type:** bounded structure and visual styling  
**Dependencies:** Phase 0

This is the recommended first implementation task after the current rail work.
Treat the existing in-progress desktop ability dock as the starting point, not a
reason to rewrite `AbilityBar`.

Tasks:

1. Replace the heavy tray/category framing with one lightweight dock.
2. Distinguish Technique and Guard with a narrow edge, notch, or restrained
   accent instead of category subpanels.
3. Keep slots approximately 44-48px and horizontally scalable.
4. Render cooling, active, triggered, disabled, and ready directly on the slot.
5. Replace continuous readiness glow with a static border/notch or a brief pulse
   when readiness changes.
6. Keep names below when space permits and always provide a tooltip.
7. Support an optional `keyHint`, but render none until real activation bindings
   exist. Techniques and Guards currently fire automatically.
8. Keep Auto Combat centered, visually dominant, and aligned to the same bottom
   baseline without merging it into the ability dock.
9. Leave the mobile ability branch untouched.

Review gate: approved at all Phase 0 desktop widths with no minimap overlap and
clear Auto Combat ON/OFF plus ability-state readability.

Escalate to High if the approved layout requires React/Phaser collision-aware
placement or changes to actual ability activation semantics.

### Phase 2 - Shared desktop material and primitive foundation

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5  
**Type:** structural architecture  
**Dependencies:** approved Phase 1 visual direction

Tasks:

1. Extract only the material, spacing, focus, and motion tokens proven by the
   combat-dock exemplar.
2. Introduce `HudPanel`, `DisclosureHeader`, and `HudDock` contracts with minimal
   variants and no panel-specific content knowledge.
3. Establish desktop scoping so shared mobile components do not inherit desktop
   frame changes.
4. Split touched CSS by concern without bulk-moving unrelated selectors.
5. Document token meanings. Avoid raw tier-specific colors in components.

Review gate: the combat dock and one existing rail panel use the primitives with
no behavior or mobile changes.

### Phase 3 - Desktop rail styling

**Model:** Medium - Terra/Opus  
**Type:** visual migration using approved primitives  
**Dependencies:** Phase 2

Tasks:

1. Apply opaque iron/material treatment to rail backgrounds and panel shells.
2. Apply engraved headers, restrained separators, tactile hover/press/focus
   states, and compact spacing.
3. Preserve the current left and right ordering and one-click destinations.
4. Keep Tier Quest full-size at the top of the right rail.
5. Keep Essence, Catalysts, economy information, and Tactical Mode as independent
   modules that can be reordered later.

Review gate: both rails are visually cohesive at early-tier intensity without
changing content, unlock behavior, or mobile.

### Phase 4 - Class mechanic component architecture

**Model:** High for the first extraction; Medium for each subsequent widget  
**Type:** structural refactor plus one-widget-at-a-time visual work  
**Dependencies:** Phase 2; Phase 3 may run before or after

First extraction tasks - High:

1. Separate authoritative mechanic data selection from rendering where useful.
2. Add a stable `MechanicFrame` footprint and split the monolithic archetype
   branches into per-mechanic components.
3. Preserve the current shared mobile renderer or provide an explicitly separate
   compact presentation without altering mobile behavior.

Widget passes - Medium, one review per widget:

1. Cadence: segmented strike tracker with a stronger empowered segment.
2. Energy: direct, readable energy bar with restrained empowered treatment.
3. Reload: code-native SVG/CSS polygon with vertex ammo markers; heat remains a
   simpler bar where appropriate.
4. Cooldown: compact circular or linear execution/channel state.
5. Summoner: count/state plus compact HP/respawn indicators.
6. DoT: target stack count with poison/fire/frost shape and color changes, an
   authoritative primary-tick phase rail, and confirmed-tick impact feedback;
   move detailed formula statistics out of the always-visible mechanic footprint.

Review gate: each widget has a consistent location and approximate footprint,
uses the same frame language, and preserves server-authored values.

Approved visual benchmark (2026-07-20): the DoT widget is the golden standard
for class-mechanic presentation. Match its degree of thematic identity, readable
state progression, authoritative anticipation cue, confirmed-event impact, and
text-free visual explanation in later widget polish passes. Cadence is explicitly
flagged for a future styling pass to reach this standard; preserve its approved
rectangular progression and taller empowered marker while increasing its visual
character.

Golden-standard alignment pass approved (2026-07-20):
Cadence now uses connected strike chambers with the taller finisher preserved;
Execution uses an engraved cleave seal; Reload retains the rotating ammo polygon
inside a mechanical hub and gives laser heat its own exchanger apparatus. All
four use authoritative state transitions for restrained impact feedback and
retain only their title as visible text. Following review, Energy's battery-like
terminals and segmented channel were replaced by a continuous mana ribbon,
moving spell focus, curved wards, and reactive runes.

Cadence clarification (2026-07-20): the widget renders setup attacks, not the
full attack cycle. Baseline threshold 5 therefore displays four chambers; filling
the taller fourth chamber arms the empowered attack without adding a fifth slot.
Class selection now attaches the mechanic slice before stat recalculation so the
correct threshold is present in the first post-selection HUD update.

Deferred follow-up: branch-specific mechanic variants are not required to close
Phase 4. Variants that communicate genuinely different branch behavior should be
implemented alongside that branch's gameplay work. Purely visual branch skins
should wait until the Phase 9 token system is stable so tier theming and branch
identity can compose without duplicating palette and ornament rules.

### Phase 5 - Intent truthfulness and progressive disclosure

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5  
**Type:** interaction plus shared data contract  
**Dependencies:** current server `HasAutoIntent`; approved disclosure pattern

Tasks:

1. Add the existing `autoIntent` to client HUD state and format a truthful compact
   action label from authoritative data.
2. Remove all hard-coded character, target, reason, and rune copy.
3. Define concise server-authored explanation fields for decision reason and
   triggered automation/rune only after their semantics are agreed.
4. Update the shared protocol first, server producer second, client atoms third,
   and presentation last.
5. Define a visibility matrix for locked systems using existing authoritative
   unlock/progression state. Inventory remains quick to access.
6. Do not implement apparatus-expansion animations in this phase.

Review gate: compact and expanded Intent never claim reasoning the server did not
send, and unlock visibility has documented rules and safe fallbacks.

Approved implementation policy (2026-07-20):

- `HasAutoIntent` keeps its structured action/target fields and adds concise
  server-authored `reason` and `source` strings. The expanded panel shows the
  single governing cause rather than attempting to enumerate every score input.
- The client formats only the compact action label from authoritative monster,
  party-member, and biome ids. Missing ids fall back to generic action labels.
- Passive Tree, Build Overview/Runes, Inventory, Crafting, Map, Settings, Tier
  Quest, Essence, and Tactical Mode remain immediately available.
- On desktop, Mastery reveals at player tier 1 or when Global Mastery is already
  non-zero.
- In the desktop Build dialog, Abilities reveals at tier 1, Stances at tier 2,
  and Rites at tier 3. Mobile keeps its existing destinations in this phase.
  Existing known/equipped content overrides these gates so migrated saves and
  admin fixtures never lose access. Hidden stale tabs safely return to Overview.
- Catalysts retain their existing first-owned/progress reveal behavior.

### Phase 6 - Party and zone presence evaluation

**Model:** Medium - Terra/Opus  
**Type:** information architecture and bounded interaction  
**Dependencies:** rail styling and disclosure primitive

Tasks:

1. Decide what Party shows when solo, grouped, leader, follower, and away.
2. Decide whether In Zone belongs in Party, Local Information, or its own compact
   disclosure.
3. Replace inline visual styling while preserving join/leave/disband intent paths.
4. Do not redesign Combat Log in this phase.

Review gate: party actions remain obvious, solo state consumes little space, and
zone presence does not crowd the left rail.

### Phase 7 - Shared modal shell pilot: Inventory

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5  
**Type:** structural, accessibility, and interaction foundation  
**Dependencies:** Phase 2 token system

Tasks:

1. Implement `GameDialog`, `DialogHeader`, and optional `DialogTabs`.
2. Centralize portal/backdrop behavior, focus entry/return, `role="dialog"`,
   `aria-modal`, Escape handling, and size variants.
3. Resolve or explicitly constrain multiple-open overlay behavior.
4. Migrate Inventory only. Preserve equipment, bag, stats, selection, and death
   restrictions.
5. Reduce nested card chrome without reorganizing inventory gameplay concepts.

Review gate: Inventory is functionally identical, keyboard-safe, visually
approved, and the shared shell can express another modal without exceptions.

### Phase 8 - Modal rollout, one destination per pass

**Dependencies:** approved Phase 7 shell

#### 8A - Build

**Model:** Medium - Terra/Opus

Remove its dependency on unrelated Passive Tree/Crafting shell styles. Preserve
Overview, Abilities, Stances, Rites, and Runes behavior.

#### 8B - Mastery

**Model:** Low - Sonnet/Luna

Mechanical migration after Build establishes the tab/content hierarchy. Escalate
to Medium if information hierarchy changes are requested.

#### 8C - Crafting

**Model:** Medium - Terra/Opus

Preserve Forge, Upgrade, and Biome Progress. Crafting navigation must continue to
open directly on Forge from the right rail.

#### 8D - Map

**Model:** Medium - Terra/Opus

Preserve navigation, highlighted quest nodes, tactical information, and current
viewport behavior. Do not conflate the full map with the Phaser minimap skin.

#### 8E - Passive Tree and Settings

**Model:** Low for shell migration; Medium if internal hierarchy changes

Review each destination independently before continuing to the next.

### Phase 9 - Tier-dependent UI theming

**Model:** High for token/system design; Medium for values after approval  
**Type:** theming  
**Dependencies:** stable primitives and at least one migrated modal

High-band tasks:

1. Apply `data-ui-tier` at a document-level owner shared by all React roots.
2. Define token axes for frame complexity, material treatment, ornament density,
   dormant/active energy channels, accent intensity, and motion intensity.
3. Keep layout and component contracts stable across all eight tiers.
4. Give tier 1 a grounded, practical, nearly dormant presentation.

Medium-band follow-on:

1. Tune eight explicit tier token sets.
2. Verify contrast and semantic colors at every tier.
3. Theme the Phaser minimap frame separately using the same resolved tier palette.

Review gate: switching tier changes intensity and ornament, never information
architecture, component size, or input behavior.

Implemented token policy (2026-07-21):

- Gameplay `playerTier` remains zero-indexed; the client projects it to
  document-level `data-ui-tier="1"` through `"8"`, clamped at both ends.
- Tier overrides were desktop-only through Phase 11. Phase 12 lets the token
  sets resolve on mobile as well, with the apparatus density and continuous
  motion axes damped there; the document attribute was always visible to every
  root.
- The progression moves from nearly dormant iron/brass through warmer worked
  metal, verdigris and cobalt, then restrained amethyst/astral materials. Class
  mechanic and success/warning/danger meanings remain stable across the sets.
- Every tier selector contains custom properties only. Layout, component size,
  visibility, and input behavior therefore remain outside the tier system.
- The Phaser minimap resolves its background and two-edge frame from the same
  tier tokens without sharing React ownership or changing its geometry.
- Audited foregrounds meet at least 4.5:1 against both panel and control
  surfaces in all eight sets; reduced motion continues to override tier motion.

Apparatus escalation added after review feedback (2026-07-21):

- Summoner and DoT are the golden benchmark: layered hardware, a dormant energy
  path, readable charge travel, and a brief confirmed-state impact.
- T1 remains a plain, nearly dormant iron frame. Each later token set increases
  clipped-corner depth, secondary engraving, rune-trace density, conduit
  visibility, and channel speed until the fully energized T8 treatment.
- An authoritative upward `playerTier` change starts one staggered shell-level
  ignition across both rails, their panels, the ability dock, Auto Combat, any
  open dialog, and the Phaser minimap. Initial character hydration and downward
  tier changes do not replay it.
- The ignition is CSS/presentation-only and is cancelled for reduced motion or
  a hidden document. Persistent channel motion pauses while hidden rather than
  queuing work for tab recovery.
- This deliberately pulls the tier-up portion of Phase 11 forward. Phase 11
  still owns non-tier unlock activations, any larger apparatus-expansion reveal,
  and an optional Phaser world-scene effect synchronized to `player:ascended`.

### Phase 10 - Icon and asset integration

**Type:** asset API and art hookup  
**Dependencies:** stable slots, navigation, tabs, and mechanic footprints

#### 10A - Icon-source contract

**Model:** Medium - Terra/Opus

Stabilize a reusable icon API for atlas frames, asset references, or supplied
nodes, with accessible labels and layout-preserving fallbacks.

Implemented contract (2026-07-22):

- `GameIcon` owns a fixed outer footprint and accepts a discriminated
  `IconSource` for packed atlas frames, standalone asset URLs, or supplied React
  nodes. Source changes never determine component dimensions.
- Direct consumers must explicitly mark an icon decorative or supply an
  accessible label. Fallbacks occupy the same footprint during loading and for
  missing/failed sources, then disappear when art is ready.
- UI and item atlases share one cached, failure-safe manifest loader. `UIIcon`
  and `ItemIcon` remain thin compatibility wrappers while reusable component
  props accept `IconSource` directly.
- Desktop ability slots, Build icons, and right-rail navigation are the first
  migrated consumers. Existing mappings, interaction, and mobile presentation
  are unchanged; later art replacement needs no layout-contract change.

#### 10B - Mechanical asset hookup

**Model:** Low - Sonnet/Luna

Replace frame mappings and fallbacks after approved assets exist. Use the art
pipeline and never edit packed outputs directly.

Implemented hookup policy (2026-07-22):

- Ability art is allowlisted only after gallery approval; file existence alone
  is not sufficient because `art/src` can retain the previous image while a
  replacement is pending review.
- Sweep, Expose Weakness, Cleanse, and Brace resolve to their approved packed
  32x32 frames. Second Wind remains on the existing Technique/Guard glyph and
  Build-initial fallback until its pending candidate is approved.
- The approved mapping was checked against both the ability manifest and the
  packed UI atlas. All UI-atlas frame references currently used by client code
  resolve without missing frames.
- Existing shipped system-navigation and biome frames remain in place until a
  Phase 10C family is approved. The separate item-icon review batch is not
  modified by this hookup pass.

#### 10C - Cohesive art direction or generation batches

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5

Use for the visual family definition and review of abilities, system navigation,
essences, catalysts, mastery, runes, and crafting icons. Once the family and
prompt/template are locked, batch execution and manifest wiring can move to
Medium or Low agents.

Direction and first family batch (2026-07-22):

- System-navigation art is locked as a transparent symbol layer; the HUD
  control continues to own its frame, material, and state styling. Approved
  ability icons provide the reference for bold pixel clusters, limited palettes,
  and small-size readability without forcing their black square backgrounds onto
  navigation controls.
- The broad Runes keystone-shard probe was approved and promoted to
  `art/src/UI_icons/runes-icon.png`; the manifest records it as accepted and
  `art/style/ui-navigation.png` preserves the family seed. Its palette is
  charcoal iron, restrained bronze wear, and a pale-cyan semantic focus.
- Passive Tree, Global Mastery, Inventory, Crafting, World Map, and Settings were
  approved and promoted as transparent 32x32 sources. They deliberately use
  distinct silhouettes while sharing the seed's outline weight, palette, and
  flat pixel-cluster discipline.
- All seven navigation entries are accepted in `ui-icons.json` and the scoped
  deterministic pack updated `UI_icons.png` without touching the separate item
  atlas or loose assets. The existing client frame names and component layout
  remain unchanged; all seven packed frame references resolve.
- The economy-family follow-on defines five full essence orbs: Might uses a
  radiant force core, Wild a two-leaf vine, Rot a decay fissure with spores,
  Stone a fractured geode, and Deep three descending chevrons. Each has a
  type-specific palette and internal motif so meaning does not depend on color
  alone.
- The initial catalyst pass deliberately used one neutral, biome-agnostic
  placeholder while the system design was unstable. That temporary policy was
  superseded on 2026-07-24 after the five combat families became authoritative:
  Alacrity, Brutality, Blight, Volatility, and Predation now use one shared
  crystal silhouette with deterministic family palettes. The neutral shard
  remains only as a source-library fallback.
- The five essence orbs and five family catalyst crystals are approved,
  promoted, recorded as accepted manifest entries, and packed.
  `economyIcons.ts` provides exhaustive `EssenceType` and `PaceFamily` mappings;
  Essence and Catalyst rows render them through `GameIcon` at fixed,
  layout-stable footprints.
- The final mastery/rune/crafting pass reuses the approved Progress, Runes, Map,
  and Forge symbols rather than inventing duplicate art. Three remaining gaps
  received new family-matched frames: Craft Upgrade, Rune Situation, and Rune
  Response. Crafting tabs, Mastery summaries/sections, Rune tabs, selector
  headings, and rune-forge cards now consume those sources through `GameIcon`;
  no dialog, card, or tab footprint depends on asset loading.
- The three final frames were generated with the built-in image workflow,
  chroma-keyed, nearest-neighbor reduced to 32x32, compared alongside the
  approved family at a literal 18px footprint, recorded in the manifest, and
  deterministically packed. Live modal review at the standard viewport matrix
  remains required because the in-app browser connection was unavailable.

Review gate: icon replacement requires no component-layout changes.

### Phase 11 - Motion and apparatus activation

**Model:** Medium - Terra/Opus  
**Type:** animation and polish  
**Dependencies:** stable tokens, tier theming, and unlock visibility

Tasks:

1. Add brief unlock activation and restrained channel/rune wake-up effects.
2. Add tier intensity through tokenized duration/opacity, not bespoke animation
   branches in every component.
3. Add reduced-motion behavior.
4. Consider the larger apparatus-expansion reveal only after small activation
   effects are approved.
5. Keep background-tab protections and avoid queued animation work while hidden.

Review gate: motion communicates state change, remains restrained at early tiers,
and does not obscure gameplay or degrade background behavior.

Escalate to High if the tier-up transition must synchronize a Phaser scene effect,
multiple React roots, and the `player:ascended` event in one timed sequence.

Partial pull-forward (2026-07-21): Phase 9 now supplies progressive conduit and
frame motion plus a document-level tier-up ignition shared by every React root
and the Phaser minimap. The remaining tasks are per-system unlock activation,
larger expansion experiments, and any world-scene/event-timed sequence.

Core unlock activation implemented (2026-07-24):

- `installUiUnlockSync()` watches the approved Phase 5 visibility matrix for
  Mastery, Abilities, Stances, and Rites. It uses the existing authoritative
  atoms and does not add a protocol field or infer a second unlock policy.
- A newly visible system wakes its persistent right-rail destination and, when
  already open, the corresponding Build tab and overview cards. Initial
  character hydration, downward/unchanged visibility, and later remounts do not
  replay the effect.
- `--hud-unlock-*` tokens scale duration, flare opacity, and lift through the
  eight desktop tiers. The CSS sequence is a short housing settle, one channel
  sweep, and one icon/rune wake; no component geometry or input behavior
  changes.
- Pending frames, element timers, and activation attributes are cleared when
  the document becomes hidden or reduced motion is enabled. Hidden-tab recovery
  does not queue or replay the wake.
- The larger apparatus-expansion reveal and optional
  `player:ascended`-synchronized Phaser world effect were considered and
  deliberately deferred until this smaller motion language is visually
  approved. They are optional escalation work, not dependencies of the core
  Phase 11 implementation.
- The pure false-to-true transition seam, focused client typecheck, and
  production build pass. Live animation review at the standard desktop widths,
  representative tiers, reduced motion, and background recovery remains
  required because the in-app browser connection was unavailable.

### Phase 12 - Mobile adaptation

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5  
**Type:** responsive architecture and input adaptation  
**Dependencies:** stable desktop primitives, dialogs, tokens, and motion

Tasks:

1. Audit which primitives can be shared without importing desktop density.
2. Adapt touch targets, sheets, tabs, safe areas, and overlay offsets.
3. Reconcile any duplicated desktop/mobile mechanic or ability renderers only
   when doing so reduces risk.
4. Verify 1100px/1101px behavior, orientation changes, and mobile overlay focus.

Review gate: mobile retains its existing functionality and receives the visual
language without becoming a compressed desktop rail layout.

Primitive sharing audit (2026-07-25):

- Tokens are shareable. Every desktop-only *density* rule already lives behind
  `.desktop-hud` plus `min-width: 1101px`, so the eight tier sets carry colour
  and material meaning only. They now resolve on mobile; a mobile scope in
  `tokens.css` neutralises the apparatus axes (`--hud-frame-cut`,
  `--hud-frame-double-opacity`, `--hud-ornament-opacity`, `--hud-channel-*`,
  `--hud-rune-trace`, tier morph/activation durations, unlock lift).
- `HudPanel`, `DisclosureHeader`, and `HudDock` are shareable unchanged; their
  desktop treatment is already scoped away.
- `GameDialog`/`DialogHeader`/`DialogTabs` were already reused by mobile for
  full-screen destinations, but the bottom sheet was a parallel implementation
  with no portal, focus trap, Escape, or dialog role. Reconciled.
- `GameIcon` is shareable as-is and is the correct contract for the mobile tab
  bar and More list.
- The class-mechanic and ability renderers are deliberately **not** reconciled.
  Phase 4 already shipped an explicit compact mobile mechanic renderer and the
  mobile ability path is separate by design; merging them would add risk
  without removing duplication that actually hurts.

Implemented adaptation (2026-07-25):

- The tier palette now reaches mobile. Mobile HUD chrome (`.mhud-*`) consumes
  `--hud-*` tokens instead of fixed hexes, so material and semantic meaning
  match across the 1100/1101px boundary while ornament and continuous conduit
  motion stay desktop-only.
- `GameDialog` gained a `sheet` presentation. `MobileSheet` is now that dialog
  plus a drag handle, so sheets get the same portal, focus entry/return, focus
  trap, Escape, `role="dialog"`, and `aria-modal` as every desktop destination.
  Backdrop tap, drag-down dismissal, and the slide-up remain; reduced motion
  cancels the slide.
- `--hud-hit-target` / `--hud-hit-target-compact` are 0 on desktop and 44/40px
  on mobile. Dialog close buttons, dialog tabs, mobile tabs, and More rows size
  from them, and mobile tabs drop the hover-only affordance.
- Full-width mobile dialogs and sheets pre-divide their authored width by
  `--ui-font-scale`, because `zoom` multiplies the rendered box. This fixes
  non-default UI font scales rendering a dialog wider than the viewport.
- Left/right safe-area insets were added to the top strip, tab bar, biome XP
  row, and both floating buttons; the sheet insets on three sides. A
  short-viewport scope (`max-height: 480px`) drops tab captions, shrinks the
  AUTO button, restates `--mhud-bottom-h` so overlay offsets stay truthful, and
  raises the sheet ceiling. No destination or control is removed.
- The Phase 5 visibility matrix now governs mobile. The More sheet and the
  mobile Build dialog use the same `resolveSystemVisibility` resolver with the
  same ownership overrides, and an open Mastery view closes if its gate ever
  closes behind the player.
- Gated More rows carry `data-ui-unlock-system`, so the existing Phase 11
  `installUiUnlockSync` wakes them with no new protocol or second policy.
  Mobile gets one restrained housing settle — no channel flare, icon rune wake,
  or lift.
- The mobile tab bar and More list render through `GameIcon`. Entries sharing a
  desktop navigation destination resolve to the approved packed frames;
  entries with no approved art keep a glyph in the identical footprint.
- The 1100px breakpoint is now declared once in `client/src/breakpoints.ts` and
  imported by `useIsMobile`, keyboard, gamepad, and the Phaser minimap, closing
  the documented drift risk. The stylesheets still mirror the value and say so.

---

## 6. Known regression risks

- Ability dock or Auto Combat overlap with the Phaser minimap at narrow desktop
  widths.
- UI font scaling uses `zoom`, which can change measured widths and modal fit.
- Shared `StatPanel` or mechanic selectors can leak desktop styling into mobile.
- Independent modal atoms can create stacked same-z-index dialogs and mismatched
  selected navigation states.
- A dialog rendered inside a rail still escapes that rail: `GameDialog` portals
  to `document.body`, so `display: none` on `#left-sidebar`/`#right-sidebar`
  does not hide it. Any component mounted in a rail whose open state is a shared
  atom must be guarded by viewport, not by the rail's visibility. (This produced
  a duplicate mobile Settings dialog; fixed 2026-07-25.)
- CSS and Phaser both encode the 1100px breakpoint and can drift. (Mitigated in
  Phase 12: TypeScript declares it once in `client/src/breakpoints.ts`; the two
  stylesheets' media queries still mirror the value by hand.)
- The ability overlay currently uses `pointer-events: none`; future clickable
  slots require deliberate input and server-intent design.
- Hiding a system without a reliable unlock signal can strand Inventory, Map,
  Settings, or required progression information.
- Tier state applied inside a single React root will not reach the other roots.
- Generated UI atlas files can be accidentally edited instead of their sources.
- Continuous glow and animation can obscure readiness and violate the restrained
  early-tier direction.

---

## 7. Standard verification matrix

Every implementation agent should run checks proportional to the phase and
report what was not exercised.

### Required for all code phases

- `pnpm --filter @mmo-idle/client exec tsc --noEmit`
- Desktop at 1366x768, 1440x900, and 1920x1080.
- Boundary check at 1101px and regression check at 1100px.
- UI font scale at default and at least one non-default setting.
- Keyboard focus visibility for new interactive controls.

### State checks when relevant

- connected/disconnected;
- alive/dead;
- Auto Combat ON/OFF;
- ability ready/cooling/active/triggered;
- compact/expanded disclosures;
- empty/locked/populated panels;
- modal backdrop click and Escape;
- long labels and large values;
- tier 1 plus the highest implemented tier;
- reduced motion and background-tab recovery for animation work.

---

## 8. Cross-agent handoff contract

At the start of a phase, an implementing agent must:

1. Read `CLAUDE.md` and this document fully.
2. Inspect the current source because code overrides this plan when they differ.
3. Check `git status` and preserve changes belonging to other work.
4. Confirm the previous phase's review gate was approved.
5. Keep the task to one phase or subphase unless the user explicitly broadens it.

At handoff, the agent must report:

- phase/subphase completed;
- files changed;
- behavior deliberately preserved;
- screenshots/states reviewed;
- commands run and results;
- known regressions or untested states;
- whether the next phase is unblocked;
- any reason the next phase should use a higher or lower model band than listed.

Do not silently continue into the next phase. The purpose of the phase boundaries
is visual review and cheap correction before the design propagates.

---

## 9. Progress tracker

| Phase | Status | Review notes |
|---|---|---|
| 0. Baseline | Done (2026-07-20) | Screenshots + state matrix in `docs/ui-redesign-baseline/matrix.md`. Ability dock ready/cooling/active/triggered states not captured — no dev shortcut equips a class/build; recommend a "equip test build" debug action before/during Phase 1. |
| 1. Desktop combat dock | Approved (2026-07-20) | Manual review approved at 1366/1440/1920px and the 1100/1101px boundary; dock/minimap/Auto Combat layout and ability-state clarity accepted. |
| 2. Primitive foundation | Approved (2026-07-20) | `HudPanel`, `DisclosureHeader`, and `HudDock` added with documented material/spacing/focus/motion tokens and explicit desktop scoping. Combat dock and Character panel migrated. Manual review approved wrapping rather than truncation for desktop rail text, Passive Tree viewport fit, and the rebased displayed 100% UI scale. |
| 3. Rail styling | Approved (2026-07-20) | Desktop-only opaque iron rail/panel treatment, engraved headers, restrained separators, and tactile nav/control states added. Content order, destinations, unlock behavior, and mobile styling remain unchanged. Client typecheck and production build pass. |
| 4. Class mechanics | Approved (2026-07-20) | Added a stable `MechanicFrame`, atom-backed mechanic view models, dedicated Cadence/Energy/Reload/Cooldown/Summoner/DoT widgets, and an explicit compact mobile renderer. DoT is the approved golden visual standard. Summons uses text-free conduit chambers; the alignment pass brings Cadence strike chambers, the Execution cleave seal, the rotating Reload polygon/heat exchanger, and Energy's arcane focus and mana ribbon into the same apparatus language while preserving each concept and authoritative information. All desktop widgets retain title-only visible copy and reduced-motion/background protections. Branch-specific visual skins are deferred until Phase 9 tokens are stable; behavior-significant variants belong with their gameplay branches. Client typecheck and production build pass. |
| 5. Intent/disclosure | Approved (2026-07-20) | `HasAutoIntent` now carries server-authored reason/source copy; the HUD formats truthful compact actions with safe fallbacks. Mastery and Build sub-systems use the approved tier gates with owned-content overrides. Focused client/server typechecks, the 25-test suite, production build, and manual visual review passed. |
| 6. Party/presence | Approved (2026-07-21) | Desktop Party is compact when solo; the stored leader is labeled as the disband authority; and a separate Nearby disclosure shows every other player in the current node, retaining direct Join actions for non-members. Party members show Here/Away and nearby HP. No live follow state or server contract changed. Client typecheck, production build, and manual visual/keyboard review passed. |
| 7. Inventory dialog pilot | Approved (2026-07-21) | Added `GameDialog`, `DialogHeader`, and accessible `DialogTabs`; primary desktop dialogs are mutually exclusive. Inventory now uses the shared portal/backdrop/focus shell, exposes keyboard-operable equipment and backpack slots, preserves its three gameplay columns and mobile sections, and reduces nested card chrome. Client typecheck and production build pass; manual visual and interaction review approved the Inventory pilot. A viewport-scaled internal scrollbar fix for the legacy Global Mastery dialog was also verified during review. |
| 8. Modal rollout | Accepted to advance (2026-07-21) | Build, Mastery, Crafting, Map, Passive Tree, and Settings use the Phase 7 dialog shell. Build uses the shared tab controls without the Passive Tree/Crafting shell, and Settings preserves Escape-to-cancel during key/gamepad capture. Client typecheck and production build pass. The user advanced to Phase 9 without a separate manual Phase 8 visual pass. |
| 9. Tier theming | Implemented — pending visual review (2026-07-21) | Document-level T1-T8 projection and eight desktop-only token sets now drive material, clipped-frame complexity, secondary engraving, rune traces, persistent conduit density/speed, energy intensity, and motion. An upward authoritative tier change sends a staggered ignition across rails, panels, dock, Auto Combat, dialogs, and the token-themed Phaser minimap; hydration, reduced motion, and hidden tabs are guarded. Tier selectors contain tokens only; semantic contrast audit minimum is 4.62:1. Client typecheck and production build pass. Manual review at the standard widths and representative tiers remains required. |
| 10. Asset integration | Accepted to advance (2026-07-24) | Added the layout-stable, explicitly accessible `GameIcon`/`IconSource` contract; consolidated UI/item atlas loading; migrated desktop abilities, Build icons, system navigation, economy rows, Crafting tabs, Mastery, and Rune surfaces without asset-dependent layout. Four approved ability icons remain explicitly allowlisted; pending Second Wind retains its fallback. The transparent iron/bronze/cyan family covers all seven system destinations, five essence identities, five family catalyst crystals, Craft Upgrade, Rune Situation, and Rune Response. The deterministic atlas check passes and all referenced frames resolve. Isolated 18px family review passed; the user advanced to Phase 11 without a separate live modal viewport pass. |
| 11. Motion | Implemented — pending live visual review (2026-07-24) | Phase 9 already supplied tier-up shell ignition and persistent apparatus motion. Phase 11 now adds hydration-safe false-to-true activation for Mastery, Abilities, Stances, and Rites across persistent navigation and any open Build surface. Duration, flare opacity, and lift are tier tokens; reduced motion and hidden documents cancel rather than queue the wake. The transition seam, client typecheck, and production build pass. Larger apparatus expansion and the optional Phaser world effect remain deliberately deferred until the restrained wake is visually approved. |
| Cross-phase audit | Done (2026-07-25) | Verified claims: all 45 tier tokens present in every set with a complete `:root` fallback; worst semantic contrast is exactly the documented 4.62:1 (T8 danger on control); all 20 `atlasIcon` references resolve against the packed UI manifest; `HasAutoIntent` carries server-authored reason/source with rune-rule labels; primary dialogs are mutually exclusive and no mobile path can set a primary atom. Fixed: duplicate Settings dialog on mobile (rail dialogs portal past `display: none`), three dead legacy overlay wrappers, stale desktop-only token comments. Repo typecheck, 34/34 tests, and client build pass. |
| 12. Mobile adaptation | Implemented — pending live device review (2026-07-25) | Tier tokens now resolve on mobile with the apparatus density damped; `.mhud-*` chrome consumes them. Bottom sheets moved onto a new `GameDialog` `sheet` presentation, so every mobile overlay shares the portal/focus-trap/Escape boundary. Touch footprints come from `--hud-hit-target`; full-width dialogs and sheets compensate for `zoom`. Safe-area insets cover all four edges and a short-viewport scope adapts landscape without dropping destinations. The Phase 5 visibility matrix and Phase 11 unlock wake now apply to mobile. Tab bar and More list render through `GameIcon`. The 1100px breakpoint is declared once in `client/src/breakpoints.ts`. Repo typecheck and client production build pass. Live review on a real touch device — sheet drag/focus, notch insets, landscape, and the 1100/1101px boundary — remains required. |

---

# Part II — Wave 2: ergonomics and information architecture

Wave 1 (§5 phases 0-12) rebuilt the *material* of the desktop UI: primitives,
tokens, dialog shell, tier theming, icons, motion, mobile. Wave 2 changes what
those surfaces *contain* and how you move between them. Sections 1-4 and 6-8
above still apply unchanged — same guardrails, same primitive discipline, same
verification matrix, same handoff contract.

## 10. Approved direction

Eight decisions were taken on 2026-07-25 and are settled. Implementing agents
must not relitigate them; raise a concern only if the code proves one
impossible.

1. **Rail navigation — expand as shortcuts, keep modals.** A nav entry with
   sub-sections expands them inline in the rail; picking one opens the dialog
   directly on that section. Dialogs keep their own tab strip. Map, Inventory,
   Passive Tree and Settings stay one click. The rail does not become a
   docked-panel spine.
2. **Crafting owns making; Build owns arranging.** Learning abilities, stances
   and rites moves out of Build into Crafting. Build keeps loadout, runes and
   overview, and stops costing resources.
3. **Crafting is organised Make / Upgrade / Progress.** Make is one uniform
   recipe browser covering items *and* techniques, with a type facet beside the
   existing biome/slot/tier filters. Upgrade stays separate because it acts on
   owned items rather than recipes. Progress keeps biome levels.
4. **One collapsible Materials rail panel.** Essence and Catalysts merge.
   Collapsed is a dense row of icon+count chips; expanded is named rows with
   catalyst progress.
5. **Tier Quest becomes the Progression panel.** It gains a Global Mastery bar
   reading current against `maxGlobalMasteryAtTier(playerTier)`.
6. **Character becomes instruments.** Always-visible apparatus per concern in
   the class-mechanic visual language; exact numbers move to the existing
   expand and to hover tooltips.
7. **Inventory keeps the numeric stat sheet.** Character is the glance,
   Inventory's `StatSheet` is the reference consulted while comparing gear.
   Neither is deleted; their roles are made explicit.
8. **Unlock scheme is moderate.** Character, Inventory, Map, Crafting and
   Settings are always available. Everything else appears on its first
   authoritative trigger and plays the existing wake.
   **SUPERSEDED 2026-07-26 by Part III §16:** the user chose a very strict
   staged tutorial arc — almost everything hidden at start, the HUD assembles
   on authoritative triggers. The W6 resolver/wake machinery remains the
   substrate; only the gate matrix changes.

### Golden standards

These are the approved references. Match them; do not invent a third language.

- **Dialog layout: the Map.** Its strength is master/detail — a browsable
  surface plus a persistent detail pane that tracks selection, with filters
  above. `MapPanel` + `NodeInfo` is the shape every browsing dialog should
  take. This is also the answer to the disliked pickers: a slot grid with a
  detail pane replaces a `<select>`.
- **Widget language: Summoner and DoT.** Layered housing, a dormant path,
  readable state travel, a brief confirmed-state impact, and title-only visible
  text. The Character instruments must read as siblings of these, not as a
  restyled table.

## 11. Wave 2 phases

Same rules as Wave 1: one reviewable slice at a time, stop at each review gate,
do not continue automatically.

### W1 - Economy and progression presentation

**Model:** Medium - Terra/Opus
**Dependencies:** none

The cheapest visible win, and it produces the cost primitives W2 consumes.

1. Add a `MaterialChip` primitive rendering an essence or catalyst through
   `GameIcon` at a fixed footprint, with held/required states.
2. Rebuild `CostDisplay` and `EssenceSummary` (`ui/crafting/shared.tsx`) on it.
   The wallet summary must include catalysts, not essences only. The coloured
   `craft-cost__dot` / `craft-essence-chip__dot` markers go away.
3. Apply the same chips to the ability/stance/rite learn lists so every cost in
   the game reads identically before those lists move in W2.
4. Merge `EssencePanel` and `CatalystPanel` into one collapsible Materials
   panel using `HudPanel` + `DisclosureHeader`. Preserve the essence gain flash
   and the catalyst progress readout.
5. Fold Global Mastery into `QuestPanel`, retitled Progression: tier badge,
   quest bar, and a mastery bar against `maxGlobalMasteryAtTier(playerTier)`.
   Keep the locate-dungeons affordance.

Review gate: no cost or wallet anywhere still draws a coloured dot; the rail is
shorter than before; mastery progress is readable without opening a dialog.

### W2 - Crafting as the making surface

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5
**Dependencies:** W1

The largest structural phase. It also produces the browser primitive W3 reuses,
so extract it here rather than up front.

1. Extract a `BrowserPane` primitive from the Map pattern: filter strip,
   scrollable list, persistent detail pane, keyboard selection, empty state.
   It must know nothing about recipes, nodes, or items.
2. Restructure `CraftingPanel` into Make / Upgrade / Progress.
3. Make is one `BrowserPane` over a unified recipe model spanning gear recipes
   and technique recipes, with a type facet beside biome/slot/tier. One card
   shape and one detail pane for every recipe kind.
4. Move ability, stance and rite *learning* here from `AbilitiesPanel`,
   `StancesPanel` and `RitesPanel`. The `*PanelContent` exports keep their
   equip halves for W3.
5. `craftTabAtom` changes shape; update `overlayStack`, the rail entry, and the
   mobile More menu together. Crafting must still open directly on Make from
   the rail.
6. Preserve every server intent path: `crafting:craftRecipe`,
   `inventory:upgradeItem`, and the ability/stance/rite learn requests.

Review gate: a gear recipe and a technique recipe are indistinguishable in
shape; Upgrade and Progress are unchanged in behaviour; nothing in Build still
spends resources.

Escalate only if the unified recipe model needs a shared-package contract
change rather than a client-side view model.

### W3 - Build as the arranging surface

**Model:** Medium - Terra/Opus (High if slot semantics change)
**Dependencies:** W2

1. Delete the three `<select className="build-select">` pickers.
2. Equipping becomes a slot grid plus a `BrowserPane` detail pane: select a
   slot, see eligible entries as cards with icon, name and blurb, pick one.
   Duplicate-suppression and fire-priority ordering must survive.
3. Rework Overview into a build summary that reads as a sheet, not a stack of
   cards borrowed from other stylesheets.
4. Keep `BuildRunesTab` behaviour intact; restyle only what the shared
   primitives cover. It is 938 lines and is not part of this phase's scope.
5. `buildPanelTabAtom` loses `abilities`/`stances`/`rites` as learning
   destinations; decide and document whether loadout is one tab or three.

Review gate: no native `<select>` remains in Build; equipping is possible with
keyboard alone; loadout, priority and rune behaviour are unchanged.

### W4 - Character instruments

**Model:** High for the first instrument; Medium for each after
**Dependencies:** W1 (tokens/chips), independent of W2/W3

1. Design one instrument first — offense — and get it approved before building
   the rest. It must sit beside the Summoner widget without looking foreign.
2. Then defense, sustain, and mobility. Each derives from the same authoritative
   atoms `StatPanel` already reads; no new server data.
3. Exact values move to the existing expand and to `useHoverTooltip`. Keep HP,
   the class mechanic, and Intent where they are.
4. Restyle Inventory's `StatSheet` as the explicit numeric reference. It stays a
   table; it does not become instruments.
5. Keep the mobile compact renderer working — `ArchetypeMechanics compact` and
   the `.mhud-mech` strip must not inherit desktop instrument density.

Review gate: the Character panel reads as a sibling of the Summoner and DoT
widgets, no number is lost, and gear comparison in Inventory is not slower.

### W5 - Rail sub-section expansion

**Model:** Medium - Terra/Opus
**Dependencies:** W2, W3 (the section lists must be final first)

1. Extend `RightNavButton` into an expandable entry with an accessible
   disclosure and a nested sub-entry list.
2. Populate from the destinations that have sections: Crafting (Make, Upgrade,
   Progress), Build (loadout, runes, overview), Mastery, Settings.
3. Picking a sub-entry opens the dialog on that section in one action.
4. Entries without sections keep their current single-click behaviour and gain
   no chevron.
5. Expansion state is presentation-only; it must not become a second source of
   truth for which dialog is open.

Review gate: no destination costs more clicks than before; keyboard traversal
of the nested list works; selected nav state matches the open dialog section.

### W6 - Unlock scheme revision

**Model:** High - ChatGPT 5.6 Sol/Claude Fable 5
**Dependencies:** W1-W5 (the element inventory must be final)

The approved Phase 5 matrix predates this restructure and will be wrong: its
`abilities`/`stances`/`rites` keys gate *Build tabs* that no longer exist in
that form.

1. Re-derive the visibility matrix over the new element inventory, keeping
   `resolveSystemVisibility` as the single resolver and keeping every ownership
   override so migrated saves never lose access.
2. Always available: Character, Inventory, Map, Crafting, Settings.
3. Gate on first authoritative trigger: Materials (first essence), the catalyst
   rows (first progress), Passive Tree (first skill point), Mastery (tier 1 or
   non-zero), technique/stance/rite sections (their existing gates, now applied
   to Crafting sections and Build slots), Party (first nearby player), Bestiary
   (first kill), Tactical Mode.
4. Every reveal plays the existing Phase 11 wake through
   `data-ui-unlock-system`; no second animation system.
5. Hidden stale state must fall back safely, exactly as the Build tabs do today.

Review gate: a fresh character sees a small rail that visibly grows; no existing
character loses a destination; every gate is backed by authoritative state,
never by incidental client state.

### W7 - Mobile parity

**Model:** Medium - Terra/Opus
**Dependencies:** W1-W6

Not optional. Crafting, Build and Inventory dialogs are shared surfaces, and the
mobile More menu currently lists Build sub-tabs that W2 moves.

1. Re-verify every restructured dialog at the mobile widths and in the sheet
   presentation.
2. Update the More menu to the new destination set and gates.
3. Confirm `BrowserPane` degrades to a single column on narrow viewports rather
   than compressing master and detail side by side.
4. Re-run the Phase 12 checks: touch targets, safe areas, landscape, the
   1100/1101px boundary.

Review gate: mobile reaches every new destination, and no browsing surface
requires horizontal scrolling.

### W8 - Left rail follow-ups

**Model:** Medium - Terra/Opus
**Dependencies:** W1-W7

The left rail keeps its current destinations — Character, Party, Combat Log,
Bestiary. Two known defects are deliberately deferred to here so they do not
compete with the structural phases.

1. Combat Log shows too much irrelevant information. Decide what a player
   actually needs mid-fight, and filter or tier the rest rather than printing
   every event.
2. Bestiary truncates: past a certain entry count the list is simply cut off
   instead of scrolling or paging. Fix the overflow, not the entry count.

Review gate: the Combat Log is readable during a fight without scrolling back,
and no bestiary entry is unreachable at any zone size or UI font scale.

## 12. Wave 2 risks

- Moving learning out of Build changes `buildPanelTabAtom`, `craftTabAtom`, the
  rail, the mobile More menu, and the Phase 5 gates at once. W2 must land those
  together or the gates will point at destinations that no longer exist.
- `BuildRunesTab` is 938 lines and is explicitly out of scope for W3 beyond
  shared-primitive restyling.
- A unified recipe model must stay a client view model. Gear and technique
  recipes are separate authoritative databases; do not merge them in `shared/`.
- Instruments can lose information. Every number visible today must remain
  reachable in at most one hover or one expand.
- The Map is the golden standard and is explicitly not being redesigned. Extract
  from it; do not refactor it beyond what `BrowserPane` extraction requires.
- Aggressive gating can strand a returning player. Ownership overrides are
  mandatory, not optional.

## 13. Wave 2 progress tracker

| Phase | Status | Review notes |
|---|---|---|
| W1. Economy and progression | Implemented — pending visual review (2026-07-25) | Added `MaterialChip` + `MaterialRef` as the single grammar for every economy quantity (packed icon, amount, held balance, affordable/short state). `CostDisplay` and the new `WalletSummary` are built on it; the wallet now shows catalysts beside essences instead of essences only, and every coloured-dot chip is gone. Ability/stance/rite learn cards dropped their comma-joined cost strings for the same chips. `EssencePanel`+`CatalystPanel` merged into one collapsible `MaterialsPanel` (chip strip collapsed, named rows plus catalyst progress expanded, gain flash preserved). `QuestPanel` is now Progression: tier badge, quest bar, and a Global Mastery bar against `maxGlobalMasteryAtTier(playerTier)` with a ceiling-reached state. Repo typecheck and client build pass. |
| W2. Crafting as making | Implemented — pending visual review (2026-07-25) | Extracted `BrowserPane` from the Map pattern (filter strip, scrollable master, persistent detail, roving-tabindex listbox, single-column below 1100px). Crafting is now Make / Upgrade / Progress on a `wide` dialog. `makeEntries.ts` is a client view model unifying gear and ability/stance/rite recipes — the authoritative databases stay separate. `MakeTab` browses all of them with a kind facet, biome and tier filters, search, an affordable-only toggle, and buildable-first ordering; gear evolve/reconstruct is preserved. Actions moved out of rows into the detail pane, so a `role="option"` row holds no buttons. Learning left Build: the three `*PanelContent` exports keep only their equip halves. `craftTabAtom`, `overlayStack`, and the mobile craft view were retargeted together; `ForgeTab` deleted. Repo typecheck, 34/34 tests, and client build pass. |
| W3. Build as arranging | Implemented — pending visual review (2026-07-25) | Overview is now a build sheet: every slot and its occupant as scannable rows, with each section heading acting as the jump to the tab that changes it, plus a rune-budget meter that flags overspend. It replaces the card grid that repeated each entry's blurb, showed only slot 1 of every kind, and offered no way to act on what it reported. `BuildRunesTab` keeps its behaviour and gains the shared restyle: the whole build stylesheet now resolves through tier tokens instead of the hardcoded purple palette, and the dead `build-summary-card`/`build-select`/`build-loadout-row`/`build-learn-*` rules were removed. All three `<select className="build-select">` pickers are gone. New shared `LoadoutBrowser` puts slots in the master list and the eligible entries in the detail pane, on top of W2's `BrowserPane`: the current occupant stays visible while choosing, candidates are cards with their own text, and an entry already used elsewhere is shown with the reason rather than hidden. Abilities, Stances and Rites now share one implementation; fire-priority ordering, dense-list rebuild, and every server intent are unchanged. Loadout stays three tabs. Still open for W3: the Overview rework and the shared-primitive restyle of `BuildRunesTab`. Repo typecheck, 34/34 tests, and client build pass. |
| W4. Character instruments | Implemented — pending visual review (2026-07-25) | First attempt animated a charge along a conduit once per attack and split the bar by damage composition. Rejected on review as spammy and unreadable — the user could not tell what it depicted. **The lesson, which binds later attempts: the class mechanics animate because their state genuinely moves (summons spawn, DoT ticks land); a stat only changes on a gear swap, so perpetual motion carries no information and reads as flicker. Text-free works for Summoner because the shape *is* the value — four chambers means four strikes — but no shape encodes "82 attack" without inventing a scale to measure it against.** Borrow the material and frame language from the mechanics, not the motion. `StatPanel` was restored to its committed state; the instrument files were deleted. **Second attempt implemented (2026-07-25):** `StatPlate` — one engraved housing carrying the whole readout. It began as four plates titled by concern; on review the per-concern titles were cut as wasted rail height, so the plate now leads with a row of self-labelling figures (DPS, Plating, HP/s, Speed) over a secondary line and the meters. Static at rest. A bar appears **only** where the value has a genuine 0-100% ceiling (damage reduction, dodge); attack, DPS, plating and speed are numbers, never part-full bars. Motion is event-only: `useChangeFlash` marks a value that actually changed and reports the delta once, staying silent on hydration and on any change while the document is hidden or reduced motion is on. The expand became the explained reference — every stat with its `STAT_HELP` tooltip plus the empowered breakdown. Client typecheck and build pass; live review pending. | `StatInstrument` mirrors `MechanicFrame`, so Character reads as a sibling of the class mechanics: titled frame, text-free apparatus, exact values in a readout that is always in the accessibility tree and surfaces on hover. First instrument is Offense — the strike assembly. It deliberately shows **composition and cadence, never magnitude against a bar maximum**: attack has no authoritative ceiling, so a part-full damage bar would be an invented balance claim. The conduit splits by where damage comes from, one charge traverses it per attack (so a fast class visibly strikes more often), and the anvil brightens only with the empowered multiplier. Reduced motion and hidden tabs stop the travel. Attack and DPS moved into the expand; Defense stays a row until its instrument exists. Per the plan this exemplar is reviewed alone before Defense, Sustain and Mobility are built, and before the `StatSheet` split. Client typecheck and build pass. |
| W5. Rail sub-sections | Implemented — pending visual review (2026-07-25) | `RightNavButton` became an entry that reveals its destination sections while that destination is open, so "Crafting → Upgrade" is one action instead of open-then-tab. Crafting exposes Make/Upgrade/Progress and Build exposes Overview/Abilities/Stances/Rites/Runes, with the gated ones carrying the same `data-ui-unlock-system` tokens as the tabs they mirror. Flat destinations render no chevron and no list, so Map, Inventory, Passive Tree and Settings still cost exactly one click. Expansion is derived from which dialog is open, never a second source of truth. |
| W6. Unlock scheme | Implemented — pending visual review (2026-07-25) | `SystemVisibility` grew `materials`, `passiveTree` and `party` alongside the four Phase 5 keys, still resolved by the single `resolveSystemVisibility`. Every new gate keeps an ownership override — holding no essence right now cannot hide Materials from a player with unlocked recipes, non-zero mastery or tier ≥ 1; an empty wallet of skill points cannot hide the Passive Tree from someone with allocated passives. The Materials rail panel and the Passive Tree entry are gated accordingly, and `installUiUnlockSync` now subscribes to the economy and progression atoms so a first essence or first skill point plays the existing wake. Always available, per the approved policy: Character, Inventory, Map, Crafting, Settings. |
| W7. Mobile parity | Implemented — pending live device review (2026-07-25) | MobileHUD feeds the same full matrix into the resolver, so the mobile Skills tab reveals on the first skill point exactly as the rail entry does, and an open view whose gate closes falls back to the base HUD. The Make browser gets mobile rules matching the dialog's smaller padding, a full-width search field, and touch-height filter chips; `BrowserPane` already collapses to a single column below 1100px rather than squeezing master and detail side by side. |
| W8. Left rail follow-ups | Implemented — pending visual review (2026-07-25) | **Bestiary truncation had two causes.** The left rail scrolled but hid its scrollbar, so a long rail read as cut-off content with nothing to suggest more existed — it now uses the same thin scrollbar as the dialogs. And `.bestiary-detail__list` was missing `min-height: 0`, the flex trap that stops a child shrinking below its content, so a long roster pushed past the panel instead of scrolling inside it; the detail panel also traded its flat 600px height for `min(600px, 88vh)`, and the rail body a flat 220px cap for `clamp(160px, 30vh, 340px)`. **Combat Log** gained three verbosity tiers — Key (kills, deaths, progression, empowered/execution), Combat (adds damage, dodges, heals, shields) and All — defaulting to Key and persisted per player. The per-hit damage stream that buried every outcome is now opt-in. |

---

# Part III — Wave 3: signature apparatus, style codification, staged unlocks

Planned 2026-07-26 in a design session with the user. Sections 1-4 and 6-8 of
Part I apply unchanged — same guardrails, primitive discipline, verification
matrix, model bands, and handoff contract. Wave 2's decisions stay settled
except where §14 explicitly supersedes them. As always: inspect the source
first; code overrides this plan when they differ.

Wave 3 exists because the user's review of the shipped Waves found the
remaining laggards: the HP bar predates the apparatus language, the glance
stats show irrelevant figures, Build/runes were left half-done (the explicit W3
leftovers), the passive tree is dated, several panels still explain themselves
in prose, and the unlock scheme is milder than the game the user wants.

## 14. Wave 3 approved decisions

Settled with the user 2026-07-26; do not relitigate.

1. **HP display: integrated plate crown.** Name, status dot, and the HP track
   fold into the top of `StatPlate` — one apparatus, not stacked sections.
2. **Glance figures: DPS + Plating; meters: Reduction.** HP/s and Speed demote
   to the expand. The static Dodge meter dies, replaced by the Evasion
   instrument (§17 V3). Defense figures show LIVE values; debuff tinting (red +
   down-glyph when live < base) is the default if base values are cheaply
   available client-side, otherwise a follow-up.
3. **Evasion is deterministic and gets an instrument.** The accumulator
   (`EVASION_KEY` in `tracksCombat`,
   `server/src/systems/defense/mitigation/evasion.ts`) is server-only today and
   the UI shows only the static rate — the live charge was never networked.
   Wave 3 networks it and renders it in the mechanic language.
   **Corrected 2026-07-26 by `server/test/evasion.test.ts`:** V3 below claims
   "the dodge event itself already produces the DODGE floater". That is only
   true at `evadeMitigation >= 1`. `EVADE_MITIGATION_BASE` is `0.5`, so a normal
   evade is *partial*: it emits `monster-hit` with `evadedPartial`, which draws a
   tinted damage number with a `~` suffix. The `player-evade` event — the large
   DODGE floater and its sound — requires full mitigation, reachable only through
   the `defense.evade-mitigation` passive. The mechanic is correct (the
   accumulator steps 0.25 and wraps on the fourth hit, all asserted); it was the
   *presentation* that made dodges look like they never happen.
   **Resolved 2026-07-26:** partial evades now raise their own `GRAZE` floater on
   both sides — the player's evasion turning a blow, and a monster rolling with
   one. It is deliberately quieter than DODGE (smaller, offset off the damage
   number, and silent, since the hit it accompanies already plays a sound). No
   protocol change: the client keys off the `evadedPartial` the event already
   carried, and `evasion.test.ts` now guards that field as a visible behaviour
   rather than an internal flag. The three hand-copied floater tweens
   (DODGE ×2, MISS) were collapsed onto one `floatLabel` helper rather than
   adding a fourth.
4. **Crafting absorbs rune recipes; Build becomes Loadout.** W2/W3 already
   moved ability/stance/rite learning to Crafting's Make browser. What remains:
   rune recipe crafting leaves `BuildRunesTab` for Make (one more kind facet),
   Build is renamed **Loadout** and rebuilt as a socket surface, and the rune
   loadout becomes a rule board. Crafting keeps its name.
5. **Crafting's Progress tab dies.** The Mastery dialog is the single progress
   surface, reached through a radial mastery dial in the Progression panel. The
   desktop rail's duplicate Mastery nav entry is removed (mobile keeps a nav
   destination — it has no rail).
6. **Passive tree: "the path you walk."** Chosen nodes form a class-toned
   spine; the frontier's 3 choices are the focal orbs; unpicked past siblings
   dim + shrink (~40%, desaturated), expandable on hover/tap — never fully
   hidden (class reset exists). Effects render as glyph chips, not text.
7. **Distinctiveness via signature elements, not ornament density.** Frames
   stay restrained ritual-machine. The identity carries through a small set of
   bespoke set-pieces: the mastery dial, the Evasion instrument, gradient
   conduit bars, the passive-tree spine, the HP crown, and the existing class
   mechanics.
8. **Typography: display face for titles only.** Panel/dialog titles get an
   engraved small-caps serif; body, numerals, and 9px micro-labels keep the
   current sans/mono (display faces are unreadable at micro sizes).
9. **Two bar grammars** (§15). Important accumulation bars use the gradient
   conduit grammar extracted from the biome XP bar (the user's named "perfect"
   bar); minor bounded meters stay engraved-minimal.
10. **Unlock scheme: very strict staged arc** (§16), superseding Part II §10
    decision 8. Reveal moments become wake + a persistent badge until first
    visited.
11. **New UI glyphs come from the PixelLab pipeline**, same family as the
    approved iron/bronze/cyan navigation set. The user reviews every candidate
    in the gallery; agents never accept/reject art themselves.
    **SUPERSEDED 2026-07-26:** small abstract UI symbols are now *hand-authored*
    as pixel maps in `tools/glyphs/` and rendered by `pnpm art:glyphs`; they
    still ship through `art:pack`, so nothing downstream changes. The V0b batch
    (22 entries, 66 candidates, $0.47) proved the generated route unusable at
    icon size: legible at 64px, mush at the 18px HUD footprint, and off-family.
    That is the same wall the 16px modifier badges hit twice before becoming
    typography. Measuring the approved family explained why it was never
    reproducible — 1041 distinct colours across eight 32×32 icons, i.e.
    downscale noise rather than an authored palette. PixelLab remains correct
    for its ~1,280 successful generations (monsters, players, environment,
    item icons): 64px+ organic subjects where a diffusion prior helps. The
    user-reviews-the-art rule is unchanged; only the source of the art moved.
12. **Out of scope:** further combat-log tuning (W8's tiers shipped; any more
    is log logic, not UI), Tactical Mode (debug, slated for removal), admin
    styling, balance numbers.

## 15. Style specification

The identity remains Part I's: old-school MMO via a restrained ritual-machine /
arcane-apparatus reading — opaque iron, worn materials, engraved edges, tactile
controls, modern information clarity — explicitly WITHOUT the pitfalls of
clunky legacy UIs (ornate frames that eat space, unreadable bars, prose
everywhere). Tier tokens keep supplying material progression; Wave 3 adds no
fixed decoration.

### Bar grammar

Two named grammars. Every bar in the game must be one of them (or the class
mechanic energy language, which is its own thing and is not restyled).

**Gradient conduit** — for the few important, live-accumulation surfaces.
Recipe extracted from `client/src/hud/biomeXpBar.css` (the reference
implementation; do not modify it except the §17 V1 chip removal):

- thin track (~7px) with deep inset shadow and a faint 1px outer keyline;
- fill is a **3-stop directional gradient brightening toward the leading edge**
  (reference: `#3344aa → #7766ee → #aabbff`);
- slow shimmer sweep (~2.8s) across the fill;
- tick marks segmenting the track;
- state changes swap the gradient and add a slow pulse (gold MAX, amber
  CAPPED), never a layout change.

Continuous shimmer is permitted here and only here — reconciled with the W4
motion lesson because these bars mark live accumulation ("the thing that
grows"), not static stats. Assigned: biome XP (as-is), the HP crown track
(threshold-colored: green/amber/red, each its own 3-stop ramp), the Global
Mastery dial (gold ramp, radial/conic variant), the quest progress bar
(arcane blue-violet, like XP). Hues are per-meaning, never one signature color.

**Engraved minimal** — every other bounded meter: inset track, flat fill, no
shimmer, no ticks. Assigned: rune budget, damage reduction, mastery-dialog
biome rows, catalyst progress, and any future minor bar.

### Signature elements

The distinctiveness budget is spent on set-pieces, each designed once and
reused nowhere else: HP crown, mastery dial, Evasion instrument, gradient
conduits, passive-tree spine, and the shipped class mechanics (DoT/Summoner
remain the benchmark). Panels and dialogs around them stay quiet.

### Typography

- One self-hosted OFL display face for titles. Default candidate: **Cinzel**
  (carved Roman small-caps); acceptable alternates for the user to eyeball:
  Alegreya SC, Marcellus. No CDN loading — bundle the font file.
- Applied to: `DialogHeader` titles, rail `panel-title`, boss bar name, and
  section headings ≥ 11px. NOT applied to: 9px micro-labels, numerals, body
  text, tooltips, the combat log.
- Fallback stack `'Palatino Linotype', Georgia, serif`; FOUT-safe
  (`font-display: swap`); run `pnpm size:check` after adding the asset.

### De-texting rule

Instructional/status prose inside panels is a defect; flavor text (quest
descriptions, bestiary lore) is exempt. Standard replacements: text buttons →
icon `ActionChip`; textual milestone status → `MilestonePips`; disclosure
summaries ("See detailed stats") → icon-only affordance with an `aria-label`;
explanatory notes ("Ceiling rises with your tier") → state styling + tooltip.

### Icon needs (PixelLab batch, §17 V0)

Same transparent iron/bronze/cyan family as the shipped navigation set:
~10 stat glyphs (attack, dps, plating, reduction, range, speed, regen,
evasion, empowered, shield), ~6 action glyphs (compass/locate, inspect, equip,
unequip, reorder, confirm), tree root/keystone icons for the 6 classes.
Standard tree nodes reuse stat glyphs on class-toned orbs — do NOT generate
unique art per node. Pipeline rules per Part I §1 (dry-run, gallery review,
pack; never hand-edit atlases).

## 16. Unlock script — staged tutorial arc

Supersedes Part II §10 decision 8 and revises the W6 matrix. The machinery is
unchanged and mandatory: `resolveSystemVisibility` stays the single resolver,
`installUiUnlockSync` + `data-ui-unlock-system` stays the single wake system,
used systems keep ownership overrides so no migrated save loses a destination.
Only the matrix widens and tightens.

### The arc

A fresh character boots to a nearly bare HUD: the Phaser viewport with its
overlays (boss bar, death overlay, buffs), the Character panel core (HP crown,
class mechanic, Intent), Auto Combat, and Settings. Everything else assembles
on first authoritative trigger, in the order play naturally produces:

| Element | Reveal trigger (durable, authoritative) | Notes |
|---|---|---|
| Character, Auto Combat, Settings, viewport overlays | always | boot core; Settings must never gate (accessibility) |
| Combat Log | first kill | durable proxy: bestiary discoveries non-empty |
| Bestiary | first kill | same signal |
| Progression panel | always | the tier quest exists from the first frame |
| Inventory | first item owned | inventory non-empty OR equipment non-empty OR tier ≥ 1 |
| Materials rail panel | existing W6 gate | unchanged |
| Crafting | 4 essence of one type | minimum payable clearing-recipe balance; crafted ownership keeps it visible after spending |
| Map | first world-gate crossing | persisted `visitedNodes`; returning to the clearing does not hide it |
| Biome XP overlay | always | viewport feedback, independent of the Map destination |
| Passive Tree | existing gate | first skill point / allocated passives / tier ≥ 1 |
| Loadout (Build) | first thing to arrange | known ability OR owned rune OR tier ≥ 1 |
| Abilities | first crafted ability | known/equipped ability; tier alone does not reveal it |
| Stances / Rites sections | existing tier gates (2/3) + ownership | unchanged |
| Mastery dial + dialog | Global Mastery 1 | tier alone does not reveal it |
| Party | always | joining requires the panel, so it cannot depend on already having company |
| Evasion instrument | `evadesHits` present | component presence, not part of the arc matrix |
| Ability dock | `abilities` gate | empty dock before that is noise |
| Tactical Mode | out of scope | debug, slated for removal |

Implementation notes: exact atoms are verified at implementation time, and any
trigger lacking a durable authoritative signal must be redesigned, never
approximated with incidental client state (Part I rule). Tier fallbacks remain
only on the older unchanged gates; Map, Crafting, Mastery, and Abilities use
their explicit milestones. Dev/admin tooling is exempt from gating.

### The reveal moment

Wake + badge:

1. The existing Phase 11 wake plays on the false→true transition (unchanged).
2. The newly revealed entry then carries a small glowing pip — gold, slow
   pulse, static under reduced motion — until the player first opens it.
   Unvisited state is client presentation only: per-character localStorage
   (`mmo_idle.unlock_badges.<playerId>`), populated when visibility flips true
   after hydration, cleared on first open. No protocol field. Badges render on
   rail nav entries, rail panels' headers where relevant, and mobile More rows
   through the same data-attribute mechanism as the wake.

### Stranding safeguards

- Ownership overrides on every gate (mandatory, as W6 established).
- Settings and death/session overlays never gate.
- An open dialog whose gate closes falls back safely (existing pattern).
- Verification for V7 includes a scripted fresh-character playthrough: every
  element must appear at its trigger, play one wake, badge until visited, and
  a migrated mid-progress save must boot with everything it has ever touched.

## 17. Wave 3 phases

Order is small → big (user-chosen). One reviewable slice per phase; stop at
each gate.

### V0 - Kit deltas and icon batch

**Model:** Medium - Terra/Opus (art direction review stays with the user)
**Dependencies:** none

1. New primitives (extending, not duplicating, the shipped set): `ActionChip`,
   `MilestonePips`, `EngravedMeter`, `GradientConduit` (the §15 grammar as a
   component, tick marks + state variants included), `GlyphTile` (evolving the
   `StatPlate` figure cell into a shared primitive). `ApparatusPlate` extracts
   the cut-corner housing recipe from `mechanic-capacitor` if V2/V3 need it
   standalone; skip it if `HudPanel` + tokens suffice.
2. Typography: bundle the display face, apply per §15, verify size budget.
3. Generate the §15 icon manifest through the PixelLab pipeline; user reviews
   in the gallery; pack on acceptance.

Review gate: mechanics panels unchanged; titles render in the display face at
all standard widths and UI font scales; icon batch accepted and packed.

### V1 - Quick wins and defect fixes

**Model:** Low - Sonnet/Luna (item 5 Medium if the test finds a real break)
**Dependencies:** none (V0 for the pip/chip primitives where used)

1. Remove the pace-family modifier chip from the biome XP bar
   (`BiomeXpBar.tsx` ~112/144-151 and `biomeXpBar.css` `__family` rules). The
   modifier stays visible on the map only.
2. Materials panel: divider or ≥10px gap between essence and catalyst groups
   when collapsed; expanded rows get `tabular-nums`, right-aligned min-width
   value column, wrap instead of overflow.
3. Bestiary 3+ entries still crop (W8's fix was insufficient — the user
   reproduced it after). REPRODUCE FIRST with 3+ discovered species at tall
   and short windows before touching `bestiary.css` again.
4. De-text pass per §15: `DisclosureHeader` summary → icon affordance;
   `MasteryPanel` `'OK'/'--'` → `MilestonePips`; the Progression panel's
   mastery prose notes → state styling + tooltip.
5. Evasion smoke test: new `server/test/evasion.test.ts` (construct `World`
   directly, repo test conventions). Player `evadesHits {dodgeRate: 0.25,
   evadeMitigation: 0.5}`, four monster hits → hits 1-3 full damage with the
   accumulator stepping 0.25, hit 4 mitigated 50% with the accumulator
   wrapping; OOC reset applies `EVADE_OOC_RESET`; an evaded hit applies no
   debuffs (`evadeBlocksDebuffs`). The user reports dodges not visibly
   happening; the code reads coherent, so this test is the arbiter — fix
   whatever it exposes in this task.

Review gate: each item independently visually confirmed; `pnpm typecheck` +
`pnpm test` green.

### V2 - Bar grammar rollout

**Model:** Low-Medium
**Dependencies:** V0

Convert per the §15 assignment: quest progress → `GradientConduit`
(blue-violet); rune budget, reduction, catalyst progress → `EngravedMeter`.
The biome XP bar itself is untouched (reference implementation). HP and
mastery convert in V3/V4 with their surfaces.

Review gate: every converted bar side-by-side coherent with the biome XP bar;
no bar invents a ceiling a stat does not have (W4 rule).

### V3 - Character crown and Evasion instrument

**Model:** High (protocol change)
**Dependencies:** V0; V1 item 5

1. Network the evasion charge. Shared first: `EvadesHits` in
   `shared/src/components/core/networkedSlices.ts` gains `charge: number`
   (0-1). Preferred: the slice field BECOMES the accumulator — evasion
   listeners and `resetEvadeAccumulator` read/write it via
   `mutateSlice`/`markSliceDirty`, and the `EVASION_KEY` counter is deleted
   (matches "runtime state lives on slices"). Fallback if ordering fights
   back: counter stays truth, mirrored into the slice per change. `evadesHits`
   is already in `NETWORKED_PLAYER_KEYS`. Recalc already spreads the existing
   slice, so charge survives — extend the V1 test to assert it, plus a wiring
   test that the networked charge tracks hits taken.
2. Crown plate: fold the name row, status dot, and HP block into the top of
   `StatPlate` per §14.1. HP track = `GradientConduit` with every current
   layer preserved (shield capping band, regen preview past current HP, DoT
   preview at the leading edge, threshold hues). Numerals right-engraved;
   shield as a glyph chip. Glance figures/meters per §14.2; the deleted text
   lines' data already exists in the expand.
3. Evasion instrument: new `EvasionInstrument` beside the class mechanics,
   rendered only when `evadesHits` is present. `MechanicFrame` housing, charge
   meter fill = `charge`, "primed" glow state when `charge + dodgeRate >= 1`
   (the next hit dodges), mitigation as a micro-label (`50%` + evasion glyph),
   tooltip explaining determinism. The dodge event itself already produces the
   DODGE floater; the instrument shows anticipation, per the mechanics'
   authoritative-anticipation standard.
4. Mobile: the crown renders in the mobile sheet; the compact mechanic strip
   must not inherit desktop instrument density (W4 rule).

Review gate: Character reads as one apparatus and a sibling of the class
mechanics; the charge visibly steps on hits and discharges on a dodge; no
number reachable today is lost (≤ one hover or expand away).

### V4 - Progression cluster

**Model:** Medium
**Dependencies:** V0

1. Progression panel: quest bar per V2; the whole-panel "locate dungeons"
   affordance becomes a visible compass `ActionChip` on the quest row (the
   `▶ locate dungeons on map` hint text dies).
2. Mastery dial: radial gauge (conic-gradient gold ramp on an engraved ring,
   GM value centered, capped glow) that IS the button opening the Mastery
   dialog. Largest element after the quest block — mastery is being promoted
   to a primary progression system.
3. Single home: remove the desktop rail's Mastery nav entry; mobile keeps a
   destination. Gate inheritance per §16.
4. Mastery dialog: biome rows get map-consistent biome colors
   (`ui/map/constants.ts` + `BiomeIcon`) and `EngravedMeter`s of
   `biomeLevel / biomeLevelCap(playerTier, group)`; summaries become
   `GlyphTile`s.
5. Kill Crafting's Progress tab: remove from `CraftingPanel` `SECTIONS`; diff
   `BiomeTab` against the dialog first and fold anything unique in before
   deleting it.

Review gate: mastery reachable in one click from the dial and nowhere else on
desktop; biome colors match the map; no prose remains.

### V5 - Loadout and the rune rule board

**Model:** High
**Dependencies:** V0; picks up the explicit W3 leftovers

1. Rune recipes move to Crafting Make as one more kind in the `makeEntries`
   view model (client-side only — authoritative databases stay separate, W2
   rule) with a kind facet entry. Crafting becomes Make / Upgrade.
2. Build → **Loadout** (rename, `MenuButtons` label included). The Overview
   sheet dies; Loadout IS the overview: socket grid for Techniques/Guards
   (counts from `abilitySlotsAtom`), the stance pair (active one glowing),
   rite sockets, and the rule board. A socket is a cut-corner cell — engraved
   hollow + faint system glyph when empty; icon + name when filled; a tiny
   `1`/`2` corner engraving replaces the "fires first" note. Selecting a
   socket drives the existing `LoadoutBrowser` detail pane (W3's approved
   master/detail pattern — keep it, restyle it).
3. Rule board (the remaining ~equip half of `BuildRunesTab`): sticky budget
   `EngravedMeter` at top with an over state — the buried bottom equip button
   dies. Two panes (stacked on mobile): library grouped by channel using the
   existing `CHANNEL_COLOR` edges; active loadout as ordered
   `WHEN [condition glyph] → DO [action glyph]` cards with the
   `resolveRuneTarget` preview as icon + name and a warning state when the
   target is missing. Equip/unequip as per-card +/− `ActionChip`s; reorder via
   up/down chips (drag optional).
4. `buildPanelTabAtom` / `craftTabAtom` / `overlayStack` / rail sections /
   mobile More update together (the W2 risk note applies verbatim).

Review gate: every action previously reachable still reachable in ≤ the same
clicks; no resource is spent inside Loadout; keyboard-only equipping still
works; mobile sheets verified.

### V6 - Passive tree

**Model:** High for the spine layout; Medium for polish
**Dependencies:** V0 (icons)

Rebuild `SkillTreePanel` presentation per §14.6: class-toned spine of chosen
orbs joined by a conduit line; frontier's 3 choices as the focal orbs (icon,
≤2-word name, effect glyph chips, cost as pips); unpicked past siblings dim +
shrink with hover/tap expansion. Preserve exactly: unlock logic, desktop
hover-preview + click-unlock, mobile tap-select + commit, the
`summoner-root`/`CONDUIT_ENABLED` blocking, and reset behavior.

Review gate: a mid-build character's path is readable at a glance; every
node's full detail reachable by hover/tap; mobile verified.

### V7 - Staged unlock arc

**Model:** High
**Dependencies:** V0-V6 (the element inventory must be final — same reason W6
came last)

Implement §16: extend `SystemVisibility` with the new keys (combat log,
bestiary, progression, inventory, crafting, map, loadout, ability dock), all
through the single resolver with ownership overrides; extend
`UI_UNLOCK_SYSTEMS` and tag the new targets with `data-ui-unlock-system`; add
the badge layer; apply to mobile (More rows, tab bar) per the W7 pattern.

Review gate: the §16 fresh-character playthrough script passes; a migrated
save loses nothing; reduced motion and hidden-tab recovery hold.

### V8 - Optional polish (explicit user go-ahead required)

**Model:** Low-Medium

Phaser nametag/HP micro-pass (thinner engraved bars, subtle elite tint,
explicitly no added detail) and inventory touch-ups (rarity edges, silhouette
glyphs on empty slots, hover compare deltas).

## 18. Wave 3 risks

- The evasion slice change touches combat hot paths; the smoke test must land
  before the protocol change, not with it.
- Renaming Build and moving rune recipes hits `overlayStack`, rail sections,
  and mobile More simultaneously — the W2 blast-radius rule applies.
- The strict arc can strand players if any trigger uses non-durable state;
  every gate must name its authoritative signal in review.
- Badges are localStorage presentation state — they must never influence
  gameplay or visibility logic, only decoration.
- The display font must not leak into micro-labels or numerals; audit at
  non-default UI font scales.
- The biome XP bar is the gradient reference and is NOT restyled; only its
  modifier chip is removed.

## 19. Wave 3 progress tracker

| Phase | Status | Review notes |
|---|---|---|
| V0a. Kit + typography | Approved (2026-07-26) | The five §15 primitives live in `hud/primitives/kit.css` + one file each, exported from the primitives index. `GradientConduit` carries the accumulation grammar extracted from `biomeXpBar.css` (3-stop directional ramp, 2.8s shimmer, tick segments, `max`/`capped` ramp swaps, `snap` for resets, a `layers` slot for V3's shield/regen/DoT marks) with six per-meaning ramps; `EngravedMeter` is the deliberately flat counter-grammar and draws no fill at all at zero, so the 2px legibility floor can never turn "none" into "some". `ActionChip` makes the label mandatory — an icon-only control with no accessible name is a defect, not a de-texting — and `MilestonePips` states its count in one label. `GlyphTile` is the figure cell **extracted from** `StatPlate`, which now renders through it: `PlateFigure` became a `Pick` of `GlyphTileProps` so the recipe cannot drift, `useChangeFlash` moved to a shared hook, and `statPlate.css` shed the duplicated rules for one flex-sizing line. The kit is intentionally not `.desktop-hud`-scoped — a bar must read the same in a mobile sheet — and adds its own reduced-motion and `data-ui-hidden` pause rules, which the reference bar never had. `ApparatusPlate` was **skipped by design**: the crown folds into `.stat-plate` and the Evasion instrument uses `MechanicFrame`, so extracting the `mechanic-capacitor` housing would have added a primitive with no second caller. Typography: three candidate faces were self-hosted from `client/public/fonts` for an in-game comparison; **Cinzel 600 was chosen 2026-07-26** and Alegreya SC / Marcellus were deleted. It is switched by the `--hud-font-display` + `--hud-font-display-weight` pair and applied to dialog titles, rail `panel-title`, the boss name, and the live ≥11px section headings (`build-sheet__title`, `craft-biome-section__name`, `inv-title`) — not to 9px labels, numerals, body, tooltips, or the combat log. Repo typecheck, 34/34 tests, and the client build pass; `pnpm size:check` fails on 46 pre-existing unallowlisted files and none of them are V0's. **Approved by visual review 2026-07-26.** One note carried forward: the desktop rail title is 10px, below §15's own 11px floor, and was accepted as-is — revisit only if it reads thin at a non-default UI font scale. |
| V0b. Icon batch | Approved (2026-07-26) | Generated first, per the original plan: 22 entries × 3 candidates on pixflux at 64px, 0 failures, $0.47, using the proven `items`/`ability-icons` params. Rejected — subjects mostly landed but the surface was glossy, bevelled and teal, and collapsed at the 18px footprint. Root cause is structural, not prompt-level (see §14.11), so the route changed rather than the wording. All 22 are now hand-authored 16×16 pixel maps in `tools/glyphs/glyphs.ts`, in a palette **sampled** from the approved navigation icons, rendered by the new `pnpm art:glyphs` into `art/src/UI_icons/**` and shipped by the existing `art:pack`. `validateGlyphs()` throws on a ragged map since a miscounted row silently shifts a glyph. After a first pass the set read cooler and more geometric than the shipped family, so it was rebalanced to the family formula — charcoal mass, bronze trim, one small cyan spark, with bronze carrying thin strokes that charcoal would lose against the dark rail. The 22 PixelLab entries are `draft` with the rejection recorded, so `art:generate` reports "nothing to generate" and can never overwrite authored art. Cost of the authored set: zero; iteration is a character edit. Two redline rounds followed. Round 1 made the subjects literal (sword, dagger, plate, shield, crosshair, boot, medical cross, boot, bubble, compass) and gave the class sigils real subjects. Round 2 put attack and dps on the diagonal, gave every class sigil one shared circular frame, laid the war hammer diagonally, returned DoT to a plain droplet, and reweighted summoner onto its summons; `class-energy` was named the benchmark and is byte-for-byte unchanged, verified by diff. `stat-evasion` was reconceived rather than redrawn — a human figure cannot survive 16×16, so it now draws the *relationship*: a trajectory bending clear of a marked impact point. Grid size became per-glyph and equals the shipped size: 16×16 for stat/action glyphs the HUD draws at 16px, 32×32 for class sigils, which the passive tree renders on 88px nodes. **Packed and verified:** atlas is 512×164 with 69 frames, all 22 new frames present at their authored sizes, drift-check clean, and all 20 existing `atlasIcon` references still resolve. Sizing note for V3/V4: `GlyphTile`/`ActionChip` should request 16px rather than today's 13–18px to stay pixel-exact. |
| V1. Quick wins | Implemented — pending visual review (2026-07-26) | **(1)** The pace-family chip is gone from the biome XP bar, with its CSS rule and three now-dead imports; the modifier still shows on the map. **(2)** The collapsed Materials strip splits into two wallets with a 12px gap and an engraved rule, so a catalyst count is no longer read as essence; expanded rows use `tabular-nums` in fixed-width right-aligned columns and wrap long names instead of pushing the value out of the rail. **(3)** The bestiary crop was **reproduced at last** — see the tooling note below. Both surfaces always scrolled; the defect was that the detail dialog's two panes were the only scroll regions in the app declaring neither `scrollbar-width: thin` nor a thumb colour, so the platform drew an overlay scrollbar that appears only once you already know to scroll. Content cut at the panel edge with no affordance reads as cropped. Both panes now carry the standard thin thumb, and `.bestiary-detail__pane` gained the `min-height: 0` its sibling already had. **(4)** De-text pass: Mastery's `OK`/`--` column became `MilestonePips` carrying real labels ("Tier 3 items: reached"), and the Progression panel's two-state ceiling sentence became a warning-coloured figure plus a panel tooltip; the dead `.quest-mastery__note` rule went with it. **(5)** `server/test/evasion.test.ts` added and passing — see the row below. Repo typecheck, 35/35 tests, and the client build pass. |
| V1 tooling. `pnpm ui:shot` | Added (2026-07-26) | Playwright + Chromium, at the user's direction, after a second round of blind CSS patching on the same report. `tools/uishot/` screenshots any URL or static harness across the plan's viewport matrix and runs a **layout audit** that distinguishes three states: CLIPPED (unreachable content), SILENT (scrolls but renders no visible scrollbar — invisible to a screenshot, and the actual cause of both bestiary reports), and scrolls (working). `harness/*.html` load the real stylesheets and mirror the real DOM so pure-CSS defects reproduce with no server, login, or save state, with query params to push past what a normal save contains. Exits non-zero on a finding, so it can gate a change. Not in CI: the browser binary is never installed there and no `*.test.ts` imports Playwright. **Landmine found while installing:** the workspace packages carry `version: "0.4"`, which is not valid semver, so `workspace:*` cannot resolve and *any* dependency change fails — `pnpm install` only works today because the lockfile short-circuits resolution. **Fixed 2026-07-26:** the three dependents now declare `"@mmo-idle/shared": "link:../shared"`, which resolves by path and never consults a version, so the release script can keep writing `major.minor` forever. `shared` was restored to `0.4`. Verified by a full re-resolution (606 packages), the symlinks in all three packages, `pnpm build` across all four, typecheck, and 35/35 tests. |
| V2. Bar grammar | Implemented — pending visual review (2026-07-26) | Every bar now belongs to one of the two §15 grammars. `EngravedMeter` took the damage-reduction/dodge meters in `StatPlate`, the rune budget in `BuildRunesTab` (which was a hand-rolled pip strip with hardcoded purple/gold/red inline styles), the Overview sheet's budget meter, and a new catalyst-progress meter under the `40/100` figure in Materials. `GradientConduit` took the quest bar (see V4). The biome XP bar is untouched, as the reference implementation. Four blocks of bespoke track/fill CSS were deleted in favour of the primitives. |
| V3. Crown + evasion | Implemented — pending visual review (2026-07-26) | **Charge networked, the preferred way:** `EvadesHits.charge` IS the accumulator, not a mirror of one — the combat listeners already received `world`, so they write it through `mutateSlice`, and `EVASION_KEY` plus its `tracksCombat` counter are deleted. Trap avoided: `resetEvadeAccumulator` runs every tick for every out-of-combat player, so it no-ops when the charge already sits at the baseline; writing unconditionally would have broadcast an unchanged slice at 5 Hz forever. `evasion.test.ts` was retargeted onto the slice — it now reads exactly what the client is sent — and gained a section asserting the charge tracks hits and that a 0.5 rate makes the second hit the promised evade. **`EvasionInstrument`** renders beside whichever class mechanic the player has, keyed on `evadesHits` presence rather than archetype, so it shows even before a class is chosen. It draws the charge, a threshold line where the next hit lands, one tick per hit still to take, and a green *primed* state at `charge + dodgeRate >= 1` — a promise, not a probability, because the mechanic is deterministic. `MechanicFrame`'s `kind` widened to an explicit union rather than `string`, and its aria-label no longer calls everything a class mechanic. **Crown:** name, status dot and health folded into the top of `StatPlate`; the HP track is a `GradientConduit` with threshold ramps (vital/caution/critical) and the shield band, regen preview and DoT preview composed into its `layers` slot, so all three read against one scale. Shield became a chip, numerals are right-engraved, glance figures are DPS + Plating with HP/s and Speed demoted to the secondary line, and the static Dodge meter is gone — it stated a rate while saying nothing about when the next dodge lands. Verified in-browser via a new `tools/uishot/harness/crown.html`. Repo typecheck, 35/35 tests, client build pass. |
| V4. Progression cluster | Implemented — pending visual review (2026-07-26) | **Progression panel:** the quest requirement is now drawn by shape, not a single bar — `MilestonePips` at or below six required units, `GradientConduit` with per-unit segments above. **This is the boss-seal seam:** nothing in the panel knows what a unit *is*, so `killsRequired: 3` with distinct sources draws three trophies with no UI work, and today's one-boss quests already draw as the same shape with N of 1. The whole-panel click target and its `▶ locate dungeons on map` hint became an explicit compass `ActionChip` on the quest row — a panel-sized button hid the action and read as decoration. **Mastery dial:** a conic-gradient gold ring, engraved face, capped pulse, and it *is* the button opening the dialog; the duplicate rail nav entry is gone, so desktop has one home for mastery while mobile keeps its More destination. The dial takes `onOpenMastery`/`showMastery` as props rather than reaching for `masteryOpenAtom`, preserving the rule that no mobile path sets a primary dialog atom. **Mastery dialog:** biome rows carry the map's own `tileColor` and `BiomeIcon` plus an `EngravedMeter` against `biomeLevelCap(playerTier, group)` — "Lv 4" alone never said how much was left — and the summary headline became three `GlyphTile`s. **V4.5 deliberately NOT done:** see the row below. |
| V4.5. Crafting Progress tab | Done (2026-07-26) | Resolved the way the diff suggested: the information moved rather than the tab. `gearEntries()` no longer skips locked gear — it lists it with `unlocked: false` and a hint naming what it waits on (`Reach Forest level 4`), which `MakeTab` already knew how to render as a LOCKED row with a blocked detail pane. That put the one genuinely unique thing the Progress tab held into Make, where W2 decided recipes live. Its other section listed "ultimate" gear and was **already dead** — the recipes were commented out of the recipe index, so `RECIPE_DATABASE` carried none and the section's `if (recipes.length === 0) return null` always fired. `BiomeTab.tsx` deleted; `CraftTab` is now `make | upgrade`, landed together with `craftTabAtom`, the rail sections and the mobile More menu per the W2 blast-radius rule. **Ultimate recipes deleted outright** at the user's direction as a scrapped-feature artifact: `abyssUltimate.ts`, its commented registration, the `ultimate?: boolean` flag, and `ULTIMATE_RECIPE_GROUP`. Deliberately kept: `ULTIMATE_CLEAR_VOID_OVERLORD`, because the server records that boss clear in `bossesCleared` and ability/rite recipes gate on boss-clear tokens generally; and `requiredBossClear` on gear, which is the same live pattern. **Left standing, flagged:** the Edge of Oblivion corruption reservoir (`VOID_CORRUPTION_EFFECT_ID`, `CORRUPTION_MIN_SPEED_MULT`, `EDGE_OF_OBLIVION_ID`) is now unreachable — no recipe or item defines that weapon — but it threads through `weaponEffects.ts`, `movement.ts`, `markerInvariants.ts` and `itemDisplay.ts`, so removing it is a combat-code change rather than a data one and was not done unasked. |
| V5.1-5.2. Runes into Make, Build → Loadout | Implemented — pending visual review (2026-07-26) | **Runes moved to Crafting.** They fit the existing `techniqueEntries` spec exactly — same id/name/tier/cost/`recipeGroup`/`requiredBiomeLevel` shape and the same biome-mastery gate — so they became a fourth technique-like kind rather than a special case: one facet chip, one `KIND_ORDER` entry, `ownedRunes` on `MakeSources`. The one real difference is the server intent (`rune:craftRecipe`, not `crafting:craftRecipe`), verified before wiring and dispatched from `learnIntent()` beside ability/stance/rite — the browser is one surface over several authoritative databases, per the W2 rule. **The Forge half of `BuildRunesTab` is gone** now that it would duplicate Make: the sub-tab strip, `RuneForgeTab`, four forge-only helpers, six imports and `runePanelTabAtom` — **313 lines deleted, 23 added**, leaving the file as the equip half V5.3 rebuilds into the rule board. **Renamed to Loadout** across the rail entry, the dialog title and tabs label, and the mobile More menu. Internal `build*` identifiers deliberately keep their names — renaming reaches a dozen files and every persisted key for no player-visible gain — with the split documented at `buildPanelTabAtom`. Repo typecheck, 35/35 tests, client build pass. **Still open in V5:** the socket grid and the `WHEN → DO` rule board (V5.3). |
| V5.3. Loadout board + rule board | Implemented — pending visual review (2026-07-27) | **Loadout IS the overview.** The label/value sheet became a board of socket cells: cut-corner cells (using the tier `--hud-frame-cut` token) that are engraved-hollow when empty and named when filled, with firing order as a corner numeral rather than a "fires first" note, and the in-force stance edged in success green. Selecting a socket opens the tab that fills it. `SheetSection`/`SheetRow` and their CSS are gone. Sockets are text-led: there is no approved art for ability/stance/rite, and referencing frames that would not resolve is worse than no glyph. **Rule board:** each rule now reads as one sentence — `WHEN … → DO …` with the arrow drawn — instead of two stacked lines the reader had to infer a relationship from. Target preview keeps its icon and gains a name plus a missing state; reorder and remove are `ActionChip`s, retiring the bespoke `PriorityButton`. All of it moved off inline styles with a hardcoded purple palette onto tier tokens. |
| V6. Passive tree | Implemented — pending visual review (2026-07-27) | "The path you walk" (§14.6). Past tiers now distinguish the spine from the roads not taken: a picked node keeps its size and gains a lit ring, while unpicked siblings shrink to 34px, desaturate and dim to 0.42 — **never hidden**, since class reset exists, and they expand back to full on hover or tap. Node cost became `MilestonePips` (one mark per point) instead of the string "2pt" in a pill, and the detail pane's effects became glyph chips — each authored V0b stat glyph plus its signed value, with negatives in danger red — replacing a run-on string of three-letter abbreviations. The class-orbit view keeps `formatEffects`, where a one-line string is the right shape. Unlock logic, hover-preview/click-unlock, mobile tap-commit, the `summoner-root` blocking and reset behaviour are all untouched. |
| V7. Staged unlocks | Implemented — pending visual review (updated 2026-07-30) | The §16 arc is resolved once in shared code and consumed by desktop, mobile, badges, and the 3.6-second wake. The reviewed schedule now keeps Progression and Party available from the start; unlocks Crafting at four essence of one type; unlocks Mastery at Global Mastery 1; unlocks Abilities from known/equipped ability ownership; and unlocks Map through persisted world travel. `TracksProgression.visitedNodes` records actual gate crossings, with hydration fallbacks for old saves, so Map stays available after returning to the clearing. Combat Log/Bestiary, Inventory, Materials, Passive Tree, Loadout, Stances, and Rites retain their prior rules. Explicit Map/Crafting/Mastery/Abilities milestones no longer inherit the tier-1 master override. Hydration remains a baseline rather than a reveal, and mobile uses the same resolver. The pure-policy suite covers every reviewed trigger and the server transition suite smoke-tests durable travel discovery. |
| V8. Optional polish | Not started | Requires explicit user go-ahead |
