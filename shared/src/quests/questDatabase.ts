// ─── Quest system ─────────────────────────────────────────────────────────────

/**
 * A quest that requires the player to kill a set number of specific monsters.
 * Completing the quest advances the player's tier by 1 and grants 1 skill point.
 */
export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  /**
   * The player tier at which this quest is active.
   * Completing it advances the player to tierRequired + 1.
   */
  tierRequired: number;
  /** Monster type IDs (keys in MONSTER_DATABASE) that count toward this quest. */
  targetMonsterTypes: string[];
  /** Total kills required to complete the quest. */
  killsRequired: number;
}

/**
 * All tier-advancement quests — one per tier.
 * Each quest requires slaying any ONE of the dungeon bosses found at that tier.
 * Boss list matches bossPoolByTier entries in biomeDatabase for that biomeTier.
 */
export const QUEST_DATABASE = new Map<string, QuestDefinition>([
  ['tier-0', {
    id: 'tier-0',
    name: 'First Blood',
    description: 'Prove yourself in the Clearing by slaying 10 Tiny Slimes.',
    tierRequired: 0,
    targetMonsterTypes: ['tiny-slime'],
    killsRequired: 10,
  }],
  ['tier-1', {
    id: 'tier-1',
    name: 'Dungeon Delver',
    description: 'Seek out a Tier 1 dungeon and slay its guardian boss.',
    tierRequired: 1,
    // All T1 dungeon bosses — one per biome at biomeTier 1 (5 biomes)
    targetMonsterTypes: [
      'forest-warden', 'mountain-sentinel', 'plains-champion',
      'bog-sovereign', 'cave-sentinel',
    ],
    killsRequired: 1,
  }],
  ['tier-2', {
    id: 'tier-2',
    name: 'Zone Conqueror',
    description: 'Conquer a Tier 2 dungeon by defeating its mighty guardian.',
    tierRequired: 2,
    // All T2 dungeon bosses — one per biome at biomeTier 2
    targetMonsterTypes: [
      'glacial-colossus', 'stone-warden', 'forest-elder', 'plains-tyrant',
      'desert-pharaoh', 'jungle-colossus', 'cave-terror', 'mire-lord',
    ],
    killsRequired: 1,
  }],
  ['tier-3', {
    id: 'tier-3',
    name: "Veteran's Trial",
    description: 'Prove your might against an elite Tier 3 dungeon lord.',
    tierRequired: 3,
    // All T3 dungeon bosses — one per biome at biomeTier 3
    targetMonsterTypes: [
      'frost-colossus', 'peak-titan', 'elder-forest-warden', 'plains-warlord',
      'sand-emperor', 'jungle-titan-lord', 'volcanic-titan', 'lich-king',
      'cave-dread', 'bog-ancient',
    ],
    killsRequired: 1,
  }],
  ['tier-4', {
    id: 'tier-4',
    name: 'Final Reckoning',
    description: 'Face the most fearsome dungeon lords of Tier 4 and emerge victorious.',
    tierRequired: 4,
    // All T4 dungeon bosses — one per biome at biomeTier 4
    targetMonsterTypes: [
      'glacial-titan', 'mountain-titan', 'elder-treant-lord', 'stampede-emperor',
      'desert-eternal', 'jungle-ancient-lord', 'inferno-lord', 'undying-lord',
      'void-titan', 'cave-titan', 'swamp-sovereign',
    ],
    killsRequired: 1,
  }],
]);
