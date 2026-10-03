import { ABILITY_DATABASE } from '../../abilities';
import { ABILITY_RECIPE_DATABASE } from '../../abilityRecipes';
import { LINEAGE_DATABASE } from '../../data/lineages';
import { capstoneMaterialName } from '../../data/lineages/capstones';
import { shardName } from '../../data/lineages/packets';
import { lineageGateCost, resolveLineageCard } from '../../data/lineages/resolve';
import type { LineageCost, PacketId } from '../../data/lineages/types';
import { RECIPE_DATABASE } from '../../data/recipes';
import { ITEM_DATABASE } from '../../itemDatabase';
import type { EssenceType } from '../../items';
import { RUNE_RECIPE_DATABASE } from '../../runeRecipes';
import type {
  TutorialBeat,
  TutorialCondition,
  TutorialNodeRef,
  TutorialProgressRef,
  TutorialStep,
  TutorialUpgradeTarget,
} from '../types';
import { T1_BIOME_ORDER, TUTORIAL_SEALS, type PlanItem, type T1Biome, type TutorialClassPlan } from './plans';
import { tutorialRunes, type TutorialRuneStage } from './runes';

/**
 * Turns a class plan into beats (docs/guided-tutorial-plan.md, "Scripts").
 *
 * Every piece of work that needs resources is two beats: a farm beat that ends
 * when the work is affordable, then the action beat. The farm beat is skipped
 * automatically when the player can already afford it, so a well-stocked
 * character presses Next far fewer times.
 *
 * Lines explain WHY only where the choice is not obvious (a weapon swap, a
 * Guard change, a Rune); routine crafting and upgrading just say what happens.
 */

const BIOME_NAME: Record<T1Biome, string> = {
  plains: 'the Plains',
  forest: 'the Forest',
  swamp: 'the Swamp',
  mountain: 'the Mountain',
  cave: 'the Cave',
};

/** Zone name without the article, for "Plains essence". */
const ZONE_WORD: Record<string, string> = {
  plains: 'Plains',
  forest: 'Forest',
  swamp: 'Swamp',
  mountain: 'Mountain',
  cave: 'Cave',
};

const CHAPTER: Record<T1Biome, string> = {
  plains: 'The Plains',
  forest: 'The Forest',
  swamp: 'The Swamp',
  mountain: 'The Mountain',
  cave: 'The Cave',
};

/** Prep line when the boss is the first seal. */
const SEAL_OPENING: Record<T1Biome, string> = {
  plains: 'Every zone mastered, gear at +5. Now the seals: two boss kills unlock Tier 2. The Plains boss is the gentlest, so it goes first.',
  forest: 'Every zone mastered, gear at +5. Now the seals: two boss kills unlock Tier 2, starting in the Forest.',
  swamp: 'Every zone mastered, gear at +5. Now the seals: two boss kills unlock Tier 2, starting in the Swamp.',
  mountain: 'Every zone mastered, gear at +5. Now the seals: two boss kills unlock Tier 2, starting on the Mountain.',
  cave: 'Every zone mastered, gear at +5. Now the seals: two boss kills unlock Tier 2, starting in the Cave.',
};

/** Prep line for the second seal: the one reason this fight's loadout differs. */
const SEAL_SECOND: Record<T1Biome, string> = {
  plains: 'One seal down. The Plains boss next; Sweep suits its crowd of guards.',
  forest: 'One seal down. For the Forest boss, Expose Weakness goes back in to end the fight sooner.',
  swamp: 'One seal down. The Swamp boss poisons, so Cleanse comes back for this one.',
  mountain: 'One seal down. The Mountain boss winds up one huge hit: Step Back dodges it, Expose Weakness ends the fight sooner.',
  cave: 'One seal down. The Cave boss winds up big hits, and Step Back is already on your Runes for them.',
};

/** First beat of each biome: why we are going there. */
const BIOME_INTRO: Record<T1Biome, string> = {
  plains: 'On to the Plains, next door to the Clearing and still forgiving.',
  forest: 'Plains mastered. The Forest is next.',
  swamp: 'Into the Swamp. Its monsters poison, so we come prepared.',
  mountain: 'The Mountain hits harder but pays well.',
  cave: 'Last zone: the Cave. Its monsters wind up big hits you can dodge.',
};

