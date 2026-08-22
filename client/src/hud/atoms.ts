import { atom, getDefaultStore, type PrimitiveAtom } from 'jotai';
import { intents } from '../intents';
import { globalMastery } from '@mmo-idle/shared';
import type {
  AbilitySlot,
  CombatArchetype,
  HasAutoIntent,
  EquipmentMap,
  EquippedAbilities,
  EquippedStances,
  EquippedRule,
  EssenceType,
  PartyMember,
  PassiveMap,
  PlayerBuff,
  PlayerDeathPayload,
  PlayerView,
  ReleaseAnnouncementPayload,
  WardState,
  SubVariant,
  SummonSlotView,
  TargetStatusView,
  UltimateStatus,
  BossFelledMarker,
  DungeonView,
  Vec2,
} from '@mmo-idle/shared';

export type HudConnectionStatus = 'connecting' | 'connected' | 'disconnected';

const DEFAULT_ESSENCES: Record<EssenceType, number> = {
  red: 0,
  blue: 0,
  green: 0,
  yellow: 0,
  purple: 0,
};

const DEFAULT_EQUIPMENT: EquipmentMap = {
  weapon: null,
  armor: null,
  recovery: null,
  mobility: null,
  core: null,
  relic: null,
};

export const statusAtom = atom<HudConnectionStatus>('connecting');
export const nodeLoadingAtom = atom<{ active: boolean; nodeId: string | null }>({
  active: false,
  nodeId: null,
});
export const tabResyncAtom = atom<{ active: boolean; startedAt: number | null }>({
  active: false,
  startedAt: null,
});
export const deathOverlayAtom = atom<{
  active: boolean;
  payload: PlayerDeathPayload | null;
  startedAt: number | null;
}>({
  active: false,
  payload: null,
  startedAt: null,
});

export const releaseAnnouncementAtom = atom<ReleaseAnnouncementPayload | null>(null);

export function showReleaseAnnouncement(payload: ReleaseAnnouncementPayload): void {
  getDefaultStore().set(releaseAnnouncementAtom, payload);
}

export function clearReleaseAnnouncement(): void {
  getDefaultStore().set(releaseAnnouncementAtom, null);
}

export type EmoteWheelDirection = 'up' | 'down' | 'left' | 'right';

export const emoteWheelAtom = atom<{
  visible: boolean;
  highlight: EmoteWheelDirection | null;
}>({
  visible: false,
  highlight: null,
});

let emoteWheelHideTimer: ReturnType<typeof setTimeout> | null = null;

/** Briefly show the emote wheel HUD after an arrow-key press. */
export function flashEmoteWheel(highlight: EmoteWheelDirection): void {
  const store = getDefaultStore();
  store.set(emoteWheelAtom, { visible: true, highlight });
  if (emoteWheelHideTimer) clearTimeout(emoteWheelHideTimer);
  emoteWheelHideTimer = setTimeout(() => {
    store.set(emoteWheelAtom, { visible: false, highlight: null });
    emoteWheelHideTimer = null;
  }, 650);
}

export const playerIdAtom = atom<string | null>(null);
export const playerNameAtom = atom<string | null>(null);
export const playerNodeIdAtom = atom<string | null>(null);
export const playerPosAtom = atom<Vec2 | null>(null);
export const selectedClassAtom = atom<string | null>(null);
export const selectedSubVariantAtom = atom<SubVariant | null>(null);
export const selectedRangeAtom = atom<string | null>(null);
export const currentSkillTierAtom = atom<number>(0);
export const playerTierAtom = atom<number>(0);
export const levelAtom = atom<number>(1);

export const hpAtom = atom<number>(0);
export const maxHpAtom = atom<number>(0);
/** Permanent absorb pool and its ceiling; 0/0 when the build has no barrier. */
export const barrierAtom = atom<number>(0);
export const barrierMaxAtom = atom<number>(0);
export const barrierRechargingAtom = atom<boolean>(false);
export const wardsAtom = atom<WardState[]>([]);
export const recoveryAtom = atom<number>(0);
/** HP-bar forecast layers: pending DoT damage (red) and pending heal (dark green). */
export const incomingDotAtom = atom<number>(0);
export const pendingHealAtom = atom<number>(0);

export const attackAtom = atom<number>(0);
export const onHitDamageAtom = atom<number>(0);
export const platingAtom = atom<number>(0);
export const damageReductionAtom = atom<number>(0);
export const attackRangeAtom = atom<number>(0);
export const attackCooldownAtom = atom<number>(0);
export const speedAtom = atom<number>(0);
export const dodgeRateAtom = atom<number>(0);
export const evadeMitigationAtom = atom<number>(0);
/**
 * The live evasion accumulator (0..<1). Deterministic, so
 * `evadeCharge + dodgeRate >= 1` means the next hit taken WILL be evaded — the
 * Evasion instrument shows that as genuine anticipation, not a guess.
 */
