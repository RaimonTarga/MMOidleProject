# Idle MMO Rework — Handoff Brief

Oct 13, 2026 · Raimon Targa Olivé

> Copied into the repo on 2026-10-13 from the designer's handoff brief, so agent sessions can
> read it. The designer's text is unchanged down to "Workflow for agent sessions"; the
> addendum at the end records the calls the designer made in the first brainstorm the same
> day. The system audit against this brief is
> [rework-audit-2026-10-13.md](rework-audit-2026-10-13.md).

## Purpose

The idle MMO is being reworked from a class-agnostic, shared-system design into a class-first design where each class has its own mechanic, custom system, items and abilities. This brief captures decisions from a design conversation so a repo-aware agent can audit the codebase against them.

- **Code and existing docs are the source of truth for what exists.** This brief is the source of truth for intent.
- Items are marked **Decided** or **Tentative**. Tentative items are open to challenge; Decided items should not be re-litigated without new evidence.
- Nothing here authorizes code changes. See Workflow.

## Diagnosis

The current design produces samey builds and few exciting moments. Playtest drop-off was high, and players called loot, crafting and progression unexciting.

- **Class-agnostic items and abilities** must be balanced against every class, so nothing can be great anywhere. Classes lost identity, and everyone converges on the same strong abilities.
- **Full determinism in rewards** means the best build is always reachable, so it's solved. No "this feels busted" moments.
- **Linear power path:** strict one-slot-one-budget items leave no choice inside a slot; you take the bigger number.
- **Shared runic budget** (automation vs abilities vs stances) failed: automation is quality of life, abilities are power, so everyone took abilities.
- **Invisible numeric modifiers** (old zone modifiers, front-weighted DoT curve, attack-speed patches) go unnoticed or confuse players.
- **Conduit feedback:** summons scaled from weapon damage and felt like another class; players wanted formation, roles and customization.

What worked: mob families as zone modifiers with family-based loot, and the redesigned bosses. Concrete and readable beats numeric.

## Design principles

All Decided.

1. **Class-first.** Each class gets its own mechanic, one custom system, class-specific weapons, relics and abilities. No requirement that a node or item behave consistently across classes.
2. **Determinism where identity lives, randomness where excitement lives.** Combat and progression picks are deterministic. Loot is random, with agency to steer it.
3. **Concrete beats numeric.** Prefer mechanics players can see and plan around over hidden multipliers and stat patches.
4. **Automation must produce power.** Smart automation should enable outcomes (well-timed releases, counters, detonations), not just save clicks.
5. **Big decisions, not small math.** Pick-one-of-three nodes that change playstyle; no sprawling passive trees.
6. **Fewer, deeper classes.** Pay for per-class design budget by keeping the roster at the current six.

## Keep / scrap

| System | Verdict | Status | Notes |
| --- | --- | --- | --- |
| Deterministic combat | Keep | Decided | Fair losses; reliable bot balancing |
| Deterministic rewards | Scrap | Decided | Random drops, steered by targeted farming, crafting rerolls, pity |
| Mob families as zone modifiers + family loot | Keep | Decided | Extend: each family drops specific item bases |
| Redesigned bosses | Keep | Decided | Stage for Squire responses and Frost/Execute builds |
| One slot = one function = one budget | Rework | Decided | Keep slot identity; allow cross-budget tradeoffs |
| Core slot | Scrap | Decided | Existed to patch melee vs ranged; class kits now handle it |
| Relic slot | Keep | Decided | Class-specific; modifies the class mechanic |
| Runic shared budget (automation/abilities/stances) | Scrap | Decided | Replaced by per-class custom systems |
| Items with passive trees inside | Scrap | Decided | Felt uninspired; trees fixed the wrong layer |
| Shared ability system + class adapters | Scrap | Decided | Abilities become class-specific |
| Frame (light/medium/heavy) | Scrap | Decided | Replaced by class-specific Disciplines |
| Range node (melee/mid/far) | Scrap | Decided | Melee is a commitment, not a dial |
| Front-weighted DoT stack curve | Scrap | Tentative | Replaced by spread/detonate mechanics |
| Global mastery (raises upgrade cap) | Keep | Tentative | No longer feeds runic points |
| Bot-balancing pipeline | Keep | Decided | Target: under ~50% power spread between classes |
| Tiers 1–8 plan | Keep | Tentative | Current content stops at T4 (mid-game) |

