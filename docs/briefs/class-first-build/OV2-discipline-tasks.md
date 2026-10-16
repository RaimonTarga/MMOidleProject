# Discipline coverage (OV2-*), 2026-10-16

Written by the conductor after the overnight polish ([OVERNIGHT-REPORT.md](OVERNIGHT-REPORT.md)). The
overnight round made one discipline chain per class pass the bar (T1-T4, the auto config, fresh
character). The designer will try the others: **this round makes the other two disciplines of each
class pass the same bar**. Designer's calls already taken for this round: Avoid Hazards is a default
standing order (65a180a5); the Mountain armor carries its damage cap (6f2bc799); the Spirit's storm rule
stays as it is (the playtest judges it).

Read first, in your worktree: [AGENT-RULES.md](AGENT-RULES.md), `CLAUDE.md`, the Common part of
[OV-overnight-tasks.md](OV-overnight-tasks.md) (lanes, the bot, the sim, file ownership, reports: all of it
still applies, except where this page says otherwise), your class's overnight report `reports/OV-<CLASS>.md`
(what was tuned, what is open), your class's bible section (x.5 disciplines, x.6 specializations, x.7
leaves, x.13 bot plan: the default configuration per discipline) and [OVERNIGHT-REPORT.md](OVERNIGHT-REPORT.md).

## The bar, for each of your two other disciplines

A route chain `<class>-t4-<discipline>` (or the class's existing naming) that replays T1, picks the
discipline at T2, a specialization at T3 and a leaf at T4 (pick the bible x.13 default for that discipline,
or the most natural one, PLACEHOLDER), crafts the gear that discipline wants (the x.16 tables and your
class's existing route gear), and, **with the auto config**, clears every boss T1-T4 within a few tries with
no death loops, stalls or crashes, from a fresh character, on your lane. The chain already verified (the
overnight default) must still pass: re-sim it after any change that touches it.

## How

1. Register the two chains as routes (`bot/src/routes/<class>T*.ts` and the registry entries for your class
   only: `bot/src/routes/index.ts` is shared, add your lines and nothing else). Keep route tests passing.
2. Build what the auto config lacks for those disciplines (an auto default per discipline in
   `shared/src/classKits/configs/<class>.ts`, natural rules for clips or pieces the discipline owns), then
   size numbers with `server/bench/classBossSim.ts` (`--skills <discipline,spec,leaf>`, the chain's gear,
   `--cleared` for trophies) at every tier's bosses. Prefer discipline-specific numbers (the discipline's
   pieces, its gear lines) over the class's shared ones; if a shared class number must move, re-sim the
   default chain.
3. Live: reset and start **both your lanes**, run one chain on each from a fresh character (`--account`
   per chain), fix and resume (`--fresh=false`) until both pass, then if time allows one clean run each.
4. Note: the boss sim strips dungeon guards. The overnight Striker death-looped at a nine-guard pack the
   sim never met; watch `dungeon-guard` events (`outcome: "gave-up"`) on the lane.

## Lanes and agents (two waves)

| Wave | ID | Class | Lanes |
|---|---|---|---|
| 1 | OV2-SLINGER | Slinger: Siege, Trickshot (and the auto Loadout's T2-T4 clips, which never load today) | 1, 2 |
| 1 | OV2-SPIRIT | Spirit: Overflow, Reservoir (they lose to sustained pressure in the sim) | 3, 4 |
| 1 | OV2-CONDUIT | Conduit: Swarm, Elite (their x.13 auto defaults are not built) | 5, 6 |
| 2 | OV2-STRIKER | Striker: Light, Heavy (untested past T2) | 1, 2 |
| 2 | OV2-SQUIRE | Squire: Avenger, Juggernaut | 3, 4 |
| 2 | OV2-APPRENTICE | Apprentice: Poison, Frost (won T2 in the sim, never live) | 5, 6 |

Lane 0 is the conductor's. Keep token use lean: the usage limits stopped every agent twice in the
overnight round. Prefer runSummary digests and the sim over long log reads, and do not idle-poll.

## Report

`reports/OV2-<CLASS>.md` on your branch: per chain a per-tier table (bosses / attempts, deaths, minutes,
pass), every number changed (file, old, new, why, evidence), routes added, what is still broken, questions
for the designer. Commit small as you go. Finish with your lanes and bots stopped.
