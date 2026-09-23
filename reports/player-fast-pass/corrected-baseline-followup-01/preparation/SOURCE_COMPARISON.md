# Source comparison and interpretation boundaries

The execution source is `22a349bf7dab6e42a412a231444fa4b8df41f28e`, built from the explicitly reviewed `f58359036bca3cfeebe482e5bfdd1f9cbb355c0a`. The newer `5b81ddf5` corpse-lifetime change was inspected for source selection but was not imported: it edits shared corpse handling and introduces an encounter-specific override. There was no Wasteland combat, corpse audit or raw-trace review. No unfinished worktree was used.

## Current support boundary

Only the existing survey/boss/progression support needed to construct, qualify, dispatch and record this packet was imported. The production changes relative to f583 are the historical benchmark-only `World.fixedBiomeMasteryPlayers` set and the corresponding mastery/XP reward gate. The set is empty in live worlds and populated only for these synthetic snapshots. This preserves the previous fixed-mastery protocol. Ability, summoner, weapon, enemy and Heat production modules are untouched. Root reconstruction remains 3,500 ms; accepted framed/session/target behavior is preserved. No candidate class patch or root reconstruction factor was imported.

Cases were copied from completed manifests, with historical receipts/outcomes retained in `server/bench/balance/correctedBaselineReferences.json`. New IDs begin `cbf01-`; new block/order/reference metadata changes no package input. Qualification checks exact declared stance/ordered abilities/ordered Rune rules/upgrade level, skill path, equipment and per-item upgrades, mastery, RP budget and initial full HP/barrier against completed historical receipts. Production recalculates current stats. There is no forced historical stat equality.

The current farm sample retains `activeBuffs` from the existing composed player view alongside existing sustain phase, HP/barrier, incoming DoT, hazard contacts, enemies, owner target and minion samples. This narrowly retains the existing Heat display signal; it is not a new damage-attribution engine. Historical samples may lack that field. Use current Heat/phase trajectories, events and exposure records where supported; exact historical Heat curves or damage-source splits may be unavailable. Do not infer direct/crowd/DoT/Heat attribution from terminal HP alone.

## Historical anchors and actual differences

| References | Measured source | Publication source |
|---|---|---|
| 28 T4 rows | 3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e | 185b22bc136e30c33f16be9dc61f753dc5fe5566 |
| 4 T1 developed Conduit rows | c14d62afa2267b57207e1ef8b65c3fd90144c0a6 | 575396eef0dd78e51127e6e67023d8ab16ad33c7 |

`t4-authoritative.diff` and `t1-authoritative.diff` retain exact source differences to the correction baseline, including benchmark mastery-hook removal in develop (restored for this execution). They are comparison evidence, not patches to apply. Gameplay assets under client/public/assets are unchanged between either historical anchor and f583. Both historical runtimes and current runtime use Node v22.16.0 and hitbox SHA256 `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`. All 32 current initial roster hashes match the corresponding completed historical receipts.

- Conduit routing/default engagement changes span summoner AI/profile, combat, ability arming/targeting/casting/firing/effects and formation movement. Champion remains the owner-attacking exception. Selected T4 packages have only Expose Weakness: they test native engagement/armed delivery, not Power Strike/Slam, Charge or Frenzy. T1 Plains has Sweep; Cave has no offensive Technique. Guards use owner conditions.
- T4 Volcano now has coolingRateMult=2: low-stack cooling interval is 1,500 ms instead of 3,000 ms, retaining the stack-dependent scale and production buildup/floors/engagement rules. There is no waiting Rune or new Heat treatment. T1 historical source already has the same Heat code, and its selected fixtures are not Volcano.
- The adopted Spirit Light/Balanced numerical reduction is already present in the historical T4 source. Thus Aetherist here is not a fresh test of that reduction. The T1 anchor predates those frame numbers, but all four selected T1 rows are no-frame Conduits. Root and Heavy Spirit are unchanged. T4 roots/frame source differences are descriptive copy only.
- The weapon reservoir correction retains resolved empowered damage in reservoir basis. Production `weaponDotProfileForWeapon` returns no profile for every selected weapon: jungle-deathfang-rapier, chaotic-axe, mountain-warmaul, graveyard-plague-axe and volcanic-eruption-lash. Therefore no selected row exercises this reservoir interaction; neither a class burn nor a weapon name establishes reservoir applicability.
- Movement-only Hamstring remains current. Neither historical anchor differs in its monster-control module, and no selected package equips Hamstring. Other skill descriptions and DPS estimates changed; descriptions are not new numerical treatments or measured delivery.

This is a correction-set comparison, not one-change causal isolation. Matching inputs, seed, hitbox, runtime and initial roster justify a compatible initial comparison; changed behavior can immediately change subsequent exposure. `historical-comparison.json` classifies preparation comparability, with outcome/evidence evaluation pending execution. Missing future mechanism evidence may require downgrading a row to partial/contextual; missing records remain unavailable and never trigger extra combat.

## Decision register carried forward

- Spirit adopted patch: retained; no new adoption proposed.
- Root Conduit reconstruction: unchanged at 3,500 ms. No 2500/3500 factor or payment/damage buff.
- Wasteland boss: historical special-challenge evidence under its measured source; excluded by designer intent and pending encounter work. Old deaths are not invalidated and do not block this class screen. Graveyard mastery 4 and lawful gear remain.
- T4 selected setups: unchanged and not claimed optimal. If output remains weak, distinguish code behavior, opportunity/delivery and build limitation. Present the exact affected build and ask: “Which items and setup would you use for this path in this encounter at this gear stage, and why?” No rescue build is authorized.
- Other unresolved T2/T3 questions: remain separate and open. Preparation has no new combat finding and closes no gameplay issue.

Specific unresolved decisions carried from the completed T4 register (185b22bc, REPORT.md): T2 Plains opening remains a designer choice between earlier reachable adds, reduced initial pressure or specified player defense; T3 Jungle/first Volcano setup and expected capability remain unresolved; T3 Apprentice Volcano changed Sweep/Brace setup is confounded, and a reserved finishing burst remains untested. This packet closes none of them.
