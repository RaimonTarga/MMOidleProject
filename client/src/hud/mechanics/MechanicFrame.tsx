import type { PropsWithChildren, ReactNode } from 'react';
import type { MechanicViewModel } from './types';

/**
 * Every class archetype, plus the instruments that are not an archetype but
 * share the frame — evasion appears beside whichever mechanic a player has.
 * Deliberately a union rather than `string`, so a typo is still a type error.
 */
export type MechanicFrameKind = MechanicViewModel['kind'] | 'evasion';

interface MechanicFrameProps extends PropsWithChildren {
  kind: MechanicFrameKind;
  title: string;
  status?: ReactNode;
  state?: string;
}

/** Stable rail footprint and material frame shared by every class mechanic. */
export function MechanicFrame({ kind, title, status, state, children }: MechanicFrameProps) {
  return (
    <section
      className={`mechanic-frame mechanic-frame--${kind}${state ? ` mechanic-frame--${state}` : ''}`}
      // Evasion shares this frame without being a class mechanic, so the label
      // follows the kind rather than asserting "class mechanic" for everything.
      aria-label={kind === 'evasion' ? `${title} instrument` : `${title} class mechanic`}
    >
      <div className="mechanic-frame__header">
        <span className="mechanic-frame__title">{title}</span>
        {status != null && <span className="mechanic-frame__status">{status}</span>}
      </div>
      <div className="mechanic-frame__body">{children}</div>
    </section>
  );
}