## Progression

Progression alternates **branching picks** (identity) with **flat picks** (shared within a class, combine with any branch), so content grows by addition, not multiplication. Decided; exact node content Tentative.

1. **T1 Class.** Unchanged.
2. **T2 Discipline.** Class-specific three-way fork; the main playstyle choice. Replaces frame.
3. **T3 Flat pick.** Three options usable by every discipline of the class, playing differently in each (Striker example: finisher form Cleave / Execute / Shatter). Replaces range.
4. **T4 Mastery.** One of three, scoped to your discipline. The mid-game moment where the build comes online.

Per class through T4: 3 + 3 + 9 = 15 nodes.

T5–T8 follow the same rhythm: mostly flat picks, plus one more discipline-scoped capstone around T7–T8. **Branches never nest.** Each tier pick also unlocks or upgrades abilities.

## Items, loot, abilities

**Slots (Decided):** five, no new slots. Weapon and relic are class-specific. Armor, charm and boots are shared, with cross-budget tradeoffs (e.g. more damage, less defense).

**Item structure (Tentative):** base item + 1–2 random affixes. Rare/legendary items add a **rule-bender**: one line that changes a mechanic. These are the source of "busted" moments.

**Loot with agency (Decided):** mob families drop specific item bases (target farming); crafting rerolls an affix or upgrades; a pity currency guarantees a target eventually.

**Abilities (Decided):** come from progression, not loot. Each ability plugs into the class's custom system instead of a generic cooldown bar.

**Examples (Tentative):**

- Slinger, *Hand Cannon* (weapon): 6-round clip, heavy bullets. Legendary: last bullet deals bonus damage per bullet that hit this clip.
- Slinger, *Bandolier* (relic): each reload adds 2 marking rounds to the clip.
- Shared, *Glass Duster* (armor): more damage, less defense, faster reload.
- Apprentice, *Frostbrand Staff*: +1 max frost stack; shatter scales with stacks.
- Apprentice, *Plague Censer* (relic): spreading poison also spreads 50% of fire stacks.

**Known issue to fix:** DoT weapons were a trap because attack conversion made slow, hard-hitting weapons strictly better. Class-specific DoT weapons (stacks, tick speed, spread) resolve it.

## Class reworks

Each class owns one distinct custom system; no two should feel like "arrange your own sequence." Concepts are Tentative unless marked.

| Class (code name) | Core mechanic | Custom system | Disciplines |
| --- | --- | --- | --- |
| Striker (Cadence) | Hits build Momentum, which decays when not attacking; finisher spends it and grants a small shield/heal | **Order:** choose what each beat of the combo does (buff, debuff, setup, CC, finisher) | Flurry (frequent finishers, on-hit, packs) · Crescendo (uncapped stacks, release timing, bosses) · third TBD (mobile duelist) |
| Squire (Cooldown) | Builds Resolve from damage blocked/absorbed; retaliation slam spends it | **Response rules:** react to enemy actions (telegraph → guard; adds → taunt + slam; ally low → intercept) | Bulwark (pure tank, group anchor) · Juggernaut (armor/HP converts to damage) · Avenger (parry/counter telegraphs) |
| Apprentice (DOT) | Attack converts to element stacks | **Payoff rules:** where stacks go on death, when to detonate, what triggers spread | Poison (spreads on death, packs) · Fire (detonate for burst) · Frost (slow → freeze → shatter, bosses). Second element + reactions around T5–T6 |
| Spirit (Energy) | Energy is both damage resource and shield; spending lowers defense | **Thresholds:** rules by energy level and phase | Overflow (uncapped, buffs, accelerating decay) · Reservoir (big bank, execute threshold; shield-linked) · Tide (surge/ebb cycles) |
| Slinger (Reload) | Clip-based fire with its own fire rate; reload is stationary by default | **Loadout:** what goes in the clip, plus reload and last-bullet triggers | Gunslinger (small clip, fast reload, reload triggers) · Siege (big clip, marks detonate on reload) · Trickshot (last bullet, ricochet, pierce) |
| Conduit (Summoner) | Summons with roles, not weapon-scaled copies | **Formation:** position and role (tank, damage, support) | TBD; keep to three summon roles, bent by items and relics |

