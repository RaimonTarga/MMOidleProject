import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { SKILL_TREE, TUTORIAL_ANCHORS, canUnlockSkill } from '@mmo-idle/shared';
import type { SkillNode, SubVariant } from '@mmo-idle/shared';
import { hudBus } from '../hudBus';
import { CONDUIT_BLOCKED_DESC, isBlockedConduit, isPlaceholder, nodeName, nodeDescription } from './skillNodePresentation';
import { DetailLines } from './describe/DetailLines';
import { skillNodeLines, type DetailLine } from './describe';
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
import { skillVocabularyIconSource } from './conceptIcons';
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

/** Internal tiers start at 0; players count from Tier 1. */
const displayTier = (tier: number) => tier + 1;

/** The last authored tier; everything after it is folded into one "in development" step. */
const PATH_TIER = 3;

function tierKind(tier: number): string {
  if (tier === 0) return 'Class';
  if (tier === 1) return 'Style';
  if (tier === 2) return 'Range';
  if (tier === 3) return 'Path';
  return 'Specialization';
}

const SUB_LABEL: Record<SubVariant, string> = { light: 'Light', balanced: 'Balanced', heavy: 'Heavy' };

function kindLabel(node: SkillNode): string {
  const sub = node.tier === 1 && node.subVariantId ? `${SUB_LABEL[node.subVariantId as SubVariant] ?? node.subVariantId} · ` : '';
  return `Tier ${displayTier(node.tier)} · ${sub}${tierKind(node.tier)}`;
}

/** Short card subtitle: the tier is already on the track, so only what differs. */
function cardKind(node: SkillNode): string {
  const sub = node.tier === 1 && node.subVariantId ? SUB_LABEL[node.subVariantId as SubVariant] : tierKind(node.tier);
  return `${sub} · ${costLabel(node.cost)}`;
}

