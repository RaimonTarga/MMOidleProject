import { ABILITY_DATABASE } from '../abilities';
import { ABILITY_RECIPE_DATABASE } from '../abilityRecipes';
import { globalMastery } from '../config/gameConfig';
import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { emptyEquipment, type EssenceType } from '../items';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { ACTION_DATABASE, CONDITION_DATABASE } from '../runeDatabase';
import { RUNE_RECIPE_DATABASE } from '../runeRecipes';
import { NODE_BIOMES } from '../world/nodeBiomes';
import {
  TUTORIAL_ANCHORS,
  TUTORIAL_CONCEPTS,
  TUTORIAL_CONCEPTS_PER_LEVEL,
  TUTORIAL_OPENING,
  nextStepOf,
  resolveBeatIndex,
  tutorialChecklist,
  tutorialProgress,
  tutorialScriptFor,
  type TutorialCondition,
  type TutorialConcept,
  type TutorialConceptId,
  type TutorialScript,
  type TutorialStep,
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
    runesEquipped: [],
    runeRecipesCrafted: [],
    knownAbilities: [],
    attunedAbilities: { techniques: [], guards: [] },
    bossesCleared: [],
    clearedNodes: [],
  };
  const merged = { ...base, ...overrides };
  return { ...merged, globalMastery: globalMastery(merged.biomeLevel) };
}

const beatIndex = (script: TutorialScript, id: string): number => script.beats.findIndex((beat) => beat.id === id);

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
      { id: 'runes-a', chapter: 'x', say: 'a', steps: [{ type: 'configureRunes', rules: [{ conditionId: 'always', actionId: 'auto-path-enemy' }] }] },
      { id: 'sword', chapter: 'x', say: 'sword', steps: [{ type: 'equip', definitionIds: ['iron-broadsword'] }] },
      { id: 'runes-b', chapter: 'x', say: 'b', steps: [{ type: 'configureRunes', rules: [{ conditionId: 'always', actionId: 'avoid-hazards' }] }] },
    ],
  };
  const sword = { ...emptyEquipment(), weapon: 'iron-broadsword' };
  assert(resolveBeatIndex(synthetic, view({ equipment: sword })) === 1, 'a later weapon supersedes the club');
  assert(
    resolveBeatIndex(synthetic, view({ equipment: sword, runesEquipped: [{ conditionId: 'always', actionId: 'avoid-hazards' }] })) === 4,
    'a later Rune loadout supersedes an earlier one',
  );
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

// ── Scripts: data validity ───────────────────────────────────────────────────
const SAY_LIMIT = 170;

function conditionsIn(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === 'allOf' || condition.type === 'anyOf') return [condition, ...condition.of.flatMap(conditionsIn)];
  if (condition.type === 'not') return [condition, ...conditionsIn(condition.of)];
  return [condition];
}

function nodesFor(at: Extract<TutorialStep, { type: 'farm' }>['at']): string[] {
  if (at.kind === 'node') return NODE_BIOMES[at.nodeId] || at.nodeId === 'node-clearing' ? [at.nodeId] : [];
  return Object.entries(NODE_BIOMES)
    .filter(([, info]) => info.biomeGroup === at.biomeGroup && info.biomeTier === at.tier
      && (at.kind === 'dungeon' ? info.isDungeon === true : info.kind === 'normal')
      && (at.kind !== 'biome' || !at.modifier || info.modifier === at.modifier))
    .map(([id]) => id);
}

