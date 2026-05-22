import type { PlayerState } from '@mmo-idle/shared';
import { QUEST_DATABASE } from '@mmo-idle/shared';

interface Props {
  player: PlayerState | null;
}

export function QuestPanel({ player }: Props) {
  if (!player) {
    return (
      <div className="sidebar-panel quest-panel">
        <div className="panel-title">Tier Quest</div>
        <div className="quest-empty">Connecting…</div>
      </div>
    );
  }

  // Find the quest active at the player's current tier.
  let activeQuest = null;
  for (const [, quest] of QUEST_DATABASE) {
    if (quest.tierRequired === player.playerTier) {
      activeQuest = quest;
      break;
    }
  }

  const progress = activeQuest
    ? (player.questProgress[activeQuest.id] ?? 0)
    : 0;
  const required = activeQuest?.killsRequired ?? 1;
  const pct = Math.min(100, (progress / required) * 100);

  return (
    <div className="sidebar-panel quest-panel">
      <div className="panel-title">Tier Quest</div>

      <div className="quest-tier-row">
        <span className="stat-label">Tier</span>
        <span className="stat-value quest-tier-badge">{player.playerTier}</span>
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
        </>
      ) : (
        <div className="quest-complete">
          No quest for this tier — max tier reached!
        </div>
      )}
    </div>
  );
}
