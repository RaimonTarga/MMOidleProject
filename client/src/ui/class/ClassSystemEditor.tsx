import type { ClassScreenView } from '@mmo-idle/shared';
import { LoadoutEditor } from './LoadoutEditor';
import { OrderEditor } from './OrderEditor';
import { ResponsesEditor } from './ResponsesEditor';

/**
 * The class's own editor: the Striker's Order, the Squire's Response rules, the Slinger's
 * Loadout; each other class track replaces the placeholder for its own system.
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  if (view.systemKind === 'order') return <OrderEditor view={view} />;
  if (view.systemKind === 'responses') return <ResponsesEditor view={view} />;
  if (view.systemKind === 'loadout') return <LoadoutEditor view={view} />;
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
