import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import type {
  EquipmentSlot,
  EssenceType,
  LineageCard,
  LineageCardTie,
  LineageDefinition,
  LineageForm,
  LineagePayoff,
  LineageProgress,
  LineageProgressMap,
  LineageStatKey,
  PacketId,
  ResolvedLineageCard,
  RowKind,
} from '@mmo-idle/shared';
import {
  BIOME_LEVELS_PER_TIER,
  ITEM_DATABASE,
  ROW_KINDS,
  TEST_ROOM_NODE_ID,
  TUTORIAL_ANCHORS,
  absorbedStatCards,
  bandContents,
  capstoneMaterialName,
  checkSetActive,
  checkUnlockCard,
  checkUnlockForm,
  checkWearForm,
  emptyLineageProgress,
  lineageCardPrice,
  lineageCardTie,
  lineageEssenceType,
  lineageForRecipeId,
  lineageGateCost,
  packetDefinition,
  resolveLineageCapstone,
  resolveLineageCard,
  rowsForTier,
  statRowIsCollapsed,
  wornFormTier,
  type LineageWallet,
} from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import {
  biomeLevelAtom,
  capstonesAtom,
  equipmentAtom,
  essencesAtom,
  globalMasteryAtom,
  lineagesAtom,
  playerNodeIdAtom,
  playerTierAtom,
  shardsAtom,
} from '../../hud/atoms';
import { DialogHeader, GameDialog } from '../../hud/primitives';
import { SLOT_LABELS, biomeName } from '../crafting/common';
import {
  MaterialChip,
  capstoneMaterial,
  essenceMaterial,
  shardMaterial,
} from '../MaterialChip';
import { CostChips, LineageCardShell, type CardShellState } from './CardShell';
import { lineageDisplayName } from './lineageDisplayName';
import '../skillTree.css';
import './lineageTree.css';

interface Props {
  slot: EquipmentSlot;
  onClose: () => void;
}

// ── Formatting ───────────────────────────────────────────────────────────────

const ROW_LABEL: Record<RowKind, string> = {
  stat: 'Stat', payoff: 'Payoff', amplifier: 'Amplifier', keystone: 'Keystone', cross: 'Cross',
};
const ROW_HINT: Record<RowKind, string> = {
  stat: 'what you scale', payoff: 'when it fires, what happens',
  amplifier: 'makes the payoff bigger', keystone: 'changes the rule',
  cross: 'a second lane, borrowed',
};

const STAT_LABEL: Record<LineageStatKey, string> = {
  attack: 'Attack', onHitDamage: 'On-hit damage', plating: 'Plating',
  damageReduction: 'Damage reduction', evasion: 'Evasion', maxHp: 'Max HP',
  recovery: 'Recovery', speed: 'Move speed', attackPct: 'Attack', attackSpeedPct: 'Attack speed',
  techniquePowerPct: 'Technique power',
};
const PCT_STAT_KEYS = new Set<LineageStatKey>([
  'damageReduction', 'evasion', 'attackPct', 'attackSpeedPct', 'techniquePowerPct',
]);
const BINARY_PAYOFF_KINDS = new Set<string>(['stun', 'cleanse']);

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatStatEffect(resolved: ResolvedLineageCard): string | null {
  if (!resolved.statEffects) return null;
  const entry = Object.entries(resolved.statEffects)[0] as [LineageStatKey, number] | undefined;
  if (!entry) return null;
  const [key, value] = entry;
  const label = STAT_LABEL[key] ?? key;
  return PCT_STAT_KEYS.has(key) ? `+${round1(value * 100)}% ${label}` : `+${value} ${label}`;
}

function formatPayoff(payoff: LineagePayoff): string {
  if (BINARY_PAYOFF_KINDS.has(payoff.kind)) {
    return payoff.durationMs ? `${(payoff.durationMs / 1000).toFixed(1)}s` : 'instant';
  }
  const pct = `${round1(payoff.magnitude * 100)}%`;
  return payoff.durationMs ? `${pct} for ${(payoff.durationMs / 1000).toFixed(1)}s` : pct;
}

