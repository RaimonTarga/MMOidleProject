import type { CSSProperties, ReactNode } from 'react';
import { GameIcon, type IconSource } from '../../ui/GameIcon';
import './kit.css';

export type ActionChipTone = 'default' | 'primary' | 'danger';

export interface ActionChipProps {
  /**
   * Accessible name and hover text. Required even when the label is not drawn —
   * an icon-only control that reads as nothing is a defect, not a de-texting.
   */
  label: string;
  icon?: IconSource | null;
  /** Draw the label beside the icon. Off by default; the tooltip still carries it. */
  showLabel?: boolean;
  /** Stands in until the glyph exists, in the same footprint. */
  fallback?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Present only for toggles: renders the latched state and sets aria-pressed. */
  pressed?: boolean;
  tone?: ActionChipTone;
  size?: 'sm' | 'md';
  /** Overrides the hover text when the label alone is too terse to explain. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The icon-led replacement for a text button (§15 de-texting rule). The label
 * always exists for assistive technology and on hover; drawing it is the
 * exception, for actions a first-time player cannot be expected to guess.
 *
 * It owns presentation and its own accessible name only. What the press does,
 * and whether it is allowed, stay with the caller.
 */
export function ActionChip({
  label,
  icon = null,
  showLabel = false,
  fallback,
  onClick,
  disabled,
  pressed,
  tone = 'default',
  size = 'md',
  title,
  className,
  style,
}: ActionChipProps) {
  const classes = [
    'action-chip',
    size === 'sm' && 'action-chip--sm',
    tone !== 'default' && `action-chip--${tone}`,
    showLabel && 'action-chip--labelled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      style={style}
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      // Visible text is its own accessible name; duplicating it would announce
      // the label twice.
      aria-label={showLabel ? undefined : label}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
    >
      {/* GameIcon derives its atlas scaling from this number, so the glyph
          footprint is set here rather than in CSS. The mobile scope grows the
          pressable chip around it without resizing the art. */}
      <GameIcon
        source={icon}
        size={size === 'sm' ? 13 : 15}
        fallback={fallback ?? label.charAt(0)}
        className="action-chip__icon"
        decorative
      />
      {showLabel && <span className="action-chip__label">{label}</span>}
    </button>
  );
}
