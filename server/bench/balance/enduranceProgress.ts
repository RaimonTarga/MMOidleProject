import type { WorldLogEvent } from '@mmo-idle/shared';

/** Compact observed work; shield absorption is explicitly separate from useful HP damage. */
export class EnduranceProgress {
  kills = 0;
  firstKillMs: number | null = null;
  lastKillMs = 0;
  lastProgressMs = 0;
  longestKillGapMs = 0;
  longestHpProgressGapMs = 0;
  hpDamage = 0;
  absorbed = 0;
  damageEvents = 0;
  constructor(private playerId: string) {}
  ingest(e: WorldLogEvent, atMs: number) {
    if (e.kind === 'kill' && e.victim.actorType === 'monster') {
      this.kills++; this.firstKillMs ??= atMs;
      this.longestKillGapMs = Math.max(this.longestKillGapMs, atMs-this.lastKillMs); this.lastKillMs=atMs;
    }
    if (e.kind === 'damage' && e.target.actorType === 'monster' &&
      (e.source.id === this.playerId || e.source.ownerPlayerId === this.playerId)) {
      this.damageEvents++; this.hpDamage += e.hpDamage; this.absorbed += e.absorbed;
      if (e.hpDamage > 0) {
        this.longestHpProgressGapMs = Math.max(this.longestHpProgressGapMs,atMs-this.lastProgressMs);
        this.lastProgressMs=atMs;
      }
    }
  }
  snapshot(atMs: number) {
    return { kills:this.kills,firstKillMs:this.firstKillMs,hpDamage:this.hpDamage,absorbed:this.absorbed,
      damageEvents:this.damageEvents,lastKillMs:this.lastKillMs,lastHpProgressMs:this.lastProgressMs,
      longestKillGapMs:Math.max(this.longestKillGapMs,atMs-this.lastKillMs),
      longestHpProgressGapMs:Math.max(this.longestHpProgressGapMs,atMs-this.lastProgressMs) };
  }
}

export function endpointIntervals(endpoints: { atMs: number; work: { kills: number } }[], boundaries = [300000,900000,1800000]) {
  return boundaries.map((endMs,i,ends) => {
    const end=endpoints.find(e=>e.atMs===endMs), start=i ? endpoints.find(e=>e.atMs===ends[i-1]) : null;
    return {startMs:i ? ends[i-1] : 0,endMs,observed:!!end && (i===0 || !!start),
      kills:end && (i===0 || start) ? end.work.kills-(start?.work.kills??0) : null};
  });
}
