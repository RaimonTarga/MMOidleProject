import { useAtomValue } from "jotai";
import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  ABILITY_DATABASE,
  ABILITY_IMBUE_EFFECT_ID,
  ABILITY_SIDESTEP_EFFECT_ID,
  abilityDisplayName,
  abilityLineageLine,
  abilityNodeNameParts,
  guardEffectIdForAbility,
  recoveryEffectIdForAbility,
  type AbilityDef,
  type AbilityNameForm,
  type AbilityNodeProgressMap,
} from "@mmo-idle/shared";
import { abilityNodesAtom, playerTierAtom } from "../hud/atoms";

/**
 * An ability's name for one character, through the ONE entry point
 * (`abilityDisplayName`, design §22.7) with the words that character's node rows
 * lend it. Every client surface that names an ability reads this — the hotbar,
 * the Abilities panel, the tooltips, the buff bar, the cast callout, the Behavior
 * panel and the tutorial's lines — so a keystone renames it everywhere at once.
 */
export function abilityNameFor(
  ability: AbilityDef,
  playerTier: number,
  nodes: AbilityNodeProgressMap | undefined,
  form: AbilityNameForm = "full",
): string {
  return abilityDisplayName(ability, playerTier, abilityNodeNameParts(ability.id, nodes?.[ability.id]), form);
}

/** The lineage line under a renamed ability ("Sweep" beneath *Whirlwind*), or undefined. */
export function abilityLineageFor(
  ability: AbilityDef,
  nodes: AbilityNodeProgressMap | undefined,
): string | undefined {
  return abilityLineageLine(ability, abilityNodeNameParts(ability.id, nodes?.[ability.id]));
}

/** The own character's name for an ability, kept current with its rows and tier. */
export function useAbilityName(ability: AbilityDef, form: AbilityNameForm = "full"): string {
  const tier = useAtomValue(playerTierAtom);
  const nodes = useAtomValue(abilityNodesAtom);
  return abilityNameFor(ability, tier, nodes, form);
}

/**
 * The buff tiles an ability owns — a Guard's damage window, a Recovery window,
 * Bramble's thorns, Sidestep's window, Imbue's charges, Break Free's resistance —
 * keyed by tile id, so the buff bar names the tile after the ability as it is now
 * called. Derived from the shared effect-id helpers, never a second list of ids.
 */
const BUFF_OWNER: Map<string, string> = (() => {
  const owners = new Map<string, string>([
    ["ability-bramble", "bramble-guard"],
    [ABILITY_SIDESTEP_EFFECT_ID, "sidestep"],
    [ABILITY_IMBUE_EFFECT_ID, "imbue-lightning"],
    [ABILITY_CONTROL_RESIST_EFFECT_ID, "break-free"],
  ]);
  for (const id of ABILITY_DATABASE.keys()) {
    const guard = guardEffectIdForAbility(id);
    if (guard) owners.set(guard, id);
    const recovery = recoveryEffectIdForAbility(id);
    if (recovery) owners.set(recovery, id);
  }
  return owners;
})();

/** The ability that owns a buff tile, or undefined for every other status. */
export function abilityForBuff(buffId: string): AbilityDef | undefined {
  const id = BUFF_OWNER.get(buffId);
  return id ? ABILITY_DATABASE.get(id) : undefined;
}
