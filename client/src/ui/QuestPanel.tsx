import { useAtomValue } from 'jotai';
import {
  QUEST_DATABASE,
  NODE_BIOMES,
  shortestWorldPath,
} from '@mmo-idle/shared';
import {
  playerIdAtom,
  playerNodeIdAtom,
  playerTierAtom,
  questProgressAtom,
} from '../hud/atoms';
import { HudPanel } from '../hud/primitives';

interface Props {
  onFindDungeon?: (nodeIds: string[]) => void;
}

// Returns all dungeon nodes for the given tier, sorted nearest-to-player first.
function findDungeonsForTier(playerNodeId: string, tier: number): string[] {
  const results: { nodeId: string; dist: number }[] = [];
  for (const [nodeId, info] of Object.entries(NODE_BIOMES)) {
    if (!info.isDungeon || info.biomeTier !== tier) continue;
    const path = shortestWorldPath(playerNodeId, nodeId);
    if (!path) continue;
    results.push({ nodeId, dist: path.length - 1 });
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
      <HudPanel className="sidebar-panel quest-panel">
        <div className="panel-title">Tier Quest</div>
        <div className="quest-empty">Connecting…</div>
      </HudPanel>
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

  const canLocateDungeons = dungeons.length > 0;

  return (
    <HudPanel
      className={`sidebar-panel quest-panel${canLocateDungeons ? ' quest-panel--clickable' : ''}`}
      role={canLocateDungeons ? 'button' : undefined}
      tabIndex={canLocateDungeons ? 0 : undefined}
      aria-label={canLocateDungeons ? 'Locate tier quest dungeons on the map' : undefined}
      onClick={canLocateDungeons ? handleClick : undefined}
      onKeyDown={canLocateDungeons ? (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handleClick();
      } : undefined}
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
    </HudPanel>
  );
}
