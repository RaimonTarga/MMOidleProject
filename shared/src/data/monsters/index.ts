import type { MonsterDefinition } from './types';
import { tutorialMonsterEntries } from './tutorial';
import { earlyBiomeMonsterEntries } from './earlyBiomes';
import { advancedBiomeMonsterEntriesA } from './advancedBiomesA';
import { advancedBiomeMonsterEntriesB } from './advancedBiomesB';
import { bossMonsterEntriesT1T2 } from './bossesT1T2';
import { bossMonsterEntriesT3 } from './bossesT3';
import { bossMonsterEntriesT4 } from './bossesT4';

const monsterEntries: [string, MonsterDefinition][] = [
  ...tutorialMonsterEntries,
  ...earlyBiomeMonsterEntries,
  ...advancedBiomeMonsterEntriesA,
  ...advancedBiomeMonsterEntriesB,
  ...bossMonsterEntriesT1T2,
  ...bossMonsterEntriesT3,
  ...bossMonsterEntriesT4,
];

export const MONSTER_DATABASE: Map<string, MonsterDefinition> = new Map(monsterEntries);

export type {
  BossAction,
  BossPhase,
  BossScript,
  EncounterStage,
  MonsterDefinition,
  RepeatingAction,
  StageAction,
  StageCondition,
  UltimateEncounter,
  UltimateEnvironmentalDot,
  UltimateSavedBaseline,
  WaveDef,
} from './types';
