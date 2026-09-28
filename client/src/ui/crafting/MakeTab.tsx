import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { EquipmentAbilityTags } from '../AbilityTags';
import type { EssenceType } from '@mmo-idle/shared';
import {
  ESSENCE_COLORS,
  TEST_ROOM_NODE_ID,
  catalystLabel,
  essenceLabel,
  ITEM_DATABASE,
  abilityDef,
  checkEvolve,
  checkReconstruct,
  coreEligibilityLabel,
  isEvolvedRecipe,
  isRestrictedCore,
  requiredPlusFor,
  relicRatingsFromPassives, relicRatingsFromEffects,
  resolveRelicComparison,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  catalystsAtom,
  essencesAtom,
  inventoryAtom,
  equipmentAtom,
  itemUpgradesAtom,
  playerIdAtom,
  playerNodeIdAtom,
  combatArchetypeAtom,
  passivesAtom, playerTierAtom, activeStanceAtom, equippedRitesAtom, hpAtom, maxHpAtom,
  selectedSubVariantAtom, selectedRangeAtom, unlockedSkillsAtom,
} from '../../hud/atoms';
import { BrowserPane, CategoryRail, RailLayout } from '../../hud/primitives';
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
import { EvolutionPreview, ReconstructOption } from './EvolutionPreview';
import { evolutionPlan } from './evolutionPlan';
import { useNewEntries } from './useNewEntries';
import { eligibleMakeKeys, useMakeEntries, useUnlockedMakeKinds } from './useMakeEntries';
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
import { makeFiltersAtom } from '../panelFilters';

/** What a recipe still needs, per material; empty when it is affordable. */
function missingMaterials(
  entry: MakeEntry,
  essences: Record<EssenceType, number>,
  catalysts: Record<string, number>,
): { key: string; label: string; amount: number; color?: string }[] {
  const essence = (Object.entries(entry.cost) as [EssenceType, number][])
    .filter(([type, amount]) => (essences[type] ?? 0) < amount)
    .map(([type, amount]) => ({
      key: type,
      label: essenceLabel(type),
      amount: amount - (essences[type] ?? 0),
      color: ESSENCE_COLORS[type],
    }));
  const catalyst = (Object.entries(entry.catalystCost ?? {}) as [string, number][])
    .filter(([family, amount]) => (catalysts[family] ?? 0) < amount)
    .map(([family, amount]) => ({
      key: family,
      label: catalystLabel(family),
      amount: amount - (catalysts[family] ?? 0),
    }));
  return [...essence, ...catalyst];
}

type MakeSection = 'new' | 'ready' | 'short' | 'locked';

const SECTION_LABELS: Record<MakeSection, string> = {
  new: 'New',
  ready: 'Ready to craft',
  short: 'Not ready yet',
  locked: 'Locked',
};

