import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  formatWorldLogEntry,
  type AdminWorldLogEntry,
  type AdminWorldLogQuery,
  type WorldLogEvent,
} from '@mmo-idle/shared';
import { charactersAtom, playersAtom, worldLogAtom } from '../state';
import { requestWorldLog } from '../socket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const WORLD_LOG_KINDS: Array<WorldLogEvent['kind']> = [
  'damage',
  'heal',
  'shield-gain',
  'shield-absorb',
  'buff-gain',
  'buff-update',
  'buff-expire',
  'kill',
  'dodge',
  'player-death',
  'biome-level-up',
  'player-tier-up',
  'overlord-slain',
];

type TargetOption = {
  key: string;
  label: string;
  viewerId?: string;
  viewerAccountId?: string;
  viewerCharacterId?: string;
};

export function WorldLogTab() {
  const players = useAtomValue(playersAtom);
  const characters = useAtomValue(charactersAtom);
  const entries = useAtomValue(worldLogAtom);
  const [targetKey, setTargetKey] = useState('all');
  const [nodeId, setNodeId] = useState('');
  const [kind, setKind] = useState<WorldLogEvent['kind'] | 'all'>('all');
  const [limit, setLimit] = useState('200');
  const [hasQueried, setHasQueried] = useState(false);

  const targetOptions = useMemo<TargetOption[]>(() => {
    const options: TargetOption[] = [{ key: 'all', label: 'All viewers' }];
    const characterById = new Map(characters.map((character) => [character.id, character]));
    for (const player of players) {
      const character = characterById.get(player.characterId);
      options.push({
        key: `character:${player.characterId}`,
        label: `Online · ${player.name} · ${character?.accountDisplayName ?? player.accountId ?? 'unknown account'}`,
        viewerCharacterId: player.characterId,
      });
    }
    const liveCharacters = new Set(players.map((player) => player.characterId));
    for (const character of characters) {
      if (liveCharacters.has(character.id)) continue;
      options.push({
        key: `character:${character.id}`,
        label: `Saved · ${character.name} · ${character.accountDisplayName}`,
        viewerCharacterId: character.id,
      });
    }
    return options;
  }, [characters, players]);

  const selectedTarget = targetOptions.find((option) => option.key === targetKey) ?? targetOptions[0];

  function query(): void {
    const parsedLimit = Number(limit);
    const payload: AdminWorldLogQuery = {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 200,
      nodeId: nodeId.trim() || undefined,
      kind: kind === 'all' ? undefined : kind,
      viewerId: selectedTarget.viewerId,
      viewerAccountId: selectedTarget.viewerAccountId,
      viewerCharacterId: selectedTarget.viewerCharacterId,
    };
    setHasQueried(true);
    requestWorldLog(payload);
  }

  return (
    <div className="grid grid-cols-[360px_1fr] gap-4">
      <Card>
        <CardHeader>
          <CardTitle>World Event Log</CardTitle>
          <p className="text-sm text-red-100/55">
            Query persisted entries from the player-visible combat log.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="text-red-100/55">Viewer</span>
            <select
              className="h-10 w-full rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 text-sm text-orange-50"
              value={targetKey}
              onChange={(event) => setTargetKey(event.target.value)}
            >
              {targetOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-red-100/55">Kind</span>
            <select
              className="h-10 w-full rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 text-sm text-orange-50"
              value={kind}
              onChange={(event) => setKind(event.target.value as WorldLogEvent['kind'] | 'all')}
            >
              <option value="all">All kinds</option>
              {WORLD_LOG_KINDS.map((eventKind) => (
                <option key={eventKind} value={eventKind}>{eventKind}</option>
              ))}
            </select>
          </label>
          <Input
            placeholder="node id (optional)"
            value={nodeId}
            onChange={(event) => setNodeId(event.target.value)}
          />
          <Input
            placeholder="limit"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
          <Button className="w-full" onClick={query}>Query World Log</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Captured Events</CardTitle>
            <p className="text-sm text-red-100/55">{entries.length} entries</p>
          </div>
          <Badge variant="secondary">logdb</Badge>
        </CardHeader>
        <CardContent>
          <div className="admin-scrollbar max-h-[72vh] space-y-2 overflow-auto">
            {entries.length === 0 && (
              <p className="rounded-lg border border-red-950/70 bg-red-950/25 p-4 text-sm text-red-200/35">
                {hasQueried
                  ? 'Query returned 0 world log entries. This log captures player-visible combat events after they are emitted to a live player.'
                  : 'No world log entries loaded yet.'}
              </p>
            )}
            {entries.map((entry) => (
              <WorldLogRow key={entry.id} entry={entry} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorldLogRow({
  entry,
}: {
  entry: AdminWorldLogEntry;
}) {
  const formatted = formatWorldLogEntry(entry.event, entry.viewerId);
  return (
    <div className="rounded-lg border border-red-950/70 bg-red-950/25 p-3 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge>{entry.event.kind}</Badge>
        <span className="font-medium text-orange-50">{formatted.headline}</span>
        <span className="text-xs text-red-200/35">{entry.event.nodeId}</span>
        <span className="text-xs text-red-200/25">
          {new Date(entry.event.serverTime).toLocaleTimeString()}
        </span>
      </div>
      {formatted.detail && <div className="text-red-100/55">{formatted.detail}</div>}
      <div className="mt-1 text-xs text-red-200/25">
        viewer {entry.viewerName}
        {' · character '}{entry.viewerCharacterId ?? 'legacy/unknown'}
        {' · account '}{entry.viewerAccountId ?? 'unknown'}
        {' · socket '}{entry.viewerId}
      </div>
    </div>
  );
}
