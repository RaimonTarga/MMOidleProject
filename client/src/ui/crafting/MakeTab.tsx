import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import type { EssenceType } from '@mmo-idle/shared';
import {
  RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
  abilityDef,
  checkEvolve,
  checkReconstruct,
  coreEligibilityLabel,
  isEvolvedRecipe,
  isRestrictedCore,
  relicRatingsFromEffects,
  requiredPlusFor,
  resolveRelicPreview,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  catalystsAtom,
  essencesAtom,
  inventoryAtom,
  itemUpgradesAtom,
  playerIdAtom,
  playerNodeIdAtom,
  combatArchetypeAtom,
  selectedSubVariantAtom,
} from '../../hud/atoms';
import { BrowserPane } from '../../hud/primitives';
import { SLOT_ABBR, biomeName, tierColor } from './common';
import { CostDisplay, WalletSummary } from './shared';
import { statEntries, formatMechanicEffects, formatResolvedRelicProfile, formatWeaponEffects } from './itemDisplay';
import {
  entryAffordable,
  KIND_ORDER,
  MAKE_KIND_LABELS,
  TECHNIQUE_KINDS,
  type MakeEntry,
  type MakeKind,
} from './makeEntries';
import { useNewEntries } from './useNewEntries';
import { eligibleMakeKeys, useMakeEntries } from './useMakeEntries';
import { GameIcon } from '../GameIcon';
import { makeKindIconSource } from '../systemIcons';
import { ItemIcon } from '../ItemIcon';
import { BuildIcon } from '../BuildIcon';
import { abilityIconSource } from '../abilityIcons';
import {
  riteIconSource,
  runeFragmentConceptIconSource,
  stanceIconSource,
} from '../conceptIcons';
import { DetailLines } from '../describe/DetailLines';
import { loadoutLinesFor, ruleLines } from '../describe';
import { useAbilityContext } from '../describe/useAbilityContext';
import type { AbilityContext } from '../describe';

/**
 * Ordering the list can take. `default` is new-first — the answer to "what
 * changed while I was out" — then affordable, then the canonical kind/tier/name
 * order everything else uses.
 */
type MakeSort = 'default' | 'name' | 'tier' | 'cost';

const SORT_FACETS: { sort: MakeSort; label: string }[] = [
  { sort: 'default', label: 'New first' },
  { sort: 'name', label: 'Name' },
  { sort: 'tier', label: 'Tier' },
  { sort: 'cost', label: 'Cost' },
];

/** Total essence + catalyst outlay, for the cost sort. */
function entryCost(entry: MakeEntry): number {
  const essence = Object.values(entry.cost).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const catalyst = Object.values(entry.catalystCost ?? {}).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  return essence + catalyst;
}

const KIND_FACETS: { kind: MakeKind; label: string }[] = KIND_ORDER.map((kind) => ({
  kind,
  label: kind === 'mobility' ? 'Mobility' : MAKE_KIND_LABELS[kind],
}));

function kindLabel(kind: MakeKind): string {
  return MAKE_KIND_LABELS[kind] ?? kind;
}

/**
 * The kind's own glyph, next to its name. Carried by both the filter chip and
 * every row, so a group is recognisable from the chip strip and again when it
 * scrolls past — which is the whole reason stances/rites/runes read as missing.
 */
function KindGlyph({ kind, size }: { kind: MakeKind; size: number }) {
  const source = makeKindIconSource(kind);
  if (!source) return null;
  return (
    <GameIcon
      as="span"
      source={source}
      size={size}
      fallback={null}
      className="make-kind-glyph"
      decorative
    />
  );
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
          ? <ItemIcon frameName={entry.gear.icon} scale={Math.min(1.6, size / 32)} />
          : SLOT_ABBR[entry.gear.slot] ?? entry.gear.slot.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  const ability = entry.kind === 'technique' ? abilityDef(entry.learnedId) : null;
  const conceptIcon = ability
    ? abilityIconSource(ability)
    : entry.learnedId && entry.kind === 'stance'
      ? stanceIconSource(entry.learnedId)
      : entry.learnedId && entry.kind === 'rite'
        ? riteIconSource(entry.learnedId)
        : entry.learnedId && entry.kind === 'rune'
          ? runeFragmentConceptIconSource(entry.learnedId)
          : null;
  return (
    <BuildIcon
      kind={
        entry.kind === 'technique'
          ? 'ability'
          : entry.kind === 'stance'
            ? 'stance'
            : entry.kind === 'rune'
              ? 'rune'
              : 'rite'
      }
      label={entry.name}
      size={size}
      muted={!entry.unlocked}
      icon={conceptIcon}
    />
  );
}

