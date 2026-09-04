# Boss Encounter Redesign — Implementation Planning Handoff

**Status:** Design pass approved / ready for implementation planning  
**Purpose:** Source document for an implementation-planning agent  
**Scope:** Boss encounter redesigns across the currently active biome lineages, plus a targeted redesign of the regular Deep Sea Trench enemies so they teach the mechanics used by the Trench boss.

---

## 1. Purpose of this document

This document records the **locked encounter-design decisions** from the boss review.

The next agent should **not redesign these encounters from scratch**. Its job is to:

1. inspect the current implementation,
2. map the locked designs below onto existing systems,
3. identify the smallest generic engine/data additions required,
4. produce an implementation plan,
5. call out conflicts or missing primitives,
6. avoid numerical balance work except where a placeholder is needed to make a mechanic implementable.

This is a **design-structure pass, not a numerical tuning pass**.

HP, attack values, cooldowns, shield percentages, exact durations, exact stack thresholds, exact movement speeds, damage multipliers, etc. should remain placeholders unless the implementation requires a concrete temporary value. Final numbers belong to later balance/playtest passes.

---

# 2. Global encounter-design rules

These rules are part of the approved design and should guide implementation decisions.

## 2.1 Bosses must remain fully automatable

Manual attention may improve execution, but no encounter should require manual control.

A healthy boss mechanic should normally have one or more of these systemic answers:

- **movement automation**,
- **Guard / defensive automation**,
- **Cleanse / Break Free / other generic status tools**,
- **stance or technique automation**,
- **gear/build preparation**,
- **raw durability / recovery / damage output**.

Do not introduce boss-specific rune vocabulary unless a genuinely reusable generic condition/action is missing.

---

## 2.2 Manual play is optimization, not a requirement

The intended rule is:

> **Manual play should improve execution. Runes should reproduce the essential response. Buildcraft should determine how forgiving failure is.**

---

## 2.3 One dominant fantasy per boss

Avoid “ability collections.”

A boss should be describable in one evocative sentence that sounds like something the creature would actually do.

Higher tiers should deepen the same idea rather than bolt on unrelated mechanics.

---

## 2.4 Readability matters more than hidden sophistication

Important mechanics should be visible through:

- casts,
- movement,
- telegraphs,
- obvious state changes,
- boss animation/presentation,
- clear status application.

Avoid encounters whose real logic is mostly invisible multipliers.

---

## 2.5 Patterns beat isolated abilities

Prefer:

> setup → response → payoff → reset

over:

> ability A + ability B + ability C.

---

## 2.6 Boss mechanics should use generic systemic vocabulary

Examples already established during the design pass:

- `Inside Telegraph -> Step Back`
- `Enemy Charging -> Fire Guard`
- hard control -> `Break Free`
- debuff management -> `Cleanse`
- low enemy HP -> aggressive stance / execution setup
- normal Chase / movement tools for pursuit

When new implementation is needed, prefer extending a **generic mechanic family** rather than authoring boss-only code.

---

# 3. Existing lineages that are mostly preserved

The review established that several earlier encounters already have good identities.

## Plains

**Identity:** rally / swarm / concurrency.

The boss repeatedly calls or rallies additional creatures. The encounter is about handling bodies and density.

Preserve this identity.

---

## Forest

**Golden-standard reference:** Gnarled Greatbear.

Fantasy:

> The bear repeatedly stops to work itself into a frenzy, then resumes mauling the player faster and faster.

Its strength is simplicity, visibility, escalation, and creature fantasy.

Later Forest bosses should not merely duplicate the same Frenzy loop, but the T1 Greatbear itself is a reference standard for encounter readability.

---

## Swamp

**Identity:** poison / rot / persistent hostile ground / attrition.

The current lineage is broadly coherent.

No major redesign was locked during this pass.

---

# 4. Mountain — LOCKED

## Core biome identity

