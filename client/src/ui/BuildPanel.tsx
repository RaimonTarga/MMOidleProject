import { useEffect } from "react";
import { useAtom } from "jotai";
import { buildPanelTabAtom, type BuildPanelTab } from "../hud/atoms";
import type { SystemVisibility } from "../hud/systemVisibility";
import { useSystemVisibility } from "../hud/useSystemVisibility";
import { buildSectionIconSource } from "./systemIcons";
import { GameIcon } from "./GameIcon";
import { BuildRunesTab } from "./BuildRunesTab";
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from "../hud/primitives";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
}

/**
 * The arrangement surfaces. Each has its own rail entry and its own tab here, so
 * the dialog is titled by whichever one you arrived on — there is no wrapper
 * destination above them any more.
 */
const TABS: { id: BuildPanelTab; label: string; gate: keyof SystemVisibility }[] = [
  { id: "runes", label: "Runes", gate: "loadout" },
];

export function BuildPanel({ onClose }: Props) {
  const [tab, setTab] = useAtom(buildPanelTabAtom);
  // Through the shared resolver, NOT a locally assembled input, so the tabs here
  // always agree with the rail.
  const visibility = useSystemVisibility();
  const visibleTabs = TABS.filter((item) => visibility[item.gate]);
  // Nothing can open this dialog while every tab is gated, but a gate can close
  // behind an open one (class reset), so fall back rather than render a blank.
  const fallbackTab = visibleTabs[0]?.id ?? "runes";
  const effectiveTab = visibleTabs.some((item) => item.id === tab) ? tab : fallbackTab;
  const title = TABS.find((item) => item.id === effectiveTab)?.label ?? "Runes";

  useEffect(() => {
    if (tab !== effectiveTab) setTab(effectiveTab);
  }, [effectiveTab, setTab, tab]);

  return (
    <GameDialog size="wide" className="build-dialog" onClose={onClose}>
      <DialogHeader
        title={title}
        icon={
          <GameIcon
            source={buildSectionIconSource(effectiveTab)}
            size={22}
            fallback={null}
            decorative
          />
        }
        closeLabel={`Close ${title.toLowerCase()}`}
      />

      <DialogTabs label="Arrangement sections" className="build-dialog__tabs">
        {visibleTabs.map((item) => (
          <DialogTab
            key={item.id}
            selected={effectiveTab === item.id}
            controls={`build-panel-${item.id}`}
            unlockSystems={[item.gate]}
            onSelect={() => setTab(item.id)}
          >
            {item.label}
          </DialogTab>
        ))}
      </DialogTabs>

      <div id={`build-panel-${effectiveTab}`} className="build-dialog__body" role="tabpanel">
        {effectiveTab === "runes" && <BuildRunesTab />}
      </div>
    </GameDialog>
  );
}