export const evadeChargeAtom = atom<number>(0);

export const combatArchetypeAtom = atom<CombatArchetype>(null);
export const attackStyleAtom = atom<string>('');
export const attackTargetIdAtom = atom<string | null>(null);
export const lastAttackAtAtom = atom<number>(0);
export const autoAtom = atom<boolean>(false);
/** Current server-directed action and its authoritative explanation. */
export const autoIntentAtom = atom<HasAutoIntent | null>(null);

export const cadenceCountAtom = atom<number>(0);
export const cadenceThresholdAtom = atom<number>(0);
export const cadenceEmpoweredArmedAtom = atom<boolean>(false);
export const cadenceSpeedStacksAtom = atom<number>(0);

export const executionReadyAtom = atom<boolean>(false);
export const executionCooldownPctAtom = atom<number>(0);

export const energyCountAtom = atom<number>(0);
export const energyMaxAtom = atom<number>(100);
export const empoweredReadyAtom = atom<boolean>(false);
export const flashShiftPctAtom = atom<number>(0);
export const flashDamageShiftPctAtom = atom<number>(0);
export const flashSpeedBonusPctAtom = atom<number>(0);
export const flashEvasionBonusPctAtom = atom<number>(0);

export const ammoCountAtom = atom<number>(0);
export const ammoMaxAtom = atom<number>(0);
export const heatPctAtom = atom<number>(0);
export const laserOverheatedAtom = atom<boolean>(false);

export const targetDotStacksAtom = atom<number>(0);
export const targetDotTickPctAtom = atom<number>(0);
/** Monotonic receipt counter for confirmed ticks from this player's current target. */
export const targetDotTickSerialAtom = atom<number>(0);
export const targetChillStacksAtom = atom<number>(0);

export function notifyTargetDotTick(): void {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  const store = getDefaultStore();
  store.set(targetDotTickSerialAtom, store.get(targetDotTickSerialAtom) + 1);
}

export const summonActiveCountAtom = atom<number>(0);
export const summonSlotCountAtom = atom<number>(0);
export const summonRespawnMaxMsAtom = atom<number>(0);
export const summonSlotsAtom = atom<SummonSlotView[]>([]);
/** Authoritative live minion health, joined to the player's slot projection by slot. */
export interface SummonHealthView {
  slot: number;
  hp: number;
  maxHp: number;
}
export const summonHealthAtom = atom<SummonHealthView[]>([]);

export const isChannelingAtom = atom<boolean>(false);
export const channelingPctAtom = atom<number>(0);
export const cannonChargePctAtom = atom<number>(0);

export const skillPointsAtom = atom<number>(0);
export const unlockedSkillsAtom = atom<string[]>([]);
export const passivesAtom = atom<PassiveMap>({});
export const inventoryAtom = atom<string[]>([]);
export const equipmentAtom = atom<EquipmentMap>({ ...DEFAULT_EQUIPMENT });
export const itemUpgradesAtom = atom<Record<string, number>>({});
export const unlockedRecipesAtom = atom<string[]>([]);
export const bossesClearedAtom = atom<string[]>([]);
export const visitedNodesAtom = atom<string[]>([]);
export const biomeLevelAtom = atom<Record<string, number>>({});
/** Derived sum of all biome levels (system rework Step 4) — RP budget + upgrade ceiling. */
export const globalMasteryAtom = atom((get) => globalMastery(get(biomeLevelAtom)));
export const biomeXPAtom = atom<Record<string, number>>({});
export const questProgressAtom = atom<Record<string, number>>({});
export const essencesAtom = atom<Record<EssenceType, number>>({ ...DEFAULT_ESSENCES });
export const catalystsAtom = atom<Record<string, number>>({});
export const catalystProgressAtom = atom<Record<string, number>>({});

export const activeBuffsAtom = atom<PlayerBuff[]>([]);
export const autoPathAtom = atom<string[] | null>(null);

/**
 * Last observed ability-effect time, keyed by ABILITY ID; drives the brief HUD
 * pulse. Keyed per ability rather than per slot kind because two Techniques can
 * be equipped at once — a slot-kind key would pulse whichever tile happened to
 * be first. Server cooldowns are per-ability for the same reason.
 */
export const abilityFiredAtAtom = atom<Record<string, number>>({});

