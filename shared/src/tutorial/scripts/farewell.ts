/**
 * The guide's goodbye (docs/guided-tutorial-plan.md: "the guide says goodbye
 * ('keep going forward'), points at the Passive Tree for the frame choice, and
 * disappears").
 *
 * It lives here rather than inside `TutorialPanel` because every other line the
 * guide says lives in `shared/src/tutorial/scripts/` — "edit them directly" is
 * the plan's own instruction, and a line in a React component is not where
 * anyone would look for it.
 *
 * The third line is the frames line: the one place the guide names the frame
 * choice (by the Passive Tree's word for it, "style": playtest 3 found the guide
 * saying "frame" over a panel that says "Choose your style") AND the frame-charge glow that comes with it (the weapon glow that
 * grows with a frame's banked charge, `docs/briefs/frame-loops-2026-10-01.md`
 * §1, shipped in commit ec3a9d65). It is a pointer, not a lesson: the frames
 * themselves are a Tier-2 decision the guide deliberately leaves to the player.
 */
export const TUTORIAL_FAREWELL: readonly string[] = [
  'Two seals, Tier 2, and a tier-2 weapon. That is the guided part done.',
  'Keep going forward: new zones are open, and your next skill point is waiting in the Passive Tree.',
  'Spend it on a style. It decides how your mechanic pays out, and from then on your weapon glows brighter as the style banks charge — that glow is the payoff filling up.',
];
