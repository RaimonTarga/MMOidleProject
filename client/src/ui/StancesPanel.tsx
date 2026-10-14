import { LoadoutFeedback } from "./LoadoutFeedback";
import { useAtomValue } from "jotai";
import { STANCE_DATABASE, type StanceDef } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  activeStanceAtom,
  attunedStancesAtom,
  hpAtom,
  maxHpAtom,
  equippedStancesAtom,
  knownStancesAtom,
} from "../hud/atoms";
import { stanceIconSource } from "./conceptIcons";
import { CrestDiamond } from "../hud/primitives";
import { DetailLines } from "./describe/DetailLines";
import { stanceLines } from "./describe";
import "./buildPanel.css";
import "./attunementPanel.css";

export function StancesPanelContent() {
  const stances = useAtomValue(attunedStancesAtom);
  const known = useAtomValue(knownStancesAtom);
  const equipped = useAtomValue(equippedStancesAtom);
  const active = useAtomValue(activeStanceAtom);
  // Gated postures (Perfection) report whether their bonuses are live RIGHT NOW, not
  // just what the threshold is, so the sanctum answers "is this doing anything?".
  const hpFraction = useAtomValue(hpAtom) / Math.max(1, useAtomValue(maxHpAtom));

  const candidates = known
    .map((id) => STANCE_DATABASE.get(id))
    .filter((stance): stance is StanceDef => !!stance)
    .sort((a, b) => Number(stances.includes(b.id)) - Number(stances.includes(a.id)));

  return (
    <div className="build-tab-body attunement-panel stance-sanctum">
      <LoadoutFeedback system="stances" />
      <div className="attunement-intro">
        <div><h3>Resting posture <span>{stances.length} attuned</span></h3>
          <p><strong>{STANCE_DATABASE.get(equipped.default ?? "")?.name ?? "No default stance"}</strong> · Your default when no Rune switches your stance.</p></div>
      </div>

      {candidates.length === 0 ? (
        <div className="loadout-browser__empty">Learn stances in Crafting to awaken this sanctum.</div>
      ) : (
        <div className="stance-collection" role="list" aria-label="Learned stances">
          {candidates.map((stance) => {
            const attuned = stances.includes(stance.id);
            const next = attuned ? stances.filter(id => id !== stance.id) : [...stances, stance.id];
            const isDefault = equipped.default === stance.id;
            const isActive = active === stance.id;
            return (
              <article
                key={stance.id}
                role="listitem"
                className={`stance-entry${attuned ? " is-attuned" : ""}${isDefault ? " is-default" : ""}${isActive ? " is-active" : ""}`}
              >
                <div className="stance-entry__heading">
                  <CrestDiamond className="stance-entry__crest" icon={stanceIconSource(stance.id)} size={64} art={36} fallback={stance.name.slice(0, 1)} />
                  <div className="stance-entry__copy">
                    <h4>{stance.name}</h4>
                    <div className="stance-entry__states">
                      {attuned ? <span className="attunement-seal">✓ Attuned</span> : <span>Learned</span>}
                      {isDefault && <span className="attunement-default-seal">◆ Default</span>}
                      {isActive && <span className="attunement-active-seal">● Active now</span>}
                    </div>
                  </div>
                </div>
                <p className="stance-entry__blurb">{stance.blurb}</p>
                <DetailLines className="stance-entry__effects" lines={stanceLines(stance, isActive ? hpFraction : undefined).filter(line => line.key !== `stance:${stance.id}:rp`)} />
                <div className="stance-entry__controls">
                  <button type="button" className="attunement-button" aria-pressed={attuned} aria-label={`${attuned ? "Unattune" : "Attune"} ${stance.name}`} title={attuned ? "Clears this stance's rules and default selection." : undefined} onClick={() => hudBus.requestSetStanceLoadout("default", isDefault && attuned ? null : equipped.default, next)}>{attuned ? "Unattune" : "Attune"}</button>
                  {attuned && <button type="button" className="attunement-button attunement-button--default" aria-pressed={isDefault} title={isDefault ? "Clear default stance" : "Use this stance when no Rune switches your stance"} aria-label={`${isDefault ? "Clear default" : "Set default"}: ${stance.name}`} onClick={() => hudBus.requestSetStanceLoadout("default", isDefault ? null : stance.id)}>{isDefault ? "◆ Default" : "◇ Make default"}</button>}
                </div>
                {attuned && <p className="attunement-note">Unattuning clears its Rune rules{isDefault ? " and default selection" : ""}.</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