interface CraftResult {
  id: number;
  entry: MakeEntry;
  success: boolean;
  reason?: string;
}

/**
 * Two success beats, chosen by tier — not one animation with frames removed.
 *
 * A T1 recipe is crafted dozens of times on the way through a biome, and a
 * five-second forge ceremony for the twelfth Oak Club is a tax. A T4 relic is
 * crafted once, and the ceremony is the reward. So the low tiers get their own
 * shape: a struck stamp in the corner of the panel that lands hard, holds, and
 * leaves — deliberate, but over in a beat, and it never covers the list you are
 * still reading.
 *
 * `CRAFT_CEREMONY_MIN_TIER` is the only knob. Tier 3 is where recipes stop being
 * something you make on the way past.
 */
const CRAFT_CEREMONY_MIN_TIER = 3;

const CRAFT_REVEAL_MS = 4_950;
/** Must outlast `craft-forge-stamp-life` in crafting.css. */
const CRAFT_CONFIRM_MS = 1_250;
const CRAFT_FAILURE_MS = 2_200;

function wantsCeremony(entry: MakeEntry): boolean {
  return entry.tier >= CRAFT_CEREMONY_MIN_TIER;
}

/**
 * Successful recipes leave the Make list as soon as the authoritative player
 * delta arrives. This reveal owns a snapshot of the attempted entry, so the
 * forge sequence cannot disappear with its recipe row.
 */
