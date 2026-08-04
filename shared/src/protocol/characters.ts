import type {
  HasPosition,
  IsPlayer,
  TracksProgression,
  UsesSkills,
} from '../components';
import { globalMastery } from '../config/gameConfig';
import { SKILL_TREE } from '../data/skillTree';

export interface CharacterSummary {
  id: string;
  name: string;
  globalMastery: number;
  playerTier: number;
  combatArchetype: UsesSkills['combatArchetype'];
  selectedClass: UsesSkills['selectedClass'];
  classDisplayName: string;
  unlockedSkills: string[];
  nodeId: string;
  lastPlayedAt: number;
}

export interface AccountSummary {
  displayName: string;
  isGuest: boolean;
}

export interface AccountCharactersPayload {
  account: AccountSummary;
  characters: CharacterSummary[];
}

export type CharacterSummarySlices = {
  isPlayer: IsPlayer;
  hasPosition: HasPosition;
  tracksProgression: TracksProgression;
  usesSkills: UsesSkills;
};

export type CharacterNameValidation =
  | { ok: true; name: string }
  | { ok: false; reason: string };

const CHARACTER_NAME_MIN_LENGTH = 2;
const CHARACTER_NAME_MAX_LENGTH = 24;
const CHARACTER_NAME_PATTERN = /^[\p{L}\p{N} '-]+$/u;
const CHARACTER_NAME_ALPHANUMERIC_PATTERN = /[\p{L}\p{N}]/u;

const GUEST_NAME_ADJECTIVES = [
  'Ancient',
  'Brave',
  'Fleeting',
  'Gentle',
  'Hollow',
  'Luminous',
  'Radiant',
  'Restless',
  'Silent',
  'Stalwart',
  'Wandering',
] as const;

const GUEST_NAME_SOULS = [
  'Apparition',
  'Essence',
  'Phantom',
  'Shade',
  'Soul',
  'Spirit',
  'Wraith',
] as const;

/** Generate an adjective + soul-synonym name suitable for a first-run guest. */
export function generateGuestName(random: () => number = Math.random): string {
  const adjective = GUEST_NAME_ADJECTIVES[
    Math.floor(random() * GUEST_NAME_ADJECTIVES.length) % GUEST_NAME_ADJECTIVES.length
  ];
  const soul = GUEST_NAME_SOULS[
    Math.floor(random() * GUEST_NAME_SOULS.length) % GUEST_NAME_SOULS.length
  ];
  return `${adjective} ${soul}`;
}

/**
 * Resolve the latest authored class identity in a character's unlocked path.
 * Tiers after 3 are progression perks, not new class names.
 */
export function resolveCharacterClassName(
  unlockedSkills: readonly string[],
  selectedClass: UsesSkills['selectedClass'],
): string {
  let latestNamedNode = selectedClass ? SKILL_TREE.get(selectedClass) : undefined;

  for (const skillId of unlockedSkills) {
    const node = SKILL_TREE.get(skillId);
    if (!node || node.tier > 3) continue;
    if (!latestNamedNode || node.tier >= latestNamedNode.tier) latestNamedNode = node;
  }

  if (latestNamedNode) return latestNamedNode.name;
  if (selectedClass) return selectedClass.replace(/-root$/, '').replace(/-/g, ' ');
  return 'Classless';
}

/** Normalize and validate a player-visible character name. */
export function validateCharacterName(input: string): CharacterNameValidation {
  const name = input.normalize('NFC').trim().replace(/\s+/g, ' ');
  const length = Array.from(name).length;

  if (length < CHARACTER_NAME_MIN_LENGTH) {
    return { ok: false, reason: 'Name must be at least 2 characters.' };
  }
  if (length > CHARACTER_NAME_MAX_LENGTH) {
    return { ok: false, reason: 'Name must be 24 characters or fewer.' };
  }
  if (
    !CHARACTER_NAME_PATTERN.test(name) ||
    !CHARACTER_NAME_ALPHANUMERIC_PATTERN.test(name)
  ) {
    return {
      ok: false,
      reason: "Name may only contain letters, numbers, spaces, apostrophes, and hyphens.",
    };
  }

  return { ok: true, name };
}

/** Compose the lobby-safe projection from already-hydrated persisted slices. */
export function buildCharacterSummary(
  slices: CharacterSummarySlices,
  row: { id: string; lastPlayedAt: number },
): CharacterSummary {
  return {
    id: row.id,
    name: slices.isPlayer.name,
    globalMastery: globalMastery(slices.tracksProgression.biomeLevel),
    playerTier: slices.tracksProgression.playerTier,
    combatArchetype: slices.usesSkills.combatArchetype,
    selectedClass: slices.usesSkills.selectedClass,
    classDisplayName: resolveCharacterClassName(
      slices.usesSkills.unlockedSkills,
      slices.usesSkills.selectedClass,
    ),
    unlockedSkills: [...slices.usesSkills.unlockedSkills],
    nodeId: slices.hasPosition.nodeId,
    lastPlayedAt: row.lastPlayedAt,
  };
}
