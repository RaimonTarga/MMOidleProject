import { useEffect } from "react";
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
  knownAbilitiesAtom,
  knownRitesAtom,
  knownStancesAtom,
  playerTierAtom,
  runesEquippedAtom,
  type BuildPanelTab,
} from "../hud/atoms";
import { resolveSystemVisibility, type SystemVisibility } from "../hud/systemVisibility";
import type { UiUnlockSystem } from "../hud/uiUnlocks";
import { AbilitiesPanelContent } from "./AbilitiesPanel";
import { StancesPanelContent } from "./StancesPanel";
import { RitesPanelContent } from "./RitesPanel";
import { BuildRunesTab } from "./BuildRunesTab";
import { BuildIcon, type BuildIconKind } from "./BuildIcon";
import { DialogHeader, DialogTab, DialogTabs, GameDialog } from "../hud/primitives";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
  /** Desktop Phase 5 reveal policy; mobile keeps its existing destinations. */
  progressiveDisclosure?: boolean;
}

const TABS: { id: BuildPanelTab; label: string; gate?: keyof SystemVisibility }[] = [
  { id: "overview", label: "Overview" },
  { id: "abilities", label: "Abilities", gate: "abilities" },
  { id: "stances", label: "Stances", gate: "stances" },
  { id: "rites", label: "Rites", gate: "rites" },
  { id: "runes", label: "Runes" },
];

function SummaryCard({
  kind,
  eyebrow,
  name,
  text,
  muted = false,
  unlockSystem,
}: {
  kind: BuildIconKind;
  eyebrow: string;
  name: string;
  text: string;
  muted?: boolean;
  unlockSystem?: UiUnlockSystem;
}) {
  return (
    <div
      className="build-summary-card"
      data-ui-unlock-system={unlockSystem}
    >
      <BuildIcon kind={kind} label={name} muted={muted} />
      <div className="build-summary-card__body">
        <div className="build-summary-card__eyebrow">{eyebrow}</div>
        <div className="build-summary-card__name">{name}</div>
        <div className="build-summary-card__text">{text}</div>
      </div>
    </div>
  );
}

function BuildOverview({ visibility }: { visibility: SystemVisibility }) {
  const equippedAbilities = useAtomValue(equippedAbilitiesAtom);
  const equippedStances = useAtomValue(equippedStancesAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const runesEquipped = useAtomValue(runesEquippedAtom);
  const gm = useAtomValue(globalMasteryAtom);

  // The overview shows the HIGHEST-PRIORITY ability of each kind (slot 1); the
  // Abilities panel is where the full multi-slot loadout lives.
  const technique = abilityDef(equippedAbilities.techniques[0]);
  const guard = abilityDef(equippedAbilities.guards[0]);
  const extraTechniques = Math.max(0, equippedAbilities.techniques.length - 1);
  const extraGuards = Math.max(0, equippedAbilities.guards.length - 1);
  const defaultStance = stanceDef(equippedStances.default);
  const reactiveStance = stanceDef(equippedStances.reactive);
  const active = stanceDef(activeStance);
  const firstRite = riteDef(equippedRites[0]);
  const runeSpent = runeLoadoutCost(runesEquipped);
  const runeBudget = runeBudgetForGlobalMastery(gm);

  return (
    <div className="build-tab-body">
      <div className="build-overview-grid">
        {visibility.abilities && (
          <>
            <SummaryCard
              kind="ability"
              eyebrow={extraTechniques > 0 ? `Technique (+${extraTechniques})` : "Technique"}
              name={technique?.name ?? "Empty Technique"}
              text={technique?.blurb ?? "Equip an offensive ability, then use rune rules to tune when it fires."}
              muted={!technique}
              unlockSystem="abilities"
            />
            <SummaryCard
              kind="ability"
              eyebrow={extraGuards > 0 ? `Guard (+${extraGuards})` : "Guard"}
              name={guard?.name ?? "Empty Guard"}
              text={guard?.blurb ?? "Equip a defensive ability, then bind it to danger conditions in runes."}
              muted={!guard}
              unlockSystem="abilities"
            />
          </>
        )}
        {visibility.stances && (
          <>
            <SummaryCard
              kind="stance"
              eyebrow={active ? "Active Stance" : "Default Stance"}
              name={active?.name ?? defaultStance?.name ?? "No Stance"}
              text={active?.blurb ?? defaultStance?.blurb ?? "Choose a default posture for your baseline stats."}
              muted={!active && !defaultStance}
              unlockSystem="stances"
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
              unlockSystem="stances"
            />
          </>
        )}
        {visibility.rites && (
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
            unlockSystem="rites"
          />
        )}
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

export function BuildPanel({ onClose, progressiveDisclosure = false }: Props) {
  const [tab, setTab] = useAtom(buildPanelTabAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const knownAbilities = useAtomValue(knownAbilitiesAtom);
  const equippedAbilities = useAtomValue(equippedAbilitiesAtom);
  const knownStances = useAtomValue(knownStancesAtom);
  const equippedStances = useAtomValue(equippedStancesAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const knownRites = useAtomValue(knownRitesAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const resolvedVisibility = resolveSystemVisibility({
    playerTier,
    globalMastery,
    knownAbilities,
    equippedAbilities,
    knownStances,
    equippedStances,
    activeStance,
    knownRites,
    equippedRites,
  });
  const visibility: SystemVisibility = progressiveDisclosure
    ? resolvedVisibility
    : { mastery: true, abilities: true, stances: true, rites: true };
  const visibleTabs = TABS.filter((item) => !item.gate || visibility[item.gate]);
  const effectiveTab = visibleTabs.some((item) => item.id === tab) ? tab : "overview";

  useEffect(() => {
    if (tab !== effectiveTab) setTab(effectiveTab);
  }, [effectiveTab, setTab, tab]);

  return (
    <GameDialog size="wide" className="build-dialog" onClose={onClose}>
      <DialogHeader title="Build" closeLabel="Close build" />

      <DialogTabs label="Build sections" className="build-dialog__tabs">
        {visibleTabs.map((item) => (
          <DialogTab
            key={item.id}
            selected={effectiveTab === item.id}
            controls={`build-panel-${item.id}`}
            unlockSystems={item.gate ? [item.gate] : undefined}
            onSelect={() => setTab(item.id)}
          >
            {item.label}
          </DialogTab>
        ))}
      </DialogTabs>

      <div id={`build-panel-${effectiveTab}`} className="build-dialog__body" role="tabpanel">
        {effectiveTab === "overview" && <BuildOverview visibility={visibility} />}
        {effectiveTab === "abilities" && <AbilitiesPanelContent />}
        {effectiveTab === "stances" && <StancesPanelContent />}
        {effectiveTab === "rites" && <RitesPanelContent />}
        {effectiveTab === "runes" && <BuildRunesTab />}
      </div>
    </GameDialog>
  );
}
