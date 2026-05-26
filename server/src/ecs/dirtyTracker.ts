import type { NetworkedComponentKey, NetworkId } from "@mmo-idle/shared";

export interface DirtyDrain {
  patched: Map<NetworkId, Set<NetworkedComponentKey>>;
  detached: Map<NetworkId, Set<NetworkedComponentKey>>;
}

export class DirtyTracker {
  private patched = new Map<NetworkId, Set<NetworkedComponentKey>>();
  private detached = new Map<NetworkId, Set<NetworkedComponentKey>>();

  markPatched(netId: NetworkId, key: NetworkedComponentKey): void {
    this.getSet(this.patched, netId).add(key);
    this.detached.get(netId)?.delete(key);
  }

  markDetached(netId: NetworkId, key: NetworkedComponentKey): void {
    this.getSet(this.detached, netId).add(key);
    this.patched.get(netId)?.delete(key);
  }

  drain(): DirtyDrain {
    const result = {
      patched: this.patched,
      detached: this.detached,
    };
    this.patched = new Map();
    this.detached = new Map();
    return result;
  }

  private getSet(
    records: Map<NetworkId, Set<NetworkedComponentKey>>,
    netId: NetworkId,
  ): Set<NetworkedComponentKey> {
    let set = records.get(netId);
    if (!set) {
      set = new Set();
      records.set(netId, set);
    }
    return set;
  }
}
