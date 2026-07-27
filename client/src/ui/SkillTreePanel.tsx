import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { SKILL_TREE, canUnlockSkill } from '@mmo-idle/shared';
import type { CSSProperties } from 'react';
import type { SkillNode, StatEffects, SubVariant } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { CONDUIT_ENABLED } from '../featureFlags';
import { MilestonePips, type PipState } from '../hud/primitives';
import { DetailLines } from './describe/DetailLines';
import { skillNodeLines, statEffectLines } from './describe';
import {
  currentSkillTierAtom,
  selectedClassAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  skillPointsAtom,
  unlockedSkillsAtom,
} from '../hud/atoms';
import { DialogHeader, GameDialog } from '../hud/primitives';
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

/**
 * The one-line form, for the class orbit's centre — the only place in the tree
 * too small for the full table. Same labels and units as the detail panel below
 * it, so the summary and the table never disagree.
 */
function effectSummary(effects: StatEffects): string {
  return statEffectLines(effects)
    .map((line) => `${line.value} ${line.label}`)
    .join(' · ');
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

// Conduit (summoner) is hidden from players this playtest: its orb stays visible
// but reads as unavailable, with the description below replacing its flavor text.
const CONDUIT_BLOCKED_DESC = 'In development — not available this playtest.';

function isBlockedConduit(node: SkillNode): boolean {
  return node.id === 'summoner-root' && !CONDUIT_ENABLED;
}

function nodeDescription(node: SkillNode): string {
  return isBlockedConduit(node) ? CONDUIT_BLOCKED_DESC : node.description;
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
      <MilestonePips
        className="skill-node__cost"
        states={Array.from({ length: Math.max(1, node.cost) }, () => 'pending' as PipState)}
        label={`Costs ${node.cost} skill point${node.cost === 1 ? '' : 's'}`}
        size="sm"
      />
      <div className="skill-node__name">{node.name}</div>
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
        <span className="skill-desc__name">{node.name}</span>
        <span className="skill-desc__tier">{tierLabel(node.tier)}</span>
        <span className="skill-desc__cost">{costLabel(node.cost)}</span>
      </div>

      <div className="skill-desc__body">
        {node.description && <div className="skill-desc__text">{nodeDescription(node)}</div>}
        <div className="skill-desc__effects">
          <DetailLines
            title="Stats"
            lines={stats}
            empty={mechanics.length === 0 ? 'No direct stat changes.' : undefined}
          />
          <DetailLines title="Mechanics" lines={mechanics} />
        </div>
      </div>

      <div className="skill-desc__footer">
        {status === 'unlocked' && (
          <span className="skill-desc__state skill-desc__state--owned">✓ Unlocked</span>
        )}
        {status === 'available' && (
          <button type="button" className="skill-confirm-btn" onClick={() => onUnlock(node)}>
            Unlock {node.name} — {costLabel(node.cost)}
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
  // The orbit's centre is a summary; the full table lives in the detail panel
  // below, which has room for it and is where the class is actually committed.
  const displayClass = selectedNode;
  const displayStatus = displayClass ? getNodeStatus(displayClass, player) : null;
  const displayEffects = displayClass ? effectSummary(displayClass.statEffects) : '';

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
              <span className="skill-class-orbit__info-text">{nodeDescription(displayClass)}</span>
            </>
          ) : (
            <>
              <span className="skill-class-orbit__info-title">Choose a Class</span>
              <span className="skill-class-orbit__info-text">
                Select an orb to see everything it grants, then confirm below.
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
                selected={selectedNode?.id === root.id}
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
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const classChosen = player.selectedClass !== null;

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

        <div className="skill-tree-body">
          {classChosen
            ? <ProgressionView
                player={player}
                selectedNode={selectedNode}
                onSelect={setSelectedNode}
              />
            : <ClassSelectionView
                player={player}
                selectedNode={selectedNode}
                onSelect={setSelectedNode}
              />}
        </div>

      {/* Rendered in both views: choosing a class is the most irreversible
          decision in the tree, so it gets the same full readout and the same
          confirm step as every node after it. */}
      <NodeDesc node={selectedNode} player={player} onUnlock={handleUnlock} />
    </GameDialog>
  );
}