/** Stamp an ability as just-fired (called from combat FX, client-side). */
export function notifyAbilityFired(abilityId: string): void {
  const store = getDefaultStore();
  const prev = store.get(abilityFiredAtAtom);
  store.set(abilityFiredAtAtom, { ...prev, [abilityId]: Date.now() });
}

/**
 * Client receipt time for the server event that places an ability on cooldown,
 * keyed by ability id. Distinct from `abilityFiredAtAtom`: Techniques enter
 * cooldown when ARMED, while their visible effect may land on a later attack.
 */
export const abilityCooldownStartedAtAtom = atom<Record<string, number>>({});

/** Stamp an ability as cooling from the server's fire or arm event. */
export function notifyAbilityCooldownStarted(abilityId: string): void {
  const store = getDefaultStore();
  const prev = store.get(abilityCooldownStartedAtAtom);
  store.set(abilityCooldownStartedAtAtom, { ...prev, [abilityId]: Date.now() });
}

/**
 * Live cast progress for the local player's casted Technique, or null when not
 * casting. Driven by the `player-cast-start` / `player-cast-end` node events.
 */
export const abilityCastAtom = atom<{
  abilityId: string;
  startedAt: number;
  castMs: number;
} | null>(null);

export function notifyAbilityCastStarted(abilityId: string, castMs: number): void {
  getDefaultStore().set(abilityCastAtom, {
    abilityId,
    startedAt: Date.now(),
    castMs,
  });
}

export function notifyAbilityCastEnded(): void {
  getDefaultStore().set(abilityCastAtom, null);
}

export interface ZonePlayer {
  id: string;
  name: string;
  partyLeaderId: string | null;
  hp: number;
  maxHp: number;
}
/** Players in the local player's current zone (for the party panel). */
export const zonePlayersAtom = atom<ZonePlayer[]>([]);

/** One ultimate boss per node — first engaged match wins. See deltaApplier scan. */
export interface ZoneBoss {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  status: UltimateStatus;
}
export const zoneBossAtom = atom<ZoneBoss | null>(null);

/** Current attack target — drives the top-center target frame. Resolved each
 *  broadcast in deltaApplier from the local player's attackTargetId. */
export interface TargetFrameData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  plating: number;
  damageReduction: number;
  isBoss: boolean;
  statuses: TargetStatusView[];
  bossEffects: string[];
}
export const targetFrameAtom = atom<TargetFrameData | null>(null);

/** Slain bosses awaiting respawn, keyed by node id (world map). */
export const bossFelledByNodeAtom = atom<Record<string, BossFelledMarker>>({});
export const dungeonAtom = atom<DungeonView | null>(null);

/** The local player's party (null when not in a party). */
export const partyAtom = atom<{ leaderId: string; members: PartyMember[] } | null>(null);

export const runesOwnedAtom = atom<string[]>([]);
export const runeRecipesCraftedAtom = atom<string[]>([]);
export const runesEquippedAtom = atom<EquippedRule[]>([]);

/** Abilities learned (crafted) — the slottable pool (system rework Step 7). */
export const knownAbilitiesAtom = atom<string[]>([]);
/** Equipped abilities per slot kind, ordered — list order is fire priority. */
export const equippedAbilitiesAtom = atom<EquippedAbilities>({
  techniques: [],
  guards: [],
});
/** Ability slots unlocked at the player's tier: `{ technique, guard }`. */
export const abilitySlotsAtom = atom<Record<AbilitySlot, number>>({
  technique: 1,
  guard: 1,
});

/** Stances learned (crafted) — the slottable pool (system rework Step 10). */
export const knownStancesAtom = atom<string[]>([]);
/** Free default posture. Automated destinations live on individual Rune rules. */
export const equippedStancesAtom = atom<EquippedStances>({
  default: null,
});
/** Which posture is currently active (folded into stats). */
export const activeStanceAtom = atom<string | null>(null);

/** Rites learned (crafted) — the slottable pool (system rework Step 11). */
export const knownRitesAtom = atom<string[]>([]);
/** Equipped rites — interchangeable list (always-on OOC), length ≤ riteSlots. */
export const equippedRitesAtom = atom<string[]>([]);
/** Number of rite slots available (GM-derived; flat 2 for v1). */
export const riteSlotsAtom = atom<number>(0);

export const skillTreeOpenAtom = atom<boolean>(false);
export type BuildPanelTab = 'overview' | 'abilities' | 'stances' | 'rites';
export const buildOpenAtom = atom<boolean>(false);
/**
 * The dialog these drive is called **Loadout** in the UI (renamed in V5, when
 * making moved to Crafting and arranging stayed here). The identifiers keep the
 * `build*` prefix: renaming them reaches a dozen files and every persisted key
 * for no player-visible gain.
 */
