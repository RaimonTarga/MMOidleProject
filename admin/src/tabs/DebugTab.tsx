import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { playersAtom } from '../state';
import { sendAdminAction } from '../socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function DebugTab() {
  const players = useAtomValue(playersAtom);
  const [nodeId, setNodeId] = useState('node-clearing');
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const target = useMemo(
    () => players.find((p) => p.id === targetPlayerId) ?? players[0] ?? null,
    [players, targetPlayerId],
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Node Operations</CardTitle>
          <p className="text-sm text-red-100/55">Regenerate monsters and boss state for a node.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={nodeId} onChange={(e) => setNodeId(e.target.value)} placeholder="node-clearing" />
          <Button variant="destructive" onClick={() => sendAdminAction({ kind: 'respawnNode', nodeId })}>
            Respawn Node
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Player Debug Tools</CardTitle>
          <p className="text-sm text-red-100/55">Equivalent to old dev debug buttons, but targetable.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-10 w-full rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 text-sm text-orange-50"
            value={target?.id ?? ''}
            onChange={(e) => setTargetPlayerId(e.target.value)}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} · {player.nodeId}
              </option>
            ))}
          </select>
          {!target && <p className="text-sm text-red-200/35">No players online.</p>}
          {target && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => sendAdminAction({ kind: 'refreshRecipes', targetPlayerId: target.id })}>
                Refresh Recipes
              </Button>
              <Button variant="secondary" onClick={() => sendAdminAction({ kind: 'equipPhaseTester', targetPlayerId: target.id })}>
                Equip Phase Tester
              </Button>
              <Button variant="secondary" onClick={() => sendAdminAction({ kind: 'goToTestRoom', targetPlayerId: target.id })}>
                Go To Test Room
              </Button>
              <Button variant="secondary" onClick={() => sendAdminAction({ kind: 'leaveTestRoom', targetPlayerId: target.id })}>
                Leave Test Room
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
