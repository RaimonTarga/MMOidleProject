# Map Variety: Node Modifiers, Dual Economy & Regions — Design (v4, direction locked)

**Status: DIRECTION LOCKED at the design level (2026-07-24).** v1 was a pre-decision brainstorm;
v2 locked its broad direction; v3 incorporated the second game-design review and Stage A Q&A;
v4 locks the post-Stage-A world-layout pass: exhaustive allowed biome × pace coverage, native
duplicates, curated density overlays, a single stitched sparse world, organic multi-edge
frontiers, void negative space, Clearing as the T1 respawn anchor, and append-only T5–T8
capacity. See §5 for the decision log. **Stage A implementation plan:
`docs/map-variety-implementation-plan.md`. Stage B implementation plan:
`docs/map-variety-regions-implementation-plan.md`. Stage A (node modifiers + catalyst re-key on
the existing 11×11 grid) SHIPPED 2026-07-24 (`feat/map-variety-stage-a`); Stage B shipped
2026-07-24 and was refined into the four-tier spiral during playtesting.** All balance numbers
remain PLACEHOLDER (user-owned tuning).

**Scope: game design only.** Numbers (modifier percentages, mint thresholds, costs) are
balance-pass territory, not fixed here.

**Touches (when implemented):**
- **Supersedes** part of the Step 2 Catalyst system as shipped
  (`docs/system-rework-status.md`, Step 2): catalysts re-key from per-biome-group to
  per-combat-family. This is a rework with hard consequences, not an addition — all existing
  biome-group catalyst costs (forest worked example, stances, rites, evolution reconstruct)
  must be re-authored or removed, and player catalyst wallets/progress are **wiped to zero**
  on migration (placeholder-era playtest earnings, not worth converting).
- **Resolves "Map traversal"**, currently `⏸️ unresolved` on `docs/system-rework-status.md`
  (stitched sparse world + organic traversable frontiers, §3).
- Interacts with the parked **essence drop-volume tension** watch item
  (`BIOME_ESSENCE_TIER_MULT` dampens late-game essence; this adds a second currency stream,
  changing the shape of that tension).

---

## 0. Problem statement

Tier = Chebyshev distance from the center clearing on an 11×11 grid. The map does have
geographic wedges (tundra north, jungle southeast, swamp west), but every node of a given
biome+tier is mechanically identical to every other — the map reads as "reskinned difficulty,"
not as a place with distinct locations worth remembering. Goal: give individual node instances
real personality without diluting each biome's core identity (design bible §3–4 already spend a
lot of care establishing that identity — this builds on it, not against it), and build a second
reward layer on top of that personality so exploring for a specific node "flavor" is worth doing.

Three pieces, one initiative: **node modifiers** (what makes a node distinct), **a second
currency axis** (what modifiers are worth), and **regions** (the geography that makes distinct
nodes findable and memorable).

---

## 1. Node modifiers

### 1.1 Slot rule — one pace modifier always, one density modifier sometimes

Every normal node carries **exactly one pace modifier, always present** — it is the node's
personality and its catalyst key. There is no unmodified/"vanilla" node and therefore no
catalyst-dead node. A **subset of nodes additionally carries one density modifier** (§1.6),
which has no catalyst key of its own and obeys the threat/reward budget in §1.6. So a node is
e.g. "Blight Forest" or "Blight Forest + Swarming", never bare "Forest" and never density-only.

Excluded from the system entirely: **Clearing** (T0 tutorial, one fixed node) and each region's
**Sanctuary** (special non-combat respawn anchor). These nodes carry no pace or density modifier,
grant no node-family catalyst, and do not count toward regional family supply. The former Void
Overlord throne placeholder is not part of this map and will be redesigned separately.

