import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAtomValue } from 'jotai';
import type { AdminLogLevel } from '@mmo-idle/shared';
import { logsAtom } from '../state';
import { requestLogs } from '../socket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const LEVELS: Array<AdminLogLevel | 'all'> = ['all', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export function LogsTab() {
  const logs = useAtomValue(logsAtom);
  const [level, setLevel] = useState<AdminLogLevel | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (level !== 'all' && entry.level !== level) return false;
      if (!q) return true;
      return (
        entry.message.toLowerCase().includes(q) ||
        entry.logger.toLowerCase().includes(q) ||
        entry.nodeId?.toLowerCase().includes(q) ||
        entry.playerId?.toLowerCase().includes(q) ||
        entry.accountId?.toLowerCase().includes(q)
      );
    });
  }, [logs, level, search]);

  const chartOption = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const entry of filtered) {
      const label = new Date(Math.floor(entry.ts / 60_000) * 60_000).toLocaleTimeString();
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: [...buckets.keys()], axisLabel: { color: '#94a3b8' } },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{ type: 'line', smooth: true, data: [...buckets.values()], areaStyle: {} }],
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
    };
  }, [filtered]);

  return (
    <div className="grid grid-cols-[1fr_420px] gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Live Logs</CardTitle>
            <p className="text-sm text-red-100/55">{filtered.length} visible / {logs.length} loaded</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => requestLogs({ limit: 500, level: level === 'all' ? undefined : level, search })}
          >
            Query logdb
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="Search message, player, account, node..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select
              className="h-10 rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 text-sm text-orange-50"
              value={level}
              onChange={(e) => setLevel(e.target.value as AdminLogLevel | 'all')}
            >
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="admin-scrollbar max-h-[65vh] overflow-auto rounded-lg border border-red-950/70">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#120404] text-xs uppercase text-red-200/40">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Level</th>
                  <th className="px-3 py-2">Logger</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Context</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice().reverse().map((entry) => (
                  <tr key={entry.id} className="border-t border-red-950/70">
                    <td className="whitespace-nowrap px-3 py-2 text-red-100/55">{new Date(entry.ts).toLocaleTimeString()}</td>
                    <td className="px-3 py-2"><Badge variant={entry.level === 'error' || entry.level === 'fatal' ? 'danger' : entry.level === 'warn' ? 'warning' : 'secondary'}>{entry.level}</Badge></td>
                    <td className="px-3 py-2 text-orange-100/80">{entry.logger}</td>
                    <td className="px-3 py-2">{entry.message}</td>
                    <td className="px-3 py-2 text-xs text-red-200/35">{[entry.nodeId, entry.playerId, entry.accountId].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Log Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts option={chartOption} style={{ height: 260 }} />
        </CardContent>
      </Card>
    </div>
  );
}
