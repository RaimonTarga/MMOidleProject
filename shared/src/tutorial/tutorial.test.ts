import { ABILITY_DATABASE } from '../abilities';
import { ABILITY_RECIPE_DATABASE } from '../abilityRecipes';
import { biomeLevelCap, globalMastery } from '../config/gameConfig';
import { LINEAGE_DATABASE, lineageForRecipeId } from '../data/lineages';
import { GATE_CAPSTONE_AMOUNT } from '../data/lineages/magnitudes';
import { isRankedCard, isVerbCard, maxCardRank, resolveLineageCard } from '../data/lineages/resolve';
import type { LineageProgress, LineageProgressMap } from '../data/lineages/types';
import { cardRank, cardSentence } from '../systems/lineages';
import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { emptyEquipment, type EssenceType } from '../items';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { ACTION_DATABASE, CONDITION_DATABASE, runeBudgetForGlobalMastery } from '../runeDatabase';
import { RUNE_RECIPE_DATABASE } from '../runeRecipes';
import { runicPointBreakdown } from '../runicPoints';
import { bossClearKey } from '../systems/biomeProgress';
import { NODE_BIOMES } from '../world/nodeBiomes';
import { nodeFamily, nodeShard, nodesPayingShard } from '../world/nodeBlends';
import { shardName } from '../data/lineages/packets';
import { tutorialNodeFor } from './nodes';
import {
  TUTORIAL_ANCHORS,
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_CONCEPTS,
  TUTORIAL_CONCEPTS_PER_LEVEL,
  TUTORIAL_OPENING,
  TUTORIAL_SEALS,
  abilityLoadoutFor,
  nextStepOf,
  resolveBeatIndex,
  tutorialChecklist,
  tutorialProgress,
  tutorialScriptFor,
  wiredRunes,
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
    lineages: {},
    shards: {},
    capstones: {},
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

// ── Rune order is part of the plan ───────────────────────────────────────────
{
  const O = tutorialScriptFor('cadence-root');
  const runesBeat = O.beats.find((b) => b.id === 'runes:opening')!;
  const planned = (runesBeat.steps[0] as Extract<TutorialStep, { type: 'configureRunes' }>).rules;
  const fullSet = {
    playerTier: 1,
    selectedClass: 'cadence-root',
    biomeLevel: { clearing: 4 },
    equipment: { ...emptyEquipment(), weapon: 'primordial-club', armor: 'clearing-vest-t1', recovery: 'clearing-charm-t1', mobility: 'clearing-boots-t1' },
  };
  const shuffled = [...planned].reverse();
  assert(resolveBeatIndex(O, view({ ...fullSet, runesEquipped: shuffled })) === beatIndex(O, 'runes:opening'),
    'the same Runes in another order are not the plan (flee must sit above chase)');
  assert(resolveBeatIndex(O, view({ ...fullSet, runesEquipped: planned })) > beatIndex(O, 'runes:opening'),
    'the planned order satisfies the Rune beat');
}

// ── Progress readouts ────────────────────────────────────────────────────────
{
  const [quest] = tutorialProgress({ type: 'questKills', questId: 'tier-0' }, view({ questProgress: { 'tier-0': 4 } }));
  assert(quest?.current === 4 && quest.target === 10, 'quest progress reads kills out of ten');
  const [essence] = tutorialProgress({ type: 'essenceFor', recipeId: 'primordial-club' }, view({ essences: { ...NO_ESSENCE, green: 9 } }));
  assert(essence?.current === 4 && essence.target === 4, 'essence progress is clamped to the cost');
}

// ── Class scripts: data validity ─────────────────────────────────────────────
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

assert(TUTORIAL_CLASS_PLANS.length === 6, 'one plan per T1 class root');
for (const plan of TUTORIAL_CLASS_PLANS) {
  const script = tutorialScriptFor(plan.classRoot);
  const ids = new Set<string>();
  for (const beat of script.beats) {
    assert(!ids.has(beat.id), `${script.id}: duplicate beat id ${beat.id}`);
    ids.add(beat.id);
    assert(beat.say.length > 0 && beat.say.length <= SAY_LIMIT, `${script.id}/${beat.id}: line should be a short phrase (${beat.say.length})`);
    for (const line of [beat.lesson?.read, beat.lesson?.ring]) {
      if (line !== undefined) assert(line.length > 0 && line.length <= SAY_LIMIT, `${script.id}/${beat.id}: lesson line too long (${line.length})`);
    }
    // The guide never says "tree" any more: the player opens a weapon PAGE (W2-A).
    for (const line of [beat.say, beat.waiting, beat.lesson?.read, beat.lesson?.ring]) {
      if (line !== undefined) assert(!/\btree\b/i.test(line.replace(/Passive Tree/g, '')), `${script.id}/${beat.id}: says "tree": "${line}"`);
    }
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
        case 'unlockCard': {
          const lineage = LINEAGE_DATABASE.get(step.lineageId);
          assert(!!lineage, `${where}: unknown lineage ${step.lineageId}`);
          const card = lineage!.cards.find((c) => c.id === step.cardId);
          assert(!!card, `${where}: unknown card ${step.cardId}`);
          if (step.rank !== undefined) {
            assert(step.rank >= 1 && step.rank <= maxCardRank(card!), `${where}: ${step.cardId} has no rank ${step.rank}`);
          }
          break;
        }
        case 'setActive': {
          const card = LINEAGE_DATABASE.get(step.lineageId)?.cards.find((c) => c.id === step.cardId);
          assert(!!card, `${where}: unknown card ${step.cardId}`);
          assert(card!.row === step.row, `${where}: ${step.cardId} is a ${card!.row} card, activated as ${step.row}`);
          break;
        }
        case 'unlockForm':
        case 'wearForm': {
          const lineage = LINEAGE_DATABASE.get(step.lineageId);
          assert(!!lineage, `${where}: unknown lineage ${step.lineageId}`);
          assert(lineage!.forms.some((f) => f.recipeId === step.recipeId), `${where}: unknown form ${step.recipeId}`);
          break;
        }
        case 'chooseClass':
          break;
      }
    }
  }
  const bosses = script.beats.flatMap((b) => b.steps).filter((s) => s.type === 'attemptBoss');
  // Two seals, then the gate's repeated boss for its capstone drops.
  const seals = bosses.filter((s) => s.type === 'attemptBoss' && !s.until);
  assert(seals.length === 2, `${script.id}: exactly two seals`);
  assert(seals.every((s, i) => s.type === 'attemptBoss' && s.biomeGroup === TUTORIAL_SEALS[i]), `${script.id}: the seals are TUTORIAL_SEALS, in order`);
  assert(bosses.length === 3, `${script.id}: the seals plus the gate's capstone boss`);
}

