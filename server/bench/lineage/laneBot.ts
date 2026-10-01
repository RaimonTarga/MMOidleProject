/**
 * The lane/frame reference BOT — shared by every lineage bench.
 *
 * Extracted from `lineageLaneMatrix.ts` (run 4) because the family-contract
 * instrument needs the identical character: if the two benches prepared their
 * bots even slightly differently, their numbers could not be read together, and
 * the contract instrument exists precisely to arbitrate what the matrix cannot
 * resolve. One definition, two callers.
 *
 * What a reference bot is: the character a lane reference profile describes
 * (`bot/src/tierEntry/profiles.ts`) — a class root, one tier-1 frame, no branch,
 * the lineage's own form for its band, and the band bought through the REAL
 * economy handler so a mastery, prerequisite or wallet refusal is reported as a
 * refusal instead of being silently faked.
 *
 * Band 1 is a Tier-1 character (`playerTier` 2 — a frame costs the point the
 * second tier mints — Tier-1 gear, Tier-1 mastery, the Tier-1 band). Band 2 is
 * the character the Tier-2 gate hands over (`playerTier` 3, Tier-2 gear, the
 * Tier-2 band on top of the Tier-1 one it bought on the way).
 *
 * Deliberately NOT `prepareSurveyBot`: that helper asserts a tier-1 cell has no
 * frame, which is exactly the build design §9's reference asks for, so reusing it
 * would mean loosening an assertion that is right for every other bench.
 */
import assert from 'node:assert/strict';
import {
  ESSENCE_TYPES,
  LINEAGE_DATABASE,
  NODE_BIOMES,
  RUNE_RECIPE_DATABASE,
  composePlayerView,
  isRuneRecipeUnlocked,
  withReferenceAbilityWiring,
  type AttunedAbilities,
  type EquippedRule,
  type TierEntryProfile,
} from '@mmo-idle/shared';
import type {
  BandTier,
  LineageFrameReference,
  LineageLaneReference,
} from '../../../bot/src/tierEntry/profiles';
import { validateBuild } from '../../../bot/src/loadout/loadout';
import { BOT_SPAWN } from '../balance/arena';
import { BENCH_BOT_ID, materializeBot } from '../balance/botFactory';
import type { BuildSpec, GearSlot } from '../balance/types';
import { recalculatePlayerEntityStats } from '../../src/ecs/playerEntityFormulas';
import { syncArchetypeSlices } from '../../src/ecs/archetypeSliceSync';
import { refillBarrier } from '../../src/systems/defense/barrier/barrier';
import { setAbilityLoadout } from '../../src/systems/player/economy/abilityCrafting';
import { setLineageActive, unlockLineageCard } from '../../src/systems/player/economy/lineages';
import { syncLineagesFromInventory } from '../../src/systems/player/economy/lineageSync';
import type { PlayerEntity } from '../../src/ecs/entity';
import type { World } from '../../src/world/World';

/**
 * Wallet credited before the cards are bought. Generous on purpose: these benches
 * measure COMBAT, and a lane that could not afford its own band would be measuring
 * the economy instead. Every purchase still goes through the real handler, so a
 * mastery or prerequisite refusal is still a refusal.
 */
export const BENCH_ESSENCE = 5_000;
export const BENCH_SHARDS = 200;

export interface PreparedBot {
  bot: PlayerEntity;
  /** Purchases the real handler turned down. A non-empty list invalidates the row. */
  refusals: string[];
  /** True when the lane's shard has no T1 source and the harness had to grant it. */
  grantedShards: boolean;
}

/** `playerTier` and `gearTier` the bench builds a band at. */
function tiersFor(bandTier: BandTier): { playerTier: number; gearTier: number } {
  return bandTier === 1 ? { playerTier: 2, gearTier: 1 } : { playerTier: 3, gearTier: 2 };
}