**Dungeon nodes carry NO modifier** *(revised 2026-07-24, Stage A implementation).* The
original design had dungeons carry a pace modifier like any node; playtest reversed this —
dungeons are static, hand-designed exams and must stay canonical, so they are excluded from
the modifier system entirely (no reshaping of trash/guardians/waves, no pace family). **The
boss entity was already immune.** Consequence: dungeon kills and the first-clear
`catalystBundle` grant **no** family catalyst (there is no node family to key them to) — a
`catalystBundle` on a boss def is currently inert. Revisit if dungeons should feed the catalyst
economy through some other key. Bosses remain one-per-biome exams (Step 13), not pace variants.

### 1.2 Five combat-pattern families — one player-facing vocabulary

These are the game's five **distinctive combat patterns**, not a 1:1 list of its five base
weapons. Rapier, Hammer, DoT-conversion, Chaotic Axe, and Ambush each express one clearly;
Broadsword is deliberately outside the taxonomy as the neutral generalist. Summoner is also not
a sixth node family: its minions can be built to interact with the same encounter patterns, but
the node — not the player's class — keys the reward.

The **family, node modifier, item tag, and catalyst use one player-facing name**. A player sees
an Alacrity node, earns Alacrity Catalyst, and spends it on an Alacrity-tagged item. Internal
type names may differ later if necessary, but the interface does not teach parallel
Speed/Rapier/Alacrity vocabularies.

| Family | Item/threat echo | Effect on the node |
|---|---|---|
| **Alacrity** | Rapid attacks and answers to frequent light hits | Monsters attack + move faster and deal lighter direct hits |
| **Brutality** | Slow heavy attacks and anti-spike defenses | Monsters hit harder and less often — bigger spikes, slower tempo |
| **Blight** | DoT offense and DoT defenses | Attacks gain DoT if absent; existing DoT is amplified; direct hits become lighter |
| **Volatility** | Chaotic Axe-style counted disruption and reliable general defenses | Deterministic-but-irregular damage patterns: skip-beats, cadence swings, and counted bursts |
| **Predation** | Ambush/alpha-strike offense and opening-burst survival | Much harder opening strikes / attacks against full-HP targets, with weaker follow-up |

**Plains owns a density matchup, not a sixth pace family.** Its existing item identity already
answers swarms through plating, kill-burst recovery, and nearby-enemy scaling. Offensive
swarm-oriented designs may use cleave, multi-target pressure, or on-kill chaining, but
**Swarming remains a density modifier and never becomes a catalyst family**. Broadsword stays
the neutral control weapon rather than being relabeled as Predation or forced into a swarm
family. A Plains item can still carry a pace tag when its own mechanic warrants one — plating,
for example, can be Alacrity-tagged because it answers frequent light hits — while a purely
density-oriented or generalist item can use the neutral rule in §2.3.

Pace modifiers may therefore **add a mechanic to monsters that did not already have it**.
Blight adds DoT to an otherwise direct-damage monster and amplifies DoT on a monster that
already has it; Predation can add an opening strike; Volatility can add a counted pattern.
They are not restricted to multiplying fields already present on the monster.

**Biome remains the primary read; modifier is the secondary read.** The biome owns the roster,
ecology, headline damage shape, and primary defensive answer. A foreign family may materially
change matchup efficiency, but it must not replace that headline. A Blight Mountain should
still primarily test survival against Mountain's heavy-hit identity, with DoT resistance as a
valuable secondary answer; it must not become Swamp combat wearing Mountain art. Exact budget
shares are balance-pass territory, but this priority is a design invariant.

### 1.3 Power rule — threat-budget-neutral, deliberately build-relative

A modifier **reshapes a fixed aggregate threat budget; it never grants free pressure.**
Alacrity's speed and pursuit are paid for by lighter hits, Brutality's spikes by lower
frequency, Blight's DoT by lighter direct damage, Predation's opener by weaker sustained
pressure, and Volatility's pattern by its average remaining on budget. The budget covers the
whole threat package — direct damage, DoT, cadence, opening burst, and combat-relevant movement
pressure — not average DPS alone.

