import type { MonsterDefinition } from './types';
import { tutorialMonsterEntries } from './tutorial';
import { caveMonsterEntries } from './cave.monsters';
import { forestMonsterEntries } from './forest.monsters';
import { plainsMonsterEntries } from './plains.monsters';
import { swampMonsterEntries } from './swamp.monsters';
import { mountainMonsterEntries } from './mountain.monsters';
import { jungleMonsterEntries } from './jungle.monsters';
import { desertMonsterEntries } from './desert.monsters';
import { volcanoMonsterEntries } from './volcano.monsters';
import { tundraMonsterEntries } from './tundra.monsters';
import { graveyardMonsterEntries } from './graveyard.monsters';
import { trenchMonsterEntries } from './trench.monsters';
// import { advancedBiomeMonsterEntriesB } from './advancedBiomesB';
import { bossMonsterEntriesT1 } from './bossesT1';
import { bossMonsterEntriesT2 } from './bossesT2';
import { bossMonsterEntriesT3 } from './bossesT3';
import { bossMonsterEntriesT4 } from './bossesT4';

const monsterEntries: [string, MonsterDefinition][] = [
  ...tutorialMonsterEntries,
  ...caveMonsterEntries,
  ...forestMonsterEntries,
  ...plainsMonsterEntries,
  ...swampMonsterEntries,
  ...mountainMonsterEntries,
  ...jungleMonsterEntries,
  ...desertMonsterEntries,
  ...volcanoMonsterEntries,
  ...tundraMonsterEntries,
  ...graveyardMonsterEntries,
  ...trenchMonsterEntries,
  // ...advancedBiomeMonsterEntriesB,
  ...bossMonsterEntriesT1,
  ...bossMonsterEntriesT2,
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
  MonsterTargeting,
  MonsterTargetingMode,
  RepeatingAction,
  StageAction,
  StageCondition,
  UltimateEncounter,
  UltimateEnvironmentalDot,
  UltimateSavedBaseline,
  WaveDef,
} from './types';
