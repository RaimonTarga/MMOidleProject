import { useAtomValue } from 'jotai';
import { BIOME_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import { telemetryAtom } from '../../state';
import { sendAdminAction } from '../../socket';

interface Props {
  nodeId: string;
}

function fmt(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '-';
}

function leakBadgeClass(flags: string[]): string {
  if (flags.length === 0) return 'map-telemetry-flag map-telemetry-flag--ok';
  if (flags.length === 1) return 'map-telemetry-flag map-telemetry-flag--warn';
  return 'map-telemetry-flag map-telemetry-flag--bad';
}

export function NodeTelemetryPanel({ nodeId }: Props) {
  const snap = useAtomValue(telemetryAtom);
  const row = snap?.nodes[nodeId];
  const info = NODE_BIOMES[nodeId];
  const biome = info ? BIOME_DATABASE.get(info.biomeGroup) : null;

  const cpuTotal = row ? row.tickCpuMs + row.idlePopulationMs : 0;
  const logicBudgetPct = Math.min(100, (cpuTotal / 100) * 100);
  const deltaKb = row ? row.lastDeltaBytes / 1024 : 0;
  const estKb = row ? row.estimatedBytes / 1024 : 0;

  return (
    <div className="map-node-telemetry">
      <div className="map-node-telemetry__header">
        <span className="map-node-telemetry__name">{info?.displayName ?? biome?.name ?? nodeId}</span>
        <span className="map-node-telemetry__id">{nodeId}</span>
        {row?.frozen && !row.occupied && (
          <span className="map-telemetry-flag map-telemetry-flag--ok">frozen</span>
        )}
      </div>

      <section className="map-telemetry-section">
        <div className="map-node-telemetry__label">Node debug</div>
        <div className="map-telemetry-row"><span>Coords</span><span>{info ? `row ${info.map.row}, col ${info.map.col}` : '-'}</span></div>
        <div className="map-telemetry-row"><span>Region</span><span>{info?.regionId ?? '-'}</span></div>
        <div className="map-telemetry-row"><span>Kind</span><span>{info?.kind ?? '-'}</span></div>
        <div className="map-telemetry-row"><span>Tier</span><span>{info ? `T${info.biomeTier}` : '-'}</span></div>
        <div className="map-telemetry-row"><span>Biome group</span><span>{info?.biomeGroup ?? '-'}</span></div>
        <div className="map-telemetry-row"><span>Dungeon</span><span>{info?.isDungeon ? 'yes' : 'no'}</span></div>
        <div className="map-telemetry-row"><span>Boss type</span><span>{info?.bossTypeId ?? '-'}</span></div>
        <div className="map-telemetry-row"><span>Target density</span><span>{biome?.mobDensity ?? '-'}</span></div>
        <button
          type="button"
          className="map-debug-action"
          onClick={() => sendAdminAction({ kind: 'respawnNode', nodeId })}
        >
          Respawn Node
        </button>
      </section>

      {!snap && (
        <section className="map-telemetry-section map-telemetry-section--warn">
          <div className="map-node-telemetry__label">Telemetry</div>
          <p className="map-telemetry-note">Waiting for the first admin telemetry snapshot.</p>
        </section>
      )}

      {snap && !row && (
        <section className="map-telemetry-section map-telemetry-section--warn">
          <div className="map-node-telemetry__label">Telemetry</div>
          <p className="map-telemetry-note">No row reported for this node in the latest snapshot.</p>
        </section>
      )}

      {row && (
        <>
      <section className="map-telemetry-section">
        <div className="map-node-telemetry__label">CPU (attributed)</div>
        <div className="map-telemetry-row"><span>Tick</span><span>{fmt(row.tickCpuMs)} ms</span></div>
        <div className="map-telemetry-row"><span>Broadcast</span><span>{fmt(row.broadcastCpuMs)} ms</span></div>
        <div className="map-telemetry-row"><span>Idle population</span><span>{fmt(row.idlePopulationMs)} ms</span></div>
        <div className="map-telemetry-row"><span>Logic budget</span><span>{fmt(logicBudgetPct, 0)}% of 100 ms</span></div>
      </section>

      <section className="map-telemetry-section">
        <div className="map-node-telemetry__label">Memory proxies</div>
        <div className="map-telemetry-row"><span>Players</span><span>{row.players}</span></div>
        <div className="map-telemetry-row"><span>Monsters</span><span>{row.monsters}</span></div>
        <div className="map-telemetry-row"><span>Bosses</span><span>{row.bosses}</span></div>
        <div className="map-telemetry-row"><span>Membership</span><span>{row.nodeMembership}</span></div>
        <div className="map-telemetry-row"><span>Pending events</span><span>{row.pendingEvents}</span></div>
        <div className="map-telemetry-row"><span>Est. footprint</span><span>{fmt(estKb)} KB</span></div>
        <div className="map-telemetry-row"><span>Last delta</span><span>{fmt(deltaKb)} KB</span></div>
      </section>

      <section className="map-telemetry-section">
        <div className="map-node-telemetry__label">Leak signals</div>
        <div className="map-telemetry-row"><span>Monster trend</span><span>{fmt(row.monsterTrend10m, 3)} / min</span></div>
        <div className="map-telemetry-row"><span>Membership drift</span><span>{row.membershipDrift}</span></div>
        <div className="map-telemetry-flags">
          {row.leakFlags.length === 0
            ? <span className={leakBadgeClass([])}>stable</span>
            : row.leakFlags.map((flag) => (
              <span key={flag} className={leakBadgeClass(row.leakFlags)}>{flag}</span>
            ))}
        </div>
      </section>

      {!row.occupied && !row.frozen && row.monsters + row.bosses > 0 && (
        <section className="map-telemetry-section map-telemetry-section--warn">
          <div className="map-node-telemetry__label">Orphan cost</div>
          <p className="map-telemetry-note">
            Simulating with {row.monsters + row.bosses} entities, 0 players.
            Idle CPU {fmt(row.idlePopulationMs)} ms this window.
          </p>
        </section>
      )}

      {!row.occupied && row.frozen && (
        <section className="map-telemetry-section">
          <div className="map-node-telemetry__label">Node state</div>
          <p className="map-telemetry-note">
            Frozen - no live entities. Snapshot persisted; cold start on next enter.
          </p>
        </section>
      )}

      <section className="map-telemetry-section">
        <div className="map-node-telemetry__label">Delta efficiency</div>
        <div className="map-telemetry-row"><span>Adds</span><span>{row.deltaAdds}</span></div>
        <div className="map-telemetry-row"><span>Patches</span><span>{row.deltaPatches}</span></div>
        <div className="map-telemetry-row"><span>Full resyncs</span><span>{row.fullResyncs}</span></div>
        <div className="map-telemetry-row"><span>Entity scans</span><span>{row.entityScans}</span></div>
      </section>

      <section className="map-telemetry-section map-telemetry-section--process">
        <div className="map-node-telemetry__label">Process</div>
        <div className="map-telemetry-row"><span>Heap</span><span>{fmt(snap.process.heapUsedMb)} MB</span></div>
        <div className="map-telemetry-row"><span>Event loop p99</span><span>{fmt(snap.process.eventLoopP99Ms)} ms</span></div>
        <div className="map-telemetry-row"><span>Global orphan CPU</span><span>{fmt(snap.process.orphanCpuPct, 1)}%</span></div>
        <div className="map-telemetry-row"><span>Window</span><span>{snap.windowMs} ms</span></div>
      </section>
        </>
      )}
    </div>
  );
}
