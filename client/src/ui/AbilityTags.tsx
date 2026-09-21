import { ABILITY_TAG_INFO, equipmentAbilityTags, itemMechanicEffectsAt, type AbilityTag, type ItemDefinition } from '@mmo-idle/shared';
import './describe/detailLines.css';

export function AbilityTags({ tags }: { tags: readonly AbilityTag[] }) {
  if (!tags.length) return null;
  return <div className="ability-tags" aria-label="Ability tags">
    {tags.map(tag => <span className={`ability-tag ability-tag--${tag}`} key={tag} title={ABILITY_TAG_INFO[tag].help}>{ABILITY_TAG_INFO[tag].label}</span>)}
  </div>;
}

export function EquipmentAbilityTags({ item, plus = 0 }: { item: ItemDefinition; plus?: number }) {
  return <AbilityTags tags={equipmentAbilityTags(itemMechanicEffectsAt(item, plus))} />;
}