> **Mountain = catastrophic burst + heavy defenses.**

The player is asked whether their setup can survive huge discrete damage, and whether automation can reduce how much of that damage must be endured.

Valid answers include:

- move out of the attack,
- Guard the attack,
- gear to survive it.

The main fantasy is **committed momentum / catastrophic impact**, not generic “big slow boss.”

---

## 4.1 T1 — Crag Behemoth

### Signature pattern

> **Wind-up → rectangular telegraph locks → boss charges through the rectangle → huge burst → brief recovery.**

### Contracts

- Charge direction locks when the cast begins.
- The boss should **not track the player during the committed charge**.
- The telegraph should be a clearly visible **oriented rectangle**, not the existing circular slam language.
- `Inside Telegraph -> Step Back` must be able to solve it.
- `Enemy Charging -> Fire Guard` must be able to solve it defensively.
- A sufficiently durable setup can simply survive it.
- No new boss-specific rune is required.

### Important implementation note

Current combat ground telegraphs are primarily circle-based.

The implementation should extend the **generic telegraph/ground-zone geometry system** to support an oriented rectangle rather than creating Mountain-boss-specific collision/rendering code.

The same shape must be used consistently for:

- client rendering,
- “inside telegraph?” checks,
- Step Back escape logic,
- actual hit resolution,
- bot/telemetry logic.

Do not allow a visual rectangle with circular hit logic.

---

## 4.2 T2 — Stoneplate Juggernaut

### Signature pattern

> **Raise shield → line up charge → charge → shield breaks/drops → recover → repeat.**

The shield and charge are one coherent behavior.

### Contracts

- Use an actual Mountain-native shield/barrier rather than vague temporary DR.
- Shielding protects the boss while it prepares the charge.
- After the committed charge, the defensive state ends.
- Do **not** require the player to automate an offensive burst window.
- Attacking into the shield may be inefficient, but should not be a hard invalidation.
- Movement, Guard, and tanking remain valid answers to the incoming charge.

The exposed/recovery beat exists mainly to create rhythm/readability, not to demand timed burst optimization.

---

## 4.3 T3 — Crag-Gorged Horn-Behemoth

### Signature pattern

> **Rectangular charge → circular Cragbreaker impact.**

This is the evolved two-step spatial version of the T1 lesson.

Generic telegraph automation should solve both components.

---

## 4.4 T4 — Iron-Crest Titan

Preserve the strong existing concept:

> **Committed impact → Earthshatter → delayed fault-line aftershock.**

The current fault-line idea should remain a **delayed telegraphed impact pattern**, not persistent terrain.

The boss does not need additional unrelated mechanics.

---

# 5. Cave — LOCKED

## Core biome identity

> **Cave bosses are armored subterranean predators that progressively tear through the player's defenses.**

Cave is the low-density / elite biome.

The boss should feel like one enemy slowly dismantling the player's defenses rather than a swarm or generic slam boss.

The crawler family is a giant insect/alien/carpace creature.

---

## 5.1 T1 — Obsidian Broodmother

### Signature pattern

> **The crawler progressively tears down the player's armor.**

Normal attacks apply plating/defense shred.

A heavier readable attack may apply a larger chunk of shred.

### Player answers

- sufficient %DR / HP / recovery,
- enough damage to end the fight before erosion gets severe,
- optionally avoid/Guard the heavier telegraphed breach attack.

Do not make “boss becomes vulnerable, now burst it” the core mechanic.

---

## 5.2 T2 — Chitinous Dreadbore

### Signature pattern

> **Defense erosion + burrow eruption.**

Cycle:

> normal erosion → burrow → emergence telegraph → eruption → resume combat.

The eruption should apply a meaningful chunk of shred/pressure if it lands.

### Automation

- `Inside Telegraph -> Step Back`
- `Enemy Charging -> Fire Guard`
- tanking remains viable.

Remove the need for a generic repeated circular Slam if burrow eruption replaces it cleanly.