for (const script of [TUTORIAL_OPENING]) {
  const ids = new Set<string>();
  for (const beat of script.beats) {
    assert(!ids.has(beat.id), `${script.id}: duplicate beat id ${beat.id}`);
    ids.add(beat.id);
    assert(beat.say.length > 0 && beat.say.length <= SAY_LIMIT, `${script.id}/${beat.id}: line should be a short phrase (${beat.say.length})`);
    assert(beat.chapter.length > 0, `${script.id}/${beat.id}: no chapter`);
    for (const step of beat.steps) {
      const where = `${script.id}/${beat.id}`;
      switch (step.type) {
        case 'farm':
          assert(nodesFor(step.at).length > 0, `${where}: farm location resolves to no node`);
          for (const c of conditionsIn(step.until)) {
            if (c.type === 'canCraft' || c.type === 'recipeUnlocked') assert(RECIPE_DATABASE.has(c.recipeId), `${where}: unknown recipe ${c.recipeId}`);
            if (c.type === 'hasItem') assert(ITEM_DATABASE.has(c.definitionId), `${where}: unknown item ${c.definitionId}`);
            if (c.type === 'abilityKnown') assert(ABILITY_DATABASE.has(c.abilityId), `${where}: unknown ability ${c.abilityId}`);
            if (c.type === 'runeRecipeCrafted') assert(RUNE_RECIPE_DATABASE.has(c.recipeId), `${where}: unknown rune recipe ${c.recipeId}`);
            // Monotone farm conditions: a bare spendable resource would regress after the spend.
            assert(!(c === step.until && (c.type === 'canCraft' || c.type === 'essenceAtLeast')),
              `${where}: farm condition must be guarded by its outcome (anyOf)`);
          }
          break;
        case 'craft':
          for (const id of step.recipeIds) assert(RECIPE_DATABASE.has(id), `${where}: unknown recipe ${id}`);
          break;
        case 'equip':
          for (const id of step.definitionIds) assert(ITEM_DATABASE.has(id), `${where}: unknown item ${id}`);
          break;
        case 'configureRunes':
          for (const rule of step.rules) {
            assert(CONDITION_DATABASE.has(rule.conditionId as never), `${where}: unknown rune condition ${rule.conditionId}`);
            assert(ACTION_DATABASE.has(rule.actionId as never), `${where}: unknown rune action ${rule.actionId}`);
          }
          break;
        case 'craftRune':
          assert(RUNE_RECIPE_DATABASE.has(step.recipeId), `${where}: unknown rune recipe ${step.recipeId}`);
          break;
        case 'learnAbility':
          assert(ABILITY_RECIPE_DATABASE.get(step.recipeId)?.abilityId === step.abilityId, `${where}: recipe/ability mismatch`);
          break;
        case 'setAbilities':
          for (const id of [...step.techniques, ...step.guards]) assert(ABILITY_DATABASE.has(id), `${where}: unknown ability ${id}`);
          break;
        case 'attemptBoss':
          assert(nodesFor({ kind: 'dungeon', biomeGroup: step.biomeGroup, tier: step.tier }).length === 1, `${where}: no dungeon`);
          break;
        case 'chooseClass':
          break;
      }
    }
  }
}

// ── The first-hour checklist (docs/guided-tutorial-plan.md) ─────────────────
/**
 * At most two new ideas per level and per beat, each introduced once, each with
 * a screen element that explains it (an anchor the guide can ring, when it names
 * one). Levels are read off the script's own gates (`tutorialChecklist`).
 */
for (const script of [TUTORIAL_OPENING]) {
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
}
for (const [id, concept] of Object.entries(TUTORIAL_CONCEPTS) as [TutorialConceptId, TutorialConcept][]) {
  assert(concept.name.length > 0 && concept.shownBy.length > 0, `${id}: an idea needs a name and what shows it`);
  if (concept.anchor) assert(concept.anchor in TUTORIAL_ANCHORS, `${id}: unknown anchor ${concept.anchor}`);
}

// The class scripts went with the lineage trees (class-first rework D1): before
// the class pick, after it, and for an unknown class, the script is the opening.
assert(tutorialScriptFor(null) === TUTORIAL_OPENING, 'no class → opening only');
assert(tutorialScriptFor('cadence-root') === TUTORIAL_OPENING, 'a class with no script → opening only');
assert(tutorialScriptFor('not-a-class') === TUTORIAL_OPENING, 'unknown class → opening only');
assert(QUEST_DATABASE.has('tier-0'), 'the opening names a real quest');

console.log('tutorial: ok');
