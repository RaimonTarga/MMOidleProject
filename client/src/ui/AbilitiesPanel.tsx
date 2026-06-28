import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ESSENCE_LABELS,
  abilityDef,
  catalystLabel,
  isAbilityRecipeUnlocked,
  type AbilityDef,
  type AbilitySlot,
  type EssenceType,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  biomeLevelAtom,
  bossesClearedAtom,
  catalystsAtom,
  equippedAbilitiesAtom,
  essencesAtom,
  knownAbilitiesAtom,
} from "../hud/atoms";
import { BuildIcon } from "./BuildIcon";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
}

const SLOTS: { slot: AbilitySlot; label: string; hint: string }[] = [
  { slot: "technique", label: "Technique", hint: "Offensive timing for your next attack." },
  { slot: "guard", label: "Guard", hint: "Defensive reaction for pressure moments." },
];

export function AbilitiesPanelContent() {
  const known = useAtomValue(knownAbilitiesAtom);
  const equipped = useAtomValue(equippedAbilitiesAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);

  const knownSet = new Set(known);

  function knownForSlot(slot: AbilitySlot): AbilityDef[] {
    return known
      .map((id) => ABILITY_DATABASE.get(id))
      .filter((a): a is AbilityDef => !!a && a.slot === slot);
  }

  const recipes = [...ABILITY_RECIPE_DATABASE.values()];

  return (
    <div className="build-tab-body">
      <div className="build-loadout-list">
        {SLOTS.map(({ slot, label, hint }) => {
          const options = knownForSlot(slot);
          const current = equipped[slot];
          const currentDef = abilityDef(current);
          return (
            <div key={slot} className="build-loadout-row">
              <BuildIcon kind="ability" label={currentDef?.name ?? label} muted={!currentDef} />
              <div className="build-loadout-row__main">
                <div className="build-field-label">{label}</div>
                <div className="build-loadout-row__hint">{hint}</div>
              </div>
              <div>
                <select
                  className="build-select"
                  value={current ?? ""}
                  onChange={(e) =>
                    hudBus.requestSetAbilityLoadout(slot, e.target.value || null)
                  }
                >
                  <option value="">empty</option>
                  {options.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="build-loadout-row__text">
                  {currentDef?.blurb ?? "No ability equipped in this slot."}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="build-section-title" style={{ marginBottom: 8 }}>
          Learn Abilities
        </div>
        <div className="build-learn-list">
          {recipes.map((recipe) => {
            const ability = ABILITY_DATABASE.get(recipe.abilityId);
            if (!ability) return null;
            const learned = knownSet.has(recipe.abilityId);
            const unlocked = isAbilityRecipeUnlocked(recipe, {
              biomeLevel,
              bossesCleared,
            });
            const essenceCost = Object.entries(recipe.cost) as [EssenceType, number][];
            const catalystCost = Object.entries(recipe.catalystCost ?? {}) as [
              string,
              number,
            ][];
            const affordable =
              essenceCost.every(([t, amt]) => (essences[t] ?? 0) >= amt) &&
              catalystCost.every(([g, amt]) => (catalysts[g] ?? 0) >= amt);
            const canLearn = !learned && unlocked && affordable;
            const reason = learned
              ? "Already learned"
              : !unlocked
                ? `Reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel}`
                : !affordable
                  ? "Not enough materials"
                  : "";
            const costText = [
              ...essenceCost.map(([t, amt]) => `${amt} ${ESSENCE_LABELS[t]}`),
              ...catalystCost.map(([g, amt]) => `${amt} ${catalystLabel(g)}`),
            ].join(", ");
            return (
              <div
                key={recipe.id}
                className={`build-learn-card${learned ? " build-learn-card--owned" : ""}`}
              >
                <BuildIcon kind="ability" label={ability.name} />
                <div>
                  <div className="build-learn-card__name">
                    {ability.name}{" "}
                    <span className="build-learn-card__meta">({ability.slot})</span>
                  </div>
                  <div className="build-learn-card__meta">{ability.blurb}</div>
                  <div className="build-learn-card__cost">{costText}</div>
                </div>
                <button
                  className="auto-btn"
                  disabled={!canLearn}
                  title={reason}
                  onClick={() => hudBus.requestCraftAbilityRecipe(recipe.id)}
                  style={{ width: "auto", whiteSpace: "nowrap" }}
                >
                  {learned ? "Learned" : "Learn"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AbilitiesPanel({ onClose }: Props) {
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 640, position: "relative" }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Abilities</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="skill-tree-body">
          <AbilitiesPanelContent />
        </div>
      </div>
    </div>,
    document.body,
  );
}
