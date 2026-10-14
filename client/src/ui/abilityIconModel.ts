/**
 * The ability icon's base-glyph art — the pure half. No Phaser, no DOM:
 * `server/test/abilityIconArt.test.ts` checks every glyph named here exists on
 * disk.
 *
 * NO NEW ART. Every glyph is an existing concept icon, never a packed atlas frame
 * edited by hand and never a PixelLab generation.
 */
const ART = "/assets/concept-icons";

/** The public path of one concept icon (`<dir>/<name>`, no extension). */
export function conceptArtPath(path: string): string {
  return `${ART}/${path}.png`;
}

/**
 * Base glyphs for the abilities that have no art of their own: §22.8's two
 * additions borrow the tile that already says what they are — Sidestep the
 * evasion-window tile its buff already wears, Cull the Execute stance (a strike
 * that wants the target low).
 */
export const BORROWED_BASE_GLYPHS: Readonly<Record<string, string>> = {
  sidestep: "statuses/buffs/lineage-evasion",
  cull: "stances/execute-stance",
};