---

## 5.3 T3 — Deep-Core Burrow-Gorger

### Signature evolution

> **Once the crawler has torn through enough protection, corrosion/venom begins getting through.**

Shred becomes a threshold system:

> armor intact → armor damaged → armor breached → corrosion/poison reaches the player.

The existing corrosion-threshold concept is worth preserving and simplifying around this story.

The boss may retain the evolved burrow attack.

Do not add unrelated phase mechanics.

---

# 6. Desert — LOCKED

## Core biome identity

> **Desert enemies set the player up with control/debuffs, then punish the setup.**

The normal biome has a controller/dealer pairing.

The scorpion boss compresses both roles into one creature.

Primary vocabulary:

- slows / roots,
- Death Mark,
- setup,
- execution/cash-out,
- later melee ↔ ranged behavior changes.

---

## 6.1 T2 — Dune-Stalker Emperor

### Signature cycle

> **Death Sting → Death Mark → Execution.**

Death Mark should be a clearly applied event, not an opaque rider on ordinary combat.

The boss explicitly marks the player, then later performs a visible charged attack that consumes/cashes out the mark.

### Player answers

- Cleanse/manage the mark if generic debuff automation supports it,
- Guard the execution,
- gear to survive the marked execution,
- kill fast enough to reduce cycles.

Avoid creating a Death-Mark-specific rune unless “Marked” becomes a generic reusable condition category.

---

## 6.2 T3 — Dune-Carapace Monarch

### Phase 1 — Controller

Close-range scorpion:

- slows,
- marks,
- executes.

### Transition

At the phase threshold, the boss visibly retreats / changes posture.

### Phase 2 — Dealer

The boss becomes a **real ranged kiter**.

Important implementation contract:

> A kiting boss must have movement/AI values that actually let it maintain distance without becoming permanently uncatchable.

The mark persists through the transition.

Fantasy:

> **First it controls the prey, then it becomes the dealer that cashes the setup out.**

---

## 6.3 T4 — Dune-Throne Sovereign

Preserve the three-act skeleton.

### Act I — Hunter / Setup
Melee controller.

### Act II — Punisher
Ranged kiter.

### Act III — Cornered King
Stops kiting and recommits to melee for the finish.

Do not add unrelated mechanics.

The charged execution/cash-out should be the obvious payoff for Death Mark rather than a generic extra Slam.

---

# 7. Jungle — LOCKED

## Core biome identity

> **Jungle bosses are ambush predators. Hurt them and they attempt to disengage; deny the escape and the next retreat becomes harder, but if they get away they reset the chase and return with a dangerous ambush.**

This is the approved Jungle centerpiece.

The boss is a huge panther/predator.

---

## 7.1 Retreat mechanic — exact resolution

When the panther decides to flee:

1. It gains a **small temporary Escape Guard shield**.
2. It runs toward an escape threshold/distance.
3. The player wins the chase by **breaking Escape Guard before the panther reaches the escape threshold**.

### If Escape Guard breaks

- retreat fails,
- panther stops fleeing,
- very short stumble/readability beat only,
- normal combat resumes,
- panther gains one stack of **Escape Instinct**.

Do not reward the player with a long stun.

### If the panther reaches the escape threshold

- escape succeeds,
- it enters stealth,
- Escape Instinct resets,
- it later returns with an empowered ambush.

---

## 7.2 Escape Instinct

Every **failed retreat** makes the next retreat faster.

This escalation applies specifically to **retreat speed**, not general combat speed.

Desired behavior:

> retreat → caught → next retreat faster → caught → faster → eventually escapes → stacks reset.

Use a sensible cap.

The point is to ensure that even strong mobility builds normally experience the stealth/ambush mechanic eventually.

This converts a binary movement check into:

> **How many retreats can this build deny before the predator finally gets away?**

---

## 7.3 Why the shield exists