const SECTION_ORDER: MakeSection[] = ['new', 'ready', 'short', 'locked'];

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
  const [filters, setFilters] = useAtom(makeFiltersAtom);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [craftResult, setCraftResult] = useState<CraftResult | null>(null);

  const playerId = useAtomValue(playerIdAtom);
  const nodeId = useAtomValue(playerNodeIdAtom);
  const essences = useAtomValue(essencesAtom);
  const catalysts = useAtomValue(catalystsAtom);
  const inventory = useAtomValue(inventoryAtom);
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const equipment = useAtomValue(equipmentAtom);

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

  // A category joins the rail when its first recipe unlocks, never before.
  const unlockedKinds = useUnlockedMakeKinds();
  const railKinds = useMemo(
    () => KIND_ORDER.filter((kind) => isTestRoom || unlockedKinds.has(kind)),
    [unlockedKinds, isTestRoom],
  );

  // Anything that was new while this panel is open stays in the New section
  // until it closes; only its badge clears on sight. Otherwise hovering a row
  // would move it out from under the cursor.
  const openedNewRef = useRef(new Set<string>());
  for (const entry of entries) if (newEntries.has(entry.key)) openedNewRef.current.add(entry.key);

  // An evolution is makeable when either path is open: evolving an owned,
  // upgraded predecessor, or reconstructing from raw materials. Materials alone
  // say nothing about the first path.
  const canMake = (entry: MakeEntry): boolean => {
    if (isTestRoom) return true;
    const recipe = entry.gear;
    if (!recipe || !isEvolvedRecipe(recipe)) return entryAffordable(entry, essences, catalysts);
    return checkEvolve({ recipe, inventory, equipment, itemUpgrades, essences, catalysts }).ok
      || (!!recipe.reconstructCost && checkReconstruct({ recipe, essences, catalysts }).ok);
  };

  /** The row's short "what is missing" line for an evolution whose materials are covered. */
  const evolveNeed = (entry: MakeEntry): string => {
    const recipe = entry.gear;
    if (!recipe?.evolvesFrom || !isEvolvedRecipe(recipe)) return '';
    const source = ITEM_DATABASE.get(recipe.evolvesFrom)?.name ?? 'source item';
    const owned = inventory.includes(recipe.evolvesFrom) || equipment[recipe.slot] === recipe.evolvesFrom;
    return owned ? `needs ${source} +${requiredPlusFor(recipe)}` : `needs ${source}`;
  };

  const sectionOf = (entry: MakeEntry): MakeSection => {
    if (!entry.unlocked) return 'locked';
    if (openedNewRef.current.has(entry.key)) return 'new';
    return canMake(entry) ? 'ready' : 'short';
  };

  const railStats = useMemo(() => {
    const stats = new Map<MakeKind, { ready: number; fresh: number; open: number; isNew: boolean }>();
    for (const kind of railKinds) {
      const open = entries.filter((entry) => entry.kind === kind && entry.unlocked);
      const fresh = open.filter((entry) => newEntries.has(entry.key)).length;
      stats.set(kind, {
        ready: open.filter(canMake).length,
        fresh,
        open: open.length,
        // Every recipe in it is still unseen: the category itself just arrived.
        isNew: open.length > 0 && fresh === open.length,
      });
    }
    return stats;
  }, [railKinds, entries, newEntries, essences, catalysts, isTestRoom, inventory, equipment, itemUpgrades]); // eslint-disable-line react-hooks/exhaustive-deps

  // A remembered category that is no longer on the rail would select nothing;
  // fall back to where the news is, then to what can be made.
  const railKind: MakeKind | null = filters.kind && railKinds.includes(filters.kind)
    ? filters.kind
    : railKinds.find((kind) => (railStats.get(kind)?.fresh ?? 0) > 0)
      ?? railKinds.find((kind) => (railStats.get(kind)?.ready ?? 0) > 0)
      ?? railKinds[0]
      ?? null;
  const showLocked = filters.showLocked;

  const inKind = useMemo(
    () => entries.filter((entry) => entry.kind === railKind),
    [entries, railKind],
  );
  const lockedCount = inKind.filter((entry) => !entry.unlocked).length;

  // `entries` already arrives in tier/name order; sections only regroup it.
  const filtered = inKind
    .filter((entry) => showLocked || entry.unlocked)
    .map((entry) => ({ entry, rank: SECTION_ORDER.indexOf(sectionOf(entry)) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ entry }) => entry);

  const selected = filtered.find((entry) => entry.key === selectedKey)
    ?? filtered[0]
    ?? null;

  const rail = (
    <CategoryRail
      label="Recipe categories"
      selectedKey={railKind}
      onSelect={(key) => {
        setFilters((prev) => ({ ...prev, kind: key as MakeKind }));
        setSelectedKey(null);
      }}
      items={railKinds.map((kind, index) => {
        const stats = railStats.get(kind);
        return {
          key: kind,
          dataSlot: kind,
          // Gear above, learned skills below.
          divider: index > 0
            && !TECHNIQUE_KINDS.includes(railKinds[index - 1])
            && TECHNIQUE_KINDS.includes(kind),
          label: (
            <>
              <KindGlyph kind={kind} size={14} />
              {kindLabel(kind)}
              {stats?.isNew && <span className="make-row__new">NEW</span>}
            </>
          ),
          detail: (
            <>
              {stats && stats.ready > 0
                ? <span className="category-rail__ready">{stats.ready} ready</span>
                : stats && stats.open > 0 ? 'none ready' : 'all made'}
              {stats && stats.fresh > 0 && !stats.isNew && (
                <span className="category-rail__fresh"> · {stats.fresh} new</span>
              )}
            </>
          ),
        };
      })}
    />
  );

  const lockedToggle = lockedCount > 0 ? (
    <button
      type="button"
      className="make-locked-toggle"
      onClick={() => setFilters((prev) => ({ ...prev, showLocked: !prev.showLocked }))}
    >
      {showLocked ? 'Hide' : 'Show'} {lockedCount} locked {lockedCount === 1 ? 'recipe' : 'recipes'}
    </button>
  ) : undefined;

  return (
    <div className="craft-body craft-body--make">
      {craftResult?.success && (
        wantsCeremony(craftResult.entry)
          ? <CraftReveal key={craftResult.id} result={craftResult} />
          : <CraftStamp key={craftResult.id} result={craftResult} />
      )}
      <WalletSummary essences={essences} catalysts={catalysts} />
      <RailLayout>
      {rail}
      <BrowserPane
        label={railKind ? `${kindLabel(railKind)} recipes` : 'Recipes'}
        className="make-browser"
        items={filtered}
        groupOf={(entry) => SECTION_LABELS[sectionOf(entry)]}
        listFooter={lockedToggle}
        itemKey={(entry) => entry.key}
        selectedKey={selected?.key ?? null}
        onSelect={(key) => {
          // Looking at it is enough to stop it being news.
          newEntries.clear(key);
          setSelectedKey(key);
        }}
        emptyList={railKinds.length === 0
          ? 'No recipes unlocked yet.'
          : 'Everything here is made. New recipes arrive as your biome levels rise.'}
        emptyDetail="Select a recipe to see what it makes."
        renderItem={(entry) => (
          <MakeRow
            entry={entry}
            missing={isTestRoom || canMake(entry) ? [] : missingMaterials(entry, essences, catalysts)}
            need={isTestRoom || canMake(entry) ? '' : evolveNeed(entry)}
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
      </RailLayout>
    </div>
  );
}

/**
 * A row states what the thing IS and whether it is news. Its kind is the rail's
 * job and its section is the list's; the row adds only what is still missing,
 * because "what do I need" is the next question after "what can I make".
 */
function MakeRow({
  entry,
  missing,
  need,
  isNew,
  onSeen,
}: {
  entry: MakeEntry;
  missing: ReturnType<typeof missingMaterials>;
  /** A non-material blocker, e.g. an evolution's source item or its upgrade level. */
  need: string;
  isNew: boolean;
  onSeen: () => void;
}) {
  const short = entry.unlocked && (missing.length > 0 || need !== '');
  return (
    <span
      className={[
        'make-row',
        !entry.unlocked ? 'make-row--locked' : '',
        short ? 'make-row--short' : '',
      ].filter(Boolean).join(' ')}
      // Hovering counts as reading it — the badge is a "look here", and it has
      // done its job the moment you do.
      onMouseEnter={isNew ? onSeen : undefined}
    >
      <EntryIcon entry={entry} size={28} />
      <span className="make-row__main">
        <span className="make-row__name">{entry.name}</span>
        <span className="make-row__meta">
          T{entry.tier}
          {entry.recipeGroup ? ` · ${biomeName(entry.recipeGroup)}` : ''}
        </span>
      </span>
      {isNew && <span className="make-row__new">NEW</span>}
      {!isNew && short && (
        <span className="make-row__need">
          {need
            ? <span>{need}</span>
            : missing.map((item) => (
              <span key={item.key} style={item.color ? { color: item.color } : undefined}>
                -{item.amount}
              </span>
            ))}
        </span>
      )}
      {!entry.unlocked && (
        <span className="make-row__state make-row__state--locked">
          {entry.unlockHint.replace(/^Reach /, '') || 'Locked'}
        </span>
      )}
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
  const equipment = useAtomValue(equipmentAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const passives = useAtomValue(passivesAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const affordable = entryAffordable(entry, essences, catalysts);
  const recipe = entry.gear;
  const evolved = recipe ? isEvolvedRecipe(recipe) : false;
  const evolveCheck = recipe && evolved
    ? checkEvolve({ recipe, inventory, equipment, itemUpgrades, essences, catalysts, isTestRoom })
    : null;
  const reconstructCheck = recipe && evolved && recipe.reconstructCost
    ? checkReconstruct({ recipe, essences, catalysts, isTestRoom })
    : null;
  // The DPS row runs two full stat rebuilds, so the plan is only recomputed when
  // something it reads actually moves.
  const plan = useMemo(
    () => (recipe && evolved
      ? evolutionPlan({
        recipe,
        inventory,
        equipment,
        itemUpgrades,
        // What a weapon is worth depends on the whole character, so the build
        // goes in exactly as the inventory stat sheet assembles it.
        build: {
          usesSkills: {
            unlockedSkills, passives,
            selectedClass: combatArchetype ? `${combatArchetype}-root` : null,
            selectedSubVariant, selectedRange, combatArchetype,
          },
          playerTier, activeStance, equippedRites,
          hpFraction: maxHp > 0 ? hp / maxHp : 1,
        },
      })
      : null),
    [recipe, evolved, inventory, equipment, itemUpgrades, unlockedSkills, passives,
      combatArchetype, selectedSubVariant, selectedRange, playerTier, activeStance,
      equippedRites, hp, maxHp],
  );

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
        ? formatResolvedRelicProfile(resolveRelicComparison(
            combatArchetype,
            abilityContext.passives,
            relicRatingsFromPassives(abilityContext.passives),
            relicRatingsFromEffects(recipe.mechanicEffects),
            { subVariant: selectedSubVariant, playerTier: abilityContext.playerTier, unlockedSkills, selectedRange },
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

  // Evolution has its own gates, and the server checks the recipe unlock on BOTH
  // paths — so the concrete reason is the unlock hint first, then whatever the
  // authoritative check names. "Insufficient" was hiding "you need 60 more green".
  const lockReason = !entry.unlocked ? (entry.unlockHint || 'Not unlocked yet') : '';
  const evolveBlocked = lockReason || (evolveCheck?.ok ? '' : evolveCheck?.reason ?? '');
  const reconstructBlocked = lockReason || (reconstructCheck?.ok ? '' : reconstructCheck?.reason ?? '');

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
      {recipe && ITEM_DATABASE.has(recipe.id) && <EquipmentAbilityTags item={ITEM_DATABASE.get(recipe.id)!} />}

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

      {/* What this recipe actually is, for an evolved one: a transformation of
          something the player already owns, not a fresh craft. */}
      {plan && <EvolutionPreview plan={plan} />}

      <div className="make-detail__cost-label">{plan ? 'Evolution cost' : 'Cost'}</div>
      <CostDisplay
        cost={entry.cost}
        essences={essences}
        catalystCost={entry.catalystCost}
        catalysts={catalysts}
      />

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
              disabled={evolveBlocked !== ''}
              title={evolveBlocked}
              onClick={() => onAttempt(() => hudBus.requestEvolveItem(recipe.id, 'evolve'))}
            >
              Evolve
            </button>
            {evolveBlocked && <span className="make-detail__blocked">{evolveBlocked}</span>}
          </>
        ) : (
          <>
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
            {blocked && <span className="make-detail__blocked">{blocked}</span>}
          </>
        )}
      </div>

      {/* The escape hatch for a lineage the player never started, deliberately
          below the action it is an alternative to. */}
      {evolved && recipe && (
        <ReconstructOption
          recipe={recipe}
          essences={essences}
          catalysts={catalysts}
          blocked={reconstructBlocked}
          onReconstruct={() => onAttempt(() => hudBus.requestEvolveItem(recipe.id, 'reconstruct'))}
        />
      )}
    </div>
  );
}
