import { LoadoutFeedback } from "./LoadoutFeedback";
import { useAtomValue } from "jotai";
import { STANCE_DATABASE, runeBudgetForGlobalMastery, runicPointLoadoutCost, type StanceDef } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  activeStanceAtom,
  attunedStancesAtom,
  attunedAbilitiesAtom,
  equippedRitesAtom,
  hpAtom,
  maxHpAtom,
  equippedStancesAtom,
  globalMasteryAtom,
  knownStancesAtom,
  runesEquippedAtom,
} from "../hud/atoms";
import { stanceIconSource } from "./conceptIcons";
import { CrestDiamond } from "../hud/primitives";
import { DetailLines } from "./describe/DetailLines";
import { stanceLines } from "./describe";
import { AttunementBudget } from "./AttunementBudget";
import "./buildPanel.css";
import "./attunementPanel.css";

export function StancesPanelContent() {
  const stances = useAtomValue(attunedStancesAtom);
  const abilities = useAtomValue(attunedAbilitiesAtom);
  const known = useAtomValue(knownStancesAtom);
  const equipped = useAtomValue(equippedStancesAtom);
  const active = useAtomValue(activeStanceAtom);
  // Gated postures (Perfection) report whether their bonuses are live RIGHT NOW, not
  // just what the threshold is, so the sanctum answers "is this doing anything?".
  const hpFraction = useAtomValue(hpAtom) / Math.max(1, useAtomValue(maxHpAtom));
  const rules = useAtomValue(runesEquippedAtom);
  const rites = useAtomValue(equippedRitesAtom);
  const budget = runeBudgetForGlobalMastery(useAtomValue(globalMasteryAtom));

  const candidates = known
    .map((id) => STANCE_DATABASE.get(id))
    .filter((stance): stance is StanceDef => !!stance)
    .sort((a, b) => Number(stances.includes(b.id)) - Number(stances.includes(a.id)));

  return (
    <div className="build-tab-body attunement-panel stance-sanctum">
      <LoadoutFeedback system="stances" />
      <AttunementBudget loadout={{ rules, rites, abilities, stances }} budget={budget} />
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
            const nextRules = rules.filter(r => r.actionId !== "switch-stance" || r.targetStanceId !== stance.id || !attuned);
            const nextCost = runicPointLoadoutCost({ rules: nextRules, rites, abilities, stances: next });
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
                  <span className="attunement-price" title="Reserved once while attuned; choosing a default or switching adds no stance cost.">{stance.runeCost} RP</span>
                </div>
                <p className="stance-entry__blurb">{stance.blurb}</p>
                <DetailLines className="stance-entry__effects" lines={stanceLines(stance, isActive ? hpFraction : undefined).filter(line => line.key !== `stance:${stance.id}:rp`)} />
                <div className="stance-entry__controls">
                  <button type="button" className="attunement-button" aria-pressed={attuned} aria-label={`${attuned ? "Unattune" : "Attune"} ${stance.name}`} disabled={!attuned && nextCost > budget} title={`${nextCost} / ${budget} RP after this change${attuned ? ". Clears this stance's rules and default selection." : ""}`} onClick={() => hudBus.requestSetStanceLoadout("default", isDefault && attuned ? null : equipped.default, next)}>{attuned ? "Unattune" : "Attune"}</button>
                  {attuned && <button type="button" className="attunement-button attunement-button--default" aria-pressed={isDefault} title={isDefault ? "Clear default stance" : "Use this stance when no Rune switches your stance"} aria-label={`${isDefault ? "Clear default" : "Set default"}: ${stance.name}`} onClick={() => hudBus.requestSetStanceLoadout("default", isDefault ? null : stance.id)}>{isDefault ? "◆ Default" : "◇ Make default"}</button>}
                  <span className={nextCost > budget && !attuned ? "attunement-over" : "attunement-muted"}>{!attuned && nextCost > budget ? `Needs ${nextCost - budget} more RP` : `→ ${nextCost} / ${budget} RP`}</span>
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
