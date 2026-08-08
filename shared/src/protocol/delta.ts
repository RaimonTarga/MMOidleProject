import type { CombatEvent } from '../index';
import type { DungeonGauntletView } from '../dungeons';
import type { GroundZoneView } from '../world/groundZones';
import type { Vec2 } from '../systems/spatial';
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

export interface VoidOverlordRespawnState {
  nodeId: string;
  pos: Vec2;
  remainingMs: number;
  durationMs: number;
}

export interface DeltaSnapshot {
  tick: number;
  nodeId: string;
  full: boolean;
  deltas: EntityDelta[];
  events: CombatEvent[];
  voidOverlordRespawn?: VoidOverlordRespawnState;
  dungeonGauntlet?: DungeonGauntletView;
  /**
   * Node-scoped combat circles (telegraphed slams). Runtime-only and omitted
   * entirely when the node has none, so quiet nodes pay nothing for it.
   */
  groundZones?: GroundZoneView[];
}
