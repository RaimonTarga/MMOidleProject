# T2-CONDUIT report
**Agent:** Claude (Sonnet)   **Branch:** rw/t2-conduit   **Last commit:** see `git log -1` (report committed on top of the code commit)

## Status table (bible §7.5, §7.8, §7.9, §7.16 T2)

Before this task none of the T2 items had a runtime: the kit named them, nothing executed them (no discipline logic existed at all).

| Item | Status | Where / how |
|---|---|---|
| Ironhorn (tank, brace: charger stops dead and is stunned) | wired | `minionHitsT2.ts` from `onMinionStruck`; taunt copied from the Plains Warden (PLACEHOLDER) |
| Barkward (bark absorbs next control and some damage) | stand-in | bark status every few s on the most hurt summon (`summonPiecesT2.ts`); control is stripped on the next summoner tick (not at the moment of application), the damage share is an estimate refund (see below) |
| Rockhurler (boulder hits a small area) | wired | afterHit splash |
| Bog Leech (drain, shared with the most hurt summon) | wired | afterHit heal of the most hurt summon (not a latch: no sticky-target state) |
| Bonecrusher (hits scale off own max HP) | wired | onHit adds `maxHp * hpDamagePct` |
| Bloomtender (first healer, Conduit included) | wired | afterHit heal of the most hurt ally incl. the owner |
| Executioner (mark, execute threshold) | wired | `conduit-mark` status on hit; onHit doubles below the threshold on a marked target |
| Swarm (1-cost half price, free rebuilds) | wired | `disciplineCommandCost` (shared), `rebuildCostMult` (reconstruction + Bloodtithe) |
| Pack (new type costs 1 less, never below 1; Pack Strike every 8 s) | wired, order stand-in | cost in shared; `firePackStrike` on a timer. The free order that fires it early is NOT wired (needs a new order in the Formation config/protocol) |
| Elite (+1 Command, +50% HP, +25% damage, an extra) | wired, extra is a stand-in | stats in `profile.ts`; extra per family: damage/tank get a splash (area damage), supports and Rockhurler get a 1.5x job |
| Trophy rank-ups, rank 2 of Plains/Forest/Swamp/Mountain/Cave | wired | `soulPower(owner)` scales the Soul's body and its line by 1 + 0.25 per rank (PLACEHOLDER; ranks are not designed, bible §7.15) |
| Jungle Soul (Dread-Gorger): never loses a fleeing target, moves faster | wired | leash +60%, speed +20% (PLACEHOLDER numbers) |
| Desert Soul (Dune-Stalker): each different summon type that hits the marked target adds a stack | wired | bitmask of kinds on the mark; +10% damage per stack on that target |
| First Strike (Jungle weapon) | wired | `conduit.first-strike-pct`; yields to a heavy shot already on the hit (one multiplier per hit) |
| Longshot (Desert weapon) | wired | `conduit.longshot-pct`: ranged damage up, melee down, ranged reach x(1+2v) |
| Sentinel (Jungle armor) | wired | `conduit.sentinel`, in the damage sponge's onDamageTaken |
| Sandveil (Desert armor) | wired | `conduit.sandveil-pct`: on you via onDamageTaken, on summons via the refund stand-in |
| Bloomlink (Jungle charm) | wired | `conduit.bloomlink-pct`: Bloomtender's heal also heals you |
| Purge (Desert charm) | wired | `conduit.purge-ms`: the most debuffed body loses its deepest debuff |

Gear file: only the T2 entries got effects (First Strike, Longshot, the four Jungle/Desert T2 lines). T3/T4 copies of those jobs still carry `{}`; that is the T3/T4 task. New passive keys and labels sit in the Conduit block of `passives.ts` / `mechanicLabels.ts`.

## Done
- shared: `conduit/discipline.ts` (cost rules, Elite/Pack tuning), `rosterCommand(roster, disciplineId)` used by the config check, the default roster and the Formation view's Command pips; T2 piece `params` in the kit; six passive keys + labels; T2 gear effects.
- server (`archetypes/summoner/`): `summonPiecesT2.ts` (listeners, bark, Purge, Pack Strike, Sentinel/Sandveil helpers), `minionHitsT2.ts`, `disciplines.ts`; edits to `profile.ts` (Elite stats, Longshot, Soul rank, range helper), `souls.ts` (rank power, Jungle/Desert), `spawn.ts`/`ai.ts` (speed, leash, range), `reconstruction.ts`/`summonerPrototype.ts` (Swarm free rebuild, tick hook, registration), `damageSponge.ts`, `minionHits.ts` (one call out), `summonPieces.ts` (export `swing`, `PIECES`).
- `server/test/conduitT2.test.ts` (wiring test for every row above). `conduitKit.test.ts` updated: T2 pieces now carry finite params.

## Checks
- pnpm typecheck: clean
- pnpm test -- conduit formation summon minion classKits classGear classScreen kit mechanicLabels passives: 32/32 passed after updating `conduitKit.test.ts` (the first run was 31/32 on that one file, fixed; re-ran alone 1/1)
- `conduitT2: ok`

## Not done, or unsure (conductor's call)
- **Free order that fires Pack Strike early** (bible §7.5): not wired. It needs a new field in `FormationOrders` (config types, parse, validate, protocol, client). `firePackStrike(world, owner, now)` is exported and ready to be called by it.
- **Barkward / Sandveil on summons**: `runMonsterAttackOnMinion` bypasses the pipeline and is in `combat.ts` (not mine). So control is removed one summoner tick after it lands, and the "absorbed damage" is a refund (heal) estimated from the monster's attack, plating and DR, not the engine's exact number. If the conductor adds a pre-damage / pre-rider hook for hits on summons, both become exact.
- **Ironhorn**: "a charge" is read as `controlsMonster.chargeRemainingMs > 0` (the aggro charge). Charged wind-up attacks and boss dashes do not trigger the stun.
- **Elite's extras**: the bible leaves granularity open; I did per family (see table). Only 12 distinct extras are not authored.
- **Pack cost**: "a type the formation doesn't have yet costs 1 less (never below 1)" read literally, so it only discounts the first copy of 2+-Command summons; 1-cost types are unaffected.
- **Swarm power**: half-cost summons keep full strength (bible playtest question); slot weights still follow the base Command.
- **Ironhorn taunt**: invented by copying the Plains Warden's numbers (a tank holds enemies, §7.3; the bible text gives only the brace).
- **Soul ranks**: one uniform +25% per rank for the body and the line (§7.15 item 5 says ranks are not designed).
- Mark (`conduit-mark`) lasts 8 s per refresh; bark 10 s; both PLACEHOLDER. Executioner's mark lands after its first hit, so the first shot at a target cannot execute.
- Client UI (Command pips now show the discipline price; piece cards still show base cost), art, bot routes, T3/T4: untouched, as scoped.

## Files outside the brief I needed (not edited)
- `server/src/systems/combat/engine/combat.ts` (`runMonsterAttackOnMinion`) and `combat/status/monsterRiders.ts`: for exact bark/control absorption and exact damage refunds.
- `shared/src/classKits/configTypes.ts` and the protocol: for the Pack Strike order.
