import { useEffect } from "react";
import type { UiUnlockSystem } from "../hud/uiUnlocks";
import { useAtom, useAtomValue } from "jotai";
import {
  abilityDef,
  riteDef,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  stanceDef,
} from "@mmo-idle/shared";
import {
  abilitySlotsAtom,
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
import { BuildIcon, type BuildIconKind } from "./BuildIcon";
import { abilityIconSource } from "./abilityIcons";
import { riteIconSource, stanceIconSource } from "./conceptIcons";
import type { IconSource } from "./GameIcon";
import { AbilitiesPanelContent } from "./AbilitiesPanel";
import { StancesPanelContent } from "./StancesPanel";
import { RitesPanelContent } from "./RitesPanel";
import { DialogHeader, DialogTab, DialogTabs, EngravedMeter, GameDialog } from "../hud/primitives";
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
];

interface Socket {
  /** What goes here, e.g. "Technique". */
  kind: string;
  /** Occupant name, or null when the socket is empty. */
  filled: string | null;
  /** The occupant's art, when the system has any. */
  icon?: IconSource | null;
  /** Firing order within a kind; a corner engraving, not a sentence. */
  order?: number;
  /** Marks the stance actually in force right now. */
  active?: boolean;
}

/**
 * One socket: a cut-corner cell that is either engraved-hollow or filled. The
 * firing order that used to read "fires first" is a corner numeral, because the
 * order matters for every slot but only needs stating once per cell.
 *
 * The occupant is drawn, not just named — the overview is where you check your
 * build at a glance, and a name in 11px monospace is the slowest possible way to
 * answer "what have I got equipped". Abilities have art today; stances and rites
 * fall back to their initials until theirs lands, which is the same fallback the
 * pickers already use.
 */
function SocketCell({
  socket,
  iconKind,
  onOpen,
}: {
  socket: Socket;
  iconKind: BuildIconKind;
  onOpen: () => void;
}) {
  const filled = socket.filled !== null;
  const classes = [
    'loadout-socket',
    filled ? 'loadout-socket--filled' : 'loadout-socket--empty',
    socket.active && 'loadout-socket--active',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onOpen}
      title={filled
        ? `${socket.kind}: ${socket.filled}${socket.active ? ' — active' : ''}`
        : `${socket.kind}: empty — choose one`}
    >
      {socket.order !== undefined && (
        <span className="loadout-socket__order" aria-hidden="true">{socket.order}</span>
      )}
      <BuildIcon
        kind={iconKind}
        label={socket.filled ?? socket.kind}
        size={30}
        muted={!filled}
        icon={socket.icon}
      />
      <span className="loadout-socket__text">
        <span className="loadout-socket__kind">{socket.kind}</span>
        <span className={`loadout-socket__name${filled ? '' : ' loadout-socket__name--empty'}`}>
          {socket.filled ?? 'Empty'}
        </span>
      </span>
    </button>
  );
}

