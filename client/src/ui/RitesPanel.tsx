import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import {
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  ESSENCE_LABELS,
  riteDef,
  catalystLabel,
  isRiteRecipeUnlocked,
  type RiteDef,
  type EssenceType,
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

interface Props {
  onClose: () => void;
}

export function RitesPanel({ onClose }: Props) {
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

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  /** Replace slot `index` with `riteId` (or clear it), then send the full list. */
  function setSlot(index: number, riteId: string | null): void {
    const next = [...equipped];
    if (riteId === null) {
      next.splice(index, 1);
    } else {
      next[index] = riteId;
    }
    // Drop empties/dupes; server caps to slot count and re-validates.
    const cleaned = [...new Set(next.filter((id): id is string => !!id))];
    hudBus.requestSetRiteLoadout(cleaned);
  }

  const recipes = [...RITE_RECIPE_DATABASE.values()];

  return createPortal(
    <div className="skill-tree-overlay" onClick={handleOverlayClick}>
      <div className="skill-tree-panel" style={{ maxWidth: 640, position: "relative" }}>
        <div className="skill-tree-header">
          <span className="skill-tree-title">Rites</span>
          <button className="skill-tree-close" onClick={onClose}>
            x
          </button>
        </div>

        <div
          className="skill-tree-body"
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div style={{ fontSize: 13, color: "#a8a8c8" }}>
            Rites are always-on between-fight behaviors. Equip up to{" "}
            <span style={{ fontWeight: 600, color: "#d8d8f0" }}>{slots}</span>.
          </div>

          {/* Equipped slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: slots }).map((_, i) => {
              const current = equipped[i] ?? "";
              // Hide rites already equipped in other slots from this dropdown.
              const usedElsewhere = new Set(
                equipped.filter((_id, j) => j !== i),
              );
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, minWidth: 90 }}>Slot {i + 1}</span>
                    <select
                      value={current}
                      onChange={(e) => setSlot(i, e.target.value || null)}
                      style={{ flex: 1 }}
                    >
                      <option value="">— empty —</option>
                      {riteOptions
                        .filter((r) => r.id === current || !usedElsewhere.has(r.id))
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <span style={{ fontSize: 12, color: "#8a8aa8" }}>
                    {current ? riteDef(current)?.blurb ?? "" : "Empty rite slot."}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Learn (craft) */}
          <div>
            <div className="panel-title" style={{ marginBottom: 8 }}>
              Learn Rites
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                      <span style={{ fontWeight: 600 }}>{rite.name}</span>
                      <span style={{ fontSize: 12, color: "#8a8aa8" }}>{rite.blurb}</span>
                      <span style={{ fontSize: 11, color: "#6f6f90" }}>{costText}</span>
                    </div>
                    <button
                      className="auto-btn"
                      disabled={!canLearn}
                      title={reason}
                      onClick={() => hudBus.requestCraftRiteRecipe(recipe.id)}
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
