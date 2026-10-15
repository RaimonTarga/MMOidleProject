import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { MechanicFrame } from './MechanicFrame';
import type { CooldownMechanicModel } from './types';

/** Costs land on halves of a pip. A whole pip stays a whole number. */
function formatPips(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function resolveHelp(
  resolve: number,
  resolveMax: number,
  ready: boolean,
  channeling: boolean,
): ReactNode {
  const shown = formatPips(resolve);
  const max = formatPips(resolveMax);
  return (
    <>
      <div>
        Resolve fills when you are hit, from each enemy on you, and when an
        answer lands. Responses spend it. A full bar arms the slam.
      </div>
      <div style={{ marginTop: 6 }}>
        {ready
          ? `Full — ${shown} of ${max}. Your next attack is the slam.`
          : `${shown} of ${max} pips.`}
        {channeling && ' Channelling.'}
      </div>
    </>
  );
}

/**
 * The Squire's Resolve, in the slot the cooldown dial used. One pip per point
 * of `resolveMax`, the next pip filled by the fraction, a pulse when the bar
 * jumps by a pip or more, and the slam marker lit while the slam is armed.
 */
export function ResolvePips({ model }: { model: CooldownMechanicModel }) {
  const resolve = model.resolve;
  const resolveMax = model.resolveMax;
  const pipCount = Math.max(0, Math.round(resolveMax));
  const previous = useRef(resolve);
  const pulseTimer = useRef<number | null>(null);
  const [pulse, setPulse] = useState(false);

  useLayoutEffect(() => () => {
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
  }, []);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = resolve;
    if (
      resolve - before < 1 - 1e-6
      || document.visibilityState === 'hidden'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    setPulse(true);
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => {
      pulseTimer.current = null;
      setPulse(false);
    }, 420);
  }, [resolve]);

  const shown = formatPips(resolve);
  const status = model.isChanneling
    ? `Channel ${Math.round(model.channelRemainingPct)}%`
    : model.executionReady
      ? 'Slam'
      : `${shown} / ${pipCount}`;
  const label = model.executionReady
    ? `Resolve ${shown} of ${pipCount}, slam ready`
    : `Resolve ${shown} of ${pipCount}`;

  return (
    <MechanicFrame
      kind="cooldown"
      help={resolveHelp(resolve, resolveMax, model.executionReady, model.isChanneling)}
      title="Resolve"
      status={status}
      state={pulse ? 'fired' : model.isChanneling ? 'channeling' : model.executionReady ? 'ready' : undefined}
    >
      <div
        className={`mechanic-resolve${pulse ? ' mechanic-resolve--pulse' : ''}`}
        role="img"
        aria-label={label}
        style={{
          gridTemplateColumns: pipCount > 0
            ? `repeat(${pipCount}, minmax(0, 1fr)) minmax(16px, 1.35fr)`
            : 'minmax(16px, 1.35fr)',
        } as CSSProperties}
      >
        {Array.from({ length: pipCount }, (_, index) => {
          const amount = Math.max(0, Math.min(1, resolve - index));
          return (
            <span key={index} className="mechanic-resolve__pip" aria-hidden="true">
              <i
                className="mechanic-resolve__fill"
                style={{ height: `${amount * 100}%` }}
              />
            </span>
          );
        })}
        <span
          className={`mechanic-resolve__slam${model.executionReady ? ' mechanic-resolve__slam--lit' : ''}`}
          aria-hidden="true"
        />
      </div>
    </MechanicFrame>
  );
}

/** The one-line mobile reading of the same bar. */
export function ResolveCompact({ model }: { model: CooldownMechanicModel }) {
  const resolve = model.resolve;
  const resolveMax = model.resolveMax;
  const pct = resolveMax > 0 ? (resolve / resolveMax) * 100 : 0;
  const shown = formatPips(resolve);
  const max = formatPips(resolveMax);
  const label = model.isChanneling ? 'Channel' : 'Resolve';
  const value = model.isChanneling
    ? `${Math.round(model.channelRemainingPct)}%`
    : model.executionReady
      ? 'SLAM'
      : `${shown} / ${max}`;
  const width = model.isChanneling ? model.channelRemainingPct : pct;

  return (
    <div className="compact-mechanic compact-mechanic--cooldown">
      <div className="stat-row">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="compact-mechanic__track">
        <span style={{ width: `${Math.max(0, Math.min(100, width))}%` }} />
      </div>
    </div>
  );
}