export function prepareLaneBot(
  world: World,
  profile: TierEntryProfile,
  /** Null for a frame reference: same preparation, no lineage band to buy. */
  reference: LineageLaneReference | null,
  nodeId: string,
  /** The frame reference, when this is a frames-column row. Carries the band. */
  frame: LineageFrameReference | null = null,
): PreparedBot {
  const bandTier: BandTier = reference?.bandTier ?? frame?.bandTier ?? 1;
  const { playerTier, gearTier } = tiersFor(bandTier);
  const biome = NODE_BIOMES[nodeId].biomeGroup;
  const gearItemIds: Partial<Record<GearSlot, string>> = {};
  for (const [slot, itemId] of Object.entries(profile.equipment)) {
    if (itemId) gearItemIds[slot as GearSlot] = itemId;
  }
  const build: BuildSpec = {
    id: profile.id,
    classRoot: profile.classRoot,
    skillPath: [profile.classRoot, profile.frameId!],
    // The CONTENT tier is the band's, not the node's: it is what the bot's own
    // gear and mastery are, and a node of another tier is the question being
    // asked rather than a property of the character.
    contentTier: bandTier,
    playerTier,
    gearTier,
    gearItemIds,
  };
  const bot = materializeBot(
    world,
    build,
    { nodeId, biomeGroup: biome, contentTier: bandTier, isDungeon: false },
    BOT_SPAWN,
    BENCH_BOT_ID,
  );

  // The base form is what opened the tree and, at band 2, the form the gate was
  // paid FROM — so the character still owns it. Without this the live bot's
  // `ownedForms` would hold only the worn form and diverge from the manifest.
  if (reference && reference.baseForm !== reference.wornForm) {
    if (!bot.holdsInventory.inventory.includes(reference.baseForm)) {
      bot.holdsInventory.inventory.push(reference.baseForm);
    }
    syncLineagesFromInventory(world, bot);
  }

  // The profile's own +N per item, not one bench-wide level: the reference
  // carries its worn form at +0 so a lane's card is never competing with an
  // upgrade ladder Phase 2 deletes for weapons anyway.
  for (const itemId of Object.keys(bot.holdsInventory.itemUpgrades)) {
    bot.holdsInventory.itemUpgrades[itemId] = profile.itemUpgrades[itemId] ?? 0;
  }

  const p = bot.tracksProgression;
  p.skillPoints = 0;
  p.equippedRites = [];
  p.attunedStances = [];
  p.equippedStances = { default: null };
  p.activeStance = null;
  p.attunedAbilities = { techniques: [], guards: [] };

  // The Tier-1 survey package: one technique, Second Wind, and the five-rule
  // behaviour policy with reference ability wiring. Ranged roots orbit.
  //
  // Held FIXED across both bands on purpose. A band-2 character has more runic
  // points and could run a wider loadout, but then a band-1/band-2 pair would
  // differ in the band AND the package, and neither reading would be about the
  // band. This is a documented bench choice, not a claim about T2 play.
  const melee = profile.classRoot === 'cadence-root' || profile.classRoot === 'cooldown-root';
  const abilities: AttunedAbilities = { techniques: ['sweep'], guards: ['second-wind'] };
  const rules: EquippedRule[] = withReferenceAbilityWiring([
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    ...(melee ? [] : [{ conditionId: 'in-combat', actionId: 'orbit' }]),
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ], abilities);
  for (const recipe of RUNE_RECIPE_DATABASE.values()) {
    if (recipe.deprecated || !recipe.runeId) continue;
    if (p.runesOwned.includes(recipe.runeId)) continue;
    if (!rules.some((rule) => rule.actionId === recipe.runeId)) continue;
    assert(isRuneRecipeUnlocked(recipe, p), `${profile.id}: unreachable rune ${recipe.id}`);
    p.runesOwned.push(recipe.runeId);
  }
  p.runesEquipped = rules;
  assert(setAbilityLoadout(world, bot, abilities).success, `${profile.id}: illegal ability budget`);

  // Buy the band through the real economy handler, so a refusal is a finding.
  for (const type of ESSENCE_TYPES) p.essences[type] = BENCH_ESSENCE;
  const lane = reference?.lane ?? null;
  const grantedShards = reference?.shardsUnobtainableAtT1 ?? false;
  if (lane) p.shards[lane] = BENCH_SHARDS;
  const refusals: string[] = [];
  if (reference) {
    const lineage = LINEAGE_DATABASE.get(reference.lineageId)!;
    for (const cardId of reference.cardIds) {
      const bought = unlockLineageCard(world, bot, reference.lineageId, cardId);
      if (!bought.success) refusals.push(`unlockCard ${cardId}: ${bought.reason}`);
    }
    // Slot the declared set EXPLICITLY, after every purchase. An unlock into an
    // empty row activates on its own, but a band-2 reference buys five cards into
    // three rows: its T1 payoff lands first and then the T2 payoff finds the row
    // occupied, so the auto-activation alone would leave the T1 card running.
    for (const cardId of reference.activeCardIds) {
      const card = lineage.cards.find((c) => c.id === cardId)!;
      const activated = setLineageActive(world, bot, reference.lineageId, card.row, cardId);
      if (!activated.success) refusals.push(`setActive ${cardId}: ${activated.reason}`);
    }
  }
  // Zero the credited wallet again: a reference build does not walk into a node
  // holding five thousand of every essence, and nothing in combat reads it.
  for (const type of ESSENCE_TYPES) p.essences[type] = 0;

  recalculatePlayerEntityStats(world, bot);
  syncArchetypeSlices(world, bot);
  bot.hasHealth.hp = bot.hasHealth.maxHp;
  refillBarrier(world, bot);

  const view = composePlayerView(bot)!;
  assert.deepEqual(
    validateBuild({ abilities, runeRules: rules, stances: { attuned: [], default: null }, rites: [] }, view),
    [],
    profile.id,
  );
  if (reference) {
    const tree = view.lineages[reference.lineageId];
    assert(tree, `${profile.id}: the worn form opened no tree`);
    assert(tree.wornForm === reference.wornForm,
      `${profile.id}: worn form is ${tree.wornForm}, expected ${reference.wornForm}`);
    // Every declared card is SLOTTED, or the row measures the control twice.
    for (const cardId of reference.activeCardIds) {
      const card = LINEAGE_DATABASE.get(reference.lineageId)!.cards.find((c) => c.id === cardId)!;
      assert(tree.active[card.row] === cardId,
        `${profile.id}: ${cardId} is not the live ${card.row} card (${tree.active[card.row]})`);
    }
  } else {
    // A frame reference buys nothing, so the only claim to check is that it is
    // still carrying the weapon the whole root shares.
    assert(bot.holdsInventory.equipment.weapon === profile.equipment.weapon,
      `${profile.id}: wears the root's reference weapon`);
  }
  return { bot, refusals, grantedShards };
}
