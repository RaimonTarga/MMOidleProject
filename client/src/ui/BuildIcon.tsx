import type { CSSProperties } from 'react';
import { UIIcon } from './UIIcon';

export type BuildIconKind = 'ability' | 'stance' | 'rite' | 'rune';

const KIND_CLASS: Record<BuildIconKind, string> = {
  ability: 'build-icon--ability',
  stance: 'build-icon--stance',
  rite: 'build-icon--rite',
  rune: 'build-icon--rune',
};

function initials(label: string): string {
  const words = label
    .replace(/['-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '..';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function BuildIcon({
  kind,
  label,
  muted = false,
  size,
  iconFrame,
}: {
  kind: BuildIconKind;
  label: string;
  muted?: boolean;
  size?: number;
  iconFrame?: string;
}) {
  const style: CSSProperties | undefined = size
    ? { width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.31)) }
    : undefined;
  const iconSize = Math.max(16, (size ?? 36) - 4);
  return (
    <span
      className={`build-icon ${KIND_CLASS[kind]}${muted ? ' build-icon--muted' : ''}`}
      style={style}
      aria-hidden="true"
      title={label}
    >
      <span className="build-icon__fallback">{initials(label)}</span>
      {iconFrame && (
        <UIIcon
          as="span"
          frameName={iconFrame}
          size={iconSize}
          className="build-icon__art"
        />
      )}
    </span>
  );
}
