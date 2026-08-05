import type { SummonsMinions } from '../components/archetypes/summoner/summonsMinions';
import type { PassiveMap } from '../passives';
import type { SummonerSlotRole } from '../data/summoner';
import { relicRatingsFromPassives, resolveSummonerRelicProfile } from './relics';

const DEFAULT_RESPAWN_MS = 5000;

export interface SummonSlotView {
  active: boolean;
  /** 0–100 progress toward respawn; meaningful only when respawning. */
  respawnPct: number;
  /** Ms left on the respawn timer; 0 when active or queued without a timer. */
  respawnRemainingMs: number;
  slotId: string;
  role: SummonerSlotRole;
  /** 0 for the active reconstruction, 1+ for waiting FIFO positions, -1 otherwise. */
  queuePosition: number;
  /** Volatile Brood's one armed logical slot. */
  marked: boolean;
  /** Grand Ritual charges currently attached to this logical slot. */
  ritualCharges: number;
}

export function computeSummonRespawnMaxMs(passives: PassiveMap): number {
  let respawnMs = Math.max(0, Math.round(passives['summoner.minion-respawn-ms'] ?? DEFAULT_RESPAWN_MS));
  respawnMs = resolveSummonerRelicProfile(
    respawnMs,
    1,
    relicRatingsFromPassives(passives),
  ).respawnMs.after;
  return respawnMs;
}

export function projectSummonSlots(
  summons: SummonsMinions | undefined,
  passives: PassiveMap,
): SummonSlotView[] {
  if (!summons || summons.targetCount <= 0) return [];

  const slots: SummonSlotView[] = [];

  for (let i = 0; i < summons.targetCount; i++) {
    const active = summons.minionIds[i] !== '';
    const slotId = summons.slotIds[i] ?? `normal:${i}`;
    const reconstruction = summons.activeReconstruction?.slotId === slotId
      ? summons.activeReconstruction
      : undefined;
    const waitingIndex = summons.reconstructionQueue.indexOf(slotId);
    const respawnRemainingMs = reconstruction
      ? Math.max(0, reconstruction.durationMs - reconstruction.elapsedMs)
      : 0;
    const respawnPct = reconstruction && reconstruction.durationMs > 0
      ? Math.min(100, Math.round((reconstruction.elapsedMs / reconstruction.durationMs) * 100))
      : 0;
    slots.push({
      active,
      respawnPct,
      respawnRemainingMs,
      slotId,
      role: summons.slotRoles[i] ?? 'normal',
      queuePosition: reconstruction ? 0 : (waitingIndex >= 0 ? waitingIndex + 1 : -1),
      marked: summons.volatileMarkedSlotId === slotId,
      ritualCharges: Math.max(0, summons.ritualCharges?.[i] ?? 0),
    });
  }

  return slots;
}

export function countActiveSummons(slots: SummonSlotView[]): number {
  let n = 0;
  for (const slot of slots) {
    if (slot.active) n++;
  }
  return n;
}
