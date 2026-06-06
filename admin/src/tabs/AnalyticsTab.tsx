import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useAtomValue } from 'jotai';
import {
  BIOME_DATABASE,
  NODE_BIOMES,
  ULTIMATE_CLEAR_VOID_OVERLORD,
  bossClearKey,
  type AdminAnalyticsNodeHeatmapRow,
  type AdminAnalyticsSnapshot,
  type AdminCharacterRecord,
} from '@mmo-idle/shared';
import { analyticsAtom, charactersAtom } from '../state';
import { requestAnalytics, requestCharacters } from '../socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NODE_GRID_SIZE = 11;
const NODE_COORD_PATTERN = /^node-(\d+)-(\d+)$/;
const NODE_AXIS_LABELS = Array.from({ length: NODE_GRID_SIZE }, (_, index) => `${index}`);

export function AnalyticsTab() {
  const analytics = useAtomValue(analyticsAtom);
  const characters = useAtomValue(charactersAtom);
  const [gameVersion, setGameVersion] = useState<string>('all');

  useEffect(() => {
    requestAnalytics({ days: 30 });
    requestCharacters();
  }, []);

  const versionOptions = useMemo(() => {
    const versions = analytics?.versions ?? [];
    return versions.length > 0 ? versions : [analytics?.summary.gameVersion ?? 'unknown'];
  }, [analytics]);

  function refresh(): void {
    requestAnalytics({
      days: 30,
      gameVersion: gameVersion === 'all' ? undefined : gameVersion,
    });
    requestCharacters();
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-100/55">No analytics snapshot loaded yet.</p>
          <Button onClick={refresh}>Query Analytics</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Analytics</h2>
          <p className="text-sm text-red-100/55">
            Rolling {analytics.summary.windowDays} day window · generated {new Date(analytics.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 text-sm text-orange-50"
            value={gameVersion}
            onChange={(event) => setGameVersion(event.target.value)}
          >
            <option value="all">All versions</option>
            {versionOptions.map((version) => (
              <option key={version} value={version}>{version}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={refresh}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Avg Playtime" value={formatDuration(analytics.summary.averagePlaytimeMs)} />
        <SummaryCard label="Sessions" value={analytics.summary.sessions} />
        <SummaryCard label="Active Accounts" value={analytics.summary.activeAccounts} />
        <SummaryCard label="Deaths / Progression" value={`${analytics.summary.deaths} / ${analytics.summary.progressionEvents}`} />
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-4">
        <ChartCard title="Perk Path Sankey">
          {analytics.perkSankey.links.length > 0 ? (
            <ReactECharts option={sankeyOption(analytics)} style={{ height: 420 }} />
          ) : (
            <EmptyChart message="No skill unlock analytics yet." />
          )}
        </ChartCard>

        <ChartCard title="Popular Biomes">
          {analytics.popularBiomes.length > 0 ? (
            <ReactECharts option={biomeOption(analytics)} style={{ height: 420 }} />
          ) : (
            <EmptyChart message="No biome visit analytics yet." />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-[1fr_420px] gap-4">
        <ChartCard title="Rolling 30 Day Activity">
          <ReactECharts option={activityOption(analytics)} style={{ height: 360 }} />
        </ChartCard>

        <ChartCard title="Dropoff Nodes">
          {analytics.dropoffs.length > 0 ? (
            <ReactECharts option={dropoffOption(analytics)} style={{ height: 360 }} />
          ) : (
            <EmptyChart message="No session dropoff analytics yet." />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Progress Completion Heatmap">
          <NodeHeatmap
            rows={buildCompletionHeatmap(characters)}
            valueLabel="completed"
            emptyMessage="No persisted character progress yet."
          />
        </ChartCard>

        <ChartCard title="Node Visit Heatmap">
          <NodeHeatmap
            rows={analytics.nodeVisitHeatmap}
            valueLabel="visited"
            emptyMessage="No node visit analytics yet."
          />
        </ChartCard>
      </div>
    </div>
  );
}

function NodeHeatmap({
  rows,
  valueLabel,
  emptyMessage,
}: {
  rows: AdminAnalyticsNodeHeatmapRow[];
  valueLabel: string;
  emptyMessage: string;
}) {
  const gridRows = rows.filter((row) => nodeCoord(row.nodeId) !== null);
  const hasData = gridRows.some((row) => row.accounts > 0 || row.events > 0);
  if (!hasData) return <EmptyChart message={emptyMessage} />;

  return (
    <div className="grid grid-cols-[minmax(300px,360px)_1fr] gap-4">
      <ReactECharts option={nodeHeatmapOption(gridRows, valueLabel)} style={{ height: 420 }} />
      <div className="admin-scrollbar max-h-[420px] overflow-auto rounded-lg border border-red-950/70">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#120404] uppercase text-red-200/40">
            <tr>
              <th className="px-2 py-2">Node</th>
              <th className="px-2 py-2">Biome</th>
              <th className="px-2 py-2">Accounts</th>
              <th className="px-2 py-2">Events</th>
            </tr>
          </thead>
          <tbody>
            {[...gridRows]
              .sort((a, b) => b.accounts - a.accounts || b.events - a.events || a.nodeId.localeCompare(b.nodeId))
              .slice(0, 20)
              .map((row) => (
                <tr key={row.nodeId} className="border-t border-red-950/70">
                  <td className="px-2 py-2 font-mono">{row.nodeId}</td>
                  <td className="px-2 py-2">{row.biomeName}{row.isDungeon ? ' dungeon' : ''}</td>
                  <td className="px-2 py-2">{row.accounts}</td>
                  <td className="px-2 py-2">{row.events}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface NodeHeatmapDatum {
  value: [number, number, number];
  nodeId: string;
  biomeName: string;
  biomeTier: number;
  isDungeon: boolean;
  accounts: number;
  events: number;
}

interface NodeHeatmapTooltipParam {
  data?: NodeHeatmapDatum;
}

function nodeHeatmapOption(
  rows: AdminAnalyticsNodeHeatmapRow[],
  valueLabel: string,
): EChartsOption {
  const maxAccounts = Math.max(1, ...rows.map((row) => row.accounts));
  const data: NodeHeatmapDatum[] = rows
    .map((row) => {
      const coord = nodeCoord(row.nodeId);
      if (!coord) return null;
      return {
        value: [coord.col, coord.row, row.accounts],
        nodeId: row.nodeId,
        biomeName: row.biomeName,
        biomeTier: row.biomeTier,
        isDungeon: row.isDungeon,
        accounts: row.accounts,
        events: row.events,
      };
    })
    .filter((datum): datum is NodeHeatmapDatum => datum !== null);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: (params: unknown) => {
        const dataPoint = (params as NodeHeatmapTooltipParam).data;
        if (!dataPoint) return '';
        const tier = dataPoint.biomeTier === 0 ? 'Clearing' : `Tier ${dataPoint.biomeTier}`;
        const dungeon = dataPoint.isDungeon ? ' dungeon' : '';
        return [
          `${dataPoint.nodeId} · ${dataPoint.biomeName}${dungeon}`,
          `${tier}`,
          `${dataPoint.accounts} accounts ${valueLabel}`,
          `${dataPoint.events} events`,
        ].join('<br/>');
      },
    },
    grid: { left: 34, right: 18, top: 16, bottom: 92, containLabel: false },
    xAxis: {
      type: 'category',
      data: NODE_AXIS_LABELS,
      splitArea: { show: true },
      axisLabel: { color: '#94a3b8', fontFamily: 'monospace' },
      axisLine: { lineStyle: { color: '#3f1d1b' } },
      splitLine: { show: true, lineStyle: { color: '#3f1d1b' } },
    },
    yAxis: {
      type: 'category',
      data: NODE_AXIS_LABELS,
      inverse: true,
      splitArea: { show: true },
      axisLabel: { color: '#94a3b8', fontFamily: 'monospace' },
      axisLine: { lineStyle: { color: '#3f1d1b' } },
      splitLine: { show: true, lineStyle: { color: '#3f1d1b' } },
    },
    visualMap: {
      type: 'piecewise',
      min: 0,
      max: maxAccounts,
      splitNumber: Math.min(5, maxAccounts + 1),
      orient: 'horizontal',
      left: 'center',
      bottom: 18,
      itemGap: 8,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: '#fecaca' },
      inRange: {
        color: ['#3b0b0b', '#7f1d1d', '#c2410c', '#f97316', '#fed7aa'],
      },
    },
    series: [{
      name: 'Node progress',
      type: 'heatmap',
      data,
      label: {
        show: true,
        formatter: (params: unknown) => {
          const dataPoint = (params as NodeHeatmapTooltipParam).data;
          if (!dataPoint) return '';
          return dataPoint.biomeTier === 0 ? `★\n${dataPoint.accounts}` : `T${dataPoint.biomeTier}\n${dataPoint.accounts}`;
        },
        color: '#fff7ed',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 13,
      },
      itemStyle: {
        borderColor: '#451a16',
        borderWidth: 1,
        borderRadius: 4,
      },
      emphasis: {
        itemStyle: {
          borderColor: '#fed7aa',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(249, 115, 22, 0.45)',
        },
      },
    }],
  };
}

function nodeCoord(nodeId: string): { row: number; col: number } | null {
  const match = NODE_COORD_PATTERN.exec(nodeId);
  if (!match) return null;
  const row = Number(match[1]);
  const col = Number(match[2]);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  if (row < 0 || row >= NODE_GRID_SIZE || col < 0 || col >= NODE_GRID_SIZE) return null;
  return { row, col };
}

function buildCompletionHeatmap(
  characters: AdminCharacterRecord[],
): AdminAnalyticsNodeHeatmapRow[] {
  const completedAccountsByNode = new Map<string, Set<string>>();
  for (const character of characters) {
    const completed = completedNodesForCharacter(character);
    for (const nodeId of completed) {
      let accounts = completedAccountsByNode.get(nodeId);
      if (!accounts) {
        accounts = new Set<string>();
        completedAccountsByNode.set(nodeId, accounts);
      }
      accounts.add(character.accountId);
    }
  }

  return Object.entries(NODE_BIOMES)
    .map(([nodeId, info]) => {
      const biome = BIOME_DATABASE.get(info.biomeGroup);
      const accounts = completedAccountsByNode.get(nodeId)?.size ?? 0;
      return {
        nodeId,
        biomeGroup: info.biomeGroup,
        biomeName: biome?.name ?? info.biomeGroup,
        biomeTier: info.biomeTier,
        isDungeon: info.isDungeon === true,
        accounts,
        events: accounts,
      };
    })
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));
}

function completedNodesForCharacter(character: AdminCharacterRecord): Set<string> {
  const completed = new Set(character.clearedNodes);
  for (const [nodeId, info] of Object.entries(NODE_BIOMES)) {
    if (!info.isDungeon) continue;
    const token = bossClearKey(info.biomeGroup, info.biomeTier);
    if (character.bossesCleared.includes(token)) completed.add(nodeId);
    if (
      info.bossTypeId === 'void-overlord' &&
      character.bossesCleared.includes(ULTIMATE_CLEAR_VOID_OVERLORD)
    ) {
      completed.add(nodeId);
    }
  }
  return completed;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase text-red-200/40">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-orange-50">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-red-950/70 bg-red-950/25 text-sm text-red-200/35">
      {message}
    </div>
  );
}

function sankeyOption(snapshot: AdminAnalyticsSnapshot) {
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', triggerOn: 'mousemove' },
    series: [{
      type: 'sankey',
      nodeAlign: 'justify',
      emphasis: { focus: 'adjacency' },
      data: snapshot.perkSankey.nodes,
      links: snapshot.perkSankey.links,
      lineStyle: { color: 'gradient', curveness: 0.5 },
      label: { color: '#cbd5e1' },
    }],
  };
}

function biomeOption(snapshot: AdminAnalyticsSnapshot) {
  const rows = snapshot.popularBiomes.slice(0, 12).reverse();
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    yAxis: { type: 'category', data: rows.map((row) => row.biomeName), axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'bar', data: rows.map((row) => row.visits), itemStyle: { color: '#22d3ee' } }],
    grid: { left: 100, right: 20, top: 20, bottom: 30 },
  };
}

function activityOption(snapshot: AdminAnalyticsSnapshot) {
  const days = snapshot.rolling30d.map((row) => row.day.slice(5));
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#94a3b8' } },
    xAxis: { type: 'category', data: days, axisLabel: { color: '#94a3b8' } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      { name: 'Active accounts', type: 'line', smooth: true, data: snapshot.rolling30d.map((row) => row.activeAccounts) },
      { name: 'Peak players', type: 'line', smooth: true, data: snapshot.rolling30d.map((row) => row.peakPlayers) },
      { name: 'Deaths', type: 'line', smooth: true, data: snapshot.rolling30d.map((row) => row.deaths) },
      { name: 'Progression', type: 'line', smooth: true, data: snapshot.rolling30d.map((row) => row.progressionEvents) },
      { name: 'Dropoffs', type: 'line', smooth: true, data: snapshot.rolling30d.map((row) => row.dropoffs) },
    ],
    grid: { left: 45, right: 20, top: 45, bottom: 30 },
  };
}

function dropoffOption(snapshot: AdminAnalyticsSnapshot) {
  const rows = snapshot.dropoffs.slice(0, 10).reverse();
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    yAxis: { type: 'category', data: rows.map((row) => `${row.biomeName} ${row.nodeId}`), axisLabel: { color: '#94a3b8' } },
    series: [{ type: 'bar', data: rows.map((row) => row.dropoffs), itemStyle: { color: '#f97316' } }],
    grid: { left: 150, right: 20, top: 20, bottom: 30 },
  };
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
