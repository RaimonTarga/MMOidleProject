import type {
  AppliesDots,
  ChillsTarget,
  DealsDamage,
  EvadesHits,
  HasAttackTarget,
  HasAwareness,
  HasEmpoweredAttack,
  HasHealth,
  HasHitbox,
  HasPosition,
  HasStatus,
  HoldsShields,
  HoldsInventory,
  IsChanneling,
  IsMonster,
  IsMoving,
  IsPlayer,
  MitigatesDamage,
  PerformsAttack,
  ShowsSacred,
  TracksProgression,
  UsesAutocombat,
  UsesCadence,
  UsesCooldown,
  UsesEnergy,
  UsesReload,
  UsesSkills,
} from '../components';

export type NetworkId = string;
export type EntityKind = 'player' | 'monster';

export const NETWORKED_PLAYER_KEYS = [
  'isPlayer',
  'hasPosition',
  'hasHitbox',
  'isMoving',
  'hasAttackTarget',
  'hasEmpoweredAttack',
  'hasHealth',
  'dealsDamage',
  'performsAttack',
  'mitigatesDamage',
  'evadesHits',
  'holdsShields',
  'usesAutocombat',
  'tracksProgression',
  'holdsInventory',
  'usesSkills',
  'hasStatus',
  'showsSacred',
  'usesCadence',
  'usesEnergy',
  'appliesDots',
  'chillsTarget',
  'usesCooldown',
  'usesReload',
  'isChanneling',
] as const;

export const NETWORKED_MONSTER_KEYS = [
  'isMonster',
  'hasPosition',
  'hasHitbox',
  'isMoving',
  'hasAttackTarget',
  'hasHealth',
  'dealsDamage',
  'performsAttack',
  'mitigatesDamage',
  'hasAwareness',
  'hasStatus',
] as const;

export type NetworkedPlayerKey = (typeof NETWORKED_PLAYER_KEYS)[number];
export type NetworkedMonsterKey = (typeof NETWORKED_MONSTER_KEYS)[number];
export type NetworkedComponentKey = NetworkedPlayerKey | NetworkedMonsterKey;

export interface NetworkedEntity {
  isPlayer?: IsPlayer;
  isMonster?: IsMonster;
  hasPosition?: HasPosition;
  hasHitbox?: HasHitbox;
  isMoving?: IsMoving;
  hasAttackTarget?: HasAttackTarget;
  hasEmpoweredAttack?: HasEmpoweredAttack;
  hasHealth?: HasHealth;
  dealsDamage?: DealsDamage;
  performsAttack?: PerformsAttack;
  mitigatesDamage?: MitigatesDamage;
  evadesHits?: EvadesHits;
  holdsShields?: HoldsShields;
  usesAutocombat?: UsesAutocombat;
  tracksProgression?: TracksProgression;
  holdsInventory?: HoldsInventory;
  usesSkills?: UsesSkills;
  hasStatus?: HasStatus;
  showsSacred?: ShowsSacred;
  usesCadence?: UsesCadence;
  usesEnergy?: UsesEnergy;
  appliesDots?: AppliesDots;
  chillsTarget?: ChillsTarget;
  usesCooldown?: UsesCooldown;
  usesReload?: UsesReload;
  isChanneling?: IsChanneling;
  hasAwareness?: HasAwareness;
}

const NETWORKED_COMPONENT_KEY_SET: ReadonlySet<NetworkedComponentKey> = new Set([
  ...NETWORKED_PLAYER_KEYS,
  ...NETWORKED_MONSTER_KEYS,
]);

export function isNetworkedComponentKey(
  key: PropertyKey,
): key is NetworkedComponentKey {
  return (
    typeof key === 'string' &&
    NETWORKED_COMPONENT_KEY_SET.has(key as NetworkedComponentKey)
  );
}

export function networkedKeysForKind(kind: EntityKind): readonly NetworkedComponentKey[] {
  return kind === 'player' ? NETWORKED_PLAYER_KEYS : NETWORKED_MONSTER_KEYS;
}
