import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType } from '@mmo-idle/shared';
import {
  RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  abilityDef,
  checkEvolve,
  checkReconstruct,
  isEvolvedRecipe,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  biomeLevelAtom,
  bossesClearedAtom,
  catalystsAtom,
  equipmentAtom,
  essencesAtom,
  inventoryAtom,
  itemUpgradesAtom,
  knownAbilitiesAtom,
  knownRitesAtom,
  runesOwnedAtom,
  knownStancesAtom,
  playerNodeIdAtom,
  unlockedRecipesAtom,
} from '../../hud/atoms';
import { BrowserPane } from '../../hud/primitives';
import { SLOT_ABBR, SLOT_LABELS, biomeName, tierColor } from './common';
import { CostDisplay, WalletSummary } from './shared';
import { statEntries, formatMechanicEffects, formatWeaponEffects } from './itemDisplay';
import {
  buildMakeEntries,
  entryAffordable,
  TECHNIQUE_KINDS,
  type MakeEntry,
  type MakeKind,
} from './makeEntries';
import { ItemIcon } from '../ItemIcon';
import { BuildIcon } from '../BuildIcon';
import { abilityIconSource } from '../abilityIcons';
import { DetailLines } from '../describe/DetailLines';
import { loadoutLinesFor, ruleLines } from '../describe';
import { useAbilityContext } from '../describe/useAbilityContext';
import type { AbilityContext } from '../describe';

const KIND_FACETS: { kind: MakeKind; label: string }[] = [
  { kind: 'weapon', label: 'Weapon' },
  { kind: 'armor', label: 'Armor' },
  { kind: 'recovery', label: 'Recovery' },
  { kind: 'mobility', label: 'Mobility' },
  { kind: 'core', label: 'Core' },
  { kind: 'technique', label: 'Technique' },
  { kind: 'stance', label: 'Stance' },
  { kind: 'rite', label: 'Rite' },
  { kind: 'rune', label: 'Rune' },
];

function kindLabel(kind: MakeKind): string {
  return SLOT_LABELS[kind as keyof typeof SLOT_LABELS]
    ?? KIND_FACETS.find((facet) => facet.kind === kind)?.label
    ?? kind;
}