/**
 * What `lineageSync` does on the server: equipping a lineage form opens that
 * lineage's progress and makes the form the worn one, which is what opens its
 * tree for the first card.
 */
function wearing(lineages: LineageProgressMap, definitionIds: readonly string[]): LineageProgressMap {
  let next = lineages;
  for (const id of definitionIds) {
    const lineage = lineageForRecipeId(id);
    if (!lineage) continue;
    const current = next[lineage.id] ?? { ownedCards: [], active: {}, ownedForms: [id], wornForm: '' };
    next = {
      ...next,
      [lineage.id]: {
        ...current,
        ownedForms: current.ownedForms.includes(id) ? current.ownedForms : [...current.ownedForms, id],
        wornForm: id,
      },
    };
  }
  return next;
}

/** The slot of `lineageId` holds one of its forms — its page is the one on screen, and its cards pay. */
function wieldsFormOf(v: TutorialView, lineageId: string): boolean {
  const lineage = LINEAGE_DATABASE.get(lineageId)!;
  const held = v.equipment[lineage.slot];
  return !!held && lineage.forms.some((f) => f.recipeId === held);
}

// ── Class scripts: a simulated playthrough only ever moves forward ───────────
/**
 * A fake character that makes each step true the way the server would, with
 * every farm granting just the biome levels its condition names and plenty of
 * essence. At each beat the resolver must land exactly on the next beat, and
 * every loadout must fit the Rune budget of the Global Mastery reached so far.
 */
