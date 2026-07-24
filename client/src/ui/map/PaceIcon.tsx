import type { PaceFamily } from '@mmo-idle/shared';

const PACE_ABBREVIATIONS: Record<PaceFamily, string> = {
  alacrity: 'AL',
  brutality: 'BR',
  blight: 'BL',
  volatility: 'VO',
  predation: 'PR',
};

interface PaceIconProps {
  pace: PaceFamily;
  size?: number;
  className?: string;
}

export function PaceIcon({ pace, size = 16, className }: PaceIconProps) {
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
      {PACE_ABBREVIATIONS[pace]}
    </span>
  );
}
