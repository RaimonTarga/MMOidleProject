import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import {
  ESSENCE_LABELS,
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  catalystLabel,
  isRiteRecipeUnlocked,
  riteDef,
  type EssenceType,
  type RiteDef,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  biomeLevelAtom,
  bossesClearedAtom,
  catalystsAtom,
  equippedRitesAtom,
  essencesAtom,
  knownRitesAtom,
  riteSlotsAtom,
} from "../hud/atoms";
import { BuildIcon } from "./BuildIcon";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
}

export function RitesPanelContent() {
  const known = useAtomValue(knownRitesAtom);
  const equipped = useAtomValue(equippedRitesAtom);
  const slots = useAtomValue(riteSlotsAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);

  const knownSet = new Set(known);
  const riteOptions: RiteDef[] = known
    .map((id) => RITE_DATABASE.get(id))
    .filter((r): r is RiteDef => !!r);
  const recipes = [...RITE_RECIPE_DATABASE.values()];

  function setSlot(index: number, riteId: string | null): void {
    const next = [...equipped];
    if (riteId === null) {
      next.splice(index, 1);
    } else {
      next[index] = riteId;
    }
    const cleaned = [...new Set(next.filter((id): id is string => !!id))];
    hudBus.requestSetRiteLoadout(cleaned);
  }

  return (
    <div className="build-tab-body">
      <div className="build-loadout-list">
        {Array.from({ length: slots }).map((_, i) => {
          const current = equipped[i] ?? "";
          const currentDef = riteDef(current);
          const usedElsewhere = new Set(equipped.filter((_id, j) => j !== i));
          return (
            <div key={i} className="build-loadout-row">
              <BuildIcon kind="rite" label={currentDef?.name ?? `Rite ${i + 1}`} muted={!currentDef} />
              <div className="build-loadout-row__main">
                <div className="build-field-label">Rite {i + 1}</div>
                <div className="build-loadout-row__hint">Always-on between-fight behavior.</div>
              </div>
              <div>
                <select
                  className="build-select"
                  value={current}
                  onChange={(e) => setSlot(i, e.target.value || null)}
                >
                  <option value="">empty</option>
                  {riteOptions
                    .filter((r) => r.id === current || !usedElsewhere.has(r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
                <div className="build-loadout-row__text">
                  {currentDef?.blurb ?? "Empty rite slot."}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="build-section-title" style={{ marginBottom: 8 }}>
          Learn Rites
        </div>
        <div className="build-learn-list">
          {recipes.map((recipe) => {
            const rite = RITE_DATABASE.get(recipe.riteId);
            if (!rite) return null;
            const learned = knownSet.has(recipe.riteId);
            const unlocked = isRiteRecipeUnlocked(recipe, {
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
                <BuildIcon kind="rite" label={rite.name} />
                <div>
                  <div className="build-learn-card__name">{rite.name}</div>
                  <div className="build-learn-card__meta">{rite.blurb}</div>
                  <div className="build-learn-card__cost">{costText}</div>
                </div>
                <button
                  className="auto-btn"
                  disabled={!canLearn}
                  title={reason}
                  onClick={() => hudBus.requestCraftRiteRecipe(recipe.id)}
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

export function RitesPanel({ onClose }: Props) {
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 640, position: "relative" }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Rites</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div className="skill-tree-body">
          <RitesPanelContent />
        </div>
      </div>
    </div>,
    document.body,
  );
}
