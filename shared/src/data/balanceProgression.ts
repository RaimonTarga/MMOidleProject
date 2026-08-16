export interface BalanceProgressionStep {
  biomeId: string;
  order: number;
  locked: boolean;
  mustExceedPrevious: boolean;
  minimumVsBaseline?: number;
}

export interface BalanceMonsterAuthoringRole {
  monsterId: string;
  role: string;
  purpose: string;
}

export interface BalanceBiomeAuthoringBrief {
  biomeId: string;
  identity: string;
  playerTest: string;
  baseStatLevers: string[];
  mechanicLevers: string[];
  avoid: string[];
  roster: BalanceMonsterAuthoringRole[];
}

export interface BalanceProgressionPolicy {
  id: string;
  name: string;
  tier: number;
  status: 'draft' | 'approved';
  baselineBiomeId: string;
  assessmentMetric: 'encounter-burden-v1';
  assessmentStatus: 'analytical-proxy';
  steps: BalanceProgressionStep[];
  authoringBriefs: BalanceBiomeAuthoringBrief[];
  authoringRules: string[];
  validationRules: string[];
}

/**
 * Machine-readable design intent for the first intra-tier progression pass.
 *
 * This deliberately records only decisions the designer has made. Intermediate
 * target multipliers remain open instead of being invented by a tuning agent.
 * `locked` means an automated proposal must not modify that biome's monsters,
 * pool weights, density, bosses, or rewards.
 */
export const T1_STARTER_PROGRESSION: BalanceProgressionPolicy = {
  id: 't1-starter-biomes-v1',
  name: 'T1 starter-biome climb',
  tier: 1,
  status: 'draft',
  baselineBiomeId: 'plains',
  assessmentMetric: 'encounter-burden-v1',
  assessmentStatus: 'analytical-proxy',
  steps: [
    { biomeId: 'plains', order: 0, locked: true, mustExceedPrevious: false },
    { biomeId: 'forest', order: 1, locked: false, mustExceedPrevious: true },
    { biomeId: 'swamp', order: 2, locked: false, mustExceedPrevious: true },
    { biomeId: 'mountain', order: 3, locked: false, mustExceedPrevious: true },
    { biomeId: 'cave', order: 4, locked: false, mustExceedPrevious: true, minimumVsBaseline: 1.5 },
  ],
  authoringBriefs: [
    {
      biomeId: 'plains',
      identity: 'Readable swarm baseline: many fragile bodies and a charger that catches disengaging players.',
      playerTest: 'Learn basic target selection and respect group pressure without facing a stat wall.',
      baseStatLevers: [],
      mechanicLevers: [],
      avoid: ['Any authored change during this pass; Plains is the locked control.'],
      roster: [
        { monsterId: 'plains-slime', role: 'Swarm filler', purpose: 'Low individual threat; density creates the danger.' },
        { monsterId: 'boar', role: 'Swarm catcher', purpose: 'Charge closes the gap and prevents effortless disengagement.' },
      ],
    },
    {
      biomeId: 'forest',
      identity: 'Fast, frequent predators: low per-hit pressure becomes dangerous through pursuit and pack coordination.',
      playerTest: 'React to a mobile wolf pack and decide whether to collapse its alpha before the group surrounds you.',
      baseStatLevers: ['attack cooldown', 'movement speed', 'pull range', 'light HP'],
      mechanicLevers: ['wolf alpha/follower pack', 'call-allies cadence', 'pursuit and separation'],
      avoid: ['Turning Forest into armored sponges.', 'Raising single-hit burst until it resembles Mountain.'],
      roster: [
        { monsterId: 'forest-slime', role: 'Tempo attacker', purpose: 'Establishes the biome’s frequent-hit rhythm.' },
        { monsterId: 'wolf', role: 'Pack alpha', purpose: 'Creates coordinated multi-body pressure with young wolves.' },
      ],
    },
    {
      biomeId: 'swamp',
      identity: 'Slow attrition engines: direct hits look harmless while poison becomes the real clock.',
      playerTest: 'Judge when a prolonged fight becomes unsustainable and value cleanse, resistance, or disengagement.',
      baseStatLevers: ['HP', 'attack cooldown', 'plating on the durable stacker', 'low direct attack'],
      mechanicLevers: ['DoT stack rate', 'DoT duration', 'different poison cadence between monsters'],
      avoid: ['Hiding most difficulty in direct attack.', 'Making both monsters identical poison applicators.'],
      roster: [
        { monsterId: 'bog-slime', role: 'Poison primer', purpose: 'Applies the readable baseline toxin quickly.' },
        { monsterId: 'mud-toad', role: 'Durable stacker', purpose: 'Lives long enough for attrition to mature.' },
      ],
    },
    {
      biomeId: 'mountain',
      identity: 'Telegraphed positional burst: slow enemies own chokepoints and punish missed reactions with huge hits.',
      playerTest: 'Read charges and casts, move around terrain, and choose when to mitigate rather than face-tank.',
      baseStatLevers: ['attack', 'long attack cooldown', 'HP', 'range', 'low movement outside charges'],
      mechanicLevers: ['charged attacks', 'chokepoint posts', 'ledge traversal', 'interruptible wind-ups'],
      avoid: ['High sustained attack frequency.', 'Untelegraphed burst.', 'Solving danger with armor alone.'],
      roster: [
        { monsterId: 'cliff-hopper', role: 'Charging bruiser', purpose: 'Forces a close-range reaction with a readable kick.' },
        { monsterId: 'ridge-archer', role: 'Artillery sentinel', purpose: 'Controls space with a slow, interruptible power shot.' },
      ],
    },
    {
      biomeId: 'cave',
      identity: 'Low-density elite exam: mixed threats, real defenses, patrol pressure, and avoidable area denial.',
      playerTest: 'Adapt damage profile and movement to two unlike elites instead of using one universal answer.',
      baseStatLevers: ['HP', 'plating', 'damage reduction', 'contrasting speed', 'pull range'],
      mechanicLevers: ['patrol routes', 'charge-to-contact', 'telegraphed ground slam', 'mixed fast/slow roster'],
      avoid: ['Scaling both monsters into the same brute.', 'Making Ground Slam unavoidable.', 'Using raw HP as the only progression gate.'],
      roster: [
        { monsterId: 'cave-lurker', role: 'Relentless skirmisher', purpose: 'Tests sustained defense and answers slow builds.' },
        { monsterId: 'cave-brute', role: 'Patrolling area-denial elite', purpose: 'Combines armor, engagement risk, and an avoidable slam.' },
      ],
    },
  ],
  authoringRules: [
    'Keep Plains T1 authored values unchanged as the baseline.',
    'Tune normal monster combat values before bosses or rewards.',
    'Preserve each biome identity and each monster mechanic; change shape only by explicit design decision.',
    'Author every monster’s base stats and encounter role individually; never ship a biome-wide stat multiplier.',
    'Use new or composed mechanics when they create readable counterplay, not merely hidden damage.',
    'Never apply a generated proposal directly to canonical data without a reviewed diff.',
  ],
  validationRules: [
    'Validate the ordered climb with runtime farm/fight benches across representative builds.',
    'Inspect lethality, durability, spike, clear time, deaths, and rewards separately before accepting an overall result.',
    'Re-run the full balance report and regression suite after every accepted batch.',
  ],
};
