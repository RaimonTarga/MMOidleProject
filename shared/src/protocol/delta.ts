import type { CombatEvent } from '../index';
import type {
  EntityKind,
  NetworkedComponentKey,
  NetworkedEntity,
  NetworkId,
} from './networkedEntity';

export type EntityDelta =
  | {
      kind: 'add';
      netId: NetworkId;
      entityKind: EntityKind;
      components: Partial<NetworkedEntity>;
    }
  | {
      kind: 'patch';
      netId: NetworkId;
      components?: Partial<NetworkedEntity>;
      removed?: NetworkedComponentKey[];
    }
  | {
      kind: 'remove';
      netId: NetworkId;
    };

export interface DeltaSnapshot {
  tick: number;
  nodeId: string;
  full: boolean;
  deltas: EntityDelta[];
  events: CombatEvent[];
}