function describeCardEffect(resolved: ResolvedLineageCard): string | null {
  return formatStatEffect(resolved) ?? (resolved.payoff ? formatPayoff(resolved.payoff) : null);
}

// ── Lane header ──────────────────────────────────────────────────────────────

function LaneHeader({ lineage }: { lineage: LineageDefinition }) {
  return (
    <div className="lin-lanes">
      <div className="lin-lanes__spacer" aria-hidden="true" />
      {lineage.lanes.map((lane) => {
        const def = packetDefinition(lane);
        return (
          <div key={lane} className="lin-lanes__h" style={{ '--lane-color': def?.color ?? '#a99e8a' } as React.CSSProperties}>
            {def?.name ?? lane}
          </div>
        );
      })}
    </div>
  );
}

// ── One card tile ─────────────────────────────────────────────────────────────

function CardTile({
  lineage, card, progress, wallet, lineages, silhouette, absorbed, tie,
  onUnlockCard, onSetActive,
}: {
  lineage: LineageDefinition;
  card: LineageCard;
  progress: LineageProgress;
  wallet: LineageWallet;
  lineages: LineageProgressMap;
  /** Future band preview: no numbers resolved against mastery, not interactive. */
  silhouette?: boolean;
  /** This collapsed band's stat row, now part of the worn form's base stats. */
  absorbed?: boolean;
  /** The card this one modifies, for the amplifier connector (design §4). */
  tie?: LineageCardTie;
  onUnlockCard: (card: LineageCard) => void;
  onSetActive: (row: RowKind, cardId: string) => void;
}) {
  const laneColor = packetDefinition(card.lane)?.color ?? '#a99e8a';
  if (silhouette) {
    return (
      <div className="lin-card lin-card--silhouette" style={{ '--lane-color': laneColor } as React.CSSProperties}>
        <span className="lin-card__name">{card.name}</span>
        <span className="lin-card__desc">Revealed at tier {card.tier}.</span>
      </div>
    );
  }

  // A collapsed band's stat row is permanent (design §4), so it is a readout and
  // not a control: nothing left to buy, nothing to slot, and it must never read
  // as "active" when the tree still has it slotted from before the gate.
  if (absorbed) {
    return (
      <div className="lin-card lin-card--absorbed" style={{ '--lane-color': laneColor } as React.CSSProperties}>
        <span className="lin-card__top">
          <span className="lin-card__name">{card.name}</span>
          <span className="lin-card__state">in form</span>
        </span>
        <span className="lin-card__desc">
          Folded into your form&apos;s base stats. {describeCardEffect(resolveLineageCard(card, lineage))}
        </span>
      </div>
    );
  }

  const haveLevel = wallet.biomeLevels[lineage.homeBiome] ?? 0;
  // frameFace is left undefined: every Phase 1 weapon card is offensive (no
  // `card.face`), so `faceScalar` is 1 regardless (design §3.1). Phase 4's
  // non-weapon lineages will need the wearer's frame threaded in here.
  const resolved = resolveLineageCard(card, lineage, {});
  const masteryLocked = !wallet.isTestRoom && (
    haveLevel < resolved.requiredBiomeLevel
    || (wallet.globalMastery !== undefined && wallet.globalMastery < resolved.requiredGlobalMastery)
  );
  const owned = progress.ownedCards.includes(card.id);
  const active = progress.active[card.row] === card.id;
  const check = checkUnlockCard({ lineage, card, progress, wallet, lineages });
  const activateCheck = owned && !active
    ? checkSetActive({ lineage, progress, row: card.row, cardId: card.id })
    : null;
  const { cost, discounted } = lineageCardPrice({ lineage, card, lineages });

  const state: CardShellState = active ? 'active' : owned ? 'owned' : masteryLocked ? 'locked' : 'available';
  const blockedReason = masteryLocked
    ? `Requires ${biomeName(lineage.homeBiome)} level ${resolved.requiredBiomeLevel}.`
    : (!owned && !check.ok) ? check.reason
      : (activateCheck && !activateCheck.ok) ? activateCheck.reason : undefined;

  function handleClick() {
    if (masteryLocked) return;
    if (!owned) {
      if (!check.ok) return;
      onUnlockCard(card);
      return;
    }
    if (!active && activateCheck?.ok) onSetActive(card.row, card.id);
  }

  return (
    <LineageCardShell
      laneColor={laneColor}
      name={card.name}
      description={`${card.description} ${describeCardEffect(resolved) ?? ''}`}
      state={state}
      tie={tie}
      cost={!owned ? <CostChips cost={cost} wallet={wallet} /> : undefined}
      note={!owned && discounted ? 'switch discount applied' : undefined}
      anchor={TUTORIAL_ANCHORS.lineageCard(card.id)}
      disabled={masteryLocked || (!owned && !check.ok) || (owned && !active && activateCheck !== null && !activateCheck.ok)}
      title={blockedReason}
      onClick={handleClick}
    />
  );
}

