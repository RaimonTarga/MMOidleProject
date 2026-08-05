/**
 * DEV-only Conduit summon skin switcher — the sibling of `cycleGroundBakeoff`
 * in `wangGround.ts`, for comparing accepted summon candidates live in-game
 * instead of judging them on a contact sheet.
 *
 * Bound to Shift+[ / Shift+] in `input/keyboard.ts`. Plain [ / ] stays on the
 * ground bake-off; the two tools would otherwise collide.
 *
 * The switch is purely presentational: `getMonsterFrame` consults
 * `activeSummonFrame()` for any `conduit-summon*` type, and because
 * `updateSpriteFrame` already rebuilds a sprite whenever its frame name
 * changes, live summons re-skin on the next node delta with no repaint call.
 *
 * Index 0 is whatever ships in `frameMaps.ts`; the rest are candidates kept in
 * the atlas for comparison. Retire the losers from `art/src/sprites/monsters/`
 * once a winner is picked — they are shipped atlas weight until then.
 */
export interface SummonSkin {
  frame: string;
  label: string;
}

export const SUMMON_SKINS: readonly SummonSkin[] = [
  { frame: 'sprites/monsters/conduit-summon.png',           label: 'bone · no glow  (shipped default)' },
  { frame: 'sprites/monsters/conduit-summon-teal.png',      label: 'bone · teal sockets' },
  { frame: 'sprites/monsters/conduit-summon-porcelain.png', label: 'glazed porcelain · teal sockets' },
];

let skinIndex = 0;

/** Atlas frame the Conduit's summons should currently render with. */
export function activeSummonFrame(): string {
  return SUMMON_SKINS[skinIndex]!.frame;
}

/** Advance the selection; sprites pick it up on their next frame comparison. */
export function cycleSummonSkin(dir: 1 | -1): {
  label: string;
  index: number;
  total: number;
} {
  const total = SUMMON_SKINS.length;
  skinIndex = (((skinIndex + dir) % total) + total) % total;
  return { label: SUMMON_SKINS[skinIndex]!.label, index: skinIndex, total };
}