/**
 * Lines for items whose pick needs a reason. Everything else gets the routine
 * "Craft X and wear it."
 */
const ITEM_REASON: Record<string, string> = {
  'iron-broadsword': 'A real weapon at last: the Iron Broadsword.',
  'flash-rapier': 'The Flash Rapier swings far faster than the broadsword. Switch to it.',
  'mountain-vest-t1': 'The Mountain armor is the sturdiest yet.',
  'forest-vest-t1': 'The Forest armor makes you harder to hit, which suits fighting from range.',
  'swamp-vest-t1': 'The Swamp armor resists poison and damage over time.',
  'swamp-charm-t1': 'This charm heals in steady pulses, which carries you through long fights.',
  'plains-boots-t1': 'These boots speed you up after every kill.',
};

const CRAFT_REASON: Record<string, string> = {
  'chaotic-axe': 'The Chaotic Axe hits hardest of anything here but whiffs now and then. Worth it.',
  'ashbrand-blade': 'The Poison Dagger poisons what it hits. It becomes your main weapon.',
};

const EQUIP_REASON: Record<string, string> = {
  'chaotic-axe': 'The axe is ready. Switch to it.',
  'ashbrand-blade': 'The Poison Dagger is ready. Switch to it.',
};

const LEARN_REASON: Record<string, string> = {
  sweep: 'Learn Sweep: every so often your swing cleaves everything around you.',
  'second-wind': 'Learn Second Wind: a burst of healing in the middle of a fight.',
  cleanse: 'Learn Cleanse. Here it takes Second Wind\'s place, because poison is the real threat.',
  'expose-weakness': 'Learn Expose Weakness. It replaces Sweep and marks your target to take more damage from everything.',
};

/**
 * The weapon tree the guide teaches (design §4, §5, §12; W1-E).
 *
 * The Rapier is the Forest's lineage AND the weapon every class plan crafts
 * there, so the three lessons land where the weapon is earned: a card at the
 * stat row, the shards that pay for it, and — after the seals — the gate that
 * turns the item into its tier-2 form. The weapon `+N` ladder these beats
 * replace was deleted by the lineage rework (commit 03783104).
 */
const TUTORIAL_TREE = {
  lineageId: 'rapier',
  /** The T1 stat row card: Quick Wrist, the cheapest honest first purchase. */
  firstCardId: 'rapier-t1-tempo-stat',
  /** The tier-2 form behind the T1 gate, crowning the same lane. */
  gateFormId: 'gale-needle',
  /**
   * Where the lane's shard comes from, for the one line that names a drop
   * source. Data-checked in `tutorial.test.ts`, so a family table edit that
   * moves Tempo out of the Forest fails loudly instead of lying on screen.
   */
  shardSource: 'the Pack — the Forest\'s wolves',
} as const;

/** The leg the first-card lesson rides on — the lineage's own home biome. */
const TUTORIAL_TREE_BIOME: T1Biome = 'forest';

const RUNE_REASON: Record<string, { craft: string; equip: string }> = {
  'rune-recipe-avoid-hazards': {
    craft: 'The Swamp floor hurts. Avoid Hazards walks you around the bad ground.',
    equip: 'Add Avoid Hazards to your Runes.',
  },
  'rune-recipe-keep-distance': {
    craft: 'You fight from range, so Orbit keeps you circling out of reach while you attack.',
    equip: 'Swap chasing for Orbit in your Runes.',
  },
  'rune-recipe-step-back': {
    craft: 'Step Back moves you out of a telegraphed hit before it lands.',
    equip: 'Put Step Back at the top of your Runes, so dodging comes before anything else.',
  },
};

function name(definitionId: string): string {
  return ITEM_DATABASE.get(definitionId)?.name ?? definitionId;
}

/** A Tier-1 biome farm; with `shard`, only the territories that pay it (design §24.3). */
function biomeRef(biome: string, shard?: PacketId): TutorialNodeRef {
  return { kind: 'biome', biomeGroup: biome, tier: 1, pick: 'uncleared', ...(shard ? { shard } : {}) };
}

