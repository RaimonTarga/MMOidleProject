# Conduit diagnosis — overnight endurance 01

No new combat observations. Raw evidence and SHA-256 inventory are in [the prior extracted evidence](../farming-sustain-01-preparation/conduit-evidence.json), extracted from the completed farming-stance-01 run at `f9dcde59217770390752f3ce0f089e323b0a6f37`. Current production gameplay source is byte-identical to that revision. The new preparation changes only bench preparation, recording, dispatch and tests.

## 1. Balanced Tundra stalls on repeated barrier absorption, not failure to engage

The Defensive row selects `node-t3-tundra-03_monster-1` (Glacier Bear). Its sampled HP remains **4,313** throughout. All **2,151** recorded direct damage events have **0 HP damage and 14 absorbed**, totaling **30,114 absorbed HP**. Attacks span 3.1–299.8 seconds with a maximum recorded damage-event gap of 300 ms. There is no recorded HP regain. The recorder's “unfinished damaged target” includes zero-HP-damage events; it is not proof the bear lost HP.

There are **94 distinct sampled aggro-session start timestamps**. `combat.ts` clears aggro when a selected minion is dead/missing; `targeting.ts` preserves `sinceMs` only while aggro remains attached. `monsterMechanics.ts::combatSession` reads that timestamp, and `refreshEnemyShieldState` resets the barrier on a changed session. The bear has an 8%-max-HP barrier, nominal 11-second cadence and 6-second lifetime. Thus repeated lost-minion engagements can repeatedly reinitialize its shell before the formation breaks it. This is the source-backed explanation supported by the session samples and absorption trace, not a claim of permanent authored invulnerability. The exact within-tick reset sequence is not present in the old recorder.

The matched Offensive row kills 17 targets; the first bear loses all 4,313 HP over its attacks. No evidence supports a travel/line-of-sight stall or HP-regeneration explanation for the Defensive row. Increasing replacement frequency does not address this reset mechanism directly. On-kill Recovery cannot bootstrap a fight with zero kills; Volcanic's continuous access is a separate effect.

## 2. Formation availability is not delivered damage, and replacements still cost HP

`conduitRecorder.ts::availability` divides living-slot offense weights plus any living owner Battle Bond weight by total authored profile offense weight. `beforeTick` time-integrates that ratio only after every slot has initialized; `finish` divides by initialized milliseconds. It does not measure landed DPS, range, target armor or shield penetration. Attack records separately measure synchronous primary-target HP decrease; delayed and secondary damage are not uniquely assigned to a originating attack.

Balanced Defensive has **84.54%** mean weight availability, zero zero-body/ready-unaffordable exposure, **93 combat deaths**, 92 paid replacements, **2,024 HP paid**, about **2,024 queue-scoped HP healing**, mean queue depth 0.742. All 92 replacement first attacks occur within 0–100 ms of recorded spawn, yet their primary HP decrease against the bear is zero. “First attack” is not “first useful HP damage.” There are no deliberate sacrifices in this row. Available output is missing for roughly 15.46% of initialized weighted time; intact is only the recorder's >=80% threshold.

Heavy Defensive Volcanic has **10 kills / 7 unfinished / 4 regained targets**, dies at 177.6 seconds, and has 4 recorded combat deaths, 332 HP paid and 255.312 queue healing. Its 4 replacement first attacks occur within 0–100 ms. Terminal removals of two bodies are marked unknown, not automatically hostile deaths. Near-zero affordability blockage does not imply free reconstruction. Read queue payments, enemy pressure and healing separately; rounded heal logs cannot close an exact HP accounting identity.

## 3. Covenanter's Graveyard failure is owner pressure with intact bodies

Covenanter Offensive dies at **71.7 seconds**, after 10 kills, with 100% recorded formation availability and **no replacement payments or queue healing**. Recorded incoming owner HP damage is **1,237.3**, rounded emitted owner healing totals **627**, terminal HP/barrier are zero, and the killing event is a **28 HP ranged Gravewright hit**. Full-body availability therefore does not establish farming viability or justify faster reconstruction. The separate T4 charm/policy screen directly tests owner sustain while retaining R2 and the legal formation.

## Generic kill Recovery and attribution

- Owner direct kills: `runPlayerAttack` constructs player attacker context and emits `onKill`.
- Summon direct kills: `runFormationAttack` calls `runPlayerAttack(world, owner, ...)` with formation/physical-minion metadata. Logical attacker remains the owner player, so the generic Recovery listener is eligible.
- Summon secondary kills: AoE and proc helpers call `emitPlayerMonsterOnKill`, retaining physical-source metadata but constructing a player-attacker context for the owner.
- Owner-attributed delayed kills: weapon DoT and class DoT paths use the same helper when their source resolves to an attached player. Missing owners cannot receive the hook. The delayed schema does not reliably retain the originating physical summon, so do not claim physical-source attribution beyond available evidence.
- `registerRecoveryOnKill` activates the **owner's** `recovery.killMs/killPct`. This is not summon healing. `applyHealToMinion` is a distinct recipient path. Repeated kills refresh one window; the Volcanic items use the current 4,000 ms default because they do not author a duration.

## Sealed disposition for this overnight packet

Block C is omitted: 0 of the optional 16 observations. The prior review already identified the barrier/session interaction; it did not produce a qualified candidate. Current gameplay source remains byte-identical to the reviewed R2 line. This preparation adds only bench duration/seed selection, read-only recording, orchestration and tests. No correctness fix, interval reduction, loadout search or class buff is adopted.

The original raw files have been rehashed during this preparation; see historical-evidence.json. These are historical measurements, not new overnight results. The exact tick-level barrier reset ordering, unique delayed/secondary attribution, source-specific effective owner healing and overheal remain unavailable. A future narrow correction must preserve genuine disengagement and other session-scoped enemy behavior; that question does not block A/B.

The sustain receipt's generic Conduit resolves to breadth-t4-conduit-heavy-a, summoner-heavy-t3-a, displayed as Covenanter. Its omitted Expose Weakness is retained in both overnight charm arms. Avenger resolves to breadth-t4-squire-heavy-a, cooldown-heavy-t3-a. Neither identity is inferred from an ambiguous class label.