function CraftReveal({ result }: { result: CraftResult }) {
  const { entry } = result;
  const style = {
    '--craft-reveal-tone': tierColor(entry.tier),
  } as CSSProperties;

  return (
    <div
      className="craft-forge-reveal"
      style={style}
      role="status"
      aria-live="assertive"
      aria-label={`${entry.name} crafted`}
    >
      <span className="craft-forge-reveal__scrim" aria-hidden="true" />
      <div className="craft-forge-reveal__chamber">
        <span className="craft-forge-reveal__frame" aria-hidden="true" />
        <div className="craft-forge-reveal__header">
          <span>Forge channel</span>
          <span className="craft-forge-reveal__status">Complete</span>
        </div>

        <div className="craft-forge-reveal__rig" aria-hidden="true">
          <span className="craft-forge-reveal__ward craft-forge-reveal__ward--upper" />
          <span className="craft-forge-reveal__ward craft-forge-reveal__ward--lower" />
          <span className="craft-forge-reveal__runes">
            {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
          </span>
          <span className="craft-forge-reveal__channel">
            <i className="craft-forge-reveal__charge" />
            <i className="craft-forge-reveal__wake" />
            <i className="craft-forge-reveal__discharge" />
          </span>
          <span className="craft-forge-reveal__core">
            <i className="craft-forge-reveal__orbit craft-forge-reveal__orbit--outer" />
            <i className="craft-forge-reveal__orbit craft-forge-reveal__orbit--inner" />
            <span className="craft-forge-reveal__icon">
              <EntryIcon entry={entry} size={64} />
            </span>
            <i className="craft-forge-reveal__impact" />
          </span>
        </div>

        <div className="craft-forge-reveal__copy">
          <strong>{entry.name}</strong>
          <span>
            {kindLabel(entry.kind)} · T{entry.tier}
            {entry.recipeGroup ? ` · ${biomeName(entry.recipeGroup)}` : ''}
          </span>
        </div>
        <div className="craft-forge-reveal__seal" aria-hidden="true">
          <i />
          <span>Crafted</span>
          <i />
        </div>
      </div>
    </div>
  );
}

/**
 * The low-tier success beat. Same information as the forge ceremony — what you
 * made, what kind, what tier — with none of its staging: no scrim, no chamber,
 * no channel. It strikes in, holds long enough to be read, and goes, while the
 * recipe list behind it stays visible and usable the whole time.
 */
function CraftStamp({ result }: { result: CraftResult }) {
  const { entry } = result;
  const style = {
    '--craft-reveal-tone': tierColor(entry.tier),
  } as CSSProperties;

  return (
    <div
      className="craft-forge-stamp"
      style={style}
      role="status"
      aria-live="polite"
      aria-label={`${entry.name} crafted`}
    >
      <span className="craft-forge-stamp__strike" aria-hidden="true" />
      <span className="craft-forge-stamp__icon" aria-hidden="true">
        <EntryIcon entry={entry} size={34} />
      </span>
      <span className="craft-forge-stamp__copy">
        <strong>{entry.name}</strong>
        <span>
          {kindLabel(entry.kind)} · T{entry.tier}
        </span>
      </span>
      <span className="craft-forge-stamp__seal" aria-hidden="true">Crafted</span>
    </div>
  );
}

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
  const [showLocked, setShowLocked] = useState(false);
  const [sort, setSort] = useState<MakeSort>('default');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);

  const playerId = useAtomValue(playerIdAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const inventory = useAtomValue(inventoryAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);

  const isTestRoom = nodeId === TEST_ROOM_NODE_ID;
  // Techniques deepen with tier and passives, so a recipe quotes what it would
  // be worth to THIS character rather than its authored baseline.
  const abilityContext = useAbilityContext();
  const lastAttemptRef = useRef<MakeEntry | null>(null);
  const resultIdRef = useRef(0);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearResult = () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
      setCraftResult(null);
    };
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ success: boolean; reason?: string }>).detail;
      const entry = lastAttemptRef.current;
      if (!entry) return;
      // A result received after the tab was backgrounded is authoritative, but
      // replaying its forge ignition later would be stale presentation.
      if (document.hidden) {
        lastAttemptRef.current = null;
        clearResult();
        return;
      }
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      setCraftResult({
        id: ++resultIdRef.current,
        entry,
        success: detail.success,
        reason: detail.reason,
      });
      resultTimerRef.current = setTimeout(
        () => setCraftResult(null),
        !detail.success
          ? CRAFT_FAILURE_MS
          : wantsCeremony(entry) ? CRAFT_REVEAL_MS : CRAFT_CONFIRM_MS,
      );
      lastAttemptRef.current = null;
    };
    const cancelHiddenReveal = () => {
      if (document.hidden) clearResult();
    };
    window.addEventListener('hud:craftResult', handler);
    document.addEventListener('visibilitychange', cancelHiddenReveal);
    return () => {
      window.removeEventListener('hud:craftResult', handler);
      document.removeEventListener('visibilitychange', cancelHiddenReveal);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  const entries = useMakeEntries();
  const eligibleKeys = useMemo(() => eligibleMakeKeys(entries), [entries]);
  const newEntries = useNewEntries('craft', playerId, eligibleKeys);

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
      (showLocked || entry.unlocked)
      && (!filterKind || entry.kind === filterKind)
      && (!filterBiome || entry.recipeGroup === filterBiome)
      && (!filterTier || entry.tier === filterTier)
      && (!needle || entry.name.toLowerCase().includes(needle))
      && (!hideUnaffordable || entryAffordable(entry, essences, catalysts)),
    );

    // `entries` already arrives in kind/tier/name order, so every sort below
    // only has to impose its own key and let that carry the ties.
    const sorted = matches.slice();
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'tier') sorted.sort((a, b) => b.tier - a.tier);
    else if (sort === 'cost') sorted.sort((a, b) => entryCost(a) - entryCost(b));
    else {
      // Default: what just became available, then what you can afford right now,
      // then everything else. Answers "what changed" before "what exists".
      const rank = (entry: MakeEntry) => {
        if (newEntries.has(entry.key)) return 0;
        if (!entry.unlocked) return 3;
        return entryAffordable(entry, essences, catalysts) ? 1 : 2;
      };
      sorted.sort((a, b) => rank(a) - rank(b));
    }
    return sorted;
  }, [
    entries, filterKind, filterBiome, filterTier, hideUnaffordable, showLocked,
    search, sort, essences, catalysts, newEntries,
  ]);

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
      {/* Locked recipes are hidden by default — the list is for what you can
          make. The chip brings back the ladder of what is coming, which is the
          job Crafting's old Progress tab used to do. */}
      <button
        type="button"
        className={`craft-filter-chip${showLocked ? ' craft-filter-chip--active' : ''}`}
        onClick={() => setShowLocked((value) => !value)}
      >
        Show locked
      </button>
      <div className="craft-filter-row craft-filter-row--sort">
        <span className="craft-filter-label">Sort</span>
        {SORT_FACETS.map((facet) => (
          <button
            key={facet.sort}
            type="button"
            className={`craft-filter-chip${sort === facet.sort ? ' craft-filter-chip--active' : ''}`}
            onClick={() => setSort(facet.sort)}
          >
            {facet.label}
          </button>
        ))}
      </div>
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
            <KindGlyph kind={facet.kind} size={12} />
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
      {craftResult?.success && (
        wantsCeremony(craftResult.entry)
          ? <CraftReveal key={craftResult.id} result={craftResult} />
          : <CraftStamp key={craftResult.id} result={craftResult} />
      )}
      <WalletSummary essences={essences} catalysts={catalysts} />
      <BrowserPane
        label="Recipes"
        className="make-browser"
        items={filtered}
        itemKey={(entry) => entry.key}
        selectedKey={selected?.key ?? null}
        onSelect={(key) => {
          // Looking at it is enough to stop it being news.
          newEntries.clear(key);
          setSelectedKey(key);
        }}
        toolbar={toolbar}
        emptyList={entries.length === 0
          ? 'No recipes unlocked yet.'
          : 'No recipes match the current filter.'}
        emptyDetail="Select a recipe to see what it makes."
        renderItem={(entry) => (
          <MakeRow
            entry={entry}
            affordable={entryAffordable(entry, essences, catalysts)}
            isNew={newEntries.has(entry.key)}
            onSeen={() => newEntries.clear(entry.key)}
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
            result={
              craftResult && !craftResult.success && craftResult.entry.key === entry.key
                ? craftResult
                : null
            }
            onAttempt={(run) => {
              lastAttemptRef.current = entry;
              newEntries.clear(entry.key);
              run();
            }}
          />
        )}
      />
    </div>
  );
}