The retreat should **not** fail because the player landed one incidental hit.

The small Escape Guard makes “maintain pressure” the actual condition.

It should be small enough that the mechanic is primarily a **chase/contact test**, not a burst-DPS phase.

Valid tools include:

- raw movement speed,
- chase-speed gear,
- Charge/gap closers,
- slows/roots where appropriate,
- ranged reach.

Do not artificially require ranged characters to physically touch the boss.

---

## 7.4 Successful escape

The boss should **not meaningfully regenerate HP** as the default design.

Successful escape earns:

- stealth reset,
- empowered ambush,
- reset of Escape Instinct.

That is sufficient.

Avoid creating an accidental infinite fight through boss healing.

---

## 7.5 Tier evolution

### T2 — Jungle Dread-Gorger

Teach:

> **retreat → catch it OR it escapes → stealth ambush.**

Keep simple.

### T3 — Apex Bramble-Slasher

The successful stealth ambush becomes **venomous**.

Poison is a **burst aftermath**, not constant attrition.

Fantasy:

> the predator got a clean poisonous bite.

This keeps Jungle poison distinct from Swamp.

### T4 — Verdant-Crown Predator

Use the full retreat/stealth hunt cycle.

At low HP:

> **the predator stops retreating entirely and enters wounded frenzy.**

It abandons evasion/escape and becomes relentlessly aggressive.

Strong narrative inversion:

> Earlier: can the player keep up with it?  
> Final phase: can the player survive it keeping up with them?

---

# 8. Tundra — LOCKED

## Core biome identity

> **The environment owns Chill. The mammoth weaponizes it.**

Tundra is elite-focused and low-density.

Ambient Chill suppresses:

- movement speed,
- attack speed.

Cleanse should help manage Chill but should not trivially erase the biome mechanic.

---

## 8.1 Remove boss offensive vulnerability-window dependence

The current boss Ice Armor -> Shatter -> vulnerability-window concept is not the desired main encounter mechanic because the automation system is not built around concentrating offense into timed boss vulnerability windows.

Ice Armor can remain a **normal Tundra bear-family mechanic**.

The mammoth boss instead owns:

> **Chill → Freeze → Shatter.**

---

## 8.2 Deep Freeze

Deep Freeze is a **targeted, unavoidable cast**, not a dodgeable ground AoE.

It should still be strongly telegraphed visually.

When it resolves, it checks the player's current Chill.

- Low/moderate Chill: does not fully Freeze.
- High enough Chill: player becomes **Frozen** / hard-controlled.

The exact threshold is balance work.

Important rule:

> Telegraphing does not imply dodgeability.

The intended answer happens through Chill management before the cast, not by stepping out of it.

---

## 8.3 Shatter / Glacial Collapse

After Deep Freeze, the mammoth prepares a large visible telegraphed impact.

If the player is not Frozen, they may move out, though Chill makes movement harder.

If Frozen:

- `Break Free` can restore movement,
- then `Step Back` can escape the telegraph,
- or the player can tank/Guard the hit.

This gives multiple systemic solutions:

1. manage Chill with partial Cleanse,
2. Break Free if Freeze lands,
3. Step Back if mobile,
4. Guard/tank the Shatter,
5. kill fast enough to experience fewer cycles.

---

## 8.4 Chill cycle

The boss sequence should cause a meaningful amount of Chill to be shed/reset after the Freeze/Shatter cycle resolves.

Desired rhythm:

> getting colder → danger threshold → Freeze/Shatter event → partial thaw → getting colder again.

Avoid a permanent max-Chill end-state if possible.

---

## 8.5 Tier evolution

### T3 — Frost-Plated Rime-Mammoth

Teach the basic:

> **Chill → Deep Freeze → Shatter.**

### T4 — Glacial Patriarch

The Shatter becomes a larger **Glacial Collapse** telegraph.

The ideal automation chain is:

