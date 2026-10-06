/**
 * The weapon page (design §24.6, §26.1, §26.4; the approved composite mockup,
 * Stone skin).
 *
 * Reached two ways: clicking the equipped weapon (its own dialog,
 * `LineageTreePanel`), and the Upgrade panel's worn-items list (the same page
 * inside that panel, `WeaponPage`). Reads top to bottom:
 *
 *  1. the form — the thing you are growing — and the band's steps
 *     (form · lean I · II · III · verb · gate at T1);
 *  2. "In the fight" (prototype C's plate): the active lean and the active verb
 *     as one reading, the verb in its two colours, re-reading under any preview;
 *  3. the lean row: Attack / Speed / Effect with rank pips, the number at the
 *     owned rank, the next rank's price and a rank-up control (swap is free);
 *  4. the verb: the weapon's own, with a mini ring and its beat line (the HUD
 *     ring's grammar, taught before the fight);
 *  5. the next band's choice, locked: its three verbs, dimmed;
 *  6. the gate: boss portrait, capstone pips, what it opens, the pay button.
 *
 * A card is one sentence and no flavour text. Every decision about what a card
 * or a door may do comes from a SHARED check through `weaponPageModel.ts`; the
 * rank reads go through `legibilityContracts.ts`. This file only lays the model
 * out and sends intents through `hudBus`.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAtomValue } from 'jotai';
import type { EquipmentSlot, EssenceType, LineageCard, LineageProgress, PacketId } from '@mmo-idle/shared';
import {
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
  combatArchetypeAtom,
  equipmentAtom,
  equippedRitesAtom,
  hpAtom,
  itemUpgradesAtom,
  lineagesAtom,
  maxHpAtom,
  passivesAtom,
  playerTierAtom,
  selectedRangeAtom,
  selectedSubVariantAtom,
  unlockedSkillsAtom,
} from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { MonsterSprite } from '../../hud/bestiary/MonsterSprite';
import { useIsMobile } from '../../hud/useIsMobile';
import { SLOT_LABELS } from '../crafting/common';
import { GameIcon } from '../GameIcon';
import { ItemIcon } from '../ItemIcon';
import { materialIconSource, type MaterialRef } from '../MaterialChip';
import { lineageDisplayName } from './lineageDisplayName';
import { bandSteps, type StepPip } from './upgradeListModel';
import { useLineageWallet } from './useUpgradeList';
import {
  activateAfterBuy,
  beatText,
  fightPlate,
  formHeader,
  gateBlocks,
  leanRankModel,
  lockedChoiceRow,
  materialLines,
  pageBands,
  pageStatSheet,
  previewLeanProgress,
  previewRankProgress,
  rankNumeral,
  successToast,
  verbBeat,
  type FightPlate,
  type FormHeader,
  type GateBlock,
  type LeanRankModel,
  type MaterialLine,
  type PageBand,
  type PageCardModel,
  type PageRow,
  type PageStatSheet,
  type PendingIntent,
  type VerbBeat,
} from './weaponPageModel';
import './weaponPage.css';

const NOTICE_MS = 3200;

type LaneStyle = CSSProperties & { '--lane': string };
const laneStyle = (color: string): LaneStyle => ({ '--lane': color });

/** Keep "5 s" together when a sentence wraps. Presentation only. */
const keepUnits = (text: string): string => text.replace(/(\d) (s)(?=\W|$)/g, '$1 $2');

/** What the page is previewing: a lean swapped in, or a lean's next rank. Display only. */
type Preview = { kind: 'lean'; cardId: string } | { kind: 'rank'; cardId: string; rank: number } | null;

// ── The form header and its steps ────────────────────────────────────────────

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

