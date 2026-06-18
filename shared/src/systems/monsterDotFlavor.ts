import type { DamageElement } from './dotElements';
import type { MonsterDefinition } from '../data/monsters/types';

export const LEGACY_MONSTER_DOT_EFFECT_ID = 'dot';
export const MONSTER_DOT_EFFECT_PREFIX = 'monster-dot:';

export const MONSTER_DOT_FLAVOR_CODES = {
  poison: 1,
  decay: 2,
  burn: 3,
  frost: 4,
  void: 5,
} as const;

export type MonsterDotFlavorId = keyof typeof MONSTER_DOT_FLAVOR_CODES;

export interface MonsterDotFlavor {
  id: MonsterDotFlavorId;
  code: number;
  label: string;
  color: string;
  element: DamageElement;
}

export interface ResolvedMonsterDotDebuff extends MonsterDotFlavor {
  /** Authored mechanical identity. Same id stacks together. */
  debuffId: string;
  /** Runtime status effect id stored in TracksCombat.statusEffects. */
  statusEffectId: string;
}

const MONSTER_DOT_FLAVORS: Record<MonsterDotFlavorId, MonsterDotFlavor> = {
  poison: { id: 'poison', code: MONSTER_DOT_FLAVOR_CODES.poison, label: 'Poison', color: '#88bb55', element: 'poison' },
  decay: { id: 'decay', code: MONSTER_DOT_FLAVOR_CODES.decay, label: 'Decay', color: '#9a7a55', element: 'doom' },
  burn: { id: 'burn', code: MONSTER_DOT_FLAVOR_CODES.burn, label: 'Burn', color: '#ff7a3c', element: 'fire' },
  frost: { id: 'frost', code: MONSTER_DOT_FLAVOR_CODES.frost, label: 'Frost', color: '#6fd0ff', element: 'frost' },
  void: { id: 'void', code: MONSTER_DOT_FLAVOR_CODES.void, label: 'Void', color: '#b06cff', element: 'doom' },
};

export function monsterDotFlavorByCode(code: number | undefined): MonsterDotFlavor {
  return Object.values(MONSTER_DOT_FLAVORS).find((flavor) => flavor.code === code)
    ?? MONSTER_DOT_FLAVORS.poison;
}

export function resolveMonsterDotFlavor(input: {
  biome?: string;
  attackStyle?: string;
  element?: DamageElement;
}): MonsterDotFlavor {
  if (input.element === 'fire') return MONSTER_DOT_FLAVORS.burn;
  if (input.element === 'frost') return MONSTER_DOT_FLAVORS.frost;
  if (input.element === 'doom') return MONSTER_DOT_FLAVORS.void;

  switch (input.biome) {
    case 'graveyard':
    case 'necropolis':
      return MONSTER_DOT_FLAVORS.decay;
    case 'volcanic':
      return MONSTER_DOT_FLAVORS.burn;
    case 'tundra':
      return MONSTER_DOT_FLAVORS.frost;
    case 'abyss':
    case 'trench':
      return MONSTER_DOT_FLAVORS.void;
    case 'swamp':
    case 'jungle':
      return MONSTER_DOT_FLAVORS.poison;
    default:
      break;
  }

  if (input.attackStyle === 'fire') return MONSTER_DOT_FLAVORS.burn;
  if (input.attackStyle === 'frost') return MONSTER_DOT_FLAVORS.frost;
  if (input.attackStyle === 'void') return MONSTER_DOT_FLAVORS.void;
  return MONSTER_DOT_FLAVORS.poison;
}

function normalizeDebuffId(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function monsterDotStatusEffectId(debuffId: string): string {
  return `${MONSTER_DOT_EFFECT_PREFIX}${normalizeDebuffId(debuffId) || 'poison'}`;
}

export function isMonsterDotStatusEffectId(effectId: string): boolean {
  return effectId === LEGACY_MONSTER_DOT_EFFECT_ID || effectId.startsWith(MONSTER_DOT_EFFECT_PREFIX);
}

export function resolveMonsterDotDebuff(input: {
  monster?: Pick<MonsterDefinition, 'biome' | 'attackStyle' | 'dotEffect'>;
  dotEffect?: MonsterDefinition['dotEffect'];
}): ResolvedMonsterDotDebuff {
  const dotEffect = input.dotEffect ?? input.monster?.dotEffect;
  const fallback = resolveMonsterDotFlavor({
    biome: input.monster?.biome,
    attackStyle: input.monster?.attackStyle,
    element: dotEffect?.element,
  });
  const debuffId = normalizeDebuffId(dotEffect?.debuffId ?? dotEffect?.label ?? fallback.id) || fallback.id;
  return {
    ...fallback,
    debuffId,
    statusEffectId: monsterDotStatusEffectId(debuffId),
    label: dotEffect?.label ?? fallback.label,
    color: dotEffect?.color ?? fallback.color,
  };
}
