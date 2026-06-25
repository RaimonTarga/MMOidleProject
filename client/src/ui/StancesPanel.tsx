import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import {
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  ESSENCE_LABELS,
  stanceDef,
  catalystLabel,
  isStanceRecipeUnlocked,
  type StanceDef,
  type StanceSlot,
  type EssenceType,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  activeStanceAtom,
  biomeLevelAtom,
  bossesClearedAtom,
  catalystsAtom,
  equippedStancesAtom,
  essencesAtom,
  knownStancesAtom,
} from "../hud/atoms";

interface Props {
  onClose: () => void;
}

const SLOTS: { slot: StanceSlot; label: string; hint: string }[] = [
  { slot: "default", label: "Default", hint: "Your baseline posture — always active." },
  {
    slot: "reactive",
    label: "Reactive",
    hint: "Auto-switched to by a Switch Stance rune while its situation holds.",
  },
];

export function StancesPanel({ onClose }: Props) {
  const known = useAtomValue(knownStancesAtom);
  const equipped = useAtomValue(equippedStancesAtom);
  const active = useAtomValue(activeStanceAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);

  const knownSet = new Set(known);
  const stanceOptions: StanceDef[] = known
    .map((id) => STANCE_DATABASE.get(id))
    .filter((s): s is StanceDef => !!s);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const recipes = [...STANCE_RECIPE_DATABASE.values()];

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 640, position: "relative" }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Stances</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div
          className="skill-tree-body"
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Active posture */}
          <div style={{ fontSize: 13, color: "#a8a8c8" }}>
            Active posture:{" "}
            <span style={{ fontWeight: 600, color: "#d8d8f0" }}>
              {active ? stanceDef(active)?.name ?? active : "None"}
            </span>
          </div>

          {/* Equipped slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SLOTS.map(({ slot, label, hint }) => {
              const current = equipped[slot];
              const isActive = current !== null && current === active;
              return (
                <div key={slot} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, minWidth: 90 }}>
                      {label}
                      {isActive ? " ●" : ""}
                    </span>
                    <select
                      value={current ?? ""}
                      onChange={(e) =>
                        hudBus.requestSetStanceLoadout(slot, e.target.value || null)
                      }
                      style={{ flex: 1 }}
                    >
                      <option value="">— empty —</option>
                      {stanceOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span style={{ fontSize: 12, color: "#8a8aa8" }}>
                    {current ? stanceDef(current)?.blurb ?? hint : hint}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Learn (craft) */}
          <div>
            <div className="panel-title" style={{ marginBottom: 8 }}>
              Learn Stances
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recipes.map((recipe) => {
                const stance = STANCE_DATABASE.get(recipe.stanceId);
                if (!stance) return null;
                const learned = knownSet.has(recipe.stanceId);
                const unlocked = isStanceRecipeUnlocked(recipe, {
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
                      <span style={{ fontWeight: 600 }}>{stance.name}</span>
                      <span style={{ fontSize: 12, color: "#8a8aa8" }}>{stance.blurb}</span>
                      <span style={{ fontSize: 11, color: "#6f6f90" }}>{costText}</span>
                    </div>
                    <button
                      className="auto-btn"
                      disabled={!canLearn}
                      title={reason}
                      onClick={() => hudBus.requestCraftStanceRecipe(recipe.id)}
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
