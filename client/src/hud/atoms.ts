import { atom, getDefaultStore, type PrimitiveAtom } from 'jotai';
import type {
  CombatArchetype,
  EquipmentMap,
  EssenceType,
  NodeTelemetrySnapshot,
  PassiveMap,
  PlayerBuff,
  PlayerView,
  ShieldState,
  SubVariant,
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
export const nodeTelemetryAtom = atom<NodeTelemetrySnapshot | null>(null);
export const nodeLoadingAtom = atom<{ active: boolean; nodeId: string | null }>({
  active: false,
  nodeId: null,
});
export const tabResyncAtom = atom<{ active: boolean; startedAt: number | null }>({
  active: false,
  startedAt: null,
});

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

export const attackAtom = atom<number>(0);
export const onHitDamageAtom = atom<number>(0);
export const platingAtom = atom<number>(0);
export const damageReductionAtom = atom<number>(0);
export const attackRangeAtom = atom<number>(0);
export const attackCooldownAtom = atom<number>(0);
export const speedAtom = atom<number>(0);
export const evasionAtom = atom<number>(0);
export const evasionCountAtom = atom<number>(0);

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

export const sacredBuffPctAtom = atom<number>(0);
export const sacredBuffActiveAtom = atom<boolean>(false);

export const isChannelingAtom = atom<boolean>(false);
export const channelingPctAtom = atom<number>(0);

export const skillPointsAtom = atom<number>(0);
export const unlockedSkillsAtom = atom<string[]>([]);
export const passivesAtom = atom<PassiveMap>({});
export const inventoryAtom = atom<string[]>([]);
export const equipmentAtom = atom<EquipmentMap>({ ...DEFAULT_EQUIPMENT });
export const unlockedRecipesAtom = atom<string[]>([]);
export const biomeLevelAtom = atom<Record<string, number>>({});
export const biomeXPAtom = atom<Record<string, number>>({});
export const questProgressAtom = atom<Record<string, number>>({});
export const essencesAtom = atom<Record<EssenceType, number>>({ ...DEFAULT_ESSENCES });

export const activeBuffsAtom = atom<PlayerBuff[]>([]);
export const autoPathAtom = atom<string[] | null>(null);

export const skillTreeOpenAtom = atom<boolean>(false);
export const inventoryOpenAtom = atom<boolean>(false);
export const mapOpenAtom = atom<boolean>(false);
export const craftTabAtom = atom<'biome' | 'forge' | null>(null);
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
  store.set(attackAtom, 0);
  store.set(onHitDamageAtom, 0);
  store.set(platingAtom, 0);
  store.set(damageReductionAtom, 0);
  store.set(attackRangeAtom, 0);
  store.set(attackCooldownAtom, 0);
  store.set(speedAtom, 0);
  store.set(evasionAtom, 0);
  store.set(evasionCountAtom, 0);

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
  setIfShallowArrayEqual(unlockedSkillsAtom, []);
  setIfShallowArrayEqual(inventoryAtom, []);
  setIfShallowArrayEqual(unlockedRecipesAtom, []);
  setIfShallowArrayEqual(activeBuffsAtom, []);
  setIfShallowObjectEqual(passivesAtom, {});
  setIfShallowObjectEqual(equipmentAtom, { ...DEFAULT_EQUIPMENT });
  setIfShallowObjectEqual(biomeLevelAtom, {});
  setIfShallowObjectEqual(biomeXPAtom, {});
  setIfShallowObjectEqual(questProgressAtom, {});
  setIfShallowObjectEqual(essencesAtom, { ...DEFAULT_ESSENCES });
  setAutoPath(null);
  store.set(nodeLoadingAtom, { active: false, nodeId: null });
  store.set(tabResyncAtom, { active: false, startedAt: null });
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
  setIfChanged(attackAtom, player.attack);
  setIfChanged(onHitDamageAtom, player.onHitDamage);
  setIfChanged(platingAtom, player.plating);
  setIfChanged(damageReductionAtom, player.damageReduction);
  setIfChanged(attackRangeAtom, player.attackRange);
  setIfChanged(attackCooldownAtom, player.attackCooldown);
  setIfChanged(speedAtom, player.speed);
  setIfChanged(evasionAtom, player.evasion);
  setIfChanged(evasionCountAtom, player.evasionCount);

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
  setIfChanged(sacredBuffPctAtom, player.sacredBuffPct);
  setIfChanged(sacredBuffActiveAtom, player.sacredBuffActive);
  setIfChanged(isChannelingAtom, player.isChanneling);
  setIfChanged(channelingPctAtom, player.channelingPct);
  setIfChanged(skillPointsAtom, player.skillPoints);

  setIfShallowArrayEqual(shieldsAtom, player.shields);
  setIfShallowArrayEqual(unlockedSkillsAtom, player.unlockedSkills);
  setIfShallowArrayEqual(inventoryAtom, player.inventory);
  setIfShallowArrayEqual(unlockedRecipesAtom, player.unlockedRecipes);
  setIfBuffsEqual(activeBuffsAtom, player.activeBuffs);
  setIfShallowObjectEqual(passivesAtom, player.passives);
  setIfShallowObjectEqual(equipmentAtom, player.equipment);
  setIfShallowObjectEqual(biomeLevelAtom, player.biomeLevel);
  setIfShallowObjectEqual(biomeXPAtom, player.biomeXP);
  setIfShallowObjectEqual(questProgressAtom, player.questProgress);
  setIfShallowObjectEqual(essencesAtom, player.essences);
}
