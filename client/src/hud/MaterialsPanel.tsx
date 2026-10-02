import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useAtomValue } from "jotai";
import {
  capstoneMaterialName,
  ESSENCE_COLORS,
  ESSENCE_LABELS,
  ESSENCE_TYPES,
  PACKET_IDS,
  packetDefinition,
  type EssenceType,
} from "@mmo-idle/shared";
import { GameIcon } from "../ui/GameIcon";
import {
  capstoneMaterial,
  essenceMaterial,
  MaterialChip,
  materialIconSource,
  shardMaterial,
} from "../ui/MaterialChip";
import { capstonesAtom, essencesAtom, shardsAtom } from "./atoms";
import { DisclosureHeader, HudPanel } from "./primitives";
import "./essence.css";

const MATERIALS_EXPANDED_STORAGE_KEY = "mmo_idle.desktop.materials_expanded";

function readExpandedPreference(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MATERIALS_EXPANDED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Per-type flash counter. Incrementing triggers a flash; odd → flash-a, even →
 * flash-b. Alternating the animation name forces the browser to restart it even
 * mid-animation, which matters when essence arrives in bursts.
 */
function useEssenceGainFlash(essences: Record<EssenceType, number>) {
  const [flashKeys, setFlashKeys] = useState<Record<EssenceType, number>>(
    () => Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
  );
  const prevRef = useRef<Record<EssenceType, number>>(
    Object.fromEntries(ESSENCE_TYPES.map((t) => [t, 0])) as Record<EssenceType, number>,
  );

  useEffect(() => {
    const prev = prevRef.current;
    const gained = ESSENCE_TYPES.filter((t) => (essences[t] ?? 0) > (prev[t] ?? 0));
    for (const t of ESSENCE_TYPES) prevRef.current[t] = essences[t] ?? 0;
    if (gained.length === 0) return;

    setFlashKeys((keys) => {
      const next = { ...keys };
      for (const t of gained) next[t] = (next[t] ?? 0) + 1;
      return next;
    });
  }, [essences]);

  return function flashClass(type: EssenceType): string {
    const key = flashKeys[type];
    if (!key) return "";
    return ` essence-row--flash-${key % 2 === 1 ? "a" : "b"}`;
  };
}

/**
 * The player's whole spendable economy in one rail panel. Collapsed it is a
 * dense chip strip; expanded it names each material. Shards and touched
 * capstones stay hidden until the player has actually held one, so the early
 * game is not cluttered with empty rows.
 */
export function MaterialsPanel() {
  const essences = useAtomValue(essencesAtom);
  const shards = useAtomValue(shardsAtom);
  const capstones = useAtomValue(capstonesAtom);
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const detailsId = useId();
  const flashClass = useEssenceGainFlash(essences);

  // Lineage wallets (progression rework Phase 1): shards by packet, touched
  // capstones by biome. Hidden until touched — eight empty shard rows would
  // swamp the early game before a player has opened a single tree.
  const ownedShards = PACKET_IDS.filter((packet) => (shards[packet] ?? 0) > 0);
  const ownedCapstones = Object.entries(capstones).filter(([, amount]) => (amount ?? 0) > 0);

  const toggleExpanded = () => {
    setExpanded((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(MATERIALS_EXPANDED_STORAGE_KEY, String(next));
      } catch {
        // Keep the disclosure usable even when browser storage is unavailable.
      }
      return next;
    });
  };

  return (
    <HudPanel
      className="sidebar-panel economy-panel materials-panel"
      data-ui-unlock-system="materials"
    >
      <DisclosureHeader
        className="panel-title panel-title--collapsible"
        title="Materials"
        expanded={expanded}
        controls={detailsId}
        onToggle={toggleExpanded}
      />

      {!expanded && (
        <div className="materials-strip">
          <div className="materials-strip__group material-chip-strip">
            {ESSENCE_TYPES.map((type) => (
              <MaterialChip
                key={type}
                material={essenceMaterial(type)}
                held={essences[type] ?? 0}
              />
            ))}
          </div>
          {ownedShards.length > 0 && (
            <div className="materials-strip__group material-chip-strip">
              {ownedShards.map((packet) => (
                <MaterialChip
                  key={packet}
                  material={shardMaterial(packet)}
                  held={shards[packet] ?? 0}
                  size={18}
                />
              ))}
            </div>
          )}
          {ownedCapstones.length > 0 && (
            <div className="materials-strip__group material-chip-strip">
              {ownedCapstones.map(([biome, amount]) => (
                <MaterialChip
                  key={biome}
                  material={capstoneMaterial(biome)}
                  held={amount}
                  size={18}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div id={detailsId} className="essence-list">
          {ESSENCE_TYPES.map((type) => (
            <div
              key={type}
              className={`essence-row${flashClass(type)}`}
              style={{ "--flash-color": `${ESSENCE_COLORS[type]}44` } as CSSProperties}
            >
              <GameIcon
                source={materialIconSource(essenceMaterial(type))}
                size={16}
                fallback={<span className="essence-dot" style={{ background: ESSENCE_COLORS[type] }} />}
                className="economy-icon"
                decorative
              />
              <span className="essence-name">{ESSENCE_LABELS[type]}</span>
              <span className="essence-value" style={{ color: ESSENCE_COLORS[type] }}>
                {essences[type] ?? 0}
              </span>
            </div>
          ))}

          {ownedShards.length > 0 && <div className="materials-divider" />}

          {ownedShards.map((packet) => (
            <div key={packet} className="essence-row">
              <GameIcon
                source={materialIconSource(shardMaterial(packet))}
                size={18}
                fallback={null}
                className="economy-icon"
                decorative
              />
              <span className="essence-name" style={{ color: packetDefinition(packet)?.color }}>
                {packetDefinition(packet)?.name ?? packet} shards
              </span>
              <span className="essence-value">{shards[packet] ?? 0}</span>
            </div>
          ))}

          {ownedCapstones.length > 0 && <div className="materials-divider" />}

          {ownedCapstones.map(([biome, amount]) => (
            <div key={biome} className="essence-row">
              <GameIcon
                source={materialIconSource(capstoneMaterial(biome))}
                size={18}
                fallback={null}
                className="economy-icon"
                decorative
              />
              <span className="essence-name">{capstoneMaterialName(biome)}</span>
              <span className="essence-value">{amount}</span>
            </div>
          ))}
        </div>
      )}
    </HudPanel>
  );
}
