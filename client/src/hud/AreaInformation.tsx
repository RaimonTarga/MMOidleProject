import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  AREA_DANGER_LABELS, areaDanger, BIOME_DATABASE, MODIFIER_LABELS, type AreaDanger,
  NODE_BIOMES, type NodeBiomeInfo, type NodeGateEntity, type NodeModifierFamily,
} from '@mmo-idle/shared';
import { UIIcon } from '../ui/UIIcon';
import { DUNGEON_ICON } from '../ui/map/constants';
import { deathOverlayAtom, hpAtom, nodeLoadingAtom, playerNodeIdAtom, playerPosAtom, statusAtom, tabResyncAtom } from './atoms';
import { areaArrivalAtom } from './areaInformationState';
import { nearbyExits } from './areaInformationModel';
import './areaInformation.css';

const MODIFIER_COPY: Record<NodeModifierFamily, string> = {
  alacrity: 'Monsters move and attack faster.',
  heavy: 'Monsters attack more slowly, but hit harder.',
  swarming: 'More monsters inhabit this area.',
  dominion: 'Fewer monsters, with more health, stronger attacks and defences, and faster movement.',
  fortified: 'Monsters have more plating and damage reduction.',
};
const ARROWS = { north: '↑', south: '↓', east: '→', west: '←' };

/**
 * One skull whose colour climbs with the band: bone, gold, orange, red, then a
 * glowing blood-crimson for boss fights. The icon is ivory with a black edge, so
 * multiplying it by a colour tints the bone and leaves the outline black.
 */
const DANGER_SKULL_TINT: Record<AreaDanger, string> = {
  1: '#f2ece0',
  2: '#ffd45a',
  3: '#ff9636',
  4: '#ff4234',
  5: '#d80f3c',
};

function tintMatrix(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));
  return `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
}

export function AreaDangerLabel({ info }: { info: NodeBiomeInfo }) {
  const danger = areaDanger(info);
  const filterId = `danger-${useId().replace(/:/g, '')}`;
  const label = info.kind === 'sanctuary' ? 'Sanctuary'
    : info.kind === 'tutorial' ? 'Training grounds' : 'Uncharted danger';
  return <span className={`area-danger area-danger--${danger ?? 'special'}`}>
    {/* The filter definition must live outside the glowing wrapper: Chrome will
        not resolve a url() filter defined inside an element that is itself filtered. */}
    {danger && <svg width="0" height="0" className="area-danger__defs" aria-hidden="true">
      <filter id={filterId} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={tintMatrix(DANGER_SKULL_TINT[danger])} />
      </filter>
    </svg>}
    {danger && <span className="area-danger__skull-wrap" aria-hidden="true">
      <span className="area-danger__skull" style={{ filter: `url(#${filterId})` }}>
        <UIIcon frameName={DUNGEON_ICON} size={20} decorative />
      </span>
    </span>}
    <span>{danger ? AREA_DANGER_LABELS[danger] : label}</span>
  </span>;
}

export function AreaInformation() {
  const arrival = useAtomValue(areaArrivalAtom);
  const setArrival = useSetAtom(areaArrivalAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const pos = useAtomValue(playerPosAtom);
  const loading = useAtomValue(nodeLoadingAtom);
  const resync = useAtomValue(tabResyncAtom);
  const death = useAtomValue(deathOverlayAtom);
  const hp = useAtomValue(hpAtom);
  const connection = useAtomValue(statusAtom);
  const [hidden, setHidden] = useState(document.hidden);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [exits, setExits] = useState<NodeGateEntity[]>([]);
  const previousExits = useRef<string[]>([]);
  const blocked = hidden || loading.active || resync.active || death.active || hp <= 0 || connection !== 'connected';

  useEffect(() => {
    const visibility = () => { setHidden(document.hidden); if (document.hidden) setArrival(null); };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [setArrival]);

  useEffect(() => {
    if (!arrival) return;
    const timer = window.setTimeout(() => setArrival(null), Math.max(0, arrival.startedAt + arrival.duration - Date.now()));
    return () => window.clearTimeout(timer);
  }, [arrival, setArrival]);

  useEffect(() => {
    if (death.active || resync.active || connection !== 'connected') setArrival(null);
  }, [death.active, resync.active, connection, setArrival]);

  useEffect(() => {
    setPreviewNodeId(null);
    setExits([]);
    previousExits.current = [];
    const timer = window.setTimeout(() => setPreviewNodeId(nodeId), 2200);
    return () => window.clearTimeout(timer);
  }, [nodeId]);

  useEffect(() => {
    const next = !blocked && previewNodeId === nodeId && nodeId && pos ? nearbyExits(nodeId, pos, previousExits.current) : [];
    previousExits.current = next.map(exit => exit.id);
    setExits(current => current.length === next.length && current.every((exit, i) => exit.id === next[i].id) ? current : next);
  }, [nodeId, pos, blocked, previewNodeId]);

  if (blocked || !nodeId) return null;
  const info = arrival?.nodeId === nodeId ? NODE_BIOMES[nodeId] : null;
  const visibleExits = exits.filter(exit => exit.nodeId === nodeId && exit.exitNodeId && NODE_BIOMES[exit.exitNodeId]);
  return <>
    {info && arrival && <section key={arrival.startedAt} className={`area-arrival area-arrival--${arrival.kind}`}
      style={{ '--arrival-duration': `${arrival.duration}ms` } as CSSProperties} role="status" aria-live="polite">
      {arrival.kind === 'discovery' && <div className="area-arrival__eyebrow">New territory</div>}
      <h2>{info.displayName}</h2>
      <div className="area-arrival__metadata">{BIOME_DATABASE.get(info.biomeGroup)?.name ?? info.biomeGroup} · Tier {info.biomeTier}</div>
      <AreaDangerLabel info={info} />
      {info.modifier && <div className="area-arrival__modifier"><strong>{MODIFIER_LABELS[info.modifier]}</strong>
        {arrival.kind !== 'return' && <span> · {MODIFIER_COPY[info.modifier]}</span>}
      </div>}
    </section>}
    {!info && <div className={visibleExits.length > 1 ? 'area-exits area-exits--multiple' : 'area-exits'}>{visibleExits.map(exit => {
      const destination = NODE_BIOMES[exit.exitNodeId!];
      return <aside key={exit.id} className={`area-exit area-exit--${exit.direction}`}>
      <div className="area-exit__name">{ARROWS[exit.direction]} To {destination.displayName}</div>
      <div className="area-exit__metadata">{BIOME_DATABASE.get(destination.biomeGroup)?.name ?? destination.biomeGroup} · T{destination.biomeTier}</div>
      <AreaDangerLabel info={destination} />
    </aside>;
    })}</div>}
  </>;
}