/**
 * A row states what the thing IS and whether it is news. It used to end in a
 * READY/SHORT/LOCKED/LEARNED chip, which spent the most valuable column in the
 * list restating what the list already guaranteed: owned and learned recipes are
 * gone from it entirely, locked ones are hidden unless you ask for them, and
 * affordability is a property you can see in the cost panel — and is now carried
 * by the row's own dimming rather than by a word.
 */
function MakeRow({
  entry,
  affordable,
  isNew,
  onSeen,
}: {
  entry: MakeEntry;
  affordable: boolean;
  isNew: boolean;
  onSeen: () => void;
}) {
  return (
    <span
      className={[
        'make-row',
        !entry.unlocked ? 'make-row--locked' : '',
        entry.unlocked && !affordable ? 'make-row--short' : '',
      ].filter(Boolean).join(' ')}
      // Hovering counts as reading it — the badge is a "look here", and it has
      // done its job the moment you do.
      onMouseEnter={isNew ? onSeen : undefined}
    >
      <EntryIcon entry={entry} size={28} />
      <span className="make-row__main">
        <span className="make-row__name">{entry.name}</span>
        <span className="make-row__meta">
          <KindGlyph kind={entry.kind} size={10} />
          {kindLabel(entry.kind)} · T{entry.tier}
          {entry.recipeGroup ? ` · ${biomeName(entry.recipeGroup)}` : ''}
        </span>
      </span>
      {isNew && <span className="make-row__new">NEW</span>}
      {!entry.unlocked && <span className="make-row__state make-row__state--locked">LOCKED</span>}
    </span>
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
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
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
      ...(recipe.slot === 'core' && recipe.coreEligibility
        ? [isRestrictedCore(recipe.coreEligibility)
          ? `Full effect only for ${coreEligibilityLabel(recipe.coreEligibility).toLowerCase()}`
          : 'Works for any build']
        : []),
      ...formatMechanicEffects(recipe.mechanicEffects),
      ...(recipe.slot === 'relic'
        ? formatResolvedRelicProfile(resolveRelicPreview(
            combatArchetype,
            abilityContext.passives,
            relicRatingsFromEffects(recipe.mechanicEffects),
            { subVariant: selectedSubVariant, playerTier: abilityContext.playerTier },
          ))
        : []),
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

  const blocked = !entry.unlocked
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

      {evolved && predecessor && recipe && (
        <div className="craft-recipe__effect-line">
          Evolves from {predecessor.name} +{requiredPlusFor(recipe)} (consumed)
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

      {result && !result.success && (
        <div className="craft-card-result craft-card-result--err">
          <span className="craft-card-result__icon">✗</span>
          <span className="craft-card-result__text">
            {result.reason ?? 'Crafting failed'}
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
              {evolveCheck?.ok ? 'Evolve' : `Need +${requiredPlusFor(recipe)}`}
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
            {recipe ? 'Craft' : 'Learn'}
          </button>
        )}
        {blocked && <span className="make-detail__blocked">{blocked}</span>}
      </div>
    </div>
  );
}
