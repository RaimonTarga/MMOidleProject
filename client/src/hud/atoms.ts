import { atom, getDefaultStore, type PrimitiveAtom } from 'jotai';
import { intents } from '../intents';
import type {
  CombatArchetype,
  EquipmentMap,
  EquippedRule,
  EssenceType,
  PartyMember,
  PassiveMap,
  PlayerBuff,
  PlayerDeathPayload,
  PlayerView,
  ReleaseAnnouncementPayload,
  ShieldState,
  SubVariant,
  SummonSlotView,
  TargetStatusView,
  UltimateStatus,
  BossFelledMarker,
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
export const selectedClassAtom = atom<string | null>(null);
export const selectedSubVariantAtom = atom<SubVariant | null>(null);
export const selectedRangeAtom = atom<string | null>(null);
export const currentSkillTierAtom = atom<number>(0);
export const playerTierAtom = atom<number>(0);
export const levelAtom = atom<number>(1);

export const hpAtom = atom<number>(0);
export const maxHpAtom = atom<number>(0);
export const shieldsAtom = atom<ShieldState[]>([]);
export const hpRegenAtom = atom<number>(0);
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

export const combatArchetypeAtom = atom<CombatArchetype>(null);
export const attackStyleAtom = atom<string>('');
export const attackTargetIdAtom = atom<string | null>(null);
export const lastAttackAtAtom = atom<number>(0);
export const autoAtom = atom<boolean>(false);

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
export const targetChillStacksAtom = atom<number>(0);

export const summonActiveCountAtom = atom<number>(0);
export const summonSlotCountAtom = atom<number>(0);
export const summonRespawnMaxMsAtom = atom<number>(0);
export const summonSlotsAtom = atom<SummonSlotView[]>([]);

export const sacredBuffPctAtom = atom<number>(0);
export const sacredBuffActiveAtom = atom<boolean>(false);

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
export const biomeLevelAtom = atom<Record<string, number>>({});
export const biomeXPAtom = atom<Record<string, number>>({});
export const questProgressAtom = atom<Record<string, number>>({});
export const essencesAtom = atom<Record<EssenceType, number>>({ ...DEFAULT_ESSENCES });

export const activeBuffsAtom = atom<PlayerBuff[]>([]);
export const autoPathAtom = atom<string[] | null>(null);

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

/** The local player's party (null when not in a party). */
export const partyAtom = atom<{ leaderId: string; members: PartyMember[] } | null>(null);

export const runesOwnedAtom = atom<string[]>([]);
export const runeRecipesCraftedAtom = atom<string[]>([]);
export const runePointBonusAtom = atom<number>(0);
export const runesEquippedAtom = atom<EquippedRule[]>([]);

export const skillTreeOpenAtom = atom<boolean>(false);
export const runesOpenAtom = atom<boolean>(false);
export const runePanelTabAtom = atom<'loadout' | 'forge'>('loadout');
export const inventoryOpenAtom = atom<boolean>(false);
export const mapOpenAtom = atom<boolean>(false);
export const craftTabAtom = atom<'biome' | 'forge' | 'upgrade' | null>(null);
export const questOpenAtom = atom<boolean>(false);
export const settingsOpenAtom = atom<boolean>(false);
export const debugPanelOpenAtom = atom<boolean>(false);
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

function buffsEqual(a: readonly PlayerBuff[], b: readonly PlayerBuff[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
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
  store.set(selectedClassAtom, null);
  store.set(selectedSubVariantAtom, null);
  store.set(selectedRangeAtom, null);
  store.set(currentSkillTierAtom, 0);
  store.set(playerTierAtom, 0);
  store.set(levelAtom, 1);

  store.set(hpAtom, 0);
  store.set(maxHpAtom, 0);
  store.set(hpRegenAtom, 0);
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

  store.set(combatArchetypeAtom, null);
  store.set(attackStyleAtom, '');
  store.set(attackTargetIdAtom, null);
  store.set(lastAttackAtAtom, 0);
  store.set(autoAtom, false);

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
  store.set(targetChillStacksAtom, 0);
  store.set(sacredBuffPctAtom, 0);
  store.set(sacredBuffActiveAtom, false);
  store.set(isChannelingAtom, false);
  store.set(channelingPctAtom, 0);
  store.set(skillPointsAtom, 0);

  setIfShallowArrayEqual(shieldsAtom, []);
  setIfShallowArrayEqual(summonSlotsAtom, []);
  setIfChanged(summonActiveCountAtom, 0);
  setIfChanged(summonSlotCountAtom, 0);
  setIfChanged(summonRespawnMaxMsAtom, 0);
  setIfShallowArrayEqual(unlockedSkillsAtom, []);
  setIfShallowArrayEqual(runesOwnedAtom, []);
  setIfShallowArrayEqual(runeRecipesCraftedAtom, []);
  setIfChanged(runePointBonusAtom, 0);
  setRunesEquipped([]);
  setIfShallowArrayEqual(inventoryAtom, []);
  setIfShallowArrayEqual(unlockedRecipesAtom, []);
  setIfShallowArrayEqual(bossesClearedAtom, []);
  setIfShallowArrayEqual(activeBuffsAtom, []);
  setIfShallowObjectEqual(passivesAtom, {});
  setIfShallowObjectEqual(equipmentAtom, { ...DEFAULT_EQUIPMENT });
  setIfShallowObjectEqual(itemUpgradesAtom, {});
  setIfShallowObjectEqual(biomeLevelAtom, {});
  setIfShallowObjectEqual(biomeXPAtom, {});
  setIfShallowObjectEqual(questProgressAtom, {});
  setIfShallowObjectEqual(essencesAtom, { ...DEFAULT_ESSENCES });
  setAutoPath(null);
  setParty(null);
  setZonePlayers([]);
  setZoneBoss(null);
  setTargetFrame(null);
  setBossFelledMarkers([]);
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
  setIfChanged(selectedClassAtom, player.selectedClass);
  setIfChanged(selectedSubVariantAtom, player.selectedSubVariant);
  setIfChanged(selectedRangeAtom, player.selectedRange);
  setIfChanged(currentSkillTierAtom, player.currentSkillTier);
  setIfChanged(playerTierAtom, player.playerTier);
  setIfChanged(levelAtom, player.level);

  setIfChanged(hpAtom, player.hp);
  setIfChanged(maxHpAtom, player.maxHp);
  setIfChanged(hpRegenAtom, player.hpRegen);
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

  setIfChanged(combatArchetypeAtom, player.combatArchetype);
  setIfChanged(attackStyleAtom, player.attackStyle);
  setIfChanged(attackTargetIdAtom, player.attackTargetId);
  setIfChanged(lastAttackAtAtom, player.lastAttackAt);
  setIfChanged(autoAtom, player.auto);

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
  setIfChanged(targetChillStacksAtom, player.targetChillStacks);
  setIfChanged(summonActiveCountAtom, player.summonActiveCount);
  setIfChanged(summonSlotCountAtom, player.summonsMinions);
  setIfChanged(summonRespawnMaxMsAtom, player.summonRespawnMaxMs);
  setIfSummonSlotsEqual(player.summonSlots);
  setIfChanged(sacredBuffPctAtom, player.sacredBuffPct);
  setIfChanged(sacredBuffActiveAtom, player.sacredBuffActive);
  setIfChanged(isChannelingAtom, player.isChanneling);
  setIfChanged(channelingPctAtom, player.channelingPct);
  setIfChanged(cannonChargePctAtom, player.cannonChargePct);
  setIfChanged(skillPointsAtom, player.skillPoints);

  setIfShallowArrayEqual(shieldsAtom, player.shields);
  setIfShallowArrayEqual(unlockedSkillsAtom, player.unlockedSkills);
  setIfShallowArrayEqual(runesOwnedAtom, player.runesOwned);
  setIfShallowArrayEqual(runeRecipesCraftedAtom, player.runeRecipesCrafted);
  setIfChanged(runePointBonusAtom, player.runePointBonus);
  setRunesEquipped(player.runesEquipped);
  setIfShallowArrayEqual(inventoryAtom, player.inventory);
  setIfShallowArrayEqual(unlockedRecipesAtom, player.unlockedRecipes);
  setIfShallowArrayEqual(bossesClearedAtom, player.bossesCleared);
  setIfBuffsEqual(activeBuffsAtom, player.activeBuffs);
  setIfShallowObjectEqual(passivesAtom, player.passives);
  setIfShallowObjectEqual(equipmentAtom, player.equipment);
  setIfShallowObjectEqual(itemUpgradesAtom, player.itemUpgrades ?? {});
  setIfShallowObjectEqual(biomeLevelAtom, player.biomeLevel);
  setIfShallowObjectEqual(biomeXPAtom, player.biomeXP);
  setIfShallowObjectEqual(questProgressAtom, player.questProgress);
  setIfShallowObjectEqual(essencesAtom, player.essences);

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
