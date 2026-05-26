import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { SKILL_TREE, canUnlockSkill } from '@mmo-idle/shared';
import type { SkillNode, StatEffects, SubVariant } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import {
  currentSkillTierAtom,
  selectedClassAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  skillPointsAtom,
  unlockedSkillsAtom,
} from '../hud/atoms';
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

interface SkillPlayer {
  selectedClass: string | null;
  selectedSubVariant: SubVariant | null;
  selectedRange: string | null;
  unlockedSkills: string[];
  skillPoints: number;
  currentSkillTier: number;
}

function getNodeStatus(node: SkillNode, player: SkillPlayer | null): NodeStatus {
  if (!player) return 'locked';
  if (player.unlockedSkills.includes(node.id)) return 'unlocked';
  return canUnlockSkill(
    {
      usesSkills: {
        unlockedSkills: player.unlockedSkills,
        selectedClass: player.selectedClass,
        selectedSubVariant: player.selectedSubVariant,
        selectedRange: player.selectedRange,
      },
      tracksProgression: {
        skillPoints: player.skillPoints,
        currentSkillTier: player.currentSkillTier,
      },
    },
    node.id,
  ).ok ? 'available' : 'locked';
}

function getVisibleNodes(player: SkillPlayer): Map<number, SkillNode[]> {
  const tierMap = new Map<number, SkillNode[]>();
  const classId = player.selectedClass!;
  const sub     = player.selectedSubVariant;

  for (const node of SKILL_TREE.values()) {
    if (node.tier === 0) {
      if (node.id !== classId) continue;
    } else if (node.tier === 2) {
      // universal
    } else {
      if (node.classId !== classId) continue;
      if (node.tier >= 3 && node.subVariantId !== sub) continue;
    }

    if (!tierMap.has(node.tier)) tierMap.set(node.tier, []);
    tierMap.get(node.tier)!.push(node);
  }

  return tierMap;
}

// ── Node card (circular) ───────────────────────────────────────────────────────

function SkillNodeCard({
  node,
  player,
  compact = false,
  onHover,
}: {
  node:     SkillNode;
  player:   SkillPlayer | null;
  compact?: boolean;
  onHover:  (node: SkillNode | null) => void;
}) {
  const status = getNodeStatus(node, player);

  function handleClick() {
    if (status !== 'available') return;
    hudBus.requestSkillUnlock(node.id);
  }

  return (
    <div
      className={[
        'skill-node',
        `skill-node--${status}`,
        compact ? 'skill-node--compact' : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="skill-node__cost">{node.cost}pt</span>
      <div className="skill-node__name">{node.name}</div>
      {status === 'unlocked' && !compact && (
        <div className="skill-node__check">✓</div>
      )}
    </div>
  );
}

// ── Description panel (sticky bottom) ─────────────────────────────────────────

function NodeDesc({ node, player }: { node: SkillNode | null; player: SkillPlayer | null }) {
  if (!node) {
    return (
      <div className="skill-desc skill-desc--empty">
        Hover a node to see details
      </div>
    );
  }

  const effects = formatEffects(node.statEffects);
  const status  = getNodeStatus(node, player);

  return (
    <div className={`skill-desc skill-desc--${status}`}>
      <div className="skill-desc__header">
        <span className="skill-desc__name">{node.name}</span>
        <span className="skill-desc__tier">{tierLabel(node.tier)}</span>
        <span className="skill-desc__cost">{node.cost} pt{node.cost !== 1 ? 's' : ''}</span>
      </div>
      {effects && <div className="skill-desc__effects">{effects}</div>}
      {node.description && <div className="skill-desc__text">{node.description}</div>}
    </div>
  );
}

// ── Class selection view ───────────────────────────────────────────────────────

function ClassSelectionView({
  player,
  onHover,
}: {
  player:  SkillPlayer | null;
  onHover: (node: SkillNode | null) => void;
}) {
  const pts = player?.skillPoints ?? 0;

  return (
    <div className="skill-class-view">
      <p className="skill-tree-instruction">
        Choose your class to begin.
        {pts > 0
          ? ` You have ${pts} skill point${pts !== 1 ? 's' : ''}.`
          : ' Earn skill points by defeating monsters.'}
      </p>
      <div className="skill-class-grid">
        {CLASS_ROOTS.map(rootId => {
          const root = SKILL_TREE.get(rootId)!;
          return (
            <div key={rootId} className="skill-class-card">
              <SkillNodeCard node={root} player={player} onHover={onHover} />
              <p className="skill-class-desc">{root.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Progression view ───────────────────────────────────────────────────────────

function ProgressionView({
  player,
  onHover,
}: {
  player:  SkillPlayer;
  onHover: (node: SkillNode | null) => void;
}) {
  const classId     = player.selectedClass!;
  const className   = SKILL_TREE.get(classId)?.name ?? classId;
  const pts         = player.skillPoints;
  const tierMap     = getVisibleNodes(player);
  const tiers       = Array.from(tierMap.entries()).sort(([a], [b]) => a - b);
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
        {tiers.map(([tier, nodes], idx) => {
          if (tier > currentTier) return null;

          const isCurrent = tier === currentTier;
          const isPast    = tier < currentTier;

          return (
            <div key={tier} className="skill-tier-block">
              {idx > 0 && (
                <div className={`skill-connector${isPast || isCurrent ? ' skill-connector--lit' : ''}`} />
              )}
              <div className={[
                'skill-tier-section',
                isCurrent ? 'skill-tier-section--current' : '',
                isPast    ? 'skill-tier-section--past'    : '',
              ].filter(Boolean).join(' ')}>
                <div className="skill-tier-badge">{tierLabel(tier)}</div>
                <div className="skill-tier-nodes">
                  {nodes.map(node => (
                    <SkillNodeCard
                      key={node.id}
                      node={node}
                      player={player}
                      compact={isPast}
                      onHover={onHover}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Next-tier teaser: placeholder circles, not plain text */}
        {tierMap.has(currentTier + 1) && (
          <div className="skill-tier-block">
            <div className="skill-connector" />
            <div className="skill-tier-section skill-tier-section--upcoming">
              <div className="skill-tier-badge">{tierLabel(currentTier + 1)}</div>
              <div className="skill-tier-nodes">
                {[0, 1, 2].map(i => (
                  <div key={i} className="skill-node skill-node--placeholder" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface Props { onClose: () => void; }

export function SkillTreePanel({ onClose }: Props) {
  const selectedClass = useAtomValue(selectedClassAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const skillPoints = useAtomValue(skillPointsAtom);
  const currentSkillTier = useAtomValue(currentSkillTierAtom);
  const player: SkillPlayer = {
    selectedClass,
    selectedSubVariant,
    selectedRange,
    unlockedSkills,
    skillPoints,
    currentSkillTier,
  };
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const classChosen = player.selectedClass !== null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel">

        <div className="skill-tree-header">
          <span className="skill-tree-title">Passive Skill Tree</span>
          <div className="skill-tree-legend">
            <span className="legend-item legend-item--unlocked">● unlocked</span>
            <span className="legend-item legend-item--available">● available</span>
            <span className="legend-item legend-item--locked">● locked</span>
          </div>
          <button className="skill-tree-close" onClick={onClose}>✕</button>
        </div>

        <div className="skill-tree-body">
          {classChosen
            ? <ProgressionView player={player!} onHover={setHoveredNode} />
            : <ClassSelectionView player={player} onHover={setHoveredNode} />}
        </div>

        <NodeDesc node={hoveredNode} player={player} />

      </div>
    </div>,
    document.body,
  );
}
