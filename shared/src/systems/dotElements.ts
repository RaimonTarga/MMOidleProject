/**
 * Damage-over-time "elements" — purely cosmetic flavor that drives damage-number
 * color/glyph (and on-hit FX). Different DoT sources are tagged with one of these.
 *
 * `lightning` and `bleed` have no DoT source wired yet — they exist so a future DoT
 * can emit a `dot-tick` event with that `element` and be styled with no changes to
 * the damage-number system (the client style map already has entries for them).
 * `bleed` is the natural element for the existing Hemorrhage DoT if it's ever wired.
 */
export type DamageElement = 'poison' | 'fire' | 'frost' | 'lightning' | 'bleed';

/** Elements that an actual DoT-class path currently resolves to. */
export type DotPathElement = Extract<DamageElement, 'poison' | 'fire' | 'frost'>;

/**
 * Resolve a player's DoT-class element from unlocked path passives, falling back to
 * the chosen sub-variant (balanced → fire, heavy → frost, else poison). Shared by the
 * server (tagging dot-tick events) and the client (selecting on-hit FX).
 */
export function dotElementForPlayer(
  passives: Record<string, number>,
  subVariant: string | null | undefined,
): DotPathElement {
  if (
    (passives['dot.fan-the-flames'] ?? 0) > 0 ||
    (passives['dot.smoldering-ember'] ?? 0) > 0 ||
    (passives['dot.conflagration'] ?? 0) > 0
  )
    return 'fire';
  if (
    (passives['dot.permafrost'] ?? 0) > 0 ||
    (passives['dot.freezing-cold'] ?? 0) > 0 ||
    (passives['dot.glacial-fracture'] ?? 0) > 0
  )
    return 'frost';
  if (
    (passives['dot.poison-explosion'] ?? 0) > 0 ||
    (passives['dot.eternal-doom'] ?? 0) > 0 ||
    (passives['dot.invigorating-toxins'] ?? 0) > 0
  )
    return 'poison';
  if (subVariant === 'balanced') return 'fire';
  if (subVariant === 'heavy') return 'frost';
  return 'poison';
}
