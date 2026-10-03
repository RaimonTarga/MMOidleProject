import { ABILITY_TAG_INFO, equipmentAbilityTags, type AbilityTag, type ItemDefinition } from '@mmo-idle/shared';
import './describe/detailLines.css';

export function AbilityTags({ tags }: { tags: readonly AbilityTag[] }) {
  if (!tags.length) return null;
  return <div className="ability-tags" aria-label="Ability tags">
    {tags.map(tag => <span className={`ability-tag ability-tag--${tag}`} key={tag} title={ABILITY_TAG_INFO[tag].help}>{ABILITY_TAG_INFO[tag].label}</span>)}
  </div>;
}

/** An item's tags, read off its authored effects: there is no `+N` on top (design §24.5). */
export function EquipmentAbilityTags({ item }: { item: ItemDefinition }) {
  return <AbilityTags tags={equipmentAbilityTags({ ...item.mechanicEffects })} />;
}