> Chill management fails → Frozen → Break Free → Step Back.

Do **not** additionally make Glacial Collapse secretly multiply its damage by Chill unless playtesting demonstrates a need.

Chill already makes the move more dangerous by reducing mobility and enabling Freeze.

---

# 9. Volcano — LOCKED

## Core biome identity

> **Heat makes both sides increasingly lethal.**

Volcano is a high-density/swarming biome.

Its environmental Heat is the defining escalation mechanic.

Heat increases both:

- damage dealt by the player,
- damage taken by the player.

### Design rule

> **Heat owns the escalation budget.**

Do not stack a second generic boss enrage/ramp on top of it.

Heat remains **undispellable by ordinary Cleanse**.

---

## 9.1 Vent zones

The boss periodically creates a persistent **Vent / Caldera Vent hazard zone**.

The existing hazard-area and hazard-avoidance systems should be used.

### Staying in the Vent

- maintains/builds Heat,
- may accelerate Heat gain,
- preserves the player's high outgoing damage,
- keeps danger high.

### Leaving the Vent

- allows Heat to shed normally / cool down,
- makes the fight safer,
- reduces the player's offensive Heat amplification.

This is an intentional risk/reward decision.

Existing persistent-hazard automation should allow the player to choose whether their character avoids these areas.

Do not make ordinary Cleanse remove Heat.

---

## 9.2 Low-intensity Burn

Add a **secondary simmering Burn**.

This is not the main threat.

Desired identity:

- low damage per stack,
- high or very high cap,
- long enough duration / refresh behavior to build over extended combat,
- applies ambient attrition while the fight remains hot.

Contrast:

- Swamp DoT = the encounter,
- Jungle poison = burst aftermath,
- Volcano Burn = background simmer.

Burn may be conventionally cleanseable.

Heat is not.

Avoid multiplicative special Burn scaling if Heat already increases incoming damage sufficiently.

---

## 9.3 T3 — Cinder-Shell Magma-Salamander

Keep simple.

Possible rhythm:

> normal combat → Shell Up / Vent → normal combat → Vent.

If Shell Up remains, connect it to Vent rather than treating it as a separate unrelated defensive trick.

During Shell/Vent:

- direct damage against the boss may be reduced,
- the Vent decision occurs,
- the player can stay hot or cool off.

Do not overbuild T3.

---

## 9.4 T4 — Caldera Sovereign

The normal fight uses the full Heat + Vent + simmering Burn loop.

Then, at roughly the final quarter, trigger the encounter's capstone.

### Caldera Cataclysm / final eruption

At the low-HP threshold:

- one-time event,
- enormous, unmistakable cast,
- conceptually around **10–20 seconds**,
- boss stops ordinary attacks while casting,
- cast cannot simply be interrupted,
- if it completes, it deals **room-wide / unavoidable catastrophic damage**,
- intended to kill almost every ordinary build,
- exceptionally tanky builds may possibly survive.

This is **not** another Step Back telegraph.

The intended response is:

> **Finish the boss before the cast completes.**

This is the payoff for riding Heat.

A player who stayed hot:

- accepted more danger earlier,
- enters the execute phase with much higher offensive amplification.

A conservative attrition setup:

- had a safer first 75%,
- enters the final DPS race with less Heat damage amplification.

That asymmetry is intentional.

### Automation

The game already has enemy-low-HP rune conditions.

The final phase should support setups such as:

- switch to Berserker / Execution stance,
- fire offensive techniques,
- abandon defensive priorities,
- commit to the kill.

This is a major reason the final-cast design is approved.

---

# 10. Wasteland — LOCKED

## Core biome identity

> **The dead are resources.**

Wasteland is explicitly allowed to be the thematic exception to the old “Plains owns extra bodies” convention.

Difference:

- Plains **calls more living allies**.
- Wasteland **recycles the bodies already killed**.

The boss is a summoner/necromancer.

---

