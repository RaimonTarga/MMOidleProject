# Lineage Trees — Current State

**Audited:** 2026-10-01 (progression rework run 3, after Phases 1–2 and the overnight/
day-run slices of Phases 3–5 — keystones, T3/T4 bands, defensive lineages, ability nodes,
re-homed forms, T2 amplifiers, band collapse). Supersedes the weapon-only version of this
page from Phase 1.

**Design authority:** [`design_docs/progression-rework-design.md`](../design_docs/progression-rework-design.md)
§2–9, §18, §19. **History:** [`archive/progression-rework-plan.md`](archive/progression-rework-plan.md)
§1–§5 and their progress notes are the detailed build log, including every divergence from
the original sketch; read the code where this page and that history disagree.

A gear slot no longer holds an item with a `+N` ladder — it holds a **lineage**: a small
tree of permanent card purchases plus a chain of "forms" (the actual equipped item, still
an ordinary `RECIPE_DATABASE`/`ITEM_DATABASE` entry). This now covers **all four gear
slots**, not just weapons: the weapon slot moved first (Phase 1/2), the other three
(armor, recovery/charm, mobility/boots) got their own lineages in Phase 4. Non-weapon
slots still also run the old `+N` ladder in parallel — see §9.

## 1. The vocabulary (`shared/src/data/lineages/types.ts`)

- **Packet** (`PacketId`): one of eight lanes. Six are weapon-eligible (`tempo`,
  `empowered`, `affliction`, `control`, `kill-chain`, `engagement`); two are
  defensive-only (`bulwark`, `barrier-tempo`). A lineage carries exactly three packets as
  its lanes. Each packet names the stat it scales, what fires it, what it pays out, and
  what it is weak against — `shared/src/data/lineages/packets.ts`.
- **Card** (`LineageCard`): one tree node. Authored with **no numbers at all** — tier,
  row, lane, trigger/payoff kind, and (for amplifier/keystone/cross rows) which card it
  `modifies` or which lane it `borrowsLane` from. `resolveLineageCard` (`resolve.ts`) is
  the only place a number is attached, from the per-tier scalar table in
  `magnitudes.ts`. `coverage.test.ts` scans every authored card source to keep this true.
- **Row** (`RowKind`): `stat` → `payoff` → `amplifier` → `keystone` → `cross`, one band
  per tier (T1 asks stat/payoff, T2 adds amplifier, T3 adds keystone, T4 adds cross). A
  row is a **choice**, not a shopping list — `LineageProgress.active` holds one active
  card per owned row, across the whole tree (not per band — see §3).
- **Form** (`LineageForm`): the actual wearable item, keyed by an ordinary recipe id.
  Tier-1 forms are crafted normally (Make tab, no gate). Tier ≥2 forms are bought at the
  tier-below's **gate**: essence, the shard of the lane the new form crowns, and the home
  biome boss's capstone material — "the boss is the only way up."
- **Capstone** (`LineageCapstone`): the verb a worn form adds, granted for free the moment
  you wear it. A capstone crowns one lane; every lane is now crowned by some form
  (`UNCROWNED_LANES` in `coverage.test.ts` is empty — the Phase 1 gap on `engagement` was
  closed by the defensive lineages in Phase 4).
- **Face** (`DefensiveFace`): derived, never authored, via `packetDefaultFace(lane)` —
  Avoid (Engagement, Tempo, Control), Sustain (Kill chain, Barrier tempo, Affliction),
  Endure (Bulwark, Empowered). A defensive card pays full on the matching player frame and
  `OFF_FACE_SCALAR` off it (a bias, never a lock); weapon cards carry no face and are
  frame-neutral.

## 2. The twenty lineages

`shared/src/data/lineages/index.ts` registers twenty: five weapon, fifteen defensive
(five per non-weapon slot, one per T1 biome each).

| Slot | Plains | Forest | Mountain | Cave | Swamp |
|---|---|---|---|---|---|
| weapon | `broadsword` | `rapier` | `hammer` | `axe` | `dagger` |
| armor | `robe` | `bindings` | `plate` | `hide` | `wrappings` |
| recovery/charm | `stone` | `heartroot` | `barrier` | `pulse` | `eye` |
| mobility/boots | `fleet` | `wraps` | `treads` | `wing` | `marsh` |

