# Runes — Game Design Catalog

> The creative side of the Runes system: the fragments you collect, what they cost, and the
> kinds of characters you build by wiring them together.
> No implementation details — see `runes.md` for the technical design.

Runes modify your character's combat AI. Your baseline character is dumb: it roams the
**entire node**, walks up to the nearest monster, and swings until that thing dies — then
moves on to the next-closest. It never flees, never leaves the node, and never thinks about
the party. Everything smarter (or stranger) than that is a rune you build.

A rune is a sentence: **`when <something happens> → <do something>`**. You don't find finished
runes — you find the *words*. **Conditions** ("when you die", "while you're below 25% HP",
"while you're the party leader") and **actions** ("flee to the clearing", "wait for someone to
join", "rune to the next biome") drop separately. You snap any condition onto any action to
write your own behavior.

Note: seeing the whole node is the *default*. There are no "see farther" actions — your sight
only ever shrinks, via flaw conditions or actions that narrow your focus in exchange for
something else.

---

## How it works (player-facing)

- You get **2 rune points (RP) per tier** (T0 = 0, T1 = 2, T5 = 10).
- You collect **condition fragments** and **action fragments** out in the world — boss drops,
  quest rewards, and hidden conditions. Owning them is free.
- You **wire them into rules**: pick a condition, pick an action, and it becomes a behavior.
- **You only pay RP for the *words you use*, once each.** Reuse "while below 25% HP" in three
  different rules? You still pay for it once. Wire five different conditions all into "flee"?
  You pay for "flee" once. Builds are about **wiring a few words richly**, not buying a long
  shopping list.
- Some conditions are **flaws**: they restrict when your character is allowed to act, but
  *give RP back* so you can afford something stronger elsewhere.

The whole point is the trade-off and the wiring. You're not buying stats — you're writing how
your character *thinks*, and the cheapest powerful builds are the ones that reuse the same few
words over and over.

---

## Conditions — *when*

Two flavors. **Events** fire once at a moment; **states** stay true for as long as they hold
(and several can be true at the same time).

### Event conditions (fire once)

| Condition           | RP | Triggers when… |
| ------------------- | -- | -------------- |
| **When you die**    | 1  | the moment you fall, before respawn |
| **When you kill**   | 1  | you land a killing blow |
| **When you're hit** | 1  | something damages you |
| **When you clear a biome** | 1 | a biome hits completion |
| **Killed by ___**   | 1  | (unlocks after a monster type kills you repeatedly) a specific family lands the final blow |

### State conditions (true while…)

| Condition             | RP | True while… |
| --------------------- | -- | ----------- |
| **In combat**         | 1  | you're actively fighting |
| **While exploring**   | 1  | you're out of combat / roaming |
| **Below 25% HP**      | 1  | health is at or under a quarter |
| **Below 50% HP**      | 1  | health is at or under half |
| **3+ enemies on you** | 1  | three or more monsters are aggro'd |
| **Solo**              | 1  | you're not in a party |
| **Party member**      | 1  | you're in someone else's party |
| **Party leader**      | 1  | you lead a party |
| **Always**            | 0  | always — for permanent, unconditional behavior |

> **Always** is free and is how you set permanent habits: `always → prioritize lowest-HP
> targets` makes an Executioner. Spend your RP on the *action*, not the trigger.

---

## Actions — *what you do*

Every action belongs to a **category** that sets its priority when behaviors collide. From
highest to lowest: **Instinct → Linking → Wayfinding → Targeting**. When two behaviors fight
over the wheel (where to move, who to hit), the higher category wins; an instinct to flee
always beats the urge to wander to the next biome.

### Instinct — self-preservation (highest priority)

| Action                    | RP | What it does |
| ------------------------- | -- | ------------ |
| **Flee**                  | 1  | retreats from the fight when triggered |
| **Flee to the clearing**  | 1  | runs all the way back to town to rest |
| **Respawn immediately**   | 2  | skips the death screen and jumps straight back in — **always fires, even alive** (see the warning below) |

> ⚠️ **Respawn immediately is a loaded gun.** It does exactly what it says, *whenever* its
> condition fires — and you can't respawn without dying first. Wire it to **When you die** and
> it's the proud Phoenix: straight back into the fight. Wire it to anything else and it simply
> kills you on the spot, every time the condition is true. That's not a bug — it's yours to
> aim. Deaths you cause this way are logged as **Rune Malfunction**, so you'll always know which
> of your own wirings just did you in.

### Linking — party coordination

| Action                          | RP | What it does |
| ------------------------------- | -- | ------------ |
| **Focus the leader's target**   | 1  | hits whatever the party leader is hitting |
| **Engage only ally-aggro'd mobs** | 2 | only fights things already on a teammate — let them tank, you cash in |
| **Wait for a party**            | 1  | sits in town until someone joins you |
| **Go to town as leader**        | 1  | heads to town and opens yourself up as a party leader |

### Wayfinding — movement & exploration

| Action                      | RP | What it does |
| --------------------------- | -- | ------------ |
| **Seek a new biome**        | 3  | full autopilot — finishes the current biome and moves on |
| **Path to where you died**  | 1  | returns to the biome that killed you |
| **Optimize for upgrades**   | 3  | autopilot biased toward unlocking your next upgrade |
| **Pick the biome (map)**    | 3  | autopilot, but you choose the target biome from the map |
| **Wander**                  | 1  | occasionally strays to a random unexplored node, just to see the sights |

### Targeting — who to hit & how you focus (lowest priority)

| Action                       | RP | What it does |
| ---------------------------- | -- | ------------ |
| **Prioritize fastest kill**  | 1  | hits whatever dies soonest — clears trash |
| **Prioritize the threat**    | 1  | hits whatever is attacking you |
| **Favor clustered targets**  | 1  | weights toward mobs surrounded by other mobs — for AoE builds |
| **Save empowered for the big one** | 1 | dumps big hits on the toughest enemy |
| **Charge the boss first**    | 2  | goes for the boss / biggest enemy and ignores trash (Glory Hound) |
| **Hunt your nemesis**        | 2  | singles out the exact monster type that last killed you |
| **Tunnel vision**            | 1  | commits to one target, never switches until it's dead |
| **Wider standoff (ranged)**  | 2  | holds a safer gap while attacking |
| **Shrink your sight**        | 1  | narrows your acquire radius to a tight pocket around you |

---

## Building runes — example wirings

Snap a condition onto an action and you've made a rune. Classic builds:

| The rune you wanted | = condition | + action |
| ------------------- | ----------- | -------- |
| **Survivor**        | Below 25% HP | Flee |
| **Coward**          | Below 50% HP | Flee |
| **Dramatic Exit**   | Below 25% HP | Flee to the clearing |
| **Panic**           | 3+ enemies on you | Flee |
| **Phoenix**         | When you die | Respawn immediately |
| **Recruiter**       | When you die | Wait for a party |
| **Revenge**         | When you die | Path to where you died |
| **Alpha**           | Solo | Go to town as leader |
| **Pack Tactics**    | Party member | Focus the leader's target |
| **Executioner**     | Always | Prioritize fastest kill |
| **Glory Hound**     | Always | Charge the boss first |

### …and the ones the system gives you for free

Because you wire it yourself, you discover behaviors nobody designed:

- **When you die → Seek a new biome** — death just means *forward*. A reckless momentum build.
- **Below 25% HP → Shrink your sight** — when you're hurt, you hunker down and stop wandering
  into new fights.
- **Party leader → Seek a new biome** — a leader who constantly drags the whole party onward.
- **While exploring → Charge the boss first** — never grind trash; beeline bosses the second
  you're out of a fight.

Some wirings are nonsense (`While exploring → Flee to the clearing` paces the clearing forever).
That's allowed — your dumb baseline always keeps the lights on, so the worst a silly rune does
is waste your time, never brick your character.

### …and the ones that bite (on purpose)

A few wirings are outright traps. The game will let you build them, run them, and suffer them —
that's the comedy. Some only waste your time; the nastier ones (anything that fires **Respawn
immediately** while you're alive) just *kill you*, and the death log calls it out as
**Rune Malfunction** so you know exactly whose fault it was — yours.

| The trap you built | What actually happens |
| ------------------ | --------------------- |
| **When you're hit → Respawn immediately** | you die the instant *anything* touches you, forever — `Rune Malfunction` |
| **Always → Respawn immediately**          | a permanent death loop; you never get to act at all — `Rune Malfunction` |
| **When you kill → Respawn immediately**   | every kill is your last; you drop dead on the killing blow — `Rune Malfunction` |
| **In combat → Flee**                      | you bolt the second a fight starts and never trade a single hit |
| **Below 25% HP → Charge the boss first**  | the moment you're nearly dead, you sprint *into* the biggest thing in the room |
| **Party member → Flee to the clearing**   | you abandon your party the instant you join one |

These aren't bugs and they aren't blocked. Building a working brain means learning which words
should *never* touch each other.

---

## The wiring economy (why this is fun)

RP pays for **words, not sentences**. Once you've paid for **Flee**, every condition you own
can trigger it for free:

- *Below 25% HP → Flee*, *3+ enemies → Flee*, *When you're hit → Flee* — that's three rules for
  the price of **Below 25% HP + 3+ enemies + When you're hit + Flee** = four words, lit once each.

So the strongest builds aren't the ones with the most runes — they're the ones that pick a
small vocabulary and cross-wire it densely. A coherent "skittish survivor" who flees from
everything is cheap; a character with ten unrelated one-off behaviors is expensive.

---

## Charge — fuel your brain with essence

Rune points decide *what* you can equip. **Charge** decides whether it actually runs. Every
rule you equip has a little **fuel bar**, and running that behavior burns fuel. You top the bars
back up by spending **essence** — and the game is generous: **any essence works**, so you're
never stuck because you're short on one biome's drops.

What this means in practice:

- **A good build pays for itself.** Most behaviors sip a tiny trickle, far less than you earn
  from killing things. A clean, efficient loadout stays topped up forever and your essence still
  climbs while you grind — charge is a tax on how *busy* your brain is, not a wall.
- **Busy brains cost more.** Behaviors that run *constantly* — anything wired to **Always**, or
  a permanent targeting habit — burn fuel every second they're active. Pile on enough always-on
  rules and you'll watch your essence start to drain instead of grow. That's the trade-off:
  a more elaborate brain has a higher electricity bill.
- **Runaway rules burn out.** This is the safety net for the trap wirings above. **Always →
  Respawn immediately** would kill you forever — except it's firing every instant, so it torches
  its own fuel bar in seconds and goes **dark**. A dark rule stops running until it's recharged.
  So the disaster build costs you a handful of deaths and a chunk of essence, then quietly
  switches itself off. The empty fuel bar in your loadout is the game pointing at the culprit.

Watch the fuel bars: a rule that's always sitting empty is a rule that's eating your essence
alive. That's usually your sign to rewire it.

---

## Flaw conditions & build identity

Flaws are **conditions that restrict when you're allowed to act** — and they pay RP back. The
restriction is the cost; the point is the reward.

| Flaw condition       | RP  | The catch |
| -------------------- | --- | --------- |
| **Only wounded targets** | −1 | you refuse to open on full-HP enemies — wire it to *engage* and you only finish what others started (hilarious in a party) |
| **Afraid of ___**    | −1  | you won't act against a chosen monster family — wire it to *flee* and you run from spiders on sight (Arachnophobia) |
| **Unlucky HP**       | 0   | you freeze on superstitious health numbers — a pure joke flaw |

Because RP pays per *word*, a flaw condition only refunds **once**, no matter how many rules
you wire it into — no farming free points by spamming the same flaw.

A T0 character (0 RP) can light up a single −1 flaw condition to scrape together 1 point and
afford their very first real action — a "deal with the devil" for the earliest game.

**Limits:** at most 2 flaw conditions equipped at once, and flaws still have to be found like
any other fragment — no free points at character creation.

---

## Ideas parking lot (not yet costed)

Rough fragments to flesh out later:

- **Set synergies** — wiring several actions of one category grants a small combo bonus (à la
  Paper Mario badge stacking).
- **Doomsayer** (condition) — "while badly outnumbered", scaling with nearby enemy count.
- **Magpie** (action) — detour toward the rarest/shiniest enemy or drop.
- **Mirror Match** (action) — prioritize the monster type you've personally killed the most.
- **Rest / Squirrel** (action) — periodically stop to idle and recover.
- **Type-hunter family** — a line of `sees-family(X)` conditions wired to favor or fear each
  monster family (slayer-style).
