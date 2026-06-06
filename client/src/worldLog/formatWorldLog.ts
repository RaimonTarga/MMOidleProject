import type { WorldLogEvent } from '@mmo-idle/shared';
import { formatWorldLogEntry } from '@mmo-idle/shared';
import { combatLog } from '../combatLog';

export function applyWorldLogEvents(
  events: WorldLogEvent[],
  viewerId: string,
): void {
  for (const ev of events) {
    const formatted = formatWorldLogEntry(ev, viewerId);
    combatLog.push(formatted.kind, formatted.text, {
      headline: formatted.headline,
      headlineParts: formatted.headlineParts,
      detail: formatted.detail,
      damageType: formatted.damageType,
      targetName: formatted.targetName,
      sourceName: formatted.sourceName,
      mitigation: formatted.mitigation,
      glancing: formatted.glancing,
    });
  }
}
