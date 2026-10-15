import { useAtomValue } from 'jotai';
import { dotElementForPlayer, classConfigContextFromState } from '@mmo-idle/shared';
import { slingerClipColor, slingerClipName } from '../../ui/slingerClipColor';
import {
  ammoCountAtom,
  ammoMaxAtom,
  attackTargetIdAtom,
  cadenceCountAtom,
  cadenceEmpoweredArmedAtom,
  cadenceThresholdAtom,
  channelingPctAtom,
  classConfigAtom,
  combatArchetypeAtom,
  disciplineIdAtom,
  energyCountAtom,
  energyMaxAtom,
  executionCooldownPctAtom,
  executionReadyAtom,
  isChannelingAtom,
  localPlayerViewAtom,
  passivesAtom,
  selectedSubVariantAtom,
  summonActiveCountAtom,
  summonHealthAtom,
  summonSlotCountAtom,
  summonSlotsAtom,
  targetDotStacksAtom,
  targetDotTickPctAtom,
  targetDotTickSerialAtom,
  unlockedSkillsAtom,
} from '../atoms';
import { orderResourceFor } from '../orderResource';
import type { MechanicViewModel } from './types';

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Selects authoritative HUD state and adapts it into one mechanic-specific
 * presentation model. Rendering components never read atoms or gameplay state.
 */
export function useMechanicViewModel(): MechanicViewModel | null {
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const classConfig = useAtomValue(classConfigAtom);
  const playerView = useAtomValue(localPlayerViewAtom);
  const passives = useAtomValue(passivesAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const ammo = useAtomValue(ammoCountAtom);
  const ammoMax = useAtomValue(ammoMaxAtom);
  const activeCount = useAtomValue(summonActiveCountAtom);
  const slotCount = useAtomValue(summonSlotCountAtom);
  const summonSlots = useAtomValue(summonSlotsAtom);
  const summonHealth = useAtomValue(summonHealthAtom);
  const disciplineId = useAtomValue(disciplineIdAtom);
  const cadenceThreshold = useAtomValue(cadenceThresholdAtom);
  const cadenceCount = useAtomValue(cadenceCountAtom);
  const cadenceArmed = useAtomValue(cadenceEmpoweredArmedAtom);
  const isChanneling = useAtomValue(isChannelingAtom);
  const channelingPct = useAtomValue(channelingPctAtom);
  const executionReady = useAtomValue(executionReadyAtom);
  const executionPct = useAtomValue(executionCooldownPctAtom);
  const energy = useAtomValue(energyCountAtom);
  const energyMax = useAtomValue(energyMaxAtom);
  const targetId = useAtomValue(attackTargetIdAtom);
  const dotStacks = useAtomValue(targetDotStacksAtom);
  const dotTickPct = useAtomValue(targetDotTickPctAtom);
  const dotTickSerial = useAtomValue(targetDotTickSerialAtom);

  switch (combatArchetype) {
    case 'cadence':
      return {
        kind: 'cadence',
        count: Math.max(0, cadenceCount),
        threshold: Math.max(2, cadenceThreshold || 2),
        armed: cadenceArmed,
        resource: orderResourceFor(disciplineId, {
          lit: playerView?.cadenceLit ?? false,
          edge: playerView?.cadenceEdge ?? 0,
          momentum: playerView?.cadenceMomentum ?? 0,
        }),
      };

    case 'cooldown':
      return {
        kind: 'cooldown',
        isChanneling,
        channelRemainingPct: clampPct(100 - channelingPct),
        executionPct: clampPct(executionPct),
        executionReady,
        responses: classConfig?.system.kind === 'responses',
        resolve: Math.max(0, playerView?.resolve ?? 0),
        resolveMax: Math.max(0, playerView?.resolveMax ?? 0),
      };

    case 'energy':
      return {
        kind: 'energy',
        value: Math.round(energy),
        max: Math.max(0, energyMax),
        pct: clampPct(energyMax > 0 ? (energy / energyMax) * 100 : 0),
      };

    case 'reload': {
      const loadout = classConfig?.system.kind === 'loadout';
      const clipId = loadout ? playerView?.reloadClip ?? '' : '';
      const nextId = loadout ? playerView?.reloadNextClip ?? '' : '';
      return {
        kind: 'reload',
        ammo: Math.max(0, ammo),
        ammoMax: Math.max(0, ammoMax),
        loadout,
        clipColor: slingerClipColor(clipId),
        nextClipColor: slingerClipColor(nextId),
        clipName: slingerClipName(clipId),
        nextClipName: slingerClipName(nextId),
        reloadRemainingMs: Math.max(0, playerView?.reloadRemainingMs ?? 0),
        reloadDurationMs: Math.max(0, playerView?.reloadDurationMs ?? 0),
      };
    }

    case 'summoner':
      return {
        kind: 'summoner',
        specialization: null,
        activeCount,
        slotCount,
        slots: summonSlots.map((slot, index) => ({
          ...slot,
          health: summonHealth.find((entry) => entry.slot === index) ?? null,
        })),
      };

    case 'dot': {
      const element = dotElementForPlayer(passives, selectedSubVariant);
      const maxStacks = (playerView ? classConfigContextFromState(playerView)?.budget ?? 0 : 0)
        + Math.round(passives['apprentice.cap-extra'] ?? 0);
      return {
        kind: 'dot',
        element,
        stackLabel: 'Sigils',
        stacks: Math.max(0, dotStacks),
        maxStacks,
        stackPct: clampPct(maxStacks > 0 ? (dotStacks / maxStacks) * 100 : 0),
        tickPct: clampPct(dotTickPct),
        tickSerial: dotTickSerial,
        hasTarget: targetId !== null,
      };
    }

    default:
      return null;
  }
}
