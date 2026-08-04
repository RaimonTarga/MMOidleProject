import { useAtomValue } from 'jotai';
import { useState } from 'react';
import {
  QUEST_DATABASE,
  maxGlobalMasteryAtTier,
  tierAdvancementProgress,
} from '@mmo-idle/shared';
import {
  bossesClearedAtom,
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
import { SealLedgerPanel } from './SealLedgerPanel';
import { sealSourceViewsAtTier, type SealSourceView } from './sealPresentation';

interface Props {
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

/** Countable requirements draw as trophies; tallies draw as a filling conduit. */
function ProgressMeter({
  label,
  progress,
  required,
}: {
  label: string;
  progress: number;
  required: number;
}) {
  const accessibleLabel = `${label}: ${progress} of ${required}`;

  if (required <= PIP_LIMIT) {
    const states: PipState[] = Array.from(
      { length: required },
      (_, i) => (i < progress ? 'done' : 'pending'),
    );
    return <MilestonePips className="quest-pips" states={states} label={accessibleLabel} />;
  }

  return (
    <GradientConduit
      className="quest-conduit"
      fraction={required > 0 ? progress / required : 0}
      ramp="arcane"
      segments={required <= 12 ? required : 0}
      label={accessibleLabel}
      valueText={`${progress} of ${required}`}
    />
  );
}

function SealSources({
  sources,
  tier,
  required,
}: {
  sources: SealSourceView[];
  tier: number;
  required: number;
}) {
  return (
    <div className="seal-sources">
      <div className="seal-sources__heading">
        <span>Boss sources</span>
        <span>Choose {required} of {sources.length}</span>
      </div>
      <div className="seal-sources__grid">
        {sources.map((source) => {
          const status = source.obtained ? 'obtained' : 'available';
          return (
            <div
              key={source.biomeGroup}
              className={`seal-source${source.obtained ? ' seal-source--obtained' : ''}`}
              title={`${source.name} T${tier} seal: ${status}`}
            >
              <span className="seal-source__name">{source.name}</span>
            </div>
          );
        })}
      </div>
    </div>
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
    return (
      <div className="mastery-meter" data-ui-unlock-system="mastery" title={title}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="mastery-meter mastery-meter--button"
      data-ui-unlock-system="mastery"
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
export function QuestPanel({ onOpenMastery, showMastery = true }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sealLedgerOpen, setSealLedgerOpen] = useState(false);
  const playerId = useAtomValue(playerIdAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const questProgress = useAtomValue(questProgressAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);

  if (!playerId || !nodeId) {
    return (
      <HudPanel
        className="sidebar-panel quest-panel"
        data-ui-unlock-system="progression"
      >
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

  const sealProgress = tierAdvancementProgress(bossesCleared, playerTier);
  const sealSources = sealSourceViewsAtTier(bossesCleared, playerTier);
  const usesSeals = sealProgress.required > 0;

  const masteryCap = maxGlobalMasteryAtTier(playerTier);

  const summaryProgress = usesSeals
    ? `${sealProgress.held} / ${sealProgress.required} seals`
    : activeQuest
      ? `${progress} / ${required} quest`
      : 'Content ceiling reached';
  return (
    <>
      <HudPanel
        className={`sidebar-panel quest-panel${detailsOpen ? ' quest-panel--expanded' : ''}`}
        data-ui-unlock-system="progression"
      >
        <button
          type="button"
          className="progression-summary"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <span className="progression-summary__heading">
            <span className="panel-title">Progression</span>
            <span className="progression-summary__chevron" aria-hidden="true">⌄</span>
          </span>
          <span className="progression-summary__body">
            <span className="progression-summary__tier" aria-label={`Tier ${playerTier}`}>
              <small>Tier</small>
              <strong>{playerTier}</strong>
            </span>
            <span className="progression-summary__copy">
              <strong>{summaryProgress}</strong>
            </span>
          </span>
        </button>

        {detailsOpen && (
          <div className="progression-details">
          {usesSeals ? (
        <>
          <div className="quest-name">Seals of Tier {playerTier}</div>
          <div className="quest-desc">
            Defeat {sealProgress.required} distinct Tier {playerTier} biome bosses.
            Each boss grants its seal only on the first clear at this tier.
          </div>

          <div className="quest-progress-row">
            <span className="stat-label">Seals</span>
            <span className="stat-value">
              {sealProgress.held} / {sealProgress.required}
            </span>
          </div>

          <ProgressMeter
            label={`Tier ${playerTier} seals`}
            progress={sealProgress.held}
            required={sealProgress.required}
          />
          <SealSources
            sources={sealSources}
            tier={playerTier}
            required={sealProgress.required}
          />
        </>
      ) : activeQuest ? (
        <>
          <div className="quest-name">{activeQuest.name}</div>
          <div className="quest-desc">{activeQuest.description}</div>

          <div className="quest-progress-row">
            <span className="stat-label">Progress</span>
            <span className="stat-value">{progress} / {required}</span>
          </div>

          <ProgressMeter label="Quest progress" progress={progress} required={required} />
        </>
      ) : (
        <div className="quest-complete">
          No quest for this tier — max tier reached!
        </div>
      )}

            <div className="seal-ledger-trigger">
              <ActionChip
                label="Open the boss seal ledger for every tier"
                showLabel
                icon={atlasIcon('UI_icons/progress-icon.png')}
                tone="primary"
                size="sm"
                onClick={() => setSealLedgerOpen(true)}
              />
            </div>

          </div>
        )}

        {showMastery && (
          <MasteryMeter value={globalMastery} cap={masteryCap} onOpen={onOpenMastery} />
        )}
      </HudPanel>

      {sealLedgerOpen && (
        <SealLedgerPanel
          onClose={() => setSealLedgerOpen(false)}
        />
      )}
    </>
  );
}