/** The authored emblem, or a monogram crest for tiers that have no art yet. */
function NodeGlyph({ node, size }: { node: SkillNode; size: number }) {
  if (skillVocabularyIconSource(node)) return <SkillEmblem node={node} size={size} />;
  const letters = nodeName(node).split(/[\s-]+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
  return <span className="skill-monogram" style={{ width: size, height: size }} aria-hidden="true">{letters}</span>;
}

function costLabel(cost: number): string {
  return `${cost} pt${cost !== 1 ? 's' : ''}`;
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

/**
 * A mechanic description belongs with the mechanic rows, not above the stats
 * table. Path nodes and Conduit profiles are included even when their runtime
 * behavior is authored outside the numeric `mechanicEffects` map.
 */
function classMechanicSummaryFor(node: SkillNode, mechanicLineCount: number): string | undefined {
  if (isPlaceholder(node)) return undefined;
  if (mechanicLineCount > 0 || node.tier === 0 || node.tier >= 3 || node.classId === 'summoner-root') {
    return nodeDescription(node);
  }
  return undefined;
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

function unlockCheck(node: SkillNode, player: SkillPlayer) {
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

function getNodeStatus(node: SkillNode, player: SkillPlayer): NodeStatus {
  if (isBlockedConduit(node)) return 'locked';
  if (player.unlockedSkills.includes(node.id)) return 'unlocked';
  return unlockCheck(node, player).ok ? 'available' : 'locked';
}

/**
 * The choices a tier offers this character: the class roots before a class is
 * picked; afterwards the class's nodes, with Path-and-later filtered to the
 * chosen style.
 */
function choicesAt(tier: number, player: SkillPlayer): SkillNode[] {
  if (tier === 0) return CLASS_ROOTS.map((id) => SKILL_TREE.get(id)!).filter(Boolean);
  const classId = player.selectedClass;
  return [...SKILL_TREE.values()].filter((node) =>
    node.tier === tier
    && node.classId === classId
    && (tier < 3 || node.subVariantId === player.selectedSubVariant));
}

/** The Path nodes a style would open, whichever style is chosen. */
function pathsFor(style: SkillNode): SkillNode[] {
  return [...SKILL_TREE.values()].filter((node) =>
    node.tier === PATH_TIER && node.classId === style.classId && node.subVariantId === style.subVariantId);
}

/** Stat lines, each marked with its siblings' values where the choice differs. */
function comparedStats(node: SkillNode, siblings: readonly SkillNode[]): DetailLine[] {
  const { stats } = skillNodeLines(node);
  const others = siblings.filter((sibling) => sibling.id !== node.id).map((sibling) => skillNodeLines(sibling).stats);
  if (others.length === 0) return stats;
  return stats.map((line) => {
    const values = others.map((lines) => lines.find((other) => other.key === line.key)?.value ?? '—');
    return values.some((value) => value !== line.value)
      ? { ...line, detail: `vs ${values.join(' / ')}` }
      : line;
  });
}

// ── Journey track ─────────────────────────────────────────────────────────────
//
// Replaces the old "Your build" tab: every tier you have passed shows what you
// took, the current one says so, and the unauthored tiers fold into one step.

function JourneyTrack({
  player,
  viewTier,
  onView,
}: {
  player: SkillPlayer;
  viewTier: number;
  onView: (tier: number) => void;
}) {
  const current = player.selectedClass ? player.currentSkillTier : 0;
  const steps = [0, 1, 2, 3, 4].map((tier) => {
    const beyond = tier > PATH_TIER;
    const taken = beyond ? undefined : player.unlockedSkills
      .map((id) => SKILL_TREE.get(id))
      .find((node) => node && node.tier === tier && (tier === 0 || node.classId === player.selectedClass));
    const now = beyond ? current > PATH_TIER : current === tier && !taken;
    return { tier, beyond, taken, now };
  });
  return (
    <div className="skill-track" aria-label="Your path through the tree">
      {steps.map(({ tier, beyond, taken, now }) => {
        const state = taken ? 'done' : now ? 'now' : beyond ? 'dev' : 'later';
        const clickable = !!taken || now;
        return (
          <button
            key={tier}
            type="button"
            className={`skill-track__step skill-track__step--${state}`}
            aria-pressed={clickable && viewTier === (beyond ? current : tier)}
            disabled={!clickable}
            onClick={() => onView(beyond ? current : tier)}
          >
            <span className="skill-track__dot">
              {taken ? <NodeGlyph node={taken} size={22} /> : now ? '●' : beyond ? '…' : displayTier(tier)}
            </span>
            <span className="skill-track__tier">
              {beyond ? `Tier ${displayTier(PATH_TIER + 1)}+` : `Tier ${displayTier(tier)} · ${tierKind(tier)}`}
            </span>
            <span className="skill-track__name">
              {taken ? nodeName(taken) : now ? 'Choose now' : beyond ? 'In development' : 'Later'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Choice cards ──────────────────────────────────────────────────────────────

function ChoiceCard({
  node,
  player,
  selected,
  past,
  onSelect,
}: {
  node: SkillNode;
  player: SkillPlayer;
  selected: boolean;
  /** A tier already decided: the pick is marked, the others read as roads not taken. */
  past: boolean;
  onSelect: (node: SkillNode) => void;
}) {
  const status = getNodeStatus(node, player);
  const dev = isBlockedConduit(node) || isPlaceholder(node);
  const stats = skillNodeLines(node).stats.slice(0, 3);
  return (
    <button
      type="button"
      className={[
        'skill-card',
        `skill-card--${status}`,
        past && status !== 'unlocked' ? 'skill-card--not-taken' : '',
      ].filter(Boolean).join(' ')}
      data-sub={node.tier === 1 ? node.subVariantId : undefined}
      aria-pressed={selected}
      onClick={() => onSelect(node)}
    >
      <span className="skill-card__top">
        <NodeGlyph node={node} size={36} />
        <span className="skill-card__titles">
          <span className="skill-card__name">{nodeName(node)}</span>
          <span className="skill-card__kind">{cardKind(node)}</span>
        </span>
        {status === 'unlocked' && <span className="skill-card__check" aria-label="Unlocked">✓</span>}
      </span>
      <span className="skill-card__line">{dev ? 'In development' : firstSentence(nodeDescription(node))}</span>
      {stats.length > 0 && (
        <span className="skill-card__stats">
          {stats.map((line) => (
            <span key={line.key} className="skill-card__stat">{line.label} <b>{line.value}</b></span>
          ))}
        </span>
      )}
    </button>
  );
}

// ── Branch diagram ────────────────────────────────────────────────────────────
//
// Choosing a style silently decides which Paths open two tiers later. The
// diagram makes that visible: every style and the three Paths it leads to.

function StyleBranches({
  styles,
  selectedStyle,
  selectedNode,
  onPeek,
}: {
  styles: readonly SkillNode[];
  selectedStyle: SkillNode | null;
  selectedNode: SkillNode | null;
  onPeek: (node: SkillNode) => void;
}) {
  return (
    <div className="skill-branches">
      <div className="skill-branches__label">Where each style leads · Tier {displayTier(PATH_TIER)} paths</div>
      <div className="skill-branches__cols">
        {styles.map((style) => (
          <div
            key={style.id}
            className={`skill-branches__col${style.id === selectedStyle?.id ? ' skill-branches__col--selected' : ''}`}
            data-sub={style.subVariantId}
          >
            <div className="skill-branches__style">{nodeName(style)} →</div>
            {pathsFor(style).map((path) => (
              <button
                key={path.id}
                type="button"
                className="skill-branches__path"
                aria-pressed={selectedNode?.id === path.id}
                onClick={() => onPeek(path)}
              >
                {nodeName(path)}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail pane ───────────────────────────────────────────────────────────────
//
// The whole node, not a teaser: every stat (marked where it differs from the
// other choices at its tier) and every mechanic, with the character preview.
// Spending points happens here and nowhere else.

function NodeDesc({
  node,
  player,
  siblings,
  onUnlock,
}: {
  node: SkillNode | null;
  player: SkillPlayer;
  siblings: readonly SkillNode[];
  onUnlock: (node: SkillNode) => void;
}) {
  if (!node) {
    return <div className="skill-desc skill-desc--empty">Select a choice to see exactly what it does</div>;
  }

  const status = getNodeStatus(node, player);
  const { mechanics } = skillNodeLines(node);
  const stats = comparedStats(node, siblings);
  const classMechanicSummary = classMechanicSummaryFor(node, mechanics.length);
  const future = player.selectedClass && node.tier > player.currentSkillTier && status !== 'unlocked';
  const check = status === 'locked' && !future ? unlockCheck(node, player) : null;
  const blocked = check && !check.ok ? check.reason : undefined;
  const paths = node.tier === 1 && node.classId ? pathsFor(node) : [];

  return (
    <div className={`skill-desc skill-desc--${status}`}>
      {future && <div className="skill-desc__peek">Preview · opens at Tier {displayTier(node.tier)}</div>}
      <div className="skill-desc__header">
        <span className="skill-desc__name">{nodeName(node)}</span>
        <span className="skill-desc__tier">{kindLabel(node)}</span>
        <span className="skill-desc__cost">{costLabel(node.cost)}</span>
      </div>

      <div className="skill-desc__body">
        <div className="skill-desc__preview"><SkillCharacterPreview node={node} owned={player.unlockedSkills} /></div>
        {node.description && !classMechanicSummary && <div className="skill-desc__text">{nodeDescription(node)}</div>}
        <ClassIdentity key={node.id} classId={node.classId ?? node.id} expanded={node.tier === 0} />
        {node.tier === 2 && <p className="skill-desc__text">Range changes your fighting distance and head crest. The body keeps your chosen style.</p>}
        <div className="skill-desc__effects">
          <DetailLines
            title="Stats"
            lines={stats}
            empty={mechanics.length === 0 ? 'No direct stat changes.' : undefined}
          />
          <DetailLines
            title="Class mechanics"
            className="detail-lines--class-mechanics"
            intro={classMechanicSummary}
            lines={mechanics}
            explain
          />
        </div>
        {paths.length > 0 && (
          <div className="skill-desc__paths">
            <div className="detail-lines__title">Leads to · Tier {displayTier(PATH_TIER)} paths</div>
            {paths.map((path) => (
              <details key={path.id} className="skill-desc__path">
                <summary>{nodeName(path)}</summary>
                <p>{nodeDescription(path)}</p>
              </details>
            ))}
          </div>
        )}
      </div>

      <div className="skill-desc__footer">
        {status === 'unlocked' && <span className="skill-desc__state skill-desc__state--owned">✓ Unlocked</span>}
        {status === 'available' && (
          <button type="button" className="skill-confirm-btn" data-tutorial-anchor={TUTORIAL_ANCHORS.classConfirm} onClick={() => onUnlock(node)}>
            Unlock {nodeName(node)} · {costLabel(node.cost)}
          </button>
        )}
        {future && <span className="skill-desc__state">Opens at Tier {displayTier(node.tier)}</span>}
        {status === 'locked' && blocked && <span className="skill-desc__state skill-desc__state--blocked">{blocked}</span>}
      </div>
    </div>
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
    selectedClass, selectedSubVariant, selectedRange, unlockedSkills, skillPoints, currentSkillTier,
  };
  const currentTier = selectedClass ? currentSkillTier : 0;
  const [viewTier, setViewTier] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  const shownTier = viewTier ?? currentTier;
  const choices = choicesAt(shownTier, player);
  const past = shownTier < currentTier || (shownTier === 0 && !!selectedClass);
  const taken = choices.find((node) => unlockedSkills.includes(node.id));
  const inspected = selectedNode
    ?? (past ? taken : choices.find((node) => !isPlaceholder(node) && getNodeStatus(node, player) === 'available'))
    ?? choices[0]
    ?? null;
  const styleStep = shownTier === 1 && !!selectedClass;
  // The style the branch diagram highlights: the one you took, or the one you are reading.
  const selectedStyle = styleStep
    ? (inspected?.tier === 1 ? inspected : choices.find((node) => node.subVariantId === inspected?.subVariantId) ?? taken ?? null)
    : null;
  const siblings = inspected ? choicesAt(inspected.tier, player) : [];

  function handleUnlock(node: SkillNode) {
    if (getNodeStatus(node, player) !== 'available') return;
    hudBus.requestSkillUnlock(node.id);
    setSelectedNode(null);
    setViewTier(null);
  }

  function viewTierAt(tier: number) {
    setViewTier(tier === currentTier ? null : tier);
    setSelectedNode(null);
  }

  const kind = tierKind(shownTier).toLowerCase();
  const heading = past
    ? `Tier ${displayTier(shownTier)} · ${tierKind(shownTier)}${taken ? ` — you chose ${nodeName(taken)}` : ''}`
    : `Choose your ${kind}`;
  const blurb = past
    ? 'Choices you did not take stay readable here. A class reset reopens them.'
    : shownTier === 0 ? 'Your class decides how you fight. Read each one, then confirm with Unlock.'
      : shownTier === 1 ? `Sets your fighting style and decides which Tier ${displayTier(PATH_TIER)} paths you can take.`
        : shownTier === 2 ? 'Sets your fighting distance.'
          : shownTier === PATH_TIER ? 'Your specialization, opened by your style.'
            : 'These tiers are still being designed.';

  return (
    <GameDialog size="wide" className="skill-tree-dialog" onClose={onClose}>
      <DialogHeader
        title="Passive Tree"
        closeLabel="Close passive tree"
        actions={<span className="skill-tree-points">{skillPoints} skill point{skillPoints === 1 ? '' : 's'}</span>}
      />

      <div className="skill-tree-workspace">
        <div className="skill-tree-body">
          <JourneyTrack player={player} viewTier={shownTier} onView={viewTierAt} />
          <div className="skill-prompt">
            <span className="skill-prompt__title">{heading}</span>
            <span className="skill-prompt__blurb">{blurb}</span>
            {past && (
              <button type="button" className="skill-prompt__back" onClick={() => viewTierAt(currentTier)}>
                Back to your current choice
              </button>
            )}
          </div>
          <div
            className={`skill-cards${choices.length > 3 ? ' skill-cards--many' : ''}`}
            data-tutorial-anchor={TUTORIAL_ANCHORS.classChoices}
          >
            {choices.map((node) => (
              <ChoiceCard
                key={node.id}
                node={node}
                player={player}
                past={past}
                selected={inspected?.id === node.id}
                onSelect={setSelectedNode}
              />
            ))}
          </div>
          {styleStep && (
            <StyleBranches
              styles={choices}
              selectedStyle={selectedStyle}
              selectedNode={inspected}
              onPeek={setSelectedNode}
            />
          )}
        </div>

        <NodeDesc node={inspected} player={player} siblings={siblings} onUnlock={handleUnlock} />
      </div>
    </GameDialog>
  );
}
