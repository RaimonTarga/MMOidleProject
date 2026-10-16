/**
 * The Conduit's kit (`summoner`): bible §7.
 *
 * The commander who never strikes. Pieces are **summon types** fielded in the
 * Formation within Command; each does one job with a default behaviour. The relic
 * slot holds a **Soul**: a free boss summon. The budget is Command.
 *
 * K6 enters every specialist through T4 (§7.4, §7.16), the eleven Souls (§7.8),
 * the disciplines (§7.5), specializations (§7.6) and leaves (§7.7). Numbers stay
 * out of `params` for the class runtime. Bodies are stand-ins from today's summon
 * sprites (§7.14): the T1 five and the five T1 Souls wear the bodies named in the
 * K6 brief, and every later entry reuses one that fits its role (the K6 report
 * lists the choices). Variants are new summons, not sidegrades.
 */
import type { MinionMonsterType } from '../../components/archetypes/summoner/isMinion';
import { standardBudgetSteps } from '../budget';
import { STARTER, learn, zone } from '../kitHelpers';
import type {
  ClassKit,
  DisciplineDef,
  LeafDef,
  PieceDef,
  SpecializationDef,
  TrophyDef,
  TrophyRank,
} from '../types';

/** Summon roles (§7.3). The Thrall is the generic starter; heavies are a role at 2+ Command. */
export type ConduitRole = 'generic' | 'tank' | 'damage' | 'support';

export interface ConduitPieceExtra {
  /** What it costs to field. A 2-cost summon is worth about two 1-costs in its role (§7.2). */
  command: number;
  /** Attack mode (§7.14): melee 18, reach 96, ranged 190 today. */
  mode: 'melee' | 'reach' | 'ranged';
  /** Role sets the row: tanks in front, melee in the middle, ranged and supports at the back (§7.3). */
  row: 'front' | 'middle' | 'back';
  /** The body it wears (a stand-in from today's summon sprites). */
  body: MinionMonsterType;
}

export type ConduitPiece = PieceDef<ConduitRole, ConduitPieceExtra>;

/** Every Conduit trophy is a Soul: a free boss summon, with its own body, never the boss's (§7.8). */
export type ConduitTrophyKind = 'soul';
export type ConduitTrophy = TrophyDef<ConduitTrophyKind> & {
  /** The Soul's body (a stand-in from today's summon sprites). */
  body: MinionMonsterType;
};

export function summon(piece: Omit<ConduitPiece, 'classId' | 'params'> & { params?: ConduitPiece['params'] }): ConduitPiece {
  return { classId: 'summoner', ...piece, params: piece.params ?? {} };
}

export function soul(entry: Omit<ConduitTrophy, 'classId' | 'params' | 'kind'>): ConduitTrophy {
  return { classId: 'summoner', params: {}, kind: 'soul', ...entry };
}

function discipline(entry: Omit<DisciplineDef, 'classId' | 'params'>): DisciplineDef {
  return { classId: 'summoner', params: {}, ...entry };
}

function specialization(entry: Omit<SpecializationDef, 'classId' | 'params'>): SpecializationDef {
  return { classId: 'summoner', params: {}, ...entry };
}

function leaf(entry: Omit<LeafDef, 'classId' | 'params'>): LeafDef {
  return { classId: 'summoner', params: {}, ...entry };
}

/**
 * §7.15 item 5: Soul ranks are not designed yet. The brief's sentence for every
 * rank above 1, until the real designs land.
 */
const SOUL_GROWS = 'The Soul grows stronger.';

function soulRank(rank: number, bossTier: number): TrophyRank {
  return { rank, bossTier, text: SOUL_GROWS };
}