export const buildPanelTabAtom = atom<BuildPanelTab>('overview');
export const runesOpenAtom = atom<boolean>(false);
export const abilitiesOpenAtom = atom<boolean>(false);
export const stancesOpenAtom = atom<boolean>(false);
export const ritesOpenAtom = atom<boolean>(false);
export const masteryOpenAtom = atom<boolean>(false);
export const inventoryOpenAtom = atom<boolean>(false);
export const mapOpenAtom = atom<boolean>(false);
export const craftTabAtom = atom<'make' | 'upgrade' | null>(null);
export const questOpenAtom = atom<boolean>(false);
export const settingsOpenAtom = atom<boolean>(false);
export const debugPanelOpenAtom = atom<boolean>(false);
/** Whether the bestiary detail overlay is open. */
export const bestiaryOpenAtom = atom<boolean>(false);
/** Which monster the bestiary detail overlay has selected (null = first/none). */
export const bestiaryDetailIdAtom = atom<string | null>(null);
export const mapHighlightNodesAtom = atom<string[]>([]);

export interface GamepadStatus {
  index: number;
  id: string;
  mapping: string;
}
export const gamepadStatusAtom = atom<GamepadStatus | null>(null);

function shallowArrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

function summonSlotsEqual(a: SummonSlotView[], b: SummonSlotView[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].active !== b[i].active
      || a[i].respawnPct !== b[i].respawnPct
      || a[i].respawnRemainingMs !== b[i].respawnRemainingMs
      || a[i].slotId !== b[i].slotId
      || a[i].role !== b[i].role
      || a[i].queuePosition !== b[i].queuePosition
      || a[i].marked !== b[i].marked
      || a[i].ritualCharges !== b[i].ritualCharges
    ) {
      return false;
    }
  }
  return true;
}

function shallowObjectEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

export function setIfShallowArrayEqual<T>(
  targetAtom: PrimitiveAtom<T[]>,
  next: T[],
): void {
  const store = getDefaultStore();
  const prev = store.get(targetAtom);
  if (shallowArrayEqual(prev, next)) return;
  store.set(targetAtom, next);
}

export function setIfShallowObjectEqual<T extends Record<string, unknown>>(
  targetAtom: PrimitiveAtom<T>,
  next: T,
): void {
  const store = getDefaultStore();
  const prev = store.get(targetAtom);
  if (shallowObjectEqual(prev, next)) return;
  store.set(targetAtom, next);
}

export function setIfSummonSlotsEqual(next: SummonSlotView[]): void {
  const store = getDefaultStore();
  const prev = store.get(summonSlotsAtom);
  if (summonSlotsEqual(prev, next)) return;
  store.set(summonSlotsAtom, next);
}

function summonHealthEqual(a: SummonHealthView[], b: SummonHealthView[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].slot !== b[i].slot || a[i].hp !== b[i].hp || a[i].maxHp !== b[i].maxHp) {
      return false;
    }
  }
  return true;
}

export function setSummonHealth(next: SummonHealthView[]): void {
  const store = getDefaultStore();
  if (summonHealthEqual(store.get(summonHealthAtom), next)) return;
  store.set(summonHealthAtom, next);
}

export function setAutoPath(path: string[] | null): void {
  const store = getDefaultStore();
  const prev = store.get(autoPathAtom);
  if (prev === null && path === null) return;
  if (prev !== null && path !== null && shallowArrayEqual(prev, path)) return;
  store.set(autoPathAtom, path);
}

function setIfChanged<T>(targetAtom: PrimitiveAtom<T>, next: T): void {
  const store = getDefaultStore();
  const prev = store.get(targetAtom);
  if (Object.is(prev, next)) return;
  store.set(targetAtom, next);
}

function zonePlayersEqual(a: readonly ZonePlayer[], b: readonly ZonePlayer[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].name !== b[i].name ||
      a[i].partyLeaderId !== b[i].partyLeaderId ||
      a[i].hp !== b[i].hp ||
      a[i].maxHp !== b[i].maxHp
    ) {
      return false;
    }
  }
  return true;
}

export function setZonePlayers(next: ZonePlayer[]): void {
  const store = getDefaultStore();
  if (zonePlayersEqual(store.get(zonePlayersAtom), next)) return;
  store.set(zonePlayersAtom, next);
}