function simulate(plan: (typeof TUTORIAL_CLASS_PLANS)[number]): void {
  const script = tutorialScriptFor(plan.classRoot);
  let v = view();
  const set = (patch: Partial<TutorialView>) => { v = view({ ...v, ...patch }); };
  const unlockRecipes = () => {
    const unlocked = new Set(v.unlockedRecipes);
    for (const recipe of RECIPE_DATABASE.values()) {
      if ((v.biomeLevel[recipe.recipeGroup] ?? 0) >= recipe.requiredBiomeLevel) unlocked.add(recipe.id);
    }
    set({ unlockedRecipes: [...unlocked] });
  };
  const rich = () => set({
    essences: { red: 1e6, blue: 1e6, green: 1e6, yellow: 1e6, purple: 1e6 },
  });
  const checkBudget = (where: string) => {
    const cost = runicPointBreakdown({ abilities: v.attunedAbilities, rules: v.runesEquipped, stances: [], rites: [] }).total;
    const budget = runeBudgetForGlobalMastery(v.globalMastery);
    assert(cost <= budget, `${script.id}/${where}: build costs ${cost} RP but GM ${v.globalMastery} allows ${budget}`);
  };

  // A rich character skips farm beats it can already afford; that is intended.
  // What must never happen is the resume point moving backwards.
  let visited = 0;
  /** A verb was just bought and its ring pointed at: the next fight must be on its weapon. */
  let ringLessonOn: string | null = null;
  for (let at = resolveBeatIndex(script, v); at < script.beats.length; at = resolveBeatIndex(script, v)) {
    assert(at >= visited, `${script.id}: resume went back from ${script.beats[visited]?.id} to ${script.beats[at].id}`);
    visited = at + 1;
    const beat = script.beats[at];
    for (let guard = 0; guard < 20; guard += 1) {
      const step = nextStepOf(script, beat, v);
      if (!step) break;
      switch (step.type) {
        case 'farm': {
          if (ringLessonOn) {
            // "In a fight, its ring fills…": that fight has to be one where the verb can fire.
            assert(wieldsFormOf(v, ringLessonOn), `${script.id}/${beat.id}: the fight after the verb lesson is off the ${ringLessonOn}`);
            ringLessonOn = null;
          }
          const levels = { ...v.biomeLevel };
          const shards = { ...v.shards };
          for (const c of conditionsIn(step.until)) {
            if (c.type === 'biomeLevelAtLeast') levels[c.biomeGroup] = Math.max(levels[c.biomeGroup] ?? 0, c.level);
            if (c.type === 'shardAtLeast') shards[c.packet] = Math.max(shards[c.packet] ?? 0, c.amount);
            if (c.type === 'playerTierAtLeast') set({ playerTier: Math.max(v.playerTier, c.tier) });
            if ((c.type === 'canCraft' || c.type === 'recipeUnlocked') && RECIPE_DATABASE.has(c.recipeId)) {
              const r = RECIPE_DATABASE.get(c.recipeId)!;
              levels[r.recipeGroup] = Math.max(levels[r.recipeGroup] ?? 0, r.requiredBiomeLevel);
            }
          }
          set({ biomeLevel: levels, shards });
          unlockRecipes();
          rich();
          break;
        }
        case 'chooseClass':
          set({ selectedClass: plan.classRoot });
          break;
        case 'craft':
          set({ inventory: [...v.inventory, ...step.recipeIds] });
          break;
        case 'equip': {
          const equipment = { ...v.equipment };
          const inventory = [...v.inventory];
          for (const id of step.definitionIds) {
            assert(inventory.includes(id) || Object.values(equipment).includes(id), `${script.id}/${beat.id}: equips ${id} before owning it`);
            const slot = ITEM_DATABASE.get(id)!.slot;
            const worn = equipment[slot];
            if (worn === id) continue;
            inventory.splice(inventory.indexOf(id), 1);
            if (worn) inventory.push(worn);
            equipment[slot] = id;
          }
          set({ equipment, inventory, lineages: wearing(v.lineages, step.definitionIds) });
          break;
        }
        case 'unlockCard': {
          const lineage = LINEAGE_DATABASE.get(step.lineageId)!;
          const progress = v.lineages[step.lineageId];
          // Holding the base form is what opens the page (`checkUnlockCard`), and
          // the director opens the page of whatever is IN the slot: the card it
          // buys must be on screen and live (design §23: a lineage pays only while
          // its own form is worn).
          assert(!!progress && progress.wornForm !== '',
            `${script.id}/${beat.id}: buys ${step.cardId} with no ${step.lineageId} form worn`);
          assert(wieldsFormOf(v, lineage.id),
            `${script.id}/${beat.id}: buys ${step.cardId} while wearing ${v.equipment[lineage.slot]}, not the ${lineage.id}`);
          const card = lineage.cards.find((c) => c.id === step.cardId)!;
          // One rank per purchase, as the server sells them (design §26.1: the same
          // intent buys an owned ranked card's NEXT rank).
          const rank = step.rank ?? 1;
          assert(rank === cardRank(progress, card.id) + 1,
            `${script.id}/${beat.id}: buys rank ${rank} of ${card.id} at rank ${cardRank(progress, card.id)}`);
          // The beat sits where the card's own gates are open AT THAT RANK (the T1
          // verb row at Global Mastery 10 as well as its zone's level 4; lean ranks
          // II and III at Global Mastery 10 and 14).
          const gates = resolveLineageCard(card, lineage, { rank });
          assert((v.biomeLevel[gates.requiredBiomeGroup] ?? 0) >= gates.requiredBiomeLevel,
            `${script.id}/${beat.id}: ${card.id} needs ${gates.requiredBiomeGroup} ${gates.requiredBiomeLevel}`);
          assert(v.globalMastery >= gates.requiredGlobalMastery,
            `${script.id}/${beat.id}: ${card.id} rank ${rank} needs Global Mastery ${gates.requiredGlobalMastery}, the guide is at ${v.globalMastery}`);
          set({
            lineages: {
              ...v.lineages,
              [step.lineageId]: {
                ...progress!,
                ownedCards: rank === 1 ? [...progress!.ownedCards, step.cardId] : progress!.ownedCards,
                // Buying into an empty row activates it, server-side.
                active: { ...progress!.active, [card.row]: progress!.active[card.row] ?? step.cardId },
                ...(isRankedCard(card) ? { ranks: { ...progress!.ranks, [card.id]: rank } } : {}),
              },
            },
          });
          break;
        }
        case 'setActive': {
          const progress = v.lineages[step.lineageId];
          assert(!!progress?.ownedCards.includes(step.cardId), `${script.id}/${beat.id}: activates unowned ${step.cardId}`);
          assert(wieldsFormOf(v, step.lineageId), `${script.id}/${beat.id}: activates ${step.cardId} off the ${step.lineageId}`);
          set({
            lineages: { ...v.lineages, [step.lineageId]: { ...progress!, active: { ...progress!.active, [step.row]: step.cardId } } },
          });
          break;
        }
        case 'unlockForm': {
          const progress = v.lineages[step.lineageId];
          assert(!!progress, `${script.id}/${beat.id}: pays a gate on an unopened ${step.lineageId}`);
          // Review P9: the gate is paid on the page of the weapon it gates.
          assert(wieldsFormOf(v, step.lineageId),
            `${script.id}/${beat.id}: pays the ${step.recipeId} gate while wearing ${v.equipment[LINEAGE_DATABASE.get(step.lineageId)!.slot]}`);
          set({
            lineages: {
              ...v.lineages,
              [step.lineageId]: { ...progress!, ownedForms: [...progress!.ownedForms, step.recipeId] },
            },
          });
          break;
        }
        case 'wearForm': {
          const progress = v.lineages[step.lineageId];
          assert(!!progress?.ownedForms.includes(step.recipeId),
            `${script.id}/${beat.id}: wears ${step.recipeId} before paying its gate`);
          const slot = LINEAGE_DATABASE.get(step.lineageId)!.slot;
          const previous = v.equipment[slot];
          set({
            lineages: { ...v.lineages, [step.lineageId]: { ...progress!, wornForm: step.recipeId } },
            equipment: { ...v.equipment, [slot]: step.recipeId },
            inventory: previous && previous !== step.recipeId ? [...v.inventory, previous] : v.inventory,
          });
          break;
        }
        case 'configureRunes':
          set({ runesEquipped: wiredRunes(step.rules, v.attunedAbilities) });
          checkBudget(beat.id);
          break;
        case 'craftRune':
          set({ runeRecipesCrafted: [...v.runeRecipesCrafted, step.recipeId] });
          break;
        case 'learnAbility':
        case 'setAbilities': {
          const known = step.type === 'learnAbility' ? [...v.knownAbilities, step.abilityId] : v.knownAbilities;
          for (const id of step.type === 'setAbilities' ? [...step.techniques, ...step.guards] : []) {
            assert(known.includes(id), `${script.id}/${beat.id}: attunes ${id} before learning it`);
          }
          const abilities = abilityLoadoutFor(step, v);
          set({ knownAbilities: known, attunedAbilities: abilities, runesEquipped: wiredRunes(v.runesEquipped, abilities) });
          checkBudget(beat.id);
          break;
        }
        case 'attemptBoss': {
          // Design §24.9: the bought lean and verb are live in every boss fight —
          // the seals and the gate are fought on the taught weapon, with both active.
          const taughtId = plan.weaponCards.lineageId;
          const taught = v.lineages[taughtId];
          assert(wieldsFormOf(v, taughtId), `${script.id}/${beat.id}: fights the boss off the ${taughtId}`);
          assert(taught?.active.stat === plan.weaponCards.lean && taught.active.payoff === plan.weaponCards.verb,
            `${script.id}/${beat.id}: fights the boss without the lean and verb active`);
          const cleared = [...new Set([...v.bossesCleared, bossClearKey(step.biomeGroup, step.tier)])];
          // One capstone per kill, which is why the gate beat repeats the fight.
          set({
            bossesCleared: cleared,
            playerTier: cleared.length >= 2 ? 2 : v.playerTier,
            capstones: { ...v.capstones, [step.biomeGroup]: (v.capstones[step.biomeGroup] ?? 0) + 1 },
          });
          break;
        }
      }
      if (guard === 19) throw new Error(`${script.id}/${beat.id}: step never settles`);
    }
    assert(resolveBeatIndex(script, v) > at, `${script.id}/${beat.id}: finishing the beat does not move the guide on`);
    if (beat.lesson) {
      // The lesson points at the card the beat just bought, on a live page.
      const progress = v.lineages[beat.lesson.lineageId];
      assert(!!progress && Object.values(progress.active).includes(beat.lesson.cardId),
        `${script.id}/${beat.id}: the lesson's card is not active after the beat`);
      assert(wieldsFormOf(v, beat.lesson.lineageId), `${script.id}/${beat.id}: the lesson's page is not the worn weapon's`);
      if (beat.lesson.ring) ringLessonOn = beat.lesson.lineageId;
    }
  }
  assert(resolveBeatIndex(script, v) === script.beats.length, `${script.id}: finishes`);
  assert(ringLessonOn === null, `${script.id}: the verb lesson is never followed by a fight`);
  // Switching TUTORIAL_SEALS must not strand a class: every boss loadout is owned by the end.
  for (const [biome, loadout] of Object.entries(plan.bosses)) {
    for (const id of [...plan.bossKit, loadout.armor]) {
      assert(v.inventory.includes(id) || Object.values(v.equipment).includes(id), `${script.id}: ${biome} boss needs ${id}, never made`);
    }
    for (const id of [loadout.technique, loadout.guard]) {
      assert(v.knownAbilities.includes(id), `${script.id}: ${biome} boss needs ${id}, never learned`);
    }
  }
  assert(v.playerTier === 2, `${script.id}: ends at Tier 2`);
  assert(v.globalMastery === 30, `${script.id}: reaches Global Mastery 30 before the bosses (got ${v.globalMastery})`);

  // The weapon-page lessons actually land: a lean (at the plan's rank) and a verb
  // bought and active, a gate paid, the form worn.
  const taught = Object.entries(v.lineages).filter(([, p]) => p.ownedCards.length > 0);
  assert(taught.length === 1, `${script.id}: exactly one lineage is taught (got ${taught.length})`);
  const [lineageId, progress] = taught[0];
  assert(lineageId === plan.weaponCards.lineageId, `${script.id}: teaches the ${lineageId}, not the ${plan.weaponCards.lineageId}`);
  // The page taught is the boss weapon's (design §24.9).
  assert(LINEAGE_DATABASE.get(lineageId)!.forms.some((f) => f.tier === 1 && plan.bossKit.includes(f.recipeId)),
    `${script.id}: the ${lineageId} is not the boss kit's weapon`);
  assert(
    progress.ownedCards.length === 2
      && progress.ownedCards.includes(plan.weaponCards.lean)
      && progress.ownedCards.includes(plan.weaponCards.verb),
    `${script.id}: two cards, the plan's lean and verb (got ${progress.ownedCards.join(', ')})`,
  );
  assert(cardRank(progress, plan.weaponCards.lean) === plan.weaponCards.leanRank,
    `${script.id}: the lean ends at rank ${cardRank(progress, plan.weaponCards.lean)}, not the plan's ${plan.weaponCards.leanRank}`);
  assert(progress.active.stat === plan.weaponCards.lean, `${script.id}: the lean ends up active`);
  assert(progress.active.payoff === plan.weaponCards.verb, `${script.id}: the verb ends up active`);
  const gated = LINEAGE_DATABASE.get(lineageId)!.forms.find((f) => f.recipeId === progress.wornForm)!;
  assert(gated.tier === 2, `${script.id}: ends wearing the tier-2 form the gate opened`);
  assert(
    (v.capstones[gated.biome] ?? 0) >= (GATE_CAPSTONE_AMOUNT[1] ?? 0),
    `${script.id}: the gate beat earns its ${gated.biome} capstones`,
  );
  assert(Object.values(v.equipment).includes(progress.wornForm), `${script.id}: the gated form is equipped`);
}

