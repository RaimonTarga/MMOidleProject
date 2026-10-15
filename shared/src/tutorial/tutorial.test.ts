import { biomeLevelCap, globalMastery } from '../config/gameConfig';
import { SKILL_TREE } from '../data/skillTree';
import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { emptyEquipment, type EssenceType } from '../items';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { absoluteZoneLevel } from '../classKits/registry';
import { bossClearKey } from '../systems/biomeProgress';
import { tutorialNodeFor } from './nodes';
import {
  T1_BIOME_ORDER,
  TUTORIAL_ANCHORS,
  TUTORIAL_CLASS_BEATS,
  TUTORIAL_CONCEPTS,
  TUTORIAL_CONCEPTS_PER_LEVEL,
  TUTORIAL_FAREWELL,
  TUTORIAL_OPENING,
  TUTORIAL_SEALS,
  buildSealRouteBeats,
  evaluateTutorialCondition,
  nextStepOf,
  resolveBeatIndex,
  tutorialChecklist,
  tutorialProgress,
  tutorialScriptFor,
  type TutorialBeat,
  type TutorialCondition,
  type TutorialConcept,
  type TutorialConceptId,
  type TutorialScript,
  type TutorialView,
} from './index';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NO_ESSENCE: Record<EssenceType, number> = { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };

function view(overrides: Partial<TutorialView> = {}): TutorialView {
  const base: TutorialView = {
    nodeId: 'node-clearing',
    hp: 100,
    maxHp: 100,
    isDead: false,
    playerTier: 0,
    selectedClass: null,
    biomeLevel: {},
    globalMastery: 0,
    unlockedRecipes: [],
    essences: { ...NO_ESSENCE },
    inventory: [],
    equipment: emptyEquipment(),
    itemUpgrades: {},
    questProgress: {},
    bossesCleared: [],
    clearedNodes: [],
  };
  const merged = { ...base, ...overrides };
  return { ...merged, globalMastery: globalMastery(merged.biomeLevel) };
}

const beatIndex = (script: TutorialScript, id: string): number => script.beats.findIndex((beat) => beat.id === id);

const FROM_CLEARING = { nodeId: 'node-clearing', clearedNodes: [] as const };

// ── Opening: resume from state ───────────────────────────────────────────────
{
  const O = TUTORIAL_OPENING;
  assert(resolveBeatIndex(O, view()) === 0, 'a fresh character starts at the tier-0 quest');
  assert(!!O.beats[0].progress?.some((p) => p.type === 'questKills'), 'the first beat shows the quest count');
  // The club and the armor are made DURING the quest (the first-hour checklist).
  const armed = { equipment: { ...emptyEquipment(), weapon: 'primordial-club', armor: 'clearing-vest-t1' } };
  assert(resolveBeatIndex(O, view(armed)) === beatIndex(O, 'first-blood'), 'armed at tier 0 resumes at the rest of the quest');
  assert(resolveBeatIndex(O, view({ ...armed, playerTier: 1 })) === beatIndex(O, 'choose-class'), 'tier 1 without a class resumes at the class pick');
  assert(beatIndex(O, 'craft:clearing-vest-t1') < beatIndex(O, 'first-blood'), 'the armor comes before the quest ends');
  const classed = { playerTier: 1, selectedClass: 'cadence-root' };
  assert(resolveBeatIndex(O, view(classed)) === beatIndex(O, 'farm:primordial-club'), 'a new class with no club waits on the club farm');
  const affordable = view({
    ...classed,
    biomeLevel: { clearing: 1 },
    unlockedRecipes: ['primordial-club'],
    essences: { ...NO_ESSENCE, green: 4 },
  });
  assert(resolveBeatIndex(O, affordable) === beatIndex(O, 'craft:primordial-club'), 'an affordable club skips the farm beat');
  const craftBeat = O.beats[beatIndex(O, 'craft:primordial-club')];
  assert(nextStepOf(O, craftBeat, affordable)?.type === 'craft', 'craft comes before equip');
  const inBag = view({ ...classed, biomeLevel: { clearing: 1 }, unlockedRecipes: ['primordial-club'], inventory: ['primordial-club'] });
  assert(resolveBeatIndex(O, inBag) === beatIndex(O, 'craft:primordial-club'), 'crafting spends the essence; the farm beat stays done');
  assert(nextStepOf(O, craftBeat, inBag)?.type === 'equip', 'the craft half is already satisfied');
}

// ── Supersession ─────────────────────────────────────────────────────────────
{
  const synthetic: TutorialScript = {
    id: 'synthetic',
    classRoot: null,
    beats: [
      { id: 'club', chapter: 'x', say: 'club', steps: [{ type: 'equip', definitionIds: ['primordial-club'] }] },
      { id: 'sword', chapter: 'x', say: 'sword', steps: [{ type: 'equip', definitionIds: ['iron-broadsword'] }] },
    ],
  };
  const sword = { ...emptyEquipment(), weapon: 'iron-broadsword' };
  assert(resolveBeatIndex(synthetic, view({ equipment: sword })) === 2, 'a later weapon supersedes the club');
  assert(
    resolveBeatIndex(synthetic, view({ equipment: { ...emptyEquipment(), weapon: 'flash-rapier' } })) === 0,
    'a weapon the script never equips is taken over, not treated as progress',
  );
}

// ── Progress readouts ────────────────────────────────────────────────────────
{
  const [quest] = tutorialProgress({ type: 'questKills', questId: 'tier-0' }, view({ questProgress: { 'tier-0': 4 } }));
  assert(quest?.current === 4 && quest.target === 10, 'quest progress reads kills out of ten');
  const [essence] = tutorialProgress({ type: 'essenceFor', recipeId: 'primordial-club' }, view({ essences: { ...NO_ESSENCE, green: 9 } }));
  assert(essence?.current === 4 && essence.target === 4, 'essence progress is clamped to the cost');
}

// ── The seal route ───────────────────────────────────────────────────────────
const SAY_LIMIT = 170;

function conditionsIn(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === 'allOf' || condition.type === 'anyOf') return [condition, ...condition.of.flatMap(conditionsIn)];
  if (condition.type === 'not') return [condition, ...conditionsIn(condition.of)];
  return [condition];
}

/** Tier-0 skill nodes: the six class roots the seam is keyed by. */
const CLASS_ROOTS = [...SKILL_TREE.values()].filter((node) => node.tier === 0 && node.parent === null);

const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;
const WALK_BIOMES = T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL);

assert(FIRST_SEAL === 'plains' && SECOND_SEAL === 'mountain', 'the two seals stay Plains, then Mountain');
assert(WALK_BIOMES.join(',') === 'forest,swamp,cave', 'between the seals the walk is Forest, Swamp, Cave');