const PIECES: readonly ConduitPiece[] = [
  summon({
    id: 'conduit-thrall',
    name: 'Thrall',
    family: 'generic',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon',
    text: 'A plain melee summon with decent bulk and fair damage. You start with four.',
  }),

  // ── T1 specialists (§7.4). Names are the brief's placeholders. ──
  summon({
    id: 'conduit-plains-tank',
    // OV-CONDUIT: the taunt outlasts its cooldown (a boss stays held while the Warden lives), and the
    // plating it is named for triples the Conduit's copy. PLACEHOLDERS (were hpMult 1.5, 6000 / 3000).
    params: { hpMult: 3, platingMult: 3, damageMult: 0.7, tauntEveryMs: 4000, tauntMs: 5000, tauntRadius: 120 },
    name: 'Plains Warden',
    family: 'tank',
    command: 1,
    mode: 'melee',
    row: 'front',
    body: 'conduit-summon-effigy',
    text: 'A plated tank. Its short sweep taunts the enemies around it.',
  }),
  summon({
    id: 'conduit-forest-bruiser',
    params: { hpMult: 0.6, damageMult: 0.9, cooldownMult: 0.6 },
    name: 'Thornrunner',
    family: 'damage',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-splinter',
    text: 'A fast melee bruiser with little health.',
  }),
  summon({
    id: 'conduit-swamp-spitter',
    params: { hpMult: 0.8, damageMult: 0.6, shredFraction: 0.25, shredMs: 4000 },
    name: 'Bile Spitter',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-chorister',
    text: 'A ranged support. Its acid strips the plating off its target.',
  }),
  summon({
    id: 'conduit-mountain-marksman',
    params: { hpMult: 0.6, damageMult: 0.8, shotEvery: 3, shotMult: 2.5 },
    name: 'Ridge Marksman',
    family: 'damage',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-inquisitor',
    text: 'Fires a heavy shot from the back row, and has little health.',
  }),
  summon({
    id: 'conduit-cave-heavy',
    // OV-CONDUIT: a held taunt, as the Warden's (was 8000 / 3000). PLACEHOLDER.
    params: { hpMult: 1.2, damageMult: 0.9, tauntEveryMs: 4000, tauntMs: 5000, tauntRadius: 120 },
    name: 'Cave Brute',
    family: 'tank',
    command: 2,
    mode: 'melee',
    row: 'front',
    body: 'conduit-summon-idolwright',
    text: 'A heavy tank. It soaks the hits that come at you.',
  }),

  // ── T2 (§7.16). Bodies from here on are stand-ins; see the K6 report. ──
  // T2 `params` are PLACEHOLDERS (T2-CONDUIT): the bible gives the jobs, not the numbers.
  summon({
    id: 'conduit-ironhorn',
    // The taunt copies the Plains Warden's (a tank holds enemies, §7.3); the bible gives only the brace.
    params: { tauntEveryMs: 4000, tauntMs: 5000, tauntRadius: 120, braceStunMs: 1500 },
    name: 'Ironhorn',
    family: 'tank',
    command: 1,
    mode: 'melee',
    row: 'front',
    body: 'conduit-summon-effigy',
    text: 'Braces against a charge. A charge that hits it stops dead, and the charger is stunned for a moment.',
  }),
  summon({
    id: 'conduit-barkward',
    params: { barkEveryMs: 5000, barkAbsorbPct: 0.3 },
    name: 'Barkward',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-chorister',
    text: 'Every few seconds it coats a summon in bark that absorbs the next stun, root or knockdown, and some of the hit.',
  }),
  summon({
    id: 'conduit-rockhurler',
    params: { splashRadius: 70, splashShare: 0.5 },
    name: 'Rockhurler',
    family: 'damage',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-iconoclast',
    text: 'Lobs boulders that hit a small area.',
  }),
  summon({
    id: 'conduit-bog-leech',
    params: { drainShare: 0.5 },
    name: 'Bog Leech',
    family: 'damage',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-splinter',
    text: 'Latches onto its target and drains it, sharing what it drains with the most hurt summon.',
  }),
  summon({
    id: 'conduit-bonecrusher',
    params: { hpDamagePct: 0.08 },
    name: 'Bonecrusher',
    family: 'damage',
    command: 2,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-covenanter-offense',
    text: 'A heavy summon. Its blows hit harder the more health it has.',
  }),
  summon({
    id: 'conduit-bloomtender',
    params: { healPct: 0.05 },
    name: 'Bloomtender',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-chorister',
    text: 'Heals whichever ally is most hurt, you included.',
  }),
  summon({
    id: 'conduit-executioner',
    params: { executeBelow: 0.3, executeMult: 2 },
    name: 'Executioner',
    family: 'damage',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-inquisitor',
    text: 'Marks its target. Once that target is badly hurt, its shots hit much harder.',
  }),

  // ── T3 (§7.16) ──
  // T3 `params` are PLACEHOLDERS (T3-CONDUIT): the bible gives the jobs, not the numbers.
  summon({
    id: 'conduit-warhorn',
    params: { hornEveryMs: 6000, hornMs: 3000, hornRadius: 220, hornHaste: 0.35 },
    name: 'Warhorn',
    family: 'support',
    command: 2,
    // Melee: not on the brief's ranged list. Back row: every support stands there.
    mode: 'melee',
    row: 'back',
    body: 'conduit-summon-ritualist',
    text: 'A towering horn-beast. Every few seconds its call makes every summon in a wide circle attack faster for a short while.',
  }),
  summon({
    id: 'conduit-burrower',
    params: { burrowEveryMs: 5000, burrowReach: 320, burrowShare: 1 },
    name: 'Burrower',
    family: 'damage',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-splinter',
    text: 'Tunnels under its target and erupts there, reaching the casters and gunners in the back.',
  }),
  summon({
    id: 'conduit-sporecaller',
    params: { sporeRadius: 110, sporeMs: 4000, sporeCut: 0.25 },
    name: 'Sporecaller',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-chorister',
    text: 'Its spores make the enemies around its target hit less hard.',
  }),
  summon({
    id: 'conduit-prowler',
    params: { ambushEveryMs: 6000, ambushMult: 2, pounceDist: 90, pounceMult: 1.75 },
    name: 'Prowler',
    family: 'damage',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-splinter',
    text: 'Strikes from hiding every few seconds, and pounces on enemies that flee.',
  }),
  summon({
    id: 'conduit-carapace-guard',
    params: { blockShare: 0.6, tauntEveryMs: 4000, tauntMs: 5000, tauntRadius: 120 },
    name: 'Carapace Guard',
    family: 'tank',
    command: 1,
    mode: 'melee',
    row: 'front',
    body: 'conduit-summon-covenanter-defense',
    text: 'Raises a shield toward the strongest ranged attacker, blocking shots aimed at the summons behind it.',
  }),
  summon({
    id: 'conduit-frostcaller',
    params: { frostRadius: 170, frostSlow: 0.3, frostAttackSlow: 0.3, frostMs: 2500, frostEveryMs: 1000 },
    name: 'Frostcaller',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-chorister',
    text: 'Enemies around it attack and move more slowly.',
  }),
  summon({
    id: 'conduit-cinderling',
    params: { burnRadius: 80, burnEveryMs: 1000, burnMult: 0.5, burnRampPerSec: 0.02, burnRampMaxSec: 30 },
    name: 'Cinderling',
    family: 'damage',
    command: 1,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-iconoclast',
    text: 'Burns everything around it, and grows stronger the longer the fight goes.',
  }),

  // ── T4 (§7.16) ──
  // T4 `params` are PLACEHOLDERS (T4-CONDUIT): the bible gives the jobs, not the numbers.
  summon({
    id: 'conduit-avalanche',
    params: { chargeEveryMs: 7000, chargeLength: 260, chargeWidth: 55, chargeMult: 1.5, knockMs: 1200 },
    name: 'Avalanche',
    family: 'damage',
    command: 3,
    mode: 'melee',
    row: 'middle',
    body: 'conduit-summon-idolwright',
    text: 'Every few seconds it charges through a line of enemies and knocks them down.',
  }),
  summon({
    id: 'conduit-icewarden',
    params: { shellEveryMs: 6000, shellPct: 0.25, shellMs: 8000 },
    name: 'Icewarden',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-chorister',
    text: 'Wraps the most hurt summon in an ice shell that absorbs damage.',
  }),
  summon({
    id: 'conduit-dartcaller',
    params: { dartTicks: 3, dartTickShare: 0.2, ricochetReach: 220, ricochetShare: 0.6 },
    name: 'Dartcaller',
    family: 'damage',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-inquisitor',
    text: 'Fires poison darts that ricochet to a second enemy.',
  }),
  summon({
    id: 'conduit-mirage',
    params: { mirageEveryMs: 10000, mirageMs: 4000, mirageRadius: 280 },
    name: 'Mirage',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-consort',
    text: 'Conjures a copy of you that draws attacks for a few seconds. Bosses that come for you chase the copy.',
  }),
  summon({
    id: 'conduit-obsidian-tortoise',
    params: { tauntEveryMs: 4000, tauntMs: 5000, tauntRadius: 120, withdrawEveryMs: 10000, withdrawMs: 3000, withdrawBlock: 0.95 },
    name: 'Obsidian Tortoise',
    family: 'tank',
    command: 2,
    mode: 'melee',
    row: 'front',
    body: 'conduit-summon-idolwright',
    text: 'Every so often it withdraws into its shell, taking almost no damage while it keeps taunting.',
  }),
  summon({
    id: 'conduit-gravecaller',
    params: { huskMs: 4000, huskEveryMs: 1000, huskMult: 0.8 },
    name: 'Gravecaller',
    family: 'support',
    command: 1,
    mode: 'ranged',
    row: 'back',
    body: 'conduit-summon-ritualist',
    text: 'When one of your summons dies, it rises once as a spectral husk for a few seconds, then goes to be rebuilt.',
  }),
  summon({
    id: 'conduit-abyssal-warden',
    params: { tauntEveryMs: 4000, tauntMs: 5000, tauntRadius: 120, wardenEveryMs: 4000, wardenRadius: 200 },
    name: 'Abyssal Warden',
    family: 'tank',
    command: 1,
    mode: 'melee',
    row: 'front',
    body: 'conduit-summon-effigy',
    text: 'Every few seconds it pulls one harmful effect off a nearby summon, or off you, onto itself.',
  }),
];

