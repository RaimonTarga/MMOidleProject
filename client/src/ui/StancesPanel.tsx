import { useAtomValue } from "jotai";
import { STANCE_DATABASE, runeBudgetForGlobalMastery, runicPointLoadoutCost, type StanceDef } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  activeStanceAtom,
  equippedRitesAtom,
  equippedStancesAtom,
  globalMasteryAtom,
  knownStancesAtom,
  runesEquippedAtom,
} from "../hud/atoms";
import { GameIcon } from "./GameIcon";
import { stanceIconSource } from "./conceptIcons";
import { DetailLines } from "./describe/DetailLines";
import { stanceLines } from "./describe";
import "./buildPanel.css";

export function StancesPanelContent() {
  const known = useAtomValue(knownStancesAtom);
  const equipped = useAtomValue(equippedStancesAtom);
  const active = useAtomValue(activeStanceAtom);
  const rules = useAtomValue(runesEquippedAtom);
  const rites = useAtomValue(equippedRitesAtom);
  const budget = runeBudgetForGlobalMastery(useAtomValue(globalMasteryAtom));
  const spent = runicPointLoadoutCost({ rules, rites });

  const candidates = known
    .map((id) => STANCE_DATABASE.get(id))
    .filter((stance): stance is StanceDef => !!stance);

  return (
    <div className="build-tab-body stance-sanctum">
      <div className="stance-sanctum__altar">
        <span className="build-section-title">Resting Posture</span>
        <strong>{STANCE_DATABASE.get(equipped.default ?? "")?.name ?? "No default stance"}</strong>
        <span>Your default is free. Rune destinations pay each stance&apos;s sigil cost.</span>
        <span className="stance-sanctum__rp">Shared RP {spent} / {budget}</span>
      </div>

      {candidates.length === 0 ? (
        <div className="loadout-browser__empty">Learn stances in Crafting to awaken this sanctum.</div>
      ) : (
        <div className="stance-sigil-grid" role="list" aria-label="Learned stances">
          {candidates.map((stance) => {
            const isDefault = equipped.default === stance.id;
            const isActive = active === stance.id;
            return (
              <button
                key={stance.id}
                type="button"
                className={`stance-sigil${isDefault ? " stance-sigil--default" : ""}${isActive ? " stance-sigil--active" : ""}`}
                onClick={() => hudBus.requestSetStanceLoadout("default", isDefault ? null : stance.id)}
              >
                <span className="stance-sigil__crest">
                  <GameIcon source={stanceIconSource(stance.id)} size={50} fallback={stance.name.slice(0, 1)} decorative />
                </span>
                <span className="stance-sigil__name">{stance.name}</span>
                <span className="stance-sigil__cost">{stance.runeCost} RP destination</span>
                <span className="stance-sigil__blurb">{stance.blurb}</span>
                <DetailLines className="stance-sigil__effects" lines={stanceLines(stance)} />
                <span className="stance-sigil__state">{isActive ? "ACTIVE" : isDefault ? "DEFAULT" : "SET DEFAULT"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
