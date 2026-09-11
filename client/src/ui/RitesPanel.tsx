import { LoadoutFeedback } from "./LoadoutFeedback";
import { attunedAbilitiesAtom, attunedStancesAtom } from "../hud/atoms";
import { useAtomValue } from "jotai";
import {
  RITE_DATABASE,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  type RiteDef,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  equippedRitesAtom,
  globalMasteryAtom,
  knownRitesAtom,
  runesEquippedAtom,
} from "../hud/atoms";
import { GameIcon } from "./GameIcon";
import { riteIconSource } from "./conceptIcons";
import { AttunementBudget } from "./AttunementBudget";
import "./buildPanel.css";

export function RitesPanelContent() {
  const abilities = useAtomValue(attunedAbilitiesAtom);
  const stances = useAtomValue(attunedStancesAtom);
  const known = useAtomValue(knownRitesAtom);
  const equipped = useAtomValue(equippedRitesAtom);
  const rules = useAtomValue(runesEquippedAtom);
  const budget = runeBudgetForGlobalMastery(useAtomValue(globalMasteryAtom));

  const candidates = known
    .map((id) => RITE_DATABASE.get(id))
    .filter((rite): rite is RiteDef => !!rite);

  function toggle(riteId: string): void {
    const next = equipped.includes(riteId)
      ? equipped.filter((id) => id !== riteId)
      : [...equipped, riteId];
    if (equipped.includes(riteId) || runicPointLoadoutCost({ rules, abilities, stances, rites: next }) <= budget) {
      hudBus.requestSetRiteLoadout(next);
    }
  }

  return (
    <div className="build-tab-body rite-circle">
      <LoadoutFeedback system="rites" />
      <AttunementBudget loadout={{ rules, abilities, stances, rites: equipped }} budget={budget} />
      <div className="rite-circle__header">
        <div>
          <span className="build-section-title">Ritual Circle</span>
          <p>Bind any learned rites the shared Runic Point pool can sustain.</p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="loadout-browser__empty">Learn rites in Crafting to inscribe this circle.</div>
      ) : (
        <div className="rite-glyph-grid">
          {candidates.map((rite) => {
            const selected = equipped.includes(rite.id);
            const proposed = selected ? equipped : [...equipped, rite.id];
            const unaffordable = !selected && runicPointLoadoutCost({ rules, abilities, stances, rites: proposed }) > budget;
            return (
              <button
                key={rite.id}
                type="button"
                className={`rite-glyph${selected ? " rite-glyph--bound" : ""}`}
                disabled={unaffordable}
                onClick={() => toggle(rite.id)}
                title={unaffordable ? "Not enough shared Runic Points" : rite.blurb}
              >
                <span className="rite-glyph__ring">
                  <GameIcon source={riteIconSource(rite.id)} size={46} fallback={rite.name.slice(0, 1)} decorative />
                </span>
                <span className="rite-glyph__copy">
                  <strong>{rite.name}</strong>
                  <small>{rite.blurb}</small>
                </span>
                <span className="rite-glyph__cost">{rite.runeCost} RP</span>
                <span className="rite-glyph__seal">{selected ? "BOUND" : unaffordable ? "DORMANT" : "INVOKE"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
