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
  InParty,
  IsMinion,
  IsMonster,
  IsMoving,
  IsPlayer,
  MitigatesDamage,
  PerformsAttack,
  ShowsSacred,
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

export type NetworkId = string;
export type EntityKind = "player" | "monster" | "minion";

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
  "holdsShields",
  "usesAutocombat",
  "tracksProgression",
  "holdsInventory",
  "usesSkills",
  "hasStatus",
  "showsSacred",
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
export type NetworkedComponentKey =
  | NetworkedPlayerKey
  | NetworkedMonsterKey
  | NetworkedMinionKey;

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
  holdsShields?: HoldsShields;
  usesAutocombat?: UsesAutocombat;
  tracksProgression?: TracksProgression;
  holdsInventory?: HoldsInventory;
  usesSkills?: UsesSkills;
  hasStatus?: HasStatus;
  showsSacred?: ShowsSacred;
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
}

const NETWORKED_COMPONENT_KEY_SET: ReadonlySet<NetworkedComponentKey> = new Set(
  [
    ...NETWORKED_PLAYER_KEYS,
    ...NETWORKED_MONSTER_KEYS,
    ...NETWORKED_MINION_KEYS,
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
