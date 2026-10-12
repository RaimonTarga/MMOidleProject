# What a player must understand by Tier 2 — a cut proposal (2026-10-12)

**Status:** PROPOSAL for the designer to react to. Nothing here is implemented or decided.
**Why now:** two playtests found the structure working and the texture wrong, and each
fix removed choice (§24, §26). The designer can no longer feel whether the systems are
good. Playtest 3 ([report](playtest-3-report-2026-10-12.md)) found the guide carrying a
new player through all of it, which is exactly the problem: without the guide, nobody
would know what Gale Shards are for.

**The test:** by the end of Tier 2, a player should be able to name each system they use
and say in one sentence what it does for them. Today the honest count is:

## What a player meets by T2 (develop `6a819467`)

| # | System | Met at | Paid with | Unique job |
|---|---|---|---|---|
| 1 | Gear crafting (5 slots, relic at T4) | Clearing | 5 essences | the zone → gear loop |
| 2 | Weapon page (form, lean ranks, verb; T2 lean/verb/amplifier choices) | Cave, GM-gated | essence + **9 shard types** + boss material | the weapon's identity |
| 3 | Passive Tree (class, style, range, path) | Clearing | skill points | the class's identity |
| 4 | Abilities (learn, attune) | Plains | recipes + Runic Points | active moments |
| 5 | Ability node rows (packet, amplifier, keystone, cross × 19 abilities) | T1–T2 | shards | a second tree per ability |
| 6 | Runes (condition → action) | Clearing | Runic Points | standing orders: the strategy layer |
| 7 | Stances | T2 recipes | Runic Points | modal postures |
| 8 | Rites | recipes | Runic Points | combat-boundary passives |
| 9 | Biome mastery → Global Mastery | everywhere | — | gates ranks, verbs, RP capacity |
| 10 | Seals and boss materials | T1 bosses | — | tier advancement, gate prices |

That is ten systems and fifteen currency-like numbers (5 essences, 9 shards, boss
materials) before T3. Each one is defensible alone; together they are the homework the
designer felt.

## The proposal: four systems by T2

**Keep, untouched** — the parts playtest 3 saw working:

- **Gear crafting** (1): the loop every idle RPG player already knows.
- **The weapon page** (2): the clearest screen in the game. Keep the page, the lean ranks
  and the verb.
- **The Passive Tree** (3): class at T1, style at T2.
- **Abilities and Runes** (4 + 6) as one system, "what your character does on its own":
  learn an ability, give it a rule. Runes saved the playtest run twice; they are the one
  thing no other idle game has.

**Fold:**

- **Shards into essence** (2, 5). Price lean ranks, verbs and ability rows in the zone's
  essence plus the existing Global Mastery gate. Nodes keep their families and rosters
  (that is world texture and stays); only the currency link goes. Fifteen numbers become
  five plus boss materials, and "farm Brood territory for Gale Shards" stops needing a
  guide line. *Cost: medium (pricing tables, the materials panel, the guide script, bot
  routes, tests). Reverses §24.3's "one shard per node"; the designer's call.*
- **Global Mastery out of sight** (9). Keep it as the gate; show it as "unlocks at Tier 1
  mastery 4" on the card instead of "Global Mastery 38". *Cost: small (presentation).*

**Park to T3+** (code stays, nothing is deleted, they unfold when the tier ships):

- **Ability node rows** (5). A second tree on each of 19 abilities duplicates the weapon
  page's idea a tier early. At T1–T2 an ability is learned and wired, nothing more.
  *Cost: small (a tier gate on rows). Neither the guide nor the bots buy a row today
  (`ability:unlockNode` has no caller outside its test), so no measured number moves.*
- **Stances and Rites** (7, 8). Both spend the same Runic Points as Runes and arrive while
  the player is still learning what a Rune is. *Cost: small (recipe tiers).*

**Result by T2:** gear, the weapon page, the class tree, and abilities-with-runes. Four
systems, one budget (Runic Points), five essences, boss materials.

## What this does not touch

The backbone of the rework (a slot holds a lineage, forms open at boss gates, owned is
forever), the boss and seal structure, the combat readout, flat recovery, the T1 boss pass,
and everything at T3–T4 except where parked systems now arrive.

## Open questions for the designer

1. Is the shard currency worth its weight, or is node identity enough without it?
2. Are stances still a distinct idea now that leans exist, or did the lean absorb them?
3. Should T3 unfold everything parked at once, or one system per tier (rows at T3,
   stances at T3, rites at T4)?

If the designer agrees with any line, each is a separate small branch; the shard fold is
the only one that touches the economy and should go first or not at all.