function zoneBossEqual(a: ZoneBoss | null, b: ZoneBoss | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.id !== b.id ||
    a.name !== b.name ||
    a.hp !== b.hp ||
    a.maxHp !== b.maxHp
  ) {
    return false;
  }
  const sa = a.status;
  const sb = b.status;
  if (
    sa.stageLabel !== sb.stageLabel ||
    sa.stageIndex !== sb.stageIndex ||
    sa.stageCount !== sb.stageCount ||
    sa.invulnerable !== sb.invulnerable
  ) {
    return false;
  }
  const oa = sa.objective;
  const ob = sb.objective;
  if (oa?.headline !== ob?.headline || oa?.detail !== ob?.detail ||
      oa?.current !== ob?.current || oa?.total !== ob?.total) {
    return false;
  }
  const ha = sa.hazard;
  const hb = sb.hazard;
  if (ha?.effectId !== hb?.effectId || ha?.dmgPerTick !== hb?.dmgPerTick ||
      ha?.tickMs !== hb?.tickMs || ha?.hint !== hb?.hint) {
    return false;
  }
  return true;
}

export function setZoneBoss(next: ZoneBoss | null): void {
  const store = getDefaultStore();
  if (zoneBossEqual(store.get(zoneBossAtom), next)) return;
  store.set(zoneBossAtom, next);
}

function targetFrameEqual(a: TargetFrameData | null, b: TargetFrameData | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.id !== b.id || a.hp !== b.hp || a.maxHp !== b.maxHp ||
    a.attack !== b.attack || a.plating !== b.plating ||
    a.damageReduction !== b.damageReduction || a.isBoss !== b.isBoss ||
    a.statuses.length !== b.statuses.length || a.bossEffects.length !== b.bossEffects.length
  ) return false;
  for (let i = 0; i < a.statuses.length; i++) {
    const x = a.statuses[i], y = b.statuses[i];
    if (x.id !== y.id || x.stacks !== y.stacks || x.remainingMs !== y.remainingMs) return false;
  }
  for (let i = 0; i < a.bossEffects.length; i++) {
    if (a.bossEffects[i] !== b.bossEffects[i]) return false;
  }
  return true;
}

export function setTargetFrame(next: TargetFrameData | null): void {
  const store = getDefaultStore();
  if (targetFrameEqual(store.get(targetFrameAtom), next)) return;
  store.set(targetFrameAtom, next);
}

export function setBossFelledMarkers(markers: BossFelledMarker[]): void {
  const next: Record<string, BossFelledMarker> = {};
  for (const marker of markers) next[marker.nodeId] = marker;
  getDefaultStore().set(bossFelledByNodeAtom, next);
}

export function setDungeon(next: DungeonView | null): void {
  getDefaultStore().set(dungeonAtom, next);
}

function partyEqual(
  a: { leaderId: string; members: PartyMember[] } | null,
  b: { leaderId: string; members: PartyMember[] } | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.leaderId !== b.leaderId || a.members.length !== b.members.length) return false;
  for (let i = 0; i < a.members.length; i++) {
    if (a.members[i].id !== b.members[i].id || a.members[i].name !== b.members[i].name) return false;
  }
  return true;
}

function setParty(next: { leaderId: string; members: PartyMember[] } | null): void {
  const store = getDefaultStore();
  if (partyEqual(store.get(partyAtom), next)) return;
  store.set(partyAtom, next);
}

function runesEquippedEqual(
  a: readonly EquippedRule[],
  b: readonly EquippedRule[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].conditionId !== b[i].conditionId || a[i].actionId !== b[i].actionId) {
      return false;
    }
  }
  return true;
}

function setRunesEquipped(next: EquippedRule[]): void {
  const store = getDefaultStore();
  if (runesEquippedEqual(store.get(runesEquippedAtom), next)) return;
  store.set(runesEquippedAtom, next);
}

function setAbilitySlots(next: Record<AbilitySlot, number>): void {
  const store = getDefaultStore();
  const prev = store.get(abilitySlotsAtom);
  if (prev.technique === next.technique && prev.guard === next.guard) return;
  store.set(abilitySlotsAtom, next);
}

function setEquippedAbilities(next: EquippedAbilities): void {
  const store = getDefaultStore();
  const prev = store.get(equippedAbilitiesAtom);
  if (
    shallowArrayEqual(prev.techniques, next.techniques) &&
    shallowArrayEqual(prev.guards, next.guards)
  ) {
    return;
  }
  store.set(equippedAbilitiesAtom, next);
}

function setEquippedStances(next: EquippedStances): void {
  const store = getDefaultStore();
  const prev = store.get(equippedStancesAtom);
  if (prev.default === next.default) return;
  store.set(equippedStancesAtom, next);
}

