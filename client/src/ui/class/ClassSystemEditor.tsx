import type { ClassScreenView } from '@mmo-idle/shared';
import { FormationEditor } from './FormationEditor';
import { LoadoutEditor } from './LoadoutEditor';
import { OrderEditor } from './OrderEditor';
import { ResponsesEditor } from './ResponsesEditor';
import { ThresholdsEditor } from './ThresholdsEditor';

/**
 * The class's own editor: the Striker's Order, the Squire's Response rules, the Conduit's
 * Formation; each other class track replaces the placeholder for its own system.
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  if (view.systemKind === 'order') return <OrderEditor view={view} />;
  if (view.systemKind === 'responses') return <ResponsesEditor view={view} />;
  if (view.systemKind === 'formation') return <FormationEditor view={view} />;
  if (view.systemKind === 'loadout') return <LoadoutEditor view={view} />;
  if (view.systemKind === 'thresholds') return <ThresholdsEditor view={view} />;
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
