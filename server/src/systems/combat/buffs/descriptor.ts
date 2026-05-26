import type { PlayerBuff, TracksCombat } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/components/player';

export interface BuffProjectionContext {
  player: PlayerEntity;
  playerCs?: TracksCombat;
  targetCs?: TracksCombat;
  world: World;
}

export interface BuffDescriptor<TId extends string = string> {
  readonly id: TId;
  readonly label: string;
  readonly color: string;
  readonly project: (ctx: BuffProjectionContext) => PlayerBuff | null;
}

interface BuffOptions {
  label?: string;
  color?: string;
}

export function defineBuff<const Id extends string>(
  id: Id,
  project: (ctx: BuffProjectionContext) => PlayerBuff | null,
  opts: BuffOptions = {},
): BuffDescriptor<Id> {
  return {
    id,
    label: opts.label ?? id.slice(0, 5),
    color: opts.color ?? '#888888',
    project,
  };
}
