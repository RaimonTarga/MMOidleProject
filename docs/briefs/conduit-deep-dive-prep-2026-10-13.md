# Conduit deep dive — prep pack (2026-10-13)

**What this is:** the starting material for the first class deep dive. Read it, then run
the session in the order of "The questions" below. The output is §7 of the
[class-first bible](../../design_docs/class-first-bible.md), written to the class template
(bible §6). Nothing here is decided unless it says so.

**Sources:** the [brief](class-first-rework-brief-2026-10-13.md) and its addendum,
[conduit-current-state.md](../conduit-current-state.md),
`shared/src/data/skillTree/t3Summoner.ts`, `shared/src/data/summoner.ts`,
[abilities-current-state.md](../abilities-current-state.md) "Summoner ability ownership".

## What the designer has already said

- Players: summons scaled from weapon damage and felt like another class; they wanted
  formation, roles and customization. (brief)
- Custom system: **Formation**, meaning position and role (tank, damage, support). Keep to
  three summon roles, bent by items and relics. Disciplines TBD. (brief)
- The player picks which minions to field; minions have default behaviors. (addendum)
- The weapon expresses the build: summon stats, how the budget is split between summon
  types, buffs to one type over another ("tank minions get more HP and thorns", "casters
  fire twice as fast"). (addendum)
- Armor bases shift who tanks: the summons or the Conduit. Synergies: exploding minions
  whose HP feeds their blast; tanky Juggernaut-style minions that scale off their HP.
  (addendum, second round)
- The Formation system probably replaces manual commands; a recall button and a recall
  ability probably stay. (addendum, second round)

## What exists today, and what it becomes

| Piece | Today | In the rework |
|---|---|---|
| Summon runtime | Minions are full ECS entities with stable logical slots; leash 320; hard cap 9 bodies | Keep |
| Formation profile | `resolveSummonerProfile`: the one place that turns (frame, range, specialization) into count, offense, HP, size, attack range, redirect | Keep the seam; its inputs become (discipline, roster, weapon, armor, relic) |
| One offense budget | Every body divides one formation offense budget (×1.2 so a full formation sits at the top of its tier) | Keep the idea: it is what makes "many small vs one big" a real choice |
| Weapon translation | Weapon Attack and cadence set summon damage | **Reversed** (brief + addendum) |
| Reconstruction | One shared FIFO queue, ~2–4 s per body, costs 30% of the summon's HP from the Conduit, never below 20% of the Conduit's HP; 4× faster out of combat | Open question 6 |
| Damage sponge | `redirectionPct` of the Conduit's damage goes to a living summon (Vigil 55%, Procession 30%, Harrier 8%) | The "who tanks" dial already exists |
| `conduitDefenseShare` | Authored per range (25/50/75%), **no consumer**: summons copy the Conduit's full plating and DR | The other half of the "who tanks" dial, waiting for armor bases to drive it |
| Area-hit sharing | One circle that hits N summons deals N^−0.5 to each, so a formation is never N player-hits | Keep |
| Attack modes | melee 18 px, reach 96 px, ranged 190 px (Vigil / Procession / Harrier) with their own FX | Salvage as role or position attack modes |
| Frames (T2 today) | Splinter 6 small, Consort 5 medium (bonus while every slot lives), Effigy 2 large (linked slam) | Discipline material |
| Specializations (T4 today) | Nine, below | Mastery material |
| Commands | Focus (click a monster), move (click ground), Recall (R, 3 s; bots can't press it), the Recall Summons rune (Low HP, Traveling, Enemy Charging), Step Back and Taunt runes driving summons | Formation rules replace most; recall stays as a button and ability |
| Abilities via summons | Shared abilities adapted: one summon delivers Slam/Snipe/Cull; Techniques are armed and delivered by summon hits; Charge sends the summons | The delivery seam (a summon performs a cast) is salvage; the shared abilities go |
| The Conduit's own attack | None (`CannotAttack`), except the Champion spec | Open question 2 |
| Art | 13 summon bodies (root skull; one per frame and spec; Covenanter twins); 9 Conduit player bodies (read as samey: robe, mask, hood are locked) | Reuse bodies as minion types; new minion art is cheap |

**The nine current specializations already fall into three families:**

| Family | Specs (frame today) | Mechanic |
|---|---|---|
| Many bodies | Kilnmaster (Splinter) | 8 smaller summons, stronger on-hit effects, faster rebuild |
| | Iconoclast (Splinter) | Deaths explode; every 8 s one summon is marked to shatter for a big blast, then rebuilds |
| | Inquisitor (Splinter) | Each living summon marks the focus target; marks stack damage taken |
| Few bodies | Idolwright (Effigy) | One enormous summon |
| | Covenanter (Effigy) | Two twins: one offense, one defense |
| | Champion (Effigy) | The Conduit fights beside one bonded summon |
| Drilled formation | Marshal (Consort) | Opening strikes; every 4 full cycles, a coordinated strike |
| | Chorister (Consort) | Each living summon adds a DoT "voice" to the target |
| | Ritualist (Consort) | Every 10 s each living summon gets 2 empowered charges |

## What we have learned (evidence)

- **Judge the Conduit on attrition, not damage.** The early-game problem was bodies dying
  to slams before Step Back unlocked (Cave mastery 2), not DPS. Bot summaries track
  `formationAttrition`.
- **Taunt on fragile summons is a net loss.** At the root, focused bodies died fast; it
  only pays on a tanky formation or in a party.
- **The T4 boss gap was the weapon, not deaths.** Slots were alive 94–100% of every T4 boss
  fight. A fast low-Attack weapon split over 5–6 bodies loses most of its damage to boss
  plating, and Orbit dragged bosses away from slow summons. Role-based summons remove the
  weapon trap by construction. After the fix the Conduit sat at ~0.82–0.84× the other
  classes' boss speed, "fragile by design". That target needs revisiting under the new
  <50% spread rule.
- **Bots can't press Recall**, so any answer that needs a button is invisible to balance.
  Whatever replaces it must be a rule.
- **Summon bodies get small fast.** Kilnmaster bodies read at ~17 px. Many-bodies designs
  need a readability floor.

## The questions, in order

Each fork lists starting options. The leans are Proposed, there to argue with.

1. **Fantasy in one line.** Today's art says a masked binder of bound familiars. Keep it?
2. **What does the Conduit itself do in a fight?**
   - (a) *Commander*: no attack, as today. The formation is the whole kit.
   - (b) *Channeler*: a visible tether to one summon (heal, empower) or one enemy; who
     gets the tether is a rule ("tether whoever is tanking").
   - (c) *Binder*: a resource that fills as summons hit and die, spent on rebuilding,
     empowering or detonating.
   - Lean: (b). It gives the Conduit something to watch and makes "who tanks" a live
     decision, not only a stat.
3. **What fills the formation?**
   - (a) *Slots × minion types*: N slots, each takes a minion type from a role.
   - (b) *A summon budget*: points; minion types cost points (a swarmling 1, a caster 2,
     a tank 3…). The weapon moves costs or adds points per role.
   - Lean: (b). It is your "how much budget do you have for different summons". It is
     already how the offense budget works, and it makes "many small" and "one big" the
     same system with different numbers.
4. **Roles and default behaviors.** What a tank, a damage dealer and a support do with no
   configuration; how many minion types per role at T1, T2, T4.
5. **Positions.** Does placement matter (front / flank / rear, reusing the 18 / 96 / 190 px
   modes), or does role imply position? The brief says the Formation is position *and*
   role. Possible T1 simplification: role implies position, free placement arrives later.
6. **Death and rebuild.** Keep the HP-paid reconstruction queue? It is the class's
   attrition loop, and it is what made the Conduit fragile. If death becomes a resource
   (Iconoclast, exploding minions), what does a death pay?
7. **Disciplines (3).** Starting candidates from the families above:
   - *Swarm*: many cheap bodies, death is the resource; packs.
   - *Bond*: one or two champions that grow over the fight; bosses.
   - *Chorus*: support-heavy, buffs the Conduit and the party; party.
8. **T3 flat picks (3)** that play differently in each discipline. Example of the shape:
   *Sacrifice* (consume a summon for a blast or a heal, on a rule) means constant
   detonations in Swarm and an emergency button in Bond.
9. **T4 masteries (9).** Mine the nine specs above; don't port them.
10. **Abilities as pieces.** Candidates: a new minion type, a formation order (charge,
    hold, recall), a role active (taunt, volley, heal). Which pick unlocks which.
11. **Items.**
    - Weapon: the budget split and role buffs.
    - Relic: bends the formation's rules (an extra slot, a role swap).
    - Armor: bases shift who tanks; class affixes such as "summon HP feeds blasts".
    - Charm: recovery for the Conduit vs the summons.
    - Two or three rule-benders.
12. **Defense and recovery.** The sponge, the tank minion, the Conduit's own recovery.
13. **The T1 form.** What a fresh Conduit sees in its first ten minutes. Candidate: two
    summons (a tank and a damage dealer), default behaviors, a two-slot formation screen.
14. **Party role.** Tank summons taunt for allies; support summons buff them.
15. **Automation and recall.** Which rules ship as defaults; recall as a rule plus a
    button; what replaces Step Back and Taunt for summons.
16. **Bot plan.** A default formation per discipline, and the intents the harness needs.

**Useful during the session:** a clickable mockup of the Formation screen once questions
3–5 have answers. It is the brief's open question "how automation is configured in UI",
and a picture decides it faster than prose.