function buffsEqual(a: readonly PlayerBuff[], b: readonly PlayerBuff[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.iconKey !== y.iconKey ||
      x.instanceKey !== y.instanceKey ||
      x.stacks !== y.stacks ||
      x.durationPct !== y.durationPct ||
      x.label !== y.label
    ) {
      return false;
    }
  }
  return true;
}

function setIfBuffsEqual(targetAtom: PrimitiveAtom<PlayerBuff[]>, next: PlayerBuff[]): void {
  const store = getDefaultStore();
  const prev = store.get(targetAtom);
  if (buffsEqual(prev, next)) return;
  store.set(targetAtom, next);
}

function resetPlayerAtoms(): void {
  const store = getDefaultStore();

  store.set(playerIdAtom, null);
  store.set(playerNameAtom, null);
  store.set(playerNodeIdAtom, null);
  store.set(playerPosAtom, null);
  store.set(selectedClassAtom, null);
  store.set(selectedSubVariantAtom, null);
  store.set(selectedRangeAtom, null);
  store.set(currentSkillTierAtom, 0);
  store.set(playerTierAtom, 0);
  store.set(levelAtom, 1);

  store.set(hpAtom, 0);
  store.set(maxHpAtom, 0);
  store.set(recoveryAtom, 0);
  store.set(incomingDotAtom, 0);
  store.set(pendingHealAtom, 0);
  store.set(attackAtom, 0);
  store.set(onHitDamageAtom, 0);
  store.set(platingAtom, 0);
  store.set(damageReductionAtom, 0);
  store.set(attackRangeAtom, 0);
  store.set(attackCooldownAtom, 0);
  store.set(speedAtom, 0);
  store.set(dodgeRateAtom, 0);
  store.set(evadeMitigationAtom, 0);
  store.set(evadeChargeAtom, 0);

  store.set(combatArchetypeAtom, null);
  store.set(attackStyleAtom, '');
  store.set(attackTargetIdAtom, null);
  store.set(lastAttackAtAtom, 0);
  store.set(autoAtom, false);
  store.set(autoIntentAtom, null);

  store.set(cadenceCountAtom, 0);
  store.set(cadenceThresholdAtom, 0);
  store.set(cadenceEmpoweredArmedAtom, false);
  store.set(cadenceSpeedStacksAtom, 0);
  store.set(executionReadyAtom, false);
  store.set(executionCooldownPctAtom, 0);
  store.set(energyCountAtom, 0);
  store.set(energyMaxAtom, 100);
  store.set(empoweredReadyAtom, false);
  store.set(flashShiftPctAtom, 0);
  store.set(flashDamageShiftPctAtom, 0);
  store.set(flashSpeedBonusPctAtom, 0);
  store.set(flashEvasionBonusPctAtom, 0);
  store.set(ammoCountAtom, 0);
  store.set(ammoMaxAtom, 0);
  store.set(heatPctAtom, 0);
  store.set(laserOverheatedAtom, false);
  store.set(targetDotStacksAtom, 0);
  store.set(targetDotTickPctAtom, 0);
  store.set(targetDotTickSerialAtom, 0);
  store.set(targetChillStacksAtom, 0);
  store.set(isChannelingAtom, false);
  store.set(channelingPctAtom, 0);
  store.set(skillPointsAtom, 0);

  store.set(barrierAtom, 0);
  store.set(barrierMaxAtom, 0);
  store.set(barrierRechargingAtom, false);
  setIfShallowArrayEqual(wardsAtom, []);
  setIfShallowArrayEqual(summonSlotsAtom, []);
  setSummonHealth([]);
  setIfChanged(summonActiveCountAtom, 0);
  setIfChanged(summonSlotCountAtom, 0);
  setIfChanged(summonRespawnMaxMsAtom, 0);
  setIfShallowArrayEqual(unlockedSkillsAtom, []);
  setIfShallowArrayEqual(runesOwnedAtom, []);
  setIfShallowArrayEqual(runeRecipesCraftedAtom, []);
  setRunesEquipped([]);
  setIfShallowArrayEqual(knownAbilitiesAtom, []);
  setEquippedAbilities({ techniques: [], guards: [] });
  setAbilitySlots({ technique: 1, guard: 1 });
  setIfShallowArrayEqual(knownStancesAtom, []);
  setEquippedStances({ default: null });
  setIfChanged(activeStanceAtom, null);
  setIfShallowArrayEqual(knownRitesAtom, []);
  setIfShallowArrayEqual(equippedRitesAtom, []);
  setIfChanged(riteSlotsAtom, 0);
  setIfShallowArrayEqual(inventoryAtom, []);
  setIfShallowArrayEqual(unlockedRecipesAtom, []);
  setIfShallowArrayEqual(bossesClearedAtom, []);
  setIfShallowArrayEqual(visitedNodesAtom, []);
  setIfShallowArrayEqual(activeBuffsAtom, []);
  store.set(abilityFiredAtAtom, {});
  store.set(abilityCooldownStartedAtAtom, {});
  store.set(abilityCastAtom, null);
  setIfShallowObjectEqual(passivesAtom, {});
  setIfShallowObjectEqual(equipmentAtom, { ...DEFAULT_EQUIPMENT });
  setIfShallowObjectEqual(itemUpgradesAtom, {});
  setIfShallowObjectEqual(biomeLevelAtom, {});
  setIfShallowObjectEqual(biomeXPAtom, {});
  setIfShallowObjectEqual(questProgressAtom, {});
  setIfShallowObjectEqual(essencesAtom, { ...DEFAULT_ESSENCES });
  setIfShallowObjectEqual(catalystsAtom, {});
  setIfShallowObjectEqual(catalystProgressAtom, {});
  setAutoPath(null);
  setParty(null);
  setZonePlayers([]);
  setZoneBoss(null);
  setTargetFrame(null);
  setBossFelledMarkers([]);
  setDungeon(null);
  store.set(nodeLoadingAtom, { active: false, nodeId: null });
  store.set(tabResyncAtom, { active: false, startedAt: null });
  store.set(deathOverlayAtom, { active: false, payload: null, startedAt: null });
}

