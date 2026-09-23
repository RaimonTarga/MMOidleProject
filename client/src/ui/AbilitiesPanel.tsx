import { useId, useState } from "react";
import { LoadoutFeedback } from "./LoadoutFeedback";
import { useAtomValue } from "jotai";
import { ABILITY_DATABASE, abilityBlurbAt, abilityDisplayName, attunedAbilityIds, attunedForFamily, runicPointLoadoutCost, runeBudgetForGlobalMastery } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import { attunedAbilitiesAtom, knownAbilitiesAtom, playerTierAtom, runesEquippedAtom, equippedRitesAtom, attunedStancesAtom, globalMasteryAtom, passivesAtom, attackAtom, maxHpAtom, attackRangeAtom, combatArchetypeAtom } from "../hud/atoms";
import { abilityTiming } from "./describe/abilityTiming";
import { describeAbility } from "./describe/abilityText";
import { AbilityDetails } from "./AbilityDetails";
import { AttunementBudget } from "./AttunementBudget";
import { GameIcon } from "./GameIcon";
import { abilityIconSource } from "./abilityIcons";
import "./buildPanel.css";
import "./attunementPanel.css";

export function AbilitiesPanelContent() {
  const known = useAtomValue(knownAbilitiesAtom);
  const abilities = useAtomValue(attunedAbilitiesAtom);
  const rules = useAtomValue(runesEquippedAtom);
  const rites = useAtomValue(equippedRitesAtom);
  const stances = useAtomValue(attunedStancesAtom);
  const tier = useAtomValue(playerTierAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const context = { playerTier: tier, passives: useAtomValue(passivesAtom), combatArchetype, attack: useAtomValue(attackAtom), maxHp: useAtomValue(maxHpAtom), attackRange: useAtomValue(attackRangeAtom) };
  const budget = runeBudgetForGlobalMastery(useAtomValue(globalMasteryAtom));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelId = useId();
  const attuned = attunedAbilityIds(abilities);
  // One learned collection; family ordering remains an execution detail.
  const candidates = [...new Set([...attuned, ...known])].filter(id => ABILITY_DATABASE.has(id));
  return <div className="build-tab-body attunement-panel">
    <LoadoutFeedback system="abilities" />
    <AttunementBudget loadout={{ rules, rites, abilities, stances }} budget={budget} />
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
        const nextRules = rules.filter(r => r.actionId !== "use-ability" || r.targetAbilityId !== id || !isAttuned);
        const nextSpent = runicPointLoadoutCost({ rules: nextRules, rites, stances, abilities: next });
        const timing = abilityTiming(ability, abilities, rules);
        const described = describeAbility(ability, context);
        const name = abilityDisplayName(ability, tier);
        const blocked = !isAttuned && nextSpent > budget;
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
              <span className="attunement-price">{ability.attunementCost} RP</span>
              <button type="button" className="attunement-button" aria-pressed={isAttuned} disabled={blocked} aria-label={`${isAttuned ? "Unattune" : "Attune"} ${ability.name}`} title={`${nextSpent} / ${budget} RP after this change${isAttuned && timing.overrides.length ? ". Also removes this ability's Rune rules." : ""}`} onClick={() => hudBus.requestSetAbilityLoadout(next)}>{isAttuned ? "Unattune" : "Attune"}</button>
            </div>
          </div>
          <div className="ability-entry__behavior"><span>Default</span> {timing.defaultBehavior}
            {!!timing.overrides.length && <span className="attunement-rune-seal">Rune override</span>}
          </div>
          {blocked && <p className="ability-entry__shortfall">Needs {nextSpent - budget} more available RP</p>}
          {selected && <div className="ability-entry__details" id={`${panelId}-${id}`}>
            <div className="ability-entry__detail-heading"><strong>{described.rankLabel}</strong><span>Tier {tier} · current bonuses included</span></div>
            <AbilityDetails description={described} />
            <p className="ability-entry__shape">{described.shape}</p>
            {timing.overrideText && <p className="ability-entry__override">{timing.overrideText}</p>}
            <div className="ability-entry__footer">
              <span>After {isAttuned ? "unattuning" : "attuning"}: <b>{nextSpent} / {budget} RP</b>{isAttuned && timing.overrides.length > 0 && " · removes this ability’s Rune rules"}</span>
              {isAttuned && list.indexOf(id) > 0 && <button type="button" className="attunement-button attunement-button--quiet" onClick={() => { const ordered = [...list]; const i = ordered.indexOf(id); [ordered[i - 1], ordered[i]] = [ordered[i], ordered[i - 1]]; hudBus.requestSetAbilityLoadout({ ...abilities, [key]: ordered }); }}>↑ Earlier default priority</button>}
            </div>
            {isAttuned && <p className="attunement-note">Rune priority comes first; default behavior follows attunement order.</p>}
          </div>}
        </article>;
      })}
    </div>
  </div>;
}
