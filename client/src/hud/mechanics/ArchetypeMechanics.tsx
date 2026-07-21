import { CadenceMechanic } from './CadenceMechanic';
import { CompactMechanic } from './CompactMechanic';
import { CooldownMechanic } from './CooldownMechanic';
import { DotMechanic } from './DotMechanic';
import { EnergyMechanic } from './EnergyMechanic';
import { ReloadMechanic } from './ReloadMechanic';
import { SummonerMechanic } from './SummonerMechanic';
import { useMechanicViewModel } from './useMechanicViewModel';
import './mechanics.css';

export function ArchetypeMechanics({ compact = false }: { compact?: boolean }) {
  const model = useMechanicViewModel();
  if (!model) return null;
  if (compact) return <CompactMechanic model={model} />;

  switch (model.kind) {
    case 'cadence': return <CadenceMechanic model={model} />;
    case 'cooldown': return <CooldownMechanic model={model} />;
    case 'energy': return <EnergyMechanic model={model} />;
    case 'reload': return <ReloadMechanic model={model} />;
    case 'summoner': return <SummonerMechanic model={model} />;
    case 'dot': return <DotMechanic model={model} />;
  }
}
