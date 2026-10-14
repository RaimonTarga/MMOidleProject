import { useAtomValue } from "jotai";
import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  ABILITY_DATABASE,
  ABILITY_IMBUE_EFFECT_ID,
  ABILITY_SIDESTEP_EFFECT_ID,
  abilityDisplayName,
  guardEffectIdForAbility,
  recoveryEffectIdForAbility,
  type AbilityDef,
  type AbilityNameForm,
} from "@mmo-idle/shared";
import { playerTierAtom } from "../hud/atoms";

/**
 * An ability's name for one character, through the ONE entry point
 * (`abilityDisplayName`, design §22.7). Every client surface that names an
 * ability reads this — the tooltips, the buff bar, the cast callout and the
 * Behavior panel.
 */
export function abilityNameFor(
  ability: AbilityDef,
  playerTier: number,
  form: AbilityNameForm = "full",
): string {
  return abilityDisplayName(ability, playerTier, form);
}

/** The own character's name for an ability, kept current with its tier. */
export function useAbilityName(ability: AbilityDef, form: AbilityNameForm = "full"): string {
  const tier = useAtomValue(playerTierAtom);
  return abilityNameFor(ability, tier, form);
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
