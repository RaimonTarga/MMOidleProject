import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useAtomValue } from "jotai";
import {
  catalystLabel,
  ESSENCE_COLORS,
  ESSENCE_LABELS,
  ESSENCE_TYPES,
  GAME_CONFIG,
  PACE_FAMILIES,
  PACE_FAMILY_COLORS,
  type EssenceType,
} from "@mmo-idle/shared";
import { GameIcon } from "../ui/GameIcon";
import {
  catalystMaterial,
  essenceMaterial,
  MaterialChip,
  materialIconSource,
} from "../ui/MaterialChip";
import { catalystProgressAtom, catalystsAtom, essencesAtom } from "./atoms";
import { DisclosureHeader, EngravedMeter, HudPanel } from "./primitives";
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
 * dense chip strip; expanded it names each material and reports catalyst
 * progress toward the next unit. Catalyst families the player has never touched
 * stay hidden so the early game is not cluttered with five empty rows.
 */
export function MaterialsPanel() {
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const progress = useAtomValue(catalystProgressAtom);
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const detailsId = useId();
  const flashClass = useEssenceGainFlash(essences);

  const families = PACE_FAMILIES.filter(
    (family) => (catalysts[family] ?? 0) > 0 || (progress[family] ?? 0) > 0,
  );
  const perUnit = GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT;

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
        // Two wallets, kept visually separate: run together they read as one
        // ten-item strip, and a catalyst count gets mistaken for an essence.
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
          {families.length > 0 && (
            <div className="materials-strip__group material-chip-strip">
                {families.map((family) => (
                  <MaterialChip
                    key={family}
                    material={catalystMaterial(family)}
                    held={catalysts[family] ?? 0}
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

          {families.length > 0 && <div className="materials-divider" />}

          {families.map((family) => (
            <div key={family} className="essence-row">
              <GameIcon
                source={materialIconSource(catalystMaterial(family))}
                size={18}
                fallback={null}
                className="economy-icon catalyst-icon"
                decorative
              />
              <span className="essence-name" style={{ color: PACE_FAMILY_COLORS[family] }}>
                {catalystLabel(family)}
              </span>
              <span className="essence-value">{catalysts[family] ?? 0}</span>
              <span className="essence-progress">
                <span className="essence-progress__value">
                  {progress[family] ?? 0}/{perUnit}
                </span>
                {/* Bounded and static between kills, so engraved rather than
                    conduit — the count above says how many, this says how close
                    the next one is. */}
                <EngravedMeter
                  className="essence-progress__meter"
                  fraction={perUnit > 0 ? (progress[family] ?? 0) / perUnit : 0}
                  label={`${catalystLabel(family)}: ${progress[family] ?? 0} of ${perUnit} toward the next`}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </HudPanel>
  );
}
