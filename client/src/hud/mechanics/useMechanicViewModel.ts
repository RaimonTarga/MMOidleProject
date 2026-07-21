import { useAtomValue } from 'jotai';
import { dotElementForPlayer, resolveDotClassProfile } from '@mmo-idle/shared';
import {
  ammoCountAtom,
  ammoMaxAtom,
  attackTargetIdAtom,
  cadenceCountAtom,
  cadenceEmpoweredArmedAtom,
  cadenceThresholdAtom,
  channelingPctAtom,
  combatArchetypeAtom,
  empoweredReadyAtom,
  energyCountAtom,
  energyMaxAtom,
  executionCooldownPctAtom,
  executionReadyAtom,
  flashShiftPctAtom,
  heatPctAtom,
  isChannelingAtom,
  laserOverheatedAtom,
  passivesAtom,
  selectedSubVariantAtom,
  summonActiveCountAtom,
  summonHealthAtom,
  summonSlotCountAtom,
  summonSlotsAtom,
  targetChillStacksAtom,
  targetDotStacksAtom,
  targetDotTickPctAtom,
  targetDotTickSerialAtom,
} from '../atoms';
import type { MechanicViewModel } from './types';

const CHILL_MAX_STACKS = 9;

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Selects authoritative HUD state and adapts it into one mechanic-specific
 * presentation model. Rendering components never read atoms or gameplay state.
 */
export function useMechanicViewModel(): MechanicViewModel | null {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const passives = useAtomValue(passivesAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const ammo = useAtomValue(ammoCountAtom);
  const ammoMax = useAtomValue(ammoMaxAtom);
  const heatPct = useAtomValue(heatPctAtom);
  const overheated = useAtomValue(laserOverheatedAtom);
  const activeCount = useAtomValue(summonActiveCountAtom);
  const slotCount = useAtomValue(summonSlotCountAtom);
  const summonSlots = useAtomValue(summonSlotsAtom);
  const summonHealth = useAtomValue(summonHealthAtom);
  const cadenceThreshold = useAtomValue(cadenceThresholdAtom);
  const cadenceCount = useAtomValue(cadenceCountAtom);
  const cadenceArmed = useAtomValue(cadenceEmpoweredArmedAtom);
  const isChanneling = useAtomValue(isChannelingAtom);
  const channelingPct = useAtomValue(channelingPctAtom);
  const executionReady = useAtomValue(executionReadyAtom);
  const executionPct = useAtomValue(executionCooldownPctAtom);
  const energy = useAtomValue(energyCountAtom);
  const energyMax = useAtomValue(energyMaxAtom);
  const empowered = useAtomValue(empoweredReadyAtom);
  const flashShiftPct = useAtomValue(flashShiftPctAtom);
  const targetId = useAtomValue(attackTargetIdAtom);
  const dotStacks = useAtomValue(targetDotStacksAtom);
  const dotTickPct = useAtomValue(targetDotTickPctAtom);
  const dotTickSerial = useAtomValue(targetDotTickSerialAtom);
  const chillStacks = useAtomValue(targetChillStacksAtom);

  switch (combatArchetype) {
    case 'cadence':
      return {
        kind: 'cadence',
        count: Math.max(0, cadenceCount),
        threshold: Math.max(2, cadenceThreshold || 2),
        armed: cadenceArmed,
      };

    case 'cooldown':
      return {
        kind: 'cooldown',
        isChanneling,
        channelRemainingPct: clampPct(100 - channelingPct),
        executionPct: clampPct(executionPct),
        executionReady,
      };

    case 'energy': {
      const isFlash = (passives['energy.flash'] ?? 0) > 0;
      const pct = isFlash
        ? clampPct(flashShiftPct)
        : clampPct(energyMax > 0 ? (energy / energyMax) * 100 : 0);
      return {
        kind: 'energy',
        value: Math.round(energy),
        max: Math.max(0, energyMax),
        pct,
        empowered,
        isFlash,
        shiftLabel: flashShiftPct >= 50 ? 'Red Shift' : 'Blue Shift',
        shiftColor: `rgb(${Math.round(70 + flashShiftPct * 1.85)}, ${Math.round(130 - flashShiftPct * 0.65)}, ${Math.round(255 - flashShiftPct * 1.95)})`,
      };
    }

    case 'reload':
      return {
        kind: 'reload',
        mode: (passives['reload.laser'] ?? 0) > 0 ? 'heat' : 'ammo',
        ammo: Math.max(0, ammo),
        ammoMax: Math.max(0, ammoMax),
        heatPct: clampPct(heatPct),
        overheated,
      };

    case 'summoner':
      return {
        kind: 'summoner',
        activeCount,
        slotCount,
        slots: summonSlots.map((slot, index) => ({
          ...slot,
          health: summonHealth.find((entry) => entry.slot === index) ?? null,
        })),
      };

    case 'dot': {
      const profile = resolveDotClassProfile(passives, selectedSubVariant);
      const element = dotElementForPlayer(passives, selectedSubVariant);
      const maxStacks = (passives['dot.poison-explosion'] ?? 0) > 0
        ? 10
        : (passives['dot.eternal-doom'] ?? 0) > 0
          ? 50
          : (passives['dot.permafrost'] ?? 0) > 0
            ? 1
            : profile.maxStacks;
      const showsChill = element === 'frost' && (passives['dot.freezing-cold'] ?? 0) > 0;
      return {
        kind: 'dot',
        element,
        stackLabel: element === 'fire'
          ? 'Burn'
          : element === 'frost'
            ? 'Frost'
            : element === 'doom'
              ? 'Doom'
              : 'Poison',
        stacks: Math.max(0, dotStacks),
        maxStacks,
        stackPct: clampPct(maxStacks > 0 ? (dotStacks / maxStacks) * 100 : 0),
        tickPct: clampPct(dotTickPct),
        tickSerial: dotTickSerial,
        hasTarget: targetId !== null,
        chillStacks: Math.max(0, chillStacks),
        chillMax: CHILL_MAX_STACKS,
        showsChill,
        frozen: showsChill && chillStacks >= CHILL_MAX_STACKS,
      };
    }

    default:
      return null;
  }
}
