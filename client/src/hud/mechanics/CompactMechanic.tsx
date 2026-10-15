import type { FormationView } from '@mmo-idle/shared';
import { OrderStrip } from '../OrderStrip';
import { useFormationView } from '../../ui/class/useFormationView';
import { useOrderView } from '../../ui/class/useOrderView';
import { LoadoutAmmoCompact } from './ReloadMechanic';
import { ResolveCompact } from './ResolvePips';
import type { MechanicViewModel, SummonerMechanicModel } from './types';
import { usePayoffsView } from '../../ui/class/usePayoffsView';
import { SigilReadout } from '../SigilReadout';

function compactState(model: MechanicViewModel): { label: string; value: string; pct: number } {
  switch (model.kind) {
    case 'cadence':
      return {
        label: 'Cadence',
        value: model.armed ? 'FINISHER' : `${model.count} / ${model.threshold - 1}`,
        pct: model.armed ? 100 : model.count / Math.max(1, model.threshold - 1) * 100,
      };
    case 'cooldown':
      return model.isChanneling
        ? { label: 'Channel', value: `${Math.round(model.channelRemainingPct)}%`, pct: model.channelRemainingPct }
        : { label: 'Execution', value: model.executionReady ? 'READY' : `${Math.round(model.executionPct)}%`, pct: model.executionPct };
    case 'energy':
      return {
        label: 'Storm',
        value: `${model.value} / ${model.max}`,
        pct: model.pct,
      };
    case 'reload':
      return { label: 'Ammo', value: model.ammo === 0 ? 'Reloading…' : `${model.ammo} / ${model.ammoMax}`, pct: model.ammoMax > 0 ? model.ammo / model.ammoMax * 100 : 0 };
    case 'summoner':
      return {
        label: 'Summons',
        value: `${model.activeCount} / ${model.slotCount} active`,
        pct: model.slotCount > 0 ? model.activeCount / model.slotCount * 100 : 0,
      };
    case 'dot':
      return { label: `${model.stackLabel} stacks`, value: model.hasTarget ? `${model.stacks} / ${model.maxStacks}` : 'No target', pct: model.stackPct };
  }
}

/** Command used of total, and how many bodies are down, on the one-line mobile strip. */
function FormationCompact({ model, formation }: { model: SummonerMechanicModel; formation: FormationView }) {
  const { used, total } = formation.command;
  const fallen = model.slots.filter((slot) => !slot.active).length;
  const pct = total > 0 ? (Math.min(used, total) / total) * 100 : 0;
  const value = fallen > 0 ? `${used} / ${total} · ${fallen} fallen` : `${used} / ${total}`;
  return (
    <div
      className="compact-mechanic compact-mechanic--summoner"
      aria-label={fallen > 0 ? `Command ${used} of ${total}, ${fallen} fallen` : `Command ${used} of ${total}`}
    >
      <div className="stat-row">
        <span className="stat-label">Command</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="compact-mechanic__track">
        <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  );
}

/** Existing one-line mobile presentation, intentionally separate from desktop widgets. */
export function CompactMechanic({ model }: { model: MechanicViewModel }) {
  const order = useOrderView();
  const formation = useFormationView();
  const payoffs = usePayoffsView();
  if (model.kind === 'dot' && payoffs) return <SigilReadout budget={payoffs.sigils.cap} model={model} compact />;
  if (model.kind === 'cadence' && order) {
    return <OrderStrip order={order} count={model.count} armed={model.armed} compact />;
  }
  if (model.kind === 'reload' && model.loadout) {
    return <LoadoutAmmoCompact model={model} />;
  }
  if (model.kind === 'cooldown' && model.responses) return <ResolveCompact model={model} />;
  if (model.kind === 'summoner' && formation) return <FormationCompact model={model} formation={formation} />;
  const state = compactState(model);
  const tone = model.kind === 'dot'
    ? model.element
    : model.kind === 'summoner' && model.specialization
      ? `summoner-${model.specialization}`
      : model.kind;
  return (
    <div className={`compact-mechanic compact-mechanic--${tone}`}>
      <div className="stat-row">
        <span className="stat-label">{state.label}</span>
        <span className="stat-value">{state.value}</span>
      </div>
      <div className="compact-mechanic__track">
        <span style={{ width: `${Math.max(0, Math.min(100, state.pct))}%` }} />
      </div>
    </div>
  );
}
