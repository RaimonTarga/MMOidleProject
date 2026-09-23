import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { SKILL_TREE, canUnlockSkill } from '@mmo-idle/shared';
import type { SkillNode, SubVariant } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { CONDUIT_BLOCKED_DESC, isBlockedConduit, isPlaceholder, nodeName, nodeDescription } from './skillNodePresentation';
import { MilestonePips, type PipState } from '../hud/primitives';
import { DetailLines } from './describe/DetailLines';
import { skillNodeLines } from './describe';
import {
  currentSkillTierAtom,
  selectedClassAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  skillPointsAtom,
  unlockedSkillsAtom,
} from '../hud/atoms';
import { DialogHeader, GameDialog } from '../hud/primitives';
import { SkillCharacterPreview } from './SkillCharacterPreview';
import { SkillEmblem } from './SkillEmblem';
import { SkillBuildView } from './SkillBuildView';
import { SkillComparison } from './SkillComparison';
import { ClassIdentity } from './ClassIdentity';
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

function unlockCheck(node: SkillNode, player: SkillPlayer | null) {
  if (!player) return { ok: false, reason: 'Not connected' };
  if (isBlockedConduit(node)) return { ok: false, reason: CONDUIT_BLOCKED_DESC };
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
  );
}

function getNodeStatus(node: SkillNode, player: SkillPlayer | null): NodeStatus {
  if (!player) return 'locked';
  if (isBlockedConduit(node)) return 'locked';
  if (player.unlockedSkills.includes(node.id)) return 'unlocked';
  return unlockCheck(node, player).ok ? 'available' : 'locked';
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
// One interaction, every input model: a click (or tap) SELECTS the node and
// drives the detail panel; spending points always goes through the explicit
// confirm button down there. Desktop used to unlock on click, which meant the
// most irreversible decisions in the game — your class, your sub-variant — were
// one stray click away, and the only way to read a node was to hover it.

function SkillNodeCard({
  node,
  player,
  compact = false,
  faded = false,
  selected = false,
  onSelect,
}: {
  node:     SkillNode;
  player:   SkillPlayer | null;
  compact?: boolean;
  /**
   * A road not taken: a past-tier sibling the player did not pick. Dimmed rather
   * than hidden or shrunk — class reset exists, so the alternatives have to stay
   * legible at a glance — and it returns to full colour on hover or tap.
   */
  faded?: boolean;
  selected?: boolean;
  onSelect: (node: SkillNode) => void;
}) {
  const status = getNodeStatus(node, player);

  return (
    <button
      type="button"
      className={[
        'skill-node',
        `skill-node--${status}`,
        compact ? 'skill-node--compact' : '',
        faded ? 'skill-node--faded' : '',
        status === 'unlocked' ? 'skill-node--spine' : '',
        selected ? 'skill-node--selected' : '',
      ].filter(Boolean).join(' ')}
      aria-pressed={selected}
      onClick={() => onSelect(node)}
    >
      {!compact && <SkillCharacterPreview node={node} owned={player?.unlockedSkills ?? []} />}
      <MilestonePips
        className="skill-node__cost"
        states={Array.from({ length: Math.max(1, node.cost) }, () => 'pending' as PipState)}
        label={`Costs ${node.cost} skill point${node.cost === 1 ? '' : 's'}`}
        size="sm"
      />
      <div className="skill-node__name">{compact && <SkillEmblem node={node} size={24} />}<span>{nodeName(node)}</span></div>
      {!compact && <span className="skill-node__status">{isBlockedConduit(node) || isPlaceholder(node) ? 'In development' : status === 'available' ? 'Available to unlock' : status === 'unlocked' ? 'Unlocked' : 'Preview'}</span>}
      {status === 'unlocked' && !compact && (
        <div className="skill-node__check">✓</div>
      )}
    </button>
  );
}

// ── Detail panel (docked bottom) ──────────────────────────────────────────────
//
// The whole node, not a teaser: every stat delta and every mechanic it changes,
// each with its own value and — where the copy exists — the same hover
// explanation the character sheet gives. Spending points happens here and
// nowhere else, so the numbers are always in front of you when you commit.

function NodeDesc({
  node,
  player,
  onUnlock,
}: {
  node: SkillNode | null;
  player: SkillPlayer | null;
  onUnlock: (node: SkillNode) => void;
}) {
  if (!node) {
    return (
      <div className="skill-desc skill-desc--empty">
        Select a node to see exactly what it does
      </div>
    );
  }

  const status = getNodeStatus(node, player);
  const { stats, mechanics } = skillNodeLines(node);
  const check = status === 'locked' ? unlockCheck(node, player) : null;
  const blocked = check && !check.ok ? check.reason : undefined;

  return (
    <div className={`skill-desc skill-desc--${status}`}>
      <div className="skill-desc__header">
        <span className="skill-desc__name">{nodeName(node)}</span>
        <span className="skill-desc__tier">{tierLabel(node.tier)}</span>
        <span className="skill-desc__cost">{costLabel(node.cost)}</span>
      </div>

      <div className="skill-desc__body">
        <div className="skill-desc__preview"><SkillCharacterPreview node={node} owned={player?.unlockedSkills ?? []} /></div>
        {node.description && <div className="skill-desc__text">{nodeDescription(node)}</div>}
        <ClassIdentity key={node.id} classId={node.classId ?? node.id} expanded={node.tier === 0} />
        {node.tier === 2 && <p className="skill-desc__text">Range changes your fighting distance and head crest. The body keeps your chosen style.</p>}
        <div className="skill-desc__effects">
          <DetailLines
            title="Stats"
            lines={stats}
            empty={mechanics.length === 0 ? 'No direct stat changes.' : undefined}
          />
          <DetailLines title="Class mechanic changes" lines={mechanics} explain />
        </div>
      </div>

      <div className="skill-desc__footer">
        {status === 'unlocked' && (
          <span className="skill-desc__state skill-desc__state--owned">✓ Unlocked</span>
        )}
        {status === 'available' && (
          <button type="button" className="skill-confirm-btn" onClick={() => onUnlock(node)}>
            Unlock {nodeName(node)} — {costLabel(node.cost)}
          </button>
        )}
        {status === 'locked' && blocked && (
          <span className="skill-desc__state skill-desc__state--blocked">{blocked}</span>
        )}
      </div>
    </div>
  );
}

// ── Class selection view ───────────────────────────────────────────────────────

function ClassSelectionView({
  player,
  selectedNode,
  onSelect,
}: {
  player:  SkillPlayer | null;
  selectedNode: SkillNode | null;
  onSelect: (node: SkillNode) => void;
}) {
  const pts = player?.skillPoints ?? 0;
  return (
    <div className="skill-class-view">
      <p className="skill-tree-instruction">Choose your class. Select a card to compare its mechanics, defense and recovery, then confirm with Unlock. {pts} skill point{pts === 1 ? '' : 's'} available.</p>
      <div className="skill-class-grid" aria-label="Class selection">
        {CLASS_ROOTS.map(id => <SkillNodeCard key={id} node={SKILL_TREE.get(id)!} player={player} selected={selectedNode?.id === id} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

// ── Progression view ───────────────────────────────────────────────────────────

function ProgressionView({
  player,
  selectedNode,
  onSelect,
}: {
  player:  SkillPlayer;
  selectedNode: SkillNode | null;
  onSelect: (node: SkillNode) => void;
}) {
  const classId     = player.selectedClass!;
  const className   = SKILL_TREE.get(classId)?.name ?? classId;
  const pts         = player.skillPoints;
  const tierMap     = getVisibleNodes(player);
  const tiers       = Array.from(tierMap.entries()).sort(([a], [b]) => (a === player.currentSkillTier ? -1 : b === player.currentSkillTier ? 1 : a - b));
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
                <div className="skill-tier-badge">{isCurrent ? `${nodes.every(isPlaceholder) ? 'In development' : 'Next choice'} · ${tierLabel(tier)}` : tierLabel(tier)}</div>
                <div className="skill-tier-nodes">
                  {nodes.map(node => (
                    <SkillNodeCard
                      key={node.id}
                      node={node}
                      player={player}
                      compact={isPast}
                      faded={isPast && !player.unlockedSkills.includes(node.id)}
                      selected={selectedNode?.id === node.id}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {tierMap.has(currentTier + 1) && <p className="skill-tier-upcoming-hint">Next: {tierLabel(currentTier + 1)}. Complete this tier to continue your path.</p>}

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
  const [view, setView] = useState<'choices' | 'build' | 'compare'>('choices');
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const classChosen = player.selectedClass !== null;
  const inspectedNode = selectedNode ?? Array.from(SKILL_TREE.values()).find(node => !isPlaceholder(node) && getNodeStatus(node, player) === 'available')
    ?? [...unlockedSkills].reverse().map(id => SKILL_TREE.get(id)).find(node => node && !isPlaceholder(node))
    ?? SKILL_TREE.get(CLASS_ROOTS[0]) ?? null;

  const compareNodes = inspectedNode
    ? (classChosen ? getVisibleNodes(player).get(inspectedNode.tier) ?? [] : CLASS_ROOTS.map(id => SKILL_TREE.get(id)!))
    : [];

  function handleUnlock(node: SkillNode) {
    if (getNodeStatus(node, player) !== 'available') return;
    hudBus.requestSkillUnlock(node.id);
    setSelectedNode(null);
  }

  return (
    <GameDialog size="wide" className="skill-tree-dialog" onClose={onClose}>
      <DialogHeader
        title="Passive Skill Tree"
        closeLabel="Close passive skill tree"
        actions={
          <div className="skill-tree-legend">
            <span className="legend-item legend-item--unlocked">● unlocked</span>
            <span className="legend-item legend-item--available">● available</span>
            <span className="legend-item legend-item--locked">● locked</span>
          </div>
        }
      />

      <nav className="skill-tree-views" aria-label="Passive tree views">
        <button type="button" aria-pressed={view === 'choices'} onClick={() => setView('choices')}>Choices</button>
        <button type="button" aria-pressed={view === 'build'} onClick={() => setView('build')}>Your build</button>
        <button type="button" aria-pressed={view === 'compare'} disabled={compareNodes.length < 2} onClick={() => setView('compare')}>Compare choices</button>
      </nav>
      {view === 'build' ? <SkillBuildView owned={unlockedSkills} />
        : view === 'compare' && inspectedNode ? <SkillComparison key={inspectedNode.id} primary={inspectedNode} nodes={compareNodes} owned={unlockedSkills} onInspect={node => { setSelectedNode(node); setView('choices'); }} />
        : <div className="skill-tree-workspace">
        <div className="skill-tree-body">
          {classChosen
            ? <ProgressionView
                player={player}
                selectedNode={inspectedNode}
                onSelect={setSelectedNode}
              />
            : <ClassSelectionView
                player={player}
                selectedNode={inspectedNode}
                onSelect={setSelectedNode}
              />}
        </div>

      {/* Rendered in both views: choosing a class is the most irreversible
          decision in the tree, so it gets the same full readout and the same
          confirm step as every node after it. */}
      <NodeDesc node={inspectedNode} player={player} onUnlock={handleUnlock} />
      </div>}
    </GameDialog>
  );
}