export function syncPlayerAtoms(player: PlayerView | null): void {
  if (!player) {
    resetPlayerAtoms();
    return;
  }

  setIfChanged(playerIdAtom, player.id);
  setIfChanged(playerNameAtom, player.name);
  setIfChanged(playerNodeIdAtom, player.nodeId);
  getDefaultStore().set(playerPosAtom, player.pos);
  setIfChanged(selectedClassAtom, player.selectedClass);
  setIfChanged(selectedSubVariantAtom, player.selectedSubVariant);
  setIfChanged(selectedRangeAtom, player.selectedRange);
  setIfChanged(currentSkillTierAtom, player.currentSkillTier);
  setIfChanged(playerTierAtom, player.playerTier);
  setIfChanged(levelAtom, player.level);

  setIfChanged(hpAtom, player.hp);
  setIfChanged(maxHpAtom, player.maxHp);
  setIfChanged(recoveryAtom, player.recovery);
  setIfChanged(incomingDotAtom, player.incomingDot);
  setIfChanged(pendingHealAtom, player.pendingHeal);
  setIfChanged(attackAtom, player.attack);
  setIfChanged(onHitDamageAtom, player.onHitDamage);
  setIfChanged(platingAtom, player.plating);
  setIfChanged(damageReductionAtom, player.damageReduction);
  setIfChanged(attackRangeAtom, player.attackRange);
  setIfChanged(attackCooldownAtom, player.attackCooldown);
  setIfChanged(speedAtom, player.speed);
  setIfChanged(dodgeRateAtom, player.dodgeRate);
  setIfChanged(evadeMitigationAtom, player.evadeMitigation);
  setIfChanged(evadeChargeAtom, player.evadeCharge);

  setIfChanged(combatArchetypeAtom, player.combatArchetype);
  setIfChanged(attackStyleAtom, player.attackStyle);
  setIfChanged(attackTargetIdAtom, player.attackTargetId);
  setIfChanged(lastAttackAtAtom, player.lastAttackAt);
  setIfChanged(autoAtom, player.auto);
  setIfChanged(autoIntentAtom, player.autoIntent);

  setIfChanged(cadenceCountAtom, player.cadenceCount);
  setIfChanged(cadenceThresholdAtom, player.cadenceThreshold);
  setIfChanged(cadenceEmpoweredArmedAtom, player.cadenceEmpoweredArmed);
  setIfChanged(cadenceSpeedStacksAtom, player.cadenceSpeedStacks);
  setIfChanged(executionReadyAtom, player.executionReady);
  setIfChanged(executionCooldownPctAtom, player.executionCooldownPct);
  setIfChanged(energyCountAtom, player.energyCount);
  setIfChanged(energyMaxAtom, player.energyMax);
  setIfChanged(empoweredReadyAtom, player.empoweredReady);
  setIfChanged(flashShiftPctAtom, player.flashShiftPct);
  setIfChanged(flashDamageShiftPctAtom, player.flashDamageShiftPct);
  setIfChanged(flashSpeedBonusPctAtom, player.flashSpeedBonusPct);
  setIfChanged(flashEvasionBonusPctAtom, player.flashEvasionBonusPct);
  setIfChanged(ammoCountAtom, player.ammoCount);
  setIfChanged(ammoMaxAtom, player.ammoMax);
  setIfChanged(heatPctAtom, player.heatPct);
  setIfChanged(laserOverheatedAtom, player.laserOverheated);
  setIfChanged(targetDotStacksAtom, player.targetDotStacks);
  setIfChanged(targetDotTickPctAtom, player.targetDotTickPct);
  setIfChanged(targetChillStacksAtom, player.targetChillStacks);
  setIfChanged(summonActiveCountAtom, player.summonActiveCount);
  setIfChanged(summonSlotCountAtom, player.summonsMinions);
  setIfChanged(summonRespawnMaxMsAtom, player.summonRespawnMaxMs);
  setIfSummonSlotsEqual(player.summonSlots);
  setIfChanged(isChannelingAtom, player.isChanneling);
  setIfChanged(channelingPctAtom, player.channelingPct);
  setIfChanged(cannonChargePctAtom, player.cannonChargePct);
  setIfChanged(skillPointsAtom, player.skillPoints);

  setIfChanged(barrierAtom, player.barrier);
  setIfChanged(barrierMaxAtom, player.barrierMax);
  setIfChanged(barrierRechargingAtom, player.barrierRecharging);
  setIfShallowArrayEqual(wardsAtom, player.wards);
  setIfShallowArrayEqual(unlockedSkillsAtom, player.unlockedSkills);
  setIfShallowArrayEqual(runesOwnedAtom, player.runesOwned);
  setIfShallowArrayEqual(runeRecipesCraftedAtom, player.runeRecipesCrafted);
  setRunesEquipped(player.runesEquipped);
  setIfShallowArrayEqual(knownAbilitiesAtom, player.knownAbilities);
  setEquippedAbilities(player.equippedAbilities);
  setAbilitySlots(player.abilitySlots);
  setIfShallowArrayEqual(knownStancesAtom, player.knownStances);
  setEquippedStances(player.equippedStances);
  setIfChanged(activeStanceAtom, player.activeStance);
  setIfShallowArrayEqual(knownRitesAtom, player.knownRites);
  setIfShallowArrayEqual(equippedRitesAtom, player.equippedRites);
  setIfChanged(riteSlotsAtom, player.riteSlots);
  setIfShallowArrayEqual(inventoryAtom, player.inventory);
  setIfShallowArrayEqual(unlockedRecipesAtom, player.unlockedRecipes);
  setIfShallowArrayEqual(bossesClearedAtom, player.bossesCleared);
  setIfShallowArrayEqual(visitedNodesAtom, player.visitedNodes);
  setIfBuffsEqual(activeBuffsAtom, player.activeBuffs);
  setIfShallowObjectEqual(passivesAtom, player.passives);
  setIfShallowObjectEqual(equipmentAtom, player.equipment);
  setIfShallowObjectEqual(itemUpgradesAtom, player.itemUpgrades ?? {});
  setIfShallowObjectEqual(biomeLevelAtom, player.biomeLevel);
  setIfShallowObjectEqual(biomeXPAtom, player.biomeXP);
  setIfShallowObjectEqual(questProgressAtom, player.questProgress);
  setIfShallowObjectEqual(essencesAtom, player.essences);
  setIfShallowObjectEqual(catalystsAtom, player.catalysts);
  setIfShallowObjectEqual(catalystProgressAtom, player.catalystProgress);

  setParty(
    player.partyLeaderId
      ? { leaderId: player.partyLeaderId, members: player.partyMembers }
      : null,
  );
}

export function isDeathOverlayActive(): boolean {
  return getDefaultStore().get(deathOverlayAtom).active;
}

/** Close inventory + crafting panels when death starts. */
export function closeEconomyPanels(): void {
  const store = getDefaultStore();
  store.set(inventoryOpenAtom, false);
  store.set(craftTabAtom, null);
}

export function triggerDeathOverlay(payload: PlayerDeathPayload): void {
  closeEconomyPanels();
  getDefaultStore().set(deathOverlayAtom, {
    active: true,
    payload,
    startedAt: Date.now(),
  });
}

export function clearDeathOverlay(): void {
  getDefaultStore().set(deathOverlayAtom, {
    active: false,
    payload: null,
    startedAt: null,
  });
  intents.emit("ackDeath", undefined);
}