/** Essence (+ biome level) gate for a recipe as conditions. */
function costConditions(
  cost: Partial<Record<EssenceType, number>>,
  recipeGroup: string | undefined,
  requiredBiomeLevel: number | undefined,
): TutorialCondition[] {
  const conditions: TutorialCondition[] = [];
  if (recipeGroup && requiredBiomeLevel) {
    conditions.push({ type: 'biomeLevelAtLeast', biomeGroup: recipeGroup, level: requiredBiomeLevel });
  }
  for (const [essence, amount] of Object.entries(cost)) {
    if ((amount ?? 0) > 0) conditions.push({ type: 'essenceAtLeast', essence: essence as EssenceType, amount: amount ?? 0 });
  }
  return conditions;
}

/** Essence + shard gate for a lineage card or a gate, as conditions. */
function lineageCostConditions(cost: LineageCost): TutorialCondition[] {
  const conditions: TutorialCondition[] = [];
  for (const [essence, amount] of Object.entries(cost.essence)) {
    if ((amount ?? 0) > 0) conditions.push({ type: 'essenceAtLeast', essence: essence as EssenceType, amount: amount ?? 0 });
  }
  for (const [packet, amount] of Object.entries(cost.shards)) {
    if ((amount ?? 0) > 0) conditions.push({ type: 'shardAtLeast', packet: packet as PacketId, amount: amount ?? 0 });
  }
  return conditions;
}

function lineageCostProgress(cost: LineageCost): TutorialProgressRef[] {
  const rows: TutorialProgressRef[] = [];
  for (const [essence, amount] of Object.entries(cost.essence)) {
    if ((amount ?? 0) > 0) rows.push({ type: 'essence', essence: essence as EssenceType, amount: amount ?? 0 });
  }
  for (const [packet, amount] of Object.entries(cost.shards)) {
    if ((amount ?? 0) > 0) rows.push({ type: 'shard', packet: packet as PacketId, amount: amount ?? 0 });
  }
  return rows;
}

function costProgress(
  cost: Partial<Record<EssenceType, number>>,
  recipeGroup: string | undefined,
  requiredBiomeLevel: number | undefined,
): TutorialProgressRef[] {
  const rows: TutorialProgressRef[] = [];
  if (recipeGroup && requiredBiomeLevel) rows.push({ type: 'biomeLevel', biomeGroup: recipeGroup, level: requiredBiomeLevel });
  for (const [essence, amount] of Object.entries(cost)) {
    if ((amount ?? 0) > 0) rows.push({ type: 'essence', essence: essence as EssenceType, amount: amount ?? 0 });
  }
  return rows;
}

class ScriptBuilder {
  readonly beats: TutorialBeat[] = [];
  /** Upgrade level each item reaches by this point of the script. */
  private readonly plannedPlus = new Map<string, number>();
  private upgradeSets = 0;

  constructor(private readonly plan: TutorialClassPlan) {}

  private push(beat: TutorialBeat): void {
    if (this.beats.some((existing) => existing.id === beat.id)) {
      throw new Error(`duplicate tutorial beat ${beat.id} in ${this.plan.classRoot}`);
    }
    this.beats.push(beat);
  }

  runes(chapter: string, id: string, say: string, stage: TutorialRuneStage): void {
    this.push({
      id,
      chapter,
      say,
      steps: [{ type: 'configureRunes', rules: tutorialRunes(this.plan.movement, stage, this.plan.classRoot) }],
    });
  }

  piece(chapter: string, recipeId: string, wear: boolean, sayFarm?: string): void {
    const recipe = RECIPE_DATABASE.get(recipeId);
    if (!recipe) throw new Error(`unknown recipe ${recipeId}`);
    const itemName = name(recipeId);
    this.push({
      id: `farm:${recipeId}`,
      chapter,
      say: sayFarm ?? `Next up: the ${itemName}.`,
      waiting: `Fighting in ${BIOME_NAME[recipe.recipeGroup as T1Biome] ?? recipe.recipeGroup} until the ${itemName} is ready.`,
      progress: costProgress(recipe.cost, recipe.recipeGroup, recipe.requiredBiomeLevel),
      steps: [{
        type: 'farm',
        at: biomeRef(recipe.recipeGroup),
        until: {
          type: 'anyOf',
          of: [{ type: 'hasItem', definitionId: recipeId }, { type: 'canCraft', recipeId }],
        },
      }],
    });
    const steps: TutorialStep[] = [{ type: 'craft', recipeIds: [recipeId] }];
    if (wear) steps.push({ type: 'equip', definitionIds: [recipeId] });
    this.push({
      id: `craft:${recipeId}`,
      chapter,
      say: wear
        ? ITEM_REASON[recipeId] ?? `Craft the ${itemName} and wear it.`
        : CRAFT_REASON[recipeId] ?? `Craft the ${itemName} for later.`,
      steps,
    });
  }

