import type {
  AppliesDots,
  ChillsTarget,
  DealsDamage,
  EvadesHits,
  HasAttackTarget,
  HasAutoIntent,
  HasEmote,
  HasAwareness,
  HasEmpoweredAttack,
  HasHealth,
  HasHitbox,
  HasPosition,
  HasBarrier,
  HasStatus,
  HoldsWards,
  HoldsInventory,
  IsChanneling,
  InParty,
  IsMinion,
  IsMonster,
  IsMoving,
  IsPlayer,
  MitigatesDamage,
  PerformsAttack,
  SummonsMinions,
  TracksProgression,
  UsesAutocombat,
  UsesCadence,
  UsesCooldown,
  UsesEnergy,
  UsesReload,
  UsesSkills,
  IsDead,
} from "../components";
import type { SubVariant } from "../skillTree";
import type { CombatArchetype } from "../types/combat";

export type NetworkId = string;
export type EntityKind = "player" | "monster" | "minion";

/**
 * Deliberately small public identity/build projection used by anonymous
 * spectators. It is never part of the authenticated player delta allowlist.
 */
export interface SpectatorPlayer {
  playerTier: number;
  selectedClass: string | null;
  selectedSubVariant: SubVariant | null;
  selectedRange: string | null;
  combatArchetype: CombatArchetype;
}

export const SPECTATOR_PLAYER_KEYS = [
  "isPlayer",
  "hasPosition",
  "hasHitbox",
  "isMoving",
  "hasAttackTarget",
  "hasEmpoweredAttack",
  "hasHealth",
  "dealsDamage",
  "performsAttack",
  "mitigatesDamage",
  "evadesHits",
  "hasBarrier",
  "holdsWards",
  "hasEmote",
  "hasStatus",
  "inParty",
  "isChanneling",
  "isDead",
] as const;

export const NETWORKED_PLAYER_KEYS = [
  "isPlayer",
  "hasPosition",
  "hasHitbox",
  "isMoving",
  "hasAttackTarget",
  "hasEmpoweredAttack",
  "hasHealth",
  "dealsDamage",
  "performsAttack",
  "mitigatesDamage",
  "evadesHits",
  "hasBarrier",
  "holdsWards",
  "usesAutocombat",
  "hasAutoIntent",
  "hasEmote",
  "tracksProgression",
  "holdsInventory",
  "usesSkills",
  "hasStatus",
  "inParty",
  "usesCadence",
  "usesEnergy",
  "appliesDots",
  "chillsTarget",
  "usesCooldown",
  "usesReload",
  "isChanneling",
  "summonsMinions",
  "isDead",
] as const;

export const NETWORKED_MONSTER_KEYS = [
  "isMonster",
  "hasPosition",
  "hasHitbox",
  "isMoving",
  "hasAttackTarget",
  "hasHealth",
  "dealsDamage",
  "performsAttack",
  "mitigatesDamage",
  "hasAwareness",
  "hasStatus",
] as const;

export const NETWORKED_MINION_KEYS = [
  "isMinion",
  "hasPosition",
  "hasHitbox",
  "isMoving",
  "hasAttackTarget",
  "hasHealth",
  "dealsDamage",
  "performsAttack",
  "mitigatesDamage",
  "hasStatus",
] as const;

export type NetworkedPlayerKey = (typeof NETWORKED_PLAYER_KEYS)[number];
export type NetworkedMonsterKey = (typeof NETWORKED_MONSTER_KEYS)[number];
export type NetworkedMinionKey = (typeof NETWORKED_MINION_KEYS)[number];
export type SpectatorPlayerKey = (typeof SPECTATOR_PLAYER_KEYS)[number];
export type NetworkedComponentKey =
  | NetworkedPlayerKey
  | NetworkedMonsterKey
  | NetworkedMinionKey
  | SpectatorPlayerKey;

export interface NetworkedEntity {
  isPlayer?: IsPlayer;
  isMonster?: IsMonster;
  isMinion?: IsMinion;
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
  hasBarrier?: HasBarrier;
  holdsWards?: HoldsWards;
  usesAutocombat?: UsesAutocombat;
  hasAutoIntent?: HasAutoIntent;
  hasEmote?: HasEmote;
  tracksProgression?: TracksProgression;
  holdsInventory?: HoldsInventory;
  usesSkills?: UsesSkills;
  hasStatus?: HasStatus;
  inParty?: InParty;
  summonsMinions?: SummonsMinions;
  usesCadence?: UsesCadence;
  usesEnergy?: UsesEnergy;
  appliesDots?: AppliesDots;
  chillsTarget?: ChillsTarget;
  usesCooldown?: UsesCooldown;
  usesReload?: UsesReload;
  isChanneling?: IsChanneling;
  isDead?: IsDead;
  hasAwareness?: HasAwareness;
  spectatorPlayer?: SpectatorPlayer;
}

const NETWORKED_COMPONENT_KEY_SET: ReadonlySet<NetworkedComponentKey> = new Set(
  [
    ...NETWORKED_PLAYER_KEYS,
    ...NETWORKED_MONSTER_KEYS,
    ...NETWORKED_MINION_KEYS,
    ...SPECTATOR_PLAYER_KEYS,
  ],
);

export function isNetworkedComponentKey(
  key: PropertyKey,
): key is NetworkedComponentKey {
  return (
    typeof key === "string" &&
    NETWORKED_COMPONENT_KEY_SET.has(key as NetworkedComponentKey)
  );
}

export function networkedKeysForKind(
  kind: EntityKind,
): readonly NetworkedComponentKey[] {
  if (kind === "player") return NETWORKED_PLAYER_KEYS;
  if (kind === "monster") return NETWORKED_MONSTER_KEYS;
  return NETWORKED_MINION_KEYS;
}
