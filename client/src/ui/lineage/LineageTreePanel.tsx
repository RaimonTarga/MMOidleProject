/**
 * The weapon page (design §24.6; the approved "weapon page" mockup).
 *
 * Reached by clicking the equipped weapon. Reads top to bottom: the form you are
 * growing, one row per tier — a choice of three cards in three lane colours, one
 * lit — and the gate at the bottom. Beside it, the real stat sheet (a lean shows
 * before → after on hover) and the materials, with where each shard drops.
 *
 * A card is one sentence and no flavour text. Every decision about what a card
 * or a door may do comes from a SHARED check through `weaponPageModel.ts`; this
 * file only lays the model out and sends intents through `hudBus`.
 *
 * The export keeps its old name: both HUD shells mount it from
 * `lineageTreeSlotAtom`, and the tutorial director opens it the same way.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot, EssenceType, LineageProgress, LineageWallet, PacketId } from '@mmo-idle/shared';
import {
  TEST_ROOM_NODE_ID,
  TUTORIAL_ANCHORS,
  PARKED_LINEAGE_REASON,
  emptyLineageProgress,
  isLineageParked,
  isVerbCard,
  lineageForEquippedItem,
  lineagesForSlot,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  activeStanceAtom,
  biomeLevelAtom,
  capstonesAtom,
  combatArchetypeAtom,
  equipmentAtom,
  equippedRitesAtom,
  essencesAtom,
  globalMasteryAtom,
  hpAtom,
  itemUpgradesAtom,
  lineagesAtom,
  maxHpAtom,
  passivesAtom,
  playerNodeIdAtom,
  playerTierAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  shardsAtom,
  unlockedSkillsAtom,
} from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { MonsterSprite } from '../../hud/bestiary/MonsterSprite';
import { SLOT_LABELS } from '../crafting/common';
import { GameIcon } from '../GameIcon';
import { ItemIcon } from '../ItemIcon';
import { materialIconSource, type MaterialRef } from '../MaterialChip';
import { lineageDisplayName } from './lineageDisplayName';
import {
  activateAfterBuy,
  formHeader,
  gateBlocks,
  materialLines,
  pageBands,
  pageStatSheet,
  previewLeanProgress,
  successToast,
  type FormHeader,
  type GateBlock,
  type MaterialLine,
  type PageBand,
  type PageCardModel,
  type PageRow,
  type PageStatSheet,
  type PendingIntent,
} from './weaponPageModel';
import './weaponPage.css';

interface Props {
  slot: EquipmentSlot;
  onClose: () => void;
}

const NOTICE_MS = 3200;

type LaneStyle = CSSProperties & { '--lane': string };
const laneStyle = (color: string): LaneStyle => ({ '--lane': color });

/** Keep "5 s" together when a sentence wraps. Presentation only. */
const keepUnits = (text: string): string => text.replace(/(\d) (s)(?=\W|$)/g, '$1\u00a0$2');

// ── The form header ──────────────────────────────────────────────────────────

