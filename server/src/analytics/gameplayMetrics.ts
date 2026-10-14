import type { GameplayEvent, GameplayMetric } from '@mmo-idle/shared';

/** Additive, identity-free daily facts. Counts are events, never unique people. */
export function gameplayMetrics(e: GameplayEvent): GameplayMetric[] {
  const rows: GameplayMetric[] = [];
  function add(metric: string, dimension = '', value = 0): void {
    rows.push({ day: new Date(e.ts).toISOString().slice(0, 10), gameVersion: e.gameVersion, cohort: e.cohort, nodeId: e.nodeId, classId: e.classId, tier: e.tier, metric, dimension, count: 1, value });
  }
  const p = e.payload;
  switch (p.kind) {
    case 'session-start': add('sessions'); break;
    case 'session-end': add('session-end', p.reason, p.durationMs); break;
    case 'exposure': add('exposure-ms', '', p.durationMs); add('combat-ms', '', p.combatMs); break;
    case 'death': add('deaths', `${p.killerType ?? 'unknown'} / ${p.ability ?? p.cause}`); break;
    case 'encounter-start': add('attempt-start', p.bossType); break;
    case 'encounter-end': {
      const dimension = JSON.stringify([p.bossType, p.build.frame, p.build.range, p.partySize]);
      add(`attempt:${p.outcome}`, dimension, p.durationMs);
      add('boss-hp-at-end', dimension, p.bossHpFraction);
      break;
    }
    case 'decision':
      add('decision', `${p.action}:${p.choice ?? 'loadout'}`);
      if (p.afterFailure) add(`after-${p.afterFailure}`, `${p.action}:${p.choice ?? 'loadout'}`);
      if (p.action === 'skill') {
        for (const id of p.availableSkills) add('skill-eligible', id);
        if (p.choice) add('skill-chosen', p.choice);
      }
      break;
    case 'progression': add('progression', `${p.milestone}:${p.value}`, p.sessionElapsedMs); break;
    case 'resource':
      if (p.earned) add('resource-earned', p.resource, p.earned);
      if (p.spent) add('resource-spent', p.resource, p.spent);
      break;
  }
  return rows;
}
