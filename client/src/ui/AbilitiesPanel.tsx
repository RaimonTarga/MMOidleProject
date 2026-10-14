import { useId, useState } from "react";
import { LoadoutFeedback } from "./LoadoutFeedback";
import { useAtomValue } from "jotai";
import { ABILITY_DATABASE, TUTORIAL_ANCHORS, abilityBlurbAt, attunedAbilityIds, attunedForFamily } from "@mmo-idle/shared";
import { hudBus } from "../hudBus";
import { attunedAbilitiesAtom, knownAbilitiesAtom, playerTierAtom, passivesAtom, attackAtom, maxHpAtom, attackRangeAtom, combatArchetypeAtom } from "../hud/atoms";
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
        const described = describeAbility(ability, context);
        // The whole name (design §22.10), through the one entry point.
        const name = abilityNameFor(ability, tier);
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
              <button type="button" className="attunement-button" data-tutorial-anchor={TUTORIAL_ANCHORS.abilityAttune(id)} aria-pressed={isAttuned} aria-label={`${isAttuned ? "Unattune" : "Attune"} ${name}`} onClick={() => hudBus.requestSetAbilityLoadout(next)}>{isAttuned ? "Unattune" : "Attune"}</button>
            </div>
          </div>
          {selected && <div className="ability-entry__details" id={`${panelId}-${id}`}>
            <div className="ability-entry__detail-heading"><strong>{described.rankLabel}</strong><span>Tier {tier} · current bonuses included</span></div>
            <AbilityDetails description={described} />
            <p className="ability-entry__shape">{described.shape}</p>
          </div>}
        </article>;
      })}
    </div>
  </div>;
}
