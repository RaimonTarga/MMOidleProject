export interface IsDead {
  /** 0–24 index into the 5×5 graves sheet */
  graveFrame: number;
  diedAtMs: number;
}

export const GRAVE_FRAME_COUNT = 25;
