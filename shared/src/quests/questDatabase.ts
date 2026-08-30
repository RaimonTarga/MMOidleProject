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
 *
 * Data-integrity pass 2026-08-30: 14 IDs across tier-2/3/4 named monsters that no longer
 * exist in MONSTER_DATABASE — fossils of pre-retirement/pre-rework rosters. Every list is
 * now exactly its tier's live `bossPoolByTier` union, which is what this comment always
 * claimed. Guarded by `server/test/questMonsterIds.test.ts`. Only the target lists moved:
 * names, descriptions, `killsRequired` and `tierRequired` are untouched, and no quest
 * ADVANCEMENT logic changed (tier advancement gates on boss seals, not these counters —
 * they now only drive auto-combat target priority and HUD unlock gating).
 */
export const QUEST_DATABASE = new Map<string, QuestDefinition>([
  ['tier-0', {
    id: 'tier-0',
    name: 'First Blood',
    description: 'Prove yourself in the Clearing by slaying 10 Tiny Wisps.',
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
      'gnarled-greatbear', 'crag-behemoth', 'tusked-razorback',
      'grave-toadeater', 'obsidian-broodmother',
    ],
    killsRequired: 1,
  }],
  ['tier-2', {
    id: 'tier-2',
    name: 'Zone Conqueror',
    description: 'Conquer a Tier 2 dungeon by defeating its mighty guardian.',
    tierRequired: 2,
    // All T2 dungeon bosses — one per biome at biomeTier 2 (7). Dropped the dead
    // `glacial-colossus` (Tundra has no T2 content at all — it debuts at T3).
    targetMonsterTypes: [
      'apex-timberclaw', 'stoneplate-juggernaut', 'gorging-razortusk', 'mire-gorged-behemoth',
      'chitinous-dreadbore', 'jungle-dread-gorger', 'dune-stalker-emperor',
    ],
    killsRequired: 1,
  }],
  ['tier-3', {
    id: 'tier-3',
    name: "Veteran's Trial",
    description: 'Prove your might against an elite Tier 3 dungeon lord.',
    tierRequired: 3,
    // All T3 dungeon bosses — one per biome at biomeTier 3 (7). Dropped three dead IDs:
    // `elder-gnarled-greatbear` and `plains-warlord` are fossils of the pre-retirement
    // roster (Forest and Plains have no T3 content), and `lich-king` never existed.
    targetMonsterTypes: [
      'crag-gorged-horn-behemoth', 'rot-spore-croc-behemoth', 'deep-core-burrow-gorger',
      'apex-bramble-slasher', 'frost-plated-rime-mammoth', 'dune-carapace-monarch',
      'cinder-shell-magma-salamander',
    ],
    killsRequired: 1,
  }],
  ['tier-4', {
    id: 'tier-4',
    name: 'Final Reckoning',
    description: 'Face the most fearsome dungeon lords of Tier 4 and emerge victorious.',
    tierRequired: 4,
    // All T4 dungeon bosses — one per biome at biomeTier 4 (7). Ten of the eleven old IDs
    // were dead placeholder names from before the boss-encounter rework; `cave-titan` and
    // `swamp-sovereign` were doubly wrong (Cave and Swamp retire after T3).
    targetMonsterTypes: [
      'iron-crest-titan', 'verdant-crown-predator', 'glacial-patriarch', 'dune-throne-sovereign',
      'caldera-sovereign', 'charnel-crown-sovereign', 'elder-trench-serpent',
    ],
    killsRequired: 1,
  }],
]);