// ── One row (three cards, one per lane) ───────────────────────────────────────

function RowSection({
  lineage, row, rows, cards, progress, wallet, lineages, silhouette, absorbedIds,
  onUnlockCard, onSetActive,
}: {
  lineage: LineageDefinition;
  row: RowKind;
  /** The band's rows in render order, so a connector knows what is above. */
  rows: readonly RowKind[];
  cards: LineageCard[];
  progress: LineageProgress;
  wallet: LineageWallet;
  lineages: LineageProgressMap;
  silhouette?: boolean;
  /** Stat cards this collapsed band folded into the worn form. */
  absorbedIds?: ReadonlySet<string>;
  onUnlockCard: (card: LineageCard) => void;
  onSetActive: (row: RowKind, cardId: string) => void;
}) {
  const first = cards[0];
  const resolvedFirst = first ? resolveLineageCard(first, lineage) : null;
  const haveLevel = wallet.biomeLevels[lineage.homeBiome] ?? 0;
  const rowLocked = !silhouette && !wallet.isTestRoom && !!resolvedFirst && haveLevel < resolvedFirst.requiredBiomeLevel;
  const collapsedStatRow = row === 'stat' && !!absorbedIds?.size;

  return (
    <div className="lin-row">
      <div className={`lin-row__label${rowLocked ? ' lin-row__label--locked' : ''}`}>
        <b>{ROW_LABEL[row]}</b>
        <span>
          {silhouette
            ? undefined
            : collapsedStatRow
              ? 'folded into your form'
              : rowLocked
                ? `opens at ${biomeName(lineage.homeBiome)} level ${resolvedFirst?.requiredBiomeLevel}`
                : ROW_HINT[row]}
        </span>
      </div>
      {lineage.lanes.map((lane) => {
        const card = cards.find((c) => c.lane === lane && c.row === row);
        return card
          ? (
            <CardTile
              key={card.id}
              lineage={lineage}
              card={card}
              progress={progress}
              wallet={wallet}
              lineages={lineages}
              silhouette={silhouette}
              absorbed={absorbedIds?.has(card.id)}
              tie={lineageCardTie(lineage, card, rows)}
              onUnlockCard={onUnlockCard}
              onSetActive={onSetActive}
            />
          )
          : <div key={lane} className="lin-card lin-card--empty" aria-hidden="true" />;
      })}
    </div>
  );
}

// ── Gate: the forms a band's bottom door opens ────────────────────────────────

