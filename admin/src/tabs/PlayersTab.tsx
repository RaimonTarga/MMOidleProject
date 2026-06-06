import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { AdminAction, AdminPlayerSummary } from '@mmo-idle/shared';
import { actionResultsAtom, playersAtom } from '../state';
import { requestPlayers, sendAdminAction } from '../socket';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function PlayersTab() {
  const players = useAtomValue(playersAtom);
  const results = useAtomValue(actionResultsAtom);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) =>
      [p.id, p.accountId, p.name, p.nodeId, p.combatArchetype]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [players, search]);

  return (
    <div className="grid grid-cols-[1fr_360px] gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Logged-in Players</CardTitle>
            <p className="text-sm text-red-100/55">{filtered.length} visible / {players.length} online</p>
          </div>
          <Button variant="secondary" onClick={requestPlayers}>Refresh</Button>
        </CardHeader>
        <CardContent>
          <Input
            className="mb-4"
            placeholder="Search name, socket id, account id, node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="admin-scrollbar max-h-[68vh] overflow-auto rounded-lg border border-red-950/70">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#120404] text-xs uppercase text-red-200/40">
                <tr>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Node</th>
                  <th className="px-3 py-2">HP</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Action Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.length === 0 && <p className="text-sm text-red-200/35">No admin actions yet.</p>}
          {results.map((result) => (
            <div key={result.requestId} className="rounded-lg border border-red-950/70 bg-red-950/25 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant={result.ok ? 'default' : 'danger'}>{result.ok ? 'ok' : 'failed'}</Badge>
                <span className="font-medium">{result.action.kind}</span>
              </div>
              <p className="text-red-100/55">{result.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerRow({ player }: { player: AdminPlayerSummary }) {
  const [nodeId, setNodeId] = useState(player.nodeId);
  const hpPct = player.maxHp > 0 ? Math.round((player.hp / player.maxHp) * 100) : 0;
  return (
    <tr className="border-t border-red-950/70 align-top">
      <td className="px-3 py-3">
        <div className="font-medium">{player.name}</div>
        <div className="text-xs text-red-200/35">{player.id}</div>
        <div className="text-xs text-red-200/25">{player.accountId ?? 'no account id'}</div>
      </td>
      <td className="px-3 py-3">{player.nodeId}</td>
      <td className="px-3 py-3">
        <div>{player.hp}/{player.maxHp}</div>
        <div className="mt-1 h-1.5 rounded-full bg-red-950/80">
          <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }} />
        </div>
      </td>
      <td className="px-3 py-3">
        <div>{player.combatArchetype ?? 'unclassed'}</div>
        <div className="text-xs text-red-200/35">Lv {player.level} · T{player.playerTier} · {player.skillPoints} pts</div>
      </td>
      <td className="space-x-1 px-3 py-3">
        {player.isDead && <Badge variant="danger">dead</Badge>}
        {player.inactive && <Badge variant="warning">inactive</Badge>}
        {player.auto && <Badge>auto</Badge>}
        {player.partySize > 1 && <Badge variant="secondary">party {player.partySize}</Badge>}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          <ConfirmAction label="Kill" variant="destructive" action={{ kind: 'killPlayer', targetPlayerId: player.id }} />
          <Button size="sm" variant="secondary" onClick={() => sendAdminAction({ kind: 'respawnPlayer', targetPlayerId: player.id })}>Respawn</Button>
          <ConfirmAction label="Reset perks" action={{ kind: 'resetClass', targetPlayerId: player.id }} />
          <ConfirmAction label="Reset progress" variant="destructive" action={{ kind: 'resetProgress', targetPlayerId: player.id }} />
          <Button size="sm" variant="secondary" onClick={() => sendAdminAction({ kind: 'refreshRecipes', targetPlayerId: player.id })}>Recipes</Button>
          <div className="flex gap-1">
            <Input className="h-8 w-28 text-xs" value={nodeId} onChange={(e) => setNodeId(e.target.value)} />
            <Button size="sm" variant="outline" onClick={() => sendAdminAction({ kind: 'teleportPlayer', targetPlayerId: player.id, nodeId })}>Teleport</Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function ConfirmAction({
  label,
  action,
  variant = 'outline',
}: {
  label: string;
  action: AdminAction;
  variant?: 'outline' | 'destructive';
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={variant}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm {label}</AlertDialogTitle>
          <AlertDialogDescription>
            This will run `{action.kind}` immediately on the selected target.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => sendAdminAction(action)}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
