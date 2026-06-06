import type { HeadlinePart } from '@mmo-idle/shared';
import { sideColor } from './logColors';

export function LogHeadline({ parts }: { parts: HeadlinePart[] }) {
  return (
    <span className="combat-log__headline">
      {parts.map((part, i) => (
        <span key={i} style={{ color: sideColor(part.side) }}>
          {part.text}
        </span>
      ))}
    </span>
  );
}
