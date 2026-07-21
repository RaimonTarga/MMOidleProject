import type { PropsWithChildren, ReactNode } from 'react';
import type { MechanicViewModel } from './types';

interface MechanicFrameProps extends PropsWithChildren {
  kind: MechanicViewModel['kind'];
  title: string;
  status?: ReactNode;
  state?: string;
}

/** Stable rail footprint and material frame shared by every class mechanic. */
export function MechanicFrame({ kind, title, status, state, children }: MechanicFrameProps) {
  return (
    <section
      className={`mechanic-frame mechanic-frame--${kind}${state ? ` mechanic-frame--${state}` : ''}`}
      aria-label={`${title} class mechanic`}
    >
      <div className="mechanic-frame__header">
        <span className="mechanic-frame__title">{title}</span>
        {status != null && <span className="mechanic-frame__status">{status}</span>}
      </div>
      <div className="mechanic-frame__body">{children}</div>
    </section>
  );
}
