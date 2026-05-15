import { createPortal } from 'react-dom';
import { SKILL_TREE } from '@mmo-idle/shared';
import type { SkillNode, StatEffects } from '@mmo-idle/shared';
import type { PlayerState } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './skillTree.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CLASS_ROOTS = ['attack-root', 'defense-root', 'speed-root', 'range-root'];

const EFFECT_LABELS: Record<string, string> = {
  attack: 'ATK',
  defense: 'DEF',
  attackRange: 'RNG',
  attackCooldown: 'ms SPD',
  maxHp: 'HP',
};

function formatEffects(effects: StatEffects): string {
  return Object.entries(effects)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${(v as number) > 0 ? '+' : ''}${v} ${EFFECT_LABELS[k] ?? k}`)
    .join('  ');
}

type NodeStatus = 'unlocked' | 'available' | 'locked';

function getNodeStatus(node: SkillNode, player: PlayerState | null): NodeStatus {
  if (!player) return 'locked';
  if (player.unlockedSkills.includes(node.id)) return 'unlocked';

  // Only the exact current tier can be unlocked.
  if (node.tier !== player.currentSkillTier) return 'locked';

  // Tier 0: must not have a class yet.
  if (node.tier === 0 && player.selectedClass !== null) return 'locked';

  // Tier 1+: must belong to the player's chosen class.
  if (node.tier > 0 && node.classId !== player.selectedClass) return 'locked';

  // Must have enough skill points.
  if (player.skillPoints < node.cost) return 'locked';

  return 'available';
}

// ── Shared node card ───────────────────────────────────────────────────────────

function SkillNodeCard({
  node,
  player,
  compact = false,
}: {
  node: SkillNode;
  player: PlayerState | null;
  compact?: boolean;
}) {
  const status  = getNodeStatus(node, player);
  const effects = formatEffects(node.statEffects);

  function handleClick() {
    if (status !== 'available') return;
    hudBus.requestSkillUnlock(node.id);
  }

  return (
    <div
      className={`skill-node skill-node--${status}${compact ? ' skill-node--compact' : ''}`}
      onClick={handleClick}
      title={node.description}
    >
      <div className="skill-node__name">{node.name}</div>
      <div className="skill-node__meta">
        <span className="skill-node__cost">{node.cost} pt{node.cost !== 1 ? 's' : ''}</span>
        {effects && <span className="skill-node__effects">{effects}</span>}
      </div>
    </div>
  );
}

// ── Class selection view (tier 0 not yet chosen) ───────────────────────────────

function ClassSelectionView({ player }: { player: PlayerState | null }) {
  const pts = player?.skillPoints ?? 0;

  return (
    <>
      <p className="skill-tree-instruction">
        Choose your class to begin progression.
        {pts > 0
          ? ` You have ${pts} skill point${pts !== 1 ? 's' : ''}.`
          : ' Earn skill points by defeating monsters.'}
      </p>
      <div className="skill-class-grid">
        {CLASS_ROOTS.map(rootId => {
          const root = SKILL_TREE.get(rootId)!;
          return (
            <div key={rootId} className="skill-class-card">
              <SkillNodeCard node={root} player={player} />
              <p className="skill-class-desc">{root.description}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Progression view (class chosen) ───────────────────────────────────────────

function ProgressionView({ player }: { player: PlayerState }) {
  const classId   = player.selectedClass!;
  const className = SKILL_TREE.get(classId)?.name ?? classId;
  const pts       = player.skillPoints;

  // Collect all nodes for this class, grouped by tier, sorted ascending.
  const tierMap = new Map<number, SkillNode[]>();
  for (const node of SKILL_TREE.values()) {
    if (node.classId !== classId) continue;
    if (!tierMap.has(node.tier)) tierMap.set(node.tier, []);
    tierMap.get(node.tier)!.push(node);
  }
  const tiers = Array.from(tierMap.entries()).sort(([a], [b]) => a - b);
  const currentTier = player.currentSkillTier;

  return (
    <>
      <div className="skill-progress-meta">
        <span className="skill-progress-class">{className}</span>
        <span className="skill-progress-tier">Tier {currentTier}</span>
        <span className="skill-progress-pts">
          {pts} skill point{pts !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="skill-tier-list">
        {tiers.map(([tier, nodes]) => {
          // Future tiers are hidden.
          if (tier > currentTier) return null;

          const isCurrent = tier === currentTier;
          const isPast    = tier < currentTier;

          return (
            <div
              key={tier}
              className={`skill-tier-row${isCurrent ? ' skill-tier-row--current' : ''}${isPast ? ' skill-tier-row--past' : ''}`}
            >
              <div className="skill-tier-label">
                {tier === 0 ? 'Class' : `Tier ${tier}`}
              </div>
              <div className="skill-tier-nodes">
                {nodes.map(node => (
                  <SkillNodeCard
                    key={node.id}
                    node={node}
                    player={player}
                    compact={isPast}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Next-tier teaser */}
        {tierMap.has(currentTier + 1) && (
          <div className="skill-tier-row skill-tier-row--upcoming">
            <div className="skill-tier-label">Tier {currentTier + 1}</div>
            <div className="skill-tier-upcoming-hint">
              Unlock a skill above to reveal tier {currentTier + 1}.
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface Props {
  player: PlayerState | null;
  onClose: () => void;
}

export function SkillTreePanel({ player, onClose }: Props) {
  const classChosen = player !== null && player.selectedClass !== null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel">

        <div className="skill-tree-header">
          <span className="skill-tree-title">Passive Skill Tree</span>
          <div className="skill-tree-legend">
            <span className="legend-item legend-item--unlocked">● selected</span>
            <span className="legend-item legend-item--available">● available</span>
            <span className="legend-item legend-item--locked">● locked</span>
          </div>
          <button className="skill-tree-close" onClick={onClose}>✕</button>
        </div>

        {classChosen
          ? <ProgressionView player={player!} />
          : <ClassSelectionView player={player} />}

      </div>
    </div>,
    document.body,
  );
}
