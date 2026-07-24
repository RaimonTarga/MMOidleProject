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
- Tier overrides are desktop-only until Phase 12. Shared mobile renderers keep
  the stable Tier 1 fallback even though the document attribute remains visible
  to every root.
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

---

## 6. Known regression risks

- Ability dock or Auto Combat overlap with the Phaser minimap at narrow desktop
  widths.
- UI font scaling uses `zoom`, which can change measured widths and modal fit.
- Shared `StatPanel` or mechanic selectors can leak desktop styling into mobile.
- Independent modal atoms can create stacked same-z-index dialogs and mismatched
  selected navigation states.
- CSS and Phaser both encode the 1100px breakpoint and can drift.
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
| 12. Mobile adaptation | Deferred | Regression fixes only until this phase. |
