import { useAtomValue } from 'jotai';
import { classLineFor, type ClassLined } from '@mmo-idle/shared';
import { combatArchetypeAtom } from '../hud/atoms';
import './classLineNote.css';

/**
 * What a shared base (armor, charm, boots) does for the player's own class: its class line's
 * name and plain-words text (class gear, bible §4). The server applies the line on top of the
 * base's own effects; without this the Make panel, the inventory and the map showed the base
 * alone, and the line was only ever read in the guide.
 */
export function ClassLineNote({ item }: { item: ClassLined | undefined }) {
  const archetype = useAtomValue(combatArchetypeAtom);
  const line = classLineFor(item, archetype);
  if (!line) return null;
  return (
    <p className="class-line-note">
      <span className="class-line-note__name">{line.name}</span>
      <span className="class-line-note__text">{line.text}</span>
    </p>
  );
}
