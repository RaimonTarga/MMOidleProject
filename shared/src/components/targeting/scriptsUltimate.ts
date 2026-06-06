import type { UltimateEnvironmentalDot, UltimateSavedBaseline } from '../../monsterDatabase';

/**
 * Runtime state for objective-driven ultimate boss encounters.
 * Server-only; never serialized.
 */
export interface ScriptsUltimate {
  stageIndex: number;
  engaged: boolean;
  waveIndex: number;
  trackedAddIds: string[];
  trackedEliteIds: string[];
  /** Players who dealt damage to this boss during the current engagement. */
  contributorIds: string[];
  savedBaseline: UltimateSavedBaseline;
  activeDot?: UltimateEnvironmentalDot;
}

export function initScriptsUltimate(): ScriptsUltimate {
  return {
    stageIndex: -1,
    engaged: false,
    waveIndex: 0,
    trackedAddIds: [],
    trackedEliteIds: [],
    contributorIds: [],
    savedBaseline: {},
  };
}