const route = buildSealRouteBeats();
const routeIds = [
  `open:${FIRST_SEAL}`,
  `boss:${FIRST_SEAL}`,
  ...WALK_BIOMES.map((biome) => `zone:${biome}`),
  `boss:${SECOND_SEAL}`,
  'farewell',
];
assert(route.map((beat) => beat.id).join(',') === routeIds.join(','), `seal route ids: ${route.map((b) => b.id).join(',')}`);
assert(route[route.length - 1].id === 'farewell', 'the seal route ends on the farewell beat');
assert(route[route.length - 1].say === TUTORIAL_FAREWELL[0], 'the farewell beat speaks the guide\'s goodbye');
assert(route[route.length - 1].chapter === 'Farewell', 'the farewell beat is its own chapter');

for (const beat of route) {
  assert(beat.steps.length === 1, `${beat.id}: one step`);
  const step = beat.steps[0];
  if (beat.id.startsWith('boss:')) {
    assert(step.type === 'attemptBoss', `${beat.id}: a boss fight`);
    if (step.type !== 'attemptBoss') continue;
    assert(step.tier === 1 && step.until === undefined, `${beat.id}: a tier-1 boss with no extra gate`);
    assert(step.biomeGroup === beat.id.slice('boss:'.length), `${beat.id}: boss biome`);
    continue;
  }
  assert(step.type === 'farm', `${beat.id}: a fight, not a craft`);
  if (step.type !== 'farm') continue;
  if (beat.id === 'farewell') {
    assert(step.at.kind === 'biome' && step.at.biomeGroup === SECOND_SEAL && step.at.tier === 1, 'farewell stands in the second seal\'s zone');
    assert(step.until.type === 'playerTierAtLeast' && step.until.tier === 2, 'farewell waits on tier 2');
    continue;
  }
  const biome = beat.id.slice(beat.id.indexOf(':') + 1);
  const cap = biomeLevelCap(1, biome);
  assert(step.at.kind === 'biome' && step.at.biomeGroup === biome && step.at.tier === 1, `${beat.id}: farms its own tier-1 zone`);
  assert(step.until.type === 'biomeLevelAtLeast' && step.until.level === cap, `${beat.id}: waits for the tier cap (${cap}), not a written-in level`);
}

{
  const taught = route.flatMap((beat) => beat.teaches ?? []);
  assert(taught.join(',') === 'zones,seals,boss-altar,poison', `seal route teaches ${taught.join(',')}`);
  const swamp = route.find((beat) => beat.id === 'zone:swamp');
  assert(swamp?.teaches?.join(',') === 'poison', 'poison is introduced in the Swamp');
  const plainsBoss = route.find((beat) => beat.id === 'boss:plains');
  assert(plainsBoss?.teaches?.join(',') === 'seals,boss-altar', 'the first seal introduces seals and the altar');
}

// ── Every class root gets the opening, then the seal route or its own builder ─
assert(Object.keys(TUTORIAL_CLASS_BEATS).join(',') === 'cadence-root,cooldown-root,summoner-root,reload-root,energy-root,dot-root', 'every class has its builder registered');
assert(CLASS_ROOTS.length === 6, `six class roots, found ${CLASS_ROOTS.map((node) => node.id).join(',')}`);

function sameRoute(script: TutorialScript): void {
  assert(script.beats.length === TUTORIAL_OPENING.beats.length + route.length, `${script.id}: opening plus the seal route`);
  script.beats.slice(0, TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
    assert(beat === TUTORIAL_OPENING.beats[i], `${script.id}: opening beat ${beat.id} was replaced`);
  });
  script.beats.slice(TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
    assert(beat.id === route[i].id && beat.say === route[i].say && beat.chapter === route[i].chapter,
      `${script.id}: beat ${i} is ${beat.id}, not ${route[i].id}`);
  });
}

/** The Striker tail: seal ids, in seal order, with the lesson beats inserted. */
const STRIKER_TAIL = [
  'open:plains',
  'striker:sweep',
  'boss:plains',
  'zone:forest',
  'striker:hamstring',
  'zone:swamp',
  'striker:rend',
  'zone:cave',
  'striker:focus',
  'striker:mountain',
  'boss:mountain',
  'farewell',
  // The Tier 2 stretch (T2-W2): zone, lesson, boss for each of the seven T2 zones.
  ...['plains', 'forest', 'mountain', 'swamp', 'cave', 'jungle', 'desert']
    .flatMap((zone) => [`striker2:${zone}`, `striker2:${zone}-lesson`, `striker2:${zone}-boss`]),
  // The Tier 3 stretch (T3-W2): the same shape over the seven T3 zones.
  ...['mountain', 'swamp', 'cave', 'jungle', 'desert', 'tundra', 'volcanic']
    .flatMap((zone) => [`striker3:${zone}`, `striker3:${zone}-lesson`, `striker3:${zone}-boss`]),
];

function farmGate(beat: TutorialBeat, biome: string): number | null {
  const step = beat.steps[0];
  if (!step || step.type !== 'farm') return null;
  const gates = conditionsIn(step.until).filter(
    (condition): condition is Extract<TutorialCondition, { type: 'biomeLevelAtLeast' }> =>
      condition.type === 'biomeLevelAtLeast' && condition.biomeGroup === biome,
  );
  if (gates.length === 0) return null;
  return Math.max(...gates.map((gate) => gate.level));
}

