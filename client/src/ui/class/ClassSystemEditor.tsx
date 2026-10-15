import type { ClassScreenView } from '@mmo-idle/shared';
import { OrderEditor } from './OrderEditor';

/**
 * The class's own editor. The Striker renders the Order; each other class
 * track replaces the placeholder for its own system.
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  if (view.systemKind === 'order') return <OrderEditor view={view} />;
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
