import { ABILITY_DATABASE } from '../../abilities';
import { ABILITY_RECIPE_DATABASE } from '../../abilityRecipes';
import { RECIPE_DATABASE } from '../../data/recipes';
import { ITEM_DATABASE } from '../../itemDatabase';
import type { EssenceType } from '../../items';
import { RUNE_RECIPE_DATABASE } from '../../runeRecipes';
import { upgradeCatalystCostFor } from '../../systems/itemUpgrades';
import { NODE_BIOMES } from '../../world/nodeBiomes';
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
  'chaotic-axe': 'The Chaotic Axe hits hardest of anything here but whiffs now and then. Once upgraded, it is worth it.',
  'ashbrand-blade': 'The Poison Dagger poisons what it hits. It becomes your main weapon once it is upgraded.',
};

const EQUIP_REASON: Record<string, string> = {
  'chaotic-axe': 'The axe is upgraded enough now. Switch to it.',
  'ashbrand-blade': 'The Poison Dagger is ready. Switch to it.',
};

const LEARN_REASON: Record<string, string> = {
  sweep: 'Learn Sweep: every so often your swing cleaves everything around you.',
  'second-wind': 'Learn Second Wind: a burst of healing in the middle of a fight.',
  cleanse: 'Learn Cleanse. Here it takes Second Wind\'s place, because poison is the real threat.',
  'expose-weakness': 'Learn Expose Weakness. It replaces Sweep and marks your target to take more damage from everything.',
};

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

function biomeRef(biome: string, modifier?: string): TutorialNodeRef {
  return { kind: 'biome', biomeGroup: biome, tier: 1, pick: 'uncleared', ...(modifier ? { modifier } : {}) };
}

function biomeHasModifier(biome: string, family: string): boolean {
  return Object.values(NODE_BIOMES).some((info) =>
    info.biomeGroup === biome && info.biomeTier === 1 && info.kind === 'normal' && info.modifier === family);
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
    const catalysts = Object.entries(recipe.catalystCost ?? {}).filter(([, amount]) => (amount ?? 0) > 0);
    this.push({
      id: `farm:${recipeId}`,
      chapter,
      say: sayFarm ?? `Next up: the ${itemName}.`,
      waiting: `Fighting in ${BIOME_NAME[recipe.recipeGroup as T1Biome] ?? recipe.recipeGroup} until the ${itemName} is ready.`,
      progress: [
        ...costProgress(recipe.cost, recipe.recipeGroup, recipe.requiredBiomeLevel),
        ...catalysts.map(([family, amount]): TutorialProgressRef => ({ type: 'catalyst', family, amount: amount ?? 0 })),
      ],
      steps: [{
        type: 'farm',
        at: biomeRef(recipe.recipeGroup, catalysts[0]?.[0]),
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
      const catalystNeed = new Map<string, number>();
      for (const target of items) {
        const item = ITEM_DATABASE.get(target.definitionId)!;
        for (let plus = (this.plannedPlus.get(target.definitionId) ?? 0) + 1; plus <= target.toPlus; plus += 1) {
          for (const [family, amount] of Object.entries(upgradeCatalystCostFor(item, plus) ?? {})) {
            catalystNeed.set(family, (catalystNeed.get(family) ?? 0) + (amount ?? 0));
          }
        }
      }
      const family = [...catalystNeed.keys()][0];
      const done: TutorialCondition = {
        type: 'allOf',
        of: items.map((t): TutorialCondition => ({ type: 'itemAtLeastPlus', definitionId: t.definitionId, plus: t.toPlus })),
      };
      const key = `${leg}:${this.upgradeSets}:${biome}`;
      const zone = BIOME_NAME[biome as T1Biome] ?? biome;

      // A zone with no node of the needed modifier gets its catalysts elsewhere first.
      if (family && !biomeHasModifier(biome, family)) {
        const source = T1_BIOME_ORDER.find((b) => biomeHasModifier(b, family));
        if (!source) throw new Error(`no T1 node mints ${family}`);
        const amount = catalystNeed.get(family)!;
        this.push({
          id: `catalysts:${key}`,
          chapter,
          say: 'These upgrades also need catalysts, which drop in specially marked zones.',
          waiting: `Fighting in a marked part of ${BIOME_NAME[source]} for catalysts.`,
          progress: [{ type: 'catalyst', family, amount }],
          steps: [{
            type: 'farm',
            at: biomeRef(source, family),
            until: { type: 'anyOf', of: [done, { type: 'catalystAtLeast', family, amount }] },
          }],
        });
      }

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
          at: biomeRef(biome, family && biomeHasModifier(biome, family) ? family : undefined),
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
    return this.beats;
  }
}

/** The class-specific beats that follow the shared opening. */
export function buildClassBeats(plan: TutorialClassPlan): TutorialBeat[] {
  return new ScriptBuilder(plan).build();
}
