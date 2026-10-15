# T4-SQUIRE report
**Agent:** Claude   **Branch:** rw/t4-squire   **Last commit:** see `git log -1` (report committed with the code)

## Done
Every number below is a PLACEHOLDER in the kit's `params` (bible numbers copied where given; the bible gives none for most T4 items).

- `shared/src/classKits/squire/kit.ts`: params for Guard III (stagger), Disarm, Lay to Rest, Lie in Wait, Faultline IV (aftershocks), Charnel Ring, Undertow, and all nine leaves (the `leaf()` helper now takes `params`).
- `server/src/systems/classes/archetypes/cooldown/squire.ts`: handlers, listeners and per-tick updates for everything in the table. Two pieces of shared machinery carry most of it:
  - **The wasted-answer ledger.** A response that returns `wasted`, or a brace (Guard, Anchor, Intercept, Parry, Disarm, Lie in Wait) that runs out without catching its blow, now counts as a wasted answer (`pendingAnswers`, settled by the catch listeners, expired each tick). Read Again and No Wasted Effort hang off it. All the costs go through one `answerCost` (Second Nature, Abyssal Plate and Read Again live there).
  - **The quiet clock** (`noteAttacked`): last time anything attacked the Squire, and per enemy. Siege Engine, Seize the Opening and Goad read it.
- `shared/src/passives.ts`, `shared/src/data/mechanicLabels.ts`, `shared/src/data/classGear/squire.ts`: seven new `squire.*` keys (Squire block only); Bone Maul, Pressure Hammer, Grave Plate, Rest Eternal, Abyssal Plate and Brine Will filled, so no T4 item is dead.
- `server/test/squireT4.test.ts`: one wiring test file (14 groups).

### Status table (T4 items)

