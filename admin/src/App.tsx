import { useEffect } from 'react';
import type * as React from 'react';
import { useAtomValue } from 'jotai';
import { Activity, Database, Shield, Users } from 'lucide-react';
import {
  connectedAtom,
  connectionErrorAtom,
  playersAtom,
  telemetryAtom,
} from './state';
import { connectAdminSocket, disconnectAdminSocket } from './socket';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { CharactersTab } from './tabs/CharactersTab';
import { DebugTab } from './tabs/DebugTab';
import { LogsTab } from './tabs/LogsTab';
import { OpsMapTab } from './tabs/OpsMapTab';
import { PlayersTab } from './tabs/PlayersTab';
import { WorldLogTab } from './tabs/WorldLogTab';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function App() {
  const connected = useAtomValue(connectedAtom);
  const error = useAtomValue(connectionErrorAtom);
  const players = useAtomValue(playersAtom);
  const telemetry = useAtomValue(telemetryAtom);

  useEffect(() => {
    connectAdminSocket();
    return () => disconnectAdminSocket();
  }, []);

  return (
    <div className="admin-shell min-h-screen">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-300" />
            <h1 className="text-3xl font-bold tracking-tight">MMO Idle Admin</h1>
            <Badge variant={connected ? 'default' : 'danger'}>{connected ? 'connected' : 'offline'}</Badge>
          </div>
          <p className="mt-1 text-sm text-red-100/55">Live operations, logs, telemetry, and player recovery tools.</p>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.3em] text-red-200/35">
          Unauthenticated
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Online Players" value={players.length} />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Tick CPU" value={`${telemetry?.process.totalTickCpuMs.toFixed(2) ?? '0.00'} ms`} />
        <StatCard icon={<Database className="h-5 w-5" />} label="Heap" value={`${telemetry?.process.heapUsedMb.toFixed(1) ?? '0.0'} MB`} />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Event Loop P99" value={`${telemetry?.process.eventLoopP99Ms.toFixed(2) ?? '0.00'} ms`} />
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="world-log">World Log</TabsTrigger>
          <TabsTrigger value="ops">Ops Map</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        <TabsContent value="logs"><LogsTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="world-log"><WorldLogTab /></TabsContent>
        <TabsContent value="ops"><OpsMapTab /></TabsContent>
        <TabsContent value="players"><PlayersTab /></TabsContent>
        <TabsContent value="characters"><CharactersTab /></TabsContent>
        <TabsContent value="debug"><DebugTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-red-400/10 p-2 text-red-200">{icon}</div>
        <div>
          <div className="text-xs uppercase text-red-200/40">{label}</div>
          <div className="text-xl font-semibold text-orange-50">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
