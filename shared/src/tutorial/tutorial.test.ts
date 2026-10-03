import { ABILITY_DATABASE } from '../abilities';
import { ABILITY_RECIPE_DATABASE } from '../abilityRecipes';
import { globalMastery } from '../config/gameConfig';
import { familiesDropping } from '../data/families';
import { LINEAGE_DATABASE, lineageForRecipeId } from '../data/lineages';
import { GATE_CAPSTONE_AMOUNT } from '../data/lineages/magnitudes';
import type { LineageProgressMap } from '../data/lineages/types';
import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { emptyEquipment, type EssenceType } from '../items';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { ACTION_DATABASE, CONDITION_DATABASE, runeBudgetForGlobalMastery } from '../runeDatabase';
import { RUNE_RECIPE_DATABASE } from '../runeRecipes';
import { runicPointBreakdown } from '../runicPoints';
import { bossClearKey } from '../systems/biomeProgress';
import { NODE_BIOMES } from '../world/nodeBiomes';
import { nodeShard } from '../world/nodeBlends';
import { tutorialNodeFor } from './nodes';
import {
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_OPENING,
  TUTORIAL_SEALS,
  abilityLoadoutFor,
  nextStepOf,
  resolveBeatIndex,
  tutorialProgress,
  tutorialScriptFor,
  wiredRunes,
  type TutorialCondition,
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
  assert(resolveBeatIndex(O, view({ playerTier: 1 })) === beatIndex(O, 'choose-class'), 'tier 1 without a class resumes at the class pick');
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
    assert(beat.chapter.length > 0, `${script.id}/${beat.id}: no chapter`);
    for (const step of beat.steps) {
      const where = `${script.id}/${beat.id}`;
      switch (step.type) {
        case 'farm':
          assert(nodesFor(step.at).length > 0, `${where}: farm location resolves to no node`);
          for (const c of conditionsIn(step.until)) {
            if (c.type === 'canCraft' || c.type === 'recipeUnlocked') assert(RECIPE_DATABASE.has(c.recipeId), `${where}: unknown recipe ${c.recipeId}`);
            if (c.type === 'hasItem' || c.type === 'itemAtLeastPlus') assert(ITEM_DATABASE.has(c.definitionId), `${where}: unknown item ${c.definitionId}`);
            if (c.type === 'abilityKnown') assert(ABILITY_DATABASE.has(c.abilityId), `${where}: unknown ability ${c.abilityId}`);
            if (c.type === 'runeRecipeCrafted') assert(RUNE_RECIPE_DATABASE.has(c.recipeId), `${where}: unknown rune recipe ${c.recipeId}`);
            // Monotone farm conditions: a bare spendable resource would regress after the spend.
            assert(!(c === step.until && (c.type === 'canCraft' || c.type === 'essenceAtLeast' || c.type === 'canAffordUpgrades')),
              `${where}: farm condition must be guarded by its outcome (anyOf)`);
          }
          break;
        case 'craft':
          for (const id of step.recipeIds) assert(RECIPE_DATABASE.has(id), `${where}: unknown recipe ${id}`);
          break;
        case 'equip':
          for (const id of step.definitionIds) assert(ITEM_DATABASE.has(id), `${where}: unknown item ${id}`);
          break;
        case 'upgrade':
          assert(ITEM_DATABASE.has(step.definitionId), `${where}: unknown item ${step.definitionId}`);
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
          assert(lineage!.cards.some((c) => c.id === step.cardId), `${where}: unknown card ${step.cardId}`);
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
  for (let at = resolveBeatIndex(script, v); at < script.beats.length; at = resolveBeatIndex(script, v)) {
    assert(at >= visited, `${script.id}: resume went back from ${script.beats[visited]?.id} to ${script.beats[at].id}`);
    visited = at + 1;
    const beat = script.beats[at];
    for (let guard = 0; guard < 20; guard += 1) {
      const step = nextStepOf(script, beat, v);
      if (!step) break;
      switch (step.type) {
        case 'farm': {
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
            if (c.type === 'canAffordUpgrades') {
              for (const target of c.items) {
                const item = ITEM_DATABASE.get(target.definitionId)!;
                const need = item.upgrades?.[target.toPlus - 1]?.requiredBiomeLevel ?? 0;
                levels[item.biomeGroup!] = Math.max(levels[item.biomeGroup!] ?? 0, Math.min(need, 6));
              }
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
          // Holding the base form is what opens the tree (`checkUnlockCard`).
          assert(!!progress && progress.wornForm !== '',
            `${script.id}/${beat.id}: buys ${step.cardId} with no ${step.lineageId} form worn`);
          const card = lineage.cards.find((c) => c.id === step.cardId)!;
          set({
            lineages: {
              ...v.lineages,
              [step.lineageId]: {
                ...progress!,
                ownedCards: [...progress!.ownedCards, step.cardId],
                // Buying into an empty row activates it, server-side.
                active: { ...progress!.active, [card.row]: progress!.active[card.row] ?? step.cardId },
              },
            },
          });
          break;
        }
        case 'unlockForm': {
          const progress = v.lineages[step.lineageId];
          assert(!!progress, `${script.id}/${beat.id}: pays a gate on an unopened ${step.lineageId}`);
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
        case 'upgrade':
          assert(v.inventory.includes(step.definitionId) || Object.values(v.equipment).includes(step.definitionId),
            `${script.id}/${beat.id}: upgrades ${step.definitionId} before owning it`);
          set({ itemUpgrades: { ...v.itemUpgrades, [step.definitionId]: step.toPlus } });
          break;
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
  }
  assert(resolveBeatIndex(script, v) === script.beats.length, `${script.id}: finishes`);
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

  // The tree lessons actually land: a card bought, a gate paid, the form worn.
  const taught = Object.entries(v.lineages).filter(([, p]) => p.ownedCards.length > 0);
  assert(taught.length === 1, `${script.id}: exactly one lineage is taught (got ${taught.length})`);
  const [lineageId, progress] = taught[0];
  assert(progress.ownedCards.length === 1, `${script.id}: one card, not a shopping trip`);
  assert(progress.active.stat === progress.ownedCards[0], `${script.id}: the bought card ends up active`);
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
 * The guide says Tempo Shards "drop off the Pack — the Forest's wolves". That is
 * the one hand-written claim about the family table in the whole script, so it
 * is checked here rather than trusted: a table edit that moves Tempo out of the
 * Forest fails this instead of lying to a new player.
 */
{
  const script = tutorialScriptFor(TUTORIAL_CLASS_PLANS[0].classRoot);
  const card = script.beats
    .flatMap((b) => b.steps)
    .find((s): s is Extract<TutorialStep, { type: 'unlockCard' }> => s.type === 'unlockCard');
  assert(!!card, 'the script buys a lineage card');
  const lineage = LINEAGE_DATABASE.get(card!.lineageId)!;
  const lane = lineage.cards.find((c) => c.id === card!.cardId)!.lane;
  const sources = familiesDropping(lane).filter((f) => f.biome === lineage.homeBiome);
  assert(sources.length > 0, `no ${lineage.homeBiome} family drops the ${lane} shard the first card costs`);
  assert(
    sources.some((f) => f.name === 'Pack' && f.monsterIds.some((id) => id.includes('wolf'))),
    `the shards line names the Pack's wolves, but ${lineage.homeBiome}'s ${lane} source is now ${sources.map((f) => f.name).join('/')}`,
  );
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
