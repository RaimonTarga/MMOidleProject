import { useId, useState } from "react";
import { LoadoutFeedback } from "./LoadoutFeedback";
import { useAtomValue } from "jotai";
import { ABILITY_DATABASE, CONDITION_DATABASE, TUTORIAL_ANCHORS, abilityBlurbAt, attunedAbilityIds, attunedForFamily, referenceAbilityRule } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import { attunedAbilitiesAtom, knownAbilitiesAtom, playerTierAtom, runesEquippedAtom, passivesAtom, attackAtom, maxHpAtom, attackRangeAtom, combatArchetypeAtom } from "../hud/atoms";
import { abilityTiming } from "./describe/abilityTiming";
import { describeAbility } from "./describe/abilityText";
import { AbilityDetails } from "./AbilityDetails";
import { GameIcon } from "./GameIcon";
import { abilityIconSource } from "./abilityIcons";
import { abilityNameFor } from "./abilityName";
import "./buildPanel.css";
import "./attunementPanel.css";

export function AbilitiesPanelContent() {
  const known = useAtomValue(knownAbilitiesAtom);
  const abilities = useAtomValue(attunedAbilitiesAtom);
  const rules = useAtomValue(runesEquippedAtom);
  const tier = useAtomValue(playerTierAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const context = { playerTier: tier, passives: useAtomValue(passivesAtom), combatArchetype, attack: useAtomValue(attackAtom), maxHp: useAtomValue(maxHpAtom), attackRange: useAtomValue(attackRangeAtom) };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelId = useId();
  const attuned = attunedAbilityIds(abilities);
  // One learned collection; family ordering remains an execution detail.
  const candidates = [...new Set([...attuned, ...known])].filter(id => ABILITY_DATABASE.has(id));
  return <div className="build-tab-body attunement-panel">
    <LoadoutFeedback system="abilities" />
    <div className="attunement-intro">
      <div><h3>Your abilities <span>{attuned.length} attuned · {candidates.length} learned</span></h3>
        <p>Attune abilities to use them automatically. Select one to inspect its numbers.</p></div>
      <span className="attunement-tier">Tier {tier}</span>
    </div>
    {candidates.length === 0 && <div className="loadout-browser__empty">Learn abilities in Crafting to begin your attunement.</div>}
    <div className="ability-collection">
      {candidates.map(id => {
        const ability = ABILITY_DATABASE.get(id)!;
        const list = attunedForFamily(abilities, ability.slot);
        const isAttuned = list.includes(id);
        const selected = selectedId === id;
        const key = ability.slot === "technique" ? "techniques" : "guards";
        const next = { ...abilities, [key]: isAttuned ? list.filter(a => a !== id) : [...list, id] };
        const timing = abilityTiming(ability, abilities, rules);
        const described = describeAbility(ability, context);
        // The whole name (design §22.10), through the one entry point.
        const name = abilityNameFor(ability, tier);
        // One-click wiring that reproduces the timing abilities had before they
        // lost their built-in triggers. Only attuned abilities can be named by a rule.
        const defaultRule = isAttuned && timing.overrides.length === 0 ? referenceAbilityRule(id) : undefined;
        const defaultRuleName = defaultRule ? CONDITION_DATABASE.get(defaultRule.conditionId)?.name ?? defaultRule.conditionId : "";
        return <article key={id} className={`ability-entry${isAttuned ? " is-attuned" : ""}${selected ? " is-selected" : ""}`}>
          <div className="ability-entry__top">
            <button type="button" className="ability-entry__select" aria-expanded={selected} aria-controls={`${panelId}-${id}`} aria-label={`${selected ? "Hide" : "Show"} ${name} details`} onClick={() => setSelectedId(selected ? null : id)}>
              <span className="ability-entry__icon"><GameIcon source={abilityIconSource(ability)} size={40} decorative /></span>
              <span className="ability-entry__copy">
                <span className="ability-entry__name">{name}</span>
                <span className="ability-entry__blurb">{abilityBlurbAt(ability, tier)}</span>
              </span>
              <span className="ability-entry__disclosure">{selected ? "Less" : "Details"} <span aria-hidden="true">{selected ? "−" : "+"}</span></span>
            </button>
            <div className="attunement-control">
              <button type="button" className="attunement-button" data-tutorial-anchor={TUTORIAL_ANCHORS.abilityAttune(id)} aria-pressed={isAttuned} aria-label={`${isAttuned ? "Unattune" : "Attune"} ${name}`} title={isAttuned && timing.overrides.length ? "Also removes this ability's Rune rules." : undefined} onClick={() => hudBus.requestSetAbilityLoadout(next)}>{isAttuned ? "Unattune" : "Attune"}</button>
            </div>
          </div>
          <div className="ability-entry__behavior"><span>Timing</span>{" "}
            {timing.overrides.length > 0
              ? <>Fired by {timing.overrides.map((rule, i) => <span key={i} className="attunement-rune-seal">{CONDITION_DATABASE.get(rule.conditionId)?.name ?? rule.conditionId} → Use Ability</span>)}</>
              : defaultRule
                ? <>No Rune fires it.{" "}
                  <button type="button" className="attunement-button attunement-button--quiet ability-entry__default-rule" data-tutorial-anchor={TUTORIAL_ANCHORS.abilityTiming(id)}
                    title={`Adds "${defaultRuleName} → Use Ability" to your Runes`}
                    onClick={() => hudBus.requestSetRuneLoadout([...rules, defaultRule])}>
                    Use default timing: {defaultRuleName}
                  </button></>
                : timing.overrideText}
          </div>
          {selected && <div className="ability-entry__details" id={`${panelId}-${id}`}>
            <div className="ability-entry__detail-heading"><strong>{described.rankLabel}</strong><span>Tier {tier} · current bonuses included</span></div>
            <AbilityDetails description={described} />
            <p className="ability-entry__shape">{described.shape}</p>
            {isAttuned && timing.overrides.length > 0 && <div className="ability-entry__footer">
              <span>Unattuning removes this ability’s Rune rules</span>
            </div>}
            {isAttuned && <p className="attunement-note">Fires automatically only through Use Ability rules, in Rune priority order.</p>}
          </div>}
        </article>;
      })}
    </div>
  </div>;
}
