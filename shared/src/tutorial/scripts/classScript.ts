import { ABILITY_DATABASE } from '../../abilities';
import { ABILITY_RECIPE_DATABASE } from '../../abilityRecipes';
import { biomeLevelCap } from '../../config/gameConfig';
import { LINEAGE_DATABASE } from '../../data/lineages';
import { capstoneMaterialName } from '../../data/lineages/capstones';
import { shardName } from '../../data/lineages/packets';
import { isVerbCard, lineageGateCost, packetMoment, resolveLineageCard } from '../../data/lineages/resolve';
import { statLine, verbSentence } from '../../data/lineages/sentences';
import type {
  LineageCard,
  LineageCost,
  LineageDefinition,
  PacketId,
  ResolvedLineageCard,
} from '../../data/lineages/types';
import { RECIPE_DATABASE } from '../../data/recipes';
import { ITEM_DATABASE } from '../../itemDatabase';
import type { EssenceType } from '../../items';
import { RUNE_RECIPE_DATABASE } from '../../runeRecipes';
import { nodeFamily, nodesPayingShard } from '../../world/nodeBlends';
import type { TutorialConceptId } from '../concepts';
import type {
  TutorialBeat,
  TutorialCondition,
  TutorialLesson,
  TutorialNodeRef,
  TutorialProgressRef,
  TutorialStep,
} from '../types';
import {
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  TUTORIAL_WEAPON_LINEAGE,
  type PlanItem,
  type T1Biome,
  type TutorialClassPlan,
} from './plans';
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
 * Guard change, a Rune); routine crafting just says what happens.
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

/**
 * Prep line when the boss is the first seal. (No "+5" any more: an item is
 * crafted at full power, design §23–§24.5.)
 */
