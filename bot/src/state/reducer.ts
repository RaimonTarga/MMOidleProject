import type {
  DeltaSnapshot,
  EntityKind,
  NetworkId,
  NetworkedEntity,
} from "@mmo-idle/shared";

/**
 * The bot's mirror of authoritative world state.
 *
 * This is deliberately the ONLY source the policy layer may read. It is built
 * exclusively from `DeltaSnapshot`, which the server filters through
 * `NETWORKED_PLAYER_KEYS` / `NETWORKED_MONSTER_KEYS` — so hidden server state
 * (monster AI, exact DPS, private cooldowns, drop rolls) has no path in here at
 * all. The observable-information rule is therefore structural, not a
 * convention someone has to remember.
 */
export class WorldMirror {
  readonly entities = new Map<NetworkId, NetworkedEntity>();
  readonly kinds = new Map<NetworkId, EntityKind>();

  /** Our own network id — equal to `socket.id` for the entity we control. */
  ownId: NetworkId | null = null;

  /** Node the last snapshot described. */
  nodeId = "";
  tick = 0;

  /** Runtime dungeon projection for the current node, when the server sends one. */
  dungeon: DeltaSnapshot["dungeon"] = undefined;

  reset(): void {
    this.entities.clear();
    this.kinds.clear();
    this.dungeon = undefined;
    this.nodeId = "";
    this.tick = 0;
  }

  apply(snapshot: DeltaSnapshot): void {
    // A full snapshot is authoritative for the whole node: anything the server
    // did not re-send is gone. Patching onto stale entities across a node change
    // would leave phantom monsters in the mirror.
    if (snapshot.full) {
      this.entities.clear();
      this.kinds.clear();
    }

    this.tick = snapshot.tick;
    this.nodeId = snapshot.nodeId;
    this.dungeon = snapshot.dungeon;

    for (const delta of snapshot.deltas) {
      switch (delta.kind) {
        case "add": {
          this.entities.set(delta.netId, { ...delta.components });
          this.kinds.set(delta.netId, delta.entityKind);
          break;
        }
        case "patch": {
          const existing = this.entities.get(delta.netId);
          // A patch for an entity we never saw added means our mirror is behind.
          // Adopt the components rather than dropping them; `player:requestSync`
          // repairs the rest.
          const next: NetworkedEntity = existing ? { ...existing } : {};
          if (delta.components) Object.assign(next, delta.components);
          for (const key of delta.removed ?? []) delete next[key];
          this.entities.set(delta.netId, next);
          break;
        }
        case "remove": {
          this.entities.delete(delta.netId);
          this.kinds.delete(delta.netId);
          break;
        }
      }
    }
  }

  ownEntity(): NetworkedEntity | null {
    if (!this.ownId) return null;
    const entity = this.entities.get(this.ownId);
    if (!entity || this.kinds.get(this.ownId) !== "player") return null;
    return entity;
  }

  entitiesOfKind(kind: EntityKind): Array<[NetworkId, NetworkedEntity]> {
    const out: Array<[NetworkId, NetworkedEntity]> = [];
    for (const [id, entity] of this.entities) {
      if (this.kinds.get(id) === kind) out.push([id, entity]);
    }
    return out;
  }
}
