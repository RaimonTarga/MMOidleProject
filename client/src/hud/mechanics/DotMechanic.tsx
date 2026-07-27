import type { CSSProperties } from 'react';
import { MechanicFrame } from './MechanicFrame';
import { useMechanicHelp } from './mechanicHelp';
import type { DotMechanicModel } from './types';

export function DotMechanic({ model }: { model: DotMechanicModel }) {
  const help = useMechanicHelp(model);
  const status = model.hasTarget ? `${model.stacks} / ${model.maxStacks}` : 'No target';
  const useSegments = model.maxStacks <= 10;
  const isActive = model.hasTarget && model.stacks > 0;
  return (
    <MechanicFrame
      kind="dot"
      help={help}
      title={`${model.stackLabel} stacks`}
      state={model.element}
    >
      <div
        className={`mechanic-dot${isActive ? ' mechanic-dot--active' : ' mechanic-dot--idle'}${model.showsChill ? ' mechanic-dot--with-chill' : ''}`}
        style={{ '--dot-tick-pct': `${model.tickPct}%` } as CSSProperties}
      >
        <div
          key={model.tickSerial}
          className={`mechanic-dot__core${model.tickSerial > 0 && isActive ? ' mechanic-dot__core--ticked' : ''}`}
        >
          <span className="mechanic-dot__impact" aria-hidden="true" />
          <div className="mechanic-dot__stacks" aria-label={`${model.stackLabel}: ${status}`}>
            {useSegments ? (
              <div className="mechanic-dot__segments">
                {Array.from({ length: model.maxStacks }, (_, index) => (
                  <span
                    key={index}
                    className={index < model.stacks ? 'mechanic-dot__segment--active' : undefined}
                    style={{ '--dot-index': index } as CSSProperties}
                  >
                    <i aria-hidden="true" />
                  </span>
                ))}
              </div>
            ) : (
              <div className="mechanic-dot__track">
                <span style={{ width: `${model.stackPct}%` }} />
                <i aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="mechanic-dot__ticker" aria-label={`Next tick ${Math.round(model.tickPct)} percent charged`}>
            <span style={{ width: `${isActive ? model.tickPct : 0}%` }}>
              <i aria-hidden="true" />
            </span>
          </div>
          <div className="mechanic-dot__ticks" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          {model.showsChill && (
            <div className={`mechanic-chill${model.frozen ? ' mechanic-chill--frozen' : ''}`}>
              <div className="mechanic-chill__segments">
                {Array.from({ length: model.chillMax }, (_, index) => (
                  <i key={index} className={index < model.chillStacks ? 'mechanic-chill__segment--active' : undefined} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MechanicFrame>
  );
}
