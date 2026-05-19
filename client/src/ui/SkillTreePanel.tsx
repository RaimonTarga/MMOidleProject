import { createPortal } from 'react-dom';
import { SKILL_TREE } from '@mmo-idle/shared';
import type { SkillNode, StatEffects } from '@mmo-idle/shared';
import type { PlayerState } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import './skillTree.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CLASS_ROOTS = ['cadence-root', 'cooldown-root', 'reload-root', 'energy-root', 'dot-root'];

const EFFECT_LABELS: Record<string, string> = {
  attack:          'ATK',
  plating:         'PLT',
  damageReduction: '% DR',
  evasion:         'EVA',
  attackRange:     'RNG',
  attackCooldown:  'ms CD',
  maxHp:           'HP',
  hpRegen:         'REGEN',
  speed:           'SPD',
};

function formatEffects(effects: StatEffects): string {
  return Object.entries(effects)
    .filter(([, v]) => v !== undefined && v !== 0)
    .map(([k, v]) => `${(v as number) > 0 ? '+' : ''}${v} ${EFFECT_LABELS[k] ?? k}`)
    .join('  ');
}

function tierLabel(tier: number): string {
  if (tier === 0) return 'Class';
  if (tier === 1) return 'Style';
  if (tier === 2) return 'Range';
  if (tier === 3) return 'Path';
  return `Tier ${tier}`;
}

type NodeStatus = 'unlocked' | 'available' | 'locked';

function getNodeStatus(node: SkillNode, player: PlayerState | null): NodeStatus {
  if (!player) return 'locked';
  if (player.unlockedSkills.includes(node.id)) return 'unlocked';
  if (node.tier !== player.currentSkillTier)   return 'locked';
  if (player.skillPoints < node.cost)          return 'locked';

  if (node.tier === 0) {
    if (player.selectedClass !== null)         return 'locked';
  } else if (node.tier === 1) {
    if (node.classId !== player.selectedClass) return 'locked';
  } else if (node.tier === 2) {
    // Universal: available to all, but sub-variant must be chosen first.
    if (player.selectedSubVariant === null)    return 'locked';
  } else {
    // Tier 3+: full 15-way path lock.
    if (node.classId !== player.selectedClass)           return 'locked';
    if (node.subVariantId !== player.selectedSubVariant) return 'locked';
  }

  return 'available';
}

/**
 * Collects nodes visible to this player in the ProgressionView.
 *
 * Rules:
 *   - Tier 0: only the player's class root.
 *   - Tier 1: all three sub-variants for the player's class (so the choice is visible).
 *   - Tier 2: all three universal range nodes (null classId).
 *   - Tier 3+: only nodes matching the player's class AND sub-variant.
 */
function getVisibleNodes(player: PlayerState): Map<number, SkillNode[]> {
  const tierMap = new Map<number, SkillNode[]>();
  const classId = player.selectedClass!;
  const sub     = player.selectedSubVariant;

  for (const node of SKILL_TREE.values()) {
    // Tier 0: show only the player's own class root.
    if (node.tier === 0) {
      if (node.id !== classId) continue;
    } else if (node.tier === 2) {
      // Universal range nodes have null classId — always included.
    } else {
      // Tiers 1, 3+: must belong to player's class.
      if (node.classId !== classId) continue;
      // Tiers 3+: also filter to player's sub-variant.
      if (node.tier >= 3 && node.subVariantId !== sub) continue;
      // Tier 1: show all three sub-variants so the player can choose.
    }

    if (!tierMap.has(node.tier)) tierMap.set(node.tier, []);
    tierMap.get(node.tier)!.push(node);
  }

  return tierMap;
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

  const tierMap    = getVisibleNodes(player);
  const tiers      = Array.from(tierMap.entries()).sort(([a], [b]) => a - b);
  const currentTier = player.currentSkillTier;

  const subVariantLabel = player.selectedSubVariant
    ? ` · ${player.selectedSubVariant.charAt(0).toUpperCase() + player.selectedSubVariant.slice(1)}`
    : '';
  const rangeLabel = player.selectedRange
    ? ` · ${SKILL_TREE.get(player.selectedRange)?.name ?? player.selectedRange}`
    : '';

  return (
    <>
      <div className="skill-progress-meta">
        <span className="skill-progress-class">{className}{subVariantLabel}{rangeLabel}</span>
        <span className="skill-progress-tier">Tier {currentTier}</span>
        <span className="skill-progress-pts">
          {pts} skill point{pts !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="skill-tier-list">
        {tiers.map(([tier, nodes]) => {
          if (tier > currentTier) return null;

          const isCurrent = tier === currentTier;
          const isPast    = tier < currentTier;

          return (
            <div
              key={tier}
              className={`skill-tier-row${isCurrent ? ' skill-tier-row--current' : ''}${isPast ? ' skill-tier-row--past' : ''}`}
            >
              <div className="skill-tier-label">{tierLabel(tier)}</div>
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
            <div className="skill-tier-label">{tierLabel(currentTier + 1)}</div>
            <div className="skill-tier-upcoming-hint">
              Unlock a skill above to reveal {tierLabel(currentTier + 1).toLowerCase()}.
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