## 10.1 Charnel-Crown Sovereign

The boss itself should be comparatively modest.

The army is the encounter.

Core loop:

> opening entourage → kill adds → corpses remain → Raise Dead → kill Risen → Mass Resurrection.

---

## 10.2 Raise Dead

The boss periodically casts a clearly visible **Raise Dead**.

Presentation should make selected corpses obvious:

- glow,
- tether,
- necromantic effect,
- readable cast.

The player should understand exactly which bodies are about to return.

---

## 10.3 Resurrection limit

Do **not** allow one corpse to revive forever.

Approved default:

> **Each corpse can be raised once.**

After the Risen version dies, it collapses permanently / disintegrates / no longer leaves a valid resurrection corpse.

This guarantees permanent progress and avoids endless add loops.

---

## 10.4 Mass Resurrection

Use this as the boss's main large event rather than adding a generic Slam.

At a major threshold:

> **Mass Resurrection → all/most eligible corpses rise together.**

This is enough complexity for Wasteland's debut tier.

Future tiers can evolve corpse systems later.

---

## 10.5 Add roles / death effects

Use a **small number of complementary add roles**.

Do not turn every add into a bespoke fireworks mechanic.

Examples:

### Bone Crawler
Cheap body / pressure.

May have a small death explosion.

### Plague Hound
Melee pressure.

On death, leaves a plague/hazard pool.

### Carrion support unit / Vulture
Weak body that buffs nearby undead/Risen while alive.

Exact roster can be adapted to the currently implemented Wasteland monsters.

The goal is for resurrection to recreate a small tactical ecosystem rather than merely restoring health bars.

---

# 11. Deep Sea Trench — LOCKED

## Core biome identity

> **Extreme low density. Every enemy is a mini-boss problem. The boss is the ultimate oppressive duel.**

This is intended to be one of the hardest current encounters.

The boss is a giant sea serpent / leviathan.

Fear should come from pressure and consequence, not from six unrelated abilities.

### Boss sentence

> **The serpent wounds the player's recovery, prevents comfortable escape, and periodically tries to Devour the player; every failed response makes the enormous duel worse.**

---

# 12. Deep Sea Trench — regular monster redesign is IN SCOPE

Unlike the other boss lineages, the regular Trench roster is explicitly part of this delivery.

The area currently has only a few elite enemies, and the design pass should use them to **teach the mechanical vocabulary that the boss later combines**.

The implementation-planning agent should review the active Trench enemies and produce a coherent teaching progression.

Do not simply copy the boss onto every monster.

Each regular elite should own **one primary problem**.

A useful high-level distribution is:

---

## 12.1 Hunter / Serpent elite — teach Abyssal Wound

Role:

> relentless melee hunter.

Signature:

### Abyssal Bite

A telegraphed heavy bite that applies a **single nonstacking anti-recovery wound**.

The current direction of removing universal anti-heal from every Trench enemy is correct.

Anti-recovery should belong to a specific lineage/mechanic.

Player answers:

- Cleanse,
- enough recovery to function through it,
- Guard the Bite,
- burst/execute,
- avoid accidentally pulling a second elite.

---

## 12.2 Ranged / Hadal elite — teach anti-kite and positional danger

Role:

> ranged elite / standoff problem.

It should remain catchable by a properly configured player.

The danger of chasing it is partly ecological:

> pursuing one elite can drag the player across the Trench into another elite's detection area.

This enemy can teach:

- range pressure,
- mobility requirements,
- deliberate repositioning,
- possibly a readable slow/root/pressure attack.

Do not make it literally uncatchable.

---

## 12.3 Anchor / Leviathan elite — teach committed Devour-like pressure

Role:

> giant stand-and-fight wall.

Signature:

- enormous durability,
- broad defenses,
- one giant predictable committed attack,
- optional simple carapace/shield as its own lineage identity.

This enemy teaches:

