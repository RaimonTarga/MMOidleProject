import { biomeLevelCap, globalMastery } from '../config/gameConfig';
import { SKILL_TREE } from '../data/skillTree';
import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { emptyEquipment, type EssenceType } from '../items';
import { QUEST_DATABASE } from '../quests/questDatabase';
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
assert(Object.keys(TUTORIAL_CLASS_BEATS).join(',') === 'cadence-root', 'only the Striker builder is registered');
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
  assert(tail[tail.length - 1].say === TUTORIAL_FAREWELL[0], 'the Striker route still ends on the farewell line');
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

for (const root of CLASS_ROOTS) {
  const script = tutorialScriptFor(root.id);
  assert(script.id === `tutorial-${root.name.toLowerCase()}`, `${root.id}: id ${script.id}`);
  assert(script.classRoot === root.id, `${root.id}: class root is stored`);
  assert(tutorialScriptFor(root.id) === script, `${root.id}: the script is cached`);
  if (root.id === 'cadence-root') assertStrikerTail(script);
  else sameRoute(script);
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
  assert(finished === script.beats.length, 'both seals at tier 2 finish the script, farewell included');
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
