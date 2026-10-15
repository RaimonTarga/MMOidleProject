import type { ClassScreenView } from '@mmo-idle/shared';
import { FormationEditor } from './FormationEditor';
import { LoadoutEditor } from './LoadoutEditor';
import { OrderEditor } from './OrderEditor';
import { ResponsesEditor } from './ResponsesEditor';
import { PayoffsEditor } from './PayoffsEditor';
import { ThresholdsEditor } from './ThresholdsEditor';

/**
 * The class's own editor: one editor per class system (the Order, Response rules, Formation,
 * Loadout, Thresholds and Payoff rules).
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  if (view.systemKind === 'order') return <OrderEditor view={view} />;
  if (view.systemKind === 'responses') return <ResponsesEditor view={view} />;
  if (view.systemKind === 'formation') return <FormationEditor view={view} />;
  if (view.systemKind === 'loadout') return <LoadoutEditor view={view} />;
  if (view.systemKind === 'thresholds') return <ThresholdsEditor view={view} />;
  if (view.systemKind === 'payoffs') return <PayoffsEditor view={view} />;
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