const LESSONS = [
  learn('conduit-thrall', STARTER),
  // T1
  learn('conduit-plains-tank', zone('plains', 1)),
  learn('conduit-forest-bruiser', zone('forest', 1)),
  learn('conduit-swamp-spitter', zone('swamp', 1)),
  learn('conduit-mountain-marksman', zone('mountain', 1)),
  learn('conduit-cave-heavy', zone('cave', 1)),
  // T2
  learn('conduit-ironhorn', zone('plains', 2)),
  learn('conduit-barkward', zone('forest', 2)),
  learn('conduit-rockhurler', zone('mountain', 2)),
  learn('conduit-bog-leech', zone('swamp', 2)),
  learn('conduit-bonecrusher', zone('cave', 2)),
  learn('conduit-bloomtender', zone('jungle', 2)),
  learn('conduit-executioner', zone('desert', 2)),
  // T3
  learn('conduit-warhorn', zone('mountain', 3)),
  learn('conduit-burrower', zone('cave', 3)),
  learn('conduit-sporecaller', zone('swamp', 3)),
  learn('conduit-prowler', zone('jungle', 3)),
  learn('conduit-carapace-guard', zone('desert', 3)),
  learn('conduit-frostcaller', zone('tundra', 3)),
  learn('conduit-cinderling', zone('volcanic', 3)),
  // T4
  learn('conduit-avalanche', zone('mountain', 4)),
  learn('conduit-icewarden', zone('tundra', 4)),
  learn('conduit-dartcaller', zone('jungle', 4)),
  learn('conduit-mirage', zone('desert', 4)),
  learn('conduit-obsidian-tortoise', zone('volcanic', 4)),
  learn('conduit-gravecaller', zone('graveyard', 4)),
  learn('conduit-abyssal-warden', zone('trench', 4)),
];

