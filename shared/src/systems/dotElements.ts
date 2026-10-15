/**
 * Damage-over-time "elements" — purely cosmetic flavor that drives damage-number
 * color/glyph (and on-hit FX). Different DoT sources are tagged with one of these.
 *
 * `lightning` and `bleed` have no DoT source wired yet — they exist so a future DoT
 * can emit a `dot-tick` event with that `element` and be styled with no changes to
 * the damage-number system (the client style map already has entries for them).
 * `bleed` is the natural element for the existing Hemorrhage DoT if it's ever wired.
 */
export type DamageElement = 'poison' | 'fire' | 'frost' | 'lightning' | 'bleed' | 'doom';

/** Elements that an actual DoT-class path currently resolves to. */
export type DotPathElement = Extract<DamageElement, 'poison' | 'fire' | 'frost' | 'doom'>;

/**
 * Resolve the sigil tint: raw magic at the root, elemental flavor for a discipline. Shared by the
 * server (tagging dot-tick events) and the client (selecting on-hit FX).
 */
export function dotElementForPlayer(
  _passives: Record<string, number>,
  subVariant: string | null | undefined,
): DotPathElement {
  if (subVariant === 'balanced') return 'fire';
  if (subVariant === 'heavy') return 'frost';
  return subVariant === 'light' ? 'poison' : 'doom';
}
