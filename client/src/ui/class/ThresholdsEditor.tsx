import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { withBand, withFloor, withPhase, type ClassConfig, type ClassScreenView, type ThresholdsView } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { energyMaxAtom } from '../../hud/atoms';
import { StormBottle, stormRule } from '../../hud/StormGauge';
import { GameIcon } from '../GameIcon';
import { classPieceIconSource, trophyIconSource } from '../conceptIcons';
import { rankMark } from './format';
import { useThresholdsView } from './useThresholdsView';
import './thresholdsEditor.css';

const BAND_HEIGHTS = [30, 50, 80, 100] as const;

function FloorEditor({ config, thresholds }: { config: ClassConfig; thresholds: ThresholdsView }) {
  const [floor, setFloor] = useState(thresholds.floorPct);
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      hudBus.requestSetClassConfig(withFloor(config, floor));
    }}>
      <StormBottle view={{ ...thresholds, floorPct: floor }} />
      <label className="thresholds-editor__floor">
        {`Floor ${floor}%`}
        <input type="range" min={0} max={95} step={1} value={floor} onChange={(event) => setFloor(Number(event.target.value))} />
      </label>
      <button type="submit" className="thresholds-editor__choice" disabled={floor === thresholds.floorPct}>
        Set floor
      </button>
      <p className="class-panel__line">Spends keep this much storm. Hits can still drain it before HP.</p>
    </form>
  );
}

/** The Spirit's bottle: edits are intents; the server supplies the accepted setup. */
export function ThresholdsEditor({ view }: { view: ClassScreenView }) {
  const thresholds = useThresholdsView();
  const bottle = useAtomValue(energyMaxAtom);
  const config = view.config;
  if (!thresholds || !config || config.system.kind !== 'thresholds') {
    return <p className="class-panel__editor">Thresholds appear once this character&apos;s setup arrives.</p>;
  }

  return (
    <div className="thresholds-editor">
      <div className="thresholds-editor__budget" aria-label={`Storm ${thresholds.storm.pips} pips`}>
        <span>{`Storm ${thresholds.storm.pips}`}</span>
        <span className="thresholds-editor__pips" aria-hidden="true">
          {Array.from({ length: thresholds.storm.pips }, (_, index) => <i key={index} />)}
        </span>
        {thresholds.discipline?.id === 'spirit-reservoir' && <span>{`Deep bottle: ${Math.round(bottle)}`}</span>}
      </div>
      {thresholds.discipline && (
        <p className="class-panel__line">{`${thresholds.discipline.name}. ${stormRule(thresholds, '', 0)}`}</p>
      )}

      <FloorEditor key={thresholds.floorPct} config={config} thresholds={thresholds} />

      {thresholds.discipline?.id !== 'spirit-tide' && (<>
      <h4 className="class-panel__subheading">Phase</h4>
      <div className="thresholds-editor__choices" role="group" aria-label="Storm phase">
        {(['gather', 'hover'] as const).map((phase) => (
          <button
            key={phase}
            type="button"
            className="thresholds-editor__choice"
            aria-pressed={thresholds.phase === phase}
            onClick={() => hudBus.requestSetClassConfig(withPhase(config, phase))}
          >
            {phase === 'gather' ? 'Gather' : 'Hover'}
          </button>
        ))}
      </div>
      <p className="class-panel__line">
        {thresholds.phase === 'gather' ? 'Gather to full, then break down to the floor.' : 'Hover just above the floor.'}
      </p>
      </>)}
      {thresholds.discipline?.id === 'spirit-tide' && (
        <p className="class-panel__line">The tide sets the phase: ebb to full, then surge down to the floor.</p>
      )}

      <h4 className="class-panel__subheading">Pieces you know</h4>
      <div className="class-panel__cards">
        {thresholds.pieces.map((piece) => (
          <article key={piece.pieceId} className="class-panel__card">
            <GameIcon source={classPieceIconSource(piece.pieceId)} size={36} fallback={piece.name.charAt(0)} decorative />
            <div>
              <div className="class-panel__card-title">
                <span className="class-panel__name">{piece.name}</span>
                <span className="class-panel__rank">{rankMark(piece.rank)}</span>
                <span className="class-panel__family">{piece.family}</span>
              </div>
              <p className="class-panel__line">{piece.text}</p>
              {piece.waitsFor && <p className="class-panel__line">{`Waits for ${piece.waitsFor}`}</p>}
              {piece.atFloor ? (
                <p className="class-panel__line">{`At the floor (${thresholds.floorPct}%)`}</p>
              ) : piece.automatic ? (
                <p className="class-panel__line">Fires by itself, as the surge opens.</p>
              ) : (
                <>
                  <p className="class-panel__line">{piece.band === null ? 'Off the gauge' : `Band ${piece.band}%`}</p>
                  <div className="thresholds-editor__choices" role="group" aria-label={`${piece.name} band`}>
                    {BAND_HEIGHTS.map((height) => (
                      <button
                        key={height}
                        type="button"
                        className="thresholds-editor__choice"
                        aria-pressed={piece.band === height}
                        onClick={() => hudBus.requestSetClassConfig(withBand(config, piece.pieceId, height))}
                      >
                        {`${height}%`}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="thresholds-editor__choice"
                      aria-pressed={piece.band === null}
                      onClick={() => hudBus.requestSetClassConfig(withBand(config, piece.pieceId, null))}
                    >
                      Off
                    </button>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <h4 className="class-panel__subheading">Relic</h4>
      <article className="class-panel__card">
        <GameIcon
          source={thresholds.relic.trophyId ? trophyIconSource(thresholds.relic.trophyId) : null}
          size={36}
          fallback={thresholds.relic.name.charAt(0)}
          decorative
        />
        <div>
          <div className="class-panel__card-title">
            <span className="class-panel__name">{thresholds.relic.name}</span>
            {thresholds.relic.kind !== 'none' && <span className="class-panel__family">{`${thresholds.relic.kind} relic`}</span>}
          </div>
          <p className="class-panel__line">{thresholds.relic.text}</p>
        </div>
      </article>

      {thresholds.problems.length > 0 && (
        <ul className="thresholds-editor__problems" role="alert">
          {thresholds.problems.map((problem, index) => <li key={`${index}-${problem}`}>{problem}</li>)}
        </ul>
      )}
    </div>
  );
}
