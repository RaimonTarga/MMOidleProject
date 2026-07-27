import { useAtomValue } from 'jotai';
import {
  QUEST_DATABASE,
  NODE_BIOMES,
  maxGlobalMasteryAtTier,
  shortestWorldPath,
} from '@mmo-idle/shared';
import {
  globalMasteryAtom,
  playerIdAtom,
  playerNodeIdAtom,
  playerTierAtom,
  questProgressAtom,
} from '../hud/atoms';
import {
  ActionChip,
  GradientConduit,
  HudPanel,
  MilestonePips,
  type PipState,
} from '../hud/primitives';
import { atlasIcon } from './GameIcon';

interface Props {
  onFindDungeon?: (nodeIds: string[]) => void;
  /** Desktop only: the dial opens the Mastery dialog through the rail's toggler. */
  onOpenMastery?: () => void;
  /** Mirrors the Mastery visibility gate; the dial inherits it (§16). */
  showMastery?: boolean;
}

/**
 * Above this, a requirement is a tally and reads better as a filling bar; at or
 * below it, each unit is a discrete trophy and reads better as countable pips.
 *
 * This is the seam for tier quests becoming "collect N boss seals" instead of a
 * single kill. Nothing here knows what a unit *is* — it renders `progress` out
 * of `required`, so seals need only a data change: `killsRequired: 3` with
 * distinct sources draws three pips, and the copy comes from the quest's own
 * name and description. Today's one-boss quests already draw as a single
 * milestone pip, which is the same shape with N of 1.
 */
const PIP_LIMIT = 6;

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

/** Countable requirements draw as trophies; tallies draw as a filling conduit. */
function QuestProgress({ progress, required }: { progress: number; required: number }) {
  const label = `Quest progress: ${progress} of ${required}`;

  if (required <= PIP_LIMIT) {
    const states: PipState[] = Array.from(
      { length: required },
      (_, i) => (i < progress ? 'done' : 'pending'),
    );
    return <MilestonePips className="quest-pips" states={states} label={label} />;
  }

  return (
    <GradientConduit
      className="quest-conduit"
      fraction={required > 0 ? progress / required : 0}
      ramp="arcane"
      segments={required <= 12 ? required : 0}
      label={label}
      valueText={`${progress} of ${required}`}
    />
  );
}

/**
 * Global Mastery, and the way into its dialog. A gold accumulation bar rather
 * than a gauge: mastery only ever climbs toward this tier's ceiling, which is
 * exactly what the conduit grammar is for (§15 assigns it the gold ramp).
 */
function MasteryMeter({
  value,
  cap,
  onOpen,
}: {
  value: number;
  cap: number;
  onOpen?: () => void;
}) {
  const fraction = cap > 0 ? Math.min(1, value / cap) : 0;
  const capped = cap > 0 && value >= cap;
  const title = capped
    ? `Global Mastery ${value} of ${cap} — this tier's ceiling. Advance a tier to raise it.`
    : `Global Mastery ${value} of ${cap}. The ceiling rises with your tier.`;

  const body = (
    <>
      <span className="mastery-meter__row">
        <span className="mastery-meter__label">Mastery</span>
        <span className={`mastery-meter__value${capped ? ' mastery-meter__value--capped' : ''}`}>
          {value} / {cap}
        </span>
      </span>
      <GradientConduit
        fraction={fraction}
        ramp="gold"
        state={capped ? 'max' : undefined}
        decorative
      />
    </>
  );

  if (!onOpen) {
    return <div className="mastery-meter" title={title}>{body}</div>;
  }

  return (
    <button
      type="button"
      className="mastery-meter mastery-meter--button"
      onClick={onOpen}
      title={title}
      aria-label={`${title} Opens the mastery breakdown.`}
    >
      {body}
    </button>
  );
}

/**
 * The tier's two progressions in one panel: the quest that opens the next tier,
 * and Global Mastery against the ceiling this tier allows. Both are gated by
 * `playerTier`, so reading them apart invited the wrong conclusion — a full
 * quest bar means nothing if mastery is still short of the upgrade thresholds.
 */
export function QuestPanel({ onFindDungeon, onOpenMastery, showMastery = true }: Props) {
  const playerId = useAtomValue(playerIdAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const questProgress = useAtomValue(questProgressAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);

  if (!playerId || !nodeId) {
    return (
      <HudPanel className="sidebar-panel quest-panel">
        <div className="panel-title">Progression</div>
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

  const dungeons = (activeQuest && onFindDungeon)
    ? findDungeonsForTier(nodeId, playerTier)
    : [];

  const masteryCap = maxGlobalMasteryAtTier(playerTier);

  return (
    <HudPanel className="sidebar-panel quest-panel">
      <div className="panel-title">Progression</div>

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
            {/* Was a whole-panel click target with a '▶ locate dungeons on map'
                hint. A panel-sized button hid the action and read as decoration;
                this states it where the quest is. */}
            {dungeons.length > 0 && onFindDungeon && (
              <ActionChip
                label="Locate dungeons on map"
                icon={atlasIcon('UI_icons/actions/locate.png')}
                size="sm"
                onClick={() => onFindDungeon(dungeons)}
              />
            )}
          </div>

          <QuestProgress progress={progress} required={required} />
        </>
      ) : (
        <div className="quest-complete">
          No quest for this tier — max tier reached!
        </div>
      )}

      {showMastery && (
        <MasteryMeter value={globalMastery} cap={masteryCap} onOpen={onOpenMastery} />
      )}
    </HudPanel>
  );
}