The five weapon lineages carry a T1 base form (crafted) plus T2/T3/T4 gated forms along
the existing `evolvesFrom` graph (e.g. Rapier: `flash-rapier` T1 → `gale-needle` /
`jungle-stinger-rapier` T2 → `jungle-venomthorn-rapier` T3 → `jungle-deathfang-rapier`
T4). **Every weapon and every non-weapon item with an `evolvesFrom` chain is reachable
now** — `server/test/weaponReachability.test.ts`'s `KNOWN_UNREACHABLE` allowlist and
`server/test/itemReachability.test.ts`'s sibling allowlist are both **empty**. (This
closes the Phase 2b gap this page used to carry: T3/T4 weapons were unreachable until
design §18.5's T3/T4 form authoring and the Phase 5 re-homing table landed — see §6.)

All fifteen non-weapon lineages, and all PROVISIONAL assignments inside them, are flagged
in their own file headers — design §17 (the non-weapon lane matrices) is itself marked
"proposed, not approved" and the defensive-lineage authoring pass (Phase 4) built from it
as given, so none of the fifteen is final. The five weapon lineages' T1 lane matrix
(design §3.2) is locked; everything above T1 (the keystones, cross cards, re-homed forms)
inherits that lock.

## 3. Bands and rows (design §4)

One band per tier; each tier adds exactly one row, and the screen never gets wider.

| Tier | Rows | The question |
|---|---|---|
| T1 | Stat, Payoff | which lane? |
| T2 | + Amplifier | how does it fire? |
| T3 | + Keystone | what does it become? (a rule change) |
| T4 | + Cross | what do I borrow? |

