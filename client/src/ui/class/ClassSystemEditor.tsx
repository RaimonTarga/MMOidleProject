import type { ClassScreenView } from '@mmo-idle/shared';

/**
 * The class's own editor (the Order, Response rules, and the rest).
 * Each class track replaces this file. Until then the shell only names the system.
 */
export function ClassSystemEditor({ view }: { view: ClassScreenView }) {
  return (
    <p className="class-panel__editor">
      {`The ${view.systemName} editor arrives with this class's track.`}
    </p>
  );
}
