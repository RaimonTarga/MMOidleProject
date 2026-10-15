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
 * The first line is also the mid-script beat that marks the end of the first
 * stretch (the class-first guide goes on through Tiers 2 to 4); the panel shows
 * all three once the whole script has run out. Frames are gone in the class-first
 * rework, so the old "spend it on a style" pointer was replaced.
 */
export const TUTORIAL_FAREWELL: readonly string[] = [
  'Two seals, Tier 2, and a tier-2 weapon. The first stretch is done, and the road goes on.',
  'Keep going forward: every zone is open, and each tier brings a choice on the Passive Tree.',
  'Your class screen sets how your class plays. From here the guide has said all it can, and the rest is yours.',
];