for (const plan of TUTORIAL_CLASS_PLANS) simulate(plan);

// ── The shards line names a real drop source ────────────────────────────────
/**
 * The guide names where the first card's shard drops: "Every kill in Pack
 * territory pays them" (design §24.3 — a node pays its dominant family's shard).
 * It is the one claim about the map in the whole script, so it is checked here
 * rather than trusted: the territory it names must lead a home-biome node that
 * pays the card's shard, and the line must use the shard's own name.
 */
{
  // Every class, every purchase: each card (and each rank) has a shards beat naming
  // where its shard drops.
  const named = new Set<string>();
  for (const plan of TUTORIAL_CLASS_PLANS) {
    const script = tutorialScriptFor(plan.classRoot);
    const cards = script.beats
      .flatMap((b) => b.steps)
      .filter((s): s is Extract<TutorialStep, { type: 'unlockCard' }> => s.type === 'unlockCard');
    // Design §26.1: lean I, the verb, then the lean's ranks — and nothing else.
    const { lean, verb, leanRank } = plan.weaponCards;
    const expected = [`${lean}@1`, `${verb}@1`, ...Array.from({ length: leanRank - 1 }, (_, i) => `${lean}@${i + 2}`)];
    assert(cards.map((c) => `${c.cardId}@${c.rank ?? 1}`).join() === expected.join(),
      `${script.id}: buys ${expected.join(', ')} (got ${cards.map((c) => `${c.cardId}@${c.rank ?? 1}`).join(', ')})`);
    for (const step of cards) {
      const lineage = LINEAGE_DATABASE.get(step.lineageId)!;
      const lane = lineage.cards.find((c) => c.id === step.cardId)!.lane;
      const suffix = (step.rank ?? 1) > 1 ? `:rank-${step.rank}` : '';
      const beat = script.beats.find((b) => b.id === `shards:${step.cardId}${suffix}`);
      assert(!!beat, `${script.id}: no shards beat for ${step.cardId}`);
      const territories = nodesPayingShard(lineage.homeBiome, 1, lane).map((id) => nodeFamily(id)?.name);
      assert(territories.length > 0, `no ${lineage.homeBiome} node pays the ${lane} shard ${step.cardId} costs`);
      const territory = territories.find((name) => !!name && beat!.say.includes(`${name} territory`));
      assert(!!territory, `${script.id}: the shards line must name a territory that pays ${lane}: "${beat!.say}"`);
      assert(beat!.say.includes(shardName(lane)), `${script.id}: the shards line must use the shard's name: "${beat!.say}"`);
      // Copy uses shard names, never lane names, on materials (design §24.2).
      assert(!new RegExp(`\\b${lane}\\b`, 'i').test(beat!.say), `${script.id}: the shards line names the ${lane} lane: "${beat!.say}"`);
      named.add(territory!);
    }
  }
  assert(named.size > 0, 'no shards line names a territory');
}

