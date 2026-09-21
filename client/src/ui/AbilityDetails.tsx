import { useId } from "react";
import { AbilityTags } from './AbilityTags';
import { useHoverTooltip } from "../hud/primitives";
import type { AbilityDescription, AbilityLine } from "./describe/abilityText";
import "./describe/detailLines.css";

const HELP: Record<string, string> = {
  splashPct: "The share of the triggering hit dealt as splash damage to nearby enemies.",
  radius: "The radius of the area affected, measured in world pixels.",
  damageMult: "A multiplier of your attack power. The damage estimate is before the target's defenses.",
  damageTakenPct: "Additional damage taken by the affected target during this effect.",
  durationMs: "How long this effect lasts after activation.",
  distance: "How far this ability repositions you, measured in world pixels.",
  empowerMult: "The attack multiplier applied to your next qualifying hit, before the target's defenses.",
  platingBonus: "Flat plating granted while the effect lasts.",
  reflectFlat: "Flat damage reflected each time an attacker hits you while the effect lasts.",
  drPct: "The fraction of incoming damage reduced by this effect.",
  knockbackResistPct: "The fraction of knockback prevented while this effect lasts.",
  stacks: "The number of damage-over-time stacks removed when this ability fires.",
  debuffs: "The number of afflictions cleansed when this ability fires.",
  recoveryPct: "The share of your Recovery rate activated during this window. This is not a percentage of maximum health.",
  slowPct: "The reduction to the affected enemy's movement speed.",
  slowDurationMs: "How long the movement slow lasts.",
  rootMs: "How long the target is rooted in place.",
  stunMs: "How long the target is stunned.",
  attackSpeedPct: "Additional attack speed while the effect lasts.",
  controlResistPct: "Resistance to crowd control during the protection window.",
  controlResistMs: "How long the control-resistance window lasts.",
  maxTargets: "The maximum number of enemies that can receive the spread afflictions.",
  detonateMult: "A multiplier of the damage still remaining in the target's afflictions, not your attack power.",
  onHitDamage: "Flat bonus damage added to each empowered hit.",
  charges: "The number of attacks empowered before this effect expires.",
  rangeBonus: "The ability's reach, including your current attack range when available.",
  cooldown: "The time before this ability can fire again. Its trigger and target requirements must still be met.",
  cast: "The wind-up before the ability resolves, including current cast-speed bonuses.",
};

function AbilityNumber({ line, rank }: { line: AbilityLine; rank: string }) {
  const help = [HELP[line.key], line.breakdown ?? `Authored value at rank ${rank}.`].filter(Boolean).join(" ");
  const helpId = useId();
  const { handlers, node } = useHoverTooltip(help, "above");
  return <div className="ability-number">
    <button type="button" className="detail-line detail-line--help" aria-describedby={helpId} {...handlers}>
      <span className="detail-line__label">{line.label} <span aria-hidden="true">ⓘ</span></span>
      <span className="detail-line__value">{line.value}</span>
    </button>
    <span className="attunement-sr-only" id={helpId}>{help}</span>
    {node}
  </div>;
}

export function AbilityDetails({ description }: { description: AbilityDescription }) {
  return <div className="ability-numbers">
    <AbilityTags tags={description.tags.map(tag => tag.id)} />
    {description.lines.map(line => <AbilityNumber key={line.key} line={line} rank={description.rank} />)}
    {description.equipmentModifiers.length > 0 && <div className="ability-equipment">
      <div className="detail-lines__title">Equipment bonuses</div>
      {description.equipmentModifiers.map(line => <div className="detail-line" key={line.key}>
        <span className="detail-line__label">{line.source} · {line.label}</span>
        <span className="detail-line__value">{line.value}</span>
      </div>)}
      <div className="detail-lines__empty">Shown values include bonuses and caps. Kill refunds apply when triggered.</div>
    </div>}
  </div>;
}
