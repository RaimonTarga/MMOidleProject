import type { BuffCategory, BuffShape, PlayerBuff, TracksCombat } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';

export interface BuffProjectionContext {
  player: PlayerEntity;
  playerCs?: TracksCombat;
  targetCs?: TracksCombat;
  target?: MonsterEntity;
  world: World;
}

export interface BuffDescriptor<TId extends string = string> {
  readonly id: TId;
  readonly label: string;
  readonly color: string;
  readonly category: BuffCategory;
  readonly shape: BuffShape;
  readonly iconKey: string;
  readonly project: (ctx: BuffProjectionContext) => PlayerBuff | null;
}

interface BuffOptions {
  label?: string;
  color?: string;
  category: BuffCategory;
  shape?: BuffShape;
  iconKey?: string;
}

export function defineBuff<const Id extends string>(
  id: Id,
  project: (ctx: BuffProjectionContext) => Omit<PlayerBuff, 'category' | 'iconKey' | 'shape'> | null,
  opts: BuffOptions,
): BuffDescriptor<Id> {
  return {
    id,
    label: opts.label ?? id.slice(0, 5),
    color: opts.color ?? '#888888',
    category: opts.category,
    shape: opts.shape ?? 'square',
    iconKey: opts.iconKey ?? id,
    project: (ctx) => {
      const buff = project(ctx);
      if (!buff) return null;
      return {
        ...buff,
        category: opts.category,
        iconKey: opts.iconKey ?? id,
        shape: opts.shape ?? 'square',
      };
    },
  };
}