// ── The weapon page reads as the page does (design §26.1) ───────────────────
/**
 * The T1 band is a lean with ranks and the weapon's own verb: no pair to choose.
 * The lessons quote what the page shows (`cardSentence`, never typed), name the
 * lean and the weapon's own verb, and never promise that a lean choice rewrites
 * the verb at T1 (Attack and Speed are plain stats; Effect makes the weapon's own
 * move stronger). Rank II reads the number before and after.
 */
for (const plan of TUTORIAL_CLASS_PLANS) {
  const lineage = LINEAGE_DATABASE.get(plan.weaponCards.lineageId)!;
  const base = lineage.forms.find((f) => f.tier === 1)!.recipeId;
  const lean = lineage.cards.find((c) => c.id === plan.weaponCards.lean);
  const verb = lineage.cards.find((c) => c.id === plan.weaponCards.verb);
  assert(!!lean && lean.tier === 1 && lean.row === 'stat' && isRankedCard(lean),
    `${plan.className}: the lean is a tier-1 ranked lean (Attack / Speed / Effect)`);
  assert(!!verb && verb.tier === 1 && isVerbCard(verb), `${plan.className}: the verb is a tier-1 verb`);
  // The weapon's ONE verb: the guide never picks among verbs at T1.
  assert(lineage.cards.filter((c) => c.tier === 1 && c.row === 'payoff').map((c) => c.id).join() === verb!.id,
    `${plan.className}: ${verb!.name} is not the ${lineage.id}'s one T1 verb`);
  assert(plan.weaponCards.leanRank >= 1 && plan.weaponCards.leanRank <= maxCardRank(lean!),
    `${plan.className}: no rank ${plan.weaponCards.leanRank} on ${lean!.name}`);
  const tree = (leanRank: number, withVerb: boolean): LineageProgress => ({
    ownedCards: withVerb ? [lean!.id, verb!.id] : [lean!.id],
    active: withVerb ? { stat: lean!.id, payoff: verb!.id } : { stat: lean!.id },
    ownedForms: [base],
    wornForm: base,
    ranks: { [lean!.id]: leanRank },
  });
  const script = tutorialScriptFor(plan.classRoot);
  const say = (id: string) => script.beats.find((b) => b.id === id);
  const allLines = script.beats.flatMap((b) => [b.say, b.waiting, b.lesson?.read, b.lesson?.ring])
    .filter((line): line is string => line !== undefined);
  for (const line of allLines) {
    assert(!/chose that|lean decides|your lean, /i.test(line), `${script.id}: promises a lean choice rewrites the verb: "${line}"`);
  }

  // Lean I: names the lean, says what kind of thing it is, and reads its sentence.
  const leanBuy = say(`card:${lean!.id}`);
  assert(!!leanBuy && leanBuy.say.includes(`Buy ${lean!.name}`), `${plan.className}: the lean line must name ${lean!.name}`);
  assert(leanBuy!.say.includes(lean!.leanKind === 'effect' ? "weapon's own move stronger" : 'plain stat'),
    `${plan.className}: the lean line must say what ${lean!.name} is: "${leanBuy!.say}"`);
  assert(leanBuy!.lesson?.read.includes(`“${cardSentence(lean!, tree(1, false))}”`) === true,
    `${plan.className}: the lean lesson must quote its page sentence`);

  // The verb: the weapon's own move, its sentence with the lean at rank I, its ring.
  const sentence = cardSentence(verb!, tree(1, true))!;
  const buy = say(`card:${verb!.id}`);
  assert(!!buy?.lesson, `${plan.className}: the verb purchase has no lesson`);
  assert(buy!.say.includes(verb!.name) && buy!.say.includes('own move'), `${plan.className}: the verb line must name the weapon's own move: "${buy!.say}"`);
  assert(buy!.lesson!.cardId === verb!.id, `${plan.className}: the lesson points at another card`);
  assert(buy!.lesson!.read.includes(`“${sentence}”`), `${plan.className}: the lesson must quote "${sentence}"`);
  assert(buy!.lesson!.read.includes(lean!.name), `${plan.className}: the lesson must name the lean`);
  assert(!!buy!.lesson!.ring && buy!.lesson!.ring.includes(verb!.name) && buy!.lesson!.ring.includes('under your health bar'),
    `${plan.className}: the lesson must point at the verb's ring under the health bar`);
  if (lean!.leanKind === 'effect' && lineage.id === 'axe') {
    // The Effect lean visibly sizes the Axe's move ("strikes twice" → "strikes again at 110%").
    assert(sentence !== cardSentence(verb!, { ...tree(1, true), ownedCards: [verb!.id], active: { payoff: verb!.id } }),
      `${plan.className}: Effect does not change what ${verb!.name} says`);
  }

  // The ranks: one per beat after the verb, each quoting the page at its rank.
  const order = script.beats.map((b) => b.id);
  const rankIds = Array.from({ length: plan.weaponCards.leanRank - 1 }, (_, i) => `card:${lean!.id}:rank-${i + 2}`);
  const sequence = [`card:${lean!.id}`, `card:${verb!.id}`, ...rankIds].map((id) => order.indexOf(id));
  assert(sequence.every((at, i) => at >= 0 && (i === 0 || at > sequence[i - 1]!)),
    `${plan.className}: the page is bought lean I, verb, then ranks in order (${sequence.join(', ')})`);
  if (plan.weaponCards.leanRank >= 2) {
    const two = say(`card:${lean!.id}:rank-2`)!;
    assert(two.lesson?.read.includes(`“${cardSentence(lean!, tree(2, true))}”`) === true
      && two.lesson.read.includes(`“${cardSentence(lean!, tree(1, true))}”`),
    `${plan.className}: the rank II lesson must read the number after and before`);
    assert(two.lesson!.cardId === lean!.id, `${plan.className}: the rank II lesson points at another card`);
  }
  for (let rank = 3; rank <= plan.weaponCards.leanRank; rank += 1) {
    assert(say(`card:${lean!.id}:rank-${rank}`)!.say.includes(`“${cardSentence(lean!, tree(rank, true))}”`),
      `${plan.className}: the rank ${rank} line must quote its page sentence`);
  }
}