function assertStrikerTail(script: TutorialScript): void {
  assert(script.beats.length === TUTORIAL_OPENING.beats.length + STRIKER_TAIL.length,
    `${script.id}: opening plus the Striker tail`);
  script.beats.slice(0, TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
    assert(beat === TUTORIAL_OPENING.beats[i], `${script.id}: opening beat ${beat.id} was replaced`);
  });
  const tail = script.beats.slice(TUTORIAL_OPENING.beats.length);
  assert(tail.map((beat) => beat.id).join(',') === STRIKER_TAIL.join(','),
    `${script.id}: tail is ${tail.map((beat) => beat.id).join(',')}`);
  const say = (id: string) => tail.find((beat) => beat.id === id)?.say ?? '';
  assert(say('open:plains').includes('combo'), 'the plains open beat teaches the combo');
  assert(say('striker:sweep').includes('Sweep'), 'Sweep has its own beat');
  assert(say('zone:forest').includes('finisher'), 'the forest beat opens on the trophy');
  assert(say('striker:hamstring').includes('Hamstring') && say('striker:rend').includes('Rend'), 'Hamstring and Rend have their own beats');
  assert(say('striker:focus').includes('Focus') && say('boss:mountain').includes('Coil'), 'Focus and Coil name the cast');
  assert(tail.find((beat) => beat.id === 'farewell')?.say === TUTORIAL_FAREWELL[0], 'the Striker route still says the farewell line');
  assert(tail[tail.length - 1].id === 'striker3:volcanic-boss', 'the Striker route ends on the last Tier 3 boss');
  assert(say('striker3:mountain').includes('specialization'), 'the first Tier 3 line points at the specialization pick');
  assert(say('striker3:tundra-lesson').includes('Icebreaker') && say('striker3:volcanic-lesson').includes('Overheat'), 'the new Tier 3 lessons have lines');
  assert(say('striker3:tundra-boss').includes('Hoarfrost') && say('striker3:volcanic-boss').includes('Eruption'), 'the new trophies are named');
  for (const beat of tail.filter((entry) => entry.id.startsWith('striker3:'))) {
    assert(beat.say.length < 200, `${beat.id}: a Tier 3 line stays short`);
    assert(beat.steps.every((step) => (step.type === 'farm' && step.at.kind === 'biome' && step.at.tier === 3)
      || (step.type === 'attemptBoss' && step.tier === 3)), `${beat.id}: Tier 3 steps stay in Tier 3`);
  }
  assert(say('striker2:plains').includes('discipline'), 'the first Tier 2 line points at the discipline pick');
  assert(say('striker2:jungle-lesson').includes('Charge') && say('striker2:desert-lesson').includes('Pin'), 'the new Tier 2 lessons have lines');
  for (const beat of tail.filter((entry) => entry.id.startsWith('striker2:'))) {
    assert(beat.say.length < 170, `${beat.id}: a Tier 2 line stays short`);
    assert(beat.steps.every((step) => (step.type === 'farm' && step.at.kind === 'biome' && step.at.tier === 2)
      || (step.type === 'attemptBoss' && step.tier === 2)), `${beat.id}: Tier 2 steps stay in Tier 2`);
  }
  // The lesson line is the beat that starts at level 2: the approach stops there,
  // and the technique beat carries on to the seal route's cap.
  for (const [approach, technique, biome] of [
    ['open:plains', 'striker:sweep', 'plains'],
    ['zone:forest', 'striker:hamstring', 'forest'],
    ['zone:swamp', 'striker:rend', 'swamp'],
    ['zone:cave', 'striker:focus', 'cave'],
  ] as const) {
    const approachBeat = tail.find((beat) => beat.id === approach);
    const techniqueBeat = tail.find((beat) => beat.id === technique);
    if (!approachBeat || !techniqueBeat) throw new Error(`${approach} and ${technique} exist`);
    assert(farmGate(approachBeat, biome) === 2, `${approach} ends at the lesson`);
    assert(farmGate(techniqueBeat, biome) === biomeLevelCap(1, biome), `${technique} carries on to the tier cap`);
  }
  const mountain = tail.find((beat) => beat.id === 'striker:mountain');
  if (!mountain) throw new Error('the Mountain farm is missing');
  assert(farmGate(mountain, 'mountain') === 2, 'the Mountain farm ends at Coil\'s lesson');
}

/** The Conduit tail: seal ids, in seal order, with the specialist beats inserted. */
const CONDUIT_TAIL = [
  'open:plains',
  'conduit:warden',
  'boss:plains',
  'zone:forest',
  'conduit:thornrunner',
  'zone:swamp',
  'conduit:bile-spitter',
  'zone:cave',
  'conduit:cave-brute',
  'conduit:mountain',
  'boss:mountain',
  'farewell',
  // Tier 2: the discipline pick, then three beats per zone (T2-W2).
  ...['plains', 'forest', 'swamp', 'cave', 'mountain', 'jungle', 'desert']
    .flatMap((biome) => [`t2:${biome}`, `t2:${biome}-lesson`, `t2:${biome}-boss`]),
  't2:done',
  // Tier 3: the specialization pick, then three beats per zone (T3-W2).
  ...['mountain', 'cave', 'swamp', 'jungle', 'desert', 'tundra', 'volcanic']
    .flatMap((biome) => [`t3:${biome}`, `t3:${biome}-lesson`, `t3:${biome}-boss`]),
  't3:done',
];

