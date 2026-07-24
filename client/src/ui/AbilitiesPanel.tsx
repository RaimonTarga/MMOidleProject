import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ABILITY_SLOTS,
  ESSENCE_LABELS,
  abilityDef,
  catalystLabel,
  equippedForSlot,
  isAbilityRecipeUnlocked,
  type AbilityDef,
  type AbilitySlot,
  type EquippedAbilities,
  type EssenceType,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  abilitySlotsAtom,
  biomeLevelAtom,
  bossesClearedAtom,
  catalystsAtom,
  equippedAbilitiesAtom,
  essencesAtom,
  knownAbilitiesAtom,
} from "../hud/atoms";
import { BuildIcon } from "./BuildIcon";
import { abilityIconSource } from "./abilityIcons";
import "./buildPanel.css";

interface Props {
  onClose: () => void;
}

const SLOT_META: Record<AbilitySlot, { label: string; hint: string }> = {
  technique: { label: "Technique", hint: "Offensive timing for your next attack." },
  guard: { label: "Guard", hint: "Defensive reaction for pressure moments." },
};

/** Slot 2+ carries the priority hint — slot 1 alone has nothing to arbitrate with. */
function slotHint(slot: AbilitySlot, index: number, total: number): string {
  if (total < 2) return SLOT_META[slot].hint;
  return index === 0
    ? `${SLOT_META[slot].hint} Fires first when both are ready.`
    : `${SLOT_META[slot].hint} Fires only when the first is unavailable.`;
}

export function AbilitiesPanelContent() {
  const known = useAtomValue(knownAbilitiesAtom);
  const equipped = useAtomValue(equippedAbilitiesAtom);
  const slots = useAtomValue(abilitySlotsAtom);
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

  /**
   * Rebuild the WHOLE loadout for one slot index and send it — the server takes
   * the full loadout so equip/clear/reorder are one operation. Holes are dropped
   * rather than preserved: the list is dense and its order is fire priority.
   */
  function setSlot(slot: AbilitySlot, index: number, abilityId: string | null): void {
    const next: EquippedAbilities = {
      techniques: [...equipped.techniques],
      guards: [...equipped.guards],
    };
    const list = slot === "technique" ? next.techniques : next.guards;
    while (list.length <= index) list.push("");
    list[index] = abilityId ?? "";
    const dense = list.filter((id) => id !== "");
    if (slot === "technique") next.techniques = dense;
    else next.guards = dense;
    hudBus.requestSetAbilityLoadout(next);
  }

  const recipes = [...ABILITY_RECIPE_DATABASE.values()];

  const slotRows = ABILITY_SLOTS.flatMap((slot) =>
    Array.from({ length: slots[slot] }, (_, index) => ({ slot, index })),
  );

  return (
    <div className="build-tab-body">
      <div className="build-loadout-list">
        {slotRows.map(({ slot, index }) => {
          const total = slots[slot];
          const options = knownForSlot(slot);
          const current = equippedForSlot(equipped, slot)[index] ?? null;
          const currentDef = abilityDef(current);
          const label = total > 1
            ? `${SLOT_META[slot].label} ${index + 1}`
            : SLOT_META[slot].label;
          // An ability already in another slot of the same kind can't be picked
          // twice — the server rejects duplicates, so don't offer them.
          const takenElsewhere = new Set(
            equippedForSlot(equipped, slot).filter((_, i) => i !== index),
          );
          return (
            <div key={`${slot}-${index}`} className="build-loadout-row">
              <BuildIcon
                kind="ability"
                label={currentDef?.name ?? label}
                muted={!currentDef}
                icon={currentDef ? abilityIconSource(currentDef) : undefined}
              />
              <div className="build-loadout-row__main">
                <div className="build-field-label">{label}</div>
                <div className="build-loadout-row__hint">
                  {slotHint(slot, index, total)}
                </div>
              </div>
              <div>
                <select
                  className="build-select"
                  value={current ?? ""}
                  onChange={(e) => setSlot(slot, index, e.target.value || null)}
                >
                  <option value="">empty</option>
                  {options
                    .filter((a) => !takenElsewhere.has(a.id))
                    .map((a) => (
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
                <BuildIcon
                  kind="ability"
                  label={ability.name}
                  icon={abilityIconSource(ability)}
                />
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
