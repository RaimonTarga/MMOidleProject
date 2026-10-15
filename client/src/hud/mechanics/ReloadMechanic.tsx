import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { SLINGER_LAST_ROUND_CSS } from '../../ui/slingerClipColor';
import { MechanicFrame } from './MechanicFrame';

import type { ReloadMechanicModel } from './types';

/** Reload progress, 0 at the start and 1 when the bar is full. Smooths the 5 Hz sample. */
function useReloadFill(remainingMs: number, durationMs: number): number {
  const sample = useRef({ remainingMs, durationMs, at: performance.now() });
  const [pct, setPct] = useState(0);

  useEffect(() => {
    sample.current = { remainingMs, durationMs, at: performance.now() };
    if (durationMs <= 0 || remainingMs <= 0) {
      setPct(0);
      return;
    }
    let frame = 0;
    const tick = () => {
      const current = sample.current;
      const left = Math.max(0, current.remainingMs - (performance.now() - current.at));
      setPct(current.durationMs > 0 ? Math.min(1, Math.max(0, 1 - left / current.durationMs)) : 0);
      if (left > 0) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [remainingMs, durationMs]);

  return pct;
}

const AMMO_CENTER = 35;

function ammoPoint(index: number, total: number, radius: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / Math.max(1, total)) * Math.PI * 2;
  return {
    x: AMMO_CENTER + Math.cos(angle) * radius,
    y: AMMO_CENTER + Math.sin(angle) * radius,
  };
}

function ammoGeometry(max: number): { radius: number; dotRadius: number; density: string } {
  if (max >= 18) return { radius: 27, dotRadius: 2, density: ' mechanic-reload--very-dense' };
  if (max >= 12) return { radius: 26, dotRadius: 2.4, density: ' mechanic-reload--dense' };
  if (max >= 8) return { radius: 25, dotRadius: 3, density: '' };
  return { radius: 24, dotRadius: 3.5, density: '' };
}

function AmmoPolygon({
  ammo,
  max,
  clipColor,
  nextClipColor,
  clipName,
  nextClipName,
  reloadPct,
  twinClipColor,
  twinClipName,
  shell,
  calledShot,
}: {
  ammo: number;
  max: number;
  clipColor: string | null;
  nextClipColor: string | null;
  clipName: string | null;
  nextClipName: string | null;
  reloadPct: number;
  twinClipColor: string | null;
  twinClipName: string | null;
  shell: number;
  calledShot: boolean;
}) {
  const previousAmmo = useRef(ammo);
  const [refilling, setRefilling] = useState(false);
  const [shot, setShot] = useState(false);

  useLayoutEffect(() => {
    const before = previousAmmo.current;
    previousAmmo.current = ammo;
    if (
      document.visibilityState === 'hidden' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    if (before === 0 && ammo >= max && max > 0) {
      setRefilling(true);
      const timeout = window.setTimeout(() => setRefilling(false), 720);
      return () => window.clearTimeout(timeout);
    }
    if (ammo < before) {
      setShot(true);
      const timeout = window.setTimeout(() => setShot(false), 230);
      return () => window.clearTimeout(timeout);
    }
  }, [ammo, max]);

  if (max < 3) return null;

  const spent = Math.max(0, Math.min(max, max - ammo));
  // A Duelist's kill chain loads rounds past the clip's size (design §22.5). The
  // wheel has one chamber per authored round, so the rounds above it read as a
  // "+N" tally beside the wheel instead of being clamped away.
  const overflow = Math.max(0, ammo - max);
  const stepDegrees = 360 / max;
  const rotation = -spent * stepDegrees;
  const geometry = ammoGeometry(max);
  const refillDelayStep = Math.min(45, 420 / Math.max(1, max - 1));
  const points = Array.from({ length: max }, (_, index) => {
    const point = ammoPoint(index, max, geometry.radius);
    return `${point.x},${point.y}`;
  }).join(' ');
  const innerPoints = Array.from({ length: max }, (_, index) => {
    const point = ammoPoint(index, max, Math.max(9, geometry.radius * 0.42));
    return `${point.x},${point.y}`;
  }).join(' ');
  const assemblyStyle = {
    '--ammo-rotation': `${rotation}deg`,
    '--ammo-step': `${stepDegrees}deg`,
  } as CSSProperties;
  const motionClass = ammo === 0
    ? ' mechanic-reload__assembly--reloading'
    : refilling
      ? ' mechanic-reload__assembly--refilling'
      : '';

  const arcRadius = 33;
  const arcLength = 2 * Math.PI * arcRadius;
  const label = [
    clipName ? `${clipName}.` : null,
    `${ammo} of ${max} ammunition remaining`,
    nextClipName ? `Next clip: ${nextClipName}.` : null,
    twinClipName ? `Second gun: ${twinClipName}.` : null,
    shell > 0 ? `Shell charged with ${shell} damage.` : null,
    calledShot ? 'Called shot ready.' : null,
    reloadPct > 0 ? 'Reloading.' : null,
  ].filter((part): part is string => !!part).join(' ');

  return (
    <div className={`mechanic-ammo-chamber${shot ? ' mechanic-ammo-chamber--shot' : ''}${refilling ? ' mechanic-ammo-chamber--refilling' : ''}${shell > 0 ? ' mechanic-ammo-chamber--shell' : ''}${calledShot ? ' mechanic-ammo-chamber--called' : ''}`}>
      <span className="mechanic-ammo-chamber__rail" aria-hidden="true" />
      <svg
        className={`mechanic-reload${geometry.density}${clipColor ? ' mechanic-reload--clip' : ''}`}
        viewBox="0 0 70 70"
        role="img"
        aria-label={label}
        style={clipColor ? { '--clip-color': clipColor } as CSSProperties : undefined}
      >
        <circle className="mechanic-reload__housing" cx="35" cy="35" r="31.5" />
        <path className="mechanic-reload__mounts" d="M35 1v4 M35 65v4 M1 35h4 M65 35h4" />
        <g className={`mechanic-reload__assembly${motionClass}`} style={assemblyStyle}>
          <polygon className="mechanic-reload__polygon" points={points} />
          <polygon className="mechanic-reload__inner-polygon" points={innerPoints} />
          {max <= 12 && Array.from({ length: max }, (_, index) => {
            const point = ammoPoint(index, max, geometry.radius - geometry.dotRadius - 1);
            return <line key={`spoke-${index}`} className="mechanic-reload__spoke" x1="35" y1="35" x2={point.x} y2={point.y} />;
          })}
          <circle className="mechanic-reload__hub" cx="35" cy="35" r={max >= 12 ? 5 : 6} />
          <circle className="mechanic-reload__hub-core" cx="35" cy="35" r="2" />
          {Array.from({ length: max }, (_, index) => {
            const point = ammoPoint(index, max, geometry.radius);
            const loaded = index >= spent;
            const current = ammo > 0 && index === spent;
            const last = loaded && index === max - 1;
            // Twin guns: the even rounds of the clip are the second gun's.
            const second = twinClipColor !== null && !last && (index + 1) % 2 === 0;
            const dotStyle = {
              '--ammo-dot-delay': `${Math.round(index * refillDelayStep)}ms`,
              ...(last ? { fill: SLINGER_LAST_ROUND_CSS, stroke: '#ffe7a3' } : {}),
              ...(second && loaded ? { fill: twinClipColor } : {}),
            } as CSSProperties;
            return (
              <circle
                key={index}
                className={`mechanic-reload__round${loaded ? ' mechanic-reload__round--loaded' : ''}${current ? ' mechanic-reload__round--current' : ''}${last ? ' mechanic-reload__round--last' : ''}`}
                cx={point.x}
                cy={point.y}
                r={geometry.dotRadius}
                style={dotStyle}
              />
            );
          })}
        </g>
        {reloadPct > 0 && (
          <circle
            className="mechanic-reload__reload-arc"
            cx="35"
            cy="35"
            r={arcRadius}
            style={{
              strokeDasharray: `${arcLength}`,
              strokeDashoffset: `${arcLength * (1 - reloadPct)}`,
            }}
          />
        )}
        <path className="mechanic-reload__top-guide" d="M31.5 2.5 35 6l3.5-3.5" />
        <circle className="mechanic-reload__impact" cx="35" cy="35" r="29" />
      </svg>
      {nextClipColor && (
        <span
          className="mechanic-ammo-chamber__next"
          style={{ background: nextClipColor }}
          title={nextClipName ? `Next clip: ${nextClipName}` : 'Next clip'}
          aria-hidden="true"
        />
      )}
      {shell > 0 && (
        <span className="mechanic-ammo-chamber__tag mechanic-ammo-chamber__tag--shell" title={`Shell: ${shell} damage banked`} aria-hidden="true">
          {shell}
        </span>
      )}
      {calledShot && (
        <span className="mechanic-ammo-chamber__tag mechanic-ammo-chamber__tag--called" title="Called shot: the last round flies to your rule's pick" aria-hidden="true">
          called
        </span>
      )}
      {overflow > 0 && (
        <span className="mechanic-ammo-chamber__overflow" aria-hidden="true">+{overflow}</span>
      )}
    </div>
  );
}

/** Mobile row: the same facts as the ring, fitted to the 24px mechanic slot. */
export function LoadoutAmmoCompact({ model }: { model: ReloadMechanicModel }) {
  const fill = useReloadFill(model.reloadRemainingMs, model.reloadDurationMs);
  const reloading = model.reloadRemainingMs > 0 && model.reloadDurationMs > 0;
  const ammoPct = model.ammoMax > 0 ? model.ammo / model.ammoMax : 0;
  const width = reloading ? fill : ammoPct;
  const color = !reloading && model.ammo === 1
    ? SLINGER_LAST_ROUND_CSS
    : reloading
      ? '#e6a43c'
      : (model.clipColor ?? '#9aa3ad');
  const next = model.nextClipName ? ` Next: ${model.nextClipName}.` : '';
  const tag = model.discipline === 'siege' && model.shell > 0
    ? `shell ${model.shell}`
    : model.calledShot ? 'called'
      : model.twinClipName ? 'twin' : null;
  const label = reloading
    ? `Reloading. ${model.clipName ?? 'Clip'}.${next}`
    : `${model.ammo} of ${model.ammoMax}. ${model.clipName ?? 'Clip'}.${model.ammo > 0 ? ' Last round still loaded.' : ''}${next}`;

  return (
    <div
      className="loadout-ammo-compact"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={model.ammoMax}
      aria-valuenow={model.ammo}
    >
      <span className="loadout-ammo-compact__count">{reloading ? 'Reloading' : `${model.ammo}/${model.ammoMax}`}</span>
      {tag && <span className="loadout-ammo-compact__tag">{tag}</span>}
      {model.twinClipColor && (
        <i
          className="loadout-ammo-compact__next"
          style={{ background: model.twinClipColor }}
          title={model.twinClipName ? `Second gun: ${model.twinClipName}` : 'Second gun'}
          aria-hidden="true"
        />
      )}
      <span className="loadout-ammo-compact__track" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, width * 100))}%`, background: color }} />
        {!reloading && model.ammo > 1 && <i className="loadout-ammo-compact__last" />}
      </span>
      {model.nextClipColor && (
        <i
          className="loadout-ammo-compact__next"
          style={{ background: model.nextClipColor }}
          title={model.nextClipName ? `Next clip: ${model.nextClipName}` : 'Next clip'}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function ReloadMechanic({ model }: { model: ReloadMechanicModel }) {
  const reloadPct = useReloadFill(model.reloadRemainingMs, model.reloadDurationMs);
  return (
    <MechanicFrame
      kind="reload"
      title="Ammo"
      state={model.ammo === 0 ? 'reloading' : undefined}
    >
      <AmmoPolygon
        ammo={model.ammo}
        max={model.ammoMax}
        clipColor={model.loadout ? model.clipColor : null}
        nextClipColor={model.loadout ? model.nextClipColor : null}
        clipName={model.loadout ? model.clipName : null}
        nextClipName={model.loadout ? model.nextClipName : null}
        reloadPct={model.loadout ? reloadPct : 0}
        twinClipColor={model.loadout ? model.twinClipColor : null}
        twinClipName={model.loadout ? model.twinClipName : null}
        shell={model.loadout ? model.shell : 0}
        calledShot={model.loadout && model.calledShot}
      />
    </MechanicFrame>
  );
}