function assertConduitTail(script: TutorialScript): void {
  assert(script.beats.length === TUTORIAL_OPENING.beats.length + CONDUIT_TAIL.length,
    `${script.id}: opening plus the Conduit tail`);
  script.beats.slice(0, TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
    assert(beat === TUTORIAL_OPENING.beats[i], `${script.id}: opening beat ${beat.id} was replaced`);
  });
  const tail = script.beats.slice(TUTORIAL_OPENING.beats.length);
  assert(tail.map((beat) => beat.id).join(',') === CONDUIT_TAIL.join(','),
    `${script.id}: tail is ${tail.map((beat) => beat.id).join(',')}`);
  const say = (id: string) => tail.find((beat) => beat.id === id)?.say ?? '';
  assert(say('open:plains').includes('Command') && say('open:plains').includes('Thralls') && say('open:plains').includes('Recall'),
    'the plains open beat teaches Command, the Thralls and Recall');
  assert(say('conduit:warden').includes('Plains Warden') && say('conduit:warden').includes('taunt'),
    'the Plains Warden has its own beat');
  assert(say('zone:forest').includes('Soul') && say('zone:forest').includes('relic'),
    'the forest beat opens on the Soul');
  assert(say('conduit:thornrunner').includes('Thornrunner') && say('conduit:bile-spitter').includes('Bile Spitter'),
    'Thornrunner and Bile Spitter have their own beats');
  assert(say('conduit:cave-brute').includes('Cave Brute') && say('boss:mountain').includes('Ridge Marksman'),
    'Cave Brute and Ridge Marksman are named');
  assert(tail.find((beat) => beat.id === 'farewell')?.say === TUTORIAL_FAREWELL[0], 'the Conduit Tier 1 part still ends on the farewell line');
  const farewellAt = tail.findIndex((beat) => beat.id === 'farewell');
  assert(tail.slice(0, farewellAt + 1).map((beat) => beat.id).join(',') === CONDUIT_TAIL.slice(0, farewellAt + 1).join(','), 'Tier 1 beats come first');
  // Tier 2: the discipline pick, each T2 lesson, each Soul rank-up.
  assert(say('t2:plains').includes('discipline') && say('t2:plains').includes('Passive Tree'), 'the first Tier 2 beat sends the player to pick a discipline');
  for (const [id, name] of [
    ['t2:plains-lesson', 'Ironhorn'], ['t2:forest-lesson', 'Barkward'], ['t2:swamp-lesson', 'Bog Leech'],
    ['t2:cave-lesson', 'Bonecrusher'], ['t2:mountain-lesson', 'Rockhurler'], ['t2:jungle-lesson', 'Bloomtender'],
    ['t2:desert-lesson', 'Executioner'],
  ] as const) assert(say(id).includes(name), `${id} names ${name}`);
  for (const [id, soul] of [
    ['t2:forest', 'Razortusk'], ['t2:swamp', 'Timberclaw'], ['t2:cave', 'Mire Behemoth'], ['t2:mountain', 'Dreadbore'],
    ['t2:jungle', 'Stoneplate'], ['t2:desert', 'Dread-Gorger'], ['t2:done', 'Dune-Stalker'],
  ] as const) assert(say(id).includes(soul), `${id} announces the ${soul} Soul`);
  for (const biome of ['plains', 'forest', 'swamp', 'cave', 'mountain', 'jungle', 'desert']) {
    const lesson = tail.find((beat) => beat.id === `t2:${biome}`);
    const cap = tail.find((beat) => beat.id === `t2:${biome}-lesson`);
    const boss = tail.find((beat) => beat.id === `t2:${biome}-boss`);
    const gate = (beat: TutorialBeat | undefined) => {
      const step = beat?.steps[0];
      return step?.type === 'farm' && step.until.type === 'biomeLevelAtLeast' && step.at.kind === 'biome' && step.at.tier === 2 ? step.until.level : -1;
    };
    assert(gate(lesson) > 0 && gate(cap) === biomeLevelCap(2, biome), `t2:${biome} farms Tier 2 to the lesson, then to the cap`);
    const bossStep = boss?.steps[0];
    assert(bossStep?.type === 'attemptBoss' && bossStep.tier === 2 && bossStep.biomeGroup === biome, `t2:${biome}-boss fights the Tier 2 boss`);
  }
  const plainsBoss = tail.find((beat) => beat.id === 'boss:plains');
  const swamp = tail.find((beat) => beat.id === 'zone:swamp');
  const open = tail.find((beat) => beat.id === 'open:plains');
  assert(open?.teaches?.join(',') === 'zones', 'the Plains open still teaches zones');
  assert(plainsBoss?.teaches?.join(',') === 'seals,boss-altar', 'the first seal still teaches seals and the altar');
  assert(swamp?.teaches?.join(',') === 'poison', 'poison is still introduced in the Swamp');
  for (const [approach, specialist, biome] of [
    ['open:plains', 'conduit:warden', 'plains'],
    ['zone:forest', 'conduit:thornrunner', 'forest'],
    ['zone:swamp', 'conduit:bile-spitter', 'swamp'],
    ['zone:cave', 'conduit:cave-brute', 'cave'],
  ] as const) {
    const approachBeat = tail.find((beat) => beat.id === approach);
    const specialistBeat = tail.find((beat) => beat.id === specialist);
    if (!approachBeat || !specialistBeat) throw new Error(`${approach} and ${specialist} exist`);
    assert(farmGate(approachBeat, biome) === 2, `${approach} ends at the lesson`);
    assert(farmGate(specialistBeat, biome) === biomeLevelCap(1, biome), `${specialist} carries on to the tier cap`);
  }
  const mountain = tail.find((beat) => beat.id === 'conduit:mountain');
  // Tier 3: the specialization pick, each T3 lesson, each Soul.
  assert(say('t3:mountain').includes('specialization') && say('t3:mountain').includes('Passive Tree'), 'the first Tier 3 beat sends the player to pick a specialization');
  for (const [id, name] of [
    ['t3:mountain-lesson', 'Warhorn'], ['t3:cave-lesson', 'Burrower'], ['t3:swamp-lesson', 'Sporecaller'],
    ['t3:jungle-lesson', 'Prowler'], ['t3:desert-lesson', 'Carapace Guard'], ['t3:tundra-lesson', 'Frostcaller'],
    ['t3:volcanic-lesson', 'Cinderling'],
  ] as const) assert(say(id).includes(name), `${id} names ${name}`);
  for (const [id, soul] of [
    ['t3:cave', 'Stoneplate'], ['t3:swamp', 'Dreadbore'], ['t3:jungle', 'Mire Behemoth'], ['t3:desert', 'Dread-Gorger'],
    ['t3:tundra', 'Dune-Stalker'], ['t3:volcanic', 'Rime-Mammoth'], ['t3:done', 'Magma Salamander'],
  ] as const) assert(say(id).includes(soul), `${id} announces the ${soul} Soul`);
  for (const biome of ['mountain', 'cave', 'swamp', 'jungle', 'desert', 'tundra', 'volcanic']) {
    const lesson = tail.find((beat) => beat.id === `t3:${biome}`);
    const cap = tail.find((beat) => beat.id === `t3:${biome}-lesson`);
    const boss = tail.find((beat) => beat.id === `t3:${biome}-boss`);
    const gate = (beat: TutorialBeat | undefined) => {
      const step = beat?.steps[0];
      return step?.type === 'farm' && step.until.type === 'biomeLevelAtLeast' && step.at.kind === 'biome' && step.at.tier === 3 ? step.until.level : -1;
    };
    assert(gate(lesson) > 0 && gate(cap) === biomeLevelCap(3, biome), `t3:${biome} farms Tier 3 to the lesson, then to the cap`);
    assert(gate(lesson) < gate(cap), `t3:${biome}: the lesson comes before the cap`);
    const bossStep = boss?.steps[0];
    assert(bossStep?.type === 'attemptBoss' && bossStep.tier === 3 && bossStep.biomeGroup === biome, `t3:${biome}-boss fights the Tier 3 boss`);
  }
  if (!mountain) throw new Error('the Mountain farm is missing');
  assert(farmGate(mountain, 'mountain') === 2, 'the Mountain farm ends at the Ridge Marksman lesson');
}

/** The Slinger tail: seal ids, in seal order, with the clip beats inserted. */
const SLINGER_TAIL = [
  'open:plains',
  'slinger:scatter',
  'boss:plains',
  'zone:forest',
  'slinger:snare',
  'zone:swamp',
  'slinger:venom',
  'zone:cave',
  'slinger:breaching',
  'slinger:mountain',
  'boss:mountain',
  'farewell',
  // The T2 stretch: approach, lesson, boss, per zone.
  ...['plains:buckshot', 'forest:snare-ii', 'mountain:shellbreaker', 'swamp:venom-ii', 'cave:breaching-ii', 'jungle:tracer', 'desert:hollow-point']
    .flatMap((pair) => {
      const [biome, lesson] = pair.split(':');
      return [`t2:${biome}`, `slinger:${lesson}`, `boss:${biome}:2`];
    }),
  // The T3 stretch: the specialization pick rides the first approach.
  ...['mountain:stopping-ii', 'cave:seeker', 'swamp:acid', 'jungle:tracer-ii', 'desert:tether', 'tundra:frost', 'volcanic:incendiary']
    .flatMap((pair) => {
      const [biome, lesson] = pair.split(':');
      return [`t3:${biome}`, `slinger:${lesson}`, `boss:${biome}:3`];
    }),
];

