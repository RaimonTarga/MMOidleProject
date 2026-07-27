import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { SKILL_TREE, canUnlockSkill } from '@mmo-idle/shared';
import type { CSSProperties } from 'react';
import type { SkillNode, StatEffects, SubVariant } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { CONDUIT_ENABLED } from '../featureFlags';
import { useIsMobile } from '../hud/useIsMobile';
import { MilestonePips, type PipState } from '../hud/primitives';
import { atlasIcon, GameIcon } from './GameIcon';
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

/** The authored stat glyphs, keyed by the effect they measure (V0b). */
const EFFECT_GLYPH: Record<string, string> = {
  attack:          'UI_icons/stats/attack.png',
  plating:         'UI_icons/stats/plating.png',
  damageReduction: 'UI_icons/stats/reduction.png',
  evasion:         'UI_icons/stats/evasion.png',
  attackRange:     'UI_icons/stats/range.png',
  attackCooldown:  'UI_icons/stats/speed.png',
  maxHp:           'UI_icons/stats/shield.png',
  hpRegen:         'UI_icons/stats/regen.png',
  speed:           'UI_icons/stats/speed.png',
};

interface EffectEntry {
  key: string;
  value: number;
  label: string;
}

function effectEntries(effects: StatEffects): EffectEntry[] {
  return Object.entries(effects)
    .filter(([, v]) => v !== undefined && v !== 0)
    .map(([k, v]) => ({ key: k, value: v as number, label: EFFECT_LABELS[k] ?? k }));
}

function formatEffects(effects: StatEffects): string {
  return effectEntries(effects)
    .map((e) => `${e.value > 0 ? '+' : ''}${e.value} ${e.label}`)
    .join('  ');
}

/**
 * What a node does, as glyph chips rather than a run-on string of abbreviations
 * (§14.6). The number still shows — the glyph replaces "ATK", not the value.
 */
function EffectChips({ effects }: { effects: StatEffects }) {
  const entries = effectEntries(effects);
  if (entries.length === 0) return null;
  return (
    <div className="skill-effect-chips">
      {entries.map((entry) => (
        <span
          key={entry.key}
          className={`skill-effect-chip${entry.value < 0 ? ' skill-effect-chip--down' : ''}`}
          title={`${entry.value > 0 ? '+' : ''}${entry.value} ${entry.label}`}
        >
          <GameIcon
            source={EFFECT_GLYPH[entry.key] ? atlasIcon(EFFECT_GLYPH[entry.key]) : null}
            size={14}
            fallback={entry.label.slice(0, 1)}
            decorative
          />
          <span className="skill-effect-chip__value">
            {entry.value > 0 ? '+' : ''}{entry.value}
          </span>
        </span>
      ))}
    </div>
  );
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

function getNodeStatus(node: SkillNode, player: SkillPlayer | null): NodeStatus {
  if (!player) return 'locked';
  if (isBlockedConduit(node)) return 'locked';
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
  faded = false,
  isMobile,
  selected = false,
  onHover,
  onSelect,
}: {
  node:     SkillNode;
  player:   SkillPlayer | null;
  compact?: boolean;
  /**
   * A road not taken: a past-tier sibling the player did not pick. Dimmed and
   * shrunk rather than hidden — class reset exists, so the alternatives have to
   * stay legible — and it expands back on hover or tap.
   */
  faded?: boolean;
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
        faded ? 'skill-node--faded' : '',
        status === 'unlocked' ? 'skill-node--spine' : '',
        selected ? 'skill-node--selected' : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
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

  const status  = getNodeStatus(node, player);

  return (
    <div className={`skill-desc skill-desc--${status}`}>
      <div className="skill-desc__header">
        <span className="skill-desc__name">{node.name}</span>
        <span className="skill-desc__tier">{tierLabel(node.tier)}</span>
        <span className="skill-desc__cost">{costLabel(node.cost)}</span>
      </div>
      <EffectChips effects={node.statEffects} />
      {node.description && <div className="skill-desc__text">{nodeDescription(node)}</div>}
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
              <span className="skill-class-orbit__info-text">{nodeDescription(displayClass)}</span>
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
                      faded={isPast && !player.unlockedSkills.includes(node.id)}
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
    </GameDialog>
  );
}