// ── Resume across ranks ──────────────────────────────────────────────────────
/**
 * A rank is part of the beat's state: owning the lean at rank I leaves the rank-II
 * beat to do, and the rank-II beat is done only at rank II or above (a player who
 * ranked up by hand is never sent back).
 */
for (const plan of TUTORIAL_CLASS_PLANS) {
  if (plan.weaponCards.leanRank < 2) continue;
  const script = tutorialScriptFor(plan.classRoot);
  const { lineageId, lean, verb } = plan.weaponCards;
  const lineage = LINEAGE_DATABASE.get(lineageId)!;
  const base = lineage.forms.find((f) => f.tier === 1)!.recipeId;
  const rankTwo = script.beats.find((b) => b.id === `card:${lean}:rank-2`)!;
  const at = (rank: number) => view({
    playerTier: 1,
    selectedClass: plan.classRoot,
    biomeLevel: { clearing: 4, [lineage.homeBiome]: 5 },
    equipment: { ...emptyEquipment(), weapon: base },
    lineages: {
      [lineageId]: {
        ownedCards: [lean, verb], active: { stat: lean, payoff: verb }, ownedForms: [base], wornForm: base, ranks: { [lean]: rank },
      },
    },
  });
  assert(nextStepOf(script, rankTwo, at(1))?.type === 'unlockCard', `${plan.className}: rank I leaves the rank-II purchase to do`);
  assert(nextStepOf(script, rankTwo, at(2)) === null, `${plan.className}: rank II finishes the rank-II beat`);
  assert(nextStepOf(script, rankTwo, at(3)) === null, `${plan.className}: rank III is past the rank-II beat`);
}

