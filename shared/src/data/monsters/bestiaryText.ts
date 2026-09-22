/**
 * Authored bestiary copy for the playable monster roster.
 *
 * Numbers and ability rules intentionally stay in MonsterDefinition. This file
 * supplies the part that data cannot infer well: a readable combat identity and
 * a little field flavor for the entry header.
 */

export interface BestiaryText {
  /** The short line shown beside the monster's role. */
  profile: string;
  /** The longer field note shown above stats and abilities. */
  description: string;
}

export const BESTIARY_TEXT: Readonly<Record<string, BestiaryText>> = {
  'tiny-slime': {
    profile: 'A harmless first lesson',
    description: 'A little wisp that drifts through the clearing and rarely asks for trouble. Even the smallest spark looks mysterious in the dark.',
  },

  // Cave
  'cave-lurker': {
    profile: 'Fast melee skirmisher',
    description: 'Cave Lurkers close quickly and keep their pressure simple: sharp claws, short windows, and no warning beyond the scrape of stone. They are often the first shape to emerge from a tunnel you thought was empty.',
  },
  'cave-brute': {
    profile: 'Armored patrol bruiser',
    description: 'The Cave Brute patrols its route like it owns the passage. It bursts into combat and follows with a planted Ground Slam, so standing toe-to-toe means accepting the cave floor as part of the fight.',
  },
  'giant-spider': {
    profile: 'Venomous attrition hunter',
    description: 'A Giant Spider wins by making every exchange linger. Its bites layer Spider Venom while it keeps moving through the dark, turning a short fight into a race against the web in your veins.',
  },
  'cave-troll': {
    profile: 'Charge-and-slam ambusher',
    description: 'The Cave Troll is slow right up until it decides to cross the room. Savage Rush is its answer to distance; once it arrives, Ground Slam makes the landing zone every bit as important as the troll itself.',
  },
  'cave-gargoyle': {
    profile: 'Stationary ranged sentry',
    description: 'Cave Gargoyles perch where the tunnel narrows and refuse to give ground. Their Stalactite Shot is a deliberate, heavy projectile from a creature that treats its ledge as a fortress.',
  },
  'deep-spider': {
    profile: 'Fast venomous pursuer',
    description: 'A Deep Spider is the larger, quicker answer to the ordinary cave spider. Deep Venom keeps ticking after the bite, and its long pursuit range gives it plenty of time to make that poison matter.',
  },
  'cavern-troll': {
    profile: 'Heavy charge-and-slam bruiser',
    description: 'The Cavern Troll has learned the Cave Troll\'s rush, but not its restraint. It barrels into a fight, roots its victim on contact, and leaves a wider Ground Slam where the dust settles.',
  },
  'crystal-gargoyle': {
    profile: 'Burst artillery sentry',
    description: 'Crystal Gargoyles wait motionless until a target enters their firing lane. Their three-shot volley rewards a clean approach and punishes anyone who assumes a quiet statue is an idle one.',
  },
  'obsidian-broodmother': {
    profile: 'Corrosion-focused cave boss',
    description: 'The Obsidian Broodmother fights like a living fault line. Breach lands a heavy hit and tears at your plating in a single visible cast; as the broodmother weakens, its corrosion reaches deeper.',
  },
  'chitinous-dreadbore': {
    profile: 'Burrowing armor-breaker',
    description: 'The Dreadbore does not merely harden its shell; it disappears beneath yours. It burrows out of reach, tracks its emergence, and erupts beside you before giving the fight a brief, readable pause.',
  },
  'deep-core-burrow-gorger': {
    profile: 'Deep-burrow corrosion boss',
    description: 'A Deep-Core Burrow-Gorger turns the arena into a moving pressure seam. Its underground approach is only the beginning: every landed eruption pushes corrosion toward new thresholds, where the venom grows teeth.',
  },

  // Forest
  'forest-slime': {
    profile: 'Small forest nuisance',
    description: 'Moss Rats are quick to scatter and quicker to return when the path looks safe. They have no elaborate cast, but their numbers make every careless pull feel louder than it should.',
  },
  wolf: {
    profile: 'Pack alpha',
    description: 'A Wolf is the center of a small hunting pack. It calls its young into the fight, then relies on simple, relentless bites to keep a retreat from becoming a reset.',
  },
  'young-wolf': {
    profile: 'Pack follower',
    description: 'Young Wolves are not impressive alone; that is exactly why they travel together. Their strength is the answer they provide when an alpha gets a clean line to the prey.',
  },
  'ancient-wolf': {
    profile: 'Haste-bearing pack alpha',
    description: 'The Dire Wolf leads a larger, more disciplined pack and knows when to make the whole hunt surge. Howl accelerates nearby monsters while the alpha closes the gap in a sudden burst.',
  },
  'dire-whelp': {
    profile: 'Dire pack follower',
    description: 'Dire Whelps are young only by the standards of their alpha. They trail the Dire Wolf closely and turn a harmless-looking patch of forest into a coordinated chase.',
  },
  'ironwood-golem': {
    profile: 'Steady melee bruiser',
    description: 'The Ironclaw Badger is all compact muscle and iron-hard claws. It has no flourish to read: the warning is its stubborn advance and the thud of every ordinary hit.',
  },
  'canopy-sprite': {
    profile: 'Bursting ranged support',
    description: 'Thorn Spitters hide among the leaves and save their ammunition for a sudden burst. Barrage briefly turns a quiet canopy into a storm of thorns before the creature settles back into its rhythm.',
  },
  'gnarled-greatbear': {
    profile: 'Two-hit frenzy boss',
    description: 'The Gnarled Greatbear does not need a complicated trick: every swing lands twice, and Bestial Frenzy makes the forest seem to move faster around it. The longer it remains engaged, the less room there is for a mistake.',
  },
  'apex-timberclaw': {
    profile: 'Stunning frenzy boss',
    description: 'Apex Timberclaw is a patient predator with a very short temper. Its Stunning Swipe is a planted area cast, while Bestial Frenzy tightens the rhythm and the tell until the whole clearing feels like a closing jaw.',
  },

  // Plains
  'plains-slime': {
    profile: 'Swarm follower',
    description: 'Field Hares are small, skittish, and rarely found alone for long. They fan out around a shared target, turning open grassland into a surprisingly crowded battlefield.',
  },
  boar: {
    profile: 'Charging herd bruiser',
    description: 'Boars make the first second of a pull dangerous. They surge forward with the herd and rely on that burst of momentum to turn a clean formation into a scramble.',
  },
  'prairie-yearling': {
    profile: 'Herd follower',
    description: 'Prairie Yearlings are the lighter feet in a prairie herd. Their individual attacks are modest, but their instinct is to close whenever the pack has found a target.',
  },
  'prairie-wolf': {
    profile: 'Herd alpha',
    description: 'A Prairie Wolf organizes the grassland pack around a single chase. It is a straightforward alpha, but the three yearlings it brings along make its ordinary bite much harder to ignore.',
  },
  'stampede-bull': {
    profile: 'Fast herd bruiser',
    description: 'The Stampede Bull is a moving wall of horn and dust. Its opening burst is short, but it is enough to punish a player who mistakes the open plains for safe space.',
  },
  'savanna-hawk': {
    profile: 'Aerial dive striker',
    description: 'Savanna Hawks fight from above and choose their moment rather than wandering into a brawl. Dive Bomb gives a clear sky-born warning, then turns the landing into a brief root.',
  },
  'tusked-razorback': {
    profile: 'Rallying herd boss',
    description: 'The Tusked Razorback is less a lone beast than the front of a stampede. Rallying Cry calls fresh bodies into the field and makes nearby allies attack faster, so the first target is often the boss\'s support network.',
  },
  'gorging-razortusk': {
    profile: 'Escalating herd boss',
    description: 'Gorging Razortusk turns a cleared patch of grassland back into a moving herd. Its Rallying Cry arrives on a regular cadence, with the phase shift adding more bodies and more speed to every mistake left alive.',
  },

  // Swamp
  'bog-slime': {
    profile: 'Poison attrition mob',
    description: 'Mire Oozes look slow because the swamp is doing half their work for them. Every hit leaves Poison behind, and the damage keeps asking the same question after the ooze has been defeated.',
  },
  'mud-toad': {
    profile: 'Poisonous slowing brawler',
    description: 'Mud Toads fight close and make leaving unpleasant. Their Poison stacks while their sticky blows slow movement, giving the swamp time to catch up with anyone who tries to simply walk away.',
  },
  'swamp-hydra': {
    profile: 'Venomous shell defender',
    description: 'The Moss-Shell Snapper uses its shell as a breathing space, not a second health bar. Snapper Venom wears you down, then the creature retracts and asks whether your damage can keep working through a defensive pause.',
  },
  'bog-witch': {
    profile: 'Anti-recovery hexer',
    description: 'The Bog Witch waits for the moment recovery would make a fight comfortable. Wither is a short, readable cast that suppresses healing after it lands, making the witch dangerous without needing to out-swing a bruiser.',
  },
  'mire-stalker': {
    profile: 'Evasive venom ambusher',
    description: 'Mire Stalkers wait for the first clean opening and make it count: their opening bite applies extra venom, while their movement and evasion make a swamp chase feel less predictable than it looks.',
  },
  'plague-hydra': {
    profile: 'Shell-and-pool attrition tank',
    description: 'The Plague-Shell Snapper retreats into its shell at the edge of defeat and contaminates the ground when it does. Plague persists through the shell, so damage-over-time builds can keep the pressure on while everyone else chooses when to re-engage.',
  },
  'mire-hex-spitter': {
    profile: 'Poison-support hexer',
    description: 'The Mire Hexer is strongest when another swamp creature has already done its part. Plague Hex extends the poison that is already on you and adds its own anti-recovery pressure, turning a crowded pool into a longer fight.',
  },
  'bog-lurker': {
    profile: 'Pool-dwelling ambusher',
    description: 'Bog Lurkers wait at the rim of the rot pools instead of wandering past them. Come close and one coils, leaps the whole gap, and hauls you back into the water with your legs locked — the bite is the cheap part. Their first venomous strike is still the worst one, and their evasive body makes the shoreline a poor place to stand and trade.',
  },
  'grave-toadeater': {
    profile: 'Persistent bile-pool boss',
    description: 'Grave Toadeater makes every successful retreat permanent: Bile Pool leaves a lingering hazard where it casts. Its own poison is modest at first, but a fight that keeps crossing old puddles becomes a swamp of accumulated decisions.',
  },
  'mire-gorged-behemoth': {
    profile: 'Corrosive pool boss',
    description: 'The Mire-Gorged Behemoth weaponizes the ground beneath a slow, hungry body. Corrosive Pool leaves a damaging, vulnerable patch, and its faster cadence in the later phase turns old safe routes into bad memories.',
  },
  'rot-spore-croc-behemoth': {
    profile: 'Rot-spore arena boss',
    description: 'Rot-Spore Croc-Behemoth carries its own weather system. Spore Pool slows and weakens anyone caught inside, can detonate at the end, and eventually spreads rot across the arena while the croc\'s poison deepens.',
  },

  // Mountain
  'cliff-hopper': {
    profile: 'Ledge-vaulting charger',
    description: 'Cliff Hoppers treat mountain ledges as steps rather than walls. Strong Kick arrives after a visible wind-up and can throw you backward, while the opening charge makes the first exchange happen on the hopper\'s terms.',
  },
  'ridge-archer': {
    profile: 'Chokepoint marksman',
    description: 'Ridge Ambushers choose a pass and hold it. Power Shot is slow enough to read and heavy enough to respect, especially when the archer has already made the best route through the ledge its firing lane.',
  },
  'granite-titan': {
    profile: 'Patrolling slam guardian',
    description: 'Granite Titans patrol a short line and answer trespass with a planted Ground Slam. At low health they raise Granite Barrier, a final defensive cast that rewards steady pressure before the stone closes around them.',
  },
  'stone-eagle': {
    profile: 'Aerial dive striker',
    description: 'Stone Eagles ignore the ledges from above and pick a target from the open air. Skyfall Rend is their entire introduction: a cast, a committed dive, and a heavy first strike that ends the flight.',
  },
  'peak-archer': {
    profile: 'Chokepoint bombardier',
    description: 'Boulder Throwers do not need to chase when the mountain supplies a firing post. Huge Boulder marks a circle in advance, giving you a moment to leave the impact point before the throw makes the answer physical.',
  },
  'mountain-colossus': {
    profile: 'Heavy slam bruiser',
    description: 'Mountain Colossi trade speed for a broad, punishing Ground Slam. They carry Granite Barrier as a low-health ward, so a colossus that reaches its final quarter is not yet a colossus that has run out of answers.',
  },
  'avalanche-ram': {
    profile: 'Ledge-vaulting knockback charger',
    description: 'Avalanche Rams cross broken ground without asking permission. Their namesake charge ends in Avalanche Ram, a heavy horn strike that sends its target back and can separate a party in an instant.',
  },
  'crag-mortar': {
    profile: 'Stationary area artillery',
    description: 'Crag Mortars stay put and let the mountain do the intimidation. Bombardment paints a circle from a fixed firing position; the safest answer is usually the simplest one: stop standing where the rock is going to land.',
  },
  'granite-mammoth': {
    profile: 'Armored cadence bruiser',
    description: 'Granite Mammoths are built to outlast a hurried assault. Every fourth attack hits harder, and Granite Barrier buys a temporary ward when the mammoth is nearly beaten.',
  },
  'avalanche-tyrant': {
    profile: 'Heavy ledge-vaulting charger',
    description: 'The Avalanche Tyrant is the ram line with no interest in stopping at one target. Its stronger charge travels farther, hits harder, and leaves enough knockback to turn a narrow mountain pass into a dangerous pinball table.',
  },
  'cliffside-roc': {
    profile: 'Aerial first-strike predator',
    description: 'Cliffside Rocs circle above the pass until they see a clean opening. Skyfall Rend is a committed dive rather than a repeated hit-and-run: survive the landing and the roc has to fight honestly.',
  },
  'cragback-rhino': {
    profile: 'Armored charging finisher',
    description: 'Cragback Rhinos are difficult to burst down and happy to make the attempt costly. Their opening charge closes distance, while an empowered attack arrives on a timer and the rhino\'s shell softens oversized hits.',
  },
  'crag-behemoth': {
    profile: 'Committed charge boss',
    description: 'Crag Behemoth paints a lane, locks its line, and runs it without changing its mind. The encounter is a clean mountain lesson: leave the lane, survive the recovery, and punish the winded body.',
  },
  'stoneplate-juggernaut': {
    profile: 'Barrier-backed charge boss',
    description: 'Stoneplate Juggernaut puts a breakable plate between itself and its charge. Breaking that plate staggers it; letting it stand behind the plate lets the juggernaut commit to a faster, wider run across the arena.',
  },
  'crag-gorged-horn-behemoth': {
    profile: 'Charge-and-impact boss',
    description: 'Crag-Gorged Horn-Behemoth combines a long lane charge with a delayed ground rupture. It is most dangerous when the charge connects, because only then does the follow-up impact become real.',
  },
  'iron-crest-titan': {
    profile: 'Earthshatter charge boss',
    description: 'Iron-Crest Titan turns its entire body into a seismic weapon. Earthshatter follows a committed charge with a wide impact and delayed radial fault lines, then the wounded titan grows faster and more eager to repeat the lesson.',
  },

  // Jungle
  'jungle-snake': {
    profile: 'Concealed venom ambusher',
    description: 'Jungle Snakes live where the undergrowth hides the first step. Their opening strike arrives with extra venom, so the safest jungle path is the one that respects every bush until it proves empty.',
  },
  'jungle-ape': {
    profile: 'Rallying ambush alpha',
    description: 'Jungle Apes turn a local fight into a loud one. Chestbeat hastens nearby monsters and can rally unengaged allies, while the ape itself uses a short opening burst to make sure the call is heard.',
  },
  'jungle-blowdarter': {
    profile: 'Camouflaged poison skirmisher',
    description: 'Vine Chameleons are easy to miss until the dart has already landed. Their camouflage is part of the attack: once revealed, the Dart Poison is a reminder that the canopy was watching first.',
  },
  'jungle-stalker': {
    profile: 'Ambush striker',
    description: 'Jungle Stalkers have one clean idea and execute it well. The first landed attack of a fresh chase is amplified, turning a careless pull into a duel that starts halfway through its first exchange.',
  },
  silverback: {
    profile: 'Ramping charging bruiser',
    description: 'Silverbacks become more dangerous the longer they are allowed to posture. Their attack ramps during combat and their opening charge makes disengaging before that ramp matters a difficult choice.',
  },
  'canopy-harrier': {
    profile: 'Camouflaged thorn gunner',
    description: 'Canopy Chameleons hide until a target is in a comfortable firing line. Canopy Barrage is a short, intense burst rather than a permanent stream, which makes the reveal the first part of the warning.',
  },
  'hunting-panther': {
    profile: 'Ambush skirmisher',
    description: 'Hunting Panthers are quiet until they are not. Their first clean hit is empowered, and their whole hunting style is built around making that opening happen before the target has found the right footing.',
  },
  'apex-silverback': {
    profile: 'Ramping apex bruiser',
    description: 'Apex Silverbacks do not need a new trick to become terrifying. Their attack keeps building while they remain engaged, and a sudden charge buys them the time needed to reach their preferred rhythm.',
  },
  'thornback-lizard': {
    profile: 'Camouflaged burst gunner',
    description: 'Thornback Chameleons turn concealment into a firing position. Thorn Barrage delivers three hurried attacks after its tell, then leaves the lizard to disappear back into the visual clutter of the jungle.',
  },
  'emerald-constrictor': {
    profile: 'Venomous root finisher',
    description: 'Emerald Constrictors let ordinary venom soften the target before their fourth attack lands. That cadence strike hits harder and roots you, making the location of the fight more important than the number on the bite.',
  },
  'jungle-dread-gorger': {
    profile: 'Escape-and-ambush boss',
    description: 'Jungle Dread-Gorger is a boss you pursue as much as fight. It raises a breakable guard, flees, vanishes, and returns for an Ambush; break the escape for a stagger, or let the predator complete the loop.',
  },
  'apex-bramble-slasher': {
    profile: 'Venomous escape boss',
    description: 'Apex Bramble-Slasher makes every failed pursuit linger. Its escape loop is faster and its successful ambush adds Venom Burst, so breaking the guard is not just a damage check but a way to deny the jungle a second bite.',
  },
  'verdant-crown-predator': {
    profile: 'Cornered escape boss',
    description: 'Verdant-Crown Predator is the finished jungle hunt: flee, vanish, return, and leave venom behind. Below half health it stops escaping and corners itself, trading the old pursuit for a final burst of aggression.',
  },

  // Desert
  'sand-scorpion': {
    profile: 'Slow-casting controller',
    description: 'Sand Scorpions are the desert\'s first lesson in answering a cast instead of every ordinary hit. Numbing Sting slows the target long enough for the scorpion and its scarab partner to control the engagement.',
  },
  'stone-basilisk': {
    profile: 'Petrifying controller',
    description: 'Stone Basilisks do not need to hit often when one stare can stop a retreat. Petrifying Gaze is a clean root cast, paired with a Sun Scarab that turns the controlled target into an easy mark.',
  },
  'dust-djinn': {
    profile: 'Desert ranged follower',
    description: 'Sun Scarabs are the ranged half of a desert hunting pair. They keep pressure on the target chosen by their controller and let the open sand become a firing lane instead of an escape route.',
  },
  'dune-stalker': {
    profile: 'Fast controller',
    description: 'Dune Stalkers use a shorter Numbing Sting to keep the fight moving at their preferred pace. They are the controller in a one-to-one desert pair, not a lone duelist looking for a fair exchange.',
  },
  'desert-basilisk': {
    profile: 'Root-and-sunder controller',
    description: 'Desert Basilisks combine Petrifying Gaze with a brief sunder that makes every later hit more dangerous. The gaze fixes the target; the desert pair supplies the punishment.',
  },
  sandweaver: {
    profile: 'Gilded ranged follower',
    description: 'Gilded Scarabs turn sunlight into a long-range answer. Sunbeam is their signature burst, and their preferred fight is one where the basilisk has already made standing still unavoidable.',
  },
  'sand-viper': {
    profile: 'Rapid slowing controller',
    description: 'Sand Vipers cast Numbing Sting often and keep the target moving badly. Their partner supplies ranged pressure while the viper makes a clean exit feel just out of reach.',
  },
  'dune-basilisk': {
    profile: 'Heavy root-and-sunder controller',
    description: 'Dune Basilisks are the deep-desert version of the gaze lesson: a longer root and a stronger sunder, with a Sunshield Scarab waiting to capitalize on the pause.',
  },
  'sandspitter-cobra': {
    profile: 'Shielded ranged follower',
    description: 'Sunshield Scarabs keep their firing line with a periodic barrier. Pressure them continuously and the shield stays manageable; lose them in the dunes and the barrier has time to return.',
  },
  'dune-tyrant': {
    profile: 'Slowing pincer bruiser',
    description: 'Dune Tyrants are the desert pair turned up to full volume. A persistent slow makes the Pincer Smash harder to sidestep, while the scarab partner ensures the tyrant is never the only thing asking for your attention.',
  },
  'dune-stalker-emperor': {
    profile: 'Mark-and-execution boss',
    description: 'Dune-Stalker Emperor builds one honest sentence: mark the prey, numb its escape, then deliver Execution. Cleanse removes the amplification, but the unmarked strike still arrives and still needs an answer.',
  },
  'dune-carapace-monarch': {
    profile: 'Shifting mark-and-execution boss',
    description: 'Dune-Carapace Monarch keeps the same mark-and-execution lesson while changing posture halfway through the fight. It begins as a hunter and becomes a ranged kiter, asking whether the response survives the distance change.',
  },
  'dune-throne-sovereign': {
    profile: 'Three-act execution boss',
    description: 'Dune-Throne Sovereign never abandons its central question: what will you do with the mark before Execution lands? Its three acts change the space around that question from melee, to range, and finally to a cornered melee finish.',
  },

  // Volcanic
  'ember-scuttler': {
    profile: 'Flaring swarm skirmisher',
    description: 'Ember Scuttlers are small, hot, and rarely where you want them to be. They spread through a fight rather than presenting a single dramatic cast, making positioning the first defense against the swarm.',
  },
  'cinder-hound': {
    profile: 'Charging volcanic hunter',
    description: 'Cinder Hounds begin each chase with a burst of heat and speed. Their strength is the opening contact, when the rest of the volcanic swarm has not yet had to decide where to stand.',
  },
  'magma-brute': {
    profile: 'Self-warded tortoise',
    description: 'Magma Tortoises are patient enough to let their shell do the talking. Molten Guard is a visible self-ward that rewards keeping pressure on the tortoise instead of waiting for the lava to cool.',
  },
  'ash-slinger': {
    profile: 'Stationary ash sentry',
    description: 'Ash Salamanders hold their ground and turn a quiet patch of volcanic terrain into a firing post. They have no elaborate rotation; their threat is the fixed pressure that makes other hazards harder to route around.',
  },
  'ember-skink': {
    profile: 'Burning swarm skirmisher',
    description: 'Ember Skinks are the swarm with a lingering aftertaste. Ember Burn keeps ticking while the skinks fan out, so the right moment to finish one is often before the little creature has found a second angle.',
  },
  'infernal-direhound': {
    profile: 'Fast charging hunter',
    description: 'Infernal Direhounds cross hot ground in a single committed burst. Their opening speed is simple, readable pressure that becomes much less simple when several hounds arrive together.',
  },
  'obsidian-tortoise': {
    profile: 'Burst-casting tortoise',
    description: 'Obsidian Tortoises wait behind their dark shell, then fire Molten Eruption at a captured target. The cast follows the player, so distance is a way to buy time, not a guarantee that the eruption will miss.',
  },
  'ashspitter-salamander': {
    profile: 'Stationary burning sentry',
    description: 'Ashspitter Salamanders hold a firing position and layer Ash Burn onto anyone who stays in front of them. Their stillness is not passivity; it is an invitation to choose a better angle before the stacks grow.',
  },
  'magma-salamander': {
    profile: 'Self-warded volcanic elite',
    description: 'Magma Salamanders use Obsidian Shell to buy a short window against direct damage. The shell is a cast, not an invisible stat change, so the best response is to recognize the moment and decide whether to keep burning or reposition.',
  },
  'cinder-shell-magma-salamander': {
    profile: 'Recurring magma-vent boss',
    description: 'Cinder-Shell Magma-Salamander closes its shell repeatedly as the room heats up. Each shell leaves a magma Vent: standing in it accelerates Heat, while stepping out returns buildup to its normal rate. Heat starts cooling once you leave combat.',
  },
  'caldera-sovereign': {
    profile: 'Cataclysmic heat boss',
    description: 'Caldera Sovereign is a living furnace built around a choice: work around the shell vents, manage Simmering Burn, and end the fight before Cataclysm completes. The final cast is once per life, long, and deliberately impossible to mistake for an ordinary attack.',
  },

  // Tundra
  'frost-lurker': {
    profile: 'Cold melee skirmisher',
    description: 'Frost Lurkers use the snow and silence to make an ordinary melee approach feel sudden. They have no signature cast; their danger is the chill already accumulating underfoot.',
  },
  'glacier-bear': {
    profile: 'Brittle-shell bruiser',
    description: 'Glacier Bears do not simply absorb punishment; they invite a burst into their periodic shell. Break it cleanly and the bear is exposed, but let the barrier cycle while chipping and the cold fight becomes longer than it needed to be.',
  },
  'rime-caster': {
    profile: 'Chill-gated frost sentry',
    description: 'Rime Casters wait for the room to make you cold enough. Frostbind only becomes available after Chill has built, then roots the target in a cast that turns the tundra\'s ambient pressure into a personal problem.',
  },
  'rime-tusk-mastodon': {
    profile: 'Charging frost striker',
    description: 'Rime-Tusk Mastodons combine a heavy Frost-Tusk Impact with a short opening charge. They are most comfortable when the first collision has already stolen the space needed to leave.',
  },
  'glacial-direbear': {
    profile: 'Heavy brittle-shell bruiser',
    description: 'Glacial Dire-Bears are the larger shell lesson: a stronger barrier and a larger reward when it breaks. A well-timed burst turns their defense into a vulnerability window instead of a stall.',
  },
  'hoarfrost-yeti': {
    profile: 'Chill-gated frost caster',
    description: 'Hoarfrost Yetis wait for deeper Chill before casting Deep Freeze. Once the gate opens, the root is long enough to make the following seconds about preparation rather than panic.',
  },
  'permafrost-behemoth': {
    profile: 'Chill-fed slam elite',
    description: 'Permafrost Behemoths keep their ordinary swings honest and save the tundra\'s accumulated Chill for Glacial Slam. The colder the target has allowed the room to make them, the more important it is to leave the planted circle.',
  },
  'frost-plated-rime-mammoth': {
    profile: 'Freeze-and-shatter boss',
    description: 'Frost-Plated Rime-Mammoth waits until Chill is deep enough to make Deep Freeze stick, then follows the frozen target with Shatter. Cleanse, break free, and move before the ice has finished explaining itself.',
  },
  'glacial-patriarch': {
    profile: 'Deep-freeze collapse boss',
    description: 'Glacial Patriarch turns the tundra lesson into a wider collapse. Deep Freeze checks the room\'s Chill, and Glacial Collapse fills a larger circle after the check; the damage is visible, but the setup began several seconds earlier.',
  },

  // Graveyard
  'bone-crawler': {
    profile: 'Restless melee dead',
    description: 'Bone Crawlers are the graveyard\'s most basic answer to an open path: they crawl toward the nearest living thing until something stops them. The danger is not complexity but how easily they become corpse material for someone else.',
  },
  'plague-hound': {
    profile: 'Plague-bearing charger',
    description: 'Plague Hounds rush the living and leave plague behind on every bite. When one dies, its toxic remains persist on the ground, so killing it is still correct but not always clean.',
  },
  'carrion-vulture': {
    profile: 'Ranged undead support',
    description: 'Carrion Vultures stay just far enough away to make the graveyard feel crowded from every direction. Necrotic Screech hastens nearby undead, turning the vulture into a priority target even when its own peck is not the loudest threat.',
  },
  'charnel-brute': {
    profile: 'Cadence bruiser with death surge',
    description: 'Charnel Brutes hit in a predictable rhythm, with every fourth attack carrying extra weight. Killing one can also empower its nearby allies, so the final blow changes the shape of the surrounding fight.',
  },
  gravewright: {
    profile: 'Corpse-raising elite',
    description: 'The Gravewright is strongest around the dead it did not make. Raise Dead reaches for a nearby corpse and returns it diminished, capped, and temporary; clear the bodies and the gravewright loses its supply.',
  },
  'plague-rat': {
    profile: 'Small graveyard scavenger',
    description: 'Bone Rats are quick scavengers that turn a quiet crypt into a skittering mess. They bring no grand cast, but every corpse left behind gives the graveyard more raw material to work with.',
  },
  'charnel-crown-sovereign': {
    profile: 'Selective necromancy boss',
    description: 'Charnel-Crown Sovereign does not conjure an endless army; it cultivates a finite tide. It begins with a small entourage, raises nearby corpses one at a time, and uses Mass Resurrection to reach deeper into the grave when the fight crosses half health.',
  },

  // Trench and the ultimate encounter
  'abyssal-serpent': {
    profile: 'Anti-recovery bite elite',
    description: 'Abyssal Serpents teach the Trench\'s central warning in miniature. Abyssal Bite suppresses recovery after a visible wind-up, so a long fight against one is a fight you must choose to end.',
  },
  'hadal-stalker': {
    profile: 'Armored ranged controller',
    description: 'Hadal Stalkers keep their distance and use Pressure Lance to slow anyone trying to close the gap. Their armor rewards a patient approach, but the lance is still a cast you can see and answer.',
  },
  'elder-leviathan': {
    profile: 'Carapace-and-devour elite',
    description: 'Elder Leviathans alternate between a visible Carapace Renewal and a much less forgiving Devour. Break the carapace with purpose, then make sure the enormous bite finds empty space rather than a stationary target.',
  },
  'elder-trench-serpent': {
    profile: 'Wound-and-devour boss',
    description: 'Elder Trench Serpent fights one long sentence: Abyssal Bite wounds recovery, Undertow drags the target back, Constrict steals a moment, and Devour heals the serpent if it lands. Every step has a different answer, but none reward standing still.',
  },
  'elder-trench-serpent-warden': {
    profile: 'Armored trench warden',
    description: 'Elder Trench Serpent Wardens are sent to hold the line, not to duel elegantly. Their timed finisher, hard shell, and opening rush reward the player who chooses a target quickly and refuses to let the warden settle in.',
  },
  'void-overlord': {
    profile: 'Staged abyssal encounter',
    description: 'Void Overlord is not a normal pull. The encounter seals the arena, sends waves, calls three wardens, and finally exposes the overlord beneath a growing Flood; the objective between stages is part of the boss ability.',
  },
  'void-horror': {
    profile: 'Corrupting abyssal add',
    description: 'Void Horrors are the light-footed bodies that carry the Flood forward. Their Void Corruption stacks quickly in close quarters, making the wave phase more dangerous the longer its perimeter remains intact.',
  },
  'void-hulk': {
    profile: 'Charging abyssal add',
    description: 'Void Hulks are the heavy shapes inside an abyssal wave. They open with a rush and deliver a regular empowered strike, giving the add phase both a body to clear and a beat to respect.',
  },
} as const;
