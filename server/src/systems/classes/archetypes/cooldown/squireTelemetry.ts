/**
 * Dev-only counts of what the Squire's system does in real fights (OV-SQUIRE): each response's
 * outcome, the catches, the slams, and Resolve gained by source. Every minute of world time a
 * player's counts are written as one `squire-telemetry` log line and reset, so a lane's
 * server log shows the class firing. Off unless `NODE_ENV=development` or `SQUIRE_TELEMETRY=1`
 * (tests and production stay silent). Runtime only, never persisted or networked.
 */
import type { PlayerEntity } from '../../../../ecs/entity';
import { log } from '../../../../log';
import type { World } from '../../../../world/World';

const ENABLED = process.env.NODE_ENV === 'development' || process.env.SQUIRE_TELEMETRY === '1';
/** One line per player per this many world ticks (60 s at 10 Hz). */
const PERIOD_TICKS = 600;

const counts = new WeakMap<PlayerEntity, Record<string, number>>();

/** Add `amount` to one of the player's counters (`resp.<piece>.<outcome>`, `catch.<piece>`, `fill.<source>`, `slam`...). */
export function squireCount(player: PlayerEntity, key: string, amount = 1): void {
  if (!ENABLED || amount === 0) return;
  let c = counts.get(player);
  if (!c) counts.set(player, (c = {}));
  c[key] = (c[key] ?? 0) + amount;
}

/** Once a period, write each player's counts and start over. */
export function flushSquireTelemetry(world: World, player: PlayerEntity): void {
  if (!ENABLED || world.tickCounter % PERIOD_TICKS !== 0) return;
  const c = counts.get(player);
  if (!c || Object.keys(c).length === 0) return;
  const rounded: Record<string, number> = {};
  for (const key of Object.keys(c).sort()) rounded[key] = Math.round(c[key] * 100) / 100;
  log.info(`squire-telemetry ${player.isPlayer.name} node=${player.hasPosition.nodeId} ${JSON.stringify(rounded)}`);
  counts.delete(player);
}
