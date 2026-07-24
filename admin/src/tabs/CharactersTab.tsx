import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { AdminCharacterRecord } from '@mmo-idle/shared';
import { ESSENCE_TYPES, ESSENCE_LABELS } from '@mmo-idle/shared';
import { charactersAtom, playersAtom } from '../state';
import { requestCharacters } from '../socket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function CharactersTab() {
  const characters = useAtomValue(charactersAtom);
  const players = useAtomValue(playersAtom);
  const [search, setSearch] = useState('');

  const onlineByCharacterId = useMemo(
    () => new Set(players.map((player) => player.id)),
    [players],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((character) =>
      [
        character.id,
        character.accountId,
        character.accountDisplayName,
        character.name,
        character.nodeId,
        character.combatArchetype,
        character.selectedClass,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [characters, search]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Persisted Characters</CardTitle>
          <p className="text-sm text-red-100/55">
            {filtered.length} visible / {characters.length} saved in gamedb
          </p>
        </div>
        <Button variant="secondary" onClick={requestCharacters}>Refresh</Button>
      </CardHeader>
      <CardContent>
        <Input
          className="mb-4"
          placeholder="Search name, account id, node, class..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="admin-scrollbar max-h-[72vh] overflow-auto rounded-lg border border-red-950/70">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#120404] text-xs uppercase text-red-200/40">
              <tr>
                <th className="px-3 py-2">Character</th>
                <th className="px-3 py-2">Node</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Build</th>
                <th className="px-3 py-2">Inventory</th>
                <th className="px-3 py-2">Essence</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((character) => (
                <CharacterRow
                  key={character.id}
                  character={character}
                  online={onlineByCharacterId.has(character.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterRow({
  character,
  online,
}: {
  character: AdminCharacterRecord;
  online: boolean;
}) {
  const hpPct = character.maxHp > 0
    ? Math.round((character.hp / character.maxHp) * 100)
    : 0;
  return (
    <tr className="border-t border-red-950/70 align-top">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{character.name}</span>
          <Badge variant={online ? 'default' : 'secondary'}>
            {online ? 'online' : 'offline'}
          </Badge>
        </div>
        <div className="text-xs text-red-200/35">{character.id}</div>
        <div className="text-xs text-red-200/25">
          {character.accountDisplayName} · {character.accountId}
        </div>
      </td>
      <td className="px-3 py-3">{character.nodeId}</td>
      <td className="px-3 py-3">
        <div>Lv {character.level} · T{character.playerTier} · {character.skillPoints} pts · GM {character.globalMastery}</div>
        <div className="mt-1 h-1.5 rounded-full bg-red-950/80">
          <div
            className="h-1.5 rounded-full bg-red-400"
            style={{ width: `${Math.max(0, Math.min(100, hpPct))}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-red-200/35">{character.hp}/{character.maxHp} HP</div>
      </td>
      <td className="px-3 py-3">
        <div>{character.combatArchetype ?? 'unclassed'}</div>
        <div className="text-xs text-red-200/35">
          {character.selectedClass ?? 'no class'} · {character.selectedSubVariant ?? 'no variant'} · {character.selectedRange ?? 'no range'}
        </div>
      </td>
      <td className="px-3 py-3">
        <div>{character.inventoryCount} bag</div>
        <div className="text-xs text-red-200/35">{character.equipmentCount} equipped</div>
        <div className="text-xs text-red-200/35">
          T:{character.equippedAbilities?.techniques?.join(', ') || '—'}
          {' / G:'}{character.equippedAbilities?.guards?.join(', ') || '—'}
          {` (${character.knownAbilities?.length ?? 0} known)`}
        </div>
        <div className="text-xs text-red-200/35">
          Stance:{character.equippedStances?.default ?? '—'} / {character.equippedStances?.reactive ?? '—'}
          {` (active: ${character.activeStance ?? '—'}, ${character.knownStances?.length ?? 0} known)`}
        </div>
        <div className="text-xs text-red-200/35">
          Rites:{character.equippedRites?.length ? character.equippedRites.join(', ') : '—'}
          {` (${character.knownRites?.length ?? 0} known)`}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          {ESSENCE_TYPES.map((type) => (
            <span key={type}>
              <span className="text-red-200/35">{ESSENCE_LABELS[type]}</span> {character.essences[type] ?? 0}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-red-200/35">
        {new Date(character.updatedAt).toLocaleString()}
      </td>
    </tr>
  );
}