function FormHeaderView({ header, onWear }: { header: FormHeader; onWear: (recipeId: string, name: string) => void }) {
  return (
    <header className="wp-form">
      <div className="wp-form__art" aria-hidden="true">
        <ItemIcon frameName={header.icon} scale={3} />
      </div>
      <div className="wp-form__text">
        <div className="wp-form__eyebrow">{header.eyebrow}</div>
        <h2 className="wp-form__name">{header.name}</h2>
        <div className="wp-form__meta">{header.meta}</div>
        <div className="wp-form__lanes">
          {header.lanes.map((lane) => (
            <span key={lane.lane} className="wp-lane" style={laneStyle(lane.color)}>{lane.name}</span>
          ))}
        </div>
        {header.alsoOwned.length > 0 && (
          <div className="wp-form__also">
            <span>Also yours:</span>
            {header.alsoOwned.map((form) => (
              <button
                key={form.recipeId}
                type="button"
                className="wp-also"
                data-tutorial-anchor={TUTORIAL_ANCHORS.lineageForm(form.recipeId)}
                disabled={!!form.reason}
                title={form.reason}
                onClick={() => onWear(form.recipeId, form.name)}
              >
                {form.name} · wear
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ── A card ───────────────────────────────────────────────────────────────────

function CardView({
  model, previewing, onPress, onPreview,
}: {
  model: PageCardModel;
  /** A lean is hovered and this verb's sentence is showing the result. */
  previewing: boolean;
  onPress: (model: PageCardModel) => void;
  onPreview: (leanId: string | null) => void;
}) {
  const { card, state, tag, chips, requirement } = model;
  const refusing = model.action === 'toast' || model.action === 'none';
  const preview = model.isLean ? () => onPreview(card.id) : undefined;
  const unpreview = model.isLean ? () => onPreview(null) : undefined;
  return (
    <button
      type="button"
      className={`wp-card wp-card--${state}${previewing ? ' wp-card--preview' : ''}`}
      style={laneStyle(model.laneColor)}
      data-tutorial-anchor={TUTORIAL_ANCHORS.lineageCard(card.id)}
      aria-label={model.accessibleName}
      aria-disabled={refusing && state !== 'locked' ? true : undefined}
      disabled={state === 'locked'}
      title={model.reason}
      onMouseEnter={preview}
      onMouseLeave={unpreview}
      onFocus={preview}
      onBlur={unpreview}
      onClick={() => onPress(model)}
    >
      {tag && <span className={`wp-card__tag${state === 'active' ? ' wp-card__tag--active' : ''}`}>{tag}</span>}
      <span className="wp-card__name">{card.name}</span>
      <span className="wp-card__sentence">{keepUnits(model.sentence)}</span>
      {model.needsSlow && <span className="wp-card__needs">needs a slow</span>}
      {(chips.length > 0 || requirement) && (
        <span className="wp-card__foot">
          <span className="wp-card__cost">
            {chips.map((chip, i) => (
              <span key={`${chip.kind}:${chip.key}`} className={`wp-chip${chip.short && state !== 'locked' ? ' wp-chip--short' : ''}`} title={chip.title}>
                {i > 0 && <span className="wp-chip__sep" aria-hidden="true">·</span>}
                {chip.amount}{' '}
                <span className="wp-chip__word" style={chip.color ? { color: chip.color } : undefined}>{chip.word}</span>
              </span>
            ))}
          </span>
          {requirement && (
            <span className={`wp-card__req${requirement.met || state === 'locked' ? '' : ' wp-card__req--unmet'}`}>
              {requirement.text}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

// ── A row, a band ────────────────────────────────────────────────────────────

function RowView({ row, previewActive, onPress, onPreview }: {
  row: PageRow;
  previewActive: boolean;
  onPress: (model: PageCardModel) => void;
  onPreview: (leanId: string | null) => void;
}) {
  return (
    <section className={`wp-row${row.locked ? ' wp-row--locked' : ''}`} aria-label={row.title}>
      <div className="wp-row__head">
        <h3>{row.title}</h3>
        <span>{row.question}</span>
      </div>
      <div className="wp-row__cards">
        {row.cards.map((model) => (
          <CardView
            key={model.card.id}
            model={model}
            previewing={previewActive && isVerbCard(model.card)}
            onPress={onPress}
            onPreview={onPreview}
          />
        ))}
      </div>
    </section>
  );
}

function BandView({ band, previewActive, onPress, onPreview }: {
  band: PageBand;
  previewActive: boolean;
  onPress: (model: PageCardModel) => void;
  onPreview: (leanId: string | null) => void;
}) {
  const rows = band.rows.map((row) => (
    <RowView key={row.row} row={row} previewActive={previewActive} onPress={onPress} onPreview={onPreview} />
  ));
  if (band.mode === 'absent') {
    return <div className="wp-band wp-band--absent">Tier {band.tier} · Nothing beyond this band yet.</div>;
  }
  if (band.mode === 'collapsed') {
    // Design §4: a paid gate folds the band into one line, expandable to reslot.
    return (
      <details className="wp-band wp-band--collapsed">
        <summary>
          <b>{band.summary}</b>
          {band.absorbedName && <span>{band.absorbedName} is part of your form</span>}
        </summary>
        <div className="wp-band__rows">{rows}</div>
      </details>
    );
  }
  return <div className={`wp-band wp-band--${band.mode}`}>{rows}</div>;
}

// ── The gate ─────────────────────────────────────────────────────────────────

function GateView({ gate, onDoor }: { gate: GateBlock; onDoor: (door: GateBlock['doors'][number]) => void }) {
  return (
    <section className="wp-gate" aria-label={`The gate: ${gate.bossName}`}>
      <div className="wp-gate__portrait" aria-hidden="true">
        {gate.bossId
          ? <MonsterSprite monsterTypeId={gate.bossId} size={52} fallbackColor={gate.bossColor} />
          : null}
      </div>
      <div className="wp-gate__body">
        <h3>The gate: {gate.bossName}</h3>
        <p>{gate.sentence}</p>
        <div className="wp-gate__progress">
          <span className="wp-pips" aria-hidden="true">
            {gate.pips.map((filled, i) => <i key={i} className={filled ? 'is-filled' : undefined} />)}
          </span>
          <span>{gate.progressLine}</span>
        </div>
      </div>
      <div className="wp-gate__doors">
        {gate.doors.map((door) => (
          <div key={door.form.recipeId} className="wp-door">
            <button
              type="button"
              className={`wp-door__button${door.action === 'wear' ? ' wp-door__button--wear' : ''}`}
              data-tutorial-anchor={TUTORIAL_ANCHORS.lineageForm(door.form.recipeId)}
              disabled={door.action === 'blocked'}
              title={door.reason}
              onClick={() => onDoor(door)}
            >
              {door.label}
            </button>
            {door.reason && <small>{door.reason}</small>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── The side column ──────────────────────────────────────────────────────────

function StatSheetView({ sheet }: { sheet: PageStatSheet }) {
  return (
    <section className="wp-panel" aria-label="Stat sheet">
      <h3>Stat sheet</h3>
      <dl className="wp-sheet">
        {sheet.rows.map((row) => (
          <div key={row.key} className={`wp-sheet__row${row.after ? ' wp-sheet__row--moving' : ''}`}>
            <dt>{row.label}</dt>
            <dd>
              {row.after
                ? (
                  <>
                    <s>{row.before}</s>{' '}
                    <span className={row.direction > 0 ? 'wp-sheet__up' : 'wp-sheet__down'}>→ {row.after}</span>
                  </>
                )
                : row.before}
            </dd>
          </div>
        ))}
      </dl>
      <p className="wp-note">{sheet.note}</p>
    </section>
  );
}

function materialRef(line: MaterialLine): MaterialRef {
  switch (line.kind) {
    case 'essence': return { kind: 'essence', type: line.key as EssenceType };
    case 'shard': return { kind: 'shard', packet: line.key as PacketId };
    case 'capstone': return { kind: 'capstone', biome: line.key };
  }
}

function MaterialsView({ lines }: { lines: MaterialLine[] }) {
  return (
    <section className="wp-panel" aria-label="Materials">
      <h3>Materials</h3>
      <ul className="wp-mats">
        {lines.map((line) => (
          <li key={`${line.kind}:${line.key}`}>
            {/* The icon seam is `materialIconSource` (economyIcons.ts): the shard
                and capstone art from W1-E lands there and shows up here unchanged. */}
            <GameIcon
              source={materialIconSource(materialRef(line))}
              size={16}
              className="wp-mats__icon"
              decorative
            />
            <span className="wp-mats__name">
              <span style={line.color ? { color: line.color } : undefined}>{line.name}</span>
              {line.where && <small>{line.where}</small>}
            </span>
            <b>{line.held}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── The page ─────────────────────────────────────────────────────────────────

export function LineageTreePanel({ slot, onClose }: Props) {
  const equipment = useAtomValue(equipmentAtom);
  const lineages = useAtomValue(lineagesAtom);
  const essences = useAtomValue(essencesAtom);
  const shards = useAtomValue(shardsAtom);
  const capstones = useAtomValue(capstonesAtom);
  const biomeLevel = useAtomValue(biomeLevelAtom);
  const globalMastery = useAtomValue(globalMasteryAtom);
  const playerTier = useAtomValue(playerTierAtom);
  const playerNodeId = useAtomValue(playerNodeIdAtom);
  // The stat preview's inputs: exactly what the inventory's stat sheet feeds the
  // shared stat formula.
  const itemUpgrades = useAtomValue(itemUpgradesAtom);
  const passives = useAtomValue(passivesAtom);
  const combatArchetype = useAtomValue(combatArchetypeAtom);
  const selectedRange = useAtomValue(selectedRangeAtom);
  const selectedSubVariant = useAtomValue(selectedSubVariantAtom);
  const unlockedSkills = useAtomValue(unlockedSkillsAtom);
  const activeStance = useAtomValue(activeStanceAtom);
  const equippedRites = useAtomValue(equippedRitesAtom);
  const hp = useAtomValue(hpAtom);
  const maxHp = useAtomValue(maxHpAtom);
  const isTestRoom = playerNodeId === TEST_ROOM_NODE_ID;

  const [hoveredLean, setHoveredLean] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<PendingIntent | null>(null);

  const wornRecipeId = equipment[slot];
  // A parked lineage (design §24.5) opens no page, even for a save that still
  // holds one.
  const lineage = lineageForEquippedItem(wornRecipeId);
  const lineageId = lineage?.id ?? null;
  const stored = lineage ? lineages[lineage.id] : undefined;
  const progress: LineageProgress | null = useMemo(() => (lineage
    ? stored ?? emptyLineageProgress(lineage, wornRecipeId ?? undefined)
    : null), [lineage, stored, wornRecipeId]);
  const wallet: LineageWallet = useMemo(() => ({
    essences, shards, capstones, biomeLevels: biomeLevel, globalMastery, playerTier, isTestRoom,
  }), [essences, shards, capstones, biomeLevel, globalMastery, playerTier, isTestRoom]);

  function show(text: string, tone: 'ok' | 'warn') {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ text, tone });
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ success: boolean; reason?: string; lineageId: string; action: string }>).detail;
      if (!lineageId || detail.lineageId !== lineageId) return;
      const asked = pending.current;
      if (!detail.success) {
        pending.current = null;
        show(detail.reason ?? 'That did not work.', 'warn');
        return;
      }
      // A result the page did not ask for (the guided tutorial's own clicks) is
      // already on screen as the new state; it needs no toast.
      if (!asked || asked.action !== detail.action) return;
      if (asked.action === 'unlockCard' && asked.thenActivate) {
        // The mockup's card buys AND makes active; the server only activates into
        // an empty row, so the page asks for the swap too. `setActive` on the card
        // already slotted is a no-op on the server.
        pending.current = { action: 'setActive', cardId: asked.cardId, name: asked.name, afterBuy: true };
        hudBus.requestLineageSetActive(lineageId, asked.row, asked.cardId);
        return;
      }
      pending.current = null;
      show(successToast(asked), 'ok');
    };
    window.addEventListener('hud:lineageResult', handler);
    return () => window.removeEventListener('hud:lineageResult', handler);
  }, [lineageId]);
  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const preview = useMemo(
    () => (lineage && progress && hoveredLean ? previewLeanProgress(lineage, progress, hoveredLean) : null),
    [lineage, progress, hoveredLean],
  );

  const bands = useMemo(() => (lineage && progress
    ? pageBands({ lineage, progress, wallet, lineages, sentenceProgress: preview ?? undefined })
    : []), [lineage, progress, wallet, lineages, preview]);
  const leanIds = useMemo(() => bands
    .filter((band) => band.mode === 'lit')
    .flatMap((band) => band.rows.filter((row) => row.row === 'stat').flatMap((row) => row.cards.map((c) => c.card.id))),
  [bands]);

  const hpFraction = hp / Math.max(1, maxHp);
  const sheet = useMemo(() => (lineage && progress
    ? pageStatSheet({
      build: {
        usesSkills: {
          unlockedSkills, passives, selectedClass: combatArchetype ? `${combatArchetype}-root` : null,
          selectedSubVariant, selectedRange, combatArchetype,
        },
        equipment, itemUpgrades, playerTier, activeStance, equippedRites, hpFraction,
      },
      lineages, lineage, progress, leanIds, hoveredLeanId: hoveredLean,
    })
    : null), [lineage, progress, lineages, leanIds, hoveredLean, unlockedSkills, passives, combatArchetype,
    selectedSubVariant, selectedRange, equipment, itemUpgrades, playerTier, activeStance, equippedRites, hpFraction]);

  if (!lineage || !progress || !sheet) {
    const slotParked = lineagesForSlot(slot).every((l) => isLineageParked(l));
    const title = SLOT_LABELS[slot] ?? slot;
    return (
      <GameDialog size="standard" className="weapon-page-dialog" onClose={onClose}>
        <DialogHeader title={title} closeLabel={`Close ${title.toLowerCase()}`} />
        <div className="wp-empty">
          {slotParked ? PARKED_LINEAGE_REASON : `Craft a ${title.toLowerCase()} from the Make tab to start its page.`}
        </div>
      </GameDialog>
    );
  }

  const live = lineage;
  const tree = progress;
  const header = formHeader({ lineage: live, progress: tree, wallet, attack: sheet.attack, attacksPerSecond: sheet.attacksPerSecond });
  const gates = gateBlocks({ lineage: live, progress: tree, wallet });
  const materials = materialLines({ lineage: live, progress: tree, wallet });
  const name = lineageDisplayName(live);

  function onPress(model: PageCardModel) {
    const { card } = model;
    if (model.action === 'buy') {
      pending.current = {
        action: 'unlockCard', cardId: card.id, row: card.row, name: card.name,
        thenActivate: activateAfterBuy(live, tree, card),
      };
      hudBus.requestLineageUnlockCard(live.id, card.id);
    } else if (model.action === 'activate') {
      pending.current = { action: 'setActive', cardId: card.id, name: card.name, afterBuy: false };
      hudBus.requestLineageSetActive(live.id, card.row, card.id);
    } else if (model.action === 'toast' && model.reason) {
      show(model.reason, 'warn');
    }
  }

  function onWear(recipeId: string, formName: string) {
    pending.current = { action: 'wearForm', recipeId, name: formName };
    hudBus.requestLineageWearForm(live.id, recipeId);
  }

  function onDoor(door: GateBlock['doors'][number]) {
    if (door.action === 'wear') {
      onWear(door.form.recipeId, door.name);
    } else if (door.action === 'pay') {
      pending.current = { action: 'unlockForm', recipeId: door.form.recipeId, name: door.name, tier: door.form.tier };
      hudBus.requestLineageUnlockForm(live.id, door.form.recipeId);
    }
  }

  return (
    <GameDialog size="wide" className="weapon-page-dialog" onClose={onClose}>
      <DialogHeader
        title={name}
        closeLabel={`Close the ${name} page`}
        actions={<span className="wp-sub">{SLOT_LABELS[slot]} page</span>}
      />
      {notice && <div className={`wp-toast wp-toast--${notice.tone}`} role="status">{notice.text}</div>}
      <div className="wp-scroll">
        <div className="wp-grid">
          <div className="wp-main">
            <FormHeaderView header={header} onWear={onWear} />
            {bands.map((band) => (
              <BandView
                key={`${band.tier}:${band.mode}`}
                band={band}
                previewActive={!!preview}
                onPress={onPress}
                onPreview={setHoveredLean}
              />
            ))}
            {gates.map((gate) => <GateView key={gate.biome} gate={gate} onDoor={onDoor} />)}
          </div>
          <aside className="wp-side">
            <StatSheetView sheet={sheet} />
            <MaterialsView lines={materials} />
          </aside>
        </div>
      </div>
    </GameDialog>
  );
}