Threat-budget-neutral does **not** mean equally difficult for every build. Plating, damage caps,
evasion, DoT resistance, recovery, AoE, single-target damage, and kiting respond nonlinearly to
different shapes. That build-relative difficulty is the point: node choice is matchmaking
between build and threat. The neutrality rule instead means that no family should become the
universal easy mode or universal hard mode across a representative spread of viable builds, and
every node remains farmable unattended by an appropriate at-tier build. The tier's overall stat
envelope survives; the effective eHP/H and throughput matchup is intentionally allowed to move.

**Determinism:** *Volatility* must be implemented as deterministic patterns (Chaotic-Axe-style
counted beats), never rolls. Core invariant #1 applies to monsters too.

Modifier **strength scales with node tier**, mirroring the T1-pure → T4-capstone deepening
pattern (design bible §3): sharper reshaping at higher tiers, same curve shape, still
threat-budget-neutral at every tier. T1 introduces all five families at their gentlest,
clearest expression — one readable reshaping rather than a compound rules package — so the
first region teaches the vocabulary without competing with starter-biome onboarding.

### 1.4 Assignment — static, hand-authored

Modifiers are **authored per node, permanently**, exactly like biomes are. No rotation, no
generation. This maximizes the "distinct locations worth remembering" goal and keeps unattended
farming predictable; variety over time comes from the player progressing into new regions, not
from the map shuffling under them. (The parked World-events system remains a possible *future*
lever for temporary overrides — noted, not designed.)

Both the pace family and optional density modifier are **visible on the map before travel**.
The map communicates the family name, its threat summary, the catalyst it grants, and the
density label; visiting a node is not required to discover information needed for deliberate
farming. Exact percentages may stay behind a detail view, but the qualitative matchup is never
hidden.

### 1.5 Compatibility policy — allowed unless hard-banned

**v1's narrow policy (1 native family per biome, rest excluded) is rejected.** Review showed it
collapsed both goals: every Forest node would be Alacrity (no within-biome variety), and the
native families correlate closely with essence colors (blue↔Brutality, green↔Alacrity), making
the new currency a relabeled essence — the exact "two currencies asking the same question"
failure this proposal exists to fix.

**Locked policy:** any pace family may appear in a biome unless it fails either part of the
contradiction test:

1. it pushes the biome toward the opposite end of its established pace without creating a
   coherent new read; or
2. it cannot be tuned as a secondary layer without erasing the biome's headline threat,
   defensive answer, roster roles, or authored ecology.

Compatible foreign families are authored minority spice. Density modifiers are banned where
the biome already sits at that density extreme or where the inversion cannot preserve the
biome's core ecology.

| Biome | Native (most common) | Hard-banned pace | Density notes |
|---|---|---|---|
| **Plains** | none — authored as evenly as feasible across all five (Broadsword has no pace to protect; the proving ground for players *and* modifiers) | none | Swarming ✅, Elite Ground ✅ |
| **Forest** | Alacrity | Brutality | Swarming ✅ reinforces; Elite Ground ✅ mild inversion |
| **Mountain** | Brutality | Alacrity | Swarming ✅ fun inversion; Elite Ground ✖ redundant |
| **Swamp** | Blight | none | both ✅ |
| **Cave** | Volatility | none | Swarming ✅ (reweight toward small/fast entries); Elite Ground ✖ redundant — Cave *is* the elite biome |
| **Jungle** | Alacrity | Brutality | both ✅ — foreign families now flow naturally from the policy, matching "hybridizing IS its identity" (v1 §4.4 resolved by the policy itself) |
| **Desert** | Predation | Alacrity (fights the standoff pacing) | Swarming ✅ inversion; Elite Ground ✖ redundant |
| **Tundra** | Brutality | Alacrity | both ✅ — Blight nodes especially apt (hit-to-dot armor is already DoT-adjacent; v1 §4.5 resolved) |
| **Volcanic** | Blight | none | Swarming ✅ (high, not extreme); Elite Ground ✅ inversion |
| **Wasteland** *(code key `graveyard`)* | Blight (Plague/contagion) | none | Swarming ✖ redundant (base biome is the extreme swarm); **Elite Ground ✅ authored** — "the horde falls silent, something bigger walks"; may need 1–2 elite-weighted roster entries on a later mob pass (v1 §4.7 resolved: yes) |
| **Trench** *(parked — see §6)* | Predation (Execute is already its homed variant) | none | Swarming = flagship inversion; Elite Ground ✖ redundant |

