import type { ClassScreenView } from '@mmo-idle/shared';
import { ResponsesEditor } from './ResponsesEditor';

/**
 * The class's own editor (the Order, Response rules, and the rest).
 * Each class track replaces the placeholder for its system.
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  if (view.systemKind === 'responses') return <ResponsesEditor view={view} />;
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
