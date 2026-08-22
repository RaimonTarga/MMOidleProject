import { useAtomValue } from "jotai";
import {
  ABILITY_DATABASE,
  ABILITY_SLOTS,
  abilityDef,
  abilityDisplayName,
  abilityMaxRank,
  abilityRankNumber,
  equippedForSlot,
  type AbilityDef,
  type AbilitySlot,
  type EquippedAbilities,
} from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import {
  abilitySlotsAtom,
  equippedAbilitiesAtom,
  knownAbilitiesAtom,
  playerTierAtom,
} from "../hud/atoms";
import { LoadoutBrowser, type LoadoutSlot } from "./LoadoutBrowser";
import { abilityIconSource } from "./abilityIcons";
import "./buildPanel.css";

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

/** `technique:0` etc. — the slot kind plus its index in fire priority. */
function parseSlotKey(key: string): { slot: AbilitySlot; index: number } {
  const [slot, index] = key.split(":");
  return { slot: slot as AbilitySlot, index: Number(index) };
}

export function AbilitiesPanelContent() {
  const known = useAtomValue(knownAbilitiesAtom);
  const equipped = useAtomValue(equippedAbilitiesAtom);
  const slotCounts = useAtomValue(abilitySlotsAtom);
  const playerTier = useAtomValue(playerTierAtom);

  /**
   * An owned ability deepens one authored rank every time the player tiers up,
   * and it is the SAME entry throughout — so the rank has to ride the name here,
   * or a player who just advanced sees no acknowledgement that anything changed.
   * Abilities that have run out of authored ranks say so rather than implying a
   * next one is coming.
   */
  function rankedBlurb(ability: AbilityDef): string {
    const rank = abilityRankNumber(ability, playerTier);
    const max = abilityMaxRank(ability);
    const note = rank >= max
      ? "At its deepest authored rank."
      : `Deepens again at tier ${ability.tier + rank}.`;
    return `${ability.blurb} ${note}`;
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

  const slots: LoadoutSlot[] = ABILITY_SLOTS.flatMap((slot) =>
    Array.from({ length: slotCounts[slot] }, (_, index) => {
      const total = slotCounts[slot];
      return {
        key: `${slot}:${index}`,
        label: total > 1 ? `${SLOT_META[slot].label} ${index + 1}` : SLOT_META[slot].label,
        hint: slotHint(slot, index, total),
        currentId: equippedForSlot(equipped, slot)[index] ?? null,
      };
    }),
  );

  function candidatesFor(key: string) {
    const { slot, index } = parseSlotKey(key);
    // The server rejects the same ability in two slots of one kind, so an
    // ability already placed elsewhere is offered but explained, not hidden —
    // hiding it reads as "I never learned this".
    const takenElsewhere = new Set(
      equippedForSlot(equipped, slot).filter((_, i) => i !== index),
    );
    return known
      .map((id) => ABILITY_DATABASE.get(id))
      .filter((ability): ability is AbilityDef => !!ability && ability.slot === slot)
      .map((ability) => ({
        id: ability.id,
        name: abilityDisplayName(ability, playerTier),
        blurb: rankedBlurb(ability),
        icon: abilityIconSource(ability),
        disabledReason: takenElsewhere.has(ability.id)
          ? "Already in another slot of this kind"
          : undefined,
      }));
  }

  return (
    <LoadoutBrowser
      label="Ability slots"
      iconKind="ability"
      slots={slots}
      candidatesFor={candidatesFor}
      nameOf={(id) => {
        const ability = abilityDef(id);
        return ability ? abilityDisplayName(ability, playerTier) : null;
      }}
      blurbOf={(id) => {
        const ability = abilityDef(id);
        return ability ? rankedBlurb(ability) : "";
      }}
      iconOf={(id) => {
        const ability = abilityDef(id);
        return ability ? abilityIconSource(ability) : undefined;
      }}
      onEquip={(key, id) => {
        const { slot, index } = parseSlotKey(key);
        setSlot(slot, index, id);
      }}
      emptyCandidates="Learn abilities in Crafting → Craft to fill this slot."
    />
  );
}
