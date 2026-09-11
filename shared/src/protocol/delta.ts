import type { CombatEvent } from '../index';
import type { DungeonView } from '../dungeons';
import type { CorpseView } from '../world/corpses';
import type { TombstoneView } from '../world/tombstones';
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
  dungeon?: DungeonView;
  /**
   * Node-scoped combat circles (telegraphed slams). Runtime-only and omitted
   * entirely when the node has none, so quiet nodes pay nothing for it.
   */
  groundZones?: GroundZoneView[];
  /**
   * Raisable corpses on this node. Same contract as `groundZones`: runtime-only and
   * omitted entirely when there are none, so a node with no necromancy in it pays
   * nothing. Present so the Wasteland encounter is legible — which bodies are on the
   * floor, and which the boss has claimed for the cast it is running right now.
   */
  corpses?: CorpseView[];
  /**
   * Tombstones standing on this node. Same omit-when-empty contract as `corpses`,
   * but a DIFFERENT lifetime: tombstones survive node freeze, so a node that was
   * empty for ten minutes still ships its tombs on the full delta that follows the
   * thaw. A tombstone whose owner is still lying dead here is withheld — their own
   * entity is already drawing that grave.
   */
  tombstones?: TombstoneView[];
}
