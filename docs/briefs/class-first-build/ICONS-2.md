# ICONS-2: icons for the T2–T4 pieces, the T2–T4 trophies and the discipline crests

Two tasks, same rules, different files, so they can run at the same time:

| Task | What | Count | Agent | Worktree · branch |
|---|---|---|---|---|
| **ICONS-2A** | Striker, Squire and Apprentice pieces (T2–T4 and discipline pieces) + 15 discipline crests | 67 generated, 3 copied | Codex (image generation) | `../mmo-rw-icons-2a` · `rw/icons-2a` |
| **ICONS-2B** | Slinger and Spirit pieces (T2–T4 and discipline pieces) + every T2–T4 trophy | 66 generated | Codex (image generation) | `../mmo-rw-icons-2b` · `rw/icons-2b` |

**Read first:** `AGENT-RULES.md` (this folder); **`ICONS-T1.md` (this folder): the first batch.
Its style section, reference images, colour language, Slinger clip colours, trophy glint, prompt
structure and file workflow all apply unchanged here.** Then
`design_docs/visual_and_aesthetics_design/openai-icon-generation.md` (the recipe; its
"Class-tree emblem pass" section is the crest recipe) and `tools/prepare-openai-icon-previews.cjs`.
For what each piece or trophy does in the game: `design_docs/class-first-bible.md` §8.16 (Squire),
§9.16 (Apprentice), §10.16 (Slinger), §11.16 (Spirit), §12.16 (Striker), §7.16 (Conduit Souls);
the disciplines are §8.5, §9.5, §10.5, §11.5, §7.5 and §12.5.

## Why

ICONS-T1 drew the Tier 1 kit (shipped in `client/public/assets/concept-icons/class-pieces/` and
`.../trophies/`). Every class now has its T2–T4 kit as data, and the Passive Tree's discipline
nodes (the T2 choice) have no crest. This batch completes the set, **in the same style as T1**.

## Style: the T1 batch is now the reference

- Same rules as ICONS-T1 (semi-painterly, one centered bold silhouette, rim lighting, broad
  detail, near-black `#11161d` backdrop edge to edge, readable at 32–52 px; no text, figures,
  frames, borders or scenes).