function SocketGroup({
  title,
  sockets,
  iconKind,
  unlockSystem,
  onOpen,
}: {
  title: string;
  sockets: Socket[];
  iconKind: BuildIconKind;
  unlockSystem?: UiUnlockSystem;
  onOpen: () => void;
}) {
  if (sockets.length === 0) return null;
  return (
    <section className="loadout-group" data-ui-unlock-system={unlockSystem}>
      <div className="loadout-group__title">{title}</div>
      <div className="loadout-group__sockets">
        {sockets.map((socket, index) => (
          <SocketCell
            key={`${socket.kind}-${index}`}
            socket={socket}
            iconKind={iconKind}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Loadout IS the overview (V5): a board of sockets showing what is equipped and
 * what is empty, where picking a socket takes you to the surface that fills it.
 * It replaces a sheet of label/value rows — accurate, but it read as a report
 * about the build rather than as the build itself.
 */
function LoadoutBoard({
  visibility,
  onOpenTab,
}: {
  visibility: SystemVisibility;
  onOpenTab: (tab: BuildPanelTab) => void;
}) {
  const equippedAbilities = useAtomValue(equippedAbilitiesAtom);
  const abilitySlots = useAtomValue(abilitySlotsAtom);
  const equippedStances = useAtomValue(equippedStancesAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const runesEquipped = useAtomValue(runesEquippedAtom);
  const gm = useAtomValue(globalMasteryAtom);

  const runeSpent = runicPointLoadoutCost({ rules: runesEquipped, rites: equippedRites });
  const runeBudget = runeBudgetForGlobalMastery(gm);
  const runePct = runeBudget > 0 ? Math.min(100, (runeSpent / runeBudget) * 100) : 0;

  const abilitySocket = (kind: string, id: string | undefined, order?: number): Socket => {
    const ability = abilityDef(id);
    return {
      kind,
      filled: ability?.name ?? null,
      icon: ability ? abilityIconSource(ability) : null,
      order,
    };
  };

  const abilitySockets: Socket[] = [
    ...Array.from({ length: abilitySlots.technique }, (_, index) =>
      abilitySocket(
        'Technique',
        equippedAbilities.techniques[index],
        abilitySlots.technique > 1 ? index + 1 : undefined,
      )),
    ...Array.from({ length: abilitySlots.guard }, (_, index) =>
      abilitySocket(
        'Guard',
        equippedAbilities.guards[index],
        abilitySlots.guard > 1 ? index + 1 : undefined,
      )),
  ];

  const stanceSockets: Socket[] = [
    {
      kind: 'Default',
      filled: stanceDef(equippedStances.default)?.name ?? null,
      icon: equippedStances.default ? stanceIconSource(equippedStances.default) : null,
      active: equippedStances.default !== null && equippedStances.default === activeStance,
    },
  ];

  const riteSockets: Socket[] = equippedRites.map((riteId, index) => ({
    kind: `Rite ${index + 1}`,
    filled: riteDef(riteId)?.name ?? null,
    icon: riteIconSource(riteId),
  }));

  return (
    <div className="build-tab-body">
      <div className="loadout-board">
        {visibility.abilities && (
          <SocketGroup
            title="Abilities"
            sockets={abilitySockets}
            iconKind="ability"
            unlockSystem="abilities"
            onOpen={() => onOpenTab('abilities')}
          />
        )}
        {visibility.stances && (
          <SocketGroup
            title="Stances"
            sockets={stanceSockets}
            iconKind="stance"
            unlockSystem="stances"
            onOpen={() => onOpenTab('stances')}
          />
        )}
        {visibility.rites && (
          <SocketGroup
            title="Rites"
            sockets={riteSockets}
            iconKind="rite"
            unlockSystem="rites"
            onOpen={() => onOpenTab('rites')}
          />
        )}

        <section className="loadout-group">
          <div className="loadout-group__title">
            Runic Budget
            <span className="loadout-group__count">{runesEquipped.length} equipped</span>
          </div>
          <div className="loadout-budget">
            <span className="loadout-budget__label">Budget</span>
            <EngravedMeter
              className="loadout-budget__meter"
              fraction={runePct / 100}
              over={runeSpent > runeBudget}
              label={`Shared Runic budget: ${runeSpent} of ${runeBudget} points spent`}
            />
            <span className={`loadout-budget__value${runeSpent > runeBudget ? ' loadout-budget__value--over' : ''}`}>
              {runeSpent} / {runeBudget} RP
            </span>
          </div>
        </section>
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
    : { ...resolvedVisibility, mastery: true, abilities: true, stances: true, rites: true };
  const visibleTabs = TABS.filter((item) => !item.gate || visibility[item.gate]);
  const effectiveTab = visibleTabs.some((item) => item.id === tab) ? tab : "overview";

  useEffect(() => {
    if (tab !== effectiveTab) setTab(effectiveTab);
  }, [effectiveTab, setTab, tab]);

  return (
    <GameDialog size="wide" className="build-dialog" onClose={onClose}>
      <DialogHeader title="Loadout" closeLabel="Close loadout" />

      <DialogTabs label="Loadout sections" className="build-dialog__tabs">
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
        {effectiveTab === "overview" && <LoadoutBoard visibility={visibility} onOpenTab={setTab} />}
        {effectiveTab === "abilities" && <AbilitiesPanelContent />}
        {effectiveTab === "stances" && <StancesPanelContent />}
        {effectiveTab === "rites" && <RitesPanelContent />}
      </div>
    </GameDialog>
  );
}
