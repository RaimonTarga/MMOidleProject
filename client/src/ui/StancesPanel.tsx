import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import {
  ESSENCE_LABELS,
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  catalystLabel,
  isStanceRecipeUnlocked,
  stanceDef,
  type EssenceType,
  type StanceDef,
  type StanceSlot,
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
import { BuildIcon } from "./BuildIcon";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
}

const SLOTS: { slot: StanceSlot; label: string; hint: string }[] = [
  { slot: "default", label: "Default", hint: "Your baseline combat posture." },
  { slot: "reactive", label: "Reactive", hint: "Used by Switch Stance rune rules." },
];

export function StancesPanelContent() {
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
  const recipes = [...STANCE_RECIPE_DATABASE.values()];

  return (
    <div className="build-tab-body">
      <div className="build-loadout-list">
        {SLOTS.map(({ slot, label, hint }) => {
          const current = equipped[slot];
          const currentDef = stanceDef(current);
          const isActive = current !== null && current === active;
          return (
            <div key={slot} className="build-loadout-row">
              <BuildIcon kind="stance" label={currentDef?.name ?? label} muted={!currentDef} />
              <div className="build-loadout-row__main">
                <div className="build-field-label">
                  {label}
                  {isActive && <span className="build-active-chip">Active</span>}
                </div>
                <div className="build-loadout-row__hint">{hint}</div>
              </div>
              <div>
                <select
                  className="build-select"
                  value={current ?? ""}
                  onChange={(e) =>
                    hudBus.requestSetStanceLoadout(slot, e.target.value || null)
                  }
                >
                  <option value="">empty</option>
                  {stanceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="build-loadout-row__text">
                  {currentDef?.blurb ?? "No stance equipped in this slot."}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="build-section-title" style={{ marginBottom: 8 }}>
          Learn Stances
        </div>
        <div className="build-learn-list">
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
                className={`build-learn-card${learned ? " build-learn-card--owned" : ""}`}
              >
                <BuildIcon kind="stance" label={stance.name} />
                <div>
                  <div className="build-learn-card__name">{stance.name}</div>
                  <div className="build-learn-card__meta">{stance.blurb}</div>
                  <div className="build-learn-card__cost">{costText}</div>
                </div>
                <button
                  className="auto-btn"
                  disabled={!canLearn}
                  title={reason}
                  onClick={() => hudBus.requestCraftStanceRecipe(recipe.id)}
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

export function StancesPanel({ onClose }: Props) {
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 640, position: "relative" }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Stances</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="skill-tree-body">
          <StancesPanelContent />
        </div>
      </div>
    </div>,
    document.body,
  );
}
