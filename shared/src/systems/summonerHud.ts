import type { SummonsMinions } from '../components/archetypes/summoner/summonsMinions';
import type { PassiveMap } from '../passives';

const DEFAULT_RESPAWN_MS = 5000;

export interface SummonSlotView {
  active: boolean;
  /** 0–100 progress toward respawn; meaningful only when respawning. */
  respawnPct: number;
  /** Ms left on the respawn timer; 0 when active or queued without a timer. */
  respawnRemainingMs: number;
}

export function computeSummonRespawnMaxMs(passives: PassiveMap): number {
  let respawnMs = Math.max(0, Math.round(passives['summoner.minion-respawn-ms'] ?? DEFAULT_RESPAWN_MS));
  if (passives['summoner.stone-sentinel']) {
    respawnMs = Math.max(
      0,
      Math.round(respawnMs * (passives['summoner.sentinel-respawn-mult'] ?? 0.5)),
    );
  }
  return respawnMs;
}

export function projectSummonSlots(
  summons: SummonsMinions | undefined,
  passives: PassiveMap,
): SummonSlotView[] {
  if (!summons || summons.targetCount <= 0) return [];

  const respawnMaxMs = computeSummonRespawnMaxMs(passives);
  const slots: SummonSlotView[] = [];

  for (let i = 0; i < summons.targetCount; i++) {
    const active = summons.minionIds[i] !== '';
    const respawnRemainingMs = active ? 0 : Math.max(0, summons.respawnTimers[i] ?? 0);
    const respawnPct =
      !active && respawnRemainingMs > 0 && respawnMaxMs > 0
        ? Math.min(100, Math.round((1 - respawnRemainingMs / respawnMaxMs) * 100))
        : 0;
    slots.push({ active, respawnPct, respawnRemainingMs });
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
