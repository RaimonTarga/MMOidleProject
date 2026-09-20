import type { EssenceType, Recipe } from '@mmo-idle/shared';
import { ItemIcon } from '../ItemIcon';
import { SLOT_LABELS, tierColor } from './common';
import { CostDisplay } from './shared';
import type { EvolutionPlan } from './evolutionPlan';

const plusLabel = (plus: number): string => `+${plus}`;

/**
 * The transformation, read left to right: what is spent, and what it becomes.
 * Presentational only — every gate is still decided by `checkEvolve`.
 */
export function EvolutionPreview({ plan }: { plan: EvolutionPlan }) {
  const { recipe, predecessor, requiredPlus, ownedPlus, equipped } = plan;
  const slotLabel = (SLOT_LABELS[recipe.slot] ?? recipe.slot).toLowerCase();

  const ownership = ownedPlus === null
    ? { text: 'You own none', state: 'missing' as const }
    : !plan.meetsPlus
      ? { text: `Owned: ${plusLabel(ownedPlus)} / Requires: ${plusLabel(requiredPlus)}`, state: 'short' as const }
      : { text: equipped ? `Equipped · ${plusLabel(ownedPlus)}` : `In your bag · ${plusLabel(ownedPlus)}`, state: 'ready' as const };

  return (
    <section className="evo-preview">
      <div className="evo-preview__label">Evolution</div>

      <div className="evo-preview__flow">
        <article className={`evo-card evo-card--source evo-card--${ownership.state}`}>
          <span className="evo-card__role">Source</span>
          <ItemIcon frameName={predecessor.icon ?? null} scale={1.4} label={predecessor.name} />
          <span className="evo-card__name" style={{ color: tierColor(predecessor.tier) }}>
            {predecessor.name}
          </span>
          <span className="evo-card__level">{plusLabel(requiredPlus)} required</span>
          <span className="evo-card__tag evo-card__tag--consumed">Consumed</span>
          <span className={`evo-card__own evo-card__own--${ownership.state}`}>{ownership.text}</span>
        </article>

        <div className="evo-preview__conduit" aria-hidden="true">
          <i className="evo-preview__rail" />
          <span className="evo-preview__arrow">➜</span>
          <i className="evo-preview__rail" />
        </div>

        <article className="evo-card evo-card--result">
          <span className="evo-card__role">Result</span>
          <ItemIcon frameName={recipe.icon ?? null} scale={1.4} label={recipe.name} />
          <span className="evo-card__name" style={{ color: tierColor(recipe.tier) }}>
            {recipe.name}
          </span>
          <span className="evo-card__level" style={{ color: tierColor(recipe.tier) }}>
            T{recipe.tier}
          </span>
          {/* Only the equipped case says anything here. Evolving from the bag
              leaves the result in the bag, which is the unremarkable default and
              not worth a line of its own. */}
          {equipped && (
            <span className="evo-card__own">Replaces it in your {slotLabel} slot</span>
          )}
        </article>
      </div>

      <EvolutionChanges plan={plan} />
    </section>
  );
}

/**
 * The comparison, drawn between the item that is actually spent and the item
 * that actually arrives. Nothing is coloured as better or worse: a branch of a
 * lineage buys its new trick with something, and which side of that trade suits
 * the build is the player's call, not the panel's.
 */
function EvolutionChanges({ plan }: { plan: EvolutionPlan }) {
  const { diff, predecessor, recipe, consumedPlus, resultPlus } = plan;
  if (!diff) return null;
  const { rows, gains, losses } = diff;
  if (rows.length === 0 && gains.length === 0 && losses.length === 0) return null;

  return (
    <div className="evo-changes">
      <div className="evo-changes__basis">
        {predecessor.name} {plusLabel(consumedPlus)} → {recipe.name} {plusLabel(resultPlus)}
      </div>

      {rows.length > 0 && (
        <div className="evo-changes__rows">
          {rows.map((row) => (
            <div key={row.key} className="evo-change">
              <span className="evo-change__label">{row.label}</span>
              <span className="evo-change__from">{row.from}</span>
              <span className="evo-change__arrow" aria-hidden="true">→</span>
              <span className="evo-change__to">{row.to}</span>
              <span className="evo-change__delta">{row.delta ?? ''}</span>
            </div>
          ))}
        </div>
      )}

      {(gains.length > 0 || losses.length > 0) && (
        <ul className="evo-changes__effects">
          {gains.map((line) => (
            <li key={`gain:${line}`} className="evo-effect evo-effect--gain">
              <span className="evo-effect__mark" aria-hidden="true">+</span>
              <span className="evo-effect__what"><em>Gains:</em> {line}</span>
            </li>
          ))}
          {losses.map((line) => (
            <li key={`loss:${line}`} className="evo-effect evo-effect--loss">
              <span className="evo-effect__mark" aria-hidden="true">−</span>
              <span className="evo-effect__what"><em>Loses:</em> {line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The other way to get the item. Reconstruction skips the lineage entirely: it
 * pays `reconstructCost` instead of `cost`, requires no predecessor and consumes
 * none, and — because the equip-in-place branch of `evolveItem` is evolve-only —
 * always delivers to the bag.
 *
 * It was folded away behind a disclosure, which buried the only route open to a
 * player who never made the predecessor. It now states itself in full; it stays
 * BELOW the Evolve action, which is the ordering that keeps evolution primary.
 */
export function ReconstructOption({
  recipe,
  essences,
  catalysts,
  blocked,
  onReconstruct,
}: {
  recipe: Recipe;
  essences: Record<EssenceType, number>;
  catalysts: Record<string, number>;
  /** Authoritative reason it cannot be done, from `checkReconstruct`. Empty = ready. */
  blocked: string;
  onReconstruct: () => void;
}) {
  if (!recipe.reconstructCost) return null;

  return (
    <section className="evo-reconstruct">
      <div className="evo-reconstruct__label">Reconstruct</div>
      <p className="evo-reconstruct__note">
        Builds {recipe.name} from raw materials at a higher price, with no predecessor.
        Nothing is consumed — anything you already own stays exactly as it is — and the
        new item goes to your bag.
      </p>
      <CostDisplay
        cost={recipe.reconstructCost}
        essences={essences}
        catalystCost={recipe.reconstructCatalystCost}
        catalysts={catalysts}
      />
      <div className="evo-reconstruct__actions">
        <button
          type="button"
          className="craft-recipe__btn"
          disabled={blocked !== ''}
          title={blocked}
          onClick={onReconstruct}
        >
          Reconstruct
        </button>
        {blocked && <span className="make-detail__blocked">{blocked}</span>}
      </div>
    </section>
  );
}