function assertSlingerTail(script: TutorialScript): void {
  assert(script.beats.length === TUTORIAL_OPENING.beats.length + SLINGER_TAIL.length,
    `${script.id}: opening plus the Slinger tail`);
  script.beats.slice(0, TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
    assert(beat === TUTORIAL_OPENING.beats[i], `${script.id}: opening beat ${beat.id} was replaced`);
  });
  const tail = script.beats.slice(TUTORIAL_OPENING.beats.length);
  assert(tail.map((beat) => beat.id).join(',') === SLINGER_TAIL.join(','),
    `${script.id}: tail is ${tail.map((beat) => beat.id).join(',')}`);
  const say = (id: string) => tail.find((beat) => beat.id === id)?.say ?? '';
  assert(say('open:plains').includes('plain pistol') && say('open:plains').includes('ammo ring'),
    'the plains open beat teaches the pistol and the ring');
  assert(say('open:plains').includes('stand still while you reload'), 'the reload is stationary');
  assert(say('slinger:scatter').includes('Scatter') && say('slinger:scatter').includes('three or more'),
    'Scatter has its own beat and its default rule');
  assert(say('boss:plains').includes('plain last round'), 'the first boss is still a plain last round');
  assert(say('zone:forest').includes('Stampede Round'), 'the forest beat opens on Stampede Round');
  assert(say('slinger:snare').includes('Snare') && say('slinger:venom').includes('Venom'),
    'Snare and Venom have their own beats');
  assert(say('slinger:breaching').includes('Breaching') && say('boss:mountain').includes('Stopping'),
    'Breaching and Stopping name the clip');
  assert(tail.find((beat) => beat.id === 'farewell')?.say === TUTORIAL_FAREWELL[0], 'the Slinger route keeps the farewell line, ahead of the T2 stretch');
  assert(say('t2:plains').includes('discipline') && say('t2:plains').includes('Passive Tree'), 'the first T2 beat points at the discipline pick');
  for (const [lesson, name] of [
    ['slinger:buckshot', 'Buckshot'], ['slinger:snare-ii', 'Snare'], ['slinger:shellbreaker', 'Shellbreaker'],
    ['slinger:venom-ii', 'Venom'], ['slinger:breaching-ii', 'Breaching'], ['slinger:tracer', 'Tracer'], ['slinger:hollow-point', 'Hollow-point'],
  ] as const) assert(say(lesson).includes(name), `${lesson} names its clip`);
  for (const [biome, trophy] of [
    ['plains', 'Stampede Round'], ['forest', 'Twin Round'], ['mountain', 'Quake Round'], ['swamp', 'Rot Round'],
    ['cave', 'Splinter Round'], ['jungle', "Hunter's Round"], ['desert', 'Bounty Round'],
  ] as const) {
    const boss = tail.find((beat) => beat.id === `boss:${biome}:2`);
    const step = boss?.steps[0];
    assert(step?.type === 'attemptBoss' && step.biomeGroup === biome && step.tier === 2, `boss:${biome}:2 fights the tier-2 boss`);
    assert(!!boss?.say.includes(trophy), `boss:${biome}:2 names ${trophy}`);
    const approach = tail.find((beat) => beat.id === `t2:${biome}`);
    const lesson = tail.find((beat) => beat.id.startsWith('slinger:') && beat.steps[0]?.type === 'farm' && beat.steps[0].at.kind === 'biome' && beat.steps[0].at.biomeGroup === biome && beat.steps[0].at.tier === 2);
    assert(!!approach && !!lesson, `${biome} has its T2 approach and lesson`);
    assert((farmGate(approach!, biome) ?? 0) < (farmGate(lesson!, biome) ?? 0), `${biome}: the approach stops at the lesson, the lesson runs on to the cap`);
    assert(farmGate(lesson!, biome) === biomeLevelCap(2, biome), `${biome}: the lesson beat runs to the tier-2 cap`);
  }
  for (const [approach, clip, biome] of [
    ['open:plains', 'slinger:scatter', 'plains'],
    ['zone:forest', 'slinger:snare', 'forest'],
    ['zone:swamp', 'slinger:venom', 'swamp'],
    ['zone:cave', 'slinger:breaching', 'cave'],
  ] as const) {
    const approachBeat = tail.find((beat) => beat.id === approach);
    const clipBeat = tail.find((beat) => beat.id === clip);
    if (!approachBeat || !clipBeat) throw new Error(`${approach} and ${clip} exist`);
    assert(farmGate(approachBeat, biome) === 2, `${approach} ends at the lesson`);
    assert(farmGate(clipBeat, biome) === biomeLevelCap(1, biome), `${clip} carries on to the tier cap`);
  }
  const mountain = tail.find((beat) => beat.id === 'slinger:mountain');
  if (!mountain) throw new Error('the Mountain farm is missing');
  assert(farmGate(mountain, 'mountain') === 2, 'the Mountain farm ends at Stopping\'s lesson');
}

