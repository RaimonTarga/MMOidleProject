import { MONSTER_DATABASE, type MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';

/** A drawn monster's biome, for picking an effect's palette. */
export function bossBiome(scene: GameScene, monsterId: string): string | undefined {
  const view = scene.state.view.get(monsterId) as MonsterView | undefined;
  return view ? MONSTER_DATABASE.get(view.monsterTypeId)?.biome : undefined;
}
