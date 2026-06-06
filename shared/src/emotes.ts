/** Authoritative emote ids and wheel slot mapping. */

export const EMOTE_IDS = ['scuba'] as const;
export type EmoteId = (typeof EMOTE_IDS)[number];

export const EMOTE_DURATION_MS = 10_000;

/** Arrow-key wheel slot → emote id. Empty slots are reserved for future emotes. */
export const EMOTE_WHEEL_SLOTS = {
  up: 'scuba',
  down: null,
  left: null,
  right: null,
} as const satisfies Record<'up' | 'down' | 'left' | 'right', EmoteId | null>;

export type EmoteWheelDirection = keyof typeof EMOTE_WHEEL_SLOTS;

/** Source GIF used for the DOM emote-wheel icon (animates natively in <img>). */
export const EMOTE_ASSETS: Record<EmoteId, string> = {
  scuba: '/assets/emotes/fun/scuba.gif',
};

/** Spritesheet metadata for the in-world animated bubble (Phaser can't decode GIFs). */
export interface EmoteSpriteSheet {
  file: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
}

export const EMOTE_SPRITESHEETS: Record<EmoteId, EmoteSpriteSheet> = {
  scuba: {
    file: '/assets/emotes/fun/scuba.png',
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 30,
    frameRate: 12,
  },
};

const EMOTE_ID_SET = new Set<string>(EMOTE_IDS);

export function isValidEmoteId(id: string): id is EmoteId {
  return EMOTE_ID_SET.has(id);
}

export function emoteForWheelDirection(
  direction: EmoteWheelDirection,
): EmoteId | null {
  return EMOTE_WHEEL_SLOTS[direction];
}