function GateSection({
  lineage, forms, progress, wallet, onUnlockForm, onWearForm,
}: {
  lineage: LineageDefinition;
  forms: readonly LineageForm[];
  progress: LineageProgress;
  wallet: LineageWallet;
  onUnlockForm: (form: LineageForm) => void;
  onWearForm: (form: LineageForm) => void;
}) {
  return (
    <div className="lin-gate">
      <div className="lin-row__label"><b>Gate</b><span>transform the item</span></div>
      <div className="lin-gate__forms">
        {forms.map((form) => {
          const def = ITEM_DATABASE.get(form.recipeId);
          const owned = progress.ownedForms.includes(form.recipeId);
          const worn = progress.wornForm === form.recipeId;
          const check = checkUnlockForm({ lineage, form, progress, wallet });
          const wearCheck = owned && !worn ? checkWearForm({ lineage, progress, recipeId: form.recipeId }) : null;
          const cost = lineageGateCost(form, lineage);
          const capstone = resolveLineageCapstone(form);
          const blockedReason = !owned && !check.ok
            ? check.reason
            : (wearCheck && !wearCheck.ok) ? wearCheck.reason : undefined;

          return (
            <button
              key={form.recipeId}
              type="button"
              data-tutorial-anchor={TUTORIAL_ANCHORS.lineageForm(form.recipeId)}
              className={`lin-form${worn ? ' lin-form--worn' : ''}`}
              disabled={!worn && ((!owned && !check.ok) || (owned && wearCheck !== null && !wearCheck.ok))}
              title={blockedReason}
              onClick={() => {
                if (worn) return;
                if (owned) { if (wearCheck?.ok) onWearForm(form); }
                else if (check.ok) onUnlockForm(form);
              }}
            >
              <div className="lin-form__name">
                {def?.name ?? form.recipeId}
                <small>{worn ? 'worn' : owned ? 'tap to wear' : `tier ${form.tier} form`}</small>
              </div>
              {form.capstone && (
                <div className="lin-form__cap">
                  <b>Capstone.</b> {form.capstone.description}
                  {capstone && ` ${formatPayoff(capstone.payoff)}`}
                </div>
              )}
              {!owned && (
                <div className="lin-form__cost material-chip-strip">
                  {(Object.entries(cost.essence) as [EssenceType, number][]).map(([type, amount]) => (
                    <MaterialChip key={type} material={essenceMaterial(type)} required={amount} held={wallet.essences[type] ?? 0} size={14} />
                  ))}
                  {(Object.entries(cost.shards) as [PacketId, number][]).map(([packet, amount]) => (
                    <MaterialChip key={packet} material={shardMaterial(packet)} required={amount} held={wallet.shards?.[packet] ?? 0} size={14} />
                  ))}
                  <MaterialChip
                    material={capstoneMaterial(cost.capstone.biome)}
                    required={cost.capstone.amount}
                    held={wallet.capstones?.[cost.capstone.biome] ?? 0}
                    size={14}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── One band (a tier's rows + gate); lit, collapsed, or a dimmed silhouette ───

function Band({
  lineage, tier, progress, wallet, lineages, mode,
  onUnlockCard, onSetActive, onUnlockForm, onWearForm,
}: {
  lineage: LineageDefinition;
  tier: number;
  progress: LineageProgress;
  wallet: LineageWallet;
  lineages: LineageProgressMap;
  mode: 'lit' | 'collapsed' | 'silhouette';
  onUnlockCard: (card: LineageCard) => void;
  onSetActive: (row: RowKind, cardId: string) => void;
  onUnlockForm: (form: LineageForm) => void;
  onWearForm: (form: LineageForm) => void;
}) {
  const { cards, gateForms } = bandContents(lineage, tier);
  // A row the band has no cards for is not rendered at all. That is how a
  // non-weapon lineage "runs one row fewer per tier" (design §4: no stat row,
  // base stats come from the form) without a second rows table, and it is also
  // what a tier whose amplifier row is not authored yet looks like.
  const rows = rowsForTier(tier).filter((row) => cards.some((c) => c.row === row));
  const silhouette = mode === 'silhouette';
  // Which of this band's stat cards the worn form has absorbed — at most one, and
  // only ever in a band BELOW the worn form's (so never in the lit band).
  const absorbedIds = new Set(
    absorbedStatCards(lineage, progress).filter((c) => c.tier === tier).map((c) => c.id),
  );

  const body = (
    <>
      <LaneHeader lineage={lineage} />
      {rows.map((row) => (
        <RowSection
          key={row}
          lineage={lineage}
          row={row}
          rows={rows}
          cards={cards.filter((c) => c.row === row)}
          progress={progress}
          wallet={wallet}
          lineages={lineages}
          silhouette={silhouette}
          absorbedIds={absorbedIds}
          onUnlockCard={onUnlockCard}
          onSetActive={onSetActive}
        />
      ))}
      {!silhouette && gateForms.length > 0 && (
        <GateSection
          lineage={lineage}
          forms={gateForms}
          progress={progress}
          wallet={wallet}
          onUnlockForm={onUnlockForm}
          onWearForm={onWearForm}
        />
      )}
    </>
  );

  if (mode === 'silhouette') {
    return (
      <div className="lin-band lin-band--dim">
        <div className="lin-band__head"><h3>Tier {tier}</h3><span>Silhouette. Opens when the gate is paid.</span></div>
        {body}
      </div>
    );
  }

  if (mode === 'collapsed') {
    // Design §4: "Paying a gate folds the previous band into a summary line
    // ('T1: Keen Edge, Rend'), expandable to reslot." The line names what the
    // player OWNS here, not what is slotted: `active` is one card per row across
    // the whole tree, so a collapsed band usually has nothing slotted at all —
    // it is a wardrobe, and the summary is its label.
    const ownedNames = cards.filter((c) => progress.ownedCards.includes(c.id)).map((c) => c.name);
    const absorbedName = cards.find((c) => absorbedIds.has(c.id))?.name;
    return (
      <details className="lin-band lin-band--collapsed">
        <summary>
          <b>T{tier}:</b>
          <span>{ownedNames.length > 0 ? ownedNames.join(', ') : 'nothing bought'}</span>
          {absorbedName && <span className="lin-band__absorbed">{absorbedName} in your form</span>}
        </summary>
        {body}
      </details>
    );
  }

  return (
    <div className="lin-band lin-band--lit">
      <div className="lin-band__head">
        <h3>Tier {tier}</h3>
        <span>Rows open with {biomeName(lineage.homeBiome)} mastery. Cards cost essence plus a lane shard.</span>
      </div>
      {body}
    </div>
  );
}

// ── Side column ────────────────────────────────────────────────────────────

function MasterySection({ lineage, tier, biomeLevel, wallet }: {
  lineage: LineageDefinition; tier: number; biomeLevel: number; wallet: LineageWallet;
}) {
  const floor = (tier - 1) * BIOME_LEVELS_PER_TIER;
  const local = Math.max(0, Math.min(BIOME_LEVELS_PER_TIER, biomeLevel - floor));
  const pct = (local / BIOME_LEVELS_PER_TIER) * 100;
  const { cards } = bandContents(lineage, tier);
  const ticks = rowsForTier(tier).map((row) => {
    const card = cards.find((c) => c.row === row);
    const resolved = card ? resolveLineageCard(card, lineage) : null;
    const level = resolved ? resolved.requiredBiomeLevel - floor : null;
    return { label: ROW_LABEL[row], level };
  });

  return (
    <section className="lin-side">
      <h3>{biomeName(lineage.homeBiome)} mastery</h3>
      <div className="lin-mastery-bar"><i style={{ width: `${wallet.isTestRoom ? 100 : pct}%` }} /></div>
      <div className="lin-mastery-ticks">
        {ticks.map(({ label, level }) => <span key={label}>{label}{level !== null ? ` L${level}` : ''}</span>)}
        <span>Gate L{BIOME_LEVELS_PER_TIER}</span>
      </div>
      <p className="lin-readout">
        Mastery decides when a row opens. Materials decide whether you can pay. The boss decides when the form changes.
      </p>
    </section>
  );
}

function WalletSection({ lineage, tier, wallet }: { lineage: LineageDefinition; tier: number; wallet: LineageWallet }) {
  const essenceType = lineageEssenceType(lineage);
  const { gateForms } = bandContents(lineage, tier);
  const capstoneBiomes = [...new Set(gateForms.map((f) => f.biome))];
  return (
    <section className="lin-side">
      <h3>Materials</h3>
      <div className="lin-wallet">
        <div>
          <span>{essenceType} essence</span>
          <b>{wallet.essences[essenceType] ?? 0}</b>
        </div>
        {lineage.lanes.map((lane) => (
          <div key={lane}>
            <span>{packetDefinition(lane)?.name ?? lane} shards</span>
            <b>{wallet.shards?.[lane] ?? 0}</b>
          </div>
        ))}
        {capstoneBiomes.map((biome) => (
          <div key={biome}>
            <span>{capstoneMaterialName(biome)}</span>
            <b>{wallet.capstones?.[biome] ?? 0}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function BuildSection({ lineage, progress }: { lineage: LineageDefinition; progress: LineageProgress }) {
  const wornDef = progress.wornForm ? ITEM_DATABASE.get(progress.wornForm) : undefined;
  const laneCounts: Partial<Record<PacketId, number>> = {};
  const lines = (ROW_KINDS as readonly RowKind[])
    .map((row) => {
      const id = progress.active[row];
      const card = id ? lineage.cards.find((c) => c.id === id) : undefined;
      // A stat row the gate absorbed is listed as part of the form below, not as
      // a slotted row — the slot is the current tier's whether or not a save
      // still points at the old card.
      if (!card || statRowIsCollapsed(lineage, progress, card)) return { row, name: undefined };
      laneCounts[card.lane] = (laneCounts[card.lane] ?? 0) + 1;
      // An amplifier (and a keystone, and a cross row) is only legible next to
      // what it modifies, so the readout names both: "Lingering Wake → Echo Strike".
      const modified = card.modifies ? lineage.cards.find((c) => c.id === card.modifies) : undefined;
      return { row, name: modified ? `${card.name} → ${modified.name}` : card.name };
    })
    .filter(({ name }) => !!name);

  // Everything the worn form absorbed from the bands below it (design §4).
  const absorbed = absorbedStatCards(lineage, progress)
    .map((card) => resolveLineageCard(card, lineage));

  const top = (Object.entries(laneCounts) as [PacketId, number][]).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(laneCounts).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <section className="lin-side">
      <h3>Your build</h3>
      <div className="lin-build">
        <div className="lin-build__line">
          <span className="lin-build__k">{SLOT_LABELS[lineage.slot]}</span>
          <span className="lin-build__v"><b>{wornDef?.name ?? 'No form'}</b></span>
        </div>
        {lines.length === 0
          ? <div className="lin-build__empty">No active cards yet.</div>
          : lines.map(({ row, name }) => (
            <div key={row} className="lin-build__line">
              <span className="lin-build__k">{ROW_LABEL[row]}</span>
              <span className="lin-build__v">{name}</span>
            </div>
          ))}
        {absorbed.map((resolved) => (
          <div key={resolved.card.id} className="lin-build__line">
            <span className="lin-build__k">In form</span>
            <span className="lin-build__v lin-build__v--dim">
              {resolved.card.name} · {describeCardEffect(resolved)}
            </span>
          </div>
        ))}
      </div>
      {top && (
        <p className="lin-readout">
          Leaning <b>{packetDefinition(top[0])?.name ?? top[0]}</b>: {top[1]} of {total} active cards.
        </p>
      )}
    </section>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

const RESULT_NOTICE_MS = 3200;

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
  const isTestRoom = playerNodeId === TEST_ROOM_NODE_ID;

  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ success: boolean; reason?: string; lineageId: string }>).detail;
      if (detail.success) return;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      setNotice(detail.reason ?? 'That did not work.');
      noticeTimerRef.current = setTimeout(() => setNotice(null), RESULT_NOTICE_MS);
    };
    window.addEventListener('hud:lineageResult', handler);
    return () => {
      window.removeEventListener('hud:lineageResult', handler);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const wornRecipeId = equipment[slot];
  const lineage = wornRecipeId ? lineageForRecipeId(wornRecipeId) : undefined;

  const name = lineage ? lineageDisplayName(lineage) : SLOT_LABELS[slot];

  if (!lineage) {
    return (
      <GameDialog size="standard" className="lineage-tree-dialog" onClose={onClose}>
        <DialogHeader title={name} closeLabel={`Close ${name.toLowerCase()}`} />
        <div className="lin-empty">
          Craft a {SLOT_LABELS[slot].toLowerCase()} from the Make tab to start its tree.
        </div>
      </GameDialog>
    );
  }

  const progress = lineages[lineage.id] ?? emptyLineageProgress(lineage, wornRecipeId ?? undefined);
  const wornTier = wornFormTier(lineage, progress);
  const nextTier = wornTier + 1;
  const hasNextTierCards = bandContents(lineage, nextTier).cards.length > 0;
  const wallet: LineageWallet = {
    essences, shards, capstones, biomeLevels: biomeLevel, globalMastery, playerTier, isTestRoom,
  };

  function onUnlockCard(card: LineageCard) {
    hudBus.requestLineageUnlockCard(lineage!.id, card.id);
  }
  function onSetActive(row: RowKind, cardId: string) {
    hudBus.requestLineageSetActive(lineage!.id, row, cardId);
  }
  function onUnlockForm(form: LineageForm) {
    hudBus.requestLineageUnlockForm(lineage!.id, form.recipeId);
  }
  function onWearForm(form: LineageForm) {
    hudBus.requestLineageWearForm(lineage!.id, form.recipeId);
  }

  const wornDef = progress.wornForm ? ITEM_DATABASE.get(progress.wornForm) : undefined;

  return (
    <GameDialog size="wide" className="lineage-tree-dialog" onClose={onClose}>
      <DialogHeader
        title={name}
        closeLabel={`Close the ${name} tree`}
        actions={<span className="lin-tree-sub">{SLOT_LABELS[slot]} · {wornDef?.name ?? 'unworn'}</span>}
      />
      {notice && <div className="lin-toast" role="status">{notice}</div>}
      <div className="lin-workspace">
        <div className="lin-tree-body">
          {Array.from({ length: Math.max(0, wornTier - 1) }, (_, i) => i + 1).map((tier) => (
            <Band
              key={tier}
              lineage={lineage}
              tier={tier}
              progress={progress}
              wallet={wallet}
              lineages={lineages}
              mode="collapsed"
              onUnlockCard={onUnlockCard}
              onSetActive={onSetActive}
              onUnlockForm={onUnlockForm}
              onWearForm={onWearForm}
            />
          ))}
          <Band
            lineage={lineage}
            tier={wornTier}
            progress={progress}
            wallet={wallet}
            lineages={lineages}
            mode="lit"
            onUnlockCard={onUnlockCard}
            onSetActive={onSetActive}
            onUnlockForm={onUnlockForm}
            onWearForm={onWearForm}
          />
          {/* One lit band and one silhouette (design §4). When the next tier has
              no cards it is not authored yet, and saying so is honest — a faked
              silhouette would promise rows that do not exist. */}
          {hasNextTierCards ? (
            <Band
              lineage={lineage}
              tier={nextTier}
              progress={progress}
              wallet={wallet}
              lineages={lineages}
              mode="silhouette"
              onUnlockCard={onUnlockCard}
              onSetActive={onSetActive}
              onUnlockForm={onUnlockForm}
              onWearForm={onWearForm}
            />
          ) : (
            <div className="lin-band lin-band--dim lin-band--absent">
              <div className="lin-band__head">
                <h3>Tier {nextTier}</h3>
                <span>Nothing beyond this band yet.</span>
              </div>
            </div>
          )}
        </div>
        <div className="lin-side-column">
          <MasterySection lineage={lineage} tier={wornTier} biomeLevel={biomeLevel[lineage.homeBiome] ?? 0} wallet={wallet} />
          <WalletSection lineage={lineage} tier={wornTier} wallet={wallet} />
          <BuildSection lineage={lineage} progress={progress} />
        </div>
      </div>
    </GameDialog>
  );
}
