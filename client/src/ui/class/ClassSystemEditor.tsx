import type { ClassScreenView } from '@mmo-idle/shared';
import { OrderEditor } from './OrderEditor';
import { ResponsesEditor } from './ResponsesEditor';
import { PayoffsEditor } from './PayoffsEditor';

/**
 * The class's own editor: Order, Response rules and Payoff rules; each other class
 * track replaces the placeholder for its own system.
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  if (view.systemKind === 'order') return <OrderEditor view={view} />;
  if (view.systemKind === 'responses') return <ResponsesEditor view={view} />;
  if (view.systemKind === 'payoffs') return <PayoffsEditor view={view} />;
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