function EntryIcon({ entry, size }: { entry: MakeEntry; size: number }) {
  if (entry.gear) {
    return (
      <span
        className="make-icon"
        data-slot={entry.gear.slot}
        style={{
          width: size,
          height: size,
          borderColor: `${tierColor(entry.tier)}77`,
          background: `${tierColor(entry.tier)}0d`,
          color: `${tierColor(entry.tier)}cc`,
        }}
      >
        {entry.gear.icon
          ? <ItemIcon frameName={entry.gear.icon} />
          : SLOT_ABBR[entry.gear.slot] ?? entry.gear.slot.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  const ability = entry.kind === 'technique' ? abilityDef(entry.learnedId) : null;
  return (
    <BuildIcon
      kind={entry.kind === 'technique' ? 'ability' : entry.kind === 'stance' ? 'stance' : 'rite'}
      label={entry.name}
      size={size}
      muted={!entry.unlocked}
      icon={ability ? abilityIconSource(ability) : undefined}
    />
  );
}

interface CraftResult { key: string; success: boolean; }

/**
 * The single making surface. Gear recipes and technique recipes come from
 * separate authoritative databases but share one browser, one card shape, and
 * one cost grammar, so "what can I build right now" is a single question.
 *
 * Actions live in the detail pane, never in a row — see `BrowserPane`.
 */
export function MakeTab() {
  const [filterKind, setFilterKind] = useState<MakeKind | null>(null);
  const [filterBiome, setFilterBiome] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const [hideUnaffordable, setHideUnaffordable] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);

  const nodeId = useAtomValue(playerNodeIdAtom);
  const unlockedRecipeIds = useAtomValue(unlockedRecipesAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const inventory = useAtomValue(inventoryAtom);
  const equipment = useAtomValue(equipmentAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const knownAbilities = useAtomValue(knownAbilitiesAtom);
  const knownStances = useAtomValue(knownStancesAtom);
  const knownRites = useAtomValue(knownRitesAtom);
  const ownedRunes = useAtomValue(runesOwnedAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const bossesCleared = useAtomValue(bossesClearedAtom);

  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;
  // Techniques deepen with tier and passives, so a recipe quotes what it would
  // be worth to THIS character rather than its authored baseline.
  const abilityContext = useAbilityContext();
  const lastAttemptRef = useRef<string | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ success: boolean }>).detail;
      const key = lastAttemptRef.current;
      if (!key) return;
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      setCraftResult({ key, success: detail.success });
      resultTimerRef.current = setTimeout(() => setCraftResult(null), 2200);
    };
    window.addEventListener('hud:craftResult', handler);
    return () => {
      window.removeEventListener('hud:craftResult', handler);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  const equippedSet = useMemo(
    () => new Set(Object.values(equipment).filter((id): id is string => id !== null)),
    [equipment],
  );
  const ownedGearIds = useMemo(
    () => new Set([...inventory, ...equippedSet]),
    [inventory, equippedSet],
  );

  const entries = useMemo(() => buildMakeEntries({
    unlockedRecipeIds,
    ownedGearIds,
    equippedGearIds: equippedSet,
    knownAbilities,
    knownStances,
    knownRites,
    ownedRunes,
    biomeLevel,
    bossesCleared,
    isTestRoom,
  }), [
    unlockedRecipeIds, ownedGearIds, equippedSet, knownAbilities, knownStances,
    knownRites, ownedRunes, biomeLevel, bossesCleared, isTestRoom,
  ]);

  const biomeGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const entry of entries) if (entry.recipeGroup) groups.add(entry.recipeGroup);
    return [...groups].sort();
  }, [entries]);

  const tiers = useMemo(() => {
    const values = new Set<number>();
    for (const entry of entries) values.add(entry.tier);
    return [...values].sort((a, b) => a - b);
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matches = entries.filter((entry) =>
      (!filterKind || entry.kind === filterKind)
      && (!filterBiome || entry.recipeGroup === filterBiome)
      && (!filterTier || entry.tier === filterTier)
      && (!needle || entry.name.toLowerCase().includes(needle))
      && (!hideUnaffordable || entry.owned || entryAffordable(entry, essences, catalysts)),
    );
    // Buildable first: the list answers "what can I make now" before "what
    // exists". Owned techniques sink to the bottom of their group.
    return matches.slice().sort((a, b) => {
      const rank = (entry: MakeEntry) =>
        entry.owned ? 2 : entryAffordable(entry, essences, catalysts) && entry.unlocked ? 0 : 1;
      return rank(a) - rank(b);
    });
  }, [entries, filterKind, filterBiome, filterTier, hideUnaffordable, search, essences, catalysts]);

  const selected = filtered.find((entry) => entry.key === selectedKey)
    ?? filtered[0]
    ?? null;

  const toolbar = (
    <>
      <input
        className="make-search"
        type="search"
        placeholder="Search recipes…"
        value={search}
        aria-label="Search recipes"
        onChange={(event) => setSearch(event.target.value)}
      />
      <button
        type="button"
        className={`craft-filter-chip${hideUnaffordable ? ' craft-filter-chip--active' : ''}`}
        onClick={() => setHideUnaffordable((value) => !value)}
      >
        Affordable
      </button>
      <div className="craft-filter-row">
        <button
          type="button"
          className={`craft-filter-chip${!filterKind ? ' craft-filter-chip--active' : ''}`}
          onClick={() => setFilterKind(null)}
        >
          All
        </button>
        {KIND_FACETS.map((facet) => (
          <button
            key={facet.kind}
            type="button"
            className={[
              'craft-filter-chip',
              TECHNIQUE_KINDS.includes(facet.kind) ? 'craft-filter-chip--technique' : 'craft-filter-chip--slot',
              filterKind === facet.kind ? 'craft-filter-chip--active' : '',
            ].filter(Boolean).join(' ')}
            data-slot={facet.kind}
            onClick={() => setFilterKind((value) => (value === facet.kind ? null : facet.kind))}
          >
            {facet.label}
          </button>
        ))}
      </div>
      <div className="craft-filter-row">
        <button
          type="button"
          className={`craft-filter-chip${!filterBiome ? ' craft-filter-chip--active' : ''}`}
          onClick={() => setFilterBiome(null)}
        >
          All Biomes
        </button>
        {biomeGroups.map((group) => (
          <button
            key={group}
            type="button"
            className={`craft-filter-chip${filterBiome === group ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setFilterBiome((value) => (value === group ? null : group))}
          >
            {biomeName(group)}
          </button>
        ))}
        {tiers.length > 1 && tiers.map((tier) => (
          <button
            key={tier}
            type="button"
            className={`craft-filter-chip craft-filter-chip--tier${filterTier === tier ? ' craft-filter-chip--active' : ''}`}
            style={filterTier === tier
              ? { color: tierColor(tier), borderColor: `${tierColor(tier)}aa`, background: `${tierColor(tier)}18` }
              : { color: `${tierColor(tier)}bb` }}
            onClick={() => setFilterTier((value) => (value === tier ? null : tier))}
          >
            T{tier}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="craft-body craft-body--make">
      <WalletSummary essences={essences} catalysts={catalysts} />
      <BrowserPane
        label="Recipes"
        className="make-browser"
        items={filtered}
        itemKey={(entry) => entry.key}
        selectedKey={selected?.key ?? null}
        onSelect={setSelectedKey}
        toolbar={toolbar}
        emptyList={entries.length === 0
          ? 'No recipes unlocked yet.'
          : 'No recipes match the current filter.'}
        emptyDetail="Select a recipe to see what it makes."
        renderItem={(entry) => (
          <MakeRow
            entry={entry}
            affordable={entryAffordable(entry, essences, catalysts)}
          />
        )}
        renderDetail={(entry) => (
          <MakeDetail
            entry={entry}
            essences={essences}
            catalysts={catalysts}
            inventory={inventory}
            itemUpgrades={itemUpgrades}
            abilityContext={abilityContext}
            isTestRoom={isTestRoom}
            result={craftResult?.key === entry.key ? craftResult : null}
            onAttempt={(run) => {
              lastAttemptRef.current = entry.key;
              run();
            }}
          />
        )}
      />
    </div>
  );
}

function MakeRow({ entry, affordable }: { entry: MakeEntry; affordable: boolean }) {
  const state = entry.owned
    ? 'owned'
    : !entry.unlocked
      ? 'locked'
      : affordable ? 'ready' : 'short';

  return (
    <>
      <EntryIcon entry={entry} size={28} />
      <span className="make-row__main">
        <span className="make-row__name">{entry.name}</span>
        <span className="make-row__meta">
          {kindLabel(entry.kind)} · T{entry.tier}
          {entry.recipeGroup ? ` · ${biomeName(entry.recipeGroup)}` : ''}
        </span>
      </span>
      <span className={`make-row__state make-row__state--${state}`}>
        {state === 'owned' ? entry.ownedLabel ?? 'OWNED'
          : state === 'locked' ? 'LOCKED'
            : state === 'ready' ? 'READY' : 'SHORT'}
      </span>
    </>
  );
}

interface MakeDetailProps {
  entry: MakeEntry;
  essences: Record<EssenceType, number>;
  catalysts: Record<string, number>;
  inventory: readonly string[];
  itemUpgrades: Record<string, number>;
  abilityContext: AbilityContext;
  isTestRoom: boolean;
  result: CraftResult | null;
  onAttempt: (run: () => void) => void;
}

/**
 * What a non-gear recipe would actually give you. Gear already states its stats
 * and mechanic effects; techniques, stances, rites and runes used to offer a
 * blurb and a price, which is not enough to decide whether to spend on one.
 */
function madeThingLines(entry: MakeEntry, context: AbilityContext) {
  if (!entry.learnedId) return [];
  if (entry.kind === 'rune') {
    // A rune recipe yields ONE fragment — a condition or an action, not an
    // assembled rule — so it describes that fragment's own numbers.
    return ruleLines({ conditionId: entry.learnedId, actionId: entry.learnedId })
      .filter((line) => line.key !== 'cost');
  }
  return loadoutLinesFor(entry.learnedId, context);
}

function MakeDetail({
  entry,
  essences,
  catalysts,
  inventory,
  itemUpgrades,
  abilityContext,
  isTestRoom,
  result,
  onAttempt,
}: MakeDetailProps) {
  const affordable = entryAffordable(entry, essences, catalysts);
  const recipe = entry.gear;
  const evolved = recipe ? isEvolvedRecipe(recipe) : false;
  const evolveCheck = recipe && evolved
    ? checkEvolve({ recipe, inventory, itemUpgrades, essences, catalysts, isTestRoom })
    : null;
  const reconstructCheck = recipe && evolved && recipe.reconstructCost
    ? checkReconstruct({ recipe, essences, catalysts, isTestRoom })
    : null;
  const predecessor = recipe?.evolvesFrom ? RECIPE_DATABASE.get(recipe.evolvesFrom) : undefined;

  const statList = recipe
    ? statEntries(recipe.stats, recipe.slot === 'weapon' ? recipe.attacksPerSecond : undefined)
    : [];
  const effectLines = recipe
    ? [
      ...(recipe.slot === 'core' && recipe.rangeTag
        ? [recipe.rangeTag === 'universal' || recipe.rangeTag === 'party'
          ? `Works at any range (${recipe.rangeTag})`
          : `Full effect only at ${recipe.rangeTag.toUpperCase()} range`]
        : []),
      ...formatMechanicEffects(recipe.mechanicEffects),
      ...(recipe.slot === 'weapon' ? formatWeaponEffects(recipe.id) : []),
    ]
    : [];

  // Each recipe kind has its own server intent; the browser is one surface over
  // several authoritative databases, not one database.
  function learnIntent() {
    if (entry.kind === 'technique') hudBus.requestCraftAbilityRecipe(entry.recipeId);
    else if (entry.kind === 'stance') hudBus.requestCraftStanceRecipe(entry.recipeId);
    else if (entry.kind === 'rite') hudBus.requestCraftRiteRecipe(entry.recipeId);
    else if (entry.kind === 'rune') hudBus.requestCraftRuneRecipe(entry.recipeId);
  }

  const blocked = entry.owned
    ? entry.ownedLabel ?? 'Already made'
    : !entry.unlocked
      ? entry.unlockHint || 'Not unlocked yet'
      : !affordable && !isTestRoom
        ? 'Not enough materials'
        : '';

  return (
    <div className="make-detail">
      <div className="make-detail__head">
        <EntryIcon entry={entry} size={40} />
        <div className="make-detail__title">
          <div className="make-detail__name">{entry.name}</div>
          <div className="make-detail__meta">
            {kindLabel(entry.kind)} · T{entry.tier}
            {entry.recipeGroup ? ` · ${biomeName(entry.recipeGroup)}` : ''}
          </div>
        </div>
      </div>

      {entry.blurb && <p className="make-detail__blurb">{entry.blurb}</p>}

      {statList.length > 0 && (
        <div className="craft-recipe__stats">
          {statList.map((stat, index) => (
            <span key={index} className="craft-stat-pill">
              <span className="craft-stat-pill__value">{stat.value}</span>
              <span className="craft-stat-pill__label">{stat.label}</span>
            </span>
          ))}
        </div>
      )}

      {effectLines.length > 0 && (
        <ul className="craft-recipe__effects">
          {effectLines.map((line, index) => (
            <li key={index} className="craft-recipe__effect-line">{line}</li>
          ))}
        </ul>
      )}

      {/* Non-gear recipes: what learning this would actually give you, at your
          current tier and passives. */}
      <DetailLines
        className="make-detail__lines"
        lines={madeThingLines(entry, abilityContext)}
      />

      <div className="make-detail__cost-label">Cost</div>
      <CostDisplay
        cost={entry.cost}
        essences={essences}
        catalystCost={entry.catalystCost}
        catalysts={catalysts}
      />

      {evolved && predecessor && (
        <div className="craft-recipe__effect-line">
          Evolves from {predecessor.name} +3 (consumed)
        </div>
      )}

      {evolved && recipe?.reconstructCost && (
        <>
          <div className="make-detail__cost-label">Reconstruct (no predecessor)</div>
          <CostDisplay
            cost={recipe.reconstructCost}
            essences={essences}
            catalystCost={recipe.reconstructCatalystCost}
            catalysts={catalysts}
          />
        </>
      )}

      {result && (
        <div className={`craft-card-result craft-card-result--${result.success ? 'ok' : 'err'}`}>
          <span className="craft-card-result__icon">{result.success ? '✓' : '✗'}</span>
          <span className="craft-card-result__text">
            {result.success ? 'Made!' : 'Not enough materials'}
          </span>
        </div>
      )}

      <div className="make-detail__actions">
        {evolved && recipe ? (
          <>
            <button
              type="button"
              className="craft-recipe__btn"
              disabled={!evolveCheck?.ok}
              title={evolveCheck?.reason}
              onClick={() => onAttempt(() => hudBus.requestEvolveItem(recipe.id, 'evolve'))}
            >
              {evolveCheck?.ok ? 'Evolve' : 'Need +3'}
            </button>
            {recipe.reconstructCost && (
              <button
                type="button"
                className="craft-recipe__btn"
                disabled={!reconstructCheck?.ok}
                title={reconstructCheck?.reason}
                onClick={() => onAttempt(() => hudBus.requestEvolveItem(recipe.id, 'reconstruct'))}
              >
                {reconstructCheck?.ok ? 'Reconstruct' : 'Insufficient'}
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            className="craft-recipe__btn"
            disabled={blocked !== ''}
            title={blocked}
            onClick={() => onAttempt(() => {
              if (recipe) hudBus.requestCraftRecipe(recipe.id);
              else learnIntent();
            })}
          >
            {entry.owned
              ? entry.ownedLabel ?? 'Made'
              : recipe ? 'Craft' : 'Learn'}
          </button>
        )}
        {blocked && !entry.owned && <span className="make-detail__blocked">{blocked}</span>}
      </div>
    </div>
  );
}