// ── A purchase into a row the player already filled ─────────────────────────
/**
 * The server activates a purchase only into an EMPTY row (W2-A). A player who
 * opted in mid-Tier-1 with another lean already active owns the guide's lean
 * after the buy, but it is not active, so the beat must not be done yet: its
 * `setActive` is what the director does next.
 */
for (const plan of TUTORIAL_CLASS_PLANS) {
  const script = tutorialScriptFor(plan.classRoot);
  const lineageId = plan.weaponCards.lineageId;
  const lineage = LINEAGE_DATABASE.get(lineageId)!;
  const base = lineage.forms.find((f) => f.tier === 1)!.recipeId;
  const leanBeat = script.beats.find((b) => b.id === `card:${plan.weaponCards.lean}`)!;
  const other = lineage.cards
    .find((c) => c.tier === 1 && c.row === 'stat' && c.id !== plan.weaponCards.lean)!;
  const progress = {
    ownedCards: [other.id, plan.weaponCards.lean],
    active: { stat: other.id },
    ownedForms: [base],
    wornForm: base,
  };
  // Every zone before the weapon's home mastered, the home zone at the lean's level.
  const before = ['plains', 'forest', 'swamp', 'mountain', 'cave'];
  const levels: Record<string, number> = { clearing: 4 };
  for (const zone of before.slice(0, before.indexOf(lineage.homeBiome))) levels[zone] = 6;
  levels[lineage.homeBiome] = 2;
  const midway = view({
    playerTier: 1,
    selectedClass: plan.classRoot,
    biomeLevel: levels,
    equipment: { ...emptyEquipment(), weapon: base },
    lineages: { [lineageId]: progress },
  });
  const next = nextStepOf(script, leanBeat, midway);
  assert(next?.type === 'setActive' && next.cardId === plan.weaponCards.lean,
    `${plan.className}: owning the lean with another one active must leave the setActive to do (got ${next?.type})`);
  const swapped = view({ ...midway, lineages: { [lineageId]: { ...progress, active: { stat: plan.weaponCards.lean } } } });
  assert(nextStepOf(script, leanBeat, swapped) === null, `${plan.className}: with the lean active the purchase beat is done`);
}

// ── The first-hour checklist (docs/guided-tutorial-plan.md) ─────────────────
/**
 * At most two new ideas per level and per beat, each introduced once, each with
 * a screen element that explains it (an anchor the guide can ring, when it names
 * one). Levels are read off the script's own gates (`tutorialChecklist`). Every
 * class meets the weapon page, both rows and the readout.
 */