function assertSpiritTail(script: TutorialScript): void {
  script.beats.slice(0, TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
    assert(beat === TUTORIAL_OPENING.beats[i], `${script.id}: opening beat ${beat.id} was replaced`);
  });
  const tail = script.beats.slice(TUTORIAL_OPENING.beats.length);
  assert(tail.slice(0, 12).map((beat) => beat.id).join(',') === [
    'open:plains', 'spirit:chain-lightning', 'boss:plains',
    'zone:forest', 'spirit:thunderclap', 'zone:swamp', 'spirit:downpour',
    'zone:cave', 'spirit:thunderbolt', 'spirit:mountain', 'boss:mountain', 'farewell',
  ].join(','), 'the Spirit keeps the seal route order and inserts its lessons');
  // The Tier-2 stretch follows the farewell: the discipline pick, each zone's lesson, each boss's rank-up.
  const t2 = tail.slice(12, 33);
  assert(t2.length === 21 && t2.every((beat) => beat.chapter.startsWith('Tier 2')), 'seven Tier-2 zones of three beats each');
  assert(t2[0].say.includes('discipline') && ['Overflow', 'Tide', 'Reservoir'].every((name) => t2[0].say.includes(name)), 'the first Tier-2 beat is the discipline pick');
  for (const [lesson, biome, name] of [
    ['spirit:gale-t2', 'plains', 'Gale'], ['spirit:thunderclap-t2', 'forest', 'Thunderclap'],
    ['spirit:hailstorm-t2', 'mountain', 'Hailstorm'], ['spirit:downpour-t2', 'swamp', 'Downpour'],
    ['spirit:updraft-t2', 'cave', 'Updraft'], ['spirit:flare-t2', 'jungle', 'Flare'],
    ['spirit:dust-devil-t2', 'desert', 'Dust Devil'],
  ] as const) {
    const beat = t2.find((entry) => entry.id === lesson)!;
    assert(beat?.say.includes(name), `${lesson} names the piece`);
    assert(farmGate(beat, biome) === biomeLevelCap(2, biome), `${lesson} continues to the Tier-2 cap`);
    const boss = t2.find((entry) => entry.id === `t2boss:${biome}`)!;
    assert(boss.steps.length === 1 && boss.steps[0].type === 'attemptBoss' && boss.steps[0].tier === 2, `${biome}: a Tier-2 boss beat`);
  }
  // The Tier-3 stretch (T3-W2): the specialization pick, then lesson and trophy per T3 zone.
  const t3 = tail.slice(33, 54);
  assert(t3.length === 21 && t3.every((beat) => beat.chapter.startsWith('Tier 3')), 'seven Tier-3 zones of three beats each');
  assert(t3[0].say.includes('specialization') && t3[0].say.includes('Passive Tree'), 'the first Tier-3 beat is the specialization pick');
  for (const [lesson, biome, name] of [
    ['spirit:downburst-t3', 'mountain', 'Downburst'], ['spirit:updraft-t3', 'cave', 'Updraft'],
    ['spirit:tailwind-t3', 'swamp', 'Tailwind'], ['spirit:forked-bolt-t3', 'jungle', 'Forked Bolt'],
    ['spirit:dust-devil-t3', 'desert', 'Dust Devil'], ['spirit:foehn-t3', 'tundra', 'Foehn'],
    ['spirit:ash-lightning-t3', 'volcanic', 'Ash Lightning'],
  ] as const) {
    const beat = t3.find((entry) => entry.id === lesson)!;
    assert(beat?.say.includes(name), `${lesson} names the piece`);
    assert(farmGate(beat, biome) === biomeLevelCap(3, biome), `${lesson} continues to the Tier-3 cap`);
    const boss = t3.find((entry) => entry.id === `t3boss:${biome}`)!;
    assert(boss.steps.length === 1 && boss.steps[0].type === 'attemptBoss' && boss.steps[0].tier === 3, `${biome}: a Tier-3 boss beat`);
  }
  assert(t3.find((beat) => beat.id === 't3boss:tundra')!.say.includes('Ice Storm') && t3.find((beat) => beat.id === 't3boss:volcanic')!.say.includes('Pyrocumulus'),
    'the new Tundra and Volcanic trophies are named');
  // The Tier-4 stretch (T4-W2): the leaf pick, then lesson and trophy per T4 zone.
  const t4 = tail.slice(54);
  assert(t4.length === 21 && t4.every((beat) => beat.chapter.startsWith('Tier 4')), 'seven Tier-4 zones of three beats each');
  assert(t4[0].say.includes('leaf') && t4[0].say.includes('Passive Tree'), 'the first Tier-4 beat is the leaf pick');
  for (const [lesson, biome, name] of [
    ['spirit:downburst-t4', 'mountain', 'Downburst'], ['spirit:sleet-t4', 'tundra', 'Sleet'],
    ['spirit:ground-charge-t4', 'jungle', 'Ground Charge'], ['spirit:dust-wall-t4', 'desert', 'Dust Wall'],
    ['spirit:ash-lightning-t4', 'volcanic', 'Ash Lightning'], ['spirit:thunderstorm-t4', 'graveyard', 'Thunderstorm'],
    ['spirit:maelstrom-t4', 'trench', 'Maelstrom'],
  ] as const) {
    const beat = t4.find((entry) => entry.id === lesson)!;
    assert(beat?.say.includes(name), `${lesson} names the piece`);
    assert(farmGate(beat, biome) === biomeLevelCap(4, biome), `${lesson} continues to the Tier-4 cap`);
    const boss = t4.find((entry) => entry.id === `t4boss:${biome}`)!;
    assert(boss.steps.length === 1 && boss.steps[0].type === 'attemptBoss' && boss.steps[0].tier === 4, `${biome}: a Tier-4 boss beat`);
  }
  assert(t4.find((beat) => beat.id === 't4boss:graveyard')!.say.includes('Stray Bolts') && t4.find((beat) => beat.id === 't4boss:trench')!.say.includes('Depth Charge'),
    'the new Wasteland and Trench trophies are named');
  const say = (id: string) => tail.find((beat) => beat.id === id)?.say ?? '';
  for (const text of ['plain rod', 'Storm 4', 'fills itself', 'Bolt band', '30% floor', 'gathers to full', 'breaks down to the floor', 'before HP']) {
    assert(say('open:plains').includes(text), `the Spirit intro teaches ${text}`);
  }
  assert(say('boss:plains').includes('base kit'), 'the first boss is faced with the base kit');
  assert(say('zone:forest').includes('Crosswind'), 'the first boss gives Crosswind');
  assert(say('boss:mountain').includes('Eye of the Storm'), 'Eye is taught before the Mountain seal');
  for (const [approach, lesson, biome, name] of [
    ['open:plains', 'spirit:chain-lightning', 'plains', 'Chain Lightning'],
    ['zone:forest', 'spirit:thunderclap', 'forest', 'Thunderclap'],
    ['zone:swamp', 'spirit:downpour', 'swamp', 'Downpour'],
    ['zone:cave', 'spirit:thunderbolt', 'cave', 'Thunderbolt'],
  ] as const) {
    const before = tail.find((beat) => beat.id === approach)!;
    const after = tail.find((beat) => beat.id === lesson)!;
    assert(farmGate(before, biome) === 2, `${approach} stops at the lesson`);
    assert(farmGate(after, biome) === biomeLevelCap(1, biome), `${lesson} continues to the tier cap`);
    assert(after.say.includes(name), `${lesson} names the piece`);
  }
  assert(farmGate(tail.find((beat) => beat.id === 'spirit:mountain')!, 'mountain') === 2,
    'Mountain stops at Eye of the Storm');
  assert(tail[11].say === TUTORIAL_FAREWELL[0], 'the Spirit keeps the farewell');
  for (const beat of tail) {
    assert(beat.say.length < SAY_LIMIT && (beat.waiting?.length ?? 0) < SAY_LIMIT,
      `${beat.id}: Spirit lines stay under 170 characters`);
  }
}

for (const root of CLASS_ROOTS) {
  const script = tutorialScriptFor(root.id);
  assert(script.id === `tutorial-${root.name.toLowerCase()}`, `${root.id}: id ${script.id}`);
  assert(script.classRoot === root.id, `${root.id}: class root is stored`);
  assert(tutorialScriptFor(root.id) === script, `${root.id}: the script is cached`);
  if (root.id === 'cadence-root') assertStrikerTail(script);
  else if (root.id === 'summoner-root') assertConduitTail(script);
  else if (root.id === 'reload-root') assertSlingerTail(script);
  else if (root.id === 'energy-root') assertSpiritTail(script);
  else if (TUTORIAL_CLASS_BEATS[root.id]) {
    script.beats.slice(0, TUTORIAL_OPENING.beats.length).forEach((beat, i) => {
      assert(beat === TUTORIAL_OPENING.beats[i], `${script.id}: opening beat ${beat.id} was replaced`);
    });
  } else {
    sameRoute(script);
  }
}

