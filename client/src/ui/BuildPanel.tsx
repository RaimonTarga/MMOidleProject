import { createPortal } from "react-dom";
import { useAtom, useAtomValue } from "jotai";
import {
  abilityDef,
  riteDef,
  runeBudgetForGlobalMastery,
  runeLoadoutCost,
  stanceDef,
} from "@mmo-idle/shared";
import {
  activeStanceAtom,
  buildPanelTabAtom,
  equippedAbilitiesAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  globalMasteryAtom,
  runesEquippedAtom,
  type BuildPanelTab,
} from "../hud/atoms";
import { AbilitiesPanelContent } from "./AbilitiesPanel";
import { StancesPanelContent } from "./StancesPanel";
import { RitesPanelContent } from "./RitesPanel";
import { BuildRunesTab } from "./BuildRunesTab";
import { BuildIcon, type BuildIconKind } from "./BuildIcon";
import "./skillTree.css";
import "./crafting.css";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
}

const TABS: { id: BuildPanelTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "abilities", label: "Abilities" },
  { id: "stances", label: "Stances" },
  { id: "rites", label: "Rites" },
  { id: "runes", label: "Runes" },
];

function SummaryCard({
  kind,
  eyebrow,
  name,
  text,
  muted = false,
}: {
  kind: BuildIconKind;
  eyebrow: string;
  name: string;
  text: string;
  muted?: boolean;
}) {
  return (
    <div className="build-summary-card">
      <BuildIcon kind={kind} label={name} muted={muted} />
      <div className="build-summary-card__body">
        <div className="build-summary-card__eyebrow">{eyebrow}</div>
        <div className="build-summary-card__name">{name}</div>
        <div className="build-summary-card__text">{text}</div>
      </div>
    </div>
  );
}

function BuildOverview() {
  const equippedAbilities = useAtomValue(equippedAbilitiesAtom);
  const equippedStances = useAtomValue(equippedStancesAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const runesEquipped = useAtomValue(runesEquippedAtom);
  const gm = useAtomValue(globalMasteryAtom);

  const technique = abilityDef(equippedAbilities.technique);
  const guard = abilityDef(equippedAbilities.guard);
  const defaultStance = stanceDef(equippedStances.default);
  const reactiveStance = stanceDef(equippedStances.reactive);
  const active = stanceDef(activeStance);
  const firstRite = riteDef(equippedRites[0]);
  const runeSpent = runeLoadoutCost(runesEquipped);
  const runeBudget = runeBudgetForGlobalMastery(gm);

  return (
    <div className="build-tab-body">
      <div className="build-overview-grid">
        <SummaryCard
          kind="ability"
          eyebrow="Technique"
          name={technique?.name ?? "Empty Technique"}
          text={technique?.blurb ?? "Equip an offensive ability, then use rune rules to tune when it fires."}
          muted={!technique}
        />
        <SummaryCard
          kind="ability"
          eyebrow="Guard"
          name={guard?.name ?? "Empty Guard"}
          text={guard?.blurb ?? "Equip a defensive ability, then bind it to danger conditions in runes."}
          muted={!guard}
        />
        <SummaryCard
          kind="stance"
          eyebrow={active ? "Active Stance" : "Default Stance"}
          name={active?.name ?? defaultStance?.name ?? "No Stance"}
          text={active?.blurb ?? defaultStance?.blurb ?? "Choose a default posture for your baseline stats."}
          muted={!active && !defaultStance}
        />
        <SummaryCard
          kind="stance"
          eyebrow="Reactive Stance"
          name={reactiveStance?.name ?? "No Reactive Stance"}
          text={
            reactiveStance?.blurb ??
            "Equip a reactive posture, then use a Switch Stance rune to enter it temporarily."
          }
          muted={!reactiveStance}
        />
        <SummaryCard
          kind="rite"
          eyebrow={`Rites (${equippedRites.length})`}
          name={firstRite?.name ?? "No Rites Equipped"}
          text={
            firstRite
              ? equippedRites.map((id) => riteDef(id)?.name ?? id).join(", ")
              : "Equip rites for always-on between-fight behavior."
          }
          muted={!firstRite}
        />
        <SummaryCard
          kind="rune"
          eyebrow="Rune Rules"
          name={`${runesEquipped.length} Rules`}
          text={`${runeSpent} / ${runeBudget} RP spent. Runes decide movement, targeting, and ability timing.`}
        />
      </div>
    </div>
  );
}

export function BuildPanel({ onClose }: Props) {
  const [tab, setTab] = useAtom(buildPanelTabAtom);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel build-panel">
        <div className="skill-tree-header">
          <span className="skill-tree-title">Build</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="craft-tabs build-panel-tabs" role="tablist" aria-label="Build sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`craft-tab${tab === item.id ? " craft-tab--active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="skill-tree-body">
          {tab === "overview" && <BuildOverview />}
          {tab === "abilities" && <AbilitiesPanelContent />}
          {tab === "stances" && <StancesPanelContent />}
          {tab === "rites" && <RitesPanelContent />}
          {tab === "runes" && <BuildRunesTab />}
        </div>
      </div>
    </div>,
    document.body,
  );
}