**Specific calls (Decided):**

- Brawler (counter on hit) moves out of Striker; countering belongs to Squire.
- Slinger: drop "2× attack speed at 65% attack." Fire rate is its own stat; the fast feel comes from animation and sound.
- Slinger: cut generic on-hit; bullet properties are its on-hit.
- Keep Crescendo purely offensive tempo so it doesn't blur with Reservoir.
- Melee survivability lives in class kits, not a core slot.

**Future classes (deferred until the six are stable):** Rogue (stealth engagements, smoke-bomb resets) and Wizard (cast times, two-state mana cycle; overlaps Spirit's Tide).

## Open questions

- [ ] Striker's third discipline (mobile duelist that marks a target?)
- [ ] Conduit disciplines and how formation is configured in an idle context
- [ ] Wizard vs Spirit's Tide: who owns the two-state cycle?
- [ ] Defenses and recovery per class (Spirit's shield and Squire's Resolve are set; the rest are open)
- [ ] How automation is configured in UI for each custom system
- [ ] Does global mastery stay, and what does it gate besides upgrade cap?
- [ ] What's salvageable from the item passive-tree code
- [ ] Where playtesters dropped off (systems or first minutes?)

## Workflow for agent sessions

1. **Audit, no code changes.** Read the repo and docs; inventory current systems; tag each keep / rework / scrap against this brief; flag conflicts between the brief and how things actually work.
2. **Design bible draft.** New doc, one section per system (classes, items, progression, abilities, loot). Lock sections one at a time. Archive old design docs; don't delete them.
3. **Slice plan.** Scope Conduit plus the minimum shared systems it needs; list concrete code changes.
4. **Build and test.** Implement the slice, bot-test balance, then put it in front of players who asked for the summoner.

**Rules:** no code edits until the relevant bible section is locked; one system per session to keep context clean.

---

## Addendum — the designer's calls in the first brainstorm (2026-10-13)

- **Slinger's loadout is clip types, not bullets (Decided).** You load a kind of clip
  (freezing, burning, slowing…); every bullet in it is the same. The last-bullet effect is an
  extra modifier on top. No per-bullet authoring. Striker keeps per-beat authoring of its
  Order, so the two stop colliding: Striker's sequence is short and authored; Slinger's
  clip is long (around 20 rounds) and uniform.
- **Smart loot (Decided).** No trading, now or planned. Each class only gets items that are
  relevant to it.
- **Crafting stays (Decided).** Keep the crafting economy; make the loot more interesting.
- **Conduit's weapon expresses the build (direction, Tentative).** It sets summon stats and
  how the summon budget is split between summon types, and buffs one kind of summon over
  another ("this buffs my tank minions: more HP and thorns"; "this makes my casters fire
  twice as fast"). Formation: the player picks which minions to field; minions have default
  behaviors.
- **Armor, charm and boots: per class or shared? (Open.)** The designer likes armor and
  charms expressing each class's defense and recovery, and is wary of the authoring load.
- **The audit comes first (Decided).**

### Second round (after the audit, same day)

- **Armor and charms: shared bases, class affixes (Decided).** For different classes they
  must do different things. Conduit example: its armor bases shift the weight between
  making the summons tankier and making the Conduit tankier ("who is tanking the damage,
  your summons or you?"), with synergies such as exploding minions whose HP buffs their
  blast, or Juggernaut-style tanky minions that scale off their HP.
- **Stances and rites are scrapped as shared systems (Decided).** Each class's custom
  system and abilities cover what they did; a class may still get stance-like modes or
  rite-like passives of its own, decided in its deep dive.
- **Automation may be free (leaning, Tentative).** The designer is considering making
  automation cost no resource at all: make your character as smart as you want. The
  custom system's budget is to be worked out per class.
- **Wipe all characters at the rework release (Decided).** It is a playtest; no save
  migration or translation.
- **Boss materials: later (Deferred).** Decide after the new item system; bosses should
  become more attractive to farm.
- **Conduit manual commands (leaning).** The Formation system probably replaces them; a
  recall button and a recall ability probably stay.
- **Relics: earlier in the game, redesigned per class (direction).** They modify the class
  system and mechanic instead of sharing one design across classes. Timing and shape are
  decided per class.
- **Next: one deep dive per class, Conduit first (Decided).**