for (const plan of TUTORIAL_CLASS_PLANS) {
  const script = tutorialScriptFor(plan.classRoot);
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
  const concepts = ['weapon-page', 'shards', 'lean', 'verb', 'rhythm-ring', 'gate'] as TutorialConceptId[];
  if (plan.weaponCards.leanRank >= 2) concepts.push('lean-rank');
  for (const concept of concepts) {
    assert(seen.has(concept), `${script.id}: never teaches ${concept}`);
  }
  // Each card is bought on the level its own row opens at in the weapon's home zone
  // (design §24.9: the verb at the zone's level 4, not a later leg's end).
  const levelOf = (id: string) => rows.find((r) => r.beatId === id)?.level;
  const lineage = LINEAGE_DATABASE.get(plan.weaponCards.lineageId)!;
  const zone = `${lineage.homeBiome[0].toUpperCase()}${lineage.homeBiome.slice(1)}`;
  for (const cardId of [plan.weaponCards.lean, plan.weaponCards.verb]) {
    const card = lineage.cards.find((c) => c.id === cardId)!;
    const opens = `${zone} ${resolveLineageCard(card, lineage).requiredBiomeLevel}`;
    assert(levelOf(`card:${cardId}`) === opens, `${script.id}: ${card.name} is bought at ${levelOf(`card:${cardId}`)}, not ${opens}`);
  }
  // Design §26.1 in the leg: rank II the level after the verb's (that level already
  // carries the verb and its ring), rank III at the leg's end.
  const verbLevel = resolveLineageCard(lineage.cards.find((c) => c.id === plan.weaponCards.verb)!, lineage).requiredBiomeLevel;
  if (plan.weaponCards.leanRank >= 2) {
    const at = levelOf(`card:${plan.weaponCards.lean}:rank-2`);
    assert(at === `${zone} ${verbLevel + 1}`, `${script.id}: rank II is bought at ${at}, not ${zone} ${verbLevel + 1}`);
  }
  if (plan.weaponCards.leanRank >= 3) {
    const at = levelOf(`card:${plan.weaponCards.lean}:rank-3`);
    assert(at === `${zone} ${biomeLevelCap(1, lineage.homeBiome)}`, `${script.id}: rank III is bought at ${at}, not the ${zone} leg's end`);
  }
}
for (const [id, concept] of Object.entries(TUTORIAL_CONCEPTS) as [TutorialConceptId, TutorialConcept][]) {
  assert(concept.name.length > 0 && concept.shownBy.length > 0, `${id}: an idea needs a name and what shows it`);
  if (concept.anchor) assert(concept.anchor in TUTORIAL_ANCHORS, `${id}: unknown anchor ${concept.anchor}`);
}

// ── A shard farm stands where the shard is paid (design §24.3) ──────────────
/**
 * Every kill in a node pays that node's ONE shard, so a farm beat that waits on
 * shards must stand in territory paying them: a Forest farm for Gale Shards on a
 * Grove-led node would never end. Every farm whose `until` names exactly one shard
 * carries that `shard` on its ref, and from every node of the biome the guide
 * resolves the farm to a node that pays it.
 */
{
  const shardsIn = (c: TutorialCondition): string[] => {
    switch (c.type) {
      case 'shardAtLeast': return [c.packet];
      case 'allOf': case 'anyOf': return c.of.flatMap(shardsIn);
      default: return [];
    }
  };
  let farms = 0;
  for (const plan of TUTORIAL_CLASS_PLANS) {
    for (const beat of tutorialScriptFor(plan.classRoot).beats) {
      for (const step of beat.steps) {
        if (step.type !== 'farm') continue;
        const shards = [...new Set(shardsIn(step.until))];
        if (shards.length !== 1) continue;
        farms += 1;
        assert(
          step.at.kind === 'biome' && step.at.shard === shards[0],
          `${plan.classRoot}/${beat.id}: a farm for ${shards[0]} shards must stand in its territory`,
        );
        if (step.at.kind !== 'biome') continue;
        const at = step.at;
        const starts = Object.entries(NODE_BIOMES)
          .filter(([, info]) => info.biomeGroup === at.biomeGroup && info.biomeTier === at.tier)
          .map(([id]) => id);
        for (const from of starts) {
          const node = tutorialNodeFor(at, { nodeId: from, clearedNodes: [] });
          assert(
            !!node && nodeShard(node) === shards[0],
            `${plan.classRoot}/${beat.id}: from ${from} the guide farms ${node}, which pays ${node ? nodeShard(node) : 'nothing'}`,
          );
        }
      }
    }
  }
  assert(farms >= TUTORIAL_CLASS_PLANS.length, `only ${farms} shard farm beats found — the sweep is broken`);
}

// Before the class pick, and for a class with no plan, the script is the opening alone.
assert(tutorialScriptFor(null) === TUTORIAL_OPENING, 'no class → opening only');
assert(tutorialScriptFor('not-a-class') === TUTORIAL_OPENING, 'unknown class → opening only');
assert(QUEST_DATABASE.has('tier-0'), 'the opening names a real quest');

console.log('tutorial: ok');
