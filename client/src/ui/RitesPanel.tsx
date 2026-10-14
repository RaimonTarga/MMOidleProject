import { LoadoutFeedback } from "./LoadoutFeedback";
import { useAtomValue } from "jotai";
import {
  RITE_DATABASE,
  type RiteDef,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  equippedRitesAtom,
  knownRitesAtom,
} from "../hud/atoms";
import { GameIcon } from "./GameIcon";
import { riteIconSource } from "./conceptIcons";
import "./buildPanel.css";

export function RitesPanelContent() {
  const known = useAtomValue(knownRitesAtom);
  const equipped = useAtomValue(equippedRitesAtom);

  const candidates = known
    .map((id) => RITE_DATABASE.get(id))
    .filter((rite): rite is RiteDef => !!rite);

  function toggle(riteId: string): void {
    const next = equipped.includes(riteId)
      ? equipped.filter((id) => id !== riteId)
      : [...equipped, riteId];
    hudBus.requestSetRiteLoadout(next);
  }

  return (
    <div className="build-tab-body rite-circle">
      <LoadoutFeedback system="rites" />
      <div className="rite-circle__header">
        <div>
          <span className="build-section-title">Ritual Circle</span>
          <p>Bind any learned rites.</p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="loadout-browser__empty">Learn rites in Crafting to inscribe this circle.</div>
      ) : (
        <div className="rite-glyph-grid">
          {candidates.map((rite) => {
            const selected = equipped.includes(rite.id);
            return (
              <button
                key={rite.id}
                type="button"
                className={`rite-glyph${selected ? " rite-glyph--bound" : ""}`}
                onClick={() => toggle(rite.id)}
                title={rite.blurb}
              >
                <span className="rite-glyph__ring">
                  <GameIcon source={riteIconSource(rite.id)} size={46} fallback={rite.name.slice(0, 1)} decorative />
                </span>
                <span className="rite-glyph__copy">
                  <strong>{rite.name}</strong>
                  <small>{rite.blurb}</small>
                </span>
                <span className="rite-glyph__seal">{selected ? "BOUND" : "INVOKE"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
