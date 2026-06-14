# Information Design — Bestiary, Monitoring, Wiki

**Scope:** the player-facing information surfaces (mob info panel / bestiary,
AFK activity summary, in-game wiki). Brainstorm, not canon.

---

## 0. Framing

Two facts make information design load-bearing in this game, not chrome:

1. **The skill is preparation** — builds, gear, routing, rune wiring. The surfaces
   that inform preparation *are* the game interface.
2. **Determinism makes radical transparency possible.** No hidden rolls means
   every displayed number can be exact and true. RNG games must hedge ("~20%
   chance"); this game can say "every 4th hit, always." Full disclosure is the
   *payoff* of the no-RNG axiom, not a spoiler.

The three surfaces are one system with three time horizons — cross-link them:

| Surface | Horizon | Question it answers |
|---|---|---|
| Bestiary | present | what am I fighting, and how does it interact with *my* build? |
| Monitoring | past | how did it go while I wasn't watching? |
| Wiki | timeless | how does the game actually work? |

(Tooltips are the fourth surface — where information meets moment-to-moment play.
Every tooltip should be able to deep-link into the wiki.)

---

## 1. Bestiary (mob side panel → zone bestiary)

### The killer feature: the personalized matchup sheet

A raw stat block (HP 130, ATK 19, PLT 5) is data. What the player needs is the
**derived view against their current build**:

- "Hits you for **6** → you take **1** after plating."
- "You kill it in **4 hits (~3.2s)**."
- "Its DoT **bypasses your plating** — your dot-resist covers 18% of it."
- "You dodge **every 4th** of its attacks."

Implementation leverage: the combat formulas are pure and live in `shared/`, and
the mob's networked stats are already on the client — **the client can compute
the matchup locally**, exactly, with zero server work. No RNG game can offer
this; it's the determinism dividend made visible.

### Damage-shape tags (teach the threat-matrix vocabulary)

Every mob carries a first-class visible shape tag: *swarm · big-hit · DoT ·
debuff · charger · kiter · shielded · soft-capped* (tags grow with the tier
axes). The threat matrix only teaches if players have the words — today that
vocabulary exists only in the design docs. Tags link to the wiki article for
that shape, which links to the mechanics/items that answer it.

### Discovery & lore

- **Never gate tactical info behind grinding** — matchup data and shape tags are
  visible on first encounter ("never left guessing").
- **Gate lore/flavor behind kill counts** — that's the collectible layer, and the
  right home for biome flavor (each biome's one-theme-three-expressions identity
  can be *said out loud* here: "Too quick to catch").
- Zone bestiary view: the node/biome's roster with shape tags at a glance —
  doubles as the dungeon scouting report (pairs with the gauntlet phases).

Entry points: click a mob in combat → side panel; node info → zone bestiary.
Reuse the shared view-composer pattern that tooltips already use.

---

## 2. Monitoring panel (the AFK report card)

Natural window: **"since you last opened this panel"** (plus a rolling 1h rate
view). Core metrics: kills, essence/hr by color, XP/hr + time-to-cap at current
rate, average TTK (and trend — is new gear moving it?), deaths with causes.

Two additions turn it from a stats page into the game's feedback loop:

### The near-death report

Not "you dropped to 8%" but **what hit you, what shape it was, what mitigated
and what didn't**: "Closest call: Cragback Rhino's empowered slam (big-hit) —
your cap halved it, plating ate 28, shield absorbed the rest." This converts
monitoring into build advice — the report card for a build-test game. Death
entries get the same treatment (including `Rune Malfunction` attribution when
that ships).

### The rune debugger

If the game's skill is programming your AI, this panel is the **debugger**:
per-rule activity since last check — "Survivor fired 3×, saved you twice ·
Explorer moved you 4 nodes · Pack Tactics never fired (you weren't in a
party)." This is the missing feedback loop that makes the rune system legible,
and it's the cheapest place to surface it (counters on rule fire, no new UI
paradigm).

### Implementation leverage

The admin analytics/logs stack (`analyticsRepo`, telemetry broker, world log) is
the prototype — the player panel is that, scoped to self. Aggregation happens
outside the hot tick (counters incremented on existing event paths, snapshot on
panel open), consistent with the DB-out-of-hot-ticks rule.

---

## 3. In-game wiki

### The one structural rule: generate, don't write

A hand-authored wiki drifts — the design-doc audit already caught drift between
internal docs, and a stale in-game wiki is worse than none because players trust
it. Instead:

- **Reference content renders itself from `shared/`** — item tables, mob stats,
  recipe costs, skill nodes, rune fragments. The static databases are the single
  source of truth; the wiki is a view over them. New content self-documents on
  ship.
- **Only concept articles are hand-written** (~a dozen): how damage is computed,
  what each mitigation type does and beats, the threat-shape guide, how biome
  XP/essence/crafting interlock, how runes arbitrate, how parties share rewards.
  `BALANCE_REFERENCE.md` is ~70% of the first draft already.

### Layered disclosure

Plain language first, exact formula behind a fold:

> **Plating** subtracts a flat amount from every hit you take. Great against
> many small hits; big hits punch past it.
> <details>damage taken = max(1, H − plating) × (1 − DR)</details>

### Tier-paced disclosure

One-axis-per-tier applies to information too. Don't show a T1 player the
defense-matchup apparatus: wiki sections and bestiary tag *explanations* unlock
with the content tier that teaches them (the data is never hidden — only the
curriculum is sequenced). The wiki's table of contents can literally mirror the
tier axes: T1 shapes → T2 conditionals → T3 range → T4 enemy defenses → T5 packs.

---

## 4. Build order (cheap wins first)

1. **Shape tags + basic mob side panel** — small, teaches the most per pixel.
2. **Personalized matchup lines** (client-side derivation from shared formulas).
3. **Monitoring panel v1** (kills, rates, deaths; window = since-last-open).
4. **Near-death report** (needs a small server-side "worst moment" tracker).
5. **Wiki frame + generated reference sections** (items/mobs/recipes first).
6. **Concept articles** (adapt BALANCE_REFERENCE).
7. **Rune debugger** (lands with rune wave 1–2; design the counter hooks into
   the rune build now so they're free later).
8. Zone bestiary + lore layer (content pass, anytime).