> “A Trench creature may simply demand that you survive one huge telegraphed attack.”

Do not give it the boss's full anti-heal + control + Devour sequence.

---

## 12.4 Optional control-specialist elite

If the active roster supports a fourth distinct enemy cleanly, use it to teach the control vocabulary:

- root,
- heavy slow,
- pull,
- constrict,
- or another anti-disengage mechanic.

If there are only three strong active monster slots, fold the control lesson into the ranged/hunter enemy rather than inventing unnecessary population.

---

# 13. Elder Trench Serpent boss

The boss combines the vocabulary taught by the area.

Core sequence:

> **Abyssal Wound → Undertow / Constrict → Devour.**

Everything should reinforce that one predatory sequence.

---

## 13.1 Abyssal Wound

The boss periodically performs a clearly readable heavy bite.

If it lands:

- applies meaningful anti-recovery,
- nonstacking,
- conventionally cleanseable,
- reapplied later.

Cleanse therefore **manages** the wound rather than deleting the encounter permanently.

Do not return to extreme universal anti-heal values across the whole biome.

---

## 13.2 Undertow / Constrict — anti-kite

The boss must prevent indefinite ranged kiting, but should not simply have absurd permanent movement speed.

Approved fantasy:

> **The sea brings the prey back to the serpent.**

Possible implementation forms, to be chosen by the planning agent based on existing primitives:

- pull/current effect,
- strong slow specifically associated with disengagement,
- rapid committed gap-close,
- brief Constrict/root after reaching the player.

Design contract:

> The player may create distance temporarily, but cannot kite the boss forever.

Ranged builds remain viable; they simply do not get permanent risk-free uptime.

---

## 13.3 Devour

This remains the boss's headline attack.

The current concept of a long, obvious wind-up is good.

Desired result if Devour lands:

- enormous direct damage,
- boss heals a meaningful amount.

The self-heal is appropriate here because the cause is explicit and preventable:

> the serpent successfully ate the player.

This is different from passive boss regeneration.

---

## 13.4 Devour answers

Multiple systemic responses must remain valid.

### Movement
Committed readable telegraph -> `Step Back`.

### Guard
`Enemy Charging -> Fire Guard`.

### Hard-control recovery
If Undertow/Constrict trapped the player:

> `Break Free -> Step Back`

can be the premium automated answer.

### Tanking
Extremely durable builds may intentionally eat Devour, accept the boss heal, and continue.

Inefficient but viable.

---

## 13.5 Remove unnecessary boss clutter

The approved boss does **not** need all of these simultaneously:

- periodic generic shield,
- generic AoE body slam,
- unrelated haste,
- generic enrage,
- anti-heal spam,
- multiple independent nukes.

The boss should read:

> **Wound you → catch you → eat you.**

If the existing periodic shield dilutes that pattern, remove it from the boss and leave Carapace as an elite-monster mechanic.

---

## 13.6 Low-HP escalation

A single escalation is allowed because this is a hard capstone duel.

Do not add a new mechanic.

At low HP, tighten the existing hunt:

- Undertow sooner/more often,
- shorter breathing room before Devour,
- possibly longer Wound duration.

Fantasy:

> **Blood in the Water.**

Same predator, less breathing room.

---

# 14. Relative confidence / design intent notes

The approved designs do not all need identical complexity or spectacle.

The review explicitly accepted that.

### Particularly strong / memorable new identities

- **Jungle:** escalating retreat chase -> stealth venom ambush -> wounded frenzy.
- **Volcano:** Heat risk/reward -> Vent choice -> final execute race.

These should be protected strongly during implementation planning.

### Simpler but approved

- **Tundra:** Chill -> unavoidable Freeze check -> telegraphed Shatter/Collapse.
- **Trench:** Wound -> catch -> Devour.

Do not add mechanics merely to make these as elaborate as Jungle/Volcano.

A simple coherent boss is better than a kitchen-sink boss.