{
  const classless = tutorialScriptFor(null);
  assert(classless.id === TUTORIAL_OPENING.id, 'no class keeps the opening id');
  assert(classless.classRoot === null, 'no class stores a null root');
  assert(classless !== TUTORIAL_OPENING, 'no class still appends the seal route');
  assert(tutorialScriptFor(null) === classless, 'the classless script is cached');
  sameRoute(classless);
  assert(resolveBeatIndex(classless, view()) === 0, 'before a class, the opening is still the first beat');
}

{
  const unknown = tutorialScriptFor('not-a-class');
  assert(unknown.id === 'tutorial-not-a-class', `unknown class id ${unknown.id}`);
  assert(unknown.classRoot === 'not-a-class', 'an unknown class keeps the key it was asked with');
  sameRoute(unknown);
}

// ── Every beat's conditions and locations resolve ────────────────────────────
const SCRIPTS = [tutorialScriptFor(null), ...CLASS_ROOTS.map((root) => tutorialScriptFor(root.id))];

for (const script of SCRIPTS) {
  const ids = new Set<string>();
  for (const beat of script.beats) {
    assert(!ids.has(beat.id), `${script.id}: duplicate beat id ${beat.id}`);
    ids.add(beat.id);
    assert(beat.say.length > 0 && beat.say.length <= SAY_LIMIT, `${script.id}/${beat.id}: line should be a short phrase (${beat.say.length})`);
    for (const line of [beat.say, beat.waiting]) {
      if (line !== undefined) assert(!/\btree\b/i.test(line.replace(/Passive Tree/g, '')), `${script.id}/${beat.id}: says "tree": "${line}"`);
    }
    assert(beat.chapter.length > 0, `${script.id}/${beat.id}: no chapter`);
    for (const step of beat.steps) {
      const where = `${script.id}/${beat.id}`;
      switch (step.type) {
        case 'farm': {
          assert(tutorialNodeFor(step.at, FROM_CLEARING) !== null, `${where}: farm location resolves to no node`);
          for (const c of conditionsIn(step.until)) {
            assert(typeof evaluateTutorialCondition(c, view()) === 'boolean', `${where}: condition ${c.type} did not resolve`);
            if (c.type === 'canCraft' || c.type === 'recipeUnlocked') assert(RECIPE_DATABASE.has(c.recipeId), `${where}: unknown recipe ${c.recipeId}`);
            if (c.type === 'hasItem') assert(ITEM_DATABASE.has(c.definitionId), `${where}: unknown item ${c.definitionId}`);
            assert(!(c === step.until && (c.type === 'canCraft' || c.type === 'essenceAtLeast')),
              `${where}: farm condition must be guarded by its outcome (anyOf)`);
          }
          break;
        }
        case 'craft':
          for (const id of step.recipeIds) assert(RECIPE_DATABASE.has(id), `${where}: unknown recipe ${id}`);
          break;
        case 'equip':
          for (const id of step.definitionIds) assert(ITEM_DATABASE.has(id), `${where}: unknown item ${id}`);
          break;
        case 'attemptBoss':
          assert(
            tutorialNodeFor({ kind: 'dungeon', biomeGroup: step.biomeGroup, tier: step.tier }, FROM_CLEARING) !== null,
            `${where}: no dungeon`,
          );
          if (step.until) {
            for (const c of conditionsIn(step.until)) {
              assert(typeof evaluateTutorialCondition(c, view()) === 'boolean', `${where}: condition ${c.type} did not resolve`);
            }
          }
          break;
        case 'chooseClass':
          break;
        default:
          assert(false, `${where}: step ${(step as { type: string }).type} is not part of the opening or the seal route`);
      }
    }
  }
}

// ── Resume walks the seal route forward ──────────────────────────────────────
{
  const script = tutorialScriptFor('cadence-root');
  const equipped = {
    ...emptyEquipment(),
    weapon: 'primordial-club',
    armor: 'clearing-vest-t1',
    recovery: 'clearing-charm-t1',
    mobility: 'clearing-boots-t1',
  };
  const openingDone = {
    playerTier: 1,
    selectedClass: 'cadence-root',
    biomeLevel: { clearing: biomeLevelCap(1, 'clearing') },
    unlockedRecipes: ['primordial-club', 'clearing-vest-t1', 'clearing-charm-t1', 'clearing-boots-t1'],
    equipment: equipped,
  };
  const at = (patch: Partial<TutorialView>, id: string) => {
    const index = resolveBeatIndex(script, view({ ...openingDone, ...patch }));
    assert(index === beatIndex(script, id), `expected ${id}, landed on ${script.beats[index]?.id ?? 'done'}`);
  };

  at({}, 'open:plains');
  const plainsCap = biomeLevelCap(1, 'plains');
  at({ biomeLevel: { ...openingDone.biomeLevel, plains: plainsCap } }, 'boss:plains');
  at({
    biomeLevel: { ...openingDone.biomeLevel, plains: plainsCap },
    bossesCleared: [bossClearKey('plains', 1)],
  }, 'zone:forest');

  const levels: Record<string, number> = { ...openingDone.biomeLevel, plains: plainsCap };
  const cleared = [bossClearKey('plains', 1)];
  for (const biome of WALK_BIOMES) {
    at({ biomeLevel: { ...levels }, bossesCleared: cleared }, `zone:${biome}`);
    levels[biome] = biomeLevelCap(1, biome);
  }
  at({ biomeLevel: { ...levels }, bossesCleared: cleared }, 'striker:mountain');
  at({ biomeLevel: { ...levels, mountain: 2 }, bossesCleared: cleared }, 'boss:mountain');
  const finished = resolveBeatIndex(script, view({
    ...openingDone,
    playerTier: 2,
    biomeLevel: { ...levels },
    bossesCleared: [...cleared, bossClearKey('mountain', 1)],
  }));
  assert(finished === beatIndex(script, 'striker2:plains'), 'both seals at tier 2 finish Tier 1 and open the Tier 2 stretch');
  // The Tier 2 lesson lines come up at their level, and each boss after its zone's cap.
  const t2 = { playerTier: 2, bossesCleared: [...cleared, bossClearKey('mountain', 1)] };
  const lessonLevel = absoluteZoneLevel({ kind: 'zone', biome: 'plains', tier: 2, level: 2 });
  at({ ...t2, biomeLevel: { ...levels, plains: lessonLevel } }, 'striker2:plains-lesson');
  at({ ...t2, biomeLevel: { ...levels, plains: biomeLevelCap(2, 'plains') } }, 'striker2:plains-boss');
  at({ ...t2, biomeLevel: { ...levels, plains: biomeLevelCap(2, 'plains') }, bossesCleared: [...t2.bossesCleared, bossClearKey('plains', 2)] }, 'striker2:forest');
}

