import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { MechanicFrame } from './MechanicFrame';
import { useMechanicHelp } from './mechanicHelp';
import type { ReloadMechanicModel } from './types';

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

function AmmoPolygon({ ammo, max }: { ammo: number; max: number }) {
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

    if (before === 0 && ammo === max && max > 0) {
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

  return (
    <div className={`mechanic-ammo-chamber${shot ? ' mechanic-ammo-chamber--shot' : ''}${refilling ? ' mechanic-ammo-chamber--refilling' : ''}`}>
      <span className="mechanic-ammo-chamber__rail" aria-hidden="true" />
      <svg className={`mechanic-reload${geometry.density}`} viewBox="0 0 70 70" role="img" aria-label={`${ammo} of ${max} ammunition remaining`}>
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
            const dotStyle = { '--ammo-dot-delay': `${Math.round(index * refillDelayStep)}ms` } as CSSProperties;
            return (
              <circle
                key={index}
                className={`mechanic-reload__round${loaded ? ' mechanic-reload__round--loaded' : ''}${current ? ' mechanic-reload__round--current' : ''}`}
                cx={point.x}
                cy={point.y}
                r={geometry.dotRadius}
                style={dotStyle}
              />
            );
          })}
        </g>
        <path className="mechanic-reload__top-guide" d="M31.5 2.5 35 6l3.5-3.5" />
        <circle className="mechanic-reload__impact" cx="35" cy="35" r="29" />
      </svg>
    </div>
  );
}

export function ReloadMechanic({ model }: { model: ReloadMechanicModel }) {
  const help = useMechanicHelp(model);
  if (model.mode === 'heat') {
    return (
      <MechanicFrame
        kind="reload"
      help={help}
        title="Heat"
        state={model.overheated ? 'danger' : undefined}
      >
        <div
          className={`mechanic-heat${model.overheated ? ' mechanic-heat--overheated' : ''}`}
          role="meter"
          aria-label="Weapon heat"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={model.heatPct}
        >
          <span className="mechanic-heat__bus" aria-hidden="true" />
          <span className="mechanic-heat__chamber" aria-hidden="true">
            <span className="mechanic-heat__fill" style={{ width: `${model.heatPct}%` }} />
            <span className="mechanic-heat__wake" />
            <span className="mechanic-heat__limit" />
            <span className="mechanic-heat__divisions"><i /><i /><i /><i /></span>
          </span>
          <span className="mechanic-heat__vents" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span className="mechanic-heat__impact" aria-hidden="true" />
        </div>
      </MechanicFrame>
    );
  }

  return (
    <MechanicFrame
      kind="reload"
      title="Ammo"
      state={model.ammo === 0 ? 'reloading' : undefined}
    >
      <AmmoPolygon ammo={model.ammo} max={model.ammoMax} />
    </MechanicFrame>
  );
}