/** One Soul per boss lineage (§7.8). Rank 1 is the seed twist; later ranks are not designed yet. */
const TROPHIES: readonly ConduitTrophy[] = [
  soul({
    id: 'conduit-relic-plains',
    lineage: 'plains',
    name: 'Razortusk Soul',
    body: 'conduit-summon-champion',
    text: 'Every so often, your melee summons charge the enemy you are fighting, together.',
    ranks: [soulRank(2, 2)],
  }),
  soul({
    id: 'conduit-relic-forest',
    lineage: 'forest',
    name: 'Timberclaw Soul',
    body: 'conduit-summon-consort',
    text: 'Your summons slowly heal during a fight.',
    ranks: [soulRank(2, 2)],
  }),
  soul({
    id: 'conduit-relic-swamp',
    lineage: 'swamp',
    name: 'Mire Behemoth Soul',
    body: 'conduit-summon-ritualist',
    text: 'When a summon dies, it leaves a pool of bile that hurts enemies.',
    ranks: [soulRank(2, 2), soulRank(3, 3)],
  }),
  soul({
    id: 'conduit-relic-mountain',
    lineage: 'mountain',
    name: 'Stoneplate Soul',
    body: 'conduit-summon-covenanter-defense',
    text: 'When a tank taunts, the taunt also shields it.',
    ranks: [soulRank(2, 2), soulRank(3, 3), soulRank(4, 4)],
  }),
  soul({
    id: 'conduit-relic-cave',
    lineage: 'cave',
    name: 'Dreadbore Soul',
    body: 'conduit-summon-marshal',
    text: 'Every few seconds a spiderling appears for a short while.',
    ranks: [soulRank(2, 2), soulRank(3, 3)],
  }),
  soul({
    id: 'conduit-relic-jungle',
    lineage: 'jungle',
    name: 'Dread-Gorger Soul',
    body: 'conduit-summon-splinter',
    text: 'Your summons never lose an enemy that flees, and the formation moves faster.',
    ranks: [soulRank(2, 3), soulRank(3, 4)],
  }),
  soul({
    id: 'conduit-relic-desert',
    lineage: 'desert',
    name: 'Dune-Stalker Soul',
    body: 'conduit-summon-inquisitor',
    text: 'Each different kind of summon that hits the marked enemy adds to the mark.',
    ranks: [soulRank(2, 3), soulRank(3, 4)],
  }),
  soul({
    id: 'conduit-relic-tundra',
    lineage: 'tundra',
    name: 'Rime-Mammoth Soul',
    body: 'conduit-summon-idolwright',
    text: 'Enemies near this Soul are chilled.',
    ranks: [soulRank(2, 4)],
  }),
  soul({
    id: 'conduit-relic-volcanic',
    lineage: 'volcanic',
    name: 'Magma Salamander Soul',
    body: 'conduit-summon-kilnmaster',
    text: 'The longer a fight goes, the harder your summons hit.',
    ranks: [soulRank(2, 4)],
  }),
  soul({
    id: 'conduit-relic-graveyard',
    lineage: 'graveyard',
    name: 'Charnel-Crown Soul',
    body: 'conduit-summon-ritualist',
    text: 'Enemies your summons kill rise for a short while as thralls.',
    ranks: [],
  }),
  soul({
    id: 'conduit-relic-trench',
    lineage: 'trench',
    name: 'Elder Serpent Soul',
    body: 'conduit-summon-effigy',
    text: 'The longer a fight lasts, the tougher your summons become.',
    ranks: [],
  }),
];

