/**
 * The landing backdrop's clip roster, and the order a visit plays them in.
 *
 * Data only, so choosing what the landing page shows is an edit to a list rather
 * than to the player. Every entry must exist under `client/public/landing/`;
 * regenerate one with `pnpm landing:capture --clip=<id>`.
 */

export interface LandingClip {
  /** Capture clip id — matches `CINEMATIC_CLIPS`/`CINEMATIC_CANDIDATES`. */
  id: string;
  src: string;
  /** Human note on what the shot is. Not rendered; this list is the record. */
  look: string;
}

/**
 * The FIRST entry is the primary and is special in three ways: it is the only
 * clip on the critical path, the only one whose poster ships, and the one
 * `#landing-poster` in `index.html` hardcodes. Changing the primary means
 * regenerating that poster and updating the CSS URL in `index.html` to match.
 *
 * The rest are variants, fetched one at a time only after the primary is playing
 * — see `LandingCinematic`. A visitor who logs straight in downloads the primary
 * and nothing else.
 *
 * `t1-cave` and `t1-swamp` were captured, reviewed beside these three, and CUT.
 * Not a pipeline problem and not fixable by re-capturing: they hold the fewest
 * monsters of the Tier-1 set (17 and 22, so under one per frame at zoom 1) and
 * carry the least structure — cave reads as a near-black rectangle with a
 * stalagmite in it, swamp as flat olive with almost no contrast. The three below
 * each carry a frame on their own. Both are still authored in
 * `cinematic/clips.ts`, so bringing either back is a capture and a line here.
 */
export const LANDING_CLIPS: readonly LandingClip[] = [
  { id: 't1-forest', src: '/landing/t1-forest.mp4', look: 'green canopy, a dirt trail, foxes and wolves' },
  { id: 't1-plains', src: '/landing/t1-plains.mp4', look: 'open pale grassland, herds of boar and hare, blossom trees' },
  { id: 't1-mountain', src: '/landing/t1-mountain.mp4', look: 'cold grey stone ledges, goats and bandits' },
];

export const LANDING_POSTER_SRC = '/landing/t1-forest.webp';

/**
 * Play order for one visit: the primary first, the variants shuffled behind it.
 *
 * Shuffled rather than fixed so a returning visitor is not shown the same second
 * clip every time — the rotation exists for variety, and a fixed order spends
 * the bandwidth without delivering it to anyone who leaves after two clips.
 */
export function landingPlayOrder(): LandingClip[] {
  const [primary, ...rest] = LANDING_CLIPS;
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return primary ? [primary, ...rest] : [];
}