// ── Spirit resume: each lesson appears at its unlock, before both seals ──────
{
  const script = tutorialScriptFor('energy-root');
  const levels: Record<string, number> = { clearing: biomeLevelCap(1, 'clearing') };
  const cleared: string[] = [];
  const openingDone = {
    playerTier: 1,
    selectedClass: 'energy-root',
    equipment: {
      ...emptyEquipment(),
      weapon: 'primordial-club', armor: 'clearing-vest-t1',
      recovery: 'clearing-charm-t1', mobility: 'clearing-boots-t1',
    },
  };
  const at = (id: string, playerTier = 1) => {
    const index = resolveBeatIndex(script, view({ ...openingDone, playerTier, biomeLevel: levels, bossesCleared: cleared }));
    assert(index === beatIndex(script, id), `Spirit expected ${id}, got ${script.beats[index]?.id ?? 'done'}`);
  };
  at('open:plains');
  levels.plains = 2;
  at('spirit:chain-lightning');
  levels.plains = biomeLevelCap(1, 'plains');
  at('boss:plains');
  cleared.push(bossClearKey('plains', 1));
  for (const [biome, lesson] of [
    ['forest', 'spirit:thunderclap'], ['swamp', 'spirit:downpour'], ['cave', 'spirit:thunderbolt'],
  ] as const) {
    at(`zone:${biome}`);
    levels[biome] = 2;
    at(lesson);
    levels[biome] = biomeLevelCap(1, biome);
  }
  at('spirit:mountain');
  levels.mountain = 2;
  at('boss:mountain');
  cleared.push(bossClearKey('mountain', 1));
  at('farewell');
  // A held seal must not replay the Mountain approach, even on a takeover
  // whose boss was cleared without first farming the lesson.
  levels.mountain = 0;
  const finished = resolveBeatIndex(script, view({ ...openingDone, playerTier: 2, biomeLevel: levels, bossesCleared: cleared }));
  // Tier 2 opens the Tier-2 stretch, which starts at the discipline pick; the guided T1 is done.
  assert(finished === script.beats.findIndex((beat) => beat.id === 't2:plains'), 'both seals at tier 2 resume at the Tier-2 stretch');
  const t2Done = { ...levels };
  for (const biome of ['plains', 'forest', 'mountain', 'swamp', 'cave']) t2Done[biome] = biomeLevelCap(2, biome);
  for (const biome of ['jungle', 'desert']) t2Done[biome] = biomeLevelCap(2, biome);
  const t2Cleared = [...cleared, ...['plains', 'forest', 'mountain', 'swamp', 'cave', 'jungle', 'desert'].map((biome) => bossClearKey(biome, 2))];
  assert(resolveBeatIndex(script, view({ ...openingDone, playerTier: 2, biomeLevel: t2Done, bossesCleared: t2Cleared })) === script.beats.findIndex((beat) => beat.id === 't3:mountain'),
    'every Tier-2 boss hands over to the Tier-3 stretch');
  const t3Zones = ['mountain', 'cave', 'swamp', 'jungle', 'desert', 'tundra', 'volcanic'];
  const t3Done = { ...t2Done };
  for (const biome of t3Zones) t3Done[biome] = biomeLevelCap(3, biome);
  const t3Cleared = [...t2Cleared, ...t3Zones.map((biome) => bossClearKey(biome, 3))];
  assert(resolveBeatIndex(script, view({ ...openingDone, playerTier: 3, biomeLevel: t3Done, bossesCleared: t3Cleared })) === script.beats.findIndex((beat) => beat.id === 't4:mountain'),
    'every Tier-3 boss hands over to the Tier-4 stretch');
  const t4Zones = ['mountain', 'tundra', 'jungle', 'desert', 'volcanic', 'graveyard', 'trench'];
  const t4Done = { ...t3Done };
  for (const biome of t4Zones) t4Done[biome] = biomeLevelCap(4, biome);
  const t4Cleared = [...t3Cleared, ...t4Zones.map((biome) => bossClearKey(biome, 4))];
  assert(resolveBeatIndex(script, view({ ...openingDone, playerTier: 4, biomeLevel: t4Done, bossesCleared: t4Cleared })) === script.beats.length,
    'every Tier-4 boss finishes the Spirit script');
}

// ── The first-hour checklist ─────────────────────────────────────────────────
/**
 * At most two new ideas per level and per beat, each introduced once. Levels
 * are read off the script's own gates (`tutorialChecklist`). The seal route
 * adds zones, the two seal ideas, and poison; it does not teach mastery,
 * because these fights do not open a recipe.
 */
for (const script of SCRIPTS) {
  const rows = tutorialChecklist(script);
  const seen = new Set<TutorialConceptId>();
  const perLevel = new Map<string, TutorialConceptId[]>();
  for (const row of rows) {
    assert(row.teaches.length <= TUTORIAL_CONCEPTS_PER_LEVEL, `${script.id}/${row.beatId}: one line introduces ${row.teaches.length} ideas`);
    for (const concept of row.teaches) {
      assert(concept in TUTORIAL_CONCEPTS, `${script.id}/${row.beatId}: unknown idea ${concept}`);
      assert(!seen.has(concept), `${script.id}/${row.beatId}: "${concept}" was already introduced`);
      seen.add(concept);
      perLevel.set(row.level, [...(perLevel.get(row.level) ?? []), concept]);
    }
  }
  for (const [level, concepts] of perLevel) {
    assert(concepts.length <= TUTORIAL_CONCEPTS_PER_LEVEL,
      `${script.id}: ${level} introduces ${concepts.length} ideas (${concepts.join(', ')})`);
  }
  for (const concept of ['zones', 'seals', 'boss-altar', 'poison'] as const) {
    assert(seen.has(concept), `${script.id}: never teaches ${concept}`);
  }
  assert(!seen.has('mastery'), `${script.id}: mastery stays untaught; the route opens no recipe`);
  const levelOf = (id: string) => rows.find((row) => row.beatId === id)?.level;
  assert(levelOf('open:plains') === 'Plains 0', `${script.id}: zones are introduced at Plains 0`);
  assert(levelOf('boss:plains') === `Plains ${biomeLevelCap(1, 'plains')}`, `${script.id}: the first seal is introduced at the Plains cap`);
  assert(levelOf('zone:swamp') === 'Swamp 0', `${script.id}: poison is introduced at Swamp 0`);
  assert(levelOf('farewell') === 'Farewell', `${script.id}: the farewell is its own level`);
}

for (const [id, concept] of Object.entries(TUTORIAL_CONCEPTS) as [TutorialConceptId, TutorialConcept][]) {
  assert(concept.name.length > 0 && concept.shownBy.length > 0, `${id}: an idea needs a name and what shows it`);
  if (concept.anchor) assert(concept.anchor in TUTORIAL_ANCHORS, `${id}: unknown anchor ${concept.anchor}`);
}

assert(QUEST_DATABASE.has('tier-0'), 'the opening names a real quest');

console.log('tutorial: ok');