function StepsLine({ steps }: { steps: StepPip[] }) {
  return (
    <ol className="wp-steps" aria-label="This band's steps">
      {steps.map((step, i) => (
        <li
          key={`${step.label}:${i}`}
          className={`wp-step${step.done ? ' wp-step--done' : ''}${step.next ? ' wp-step--next' : ''}`}
          aria-label={`${step.label}${step.done ? ', done' : step.next ? ', next' : ''}`}
        >
          {i > 0 && <span className="wp-step__arrow" aria-hidden="true">→</span>}
          <span className="wp-step__pill">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

// ── "In the fight" ───────────────────────────────────────────────────────────

function FightPlateView({ plate, previewing }: { plate: FightPlate; previewing: boolean }) {
  return (
    <section className={`wp-plate${previewing ? ' wp-plate--preview' : ''}`} aria-label="In the fight">
      <span className="wp-plate__label">In the fight{previewing ? ' · preview' : ''}</span>
      {plate.empty && <p className="wp-plate__empty">{plate.empty}</p>}
      {(plate.lean || plate.verb) && (
        <p className="wp-plate__sent">
          {plate.lean && (
            <span className="wp-plate__lean" style={laneStyle(plate.lean.color)}>
              {keepUnits(plate.lean.sentence)}
            </span>
          )}
          {plate.lean && plate.verb && ' '}
          {plate.verb && (
            <>
              <span className="wp-plate__moment" style={laneStyle(plate.verb.momentColor)}>
                {keepUnits(plate.verb.parts.moment)}
              </span>
              {plate.verb.parts.payload && (
                <>
                  {' '}
                  <span className="wp-plate__payload" style={laneStyle(plate.verb.payloadColor)}>
                    {keepUnits(plate.verb.parts.payload)}
                  </span>
                </>
              )}
            </>
          )}
        </p>
      )}
      {plate.verb?.note && <span className="wp-plate__note">{plate.verb.note}</span>}
      {(plate.lean || plate.verb) && (
        <span className="wp-plate__who">
          {[plate.lean && `${plate.lean.name}${plate.lean.rank ? ` (${plate.lean.rank})` : ''}`, plate.verb?.name]
            .filter(Boolean).join(' · ')}
        </span>
      )}
    </section>
  );
}

// ── Cost chips and the requirement (shared by every card) ────────────────────

function CostLine({ model, locked }: { model: Pick<PageCardModel, 'chips' | 'requirement'>; locked?: boolean }) {
  const { chips, requirement } = model;
  if (chips.length === 0 && !requirement) return null;
  return (
    <span className="wp-card__foot">
      <span className="wp-card__cost">
        {chips.map((chip, i) => (
          <span key={`${chip.kind}:${chip.key}`} className={`wp-chip${chip.short && !locked ? ' wp-chip--short' : ''}`} title={chip.title}>
            {i > 0 && <span className="wp-chip__sep" aria-hidden="true">·</span>}
            {chip.amount}{' '}
            <span className="wp-chip__word" style={chip.color ? { color: chip.color } : undefined}>{chip.word}</span>
          </span>
        ))}
      </span>
      {requirement && (
        <span className={`wp-card__req${requirement.met || locked ? '' : ' wp-card__req--unmet'}`}>
          {requirement.text}
        </span>
      )}
    </span>
  );
}

// ── A generic card (the T2+ rows, the locked choice) ─────────────────────────

function CardView({
  model, previewing, onPress, onPreview,
}: {
  model: PageCardModel;
  /** A lean is previewed and this verb's sentence is showing the result. */
  previewing: boolean;
  onPress: (model: PageCardModel) => void;
  onPreview: (leanId: string | null) => void;
}) {
  const { card, state, tag } = model;
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
      {model.note && <span className="wp-card__needs">{model.note}</span>}
      <CostLine model={model} locked={state === 'locked'} />
    </button>
  );
}

// ── A lean, with its ranks ───────────────────────────────────────────────────

function LeanCardView({
  model, rank, previewMode, previewed, onPress, onRankUp, onPreview,
}: {
  model: PageCardModel;
  rank: LeanRankModel;
  previewMode: boolean;
  previewed: Preview;
  onPress: (model: PageCardModel) => void;
  onRankUp: (model: PageCardModel, rank: LeanRankModel) => void;
  onPreview: (preview: Preview) => void;
}) {
  const { card, state } = model;
  const ranked = rank.maxRank > 1;
  const owned = rank.rank > 0;
  // Hover (or the phone's preview mode) swaps this lean into the reading.
  const leanPreview: Preview = { kind: 'lean', cardId: card.id };
  const rankPreview: Preview = rank.next && owned ? { kind: 'rank', cardId: card.id, rank: rank.next.rank } : null;
  const isPreviewed = previewed?.cardId === card.id;
  const pressCard = () => {
    if (previewMode) { onPreview(isPreviewed && previewed?.kind === 'lean' ? null : leanPreview); return; }
    onPress(model);
  };
  const pressRank = () => {
    if (!rankPreview) return;
    if (previewMode) { onPreview(isPreviewed && previewed?.kind === 'rank' ? null : rankPreview); return; }
    onRankUp(model, rank);
  };
  const hoverable = !previewMode;
  const nameRank = ranked && owned ? `rank ${rankNumeral(rank.rank)}` : undefined;
  return (
    <div
      className={`wp-card wp-card--lean wp-card--${state}${isPreviewed ? ' wp-card--preview' : ''}`}
      style={laneStyle(model.laneColor)}
      onMouseEnter={hoverable ? () => onPreview(leanPreview) : undefined}
      onMouseLeave={hoverable ? () => onPreview(null) : undefined}
    >
      <button
        type="button"
        className="wp-card__press"
        data-tutorial-anchor={TUTORIAL_ANCHORS.lineageCard(card.id)}
        aria-label={model.accessibleName}
        aria-disabled={model.action === 'toast' || model.action === 'none' ? true : undefined}
        title={model.reason}
        onFocus={hoverable ? () => onPreview(leanPreview) : undefined}
        onBlur={hoverable ? () => onPreview(null) : undefined}
        onClick={pressCard}
      >
        {model.tag && <span className={`wp-card__tag${state === 'active' ? ' wp-card__tag--active' : ''}`}>{model.tag}</span>}
        <span className="wp-card__name">
          {card.name}
          {nameRank && <small className="wp-card__rank">{nameRank}</small>}
        </span>
        <span className="wp-card__sentence">{keepUnits(model.sentence)}</span>
      </button>
      {ranked && (
        <span className="wp-ranks" aria-label={`Rank ${rank.rankText ?? ''}`}>
          {rank.pips.map((on, i) => <i key={i} className={on ? 'is-on' : undefined} />)}
          <small>{rank.rankText}</small>
        </span>
      )}
      {owned && rank.next ? (
        <span className="wp-card__foot wp-card__foot--rank">
          <span className="wp-card__cost">
            <span className="wp-rank-label">Rank {rankNumeral(rank.next.rank)}:</span>
            {rank.next.chips.map((chip, i) => (
              <span key={`${chip.kind}:${chip.key}`} className={`wp-chip${chip.short ? ' wp-chip--short' : ''}`} title={chip.title}>
                {i > 0 && <span className="wp-chip__sep" aria-hidden="true">·</span>}
                {chip.amount}{' '}
                <span className="wp-chip__word" style={chip.color ? { color: chip.color } : undefined}>{chip.word}</span>
              </span>
            ))}
            {!rank.next.requirement.met && <span className="wp-card__req wp-card__req--unmet">{rank.next.requirement.text}</span>}
          </span>
          <button
            type="button"
            className={`wp-rankbtn${rank.next.action === 'buy' ? ' wp-rankbtn--ready' : ''}${isPreviewed && previewed?.kind === 'rank' ? ' is-previewing' : ''}`}
            data-tutorial-anchor={TUTORIAL_ANCHORS.lineageRankUp(card.id)}
            aria-disabled={rank.next.action !== 'buy' ? true : undefined}
            title={rank.next.reason ?? `Rank ${rankNumeral(rank.next.rank)}: ${rank.next.sentence ?? ''}`}
            onMouseEnter={hoverable && rankPreview ? () => onPreview(rankPreview) : undefined}
            // Still over the card: back to the card's own preview.
            onMouseLeave={hoverable ? () => onPreview(leanPreview) : undefined}
            onFocus={hoverable && rankPreview ? () => onPreview(rankPreview) : undefined}
            onBlur={hoverable ? () => onPreview(null) : undefined}
            onClick={pressRank}
          >
            {previewMode ? '◉ Rank up' : 'Rank up'}
          </button>
        </span>
      ) : owned ? (
        <span className="wp-card__foot">
          <span className="wp-card__req">{ranked ? 'Rank III is the cap at this tier.' : ''}</span>
          {state === 'owned' && <span className="wp-card__swap">swap free</span>}
        </span>
      ) : (
        <CostLine model={model} />
      )}
    </div>
  );
}

// ── The verb: its card, mini ring and beat line ──────────────────────────────

function BeatLine({ beat, color }: { beat: VerbBeat; color: string }) {
  const marks: Array<'tick' | 'fire' | 'rest' | 'kill'> = (() => {
    switch (beat.kind) {
      case 'count': return [...Array.from({ length: Math.max(1, beat.n - 1) }, () => 'tick' as const), 'fire'];
      case 'cap': return ['fire', 'rest'];
      case 'latch': return ['fire', 'tick', 'tick', 'tick'];
      case 'carry': return ['kill', 'fire'];
      default: return ['fire'];
    }
  })();
  return (
    <span className="wp-beat" style={laneStyle(color)} role="img" aria-label={beatText(beat)}>
      <span className="wp-beat__line" aria-hidden="true">
        {marks.map((mark, i) => (
          <i key={i} className={`wp-beat__${mark}`}>
            {mark === 'rest' && beat.kind === 'cap' ? `${beat.seconds} s` : null}
          </i>
        ))}
      </span>
      <small>{beatText(beat)}</small>
    </span>
  );
}

function VerbCardView({
  model, beat, previewing, onPress,
}: {
  model: PageCardModel;
  beat?: VerbBeat;
  previewing: boolean;
  onPress: (model: PageCardModel) => void;
}) {
  const { card, state } = model;
  return (
    <button
      type="button"
      className={`wp-verb wp-card--${state}${previewing ? ' wp-card--preview' : ''}`}
      style={laneStyle(model.laneColor)}
      data-tutorial-anchor={TUTORIAL_ANCHORS.lineageCard(card.id)}
      aria-label={model.accessibleName}
      aria-disabled={model.action === 'toast' || model.action === 'none' ? true : undefined}
      title={model.reason}
      onClick={() => onPress(model)}
    >
      <span className="wp-verb__body">
        {model.tag && <span className={`wp-card__tag${state === 'active' ? ' wp-card__tag--active' : ''}`}>{model.tag}</span>}
        <span className="wp-verb__name">{card.name}</span>
        <span className="wp-card__sentence">{keepUnits(model.sentence)}</span>
        {model.note && <span className="wp-card__needs">{model.note}</span>}
        {beat && <BeatLine beat={beat} color={model.laneColor} />}
        <CostLine model={model} />
      </span>
      {/* The ring this verb puts beside your HP bar, at rest: ready. */}
      <span className="wp-mini-ring" aria-hidden="true">
        <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" /></svg>
        <b>✦</b>
      </span>
    </button>
  );
}

// ── Rows ─────────────────────────────────────────────────────────────────────

interface RowHandlers {
  onPress: (model: PageCardModel) => void;
  onRankUp: (model: PageCardModel, rank: LeanRankModel) => void;
  onPreview: (preview: Preview) => void;
}

function RowView({
  row, ctx, previewed, previewMode, onTogglePreviewMode, handlers, rankOf, beatOf,
}: {
  row: PageRow;
  ctx: { verbPreview: boolean };
  previewed: Preview;
  previewMode: boolean;
  onTogglePreviewMode?: () => void;
  handlers: RowHandlers;
  rankOf: (card: LineageCard) => LeanRankModel;
  beatOf: (card: LineageCard) => VerbBeat | undefined;
}) {
  const isLeanRow = row.row === 'stat' && !row.locked;
  const isVerbRow = row.row === 'payoff' && !row.locked && row.cards.every((c) => isVerbCard(c.card));
  return (
    <section className={`wp-row${row.locked ? ' wp-row--locked' : ''}`} aria-label={row.title}>
      <div className="wp-row__head">
        <h3>{row.title}</h3>
        <span>{row.question}</span>
        {isLeanRow && onTogglePreviewMode && (
          <button
            type="button"
            className={`wp-preview-toggle${previewMode ? ' is-on' : ''}`}
            aria-pressed={previewMode}
            onClick={onTogglePreviewMode}
          >
            ◉ Preview
          </button>
        )}
      </div>
      <div className={`wp-row__cards${isVerbRow && row.cards.length === 1 ? ' wp-row__cards--one' : ''}`}>
        {row.cards.map((model) => {
          if (isLeanRow) {
            return (
              <LeanCardView
                key={model.card.id}
                model={model}
                rank={rankOf(model.card)}
                previewMode={previewMode}
                previewed={previewed}
                onPress={handlers.onPress}
                onRankUp={handlers.onRankUp}
                onPreview={handlers.onPreview}
              />
            );
          }
          if (isVerbRow) {
            return (
              <VerbCardView
                key={model.card.id}
                model={model}
                beat={beatOf(model.card)}
                previewing={ctx.verbPreview}
                onPress={handlers.onPress}
              />
            );
          }
          return (
            <CardView
              key={model.card.id}
              model={model}
              previewing={ctx.verbPreview && isVerbCard(model.card)}
              onPress={handlers.onPress}
              onPreview={(leanId) => handlers.onPreview(leanId ? { kind: 'lean', cardId: leanId } : null)}
            />
          );
        })}
      </div>
    </section>
  );
}

function BandView(props: Omit<Parameters<typeof RowView>[0], 'row'> & { band: PageBand }) {
  const { band, ...rest } = props;
  const rows = band.rows.map((row) => <RowView key={row.row} row={row} {...rest} />);
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
  if (band.mode === 'locked') {
    // The mockup's "Tier 2 · the choice": the next band's verbs only, dimmed.
    const choice = lockedChoiceRow(band);
    if (!choice) return null;
    return (
      <div className="wp-band wp-band--locked">
        <RowView
          {...rest}
          row={{ ...choice, title: `Tier ${band.tier} · The choice`, question: `Opens at the gate: three verbs, three lane leans, and they compose.` }}
        />
      </div>
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

/** The phone's pinned diff bar (no hover on a phone): what the preview changes. */
function DiffBar({ sheet, label, onClose }: { sheet: PageStatSheet; label: string; onClose: () => void }) {
  const moving = sheet.rows.filter((row) => row.after);
  return (
    <div className="wp-diffbar" role="status">
      <span className="wp-diffbar__label">◉ {label}</span>
      <span className="wp-diffbar__rows">
        {moving.length === 0
          ? <span>{sheet.note}</span>
          : moving.map((row) => (
            <span key={row.key}>
              {row.label} <s>{row.before}</s>{' '}
              <b className={row.direction > 0 ? 'wp-sheet__up' : 'wp-sheet__down'}>→ {row.after}</b>
            </span>
          ))}
      </span>
      <button type="button" className="wp-diffbar__close" onClick={onClose}>Done</button>
    </div>
  );
}

// ── The page ─────────────────────────────────────────────────────────────────

/**
 * The page's body for one slot. Mounted by `LineageTreePanel` (its own dialog)
 * and by the Upgrade panel (inside it). Owns the toast and the preview.
 */
export function WeaponPage({ slot }: { slot: EquipmentSlot }) {
  const equipment = useAtomValue(equipmentAtom);
  const lineages = useAtomValue(lineagesAtom);
  const playerTier = useAtomValue(playerTierAtom);
  // The stat preview's inputs: exactly what the Stats panel feeds the shared
  // stat formula.
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
  const isMobile = useIsMobile();
  const wallet = useLineageWallet();

  const [preview, setPreview] = useState<Preview>(null);
  const [previewMode, setPreviewMode] = useState(false);
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
  // A purchase or a swap changes what a preview would show: drop it.
  useEffect(() => { setPreview(null); }, [stored]);

  // The tree the page READS: the real one, or the preview clone.
  const previewTree = useMemo(() => {
    if (!lineage || !progress || !preview) return null;
    const card = lineage.cards.find((c) => c.id === preview.cardId);
    if (!card) return null;
    return preview.kind === 'lean'
      ? previewLeanProgress(lineage, progress, preview.cardId)
      : previewRankProgress(progress, card, preview.rank);
  }, [lineage, progress, preview]);

  const bands = useMemo(() => (lineage && progress
    ? pageBands({ lineage, progress, wallet, lineages, sentenceProgress: previewTree ?? undefined, archetype: combatArchetype })
    : []), [lineage, progress, wallet, lineages, previewTree, combatArchetype]);
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
      lineages, lineage, progress, leanIds, previewProgress: previewTree,
    })
    : null), [lineage, progress, lineages, leanIds, previewTree, unlockedSkills, passives, combatArchetype,
    selectedSubVariant, selectedRange, equipment, itemUpgrades, playerTier, activeStance, equippedRites, hpFraction]);

  if (!lineage || !progress || !sheet) {
    const slotParked = lineagesForSlot(slot).every((l) => isLineageParked(l));
    const title = SLOT_LABELS[slot] ?? slot;
    return (
      <div className="wp-empty">
        {slotParked ? PARKED_LINEAGE_REASON : `Craft a ${title.toLowerCase()} from the Make tab to start its page.`}
      </div>
    );
  }

  const live = lineage;
  const tree = progress;
  const header = formHeader({ lineage: live, progress: tree, wallet, attack: sheet.attack, attacksPerSecond: sheet.attacksPerSecond });
  const gates = gateBlocks({ lineage: live, progress: tree, wallet });
  const materials = materialLines({ lineage: live, progress: tree, wallet });
  const steps = bandSteps(live, tree);
  const plate = fightPlate({
    lineage: live,
    progress: previewTree ?? tree,
    archetype: combatArchetype,
    ...(preview?.kind === 'rank' ? { rank: preview.rank } : {}),
  });

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

  function onRankUp(model: PageCardModel, rank: LeanRankModel) {
    const next = rank.next;
    if (!next) return;
    if (next.action !== 'buy') {
      if (next.reason) show(next.reason, 'warn');
      return;
    }
    // Contract 1: `lineage:unlockCard` on an owned ranked card buys its next rank.
    pending.current = {
      action: 'unlockCard', cardId: model.card.id, row: model.card.row,
      name: `${model.card.name} rank ${rankNumeral(next.rank)}`, thenActivate: false,
    };
    hudBus.requestLineageUnlockCard(live.id, model.card.id);
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

  const rankOf = (card: LineageCard) => leanRankModel({ lineage: live, card, progress: tree, wallet, lineages });
  const beatOf = (card: LineageCard) => verbBeat(live, previewTree ?? tree, card);
  const previewCard = preview ? live.cards.find((c) => c.id === preview.cardId) : undefined;
  const previewLabel = preview?.kind === 'rank' && previewCard
    ? `${previewCard.name} rank ${rankNumeral(preview.rank)}`
    : previewCard ? `${previewCard.name} swapped in` : '';

  return (
    <div className="wp-page">
      {notice && <div className={`wp-toast wp-toast--${notice.tone}`} role="status">{notice.text}</div>}
      <div className="wp-scroll">
        <div className="wp-grid">
          <div className="wp-main">
            <FormHeaderView header={header} onWear={onWear} />
            <StepsLine steps={steps} />
            <FightPlateView plate={plate} previewing={!!previewTree} />
            {bands.map((band) => (
              <BandView
                key={`${band.tier}:${band.mode}`}
                band={band}
                ctx={{ verbPreview: !!previewTree }}
                previewed={preview}
                previewMode={previewMode}
                onTogglePreviewMode={isMobile ? () => {
                  setPreviewMode((on) => !on);
                  setPreview(null);
                } : undefined}
                handlers={{ onPress, onRankUp, onPreview: setPreview }}
                rankOf={rankOf}
                beatOf={beatOf}
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
      {previewMode && preview && (
        <DiffBar sheet={sheet} label={previewLabel} onClose={() => { setPreview(null); setPreviewMode(false); }} />
      )}
    </div>
  );
}

/**
 * The page as its own dialog — what clicking the equipped weapon opens. Both HUD
 * shells mount it from `lineageTreeSlotAtom`, and the tutorial director opens it
 * the same way; the export keeps its old name for them.
 */
export function LineageTreePanel({ slot, onClose }: { slot: EquipmentSlot; onClose: () => void }) {
  const equipment = useAtomValue(equipmentAtom);
  const lineage = lineageForEquippedItem(equipment[slot]);
  const title = lineage ? lineageDisplayName(lineage) : SLOT_LABELS[slot] ?? slot;
  return (
    <GameDialog size={lineage ? 'wide' : 'standard'} className="weapon-page-dialog" onClose={onClose}>
      <DialogHeader
        title={title}
        closeLabel={`Close the ${title} page`}
        actions={<span className="wp-sub">{SLOT_LABELS[slot]} page</span>}
      />
      <WeaponPage slot={slot} />
    </GameDialog>
  );
}
