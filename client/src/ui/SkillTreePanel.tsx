import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { SKILL_TREE, canUnlockSkill } from '@mmo-idle/shared';
import type { CSSProperties } from 'react';
import type { SkillNode, StatEffects, SubVariant } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { useIsMobile } from '../hud/useIsMobile';
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

const CLASS_ROOTS = [
  'cadence-root',
  'cooldown-root',
  'reload-root',
  'energy-root',
  'dot-root',
  'summoner-root',
];

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

function costLabel(cost: number): string {
  return `${cost} pt${cost !== 1 ? 's' : ''}`;
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
      if (node.classId !== classId) continue;
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
//
// Interaction differs by input model:
//  • Desktop (hover): hovering previews details; a click unlocks immediately.
//  • Mobile (touch, no hover): a tap only *selects* the node (driving the same
//    preview); committing happens via the explicit Unlock/Choose button. This
//    lets you inspect a node before spending points on it.

function SkillNodeCard({
  node,
  player,
  compact = false,
  isMobile,
  selected = false,
  onHover,
  onSelect,
}: {
  node:     SkillNode;
  player:   SkillPlayer | null;
  compact?: boolean;
  isMobile: boolean;
  selected?: boolean;
  onHover:  (node: SkillNode | null) => void;
  onSelect: (node: SkillNode) => void;
}) {
  const status = getNodeStatus(node, player);

  function handleClick() {
    if (isMobile) {
      onSelect(node);
      return;
    }
    if (status !== 'available') return;
    hudBus.requestSkillUnlock(node.id);
  }

  return (
    <div
      className={[
        'skill-node',
        `skill-node--${status}`,
        compact ? 'skill-node--compact' : '',
        selected ? 'skill-node--selected' : '',
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

function NodeDesc({
  node,
  player,
  isMobile,
  onUnlock,
}: {
  node: SkillNode | null;
  player: SkillPlayer | null;
  isMobile: boolean;
  onUnlock: (node: SkillNode) => void;
}) {
  if (!node) {
    return (
      <div className="skill-desc skill-desc--empty">
        {isMobile ? 'Tap a node to see details' : 'Hover a node to see details'}
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
        <span className="skill-desc__cost">{costLabel(node.cost)}</span>
      </div>
      {effects && <div className="skill-desc__effects">{effects}</div>}
      {node.description && <div className="skill-desc__text">{node.description}</div>}
      {isMobile && status === 'available' && (
        <button className="skill-confirm-btn" onClick={() => onUnlock(node)}>
          Unlock — {costLabel(node.cost)}
        </button>
      )}
    </div>
  );
}

// ── Class selection view ───────────────────────────────────────────────────────

function ClassSelectionView({
  player,
  isMobile,
  selectedNode,
  onHover,
  onSelect,
  onUnlock,
}: {
  player:  SkillPlayer | null;
  isMobile: boolean;
  selectedNode: SkillNode | null;
  onHover: (node: SkillNode | null) => void;
  onSelect: (node: SkillNode) => void;
  onUnlock: (node: SkillNode) => void;
}) {
  const pts = player?.skillPoints ?? 0;
  const [hoveredClass, setHoveredClass] = useState<SkillNode | null>(null);
  // On touch there's no hover, so the selected orb drives the center info.
  const displayClass = isMobile ? selectedNode : hoveredClass;
  const displayStatus = displayClass ? getNodeStatus(displayClass, player) : null;
  const displayEffects = displayClass ? formatEffects(displayClass.statEffects) : '';

  function setHover(node: SkillNode | null) {
    setHoveredClass(node);
    onHover(node);
  }

  return (
    <div className="skill-class-view">
      <p className="skill-tree-instruction">
        Choose a class to begin.
        {pts > 0
          ? ` You have ${pts} skill point${pts !== 1 ? 's' : ''}.`
          : ' Earn skill points by fulfilling your destiny.'}
      </p>
      <div className="skill-class-orbit" aria-label="Class selection">
        <div className={[
          'skill-class-orbit__info',
          displayClass ? 'skill-class-orbit__info--active' : '',
          displayStatus ? `skill-class-orbit__info--${displayStatus}` : '',
        ].filter(Boolean).join(' ')}>
          {displayClass ? (
            <>
              <span className="skill-class-orbit__info-title">{displayClass.name}</span>
              <span className="skill-class-orbit__info-meta">
                {tierLabel(displayClass.tier)} · {costLabel(displayClass.cost)}
              </span>
              {displayEffects && (
                <span className="skill-class-orbit__info-effects">{displayEffects}</span>
              )}
              <span className="skill-class-orbit__info-text">{displayClass.description}</span>
              {isMobile && displayStatus === 'available' && (
                <button
                  className="skill-confirm-btn skill-confirm-btn--orbit"
                  onClick={() => onUnlock(displayClass)}
                >
                  Choose {displayClass.name}
                </button>
              )}
            </>
          ) : (
            <>
              <span className="skill-class-orbit__info-title">Choose a Class</span>
              <span className="skill-class-orbit__info-text">
                {isMobile
                  ? 'Tap an orb to inspect it, then confirm to unlock.'
                  : 'Hover an orb to inspect it, then click to unlock.'}
              </span>
            </>
          )}
        </div>
        {CLASS_ROOTS.map((rootId, index) => {
          const root = SKILL_TREE.get(rootId)!;
          const angle = -90 + index * (360 / CLASS_ROOTS.length);
          return (
            <div
              key={rootId}
              className="skill-class-orbit__slot"
              style={{
                '--class-angle': `${angle}deg`,
              } as CSSProperties}
            >
              <SkillNodeCard
                node={root}
                player={player}
                isMobile={isMobile}
                selected={selectedNode?.id === root.id}
                onHover={setHover}
                onSelect={onSelect}
              />
              <span className="skill-class-orbit__sigil">{root.name}</span>
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
  isMobile,
  selectedNode,
  onHover,
  onSelect,
}: {
  player:  SkillPlayer;
  isMobile: boolean;
  selectedNode: SkillNode | null;
  onHover: (node: SkillNode | null) => void;
  onSelect: (node: SkillNode) => void;
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
                      isMobile={isMobile}
                      selected={selectedNode?.id === node.id}
                      onHover={onHover}
                      onSelect={onSelect}
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
  const isMobile = useIsMobile();
  const player: SkillPlayer = {
    selectedClass,
    selectedSubVariant,
    selectedRange,
    unlockedSkills,
    skillPoints,
    currentSkillTier,
  };
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const classChosen = player.selectedClass !== null;

  // The node shown in the detail panel: hover on desktop, tap-selection on touch.
  const activeNode = isMobile ? selectedNode : hoveredNode;

  function handleUnlock(node: SkillNode) {
    if (getNodeStatus(node, player) !== 'available') return;
    hudBus.requestSkillUnlock(node.id);
    setSelectedNode(null);
  }

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
            ? <ProgressionView
                player={player!}
                isMobile={isMobile}
                selectedNode={selectedNode}
                onHover={setHoveredNode}
                onSelect={setSelectedNode}
              />
            : <ClassSelectionView
                player={player}
                isMobile={isMobile}
                selectedNode={selectedNode}
                onHover={setHoveredNode}
                onSelect={setSelectedNode}
                onUnlock={handleUnlock}
              />}
        </div>

        {classChosen && (
          <NodeDesc node={activeNode} player={player} isMobile={isMobile} onUnlock={handleUnlock} />
        )}

      </div>
    </div>,
    document.body,
  );
}
