import { useAtomValue } from 'jotai';
import type { SpendView, ThresholdsView } from '@mmo-idle/shared';
import { energyCountAtom, energyMaxAtom, tidePhaseAtom } from './atoms';
import { GradientConduit } from './primitives/GradientConduit';
import { GameIcon } from '../ui/GameIcon';
import { classPieceIconSource } from '../ui/conceptIcons';
import './stormGauge.css';

function clampPct(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function marksOf(view: ThresholdsView) {
  const marks = new Map<number, SpendView[]>([[view.floorPct, []]]);
  for (const piece of view.pieces) {
    const height = piece.atFloor ? view.floorPct : piece.band;
    if (height === null) continue;
    const pieces = marks.get(height) ?? [];
    pieces.push(piece);
    marks.set(height, pieces);
  }
  return [...marks].sort(([a], [b]) => b - a).map(([pct, pieces]) => ({
    pct,
    pieces,
    floor: pct === view.floorPct,
    label: [pct === view.floorPct ? `Floor ${pct}%` : `${pct}%`, ...pieces.map((piece) => piece.name)].join(' · '),
  }));
}

/** The editor's bottle: equal-height pieces share a row so their chips stay readable. */
export function StormBottle({ view }: { view: ThresholdsView }) {
  const energy = useAtomValue(energyCountAtom);
  const max = useAtomValue(energyMaxAtom);
  const pct = clampPct(max > 0 ? energy / max * 100 : 0);
  const overflowing = max > 0 && energy > max;
  const marks = marksOf(view);
  const height = Math.max(270, marks.length * 36);
  // Keep the chips apart even when a floor is close to a band. Lines stay at
  // their exact heights while the labelled rows have room for their icons.
  let previousTop = -36;
  const labelTops = marks.map((mark, index) => {
    const idealTop = (100 - clampPct(mark.pct)) / 100 * height;
    const top = Math.min(height - (marks.length - 1 - index) * 36, Math.max(idealTop, previousTop + 36));
    previousTop = top;
    return top;
  });

  return (
    <div className={`storm-bottle${overflowing ? ' storm-bottle--overflow' : ''}`} aria-label="Storm thresholds" style={{ height }}>
      <span className="storm-bottle__full">Full</span>
      <div
        className="storm-bottle__track"
        role="meter"
        aria-label="Storm"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, max)}
        aria-valuenow={Math.max(0, energy)}
      >
        <span className="storm-bottle__fill" style={{ height: `${pct}%` }} />
      </div>
      {marks.map((mark, index) => (
        <div
          key={mark.pct}
          className={`storm-bottle__mark${mark.floor ? ' storm-bottle__mark--floor' : ''}`}
          style={{ top: labelTops[index] }}
        >
          <span
            className="storm-bottle__line"
            style={{ top: (100 - clampPct(mark.pct)) / 100 * height - labelTops[index] }}
          />
          <span className="storm-bottle__height">{mark.floor ? `Floor ${mark.pct}%` : `${mark.pct}%`}</span>
          <div className="storm-bottle__chips" tabIndex={0} aria-label={mark.label}>
            {mark.pieces.map((piece) => (
              <span key={piece.pieceId} className="storm-bottle__chip" title={piece.text}>
                <GameIcon as="span" source={classPieceIconSource(piece.pieceId)} size={20} fallback={piece.name.charAt(0)} decorative />
                {piece.name}
              </span>
            ))}
          </div>
        </div>
      ))}
      <span className="storm-bottle__empty">Empty</span>
    </div>
  );
}

/**
 * What the storm is doing, in words: Tide's phase, Overflow's brim, Reservoir's bank, or the
 * base phase. Only the discipline's own shape is described (the shared view names it).
 */
export function stormRule(view: ThresholdsView, tide: '' | 'ebb' | 'surge', overflow: number): string {
  if (view.discipline?.id === 'spirit-tide') {
    if (tide === 'surge') return 'Surge: spends cost less; no gathering.';
    if (tide === 'ebb') return 'Ebb: gathering fast; no spends.';
    return 'Tide: ebb to full, then surge to the floor.';
  }
  if (view.discipline?.id === 'spirit-overflow') {
    return overflow > 0
      ? `Overflow: ${Math.ceil(overflow)} past the brim, arcing off and shielding you.`
      : 'Overflow: what you hold past the brim arcs off into enemies near you.';
  }
  if (view.discipline?.id === 'spirit-reservoir') return 'Reservoir: a deep bank, released when it is enough.';
  return view.phase === 'gather' ? 'Gather to full, then break down to the floor.' : 'Hover just above the floor.';
}

/** Reuses the HP shield conduit; the storm's ceiling is independent of max HP. */
export function StormGauge({ view }: { view: ThresholdsView }) {
  const energy = useAtomValue(energyCountAtom);
  const max = useAtomValue(energyMaxAtom);
  const tide = useAtomValue(tidePhaseAtom);
  // Overflow's brim, not a cap: the storm may rise past the bottle. The bar then rescales so
  // the whole storm stays on it, and the brim (the old 100%) is drawn as its own mark.
  const overflow = Math.max(0, energy - max);
  const scale = max > 0 && energy > max ? energy / max : 1;
  const marks = marksOf(view);
  const reading = overflow > 0 ? `Storm ${Math.ceil(energy)} of ${max}, ${Math.ceil(overflow)} past the brim` : `Storm ${Math.ceil(energy)} of ${max}`;
  const rule = stormRule(view, tide, overflow);
  const help = `${reading}. Hits drain the storm before HP. ${rule} ${marks.map((mark) => mark.label).join('; ')}`;

  return (
    <div className="storm-gauge" title={help} data-tide={tide || undefined} data-overflow={overflow > 0 ? '' : undefined}>
      <div className="storm-gauge__readout">
        <span>{`Storm ${Math.ceil(energy)} / ${max}`}</span>
        {tide && <span className="storm-gauge__tide">{tide === 'surge' ? 'Surge' : 'Ebb'}</span>}
        <span>{`Floor ${view.floorPct}%`}</span>
      </div>
      <GradientConduit
        fraction={max > 0 ? energy / (max * scale) : 0}
        ramp="arcane"
        height={7}
        label="Storm — absorbs before health"
        valueText={help}
        layers={(
          <>
            {marks.map((mark) => (
              <span
                key={mark.pct}
                className={`storm-gauge__mark${mark.floor ? ' storm-gauge__mark--floor' : ''}`}
                style={{ left: `${clampPct(mark.pct) / scale}%` }}
                title={mark.label}
              />
            ))}
            {overflow > 0 && (
              <span
                className="storm-gauge__brim"
                style={{ left: `${100 / scale}%` }}
                title="The brim: past this the storm arcs off you"
              />
            )}
          </>
        )}
      />
    </div>
  );
}