---

# 15. Implementation-planning requirements

The next agent should produce a concrete plan that covers at least:

## A. Data/model changes
Identify new/reused boss-data fields needed for:

- oriented rectangular telegraphs,
- committed charge geometry,
- Jungle retreat state,
- Jungle Escape Guard,
- Jungle retreat-speed escalation/reset,
- targeted Chill-threshold Deep Freeze,
- Chill shedding after the Tundra cycle,
- Volcano Vent zones,
- Volcano simmering Burn,
- one-time low-HP long cast / catastrophic execution event,
- corpse resurrection eligibility / one-revive limit,
- Trench Undertow/Constrict,
- Devour heal-on-hit.

Prefer generic reusable fields/systems.

---

## B. Combat-engine changes
Identify changes needed for:

- telegraph geometry consistency,
- boss state transitions,
- shield break -> retreat interruption,
- stealth/escape/re-entry,
- threshold-driven status logic,
- one-time final casts,
- corpse lifecycle and resurrection eligibility,
- pulls/roots/anti-kite behavior.

---

## C. Rune/automation compatibility
For every redesigned boss, explicitly state:

1. which existing generic runes/actions solve it,
2. whether any missing generic automation primitive exists,
3. whether that missing primitive is actually necessary.

Do not invent bespoke runes casually.

---

## D. Client/readability work
Plan visual/state communication for:

- rectangular Mountain charge,
- Jungle retreat shield / Escape Instinct / stealth ambush,
- Death Mark and Desert execution,
- Tundra Deep Freeze and Shatter,
- Volcano Vent and final Cataclysm,
- Wasteland corpse selection / resurrection,
- Trench Wound / Undertow / Devour.

---

## E. Bot compatibility
Every mechanic must be usable in automated/bot playtests.

The planning agent should identify any bot-harness changes required for:

- new telegraph shapes,
- retreat/chase behavior,
- hazard choice,
- status threshold reactions,
- corpse/add handling,
- long final casts.

---

## F. Removal / migration
For each boss, identify obsolete mechanics that should be removed rather than left running invisibly underneath the new encounter.

Do not stack the redesign on top of stale mechanics.

---

# 16. Out of scope for the implementation-planning pass

Do **not** treat these as design questions to reopen:

- exact boss HP,
- exact attack values,
- exact cooldowns,
- exact shield percentages,
- exact Heat/Chill magnitudes,
- exact final-cast duration,
- exact retreat-speed stack values,
- exact add counts,
- exact anti-heal percentage,
- exact Devour healing percentage,
- exact DPS targets.

Those belong to later numerical balance and bot/manual playtest passes.

The planning agent may provide **placeholder values only when implementation requires them**.

---

# 17. Final design summary

The encounter roster should now read approximately as follows:

| Biome | Boss fantasy |
|---|---|
| Plains | Rally the herd; manage the swarm. |
| Forest | The beast repeatedly works itself into a visible escalating frenzy. |
| Mountain | Read and survive catastrophic committed impacts. |
| Swamp | Endure poison, rot, and hostile ground. |
| Cave | The crawler progressively tears through your defenses. |
| Desert | The scorpion controls and marks you, then cashes the setup out. |
| Jungle | The predator retreats; deny the escape or survive the stealth ambush. |
| Tundra | The cold suppresses you until the mammoth can Freeze and Shatter you. |
| Volcano | Ride dangerous Heat for power, choose when to cool, then win the final execute race. |
| Wasteland | The dead refuse to stay dead; manage corpses and resurrection. |
| Deep Sea Trench | The serpent wounds you, catches you, and tries to Devour you. |

The objective of implementation is **not** to make every boss equally complex.

The objective is for every boss to have a recognizable, readable, biome-specific pattern that:
- feels like the creature,
- can be solved through the game's existing automation/build systems,
- gives manual players room to optimize,
- and can later evolve naturally in future tiers.