| Item | Status | Notes |
|---|---|---|
| Guard III | wired | a caught blow staggers its attacker (1000 ms, rank param) |
| Splitting Blow II | wired (T2/T3 work) | rank param `breakBarrier` already breaks Ice Armor in one blow; test checks the rank is held |
| Watchful II | wired (earlier work) | rank param `staggerMs` 1000 |
| Disarm | wired | marks the winding-up enemy (any guardable threat aimed at you, boss pattern steps included); its blow lands at half, refunds, and as a counter opens Second Nature / feeds the Avenger's counter. Not a stun, so it works on a `controlImmune` monster (test) |
| Lay to Rest | wired, trigger stand-in | `risen` is read locally (`LOCAL_MOMENTS`): an `isRaised` monster the Squire sees appear within 500 px in the last 2 s is struck for a swing and staggered, once per riser; Rest Eternal heals |
| Lie in Wait | wired, reading placeholder | answers the real `target-out-of-reach` state. With the slam armed it holds it (one hold, 8 s); the next slam on that target lands double and refunds; unclaimed it is a wasted answer |
| Anchor II ("even into a hazard") | stand-in | same as rank 1 (total resistance already covers a hazard destination) |
| Faultline IV | wired | 3 aftershocks along the line at 400 ms steps, 30% of the slam each, 90 px circles (shares Reverb's echo list) |
| Deep Winter II, Strangler Vine III, Executioner's Oath III, Kindling II | wired (rank params from T3) | the test checks the ranks held at T4 and the numbers they carry |
| Charnel Ring | wired | the slam circle grows 10% per enemy on you, at most +150% |
| Undertow | wired, reading placeholder | the slam roots its target for 3 s (refused by control-immune bosses) and any dive (`isConcealed`) or escape (`bossPatternEscaping`) it starts is cut short: a boss pattern is staggered 800 ms with `staggerBoss`, anything else just comes back up |
| Last Word / Last Rampart | wired | "empty" = less Resolve than the answer costs; Parry / Unbowed fire free once per 10 s |
| Read Again | wired | a wasted answer gives back half its cost and the next answer of the same family costs half |
| Seize the Opening | wired | an enemy that has not attacked you for 4 s (or never has) is open: your next swing on it is followed by a 0.5-swing counter (so counter bonuses, Second Nature apply); the opening is spent |
| Second Line | wired | on an empty bar, a pip per enemy on you, once per 12 s |
| No Wasted Effort | wired | each pip lost adds 25% to the next slam |
| Goad | wired | after 4 s of nothing hitting you and with a target, a free Challenge (its range, count, root rank) pulls the nearest enemies onto you, once per 10 s; needs Challenge learned, not its rule on |
| Focused Weight | wired | a slam that hits only one enemy refunds 25% of the budget |
| Siege Engine | wired | after 4 s of nothing hitting you, swings hit 50% harder (not the slam) |
| Bone Maul | wired | slam x (1 + 0.1 per other enemy in its circle, counted after the ring and hook have pulled them in) |
| Grave Plate | wired | a risen enemy's hits fill double Resolve (`squire.risen-fill-x`) |
| Rest Eternal | wired | `squire.lay-to-rest-heal-pct`, 1.25% max HP |
| Pressure Hammer | wired | slam x (1 + 0.1 per different harmful status on you, the fight snapshot's count) |
| Abyssal Plate | wired | with 3 different debuffs on you every guard costs nothing |
| Brine Will | wired | each debuff Steel Will or Unshaken shakes off adds a Recovery stack (+25% each, 4 s, at most 5; PLACEHOLDER cap) |
| Moved jobs to Wasteland (Spiked Flail, Iron Gut, Purifying Breath) and Trench (Tower Shield, Reforged, Old Guard) | wired (earlier work) | the test checks they are non-empty |

Everything the T3 report left `missing` is done (the Graveyard and Trench gear, Guard III, Faultline IV, Lay to Rest, Lie in Wait, Disarm, Charnel Ring, Undertow). The T3 stand-ins (Anchor, Chain Hook, Frostward, Backdraft triggers; Consecrate and Deep Winter readings) are unchanged: design calls.

## Checks
- pnpm typecheck: clean
- pnpm test -- squire classGear classKit mechanicLabel passives moments cooldown gear mechanicFired classFirstTree tutorial: 34/34 passed (includes squireT4.test.ts, squireT3.test.ts, squireT2.test.ts, squireResponses.test.ts, squireGear.test.ts, the kit/gear/label tests and the bot squire routes)
- `git diff --numstat`: no file changed endings (all LF).

## Not done, or unsure
- **`risen` is not in the moments registry** (conductor-owned `moments/`): the Squire reads it itself (`risenWatch`, first-seen per `isRaised` monster). A rule's condition list will not see `risen` until the registry implements it.
- **A core hook worth adding for Undertow:** it cuts a dive or flight short after it starts (stagger / detach). Preventing the start would need a check in the boss pattern runtime (`bossPatterns.ts`), which is not mine. Undertow's design reading ("can't dive, burrow or flee") may deserve that hook.
- **Leaves are read from `usesSkills.unlockedSkills`** (what the Passive Tree's `unlockSkill` writes); the leaf pick itself goes through the generic tree gate (`classFirstTree.test` passes), I did not touch the panel.
- **`attackNow(ctx)` is `Date.now()` for monster hits** (`runMonsterAttack` does not set it), so Disarm's mark is kept in world ticks, not ms, to stay consistent with the tick clock the Squire updates on; the existing Backdraft cooldown still compares only `attackNow` with itself.
- Brine Will's cap (5 stacks), Charnel Ring's cap (+150%) and every leaf number are placeholders, listed in the kit `params` with comments.
- Seize the Opening counts an enemy that has never attacked you as open, so the first swing on every fresh enemy gets the counter; the bible's wording ("hasn't attacked you for a few seconds") allows it, the designer may want it limited to enemies that have been in the fight.
- Intercept and Anchor share the Guard's status id, so a catch by any of them settles all three pending answers (the one brace is the one blow).
- No client entries were needed (no new status ids), no bot route, no UI: T4-W2.

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/moments/moments.ts` / `fightSnapshot.ts` (`risen`), `server/src/systems/combat/ai/bossPatterns.ts` (Undertow prevention hook). None edited.
