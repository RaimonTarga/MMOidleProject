import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { GameplayMetric, GameplayEvent, GameplayCohort } from '@mmo-idle/shared';
import { gameplayAtom } from '../state';
import { requestGameplay } from '../socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GameplayTab() {
  const snapshot = useAtomValue(gameplayAtom);
  const [version, setVersion] = useState('');
  const [cohort, setCohort] = useState<GameplayCohort>('human');
  const [days, setDays] = useState(30);
  const [classId, setClassId] = useState('');
  const [tier, setTier] = useState('');
  const loaded = snapshot?.days === days && snapshot?.cohort === cohort && snapshot?.gameVersion === (version || null);
  useEffect(() => { requestGameplay({ days, cohort, gameVersion: version || undefined }); }, [days, cohort, version]);
  const metrics = useMemo(() => (loaded ? snapshot?.metrics ?? [] : []).filter(m => (!classId || m.classId === classId) && (!tier || m.tier === Number(tier))), [snapshot, loaded, classId, tier]);
  const nodes = new Map<string, { deaths: number; ms: number }>();
  const bosses = new Map<string, { victory: number; death: number; retreat: number; disconnect: number; interrupted: number; ms: number }>();
  const skills = new Map<string, { eligible: number; chosen: number }>();
  for (const m of metrics) {
    const n = nodes.get(m.nodeId) ?? { deaths: 0, ms: 0 };
    if (m.metric === 'deaths') n.deaths += m.count;
    if (m.metric === 'exposure-ms') n.ms += m.value;
    nodes.set(m.nodeId, n);
    if (m.metric.startsWith('attempt:')) {
      const key = `${m.classId} T${m.tier} · ${bossLabel(m.dimension)}`;
      const row = bosses.get(key) ?? { victory: 0, death: 0, retreat: 0, disconnect: 0, interrupted: 0, ms: 0 };
      const outcome = m.metric.slice(8) as 'victory' | 'death' | 'retreat' | 'disconnect' | 'interrupted';
      row[outcome] += m.count;
      if (outcome === 'victory') row.ms += m.value;
      bosses.set(key, row);
    }
    if (m.metric === 'skill-eligible' || m.metric === 'skill-chosen') {
      const row = skills.get(m.dimension) ?? { eligible: 0, chosen: 0 };
      if (m.metric === 'skill-eligible') row.eligible += m.count; else row.chosen += m.count;
      skills.set(m.dimension, row);
    }
  }
  const recent = (snapshot?.recent ?? []).filter(e => (!classId || e.classId === classId) && (!tier || e.tier === Number(tier)));
  return <div className="space-y-4">
    <h2 className="text-xl font-semibold">Gameplay balance</h2>
    <p className="text-sm text-red-100/60">Authoritative gameplay only. Rates describe observed outcomes, not player intent. Detailed records last 90 days; daily totals last 365 days. Counts are events, not unique players.</p>
    <div className="flex flex-wrap gap-3">
      <Select label="Cohort" value={cohort} onChange={v => setCohort(v as GameplayCohort)} options={['human', 'test']} />
      <Select label="Days" value={String(days)} onChange={v => setDays(Number(v))} options={['7', '30', '90', '365']} />
      <Select label="Version" value={version} onChange={setVersion} options={snapshot?.versions ?? []} all />
      <Select label="Class" value={classId} onChange={setClassId} options={[...new Set(snapshot?.metrics.map(m => m.classId))].sort()} all />
      <Select label="Tier" value={tier} onChange={setTier} options={[...new Set(snapshot?.metrics.map(m => String(m.tier)))].sort()} all />
      <Button onClick={() => requestGameplay({ days, cohort, gameVersion: version || undefined })}>Refresh</Button>
      <Button variant="secondary" disabled={!snapshot || !loaded} onClick={() => {
        const url = URL.createObjectURL(new Blob([JSON.stringify({ ...snapshot, metrics, recent }, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'gameplay-balance.json'; a.click(); URL.revokeObjectURL(url);
      }}>Export view</Button>
    </div>
    {!snapshot || !loaded ? <p>Loading gameplay analytics…</p> : <>
      <p className="text-sm">Writer this process: {snapshot.writer.queued} queued · {snapshot.writer.inserted} acknowledged · {snapshot.writer.failedBatches} failed batches · {snapshot.writer.dropped} dropped · Last write {snapshot.writer.lastSuccessAt ? new Date(snapshot.writer.lastSuccessAt).toLocaleString() : 'none'}</p>
      {snapshot.writer.dropped > 0 && <p className="text-amber-300">Some telemetry was lost. Interpret counts as incomplete.</p>}
      {metrics.length === 0 && <p>No gameplay data for these filters.</p>}
      <Table title="Boss outcomes by starting class, tier, frame, range and party size" heads={['Build / boss', 'Wins', 'Deaths', 'Retreats', 'Disconnects', 'Interrupted', 'Win rate', 'Mean victory time']} rows={[...bosses].map(([label, b]) => [label, b.victory, b.death, b.retreat, b.disconnect, b.interrupted, percent(b.victory, b.victory + b.death + b.retreat), b.victory ? duration(b.ms / b.victory) : 'No victories'])} />
      <p className="text-xs text-red-100/60">Win-rate denominator: victories + deaths + retreats. Disconnects and interruptions are shown separately. A retreat closes after leaving the node or 10 seconds without boss engagement.</p>
      <Table title="Observed attempts through first boss clear" heads={['Boss', 'Class', 'Tier', 'Characters who cleared', 'Mean attempts']} rows={snapshot.firstClears.filter(r => (!classId || r.classId === classId) && (!tier || r.tier === Number(tier))).map(r => [r.bossType, r.classId, r.tier, r.characters, r.meanAttempts.toFixed(1)])} />
      <p className="text-xs text-red-100/60">First-clear counts use the selected detailed-data window (at most 90 days), grouped by class/tier. Earlier attempts and attempts under another class/tier are outside that group; this is not a lifetime total.</p>
      <Table title="Death hotspots, normalized by observed time alive" heads={['Node', 'Deaths', 'Hours', 'Deaths / hour']} rows={[...nodes].filter(([, n]) => n.deaths || n.ms).sort((a,b) => b[1].deaths / Math.max(1,b[1].ms) - a[1].deaths / Math.max(1,a[1].ms)).map(([node, n]) => [node, n.deaths, (n.ms / 3_600_000).toFixed(2), n.ms ? (n.deaths / (n.ms / 3_600_000)).toFixed(2) : 'Unknown'])} />
      <Table title="Skill choices at eligible decision points" heads={['Skill', 'Times available', 'Times chosen', 'Selection rate']} rows={[...skills].map(([id, s]) => [id, s.eligible, s.chosen, percent(s.chosen, s.eligible)])} />
      <MetricTable title="Accepted decisions" metrics={metrics.filter(m => m.metric === 'decision')} />
      <MetricTable title="Decisions after a failure, before the next boss attempt" metrics={metrics.filter(m => m.metric.startsWith('after-'))} />
      <MetricTable title="Resources earned and spent" metrics={metrics.filter(m => m.metric.startsWith('resource-'))} values />
      <Table title="Progression milestones" heads={['Milestone', 'Occurrences', 'Mean session time to milestone']} rows={group(metrics.filter(m => m.metric === 'progression')).map(m => [m.dimension, m.count, duration(m.value / m.count)])} />
      <Table title="Time spent at each progression tier" heads={['Tier', 'Hours alive']} rows={[...new Set(metrics.map(m => m.tier))].sort((a,b) => a-b).map(t => [t, (metrics.filter(m => m.tier === t && m.metric === 'exposure-ms').reduce((sum,m) => sum + m.value,0) / 3_600_000).toFixed(2)])} />
      <p className="text-xs text-red-100/60">Milestone time is elapsed time in that session, not lifetime time-to-tier. Resource totals measure wallet changes observed during play.</p>
      <Card><CardHeader><CardTitle>Recent deaths, attempts and decisions</CardTitle></CardHeader><CardContent className="space-y-2">
        <p className="text-sm">Latest 200 matching detailed events before class/tier filtering. Expand a record to inspect its build, statuses, recent damage or choices.</p>
        {recent.map(e => <details key={e.id} className="rounded border border-red-900/50 p-2"><summary className="cursor-pointer">{new Date(e.ts).toLocaleString()} · {e.nodeId} · {eventLabel(e)}</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({ character: e.characterId, session: e.sessionId, ...e.payload }, null, 2)}</pre></details>)}
      </CardContent></Card>
    </>}
  </div>;
}
function bossLabel(value: string): string {
  try { const [boss, frame, range, party] = JSON.parse(value); return `${boss} · ${frame ?? 'base'} / ${range ?? 'base'} · party ${party}`; } catch { return value; }
}
function eventLabel(e: GameplayEvent): string {
  const p = e.payload;
  if (p.kind === 'death') return `Death: ${p.killerType ?? 'unknown'} / ${p.ability ?? p.cause}`;
  if (p.kind === 'encounter-end') return `${p.bossType}: ${p.outcome}`;
  if (p.kind === 'decision') return `${p.action}: ${p.choice ?? 'loadout changed'}`;
  return p.kind;
}
function percent(n: number, d: number): string { return d ? `${(100 * n / d).toFixed(1)}% (n=${d})` : 'No observations'; }
function duration(ms: number): string { return `${(ms / 60_000).toFixed(1)} min`; }
function group(metrics: GameplayMetric[]): GameplayMetric[] {
  const result = new Map<string, GameplayMetric>();
  for (const m of metrics) {
    const key = `${m.metric}:${m.dimension}`;
    const row = result.get(key);
    if (row) { row.count += m.count; row.value += m.value; } else result.set(key, { ...m });
  }
  return [...result.values()].sort((a,b) => b.count - a.count);
}
function MetricTable({ title, metrics, values = false }: { title: string; metrics: GameplayMetric[]; values?: boolean }) {
  return <Table title={title} heads={['Metric', 'Choice / resource', 'Events', ...(values ? ['Amount'] : [])]} rows={group(metrics).map(m => [m.metric, m.dimension, m.count, ...(values ? [m.value.toFixed(1)] : [])])} />;
}
function Table({ title, heads, rows }: { title: string; heads: string[]; rows: (string | number)[][] }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{heads.map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={i} className="border-t border-red-900/40">{row.map((cell,j) => <td key={j} className="p-2">{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p>No observations.</p>}</CardContent></Card>;
}
function Select({ label, value, onChange, options, all = false }: { label: string; value: string; onChange: (v: string) => void; options: string[]; all?: boolean }) {
  return <label className="text-sm">{label} <select className="rounded border bg-black p-2" value={value} onChange={e => onChange(e.target.value)}>{all && <option value="">All</option>}{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>;
}