Non-weapon lineages author no `stat` row (base stats come from the form); `rowsForTier`
derives which rows a panel shows from which cards actually exist for that tier, so a
transitional state (e.g. a tier whose amplifier cards aren't authored yet) never promises
a row with nothing behind it.

**Band collapse and stat absorption (Phase 5).** Paying a gate to a tier-N+1 form folds
the tier-N **stat** row's resolved value into the new form's base stats — derived at
recalc from the WORN form, not mutated at the gate, so it is reversible by wearing the old
form back and needs no save migration. Only one stat card absorbs per collapsed band (the
lane of the player's current stat row, else lineage lane order); the absorbed card stays
buyable (to change which lane absorbs) but is no longer selectable
(`checkSetActive` refuses it). The collapsed band renders as one summary line
("T1: Keen Edge, Rend"), expandable to reslot the payoff row underneath it, which stays
buyable and selectable. The panel always shows one lit band and a dashed "Nothing beyond
this band yet" placeholder where the next tier's cards don't exist yet.

## 4. Keystones (design §4, amended 2026-10-01)

**One keystone per packet, eight in all, shared by every lineage that carries the lane in
any slot** — not one per lane per slot. The T3 `keystone` row's card IS the keystone; its
name/description/fx are the lineage's own flavour of the shared rule.

| Packet | Keystone | Rule | Runtime seam |
|---|---|---|---|
| Tempo | Chain | the echo keeps re-triggering until a miss or no fresh target | the `echo-hit` payoff case in `applyOnTarget`, link by link |
| Empowered | Shockwave | the mechanic's hit becomes an area hit | an `onHit` listener on `empoweredAttack`, paid through `applyPlayerAoe` |
| Affliction | Festering | stacks don't decay while you keep hitting | a per-hit window that re-adds `dt` before decay runs, each tick |
| Control | Ladder | slow → root → stun on hit, once per step per target | an `onHit` listener climbing `applyMonsterRoot` then `applyStun`, latched per target |
| Kill chain | Refund | a kill readies the mechanic (cadence counter, cooldown recharge, reload, energy to cap, next dot hit at max stacks) | an `onKill` listener writing each root's own readiness state |
| Engagement | Always First | every new target's first hit counts as the mechanic firing | an `onHit` listener calling `emitMechanicFired`, latched per body |
| Bulwark | Immovable | stationary DR and plating stacks persist 2 s after moving; no displacement while either is live | predicates asked by stationary-DR, reactive-plating, and the forced-movement/drag seams |
| Barrier tempo | Unbroken | barrier keeps recharging through hits above 50% HP | a refusal inside the one shared barrier-damage entry point |

**Shape.** Identity (lane, name, rule text, fx key, payoff kind) is data in
`KEYSTONE_DEFINITIONS` (`shared/src/data/lineages/keystones.ts`), keyed by `PacketId`.
Behaviour is one small module per lane under `server/src/systems/combat/keystones/`,
declared via `defineKeystone` and collected in `KEYSTONE_MODULES`.
`registerKeystones()` runs from `registerLineageCards()`, so the live server and the bench
see one set. `keystoneActive(player, lane)` reads the same resolved-card cache every other
row reads — owned, active and worn by construction.

A keystone row does **not** fire as a payoff (`firingsFor` skips `row === 'keystone'`);
the authored trigger/payoff pair still supplies the rule's **share** via
`keystoneShare` (the tier column and the defensive frame-face bias apply exactly as to a
payoff row), so the magnitude table is never bypassed and a keystone card is never paid
twice. Six new authored units in `LINEAGE_UNITS` back the five rules with no magnitude of
their own (`chainMaxLinks` 4, `shockwaveRadius` 90, `ladderRootMs` 1500, `ladderStunMs`
750, `immovableGraceMs` 2000, `unbrokenHpFraction` 0.5) — no constants live in the runtime
modules (design §18.4).

Tests: `server/test/keystones.test.ts` (one block per keystone plus its bound, a registry
block, a no-double-fire block, a per-player ownership block).

## 5. T3 keystone cards and T4 cross cards

All twenty lineages author one keystone card per lane at T3 and one **cross** card per
lane at T4 (`row: 'cross'`), each `borrowsLane` a derangement of the lineage's other two
lanes — three cards per lineage, never a fixed point, never two cards naming the same
borrowed lane. A cross card is a second lane's payoff at reduced strength
(`ROW_SCALAR.cross` = 0.5; `ROW_SCALAR.keystone` = 1.2); both resolve through the same
generic `resolveLineageCard`/`cardScalar` path as every other row, so authoring them added
zero runtime code. A cross card's `fx` draws its **own** lane's established visual, not
the borrowed lane's — lane grammar belongs to the slot the card sits in (design §8), not
to the mechanic it borrows.

All 54 T3 class skill-tree paths (`t3CombatA/B.ts`, `t3Summoner.ts`) carry a PROVISIONAL
`packet: PacketId` tag, chosen from each path's description, for design §4's keystone
handoff ("the item keystone and the class path name the same lane"). Coverage: every
weapon-eligible packet has at least one tagged path (tempo 15, empowered 20, affliction
13, control 2, kill-chain 1, engagement 3); `bulwark`/`barrier-tempo` have none by design
(no class attack path should name a defensive-only lane). The T3 class paths themselves
are reviewed as a whole after the rework — these tags are a label on existing paths, not
a rewrite of them, and two T3 paths (Pyromancer, Warmonger) currently overlap their root's
new frame loop; see [`frames-current-state.md`](frames-current-state.md) §3.

## 6. Re-homed forms

Fourteen later-biome debut weapons/armor/charms/boots that would otherwise dead-end are
re-homed as second (or third) gated doors on an existing lineage, each adding one
`LineageForm` plus one capstone, approved in the day-run's re-homing table:

| Root recipe | Lineage | Tier | Door biome |
|---|---|---|---|
| `desert-sunsteel-cross` | broadsword | 2 | desert |
| `tundra-permafrost-maul` | hammer | 3 | tundra |
| `tundra-rimebrand` | dagger | 3 | tundra |
| Jungle vest (T2) | bindings (forest armor) | 2 | jungle |
| Desert vest (T2) | robe (plains armor) | 2 | desert |
| Tundra vest (T3) | plate (mountain armor) | 3 | tundra |
| Jungle charm (T2) | heartroot (forest recovery) | 2 | jungle |
| Desert charm (T2) | stone (plains recovery) | 2 | desert |
| Tundra charm (T3) | barrier (mountain recovery) | 3 | tundra |
| Trench charm (T4) | pulse (cave recovery) | 4 | trench |
| Tundra boots (T3) | treads (mountain mobility) | 3 | tundra |
| Volcanic boots (T3) | wing (cave mobility) | 3 | volcanic |
| Trench treaders (T4) | marsh (swamp mobility) | 4 | trench |
| Graveyard boots (T4) | fleet (plains mobility) | 4 | graveyard — thematically the weakest fit (a death-and-decay boot crowning sunlit Plains), mechanically clean (its kill-stack-speed payoff maps directly onto Fleet's native kill-chain lane) |

No new `LineageFxKey`s were needed for any of the fourteen — every lane already had a
non-stat fx verb to reuse. The T3/T4 weapon forms proper (Jungle Venomthorn/Deathfang on
Rapier, Mountain Avalanche/Earthsunder/Warmaul and Tundra Permafrost/Glacial Tyrant on
Hammer, Desert Pilgrim/Solar Cross/Sunmonk/Zenith on Broadsword, and their siblings on Axe
and Dagger) were authored straight from the existing `evolvesFrom` graph per design §18.5
("author the T3 and T4 forms now … with empty bands above T2 until Phase 5"), closing the
reachability gap §2 describes.

## 7. Ability nodes (design §19)

A generic tree keyed to packets, not per-class trees, data-only: a **T1 packet node**
(three options, one per packet fitted to the ability) and a **T2 amplifier node** (three
options, one per chosen packet's axis) for all 22 abilities. A node means "this ability
also fires the chosen packet's payoff at a share when it lands (Technique) or casts
(Guard)", through the lineage payoff runtime — nodes decide *what* an ability does; runes
still decide *when* it fires.

- **Data:** `shared/src/data/abilityNodes/` — `offers.ts` is the only hand-authored table
  (three `(lane, payoff)` pairs per ability plus a rationale sentence); the amplifier row,
  option names, and fx keys are all GENERATED from it, not hand-written per ability.
  Techniques offer three of the six offensive packets; Guards offer the three defensive
  faces. **`speed-window` is deliberately not offered on a Guard's avoid face** — it would
  give a Guard an attack-speed window, i.e. defence scaling offence, which the
  ability-design axiom forbids. A consequence: a Guard's avoid and endure options differ
  from each other only in lane/shard/fx, not in payoff kind, since the vocabulary has no
  second avoid-face payoff — flagged as needing an `evasion-window` payoff if that row
  should carry a real choice.
- **Numbers:** `ABILITY_NODE_SHARE` in `magnitudes.ts` — `packet` 0.5 (fraction of a full
  payoff row), `amplifier` 0.6 (seeded at the lineage amplifier's own scalar). Cost and
  unlock reuse the lineage `payoff`/`amplifier` row costs; nothing new was added there.
- **State:** `TracksProgression.abilityNodes: Record<abilityId, { owned: string[]; active:
  Partial<Record<'packet' | 'amplifier', string>> }>` — optional, normalized at hydration
  like `visitedNodes`, no migration. Unlock on the ability's own home-tier band with Global
  Mastery, like a lineage row (the amplifier sits one band above the packet node, clamped
  at T4); cost essence plus the packet's shard.
- **Protocol:** `ability:unlockNode` / `ability:setNode` (client→server),
  `ability:nodeResult` (server→client) — `shared/src/protocol/socketEvents.ts`. Server
  handlers: `server/src/systems/player/economy/abilityNodes.ts`. Runtime dispatch:
  `server/src/systems/combat/abilityNodes.ts`, which reuses `fireLineagePayoffs` (split
  out of `lineageCards.ts` as the one "apply a payoff, draw one card-fx" implementation,
  so the node path inherits the evade early-return, max-wins debuff records, and the
  amplified-target spread without restating any of them). A node fires on the ability's
  **resolution** (landing/casting), not its activation — an armed Charge the fight never
  consumed pays nothing.
- **Client:** `client/src/ui/AbilityNodeRows.tsx` on the Abilities panel, the same card
  component the lineage tree uses.
- Binary payoffs (`stun`, `cleanse`) are never offered — "half a stun" is no stun.

**Not done / provisional:** `ABILITY_NODE_SHARE` is unbenched (a Guard node is a free
extra defensive window on a cooldown the player already pays for — the first thing a
bench should check); no keystone/cross row for abilities (deferred past the T3 class
review, per §19); no gameplay-telemetry row for node unlocks/sets (the lineage handlers
emit telemetry, the node handlers do not — no node event exists on the recorder yet).

## 8. Shared authority (`shared/src/systems/lineages.ts`)

Pure functions the server applies and the client gates buttons with, mirroring
`checkUpgrade`/`checkEvolve`:

- `checkUnlockCard` — gate requirements (worn-form tier ≥ card tier, any `modifies`
  target owned), then (unless `wallet.isTestRoom`) home-biome level, Global Mastery,
  essence and shard affordability.
- `checkSetActive` — swapping which owned card is active for a row. Free and instant,
  refuses only ownership/row mismatch and a collapsed band's stat card. **"Owned is
  forever, active is a choice"** is the governing invariant.
- `checkUnlockForm` / `checkWearForm` — paying a gate (essence + the crowned lane's shard
  + the home biome's boss capstone), and swapping worn form among owned ones (free).
- `lineageSwitchDiscount` — a card is half price if the player already owns the same
  tier+row on another lineage of the same slot. Gates are never discounted.
- `statRowIsCollapsed` / `absorbedStatCards` / `lineageCardTie` — the Phase 5 band-collapse
  machinery described in §3.

Server handlers: `server/src/systems/player/economy/lineages.ts`
(`unlockLineageCard`, `setLineageActive`, `unlockLineageForm`, `wearLineageForm`), wired to
`lineage:unlockCard` / `lineage:setActive` / `lineage:unlockForm` / `lineage:wearForm`,
all replying with `lineage:result`.

## 9. The non-weapon `+N` ladder still runs alongside these trees

A deliberate, temporary double system (designer instruction, Phase 4): armor, charm and
boots items keep `Recipe.upgrades`, `UpgradeTab`, `EvolutionPreview`,
`inventory:upgradeItem` and `crafting:evolveItem` exactly as before, in parallel with
their new lineage tree. Only the **weapon** slot's old ladder was deleted (Phase 2b).
Reconciling the two systems on non-weapon slots is Phase 4's exit, not yet scheduled.

## 10. Materials — shards and capstones

Both wallets live on `TracksProgression` (`shards: Partial<Record<PacketId, number>>`,
`capstones: Record<biome, number>`) and are the only kill-driven material wallets since
Phase 2b deleted the catalyst accumulator outright.

- **Shards.** Granted by `grantLineageMaterials` on every non-boss kill whose monster
  belongs to a family (see [`variants-current-state.md`](variants-current-state.md)):
  `shards[family.drops] += max(1, round(SHARD_BASE_PER_KILL × SHARD_TIER_MULT[biomeTier] ×
  debugMult))`. A monster outside the family table drops no shard.
- **Capstones.** Granted on every boss kill whose biome has a capstone material: `+= max(1,
  round(debugMult))` per kill — not scaled by node identity.
- **Boss Lane-A stopgap (design §17, provisional).** Every biome boss kill also drops 2
  shards of each **distinct non-weapon Lane-A packet** across that biome's three
  non-weapon lineages (`biomeDefensiveLaneAPackets`, deduplicated per packet — e.g. Plains
  armor and mobility both name Kill chain, so one boss kill pays Kill chain once, not
  twice). This is how Bulwark and Barrier-tempo earn any T1 income at all, since no T1
  family drops either shard yet — remove this stopgap when a family covers them (open
  decision 3).
- Both wallets are wiped (not refunded) by `resetPlayerProgress` and start at `{}` on a
  fresh character.

## 11. Runtime effects

`resolveActiveLineages(inventory, frameFace?)` is what a player's lineages contribute,
across every slot, **only while the worn form is actually equipped**. It folds stat-row
contributions (including any absorbed row, §3) into the stat rebuild and resolves the
active card per owned row plus the worn form's capstone.

- `stat` rows fold into `itemMechanicEffectsAt`'s seam, same `*Pct` sum-then-apply-once
  semantics as everything else.
- Every other row has a trigger (`hit-nth`, `mechanic-fired`, `kill`, `evade`,
  `hit-taken`, `guard-cast`, `standing`, `pulse`, `barrier-break`, `first-hit`) and a
  payoff (`vulnerability`, `plating-shred`, `echo-hit`, `hemorrhage`, `poison-stack`,
  `slow`, `stun`, `damage-window`, `speed-window`, `recovery-window`, `ward`, `cleanse`,
  `plating-stack`, `engagement-dr`, `contagion`), each mapped onto an existing combat
  primitive. Wiring lives in `server/src/systems/combat/lineageCards.ts`; `standing`/
  `pulse` run off `updateLineageCards(world, dt)` from `World.tick` since they have no
  listener seam to ride.
- Defensive cards carry a `face` and pay `OFF_FACE_SCALAR` off their frame's native face
  (§1); weapon cards carry none and are frame-neutral.
- Every card the player buys adds one visible signature on screen (`LineageFxKey`) —
  "a card with no signature is a stat," per design §8. T2 payoff/amplifier cards and
  defensive capstones mostly **reuse** their lane's existing T1 fx key rather than minting
  a new one (a departure from design §8's "payoff = a new event" table, recorded per-task
  in the archived plan); amplification reads as a bigger/second-target draw of the same
  key, not a new effect.

## 12. Known limitations

- T2 amplifier cards are data-complete but their `modifies` field is **mechanically inert
  beyond bookkeeping** — nothing yet reads it to extend the modified payoff's duration,
  add a target, or add a stack; an amplifier resolves as an ordinary payoff row off its
  own (different) trigger. Wiring "duration/second-target/stacks" semantics is a runtime
  decision still open.
- All fifteen defensive lineages are PROVISIONAL — design §17 is itself unapproved.
- All T3/T4 family and blend data behind the shard economy is PROVISIONAL — see
  [`variants-current-state.md`](variants-current-state.md).
- The T3 path `packet` tags are PROVISIONAL labels, not a class-path rewrite.
- `ABILITY_NODE_SHARE` is unbenched.
- Engagement, Bulwark and Barrier-tempo shard income at T1 still depends partly or wholly
  on the boss Lane-A stopgap (§10) rather than a trash-mob family; see
  `variants-current-state.md` §1 for exactly which packets that affects.

## 13. Card telemetry — the first LIVE run (2026-10-01)

`lineage:unlockCard` and `lineage:setActive` had existed since Phase 1c and had never run
against a live server until route `striker-lineage-forest-t1` did. Run: cadence-root /
cadence-balanced, Forest, **25× reward multiplier**, **955.9 s**, ended by the operator's
timeout — **non-canonical for economy** (the harness flags it `NON_CANONICAL_REWARD_
MULTIPLIER` itself); treat every pacing number below as a smoke test, not a balance read.

| metric | value |
|---|---:|
| time to first card | 215.9 s (3 m 36 s) |
| `unlockCard` round trip | 508 ms |
| `setActive` round trip | 0 ms (correct — `unlockCard` into an empty row already activates) |
| swaps per session | 0 (a pure-lane route buys one card per row by construction; needs a route that buys a second card in a row) |
| gate paid | 0 (the route has no boss step) |
| kills / deaths | 112 / 0 |

**The seam works end to end** (bought, persisted, telemetered). The run also surfaced a
pacing finding and a harness defect: at T1 the **payoff** row sits at Global Mastery 18
(three biomes at level 6), unreachable from farming one or two maxed biomes however much
currency is held, and `doUnlockCard`'s `farmBlocked` only names a stall for "this packet
has no T1 shard source" — a Global-Mastery shortfall the farm node cannot fix farms
silently forever instead of raising a named stall. Neither is a card-runtime defect.