- **Attach as style references** (full-resolution, in the main checkout, read-only):
  four of the T1 class icons from
  `C:\Users\osaif\Documents\Claude\Projects\MMO idle\art\candidates\openai-icons\class-pieces\`
  of the same class as the icon you draw (for trophies, from `...\trophies\`), plus
  `...\abilities\sweep.png` as the original anchor. Say in the prompt: "a new icon from the
  same set as the reference icons: match their rendering, lighting, level of detail and
  backdrop exactly."
- **Class anchors** (unchanged): Striker polished steel; Squire heavy iron with ember-orange
  light; Apprentice violet sigil runes plus its school's colour (poison acid green, fire
  orange-red, frost pale cyan); Slinger blackened steel and brass, the round's own colour;
  Spirit white-blue lightning on storm violet (wind pieces: pale grey-blue gusts on the same
  violet); Conduit Souls spectral teal ghost-fire.
- **Biome hints** for T2–T4 subjects (use when the piece answers that biome's threat): Jungle
  vines, ambush, hunting; Desert sand, marks, the sun; Tundra ice, frost shells, chill;
  Volcanic obsidian, magma, heat; Graveyard (the bible's Wasteland) bone, grave light, the risen
  dead; Trench deep water, brine, the abyss.
- **Slinger rounds new in T2–T4:** give each its own colour, distinct from the T1 six and from
  each other, and list the hex you chose per round in your report (the HUD ring will use them).
- **You write each icon's subject and palette.** The tables below give the id, the name and
  what it does in the game; pick one bold readable object or effect that shows what it does
  (the ICONS-T1 tables are worked examples). Write your subject/palette choice into your
  report's table, one line per icon.
- **Trophies** keep the single thin warm-gold glint on the subject's key edge.
- **Rank-ups need no icon** (they reuse the piece's own), so none are listed.

## Crests (ICONS-2A only)

The discipline is the class's Tier 2 choice. **Asset type:** `heraldic fantasy MMO class-tree
emblem displayed at 96px`, following the guide's crest recipe: one heraldic silhouette, the
class crest as the lineage anchor (attach the class's full-res crest from
`...\openai-icons\classes\<archetype>.png`: Squire `cooldown`, Apprentice `dot`, Slinger
`reload`, Spirit `energy`, Conduit `summoner`), the discipline's fantasy as the subject. The
three of one class must read as siblings that clearly differ.

- Add a group `['disciplines', 96, 54]` to `tools/prepare-openai-icon-previews.cjs` (like
  `frames`). Full-res sources go to `art/candidates/openai-icons/disciplines/<id>.png`; the
  script writes `client/public/assets/concept-icons/disciplines/<id>.png`.
- **The Striker's three are copied, not drawn:** its disciplines are the old frames' Light,
  Balanced and Heavy. Copy the shipped 96 px files
  `client/public/assets/concept-icons/frames/cadence-light.png`, `cadence-balanced.png`,
  `cadence-heavy.png` to `client/public/assets/concept-icons/disciplines/striker-light.png`,
  `striker-balanced.png`, `striker-heavy.png`.
- Don't wire crests into client code: the class screen task does that.

## Where files go

Pieces: `art/candidates/openai-icons/class-pieces/<id>.png` → `concept-icons/class-pieces/<id>.png`.
Trophies: `art/candidates/openai-icons/trophies/<id>.png` → `concept-icons/trophies/<id>.png`.
(Both groups already exist in the preview script.) Run
`node tools/prepare-openai-icon-previews.cjs` and copy the review sheet
`art/candidates/openai-icons/contact-sheets/downscale-review.png` to
`docs/briefs/class-first-build/reports/icons-2a-review.png` (or `icons-2b-review.png`).
**ICONS-2B: don't edit the preview script** (2A adds the crest group; your groups exist).
Don't overwrite any existing icon. Filenames are the ids, exactly.

Check every icon at its in-game size (44 px; crests 54 px) and regenerate any that don't read
or that look like a sibling in the same family.

---

## ICONS-2A: Striker, Squire, Apprentice pieces (52)

| id | Name | Family | Learned at | What it does |
|---|---|---|---|---|
| `striker-whirlwind` | Whirlwind | damage | plains T2 | You spin through every enemy around you three times. |
| `striker-feint` | Feint | attack-setup | forest T2 | You feint instead of striking: no damage, but your next beat is a critical hit. |
| `striker-armor-break` | Armor Break | attack-setup | mountain T2 | You crack the target's plating for a few seconds. |
| `striker-concuss` | Concuss | finisher-setup | cave T2 | You stun the target for a moment. |
| `striker-charge` | Charge | damage | jungle T2 | You open the combo with a dash to the target and a strike, catching enemies that run or keep their distance. |
| `striker-pin` | Pin | finisher-setup | desert T2 | You root the target in place, so it can't back away from you. |
| `striker-earthsplitter` | Earthsplitter | damage | mountain T3 | You wind up before the finisher, then slam down through a line of enemies. |
| `striker-upheaval` | Upheaval | finisher-setup | cave T3 | The ground erupts under the target and knocks it down, along with every enemy touching it. |
| `striker-hemorrhage` | Hemorrhage | damage | swamp T3 | You open a deep bleed that outlasts Rend. |
| `striker-triple-cut` | Triple Cut | damage | jungle T3 | You cut three times in quick succession, and each cut sets off your hit effects. |
| `striker-shadowstep` | Shadowstep | attack-setup | desert T3 | You open the combo by stepping behind the target, and your next beat is sure to be a critical hit. |
| `striker-icebreaker` | Icebreaker | damage | tundra T3 | You hit much harder against a target behind a shield or shell. |
| `striker-overheat` | Overheat | attack-setup | volcanic T3 | You open the combo overheated: your beats swing much faster, but you take more damage until the finisher. |
| `striker-avalanche` | Avalanche | finisher-setup | mountain T4 | You wind up before the finisher, then charge through a line of enemies and knock them all down. |
| `striker-frostbind` | Frostbind | finisher-setup | tundra T4 | Ice roots everything around the target for a moment. Bosses immune to roots ignore it. |
| `striker-bloodrush` | Bloodrush | attack-setup | jungle T4 | Without a cast, your beats come faster for the rest of the combo. |
| `striker-coup-de-grace` | Coup de Grâce | damage | desert T4 | You hit much harder against a target low on HP. |
| `striker-magma-breaker` | Magma Breaker | damage | volcanic T4 | You wind up before the finisher, then strike the target and everything around it, harder against a shell. |
| `striker-reaping-arc` | Reaping Arc | damage | graveyard T4 | You cut a wide arc through every enemy around you. |
| `striker-pressure-point` | Pressure Point | finisher-setup | trench T4 | Your next finisher hits this target much harder. |
| `squire-stand-fast` | Stand Fast | guard | plains T2 | When an enemy charges at you, you brace for it: the charge stops dead and the charger staggers. |
| `squire-unshaken` | Unshaken | guard | forest T2 | When a stun, root or knockdown lands on you, you spend Resolve to break free. |
| `squire-splitting-blow` | Splitting Blow | counter | mountain T2 | When your target raises a shield or barrier, you strike a blow that hits barriers twice as hard. |
| `squire-earthstamp` | Earthstamp | hold | cave T2 | When an enemy burrows or dashes unseen toward you, you stamp the ground: it surfaces at your feet, staggered. |
| `squire-watchful` | Watchful | guard | jungle T2 | An ambusher's first hit on you is caught on your shield, at no cost, and fills your Resolve. |
| `squire-challenge` | Challenge | hold | desert T2 | When an enemy hits you from range, kites you or attacks an ally, you pull it onto you. |
| `squire-anchor` | Anchor | guard | swamp T3 | When something drags or pushes you, you plant your feet: you don't move, and it fills your Resolve. |
| `squire-chain-hook` | Chain Hook | hold | jungle T3 | When your target flees, you hook it and drag it back. |
| `squire-frostward` | Frostward | guard | tundra T3 | When the Chill on you is about to freeze you, you hold it there for a few seconds instead. |
| `squire-backdraft` | Backdraft | counter | volcanic T3 | When a fire attack or burning shot comes at you, you throw the heat back at its source. |
| `squire-disarm` | Disarm | counter | desert T4 | When the enemy you fight starts a big attack, you disarm it: the attack lands at half strength. It isn't a stun, so it works even on bosses that can't be controlled. |
| `squire-lay-to-rest` | Lay to Rest | hold | graveyard T4 | When a fallen enemy rises near you, you strike it down before it stands. |
| `squire-lie-in-wait` | Lie in Wait | counter | trench T4 | When your target dives out of reach, you hold your slam, and it lands twice as hard when the target comes back. |
| `squire-parry` | Parry | counter | discipline | When a telegraphed melee blow is aimed at you, you negate it and counter at once. It costs more than Guard and fails against ground telegraphs and ranged shots. |
| `squire-intercept` | Intercept | hold | discipline | When an ally stands under a telegraph or runs low on HP, you step in front of them and take the blow. |
| `squire-unbowed` | Unbowed | guard | discipline | When an untelegraphed blow takes a big share of your HP, you spend Resolve to take it on your armor, where your plating counts double. |
| `squire-last-breath` | Last Breath | emergency | discipline | When your HP runs low, you spend your whole Resolve bar to heal. |
| `apprentice-wither` | Wither | poison | discipline | Spends the target's sigils so it deals less damage for a few seconds. |
| `apprentice-fuse` | Fuse | fire | discipline | The target's sigils blow after a short fuse, and every sigil you lay on it meanwhile adds to the blast. |
| `apprentice-cold-snap` | Cold Snap | frost | discipline | Spends the target's sigils to chill every enemy around it. |
| `apprentice-blast-back` | Blast Back | fire | plains T2 | Sets off a charging enemy's sigils: the blast stops its charge and knocks it back. |
| `apprentice-sear` | Sear | fire | mountain T2 | Spends a shielded target's sigils to burn through its barrier twice as hard. |
| `apprentice-seep` | Seep | poison | cave T2 | When an enemy burrows or dives out of reach, its sigils keep ticking, doubled, until it surfaces. |
| `apprentice-snag` | Snag | frost | jungle T2 | A fleeing or kiting enemy full of your sigils is rooted for a moment. |
| `apprentice-recoil` | Recoil | poison | desert T2 | When an enemy's mark, slow or curse lands on you, its caster catches a full bar of your sigils. |
| `apprentice-spore-burst` | Spore Burst | poison | swamp T3 | Spends the target's sigils to burst them onto every enemy around it at once, each catching half. |
| `apprentice-signal-fire` | Signal Fire | fire | desert T3 | When you detonate your target, your sigils on the enemy furthest from you go off too. |
| `apprentice-melt` | Melt | fire | tundra T3 | When the Chill on you reaches its threshold, you spend the nearest enemy's sigils to melt it off. |
| `apprentice-cinderfall` | Cinderfall | fire | volcanic T3 | Sets off the target's sigils in a blast that hits everything around it, each enemy taking a share. |
| `apprentice-frostcrack` | Frostcrack | frost | tundra T4 | Seizes a shielded or shelled enemy and cracks its shell open at once. |
| `apprentice-pyre` | Pyre | fire | graveyard T4 | A fallen enemy carrying your sigils burns and cannot rise, and the sigils it still carried pass on. |
| `apprentice-transference` | Transference | poison | trench T4 | Spends the target's sigils to move one of the debuffs on you onto it. |

## ICONS-2A: discipline crests (15 drawn, 3 copied)

| id | Class | Discipline | Fantasy, then what it does |
|---|---|---|---|
| `squire-avenger` | Squire | Avenger | I read every blow and answer it. Landed answers fill your Resolve much more, plain hits less. Every landed answer is followed by a quick strike at the attacker, paid from Resolve, so you slam less often. |
| `squire-bulwark` | Squire | Bulwark | Everything comes to me, and nothing gets past. Every enemy on you fills more Resolve, by its hits and just by being there. Your slams hold: everything they hit turns on you, and the circle grows with the enemies on you. |
| `squire-juggernaut` | Squire | Juggernaut | My armor is my weapon. Your armor and max HP fill Resolve steadily, hit or not, and hits fill less. You spend it on one huge slam, the biggest hit you have. |
| `apprentice-poison` | Apprentice | Poison | I touch one, and the whole pack is already dying. Your sigils turn to poison: every enemy holds more of them, and they tick fast. Spread happens on its own: a full enemy keeps passing sigils to its nearest neighbour, and a dying one passes on what it still carried. |
| `apprentice-fire` | Apprentice | Fire | One spark, and they go up one after another. Your sigils become burn, and your hits strike harder on a target full of it. A detonation throws burn onto every enemy around it, and any enemy it fills goes off too, each once per chain. |
| `apprentice-frost` | Apprentice | Frost | I lock the giant in ice, then break it. Your sigils turn to frost: fewer and heavier, each slowing its carrier a little, and Seize freezes its target (a boss that cannot be held turns brittle for a few seconds, taking more damage). A Detonate on a frozen or brittle target shatters it in a heavy hit whose cold chills its neighbours. |
| `slinger-gunslinger` | Slinger | Gunslinger | Two guns, never still for long. You hold two of whatever gun you carry, each with half the clip and its own clip type. Shots alternate between them, and both reload together in a quick spin. |
| `slinger-siege` | Slinger | Siege | I dig in and shell everything. You load a big drum, and the reload is long. Every round charges a siege gun on your back, and reloading fires it where your target stands, a blast made of the rounds you fired. |
| `slinger-trickshot` | Slinger | Trickshot | Every clip ends with the impossible shot. Your last round flies to a target your rule picks, anywhere in range, past whatever stands in the way, and it hits harder. |
| `spirit-overflow` | Spirit | Overflow | I'm crackling with more than I can hold, and it pours off me. The bottle has a brim, not a cap. Flow past the brim arcs off you into the nearest enemies, faster the more you hold, and that overflow shields you too. |
| `spirit-tide` | Spirit | Tide | I gather, I break over them, I pull back. The storm comes in a tide. In the ebb you cannot spend, the flow runs fast, and you drift back. In the surge you cannot gather, spends cost less, and you close in. You ebb to full, then surge down to the floor. |
| `spirit-reservoir` | Spirit | Reservoir | A deep storm behind a dam; when it's enough, the dam breaks. The bottle is much deeper. You release the whole bank when it is enough to finish the target, or at a mark you set. A full bank makes you nearly untouchable, and releasing it leaves you bare. |
| `conduit-swarm` | Conduit | Swarm | A flood of cheap, disposable summons. Your cheapest summons come two for the price of one, and they rebuild for free. |
| `conduit-pack` | Conduit | Pack | A team where every member has a different job. A kind of summon you are not fielding yet costs less to add, and a summon is never free. Every few seconds, each different kind strikes your target together, and you can call that strike early. |
| `conduit-elite` | Conduit | Elite | A few champions. Every summon costs more to field. Each one is tougher, hits harder, and gains an extra that deepens its job. |

Copied, not drawn (above): striker-light, striker-balanced, striker-heavy.

---

## ICONS-2B: Slinger and Spirit pieces (30)

| id | Name | Family | Learned at | What it does |
|---|---|---|---|---|
| `slinger-buckshot` | Buckshot | damage | plains T2 | Each round sprays a cone of pellets that hits harder up close. The pellets stop a charging enemy in its tracks. |
| `slinger-shellbreaker` | Shellbreaker | utility | mountain T2 | Each round hits barriers and shields twice as hard. |
| `slinger-tracer` | Tracer | utility | jungle T2 | Each round tags its target, so it can't hide, vanish, or break away from you. Ambushers in cover are revealed. |
| `slinger-hollow-point` | Hollow-point | damage | desert T2 | Each round hits harder when the target is below half health. |
| `slinger-seeker` | Seeker | utility | cave T3 | Rounds find a target that has burrowed, dived, or gone out of sight, and they hit lighter. |
| `slinger-acid` | Acid | damage | swamp T3 | Instead of poison, each round eats a little of the target's plating. It stops eating past a point. |
| `slinger-tether` | Tether | control | desert T3 | A target hit by several rounds in a row can't dash or teleport away for a moment. |
| `slinger-frost` | Frost | control | tundra T3 | Each round chills the target, so it attacks and moves slower. The chill stops growing, and it never freezes. |
| `slinger-incendiary` | Incendiary | damage | volcanic T3 | Each round sets the target burning. The burn stops growing, and it never detonates. |
| `slinger-thermite` | Thermite | damage | volcanic T4 | The burn eats shells. Obsidian and ice shells take it twice as hard. |
| `slinger-hallowed` | Hallowed | damage | graveyard T4 | Risen enemies take twice as much from these rounds, and they rise weaker. |
| `slinger-exploit` | Exploit | damage | trench T4 | Each round hits harder for each different harmful effect on the target. |
| `spirit-ball-lightning` | Ball Lightning | strike | discipline | A slow orb drifts through the pack and zaps everything it passes. |
| `spirit-storm-surge` | Storm Surge | strike | discipline | Your surge opens with a wave that rolls through the enemies in front of you. |
| `spirit-cloudburst` | Cloudburst | strike | discipline | Everything above your floor goes into one bolt, sized by what you spend. |
| `spirit-gale` | Gale | squall | plains T2 | A gust in front of you blows enemies back a few steps. A charge caught in it stops dead. |
| `spirit-hailstorm` | Hailstorm | strike | mountain T2 | Hail pelts the area around the target for a few seconds. Hailstones hit shields and barriers twice as hard. |
| `spirit-updraft` | Updraft | calm | cave T2 | When the ground is about to erupt under you, a gust lifts you clear. |
| `spirit-flare` | Flare | squall | jungle T2 | A flash around you reveals hidden ambushers and staggers them. |
| `spirit-dust-devil` | Dust Devil | squall | desert T2 | A whirlwind runs down the farthest enemy attacking you and drags it toward you. |
| `spirit-downburst` | Downburst | squall | mountain T3 | A column of wind slams down on a charging enemy and pins it for a moment. |
| `spirit-tailwind` | Tailwind | calm | swamp T3 | When something drags or shoves you, a gust carries you back. |
| `spirit-forked-bolt` | Forked Bolt | strike | jungle T3 | Splits toward the two enemies farthest from you, catching the ones that flee. |
| `spirit-foehn` | Foehn | calm | tundra T3 | When the Chill on you nears its threshold, a warm wind melts it back down. |
| `spirit-ash-lightning` | Ash Lightning | strike | volcanic T3 | The volcano's own lightning. It hits harder for each step of the fight's Heat. |
| `spirit-sleet` | Sleet | strike | tundra T4 | A narrow sheet of sleet on one target. It breaks shells three times as fast. |
| `spirit-ground-charge` | Ground Charge | squall | jungle T4 | A charged patch under you. The first enemy to leap at you is thrown back and stunned. |
| `spirit-dust-wall` | Dust Wall | squall | desert T4 | A wall of dust rolls out from you in every direction, pushing everything back. |
| `spirit-thunderstorm` | Thunderstorm | strike | graveyard T4 | For a few seconds, lightning strikes at random among every enemy around you. |
| `spirit-maelstrom` | Maelstrom | squall | trench T4 | When the enemy you fight dives out of reach, a whirlpool drags it back to the surface. |

## ICONS-2B: trophies (36)

Each with the thin warm-gold glint. Conduit trophies are Souls (a boss's spirit fielded as a
summon): draw the Soul's creature as a spectral teal ghost-fire silhouette, like the T1 Conduit
trophies.

| id | Name | Kind | What it does |
|---|---|---|---|
| `striker-relic-jungle` | Pounce | weight | Your finisher leaps to the target, reaching it even if it ran, and hits harder the farther it leaps. |
| `striker-relic-desert` | Verdict | weight | Your finisher kills the target outright once its HP is low enough. |
| `striker-relic-tundra` | Hoarfrost | spark | Every beat of your next combo slows the target a little more. Bosses immune to slows ignore it. |
| `striker-relic-volcanic` | Eruption | weight | Your finisher hits the target and everything around it, harder against a target with a shell up. |
| `striker-relic-graveyard` | Grave Toll | spark | Your next combo's beats hit harder for every enemy in the fight. |
| `striker-relic-trench` | Deep Pressure | weight | Your finisher deals more damage the more HP the target has left. |
| `squire-relic-jungle` | Strangler Vine | slam | Before your slam lands, it pulls every enemy in a wide ring to you, fleeing ones included. |
| `squire-relic-desert` | Executioner's Oath | resolve | Your slam can fire early on an enemy below a third of its HP, with whatever Resolve you have. |
| `squire-relic-tundra` | Deep Winter | resolve | Your Resolve bar can fill past full, up to double, and an overfull slam hits as hard as two. |
| `squire-relic-volcanic` | Kindling | resolve | Everything that fills your Resolve fills a bit more the longer the fight has lasted. |
| `squire-relic-graveyard` | Charnel Ring | slam | Your slam's circle widens with every enemy in the fight. |
| `squire-relic-trench` | Undertow | slam | For a few seconds after your slam, the target can't dive, burrow or flee. |
| `apprentice-relic-jungle` | Scent | sigil | Your sigils on an enemy that flees or kites never fall off while it runs, and they tick faster. |
| `apprentice-relic-desert` | Dune Wind | payoff | Your Spread or chain can leap any distance to an enemy carrying your sigils. |
| `apprentice-relic-tundra` | Frostheart | payoff | Every Seize also leaves its target brittle for a few seconds after. |
| `apprentice-relic-volcanic` | Magma Core | sigil | Your sigils on a shelled enemy keep ticking at full strength through the shell. |
| `apprentice-relic-graveyard` | Dirge | payoff | Your Detonate also sets off your sigils on every risen enemy in the fight. |
| `apprentice-relic-trench` | Pressure Fuse | payoff | A Detonate on an enemy out of reach waits, then goes off twice as hard when it resurfaces. |
| `slinger-relic-jungle` | Hunter's Round | round | Your last round follows its target, can't miss a fleeing enemy, and hits harder the farther it flies. |
| `slinger-relic-desert` | Bounty Round | round | Your last round finishes a target below a threshold of its health. |
| `slinger-relic-tundra` | Rime Round | round | Your last round leaves frozen ground that slows enemies standing on it. |
| `slinger-relic-volcanic` | Cinder Round | round | Your last round sets everything around the target burning. |
| `slinger-relic-graveyard` | Toll Round | round | Your last round hits harder for every enemy in the fight. |
| `slinger-relic-trench` | Harpoon Round | round | Your last round harpoons the target. For a few seconds it can't dive, burrow, or flee. |
| `spirit-relic-jungle` | Running Storm | spend | A spend whose target flees follows it and lands harder the farther it ran. |
| `spirit-relic-desert` | Sandstorm | storm | While you are above your floor, a ring of blowing sand slows the enemies inside it. |
| `spirit-relic-tundra` | Ice Storm | spend | Every spend glazes the ground under its target. Enemies on it are slowed, and bosses that accept no control ignore it. |
| `spirit-relic-volcanic` | Pyrocumulus | storm | A full storm boils over. While you stay full, a burst strikes around you every few seconds. |
| `spirit-relic-graveyard` | Stray Bolts | spend | Every spend also strikes a random enemy elsewhere in the fight. |
| `spirit-relic-trench` | Depth Charge | storm | While your target is out of reach, your storm gathers twice as fast. Your first spend when it resurfaces is twice as big. |
| `conduit-relic-jungle` | Dread-Gorger Soul | soul | Your summons never lose an enemy that flees, and the formation moves faster. |
| `conduit-relic-desert` | Dune-Stalker Soul | soul | Each different kind of summon that hits the marked enemy adds to the mark. |
| `conduit-relic-tundra` | Rime-Mammoth Soul | soul | Enemies near this Soul are chilled. |
| `conduit-relic-volcanic` | Magma Salamander Soul | soul | The longer a fight goes, the harder your summons hit. |
| `conduit-relic-graveyard` | Charnel-Crown Soul | soul | Enemies your summons kill rise for a short while as thralls. |
| `conduit-relic-trench` | Elder Serpent Soul | soul | The longer a fight lasts, the tougher your summons become. |

---

## Commit and report

Commit the shipped 64/96 px files, the preview-script change (2A only) and the review sheet;
never the full-res candidates (that folder is gitignored). Report at
`docs/briefs/class-first-build/reports/ICONS-2A.md` (or `ICONS-2B.md`) in the AGENT-RULES shape,
plus one line per icon: id, subject, palette, and whether you regenerated it.
