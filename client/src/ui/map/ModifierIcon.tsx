import type { NodeModifierFamily } from '@mmo-idle/shared';

const MODIFIER_ABBREVIATIONS: Record<NodeModifierFamily, string> = {
  alacrity: 'AL',
  heavy: 'HV',
  swarming: 'SW',
  dominion: 'DO',
  fortified: 'FO',
};

interface ModifierIconProps {
  modifier: NodeModifierFamily;
  size?: number;
  className?: string;
}

export function ModifierIcon({ modifier, size = 16, className }: ModifierIconProps) {
  return (
    <span
      className={`pace-icon${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(7, Math.round(size * 0.5)),
      }}
      aria-hidden="true"
    >
      {MODIFIER_ABBREVIATIONS[modifier]}
    </span>
  );
}
