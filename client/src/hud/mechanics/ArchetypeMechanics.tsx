import { CadenceMechanic } from './CadenceMechanic';
import { CompactMechanic } from './CompactMechanic';
import { CooldownMechanic } from './CooldownMechanic';
import { DotMechanic } from './DotMechanic';
import { EnergyMechanic } from './EnergyMechanic';
import { EvasionInstrument } from './EvasionInstrument';
import { ReloadMechanic } from './ReloadMechanic';
import { SummonerMechanic } from './SummonerMechanic';
import { useMechanicViewModel } from './useMechanicViewModel';
import './mechanics.css';

function ClassMechanic({ model }: { model: NonNullable<ReturnType<typeof useMechanicViewModel>> }) {
  switch (model.kind) {
    case 'cadence': return <CadenceMechanic model={model} />;
    case 'cooldown': return <CooldownMechanic model={model} />;
    case 'energy': return <EnergyMechanic model={model} />;
    case 'reload': return <ReloadMechanic model={model} />;
    case 'summoner': return <SummonerMechanic model={model} />;
    case 'dot': return <DotMechanic model={model} />;
  }
}

export function ArchetypeMechanics({ compact = false }: { compact?: boolean }) {
  const model = useMechanicViewModel();

  // Evasion is not a class mechanic, so it renders on its own presence rather
  // than the archetype — including for a player with no class selected yet. The
  // compact mobile strip deliberately does not take it: that renderer exists to
  // stay dense, and a second frame there would defeat it.
  if (compact) return model ? <CompactMechanic model={model} /> : null;

  return (
    <>
      {model && <ClassMechanic model={model} />}
      <EvasionInstrument />
    </>
  );
}