/** Disciplines reshape the same roster. None of them unlocks a piece (§7.5). */
const DISCIPLINES: readonly DisciplineDef[] = [
  discipline({
    id: 'conduit-swarm',
    name: 'Swarm',
    fantasy: 'A flood of cheap, disposable summons.',
    text: 'Your cheapest summons come two for the price of one, and they rebuild for free.',
  }),
  discipline({
    id: 'conduit-pack',
    name: 'Pack',
    fantasy: 'A team where every member has a different job.',
    text: 'A kind of summon you are not fielding yet costs less to add, and a summon is never free. Every few seconds, each different kind strikes your target together, and you can call that strike early.',
  }),
  discipline({
    id: 'conduit-elite',
    name: 'Elite',
    fantasy: 'A few champions.',
    text: 'Every summon costs more to field. Each one is tougher, hits harder, and gains an extra that deepens its job.',
  }),
];

/** T3 (§7.6). Three per discipline; each Pack pick empowers one role. */
const SPECIALIZATIONS: readonly SpecializationDef[] = [
  specialization({
    id: 'conduit-burn-bright',
    disciplineId: 'conduit-swarm',
    name: 'Burn Bright',
    text: 'Your summons arrive in waves. They attack faster at first, then burn out.',
  }),
  specialization({
    id: 'conduit-legion',
    disciplineId: 'conduit-swarm',
    name: 'Legion',
    text: 'The more copies you field of one summon, the stronger they all become, in clear steps. Which summon you mass is the build.',
  }),
  specialization({
    id: 'conduit-infestation',
    disciplineId: 'conduit-swarm',
    name: 'Infestation',
    text: 'Your summons\' hits infest the enemy, and the infestation hurts more as it builds. An infested enemy that dies bursts into short-lived summons.',
  }),
  specialization({
    id: 'conduit-shield-wall',
    disciplineId: 'conduit-pack',
    name: 'Shield Wall',
    text: 'Damage to any tank is split across all of your tanks. Each different kind of tank adds a layer.',
  }),
  specialization({
    id: 'conduit-the-hunt',
    disciplineId: 'conduit-pack',
    name: 'The Hunt',
    text: 'Each different kind of damage summon that has hit the target lately makes everyone hit it harder.',
  }),
  specialization({
    id: 'conduit-choir',
    disciplineId: 'conduit-pack',
    name: 'Choir',
    text: 'Each support\'s ability echoes, weaker, through your other supports.',
  }),
  specialization({
    id: 'conduit-colossus',
    disciplineId: 'conduit-elite',
    name: 'Colossus',
    text: 'Your summons cost more to field and grow huge, and every one of them shares a single extra trick.',
  }),
  specialization({
    id: 'conduit-ascendant',
    disciplineId: 'conduit-elite',
    name: 'Ascendant',
    text: 'Your summons grow stronger the longer a fight lasts. A healer that keeps them alive is what makes it pay.',
  }),
  specialization({
    id: 'conduit-two-souls',
    disciplineId: 'conduit-elite',
    name: 'Two Souls',
    text: 'You carry a second Soul. The two strengthen each other and the formation, and the second Soul costs Command to field.',
  }),
];