  equip(chapter: string, definitionIds: string[], say: string, id: string): void {
    this.push({ id, chapter, say, steps: [{ type: 'equip', definitionIds }] });
  }

  learn(chapter: string, recipeId: string, slot: 'technique' | 'guard'): void {
    const recipe = ABILITY_RECIPE_DATABASE.get(recipeId);
    if (!recipe) throw new Error(`unknown ability recipe ${recipeId}`);
    const abilityName = ABILITY_DATABASE.get(recipe.abilityId)?.name ?? recipe.abilityId;
    this.push({
      id: `farm:${recipeId}`,
      chapter,
      say: `Next: ${abilityName}.`,
      waiting: `Fighting until ${abilityName} can be learned.`,
      progress: costProgress(recipe.cost, recipe.recipeGroup, recipe.requiredBiomeLevel),
      steps: [{
        type: 'farm',
        at: biomeRef(recipe.recipeGroup ?? 'plains'),
        until: {
          type: 'anyOf',
          of: [
            { type: 'abilityKnown', abilityId: recipe.abilityId },
            { type: 'allOf', of: costConditions(recipe.cost, recipe.recipeGroup, recipe.requiredBiomeLevel) },
          ],
        },
      }],
    });
    this.push({
      id: `learn:${recipeId}`,
      chapter,
      say: LEARN_REASON[recipe.abilityId] ?? `Learn ${abilityName}.`,
      steps: [{ type: 'learnAbility', recipeId, abilityId: recipe.abilityId, slot }],
    });
  }

  setAbilities(chapter: string, id: string, say: string, techniques: string[], guards: string[]): void {
    this.push({ id, chapter, say, steps: [{ type: 'setAbilities', techniques, guards }] });
  }

  rune(chapter: string, recipeId: string, stage: TutorialRuneStage): void {
    const recipe = RUNE_RECIPE_DATABASE.get(recipeId);
    if (!recipe) throw new Error(`unknown rune recipe ${recipeId}`);
    const lines = RUNE_REASON[recipeId] ?? { craft: `Make the ${recipe.name} Rune.`, equip: 'Update your Runes.' };
    this.push({
      id: `farm:${recipeId}`,
      chapter,
      say: `Next: the ${recipe.name} Rune.`,
      waiting: `Fighting until the ${recipe.name} Rune can be made.`,
      progress: costProgress(recipe.cost, recipe.recipeGroup, recipe.requiredBiomeLevel),
      steps: [{
        type: 'farm',
        at: biomeRef(recipe.recipeGroup ?? 'plains'),
        until: {
          type: 'anyOf',
          of: [
            { type: 'runeRecipeCrafted', recipeId },
            { type: 'allOf', of: costConditions(recipe.cost, recipe.recipeGroup, recipe.requiredBiomeLevel) },
          ],
        },
      }],
    });
    this.push({ id: `rune:${recipeId}`, chapter, say: lines.craft, steps: [{ type: 'craftRune', recipeId }] });
    this.runes(chapter, `runes:${recipeId}`, lines.equip, stage);
  }

