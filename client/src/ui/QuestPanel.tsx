import { useAtomValue } from 'jotai';
import { QUEST_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import {
  playerIdAtom,
  playerNodeIdAtom,
  playerTierAtom,
  questProgressAtom,
} from '../hud/atoms';

interface Props {
  onFindDungeon?: (nodeIds: string[]) => void;
}

function parseCoords(id: string): [number, number] | null {
  const p = id.split('-');
  if (p.length !== 3) return null;
  const r = parseInt(p[1], 10), c = parseInt(p[2], 10);
  return isNaN(r) || isNaN(c) ? null : [r, c];
}

// Returns all dungeon nodes for the given tier, sorted nearest-to-player first.
function findDungeonsForTier(playerNodeId: string, tier: number): string[] {
  const playerPos = parseCoords(playerNodeId);
  if (!playerPos) return [];
  const [pr, pc] = playerPos;
  const results: { nodeId: string; dist: number }[] = [];
  for (const [nodeId, info] of Object.entries(NODE_BIOMES)) {
    if (!info.isDungeon || info.biomeTier !== tier) continue;
    const pos = parseCoords(nodeId);
    if (!pos) continue;
    results.push({ nodeId, dist: Math.abs(pos[0] - pr) + Math.abs(pos[1] - pc) });
  }
  results.sort((a, b) => a.dist - b.dist);
  return results.map(r => r.nodeId);
}

export function QuestPanel({ onFindDungeon }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const questProgress = useAtomValue(questProgressAtom);

  if (!playerId || !nodeId) {
    return (
      <div className="sidebar-panel quest-panel">
        <div className="panel-title">Tier Quest</div>
        <div className="quest-empty">Connecting…</div>
      </div>
    );
  }

  let activeQuest = null;
  for (const [, quest] of QUEST_DATABASE) {
    if (quest.tierRequired === playerTier) {
      activeQuest = quest;
      break;
    }
  }

  const progress = activeQuest ? (questProgress[activeQuest.id] ?? 0) : 0;
  const required = activeQuest?.killsRequired ?? 1;
  const pct = Math.min(100, (progress / required) * 100);

  const dungeons = (activeQuest && onFindDungeon)
    ? findDungeonsForTier(nodeId, playerTier)
    : [];

  function handleClick() {
    if (dungeons.length > 0 && onFindDungeon) onFindDungeon(dungeons);
  }

  return (
    <div
      className={`sidebar-panel quest-panel${dungeons.length > 0 ? ' quest-panel--clickable' : ''}`}
      onClick={dungeons.length > 0 ? handleClick : undefined}
    >
      <div className="panel-title">Tier Quest</div>

      <div className="quest-tier-row">
        <span className="stat-label">Tier</span>
        <span className="stat-value quest-tier-badge">{playerTier}</span>
      </div>

      {activeQuest ? (
        <>
          <div className="quest-name">{activeQuest.name}</div>
          <div className="quest-desc">{activeQuest.description}</div>

          <div className="quest-progress-row">
            <span className="stat-label">Progress</span>
            <span className="stat-value">{progress} / {required}</span>
          </div>
          <div className="quest-bar-track">
            <div className="quest-bar-fill" style={{ width: `${pct}%` }} />
          </div>

          {dungeons.length > 0 && (
            <div className="quest-find-hint">▶ locate dungeons on map</div>
          )}
        </>
      ) : (
        <div className="quest-complete">
          No quest for this tier — max tier reached!
        </div>
      )}
    </div>
  );
}
