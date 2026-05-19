import type { PlayerBuff } from '@mmo-idle/shared';
import { getCounter } from './combatState';
import type { World } from '../world/World';

// Must match the key used in cadencePrototype.ts
const CADENCE_ECHO_KEY = 'cadenceEcho';

/**
 * Run once per world tick (after all combat systems) to populate
 * player.activeBuffs from current player state and server-side CombatState.
 *
 * Add new buffs here as they are implemented — the client renders the array
 * as-is without knowing about specific mechanics.
 */
export function syncPlayerBuffs(world: World): void {
  for (const player of world.players.values()) {
    const buffs: PlayerBuff[] = [];
    const cs = world.playerCombatState.get(player.id);

    // ── Accelerando (cadence-light-t3-a) ──────────────────────────────────────
    // Stacking attack speed from cadence finishers. Permanent until death/re-equip.
    if (player.cadenceSpeedStacks > 0) {
      buffs.push({
        id:          'cadence-accelerando',
        label:       'Accel',
        stacks:      player.cadenceSpeedStacks,
        durationPct: -1,
        color:       '#00ffaa',
      });
    }

    // ── Sacred Cross burst (weapon effect) ────────────────────────────────────
    // Active during the Sacred Cross 3× damage window. sacredBuffPct doubles as
    // the duration remaining (100 = just started, 0 = expired).
    if (player.sacredBuffActive) {
      buffs.push({
        id:          'sacred-burst',
        label:       'Burst',
        stacks:      1,
        durationPct: player.sacredBuffPct,
        color:       '#ffdd44',
      });
    }

    // ── Rising Tide echo (cadence-balanced-t3-b) ──────────────────────────────
    // Post-finisher echo: next N attacks deal +50% damage. Shown as a stack count.
    if (cs) {
      const echo = getCounter(cs, CADENCE_ECHO_KEY);
      if (echo > 0) {
        buffs.push({
          id:          'cadence-echo',
          label:       'Echo',
          stacks:      echo,
          durationPct: -1,
          color:       '#4488ff',
        });
      }
    }

    player.activeBuffs = buffs;
  }
}