/**
 * T4 leaves (§7.7). The question is whether summons die well, come back well,
 * or survive. One column each, on every discipline.
 */
const LEAVES: readonly LeafDef[] = [
  leaf({
    id: 'conduit-burst',
    disciplineId: 'conduit-swarm',
    tier: 4,
    column: 'die-well',
    name: 'Burst',
    text: 'A dying summon explodes. With Burn Bright, a wave blows up as it burns out.',
  }),
  leaf({
    id: 'conduit-grand-entrance',
    disciplineId: 'conduit-swarm',
    tier: 4,
    column: 'come-back-well',
    name: 'Grand Entrance',
    text: 'Every rebuilt summon stuns the enemies around it for a moment as it lands.',
  }),
  leaf({
    id: 'conduit-devour',
    disciplineId: 'conduit-swarm',
    tier: 4,
    column: 'survive',
    name: 'Devour',
    text: 'A summon that has lived a while starts stealing health back.',
  }),
  leaf({
    id: 'conduit-avenge',
    disciplineId: 'conduit-pack',
    tier: 4,
    column: 'die-well',
    name: 'Avenge',
    text: 'When a summon dies, the rest strike its killer together.',
  }),
  leaf({
    id: 'conduit-fall-back',
    disciplineId: 'conduit-pack',
    tier: 4,
    column: 'come-back-well',
    name: 'Fall Back',
    text: 'A hurt summon retreats behind your tanks, recovers, and rejoins the fight.',
  }),
  leaf({
    id: 'conduit-rally',
    disciplineId: 'conduit-pack',
    tier: 4,
    column: 'survive',
    name: 'Rally',
    text: 'When your different summons strike together, the blow also mends the whole formation.',
  }),
  leaf({
    id: 'conduit-final-command',
    disciplineId: 'conduit-elite',
    tier: 4,
    column: 'die-well',
    name: 'Final Command',
    text: 'A dying elite uses its extra one last time, and it lands much harder.',
  }),
  leaf({
    id: 'conduit-last-stand',
    disciplineId: 'conduit-elite',
    tier: 4,
    column: 'come-back-well',
    name: 'Last Stand',
    text: 'Once in a fight, an elite that would die holds on with a scrap of health for a few seconds.',
  }),
  leaf({
    id: 'conduit-shared-burden',
    disciplineId: 'conduit-elite',
    tier: 4,
    column: 'survive',
    name: 'Shared Burden',
    text: 'Part of the damage your elites take is paid out of your health.',
  }),
];

export const CONDUIT_KIT: ClassKit<ConduitPiece, ConduitTrophy> = {
  classId: 'summoner',
  className: 'conduit',
  displayName: 'Conduit',
  systemName: 'Formation',
  /** Illustrative: Command 4 → 6 through T1, 6 → 9 through T2 (§7.2). */
  budget: { label: 'Command', steps: standardBudgetSteps(4) },
  pieces: PIECES,
  lessons: LESSONS,
  trophies: TROPHIES,
  disciplines: DISCIPLINES,
  specializations: SPECIALIZATIONS,
  leaves: LEAVES,
};