  maxOut(chapter: string, biome: T1Biome): void {
    this.push({
      id: `max:${biome}`,
      chapter,
      say: biome === 'plains'
        ? 'Now master the Plains. Every zone you master opens stronger gear upgrades.'
        : `Now master ${BIOME_NAME[biome]}.`,
      waiting: `Fighting in ${BIOME_NAME[biome]} until its mastery is maxed.`,
      progress: [{ type: 'biomeLevel', biomeGroup: biome, level: 6 }],
      steps: [{ type: 'farm', at: biomeRef(biome), until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: 6 } }],
    });
  }

  /**
   * One set of upgrades, split by the zone whose essence pays for them (the
   * Plains vest is paid in Plains essence even during the Forest leg).
   */
  upgrades(chapter: string, leg: T1Biome, targets: Array<[string, number]>, intro?: string): void {
    const groups = new Map<string, TutorialUpgradeTarget[]>();
    for (const [definitionId, toPlus] of targets) {
      const biome = ITEM_DATABASE.get(definitionId)?.biomeGroup;
      if (!biome) throw new Error(`cannot upgrade ${definitionId}`);
      const group = groups.get(biome) ?? [];
      group.push({ definitionId, toPlus });
      groups.set(biome, group);
    }

    this.upgradeSets += 1;
    // The leg's own zone first: the player is already standing in it.
    const ordered = [...groups.entries()].sort(([a], [b]) => (a === leg ? -1 : b === leg ? 1 : 0));
    let first = true;
    for (const [biome, items] of ordered) {
      const done: TutorialCondition = {
        type: 'allOf',
        of: items.map((t): TutorialCondition => ({ type: 'itemAtLeastPlus', definitionId: t.definitionId, plus: t.toPlus })),
      };
      const key = `${leg}:${this.upgradeSets}:${biome}`;
      const zone = BIOME_NAME[biome as T1Biome] ?? biome;

      const names = items.map((t) => name(t.definitionId)).join(', ');
      this.push({
        id: `farm:upgrades:${key}`,
        chapter,
        say: first
          ? intro ?? `Time to upgrade before moving on: ${names}.`
          : `The rest is paid in ${ZONE_WORD[biome] ?? biome} essence, so back to ${zone} for a while.`,
        waiting: `Gathering ${ZONE_WORD[biome] ?? biome} essence for the upgrades.`,
        progress: [{ type: 'upgradeCost', items }],
        steps: [{
          type: 'farm',
          at: biomeRef(biome),
          until: { type: 'anyOf', of: [done, { type: 'canAffordUpgrades', items }] },
        }],
      });
      this.push({
        id: `upgrade:${key}`,
        chapter,
        say: items.length === 1
          ? `Upgrade the ${names} to +${items[0].toPlus}.`
          : `Upgrade them all: ${names}.`,
        steps: items.map((t): TutorialStep => ({ type: 'upgrade', definitionId: t.definitionId, toPlus: t.toPlus })),
      });
      for (const t of items) this.plannedPlus.set(t.definitionId, t.toPlus);
      first = false;
    }
  }

  items(chapter: string, leg: T1Biome, items: readonly PlanItem[] | undefined, firstFarmLine?: { value?: string }): void {
    for (const item of items ?? []) {
      const intro = firstFarmLine?.value;
      if ('piece' in item) {
        this.piece(chapter, item.piece, true, intro);
        if (firstFarmLine) firstFarmLine.value = undefined;
      } else if ('craft' in item) {
        this.piece(chapter, item.craft, false, intro);
        if (firstFarmLine) firstFarmLine.value = undefined;
      } else if ('equip' in item) {
        const single = item.equip.length === 1 ? item.equip[0] : null;
        this.equip(
          chapter,
          item.equip,
          single ? EQUIP_REASON[single] ?? `Wear the ${name(single)}.` : 'Put on the best of what you have before going in.',
          `equip:${leg}:${item.equip.join('+')}`,
        );
      } else {
        this.upgrades(chapter, leg, item.upgrade, item.say);
      }
    }
  }

  /** The shared learning of each leg (the bot's `biomeSharedSteps`, dodge profile). */
  shared(chapter: string, biome: T1Biome): void {
    const ranged = this.plan.movement === 'ranged';
    switch (biome) {
      case 'plains':
        this.learn(chapter, 'ability-recipe-sweep', 'technique');
        return;
      case 'forest':
        this.learn(chapter, 'ability-recipe-second-wind', 'guard');
        return;
      case 'swamp':
        this.rune(chapter, 'rune-recipe-avoid-hazards', 'hazards');
        this.learn(chapter, 'ability-recipe-cleanse', 'guard');
        return;
      case 'mountain':
        this.setAbilities(
          chapter,
          'abilities:mountain',
          'No poison up here, so Second Wind goes back in.',
          ['sweep'],
          ['second-wind'],
        );
        if (ranged) this.rune(chapter, 'rune-recipe-keep-distance', 'orbit');
        return;
      case 'cave':
        // Expose Weakness waits for Cave mastery (see `build`).
        this.rune(chapter, 'rune-recipe-step-back', 'final');
        return;
    }
  }

  /**
   * The weapon tree's first card: the shards that pay for it, then the buy.
   *
   * Two beats as everywhere else, and the farm beat is skipped automatically
   * when the wallet already covers it — so the card beat's own line repeats the
   * price, and the lesson survives a well-stocked character.
   */
  firstCard(chapter: string): void {
    const lineage = LINEAGE_DATABASE.get(TUTORIAL_TREE.lineageId);
    if (!lineage) throw new Error(`unknown lineage ${TUTORIAL_TREE.lineageId}`);
    const card = lineage.cards.find((c) => c.id === TUTORIAL_TREE.firstCardId);
    if (!card) throw new Error(`unknown lineage card ${TUTORIAL_TREE.firstCardId}`);
    const resolved = resolveLineageCard(card, lineage);
    const owned: TutorialCondition = { type: 'lineageCardOwned', lineageId: lineage.id, cardId: card.id };
    const shard = shardName(card.lane);

    this.push({
      id: `shards:${card.id}`,
      chapter,
      say: `The ${name(lineage.forms[0].recipeId)} has a tree of its own, and its first card is paid in ${shard}s. Those drop off ${TUTORIAL_TREE.shardSource}.`,
      waiting: `Fighting in ${BIOME_NAME[lineage.homeBiome as T1Biome] ?? lineage.homeBiome} for ${shard}s.`,
      progress: [
        { type: 'biomeLevel', biomeGroup: lineage.homeBiome, level: resolved.requiredBiomeLevel },
        ...lineageCostProgress(resolved.cost),
      ],
      steps: [{
        type: 'farm',
        // Design §24.3: a node pays one shard, its dominant family's, so the
        // farm stands in the territory that pays the card's lane.
        at: biomeRef(lineage.homeBiome, card.lane),
        until: {
          type: 'anyOf',
          of: [owned, {
            type: 'allOf',
            of: [
              { type: 'biomeLevelAtLeast', biomeGroup: lineage.homeBiome, level: resolved.requiredBiomeLevel },
              { type: 'globalMasteryAtLeast', value: resolved.requiredGlobalMastery },
              ...lineageCostConditions(resolved.cost),
            ],
          }],
        },
      }],
    });
    this.push({
      id: `card:${card.id}`,
      chapter,
      say: `Open the tree and buy ${card.name}. A card is bought once and kept; which one is active stays a free choice after that.`,
      steps: [{ type: 'unlockCard', lineageId: lineage.id, cardId: card.id }],
    });
  }

  /**
   * The gate, after the seals: the boss capstone, the purchase, the next band.
   *
   * It sits after Tier 2 because that is the only place it fits — the gate asks
   * for full Tier-1 Global Mastery, and a THIRD boss kill before the seals would
   * itself count as a seal (any two biome bosses promote; `sealsHeldAtTier`).
   */
  gate(): void {
    const chapter = 'The Gate';
    const lineage = LINEAGE_DATABASE.get(TUTORIAL_TREE.lineageId);
    if (!lineage) throw new Error(`unknown lineage ${TUTORIAL_TREE.lineageId}`);
    const form = lineage.forms.find((f) => f.recipeId === TUTORIAL_TREE.gateFormId);
    if (!form) throw new Error(`unknown lineage form ${TUTORIAL_TREE.gateFormId}`);
    const cost = lineageGateCost(form, lineage);
    const owned: TutorialCondition = { type: 'lineageFormOwned', lineageId: lineage.id, recipeId: form.recipeId };
    const zone = ZONE_WORD[form.biome] ?? form.biome;
    const capstone = capstoneMaterialName(form.biome);
    const shards = Object.keys(cost.shards).map((packet) => `${shardName(packet as PacketId)}s`).join(' and ');
    // One crowned lane is one shard, so the farm narrows to the nodes that pay it
    // (design §24.3); a gate costing two shards would farm the whole biome.
    const gateShards = Object.keys(cost.shards) as PacketId[];
    const gateFarm = biomeRef(form.biome, gateShards.length === 1 ? gateShards[0] : undefined);

    this.push({
      id: `farm:gate:${form.recipeId}`,
      chapter,
      say: `Tier 1 is done, and this last part is optional. Tier 2 opens the ${name(form.recipeId)}: its gate wants ${zone} essence and ${shards}.`,
      waiting: `Working ${BIOME_NAME[form.biome as T1Biome] ?? form.biome} for the gate's essence and shards.`,
      progress: lineageCostProgress(cost),
      steps: [{
        type: 'farm',
        at: gateFarm,
        until: { type: 'anyOf', of: [owned, { type: 'allOf', of: lineageCostConditions(cost) }] },
      }],
    });
    this.push({
      id: `capstone:${form.recipeId}`,
      chapter,
      say: `The gate also wants ${cost.capstone.amount} ${capstone} drops, and only the ${zone} boss has them. Going up a tier always runs through a boss.`,
      waiting: `Fighting the ${zone} boss for ${capstone} drops.`,
      progress: [{ type: 'capstone', biome: form.biome, amount: cost.capstone.amount }],
      steps: [{
        type: 'attemptBoss',
        biomeGroup: form.biome,
        tier: form.tier - 1,
        until: {
          type: 'anyOf',
          of: [owned, { type: 'capstoneAtLeast', biome: form.biome, amount: cost.capstone.amount }],
        },
      }],
    });
    this.push({
      id: `gate:${form.recipeId}`,
      chapter,
      say: `Pay the gate and wear it: the ${name(form.recipeId)}, and a whole new band of cards above the one you have.`,
      steps: [
        // Every melee plan swapped to the seal weapon for the bosses, and the
        // director opens the tree BY SLOT, so without this the guide pointed at
        // the Axe's tree while talking about the Rapier's gate (review P9).
        { type: 'equip', definitionIds: [lineage.forms.find((f) => f.tier === form.tier - 1)?.recipeId ?? form.recipeId] },
        { type: 'unlockForm', lineageId: lineage.id, recipeId: form.recipeId },
        { type: 'wearForm', lineageId: lineage.id, recipeId: form.recipeId },
      ],
    });
  }

  bosses(): void {
    const chapter = 'The Seals';
    const { bossKit, bosses } = this.plan;
    TUTORIAL_SEALS.forEach((biome, index) => {
      const loadout = bosses[biome];
      this.push({
        id: `boss-prep:${biome}`,
        chapter,
        say: index === 0 ? SEAL_OPENING[biome] : SEAL_SECOND[biome],
        steps: [
          { type: 'equip', definitionIds: [...bossKit, loadout.armor] },
          { type: 'setAbilities', techniques: [loadout.technique], guards: [loadout.guard] },
        ],
      });
      this.push({
        id: `boss:${biome}`,
        chapter,
        say: index === 0
          ? 'Clear the guards, wake the boss at the altar, and take the seal. Falling is normal; we just try again.'
          : 'The last seal before Tier 2.',
        waiting: `Fighting for the ${ZONE_WORD[biome]} seal.`,
        steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 1 }],
      });
    });
  }

  build(): TutorialBeat[] {
    this.runes(
      'The Clearing',
      'runes:opening',
      'These Runes are your standing orders: rest up between fights and back off when badly hurt.',
      'opening',
    );
    for (const biome of T1_BIOME_ORDER) {
      const chapter = CHAPTER[biome];
      const biomePlan = this.plan.biomes[biome];
      const intro = { value: BIOME_INTRO[biome] as string | undefined };
      this.items(chapter, biome, biomePlan.before, intro);
      // The weapon's tree, taught where the weapon is earned: the Flash Rapier
      // is worn by now, and holding the base form is what opens the tree.
      if (biome === TUTORIAL_TREE_BIOME) this.firstCard(chapter);
      if (intro.value) {
        // No gear to open the leg with (e.g. Mountain for some classes): the
        // intro rides on the leg's first learning beat instead.
        const before = this.beats.length;
        this.shared(chapter, biome);
        if (this.beats[before]) this.beats[before] = { ...this.beats[before], say: `${intro.value} ${this.beats[before].say}` };
        intro.value = undefined;
      } else {
        this.shared(chapter, biome);
      }
      this.items(chapter, biome, biomePlan.after);
      this.maxOut(chapter, biome);
      // The bot learns it at Cave 3, but with Step Back and two abilities the
      // build only fits the Rune budget of a fully mastered Tier 1 (GM 30).
      if (biome === 'cave') this.learn(chapter, 'ability-recipe-expose-weakness', 'technique');
      this.items(chapter, biome, biomePlan.afterMax);
    }
    this.bosses();
    this.gate();
    return this.beats;
  }
}

/** The class-specific beats that follow the shared opening. */
export function buildClassBeats(plan: TutorialClassPlan): TutorialBeat[] {
  return new ScriptBuilder(plan).build();
}
