# T4-CONDUIT report
**Agent:** Claude (Sonnet)   **Branch:** rw/t4-conduit   **Last commit:** see `git log -1` (report committed on top of the code commit)

Names: the kit and bible call the two new T4 biomes **Graveyard** (necromancer) and **Trench**; the plan says "Wasteland". I followed the kit (`zone('graveyard', 4)`, `conduit-relic-graveyard`, `graveyard-*-t4` gear). The bible's Wasteland row (§7.8 seed Souls) is the same Charnel-Crown thrall Soul.

## Status table (bible §7.7, §7.8, §7.9, §7.16 T4)

Before this task none of the T4 items had a runtime. A leaf is a Passive Tree pick (`usesSkills.unlockedSkills`, read by `hasLeaf`).

### T4 summons

| Item | Status | Where / how |
|---|---|---|
| Avalanche (3 Command, charges through a line, knocks down) | wired | afterHit on a timer (`chargeEveryMs`): a real line (length, width) from the body through the target; area damage on every enemy in it plus a stun ("knock down") unless the enemy refuses control (Tundra/Volcanic bosses) |
| Icewarden (ice shell on the most hurt summon) | wired (estimate) | `conduit-ice-shell` status holding a `shield` amount; soaks the monster's hit through `onMinionStruckT2` (same estimated-damage stand-in as bark); echoes through Choir |
| Dartcaller (poison darts, ricochet) | wired | afterHit: poison DoT on the target, a share of the hit and the same poison on the nearest other enemy; poison respects `evadeBlocksDebuffs` |
| Mirage (copy of you draws attacks, bosses chase it) | stand-in | no temporary entity: the Mirage's own body is the decoy; enemies near it that were fighting you are taunted onto it for a few seconds. An enemy that ignores taunts does not chase it. Echoes through Choir |
| Obsidian Tortoise (withdraws into its shell, keeps taunting) | wired (estimate) | `conduit-withdraw` for a few seconds on a timer: 95% of each hit refunded; the tank taunt keeps running (params copied from the other tanks) |
| Gravecaller (a fallen summon rises once as a husk before the rebuild queue) | stand-in | `husks.ts`: no temporary summon entity exists, so a husk is a short-lived striker held server-side (strikes the focus target, or the nearest enemy, once a second for 4 s at 0.8x the dead summon's attack). Fires from `collectDeaths`, so it works on bosses |
| Abyssal Warden (pulls a debuff onto itself) | wired | timed: the body (you or a summon) in reach with the most cleansable debuffs gives its deepest-stack debuff to the Warden (copied with duration and stacks, removed from the source) |
| Lessons at zone levels | wired | the kit already bound them; test asserts all seven bound and fielded |
| Choir echo of the new supports | wired for Icewarden and Mirage | `fireSupportAbility` (T3) now holds every support's ability by piece id; the Gravecaller is event-keyed and does not echo |

### Leaves (§7.7)

| Leaf | Status | Where / how |
|---|---|---|
| Burst | wired / stand-in | a dying summon explodes (area damage at its spot, once). With Burn Bright: a summon REBUILT during a fight (not the opening army) blows up and dies when its haste window ends. The "waves" are the rebuild cadence |
| Grand Entrance | wired | `onSummonRebuilt` from the reconstruction tick stuns the enemies around the landing body (control-immune bosses excluded) |
| Devour | wired | afterHit: a summon older than 8 s heals a share of the damage it deals |
| Avenge | wired / stand-in | when a summon dies every surviving summon strikes its killer once. The killer is the nearest enemy that was aggroed on the dead summon, else the formation's focus (combat does not record who landed the killing blow on a summon) |
| Fall Back | wired | under 35% HP a summon gets `conduit-fall-back`, stops fighting, walks to a spot behind the nearest tank (away from the focus target), mends 10%/s and rejoins at 75% or when the fight ends (`ai.ts` early return) |
| Rally | wired | `firePackStrike` mends every summon for a share of its max HP |
| Final Command | wired / stand-in | a dying summon under Elite fires its extra at double strength: supports fire their ability (heal, bark, spores, frost, horn, shell, decoy), everyone else splashes at Elite's splash (Colossus: its shake; Rockhurler: its own). "Its extra" is Elite's per-family extra (the bible leaves the granularity open) |
| Last Stand | wired (undone after the fact) | in `onMinionStruckT2`, an elite whose hit took it to 0 is put back at 1 HP for 4 s, once per fight (the fight clock names the fight); the last point holds against further hits and DoT ticks until the clock ends |
| Shared Burden | wired (estimate) | part of the estimated damage on the elite is refunded to it and paid out of your HP (never below 1 HP) |

### Souls (§7.8, §7.16)

| Item | Status | Where / how |
|---|---|---|
| Rank-ups at T4 (Mountain last rank; Tundra, Jungle, Desert, Volcanic) | wired | already generic (`trophyRanks`); the test pins each |
| Charnel-Crown (Graveyard): enemies the formation kills rise as thralls | stand-in | same husk system; on-kill listener, power scales with the Soul's rank. The on-kill review (§7.15 item 8) is still open |
| Elder Serpent (Trench): the longer the fight, the tougher the summons | wired (estimate) | each 10 s of the fight refunds more of the damage a summon takes (up to 6 steps); the same estimate gap as bark |

### Gear (§7.9, §7.16)

| Item | Status | Where / how |
|---|---|---|
| Cleave (Graveyard weapon) | wired | `conduit.cleave-pct`: summon hits splash that share to the enemies around the target |
| Exploit (Trench weapon) | wired | `conduit.exploit-pct`: summons hit harder per different debuff on the target (harmful effects, holds, and the Conduit's own marks) |
| Grave Pact (Graveyard armor) | wired | `conduit.grave-pact-ms`: a hit that would kill you is cancelled and the weakest non-Soul summon dies instead; the passive value is the cooldown |
| Requiem (Graveyard charm) | wired | `conduit.requiem-pct`: when a summon dies the others heal that share of its max HP |
| Pressure Seal (Trench armor) | wired / stand-in | `conduit.pressure-seal-ms`: every body (you and each summon) carries a `conduit-seal`; the next NEW harmful, cleansable debuff it receives is removed after the fact and the seal is spent (it returns after the interval). Hard control (stun) is not covered |
| Tidewater (Trench charm) | wired | `conduit.tidewater-pct`: with 3+ debuffs on you, an extra Recovery tick equal to your Recovery (doubled) |
| Moved lines (Swamp to Graveyard, Cave to Trench) and the last ranks of the old lines | wired | already on the `-b` second bases; the test pins them |
| Still `{}` | none | the only remaining `{}` is the Clearing's starter weapon (by design) |

### T3 leftovers

| Item | Status | Note |
|---|---|---|
| Infestation's burst into short-lived summons | wired / stand-in | the burst now also raises 3 husks (the same husk system); still area damage too |
| Colossus "+1 Command" in the live check | done earlier | T3-W2's `specializationIdAtom` and the config context carry it; see the double-count note below |
| Colossus "grow huge" | missing | `RosterBody` (`shared/src/systems/summonerProfile.ts`) has no size field, outside my paths |
| Two Souls' second Soul Command cost | missing | no number in the bible (§7.15 item 2, playtest) |
| Burrower tunnelling, Prowler "fleeing" moment, Carapace Guard facing, estimated damage on summons | stand-in | unchanged, design/engine calls |

## Done
- shared: `conduit/leaves.ts` (leaf, Soul and gear tuning, PLACEHOLDER), T4 piece `params` in the kit, infestation husk tuning, six passive keys and labels (Conduit block), Cleave/Exploit/Grave Pact/Requiem/Pressure Seal/Tidewater effects on the gear, `conduitKit.test.ts` accepts the T4 params.
- server (`archetypes/summoner/`): `summonPiecesT4.ts` (summon jobs, Souls' listeners, Cleave/Exploit/Grave Pact/Seal/Tidewater, tick), `leavesT4.ts` (the nine leaves), `supportsT4.ts` (shell and decoy as strength-taking abilities), `husks.ts`, `t4Shared.ts` (ids, `hasLeaf`); edits to `summonPiecesT3.ts` (abilities exported, one `fireSupportAbility` switch under Choir, Infestation husks), `summonPiecesT2.ts` (Rally, `debuffsOn` exported), `minionHitsT2.ts` (shell, withdraw, Serpent, Last Stand, Shared Burden), `damageSponge.ts` (Grave Pact), `reconstruction.ts` (Grand Entrance), `ai.ts` (Fall Back), `summonerPrototype.ts` (registration, tick, death hook), `souls.ts` and `t3Shared.ts` (small exports).
- `server/test/conduitT4.test.ts`: a wiring test for every row above marked wired or stand-in.

## Checks
- pnpm typecheck: clean
- `conduitT4: ok`, `conduitT3: ok`
- pnpm test -- conduit formation summon minion classKits classGear classScreen kit mechanicLabels passives statusRegistry: the only failure is `server/test/statusRegistry.test.ts`, and it is expected: the five status ids T4 adds have no client entries yet (below). Everything else passes, including conduitT2/T3/T4, conduitKit, classGear, mechanicLabels, the bot conduit routes and the summoner suites.

## Not done, or unsure (conductor's call)
- **New statuses need their client entries (T4-W2):** `conduit-ice-shell` (on summons), `conduit-withdraw` (on summons), `conduit-last-stand` (on summons), `conduit-fall-back` (on summons), `conduit-seal` (on you and summons). `statusRegistry.test.ts` fails on them until the tile, help, badge and icon exist. The summon-side ones will also need `ACCEPTED_GAPS` lines in `server/scripts/statusAudit.ts` like T3's (minion carriers read as unknown). Not touched.
- **The leaf pick through the Passive Tree panel** was not checked in the UI (T4-W2): the tree builds the nine leaves from the kit (`classFirst.ts`, code tier 3), and the runtime reads `unlockedSkills`, so a pick through `player:unlockSkill` should reach it.
- **Damage on summons is still estimated** (`runMonsterAttackOnMinion` bypasses the pipeline): Icewarden's shell, the Tortoise, Last Stand, Shared Burden and the Elder Serpent all work on the same stand-in as bark. A pre-damage hook would make them exact.
- **No temporary summon entity** (§7.15 item 8): husks are invisible, server-only strikers. They need a body and a HUD/FX pass before they read as "rising".
- **Burst + Burn Bright kills your own summons** by design (§7.7); with Swarm they rebuild free. It only affects bodies rebuilt during a fight.
- **Colossus is still counted twice** (budget +1 and +1 Command per summon), as flagged in T3W2.
- **Mirage** cannot redirect enemies that ignore taunts, so some bosses will not chase it.
- Every number is a placeholder (`leaves.ts`, kit `params`, gear values); the bible gives only "double" for Final Command.

## Files outside the brief I needed (edited)
- `shared/src/classKits/conduit/conduitKit.test.ts` (the T4 params, as T3 did) and `shared/src/classKits/conduit/specialization.ts` (husk tuning for Infestation, part of the class's kit data).