const SEAL_OPENING: Record<T1Biome, string> = {
  plains: 'Every zone mastered. Now the seals: two boss kills unlock Tier 2. The Plains boss is the gentlest, so it goes first.',
  forest: 'Every zone mastered. Now the seals: two boss kills unlock Tier 2, starting in the Forest.',
  swamp: 'Every zone mastered. Now the seals: two boss kills unlock Tier 2, starting in the Swamp.',
  mountain: 'Every zone mastered. Now the seals: two boss kills unlock Tier 2, starting on the Mountain.',
  cave: 'Every zone mastered. Now the seals: two boss kills unlock Tier 2, starting in the Cave.',
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
 * The new idea each intro line introduces (the first-hour checklist,
 * `concepts.ts`). An intro rides on the leg's first farm or learning beat, and
 * so do these.
 */
const BIOME_INTRO_TEACHES: Partial<Record<T1Biome, TutorialConceptId[]>> = {
  plains: ['zones'],
  swamp: ['poison'],
  cave: ['telegraphs'],
};

/** The new idea a craft line introduces, on the craft beat that says it. */
const ITEM_TEACHES: Record<string, TutorialConceptId[]> = {
  'forest-vest-t1': ['evasion'],
};

/** The new ideas a learning line introduces, on the learn beat. */
const LEARN_TEACHES: Record<string, TutorialConceptId[]> = {
  sweep: ['technique', 'ability-runes'],
  'second-wind': ['guard'],
  cleanse: ['loadout-swap'],
};

/** The new idea a Rune's craft line introduces, on the craft beat. */
const RUNE_TEACHES: Record<string, TutorialConceptId[]> = {
  'rune-recipe-avoid-hazards': ['hazards'],
  'rune-recipe-keep-distance': ['orbit'],
  'rune-recipe-step-back': ['step-back'],
};

/** A beat with its `teaches` set, or without the field when there is nothing new. */
function teaching(beat: TutorialBeat, teaches: readonly TutorialConceptId[] | undefined): TutorialBeat {
  const list = [...new Set([...(beat.teaches ?? []), ...(teaches ?? [])])];
  if (list.length === 0) {
    const { teaches: _omit, ...rest } = beat;
    return rest;
  }
  return { ...beat, teaches: list };
}

/** The leg's intro line and its idea, consumed by whichever beat says it first. */
interface LegIntro {
  say?: string;
  teaches: TutorialConceptId[];
}

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
 * The weapon page the guide teaches (design §24.2, §24.6).
 *
 * The Rapier is the Forest's lineage AND the weapon every class plan crafts
 * there, so the lessons land where the weapon is earned and while it is worn
 * (a lineage pays only while its own form is: design §23):
 *
 *  1. the LEAN, row 1, at its Forest level — a stat, and the payload it names;
 *  2. the VERB, row 2, as soon as its gates open — a moment, and the lesson is
 *     the sentence the lean just rewrote ("look at what your verb says now")
 *     plus the ring on the rhythm readout that counts toward it;
 *  3. after the seals, the gate that turns the item into its tier-2 form.
 *
 * WHICH lean and verb is per class (`TutorialClassPlan.weaponCards`).
 */
const TUTORIAL_TREE = {
  lineageId: TUTORIAL_WEAPON_LINEAGE,
  /** The tier-2 form behind the T1 gate. */
  gateFormId: 'gale-needle',
} as const;

const COUNT_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

function ordinal(n: number): string {
  const whole = Math.round(n);
  const mod100 = whole % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${whole}th`;
  switch (whole % 10) {
    case 1: return `${whole}st`;
    case 2: return `${whole}nd`;
    case 3: return `${whole}rd`;
    default: return `${whole}th`;
  }
}

/**
 * What a verb's ring on the rhythm readout does, in words, read off the verb's
 * own moment (`packetMoment`), so a moment change rewrites the line.
 */
function ringPhrase(card: LineageCard): string {
  const moment = packetMoment(card.lane);
  switch (moment?.kind) {
    case 'hit-nth':
      return `fills one hit at a time and fires on the ${ordinal(moment.n ?? 1)}`;
    case 'first-hit':
      return moment.perTarget
        ? 'stays lit until your first hit on a target spends it'
        : 'stays lit until your first hit of a fight spends it';
    case 'kill':
      return 'lights on a kill, for the next hit';
    default:
      return moment?.capMs ? 'shows the wait until it can fire again' : 'shows when it is ready';
  }
}

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

  constructor(private readonly plan: TutorialClassPlan) {}

  private push(beat: TutorialBeat): void {
    if (this.beats.some((existing) => existing.id === beat.id)) {
      throw new Error(`duplicate tutorial beat ${beat.id} in ${this.plan.classRoot}`);
    }
    this.beats.push(beat);
  }

  runes(chapter: string, id: string, say: string, stage: TutorialRuneStage, teaches?: TutorialConceptId[]): void {
    this.push(teaching({
      id,
      chapter,
      say,
      steps: [{ type: 'configureRunes', rules: tutorialRunes(this.plan.movement, stage, this.plan.classRoot) }],
    }, teaches));
  }

  /**
   * `atLevel` holds the craft back to a later level of the recipe's zone (the
   * first-hour checklist's pacing); the farm then waits for both.
   */
  piece(chapter: string, recipeId: string, wear: boolean, intro?: LegIntro, atLevel?: number): void {
    const recipe = RECIPE_DATABASE.get(recipeId);
    if (!recipe) throw new Error(`unknown recipe ${recipeId}`);
    const itemName = name(recipeId);
    const level = Math.max(recipe.requiredBiomeLevel, atLevel ?? 0);
    const craftable: TutorialCondition = level > recipe.requiredBiomeLevel
      ? {
        type: 'allOf',
        of: [{ type: 'canCraft', recipeId }, { type: 'biomeLevelAtLeast', biomeGroup: recipe.recipeGroup, level }],
      }
      : { type: 'canCraft', recipeId };
    this.push(teaching({
      id: `farm:${recipeId}`,
      chapter,
      say: intro?.say ?? `Next up: the ${itemName}.`,
      waiting: `Fighting in ${BIOME_NAME[recipe.recipeGroup as T1Biome] ?? recipe.recipeGroup} until the ${itemName} is ready.`,
      progress: costProgress(recipe.cost, recipe.recipeGroup, level),
      steps: [{
        type: 'farm',
        at: biomeRef(recipe.recipeGroup),
        until: {
          type: 'anyOf',
          of: [{ type: 'hasItem', definitionId: recipeId }, craftable],
        },
      }],
    }, intro?.say ? intro.teaches : undefined));
    const steps: TutorialStep[] = [{ type: 'craft', recipeIds: [recipeId] }];
    if (wear) steps.push({ type: 'equip', definitionIds: [recipeId] });
    this.push(teaching({
      id: `craft:${recipeId}`,
      chapter,
      say: wear
        ? ITEM_REASON[recipeId] ?? `Craft the ${itemName} and wear it.`
        : CRAFT_REASON[recipeId] ?? `Craft the ${itemName} for later.`,
      steps,
    }, ITEM_TEACHES[recipeId]));
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
    this.push(teaching({
      id: `learn:${recipeId}`,
      chapter,
      say: LEARN_REASON[recipe.abilityId] ?? `Learn ${abilityName}.`,
      steps: [{ type: 'learnAbility', recipeId, abilityId: recipe.abilityId, slot }],
    }, LEARN_TEACHES[recipe.abilityId]));
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
    this.push(teaching(
      { id: `rune:${recipeId}`, chapter, say: lines.craft, steps: [{ type: 'craftRune', recipeId }] },
      RUNE_TEACHES[recipeId],
    ));
    this.runes(chapter, `runes:${recipeId}`, lines.equip, stage);
  }

  maxOut(chapter: string, biome: T1Biome): void {
    this.push(teaching({
      id: `max:${biome}`,
      chapter,
      say: biome === 'plains'
        ? 'Now master the Plains. Every zone you master opens stronger gear to craft.'
        : `Now master ${BIOME_NAME[biome]}.`,
      waiting: `Fighting in ${BIOME_NAME[biome]} until its mastery is maxed.`,
      progress: [{ type: 'biomeLevel', biomeGroup: biome, level: 6 }],
      steps: [{ type: 'farm', at: biomeRef(biome), until: { type: 'biomeLevelAtLeast', biomeGroup: biome, level: 6 } }],
      // The first line that says what mastery is for, and a max beat is never
      // skipped (the Clearing's own mastery lines ride on farms that often are).
    }, biome === 'plains' ? ['mastery'] : undefined));
  }

  items(chapter: string, leg: T1Biome, items: readonly PlanItem[] | undefined, intro?: LegIntro): void {
    const consume = () => {
      if (!intro) return;
      intro.say = undefined;
      intro.teaches = [];
    };
    for (const item of items ?? []) {
      if ('piece' in item) {
        this.piece(chapter, item.piece, true, intro, item.atLevel);
        consume();
      } else if ('craft' in item) {
        this.piece(chapter, item.craft, false, intro);
        consume();
      } else if ('equip' in item) {
        const single = item.equip.length === 1 ? item.equip[0] : null;
        this.equip(
          chapter,
          item.equip,
          single ? EQUIP_REASON[single] ?? `Wear the ${name(single)}.` : 'Put on the best of what you have before going in.',
          `equip:${leg}:${item.equip.join('+')}`,
        );
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

  /** One of this class's two weapon-page cards, resolved, and the territory that pays its shard. */
  private weaponCard(cardId: string): {
    lineage: LineageDefinition;
    card: LineageCard;
    resolved: ResolvedLineageCard;
    territory: string;
  } {
    const lineage = LINEAGE_DATABASE.get(TUTORIAL_TREE.lineageId);
    if (!lineage) throw new Error(`unknown lineage ${TUTORIAL_TREE.lineageId}`);
    const card = lineage.cards.find((c) => c.id === cardId);
    if (!card) throw new Error(`${this.plan.className}: unknown ${lineage.id} card ${cardId}`);
    const resolved = resolveLineageCard(card, lineage);
    // Where it drops, read off the node rule rather than hand-written (design
    // §24.3): every kill in a node pays its dominant family's shard, so the line
    // names that family's territory — the word the map and the arrival banner use.
    const territory = nodesPayingShard(lineage.homeBiome, 1, card.lane)
      .map((id) => nodeFamily(id)?.name)
      .find((familyName): familyName is string => !!familyName);
    if (!territory) throw new Error(`no T1 ${lineage.homeBiome} node pays the ${card.lane} shard ${card.id} costs`);
    return { lineage, card, resolved, territory };
  }

  /**
   * One weapon-page purchase as two beats, like every paid action: the shards
   * that pay for it, farmed in the territory that pays them, then the buy.
   *
   * The farm beat is skipped automatically when the wallet already covers it, so
   * the buy beat's own line stands on its own. The buy is followed by a
   * `setActive` for the same card: the server activates a purchase only into an
   * EMPTY row, and a player who opted in mid-Tier-1 may have filled it by hand
   * (the weapon page sends the same intent after a buy).
   */
  private cardBeats(
    chapter: string,
    cardId: string,
    lines: { farm: (shard: string, territory: string) => string; buy: string },
    teaches: { farm: TutorialConceptId[]; buy: TutorialConceptId[] },
    lesson?: TutorialLesson,
  ): void {
    const { lineage, card, resolved, territory } = this.weaponCard(cardId);
    const owned: TutorialCondition = { type: 'lineageCardOwned', lineageId: lineage.id, cardId: card.id };
    const shard = shardName(card.lane);
    this.push(teaching({
      id: `shards:${card.id}`,
      chapter,
      say: lines.farm(shard, territory),
      waiting: `Fighting in ${territory} territory for ${shard}s.`,
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
    }, teaches.farm));
    this.push(teaching({
      id: `card:${card.id}`,
      chapter,
      say: lines.buy,
      steps: [
        { type: 'unlockCard', lineageId: lineage.id, cardId: card.id },
        { type: 'setActive', lineageId: lineage.id, row: card.row, cardId: card.id },
      ],
      ...(lesson ? { lesson } : {}),
    }, teaches.buy));
  }

  /** Row 1, the lean: at its own Forest level, with the Rapier in hand. */
  leanLesson(chapter: string): void {
    const { lineage, card, resolved } = this.weaponCard(this.plan.weaponCards.lean);
    if (card.row !== 'stat' || card.tier !== 1) throw new Error(`${this.plan.className}: ${card.id} is not a tier-1 lean`);
    const weapon = name(lineage.forms[0].recipeId);
    const stat = statLine(resolved.statEffects, 'short')?.replace(/\.$/, '');
    if (!stat) throw new Error(`${this.plan.className}: ${card.id} resolves to no stat`);
    this.cardBeats(chapter, card.id, {
      farm: (shard, territory) => `The ${weapon} has a page of its own, and its first card is paid in ${shard}s. Every kill in ${territory} territory pays them; the map names each node's territory.`,
      buy: `Open the ${weapon}'s page and buy ${card.name}. Row one is the lean, a stat while the ${weapon} is worn (${stat}); one lean is active at a time.`,
    }, { farm: ['weapon-page', 'shards'], buy: ['lean'] });
  }

  /**
   * Row 2, the verb: the first moment both its gates are open, with the Rapier
   * still in hand. The lesson is the sentence the lean just wrote, then the ring
   * that counts toward it (design §24.2, §24.6).
   */
  verbLesson(chapter: string, masteredZones: number): void {
    const lean = this.weaponCard(this.plan.weaponCards.lean).card;
    const { lineage, card } = this.weaponCard(this.plan.weaponCards.verb);
    if (!isVerbCard(card) || card.tier !== 1) throw new Error(`${this.plan.className}: ${card.id} is not a tier-1 verb`);
    const composed = verbSentence(card.lane, lean.lane);
    if (!composed) throw new Error(`${this.plan.className}: ${card.id} has no sentence with ${lean.id}`);
    const weapon = name(lineage.forms[0].recipeId);
    const zones = COUNT_WORDS[masteredZones] ?? String(masteredZones);
    const home = BIOME_NAME[lineage.homeBiome as T1Biome] ?? lineage.homeBiome;
    this.cardBeats(chapter, card.id, {
      farm: (shard, territory) => `${zones} zones mastered opens row two of the ${weapon}'s page: the verb, what the weapon does. ${card.name} costs ${shard}s from ${home}'s ${territory} territory.`,
      buy: `Buy ${card.name}. A verb is a moment in the fight, and your lean decides what happens at that moment.`,
      // The verb's idea rides on the BUY line: max-ing the Forest often pays for
      // the verb already, and then its farm beat is skipped and never shown.
    }, { farm: [], buy: ['verb', 'rhythm-ring'] }, {
      lineageId: lineage.id,
      cardId: card.id,
      read: `Look at what ${card.name} says now: “${composed}” Your lean, ${lean.name}, chose that.`,
      ring: `In a fight, ${card.name}'s ring by your health bar ${ringPhrase(card)}.`,
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
      // Usually skipped: Tier 2 arrives with the essence and shards in hand (the
      // 1x sweep, all six classes), so the capstone line opens the chapter.
      say: `Tier 2 opens the ${name(form.recipeId)}: its gate wants ${zone} essence and ${shards} first.`,
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
      say: `Tier 1 is done, and this part is optional: the ${name(form.recipeId)}'s gate also wants ${cost.capstone.amount} ${capstone} drops, and only the ${zone} boss has them.`,
      waiting: `Fighting the ${zone} boss for ${capstone} drops.`,
      progress: [{ type: 'capstone', biome: form.biome, amount: cost.capstone.amount }],
      teaches: ['capstone'],
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
      teaches: ['gate'],
      steps: [
        // Every melee plan swapped to the seal weapon for the bosses, and the
        // director opens the page BY SLOT, so without this the guide pointed at
        // the Axe's page while talking about the Rapier's gate (review P9).
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
      this.push(teaching({
        id: `boss-prep:${biome}`,
        chapter,
        say: index === 0 ? SEAL_OPENING[biome] : SEAL_SECOND[biome],
        steps: [
          { type: 'equip', definitionIds: [...bossKit, loadout.armor] },
          { type: 'setAbilities', techniques: [loadout.technique], guards: [loadout.guard] },
        ],
      }, index === 0 ? ['seals'] : undefined));
      this.push(teaching({
        id: `boss:${biome}`,
        chapter,
        say: index === 0
          ? 'Clear the guards, wake the boss at the altar, and take the seal. Falling is normal; we just try again.'
          : 'The last seal before Tier 2.',
        waiting: `Fighting for the ${ZONE_WORD[biome]} seal.`,
        steps: [{ type: 'attemptBoss', biomeGroup: biome, tier: 1 }],
      }, index === 0 ? ['boss-altar'] : undefined));
    });
  }

  build(): TutorialBeat[] {
    this.runes(
      'The Clearing',
      'runes:opening',
      'These Runes are your standing orders: rest up between fights and back off when badly hurt.',
      'opening',
      ['runes'],
    );
    const home = this.weaponCard(this.plan.weaponCards.lean).lineage.homeBiome;
    const lean = this.weaponCard(this.plan.weaponCards.lean).resolved;
    const verb = this.weaponCard(this.plan.weaponCards.verb).resolved;
    // Global Mastery is the sum of the T1 zones' levels, and every leg masters its
    // zone before the next one starts, so the mastery at any leg's end is known.
    const mastered: T1Biome[] = [];
    const masteryOf = (zones: readonly T1Biome[]) => zones.reduce((sum, zone) => sum + biomeLevelCap(1, zone), 0);
    let verbTaught = false;
    for (const biome of T1_BIOME_ORDER) {
      const chapter = CHAPTER[biome];
      const biomePlan = this.plan.biomes[biome];
      const intro: LegIntro = { say: BIOME_INTRO[biome], teaches: [...(BIOME_INTRO_TEACHES[biome] ?? [])] };
      this.items(chapter, biome, biomePlan.before, intro);
      // Row 1, taught where the weapon is earned: the Flash Rapier is worn by
      // now, and holding the base form is what opens its page.
      if (biome === home) {
        if (masteryOf(mastered) < lean.requiredGlobalMastery) {
          throw new Error(`${this.plan.className}: the lean needs Global Mastery ${lean.requiredGlobalMastery} before the ${biome} leg`);
        }
        this.leanLesson(chapter);
      }
      if (intro.say) {
        // No gear to open the leg with (e.g. Mountain for some classes): the
        // intro rides on the leg's first learning beat instead.
        const before = this.beats.length;
        this.shared(chapter, biome);
        if (this.beats[before]) {
          this.beats[before] = teaching({ ...this.beats[before], say: `${intro.say} ${this.beats[before].say}` }, intro.teaches);
        }
        intro.say = undefined;
        intro.teaches = [];
      } else {
        this.shared(chapter, biome);
      }
      this.items(chapter, biome, biomePlan.after);
      this.maxOut(chapter, biome);
      mastered.push(biome);
      // Row 2 the moment both of its gates are open: its level in the home zone
      // AND the band's Global Mastery (design §4), which at T1 is three mastered
      // zones — so the verb lands at the end of the Swamp leg, not at Forest 4.
      // The Rapier is still worn there, so the lesson is live (design §23).
      if (!verbTaught
        && mastered.includes(home as T1Biome)
        && biomeLevelCap(1, home) >= verb.requiredBiomeLevel
        && masteryOf(mastered) >= verb.requiredGlobalMastery) {
        this.verbLesson(chapter, mastered.length);
        verbTaught = true;
      }
      // The bot learns it at Cave 3, but with Step Back and two abilities the
      // build only fits the Rune budget of a fully mastered Tier 1 (GM 30).
      if (biome === 'cave') this.learn(chapter, 'ability-recipe-expose-weakness', 'technique');
      this.items(chapter, biome, biomePlan.afterMax);
    }
    if (!verbTaught) throw new Error(`${this.plan.className}: the verb's gates never open inside Tier 1`);
    this.bosses();
    this.gate();
    return this.beats;
  }
}

/** The class-specific beats that follow the shared opening. */
export function buildClassBeats(plan: TutorialClassPlan): TutorialBeat[] {
  return new ScriptBuilder(plan).build();
}