**Native distribution rule:**

- Every compatible pace family appears exactly once in each active biome-region cluster.
- The native family appears exactly one additional time in that cluster, making it strictly
  most frequent locally and globally. Plains is the exception because it has no native family.

**Regional supply rule (replaces v1's supply worry):** every region collectively contains each
of the five families on at least one **normal, repeatable, progression-accessible node**.
Dungeon nodes do not count toward this guarantee. Biome hard bans still apply: a region may
supply Alacrity through Forest or another compatible biome, never through a hard-banned
Mountain assignment. Exhaustive per-biome coverage now satisfies this rule by construction.

### 1.6 Density modifiers — optional second slot, threat/reward-budgeted

> **Current implementation status (2026-07-24): dormant.** Swarming and Elite
> Ground are retained as design vocabulary and dormant helper code, but
> `DENSITY_MODIFIERS_ENABLED = false` prevents authoring/projection and every
> population, spawn-pool, reward, and UI effect. The remainder of this section is
> preserved as the shelved proposal to revisit, not current gameplay behavior.

- **Swarming** — non-elite spawn count way up, pool biased away from elites.
- **Elite Ground** — spawn count down, pool biased toward the biome's toughest entries.

Not a sixth pace family: pace describes *how* a mob fights, density describes *how many and how
tough*. Density grants no catalyst family or explicit catalyst bonus and changes no catalyst
key — the node's pace family keys rewards regardless (§1.1).

Normal, Swarming, and Elite Ground nodes target **comparable aggregate threat and reward
throughput for a neutral reference build**. Increasing body count does not create free total
essence, biome XP, or catalyst progress; reducing body count does not make a node an economic
trap. Population composition, per-monster reward weight, and replacement pace are balanced as
one package. Kill-count objectives and on-kill effects naturally care about body count and are
part of the Swarming matchup rather than a separate currency bonus; they must be included when
checking that Swarming does not become universally optimal.

Actual player throughput is intentionally build-relative: AoE/cleave/on-kill builds should
outperform their own baseline in Swarming nodes, while single-target/burst builds should
outperform theirs in Elite Ground. No density modifier should be the universal best farm across
representative builds. Density reweights the biome's authored roster and ecology; it does not
discard its signature packs, patrols, swarm behavior, elite roles, or bespoke encounter
composition.

---

## 2. Dual currency economy

### 2.1 Unchanged — essence

The 5 aspect essences stay exactly as shipped (`red/blue/green/yellow/purple`, display names
Deep/Stone/Wild/Might/Rot, biome-themed via `BIOME_PRIMARY_ESSENCE` and per-monster
`essenceType`). Because individual mobs can carry thematic off-types, this axis primarily
answers **"which place / biome lineage produced this fight"** at the population level, not as an
absolute one-color-per-node rule.

### 2.2 Re-keyed — catalyst per combat family

Catalyst re-keys from per-biome-group (~10 wallets mirroring essence) to the **five combat
families** — a wallet per *shape*, not per place. That axis answers **"what kind of fight was
this,"** which essence cannot express. Under the allowed-unless-banned policy (§1.5), the two
axes are genuinely independent: farming Blight Catalyst means seeking Blight nodes across
Swamp, Tundra, Volcanic, Wasteland… not just one biome wearing a different label. Net: **5
essences + 5 catalysts = 10 currencies**.

Mechanics:
- **Feel unchanged:** progress per kill, batch-mint at `CATALYST_PROGRESS_PER_UNIT`, remainder
  carries. Reuses the shipped wallet/grant/mint machinery; only the key changes (the grant
  choke point is single: `grantCatalystProgress` in
  `server/src/systems/player/progression/rewards.ts`).
- **The node's pace family determines which catalyst every kill grants.** All kills in an
  Alacrity node grant Alacrity Catalyst regardless of biome.
- **Density modifiers have no key or explicit bonus.** Their total reward budget follows §1.6.
- **Dungeon nodes:** grant no family catalyst from trash or first-clear bundles because dungeon
  nodes have no pace family (§1.1). A `catalystBundle` authored on a dungeon boss is inert until
  a future dungeon-specific catalyst policy is designed.
- **Current-tier farming normally wins.** Wallets are tier-flat, so an older region remains a
  safe fallback, but a player capable of farming their current tier should ordinarily earn
  family catalyst progress faster there. Exact weights are balance-pass territory; preventing
  obsolete T1 content from becoming the permanent optimal catalyst farm is the design rule.

### 2.3 Sinks — premium tier gates

Essence stays the **universal base cost** on everything it costs today. Family catalyst is a
**second cost axis on meaningful milestones only**: tier-up crafts, capstone items, stances,
rites, evolutions/reconstructs, and upgrade finishers. Players may earn catalyst progress in
T1, but ordinary early base crafts are not blocked by it; "essence-simple" means the early
progression path is not catalyst-gated, not that the currency is hidden or cannot accrue.

Every catalyst-bearing item or unlock receives one or more **combat-family tags based on what
it expresses**, not automatically on its biome:

- Offensive items use the family of the pressure they produce: a rapid weapon is Alacrity, a
  slow heavy weapon is Brutality, a DoT weapon is Blight, and so on.
- Defensive and recovery items use the family of the threat they answer: anti-rapid-hit
  defenses can be Alacrity, anti-spike defenses Brutality, DoT answers Blight, opening-burst
  survival Predation, etc.
- Stances, rites, abilities, evolutions, and other milestones use the family of the combat
  behavior they grant or deepen.
- A genuinely hybrid design may carry multiple family tags and split its catalyst cost across
  them. Its biome essence remains the place/lineage axis.

This means a Forest item is not automatically Alacrity merely because Forest's native node
family is Alacrity. The item earns that tag only if its own combat design expresses or answers
Alacrity. This prevents the demand side from collapsing back into a relabeled biome currency.

**Neutral/generalist exception:** Broadsword remains the cheap, below-ceiling universal floor
and has no family tag. When a meaningful Broadsword milestone needs catalyst gating, its total
catalyst requirement is **flexible**: the player may pay the required total using any
combination of the five family catalysts. It does not gain a sixth "Swarming" family, require
all five separately, or bypass catalyst milestones entirely. Other truly family-neutral
milestones may use the same generalist rule sparingly.

The existing shipped sinks (forest worked example, stance/rite catalyst costs,
`reconstructCatalystCost`) are re-authored from their actual combat-family tags as part of the
mandatory re-key, not copied mechanically from biome keys and not removed. Full cutover
(catalyst on every recipe) and new-content-only were both rejected: the former over-gates T1,
the latter recreates today's bolted-on catalyst.

### 2.4 Migration

Player `catalysts` / `catalystProgress` wallets (biome-group-keyed JSON) are **wiped to zero**.
Amounts were earned under placeholder weights during playtest; a clean start matches the
currency's new meaning.

---

## 3. Regions (replaces the ring-tier grid)

- Full replacement of "tier = Chebyshev distance" with **one logical region per tier embedded in
  a single stitched world**. Regions are progression metadata and content territories, not
  separate maps, square panels, islands, or visibly outlined game-system boxes. Each region
  contains whichever biome groups have authored monster pools at that tier; a retired biome
  simply has no node in later regions.
- The world remains a **cardinal grid under the hood**, but it is sparse. Only occupied cells are
  nodes. Missing cells expose the shattered-world **void** as map negative space: irregular
  coastlines, cracks, bays, and occasional interior holes without fake untraversable sea or
  mountain nodes. Void cells have no node id, tooltip, pathfinding entry, telemetry, collision,
  or gameplay semantics.
- Regions form a **clockwise spiral/ring**: T1 northwest, T2 northeast, T3 southeast, and T4
  southwest. They meet through organic traversable frontiers with multiple ordinary cardinal
  adjacencies. There are no boundary gates and no drawn tier borders. The intended frontiers are
  T1↔T2, T2↔T3, T3↔T4, and T4↔T1; each has at least two cross-region edges. T1↔T3 and T2↔T4
  may not touch. The T4↔T1 frontier intentionally permits unprepared players to enter dangerous
  territory and makes late-game backtracking fast.
- **Coverage is exhaustive by active biome and pace family.** For every active biome in a
  region, at least one normal repeatable node exists for every pace family not hard-banned for
  that biome. Every biome with a native family receives one additional native-family node in
  that region so its native family remains strictly most frequent; Plains receives no duplicate.
  This stronger rule supersedes the old 2–3-node granularity and automatically guarantees all
  five catalyst families in every region.
- **Density overlays are currently dormant.** The authored world contains the exhaustive pace
  layout only. The previous curated Swarming/Elite Ground assignment algorithm is retained
  behind a disabled feature flag for a future redesign and creates no current map metadata or
  gameplay effect.
- **One modifier-free dungeon per active biome per region** remains additional to normal-node
  coverage. Dungeons are canonical static exams (§1.1); if the expanded farming world leaves
  them too weak, they receive a later direct dungeon balance pass rather than node modifiers.
  Dungeon nodes sit on regional edges and corner-like cells, away from Clearing or the region's
  sanctuary, directly touch their matching biome territory, and never act as required transit
  nodes. Biome territories grow from those dungeon anchors as compact irregular clusters rather
  than row-aligned strips.
- **Topology:** the whole occupied world and every region must be connected, with useful loops,
  short branches, multiple routes between major biome clusters, and no forced visit to every
  node. The broad compass grammar remains stable across the stitched world—cold biomes trend
  north, jungle east, swamp/wet west—but does not override organic shape or connectivity.
- **Respawn anchors:** Clearing remains the T0 tutorial combat node (Tiny Wisps, First Blood,
  starter recipes, rune altar) and also serves as T1's respawn anchor; T1 has no additional
  sanctuary. T2–T4 each add one true non-combat sanctuary node. Dying in a region returns the
  player to that region's anchor. `respawnAnchor` is region metadata, separate from node kind,
  so Clearing need not pretend to be an empty sanctuary.
- **Scale for implemented content:** exhaustive pace coverage produces 140 normal nodes after
  native duplicates: T1 27, T2 37, T3 38, T4 38. Add 26 modifier-free dungeons, three T2–T4
  sanctuaries, and Clearing for **170 authored gameplay nodes**.
- **Future T5–T8:** no empty nodes or layouts are authored now because their biome rosters are
  not locked. World coordinates, bounds, rendering, navigation, validation, and region metadata
  must be append-only and dynamically derived so later regions extend the stitched canvas
  without relocating or redesigning T1–T4.
- **Map information contract:** before travel, every real node exposes its region/tier, biome,
  pace family and catalyst, and dungeon/unique/sanctuary status. The
  map becomes a drag-pan, wheel/pinch-zoom canvas with selectable nodes, path highlighting,
  search/filter support, recenter controls, and a fit-to-world overview. Region and node names
  are editable placeholders for playtest-driven renaming; no large naming pass is required now.

---

## 4. Review-sourced rules folded in (summary)

For implementers/reviewers, the locked rules in one place:

1. Compatibility is **allowed unless the combination contradicts pace or erases biome identity**
   (§1.5).
2. Active slot rule: **one pace family on every normal node** (§1.1); the optional density slot
   is dormant pending redesign.
3. Assignment is **static, hand-authored, and visible before travel** (§1.4).
4. Pace is **aggregate-threat-budget-neutral but deliberately build-relative**; Volatility is
   deterministic (§1.3).
5. Density has a **comparable neutral-build threat/reward baseline**, with AoE vs. single-target
   matchup advantages (§1.6).
6. Dungeons are **modifier-free static exams** and grant no family catalyst (§1.1, §2.2).
7. Sinks: **premium tier gates keyed by the item's own combat-family tags**; neutral Broadsword
   uses flexible any-family payment (§2.3). Existing sinks are re-authored, and wallets are wiped
   (§2.4).
8. Regions form **one stitched sparse world** with void negative space, exhaustive allowed
   biome × pace coverage, native duplicates, multiple traversable
   frontiers, stable compass grammar, and one dungeon per active biome (§3).
9. Native family appears in every regional biome cluster and is most frequent for that biome
   globally, not necessarily locally (§1.5).
10. Current-tier catalyst farming normally beats obsolete tiers (§2.2).
11. Wasteland Elite Ground is **authored** (§1.5 table).
12. Graveyard is referred to as **Wasteland** (display); code key remains `graveyard`.

## 5. Decision log (v1 questions + v2 review → resolutions, 2026-07-24)

| Source | Question | Resolution |
|---|---|---|
| 4.1 / v4 | Region granularity | Every allowed biome × pace combination, plus one native duplicate; dungeon is additional |
| 4.2 / v4 | Inter-region travel | Multiple ordinary traversable frontier edges in one stitched world; no boundary gates |
| 4.3 | Catalyst retrofit scope | Premium tier gates; existing sinks re-keyed, not removed |
| 4.4 | Jungle second family | Subsumed — allowed-unless-banned gives Jungle its hybrid spread naturally |
| 4.5 | Tundra Blight secondary | Subsumed — allowed by policy; flagged as especially apt |
| 4.6 | Trench | Still parked (see §6) |
| 4.7 | Wasteland Elite Ground | Author it |
| — | Pace policy (implicit in v1 §1.3) | Allowed unless hard-banned |
| — | Slots per node (ambiguous in v1 §1) | One pace always + optional density |
| — | Static vs rotating (absent from v1) | Static, hand-authored |
| — | Modifier power budget (absent from v1) | Aggregate-threat-budget-neutral; difficulty intentionally varies by build |
| — | Wallet migration (absent from v1) | Wipe to zero |
| v2 review | Density economy | Comparable threat/reward baseline for a neutral build; matched AoE/ST builds earn the advantage |
| v2 review | Foreign modifier mechanics | May add mechanics to mobs, but biome remains the primary combat read |
| v2 review | Family vocabulary | Alacrity / Brutality / Blight / Volatility / Predation used for node, tag, and catalyst |
| v2 review | Weapon taxonomy | Families are distinctive combat patterns, not the five base weapons; Broadsword is neutral |
| v2 review | Catalyst sink key | The item's/unlock's own combat-family tag(s), never its biome automatically |
| v2 review | Neutral Broadsword catalyst | Flexible total payable with any combination of the five catalysts |
| v2 review | Regional family supply | All five on normal repeatable nodes; dungeons do not count; biome bans still apply |
| v2 review | Map visibility | Pace, density, catalyst, biome, tier/region, and dungeon status visible before travel |
| v2 review | Native frequency | At least one native normal node per regional appearance; native most frequent globally |
| v2 review | Tier-flat wallet exploit | A capable player normally earns catalysts faster in current-tier content |
| v4 Q&A | Density coverage | Swarming once per legal biome-tier; Elite Ground once only with a legal authored elite pool; no Cartesian product |
| v4 Q&A | World silhouette | One global sparse cardinal grid; absent cells render as void negative space, never fake blocked nodes |
| v4 Q&A | T1 sanctuary | Clearing stays the combat tutorial and serves as T1 respawn anchor; true empty sanctuaries begin at T2 |
| v4 Q&A | Future tiers | Make the system append-only for T5–T8, but author no placeholder late-tier layouts now |
| v4 Q&A | Map UX | Replace placeholder tile viewport with drag-pan/zoom stitched-world navigation |
| v4 Q&A | Naming | Use editable placeholder region/node/landmark names; user renames through playtesting |

## 6. Remaining open / parked

- **Trench** stays "under review — may be cut/reshaped" per the design bible, decided outside
  this doc. Its table row is provisional. Note: under the loosened policy, Predation Catalyst no
  longer depends on Trench existing (any biome can host Predation nodes), so cutting Trench
  later costs this design nothing.
- **Exact numbers** — modifier reshape percentages, mint thresholds, which specific recipes get
  catalyst costs, and the current-tier earning curve — balance
  pass (`docs/system-rework-status.md` Step 15).
- **Density redesign** — decide whether Swarming/Elite Ground should return and, if so, replace
  their former population/pool/reward implementation before re-enabling the retained system.
- **Per-item family tagging** — the actual tag assignment and hybrid splits for every premium
  sink — content-authoring pass governed by §2.3.
- **Final region names and landmark identities** — Stage B ships editable placeholders; the
  user replaces them during playtesting. Exact node coordinates are a Stage B authoring task.
- **Sanctuary beyond respawn** — town, fast travel, NPCs: parked.
- **Implementation plans** — `docs/map-variety-implementation-plan.md` is the executed Stage A
  record. `docs/map-variety-regions-implementation-plan.md` is the dedicated Stage B plan.
  **Stage A and Stage B SHIPPED 2026-07-24.**

## 7. Implementation-planning decisions (pre-made, 2026-07-24)

Resolved ahead of the implementation plan so it can be written against them:

- **Staging: modifiers first, regions second.** Stage A ships pace/density modifiers, monster
  reshaping, the catalyst re-key, and the map information contract **on the existing 11×11
  grid** (per-node assignment table authored against current node IDs — small, acknowledged
  throwaway; the systems are not). Stage B replaces the grid with regions. Each stage is
  independently playtestable.
- **Map data model: one global sparse grid.** Real nodes occupy authored global row/column
  coordinates; absent cells are void negative space. Region membership is node metadata, not a
  separate map. Bounds, exits, pathing, player map, analytics, and ops views derive from the
  authored sparse table rather than 11×11 constants or node-id parsing.
- **Migration tolerance: keep characters, reset map-keyed state.** Levels, gear, skills, runes,
  essence, biome XP, bestiary, boss first-clears survive. Positions reset to the
  Clearing; node-keyed oddments reset rather than remap. The catalyst wipe already shipped in
  Stage A and is not repeated.
- **Visuals: map UI only in v1.** The §1.4/§3 information contract ships as map labels/icons +
  an in-node indicator. In-world modifier treatment (palettes, decor) is a later art pass
  through the PixelLab pipeline.

Working assumptions the implementation plan will adopt unless overridden:

- **Clearing** remains the T0 combat tutorial and is T1's respawn anchor.
- **Void Overlord throne** is omitted; its placeholder map node was removed pending redesign.
- **One dungeon per biome per region**, matching today's one-dungeon-per-biome-per-tier.
- **T2–T4 each have one empty sanctuary; T1 has no additional sanctuary.**
- **All allowed biome × pace combinations are present per active biome-tier**, plus a native
  duplicate where applicable; density overlays follow §3's curated coverage rule.
