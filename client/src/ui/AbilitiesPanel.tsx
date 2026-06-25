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

interface Props {
  onClose: () => void;
}

const SLOTS: { slot: AbilitySlot; label: string; hint: string }[] = [
  { slot: "technique", label: "Technique", hint: "Offensive — arms your next attack." },
  { slot: "guard", label: "Guard", hint: "Defensive — an immediate self-reaction." },
];

export function AbilitiesPanel({ onClose }: Props) {
  const known = useAtomValue(knownAbilitiesAtom);
  const equipped = useAtomValue(equippedAbilitiesAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);

  const knownSet = new Set(known);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function knownForSlot(slot: AbilitySlot): AbilityDef[] {
    return known
      .map((id) => ABILITY_DATABASE.get(id))
      .filter((a): a is AbilityDef => !!a && a.slot === slot);
  }

  const recipes = [...ABILITY_RECIPE_DATABASE.values()];

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 640, position: "relative" }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Abilities</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div
          className="skill-tree-body"
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Equipped slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SLOTS.map(({ slot, label, hint }) => {
              const options = knownForSlot(slot);
              const current = equipped[slot];
              return (
                <div key={slot} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, minWidth: 90 }}>{label}</span>
                    <select
                      value={current ?? ""}
                      onChange={(e) =>
                        hudBus.requestSetAbilityLoadout(slot, e.target.value || null)
                      }
                      style={{ flex: 1 }}
                    >
                      <option value="">— empty —</option>
                      {options.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: 12, color: "#8a8aa8" }}>
                    {current ? abilityDef(current)?.blurb ?? hint : hint}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Learn (craft) */}
          <div>
            <div className="panel-title" style={{ marginBottom: 8 }}>
              Learn Abilities
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "6px 8px",
                      border: "1px solid #2a2a44",
                      borderRadius: 6,
                      opacity: learned ? 0.55 : 1,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 600 }}>
                        {ability.name}{" "}
                        <span style={{ fontSize: 11, color: "#8a8aa8" }}>
                          ({ability.slot})
                        </span>
                      </span>
                      <span style={{ fontSize: 12, color: "#8a8aa8" }}>
                        {ability.blurb}
                      </span>
                      <span style={{ fontSize: 11, color: "#6f6f90" }}>{costText}</span>
                    </div>
                    <button
                      className="auto-btn"
                      disabled={!canLearn}
                      title={reason}
                      onClick={() => hudBus.requestCraftAbilityRecipe(recipe.id)}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {learned ? "Learned" : "Learn"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
