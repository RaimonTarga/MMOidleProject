import { atom } from 'jotai';

/** The `data-tutorial-anchor` the guide is pointing at, or null. */
export const tutorialHighlightAtom = atom<string | null>(null);

/** Bumped each time the guide presses the control it is pointing at (drives the ring's press pulse). */
export const tutorialPressAtom = atom(0);

/**
 * A selection the guide asks a panel to show, for panels whose selection is
 * local component state (the Make list, the inventory compare pin). The panel
 * applies it when it changes; the guide clears it when the beat ends.
 */
export type TutorialFocus =
  | { surface: 'make'; entryKey: string }
  | { surface: 'inventory'; definitionId: string }
  | { surface: 'upgrade'; definitionId: string };

export const tutorialFocusAtom = atom<TutorialFocus | null>(null);
